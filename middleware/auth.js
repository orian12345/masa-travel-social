// Route guard: blocks access to anything under it unless a session user is
// logged in. API requests (jQuery Ajax) get a 401 JSON body; a normal page
// navigation gets redirected to the login page instead.
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ error: 'עליך להתחבר כדי לבצע פעולה זו' });
  }
  return res.redirect('/login');
}

// Makes the logged-in user's id/name available to every EJS view without
// each route handler having to pass it in explicitly.
function attachUser(req, res, next) {
  res.locals.currentUserId = req.session.userId || null;
  res.locals.currentUserName = req.session.displayName || null;
  next();
}

module.exports = { requireAuth, attachUser };
