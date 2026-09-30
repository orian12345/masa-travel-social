const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/posts-per-group', statsController.postsPerGroup);
router.get('/posts-per-month', statsController.postsPerMonth);

module.exports = router;
