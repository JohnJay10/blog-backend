const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { deleteImage } = require('../middleware/imageUpload');

exports.getUsers = async (req, res) => {
    try {
        const parsedLimit = Number.parseInt(req.query.limit, 10);
        const parsedPage = Number.parseInt(req.query.page, 10);
        const limit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50;
        const page = Number.isInteger(parsedPage) ? Math.max(parsedPage, 1) : 1;
        const [users, total, roleCounts] = await Promise.all([
            User.find().select('username email role createdAt').sort({ createdAt: -1 })
                .skip((page - 1) * limit).limit(limit).lean(),
            User.countDocuments(),
            User.aggregate([
                { $group: { _id: '$role', count: { $sum: 1 } } },
            ]),
        ]);
        res.status(200).json({
            success: true,
            data: users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            roleCounts: Object.fromEntries(roleCounts.map(({ _id, count }) => [_id, count])),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createAuthor = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (typeof username !== 'string' || !username.trim()
            || typeof email !== 'string' || !email.trim()
            || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ message: 'Provide a username, valid email, and password of at least 6 characters' });
        }

        const author = await User.create({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
            role: 'author',
        });
        res.status(201).json({
            success: true,
            data: {
                id: author._id,
                username: author.username,
                email: author.email,
                role: author.role,
                createdAt: author.createdAt,
            },
        });
    } catch (error) {
        const isDuplicate = error.code === 11000;
        res.status(isDuplicate ? 409 : 400).json({
            message: isDuplicate ? 'That username or email is already in use' : error.message,
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        if (String(req.user._id) === req.params.id) {
            return res.status(400).json({ message: 'You cannot delete your own admin account' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role === 'admin' && await User.countDocuments({ role: 'admin' }) <= 1) {
            return res.status(400).json({ message: 'The last admin account cannot be deleted' });
        }

        const authoredBlogs = await Blog.find({ author: user._id }).select('_id image').lean();
        const blogIds = authoredBlogs.map((blog) => blog._id);
        const deletedCommentCounts = await Comment.aggregate([
            { $match: { author: user._id, blog: { $nin: blogIds } } },
            { $group: { _id: '$blog', count: { $sum: 1 } } },
        ]);
        await Promise.all([
            User.deleteOne({ _id: user._id }),
            Blog.deleteMany({ author: user._id }),
            Blog.updateMany({ likes: user._id }, { $pull: { likes: user._id } }),
            Comment.deleteMany({ $or: [{ author: user._id }, { blog: { $in: blogIds } }] }),
        ]);
        await Promise.all(deletedCommentCounts.map(({ _id, count }) => (
            Blog.updateOne({ _id }, [
                { $set: { commentCount: { $max: [0, { $subtract: ['$commentCount', count] }] } } },
            ])
        )));
        await Promise.all(authoredBlogs.map((blog) => deleteImage(blog.image)));
        res.status(200).json({ success: true, message: 'User and associated content deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAdminBlogs = async (req, res) => {
    try {
        const parsedLimit = Number.parseInt(req.query.limit, 10);
        const parsedPage = Number.parseInt(req.query.page, 10);
        const limit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 50;
        const page = Number.isInteger(parsedPage) ? Math.max(parsedPage, 1) : 1;
        const [blogs, total] = await Promise.all([
            Blog.find().populate('author', 'username email').sort({ createdAt: -1 })
                .skip((page - 1) * limit).limit(limit).lean(),
            Blog.countDocuments(),
        ]);
        res.status(200).json({
            success: true,
            data: blogs,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
