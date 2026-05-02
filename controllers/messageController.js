const Message = require('../models/Message');

const requestService = require('../services/requestService');

// Send a message (Create a new message)
/*
pass in messageContent and requestId to create message
*/
exports.sendMessage = async (req, res) => {
    const senderId = req.session?.userId || req.session?.user?._id;
    const requestId = req.body?.requestId;
    const messageContent = req.body?.messageContent;

    if (!senderId) {
        return res.status(401).send('Please log in to send a message');
    }

    if (!requestId || !messageContent) {
        return res.status(400).send('requestId and messageContent are required');
    }

    const newMessage = {
        requestId : requestId,
        userId : senderId,
        messageContent : messageContent
    }

    try {
        await Message.addMessage(newMessage);

        // check if sender is listingOwner or applicant, then redirect accordingly
        const request = await requestService.getRequestById(requestId);
        if (senderId == request.listingOwnerId){
            res.redirect(`/requests/show-listingOwner/${requestId}`);
        } else {
            res.redirect(`/requests/show-applicant/${request.listingId}?requestId=${requestId}`);
        }
    } catch (error) {
        res.status(500).send("Error sending message: " + error.message);
    }
};

// function for editing messages? may require message object to have isEdited property