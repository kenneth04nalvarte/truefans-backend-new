import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCode2 as QrCodeIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import QRCode from 'qrcode.react';

const PassManagement = () => {
  const { currentUser } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [passes, setPasses] = useState([]);
  const [selectedPass, setSelectedPass] = useState(null);
  const [newPass, setNewPass] = useState({
    name: '',
    description: '',
    requiredPasses: 10,
    reward: '',
    expiryDate: '',
    image: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch restaurant data
        const restaurantDoc = await getDoc(doc(db, 'restaurants', currentUser.uid));
        if (restaurantDoc.exists()) {
          setRestaurant(restaurantDoc.data());
        }

        // Fetch passes
        const passesQuery = query(
          collection(db, 'passes'),
          where('restaurantId', '==', currentUser.uid)
        );
        const passesSnapshot = await getDocs(passesQuery);
        const passesData = passesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPasses(passesData);
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleCreatePass = async () => {
    setCreating(true);
    try {
      // Create pass document
      const passData = {
        restaurantId: currentUser.uid,
        name: newPass.name,
        description: newPass.description,
        requiredPasses: parseInt(newPass.requiredPasses),
        reward: newPass.reward,
        expiryDate: new Date(newPass.expiryDate),
        createdAt: new Date(),
        active: true,
        passesIssued: 0
      };

      const passRef = await addDoc(collection(db, 'passes'), passData);

      // Update restaurant's passesIssued count
      await updateDoc(doc(db, 'restaurants', currentUser.uid), {
        passesIssued: (restaurant.passesIssued || 0) + 1
      });

      // Update local state
      setPasses(prev => [...prev, { id: passRef.id, ...passData }]);
      setShowCreateDialog(false);
      setNewPass({
        name: '',
        description: '',
        requiredPasses: 10,
        reward: '',
        expiryDate: '',
        image: null
      });
    } catch (err) {
      setError('Failed to create pass');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleEditPass = async () => {
    if (!selectedPass) return;
    
    setEditing(true);
    try {
      const updatedPassData = {
        name: selectedPass.name,
        description: selectedPass.description,
        requiredPasses: parseInt(selectedPass.requiredPasses),
        reward: selectedPass.reward,
        expiryDate: new Date(selectedPass.expiryDate),
        updatedAt: new Date()
      };

      // Update pass document
      await updateDoc(doc(db, 'passes', selectedPass.id), updatedPassData);

      // Update local state
      setPasses(prev => prev.map(pass => 
        pass.id === selectedPass.id 
          ? { ...pass, ...updatedPassData }
          : pass
      ));

      setShowEditDialog(false);
      setSelectedPass(null);
    } catch (err) {
      setError('Failed to update pass');
      console.error(err);
    } finally {
      setEditing(false);
    }
  };

  const handleDeletePass = async (passId) => {
    try {
      // Delete pass document
      await updateDoc(doc(db, 'passes', passId), {
        active: false
      });

      // Update local state
      setPasses(prev => prev.filter(pass => pass.id !== passId));
    } catch (err) {
      setError('Failed to delete pass');
      console.error(err);
    }
  };

  const handleOpenEditDialog = (pass) => {
    setSelectedPass({
      ...pass,
      expiryDate: pass.expiryDate.toDate().toISOString().split('T')[0]
    });
    setShowEditDialog(true);
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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Loyalty Passes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
        >
          Create New Pass
        </Button>
      </Box>

      <Grid container spacing={3}>
        {passes.map((pass) => (
          <Grid item xs={12} md={6} lg={4} key={pass.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="h6" gutterBottom>
                    {pass.name}
                  </Typography>
                  <Box>
                    <Tooltip title="Edit Pass">
                      <IconButton 
                        size="small"
                        onClick={() => handleOpenEditDialog(pass)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Pass">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeletePass(pass.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Typography color="text.secondary" gutterBottom>
                  {pass.description}
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <Typography variant="body2">
                    Required Passes: {pass.requiredPasses}
                  </Typography>
                  <Typography variant="body2">
                    Issued: {pass.passesIssued}
                  </Typography>
                </Box>
                <Box mt={2} display="flex" justifyContent="center">
                  <QRCode
                    value={`${window.location.origin}/pass/${pass.id}`}
                    size={128}
                    level="H"
                    includeMargin={true}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Pass Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Loyalty Pass</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Pass Name"
              value={newPass.name}
              onChange={(e) => setNewPass(prev => ({ ...prev, name: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={newPass.description}
              onChange={(e) => setNewPass(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Required Passes"
              type="number"
              value={newPass.requiredPasses}
              onChange={(e) => setNewPass(prev => ({ ...prev, requiredPasses: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Reward"
              value={newPass.reward}
              onChange={(e) => setNewPass(prev => ({ ...prev, reward: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Expiry Date"
              type="date"
              value={newPass.expiryDate}
              onChange={(e) => setNewPass(prev => ({ ...prev, expiryDate: e.target.value }))}
              margin="normal"
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowCreateDialog(false)}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreatePass}
            variant="contained"
            disabled={creating || !newPass.name || !newPass.reward || !newPass.expiryDate}
            startIcon={creating ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {creating ? 'Creating...' : 'Create Pass'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Pass Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Loyalty Pass</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Pass Name"
              value={selectedPass?.name || ''}
              onChange={(e) => setSelectedPass(prev => ({ ...prev, name: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={selectedPass?.description || ''}
              onChange={(e) => setSelectedPass(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Required Passes"
              type="number"
              value={selectedPass?.requiredPasses || ''}
              onChange={(e) => setSelectedPass(prev => ({ ...prev, requiredPasses: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Reward"
              value={selectedPass?.reward || ''}
              onChange={(e) => setSelectedPass(prev => ({ ...prev, reward: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Expiry Date"
              type="date"
              value={selectedPass?.expiryDate || ''}
              onChange={(e) => setSelectedPass(prev => ({ ...prev, expiryDate: e.target.value }))}
              margin="normal"
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowEditDialog(false)}
            disabled={editing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditPass}
            variant="contained"
            disabled={editing || !selectedPass?.name || !selectedPass?.reward || !selectedPass?.expiryDate}
            startIcon={editing ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {editing ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PassManagement; 