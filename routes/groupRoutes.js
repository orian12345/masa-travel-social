const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', groupController.list);
router.get('/:id', groupController.getOne);
router.post('/', groupController.create);
router.put('/:id', groupController.update);
router.delete('/:id', groupController.remove);
router.post('/:id/join', groupController.join);
router.post('/:id/leave', groupController.leave);

module.exports = router;
