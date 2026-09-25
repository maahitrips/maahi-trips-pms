export type RoomStatus = 'clean' | 'dirty' | 'cleaning' | 'ooo'; // out of order

export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export type BookingChannel = 
  | 'walkin' 
  | 'phone' 
  | 'makemytrip' 
  | 'booking_com' 
  | 'agoda' 
  | 'airbnb' 
  | 'goibibo' 
  | 'expedia'
  | 'cleartrip'
  | 'oyo'
  | 'easemytrip'
  | 'yatra';

export type IdType = 
  | 'aadhaar' 
  | 'voter_id' 
  | 'driving_license' 
  | 'passport' 
  | 'pan_card' 
  | 'national_id';

export const ID_TYPE_OPTIONS: { id: IdType; label: string; shortLabel: string }[] = [
  { id: 'aadhaar', label: 'ADHAR / Aadhaar Card', shortLabel: 'ADHAR' },
  { id: 'voter_id', label: 'VOTER ID / Election Card', shortLabel: 'VOTER' },
  { id: 'driving_license', label: 'DL / Driving License', shortLabel: 'DL' },
  { id: 'passport', label: 'PASSPORT', shortLabel: 'PASSPORT' },
  { id: 'pan_card', label: 'PAN Card', shortLabel: 'PAN' },
  { id: 'national_id', label: 'Other Government Photo ID', shortLabel: 'GOVT ID' }
];

export const formatIdTypeName = (type: string | undefined): string => {
  if (!type) return 'ADHAR';
  const t = type.toLowerCase();
  if (t === 'aadhaar' || t === 'adhar') return 'ADHAR';
  if (t === 'voter_id' || t === 'voter') return 'VOTER';
  if (t === 'driving_license' || t === 'dl') return 'DL';
  if (t === 'passport') return 'PASSPORT';
  if (t === 'pan_card' || t === 'pan') return 'PAN CARD';
  return 'GOVT PHOTO ID';
};

export const isIdVerifiedCheck = (idDoc?: { isVerified?: boolean; idNumber?: string }): boolean => {
  if (!idDoc) return false;
  if (!idDoc.isVerified) return false;
  if (!idDoc.idNumber) return false;
  const num = idDoc.idNumber.trim().toLowerCase();
  if (num === '' || num === 'pending at check-in' || num.includes('pending') || num === 'due at check-in') {
    return false;
  }
  return true;
};

export interface IdDocument {
  idType: IdType;
  idNumber: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  expiryDate?: string;
  isVerified: boolean;
  uploadedAt: string;
  notes?: string;
  issuedBy?: string;
}

export interface Guest {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  nationality: string;
  purposeOfVisit?: string;
  vehicleNumber?: string;
  emergencyContact?: string;
  idDocument: IdDocument;
  vipTag?: boolean;
  previousStaysCount: number;
  totalSpent: number;
}

export interface Room {
  id: string;
  number: string;
  name: string; // e.g., "101 - Jambo", "202-PHH"
  type: string; // "Jambo", "Quad", "Couple", "Deluxe", "Penthouse"
  floor: number;
  baseRate: number;
  maxOccupancy: number;
  status: RoomStatus;
  amenities: string[];
}

export interface ExtraCharge {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export type PaymentMode = 'cash' | 'upi' | 'card' | 'ota_virtual_card' | 'bank_transfer';

export interface PaymentItem {
  id: string;
  amount: number;
  mode: PaymentMode;
  reference?: string;
  date: string;
  notes?: string;
}

export interface Booking {
  id: string;
  bookingCode: string; // e.g. "BK-9021" or "MMT-8823"
  roomId: string;
  roomNumber?: string;
  groupId?: string; // Group / multi-room booking identifier
  groupTotalRooms?: number; // Total rooms in this multi-room reservation
  guest: Guest;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  nights: number;
  adults: number;
  children: number;
  channel: BookingChannel;
  channelRefId?: string;
  roomRatePerNight: number;
  discountAmount?: number; // Total ₹ discount given on stay
  discountType?: 'flat' | 'percentage';
  discountValue?: number; // Raw entered value (e.g. 500 or 10%)
  discountReason?: string; // e.g. "Corporate Rate", "Direct Walk-in"
  taxRatePercent: number; // e.g. 5% GST (2.5% CGST + 2.5% SGST)
  extraCharges: ExtraCharge[];
  payments: PaymentItem[];
  status: BookingStatus;
  specialRequests?: string;
  createdAt: string;
  notes?: string;
}

export interface OTAChannelConfig {
  id: BookingChannel;
  name: string;
  logo: string;
  color: string;
  tagColor: string;
  isConnected: boolean;
  status: 'active' | 'syncing' | 'paused' | 'error' | 'disconnected';
  lastSyncedAt: string;
  autoSync: boolean;
  rateMarkupPercent: number; // e.g. 15%
  mappedRoomsCount: number;
  totalRoomsCount: number;
  activeReservationsCount: number;
  apiEndpoint: string;
  hotelCode?: string;
  apiKey?: string;
  apiSecret?: string;
  extranetUsername?: string;
  extranetPassword?: string;
  environment?: 'production' | 'sandbox';
  twoWaySyncEnabled?: boolean;
}

export interface RoomTypeMapping {
  id: string;
  pmsRoomType: string;
  otaChannel: BookingChannel;
  otaRoomCode: string;
  otaRoomTitle: string;
  isSynced: boolean;
  rateModifier: number;
  stopSell: boolean;
}

export interface ChannelSyncLog {
  id: string;
  timestamp: string;
  channel: BookingChannel;
  channelName: string;
  eventType: 'reservation_new' | 'reservation_modify' | 'inventory_push' | 'rate_update' | 'stop_sell_pushed';
  status: 'success' | 'warning' | 'error';
  message: string;
  payloadSummary?: string;
}

export interface DynamicPricingConfig {
  isEnabled: boolean;
  tier1ThresholdPercent: number; // e.g. 50% sold out
  tier1SurgePercent: number;     // e.g. +10% rate increase
  tier2ThresholdPercent: number; // e.g. 80% sold out
  tier2SurgePercent: number;     // e.g. +20% rate increase
  applyToAllChannels: boolean;
}

export interface HotelProfile {
  name: string;
  tagline: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  gstin: string;
  checkInTime: string;
  checkOutTime: string;
  currencySymbol: string;
}

export type UserRole = 'super_admin' | 'hotel_owner' | 'hotel_manager' | 'front_desk';

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
  hotelId: string; // 'all' for super_admin or specific hotel id like 'hotel-1'
  hotelName?: string;
  designation: string;
  avatarText?: string;
}

export interface Hotel {
  id: string;
  name: string;
  code: string;
  tagline: string;
  address: string;
  city: string;
  state?: string;
  phone: string;
  email: string;
  gstin: string;
  checkInTime: string;
  checkOutTime: string;
  currencySymbol: string;
  starCategory?: string;
  status: 'active' | 'maintenance' | 'paused';
  createdAt: string;
  ownerId?: string;
  ownerUsername?: string;
}

export interface HotelDataBundle {
  hotelId?: string;
  rooms: Room[];
  bookings: Booking[];
  channels: OTAChannelConfig[];
  roomMappings: RoomTypeMapping[];
  syncLogs: ChannelSyncLog[];
  profile: HotelProfile;
}

export interface DeletionRequest {
  id: string;
  type: 'room' | 'hotel';
  targetId: string;
  targetName: string;
  hotelId: string;
  hotelName: string;
  requestedBy: string;
  requestedByUsername: string;
  requestedAt: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
}
