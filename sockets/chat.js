const Message = require('../models/Message');
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
  io.on('connection', (socket) => {
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

    socket.on('chat:send', async ({ recipientId, text }) => {
      if (!recipientId || typeof text !== 'string' || !text.trim()) return;

      try {
        const allowed = await canMessage(userId, recipientId);
        if (!allowed) {
          socket.emit('chat:error', { error: 'אין עדיין צ׳אט פתוח עם המשתמש הזה — נדרש אישור בקשה קודם' });
          return;
        }

        const trimmedText = text.trim();
        const roomId = Message.roomFor(userId, recipientId);
        const message = await Message.create({
          roomId,
          sender: userId,
          recipient: recipientId,
          text: trimmedText,
        });

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
