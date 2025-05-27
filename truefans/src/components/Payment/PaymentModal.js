import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import stripePromise from '../../config/stripe';

const PaymentForm = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      return;
    }

    try {
      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      // Create subscription
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          priceId: process.env.REACT_APP_STRIPE_PRICE_ID,
        }),
      });

      const subscription = await response.json();

      if (subscription.error) {
        setError(subscription.error);
      } else {
        onSuccess(subscription);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          sx={{ mr: 1 }}
          disabled={loading}
        >
          Maybe Later
        </Button>
        <Button
          type="submit"
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
          size="large"
          disabled={!stripe || loading}
        >
          {loading ? 'Processing...' : 'Start Free Trial'}
        </Button>
      </DialogActions>
    </form>
  );
};

const PaymentModal = ({ open, onClose, onSubscribe }) => {
  const features = [
    'Unlimited Digital Passes',
    'Custom Branding',
    'Customer Analytics',
    'Promotion Management',
    '24/7 Support'
  ];

  const handleSuccess = (subscription) => {
    onSubscribe(subscription);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarIcon color="primary" />
          <Typography variant="h6" component="div">
            Choose Your Plan
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 2
          }}
        >
          <Typography variant="h4" align="center" gutterBottom>
            $9
            <Typography
              component="span"
              variant="subtitle1"
              color="text.secondary"
            >
              /month
            </Typography>
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            color="text.secondary"
            gutterBottom
          >
            Perfect for growing restaurants
          </Typography>
        </Paper>

        <List>
          {features.map((feature, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <CheckCircleIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary={feature} />
            </ListItem>
          ))}
        </List>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Start your 14-day free trial today. Enter your card details to begin.
          </Typography>
        </Box>
      </DialogContent>

      <Elements stripe={stripePromise}>
        <PaymentForm onSuccess={handleSuccess} onCancel={onClose} />
      </Elements>
    </Dialog>
  );
};

export default PaymentModal; 