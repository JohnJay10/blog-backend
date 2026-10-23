const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const { saveImage, deleteImage } = require('../middleware/imageUpload');

const canManage = (blog, user) => (
    user.role === 'admin' || (blog.author && blog.author.equals(user._id))
);

exports.getAllBlogs = async (req, res) => {
    try {
        const { q, category, sort } = req.query;
        const filter = {};
        if (category && category !== 'All stories') {
            filter.category = category;
        }
        if (q && q.trim()) {
            const escapedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$or = [
                { title: { $regex: escapedQuery, $options: 'i' } },
                { body: { $regex: escapedQuery, $options: 'i' } },
                { category: { $regex: escapedQuery, $options: 'i' } },
            ];
        }
        const order = sort === 'popular' ? { views: -1, createdAt: -1 } : { createdAt: -1 };
        const parsedLimit = Number.parseInt(req.query.limit, 10);
        const limit = Number.isInteger(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 30;
        const blogs = await Blog.find(filter)
            .populate('author', 'username')
            .sort(order)
            .limit(limit);
        res.status(200).json({ success: true, data: blogs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBlogById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }
        const blog = await Blog.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        ).populate('author', 'username');
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.status(200).json({ success: true, data: blog });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createBlog = async (req, res) => {
    let image;
    try {
        const { title, body, category = 'Stories' } = req.body;
        image = await saveImage(req.file);
        const blog = await Blog.create({
            title,
            body,
            image: image || '',
            category,
            author: req.user._id,
        });
        await blog.populate('author', 'username');
        res.status(201).json({ success: true, data: blog });
    } catch (error) {
        if (image) await deleteImage(image);
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        res.status(400).json({ message: error.message });
    }
};

exports.editBlog = async (req, res) => {
    let replacementImage;
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        if (!canManage(blog, req.user)) {
            return res.status(403).json({ message: 'You can only edit your own posts' });
        }
        if (req.file && req.body.removeImage === 'true') {
            return res.status(400).json({ message: 'Choose either a replacement image or remove the current image, not both' });
        }
        const { title, body, category } = req.body;
        const previousImage = blog.image;
        replacementImage = await saveImage(req.file);
        if (title !== undefined) blog.title = title;
        if (body !== undefined) blog.body = body;
        if (replacementImage) blog.image = replacementImage;
        if (req.body.removeImage === 'true') blog.image = '';
        if (category !== undefined) blog.category = category;
        await blog.save();
        await blog.populate('author', 'username');
        if (previousImage && (replacementImage || req.body.removeImage === 'true')) {
            await deleteImage(previousImage);
        }
        res.status(200).json({ success: true, data: blog });
    } catch (error) {
        if (replacementImage) await deleteImage(replacementImage);
        if (error.status) {
            return res.status(error.status).json({ message: error.message });
        }
        res.status(400).json({ message: error.message });
    }
};

exports.deleteBlog = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        if (!canManage(blog, req.user)) {
            return res.status(403).json({ message: 'You can only delete your own posts' });
        }
        await Promise.all([
            blog.deleteOne(),
            Comment.deleteMany({ blog: blog._id }),
        ]);
        await deleteImage(blog.image);
        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.toggleLike = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        const alreadyLiked = blog.likes.some((userId) => userId.equals(req.user._id));
        const update = alreadyLiked
            ? { $pull: { likes: req.user._id } }
            : { $addToSet: { likes: req.user._id } };
        const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, update, { new: true });
        res.status(200).json({
            success: true,
            data: {
                likes: updatedBlog.likes.length,
                liked: !alreadyLiked,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getComments = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }
        const blogExists = await Blog.exists({ _id: req.params.id });
        if (!blogExists) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        const comments = await Comment.find({ blog: req.params.id })
            .populate('author', 'username')
            .sort({ createdAt: -1 })
            .limit(100);
        res.status(200).json({ success: true, data: comments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createComment = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        const comment = await Comment.create({
            blog: blog._id,
            author: req.user._id,
            body: req.body.body,
        });
        await comment.populate('author', 'username');
        await Blog.updateOne({ _id: blog._id }, { $inc: { commentCount: 1 } });
        res.status(201).json({ success: true, data: comment });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
