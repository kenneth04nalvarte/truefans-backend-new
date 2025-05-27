/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

interface AdminUser {
  uid: string;
  email?: string;
  displayName?: string;
}

interface AdminResponse {
  admins: AdminUser[];
}

interface ErrorResponse {
  error: string;
}

interface LoginResponse {
  token: string;
  user: {
    uid: string;
    email?: string;
    displayName?: string;
  };
}

// Middleware to check if the request is from an admin
const isAdmin = async (req: functions.https.Request): Promise<boolean> => {
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
export const setAdmin = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
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
      const errorResponse: ErrorResponse = { error: 'Unauthorized: Admin access required' };
      res.status(403).json(errorResponse);
      return;
    }

    const { uid } = req.body;
    if (!uid) {
      const errorResponse: ErrorResponse = { error: 'User ID is required' };
      res.status(400).json(errorResponse);
      return;
    }

    await admin.auth().setCustomUserClaims(uid, { admin: true });
    res.status(200).json({ message: 'Admin status set successfully' });
  } catch (error) {
    console.error('Error setting admin status:', error);
    const errorResponse: ErrorResponse = { error: error instanceof Error ? error.message : 'Unknown error' };
    res.status(500).json(errorResponse);
  }
});

// Remove admin status from a user
export const removeAdmin = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
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
      const errorResponse: ErrorResponse = { error: 'Unauthorized: Admin access required' };
      res.status(403).json(errorResponse);
      return;
    }

    const { uid } = req.body;
    if (!uid) {
      const errorResponse: ErrorResponse = { error: 'User ID is required' };
      res.status(400).json(errorResponse);
      return;
    }

    await admin.auth().setCustomUserClaims(uid, { admin: false });
    res.status(200).json({ message: 'Admin status removed successfully' });
  } catch (error) {
    console.error('Error removing admin status:', error);
    const errorResponse: ErrorResponse = { error: error instanceof Error ? error.message : 'Unknown error' };
    res.status(500).json(errorResponse);
  }
});

// List all admin users
export const listAdmins = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
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
      const errorResponse: ErrorResponse = { error: 'Unauthorized: Admin access required' };
      res.status(403).json(errorResponse);
      return;
    }

    const listUsersResult = await admin.auth().listUsers();
    const adminUsers: AdminUser[] = listUsersResult.users
      .filter(user => user.customClaims?.admin === true)
      .map(user => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }));

    const response: AdminResponse = { admins: adminUsers };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error listing admin users:', error);
    const errorResponse: ErrorResponse = { error: error instanceof Error ? error.message : 'Unknown error' };
    res.status(500).json(errorResponse);
  }
});

// Admin login function
export const adminLogin = functions.https.onRequest(async (req: functions.https.Request, res: functions.Response) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const errorResponse: ErrorResponse = { error: 'Email and password are required' };
      res.status(400).json(errorResponse);
      return;
    }

    // Sign in with email and password
    const userCredential = await admin.auth().getUserByEmail(email);
    
    // Check if user exists and has admin claim
    const user = await admin.auth().getUser(userCredential.uid);
    const isAdmin = user.customClaims?.admin === true;

    if (!isAdmin) {
      const errorResponse: ErrorResponse = { error: 'Unauthorized: Admin access required' };
      res.status(403).json(errorResponse);
      return;
    }

    // Create custom token for admin
    const token = await admin.auth().createCustomToken(user.uid, { admin: true });

    const response: LoginResponse = {
      token,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in admin login:', error);
    const errorResponse: ErrorResponse = { error: error instanceof Error ? error.message : 'Unknown error' };
    res.status(500).json(errorResponse);
  }
});
