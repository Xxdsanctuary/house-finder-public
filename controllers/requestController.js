const Request = require('../models/Request');

const listingService = require('../services/listingService');
const userService = require('../services/userService');
const messageService = require('../services/messageService');

function getSessionUserId(req) {
    return req.session?.userId || req.session?.user?._id || null;
}


// Create a new request (requires to be in session of a applicant user)
exports.sendRequest = async (req, res, next) => {
    const applicantId = getSessionUserId(req);
    const listingId = req.body.listingId;
    try {
        // get listingOwnerId using listingId and calling listing service
        const listing = await listingService.getListingById(listingId);
        const listingOwnerId = listing.creator;
        const newRequest = {
            listingId : listingId,
            listingOwnerId : listingOwnerId,
            applicantId : applicantId,
            status : 'open'
        }
        const request = await Request.createRequest(newRequest);
        const requestId = request._id;

        // render request page (chat interface) after getting names of both parties
        const listingOwner   = await userService.getUserById(listingOwnerId);
        const applicant      = await userService.getUserById(applicantId);
        const listingOwnerName = listingOwner.username;
        const applicantName    = applicant.username;

        res.render('request/request.ejs', {
            requestId : requestId,
            listingId : listingId,
            listingOwnerName : listingOwnerName,
            applicantName : applicantName,
            listingOwnerId : listingOwnerId,
            applicantId : applicantId,
            currentUserId : applicantId,
            requestStatus : 'open',
            remainingSlots : Math.max(0, (listing.noOfSlots || 0) - ((listing.availableSlots || []).length || 0)),
            requestActionError : null,
            messages : []
        });
    } catch (error) {
        next(error);
    }
};

// Show request page as an applicant
/*
- requires to be in session of an applicant
- pass in listingId
*/
exports.showRequestApplicant = async (req, res, next) => {
    const applicantId = getSessionUserId(req);
    const listingId = req.params.listingId || req.query.listingId;
    const selectedRequestId = req.query.requestId;
    try {
        let request;

        if (selectedRequestId) {
            request = await Request.findRequestById(selectedRequestId);
            if (
                !request ||
                String(request.applicantId) !== String(applicantId) ||
                String(request.listingId) !== String(listingId)
            ) {
                request = null;
            }
        } else {
            const requests = await Request.findRequestByListingIdAndApplicantId(listingId, applicantId);
            if (Array.isArray(requests) && requests.length) {
                requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                request = requests[0];
            } else {
                request = null;
            }
        }

        if (!request) {
            return res.status(404).send('Request not found');
        }

        const requestId = request._id;
        const requestListingId = request.listingId;
        const listingOwnerId = request.listingOwnerId;
        const requestStatus = request.status;
        const listing = await listingService.getListingById(request.listingId);
        const remainingSlots = listing
            ? Math.max(0, (listing.noOfSlots || 0) - ((listing.availableSlots || []).length || 0))
            : null;
        const listingOwner   = await userService.getUserById(listingOwnerId);
        const applicant      = await userService.getUserById(applicantId);
        const listingOwnerName = listingOwner.username;
        const applicantName    = applicant.username;

        // get messages associated with the requestId
        let messages = await messageService.getMessageByRequestId(requestId);
        messages = Array.isArray(messages) ? messages : [messages];

        res.render('request/request.ejs', {
            requestId : requestId,
            listingId : requestListingId,
            listingOwnerName : listingOwnerName,
            applicantName : applicantName,
            listingOwnerId : listingOwnerId,
            applicantId : applicantId,
            currentUserId : applicantId,
            requestStatus : requestStatus,
            remainingSlots : remainingSlots,
            requestActionError : req.query.error || null,
            messages : messages
        });
    } catch (error) {
        next(error);
    }
};

// Show request page as listing owner
/*
- requires to be in session of a listing owner
- pass in requestId
*/
exports.showRequestOwner = async (req, res, next) => {
    const listingOwnerId = getSessionUserId(req);
    const requestId = req.params.requestId || req.query.requestId;
    try {
        const request = await Request.findRequestById(requestId);
        if (!request) {
            return res.status(404).send('Request not found');
        }

        if (String(request.listingOwnerId) !== String(listingOwnerId)) {
            return res.status(403).send('You are not allowed to view this request');
        }

        const applicantId = request.applicantId;
        const listingId = request.listingId;
        const requestStatus = request.status;
        const listing = await listingService.getListingById(request.listingId);
        const remainingSlots = listing
            ? Math.max(0, (listing.noOfSlots || 0) - ((listing.availableSlots || []).length || 0))
            : null;

        const listingOwner   = await userService.getUserById(listingOwnerId);
        const applicant      = await userService.getUserById(applicantId);
        const listingOwnerName = listingOwner.username;
        const applicantName    = applicant.username;

        // get messages associated with the requestId
        let messages = await messageService.getMessageByRequestId(requestId);
        messages = Array.isArray(messages) ? messages : [messages];

        res.render('request/request.ejs', {
            requestId : requestId,
            listingId : listingId,
            listingOwnerName : listingOwnerName,
            applicantName : applicantName,
            listingOwnerId : listingOwnerId,
            applicantId : applicantId,
            currentUserId : listingOwnerId,
            requestStatus : requestStatus,
            remainingSlots : remainingSlots,
            requestActionError : req.query.error || null,
            messages : messages
        });
    } catch (error) {
        next(error);
    }
};

