const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', messageController.listConversations);
router.get('/groups/mine', messageController.listMyGroupChats);
router.get('/group/:groupId', messageController.groupHistory);
router.get('/:otherUserId', messageController.history);

module.exports = router;
