import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [restaurant, setRestaurant] = useState(null);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    display: {
      showPassCount: true,
      showAnalytics: true,
      showFeedback: true,
    },
    security: {
      twoFactorAuth: false,
      loginNotifications: true,
    },
    business: {
      autoApprovePasses: false,
      requireCustomerInfo: true,
      allowPassSharing: true,
    }
  });
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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
        const restaurantData = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        };
        setRestaurant(restaurantData);
        if (restaurantData.settings) {
          setSettings(restaurantData.settings);
        }
      }
    } catch (error) {
      setError('Failed to fetch restaurant data');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category, setting) => (event) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: event.target.checked
      }
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const user = auth.currentUser;
      if (!user || !restaurant) return;

      const restaurantRef = doc(db, 'restaurants', restaurant.id);
      await updateDoc(restaurantRef, {
        settings,
        updatedAt: new Date().toISOString()
      });

      setSuccess('Settings saved successfully');
    } catch (error) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const user = auth.currentUser;
      await user.updatePassword(passwordData.newPassword);
      setSuccess('Password updated successfully');
      setOpenPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setError('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Notifications Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Receive updates and alerts via email"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.notifications.email}
                    onChange={handleSettingChange('notifications', 'email')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Push Notifications"
                  secondary="Receive real-time updates on your device"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.notifications.push}
                    onChange={handleSettingChange('notifications', 'push')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="SMS Notifications"
                  secondary="Receive important alerts via SMS"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.notifications.sms}
                    onChange={handleSettingChange('notifications', 'sms')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Display Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Display Preferences
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Show Pass Count"
                  secondary="Display the number of passes issued"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.display.showPassCount}
                    onChange={handleSettingChange('display', 'showPassCount')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Show Analytics"
                  secondary="Display analytics dashboard"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.display.showAnalytics}
                    onChange={handleSettingChange('display', 'showAnalytics')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Show Feedback"
                  secondary="Display customer feedback section"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.display.showFeedback}
                    onChange={handleSettingChange('display', 'showFeedback')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Two-Factor Authentication"
                  secondary="Add an extra layer of security to your account"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.security.twoFactorAuth}
                    onChange={handleSettingChange('security', 'twoFactorAuth')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Login Notifications"
                  secondary="Get notified when someone logs into your account"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.security.loginNotifications}
                    onChange={handleSettingChange('security', 'loginNotifications')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Change Password"
                  secondary="Update your account password"
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => setOpenPasswordDialog(true)}
                  >
                    <EditIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Business Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Business Preferences
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Auto-approve Passes"
                  secondary="Automatically approve new pass requests"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.business.autoApprovePasses}
                    onChange={handleSettingChange('business', 'autoApprovePasses')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Require Customer Info"
                  secondary="Collect customer information for passes"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.business.requireCustomerInfo}
                    onChange={handleSettingChange('business', 'requireCustomerInfo')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Allow Pass Sharing"
                  secondary="Let customers share their passes with others"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.business.allowPassSharing}
                    onChange={handleSettingChange('business', 'allowPassSharing')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : 'Save Settings'}
        </Button>
      </Box>

      {/* Password Change Dialog */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              type="password"
              label="New Password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
          <Button
            onClick={handlePasswordChange}
            variant="contained"
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings; 