const express = require('express');

const app = express();

// Root route
app.get('/', (req, res) => {
  res.send('API is running!');
});

// Example API route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

// Export the app for Vercel serverless
module.exports = app;