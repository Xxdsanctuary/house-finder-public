const Comment = require('../models/Comment');

// GET /listings/:listingId/comments --> list all comments for a listing
exports.getComments = async (req, res, next) => {
    try {
        const all = await Comment.find({ listingId: req.params.listingId }).sort({ createdAt: 1 });

        // separate top level and replies
        const topLevel = all.filter(c => !c.parentId);
        const replies = all.filter(c => c.parentId);

        // attach replies to their parent
        const commentsWithReplies = topLevel.map(comment => {
            const commentObj = comment.toObject();
            commentObj.replies = replies
                .filter(r => r.parentId.toString() === comment._id.toString())
                .map(r => r.toObject());
            return commentObj;
        });

        res.render('comments/index', {
            comments: commentsWithReplies,
            listingId: req.params.listingId,
            currentUserId: req.session.user ? req.session.user._id.toString() : null
        });
    } catch (err) {
        next(err);
    }
};

// GET /listings/:listingId/comments/new --> show form to add a comment
exports.getNewComment = (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('comments/new', { listingId: req.params.listingId, parentId: null, error: null });
};

// POST /listings/:listingId/comments --> create a new comment
exports.createComment = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const { body, parentId } = req.body;

        if (!body || body.trim() === '') {
            return res.render('comments/new', {
                listingId: req.params.listingId,
                parentId: parentId || null,
                error: 'Comment cannot be empty.'
            });
        }

        await Comment.create({
            listingId: req.params.listingId,
            userId:    req.session.user._id,
            username:  req.session.user.username,
            body,
            parentId:  parentId || null
        });

        res.redirect(`/listings/${req.params.listingId}/comments`);

    } catch (err) {
        next(err);
    }
};

// GET /listings/:listingId/comments/:commentId/edit --> show edit form
exports.getEditComment = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return next({ status: 404, message: 'Comment not found' });
        }

        if (comment.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).send('Not allowed to edit this comment');
        }

        res.render('comments/edit', { comment, listingId: req.params.listingId, error: null });

    } catch (err) {
        next(err);
    }
};

// POST /listings/:listingId/comments/:commentId/edit --> update a comment
exports.updateComment = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return next({ status: 404, message: 'Comment not found' });
        }

        if (comment.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).send('Not allowed to edit this comment');
        }

        await Comment.findByIdAndUpdate(req.params.commentId, { body: req.body.body, edited: true });

        res.redirect(`/listings/${req.params.listingId}/comments`);

    } catch (err) {
        next(err);
    }
};

// POST /listings/:listingId/comments/:commentId/delete --> delete a comment
exports.deleteComment = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return next({ status: 404, message: 'Comment not found' });
        }

        if (comment.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).send('Not allowed to delete this comment');
        }

        // also delete any replies to this comment
        await Comment.deleteMany({ parentId: req.params.commentId });
        await Comment.findByIdAndDelete(req.params.commentId);

        res.redirect(`/listings/${req.params.listingId}/comments`);

    } catch (err) {
        next(err);
    }
};
