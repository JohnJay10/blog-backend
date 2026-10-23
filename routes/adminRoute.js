const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');
const {
    createAuthor,
    getUsers,
    deleteUser,
    getAdminBlogs,
} = require('../controllers/adminController');

router.use(protect, requireAdmin);

router.get('/users', getUsers);
router.post('/authors', createAuthor);
router.delete('/users/:id', deleteUser);
router.get('/blogs', getAdminBlogs);

module.exports = router;
