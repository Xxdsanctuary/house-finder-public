const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/', profileController.getProfile);

router.get('/preferences', profileController.getPreferences);

router.post('/preferences', profileController.postPreferences);

router.get('/edit', profileController.getEditProfile);

router.post('/edit', profileController.updateProfile);

router.get('/password', profileController.getChangePassword);

router.post('/password', profileController.changePassword);

router.post('/delete', profileController.deleteAccount);

module.exports = router;

// dewa