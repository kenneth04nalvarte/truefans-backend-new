const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseAdmin');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { generatePassId } = require('../utils/qrcode');
const { sendDigitalPass } = require('../utils/email');
const passNinjaService = require('../services/passNinjaService');
const auth = require('../middleware/auth');
const fs = require('fs');
const generatePass = require('../generatePass.js');

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Generate a new digital pass for a diner (no auth required)
router.post('/generate', async (req, res) => {
    try {
        const { name, phone, birthday, brandId, locationId } = req.body;
        console.log('Received body:', req.body); // Log incoming body for debugging
        if (!brandId || !locationId) {
            return res.status(400).json({ success: false, error: 'Missing brandId or locationId' });
        }
        // Find location by brandId and locationId
        const locationDoc = await db.collection('brands').doc(brandId).collection('locations').doc(locationId).get();
        if (!locationDoc.exists) {
            return res.status(404).json({ success: false, error: 'Location not found' });
        }
        const location = locationDoc.data();
        // Create a dummy user object for PassNinja
        const user = { firstName: name, lastName: '', phone, birthday };
        // Generate unique pass ID
        const passId = generatePassId();
        // Generate the pass using our own code
        const passPath = await generatePass({
            serialNumber: passId,
            restaurantName: location.name,
            description: 'Restaurant Loyalty Pass',
            // modelFolder: ... (add if you want to specify a custom model)
        });
        // Stream the .pkpass file to the client
        res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
        res.setHeader('Content-Disposition', `attachment; filename="pass.pkpass"`);
        const fileStream = fs.createReadStream(passPath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error generating digital pass:', error);
        res.status(500).json({ success: false, error: 'Failed to generate digital pass' });
    }
});

// Get all digital passes for a user (authenticated)
router.get('/user', auth, async (req, res) => {
    try {
        const snapshot = await db.collection('digitalPasses').where('userId', '==', req.user.id).get();
        const passes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({
            success: true,
            data: passes
        });
    } catch (error) {
        console.error('Error fetching digital passes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch digital passes'
        });
    }
});

// Get a specific digital pass (authenticated)
router.get('/:passId', auth, async (req, res) => {
    try {
        const snapshot = await db.collection('digitalPasses').where('passId', '==', req.params.passId).where('userId', '==', req.user.id).get();
        if (snapshot.empty) {
            return res.status(404).json({
                success: false,
                error: 'Digital pass not found'
            });
        }
        const pass = snapshot.docs[0].data();
        res.json({
            success: true,
            data: pass
        });
    } catch (error) {
        console.error('Error fetching digital pass:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch digital pass'
        });
    }
});

// Update pass points/visits (authenticated)
router.put('/:passId/update', auth, async (req, res) => {
    try {
        const { points, visits } = req.body;
        const snapshot = await db.collection('digitalPasses').where('passId', '==', req.params.passId).where('userId', '==', req.user.id).get();
        if (snapshot.empty) {
            return res.status(404).json({
                success: false,
                error: 'Digital pass not found'
            });
        }
        const docRef = snapshot.docs[0].ref;
        const updateData = { lastUsed: new Date() };
        if (points !== undefined) updateData.points = points;
        if (visits !== undefined) updateData.visits = visits;
        await docRef.update(updateData);
        const updatedDoc = await docRef.get();
        res.json({
            success: true,
            data: updatedDoc.data()
        });
    } catch (error) {
        console.error('Error updating digital pass:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update digital pass'
        });
    }
});

// Validate a digital pass (for restaurant staff)
router.post('/validate', auth, async (req, res) => {
    try {
        const { passId } = req.body;
        const restaurantId = req.user.restaurantId; // Assuming restaurant staff are authenticated
        const snapshot = await db.collection('digitalPasses')
            .where('passId', '==', passId)
            .where('restaurantId', '==', restaurantId)
            .where('isActive', '==', true)
            .where('status', '==', 'active')
            .get();
        if (snapshot.empty) {
            return res.status(404).json({
                success: false,
                error: 'Invalid or expired digital pass'
            });
        }
        const docRef = snapshot.docs[0].ref;
        await docRef.update({ lastUsed: new Date(), visits: (snapshot.docs[0].data().visits || 0) + 1 });
        const updatedDoc = await docRef.get();
        res.json({
            success: true,
            data: {
                isValid: true,
                user: updatedDoc.data().userId,
                points: updatedDoc.data().points,
                visits: updatedDoc.data().visits
            }
        });
    } catch (error) {
        console.error('Error validating digital pass:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate digital pass'
        });
    }
});

// Generate wallet pass file
router.get('/:passId/wallet', async (req, res) => {
    try {
        const snapshot = await db.collection('digitalPasses').where('passId', '==', req.params.passId).get();
        if (snapshot.empty) {
            return res.status(404).json({ message: 'Pass not found' });
        }
        const pass = snapshot.docs[0].data();
        // Generate pass file based on platform (iOS/Android)
        const platform = req.query.platform || 'ios';
        const passFile = JSON.stringify({ ...pass, platform });
        res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
        res.setHeader('Content-Disposition', `attachment; filename="pass.pkpass"`);
        res.send(passFile);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 