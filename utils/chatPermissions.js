const ChatRequest = require('../models/ChatRequest');
const Block = require('../models/Block');

// Shared by the REST history route and the Socket.io handler — both must
// agree on when two users are allowed to exchange messages, so the rule
// lives in one place instead of being duplicated (and drifting) in two.
async function canMessage(userIdA, userIdB) {
  const blocked = await Block.findOne({
    $or: [
      { blocker: userIdA, blocked: userIdB },
      { blocker: userIdB, blocked: userIdA },
    ],
  });
  if (blocked) return false;

  const approved = await ChatRequest.findOne({
    status: 'approved',
    $or: [
      { fromUser: userIdA, toUser: userIdB },
      { fromUser: userIdB, toUser: userIdA },
    ],
  });
  return !!approved;
}

module.exports = { canMessage };
