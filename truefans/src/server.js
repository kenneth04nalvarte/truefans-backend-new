const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const securityMiddleware = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');
const admin = require('firebase-admin');

// Load environment variables
console.log('Server starting...');
dotenv.config();
console.log('Environment variables loaded');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    });
    console.log('Firebase Admin initialized');
}

const app = express();

// Apply security middleware
securityMiddleware(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/users', require('./routes/users'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/digital-passes', require('./routes/digitalPasses'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Root route for API
app.get('/', (req, res) => {
    res.send('Minimal server is running!');
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../public')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../public', 'index.html'));
    });
}

// Error handling middleware (should be last)
app.use(errorHandler);

// For Vercel serverless deployment, export the app instead of listening
module.exports = app;