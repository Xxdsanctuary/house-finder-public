const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdminRedirect } = require('../middleware/authHandler');

router.get('/', isAdminRedirect, adminController.dashboard);
router.get('/users', isAdminRedirect, adminController.usersPage);
router.post('/users/:id/toggle-active', isAdminRedirect, adminController.toggleUserActive);

router.get('/announcements', isAdminRedirect, adminController.announcementsPage);
router.post('/announcements', isAdminRedirect, adminController.createAnnouncement);
router.get('/announcements/:id/edit', isAdminRedirect, adminController.editAnnouncementPage);
router.post('/announcements/:id/update', isAdminRedirect, adminController.updateAnnouncement);
router.post('/announcements/:id/delete', isAdminRedirect, adminController.deleteAnnouncement);

module.exports = router;
