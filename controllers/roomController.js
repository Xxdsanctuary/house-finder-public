const Room = require('../models/Room');
const roomService = require('../services/roomService');

// 1. INDEX: Show all rooms
const index = async (req, res, next) => {
    try {
        const rooms = await Room.find();
        res.render('rooms/index', { rooms });
    } catch (err) {
        next(err);
    }
};

// 2. NEW: Show form to create a new room
const newRoom = (req, res) => {
    res.render('rooms/new', { error: null });
};

// 3. CREATE: Save new room to DB
const create = async (req, res) => {
    try {
        const { title, description, monthlyRent, region, availabilityStatus, nearestMRT, image, privateToilet, aircon, wifi, fullyFurnished } = req.body;

        if (!title || !description || !monthlyRent || !region) {
            return res.render('rooms/new', { error: 'Title, description, monthly rent, and region are required.' });
        }
        if (isNaN(parseFloat(monthlyRent)) || parseFloat(monthlyRent) <= 0) {
            return res.render('rooms/new', { error: 'Monthly rent must be a positive number.' });
        }

        const newRoomData = new Room({
            title,
            description,
            monthlyRent,
            region,
            nearestMRT,
            image,
            availabilityStatus: availabilityStatus || 'Available',
            amenities: {
                privateToilet: privateToilet === 'on',
                aircon: aircon === 'on',
                wifi: wifi === 'on',
                fullyFurnished: fullyFurnished === 'on'
            },
            creator: req.session.user._id
        });

        await newRoomData.save();
        res.redirect('/rooms');
    } catch (err) {
        if (err.code === 11000 && err.keyPattern && err.keyPattern.creator) {
            return res.render('rooms/new', { error: "You already have a room created! You can only offer one room per account. Please delete it first." });
        }
        res.render('rooms/new', { error: "Failed to create room: " + err.message });
    }
};

// 4. SHOW: Show details of exactly one room
const show = async (req, res, next) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).send('Room not found');
        res.render('rooms/show', { room });
    } catch (err) {
        next(err);
    }
};

// 5. EDIT: Show form to edit an existing room
const edit = async (req, res, next) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).send('Room not found');

        if (room.creator.toString() !== req.session.user._id.toString()) {
            return res.status(403).send('You are not allowed to edit this room');
        }

        res.render('rooms/edit', { room });
    } catch (err) {
        next(err);
    }
};

// 6. UPDATE: Save the edited room to the DB
const update = async (req, res, next) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).send('Room not found');

        if (room.creator.toString() !== req.session.user._id.toString()) {
            return res.status(403).send('You are not allowed to update this room');
        }

        const { title, description, monthlyRent, region, availabilityStatus, nearestMRT, image, privateToilet, aircon, wifi, fullyFurnished } = req.body;

        await Room.findByIdAndUpdate(req.params.id, {
            title,
            description,
            monthlyRent,
            region,
            nearestMRT,
            image,
            availabilityStatus: availabilityStatus || 'Available',
            amenities: {
                privateToilet: privateToilet === 'on',
                aircon: aircon === 'on',
                wifi: wifi === 'on',
                fullyFurnished: fullyFurnished === 'on'
            }
        });

        res.redirect(`/rooms/${req.params.id}`);
    } catch (err) {
        next(err);
    }
};

// 7. DESTROY: Delete room from DB
const destroy = async (req, res, next) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).send('Room not found');

        const isOwner = room.creator.toString() === req.session.user._id.toString();
        const isAdmin = req.session.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).send('You are not allowed to delete this room');
        }

        await roomService.deleteRoomByRoomId(req.params.id);
        res.redirect('/rooms');
    } catch (err) {
        next(err);
    }
};

// 8. GET ROOM BY ROOM ID
const getRoomByRoomId = async (req, res, next) => {
    try {
        const room = await roomService.getRoomByRoomId(req.params.id);
        if (!room) return res.status(404).send('Room not found');
        res.json(room);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    index,
    newRoom,
    create,
    show,
    edit,
    update,
    destroy,
    getRoomByRoomId
};
