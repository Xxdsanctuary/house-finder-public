const Listing = require('../models/Listing');
const Room = require('../models/Room');
const User = require('../models/User');
const Request = require('../models/Request');
const Shortlist = require('../models/Shortlist');
const { isAdmin } = require('../services/authService');
const listingService = require('../services/listingService');
const roomService = require('../services/roomService');

// 1. INDEX: Show all listings (Populating the room data if it exists)
const index = async (req, res, next) => {
    try {
        const rawListings = await Listing.find().populate('room');

        // Retrieve Query Parameters for comprehensive filtering
        // Default to true so all genders show on first visit.
        // The hidden input in the form sends 'false' when the checkbox is unchecked.
        const showAllGender = req.query.showAllGender !== 'false';
        const search = req.query.search || '';
        const regionFilter = req.query.region || 'All';
        const listingType = req.query.listingType || 'All';
        const maxBudgetFilter = req.query.maxBudget ? parseInt(req.query.maxBudget) : null;
        const filterAircon = req.query.amenity_aircon === 'true';
        const filterWifi = req.query.amenity_wifi === 'true';
        const filterToilet = req.query.amenity_toilet === 'true';
        const filterFurnished = req.query.amenity_furnished === 'true';

        // Check if user is logged in
        const isAuthenticated = req.session && req.session.user;
        const currentUser = isAuthenticated ? await User.findUserById(req.session.user._id) : null;

        // Collect all filter state to pass back to the view
        const filterState = { showAllGender, search, region: regionFilter, listingType, maxBudget: maxBudgetFilter || '', amenity_aircon: filterAircon, amenity_wifi: filterWifi, amenity_toilet: filterToilet, amenity_furnished: filterFurnished };
        const currentUserId = currentUser ? currentUser._id : null;

        // Admin bypass: return all listings unfiltered
        if (currentUser && isAdmin(req)) {
            return res.render('listings/index', { listings: rawListings, ...filterState, currentUserId, session: req.session ? req.session.user : null });
        }

        const userGender = currentUser?.gender || null;
        const preferences = currentUser?.preferences || {
            regions: [],
            maxBudget: Infinity,
            amenities: {}
        };

        // Base Filter: Only show active listings
        let filteredListings = rawListings.filter(l => l.status === 'available' || !l.status);

        // 1. Gender Filter (only apply if user is logged in and has a gender set)
        if (!showAllGender && userGender) {
            filteredListings = filteredListings.filter(listing => {
                if (listing.preferredGender === 'Any') return true;
                // Normalize case: User stores 'male', Listing stores 'Male'
                return listing.preferredGender.toLowerCase() === userGender.toLowerCase();
            });
        }

        // 2. Search Text Filter
        if (search) {
            const s = search.toLowerCase();
            filteredListings = filteredListings.filter(l =>
                l.title.toLowerCase().includes(s) ||
                l.description.toLowerCase().includes(s)
            );
        }

        // 3. Region Filter
        if (regionFilter !== 'All') {
            filteredListings = filteredListings.filter(l =>
                l.room && l.room.region === regionFilter
            );
        }

        // 4. Listing Type Filter
        if (listingType === 'Room') {
            filteredListings = filteredListings.filter(l => l.room != null);
        } else if (listingType === 'Seeker') {
            filteredListings = filteredListings.filter(l => l.room == null);
        }

        // 5. Max Budget Filter
        if (maxBudgetFilter) {
            filteredListings = filteredListings.filter(l => l.budget <= maxBudgetFilter);
        }

        // 6. Amenity Filters (only applies to listings with rooms)
        if (filterAircon || filterWifi || filterToilet || filterFurnished) {
            filteredListings = filteredListings.filter(l => {
                if (!l.room || !l.room.amenities) return false;
                const a = l.room.amenities;
                if (filterAircon && !a.aircon) return false;
                if (filterWifi && !a.wifi) return false;
                if (filterToilet && !a.privateToilet) return false;
                if (filterFurnished && !a.fullyFurnished) return false;
                return true;
            });
        }

        // Advanced Matching Algorithm
        const listings = filteredListings.map(listingDoc => {
            let score = 0;
            const listing = listingDoc.toObject();

            // Only score listings that HAVE a room (an offering)
            if (listing.room) {
                const room = listing.room;

                // 1. Budget Score (40 Points max)
                if (room.monthlyRent <= preferences.maxBudget) {
                    score += 40;
                } else if (preferences.maxBudget !== Infinity) {
                    const overage = room.monthlyRent - preferences.maxBudget;
                    if (overage <= 100) score += 20;
                    else if (overage <= 200) score += 10;
                }

                // 2. Region Score (30 Points)
                if (preferences.regions && preferences.regions.includes(room.region)) {
                    score += 30;
                } else if (!preferences.regions || preferences.regions.length === 0) {
                    score += 30; // perfect match if seeker doesn't have a preference
                }

                // 3. Amenities Score (30 Points)
                let totalRequired = 0;
                let amenitiesMet = 0;

                ['privateToilet', 'aircon', 'wifi', 'fullyFurnished'].forEach(amen => {
                    if (preferences.amenities && preferences.amenities[amen] === true) {
                        totalRequired++;
                        if (room.amenities && room.amenities[amen] === true) {
                            amenitiesMet++;
                        }
                    }
                });

                if (totalRequired > 0) {
                    score += Math.round((amenitiesMet / totalRequired) * 30);
                } else {
                    score += 30; // perfect match if no strict amenity requirements
                }
            } else {
                // If it's just a seeker listing (no room), don't prioritize or give a neutral score
                score = 0;
            }

            listing.matchScore = score;
            return listing;
        });

        // Sort: highest score at the top
        listings.sort((a, b) => b.matchScore - a.matchScore);

        res.render('listings/index', { listings, ...filterState, currentUserId, session: req.session ? req.session.user : null });
    } catch (err) {
        next(err);
    }
};

