const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderationController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/blocked', moderationController.listBlocked);
router.post('/block/:userId', moderationController.block);
router.delete('/block/:userId', moderationController.unblock);
router.post('/report/:userId', moderationController.report);

module.exports = router;
