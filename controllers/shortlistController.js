const Shortlist = require('../models/Shortlist');

// GET /shortlist --> view all shortlisted listings for logged-in user
exports.getShortlist = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const items = await Shortlist.find({ userId: req.session.user._id })
            .populate('listingId', 'title');

        res.render('shortlist/index', { items });

    } catch (err) {
        next(err);
    }
};

// POST /shortlist/add --> add a listing to shortlist
exports.addToShortlist = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const { listingId } = req.body;

        // Prevent duplicates
        const existing = await Shortlist.findOne({ userId: req.session.user._id, listingId });
        if (!existing) {
            await Shortlist.create({ userId: req.session.user._id, listingId });
        }

        res.redirect(`/listings/${listingId}`);

    } catch (err) {
        next(err);
    }
};

// POST /shortlist/:id/remove --> remove a listing from shortlist
exports.removeFromShortlist = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        await Shortlist.findByIdAndDelete(req.params.id);

        res.redirect(req.body.redirectTo || '/shortlist');

    } catch (err) {
        next(err);
    }
};
