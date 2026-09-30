const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', messageController.listConversations);
router.get('/:otherUserId', messageController.history);

module.exports = router;
