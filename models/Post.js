const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    type: { type: String, enum: ['partner', 'recommendation'], required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    content: { type: String, required: true, maxlength: 1000 },
    destination: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    budgetPerDay: { type: Number, min: 0 },
    tripDate: { type: Date },
    // Only meaningful for type: 'partner'. The author defines up to 3
    // multiple-choice questions; anyone requesting to join must answer them
    // before the author decides whether to approve the chat request.
    screeningQuestions: {
      type: [
        {
          question: { type: String, required: true, maxlength: 200 },
          options: { type: [String], required: true, validate: (v) => v.length >= 2 && v.length <= 6 },
        },
      ],
      default: [],
      validate: (v) => v.length <= 3,
    },
  },
  { timestamps: true }
);

// Supports the required search: destination + tags + date range, all in one query.
postSchema.index({ destination: 'text', title: 'text', content: 'text' });

module.exports = mongoose.model('Post', postSchema);
