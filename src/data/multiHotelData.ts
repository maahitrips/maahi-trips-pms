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
    ownerId: 'user-sadik8806',
    ownerUsername: 'sadik8806'
  },
  {
    id: 'hotel-sairesidency',
    name: 'Hotel Sai Residency',
    code: 'HSR',
    tagline: 'Comfort & Peace near Kashi Vishwanath Corridor',
    address: 'D-38/12 Godowlia Chowk, Dashashwamedh',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    phone: '+91 94500 88210',
    email: 'contact@sairesidencykashi.com',
    gstin: '09AACCS9821K1Z2',
    checkInTime: '01:00 PM',
    checkOutTime: '11:00 AM',
    currencySymbol: '₹',
    starCategory: '3-Star Premium',
    status: 'active',
    createdAt: '2024-03-15',
    ownerId: 'user-admin',
    ownerUsername: 'maahitrips'
  },
  {
    id: 'hotel-grandheritage',
    name: 'The Grand Heritage Palace',
    code: 'TGH',
    tagline: 'Royal Rajputana Suites & Havelis',
    address: 'Amber Fort Road, Civil Lines',
    city: 'Jaipur',
    state: 'Rajasthan',
    phone: '+91 98290 11920',
    email: 'reservations@grandheritagejaipur.com',
    gstin: '08AAATG4412P1ZN',
    checkInTime: '02:00 PM',
    checkOutTime: '12:00 PM',
    currencySymbol: '₹',
    starCategory: '5-Star Heritage',
    status: 'active',
    createdAt: '2023-11-20',
    ownerId: 'user-admin',
    ownerUsername: 'maahitrips'
  }
];

export const initialUsers: UserAccount[] = [
  {
    id: 'user-admin',
    username: 'maahitrips',
    password: '417905kpj',
    name: 'Shahid',
    designation: 'Group Managing Director & Owner',
    role: 'super_admin',
    email: 'shahidkpj@gmail.com',
    phone: '+91 96481 33671',
    hotelId: 'all',
    hotelName: 'All Properties (Group Director)',
    avatarText: '👑'
  },
  {
    id: 'user-sadik8806',
    username: 'sadik8806',
    password: '8806sadik',
    name: 'Sadik',
    designation: 'Hotel Partner & Owner',
    role: 'hotel_owner',
    email: 'sadik8806@gmail.com',
    phone: '+91 96481 33671',
    hotelId: 'hotel-bighouse',
    hotelName: 'Big House Inn (Udaipur)',
    avatarText: 'SK'
  },
  {
    id: 'user-bighouse-mgr',
    username: 'manager.udaipur',
    password: 'password123',
    name: 'Vikram Rathore',
    designation: 'General Manager (Udaipur)',
    role: 'hotel_manager',
    email: 'vikram.mgr@bighouseinn.com',
    phone: '+91 98291 55432',
    hotelId: 'hotel-bighouse',
    hotelName: 'Big House Inn (Udaipur)',
    avatarText: 'VR'
  },
  {
    id: 'user-sairesidency-mgr',
    username: 'frontdesk.varanasi',
    password: 'password123',
    name: 'Pooja Sharma',
    designation: 'Front Office Supervisor (Varanasi)',
    role: 'hotel_manager',
    email: 'pooja.sharma@sairesidencykashi.com',
    phone: '+91 94500 33412',
    hotelId: 'hotel-sairesidency',
    hotelName: 'Hotel Sai Residency (Varanasi)',
    avatarText: 'PS'
  },
  {
    id: 'user-grandheritage-mgr',
    username: 'manager.jaipur',
    password: 'password123',
    name: 'Aditya Shekhawat',
    designation: 'Resort Manager (Jaipur)',
    role: 'hotel_manager',
    email: 'aditya.s@grandheritagejaipur.com',
    phone: '+91 98290 77123',
    hotelId: 'hotel-grandheritage',
    hotelName: 'The Grand Heritage Palace (Jaipur)',
    avatarText: 'AS'
  },
  {
    id: 'user-friend-partner',
    username: 'dost',
    password: 'password123',
    name: 'Dost (Hotel Partner)',
    designation: 'New Hotel Partner / Owner',
    role: 'hotel_manager',
    email: 'dost.hotel@gmail.com',
    phone: '+91 96481 33671',
    hotelId: '',
    hotelName: 'Click "+ Add Property" to Setup',
    avatarText: '🤝'
  }
];

