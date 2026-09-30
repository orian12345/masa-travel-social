const ChatRequest = require('../models/ChatRequest');
const Post = require('../models/Post');
const Block = require('../models/Block');
const { canMessage } = require('../utils/chatPermissions');

// Submitting a request: answer the post's screening questions (if any),
// which creates a pending request the recipient must approve before any
// message can be exchanged (see sockets/chat.js and messageController.js
// for where that gate is enforced).
exports.create = async (req, res) => {
  try {
    const { postId, toUser, answers } = req.body;
    if (!toUser) return res.status(400).json({ error: 'חסר נמען לבקשה' });
    if (toUser === req.session.userId) {
      return res.status(400).json({ error: 'לא ניתן לשלוח בקשה לעצמך' });
    }

    // Already free to chat (an earlier request was approved) — nothing to
    // create, just tell the client so it can go straight to the chat page.
    if (await canMessage(req.session.userId, toUser)) {
      return res.json({ alreadyApproved: true });
    }

    const existingPending = await ChatRequest.findOne({
      fromUser: req.session.userId,
      toUser,
      status: 'pending',
    });
    if (existingPending) {
      return res.status(200).json(existingPending);
    }

    const blocked = await Block.findOne({
      $or: [
        { blocker: req.session.userId, blocked: toUser },
        { blocker: toUser, blocked: req.session.userId },
      ],
    });
    if (blocked) return res.status(403).json({ error: 'לא ניתן ליצור קשר עם משתמש זה' });

    let post = null;
    if (postId) {
      post = await Post.findById(postId);
      if (!post) return res.status(404).json({ error: 'הפוסט לא נמצא' });

      const requiredQuestions = post.screeningQuestions || [];
      if (requiredQuestions.length && (!answers || answers.length !== requiredQuestions.length)) {
        return res.status(400).json({ error: 'יש לענות על כל שאלות הסינון' });
      }
    }

    const request = await ChatRequest.create({
      post: postId || null,
      fromUser: req.session.userId,
      toUser,
      answers: answers || [],
    });

    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בשליחת הבקשה' });
  }
};

// Requests waiting for MY decision.
exports.listIncoming = async (req, res) => {
  try {
    const requests = await ChatRequest.find({ toUser: req.session.userId, status: 'pending' })
      .populate('fromUser', 'displayName age languages travelStyle verified')
      .populate('post', 'title destination')
      .sort({ createdAt: -1 })
      .lean();
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בטעינת הבקשות' });
  }
};

exports.respond = async (req, res) => {
  try {
    const { decision } = req.body; // 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'החלטה לא תקינה' });
    }

    const request = await ChatRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'הבקשה לא נמצאה' });
    if (request.toUser.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'זו לא בקשה שהופנתה אליך' });
    }

    request.status = decision;
    await request.save();
    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בעדכון הבקשה' });
  }
};
