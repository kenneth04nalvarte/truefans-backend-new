import React, { useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import ForgotPassword from './components/Auth/ForgotPassword';
import AdminLogin from './components/Auth/AdminLogin';
import RestaurantDashboard from './components/Dashboard/RestaurantDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminProtectedRoute from './components/Auth/AdminProtectedRoute';
import Navbar from './components/Navigation/Navbar';
import Home from './components/Home/Home';
import SubscriptionManagement from './components/Subscription/SubscriptionManagement';
import PassManagement from './components/Pass/PassManagement';
import { locationService } from './services/LocationService';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import RestaurantRegistration from './components/Restaurant/RestaurantRegistration';
import DigitalPassManager from './components/Restaurant/DigitalPassManager';
import Dashboard from './components/Dashboard/Dashboard';
import Settings from './components/Settings/Settings';
import DinerRegistration from './components/Diner/DinerRegistration';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2E7D32', // Deep Green - represents growth and loyalty
      light: '#4CAF50', // Lighter Green - for hover states
      dark: '#1B5E20', // Darker Green - for emphasis
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF6B6B', // Warm Red - represents food and passion
      light: '#FF8E8E', // Lighter Red - for hover states
      dark: '#E53935', // Darker Red - for emphasis
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5F5', // Light Gray - clean background
      paper: '#FFFFFF', // White - for cards and containers
    },
    text: {
      primary: '#2C3E50', // Dark Blue-Gray - main text
      secondary: '#546E7A', // Medium Blue-Gray - secondary text
    },
    error: {
      main: '#D32F2F', // Error Red
    },
    warning: {
      main: '#FFA000', // Warning Orange
    },
    success: {
      main: '#388E3C', // Success Green
    },
    info: {
      main: '#1976D2', // Info Blue
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

function AppContent() {
  const { currentUser, userRole } = useContext(AuthContext);

  useEffect(() => {
    // Only initialize location service for diners
    if (userRole === 'diner') {
      locationService.initialize();
      locationService.loadRestaurants();
    }
    // Cleanup
    return () => {
      if (userRole === 'diner') {
        locationService.stopLocationTracking();
      }
    };
  }, [userRole]);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RestaurantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <SubscriptionManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/passes"
          element={
            <ProtectedRoute>
              <PassManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register-restaurant"
          element={
            <RestaurantRegistration />
          }
        />
        <Route
          path="/digital-passes"
          element={
            <ProtectedRoute>
              <DigitalPassManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="/diner-register/:restaurantId" element={<DinerRegistration />} />
        <Route path="/add-pass/:restaurantId" element={<div style={{padding: 40, textAlign: 'center'}}><h2>Pass Upload Coming Soon!</h2><p>Here you will be able to add your digital pass to your phone.</p></div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 