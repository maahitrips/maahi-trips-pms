import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  getDocFromServer,
  collection,
  deleteDoc,
  Unsubscribe 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Hotel, UserAccount, HotelDataBundle, DeletionRequest, Booking } from '../types';

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

// 1. Fetch Hotel Bundle directly from Cloud
export async function fetchHotelBundleFromCloud(hotelId: string): Promise<HotelDataBundle | null> {
  try {
    const docRef = doc(db, 'hotelBundles', hotelId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as HotelDataBundle;
    }
    return null;
  } catch (error) {
    console.warn(`Failed to fetch hotel bundle ${hotelId} from cloud:`, error);
    return null;
  }
}

// 2. Save Hotel Bundle to Cloud with safe booking merge
export async function saveHotelBundleToCloud(
  hotelId: string, 
  bundle: HotelDataBundle, 
  preserveCloudBookings = true
): Promise<void> {
  try {
    const docRef = doc(db, 'hotelBundles', hotelId);
    
    let finalBookings = [...(bundle.bookings || [])];

    // Safe merge: ensure we don't accidentally wipe out bookings created on mobile/other device
    if (preserveCloudBookings) {
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const cloudData = snap.data();
          if (Array.isArray(cloudData.bookings) && cloudData.bookings.length > 0) {
            const bookingMap = new Map<string, any>();
            // Cloud bookings first
            cloudData.bookings.forEach((b: any) => {
              if (b && b.id) bookingMap.set(b.id, b);
            });
            // Local bookings override/add
            finalBookings.forEach((b: any) => {
              if (b && b.id) bookingMap.set(b.id, b);
            });
            finalBookings = Array.from(bookingMap.values());
          }
        }
      } catch (mergeErr) {
        console.warn('Safe merge fallback:', mergeErr);
      }
    }

    // Sanitize undefined fields which Firestore rejects
    const payload = JSON.parse(JSON.stringify({
      ...bundle,
      bookings: finalBookings,
      hotelId,
      updatedAt: new Date().toISOString(),
      updatedAtMs: Date.now()
    }));
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    console.warn(`Failed to sync hotel bundle ${hotelId} to cloud:`, error);
  }
}

// 3. Instant Single Booking Cloud Sync (Pushes directly so mobile <-> PC is instant)
export async function syncSingleBookingToCloud(hotelId: string, booking: Booking): Promise<void> {
  try {
    // Write to subcollection for instant change listener
    const bRef = doc(db, 'hotelBundles', hotelId, 'liveBookings', booking.id);
    await setDoc(bRef, JSON.parse(JSON.stringify({
      ...booking,
      hotelId,
      updatedAtMs: Date.now()
    })), { merge: true });

    // Also update parent bundle's booking list so anyone fetching the bundle gets it
    const bundleRef = doc(db, 'hotelBundles', hotelId);
    const snap = await getDoc(bundleRef);
    if (snap.exists()) {
      const data = snap.data() as HotelDataBundle;
      const existing = Array.isArray(data.bookings) ? [...data.bookings] : [];
      const idx = existing.findIndex(b => b.id === booking.id);
      if (idx >= 0) {
        existing[idx] = booking;
      } else {
        existing.unshift(booking);
      }
      await setDoc(bundleRef, {
        bookings: JSON.parse(JSON.stringify(existing)),
        updatedAt: new Date().toISOString(),
        updatedAtMs: Date.now()
      }, { merge: true });
    }
  } catch (error) {
    console.warn('Failed to push single booking to cloud:', error);
  }
}

// 4. Delete Single Booking from Cloud
export async function deleteSingleBookingFromCloud(hotelId: string, bookingId: string): Promise<void> {
  try {
    const bRef = doc(db, 'hotelBundles', hotelId, 'liveBookings', bookingId);
    await deleteDoc(bRef);

    const bundleRef = doc(db, 'hotelBundles', hotelId);
    const snap = await getDoc(bundleRef);
    if (snap.exists()) {
      const data = snap.data() as HotelDataBundle;
      if (Array.isArray(data.bookings)) {
        const filtered = data.bookings.filter(b => b.id !== bookingId);
        await setDoc(bundleRef, {
          bookings: JSON.parse(JSON.stringify(filtered)),
          updatedAt: new Date().toISOString(),
          updatedAtMs: Date.now()
        }, { merge: true });
      }
    }
  } catch (error) {
    console.warn('Failed to delete booking from cloud:', error);
  }
}

// 5. Subscribe to Live Bookings Subcollection for Instant Cross-Device Sync
export function subscribeToLiveBookings(
  hotelId: string,
  onBookingChange: (booking: Booking, type: 'added' | 'modified' | 'removed') => void
): Unsubscribe {
  const colRef = collection(db, 'hotelBundles', hotelId, 'liveBookings');
  return onSnapshot(colRef, (snap) => {
    snap.docChanges().forEach((change) => {
      const data = change.doc.data() as Booking;
      if (data && data.id) {
        onBookingChange(data, change.type);
      }
    });
  }, (err) => {
    console.warn('Live bookings subcollection listener notice:', err);
  });
}

// 6. Real-time Subscription to Active Hotel Bundle
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
