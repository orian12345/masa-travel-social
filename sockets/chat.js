const Message = require('../models/Message');
const Group = require('../models/Group');
const User = require('../models/User');
const { canMessage } = require('../utils/chatPermissions');

// A rough net for "trying to move off-platform" or sharing contact details
// too early — an israeli/international phone number, an email address, or
// the word whatsapp/וואטסאפ. Not meant to block anything, only to trigger
// requirement #3's safety reminder back to the sender.
const SUSPICIOUS_PATTERN = /(\+?\d[\d\-\s]{7,}\d)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(whatsapp|וואטסאפ|ואטסאפ)/i;

// Wires real-time chat onto an already-created Socket.io server instance.
// Requirement #28: chat data moves between client and server over
// Socket.io/WebSockets, not a plain HTTP request per message.
function registerChatHandlers(io) {
  io.on('connection', async (socket) => {
    const session = socket.request.session;
    const userId = session && session.userId;

    // The Express session cookie is shared with Socket.io's handshake (see
    // app.js), so an unauthenticated socket has no session.userId — refuse it
    // the same way requireAuth refuses an unauthenticated HTTP request.
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // A personal room named after the user's id: the server can push a
    // message to "whoever is userId", regardless of which page/tab they
    // have open, without tracking socket ids itself.
    socket.join(userId);

    // Joining a group's chat room happens here, at connect time, rather than
    // at the moment someone clicks "join group" — a plain HTTP request has
    // no socket to join a room with. This means every group the user is
    // currently a member of becomes live the next time they load any page
    // (which re-opens the socket connection).
    try {
      const myGroups = await Group.find({ members: userId }).select('_id');
      myGroups.forEach((g) => socket.join(Message.roomForGroup(g._id)));
    } catch (err) {
      console.error('failed to join group rooms', err);
    }

    socket.on('chat:send', async ({ recipientId, groupId, text }) => {
      if (typeof text !== 'string' || !text.trim()) return;
      const trimmedText = text.trim();

      try {
        if (groupId) {
          const group = await Group.findById(groupId);
          if (!group || !group.isMember(userId)) {
            socket.emit('chat:error', { error: 'את/ה לא חבר/ה בקבוצה הזו' });
            return;
          }

          const roomId = Message.roomForGroup(groupId);
          const [message, sender] = await Promise.all([
            Message.create({ roomId, sender: userId, group: groupId, text: trimmedText }),
            User.findById(userId).select('displayName'),
          ]);

          io.to(roomId).emit('chat:message', {
            _id: message._id,
            roomId,
            sender: userId,
            senderName: sender ? sender.displayName : '',
            group: groupId,
            text: message.text,
            createdAt: message.createdAt,
          });
        } else if (recipientId) {
          const allowed = await canMessage(userId, recipientId);
          if (!allowed) {
            socket.emit('chat:error', { error: 'אין עדיין צ׳אט פתוח עם המשתמש הזה — נדרש אישור בקשה קודם' });
            return;
          }

          const roomId = Message.roomFor(userId, recipientId);
          const message = await Message.create({ roomId, sender: userId, recipient: recipientId, text: trimmedText });

          const payload = {
            _id: message._id,
            roomId,
            sender: userId,
            recipient: recipientId,
            text: message.text,
            createdAt: message.createdAt,
          };

          // Deliver to both participants — the sender's other open tabs get
          // it too, and it doubles as the sender's own delivery confirmation.
          io.to(userId).to(recipientId).emit('chat:message', payload);
        } else {
          return;
        }

        if (SUSPICIOUS_PATTERN.test(trimmedText)) {
          socket.emit('chat:safety-warning', {
            message: 'לתשומת לבך: מומלץ להמשיך את התקשורת בתוך האפליקציה ולא למסור פרטים אישיים.',
          });
        }
      } catch (err) {
        console.error('chat:send failed', err);
      }
    });
  });
}

module.exports = registerChatHandlers;
