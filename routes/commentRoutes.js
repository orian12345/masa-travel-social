const express = require('express');
// mergeParams is required so req.params.postId (from the parent mount path
// "/api/posts/:postId/comments" in app.js) is visible in this router too.
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/commentController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', commentController.list);
router.post('/', commentController.create);
router.delete('/:commentId', commentController.remove);

module.exports = router;
