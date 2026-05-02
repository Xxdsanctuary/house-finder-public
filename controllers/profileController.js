const bcrypt = require('bcrypt');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Room = require('../models/Room');
const Request = require('../models/Request');
const Message = require('../models/Message');
const Comment = require('../models/Comment');
const Shortlist = require('../models/Shortlist');

exports.getPreferences = async (req, res, next) => {
    try {
        const user = req.session.user ? await User.findUserById(req.session.user._id) : null;
        const preferences = user ? user.preferences : null;

        res.render('profile/preferences', {
            error: null,
            preferences,
            fromRegister: req.query.from === 'register'
        });
    } catch (err) {
        next(err);
    }
};

exports.postPreferences = async (req, res, next) => {
    const { regions, maxBudget, privateToilet, aircon, wifi, fullyFurnished } = req.body;

    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const regionsArray = !regions ? [] : Array.isArray(regions) ? regions : [regions];

        await User.updateUserById(req.session.user._id, {
            preferences: {
                regions:   regionsArray,
                maxBudget: maxBudget || null,
                amenities: {
                    privateToilet:  privateToilet  === 'true',
                    aircon:         aircon         === 'true',
                    wifi:           wifi           === 'true',
                    fullyFurnished: fullyFurnished === 'true'
                }
            }
        });

        res.redirect('/profile');

    } catch (err) {
        next(err);
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const user = await User.findUserById(req.session.user._id);

        if (!user) {
            return res.redirect('/auth/login');
        }

        res.render('profile/show', { user });

    } catch (err) {
        next(err);
    }
};

exports.getEditProfile = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const user = await User.findUserById(req.session.user._id);

        if (!user) {
            return res.redirect('/auth/login');
        }

        res.render('profile/edit', { user, error: null, success: null });

    } catch (err) {
        next(err);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const { username, email, gender, age, bio, contactNumber } = req.body;

        if (!username || username.trim() === '') {
            const user = await User.findUserById(req.session.user._id);
            return res.render('profile/edit', { user, error: 'Username cannot be empty.', success: null });
        }
        if (!email || email.trim() === '') {
            const user = await User.findUserById(req.session.user._id);
            return res.render('profile/edit', { user, error: 'Email cannot be empty.', success: null });
        }
        if (!gender || !['male', 'female', 'others'].includes(gender)) {
            const user = await User.findUserById(req.session.user._id);
            return res.render('profile/edit', { user, error: 'Please select a valid gender.', success: null });
        }
        if (!age || isNaN(parseInt(age)) || parseInt(age) < 1) {
            const user = await User.findUserById(req.session.user._id);
            return res.render('profile/edit', { user, error: 'Please enter a valid age.', success: null });
        }

        // Check if new username is taken by another user
        if (username.trim() !== req.session.user.username) {
            const existing = await User.findUser(username.trim());
            if (existing && existing._id.toString() !== req.session.user._id.toString()) {
                const user = await User.findUserById(req.session.user._id);
                return res.render('profile/edit', { user, error: 'That username is already taken.', success: null });
            }
        }

        await User.updateUserById(req.session.user._id, {
            username: username.trim(),
            email: email.trim(),
            gender,
            age: parseInt(age),
            bio:           bio || undefined,
            contactNumber: contactNumber || undefined
        });

        const updatedUser = await User.findUserById(req.session.user._id);
        req.session.user = { _id: updatedUser._id, username: updatedUser.username, role: updatedUser.role };
        res.render('profile/edit', { user: updatedUser, error: null, success: 'Profile updated successfully.' });

    } catch (err) {
        next(err);
    }
};

exports.getChangePassword = (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('profile/changePassword', { error: null, success: null });
};

exports.changePassword = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (newPassword.length < 6) {
            return res.render('profile/changePassword', { error: 'New password must be at least 6 characters.', success: null });
        }

        if (newPassword !== confirmPassword) {
            return res.render('profile/changePassword', { error: 'New passwords do not match.', success: null });
        }

        const user = await User.findUserById(req.session.user._id);
        const match = await bcrypt.compare(currentPassword, user.password);

        if (!match) {
            return res.render('profile/changePassword', { error: 'Current password is incorrect.', success: null });
        }

        const sameAsOld = await bcrypt.compare(newPassword, user.password);
        if (sameAsOld) {
            return res.render('profile/changePassword', { error: 'New password must be different from your current password.', success: null });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updateUserById(req.session.user._id, { password: hashedPassword });

        res.render('profile/changePassword', { error: null, success: 'Password changed successfully.' });

    } catch (err) {
        next(err);
    }
};

exports.deleteAccount = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const userId = req.session.user._id;

        // delete all listings (and their rooms) owned by the user
        const listings = await Listing.find({ creator: userId });
        for (const listing of listings) {
            if (listing.room) {
                await Room.findByIdAndDelete(listing.room);
            }
            await Listing.findByIdAndDelete(listing._id);
        }

        // delete all requests where user is applicant or listing owner, and their messages
        const [sentRequests, receivedRequests] = await Promise.all([ // used promise here to run both 209 and 210 because faster
            Request.findRequestByApplicantId(userId),
            Request.findRequestByListingOwnerId(userId)
        ]);
        const allRequests = [...sentRequests, ...receivedRequests];
        for (const req_ of allRequests) {
            const messages = await Message.findMessageByRequestId(req_._id);
            for (const msg of messages) {
                await Message.deleteMessage(msg._id);
            }
            await Request.deleteRequest(req_._id);
        }

        // delete all comments by the user
        await Comment.deleteMany({ userId });

        // delete all shortlist entries by the user
        await Shortlist.deleteMany({ userId });

        // delete the user
        await User.deleteUserById(userId);

        req.session.destroy(() => {
            res.redirect('/');
        });

    } catch (err) {
        next(err);
    }
};
