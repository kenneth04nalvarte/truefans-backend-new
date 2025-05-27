const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Middleware to check if the request is from an admin
const isAdmin = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.admin === true;
  } catch (error) {
    console.error('Error verifying admin status:', error);
    return false;
  }
};

// Set admin status for a user
exports.setAdmin = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }

  try {
    // Check if the request is from an admin
    const isAdminUser = await isAdmin(req);
    if (!isAdminUser) {
      res.status(403).json({ error: 'Unauthorized: Admin access required' });
      return;
    }

    const { uid } = req.body;
    if (!uid) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    await admin.auth().setCustomUserClaims(uid, { admin: true });
    res.status(200).json({ message: 'Admin status set successfully' });
  } catch (error) {
    console.error('Error setting admin status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove admin status from a user
exports.removeAdmin = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }

  try {
    // Check if the request is from an admin
    const isAdminUser = await isAdmin(req);
    if (!isAdminUser) {
      res.status(403).json({ error: 'Unauthorized: Admin access required' });
      return;
    }

    const { uid } = req.body;
    if (!uid) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    await admin.auth().setCustomUserClaims(uid, { admin: false });
    res.status(200).json({ message: 'Admin status removed successfully' });
  } catch (error) {
    console.error('Error removing admin status:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all admin users
exports.listAdmins = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }

  try {
    // Check if the request is from an admin
    const isAdminUser = await isAdmin(req);
    if (!isAdminUser) {
      res.status(403).json({ error: 'Unauthorized: Admin access required' });
      return;
    }

    const listUsersResult = await admin.auth().listUsers();
    const adminUsers = listUsersResult.users.filter(user => 
      user.customClaims && user.customClaims.admin === true
    ).map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    }));

    res.status(200).json({ admins: adminUsers });
  } catch (error) {
    console.error('Error listing admin users:', error);
    res.status(500).json({ error: error.message });
  }
}); 