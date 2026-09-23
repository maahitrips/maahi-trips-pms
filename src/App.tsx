import React, { useState, useEffect } from 'react';
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
  DeletionRequest
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
import { LoginModal } from './components/LoginModal';
import { AddHotelModal } from './components/AddHotelModal';
import { AddRoomModal } from './components/AddRoomModal';
import { CreateUserModal } from './components/CreateUserModal';
import { SuperAdminDeleteModal } from './components/SuperAdminDeleteModal';
import { GmailView } from './components/GmailView';
import { CheckCircle2, Zap, X } from 'lucide-react';
import { canUserAddProperty, isSuperAdminUser } from './utils/permissionHelper';

const STORAGE_KEY_HOTELS = 'tripmakerz_hotels_v2';
const STORAGE_KEY_USERS = 'tripmakerz_users_v2';
const STORAGE_KEY_CURRENT_USER = 'tripmakerz_current_user_v2';
const STORAGE_KEY_ACTIVE_HOTEL_ID = 'tripmakerz_active_hotel_id_v2';
const STORAGE_KEY_DELETION_REQUESTS = 'tripmakerz_deletion_requests_v2';

// Helper to get bundle storage key
const getHotelBundleKey = (hotelId: string) => `tripmakerz_pms_bundle_${hotelId}`;

