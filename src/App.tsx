import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Room, 
  Booking, 
  BookingChannel,
  OTAChannelConfig, 
  RoomTypeMapping, 
  ChannelSyncLog, 
  HotelProfile, 
  RoomStatus,
  IdDocument,
  Hotel,
  UserAccount,
  HotelDataBundle,
  DeletionRequest,
  DynamicPricingConfig,
  LastMinuteRateAutomationConfig,
  PaymentMode
} from './types';
import { 
  initialHotelProfile, 
  initialRooms, 
  initialBookings, 
  initialOTAChannels, 
  initialRoomMappings, 
  initialSyncLogs 
} from './data/initialData';
import { 
  initialHotels, 
  initialUsers, 
  initialHotelBundles, 
  createDefaultHotelBundle 
} from './data/multiHotelData';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DeskCalendar } from './components/DeskCalendar';
import { BookingModal } from './components/BookingModal';
import { BookingDetailsDrawer } from './components/BookingDetailsDrawer';
import { ChannelManagerView } from './components/ChannelManagerView';
import { GuestIdVault } from './components/GuestIdVault';
import { SimulateOtaModal } from './components/SimulateOtaModal';
import { InvoiceModal } from './components/InvoiceModal';
import { AnalyticsView } from './components/AnalyticsView';
import { HousekeepingView } from './components/HousekeepingView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { SettingsView } from './components/SettingsView';
import { CheckInIdModal } from './components/CheckInIdModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LoginModal } from './components/LoginModal';
import { AddHotelModal } from './components/AddHotelModal';
import { AddRoomModal } from './components/AddRoomModal';
import { CreateUserModal } from './components/CreateUserModal';
import { SuperAdminDeleteModal } from './components/SuperAdminDeleteModal';
import { GmailView } from './components/GmailView';
import { GeminiChatView } from './components/GeminiChatView';
import { BookingEngineView } from './components/BookingEngineView';
import { GoogleHotelsView } from './components/GoogleHotelsView';
import { PhotoGalleryView } from './components/PhotoGalleryView';
import { PublicHotelBookingView } from './components/PublicHotelBookingView';
import { GeminiFloatingWidget } from './components/GeminiFloatingWidget';
import { DynamicPricingRulesModal } from './components/DynamicPricingRulesModal';
import { InstallAppModal } from './components/InstallAppModal';
import { 
  defaultLastMinuteConfig, 
  evaluateLastMinuteAutomation, 
  LastMinuteRuleStatus 
} from './utils/pricingHelper';
import { CheckCircle2, Zap, X } from 'lucide-react';
import { canUserAddProperty, isSuperAdminUser } from './utils/permissionHelper';
import { getTodayDateStr, addDaysToStr } from './utils/dateHelper';
import { 
  saveHotelBundleToCloud, 
  fetchHotelBundleFromCloud,
  syncSingleBookingToCloud,
  subscribeToLiveBookings,
  subscribeToHotelBundle, 
  saveHotelsToCloud, 
  deleteHotelBundleFromCloud,
  subscribeToHotels, 
  saveUsersToCloud, 
  subscribeToUsers, 
  saveDeletionRequestsToCloud, 
  subscribeToDeletionRequests,
  testFirebaseConnection,
  isQuotaLimitReached,
  onQuotaExceededChange,
  getDatabaseUpgradeUrl,
  retryCloudConnection,
  syncHotelSlugToCloud
} from './services/firebase';

const STORAGE_KEY_HOTELS = 'tripmakerz_hotels_v2';
const STORAGE_KEY_USERS = 'tripmakerz_users_v2';
const STORAGE_KEY_CURRENT_USER = 'tripmakerz_current_user_v2';
const STORAGE_KEY_ACTIVE_HOTEL_ID = 'tripmakerz_active_hotel_id_v2';
const STORAGE_KEY_DELETION_REQUESTS = 'tripmakerz_deletion_requests_v2';

// Helper to get bundle storage key
const getHotelBundleKey = (hotelId: string) => `tripmakerz_pms_bundle_${hotelId}`;

// Helper to migrate any old 17-Sept seed bookings forward by +8 days and ensure 5% GST
const migrateOldDates = (bundle: HotelDataBundle): HotelDataBundle => {
  if (!bundle || !bundle.bookings) return bundle;
  let hasChanges = false;
  
  bundle.bookings = bundle.bookings.map(b => {
    let updated = { ...b };
    // Enforce 5% GST standard across all bookings
    if (updated.taxRatePercent !== 5) {
      updated.taxRatePercent = 5;
      hasChanges = true;
    }
    if (updated.checkInDate && updated.checkInDate.startsWith('2026-09-1')) {
      const partsIn = updated.checkInDate.split('-').map(Number);
      const partsOut = updated.checkOutDate.split('-').map(Number);
      const dIn = new Date(partsIn[0], partsIn[1] - 1, partsIn[2]);
      const dOut = new Date(partsOut[0], partsOut[1] - 1, partsOut[2]);
      dIn.setDate(dIn.getDate() + 8);
      dOut.setDate(dOut.getDate() + 8);
      updated.checkInDate = getTodayDateStr(dIn);
      updated.checkOutDate = getTodayDateStr(dOut);
      hasChanges = true;
    }
    return updated;
  });

  if (hasChanges) {
    try {
      localStorage.setItem(getHotelBundleKey(bundle.hotelId), JSON.stringify(bundle));
    } catch {
      // ignore
    }
  }
  return bundle;
};

