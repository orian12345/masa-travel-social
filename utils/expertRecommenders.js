const mongoose = require('mongoose');
const Post = require('../models/Post');

// A user counts as an "expert recommender" (the badge from the original
// product spec) once the recommendation-type posts they've authored have
// collected enough likes combined — a live community-rating signal rather
// than something stored and allowed to go stale.
const EXPERT_LIKE_THRESHOLD = 3;

async function getExpertAuthorIds(authorIds) {
  // Aggregate pipelines bypass Mongoose's usual query-casting, so string ids
  // (e.g. from req.session.userId or a .toString()'d populated _id) must be
  // cast to ObjectId by hand or $in simply won't match anything.
  const ids = authorIds.filter(Boolean).map((id) => new mongoose.Types.ObjectId(id));
  if (!ids.length) return new Set();

  const rows = await Post.aggregate([
    { $match: { type: 'recommendation', author: { $in: ids } } },
    { $project: { author: 1, likeCount: { $size: { $ifNull: ['$likes', []] } } } },
    { $group: { _id: '$author', totalLikes: { $sum: '$likeCount' } } },
    { $match: { totalLikes: { $gte: EXPERT_LIKE_THRESHOLD } } },
  ]);

  return new Set(rows.map((r) => r._id.toString()));
}

module.exports = { getExpertAuthorIds, EXPERT_LIKE_THRESHOLD };
