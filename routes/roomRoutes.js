const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { isLoggedInRedirect } = require('../middleware/authHandler');

// PUBLIC: Anyone can browse rooms
router.get('/', roomController.index);
router.get('/:id', roomController.show);

// PROTECTED: Must be logged in for all other actions
router.get('/new', isLoggedInRedirect, roomController.newRoom);
router.post('/', isLoggedInRedirect, roomController.create);
router.get('/:id/edit', isLoggedInRedirect, roomController.edit);
router.post('/:id/update', isLoggedInRedirect, roomController.update);
router.post('/:id/delete', isLoggedInRedirect, roomController.destroy);

module.exports = router;
