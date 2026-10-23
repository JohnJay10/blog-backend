require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function promoteAdmin() {
    const email = process.argv[2];
    if (!email) {
        throw new Error('Usage: npm run promote-admin -- existing-user@example.com');
    }
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not configured');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    try {
        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            throw new Error(`No account exists for ${email}. Register this account first.`);
        }
        if (user.role === 'admin') {
            console.log(`${user.email} is already an admin.`);
            return;
        }
        user.role = 'admin';
        await user.save();
        console.log(`${user.email} is now an admin. Refresh the site to open the admin dashboard.`);
    } finally {
        await mongoose.disconnect();
    }
}

promoteAdmin().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
