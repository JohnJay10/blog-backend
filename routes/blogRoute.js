const express = require('express');
const router = express.Router();
const { getAllBlogs, createBlog, editBlog, getBlogById, deleteBlog } = require('../controllers/blogController');
const { protect } = require('../middleware/auth');

// @route   GET /api/blogs
router.get('/', getAllBlogs);

// @route   POST /api/blogs
router.post('/', protect, createBlog);


// @route   PUT /api/blogs/:id
router.put('/:id', editBlog);

// @route   GET /api/blogs/:id
router.get('/:id', getBlogById);

// @route   DELETE /api/blogs/:id
router.delete('/:id', deleteBlog);


module.exports = router;