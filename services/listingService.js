const Listing = require('../models/Listing');
const Room = require('../models/Room');

// Get a listing by its ID (populated)
async function getListingById(id) {
    const listing = await Listing.findById(id).populate('room').populate('creator');
    return listing;
}

// Get all listings created by a specific user
async function getListingsByUserId(userId) {
    const listings = await Listing.find({ creator: userId }).populate('room').populate('creator');
    return listings;
}

// Delete all listings owned by userId and their associated rooms
async function deleteListingByUserId(userId) {
    const roomService = require('./roomService');
    const listings = await Listing.find({ creator: userId });
    if (!listings || listings.length === 0) return null;

    for (const listing of listings) {
        if (listing.room) {
            await roomService.deleteRoomByRoomId(listing.room);
        }
        await Listing.findByIdAndDelete(listing._id);
    }

    return listings;
}

// Get listings that a user is interested in (via their requests)
async function getInterestedListings(userId) {
    // Safely import requestService (may not exist yet)
    let requestService;
    try {
        requestService = require('./requestService');
    } catch (error) {
        throw new Error("Waiting on 'requestService.js' to be successfully created!");
    }

    // Get request objects for this applicant
    const requests = await requestService.getRequestByApplicantId(userId);

    if (!requests || requests.length === 0) {
        return [];
    }

    // Extract listingIds from the request objects
    const listingIds = requests.map(r => r.listingId);

    // Fetch and return all matching listings
    const listings = await Listing.find({ _id: { $in: listingIds } })
        .populate('room')
        .populate('creator');

    return listings;
}

// Add a userId to a listing's availableSlots array
async function addUserToSlot(listingId, userId) {
    const listing = await Listing.findById(listingId);
    if (!listing) return null;

    // Don't add if already in array or array is full
    const alreadyIn = listing.availableSlots.some(id => id.toString() === userId.toString());
    if (alreadyIn) throw new Error('User already in slot');
    if (listing.availableSlots.length >= listing.noOfSlots) throw new Error('No slots available');

    listing.availableSlots.push(userId);

    // If fully booked now
    if (listing.availableSlots.length >= listing.noOfSlots) {
        listing.status = 'fully booked';
    }

    await listing.save();
    return listing;
}

// Remove a userId from a listing's availableSlots array
async function removeUserFromSlot(listingId, userId) {
    const listing = await Listing.findById(listingId);
    if (!listing) return null;

    listing.availableSlots = listing.availableSlots.filter(
        id => id.toString() !== userId.toString()
    );

    // If it was fully booked but now has room, set back to available
    if (listing.status === 'fully booked' && listing.availableSlots.length < listing.noOfSlots) {
        listing.status = 'available';
    }

    await listing.save();
    return listing;
}

module.exports = {
    getListingById,
    getListingsByUserId,
    deleteListingByUserId,
    getInterestedListings,
    addUserToSlot,
    removeUserFromSlot
};
