const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    body: {
        type: String,
        required: true,
    },
    // image: {
    //     type: String,
    //     required: true,
    // },
},

    {timestamps: true}
);

module.exports = mongoose.model('Blog', blogSchema);
 
