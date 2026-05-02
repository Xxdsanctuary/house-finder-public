const Room = require('../models/Room');

// Get a room by its ID
async function getRoomByRoomId(roomId) {
    const room = await Room.findById(roomId);
    return room;
}

// Delete a room by its ID
async function deleteRoomByRoomId(roomId) {
    const result = await Room.findByIdAndDelete(roomId);
    return result;
}

module.exports = {
    getRoomByRoomId,
    deleteRoomByRoomId
};