// Accept a request as listing owner
exports.acceptRequest = async (req, res) => {
    const currentUserId = getSessionUserId(req);
    const requestId = req.params.requestId;
    const action = req.body.action || 'accept';

    try {
        const request = await Request.findRequestById(requestId);
        if (!request) {
            return res.status(404).send('Request not found');
        }

        if (String(request.listingOwnerId) !== String(currentUserId)) {
            return res.status(403).send('You are not allowed to accept this request');
        }

        if (action === 'undo') {
            if (request.status !== 'accepted') {
                return res.redirect(`/requests/show-listingOwner/${requestId}`);
            }

            await listingService.removeUserFromSlot(request.listingId, request.applicantId);
            await Request.editStatus(requestId, 'open');
            return res.redirect(`/requests/show-listingOwner/${requestId}`);
        }

        if (request.status !== 'open') {
            return res.redirect(`/requests/show-listingOwner/${requestId}`);
        }

        const listing = await listingService.getListingById(request.listingId);
        if (!listing) {
            return res.redirect(`/requests/show-listingOwner/${requestId}?error=Associated%20listing%20not%20found`);
        }

        const remainingSlots = Math.max(0, (listing.noOfSlots || 0) - ((listing.availableSlots || []).length || 0));
        if (remainingSlots <= 0) {
            return res.redirect(`/requests/show-listingOwner/${requestId}?error=No%20slots%20available`);
        }

        await listingService.addUserToSlot(request.listingId, request.applicantId);
        await Request.editStatus(requestId, 'accepted');
        return res.redirect(`/requests/show-listingOwner/${requestId}`);
    } catch (error) {
        return res.redirect(`/requests/show-listingOwner/${requestId}?error=${encodeURIComponent(error.message)}`);
    }
};

// Delete a request as listing owner
exports.deleteRequest = async (req, res, next) => {
    const currentUserId = getSessionUserId(req);
    const requestId = req.params.requestId;
    try {
        const request = await Request.findRequestById(requestId);
        if (!request) {
            return res.status(404).send('Request not found');
        }

        if (String(request.listingOwnerId) !== String(currentUserId)) {
            return res.status(403).send('You are not allowed to delete this request');
        }

        if (request.status == "accepted") {
            // remove applicant from slot before deleting the request
            await listingService.removeUserFromSlot(request.listingId, request.applicantId);
        }

        await Request.deleteRequest(requestId);
        return res.redirect('/requests');
    } catch (error) {
        next(error);
    }
};

// Show all requests for the current user (both sent and received)
exports.showRequests = async (req, res, next) => {
    const userId = getSessionUserId(req);
    try {
        const [sentRaw, receivedRaw] = await Promise.all([
            Request.findRequestByApplicantId(userId),
            Request.findRequestByListingOwnerId(userId)
        ]);

        // Fetch listing title for each sent request
        const sentRequests = await Promise.all(
            sentRaw.map(async (request) => {
                const listing = await listingService.getListingById(request.listingId);
                return {
                    _id: request._id,
                    listingId: request.listingId,
                    listingTitle: listing ? listing.title : 'Unknown Listing',
                    status: request.status,
                    createdAt: request.createdAt
                };
            })
        );

        // Fetch listing title and applicant name for each received request
        const receivedRequests = await Promise.all(
            receivedRaw.map(async (request) => {
                const [listing, applicant] = await Promise.all([
                    listingService.getListingById(request.listingId),
                    userService.getUserById(request.applicantId)
                ]);
                return {
                    _id: request._id,
                    requestId: request._id,
                    listingId: request.listingId,
                    listingTitle: listing ? listing.title : 'Unknown Listing',
                    applicantName: applicant ? applicant.username : 'Unknown User',
                    status: request.status,
                    createdAt: request.createdAt
                };
            })
        );

        res.render('request/index.ejs', {
            sentRequests,
            receivedRequests
        });
    } catch (error) {
        next(error);
    }
};