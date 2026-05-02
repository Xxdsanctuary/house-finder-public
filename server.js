const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
require('dotenv').config({ path: './config/config.env' });
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// MongoDB connection reliability purpose
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { index: false }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecretkey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Make current user available in all views
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

// Mount Room Routes
const roomRoutes = require('./routes/roomRoutes');
app.use('/rooms', roomRoutes);

// Mount Listing Routes
const listingRoutes = require('./routes/listingRoutes');
app.use('/listings', listingRoutes);

// Mount Request Routes
const requestRoutes = require('./routes/requestRoutes');
app.use('/requests', requestRoutes);

// Mount Message Routes
const messageRoutes = require('./routes/messageRoutes');
app.use('/messages', messageRoutes);

// Mount Announcement Routes
const announcementRoutes = require('./routes/announcementRoutes');
app.use('/', announcementRoutes);

// Mount Comment Routes
const commentRoutes  = require('./routes/commentRoutes');
app.use('/listings/:listingId/comments', commentRoutes);

// Mount Shortlist Routes
const shortlistRoutes = require('./routes/shortlistRoutes');
app.use('/shortlist', shortlistRoutes);

// Mount Auth Routes
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

// Mount Profile Routes
const profileRoutes = require('./routes/profileRoutes');
app.use('/profile', profileRoutes);

// Mount Admin Routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);

// Database connection
async function connectDB() {
    try {
        await mongoose.connect(process.env.DB);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

function startServer() {
    const hostname = "localhost";
    const port = process.env.PORT || 8000;

    app.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    });
}

app.use(notFound)
app.use(errorHandler)

connectDB().then(startServer);

