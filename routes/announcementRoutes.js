const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');

// PUBLIC: Anyone can browse announcements
router.get('/', announcementController.index);
router.get('/announcements/:id', announcementController.viewAnnouncement);
router.get('/api/announcements', announcementController.apiAnnouncements);
router.get('/dashboard', announcementController.dashboard);

module.exports = router;