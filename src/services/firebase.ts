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
  disableNetwork,
  enableNetwork,
  Unsubscribe 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Hotel, UserAccount, HotelDataBundle, DeletionRequest, Booking } from '../types';

// Storage key to remember quota exceeded state for the current day
const STORAGE_KEY_QUOTA_EXCEEDED_DATE = 'tripmakerz_firestore_quota_exceeded_date';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if configured
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Check if quota was already exceeded today
const todayDateKey = new Date().toISOString().slice(0, 10);
let isFirestoreQuotaExceeded = false;
try {
  const savedDate = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_QUOTA_EXCEEDED_DATE) : null;
  if (savedDate === todayDateKey) {
    isFirestoreQuotaExceeded = true;
    console.warn('⚠️ Firestore Free Daily Quota was exceeded today. Operating in Local Persistence Mode.');
    disableNetwork(db).catch(() => {});
  }
} catch {}

let quotaExceededListeners: ((exceeded: boolean) => void)[] = [];

export function isQuotaLimitReached(): boolean {
  return isFirestoreQuotaExceeded;
}

export function onQuotaExceededChange(cb: (exceeded: boolean) => void): () => void {
  quotaExceededListeners.push(cb);
  cb(isFirestoreQuotaExceeded);
  return () => {
    quotaExceededListeners = quotaExceededListeners.filter(l => l !== cb);
  };
}

export function getDatabaseUpgradeUrl(): string {
  const proj = firebaseConfig.projectId;
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  return `https://console.firebase.google.com/project/${proj}/firestore/databases/${dbId}/data?openUpgradeDialog=true`;
}

export function checkAndHandleQuotaError(error: unknown): boolean {
  if (!error) return false;
  const errCode = (error as any)?.code;
  const errMsg = error instanceof Error ? error.message : String(error);
  if (
    errCode === 'resource-exhausted' ||
    errMsg.includes('Quota limit exceeded') ||
    errMsg.includes('Quota exceeded') ||
    errMsg.includes('Free daily write units') ||
    errMsg.includes('Free daily read units') ||
    errMsg.includes('quota metric')
  ) {
    if (!isFirestoreQuotaExceeded) {
      isFirestoreQuotaExceeded = true;
      try {
        localStorage.setItem(STORAGE_KEY_QUOTA_EXCEEDED_DATE, new Date().toISOString().slice(0, 10));
      } catch {}
      console.warn('⚠️ Firestore Daily Free Quota Exceeded. Disabling network requests to stop retry loops and operating safely in Local Storage Mode.');
      // Stop the SDK from retrying write mutations and filling logs
      disableNetwork(db).catch(() => {});
      quotaExceededListeners.forEach(cb => {
        try { cb(true); } catch {}
      });
    }
    return true;
  }
  return false;
}

// Reconnect/retry cloud connection (e.g. after midnight or billing upgrade)
export async function retryCloudConnection(): Promise<boolean> {
  try {
    try {
      localStorage.removeItem(STORAGE_KEY_QUOTA_EXCEEDED_DATE);
    } catch {}
    await enableNetwork(db);
    isFirestoreQuotaExceeded = false;
    quotaExceededListeners.forEach(cb => {
      try { cb(false); } catch {}
    });
    return await testFirebaseConnection();
  } catch (err) {
    checkAndHandleQuotaError(err);
    return false;
  }
}

// Test Connection per Firebase Skill guidelines
export async function testFirebaseConnection(): Promise<boolean> {
  if (isFirestoreQuotaExceeded) {
    return false;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified successfully.');
    return true;
  } catch (error) {
    if (checkAndHandleQuotaError(error)) {
      return false;
    }
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is in offline persistence mode.');
    } else {
      console.log('Firebase connection test note:', error);
    }
    return false;
  }
}

// Automatically test connection on boot only if quota is not already exceeded
if (!isFirestoreQuotaExceeded) {
  testFirebaseConnection().catch(() => {});
}

/**
 * Cloud Sync Service for Multi-Device Real-Time Synchronization
 */

