import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import { Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [promotionDialog, setPromotionDialog] = useState(false);
  const [newPromotion, setNewPromotion] = useState({
    title: '',
    description: '',
    validUntil: ''
  });

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/login');
          return;
        }

        const restaurantsRef = collection(db, 'restaurants');
        const q = query(restaurantsRef, where('ownerId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setRestaurant({ id: doc.id, ...doc.data() });
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [navigate]);

  const handleAddPromotion = async () => {
    try {
      const restaurantRef = doc(db, 'restaurants', restaurant.id);
      const updatedPromotions = [...restaurant.activePromotions, newPromotion];
      
      await updateDoc(restaurantRef, {
        activePromotions: updatedPromotions,
        updatedAt: new Date()
      });

      setRestaurant(prev => ({
        ...prev,
        activePromotions: updatedPromotions
      }));

      setPromotionDialog(false);
      setNewPromotion({ title: '', description: '', validUntil: '' });
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  if (!restaurant) {
    return (
      <Container>
        <Typography>Restaurant not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Restaurant Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {restaurant.logo && (
                <CardMedia
                  component="img"
                  sx={{ width: 100, height: 100, mr: 2 }}
                  image={restaurant.logo}
                  alt={restaurant.name}
                />
              )}
              <Box>
                <Typography variant="h4" gutterBottom>
                  {restaurant.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {restaurant.address}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Phone: {restaurant.phone}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* QR Code */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Your QR Code
            </Typography>
            <QRCodeSVG
              value={`https://truefans.vercel.app/diner-register/${restaurant.id}`}
              size={200}
              level="H"
              includeMargin={true}
            />
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => window.print()}
            >
              Download QR Code
            </Button>
          </Paper>
        </Grid>

        {/* Stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Total Passes Issued
                    </Typography>
                    <Typography variant="h4">
                      {restaurant.passesIssued}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Active Promotions
                    </Typography>
                    <Typography variant="h4">
                      {(restaurant.activePromotions || []).length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Promotions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Active Promotions
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setPromotionDialog(true)}
              >
                Add Promotion
              </Button>
            </Box>
            <Grid container spacing={2}>
              {(restaurant.activePromotions || []).map((promotion, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {promotion.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {promotion.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Valid until: {new Date(promotion.validUntil).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Promotion Dialog */}
      <Dialog open={promotionDialog} onClose={() => setPromotionDialog(false)}>
        <DialogTitle>Add New Promotion</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={newPromotion.title}
            onChange={(e) => setNewPromotion(prev => ({ ...prev, title: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={newPromotion.description}
            onChange={(e) => setNewPromotion(prev => ({ ...prev, description: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Valid Until"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newPromotion.validUntil}
            onChange={(e) => setNewPromotion(prev => ({ ...prev, validUntil: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromotionDialog(false)}>Cancel</Button>
          <Button onClick={handleAddPromotion} variant="contained">
            Add Promotion
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RestaurantDashboard; 