// Hotel 2: Hotel Sai Residency (Varanasi) Data
const saiResidencyProfile: HotelProfile = {
  name: 'Hotel Sai Residency',
  tagline: 'Comfort & Peace near Kashi Vishwanath Corridor',
  address: 'D-38/12 Godowlia Chowk, Dashashwamedh',
  city: 'Varanasi, Uttar Pradesh 221001',
  phone: '+91 94500 88210',
  email: 'contact@sairesidencykashi.com',
  gstin: '09AACCS9821K1Z2',
  checkInTime: '01:00 PM',
  checkOutTime: '11:00 AM',
  currencySymbol: '₹'
};

const saiResidencyRooms: Room[] = [
  { id: 'hsr-101', number: '101', name: '101 - Standard AC Double', type: 'Standard AC Double', floor: 1, baseRate: 2200, status: 'clean', maxOccupancy: 2, amenities: ['AC', 'Geyser', 'Wi-Fi', 'TV'] },
  { id: 'hsr-102', number: '102', name: '102 - Standard AC Double', type: 'Standard AC Double', floor: 1, baseRate: 2200, status: 'clean', maxOccupancy: 2, amenities: ['AC', 'Geyser', 'Wi-Fi', 'TV'] },
  { id: 'hsr-103', number: '103', name: '103 - Standard AC Double', type: 'Standard AC Double', floor: 1, baseRate: 2200, status: 'clean', maxOccupancy: 2, amenities: ['AC', 'Geyser', 'Wi-Fi', 'TV'] },
  { id: 'hsr-201', number: '201', name: '201 - Deluxe Temple View', type: 'Deluxe Temple View', floor: 2, baseRate: 3200, status: 'clean', maxOccupancy: 3, amenities: ['AC', 'Balcony', 'Geyser', 'Wi-Fi', 'Smart TV'] },
  { id: 'hsr-202', number: '202', name: '202 - Deluxe Temple View', type: 'Deluxe Temple View', floor: 2, baseRate: 3200, status: 'dirty', maxOccupancy: 3, amenities: ['AC', 'Balcony', 'Geyser', 'Wi-Fi', 'Smart TV'] },
  { id: 'hsr-203', number: '203', name: '203 - Deluxe Temple View', type: 'Deluxe Temple View', floor: 2, baseRate: 3200, status: 'clean', maxOccupancy: 3, amenities: ['AC', 'Balcony', 'Geyser', 'Wi-Fi', 'Smart TV'] },
  { id: 'hsr-301', number: '301', name: '301 - Family 4-Bed Suite', type: 'Family 4-Bed Suite', floor: 3, baseRate: 4800, status: 'clean', maxOccupancy: 5, amenities: ['2 King Beds', 'Sofa', 'Fridge', 'Kettle', 'Geyser'] },
  { id: 'hsr-302', number: '302', name: '302 - Family 4-Bed Suite', type: 'Family 4-Bed Suite', floor: 3, baseRate: 4800, status: 'cleaning', maxOccupancy: 5, amenities: ['2 King Beds', 'Sofa', 'Fridge', 'Kettle', 'Geyser'] },
  { id: 'hsr-401', number: '401', name: '401 - Ganga Terrace Suite', type: 'Ganga Terrace Suite', floor: 4, baseRate: 5500, status: 'clean', maxOccupancy: 4, amenities: ['River View Terrace', 'AC', 'Bathtub', 'Smart TV'] },
  { id: 'hsr-402', number: '402', name: '402 - Ganga Terrace Suite', type: 'Ganga Terrace Suite', floor: 4, baseRate: 5500, status: 'clean', maxOccupancy: 4, amenities: ['River View Terrace', 'AC', 'Bathtub', 'Smart TV'] }
];

