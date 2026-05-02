const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { isLoggedInRedirect } = require('../middleware/authHandler');

// Protected: must be logged in for all actions
router.post('/new', isLoggedInRedirect, requestController.sendRequest);
router.get('/show-applicant/:listingId', isLoggedInRedirect, requestController.showRequestApplicant);
router.get('/show-listingOwner/:requestId', isLoggedInRedirect, requestController.showRequestOwner);
router.post('/accept/:requestId', isLoggedInRedirect, requestController.acceptRequest);
router.post('/delete/:requestId', isLoggedInRedirect, requestController.deleteRequest);
router.get('/', isLoggedInRedirect, requestController.showRequests);

module.exports = router;