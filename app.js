require('dotenv').config();

const express = require('express');
const path = require('path');
const http = require('http');
const session = require('express-session');
const methodOverride = require('method-override');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const { attachUser } = require('./middleware/auth');
const registerChatHandlers = require('./sockets/chat');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const groupRoutes = require('./routes/groupRoutes');
const messageRoutes = require('./routes/messageRoutes');
const statsRoutes = require('./routes/statsRoutes');
const pageRoutes = require('./routes/pageRoutes');
const chatRequestRoutes = require('./routes/chatRequestRoutes');
const moderationRoutes = require('./routes/moderationRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 1 week
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// A new value every time the server process starts (i.e. every deploy) —
// appended as "?v=" on CSS/JS tags in the views so a phone/browser that
// aggressively cached the old static files is forced to fetch the new ones
// instead of silently running stale JS after a deploy.
app.locals.assetVersion = Date.now();

// Raised from the 100kb default so a base64-encoded post image (see
// models/Post.js) fits in the request body.
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true, limit: '3mb' }));
app.use(methodOverride('_method'));
app.use(sessionMiddleware);
app.use(attachUser);
app.use(express.static(path.join(__dirname, 'public')));

// Server-rendered pages (login/register/home/profile/group/chat shells).
app.use('/', pageRoutes);

// JSON REST API that the client's jQuery Ajax calls hit.
app.use('/', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/chat-requests', chatRequestRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/posts/:postId/comments', commentRoutes);

app.use((req, res) => {
  res.status(404).send('הדף לא נמצא');
});

// Shares the same session with every socket handshake, so
// socket.request.session.userId is the same login as the HTTP session
// (Socket.io v4.6+'s io.engine.use() accepts plain Express middleware).
io.engine.use(sessionMiddleware);
registerChatHandlers(io);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`TravelMatch server running on http://localhost:${PORT}`);
  });
});
