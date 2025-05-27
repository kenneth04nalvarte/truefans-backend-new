import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  QrCode2 as QrCodeIcon,
  LocalOffer as OfferIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRestaurantData();
  }, []);

  const fetchRestaurantData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const restaurantsQuery = query(
        collection(db, 'restaurants'),
        where('ownerId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(restaurantsQuery);
      if (!querySnapshot.empty) {
        setRestaurant({
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        });
      }
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = () => {
    navigate('/subscription');
  };

  const isSubscriptionActive = () => {
    if (!restaurant) return false;
    return ['active', 'trial'].includes(restaurant.subscriptionStatus);
  };

  const isTrialExpiring = () => {
    if (!restaurant || restaurant.subscriptionStatus !== 'trial') return false;
    const trialEnd = restaurant.trialEndDate.toDate();
    const daysUntilExpiry = Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 3;
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!restaurant) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Welcome to TrueFans!
          </Typography>
          <Typography variant="body1" paragraph>
            You haven't registered your restaurant yet. Let's get started!
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/register-restaurant')}
          >
            Register Your Restaurant
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                {restaurant.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {restaurant.address}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => navigate('/register-restaurant')}
            >
              Edit Restaurant
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Digital Passes
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create and manage digital passes for your customers. Track usage and benefits.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                color="primary"
                onClick={() => navigate('/digital-passes')}
              >
                Manage Passes
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analytics
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                View insights about your restaurant's performance and customer engagement.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                color="primary"
                onClick={() => navigate('/analytics')}
              >
                View Analytics
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Feedback
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Read and respond to customer reviews and feedback.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                color="primary"
                onClick={() => navigate('/feedback')}
              >
                View Feedback
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manage your account settings and preferences.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                color="primary"
                onClick={() => navigate('/settings')}
              >
                Open Settings
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Stats Cards */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Passes
            </Typography>
            <Typography component="p" variant="h4">
              {restaurant?.passesIssued || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Active Promotions
            </Typography>
            <Typography component="p" variant="h4">
              {restaurant?.activePromotions?.length || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Subscription Status
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {restaurant?.subscriptionStatus === 'active' ? (
                <Typography component="p" variant="h6" color="success.main">
                  Active
                </Typography>
              ) : restaurant?.subscriptionStatus === 'trial' ? (
                <Typography component="p" variant="h6" color="warning.main">
                  Trial
                </Typography>
              ) : (
                <Typography component="p" variant="h6" color="error.main">
                  Inactive
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* QR Code Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Your Restaurant QR Code
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
              }}
            >
              <QrCodeIcon sx={{ fontSize: 200, color: restaurant?.color || 'primary.main' }} />
            </Box>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              Display this QR code in your restaurant for customers to scan and collect passes
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 