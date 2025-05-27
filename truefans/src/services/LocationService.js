import { getMessaging, getToken } from 'firebase/messaging';
import { doc, updateDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

class LocationService {
  constructor() {
    this.watchId = null;
    this.restaurants = new Map();
    this.notificationThreshold = 500; // meters
    this.checkInterval = 60000; // Check every minute
    this.messaging = null;
    this.fcmToken = null;
  }

  async initialize() {
    try {
      // Initialize Firebase Cloud Messaging
      this.messaging = getMessaging();
      
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Get FCM token
        this.fcmToken = await getToken(this.messaging, {
          vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
        });
        console.log('FCM Token:', this.fcmToken);
      } else {
        console.log('Notification permission denied');
      }

      // Start watching location
      this.startLocationTracking();
    } catch (error) {
      console.error('Error initializing location service:', error);
    }
  }

  async loadRestaurants() {
    try {
      const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
      restaurantsSnapshot.forEach(doc => {
        const restaurant = doc.data();
        if (restaurant.location) {
          this.restaurants.set(doc.id, {
            ...restaurant,
            id: doc.id
          });
        }
      });
    } catch (error) {
      console.error('Error loading restaurants:', error);
    }
  }

  startLocationTracking() {
    if ('geolocation' in navigator) {
      this.watchId = navigator.geolocation.watchPosition(
        this.handleLocationUpdate.bind(this),
        this.handleLocationError.bind(this),
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      );

      // Check proximity periodically
      setInterval(this.checkProximity.bind(this), this.checkInterval);
    }
  }

  handleLocationUpdate(position) {
    const { latitude, longitude } = position.coords;
    this.currentLocation = { latitude, longitude };
    this.checkProximity();
  }

  handleLocationError(error) {
    console.error('Error getting location:', error);
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(value) {
    return value * Math.PI / 180;
  }

  async checkProximity() {
    if (!this.currentLocation) return;

    for (const [restaurantId, restaurant] of this.restaurants) {
      if (!restaurant.location) continue;

      const distance = this.calculateDistance(
        this.currentLocation.latitude,
        this.currentLocation.longitude,
        restaurant.location.latitude,
        restaurant.location.longitude
      );

      if (distance <= this.notificationThreshold) {
        await this.sendProximityNotification(restaurant);
      }
    }
  }

  async sendProximityNotification(restaurant) {
    try {
      // Check if notification was already sent
      const lastNotification = localStorage.getItem(`notification_${restaurant.id}`);
      const now = Date.now();
      
      if (lastNotification && (now - parseInt(lastNotification)) < 3600000) {
        // Don't send notification if one was sent in the last hour
        return;
      }

      // Send notification
      const notification = new Notification('Restaurant Nearby!', {
        body: `You're near ${restaurant.name}! Check out their loyalty pass.`,
        icon: restaurant.logo || '/default-restaurant-icon.png'
      });

      // Store notification timestamp
      localStorage.setItem(`notification_${restaurant.id}`, now.toString());

      // Handle notification click
      notification.onclick = () => {
        window.open(`/pass/${restaurant.id}`, '_blank');
      };
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  stopLocationTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  async getNearbyRestaurants(latitude, longitude, radius = 5) {
    try {
      const restaurantsRef = collection(db, 'restaurants');
      const q = query(restaurantsRef);
      const querySnapshot = await getDocs(q);
      
      const restaurants = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Calculate distance
        const distance = this.calculateDistance(
          latitude,
          longitude,
          data.location.latitude,
          data.location.longitude
        );
        
        if (distance <= radius) {
          restaurants.push({
            id: doc.id,
            ...data,
            distance
          });
        }
      });
      
      return restaurants.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService(); 