const saiResidencyBookings: Booking[] = [
  {
    id: 'bk-varanasi-1',
    bookingCode: 'HSR-4910',
    roomId: 'hsr-201',
    guest: {
      id: 'g-hsr-1',
      fullName: 'Rameshwar Lal Agrawal',
      phone: '+91 94150 99210',
      email: 'rl.agrawal@gmail.com',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      country: 'India',
      nationality: 'Indian',
      previousStaysCount: 2,
      totalSpent: 12000,
      idDocument: {
        idType: 'aadhaar',
        idNumber: '8834 2910 1194',
        frontImageUrl: sampleAadhaarFront,
        backImageUrl: sampleAadhaarBack,
        isVerified: true,
        uploadedAt: '2026-09-16T09:00:00Z',
        issuedBy: 'UIDAI Govt of India',
        notes: 'Original Aadhaar verified at front desk for Kashi Darshan Form'
      }
    },
    checkInDate: '2026-09-16',
    checkOutDate: '2026-09-19',
    nights: 3,
    adults: 2,
    children: 1,
    channel: 'walkin',
    roomRatePerNight: 3200,
    taxRatePercent: 12,
    extraCharges: [
      { id: 'ext-hsr-1', description: 'Ganga Aarti Special Boat Escort', amount: 800, date: '2026-09-17' }
    ],
    payments: [
      { id: 'pm-hsr-1', amount: 5000, mode: 'upi', reference: 'UPI/HDFC/9048201', date: '2026-09-16', notes: 'Advance paid' }
    ],
    status: 'checked_in',
    specialRequests: 'Early check-in for morning temple Mangala Aarti',
    createdAt: '2026-09-15T11:00:00Z'
  },
  {
    id: 'bk-varanasi-2',
    bookingCode: 'MMT-88219',
    roomId: 'hsr-301',
    guest: {
      id: 'g-hsr-2',
      fullName: 'Sunil Kumar Banerjee',
      phone: '+91 98302 44190',
      email: 'sunil.banerjee@outlook.com',
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India',
      nationality: 'Indian',
      previousStaysCount: 1,
      totalSpent: 16128,
      idDocument: {
        idType: 'voter_id',
        idNumber: 'WB/04/281/09281',
        isVerified: true,
        uploadedAt: '2026-09-14T15:30:00Z',
        issuedBy: 'Election Commission of India'
      }
    },
    checkInDate: '2026-09-17',
    checkOutDate: '2026-09-20',
    nights: 3,
    adults: 4,
    children: 0,
    channel: 'makemytrip',
    channelRefId: 'MMT-KASHI-9921',
    roomRatePerNight: 4800,
    taxRatePercent: 12,
    extraCharges: [],
    payments: [
      { id: 'pm-hsr-2', amount: 16128, mode: 'ota_virtual_card', reference: 'MMT-VC-8831', date: '2026-09-17' }
    ],
    status: 'confirmed',
    specialRequests: 'Elderly parents travelling, please assign room near lift',
    createdAt: '2026-09-14T15:30:00Z'
  }
];

// Hotel 3: The Grand Heritage Palace (Jaipur) Data
const grandHeritageProfile: HotelProfile = {
  name: 'The Grand Heritage Palace',
  tagline: 'Royal Rajputana Suites & Havelis',
  address: 'Amber Fort Road, Civil Lines',
  city: 'Jaipur, Rajasthan 302006',
  phone: '+91 98290 11920',
  email: 'reservations@grandheritagejaipur.com',
  gstin: '08AAATG4412P1ZN',
  checkInTime: '02:00 PM',
  checkOutTime: '12:00 PM',
  currencySymbol: '₹'
};

const grandHeritageRooms: Room[] = [
  { id: 'tgh-101', number: '101', name: '101 - Royal Deluxe Room', type: 'Royal Deluxe Room', floor: 1, baseRate: 4500, status: 'clean', maxOccupancy: 3, amenities: ['AC', 'Jharokha Balcony', 'Wi-Fi', 'Mini Bar'] },
  { id: 'tgh-102', number: '102', name: '102 - Royal Deluxe Room', type: 'Royal Deluxe Room', floor: 1, baseRate: 4500, status: 'clean', maxOccupancy: 3, amenities: ['AC', 'Jharokha Balcony', 'Wi-Fi', 'Mini Bar'] },
  { id: 'tgh-103', number: '103', name: '103 - Royal Deluxe Room', type: 'Royal Deluxe Room', floor: 1, baseRate: 4500, status: 'clean', maxOccupancy: 3, amenities: ['AC', 'Jharokha Balcony', 'Wi-Fi', 'Mini Bar'] },
  { id: 'tgh-201', number: '201', name: '201 - Courtyard Haveli Suite', type: 'Courtyard Haveli Suite', floor: 2, baseRate: 7500, status: 'clean', maxOccupancy: 4, amenities: ['Four Poster Bed', 'Bathtub', 'Garden View', 'Espresso'] },
  { id: 'tgh-202', number: '202', name: '202 - Courtyard Haveli Suite', type: 'Courtyard Haveli Suite', floor: 2, baseRate: 7500, status: 'dirty', maxOccupancy: 4, amenities: ['Four Poster Bed', 'Bathtub', 'Garden View', 'Espresso'] },
  { id: 'tgh-301', number: '301', name: '301 - Maharaja Royal Suite', type: 'Maharaja Royal Suite', floor: 3, baseRate: 12500, status: 'clean', maxOccupancy: 4, amenities: ['Private Jacuzzi', 'Butler Service', 'Fort View', 'Chandelier Lounge'] },
  { id: 'tgh-302', number: '302', name: '302 - Maharaja Royal Suite', type: 'Maharaja Royal Suite', floor: 3, baseRate: 12500, status: 'clean', maxOccupancy: 4, amenities: ['Private Jacuzzi', 'Butler Service', 'Fort View', 'Chandelier Lounge'] }
];

