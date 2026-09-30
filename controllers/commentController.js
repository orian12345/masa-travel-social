const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.list = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'displayName verified')
      .sort({ createdAt: 1 })
      .lean();
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בטעינת התגובות' });
  }
};

exports.create = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'התגובה לא יכולה להיות ריקה' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'הפוסט לא נמצא' });

    const comment = await Comment.create({
      post: req.params.postId,
      author: req.session.userId,
      text: text.trim(),
    });
    await comment.populate('author', 'displayName verified');

    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה בפרסום התגובה' });
  }
};

exports.remove = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'התגובה לא נמצאה' });
    if (comment.author.toString() !== req.session.userId) {
      return res.status(403).json({ error: 'ניתן למחוק רק תגובות שכתבת' });
    }
    await comment.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'שגיאה במחיקת התגובה' });
  }
};
