const User = require('../models/User');

exports.showRegister = (req, res) => {
  res.render('auth/register', { error: null });
};

exports.register = async (req, res) => {
  try {
    const { username, password, displayName, age, travelStyle } = req.body;

    if (!username || !password || !displayName) {
      return res.status(400).render('auth/register', { error: 'נא למלא את כל השדות החובה' });
    }
    if (password.length < 6) {
      return res.status(400).render('auth/register', { error: 'הסיסמה חייבת להכיל לפחות 6 תווים' });
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(400).render('auth/register', { error: 'שם המשתמש הזה כבר תפוס' });
    }

    // passwordHash is hashed automatically by the User model's pre-save hook.
    const user = await User.create({
      username,
      passwordHash: password,
      displayName,
      age: age || undefined,
      travelStyle: travelStyle || undefined,
    });

    req.session.userId = user._id.toString();
    req.session.displayName = user.displayName;
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).render('auth/register', { error: 'משהו השתבש, נסה/י שוב' });
  }
};

exports.showLogin = (req, res) => {
  res.render('auth/login', { error: null });
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: (username || '').toLowerCase() });

    // Same generic error for "no such user" and "wrong password" — never
    // reveal which one it was, that's an account-enumeration leak.
    if (!user || !(await user.checkPassword(password || ''))) {
      return res.status(400).render('auth/login', { error: 'שם משתמש או סיסמה שגויים' });
    }

    req.session.userId = user._id.toString();
    req.session.displayName = user.displayName;
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).render('auth/login', { error: 'משהו השתבש, נסה/י שוב' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
