const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, (req, res) => res.render('index'));
router.get('/search', requireAuth, (req, res) => res.render('search'));
router.get('/groups', requireAuth, (req, res) => res.render('groups'));
router.get('/groups/:id', requireAuth, (req, res) => res.render('group', { groupId: req.params.id }));
router.get('/chat', requireAuth, (req, res) => res.render('chat'));
router.get('/requests', requireAuth, (req, res) => res.render('requests'));
router.get('/posts/:id', requireAuth, (req, res) => res.render('post', { postId: req.params.id }));
router.get('/stats', requireAuth, (req, res) => res.render('stats'));
router.get('/profile/:id', requireAuth, (req, res) => res.render('profile', { profileId: req.params.id }));

module.exports = router;
