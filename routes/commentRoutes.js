const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');

// GET  /listings/:listingId/comments
router.get('/', commentController.getComments);

// GET  /listings/:listingId/comments/new
router.get('/new', commentController.getNewComment);

// POST /listings/:listingId/comments
router.post('/', commentController.createComment);

// GET  /listings/:listingId/comments/:commentId/edit
router.get('/:commentId/edit', commentController.getEditComment);

// POST /listings/:listingId/comments/:commentId/edit
router.post('/:commentId/edit', commentController.updateComment);

// POST /listings/:listingId/comments/:commentId/delete
router.post('/:commentId/delete', commentController.deleteComment);

module.exports = router;

// dewa