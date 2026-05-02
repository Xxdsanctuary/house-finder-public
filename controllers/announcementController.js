const Announcement = require('../models/Announcement');
const path = require('path');

exports.apiAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 }).limit(4);
        res.json(announcements);
    } catch (err) {
        res.json([]);
    }
};

exports.viewAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id).populate('createdBy', 'username');
        if (!announcement) return res.status(404).send('Announcement not found');
        res.render('announcements/show', { announcement });
    } catch (err) {
        res.status(500).send('Error loading announcement: ' + err.message);
    }
};

exports.index = (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
};

exports.dashboard = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    try {
        const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 }).limit(4);
        res.render('dashboard', { announcements });
    } catch (err) {
        res.render('dashboard', { announcements: [] });
    }
};