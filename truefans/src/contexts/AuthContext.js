import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('diner'); // default to diner
  const [loading, setLoading] = useState(true);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Check for admin claim
        const token = await user.getIdTokenResult();
        if (token.claims.admin) {
          setUserRole('admin');
        } else {
          // Check if user is a restaurant owner
          // Look for a restaurant with ownerId == user.uid
          try {
            const restaurantsQuery = query(
              collection(db, 'restaurants'),
              where('ownerId', '==', user.uid)
            );
            const querySnapshot = await getDocs(restaurantsQuery);
            if (!querySnapshot.empty) {
              setUserRole('owner');
            } else {
              setUserRole('diner');
            }
          } catch (e) {
            setUserRole('diner');
          }
        }
      } else {
        setUserRole('diner');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export { AuthContext }; 