const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const Group = require('../models/Group');
const { canMessage } = require('../utils/chatPermissions');

// The sidebar list: every distinct person the current user has exchanged
// 1:1 messages with, plus their most recent message as a preview. Group
// chats are listed separately (see listMyGroupChats) — excluded here via
// `group: null` so a group message never gets mistaken for a DM.
exports.listConversations = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.session.userId);

    const rows = await Message.aggregate([
      { $match: { group: null, $or: [{ sender: userId }, { recipient: userId }] } },
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

// Every group the current user belongs to — each one is automatically a
// group-chat entry, no separate "start chat" step needed once you've joined.
exports.listMyGroupChats = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.session.userId }).select('name destination').lean();
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בטעינת קבוצות הצ׳אט' });
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

exports.groupHistory = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ error: 'הקבוצה לא נמצאה' });
    if (!group.isMember(req.session.userId)) {
      return res.status(403).json({ error: 'את/ה לא חבר/ה בקבוצה הזו' });
    }

    const roomId = Message.roomForGroup(req.params.groupId);
    const messages = await Message.find({ roomId })
      .populate('sender', 'displayName')
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בטעינת הודעות הקבוצה' });
  }
};
