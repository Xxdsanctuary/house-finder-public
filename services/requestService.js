const Request = require('../models/Request');

const messageService = require('./messageService');

// Given a requestId, return the request
async function getRequestById(id) {
    try {
        const request = await Request.findRequestById(id);
        return request;
    } catch (error){
        throw error;
    }
};

// Given a userId, return all requests where this user is the applicant
async function getRequestByApplicantId(id) {
    try {
        const requests = await Request.findRequestByApplicantId(id);
        return requests;
    } catch (error){
        throw error;
    }
};

// Given a requestId, delete request (and all associated messages)
async function deleteRequestById(id) {
    // Delete messages first, then the request
    try {
        let messages = await messageService.getMessageByRequestId(id);
        messages = Array.isArray(messages) ? messages : [messages];
        for (const message of messages){
            await messageService.deleteMessageById(message._id);
        }
        await Request.deleteRequest(id);
    } catch (error){
        throw error;
    }
};

module.exports = {
    getRequestById,
    getRequestByApplicantId,
    deleteRequestById
};