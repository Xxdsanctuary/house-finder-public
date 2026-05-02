const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A listing must have a title'],
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: [true, 'Please provide a description of what you are looking for or offering']
    },
    noOfSlots: {
        type: Number,
        required: [true, 'Please specify the number of slots you are looking for']
    },
    availableSlots: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ["completed", "fully booked", "available"],
        default: "available"
    },
    budget: {
        type: Number,
        required: [true, 'Please specify your budget for a room (or the rent if offering)']
    },
    preferredGender: {
        type: String,
        enum: ['Male', 'Female', 'Any'],
        default: 'Any',
        required: [true, 'Please specify your gender preference']
    },

    // The Critical Link: If null, they are just a roommate seeker. If present, they are offering a space.
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        default: null
    },

    // 1-to-1 or 1-to-Many rule for user (depends on app rules, we remove unique: true so one user can post multiple seeker ads over time, though you can adjust this!)
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);