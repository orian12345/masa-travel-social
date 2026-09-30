const mongoose = require('mongoose');

// The gate between "found a partner post" and "can actually message them":
// the sender answers the post's screening questions, and the recipient
// manually approves or rejects based on those answers (requirement from the
// original spec — automated answer-matching was simplified to a human
// decision, which is both simpler and more honest than fake automation).
const chatRequestSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatRequest', chatRequestSchema);
