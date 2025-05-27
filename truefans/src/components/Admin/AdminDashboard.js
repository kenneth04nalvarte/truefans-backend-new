import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
} from '@mui/material';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/AdminService';

const AdminDashboard = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRestaurants(),
        fetchAdmins()
      ]);
    } catch (error) {
      setError('Error fetching data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    const querySnapshot = await getDocs(collection(db, 'restaurants'));
    const restaurantList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setRestaurants(restaurantList);
  };

  const fetchAdmins = async () => {
    const { admins } = await adminService.listAdmins();
    setAdmins(admins);
  };

  const handleApprove = async (restaurantId) => {
    try {
      await updateDoc(doc(db, 'restaurants', restaurantId), {
        status: 'approved'
      });
      await fetchRestaurants();
    } catch (error) {
      setError('Error approving restaurant: ' + error.message);
    }
  };

  const handleReject = async (restaurantId) => {
    try {
      await updateDoc(doc(db, 'restaurants', restaurantId), {
        status: 'rejected'
      });
      await fetchRestaurants();
    } catch (error) {
      setError('Error rejecting restaurant: ' + error.message);
    }
  };

  const handleDelete = async (restaurantId) => {
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      try {
        await deleteDoc(doc(db, 'restaurants', restaurantId));
        await fetchRestaurants();
      } catch (error) {
        setError('Error deleting restaurant: ' + error.message);
      }
    }
  };

  const handleAddAdmin = async () => {
    try {
      // First, get the user by email
      const userQuery = await getDocs(collection(db, 'users'));
      const user = userQuery.docs.find(doc => doc.data().email === newAdminEmail);
      
      if (!user) {
        throw new Error('User not found');
      }

      await adminService.setAdmin(user.id);
      setNewAdminEmail('');
      await fetchAdmins();
    } catch (error) {
      setError('Error adding admin: ' + error.message);
    }
  };

  const handleRemoveAdmin = async (uid) => {
    if (window.confirm('Are you sure you want to remove admin privileges?')) {
      try {
        await adminService.removeAdmin(uid);
        await fetchAdmins();
      } catch (error) {
        setError('Error removing admin: ' + error.message);
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h1" variant="h4" gutterBottom>
              Admin Dashboard
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab label="Restaurants" />
              <Tab label="Admin Users" />
            </Tabs>

            {tabValue === 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Restaurant Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {restaurants.map((restaurant) => (
                      <TableRow key={restaurant.id}>
                        <TableCell>{restaurant.name}</TableCell>
                        <TableCell>{restaurant.email}</TableCell>
                        <TableCell>{restaurant.status || 'pending'}</TableCell>
                        <TableCell>
                          {restaurant.status !== 'approved' && (
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => handleApprove(restaurant.id)}
                              sx={{ mr: 1 }}
                            >
                              Approve
                            </Button>
                          )}
                          {restaurant.status !== 'rejected' && (
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => handleReject(restaurant.id)}
                              sx={{ mr: 1 }}
                            >
                              Reject
                            </Button>
                          )}
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleDelete(restaurant.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {tabValue === 1 && (
              <>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    label="New Admin Email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    sx={{ mr: 2 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddAdmin}
                    disabled={!newAdminEmail}
                  >
                    Add Admin
                  </Button>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Email</TableCell>
                        <TableCell>Display Name</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.uid}>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>{admin.displayName}</TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleRemoveAdmin(admin.uid)}
                            >
                              Remove Admin
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard; 