// 2. NEW: Show form
const newListing = (req, res) => {
    res.render('listings/new', { error: null });
};

// 3. CREATE: Handle exactly if the form submitted room fields or not
const create = async (req, res, next) => {
    try {
        const {
            // Listing Fields
            listingTitle, listingDescription, listingBudget, hasRoom, preferredGender, noOfSlots,
            // Room Fields
            roomTitle, roomDescription, monthlyRent, region, nearestMRT, image, privateToilet, aircon, wifi, fullyFurnished
        } = req.body;

        if (!listingTitle || !listingDescription || !listingBudget) {
            return res.render('listings/new', { error: 'Title, description, and budget are required.' });
        }
        if (isNaN(parseFloat(listingBudget)) || parseFloat(listingBudget) <= 0) {
            return res.render('listings/new', { error: 'Budget must be a positive number.' });
        }
        if (hasRoom === 'yes' && (!roomTitle || !monthlyRent || !nearestMRT)) {
            return res.render('listings/new', { error: 'Room title, monthly rent, and nearest MRT are required for room listings.' });
        }
        if (hasRoom === 'yes' && (isNaN(parseFloat(monthlyRent)) || parseFloat(monthlyRent) <= 0)) {
            return res.render('listings/new', { error: 'Monthly rent must be a positive number.' });
        }

        let roomIdToSave = null;

        // PATH A: They have a room!
        if (hasRoom === 'yes') {
            const newRoomData = new Room({
                title: roomTitle,
                description: roomDescription,
                monthlyRent: monthlyRent,
                nearestMRT: nearestMRT,
                image: image,
                amenities: {
                    privateToilet: privateToilet === 'on',
                    aircon: aircon === 'on',
                    wifi: wifi === 'on',
                    fullyFurnished: fullyFurnished === 'on'
                },
                creator: req.session.user._id
            });
            // Step 1: Save the Room FIRST
            const savedRoom = await newRoomData.save();
            // Step 2: Grab the newly generated ID
            roomIdToSave = savedRoom._id;
        }

        // PATH B: Only save the Listing
        // This runs no matter what. If Path A ran, roomIdToSave will have an ID. If not, it stays null!
        const newListingData = new Listing({
            title: listingTitle,
            description: listingDescription,
            budget: listingBudget,
            noOfSlots: noOfSlots || 1,
            availableSlots: [],
            preferredGender: preferredGender || 'Any',
            status: 'available',
            room: roomIdToSave,
            creator: req.session.user._id
        });

        await newListingData.save();
        res.redirect('/listings');

    } catch (err) {
        console.error('CREATE LISTING ERROR:', err);

        // Mongoose validation error — extract the first meaningful message
        if (err.name === 'ValidationError') {
            const firstMsg = Object.values(err.errors).map(e => e.message)[0];
            return res.render('listings/new', { error: firstMsg || 'Please check your inputs and try again.' });
        }

        // Duplicate key error
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0] || 'field';
            return res.render('listings/new', { error: `A record with that ${field} already exists. Please use a different value or delete the existing one first.` });
        }

        // Generic fallback
        next(err);
    }
};

