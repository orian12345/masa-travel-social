const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    description: { type: String, default: '', maxlength: 500 },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

groupSchema.methods.isAdmin = function isAdmin(userId) {
  return this.admin.toString() === userId.toString();
};

groupSchema.methods.isMember = function isMember(userId) {
  return this.members.some((m) => m.toString() === userId.toString());
};

module.exports = mongoose.model('Group', groupSchema);
