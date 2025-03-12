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
    profilePic: { type: String, default: '/images/default_profilepic.jpg'}, //for profile picture
    description: { type: String },
    role: { type: String, enum: ['student', 'labtech'], default: 'student' },
    isActivated: { type: Boolean, default: false },             // If account for deletion: can deactivate first
    activationToken: { type: String },                          // Token for emails activation / verification; can delete
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
