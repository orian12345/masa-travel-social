const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // A stable id for the conversation regardless of who sends next: for a
    // 1:1 chat, the two user ids sorted and joined; for a group chat, the
    // group's own id prefixed so it can never collide with a user-pair id.
    roomId: { type: String, required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Exactly one of recipient/group is set, depending on whether this is a
    // 1:1 message or a group-chat message.
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    text: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

messageSchema.statics.roomFor = function roomFor(userIdA, userIdB) {
  return [userIdA.toString(), userIdB.toString()].sort().join(':');
};

messageSchema.statics.roomForGroup = function roomForGroup(groupId) {
  return 'group:' + groupId.toString();
};

module.exports = mongoose.model('Message', messageSchema);
