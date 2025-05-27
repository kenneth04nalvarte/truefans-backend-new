const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebaseAdmin');

// Register a new user
router.post('/register', async (req, res) => {
    console.log('Register endpoint hit', req.body);
    try {
        const { email, password, firstName, lastName } = req.body;

        // Check if user already exists in Firestore
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();
        if (!snapshot.empty) {
            return res.status(400).json({
                success: false,
                error: 'User already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user in Firestore
        const newUserRef = await usersRef.add({
            email,
            password: hashedPassword,
            firstName,
            lastName
        });

        // Create JWT token
        const payload = {
            user: {
                id: newUserRef.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    success: true,
                    token
                });
            }
        );
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists in Firestore
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();
        if (snapshot.empty) {
            return res.status(400).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // There should only be one user with this email
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        // Check password
        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Create JWT token
        const payload = {
            user: {
                id: userDoc.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    success: true,
                    token
                });
            }
        );
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        // req.user.id should be set by authentication middleware
        const userId = req.user && req.user.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        const userData = userDoc.data();
        // Do not return password
        delete userData.password;
        res.json({
            success: true,
            data: userData
        });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});

module.exports = router; 
