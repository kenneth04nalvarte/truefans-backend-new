import { auth } from '../config/firebase';
import { signInWithCustomToken } from 'firebase/auth';

class AdminService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_FUNCTIONS_URL;
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/adminLogin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const { token, user } = await response.json();
      
      // Sign in with the custom token
      await signInWithCustomToken(auth, token);
      
      return user;
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  }

  async getAuthToken() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    return user.getIdToken();
  }

  async setAdmin(uid) {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/setAdmin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ uid })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set admin status');
    }

    return response.json();
  }

  async removeAdmin(uid) {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/removeAdmin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ uid })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove admin status');
    }

    return response.json();
  }

  async listAdmins() {
    const token = await this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/listAdmins`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list admin users');
    }

    return response.json();
  }
}

export const adminService = new AdminService(); 