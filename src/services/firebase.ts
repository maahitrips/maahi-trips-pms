import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  getDocFromServer,
  Unsubscribe 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Hotel, UserAccount, HotelDataBundle, DeletionRequest } from '../types';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if configured
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test Connection per Firebase Skill guidelines
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: client is offline.');
    } else {
      console.log('Firebase initialized. Note:', error);
    }
    return false;
  }
}

// Automatically test connection on boot
testFirebaseConnection();

/**
 * Cloud Sync Service for Multi-Device Real-Time Synchronization
 */

// 1. Save Hotel Bundle to Cloud
export async function saveHotelBundleToCloud(hotelId: string, bundle: HotelDataBundle): Promise<void> {
  try {
    const docRef = doc(db, 'hotelBundles', hotelId);
    // Sanitize undefined fields which Firestore rejects
    const payload = JSON.parse(JSON.stringify({
      ...bundle,
      hotelId,
      updatedAt: new Date().toISOString()
    }));
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    console.warn(`Failed to sync hotel bundle ${hotelId} to cloud:`, error);
  }
}

// 2. Real-time Subscription to Active Hotel Bundle
export function subscribeToHotelBundle(
  hotelId: string, 
  onData: (bundle: HotelDataBundle) => void
): Unsubscribe {
  const docRef = doc(db, 'hotelBundles', hotelId);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as HotelDataBundle;
      if (data && data.rooms && data.bookings) {
        onData(data);
      }
    }
  }, (err) => {
    console.warn(`Firestore subscription error for bundle ${hotelId}:`, err);
  });
}

// 3. Save Hotels Registry to Cloud
export async function saveHotelsToCloud(hotels: Hotel[]): Promise<void> {
  try {
    const docRef = doc(db, 'hotels', 'registry');
    await setDoc(docRef, { list: JSON.parse(JSON.stringify(hotels)), updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.warn('Failed to sync hotels to cloud:', error);
  }
}

// 4. Subscribe to Hotels Registry
export function subscribeToHotels(onData: (hotels: Hotel[]) => void): Unsubscribe {
  const docRef = doc(db, 'hotels', 'registry');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.list) && data.list.length > 0) {
        onData(data.list);
      }
    }
  }, (err) => {
    console.warn('Firestore subscription error for hotels registry:', err);
  });
}

// 5. Save Users Registry to Cloud
export async function saveUsersToCloud(users: UserAccount[]): Promise<void> {
  try {
    const docRef = doc(db, 'users', 'registry');
    await setDoc(docRef, { list: JSON.parse(JSON.stringify(users)), updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.warn('Failed to sync users to cloud:', error);
  }
}

// 6. Subscribe to Users Registry
export function subscribeToUsers(onData: (users: UserAccount[]) => void): Unsubscribe {
  const docRef = doc(db, 'users', 'registry');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.list) && data.list.length > 0) {
        onData(data.list);
      }
    }
  }, (err) => {
    console.warn('Firestore subscription error for users registry:', err);
  });
}

// 7. Save Deletion Requests to Cloud
export async function saveDeletionRequestsToCloud(requests: DeletionRequest[]): Promise<void> {
  try {
    const docRef = doc(db, 'deletionRequests', 'registry');
    await setDoc(docRef, { list: JSON.parse(JSON.stringify(requests)), updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.warn('Failed to sync deletion requests to cloud:', error);
  }
}

// 8. Subscribe to Deletion Requests
export function subscribeToDeletionRequests(onData: (requests: DeletionRequest[]) => void): Unsubscribe {
  const docRef = doc(db, 'deletionRequests', 'registry');
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.list)) {
        onData(data.list);
      }
    }
  }, (err) => {
    console.warn('Firestore subscription error for deletion requests:', err);
  });
}
