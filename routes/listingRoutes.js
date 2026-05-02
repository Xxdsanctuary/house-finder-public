const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { isLoggedInRedirect } = require('../middleware/authHandler');

// PUBLIC: Anyone can browse listings
router.get('/', listingController.index);

// PROTECTED: Must be logged in for all other actions
router.get('/new', isLoggedInRedirect, listingController.newListing);
router.post('/', isLoggedInRedirect, listingController.create);
router.get('/preferred', isLoggedInRedirect, listingController.getPreferredListings);
router.get('/interested', isLoggedInRedirect, listingController.getInterestedListings);
router.get('/user/:userId', isLoggedInRedirect, listingController.getListingsByUserId);
router.post('/user/:userId/delete', isLoggedInRedirect, listingController.deleteListingByUserId);
router.get('/:id', isLoggedInRedirect, listingController.show);
router.get('/:id/edit', isLoggedInRedirect, listingController.edit);
router.post('/:id/update', isLoggedInRedirect, listingController.update);
router.post('/:id/delete', isLoggedInRedirect, listingController.destroy);
router.post('/:id/increase-slot', isLoggedInRedirect, listingController.increaseAvailable);
router.post('/:id/decrease-slot', isLoggedInRedirect, listingController.decreaseAvailable);

module.exports = router;
