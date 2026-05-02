const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { isLoggedInRedirect } = require('../middleware/authHandler');

// Protected: must be logged in for all actions
router.post('/new', isLoggedInRedirect, messageController.sendMessage);

module.exports = router;