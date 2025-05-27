const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { db } = require('../config/firebaseAdmin');

// Create subscription
router.post('/create', async (req, res) => {
    try {
        const { restaurantId, paymentMethodId, email } = req.body;
        const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get();
        if (!restaurantDoc.exists) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        const restaurant = restaurantDoc.data();
        // Create Stripe customer if not exists
        let customerId = restaurant.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                payment_method: paymentMethodId,
                email: email,
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });
            customerId = customer.id;
            await db.collection('restaurants').doc(restaurantId).update({ stripeCustomerId: customerId });
        }
        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: process.env.STRIPE_PRICE_ID }], // $15/month price ID
            expand: ['latest_invoice.payment_intent'],
        });
        // Save subscription to Firestore
        const subscriptionData = {
            restaurantId,
            stripeSubscriptionId: subscription.id,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            status: subscription.status,
            createdAt: new Date()
        };
        const subRef = await db.collection('subscriptions').add(subscriptionData);
        // Update restaurant subscription status
        await db.collection('restaurants').doc(restaurantId).update({ subscriptionStatus: 'active' });
        res.json({
            subscriptionId: subRef.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
            status: subscription.status
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update subscription
router.put('/:id', async (req, res) => {
    try {
        const subDoc = await db.collection('subscriptions').doc(req.params.id).get();
        if (!subDoc.exists) {
            return res.status(404).json({ message: 'Subscription not found' });
        }
        const subscription = subDoc.data();
        const stripeSubscription = await stripe.subscriptions.update(
            subscription.stripeSubscriptionId,
            { cancel_at_period_end: req.body.cancel }
        );
        await db.collection('subscriptions').doc(req.params.id).update({ status: stripeSubscription.status });
        res.json({ message: 'Subscription updated successfully', subscription: { ...subscription, status: stripeSubscription.status } });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get subscription status
router.get('/:id', async (req, res) => {
    try {
        const subDoc = await db.collection('subscriptions').doc(req.params.id).get();
        if (!subDoc.exists) {
            return res.status(404).json({ message: 'Subscription not found' });
        }
        const subscription = subDoc.data();
        const stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.stripeSubscriptionId
        );
        res.json({
            status: stripeSubscription.status,
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 