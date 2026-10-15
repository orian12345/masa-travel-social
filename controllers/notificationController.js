const mongoose = require('mongoose');
const Message = require('../models/Message');
const Group = require('../models/Group');
const ReadState = require('../models/ReadState');
const ChatRequest = require('../models/ChatRequest');

// Powers the small badge counts next to "הודעות" and "בקשות" in the nav —
// one combined call so every page only needs one extra request on load.
exports.summary = async (req, res) => {
  try {
    const userId = req.session.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const myGroups = await Group.find({ members: userId }).select('_id');
    const groupRoomIds = myGroups.map((g) => Message.roomForGroup(g._id));

    const [privateRows, groupRows, readStates, pendingRequests] = await Promise.all([
      Message.aggregate([
        { $match: { group: null, $or: [{ sender: userObjectId }, { recipient: userObjectId }] } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$roomId', lastAt: { $first: '$createdAt' }, sender: { $first: '$sender' } } },
      ]),
      groupRoomIds.length
        ? Message.aggregate([
            { $match: { roomId: { $in: groupRoomIds } } },
            { $sort: { createdAt: -1 } },
            { $group: { _id: '$roomId', lastAt: { $first: '$createdAt' }, sender: { $first: '$sender' } } },
          ])
        : [],
      ReadState.find({ user: userId }).lean(),
      ChatRequest.countDocuments({ toUser: userId, status: 'pending' }),
    ]);

    const lastReadByRoom = Object.fromEntries(readStates.map((r) => [r.roomId, r.lastReadAt]));
    const countUnread = (rows) =>
      rows.filter((r) => {
        if (r.sender.toString() === userId) return false; // my own last message isn't "unread" to me
        const lastRead = lastReadByRoom[r._id];
        return !lastRead || r.lastAt > lastRead;
      }).length;

    res.json({
      unreadMessageRooms: countUnread(privateRows) + countUnread(groupRows),
      pendingRequests,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בטעינת ההתראות' });
  }
};
