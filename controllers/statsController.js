const Post = require('../models/Post');
const Group = require('../models/Group');

// Chart 1: post count per group — reflects live DB state every time it's
// called, never a precomputed/static snapshot.
exports.postsPerGroup = async (req, res) => {
  try {
    const groups = await Group.find().select('name').lean();
    const counts = await Post.aggregate([
      { $match: { group: { $ne: null } } },
      { $group: { _id: '$group', count: { $sum: 1 } } },
    ]);
    const countByGroup = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

    const data = groups.map((g) => ({ label: g.name, value: countByGroup[g._id.toString()] || 0 }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בטעינת הנתונים הסטטיסטיים' });
  }
};

// Chart 2: posts created per month, for the last 6 months.
exports.postsPerMonth = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const results = await Post.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const data = results.map((r) => ({
      label: `${r._id.month}/${r._id.year}`,
      value: r.count,
    }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בטעינת הנתונים הסטטיסטיים' });
  }
};