const grandHeritageBookings: Booking[] = [
  {
    id: 'bk-jaipur-1',
    bookingCode: 'TGH-9024',
    roomId: 'tgh-301',
    guest: {
      id: 'g-tgh-1',
      fullName: 'Sarah & Michael Jenkins',
      phone: '+44 7700 900124',
      email: 'jenkins.travel@ukmail.co.uk',
      city: 'London',
      country: 'United Kingdom',
      nationality: 'British',
      previousStaysCount: 1,
      totalSpent: 53500,
      idDocument: {
        idType: 'passport',
        idNumber: 'GB849201948',
        frontImageUrl: samplePassportFront,
        isVerified: true,
        uploadedAt: '2026-09-10T12:00:00Z',
        issuedBy: 'HM Passport Office UK',
        expiryDate: '2032-11-05',
        notes: 'Foreign tourist Form-C e-FRRO submitted online'
      }
    },
    checkInDate: '2026-09-16',
    checkOutDate: '2026-09-20',
    nights: 4,
    adults: 2,
    children: 0,
    channel: 'booking_com',
    channelRefId: 'BC-99210-UK',
    roomRatePerNight: 12500,
    taxRatePercent: 18,
    extraCharges: [
      { id: 'ext-tgh-1', description: 'Palace Folk Dance & Candlelight Dinner', amount: 3500, date: '2026-09-17' }
    ],
    payments: [
      { id: 'pm-tgh-1', amount: 30000, mode: 'card', reference: 'VISA/BARCLAYS/4482', date: '2026-09-16' }
    ],
    status: 'checked_in',
    specialRequests: 'Honeymoon couple, flower setup in Jacuzzi requested',
    createdAt: '2026-09-10T12:00:00Z'
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
  },
  'hotel-sairesidency': {
    hotelId: 'hotel-sairesidency',
    rooms: saiResidencyRooms,
    bookings: saiResidencyBookings,
    channels: initialOTAChannels.map(ch => ({
      ...ch,
      mappedRoomsCount: 8,
      totalRoomsCount: 10,
      activeReservationsCount: 6
    })),
    roomMappings: initialRoomMappings,
    syncLogs: [
      {
        id: 'log-hsr-1',
        timestamp: '10:30 AM',
        channel: 'makemytrip',
        channelName: 'MakeMyTrip',
        eventType: 'inventory_push',
        status: 'success',
        message: 'Synced 10 rooms inventory to MakeMyTrip Extranet'
      }
    ],
    profile: saiResidencyProfile
  },
  'hotel-grandheritage': {
    hotelId: 'hotel-grandheritage',
    rooms: grandHeritageRooms,
    bookings: grandHeritageBookings,
    channels: initialOTAChannels.map(ch => ({
      ...ch,
      mappedRoomsCount: 7,
      totalRoomsCount: 7,
      activeReservationsCount: 9
    })),
    roomMappings: initialRoomMappings,
    syncLogs: [
      {
        id: 'log-tgh-1',
        timestamp: '11:15 AM',
        channel: 'booking_com',
        channelName: 'Booking.com',
        eventType: 'rate_update',
        status: 'success',
        message: 'Rates & Palace Heritage inventory updated successfully'
      }
    ],
    profile: grandHeritageProfile
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
