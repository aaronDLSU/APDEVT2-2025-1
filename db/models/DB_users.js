const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userId: {
        type: Number,
        unique: true
      },
    username: {type: String},
    name: { type: String},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },                 // Should be hashed
    profilePic: { type: String, default: 'default_profilepic'}, //for profile picture
    description: { type: String },
    role: { type: String, enum: ['student', 'labtech'], default: 'student' },
    isActivated: { type: Boolean, default: false },             // If account for deletion: can deactivate first
    activationToken: { type: String },                          // Token for emails activation / verification; can delete
    createdAt: { type: Date, default: Date.now }
});

async function getNextUserId() {
    const result = await db.users.findOneAndUpdate(
      { _id: "userId" },
      { $inc: { sequence_value: 1 } },
      { returnDocument: "after", upsert: true }
    );
    return result.value.sequence_value;
  }

UserSchema.pre('save', async function(next) {
    if (!this.isNew) return next();
    
    try {
      this.userId = await getNextUserId();
      next();
    } catch (err) {
      next(err);
    }
  });  

const User = mongoose.model('User', UserSchema);
module.exports = User;