// 1. Fetch Hotel Bundle directly from Cloud
export async function fetchHotelBundleFromCloud(hotelId: string): Promise<HotelDataBundle | null> {
  if (isFirestoreQuotaExceeded) {
    return null;
  }
  try {
    const docRef = doc(db, 'hotelBundles', hotelId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as HotelDataBundle;
    }
    return null;
  } catch (error) {
    if (checkAndHandleQuotaError(error)) return null;
    console.warn(`Failed to fetch hotel bundle ${hotelId} from cloud:`, error);
    return null;
  }
}

// 2. Save Hotel Bundle to Cloud with safe booking merge
export async function saveHotelBundleToCloud(
  hotelId: string, 
  bundle: HotelDataBundle, 
  preserveCloudBookings = false
): Promise<void> {
  if (isFirestoreQuotaExceeded) {
    return;
  }
  try {
    const docRef = doc(db, 'hotelBundles', hotelId);
    
    let finalBookings = [...(bundle.bookings || [])];

    // Optional safe merge: only when explicitly needed
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
        if (checkAndHandleQuotaError(mergeErr)) return;
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
    if (checkAndHandleQuotaError(error)) {
      return;
    }
    console.warn(`Failed to sync hotel bundle ${hotelId} to cloud:`, error);
  }
}

// 3. Instant Single Booking Cloud Sync (Pushes directly so mobile <-> PC is instant)
export async function syncSingleBookingToCloud(hotelId: string, booking: Booking): Promise<void> {
  if (isFirestoreQuotaExceeded) {
    return;
  }
  try {
    // Write to subcollection for instant change listener
    const bRef = doc(db, 'hotelBundles', hotelId, 'liveBookings', booking.id);
    await setDoc(bRef, JSON.parse(JSON.stringify({
      ...booking,
      hotelId,
      updatedAtMs: Date.now()
    })), { merge: true });
  } catch (error) {
    if (checkAndHandleQuotaError(error)) {
      return;
    }
    console.warn('Failed to push single booking to cloud:', error);
  }
}

// 4. Delete Single Booking from Cloud
export async function deleteSingleBookingFromCloud(hotelId: string, bookingId: string): Promise<void> {
  if (isFirestoreQuotaExceeded) {
    return;
  }
  try {
    const bRef = doc(db, 'hotelBundles', hotelId, 'liveBookings', bookingId);
    await deleteDoc(bRef);
  } catch (error) {
    if (checkAndHandleQuotaError(error)) {
      return;
    }
    console.warn('Failed to delete booking from cloud:', error);
  }
}

// 5. Subscribe to Live Bookings Subcollection for Instant Cross-Device Sync
export function subscribeToLiveBookings(
  hotelId: string,
  onBookingChange: (booking: Booking, type: 'added' | 'modified' | 'removed') => void
): Unsubscribe {
  if (isFirestoreQuotaExceeded) {
    return () => {};
  }
  try {
    const colRef = collection(db, 'hotelBundles', hotelId, 'liveBookings');
    return onSnapshot(colRef, (snap) => {
      snap.docChanges().forEach((change) => {
        const data = change.doc.data() as Booking;
        if (data && data.id) {
          onBookingChange(data, change.type);
        }
      });
    }, (err) => {
      if (checkAndHandleQuotaError(err)) return;
      console.warn('Live bookings subcollection listener notice:', err);
    });
  } catch (e) {
    checkAndHandleQuotaError(e);
    return () => {};
  }
}

// 6. Real-time Subscription to Active Hotel Bundle
export function subscribeToHotelBundle(
  hotelId: string, 
  onData: (bundle: HotelDataBundle) => void
): Unsubscribe {
  if (isFirestoreQuotaExceeded) {
    return () => {};
  }
  try {
    const docRef = doc(db, 'hotelBundles', hotelId);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as HotelDataBundle;
        if (data && data.rooms && data.bookings) {
          onData(data);
        }
      }
    }, (err) => {
      if (checkAndHandleQuotaError(err)) return;
      console.warn(`Firestore subscription error for bundle ${hotelId}:`, err);
    });
  } catch (e) {
    checkAndHandleQuotaError(e);
    return () => {};
  }
}

