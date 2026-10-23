const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: [120, 'Title cannot be more than 120 characters'],
    },
    body: {
        type: String,
        required: true,
        trim: true,
        maxlength: [50000, 'Story cannot be more than 50,000 characters'],
    },
    image: {
        type: String,
        trim: true,
        default: '',
    },
    category: {
        type: String,
        trim: true,
        default: 'Stories',
        maxlength: [40, 'Category cannot be more than 40 characters'],
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    views: {
        type: Number,
        default: 0,
        min: 0,
    },
    commentCount: {
        type: Number,
        default: 0,
        min: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);
