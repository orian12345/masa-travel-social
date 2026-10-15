const mongoose = require('mongoose');

// One row per (user, chat room) tracking when that user last opened it —
// everything in that room created after lastReadAt counts as unread. Covers
// both private rooms (roomFor) and group rooms (roomForGroup) since both
// are just strings from the same roomId space.
const readStateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: String, required: true },
  lastReadAt: { type: Date, required: true, default: Date.now },
});

readStateSchema.index({ user: 1, roomId: 1 }, { unique: true });

module.exports = mongoose.model('ReadState', readStateSchema);
