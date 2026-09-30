const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const { canMessage } = require('../utils/chatPermissions');

// The sidebar list: every distinct person the current user has exchanged
// messages with, plus their most recent message as a preview.
exports.listConversations = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.session.userId);

    const rows = await Message.aggregate([
      { $match: { $or: [{ sender: userId }, { recipient: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$roomId',
          lastMessage: { $first: '$text' },
          lastAt: { $first: '$createdAt' },
          sender: { $first: '$sender' },
          recipient: { $first: '$recipient' },
        },
      },
      { $sort: { lastAt: -1 } },
    ]);

    const otherUserIds = rows.map((r) =>
      r.sender.toString() === req.session.userId ? r.recipient : r.sender
    );
    const users = await User.find({ _id: { $in: otherUserIds } }).select('displayName').lean();
    const userById = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

    const conversations = rows.map((r) => {
      const otherId = (r.sender.toString() === req.session.userId ? r.recipient : r.sender).toString();
      return {
        userId: otherId,
        displayName: userById[otherId] ? userById[otherId].displayName : 'משתמש שנמחק',
        lastMessage: r.lastMessage,
        lastAt: r.lastAt,
      };
    });

    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בטעינת השיחות' });
  }
};

// History load on opening a conversation — the live part (new messages
// while the chat is open) travels over Socket.io instead, not this route.
exports.history = async (req, res) => {
  try {
    const allowed = await canMessage(req.session.userId, req.params.otherUserId);
    if (!allowed) {
      return res.status(403).json({ error: 'אין עדיין צ׳אט פתוח עם המשתמש הזה — נדרש אישור בקשה קודם' });
    }

    const roomId = Message.roomFor(req.session.userId, req.params.otherUserId);
    const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).limit(200).lean();
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בטעינת ההודעות' });
  }
};
