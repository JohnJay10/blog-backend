const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    blog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true,
        index: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    body: {
        type: String,
        required: true,
        trim: true,
        maxlength: [2000, 'Comment cannot be more than 2,000 characters'],
    },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
