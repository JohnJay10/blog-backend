const Blog = require('../models/Blog');

// @desc    Get all blogs

exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get a single blog by ID

exports.getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.status(200).json({status: 'success', data: blog});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Create a new blog
exports.createBlog = async (req, res) => {
    try {
        const { title, body } = req.body;
        const newBlog = new Blog({ title, body });
        const savedBlog = await newBlog.save();
        res.status(201).json({success: true, data: savedBlog});
    } catch (error) {
        res.status(400).json({ message: error.message });
    }   
};

// Edit an existing blog
exports.editBlog = async (req, res) => {
    try {
        const { title, body } = req.body;
        let blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        blog.title = title || blog.title;
        blog.body = body || blog.body;

        await blog.save();
        res.status(200).json({success: true, data: blog});
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a blog
exports.deleteBlog = async (req, res) => { 
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        await blog.deleteOne();
        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

