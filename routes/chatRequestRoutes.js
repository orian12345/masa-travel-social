const express = require('express');
const router = express.Router();
const chatRequestController = require('../controllers/chatRequestController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', chatRequestController.listIncoming);
router.post('/', chatRequestController.create);
router.post('/:id/respond', chatRequestController.respond);

module.exports = router;
