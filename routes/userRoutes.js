const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/search', userController.search);
router.get('/:id', userController.getProfile);
router.put('/:id', userController.updateProfile);
router.post('/:id/verify', userController.verifySelfie);
router.delete('/:id', userController.deleteAccount);

module.exports = router;
