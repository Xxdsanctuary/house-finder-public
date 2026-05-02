const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    requestId : {
        type : mongoose.Schema.ObjectId,
        ref : 'Request',
        required : true
    },
    userId : {
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        required : true
    },
    messageContent : {type : String, required : true}
}, {timestamps : true});

const Message = mongoose.model('Message', messageSchema);

// Create one message
exports.addMessage = function(message) {
    return Message.create(message);
};

// Read messages by requestId
exports.findMessageByRequestId = function(requestId) {
    return Message.find({requestId : requestId});
};

// Update one message's messageContent by messageId
exports.editMessage = function(messageId, newContent) {
    return Message.updateOne({_id : messageId}, {$set : {messageContent : newContent}});
};

// Delete one message by messageId
exports.deleteMessage = function(messageId) {
    return Message.deleteOne({_id : messageId});
};