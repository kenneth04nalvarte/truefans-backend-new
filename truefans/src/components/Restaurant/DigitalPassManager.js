import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import QRCode from 'qrcode.react';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const DigitalPassManager = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passes, setPasses] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newPass, setNewPass] = useState({
    name: '',
    description: '',
    benefits: '',
    validityPeriod: '30', // days
    image: null
  });

  useEffect(() => {
    fetchPasses();
  }, []);

  const fetchPasses = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const passesQuery = query(
        collection(db, 'digitalPasses'),
        where('restaurantId', '==', user.restaurantId)
      );
      
      const querySnapshot = await getDocs(passesQuery);
      const passesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPasses(passesList);
    } catch (error) {
      setError('Failed to fetch digital passes');
    }
  };

  const handleCreatePass = async () => {
    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to create a digital pass');
      }

      let imageUrl = '';
      if (newPass.image) {
        const storage = getStorage();
        const imageRef = ref(storage, `passes/${user.uid}/${Date.now()}`);
        await uploadBytes(imageRef, newPass.image);
        imageUrl = await getDownloadURL(imageRef);
      }

      const passData = {
        ...newPass,
        image: imageUrl,
        restaurantId: user.restaurantId,
        createdAt: new Date().toISOString(),
        active: true
      };

      await addDoc(collection(db, 'digitalPasses'), passData);
      setOpenDialog(false);
      setNewPass({
        name: '',
        description: '',
        benefits: '',
        validityPeriod: '30',
        image: null
      });
      fetchPasses();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPass(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleTogglePass = async (passId, currentStatus) => {
    try {
      const passRef = doc(db, 'digitalPasses', passId);
      await updateDoc(passRef, {
        active: !currentStatus
      });
      fetchPasses();
    } catch (error) {
      setError('Failed to update pass status');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Digital Passes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenDialog(true)}
        >
          Create New Pass
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {passes.map((pass) => (
          <Grid item xs={12} md={6} lg={4} key={pass.id}>
            <Card>
              <CardContent>
                {pass.image && (
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <img
                      src={pass.image}
                      alt={pass.name}
                      style={{ maxWidth: '100%', maxHeight: '200px' }}
                    />
                  </Box>
                )}
                <Typography variant="h6" gutterBottom>
                  {pass.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {pass.description}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Benefits:</strong> {pass.benefits}
                </Typography>
                <Typography variant="body2">
                  <strong>Validity:</strong> {pass.validityPeriod} days
                </Typography>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <QRCode
                    value={`${window.location.origin}/pass/${pass.id}`}
                    size={200}
                    level="H"
                  />
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  color={pass.active ? 'error' : 'success'}
                  onClick={() => handleTogglePass(pass.id, pass.active)}
                >
                  {pass.active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  size="small"
                  onClick={() => window.open(`${window.location.origin}/pass/${pass.id}`, '_blank')}
                >
                  View Pass
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Digital Pass</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Pass Name"
              value={newPass.name}
              onChange={(e) => setNewPass(prev => ({ ...prev, name: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={newPass.description}
              onChange={(e) => setNewPass(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Benefits"
              value={newPass.benefits}
              onChange={(e) => setNewPass(prev => ({ ...prev, benefits: e.target.value }))}
              margin="normal"
              multiline
              rows={2}
              placeholder="e.g., 10% off all items, Free dessert with main course"
            />
            <TextField
              fullWidth
              label="Validity Period (days)"
              type="number"
              value={newPass.validityPeriod}
              onChange={(e) => setNewPass(prev => ({ ...prev, validityPeriod: e.target.value }))}
              margin="normal"
            />
            <Button
              variant="contained"
              component="label"
              sx={{ mt: 2 }}
            >
              Upload Pass Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
            {newPass.image && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {newPass.image.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreatePass}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Pass'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DigitalPassManager; 