const User = require('../models/User');

// List/search travelers — at least 3 combinable parameters: language,
// travel style, min age (requirement #20's second search, plus the
// original spec's "advanced filter: age / language / travel style /
// verified").
exports.search = async (req, res) => {
  try {
    const { language, travelStyle, minAge, verifiedOnly } = req.query;
    const query = {};

    if (language) query.languages = language;
    if (travelStyle) query.travelStyle = travelStyle;
    if (minAge) query.age = { $gte: Number(minAge) };
    if (verifiedOnly === 'true') query.verified = true;

    const users = await User.find(query).select('-passwordHash').limit(100).lean();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בחיפוש משתמשים' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash').lean();
    if (!user) return res.status(404).json({ error: 'המשתמש לא נמצא' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בטעינת הפרופיל' });
  }
};

// A user may only ever update their own profile — req.params.id must match
// the logged-in session, there is no "edit someone else's profile" case.
exports.updateProfile = async (req, res) => {
  try {
    if (req.params.id !== req.session.userId) {
      return res.status(403).json({ error: 'ניתן לערוך רק את הפרופיל שלך' });
    }

    const { displayName, age, bio, languages, travelStyle } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'המשתמש לא נמצא' });

    if (displayName) user.displayName = displayName;
    if (age) user.age = age;
    if (bio !== undefined) user.bio = bio;
    if (languages) user.languages = Array.isArray(languages) ? languages : String(languages).split(',').map((l) => l.trim());
    if (travelStyle) user.travelStyle = travelStyle;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בעדכון הפרופיל' });
  }
};

// Marks the profile verified after the live-camera selfie capture (the
// React Video+Canvas component). Deliberately a separate endpoint from
// updateProfile — "verified" isn't a field a user should be able to set
// through a generic profile edit, only through the capture flow itself.
exports.verifySelfie = async (req, res) => {
  try {
    if (req.params.id !== req.session.userId) {
      return res.status(403).json({ error: 'ניתן לאמת רק את הפרופיל שלך' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { verified: true }, { new: true });
    if (!user) return res.status(404).json({ error: 'המשתמש לא נמצא' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה באימות הפרופיל' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    if (req.params.id !== req.session.userId) {
      return res.status(403).json({ error: 'ניתן למחוק רק את החשבון שלך' });
    }
    await User.findByIdAndDelete(req.params.id);
    req.session.destroy(() => {
      res.json({ success: true });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה במחיקת החשבון' });
  }
};
