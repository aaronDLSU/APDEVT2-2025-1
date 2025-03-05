const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, default: 'student', unique: true },
    name: { type: String},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },                 // Should be hashed
    profilePic: { type: String }, //for profile picture
    description: { type: String },
    role: { type: String, enum: ['student', 'labtech'], default: 'student' },
    isActivated: { type: Boolean, default: false },             // If account for deletion: can deactivate first
    activationToken: { type: String },                          // Token for emails activation / verification; can delete
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;