// 4. SHOW: Show details of exactly one listing
const show = async (req, res, next) => {
    try {
        const listing = await listingService.getListingById(req.params.id);
        if (!listing) return res.status(404).send('Listing not found');

        const currentUserId = req.session.user._id;
        const isCurrentUserAdmin = req.session.user.role === 'admin';

        const existingRequests = await Request.findRequestByListingIdAndApplicantId(listing._id, currentUserId);
        const hasRequested = existingRequests && existingRequests.length > 0;

        const shortlistEntry = await Shortlist.findOne({ userId: currentUserId, listingId: listing._id });
        const isShortlisted = !!shortlistEntry;
        const shortlistId = shortlistEntry ? shortlistEntry._id : null;

        res.render('listings/show', { listing, currentUserId, isCurrentUserAdmin, hasRequested, isShortlisted, shortlistId });
    } catch (err) {
        next(err);
    }
};



// 5. EDIT: Show form to edit an existing listing
const edit = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id).populate('room');
        if (!listing) return res.status(404).send('Listing not found');

        if (listing.creator.toString() !== req.session.user._id.toString()) {
            return res.status(403).send('You are not allowed to edit this listing');
        }

        res.render('listings/edit', { listing });
    } catch (err) {
        next(err);
    }
};

// 6. UPDATE: Save the edited listing
const update = async (req, res, next) => {
    try {
        const {
            listingTitle, listingDescription, listingBudget, hasRoom, preferredGender, noOfSlots, status,
            roomTitle, roomDescription, monthlyRent, region, nearestMRT, image, privateToilet, aircon, wifi, fullyFurnished
        } = req.body;

        if (!listingTitle || !listingDescription || !listingBudget) {
            return res.status(400).send('Title, description, and budget are required.');
        }
        if (isNaN(parseFloat(listingBudget)) || parseFloat(listingBudget) <= 0) {
            return res.status(400).send('Budget must be a positive number.');
        }
        if (noOfSlots && (isNaN(parseInt(noOfSlots)) || parseInt(noOfSlots) < 1)) {
            return res.status(400).send('Number of slots must be a positive integer.');
        }
        if (hasRoom === 'yes' && (!roomTitle || !monthlyRent || !nearestMRT)) {
            return res.status(400).send('Room title, monthly rent, and nearest MRT are required for room listings.');
        }
        if (hasRoom === 'yes' && (isNaN(parseFloat(monthlyRent)) || parseFloat(monthlyRent) <= 0)) {
            return res.status(400).send('Monthly rent must be a positive number.');
        }

        const listing = await Listing.findById(req.params.id).populate('room');
        if (!listing) return res.status(404).send('Listing not found');

        if (listing.creator.toString() !== req.session.user._id.toString()) {
            return res.status(403).send('You are not allowed to update this listing');
        }

        let roomIdToSave = listing.room ? listing.room._id : null;

        if (hasRoom === 'yes') {
            const roomData = {
                title: roomTitle,
                description: roomDescription,
                noOfSlots,
                monthlyRent,
                region,
                nearestMRT,
                image,
                amenities: {
                    privateToilet: privateToilet === 'on',
                    aircon: aircon === 'on',
                    wifi: wifi === 'on',
                    fullyFurnished: fullyFurnished === 'on'
                }
            };

            if (listing.room) {
                await Room.findByIdAndUpdate(listing.room._id, roomData);
            } else {
                const newRoom = new Room({ ...roomData, creator: req.session.user._id });
                const savedRoom = await newRoom.save();
                roomIdToSave = savedRoom._id;
            }
        } else {
            if (listing.room) {
                await roomService.deleteRoomByRoomId(listing.room._id);
                roomIdToSave = null;
            }
        }

        listing.title = listingTitle;
        listing.description = listingDescription;
        listing.budget = listingBudget;
        listing.preferredGender = preferredGender || 'Any';
        if (status) listing.status = status;
        if (noOfSlots) listing.noOfSlots = noOfSlots;
        listing.room = roomIdToSave;

        await listing.save();
        res.redirect(`/listings/${listing._id}`);
    } catch (err) {
        next(err);
    }
};

// 7. DESTROY: Delete listing
const destroy = async (req, res, next) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).send('Listing not found');

        const currentUser = req.session.user;
        const isOwner = listing.creator && listing.creator.toString() === currentUser._id.toString();
        const isCurrentUserAdmin = currentUser.role === 'admin';

        if (!isOwner && !isCurrentUserAdmin) {
            return res.status(403).send('You are not allowed to delete this listing');
        }

        if (listing.room) {
            await roomService.deleteRoomByRoomId(listing.room);
        }
        await Listing.findByIdAndDelete(req.params.id);
        res.redirect('/listings');
    } catch (err) {
        next(err);
    }
};