// Helper to recover and load hotels from localStorage
const getInitialHotelsWithRecovery = (): Hotel[] => {
  const saved = localStorage.getItem(STORAGE_KEY_HOTELS);
  if (saved) {
    try {
      const parsed: Hotel[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved hotels', e);
    }
  }
  return initialHotels;
};

// Helper to load hotel data bundle with legacy data preservation, wrong data auto-healing, and safe name retention
const loadHotelBundle = (hotelId: string, knownHotelsList?: Hotel[], forceRestore = false): HotelDataBundle => {
  // If forceRestore requested, immediately clone pristine bundle from defaults
  if (forceRestore && initialHotelBundles[hotelId]) {
    const pristine = JSON.parse(JSON.stringify(initialHotelBundles[hotelId]));
    try {
      localStorage.setItem(getHotelBundleKey(hotelId), JSON.stringify(pristine));
    } catch {}
    return pristine;
  }

  const saved = localStorage.getItem(getHotelBundleKey(hotelId));
  const knownHotels = knownHotelsList && knownHotelsList.length > 0 ? knownHotelsList : initialHotels;
  const currentHotel = knownHotels.find(h => h.id === hotelId);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const migrated = migrateOldDates(parsed);
      if (!migrated.dynamicPricing) {
        migrated.dynamicPricing = {
          isEnabled: true,
          tier1ThresholdPercent: 50,
          tier1SurgePercent: 10,
          tier2ThresholdPercent: 80,
          tier2SurgePercent: 20,
          applyToAllChannels: true,
          lastMinuteAutomation: defaultLastMinuteConfig
        };
      } else if (!migrated.dynamicPricing.lastMinuteAutomation) {
        migrated.dynamicPricing.lastMinuteAutomation = defaultLastMinuteConfig;
      }

      // If Big House Inn, ensure Nikita booking (bk-009) is present
      if (hotelId === 'hotel-bighouse' && Array.isArray(migrated.bookings)) {
        const hasNikita = migrated.bookings.some((b: any) => 
          (b.guest?.fullName || '').toLowerCase().includes('nikita') || 
          (b.guest?.fullName || '').toLowerCase().includes('nikta')
        );
        if (!hasNikita) {
          const nikitaBooking = initialBookings.find(b => b.id === 'bk-009');
          if (nikitaBooking) {
            migrated.bookings.push(nikitaBooking);
            try {
              localStorage.setItem(getHotelBundleKey('hotel-bighouse'), JSON.stringify(migrated));
            } catch {}
          }
        }
      }

      // If bundle profile is missing or got corrupted to Big House Inn for a non-Big House Inn property, restore it!
      if (currentHotel && currentHotel.id !== 'hotel-bighouse' && currentHotel.name) {
        if (!migrated.profile || migrated.profile.name === 'Big House Inn') {
          migrated.profile = {
            ...(migrated.profile || initialHotelProfile),
            name: currentHotel.name,
            city: currentHotel.city || migrated.profile?.city || 'India',
            address: currentHotel.address || migrated.profile?.address || '',
            phone: currentHotel.phone || migrated.profile?.phone || '+91 96481 33671',
            gstin: currentHotel.gstin || migrated.profile?.gstin || ''
          };
        }
      }

      return migrated;
    } catch (e) {
      console.error('Error parsing hotel bundle', e);
    }
  }

  // If Big House Inn, check if legacy keys exist
  if (hotelId === 'hotel-bighouse') {
    const legacyRooms = localStorage.getItem('tripmakerz_pms_rooms_v1');
    const legacyBookings = localStorage.getItem('tripmakerz_pms_bookings_v2');
    const legacyChannels = localStorage.getItem('tripmakerz_pms_channels_v1');
    const legacyMappings = localStorage.getItem('tripmakerz_pms_mappings_v1');
    const legacyLogs = localStorage.getItem('tripmakerz_pms_logs_v1');
    const legacyProfile = localStorage.getItem('tripmakerz_pms_profile_v1');

    if (legacyRooms || legacyBookings) {
      const bundle: HotelDataBundle = {
        hotelId: 'hotel-bighouse',
        profile: legacyProfile ? JSON.parse(legacyProfile) : initialHotelProfile,
        rooms: legacyRooms ? JSON.parse(legacyRooms) : initialRooms,
        bookings: legacyBookings ? JSON.parse(legacyBookings) : initialBookings,
        channels: legacyChannels ? JSON.parse(legacyChannels) : initialOTAChannels,
        roomMappings: legacyMappings ? JSON.parse(legacyMappings) : initialRoomMappings,
        syncLogs: legacyLogs ? JSON.parse(legacyLogs) : initialSyncLogs,
        dynamicPricing: {
          isEnabled: true,
          tier1ThresholdPercent: 50,
          tier1SurgePercent: 10,
          tier2ThresholdPercent: 80,
          tier2SurgePercent: 20,
          applyToAllChannels: true,
          lastMinuteAutomation: defaultLastMinuteConfig
        }
      };
      return migrateOldDates(bundle);
    }
  }

  // Fallback to initial mock bundles
  if (initialHotelBundles[hotelId]) {
    const b = initialHotelBundles[hotelId];
    if (!b.dynamicPricing) {
      b.dynamicPricing = {
        isEnabled: true,
        tier1ThresholdPercent: 50,
        tier1SurgePercent: 10,
        tier2ThresholdPercent: 80,
        tier2SurgePercent: 20,
        applyToAllChannels: true,
        lastMinuteAutomation: defaultLastMinuteConfig
      };
    }
    return b;
  }

  // Check all known hotels (including user created properties)
  const foundHotel = currentHotel || initialHotels.find(h => h.id === hotelId);
  if (foundHotel) {
    const b = createDefaultHotelBundle(foundHotel, 8);
    b.dynamicPricing = {
      isEnabled: true,
      tier1ThresholdPercent: 50,
      tier1SurgePercent: 10,
      tier2ThresholdPercent: 80,
      tier2SurgePercent: 20,
      applyToAllChannels: true,
      lastMinuteAutomation: defaultLastMinuteConfig
    };
    return b;
  }

  return {
    hotelId,
    profile: {
      ...initialHotelProfile,
      name: hotelId === 'hotel-bighouse' ? 'Big House Inn' : `Hotel (${hotelId.replace('hotel-', '')})`
    },
    rooms: initialRooms,
    bookings: initialBookings,
    channels: initialOTAChannels,
    roomMappings: initialRoomMappings,
    syncLogs: initialSyncLogs,
    dynamicPricing: {
      isEnabled: true,
      tier1ThresholdPercent: 50,
      tier1SurgePercent: 10,
      tier2ThresholdPercent: 80,
      tier2SurgePercent: 20,
      applyToAllChannels: true,
      lastMinuteAutomation: defaultLastMinuteConfig
    }
  };
};

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('desk');
  const [settingsInitialSubTab, setSettingsInitialSubTab] = useState<'profile' | 'rooms' | 'hotels' | 'users' | 'requests' | 'backup' | 'domain_connect'>('profile');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Multi-Hotel & Multi-User State with comprehensive data recovery
  const [hotels, setHotels] = useState<Hotel[]>(() => {
    return getInitialHotelsWithRecovery();
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS);
    let combinedUsers = initialUsers;
    if (saved) {
      try {
        const parsed: UserAccount[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingUsernames = new Set(parsed.map(u => (u.username || '').toLowerCase()));
          const missingFromInitial = initialUsers.filter(u => !existingUsernames.has((u.username || '').toLowerCase()));
          combinedUsers = [...parsed, ...missingFromInitial];
        }
      } catch (e) {
        console.error('Failed to parse users', e);
      }
    }

    const finalUsers = combinedUsers.map(u => {
      if (u.role === 'super_admin' || u.id === 'user-admin') {
        return {
          ...u,
          name: 'Maahi Trips',
          designation: 'Super Admin • Group Managing Director',
          username: 'maahitrips',
          password: '417905kpj',
          phone: '+91 96481 33671',
          avatarText: '👑'
        };
      }
      return u;
    });

    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(finalUsers));
    } catch {}

    return finalUsers;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    } catch {}
    return null;
  });

  const [activeHotelId, setActiveHotelId] = useState<string>(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_HOTEL_ID, 'hotel-bighouse');
    } catch {}
    return 'hotel-bighouse';
  });

  // Current Hotel Data State (isolated per hotel)
  const [rooms, setRooms] = useState<Room[]>(() => loadHotelBundle(activeHotelId).rooms);
  const [bookings, setBookings] = useState<Booking[]>(() => loadHotelBundle(activeHotelId).bookings);
  const [channels, setChannels] = useState<OTAChannelConfig[]>(() => loadHotelBundle(activeHotelId).channels);
  const [roomMappings, setRoomMappings] = useState<RoomTypeMapping[]>(() => loadHotelBundle(activeHotelId).roomMappings);
  const [syncLogs, setSyncLogs] = useState<ChannelSyncLog[]>(() => loadHotelBundle(activeHotelId).syncLogs);
  const [hotelProfile, setHotelProfile] = useState<HotelProfile>(() => loadHotelBundle(activeHotelId).profile);

  // Dynamic Yield Pricing & 7:00 AM Last-Minute Automation State (isolated per hotel)
  const [dynamicPricing, setDynamicPricing] = useState<DynamicPricingConfig>(() => {
    const loaded = loadHotelBundle(activeHotelId);
    if (loaded && loaded.dynamicPricing) {
      return {
        ...loaded.dynamicPricing,
        lastMinuteAutomation: loaded.dynamicPricing.lastMinuteAutomation || defaultLastMinuteConfig
      };
    }
    return {
      isEnabled: true,
      tier1ThresholdPercent: 50,
      tier1SurgePercent: 10,
      tier2ThresholdPercent: 80,
      tier2SurgePercent: 20,
      applyToAllChannels: true,
      lastMinuteAutomation: defaultLastMinuteConfig
    };
  });

  // Multi-Hotel & Authentication Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isAddHotelModalOpen, setIsAddHotelModalOpen] = useState<boolean>(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState<boolean>(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState<boolean>(false);

  // Super Admin Deletion Guard & Request State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    targetType: 'room' | 'hotel';
    targetId: string;
    targetName: string;
    hotelId: string;
    hotelName: string;
    activeBookingsCount?: number;
  }>({
    isOpen: false,
    targetType: 'room',
    targetId: '',
    targetName: '',
    hotelId: '',
    hotelName: '',
    activeBookingsCount: 0
  });

  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DELETION_REQUESTS);
    return saved ? JSON.parse(saved) : [];
  });

  // Modals & Drawers state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [bookingModalMode, setBookingModalMode] = useState<'single' | 'multi'>('single');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [preSelectedRoomId, setPreSelectedRoomId] = useState<string | undefined>();
  const [preSelectedDate, setPreSelectedDate] = useState<string | undefined>();

  const handleOpenNewBooking = (mode: 'single' | 'multi' = 'single') => {
    setBookingModalMode(mode);
    setEditingBooking(null);
    setPreSelectedRoomId(undefined);
    setPreSelectedDate(getTodayDateStr());
    setIsBookingModalOpen(true);
  };

  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);
  const [checkInIdModalBooking, setCheckInIdModalBooking] = useState<Booking | null>(null);
  const [invoiceModal, setInvoiceModal] = useState<{ isOpen: boolean; booking: Booking | null; mode: 'invoice' | 'grc' }>({
    isOpen: false,
    booking: null,
    mode: 'invoice'
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastNotification, setToastNotification] = useState<{ message: string; sub?: string } | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(() => isQuotaLimitReached());
  const [isQuotaBannerDismissed, setIsQuotaBannerDismissed] = useState<boolean>(false);
  const [isRetryingCloud, setIsRetryingCloud] = useState<boolean>(false);

  useEffect(() => {
    return onQuotaExceededChange(setIsQuotaExceeded);
  }, []);

  // Mobile App Install (PWA) state
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallAppPrompt = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      try {
        const choice = await deferredInstallPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          showToast('App Installed!', 'Maahi Trips Hotel PMS icon added to your mobile home screen.');
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      }
      setDeferredInstallPrompt(null);
      setIsInstallModalOpen(false);
    }
  };

  // Sync state tracking refs to avoid echo ping-pong loops and startup overwrites
  const isRemoteSyncRef = useRef<boolean>(false);
  const isInitialBootRef = useRef<boolean>(true);
  const cloudSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevHotelsJsonRef = useRef<string>('');
  const prevUsersJsonRef = useRef<string>('');
  const prevDeletionReqsJsonRef = useRef<string>('');
  const hotelsSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const usersSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const delReqsSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and verify Firestore Cloud Connection, and fetch latest cloud state FIRST
  useEffect(() => {
    let isMounted = true;
    testFirebaseConnection().then(async (connected) => {
      if (!isMounted) return;
      setIsCloudConnected(connected);
      if (connected) {
        try {
          // Fetch latest cloud bundle to ensure any booking created on mobile or another computer is loaded immediately
          const cloudBundle = await fetchHotelBundleFromCloud(activeHotelId);
          if (cloudBundle && Array.isArray(cloudBundle.bookings) && cloudBundle.bookings.length > 0) {
            isRemoteSyncRef.current = true;
            
            // Merge with local storage in case local device had unpushed records
            const localBundle = loadHotelBundle(activeHotelId);
            const bookingMap = new Map<string, Booking>();
            (localBundle.bookings || []).forEach(b => bookingMap.set(b.id, b));
            cloudBundle.bookings.forEach(b => bookingMap.set(b.id, b));
            const mergedBookings = Array.from(bookingMap.values());

            if (cloudBundle.profile) setHotelProfile(cloudBundle.profile);
            if (cloudBundle.rooms) setRooms(cloudBundle.rooms);
            setBookings(mergedBookings);
            if (cloudBundle.channels) setChannels(cloudBundle.channels);
            if (cloudBundle.roomMappings) setRoomMappings(cloudBundle.roomMappings);

            // Update local storage cache with cloud data
            localStorage.setItem(getHotelBundleKey(activeHotelId), JSON.stringify({
              ...cloudBundle,
              bookings: mergedBookings
            }));
          } else {
            // Cloud has no data yet, safely seed it with local state
            const currentBundle: HotelDataBundle = {
              hotelId: activeHotelId,
              profile: hotelProfile,
              rooms,
              bookings,
              channels,
              roomMappings,
              syncLogs
            };
            saveHotelBundleToCloud(activeHotelId, currentBundle, false);
            saveHotelsToCloud(hotels);
            saveUsersToCloud(users);
          }
        } catch (err) {
          console.warn('Initial cloud sync error:', err);
        } finally {
          setTimeout(() => {
            isInitialBootRef.current = false;
          }, 600);
        }
      } else {
        isInitialBootRef.current = false;
      }
    });
    return () => { isMounted = false; };
  }, [activeHotelId]);

  // Real-time Cloud Subscriptions across devices (hotels, users, deletion requests)
  useEffect(() => {
    // Immediately persist and sync single Big House Inn property to Firestore
    saveHotelsToCloud([initialHotels[0]]);

    const deletedHotelIds = new Set([
      'hotel-royalguesthouse',
      'hotel-sairesidency',
      'hotel-grandheritage'
    ]);

    deletedHotelIds.forEach(id => {
      deleteHotelBundleFromCloud(id).catch(() => {});
    });

    const unsubHotels = subscribeToHotels((cloudHotels) => {
      if (cloudHotels && cloudHotels.length > 0) {
        // Filter out any unwanted/deleted hotels so they never revive
        const filteredCloud = cloudHotels.filter(h => 
          h.id === 'hotel-bighouse' || !deletedHotelIds.has(h.id)
        );

        setHotels(prevHotels => {
          const map = new Map<string, Hotel>();
          filteredCloud.forEach(h => map.set(h.id, h));
          prevHotels.forEach(h => {
            if (!map.has(h.id)) {
              map.set(h.id, h);
            }
          });
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(STORAGE_KEY_HOTELS, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });
    // Persist and sync users to Firestore
    saveUsersToCloud(initialUsers);

    const unsubUsers = subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(prevUsers => {
          const map = new Map<string, UserAccount>();
          cloudUsers.forEach(u => map.set(u.id, u));
          prevUsers.forEach(u => {
            if (!map.has(u.id)) {
              map.set(u.id, u);
            }
          });
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });
    const unsubRequests = subscribeToDeletionRequests((cloudReqs) => {
      if (cloudReqs) {
        setDeletionRequests(cloudReqs);
      }
    });
    return () => {
      unsubHotels();
      unsubUsers();
      unsubRequests();
    };
  }, []);

  // Real-time active hotel bundle AND liveBookings subcollection subscription for instant multi-device sync
  useEffect(() => {
    if (!activeHotelId) return;

    // 1. Full bundle changes (rooms, rates, profiles, full booking list)
    const unsubBundle = subscribeToHotelBundle(activeHotelId, (cloudBundle) => {
      if (cloudBundle) {
        isRemoteSyncRef.current = true;
        if (cloudBundle.profile) setHotelProfile(cloudBundle.profile);
        if (cloudBundle.rooms) setRooms(cloudBundle.rooms);
        if (cloudBundle.bookings && Array.isArray(cloudBundle.bookings)) {
          setBookings(prev => {
            const map = new Map<string, Booking>();
            prev.forEach(b => map.set(b.id, b));
            cloudBundle.bookings.forEach(b => map.set(b.id, b));
            return Array.from(map.values());
          });
        }
        if (cloudBundle.channels) setChannels(cloudBundle.channels);
        if (cloudBundle.roomMappings) setRoomMappings(cloudBundle.roomMappings);
        if (cloudBundle.syncLogs) setSyncLogs(cloudBundle.syncLogs);
        if (cloudBundle.dynamicPricing) {
          setDynamicPricing({
            ...cloudBundle.dynamicPricing,
            lastMinuteAutomation: cloudBundle.dynamicPricing.lastMinuteAutomation || defaultLastMinuteConfig
          });
        }
      }
    });

    // 2. Instant sub-second single booking updates (when mobile or any device saves a booking)
    const unsubLive = subscribeToLiveBookings(activeHotelId, (booking, changeType) => {
      isRemoteSyncRef.current = true;
      if (changeType === 'removed') {
        setBookings(prev => prev.filter(b => b.id !== booking.id));
      } else {
        setBookings(prev => {
          const idx = prev.findIndex(b => b.id === booking.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = booking;
            return copy;
          }
          return [booking, ...prev];
        });
      }
    });

    return () => {
      unsubBundle();
      unsubLive();
    };
  }, [activeHotelId]);

  // Persist multi-hotel metadata & active user
  useEffect(() => {
    const json = JSON.stringify(hotels);
    localStorage.setItem(STORAGE_KEY_HOTELS, json);
    if (!isQuotaLimitReached() && !isInitialBootRef.current && prevHotelsJsonRef.current && prevHotelsJsonRef.current !== json) {
      if (hotelsSyncTimerRef.current) clearTimeout(hotelsSyncTimerRef.current);
      hotelsSyncTimerRef.current = setTimeout(() => {
        saveHotelsToCloud(hotels);
      }, 2000);
    }
    prevHotelsJsonRef.current = json;
    return () => {
      if (hotelsSyncTimerRef.current) clearTimeout(hotelsSyncTimerRef.current);
    };
  }, [hotels]);

  useEffect(() => {
    const json = JSON.stringify(users);
    localStorage.setItem(STORAGE_KEY_USERS, json);
    if (!isQuotaLimitReached() && !isInitialBootRef.current && prevUsersJsonRef.current && prevUsersJsonRef.current !== json) {
      if (usersSyncTimerRef.current) clearTimeout(usersSyncTimerRef.current);
      usersSyncTimerRef.current = setTimeout(() => {
        saveUsersToCloud(users);
      }, 2000);
    }
    prevUsersJsonRef.current = json;
    return () => {
      if (usersSyncTimerRef.current) clearTimeout(usersSyncTimerRef.current);
    };
  }, [users]);

  useEffect(() => {
    const json = JSON.stringify(deletionRequests);
    localStorage.setItem(STORAGE_KEY_DELETION_REQUESTS, json);
    if (!isQuotaLimitReached() && !isInitialBootRef.current && prevDeletionReqsJsonRef.current && prevDeletionReqsJsonRef.current !== json) {
      if (delReqsSyncTimerRef.current) clearTimeout(delReqsSyncTimerRef.current);
      delReqsSyncTimerRef.current = setTimeout(() => {
        saveDeletionRequestsToCloud(deletionRequests);
      }, 2000);
    }
    prevDeletionReqsJsonRef.current = json;
    return () => {
      if (delReqsSyncTimerRef.current) clearTimeout(delReqsSyncTimerRef.current);
    };
  }, [deletionRequests]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ACTIVE_HOTEL_ID, activeHotelId);
  }, [activeHotelId]);

  // Persist current hotel's bundle whenever its internal state changes
  useEffect(() => {
    const currentBundle: HotelDataBundle = {
      hotelId: activeHotelId,
      profile: hotelProfile,
      rooms,
      bookings,
      channels,
      roomMappings,
      syncLogs,
      dynamicPricing
    };

    // Always update local cache immediately
    localStorage.setItem(getHotelBundleKey(activeHotelId), JSON.stringify(currentBundle));

    // If change was received from cloud, do not echo it back to cloud
    if (isRemoteSyncRef.current) {
      isRemoteSyncRef.current = false;
      return;
    }

    // If app is still booting/checking cloud, do not overwrite cloud with stale initial cache
    if (isInitialBootRef.current) {
      return;
    }

    // Also update legacy keys if Big House Inn
    if (activeHotelId === 'hotel-bighouse') {
      localStorage.setItem('tripmakerz_pms_rooms_v1', JSON.stringify(rooms));
      localStorage.setItem('tripmakerz_pms_bookings_v2', JSON.stringify(bookings));
      localStorage.setItem('tripmakerz_pms_profile_v1', JSON.stringify(hotelProfile));
    }

    // If quota is already exceeded, do not attempt cloud write
    if (isQuotaLimitReached()) {
      return;
    }

    // Debounce cloud write to save free tier write units
    if (cloudSyncTimerRef.current) {
      clearTimeout(cloudSyncTimerRef.current);
    }
    cloudSyncTimerRef.current = setTimeout(() => {
      saveHotelBundleToCloud(activeHotelId, currentBundle, false);
    }, 2000);

    return () => {
      if (cloudSyncTimerRef.current) {
        clearTimeout(cloudSyncTimerRef.current);
      }
    };
  }, [
    activeHotelId,
    hotelProfile,
    rooms,
    bookings,
    channels,
    roomMappings,
    syncLogs,
    dynamicPricing
  ]);

  // Automatically sync active hotel's address, city, and details into the hotels list
  useEffect(() => {
    setHotels(prev => {
      const match = prev.find(h => h.id === activeHotelId);
      // Guard: Do not overwrite custom hotel's name with "Big House Inn" if it's not Big House Inn
      const isInvalidNameOverwrite = activeHotelId !== 'hotel-bighouse' && hotelProfile.name === 'Big House Inn';
      if (
        match &&
        !isInvalidNameOverwrite &&
        (match.address !== hotelProfile.address ||
          match.city !== hotelProfile.city ||
          (hotelProfile.name && match.name !== hotelProfile.name) ||
          match.phone !== hotelProfile.phone ||
          match.gstin !== hotelProfile.gstin)
      ) {
        const safeName = (activeHotelId !== 'hotel-bighouse' && (!hotelProfile.name || hotelProfile.name === 'Big House Inn'))
          ? match.name
          : (hotelProfile.name || match.name);

        const updated = prev.map(h =>
          h.id === activeHotelId
            ? {
                ...h,
                name: safeName,
                address: hotelProfile.address !== undefined ? hotelProfile.address : h.address,
                city: hotelProfile.city !== undefined ? hotelProfile.city : h.city,
                phone: hotelProfile.phone || h.phone,
                gstin: hotelProfile.gstin || h.gstin,
                tagline: hotelProfile.tagline || h.tagline
              }
            : h
        );
        try {
          localStorage.setItem(STORAGE_KEY_HOTELS, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      }
      return prev;
    });
  }, [activeHotelId, hotelProfile]);

  // Switch between hotel properties
  const handleSelectHotel = (newHotelId: string) => {
    if (newHotelId === activeHotelId) return;

    // Flush current hotel data first
    const currentBundle: HotelDataBundle = {
      hotelId: activeHotelId,
      profile: hotelProfile,
      rooms,
      bookings,
      channels,
      roomMappings,
      syncLogs,
      dynamicPricing
    };
    localStorage.setItem(getHotelBundleKey(activeHotelId), JSON.stringify(currentBundle));

    // Load next hotel with known hotels list to preserve property names
    const nextBundle = loadHotelBundle(newHotelId, hotels);
    setActiveHotelId(newHotelId);
    setHotelProfile(nextBundle.profile);
    setRooms(nextBundle.rooms);
    setBookings(nextBundle.bookings);
    setChannels(nextBundle.channels);
    setRoomMappings(nextBundle.roomMappings);
    setSyncLogs(nextBundle.syncLogs);
    if (nextBundle.dynamicPricing) {
      setDynamicPricing({
        ...nextBundle.dynamicPricing,
        lastMinuteAutomation: nextBundle.dynamicPricing.lastMinuteAutomation || defaultLastMinuteConfig
      });
    } else {
      setDynamicPricing({
        isEnabled: true,
        tier1ThresholdPercent: 50,
        tier1SurgePercent: 10,
        tier2ThresholdPercent: 80,
        tier2SurgePercent: 20,
        applyToAllChannels: true,
        lastMinuteAutomation: defaultLastMinuteConfig
      });
    }

    const targetHotel = hotels.find(h => h.id === newHotelId);
    showToast(`Switched to ${targetHotel?.name || 'Hotel'}`, `${nextBundle.rooms.length} Rooms • ${nextBundle.bookings.length} Bookings loaded`);
  };

  // Restore Original / Historical Hotel Data (e.g. Royal Guest House Goa beach data)
  const handleRestoreHotelData = (hotelId: string) => {
    if (!initialHotelBundles[hotelId]) {
      showToast('No original backup found', 'This property has no default template to restore.');
      return;
    }

    const pristineBundle: HotelDataBundle = JSON.parse(JSON.stringify(initialHotelBundles[hotelId]));
    
    // Save to localStorage
    try {
      localStorage.setItem(getHotelBundleKey(hotelId), JSON.stringify(pristineBundle));
    } catch (e) {
      console.error('Storage error', e);
    }

    // Save to Cloud
    saveHotelBundleToCloud(hotelId, pristineBundle, false);

    // If currently active, immediately update active state
    if (hotelId === activeHotelId) {
      setHotelProfile(pristineBundle.profile);
      setRooms(pristineBundle.rooms);
      setBookings(pristineBundle.bookings);
      setChannels(pristineBundle.channels);
      setRoomMappings(pristineBundle.roomMappings);
      setSyncLogs(pristineBundle.syncLogs);
      if (pristineBundle.dynamicPricing) {
        setDynamicPricing(pristineBundle.dynamicPricing);
      }
    } else {
      // Switch to this hotel automatically so user immediately sees the restored data!
      handleSelectHotel(hotelId);
    }

    const hotelName = pristineBundle.profile?.name || 'Property';
    showToast(
      `✅ ${hotelName} Data Restore Ho Gaya!`,
      `${pristineBundle.rooms.length} Rooms • ${pristineBundle.bookings.length} Bookings Restored`
    );
  };

  // Ensure active hotel is valid; if current active property was deleted, default back to Big House Inn
  useEffect(() => {
    if (activeHotelId !== 'hotel-bighouse' && !hotels.some(h => h.id === activeHotelId)) {
      handleSelectHotel('hotel-bighouse');
    }
  }, [activeHotelId, hotels]);

  // User Login Action
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));

    // Ensure user is in users list so they persist
    setUsers(prev => {
      const exists = prev.some(u => (u.username || '').toLowerCase() === (user.username || '').toLowerCase());
      if (!exists) {
        const updated = [...prev, user];
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
        return updated;
      }
      return prev;
    });

    // If user is designated to a specific hotel, automatically open that hotel
    if (user.hotelId && user.hotelId !== 'all') {
      handleSelectHotel(user.hotelId);
    }

    showToast(`Logged in as ${user.name}`, `${user.designation} • ${user.hotelName}`);
  };

  // User Logout Action
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    setIsLoginModalOpen(true);
  };

  // Add New Hotel Property Action (Super Admin or Property Owner within 5 max quota)
  const handleAddHotel = (newHotel: Hotel, initialManager?: UserAccount, roomCountTemplate = 8) => {
    // Security check: staff cannot add properties, and owners cannot exceed 5
    const permission = canUserAddProperty(currentUser, hotels);
    if (!permission.allowed) {
      showToast('Action Restricted', permission.reason || 'You cannot add more properties');
      return;
    }

    // Assign ownerId and ownerUsername if created by an owner
    const hotelToSave: Hotel = {
      ...newHotel,
      ownerId: newHotel.ownerId || (currentUser?.role === 'hotel_owner' ? currentUser.id : undefined),
      ownerUsername: newHotel.ownerUsername || (currentUser?.role === 'hotel_owner' ? currentUser.username : undefined)
    };

    const updatedHotels = [...hotels, hotelToSave];
    setHotels(updatedHotels);
    try {
      localStorage.setItem(STORAGE_KEY_HOTELS, JSON.stringify(updatedHotels));
    } catch {}
    saveHotelsToCloud(updatedHotels);

    if (initialManager) {
      const updatedUsers = [...users, initialManager];
      setUsers(updatedUsers);
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
      } catch {}
      saveUsersToCloud(updatedUsers);
    }

    // Initialize new bundle
    const newBundle = createDefaultHotelBundle(hotelToSave, roomCountTemplate);
    try {
      localStorage.setItem(getHotelBundleKey(hotelToSave.id), JSON.stringify(newBundle));
    } catch {}
    saveHotelBundleToCloud(hotelToSave.id, newBundle);

    if (hotelToSave.slug) {
      syncHotelSlugToCloud(hotelToSave.id, hotelToSave.slug);
    }

    // Switch to new hotel
    handleSelectHotel(hotelToSave.id);

    showToast(
      `Hotel "${hotelToSave.name}" Created!`, 
      initialManager ? `Dedicated manager login @${initialManager.username} created` : 'Switched to new property'
    );
  };

  // Add Room to Active Hotel
  const handleAddRoom = (newRoom: Room) => {
    setRooms(prev => [...prev, newRoom]);

    // Create default channel rate mapping
    const newMapping: RoomTypeMapping = {
      id: `map-${Date.now()}`,
      pmsRoomType: newRoom.type,
      otaChannel: 'makemytrip',
      otaRoomCode: `OTA-${newRoom.number}`,
      otaRoomTitle: `${newRoom.type} (MMT Direct)`,
      isSynced: true,
      rateModifier: 0,
      stopSell: false
    };
    setRoomMappings(prev => [...prev, newMapping]);

    showToast(`Room ${newRoom.name} Added!`, `Category: ${newRoom.type} • ₹${newRoom.baseRate}/night in ${hotelProfile.name}`);
  };

  // Update Existing Room in Active Hotel
  const handleUpdateRoom = (updatedRoom: Room) => {
    setRooms(prev => prev.map(r => r.id === updatedRoom.id ? updatedRoom : r));

    // Keep channel manager room mappings updated
    setRoomMappings(prev => {
      const exists = prev.some(m => m.pmsRoomType === updatedRoom.type);
      if (!exists) {
        const newMapping: RoomTypeMapping = {
          id: `map-${Date.now()}`,
          pmsRoomType: updatedRoom.type,
          otaChannel: 'makemytrip',
          otaRoomCode: `OTA-${updatedRoom.number}`,
          otaRoomTitle: `${updatedRoom.type} (Direct)`,
          isSynced: true,
          rateModifier: 0,
          stopSell: false
        };
        return [...prev, newMapping];
      }
      return prev;
    });

    showToast(`Room ${updatedRoom.number} Updated!`, `Category: ${updatedRoom.type} • ₹${updatedRoom.baseRate}/night`);
  };

  // Update Daily Rates for Selected Rooms and Dates in Active Hotel
  const handleUpdateDailyRate = (
    targetRoomIds: string[],
    dateStrings: string[],
    newRate: number | null
  ) => {
    setRooms(prev => {
      return prev.map(r => {
        if (!targetRoomIds.includes(r.id)) return r;
        const nextCustomRates = { ...(r.customRates || {}) };
        for (const dateStr of dateStrings) {
          if (newRate === null || newRate <= 0) {
            delete nextCustomRates[dateStr];
          } else {
            nextCustomRates[dateStr] = Math.round(newRate);
          }
        }
        return {
          ...r,
          customRates: nextCustomRates
        };
      });
    });

    const isReset = newRate === null || newRate <= 0;
    const rateDesc = isReset ? 'Reset to Base Rates' : `₹${newRate?.toLocaleString()}/Night`;
    showToast(
      'Calendar Daily Rate Saved!',
      `${targetRoomIds.length} Room(s) updated for ${dateStrings.length} date(s) (${rateDesc})`
    );
  };

  // Update Hotel Profile & Address (Immediate Multi-Store Sync & Persistence)
  const handleUpdateHotelProfile = (up: HotelProfile) => {
    // 1. Update active hotelProfile state
    setHotelProfile(up);

    // 2. Immediately update hotels directory so switcher, header, and settings reflect it
    setHotels(prev => {
      const updated = prev.map(h => {
        if (h.id === activeHotelId) {
          return {
            ...h,
            name: up.name || h.name,
            address: up.address !== undefined ? up.address : h.address,
            city: up.city !== undefined ? up.city : h.city,
            phone: up.phone || h.phone,
            gstin: up.gstin || h.gstin,
            tagline: up.tagline || h.tagline
          };
        }
        return h;
      });
      try {
        localStorage.setItem(STORAGE_KEY_HOTELS, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save hotels', err);
      }
      return updated;
    });

    // 3. Immediately persist bundle to localStorage
    const currentBundle: HotelDataBundle = {
      hotelId: activeHotelId,
      profile: up,
      rooms,
      bookings,
      channels,
      roomMappings,
      syncLogs
    };
    try {
      localStorage.setItem(getHotelBundleKey(activeHotelId), JSON.stringify(currentBundle));
      if (activeHotelId === 'hotel-bighouse') {
        localStorage.setItem('tripmakerz_pms_profile_v1', JSON.stringify(up));
      }
    } catch (err) {
      console.error('Failed to save hotel bundle', err);
    }

    showToast('Hotel Profile & Address Saved!', `${up.name} • ${[up.address, up.city].filter(Boolean).join(', ')}`);
  };

  // Create User / Friend Login
  const handleAddUser = (newUser: UserAccount) => {
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
    showToast(
      `Partner Account Created!`, 
      `Username: @${newUser.username} • Password: ${newUser.password || 'password123'}`
    );
  };

  // Request room deletion
  const handleRequestDeleteRoom = (room: Room) => {
    const activeBkCount = bookings.filter(b => b.roomId === room.id && b.status !== 'cancelled' && b.status !== 'checked_out').length;
    setDeleteModalState({
      isOpen: true,
      targetType: 'room',
      targetId: room.id,
      targetName: room.name,
      hotelId: activeHotelId,
      hotelName: hotelProfile.name,
      activeBookingsCount: activeBkCount
    });
  };

  // Request hotel deletion
  const handleRequestDeleteHotel = (hotel: Hotel) => {
    setDeleteModalState({
      isOpen: true,
      targetType: 'hotel',
      targetId: hotel.id,
      targetName: hotel.name,
      hotelId: hotel.id,
      hotelName: hotel.name,
      activeBookingsCount: 0
    });
  };

  // Direct deletion execution (Super Admin or authorized override)
  const handleExecuteDirectDelete = (type: 'room' | 'hotel', id: string) => {
    if (type === 'room') {
      setRooms(prev => prev.filter(r => r.id !== id));
      showToast('Room Deleted', 'Removed from active property inventory');
    } else {
      if (hotels.length <= 1) {
        alert('Cannot delete the only remaining hotel property.');
        return;
      }
      const remaining = hotels.filter(h => h.id !== id);
      setHotels(remaining);
      localStorage.setItem(STORAGE_KEY_HOTELS, JSON.stringify(remaining));
      localStorage.removeItem(getHotelBundleKey(id));
      saveHotelsToCloud(remaining);
      if (activeHotelId === id) {
        handleSelectHotel(remaining[0].id);
      }
      showToast('Hotel Property Deleted', 'Removed from Multi-Hotel portfolio');
    }
    setDeleteModalState(prev => ({ ...prev, isOpen: false }));
  };

  // Partner / Friend submit deletion request to Super Admin
  const handleSubmitDeleteRequest = (reqPayload: Omit<DeletionRequest, 'id' | 'requestedAt' | 'status'>) => {
    const newReq: DeletionRequest = {
      ...reqPayload,
      id: `del-req-${Date.now()}`,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };
    setDeletionRequests(prev => [newReq, ...prev]);
    showToast('Deletion Request Sent to Super Admin', 'Super Admin (Shahid) has been notified for approval.');
  };

  // Super Admin approval of deletion request
  const handleApproveDeleteRequest = (req: DeletionRequest) => {
    if (req.type === 'room') {
      if (req.hotelId === activeHotelId) {
        setRooms(prev => prev.filter(r => r.id !== req.targetId));
      } else {
        const bundle = loadHotelBundle(req.hotelId);
        bundle.rooms = bundle.rooms.filter(r => r.id !== req.targetId);
        localStorage.setItem(getHotelBundleKey(req.hotelId), JSON.stringify(bundle));
      }
    } else if (req.type === 'hotel') {
      if (hotels.length > 1) {
        const remaining = hotels.filter(h => h.id !== req.targetId);
        setHotels(remaining);
        localStorage.setItem(STORAGE_KEY_HOTELS, JSON.stringify(remaining));
        localStorage.removeItem(getHotelBundleKey(req.targetId));
        saveHotelsToCloud(remaining);
        if (activeHotelId === req.targetId) {
          handleSelectHotel(remaining[0].id);
        }
      }
    }

    setDeletionRequests(prev => prev.map(r => r.id === req.id ? {
      ...r,
      status: 'approved',
      reviewedBy: currentUser?.name || 'Shahid (Super Admin)',
      reviewedAt: new Date().toISOString()
    } : r));

    showToast(`Approved & Deleted: ${req.targetName}`, `Inventory updated per Super Admin authorization.`);
  };

  // Super Admin rejection of deletion request
  const handleRejectDeleteRequest = (reqId: string) => {
    setDeletionRequests(prev => prev.map(r => r.id === reqId ? {
      ...r,
      status: 'rejected',
      reviewedBy: currentUser?.name || 'Shahid (Super Admin)',
      reviewedAt: new Date().toISOString()
    } : r));
    showToast('Deletion Request Rejected', 'Room/property inventory retained.');
  };

  // Full Data Backup Export (JSON Download)
  const handleExportBackup = () => {
    // Flush current state first
    const currentBundle: HotelDataBundle = {
      hotelId: activeHotelId,
      profile: hotelProfile,
      rooms,
      bookings,
      channels,
      roomMappings,
      syncLogs
    };
    localStorage.setItem(getHotelBundleKey(activeHotelId), JSON.stringify(currentBundle));

    const allBundles: Record<string, HotelDataBundle> = {};
    hotels.forEach(h => {
      allBundles[h.id] = loadHotelBundle(h.id);
    });

    const backupData = {
      exportedAt: new Date().toISOString(),
      system: 'Maahi Trips PMS Cloud Suite',
      version: '2.5-multi-tenant',
      hotels,
      users,
      activeHotelId,
      bundles: allBundles
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pms_complete_data_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Data Backup Exported Successfully!', 'All hotel rooms, bookings, KYC IDs saved to your device.');
  };

  // Full Data Backup Restore (JSON Upload)
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.hotels && Array.isArray(data.hotels)) {
          setHotels(data.hotels);
          localStorage.setItem(STORAGE_KEY_HOTELS, JSON.stringify(data.hotels));
        }
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
          localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(data.users));
        }
        if (data.bundles) {
          Object.keys(data.bundles).forEach(hId => {
            localStorage.setItem(getHotelBundleKey(hId), JSON.stringify(data.bundles[hId]));
          });
        }
        if (data.activeHotelId) {
          handleSelectHotel(data.activeHotelId);
        } else if (data.hotels && data.hotels.length > 0) {
          handleSelectHotel(data.hotels[0].id);
        }
        showToast('Backup Restored Successfully!', 'All hotel rooms, bookings, and KYC records restored.');
      } catch (err) {
        alert('Invalid backup file. Please select a valid JSON backup file created from this system.');
      }
    };
    reader.readAsText(file);
  };

  // Global Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (message: string, sub?: string) => {
    setToastNotification({ message, sub });
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  // 2-Way OTA Synchronization action
  const handleSyncAllOtas = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Update channel sync times
      setChannels(prev => prev.map(ch => ({
        ...ch,
        lastSyncedAt: 'Just now',
        status: ch.isConnected ? 'active' : 'paused'
      })));

      // Add sync log
      const newLog: ChannelSyncLog = {
        id: `log-${Date.now()}`,
        timestamp: nowStr,
        channel: 'makemytrip',
        channelName: 'MakeMyTrip & Booking.com',
        eventType: 'inventory_push',
        status: 'success',
        message: 'Two-way sync complete: Pushed latest room inventory & rate parity across all 5 OTAs',
        payloadSummary: `${rooms.length} rooms checked • 0 sync collisions`
      };
      setSyncLogs(prev => [newLog, ...prev]);

      showToast('Two-Way OTA Sync Complete!', 'Inventory & rates pushed to MakeMyTrip, Booking.com, Agoda, and Airbnb.');
    }, 1200);
  };

  // Inbound OTA booking simulation
  const handleIngestOtaBooking = (newBooking: Booking, channelName: string) => {
    setBookings(prev => [newBooking, ...prev]);
    syncSingleBookingToCloud(activeHotelId, newBooking);

    // Mark room as occupied if checkin is today
    if (newBooking.checkInDate === getTodayDateStr()) {
      setRooms(prev => prev.map(r => r.id === newBooking.roomId ? { ...r, status: 'dirty' } : r));
    }

    // Add log
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const log: ChannelSyncLog = {
      id: `log-${Date.now()}`,
      timestamp: nowStr,
      channel: newBooking.channel,
      channelName: channelName,
      eventType: 'reservation_new',
      status: 'success',
      message: `Inbound reservation #${newBooking.bookingCode} received for ${newBooking.guest.fullName}`,
      payloadSummary: `${newBooking.nights}N • ${newBooking.checkInDate} to ${newBooking.checkOutDate} • ₹${newBooking.roomRatePerNight}/N`
    };
    setSyncLogs(prev => [log, ...prev]);

    showToast(`New ${channelName} Booking Ingested!`, `${newBooking.guest.fullName} (#${newBooking.bookingCode}) placed on Desk calendar.`);
  };

  // Booking Save (create single or multi-room bookings)
  const handleSaveBooking = (bookingPayload: Booking | Booking[]) => {
    const payloads = Array.isArray(bookingPayload) ? bookingPayload : [bookingPayload];
    if (payloads.length === 0) return;

    setBookings(prev => {
      let updated = [...prev];
      for (const item of payloads) {
        const idx = updated.findIndex(b => b.id === item.id);
        if (idx >= 0) {
          updated[idx] = item;
        } else {
          updated = [item, ...updated];
        }
      }
      return updated;
    });

    // Push each booking directly to Cloud Firestore for instant multi-device live reflection
    payloads.forEach(item => {
      syncSingleBookingToCloud(activeHotelId, item);
    });

    // Mark rooms as dirty/occupied if check-in is today
    const today = getTodayDateStr();
    payloads.forEach(b => {
      if (b.checkInDate === today && b.status === 'checked_in') {
        setRooms(prev => prev.map(r => r.id === b.roomId ? { ...r, status: 'dirty' } : r));
      }
    });

    // Immediately display the TripMakerz booking details interface
    setSelectedBooking(payloads[0]);

    // Add channel sync event
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const log: ChannelSyncLog = {
      id: `log-${Date.now()}`,
      timestamp: nowStr,
      channel: payloads[0].channel,
      channelName: 'Channel Sync Engine',
      eventType: 'inventory_push',
      status: 'success',
      message: payloads.length > 1
        ? `Multi-room inventory updated for ${payloads.length} rooms on ${payloads[0].checkInDate} - ${payloads[0].checkOutDate}. Customer ID KYC saved.`
        : `Inventory updated for room on ${payloads[0].checkInDate} - ${payloads[0].checkOutDate}. Customer ID KYC saved.`,
      payloadSummary: `Guest: ${payloads[0].guest.fullName} • ${payloads.length} Room(s) • ${payloads[0].guest.idDocument.idType.toUpperCase()}`
    };
    setSyncLogs(prev => [log, ...prev]);

    if (payloads.length > 1) {
      const roomLabels = payloads
        .map(b => rooms.find(r => r.id === b.roomId)?.name || b.roomId)
        .join(', ');
      showToast(
        `Multi-Room Booking Saved! (${payloads.length} Rooms)`, 
        `${payloads[0].guest.fullName} booked for: ${roomLabels}`
      );
    } else {
      showToast('Reservation & Customer ID Saved!', `KYC proof registered for ${payloads[0].guest.fullName}`);
    }
  };

  // Status changes from details drawer
  const handleBookingStatusChange = (bookingId: string, newStatus: Booking['status']) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        const updated = { ...b, status: newStatus };
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(updated);
        }
        syncSingleBookingToCloud(activeHotelId, updated);
        return updated;
      }
      return b;
    }));

    // Update room cleanliness if checked out
    if (newStatus === 'checked_out') {
      const targetBk = bookings.find(b => b.id === bookingId);
      if (targetBk) {
        setRooms(prev => prev.map(r => r.id === targetBk.roomId ? { ...r, status: 'dirty' } : r));
      }
      showToast('Guest Checked Out', 'Room marked as dirty for housekeeping');
    } else if (newStatus === 'checked_in') {
      showToast('Guest Checked In', 'Registration card & ID logged');
    }
  };

  // Shift Room handler (Requested: "action button me check in check out sift room add karo")
  const handleShiftRoom = (
    bookingId: string, 
    newRoomId: string, 
    newRoomNumber: string, 
    reason?: string,
    markPreviousDirty?: boolean
  ) => {
    const targetRoom = rooms.find(r => r.id === newRoomId);
    if (!targetRoom) return;

    const previousBooking = bookings.find(b => b.id === bookingId);
    const previousRoomId = previousBooking?.roomId;
    const previousRoomNum = previousBooking?.roomNumber || 'Unknown';

    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const logEntry = `[${nowTime}] Room shifted from Room ${previousRoomNum} to Room ${newRoomNumber} (${targetRoom.type})${reason ? `: ${reason}` : ''}`;
      const updatedNotes = b.notes ? `${b.notes}\n${logEntry}` : logEntry;

      const updated: Booking = {
        ...b,
        roomId: newRoomId,
        roomNumber: newRoomNumber,
        notes: updatedNotes
      };

      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(updated);
      }
      syncSingleBookingToCloud(activeHotelId, updated);
      return updated;
    }));

    if (markPreviousDirty && previousRoomId) {
      setRooms(prev => prev.map(r => r.id === previousRoomId ? { ...r, status: 'dirty' } : r));
    }

    showToast(`Room Shifted to Room ${newRoomNumber}!`, `Guest moved from Room ${previousRoomNum} to ${targetRoom.name} (${targetRoom.type})`);
  };

  // Check-In ID Submission & Verification Handler (Supports single or multiple guest documents)
  const handleConfirmCheckInWithId = (
    bookingId: string,
    idDoc: IdDocument,
    markCheckedIn: boolean | Booking['status'],
    paymentRecord?: { amount: number; mode: PaymentMode; reference?: string } | { amount: number; paymentMode: any },
    allDocs?: IdDocument[]
  ) => {
    const finalStatus: Booking['status'] = typeof markCheckedIn === 'boolean'
      ? (markCheckedIn ? 'checked_in' : 'confirmed')
      : markCheckedIn;
    const pAmount = paymentRecord?.amount || 0;
    const pMode = (paymentRecord as any)?.mode || (paymentRecord as any)?.paymentMode || 'cash';
    const docList = allDocs && allDocs.length > 0 ? allDocs : [idDoc];

    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      const updatedPayments = [...b.payments];
      if (pAmount > 0) {
        updatedPayments.push({
          id: `pay-${Date.now()}`,
          amount: pAmount,
          mode: pMode,
          date: new Date().toLocaleString()
        });
      }
      const updated: Booking = {
        ...b,
        status: finalStatus,
        documents: docList,
        guest: {
          ...b.guest,
          idDocument: docList[0] || idDoc,
          idDocuments: docList
        },
        payments: updatedPayments
      };
      syncSingleBookingToCloud(activeHotelId, updated);
      return updated;
    }));

    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking(prev => {
        if (!prev) return null;
        const updatedPayments = [...prev.payments];
        if (pAmount > 0) {
          updatedPayments.push({
            id: `pay-${Date.now()}`,
            amount: pAmount,
            mode: pMode,
            date: new Date().toLocaleString()
          });
        }
        return {
          ...prev,
          status: finalStatus,
          documents: docList,
          guest: {
            ...prev.guest,
            idDocument: docList[0] || idDoc,
            idDocuments: docList
          },
          payments: updatedPayments
        };
      });
    }

    showToast(
      finalStatus === 'checked_in' ? 'Check-In Complete & Customer ID Verified' : 'Customer ID Proof Saved & Verified',
      `${docList.length} KYC Document(s) recorded for hotel compliance`
    );
  };

  // Add payment to booking
  const handleAddPayment = (bookingId: string, amount: number, mode: any) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        const newPayment = {
          id: `pay-${Date.now()}`,
          amount,
          mode,
          date: new Date().toLocaleString()
        };
        const updated = {
          ...b,
          payments: [...b.payments, newPayment]
        };
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(updated);
        }
        syncSingleBookingToCloud(activeHotelId, updated);
        return updated;
      }
      return b;
    }));
    showToast('Payment Recorded', `Received ₹${amount.toLocaleString()}`);
  };

  // Cell click on Tape Chart
  const handleCellClick = (roomId: string, dateStr: string) => {
    setBookingModalMode('single');
    setEditingBooking(null);
    setPreSelectedRoomId(roomId);
    setPreSelectedDate(dateStr);
    setIsBookingModalOpen(true);
  };

  // Click on booking bar
  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  // Open Edit modal from Drawer
  const handleOpenEditFromDrawer = (booking: Booking) => {
    setEditingBooking(booking);
    setIsBookingModalOpen(true);
  };

  // Print Invoice / GRC
  const handlePrintInvoice = (booking: Booking, mode: 'invoice' | 'grc') => {
    setInvoiceModal({
      isOpen: true,
      booking,
      mode
    });
  };

  // Housekeeping status update
  const handleUpdateRoomStatus = (roomId: string, newStatus: RoomStatus) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
    showToast('Room Status Updated', `Status set to ${newStatus}`);
  };

  // Toggle stop sell in channel manager
  const handleToggleStopSell = (mappingId: string) => {
    setRoomMappings(prev => prev.map(m => {
      if (m.id === mappingId) {
        const nextVal = !m.stopSell;
        // add sync log
        const log: ChannelSyncLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel: m.otaChannel,
          channelName: m.otaChannel.toUpperCase(),
          eventType: 'stop_sell_pushed',
          status: 'warning',
          message: `${nextVal ? 'Stop-Sell ACTIVATED' : 'Stop-Sell RELEASED'} for ${m.pmsRoomType} on ${m.otaChannel}`,
          payloadSummary: `OTA Room: ${m.otaRoomCode}`
        };
        setSyncLogs(l => [log, ...l]);
        return { ...m, stopSell: nextVal };
      }
      return m;
    }));
  };

  const handleUpdateRateModifier = (mappingId: string, delta: number) => {
    setRoomMappings(prev => prev.map(m => {
      if (m.id === mappingId) {
        const nextMod = Math.max(0, m.rateModifier + delta);
        return { ...m, rateModifier: nextMod };
      }
      return m;
    }));
  };

  const handleToggleAutoSync = (channelId: any) => {
    setChannels(prev => prev.map(ch => {
      if (ch.id === channelId) {
        return { ...ch, autoSync: !ch.autoSync };
      }
      return ch;
    }));
  };

  const handleToggleChannelConnect = (channelId: BookingChannel) => {
    let channelName = '';
    let isNowConnected = false;

    setChannels(prev => prev.map(ch => {
      if (ch.id === channelId) {
        channelName = ch.name;
        isNowConnected = !ch.isConnected;
        return {
          ...ch,
          isConnected: isNowConnected,
          status: isNowConnected ? 'active' : 'disconnected',
          autoSync: isNowConnected,
          activeReservationsCount: isNowConnected ? ch.activeReservationsCount : 0
        };
      }
      return ch;
    }));

    // Add sync log
    const newLog: ChannelSyncLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: channelId,
      channelName: channelName || channelId,
      eventType: 'inventory_push',
      status: isNowConnected ? 'success' : 'warning',
      message: isNowConnected 
        ? `${channelName} Extranet connection established.` 
        : `${channelName} disconnected. Channel is now offline.`
    };
    setSyncLogs(prev => [newLog, ...prev]);

    showToast(
      isNowConnected ? `${channelName} Connected!` : `${channelName} Disconnected`,
      isNowConnected ? 'Live inventory synchronization active' : 'Channel offline - no bookings will be imported'
    );
  };

  const handleDisconnectAllChannels = () => {
    setChannels(prev => prev.map(ch => ({
      ...ch,
      isConnected: false,
      status: 'disconnected',
      autoSync: false,
      activeReservationsCount: 0
    })));
    showToast('All Channels Disconnected', 'All OTA portals are now offline for this property');
  };

  const handleConnectAllChannels = () => {
    setChannels(prev => prev.map(ch => ({
      ...ch,
      isConnected: true,
      status: 'active',
      autoSync: true
    })));
    showToast('All Channels Connected', 'Two-way sync activated across all OTA portals');
  };

  const handleUpdateChannelConfig = (updatedChannel: OTAChannelConfig) => {
    setChannels(prev => prev.map(ch => ch.id === updatedChannel.id ? updatedChannel : ch));

    const newLog: ChannelSyncLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: updatedChannel.id,
      channelName: updatedChannel.name,
      eventType: 'rate_update',
      status: 'success',
      message: `${updatedChannel.name} Extranet Login & API Key configured (Property ID: ${updatedChannel.hotelCode || 'Verified'}).`,
      payloadSummary: `Extranet: ${updatedChannel.extranetUsername || 'Direct'} | Env: ${updatedChannel.environment || 'production'} | AutoSync: ${updatedChannel.autoSync ? 'ON' : 'OFF'}`
    };
    setSyncLogs(prev => [newLog, ...prev]);

    showToast(
      `${updatedChannel.name} Configured!`,
      `Extranet credentials & API Key saved for ${hotelProfile.name}`
    );
  };

  const handleTestInboundWebhook = (channelId: BookingChannel) => {
    const channel = channels.find(c => c.id === channelId) || channels[0];
    const newLog: ChannelSyncLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: channel.id,
      channelName: channel.name,
      eventType: 'reservation_new',
      status: 'success',
      message: `Inbound Webhook HTTP 200 OK: Test reservation payload signature verified with HMAC secret.`,
      payloadSummary: `Event: ping | Hotel: ${hotelProfile.name} | Channel: ${channel.name} | Result: Verified`
    };
    setSyncLogs(prev => [newLog, ...prev]);
    showToast('Inbound Webhook Verified', `Test handshake received from ${channel.name} webhook engine`);
  };

  const [isDynamicRulesModalOpen, setIsDynamicRulesModalOpen] = useState<boolean>(false);
  const [dynamicRulesInitialTab, setDynamicRulesInitialTab] = useState<'last_minute' | 'surge'>('last_minute');

  // Automatic ticker so when clock passes 7:00 AM, the rule auto-evaluates live without page refresh
  const [currentTimeTick, setCurrentTimeTick] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeTick(Date.now());
    }, 30000); // 30 sec auto-refresh
    return () => clearInterval(timer);
  }, []);

  // Real-time evaluation of Morning 7:00 AM Last-Minute Rule
  const lastMinuteStatus = useMemo(() => {
    const lmConfig = dynamicPricing.lastMinuteAutomation || defaultLastMinuteConfig;
    return evaluateLastMinuteAutomation(bookings, rooms, lmConfig);
  }, [bookings, rooms, dynamicPricing.lastMinuteAutomation, currentTimeTick]);

  const handleToggleSimulate7am = () => {
    const lmConfig = dynamicPricing.lastMinuteAutomation || defaultLastMinuteConfig;
    const updatedLM: LastMinuteRateAutomationConfig = {
      ...lmConfig,
      simulatedTimePassed7am: !lmConfig.simulatedTimePassed7am
    };
    const updatedDP: DynamicPricingConfig = {
      ...dynamicPricing,
      lastMinuteAutomation: updatedLM
    };
    handleUpdateDynamicPricing(updatedDP);
    showToast(
      updatedLM.simulatedTimePassed7am ? '⚡ 7 AM Cutoff Simulation ON' : '7 AM Live Clock Restored',
      updatedLM.simulatedTimePassed7am 
        ? 'Morning 7 AM rule active: -15% rate reduction applied if occupancy < 60%'
        : 'System is evaluating real-time 7:00 AM clock'
    );
  };

  const handleUpdateDynamicPricing = (newConfig: DynamicPricingConfig) => {
    setDynamicPricing(newConfig);

    const occupiedCount = rooms.filter(r => (r.status as string) === 'occupied' || (r.status as string) === 'dirty').length;
    const occPercent = rooms.length > 0 ? Math.round((occupiedCount / rooms.length) * 100) : 0;
    
    let surge = 0;
    if (newConfig.isEnabled) {
      if (occPercent >= newConfig.tier2ThresholdPercent) surge = newConfig.tier2SurgePercent;
      else if (occPercent >= newConfig.tier1ThresholdPercent) surge = newConfig.tier1SurgePercent;
    }

    const lmConfig = newConfig.lastMinuteAutomation || defaultLastMinuteConfig;
    const lmEval = evaluateLastMinuteAutomation(bookings, rooms, lmConfig);

    const newLog: ChannelSyncLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: 'makemytrip',
      channelName: 'Yield Engine',
      eventType: 'rate_update',
      status: 'success',
      message: lmEval.isTriggered
        ? `⚡ 7 AM Flash Rate Active: Occupancy ${lmEval.currentOccupancyPercent}% (<60%). Base rates automatically reduced by ${lmEval.discountPercent}% on all OTAs & Front Desk.`
        : newConfig.isEnabled
        ? `Dynamic Yield Pricing Active: Occupancy is ${occPercent}%. Surge of +${surge}% applied to all OTA channels.`
        : `Dynamic Rates Updated: Standard base rates restored across channels.`
    };
    setSyncLogs(prev => [newLog, ...prev]);

    showToast(
      lmEval.isTriggered ? '⚡ 7 AM Flash Discount Active (-15%)' : 'Dynamic Rates Configured',
      lmEval.isTriggered
        ? `Same-date occupancy is ${lmEval.currentOccupancyPercent}% (<60%). 15% discount active on all bookings.`
        : `7 AM Cutoff Rule: ${lmConfig.isEnabled ? 'Active' : 'Disabled'} | Target: ${lmConfig.targetOccupancyPercent}% | Discount: ${lmConfig.discountPercent}%`
    );
  };

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const publicMatch = pathname.match(/^\/h\/([a-zA-Z0-9\-_]+)$/);
  if (publicMatch) {
    const slug = publicMatch[1];
    return <PublicHotelBookingView slug={slug} />;
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 p-4 font-sans text-slate-100 antialiased">
        <LoginModal
          isOpen={true}
          currentUser={null}
          users={users}
          hotels={hotels}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased">
      {/* Left Sidebar Navigation with Property Selector & Actions */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        propertyName={hotelProfile.name}
        hotelProfile={hotelProfile}
        hotels={hotels}
        activeHotelId={activeHotelId}
        onSelectHotel={handleSelectHotel}
        hotelsCount={hotels.length}
        currentUser={currentUser}
        isSuperAdmin={currentUser?.role === 'super_admin' || currentUser?.role === 'hotel_owner'}
        onOpenAddHotel={() => setIsAddHotelModalOpen(true)}
        onRequestDeleteHotel={handleRequestDeleteHotel}
        onNavigateToSettingsHotels={() => {
          setSettingsInitialSubTab('hotels');
          setActiveTab('settings');
        }}
        onNewBookingClick={(mode = 'single') => handleOpenNewBooking(mode)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onRestoreHotelData={handleRestoreHotelData}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header with Multi-Property Switcher & User Auth */}
        <Header
          propertyName={hotelProfile.name}
          hotelProfile={hotelProfile}
          onNewBookingClick={(mode = 'single') => handleOpenNewBooking(mode)}
          onSimulateOtaClick={() => setIsSimulateModalOpen(true)}
          onSyncAllOtas={handleSyncAllOtas}
          onOpenSearch={() => setIsGlobalSearchOpen(true)}
          isSyncing={isSyncing}
          activeChannelsCount={channels.filter(c => c.isConnected).length}
          currentUser={currentUser}
          hotels={hotels}
          activeHotelId={activeHotelId}
          onSelectHotel={handleSelectHotel}
          onRestoreHotelData={handleRestoreHotelData}
          onOpenAddHotel={() => setIsAddHotelModalOpen(true)}
          onRequestDeleteHotel={handleRequestDeleteHotel}
          onNavigateToSettingsHotels={() => {
            setSettingsInitialSubTab('hotels');
            setActiveTab('settings');
          }}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onExportBackup={handleExportBackup}
          isCloudConnected={isCloudConnected}
          onOpenCloudSync={() => {
            setSettingsInitialSubTab('backup');
            setActiveTab('settings');
          }}
          lastMinuteStatus={lastMinuteStatus}
          onOpenLastMinuteModal={() => {
            setDynamicRulesInitialTab('last_minute');
            setIsDynamicRulesModalOpen(true);
          }}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />

        {/* Quota Exceeded / Local Persistence Alert Banner */}
        {isQuotaExceeded && !isQuotaBannerDismissed && (
          <div className="bg-amber-500/10 border-b border-amber-300 px-3 sm:px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-amber-950 shrink-0 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider shrink-0">
                Local Storage Mode
              </span>
              <p className="font-medium text-amber-900 leading-snug truncate">
                Firestore free daily write quota reached. Changes are <strong>safely saved locally</strong> on your browser and will automatically reset at midnight.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <a
                href={getDatabaseUpgradeUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg text-[11px] transition-colors shadow-2xs"
              >
                Upgrade Limits (Console)
              </a>
              <button
                type="button"
                disabled={isRetryingCloud}
                onClick={async () => {
                  setIsRetryingCloud(true);
                  const ok = await retryCloudConnection();
                  setIsRetryingCloud(false);
                  if (ok) {
                    showToast('Cloud Reconnected!', 'Firestore synchronization restored successfully.');
                  } else {
                    showToast('Quota Still Limited', 'Free tier writes will reset at 12:00 AM PST. Local storage is active.');
                  }
                }}
                className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
              >
                {isRetryingCloud ? 'Testing...' : 'Retry Connection'}
              </button>
              <button
                type="button"
                onClick={() => setIsQuotaBannerDismissed(true)}
                className="p-1 text-amber-800 hover:text-amber-950 rounded transition-colors"
                title="Dismiss notice"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* View Router */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative pb-16 md:pb-0">
          {activeTab === 'desk' && (
            <DeskCalendar
              rooms={rooms}
              bookings={bookings}
              startDateStr={addDaysToStr(getTodayDateStr(), -3)}
              daysToShow={21}
              onSelectBooking={handleSelectBooking}
              onCellClick={handleCellClick}
              onRefresh={() => {
                showToast('Desk Refreshed', 'Synced with latest channel bookings');
              }}
              onOpenAddRoom={() => {
                setRoomToEdit(null);
                setIsAddRoomModalOpen(true);
              }}
              onEditRoom={(rm) => {
                setRoomToEdit(rm);
                setIsAddRoomModalOpen(true);
              }}
              onRequestDeleteRoom={handleRequestDeleteRoom}
              currentUser={currentUser}
              isLastMinuteFlashActive={lastMinuteStatus.isTriggered}
              lastMinuteStatus={lastMinuteStatus}
              onOpenLastMinuteModal={() => {
                setDynamicRulesInitialTab('last_minute');
                setIsDynamicRulesModalOpen(true);
              }}
              onToggleSimulate7am={handleToggleSimulate7am}
              onUpdateDailyRate={handleUpdateDailyRate}
            />
          )}

          {activeTab === 'booking_engine' && (
            <BookingEngineView
              hotelProfile={hotelProfile}
              rooms={rooms}
              bookings={bookings}
              onSaveBooking={(newBooking) => handleSaveBooking(newBooking)}
              showToast={showToast}
              hotels={hotels}
              activeHotelId={activeHotelId}
              onSelectHotel={handleSelectHotel}
            />
          )}

          {activeTab === 'google_hotels' && (
            <GoogleHotelsView
              hotelProfile={hotelProfile}
              rooms={rooms}
              bookings={bookings}
              showToast={showToast}
            />
          )}

          {activeTab === 'photo_gallery' && (
            <PhotoGalleryView
              hotelProfile={hotelProfile}
              onUpdateProfile={handleUpdateHotelProfile}
              showToast={showToast}
            />
          )}

          {activeTab === 'channels' && (
            <ChannelManagerView
              channels={channels}
              roomMappings={roomMappings}
              syncLogs={syncLogs}
              rooms={rooms}
              bookings={bookings}
              isSyncing={isSyncing}
              onSyncAll={handleSyncAllOtas}
              onToggleAutoSync={handleToggleAutoSync}
              onToggleStopSell={handleToggleStopSell}
              onUpdateRateModifier={handleUpdateRateModifier}
              onOpenSimulateModal={() => setIsSimulateModalOpen(true)}
              onToggleChannelConnect={handleToggleChannelConnect}
              onUpdateChannelConfig={handleUpdateChannelConfig}
              onTestInboundWebhook={handleTestInboundWebhook}
              onDisconnectAll={handleDisconnectAllChannels}
              onConnectAll={handleConnectAllChannels}
              hotelProfile={hotelProfile}
              dynamicPricing={dynamicPricing}
              onUpdateDynamicPricing={handleUpdateDynamicPricing}
            />
          )}

          {activeTab === 'kyc_vault' && (
            <GuestIdVault
              bookings={bookings}
              onOpenBooking={handleSelectBooking}
              onNewBookingClick={() => handleOpenNewBooking('single')}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              bookings={bookings}
              rooms={rooms}
              channels={channels}
              onNavigateToDesk={() => setActiveTab('desk')}
            />
          )}

          {activeTab === 'housekeeping' && (
            <HousekeepingView
              rooms={rooms}
              onUpdateStatus={handleUpdateRoomStatus}
              onOpenAddRoom={() => {
                setRoomToEdit(null);
                setIsAddRoomModalOpen(true);
              }}
              onEditRoom={(rm) => {
                setRoomToEdit(rm);
                setIsAddRoomModalOpen(true);
              }}
              onRequestDeleteRoom={handleRequestDeleteRoom}
              currentUser={currentUser}
              hotelName={hotelProfile.name}
            />
          )}

          {activeTab === 'invoices' && (
            <GuestIdVault
              bookings={bookings}
              onOpenBooking={handleSelectBooking}
              onNewBookingClick={() => handleOpenNewBooking('single')}
              onOpenCheckInIdModal={(b) => setCheckInIdModalBooking(b)}
            />
          )}

          {activeTab === 'gmail' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
              <GmailView
                hotelProfile={hotelProfile}
                bookings={bookings}
                rooms={rooms}
                onOpenBookingDetails={handleSelectBooking}
              />
            </div>
          )}

          {activeTab === 'gemini_assistant' && (
            <div className="flex-1 overflow-y-auto">
              <GeminiChatView
                hotelProfile={hotelProfile}
                hotels={hotels}
                activeHotelId={activeHotelId}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsView
              hotelProfile={hotelProfile}
              onUpdateProfile={handleUpdateHotelProfile}
              hotels={hotels}
              activeHotelId={activeHotelId}
              onSelectHotel={handleSelectHotel}
              onRestoreHotelData={handleRestoreHotelData}
              onOpenAddHotel={() => setIsAddHotelModalOpen(true)}
              initialSubTab={settingsInitialSubTab}
              currentUser={currentUser}
              users={users}
              onOpenLogin={() => setIsLoginModalOpen(true)}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              rooms={rooms}
              onOpenAddRoom={() => {
                setRoomToEdit(null);
                setIsAddRoomModalOpen(true);
              }}
              onEditRoom={(rm) => {
                setRoomToEdit(rm);
                setIsAddRoomModalOpen(true);
              }}
              onRequestDeleteRoom={handleRequestDeleteRoom}
              onRequestDeleteHotel={handleRequestDeleteHotel}
              onOpenCreateUser={() => setIsCreateUserModalOpen(true)}
              deletionRequests={deletionRequests}
              onApproveDeleteRequest={handleApproveDeleteRequest}
              onRejectDeleteRequest={handleRejectDeleteRequest}
              onShowToast={showToast}
              isCloudConnected={isCloudConnected}
              dynamicPricing={dynamicPricing}
              onUpdateDynamicPricing={handleUpdateDynamicPricing}
              lastMinuteStatus={lastMinuteStatus}
              onToggleSimulate7am={handleToggleSimulate7am}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (Optimized for Mobile/Touch) */}
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          onOpenNewBooking={() => handleOpenNewBooking('single')}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          activeChannelsCount={channels.filter(c => c.isConnected).length}
          unverifiedGuestsCount={bookings.filter(b => b.status === 'checked_in' && (!b.guest.idDocument?.isVerified || b.guest.idDocument?.idNumber === 'Pending at Check-in')).length}
        />
      </div>

      {/* Booking Drawer (Details, ID View & Actions) */}
      {selectedBooking && (
        <BookingDetailsDrawer
          booking={selectedBooking}
          rooms={rooms}
          bookings={bookings}
          onSelectBooking={(b) => setSelectedBooking(b)}
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          onEdit={handleOpenEditFromDrawer}
          onStatusChange={handleBookingStatusChange}
          onPrintInvoice={handlePrintInvoice}
          onAddPayment={handleAddPayment}
          onOpenCheckInIdModal={(b) => setCheckInIdModalBooking(b)}
          onSendEmail={(b) => {
            setSelectedBooking(null);
            setActiveTab('gmail');
            showToast('Gmail Dispatcher', `Prepared voucher for ${b.guest.fullName}`);
          }}
          onShiftRoom={handleShiftRoom}
          hotelName={hotelProfile.name}
          hotelProfile={hotelProfile}
        />
      )}

      {/* Customer Check-In ID Submission Modal ("customar ke check in ke bad id submit hoti h") */}
      {checkInIdModalBooking && (
        <CheckInIdModal
          isOpen={Boolean(checkInIdModalBooking)}
          onClose={() => setCheckInIdModalBooking(null)}
          booking={checkInIdModalBooking}
          room={rooms.find(r => r.id === checkInIdModalBooking.roomId)}
          onConfirmCheckInWithId={handleConfirmCheckInWithId}
        />
      )}

      {/* New / Edit Booking & KYC ID Modal */}
      {isBookingModalOpen && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setEditingBooking(null);
          }}
          rooms={rooms}
          bookings={bookings}
          initialRoomId={preSelectedRoomId}
          initialDate={preSelectedDate}
          onSaveBooking={handleSaveBooking}
          existingBooking={editingBooking}
          isLastMinuteFlashActive={lastMinuteStatus.isTriggered}
          lastMinuteDiscountPercent={lastMinuteStatus.discountPercent}
          hotelName={hotelProfile?.name || 'Big House Inn'}
          initialBookingMode={bookingModalMode}
        />
      )}

      {/* ⚡ Dynamic Pricing & 7 AM Last-Minute Automation Modal */}
      {isDynamicRulesModalOpen && (
        <DynamicPricingRulesModal
          isOpen={isDynamicRulesModalOpen}
          onClose={() => setIsDynamicRulesModalOpen(false)}
          config={dynamicPricing}
          onSave={handleUpdateDynamicPricing}
          initialTab={dynamicRulesInitialTab}
        />
      )}

      {/* OTA Inbound Booking Simulator Modal */}
      {isSimulateModalOpen && (
        <SimulateOtaModal
          isOpen={isSimulateModalOpen}
          onClose={() => setIsSimulateModalOpen(false)}
          rooms={rooms}
          onIngestOtaBooking={handleIngestOtaBooking}
        />
      )}

      {/* Printable GST Tax Invoice / GRC Modal */}
      {invoiceModal.isOpen && invoiceModal.booking && (
        <InvoiceModal
          isOpen={invoiceModal.isOpen}
          onClose={() => setInvoiceModal({ isOpen: false, booking: null, mode: 'invoice' })}
          booking={invoiceModal.booking}
          rooms={rooms}
          bookings={bookings}
          hotelProfile={hotelProfile}
          mode={invoiceModal.mode}
        />
      )}

      {/* Global Spotlight Search (Ctrl + K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        bookings={bookings}
        rooms={rooms}
        onSelectBooking={handleSelectBooking}
      />

      {/* Multi-Hotel User Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        users={users}
        hotels={hotels}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenAddUser={() => {
          setIsLoginModalOpen(false);
          setIsCreateUserModalOpen(true);
        }}
      />

      {/* Add New Hotel Property Modal */}
      <AddHotelModal
        isOpen={isAddHotelModalOpen}
        onClose={() => setIsAddHotelModalOpen(false)}
        onAddHotel={handleAddHotel}
        currentUser={currentUser}
        hotels={hotels}
        onSwitchToSuperAdmin={() => {
          handleLogin(initialUsers[0]);
          setIsAddHotelModalOpen(true);
        }}
      />

      {/* Add / Edit Room Modal */}
      <AddRoomModal
        isOpen={isAddRoomModalOpen}
        onClose={() => {
          setIsAddRoomModalOpen(false);
          setRoomToEdit(null);
        }}
        onAddRoom={handleAddRoom}
        onUpdateRoom={handleUpdateRoom}
        onDeleteRoom={handleRequestDeleteRoom}
        isSuperAdmin={isSuperAdminUser(currentUser)}
        roomToEdit={roomToEdit}
        existingRooms={rooms}
        hotelName={hotelProfile.name}
      />

      {/* Create User / Friend Login ID Modal */}
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onAddUser={handleAddUser}
        hotels={hotels}
        currentUser={currentUser}
      />

      {/* Super Admin Deletion Guard & Authorization Modal */}
      <SuperAdminDeleteModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
        targetType={deleteModalState.targetType}
        targetId={deleteModalState.targetId}
        targetName={deleteModalState.targetName}
        hotelId={deleteModalState.hotelId}
        hotelName={deleteModalState.hotelName}
        currentUser={currentUser}
        activeBookingsCount={deleteModalState.activeBookingsCount}
        hotelsCount={hotels.length}
        onConfirmDelete={handleExecuteDirectDelete}
        onRequestDeleteToSuperAdmin={handleSubmitDeleteRequest}
      />

      {/* Toast Notification Banner */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-60 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-start gap-3 max-w-sm animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white">{toastNotification.message}</div>
            {toastNotification.sub && (
              <div className="text-[11px] text-slate-400 mt-0.5">{toastNotification.sub}</div>
            )}
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-white p-0.5 -mr-1"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {/* Mobile App Install & Play Store Guide Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredInstallPrompt}
        onInstallPrompt={handleInstallAppPrompt}
      />

      {/* Floating Quick Gemini AI Concierge Widget */}
      <GeminiFloatingWidget
        hotelProfile={hotelProfile}
        onOpenFullChat={() => setActiveTab('gemini_assistant')}
      />
    </div>
  );
}
