const Group = require('../models/Group');

exports.list = async (req, res) => {
  try {
    const { destination } = req.query;
    const query = destination ? { destination: { $regex: destination, $options: 'i' } } : {};
    const groups = await Group.find(query).populate('admin', 'displayName').lean();
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בטעינת הקבוצות' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('admin', 'displayName').populate('members', 'displayName').lean();
    if (!group) return res.status(404).json({ error: 'הקבוצה לא נמצאה' });
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בטעינת הקבוצה' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, destination, description } = req.body;
    if (!name || !destination) {
      return res.status(400).json({ error: 'נא למלא שם ויעד לקבוצה' });
    }

    // The creator is the group's admin and its first member.
    const group = await Group.create({
      name,
      destination,
      description,
      admin: req.session.userId,
      members: [req.session.userId],
    });

    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה ביצירת הקבוצה' });
  }
};

exports.update = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'הקבוצה לא נמצאה' });
    if (!group.isAdmin(req.session.userId)) {
      return res.status(403).json({ error: 'רק מנהל/ת הקבוצה יכול/ה לערוך אותה' });
    }

    const { name, destination, description } = req.body;
    if (name) group.name = name;
    if (destination) group.destination = destination;
    if (description !== undefined) group.description = description;

    await group.save();
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בעדכון הקבוצה' });
  }
};

exports.remove = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'הקבוצה לא נמצאה' });
    if (!group.isAdmin(req.session.userId)) {
      return res.status(403).json({ error: 'רק מנהל/ת הקבוצה יכול/ה למחוק אותה' });
    }

    await group.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה במחיקת הקבוצה' });
  }
};

exports.join = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'הקבוצה לא נמצאה' });
    if (!group.isMember(req.session.userId)) {
      group.members.push(req.session.userId);
      await group.save();
    }
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בהצטרפות לקבוצה' });
  }
};

exports.leave = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'הקבוצה לא נמצאה' });
    if (group.isAdmin(req.session.userId)) {
      return res.status(400).json({ error: 'מנהל/ת הקבוצה לא יכול/ה לעזוב — יש למחוק את הקבוצה או להעביר ניהול' });
    }
    group.members = group.members.filter((m) => m.toString() !== req.session.userId);
    await group.save();
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בעזיבת הקבוצה' });
  }
};
