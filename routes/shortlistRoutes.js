const express = require('express');
const router = express.Router();
const shortlistController = require('../controllers/shortlistController');

router.get('/', shortlistController.getShortlist);

router.post('/add', shortlistController.addToShortlist);

router.post('/:id/remove', shortlistController.removeFromShortlist);

module.exports = router;

// dewa