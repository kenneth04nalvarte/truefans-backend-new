const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseAdmin');
const geolib = require('geolib');

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, birthday, referralSource } = req.body;
        const userData = {
            firstName,
            lastName,
            email,
            phone,
            birthday,
            referralSource,
            location: null, // initially no location
            createdAt: new Date()
        };
        const docRef = await db.collection('users').add(userData);
        const user = { id: docRef.id, ...userData };
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update user location
router.post('/:id/location', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const docRef = db.collection('users').doc(req.params.id);
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }
        await docRef.update({ location: { latitude, longitude } });
        res.json({ message: 'Location updated successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get nearby restaurants
router.get('/:id/nearby-restaurants', async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.params.id).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userDoc.data();
        if (!user.location) {
            return res.status(400).json({ message: 'User location not set' });
        }
        const { latitude, longitude } = user.location;
        // Get all restaurants
        const snapshot = await db.collection('restaurants').get();
        const allRestaurants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter restaurants within 500 meters
        const nearby = allRestaurants.filter(r => {
            if (!r.location || !r.location.latitude || !r.location.longitude) return false;
            const dist = geolib.getDistance(
                { latitude, longitude },
                { latitude: r.location.latitude, longitude: r.location.longitude }
            );
            return dist <= 500;
        });
        res.json(nearby);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 