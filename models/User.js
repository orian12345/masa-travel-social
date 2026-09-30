const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
    age: { type: Number, min: 18, max: 120 },
    bio: { type: String, default: '', maxlength: 400 },
    languages: { type: [String], default: [] },
    travelStyle: {
      type: String,
      enum: ['backpacking', 'relaxed', 'museums', 'nightlife', 'family'],
      default: 'relaxed',
    },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Runs automatically before every save() — so callers never hash passwords
// themselves, and can't accidentally save a plaintext one.
// An async middleware function signals completion via its returned promise
// — it must not also declare/call a `next` callback (that combination is
// what newer Mongoose (9.x) throws on: "next is not a function").
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

userSchema.methods.checkPassword = function checkPassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Never send the hash to a client, even by accident (res.json(user), etc.)
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
