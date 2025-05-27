import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'restaurants';

export const createRestaurant = async (restaurantData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...restaurantData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    throw new Error('Error creating restaurant: ' + error.message);
  }
};

export const updateRestaurant = async (restaurantId, updateData) => {
  try {
    const restaurantRef = doc(db, COLLECTION_NAME, restaurantId);
    await updateDoc(restaurantRef, {
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    throw new Error('Error updating restaurant: ' + error.message);
  }
};

export const getRestaurant = async (restaurantId) => {
  try {
    const restaurantRef = doc(db, COLLECTION_NAME, restaurantId);
    const restaurantSnap = await getDoc(restaurantRef);
    
    if (restaurantSnap.exists()) {
      return { id: restaurantSnap.id, ...restaurantSnap.data() };
    } else {
      throw new Error('Restaurant not found');
    }
  } catch (error) {
    throw new Error('Error getting restaurant: ' + error.message);
  }
};

export const getNearbyRestaurants = async (latitude, longitude, radiusInKm = 5) => {
  try {
    // Note: This is a simplified version. In production, you'd want to use
    // a geospatial query with Firestore's GeoPoint
    const restaurantsRef = collection(db, COLLECTION_NAME);
    const q = query(restaurantsRef);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    throw new Error('Error getting nearby restaurants: ' + error.message);
  }
};

export const getRestaurantByQRCode = async (qrCode) => {
  try {
    const restaurantsRef = collection(db, COLLECTION_NAME);
    const q = query(restaurantsRef, where('qrCode', '==', qrCode));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } else {
      throw new Error('Restaurant not found');
    }
  } catch (error) {
    throw new Error('Error getting restaurant by QR code: ' + error.message);
  }
}; 