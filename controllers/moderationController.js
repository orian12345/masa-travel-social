const Block = require('../models/Block');
const Report = require('../models/Report');

exports.block = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.session.userId) {
      return res.status(400).json({ error: 'לא ניתן לחסום את עצמך' });
    }
    await Block.updateOne(
      { blocker: req.session.userId, blocked: userId },
      { blocker: req.session.userId, blocked: userId },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בחסימת המשתמש' });
  }
};

exports.unblock = async (req, res) => {
  try {
    await Block.deleteOne({ blocker: req.session.userId, blocked: req.params.userId });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בביטול החסימה' });
  }
};

exports.listBlocked = async (req, res) => {
  try {
    const blocks = await Block.find({ blocker: req.session.userId }).populate('blocked', 'displayName').lean();
    res.json(blocks.map((b) => b.blocked));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בטעינת רשימת החסומים' });
  }
};

exports.report = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'נא לפרט את סיבת הדיווח' });
    }
    await Report.create({ reporter: req.session.userId, reportedUser: userId, reason: reason.trim() });
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בשליחת הדיווח' });
  }
};