// 8. MANAGE SLOTS: Add user to slot (decrease available)
const increaseAvailable = async (req, res, next) => {
    try {
        const userId = req.session.user._id;
        const listing = await listingService.removeUserFromSlot(req.params.id, userId);
        if (!listing) return res.status(404).send('Listing not found');
        res.redirect(`/listings/${listing._id}`);
    } catch (err) {
        next(err);
    }
};

const decreaseAvailable = async (req, res, next) => {
    try {
        const userId = req.session.user._id;
        const listing = await listingService.addUserToSlot(req.params.id, userId);
        if (!listing) return res.status(404).send('Listing not found');
        res.redirect(`/listings/${listing._id}`);
    } catch (err) {
        next(err);
    }
};

// 9. GET PREFERRED LISTINGS: Fetches listings requested by the user
const getPreferredListings = async (req, res, next) => {
    try {
        const currentUserId = req.session.user._id;

        const requestService = require('../services/requestService');

        // Get request objects for this user, then extract unique listingIds
        const requests = await requestService.getRequestByApplicantId(currentUserId);
        const listingIds = requests.map(r => r.listingId);

        // If the user hasn't made any requests, gracefully return an empty feed
        if (!listingIds || listingIds.length === 0) {
            return res.render('listings/index', {
                listings: [], showAllGender: true, search: '', region: 'All',
                listingType: 'All', maxBudget: '',
                amenity_aircon: false, amenity_wifi: false, amenity_toilet: false, amenity_furnished: false,
                currentUserId, session: req.session.user
            });
        }

        // Query our Listing database model to return the list of listing objects based on the listing ids
        const listings = await Listing.find({ _id: { $in: listingIds } })
            .populate('room')
            .populate('creator');

        return res.render('listings/index', {
            listings, showAllGender: true, search: '', region: 'All',
            listingType: 'All', maxBudget: '',
            amenity_aircon: false, amenity_wifi: false, amenity_toilet: false, amenity_furnished: false,
            currentUserId, session: req.session.user
        });

    } catch (err) {
        next(err);
    }
};

// 10. GET LISTINGS BY USER ID
const getListingsByUserId = async (req, res, next) => {
    try {
        const listings = await listingService.getListingsByUserId(req.params.userId);
        res.render('listings/index', {
            listings, showAllGender: true, search: '', region: 'All',
            listingType: 'All', maxBudget: '',
            amenity_aircon: false, amenity_wifi: false, amenity_toilet: false, amenity_furnished: false,
            currentUserId: req.session.user._id, session: req.session.user
        });
    } catch (err) {
        next(err);
    }
};

// 11. DELETE LISTING BY USER ID (deletes listing + associated room)
const deleteListingByUserId = async (req, res, next) => {
    try {
        if (req.session.user._id.toString() !== req.params.userId.toString() && req.session.user.role !== 'admin') {
            return res.status(403).send('You are not allowed to delete another user\'s listings');
        }
        const result = await listingService.deleteListingByUserId(req.params.userId);
        if (!result) return res.status(404).send('No listing found for this user');
        res.redirect('/listings');
    } catch (err) {
        next(err);
    }
};

// 12. GET INTERESTED LISTINGS (listings the user applied to via requests)
const getInterestedListings = async (req, res, next) => {
    try {
        const currentUserId = req.session.user._id;
        const listings = await listingService.getInterestedListings(currentUserId);
        res.render('listings/index', {
            listings, showAllGender: true, search: '', region: 'All',
            listingType: 'All', maxBudget: '',
            amenity_aircon: false, amenity_wifi: false, amenity_toilet: false, amenity_furnished: false,
            currentUserId, session: req.session.user
        });
    } catch (err) {
        next(err);
    }
};

// 13. GET LISTING BY ID (API-style, returns JSON)
const getListingsById = async (req, res, next) => {
    try {
        const listing = await listingService.getListingById(req.params.id);
        if (!listing) return res.status(404).send('Listing not found');
        res.json(listing);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    index,
    newListing,
    create,
    show,
    edit,
    update,
    destroy,
    increaseAvailable,
    decreaseAvailable,
    getPreferredListings,
    getListingsByUserId,
    deleteListingByUserId,
    getInterestedListings,
    getListingsById
};