// 7. Save Hotels Registry to Cloud
export async function saveHotelsToCloud(hotels: Hotel[]): Promise<void> {
  if (isFirestoreQuotaExceeded) {
    return;
  }
  try {
    const docRef = doc(db, 'hotels', 'registry');
    await setDoc(docRef, { list: JSON.parse(JSON.stringify(hotels)), updatedAt: new Date().toISOString() }, { merge: false });
  } catch (error) {
    if (checkAndHandleQuotaError(error)) {
      return;
    }
    console.warn('Failed to sync hotels to cloud:', error);
  }
}

// 7b. Delete Hotel Bundle from Cloud
export async function deleteHotelBundleFromCloud(hotelId: string): Promise<void> {
  if (isFirestoreQuotaExceeded) {
    return;
  }
  try {
    const docRef = doc(db, 'hotelBundles', hotelId);
    await deleteDoc(docRef);
  } catch (error) {
    if (checkAndHandleQuotaError(error)) return;
    console.warn(`Failed to delete hotel bundle ${hotelId} from cloud:`, error);
  }
}

// 8. Subscribe to Hotels Registry
export function subscribeToHotels(onData: (hotels: Hotel[]) => void): Unsubscribe {
  if (isFirestoreQuotaExceeded) {
    return () => {};
  }
  try {
    const docRef = doc(db, 'hotels', 'registry');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.list) && data.list.length > 0) {
          onData(data.list);
        }
      }
    }, (err) => {
      if (checkAndHandleQuotaError(err)) return;
      console.warn('Firestore subscription error for hotels registry:', err);
    });
  } catch (e) {
    checkAndHandleQuotaError(e);
    return () => {};
  }
}

// 9. Save Users Registry to Cloud
export async function saveUsersToCloud(users: UserAccount[]): Promise<void> {
  if (isFirestoreQuotaExceeded) {
    return;
  }
  try {
    const docRef = doc(db, 'users', 'registry');
    await setDoc(docRef, { list: JSON.parse(JSON.stringify(users)), updatedAt: new Date().toISOString() }, { merge: false });
  } catch (error) {
    if (checkAndHandleQuotaError(error)) {
      return;
    }
    console.warn('Failed to sync users to cloud:', error);
  }
}

// 10. Subscribe to Users Registry
export function subscribeToUsers(onData: (users: UserAccount[]) => void): Unsubscribe {
  if (isFirestoreQuotaExceeded) {
    return () => {};
  }
  try {
    const docRef = doc(db, 'users', 'registry');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.list) && data.list.length > 0) {
          onData(data.list);
        }
      }
    }, (err) => {
      if (checkAndHandleQuotaError(err)) return;
      console.warn('Firestore subscription error for users registry:', err);
    });
  } catch (e) {
    checkAndHandleQuotaError(e);
    return () => {};
  }
}

// 11. Save Deletion Requests to Cloud
export async function saveDeletionRequestsToCloud(requests: DeletionRequest[]): Promise<void> {
  if (isFirestoreQuotaExceeded) {
    return;
  }
  try {
    const docRef = doc(db, 'deletionRequests', 'registry');
    await setDoc(docRef, { list: JSON.parse(JSON.stringify(requests)), updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    if (checkAndHandleQuotaError(error)) {
      return;
    }
    console.warn('Failed to sync deletion requests to cloud:', error);
  }
}

// 12. Subscribe to Deletion Requests
export function subscribeToDeletionRequests(onData: (requests: DeletionRequest[]) => void): Unsubscribe {
  if (isFirestoreQuotaExceeded) {
    return () => {};
  }
  try {
    const docRef = doc(db, 'deletionRequests', 'registry');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.list)) {
          onData(data.list);
        }
      }
    }, (err) => {
      if (checkAndHandleQuotaError(err)) return;
      console.warn('Firestore subscription error for deletion requests:', err);
    });
  } catch (e) {
    checkAndHandleQuotaError(e);
    return () => {};
  }
}

// 13. Sync Hotel Slug Index to Cloud
export async function syncHotelSlugToCloud(hotelId: string, slug: string): Promise<void> {
  if (isFirestoreQuotaExceeded || !slug) return;
  try {
    const slugRef = doc(db, 'hotelSlugs', slug);
    await setDoc(slugRef, { hotelId, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    if (checkAndHandleQuotaError(e)) return;
    console.warn('Failed to sync hotel slug index:', e);
  }
}
