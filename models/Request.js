const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    listingId : {
        type : mongoose.Schema.ObjectId,
        ref : 'Listing',
        required : true
    },
    listingOwnerId : {
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        required : true
    },
    applicantId : {
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        required : true
    },
    status : {
        type : String,
        enum : ['open', 'accepted', 'rejected', 'closed'],
        default : 'open',
        required : true
    }
}, {timestamps : true});

const Request = mongoose.model('Request', requestSchema);

// module.exports = Request; // --> Not used, but stored for future use

// Create one request
exports.createRequest = function(newRequest) {
    return Request.create(newRequest);
};

// Find and read one request by requestId
exports.findRequestById = function(requestId) {
    return Request.findById(requestId);
}

// Find and read requests by listingId
exports.findRequestByOwnerId = function(listingId) {
    return Request.find({listingId : listingId});
};

// Find and read requests by applicantId
exports.findRequestByApplicantId = function(applicantId) {
    return Request.find({applicantId : applicantId});
};

// Find and read requests by listingOwnerId
exports.findRequestByListingOwnerId = function(listingOwnerId) {
    return Request.find({listingOwnerId : listingOwnerId});
};

// Find and read one request by listingId and applicantId
exports.findRequestByListingIdAndApplicantId = function(listingId, applicantId) {
    return Request.find({listingId : listingId, applicantId : applicantId});
};

// Update status of one request by requestId
exports.editStatus = function(requestId, newStatus) {
    return Request.updateOne({_id : new mongoose.Types.ObjectId(requestId)}, {$set : {status : newStatus}});
};

// Delete one request by requestId
exports.deleteRequest = function(requestId){
    return Request.deleteOne({_id : new mongoose.Types.ObjectId(requestId)});
};