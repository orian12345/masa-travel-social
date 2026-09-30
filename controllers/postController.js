const Post = require('../models/Post');
const Group = require('../models/Group');

// Feed = every standalone post (not tied to a group) from any user, plus my
// own posts and posts from groups I'm a member of. Group-scoped posts stay
// hidden from non-members here — that's requirement #21's example ("a user
// can't see posts in a private group they're not a member of"), which still
// applies even though the rest of the feed is now global on request.
exports.listFeed = async (req, res) => {
  try {
    const myGroups = await Group.find({ members: req.session.userId }).select('_id');
    const groupIds = myGroups.map((g) => g._id);

    const posts = await Post.find({
      $or: [{ group: null }, { author: req.session.userId }, { group: { $in: groupIds } }],
    })
      .populate('author', 'displayName verified')
      .populate('group', 'name destination')
      .sort({ createdAt: -1 })
      .lean();

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בטעינת הפיד' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'displayName age languages travelStyle verified')
      .populate('group', 'name destination')
      .lean();
    if (!post) return res.status(404).json({ error: 'הפוסט לא נמצא' });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בטעינת הפוסט' });
  }
};

exports.listByGroup = async (req, res) => {
  try {
    const posts = await Post.find({ group: req.params.groupId })
      .populate('author', 'displayName verified')
      .sort({ createdAt: -1 })
      .lean();
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בטעינת פוסטי הקבוצה' });
  }
};

// Search: destination + tag + budget range + type — at least 3 independent
// parameters, all optional and combinable (requirement #20).
exports.search = async (req, res) => {
  try {
    const { destination, tag, type, minBudget, maxBudget } = req.query;
    const query = {};

    if (destination) query.destination = { $regex: destination, $options: 'i' };
    if (type) query.type = type;
    if (tag) query.tags = tag;
    if (minBudget || maxBudget) {
      query.budgetPerDay = {};
      if (minBudget) query.budgetPerDay.$gte = Number(minBudget);
      if (maxBudget) query.budgetPerDay.$lte = Number(maxBudget);
    }

    const posts = await Post.find(query)
      .populate('author', 'displayName verified')
      .populate('group', 'name destination')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בחיפוש' });
  }
};

exports.create = async (req, res) => {
  try {
    const { type, title, content, destination, tags, budgetPerDay, tripDate, groupId, screeningQuestions } = req.body;

    if (!type || !title || !content || !destination) {
      return res.status(400).json({ error: 'נא למלא את כל שדות החובה' });
    }

    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group || !group.isMember(req.session.userId)) {
        return res.status(403).json({ error: 'את/ה לא חבר/ה בקבוצה הזו' });
      }
    }

    // Only "partner" posts get the safety questionnaire — a recommendation
    // post has no join flow to screen anyone for.
    let parsedQuestions = [];
    if (type === 'partner' && Array.isArray(screeningQuestions)) {
      parsedQuestions = screeningQuestions
        .filter((q) => q && q.question && Array.isArray(q.options) && q.options.length >= 2)
        .slice(0, 3);
    }

    const post = await Post.create({
      author: req.session.userId,
      group: groupId || null,
      type,
      title,
      content,
      destination,
      tags: Array.isArray(tags) ? tags : tags ? String(tags).split(',').map((t) => t.trim()) : [],
      budgetPerDay: budgetPerDay || undefined,
      tripDate: tripDate || undefined,
      screeningQuestions: parsedQuestions,
    });

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה ביצירת הפוסט' });
  }
};

// Shared permission check for update/delete: the author, or the admin of
// the group the post belongs to (requirement #21's "broader" group-admin
// privilege), may modify a post — nobody else.
async function canModify(post, userId) {
  if (post.author.toString() === userId.toString()) return true;
  if (post.group) {
    const group = await Group.findById(post.group);
    if (group && group.isAdmin(userId)) return true;
  }
  return false;
}

exports.update = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'הפוסט לא נמצא' });
    if (!(await canModify(post, req.session.userId))) {
      return res.status(403).json({ error: 'אין לך הרשאה לערוך פוסט זה' });
    }

    const { title, content, destination, tags, budgetPerDay, tripDate } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;
    if (destination) post.destination = destination;
    if (tags) post.tags = Array.isArray(tags) ? tags : String(tags).split(',').map((t) => t.trim());
    if (budgetPerDay) post.budgetPerDay = budgetPerDay;
    if (tripDate) post.tripDate = tripDate;

    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בעדכון הפוסט' });
  }
};

exports.remove = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'הפוסט לא נמצא' });
    if (!(await canModify(post, req.session.userId))) {
      return res.status(403).json({ error: 'אין לך הרשאה למחוק פוסט זה' });
    }

    await post.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה במחיקת הפוסט' });
  }
};
