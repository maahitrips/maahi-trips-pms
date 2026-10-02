import { 
  Hotel, 
  UserAccount, 
  HotelDataBundle, 
  Room, 
  Booking, 
  OTAChannelConfig, 
  RoomTypeMapping, 
  ChannelSyncLog, 
  HotelProfile 
} from '../types';
import { 
  initialHotelProfile, 
  initialRooms, 
  initialBookings, 
  initialOTAChannels, 
  initialRoomMappings, 
  initialSyncLogs,
  sampleAadhaarFront,
  sampleAadhaarBack,
  samplePassportFront
} from './initialData';

export const initialHotels: Hotel[] = [
  {
    id: 'hotel-bighouse',
    name: 'Big House Inn',
    code: 'BHI',
    tagline: 'Boutique Heritage & Luxury Stay',
    address: 'Plot 42, Lake Palace Road, Near City Center',
    city: 'Udaipur',
    state: 'Rajasthan',
    phone: '+91 96481 33671',
    email: 'frontdesk@bighouseinn.com',
    gstin: '08AABCB1234F1Z8',
    checkInTime: '12:00 PM',
    checkOutTime: '11:00 AM',
    currencySymbol: '₹',
    starCategory: '4-Star Boutique',
    status: 'active',
    createdAt: '2024-01-10',
    ownerId: 'user-admin',
    ownerUsername: 'maahitrips'
  }
];

export const initialUsers: UserAccount[] = [
  {
    id: 'user-admin',
    username: 'maahitrips',
    password: '417905kpj',
    name: 'Maahi Trips',
    designation: 'Super Admin • Group Managing Director',
    role: 'super_admin',
    email: 'shahidkpj@gmail.com',
    phone: '+91 96481 33671',
    hotelId: 'all',
    hotelName: 'All Properties (Super Admin)',
    avatarText: '👑'
  },
  {
    id: 'user-sadik8806',
    username: 'sadik8806',
    password: '8806sadik',
    name: 'Partner Sadik',
    designation: 'Partner & Co-Owner',
    role: 'hotel_owner',
    email: 'partner.sadik@gmail.com',
    phone: '+91 96481 33671',
    hotelId: 'hotel-bighouse',
    hotelName: 'Big House Inn (Udaipur)',
    avatarText: 'SK'
  },
  {
    id: 'user-bighouse-mgr',
    username: 'manager.udaipur',
    password: '417905kpj',
    name: 'GM Udaipur',
    designation: 'General Manager',
    role: 'hotel_manager',
    email: 'gm.udaipur@bighouseinn.com',
    phone: '+91 96481 33671',
    hotelId: 'hotel-bighouse',
    hotelName: 'Big House Inn (Udaipur)',
    avatarText: 'GM'
  }
];

export const initialHotelDataMap: Record<string, HotelDataBundle> = {
  'hotel-bighouse': {
    hotelId: 'hotel-bighouse',
    rooms: initialRooms,
    bookings: initialBookings,
    channels: initialOTAChannels,
    roomMappings: initialRoomMappings,
    syncLogs: initialSyncLogs,
    profile: initialHotelProfile
  }
};

export const initialHotelBundles: Record<string, HotelDataBundle> = initialHotelDataMap;

/**
 * Creates default data bundle when a new hotel is added
 */
export function createDefaultHotelBundle(hotel: Hotel, roomCountTemplate: number = 0): HotelDataBundle {
  let defaultRooms: Room[] = [];

  if (roomCountTemplate > 0) {
    const samplePool: Room[] = [
      { id: `${hotel.id}-101`, number: '101', name: '101 - Deluxe Room', type: 'Deluxe Room', floor: 1, baseRate: 2500, status: 'clean', maxOccupancy: 2, amenities: ['AC', 'TV', 'Wi-Fi'] },
      { id: `${hotel.id}-102`, number: '102', name: '102 - Deluxe Room', type: 'Deluxe Room', floor: 1, baseRate: 2500, status: 'clean', maxOccupancy: 2, amenities: ['AC', 'TV', 'Wi-Fi'] },
      { id: `${hotel.id}-103`, number: '103', name: '103 - Deluxe Room', type: 'Deluxe Room', floor: 1, baseRate: 2500, status: 'clean', maxOccupancy: 2, amenities: ['AC', 'TV', 'Wi-Fi'] },
      { id: `${hotel.id}-201`, number: '201', name: '201 - Executive Suite', type: 'Executive Suite', floor: 2, baseRate: 3800, status: 'clean', maxOccupancy: 3, amenities: ['AC', 'Balcony', 'King Bed', 'Wi-Fi'] },
      { id: `${hotel.id}-202`, number: '202', name: '202 - Executive Suite', type: 'Executive Suite', floor: 2, baseRate: 3800, status: 'clean', maxOccupancy: 3, amenities: ['AC', 'Balcony', 'King Bed', 'Wi-Fi'] },
      { id: `${hotel.id}-203`, number: '203', name: '203 - Family Suite', type: 'Family Suite', floor: 2, baseRate: 4800, status: 'clean', maxOccupancy: 4, amenities: ['2 Beds', 'AC', 'Fridge'] },
    ];
    defaultRooms = samplePool.slice(0, Math.min(roomCountTemplate, samplePool.length));
  }

  const profile: HotelProfile = {
    name: hotel.name,
    tagline: hotel.tagline,
    address: hotel.address,
    city: hotel.city + (hotel.state ? `, ${hotel.state}` : ''),
    phone: hotel.phone,
    email: hotel.email,
    gstin: hotel.gstin,
    checkInTime: hotel.checkInTime || '12:00 PM',
    checkOutTime: hotel.checkOutTime || '11:00 AM',
    currencySymbol: hotel.currencySymbol || '₹'
  };

  return {
    hotelId: hotel.id,
    rooms: defaultRooms,
    bookings: [],
    // New property starts with disconnected OTA channels - owner connects them when ready
    channels: initialOTAChannels.map(c => ({ 
      ...c, 
      isConnected: false, 
      status: 'disconnected', 
      mappedRoomsCount: 0,
      totalRoomsCount: defaultRooms.length,
      activeReservationsCount: 0 
    })),
    roomMappings: defaultRooms.length > 0 ? initialRoomMappings : [],
    syncLogs: [
      {
        id: `log-init-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        channel: 'makemytrip',
        channelName: 'Channel Engine',
        eventType: 'inventory_push',
        status: 'success',
        message: defaultRooms.length > 0 
          ? `Property ${hotel.name} initialized with ${defaultRooms.length} rooms.`
          : `Property ${hotel.name} initialized with 0 rooms. Ready to add your rooms.`
      }
    ],
    profile
  };
}
