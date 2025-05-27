import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Container, TextField, Button, Typography, Box, MenuItem, Alert, CircularProgress } from '@mui/material';
import axios from 'axios';

const referralOptions = [
  'Social Media',
  'Friend/Family',
  'Online Search',
  'Walk-in',
  'Other'
];

const DinerRegistration = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    heardAbout: '',
    birthday: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passUrl, setPassUrl] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'diners'), {
        ...form,
        restaurantId,
        birthday: form.birthday ? Timestamp.fromDate(new Date(form.birthday)) : null,
        createdAt: Timestamp.now()
      });
      // Call backend to generate pass
      const response = await axios.post(`${BACKEND_URL}/api/digital-passes/generate`, {
        name: form.name,
        phone: form.phone,
        birthday: form.birthday,
        restaurantId
      });
      if (response.data.success) {
        setPassUrl(response.data.downloadUrl);
      }
      setSuccess(true);
    } catch (err) {
      setError('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    if (confirmed) {
      return (
        <Container maxWidth="sm" sx={{ mt: 6 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            Thank you for registering! Your digital pass has been added to your wallet.
          </Alert>
          <Typography variant="h5" gutterBottom>
            Show this pass at the restaurant to earn rewards and enjoy exclusive offers!
          </Typography>
          <Button variant="contained" color="primary" size="large" onClick={() => window.location.href = '/'}>
            Back to Home
          </Button>
        </Container>
      );
    }
    return (
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Alert severity="success" sx={{ mb: 3 }}>
          Registration successful! Add your digital pass to your phone below.
        </Alert>
        {passUrl ? (
          <Button
            variant="contained"
            color="success"
            size="large"
            href={passUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setConfirmed(true)}
          >
            Download Your Pass
          </Button>
        ) : (
          <Typography>Generating your pass...</Typography>
        )}
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Typography variant="h4" gutterBottom>
        Diner Registration
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="Phone Number"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          select
          label="How did you hear about us?"
          name="heardAbout"
          value={form.heardAbout}
          onChange={handleChange}
          fullWidth
          required
          sx={{ mb: 2 }}
        >
          {referralOptions.map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Birthday"
          name="birthday"
          type="date"
          value={form.birthday}
          onChange={handleChange}
          fullWidth
          InputLabelProps={{ shrink: true }}
          required
          sx={{ mb: 2 }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Register'}
        </Button>
      </Box>
    </Container>
  );
};

export default DinerRegistration; 