// Helper to load hotel data bundle with legacy data preservation
const loadHotelBundle = (hotelId: string): HotelDataBundle => {
  const saved = localStorage.getItem(getHotelBundleKey(hotelId));
  if (saved) {
    try {
      return JSON.parse(saved);
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
      return {
        hotelId: 'hotel-bighouse',
        profile: legacyProfile ? JSON.parse(legacyProfile) : initialHotelProfile,
        rooms: legacyRooms ? JSON.parse(legacyRooms) : initialRooms,
        bookings: legacyBookings ? JSON.parse(legacyBookings) : initialBookings,
        channels: legacyChannels ? JSON.parse(legacyChannels) : initialOTAChannels,
        roomMappings: legacyMappings ? JSON.parse(legacyMappings) : initialRoomMappings,
        syncLogs: legacyLogs ? JSON.parse(legacyLogs) : initialSyncLogs
      };
    }
  }

  // Fallback to initial mock bundles
  if (initialHotelBundles[hotelId]) {
    return initialHotelBundles[hotelId];
  }

  const foundHotel = initialHotels.find(h => h.id === hotelId);
  if (foundHotel) {
    return createDefaultHotelBundle(foundHotel, 8);
  }

  return {
    hotelId,
    profile: initialHotelProfile,
    rooms: initialRooms,
    bookings: initialBookings,
    channels: initialOTAChannels,
    roomMappings: initialRoomMappings,
    syncLogs: initialSyncLogs
  };
};

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('desk');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Multi-Hotel & Multi-User State
  const [hotels, setHotels] = useState<Hotel[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_HOTELS);
    return saved ? JSON.parse(saved) : initialHotels;
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS);
    let combinedUsers = initialUsers;
    if (saved) {
      try {
        const parsed: UserAccount[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Keep all saved accounts, plus inject any initialUsers not already present
          const existingUsernames = new Set(parsed.map(u => (u.username || '').toLowerCase()));
          const missingFromInitial = initialUsers.filter(u => !existingUsernames.has((u.username || '').toLowerCase()));
          combinedUsers = [...parsed, ...missingFromInitial];
        }
      } catch (e) {
        console.error('Failed to parse users', e);
      }
    }
    return combinedUsers.map(u => {
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
      if ((u.username || '').toLowerCase() === 'sadik8806') {
        return {
          ...u,
          username: 'sadik8806',
          password: '8806sadik',
          phone: '+91 96481 33671',
          name: u.name || 'Sadik',
          role: 'hotel_owner',
          hotelId: u.hotelId || 'hotel-bighouse',
          hotelName: u.hotelName || 'Big House Inn (Udaipur)'
        };
      }
      return u;
    });
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (saved) {
      try {
        const parsed: UserAccount = JSON.parse(saved);
        const uName = (parsed.username || '').toLowerCase().trim();
        const uEmail = (parsed.email || '').toLowerCase().trim();
        if (
          parsed.role === 'super_admin' || 
          parsed.id === 'user-admin' || 
          uName === 'maahitrips' || 
          uName === 'admin' ||
          uEmail === 'shahidkpj@gmail.com'
        ) {
          return {
            ...parsed,
            role: 'super_admin',
            name: 'Maahi Trips',
            designation: 'Super Admin • Group Managing Director',
            username: 'maahitrips',
            password: '417905kpj',
            avatarText: '👑'
          };
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse current user', e);
      }
    }
    // Default to Super Admin (Maahi Trips)
    return initialUsers[0];
  });

  const [activeHotelId, setActiveHotelId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_HOTEL_ID);
    if (saved) return saved;
    const initialUser = initialUsers[0];
    return (initialUser && initialUser.hotelId && initialUser.hotelId !== 'all') ? initialUser.hotelId : 'hotel-bighouse';
  });

  // Current Hotel Data State (isolated per hotel)
  const [rooms, setRooms] = useState<Room[]>(() => loadHotelBundle(activeHotelId).rooms);
  const [bookings, setBookings] = useState<Booking[]>(() => loadHotelBundle(activeHotelId).bookings);
  const [channels, setChannels] = useState<OTAChannelConfig[]>(() => loadHotelBundle(activeHotelId).channels);
  const [roomMappings, setRoomMappings] = useState<RoomTypeMapping[]>(() => loadHotelBundle(activeHotelId).roomMappings);
  const [syncLogs, setSyncLogs] = useState<ChannelSyncLog[]>(() => loadHotelBundle(activeHotelId).syncLogs);
  const [hotelProfile, setHotelProfile] = useState<HotelProfile>(() => loadHotelBundle(activeHotelId).profile);

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
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [preSelectedRoomId, setPreSelectedRoomId] = useState<string | undefined>();
  const [preSelectedDate, setPreSelectedDate] = useState<string | undefined>();

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

  // Persist multi-hotel metadata & active user
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HOTELS, JSON.stringify(hotels));
  }, [hotels]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DELETION_REQUESTS, JSON.stringify(deletionRequests));
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
      syncLogs
    };
    localStorage.setItem(getHotelBundleKey(activeHotelId), JSON.stringify(currentBundle));

    // Also update legacy keys if Big House Inn
    if (activeHotelId === 'hotel-bighouse') {
      localStorage.setItem('tripmakerz_pms_rooms_v1', JSON.stringify(rooms));
      localStorage.setItem('tripmakerz_pms_bookings_v2', JSON.stringify(bookings));
      localStorage.setItem('tripmakerz_pms_profile_v1', JSON.stringify(hotelProfile));
    }
  }, [activeHotelId, hotelProfile, rooms, bookings, channels, roomMappings, syncLogs]);

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
      syncLogs
    };
    localStorage.setItem(getHotelBundleKey(activeHotelId), JSON.stringify(currentBundle));

    // Load next hotel
    const nextBundle = loadHotelBundle(newHotelId);
    setActiveHotelId(newHotelId);
    setHotelProfile(nextBundle.profile);
    setRooms(nextBundle.rooms);
    setBookings(nextBundle.bookings);
    setChannels(nextBundle.channels);
    setRoomMappings(nextBundle.roomMappings);
    setSyncLogs(nextBundle.syncLogs);

    const targetHotel = hotels.find(h => h.id === newHotelId);
    showToast(`Switched to ${targetHotel?.name || 'Hotel'}`, `${nextBundle.rooms.length} Rooms • ${nextBundle.bookings.length} Bookings loaded`);
  };

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
    localStorage.setItem(STORAGE_KEY_HOTELS, JSON.stringify(updatedHotels));

    if (initialManager) {
      const updatedUsers = [...users, initialManager];
      setUsers(updatedUsers);
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
    }

    // Initialize new bundle
    const newBundle = createDefaultHotelBundle(hotelToSave, roomCountTemplate);
    localStorage.setItem(getHotelBundleKey(hotelToSave.id), JSON.stringify(newBundle));

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
      system: 'Tripmakerz PMS Cloud Suite',
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

    // Mark room as occupied if checkin is today
    if (newBooking.checkInDate === '2026-09-17') {
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

  // Booking Save (create or update)
  const handleSaveBooking = (bookingPayload: Booking) => {
    setBookings(prev => {
      const exists = prev.some(b => b.id === bookingPayload.id);
      if (exists) {
        return prev.map(b => b.id === bookingPayload.id ? bookingPayload : b);
      }
      return [bookingPayload, ...prev];
    });

    // Immediately display the TripMakerz booking details interface requested by user ("booking submit ke bad aisa interfare aana chahiye")
    setSelectedBooking(bookingPayload);

    // Add channel sync event
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const log: ChannelSyncLog = {
      id: `log-${Date.now()}`,
      timestamp: nowStr,
      channel: bookingPayload.channel,
      channelName: 'Channel Sync Engine',
      eventType: 'inventory_push',
      status: 'success',
      message: `Inventory updated for room on ${bookingPayload.checkInDate} - ${bookingPayload.checkOutDate}. Customer ID KYC saved.`,
      payloadSummary: `Guest: ${bookingPayload.guest.fullName} • ${bookingPayload.guest.idDocument.idType.toUpperCase()}`
    };
    setSyncLogs(prev => [log, ...prev]);

    showToast('Reservation & Customer ID Saved!', `KYC proof registered for ${bookingPayload.guest.fullName}`);
  };

  // Status changes from details drawer
  const handleBookingStatusChange = (bookingId: string, newStatus: Booking['status']) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        const updated = { ...b, status: newStatus };
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking(updated);
        }
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

  // Check-In ID Submission & Verification Handler (Requested: "customar ke check in ke bad id submit hoti h")
  const handleConfirmCheckInWithId = (
    bookingId: string,
    idDoc: IdDocument,
    status: Booking['status'],
    collectedPayment?: { amount: number; paymentMode: any }
  ) => {
    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      const updatedPayments = [...b.payments];
      if (collectedPayment && collectedPayment.amount > 0) {
        updatedPayments.push({
          id: `pay-${Date.now()}`,
          amount: collectedPayment.amount,
          mode: collectedPayment.paymentMode,
          date: new Date().toLocaleString()
        });
      }
      return {
        ...b,
        status,
        guest: {
          ...b.guest,
          idDocument: idDoc
        },
        payments: updatedPayments
      };
    }));

    if (selectedBooking && selectedBooking.id === bookingId) {
      setSelectedBooking(prev => {
        if (!prev) return null;
        const updatedPayments = [...prev.payments];
        if (collectedPayment && collectedPayment.amount > 0) {
          updatedPayments.push({
            id: `pay-${Date.now()}`,
            amount: collectedPayment.amount,
            mode: collectedPayment.paymentMode,
            date: new Date().toLocaleString()
          });
        }
        return {
          ...prev,
          status,
          guest: {
            ...prev.guest,
            idDocument: idDoc
          },
          payments: updatedPayments
        };
      });
    }

    showToast(
      status === 'checked_in' ? 'Check-In Complete & Customer ID Verified' : 'Customer ID Proof Saved & Verified',
      `${idDoc.idType.toUpperCase()} (${idDoc.idNumber}) recorded for hotel KYC compliance`
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
        return updated;
      }
      return b;
    }));
    showToast('Payment Recorded', `Received ₹${amount.toLocaleString()}`);
  };

  // Cell click on Tape Chart
  const handleCellClick = (roomId: string, dateStr: string) => {
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
      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        propertyName={hotelProfile.name}
        hotelsCount={hotels.length}
        isSuperAdmin={currentUser?.role === 'super_admin' || currentUser?.role === 'hotel_owner'}
        onOpenAddHotel={() => setIsAddHotelModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header with Multi-Property Switcher & User Auth */}
        <Header
          propertyName={hotelProfile.name}
          onNewBookingClick={() => {
            setEditingBooking(null);
            setPreSelectedRoomId(undefined);
            setPreSelectedDate('2026-09-17');
            setIsBookingModalOpen(true);
          }}
          onSimulateOtaClick={() => setIsSimulateModalOpen(true)}
          onSyncAllOtas={handleSyncAllOtas}
          onOpenSearch={() => setIsGlobalSearchOpen(true)}
          isSyncing={isSyncing}
          activeChannelsCount={channels.filter(c => c.isConnected).length}
          currentUser={currentUser}
          hotels={hotels}
          activeHotelId={activeHotelId}
          onSelectHotel={handleSelectHotel}
          onOpenAddHotel={() => setIsAddHotelModalOpen(true)}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onExportBackup={handleExportBackup}
        />

        {/* View Router */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {activeTab === 'desk' && (
            <DeskCalendar
              rooms={rooms}
              bookings={bookings}
              startDateStr="2026-09-17"
              daysToShow={20}
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
            />
          )}

          {activeTab === 'channels' && (
            <ChannelManagerView
              channels={channels}
              roomMappings={roomMappings}
              syncLogs={syncLogs}
              rooms={rooms}
              isSyncing={isSyncing}
              onSyncAll={handleSyncAllOtas}
              onToggleAutoSync={handleToggleAutoSync}
              onToggleStopSell={handleToggleStopSell}
              onUpdateRateModifier={handleUpdateRateModifier}
              onOpenSimulateModal={() => setIsSimulateModalOpen(true)}
              onToggleChannelConnect={handleToggleChannelConnect}
              onDisconnectAll={handleDisconnectAllChannels}
              onConnectAll={handleConnectAllChannels}
            />
          )}

          {activeTab === 'kyc_vault' && (
            <GuestIdVault
              bookings={bookings}
              onOpenBooking={handleSelectBooking}
              onNewBookingClick={() => {
                setEditingBooking(null);
                setIsBookingModalOpen(true);
              }}
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
              onNewBookingClick={() => {
                setEditingBooking(null);
                setIsBookingModalOpen(true);
              }}
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

          {activeTab === 'settings' && (
            <SettingsView
              hotelProfile={hotelProfile}
              onUpdateProfile={(up) => {
                setHotelProfile(up);
                showToast('Hotel Profile Updated', up.name);
              }}
              hotels={hotels}
              activeHotelId={activeHotelId}
              onSelectHotel={handleSelectHotel}
              onOpenAddHotel={() => setIsAddHotelModalOpen(true)}
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
            />
          )}
        </main>
      </div>

      {/* Booking Drawer (Details, ID View & Actions) */}
      <BookingDetailsDrawer
        booking={selectedBooking}
        rooms={rooms}
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
        hotelName={hotelProfile.name}
        hotelProfile={hotelProfile}
      />

      {/* Customer Check-In ID Submission Modal ("customar ke check in ke bad id submit hoti h") */}
      <CheckInIdModal
        isOpen={Boolean(checkInIdModalBooking)}
        onClose={() => setCheckInIdModalBooking(null)}
        booking={checkInIdModalBooking}
        rooms={rooms}
        onConfirmCheckIn={handleConfirmCheckInWithId}
      />

      {/* New / Edit Booking & KYC ID Modal */}
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
      />

      {/* OTA Inbound Booking Simulator Modal */}
      <SimulateOtaModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        rooms={rooms}
        onIngestOtaBooking={handleIngestOtaBooking}
      />

      {/* Printable GST Tax Invoice / GRC Modal */}
      <InvoiceModal
        isOpen={invoiceModal.isOpen}
        onClose={() => setInvoiceModal({ isOpen: false, booking: null, mode: 'invoice' })}
        booking={invoiceModal.booking}
        rooms={rooms}
        hotelProfile={hotelProfile}
        mode={invoiceModal.mode}
      />

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
    </div>
  );
}
