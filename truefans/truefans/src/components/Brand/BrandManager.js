import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppBar, Box, Button, Container, Grid, IconButton, Paper, Tab, Tabs, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import DigitalPassManager from '../../Restaurant/DigitalPassManager';
import Avatar from '@mui/material/Avatar';
import TabPanel from '@mui/lab/TabPanel';

const mockBrand = { name: 'Taco Bros' };
const initialPasses = [
  { id: '1', name: 'Empanada Pass' },
];

const BrandManager = () => {
  const navigate = useNavigate();
  const { brandId } = useParams();
  const [tab, setTab] = useState(0);
  const [locations, setLocations] = useState([]);
  const [passes, setPasses] = useState(initialPasses);
  const [openPassDialog, setOpenPassDialog] = useState(false);
  const [passPreview, setPassPreview] = useState(null);
  const [openLocationDialog, setOpenLocationDialog] = useState(false);
  const [editLocation, setEditLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationPhone, setLocationPhone] = useState('');
  const [locationError, setLocationError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [brandName, setBrandName] = useState('');

  useEffect(() => {
    fetchLocations();
    // Fetch brand name from Firestore if needed
    // setBrandName(...)
  }, [brandId]);

  const fetchLocations = async () => {
    if (!brandId) return;
    const q = query(collection(db, 'locations'), where('brandId', '==', brandId));
    const querySnapshot = await getDocs(q);
    setLocations(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // Handlers for locations
  const handleAddLocation = () => {
    setEditLocation(null);
    setLocationName('');
    setLocationAddress('');
    setLocationPhone('');
    setLocationError('');
    setOpenLocationDialog(true);
  };
  const handleEditLocation = (loc) => {
    setEditLocation(loc);
    setLocationName(loc.name);
    setLocationAddress(loc.address || '');
    setLocationPhone(loc.phone || '');
    setOpenLocationDialog(true);
  };
  const handleRemoveLocation = async (id) => {
    await deleteDoc(doc(db, 'locations', id));
    fetchLocations();
  };
  const handleSaveLocation = async () => {
    setLocationLoading(true);
    setLocationError('');
    try {
      if (editLocation) {
        await updateDoc(doc(db, 'locations', editLocation.id), { name: locationName, address: locationAddress, phone: locationPhone });
      } else {
        await addDoc(collection(db, 'locations'), { name: locationName, address: locationAddress, phone: locationPhone, brandId });
      }
      setOpenLocationDialog(false);
      setEditLocation(null);
      setLocationName('');
      setLocationAddress('');
      setLocationPhone('');
      fetchLocations();
    } catch (err) {
      setLocationError(err.message);
      console.log('Location Firestore error:', err);
    } finally {
      setLocationLoading(false);
    }
  };

  // Handlers for passes
  const handleCreatePass = () => {
    setOpenPassDialog(true);
  };
  const handleEditPass = (pass) => {
    setPassPreview(pass);
    setOpenPassDialog(true);
  };
  const handleDeactivatePass = (pass) => {
    // Implement deactivate logic
    alert(`Deactivated pass: ${pass.name}`);
  };
  const handleViewPass = (pass) => {
    setPassPreview(pass);
    setOpenPassDialog(true);
  };

  const handleCloseLocationDialog = () => {
    setOpenLocationDialog(false);
    setEditLocation(null);
    setLocationName('');
    setLocationAddress('');
    setLocationPhone('');
    setLocationError('');
  };

  const handleClosePassDialog = () => {
    setOpenPassDialog(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">{brandName || mockBrand.name}</Typography>
          <Box display="flex" alignItems="center">
            <Button onClick={() => navigate(-1)} sx={{ mr: 2 }}>Back</Button>
            <Avatar sx={{ bgcolor: 'primary.main' }}><AccountCircleIcon /></Avatar>
          </Box>
        </Box>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="primary" variant="fullWidth" sx={{ mb: 3 }}>
          <Tab label="Locations" />
          <Tab label="Digital Passes" />
          <Tab label="Settings" />
        </Tabs>
        <TabPanel value={tab} index={0}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Locations:</Typography>
          <Grid container spacing={2}>
            {locations.map(loc => (
              <Grid item xs={12} key={loc.id}>
                <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography>{loc.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{loc.address}</Typography>
                    <Typography variant="body2" color="text.secondary">{loc.phone}</Typography>
                  </Box>
                  <Box>
                    <Button size="small" onClick={() => handleEditLocation(loc)} sx={{ mr: 1 }}>Edit</Button>
                    <Button size="small" color="error" onClick={() => handleRemoveLocation(loc.id)}>Remove</Button>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Button variant="contained" sx={{ mt: 3 }} onClick={handleAddLocation}>Add New Location</Button>
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>Digital Passes:</Typography>
          <DigitalPassManager brandId={brandId} open={openPassDialog} onClose={handleClosePassDialog} />
          <Button variant="contained" sx={{ mt: 3 }} onClick={handleCreatePass}>Create New Pass</Button>
        </TabPanel>
        <TabPanel value={tab} index={2}>
          <Typography>Settings coming soon...</Typography>
        </TabPanel>
      </Paper>
      {/* Location Dialog */}
      <Dialog open={openLocationDialog} onClose={handleCloseLocationDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
        <DialogContent>
          {locationError && (
            <Typography color="error" sx={{ mb: 2 }}>{locationError}</Typography>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Location Name"
            fullWidth
            value={locationName}
            onChange={e => setLocationName(e.target.value)}
            required
          />
          <TextField
            margin="dense"
            label="Address"
            fullWidth
            value={locationAddress}
            onChange={e => setLocationAddress(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Phone"
            fullWidth
            value={locationPhone}
            onChange={e => setLocationPhone(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLocationDialog}>Cancel</Button>
          <Button onClick={handleSaveLocation} variant="contained" disabled={locationLoading || !locationName.trim()}>
            {locationLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Pass Dialog is handled inside DigitalPassManager for live preview */}
    </Container>
  );
};

export default BrandManager; 