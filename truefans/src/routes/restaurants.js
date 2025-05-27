const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseAdmin');
const QRCode = require('qrcode');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create new restaurant
router.post('/', async (req, res) => {
    try {
        const { name, owner, location, address, email } = req.body;
        
        // Generate QR code
        const qrData = JSON.stringify({
            timestamp: Date.now()
        });
        const qrCode = await QRCode.toDataURL(qrData);

        // Create Stripe account for the restaurant
        const stripeAccount = await stripe.accounts.create({
            type: 'express',
            country: 'US',
            email: email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
        });

        // Add restaurant to Firestore
        const restaurantData = {
            name,
            owner,
            location,
            address,
            qrCode,
            stripeAccountId: stripeAccount.id,
            createdAt: new Date()
        };
        const docRef = await db.collection('restaurants').add(restaurantData);
        const restaurant = { id: docRef.id, ...restaurantData };

        res.status(201).json({ message: 'Restaurant created successfully', restaurant });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update restaurant promotion
router.put('/:id/promotion', async (req, res) => {
    try {
        const { title, description, discount, validUntil } = req.body;
        const docRef = db.collection('restaurants').doc(req.params.id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const promotion = {
            title,
            description,
            discount,
            validUntil: new Date(validUntil)
        };

        await docRef.update({ currentPromotion: promotion });
        const updatedDoc = await docRef.get();
        res.json({ message: 'Promotion updated successfully', restaurant: { id: updatedDoc.id, ...updatedDoc.data() } });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get restaurant by QR code
router.get('/qr/:qrCode', async (req, res) => {
    try {
        const snapshot = await db.collection('restaurants').where('qrCode', '==', req.params.qrCode).get();
        if (snapshot.empty) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        // Return the first match
        const doc = snapshot.docs[0];
        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 