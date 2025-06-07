import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress } from '@mui/material';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editBrand, setEditBrand] = useState(null);
  const [brandName, setBrandName] = useState('');
  const [dialogLoading, setDialogLoading] = useState(false);
  const [error, setError] = useState('');
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    fetchBrands();
    // eslint-disable-next-line
  }, [user]);

  const fetchBrands = async () => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'brands'), where('ownerId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    setBrands(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  const handleAddBrand = () => {
    setEditBrand(null);
    setBrandName('');
    setError('');
    setOpenDialog(true);
  };
  const handleEditBrand = (brand) => {
    setEditBrand(brand);
    setBrandName(brand.name);
    setError('');
    setOpenDialog(true);
  };
  const handleRemoveBrand = async (brand) => {
    await deleteDoc(doc(db, 'brands', brand.id));
    fetchBrands();
  };
  const handleSaveBrand = async () => {
    setDialogLoading(true);
    setError('');
    try {
      if (editBrand) {
        await updateDoc(doc(db, 'brands', editBrand.id), { name: brandName });
      } else {
        await addDoc(collection(db, 'brands'), {
          name: brandName,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      setOpenDialog(false);
      fetchBrands();
    } catch (err) {
      setError(err.message);
    } finally {
      setDialogLoading(false);
    }
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditBrand(null);
    setBrandName('');
    setError('');
  };
  const handleManageBrand = (brand) => {
    navigate(`/brands/${brand.id}`);
  };

  if (loading) return <Box sx={{ mt: 8, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h4" sx={{ mb: 2, color: '#E63976', fontWeight: 700 }}>
        Welcome, {user?.displayName || 'Owner'}!
      </Typography>
      <Typography variant="h6" sx={{ mb: 3, color: '#1A2341' }}>
        Your Brands:
      </Typography>
      <Grid container spacing={2}>
        {brands.map((brand) => (
          <Grid item xs={12} md={6} key={brand.id}>
            <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 600 }}>{brand.name}</Typography>
              <Box>
                <Button size="small" variant="contained" sx={{ mr: 1 }} onClick={() => handleManageBrand(brand)}>Manage Brand</Button>
                <Button size="small" sx={{ mr: 1 }} onClick={() => handleEditBrand(brand)}>Edit</Button>
                <Button size="small" color="error" onClick={() => handleRemoveBrand(brand)}>Remove</Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Button variant="contained" sx={{ mt: 4 }} onClick={handleAddBrand}>Add New Brand</Button>
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editBrand ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
        <DialogContent>
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          <TextField
            label="Brand Name"
            fullWidth
            margin="dense"
            value={brandName}
            onChange={e => setBrandName(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveBrand} variant="contained" disabled={dialogLoading || !brandName.trim()}>
            {dialogLoading ? <CircularProgress size={24} /> : (editBrand ? 'Save Changes' : 'Add Brand')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 