const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/feed', postController.listFeed);
router.get('/search', postController.search);
router.get('/group/:groupId', postController.listByGroup);
router.get('/:id', postController.getOne);
router.post('/', postController.create);
router.put('/:id', postController.update);
router.delete('/:id', postController.remove);

module.exports = router;
