const axios = require('axios');
const admin = require('firebase-admin');

const API_URL = 'https://truefans-1x9dv06s8-kenneths-projects-b5a1aa89.vercel.app';

// Initialize Firebase Admin
const serviceAccount = require('../../firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function getAuthToken() {
  try {
    // Create a custom token for testing
    const token = await admin.auth().createCustomToken('test-user');
    return token;
  } catch (error) {
    console.error('Error creating auth token:', error);
    throw error;
  }
}

async function testEndpoints() {
  try {
    // Test health check endpoint (no auth)
    console.log('Testing health check endpoint...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('Health check response:', healthResponse.data);

    // Get authentication token
    const token = await getAuthToken();
    const headers = {
      Authorization: `Bearer ${token}`
    };

    // Test restaurant registration endpoint
    console.log('\nTesting restaurant registration endpoint...');
    const restaurantData = {
      name: 'Test Restaurant',
      email: 'test@example.com',
      password: 'test123',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      phone: '123-456-7890'
    };

    try {
      const registerResponse = await axios.post(`${API_URL}/api/restaurants/register`, restaurantData, { headers });
      console.log('Restaurant registration response:', registerResponse.data);
    } catch (error) {
      console.log('Restaurant registration error:', error.response?.data || error.message);
    }

    // Test diner registration endpoint
    console.log('\nTesting diner registration endpoint...');
    const dinerData = {
      name: 'Test Diner',
      email: 'diner@example.com',
      password: 'test123',
      phone: '123-456-7890'
    };

    try {
      const dinerResponse = await axios.post(`${API_URL}/api/users/register`, dinerData, { headers });
      console.log('Diner registration response:', dinerResponse.data);
    } catch (error) {
      console.log('Diner registration error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('Error testing endpoints:', error.message);
  } finally {
    // Clean up Firebase Admin
    await admin.app().delete();
  }
}

testEndpoints(); 