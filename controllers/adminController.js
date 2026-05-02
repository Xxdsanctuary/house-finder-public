const { UserModel } = require('../models/User');
const Listing = require('../models/Listing');
const Announcement = require('../models/Announcement');

exports.dashboard = async (req, res) => {
    try {
        const [totalUsers, activeUsers, totalListings, availableListings, fullyBookedListings] = await Promise.all([
            UserModel.countDocuments({}),
            UserModel.countDocuments({ isActive: true }),
            Listing.countDocuments({}),
            Listing.countDocuments({ status: 'available' }),
            Listing.countDocuments({ status: 'fully booked' })
        ]);

        res.render('admin/dashboard', {
            currentUser: req.session.user,
            totalUsers,
            activeUsers,
            totalListings,
            availableListings,
            fullyBookedListings
        });
    } catch (err) {
        res.status(500).send('Error loading admin dashboard: ' + err.message);
    }
};

exports.usersPage = async (req, res) => {
    try {
        const users = await UserModel.find({}).sort({ createdAt: -1 });
        res.render('admin/users', { users, currentUser: req.session.user });
    } catch (err) {
        res.status(500).send('Error loading users: ' + err.message);
    }
};

exports.toggleUserActive = async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.id);
        if (!user) return res.status(404).send('User not found');
        user.isActive = !user.isActive;
        await user.save();
        res.redirect('/admin/users');
    } catch (err) {
        res.status(500).send('Error updating user status: ' + err.message);
    }
};

exports.announcementsPage = async (req, res) => {
    try {
        const announcements = await Announcement.find({}).populate('createdBy', 'username').sort({ createdAt: -1 });
        res.render('admin/announcements', { announcements, error: null, currentUser: req.session.user });
    } catch (err) {
        res.status(500).send('Error loading announcements: ' + err.message);
    }
};

exports.createAnnouncement = async (req, res) => {
    try {
        const { title, body } = req.body;
        if (!title || !body) {
            const announcements = await Announcement.find({}).populate('createdBy', 'username').sort({ createdAt: -1 });
            return res.render('admin/announcements', { announcements, error: 'Title and body are required.', currentUser: req.session.user });
        }
        await Announcement.create({
            title,
            body,
            createdBy: req.session.user._id
        });
        res.redirect('/admin/announcements');
    } catch (err) {
        res.status(500).send('Error creating announcement: ' + err.message);
    }
};

exports.editAnnouncementPage = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).send('Announcement not found');
        res.render('admin/edit-announcement', { announcement, error: null, currentUser: req.session.user });
    } catch (err) {
        res.status(500).send('Error loading announcement: ' + err.message);
    }
};

exports.updateAnnouncement = async (req, res) => {
    try {
        const { title, body, isActive } = req.body;
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).send('Announcement not found');
        if (!title || !body) {
            return res.render('admin/edit-announcement', { announcement, error: 'Title and body are required.', currentUser: req.session.user });
        }
        announcement.title = title;
        announcement.body = body;
        announcement.isActive = isActive === 'on';
        await announcement.save();
        res.redirect('/admin/announcements');
    } catch (err) {
        res.status(500).send('Error updating announcement: ' + err.message);
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.redirect('/admin/announcements');
    } catch (err) {
        res.status(500).send('Error deleting announcement: ' + err.message);
    }
};
