const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // A stable id for the conversation regardless of who sends next —
    // the two user ids sorted and joined, so both participants compute
    // the same room name independently.
    roomId: { type: String, required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

messageSchema.statics.roomFor = function roomFor(userIdA, userIdB) {
  return [userIdA.toString(), userIdB.toString()].sort().join(':');
};

module.exports = mongoose.model('Message', messageSchema);
