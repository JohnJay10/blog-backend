const express = require('express');
const router = express.Router();
const {
    getAllBlogs,
    createBlog,
    editBlog,
    getBlogById,
    deleteBlog,
    toggleLike,
    getComments,
    createComment,
} = require('../controllers/blogController');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/imageUpload');

// @route   GET /api/blogs
router.get('/', getAllBlogs);

// @route   POST /api/blogs
router.post('/', protect, uploadImage, createBlog);

router.get('/:id/comments', getComments);
router.post('/:id/comments', protect, createComment);
router.post('/:id/like', protect, toggleLike);

// @route   PUT /api/blogs/:id
router.put('/:id', protect, uploadImage, editBlog);

// @route   GET /api/blogs/:id
router.get('/:id', getBlogById);

// @route   DELETE /api/blogs/:id
router.delete('/:id', protect, deleteBlog);


module.exports = router;