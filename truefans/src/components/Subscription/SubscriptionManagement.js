import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const SubscriptionManagement = () => {
  const { currentUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const restaurantDoc = await getDoc(doc(db, 'restaurants', currentUser.uid));
        if (restaurantDoc.exists()) {
          setSubscription(restaurantDoc.data());
        }
      } catch (err) {
        setError('Failed to fetch subscription details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [currentUser]);

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      // Call your backend API to cancel the subscription
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.subscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Update local state
      await updateDoc(doc(db, 'restaurants', currentUser.uid), {
        subscriptionStatus: 'cancelled',
        cancelledAt: new Date(),
      });

      setSubscription(prev => ({
        ...prev,
        subscriptionStatus: 'cancelled',
        cancelledAt: new Date(),
      }));

      setShowCancelDialog(false);
    } catch (err) {
      setError('Failed to cancel subscription');
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success.main';
      case 'trial':
        return 'warning.main';
      case 'cancelled':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon color="success" />;
      case 'trial':
        return <WarningIcon color="warning" />;
      case 'cancelled':
        return <CancelIcon color="error" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Subscription Management
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Current Plan
                    </Typography>
                    <Typography variant="h6">
                      Premium Plan
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" color="text.secondary">
                      Status
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getStatusIcon(subscription?.subscriptionStatus)}
                      <Typography
                        variant="h6"
                        sx={{ color: getStatusColor(subscription?.subscriptionStatus) }}
                      >
                        {subscription?.subscriptionStatus?.charAt(0).toUpperCase() +
                          subscription?.subscriptionStatus?.slice(1)}
                      </Typography>
                    </Box>
                  </Grid>
                  {subscription?.trialEndDate && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Trial Ends
                      </Typography>
                      <Typography variant="body1">
                        {new Date(subscription.trialEndDate.toDate()).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {subscription?.subscriptionStatus === 'active' && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel Subscription
              </Button>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
      >
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel your subscription? You'll still have access until the end of your current billing period.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowCancelDialog(false)}
            disabled={cancelling}
          >
            Keep Subscription
          </Button>
          <Button
            onClick={handleCancelSubscription}
            color="error"
            disabled={cancelling}
            startIcon={cancelling ? <CircularProgress size={20} /> : <CancelIcon />}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubscriptionManagement; 