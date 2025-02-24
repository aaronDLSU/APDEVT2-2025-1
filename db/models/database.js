const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
    email: String,
    password: String,
    role:String
});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post


