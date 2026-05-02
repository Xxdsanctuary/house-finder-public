const Message = require('../models/Message');

// Return messages by requestId
async function getMessageByRequestId(id) {
    try {
        const messages = await Message.findMessageByRequestId(id);
        return messages;
    } catch (error){
        throw error;
    }
}

// Delete message by messageId
async function deleteMessageById(id) {
    try {
        await Message.deleteMessage(id);
    } catch (error){
        throw error;
    }
}

module.exports = {
    getMessageByRequestId,
    deleteMessageById
}