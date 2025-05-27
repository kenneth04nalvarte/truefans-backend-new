import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, storage, db } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  useTheme,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Restaurant, LocalOffer, QrCode2 } from '@mui/icons-material';
import PaymentModal from '../Payment/PaymentModal';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const libraries = ['places'];

const SignUp = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    address: '',
    phone: '',
    brandColor: '#1976d2',
    logo: null,
    location: null
  });

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        logo: e.target.files[0]
      }));
    }
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      location: {
        latitude: location.lat,
        longitude: location.lng,
        address: location.address
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      setUserId(userCredential.user.uid);

      // Upload logo if provided
      let logoUrl = '';
      if (formData.logo) {
        const storageRef = ref(storage, `restaurants/${userCredential.user.uid}/logo`);
        await uploadBytes(storageRef, formData.logo);
        logoUrl = await getDownloadURL(storageRef);
      }

      // Create restaurant document
      await addDoc(collection(db, 'restaurants'), {
        ownerId: userCredential.user.uid,
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        color: formData.brandColor,
        logo: logoUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        passesIssued: 0,
        activePromotions: [],
        subscriptionStatus: 'trial',
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        location: formData.location
      });

      setShowPaymentModal(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (subscription) => {
    try {
      // Update restaurant document with subscription details
      if (!userId) throw new Error('User ID not found');
      const restaurantRef = doc(db, 'restaurants', userId);
      await updateDoc(restaurantRef, {
        subscriptionStatus: 'active',
        subscriptionId: subscription.subscriptionId,
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      });

      // Close payment modal and redirect to dashboard
      setShowPaymentModal(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError('Failed to update subscription. Please try again.');
    }
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    navigate('/dashboard');
  };

  if (!isLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Container component="main" maxWidth="lg">
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={7}>
            <Paper elevation={3} sx={{ p: 4 }}>
              <Typography component="h1" variant="h5" align="center" gutterBottom>
                Restaurant Sign Up
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      label="Restaurant Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      margin="normal"
                      required
                      helperText="Enter your restaurant's address for location-based notifications"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Brand Color"
                      name="brandColor"
                      type="color"
                      value={formData.brandColor}
                      onChange={handleChange}
                      sx={{ height: '56px' }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      component="label"
                      fullWidth
                    >
                      Upload Logo
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                    </Button>
                    {formData.logo && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Selected: {formData.logo.name}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Location (for proximity notifications)
                  </Typography>
                  <GoogleMap
                    center={formData.location || { lat: 0, lng: 0 }}
                    zoom={15}
                    style={{ width: '100%', height: '200px' }}
                    onClick={(e) => handleLocationSelect({
                      lat: e.latLng.lat(),
                      lng: e.latLng.lng(),
                      address: formData.address
                    })}
                  >
                    {formData.location && (
                      <Marker
                        position={{
                          lat: formData.location.latitude,
                          lng: formData.location.longitude
                        }}
                      />
                    )}
                  </GoogleMap>
                </Box>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Sign Up'}
                </Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Restaurant sx={{ mr: 1 }} />
                  Premium Features
                </Typography>
                <Typography variant="body2" paragraph>
                  Get access to all premium features with our subscription plan:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocalOffer sx={{ mr: 1, color: 'primary.main' }} />
                    Customizable Digital Passes
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <QrCode2 sx={{ mr: 1, color: 'primary.main' }} />
                    QR Code Generation
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Start with a 14-day free trial. No credit card required.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <PaymentModal
        open={showPaymentModal}
        onClose={handleClosePaymentModal}
        onSubscribe={handleSubscribe}
      />
    </>
  );
};

export default SignUp; 