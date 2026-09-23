import { Room, Booking, OTAChannelConfig, RoomTypeMapping, ChannelSyncLog, HotelProfile, IdDocument } from '../types';

export const initialHotelProfile: HotelProfile = {
  name: "Big House Inn",
  tagline: "Boutique Heritage & Luxury Stay",
  address: "Plot 42, Lake Palace Road, Near City Center",
  city: "Udaipur, Rajasthan 313001",
  phone: "+91 96481 33671",
  email: "frontdesk@bighouseinn.com",
  gstin: "08AABCB1234F1Z8",
  checkInTime: "12:00 PM",
  checkOutTime: "11:00 AM",
  currencySymbol: "₹",
};

// SVG ID Data URIs for realistic document rendering
export const sampleAadhaarFront = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240" style="background:#fff;border-radius:12px;font-family:sans-serif;box-shadow:0 4px 10px rgba(0,0,0,0.15)">
  <rect width="400" height="36" fill="#f97316"/>
  <rect y="204" width="400" height="36" fill="#15803d"/>
  <text x="200" y="24" fill="#fff" font-size="13" font-weight="bold" text-anchor="middle">GOVERNMENT OF INDIA / भारत सरकार</text>
  <rect x="24" y="55" width="80" height="100" rx="6" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2"/>
  <circle cx="64" cy="90" r="22" fill="#94a3b8"/>
  <path d="M40 140 C40 115 88 115 88 140 Z" fill="#94a3b8"/>
  <text x="120" y="72" font-size="14" font-weight="bold" fill="#0f172a">Nizamuddin Saifi</text>
  <text x="120" y="92" font-size="11" fill="#64748b">DOB: 14/08/1992</text>
  <text x="120" y="110" font-size="11" fill="#64748b">Gender: MALE / पुरुष</text>
  <text x="120" y="130" font-size="11" fill="#64748b">Address: B-12 Jamia Nagar, New Delhi</text>
  <rect x="20" y="165" width="360" height="30" rx="6" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="200" y="186" font-size="18" font-weight="bold" letter-spacing="4" fill="#1e293b" text-anchor="middle">5482 9104 3821</text>
  <text x="200" y="226" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">मेरा आधार, मेरी पहचान</text>
</svg>
`);

export const sampleAadhaarBack = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240" style="background:#fff;border-radius:12px;font-family:sans-serif;box-shadow:0 4px 10px rgba(0,0,0,0.15)">
  <rect width="400" height="36" fill="#f97316"/>
  <rect y="204" width="400" height="36" fill="#15803d"/>
  <text x="200" y="24" fill="#fff" font-size="13" font-weight="bold" text-anchor="middle">UNIQUE IDENTIFICATION AUTHORITY OF INDIA</text>
  <text x="24" y="65" font-size="11" font-weight="bold" fill="#0f172a">Address / पता:</text>
  <text x="24" y="85" font-size="11" fill="#475569">S/O: A. R. Saifi, Flat 302, Green View Apts,</text>
  <text x="24" y="103" font-size="11" fill="#475569">Okhla Vihar, South East Delhi, 110025</text>
  <rect x="270" y="60" width="105" height="105" fill="#f1f5f9" stroke="#cbd5e1"/>
  <text x="322" y="115" font-size="11" fill="#94a3b8" text-anchor="middle">[QR CODE]</text>
  <text x="200" y="185" font-size="16" font-weight="bold" letter-spacing="4" fill="#334155" text-anchor="middle">5482 9104 3821</text>
  <text x="200" y="226" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">www.uidai.gov.in • Toll Free: 1947</text>
</svg>
`);

export const samplePassportFront = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240" style="background:#0f172a;border-radius:12px;font-family:monospace;color:#f8fafc;box-shadow:0 4px 10px rgba(0,0,0,0.25)">
  <rect width="400" height="40" fill="#1e293b"/>
  <text x="200" y="26" fill="#f59e0b" font-size="13" font-weight="bold" text-anchor="middle">REPUBLIC OF INDIA / PASSPORT</text>
  <rect x="20" y="55" width="80" height="100" rx="4" fill="#334155" stroke="#475569"/>
  <circle cx="60" cy="90" r="22" fill="#64748b"/>
  <path d="M35 140 C35 118 85 118 85 140 Z" fill="#64748b"/>
  <text x="115" y="72" font-size="13" font-weight="bold" fill="#f8fafc">SHUKLA, TANU</text>
  <text x="115" y="90" font-size="10" fill="#94a3b8">Nationality: INDIAN</text>
  <text x="115" y="106" font-size="10" fill="#94a3b8">Passport No: Z9182304</text>
  <text x="115" y="122" font-size="10" fill="#94a3b8">Valid Thru: 18/09/2031</text>
  <text x="115" y="138" font-size="10" fill="#94a3b8">Place of Issue: LUCKNOW</text>
  <rect x="15" y="165" width="370" height="60" fill="#020617" rx="4"/>
  <text x="25" y="188" font-size="11" fill="#38bdf8">P&lt;INDSHUKLA&lt;&lt;TANU&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
  <text x="25" y="208" font-size="11" fill="#38bdf8">Z9182304&lt;2IND9605128F3109181&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;4</text>
</svg>
`);

export const initialRooms: Room[] = [
  {
    id: "rm-101",
    number: "101",
    name: "101 - Jambo",
    type: "Jambo Family Suite",
    floor: 1,
    baseRate: 4500,
    maxOccupancy: 4,
    status: "clean",
    amenities: ["King Bed", "Living Area", "Balcony", "AC", "Smart TV", "Mini Fridge"]
  },
  {
    id: "rm-102",
    number: "102",
    name: "102-Quad",
    type: "Quad Bedded Room",
    floor: 1,
    baseRate: 4000,
    maxOccupancy: 4,
    status: "clean",
    amenities: ["2 Queen Beds", "Garden View", "AC", "Free WiFi", "Geyser"]
  },
  {
    id: "rm-201",
    number: "201",
    name: "201-2Room",
    type: "2-Room Interconnected Suite",
    floor: 2,
    baseRate: 5200,
    maxOccupancy: 5,
    status: "clean",
    amenities: ["2 Bedrooms", "2 Bathrooms", "Lake View", "AC", "Work Desk"]
  },
  {
    id: "rm-202",
    number: "202",
    name: "202-PHH",
    type: "Penthouse Heritage Room",
    floor: 2,
    baseRate: 4200,
    maxOccupancy: 2,
    status: "occupied" as any,
    amenities: ["Heritage King Bed", "Private Terrace", "Bathtub", "AC", "Minibar"]
  },
  {
    id: "rm-203",
    number: "203",
    name: "203-Couple",
    type: "Couple Deluxe Room",
    floor: 2,
    baseRate: 2800,
    maxOccupancy: 2,
    status: "occupied" as any,
    amenities: ["Queen Bed", "Mood Lighting", "Balcony", "AC", "Coffee Maker"]
  },
  {
    id: "rm-204",
    number: "204",
    name: "204-Copule",
    type: "Couple Standard Room",
    floor: 2,
    baseRate: 2600,
    maxOccupancy: 2,
    status: "occupied" as any,
    amenities: ["Double Bed", "City View", "AC", "LED TV", "Complimentary Breakfast"]
  },
  {
    id: "rm-205",
    number: "205",
    name: "205 - Deluxe",
    type: "Executive Deluxe Room",
    floor: 2,
    baseRate: 3200,
    maxOccupancy: 3,
    status: "dirty",
    amenities: ["King Bed", "Sofa", "AC", "Rain Shower", "High-speed WiFi"]
  },
  {
    id: "rm-206",
    number: "206",
    name: "206 - Superior",
    type: "Superior Twin Room",
    floor: 2,
    baseRate: 3100,
    maxOccupancy: 2,
    status: "cleaning",
    amenities: ["Twin Beds", "AC", "Wardrobe", "Electric Kettle"]
  },
  {
    id: "rm-301",
    number: "301",
    name: "301 - Royal Suite",
    type: "Royal Lakeview Suite",
    floor: 3,
    baseRate: 6800,
    maxOccupancy: 3,
    status: "clean",
    amenities: ["Palace Lake View", "Jacuzzi", "Living Room", "Butler Service", "Mini Bar"]
  },
  {
    id: "rm-302",
    number: "302",
    name: "302 - Executive",
    type: "Executive Business Room",
    floor: 3,
    baseRate: 3600,
    maxOccupancy: 2,
    status: "ooo",
    amenities: ["King Bed", "Ergonomic Desk", "Smart TV", "AC", "Safe Locker"]
  }
];

export const initialBookings: Booking[] = [
  {
    id: "bk-001",
    bookingCode: "BHI-8091",
    roomId: "rm-203",
    guest: {
      id: "gst-001",
      fullName: "Nizamuddin saifi",
      phone: "+91 98112 44332",
      email: "nizam.saifi@gmail.com",
      address: "B-12 Jamia Nagar, Okhla Vihar",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      nationality: "Indian",
      purposeOfVisit: "Leisure & Heritage Tourism",
      vehicleNumber: "DL 3C AB 9081",
      emergencyContact: "+91 98112 44330 (Brother)",
      idDocument: {
        idType: "aadhaar",
        idNumber: "5482 9104 3821",
        frontImageUrl: sampleAadhaarFront,
        backImageUrl: sampleAadhaarBack,
        isVerified: true,
        uploadedAt: "2026-09-17 10:45 AM",
        notes: "Biometric Aadhaar QR scanned at check-in desk"
      },
      vipTag: false,
      previousStaysCount: 2,
      totalSpent: 12400
    },
    checkInDate: "2026-09-17",
    checkOutDate: "2026-09-19",
    nights: 2,
    adults: 2,
    children: 0,
    channel: "walkin",
    channelRefId: "WALK-20260917-01",
    roomRatePerNight: 2800,
    taxRatePercent: 12,
    extraCharges: [
      { id: "ext-1", description: "Buffet Dinner for 2", amount: 900, date: "2026-09-17" }
    ],
    payments: [
      { id: "pay-1", amount: 3500, mode: "upi", reference: "UPI/329482109/HDFC", date: "2026-09-17 11:00 AM" }
    ],
    status: "checked_in",
    specialRequests: "Non-smoking room, extra pillow requested",
    createdAt: "2026-09-17 10:30 AM"
  },
  {
    id: "bk-002",
    bookingCode: "MMT-6641",
    roomId: "rm-204",
    guest: {
      id: "gst-002",
      fullName: "Tanu shukla",
      phone: "+91 94500 12890",
      email: "tanu.shukla96@outlook.com",
      address: "14/B Gomti Nagar",
      city: "Lucknow",
      state: "Uttar Pradesh",
      country: "India",
      nationality: "Indian",
      purposeOfVisit: "Solo Holiday",
      idDocument: {
        idType: "passport",
        idNumber: "Z9182304",
        frontImageUrl: samplePassportFront,
        expiryDate: "2031-09-18",
        isVerified: true,
        uploadedAt: "2026-09-17 11:20 AM",
        notes: "Original passport verified at front desk"
      },
      vipTag: true,
      previousStaysCount: 1,
      totalSpent: 6200
    },
    checkInDate: "2026-09-17",
    checkOutDate: "2026-09-18",
    nights: 1,
    adults: 1,
    children: 0,
    channel: "makemytrip",
    channelRefId: "MMT-CONF-9840291",
    roomRatePerNight: 2600,
    taxRatePercent: 12,
    extraCharges: [],
    payments: [
      { id: "pay-2", amount: 2912, mode: "ota_virtual_card", reference: "MMT-VCC-9021", date: "2026-09-16 04:00 PM" }
    ],
    status: "checked_in",
    specialRequests: "Quiet corner room, late check-out requested",
    createdAt: "2026-09-16 03:45 PM"
  },
  {
    id: "bk-003",
    bookingCode: "MMT-8824",
    roomId: "rm-202",
    guest: {
      id: "gst-003",
      fullName: "Kishore mmt",
      phone: "+91 97118 67201",
      email: "kishore.kumar@travelhub.in",
      address: "Flat 402, Sunshine Heights, Andheri West",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      nationality: "Indian",
      purposeOfVisit: "Anniversary Celebration",
      idDocument: {
        idType: "driving_license",
        idNumber: "MH02 20180092143",
        expiryDate: "2038-04-12",
        isVerified: true,
        uploadedAt: "2026-09-15 02:10 PM",
        notes: "Pre-checked in via OTA Guest Portal"
      },
      vipTag: true,
      previousStaysCount: 4,
      totalSpent: 38900
    },
    checkInDate: "2026-09-21",
    checkOutDate: "2026-09-23",
    nights: 2,
    adults: 2,
    children: 0,
    channel: "makemytrip",
    channelRefId: "MMT-CONF-449102",
    roomRatePerNight: 4200,
    taxRatePercent: 12,
    extraCharges: [
      { id: "ext-3", description: "Terrace Candlelight Setup", amount: 1500, date: "2026-09-21" }
    ],
    payments: [
      { id: "pay-3", amount: 9408, mode: "ota_virtual_card", reference: "MMT-VCC-4491", date: "2026-09-15 02:00 PM" }
    ],
    status: "confirmed",
    specialRequests: "Terrace room preparation with flower decor",
    createdAt: "2026-09-15 01:55 PM"
  },
  {
    id: "bk-004",
    bookingCode: "BDC-5519",
    roomId: "rm-101",
    guest: {
      id: "gst-004",
      fullName: "Rajesh & Kavita Singhal",
      phone: "+91 98290 55123",
      email: "rajesh.singhal@rediffmail.com",
      address: "18 Civil Lines",
      city: "Jaipur",
      state: "Rajasthan",
      country: "India",
      nationality: "Indian",
      purposeOfVisit: "Family Vacation",
      idDocument: {
        idType: "aadhaar",
        idNumber: "9102 3341 8729",
        isVerified: true,
        uploadedAt: "2026-09-16 06:15 PM"
      },
      previousStaysCount: 0,
      totalSpent: 0
    },
    checkInDate: "2026-09-23",
    checkOutDate: "2026-09-26",
    nights: 3,
    adults: 3,
    children: 1,
    channel: "booking_com",
    channelRefId: "BDC-RES-881902",
    roomRatePerNight: 4500,
    taxRatePercent: 12,
    extraCharges: [],
    payments: [
      { id: "pay-4", amount: 5000, mode: "card", reference: "PAYU-99214", date: "2026-09-16 06:30 PM" }
    ],
    status: "confirmed",
    createdAt: "2026-09-16 06:00 PM"
  },
  {
    id: "bk-005",
    bookingCode: "AGD-3042",
    roomId: "rm-201",
    guest: {
      id: "gst-005",
      fullName: "David Miller",
      phone: "+1 415 892 0192",
      email: "dmiller.architect@gmail.com",
      address: "742 Evergreen Terrace",
      city: "San Francisco",
      state: "California",
      country: "USA",
      nationality: "American",
      purposeOfVisit: "Architectural Tour & Photography",
      idDocument: {
        idType: "passport",
        idNumber: "USA-489102941",
        expiryDate: "2029-11-20",
        isVerified: true,
        uploadedAt: "2026-09-14 09:12 AM"
      },
      vipTag: true,
      previousStaysCount: 3,
      totalSpent: 42000
    },
    checkInDate: "2026-09-20",
    checkOutDate: "2026-09-24",
    nights: 4,
    adults: 2,
    children: 0,
    channel: "agoda",
    channelRefId: "AGODA-INT-7721",
    roomRatePerNight: 5200,
    taxRatePercent: 12,
    extraCharges: [
      { id: "ext-5", description: "Airport Pickup Sedan", amount: 1200, date: "2026-09-20" }
    ],
    payments: [
      { id: "pay-5", amount: 23296, mode: "ota_virtual_card", reference: "AGODA-VCC-3042", date: "2026-09-14 09:00 AM" }
    ],
    status: "confirmed",
    createdAt: "2026-09-14 08:45 AM"
  },
  {
    id: "bk-006",
    bookingCode: "AIR-9912",
    roomId: "rm-301",
    guest: {
      id: "gst-006",
      fullName: "Priyanka Chopra & Family",
      phone: "+91 99201 88344",
      email: "priyanka.stays@gmail.com",
      address: "Bandra West, Hill Road",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      nationality: "Indian",
      purposeOfVisit: "Destination Holiday",
      idDocument: {
        idType: "aadhaar",
        idNumber: "3892 0019 4410",
        isVerified: true,
        uploadedAt: "2026-09-12 11:00 AM"
      },
      vipTag: true,
      previousStaysCount: 5,
      totalSpent: 85000
    },
    checkInDate: "2026-09-18",
    checkOutDate: "2026-09-21",
    nights: 3,
    adults: 2,
    children: 1,
    channel: "airbnb",
    channelRefId: "HM589X29A",
    roomRatePerNight: 6800,
    taxRatePercent: 18,
    extraCharges: [],
    payments: [
      { id: "pay-6", amount: 24072, mode: "ota_virtual_card", reference: "AIRBNB-PAYOUT-9912", date: "2026-09-12 11:05 AM" }
    ],
    status: "confirmed",
    createdAt: "2026-09-12 10:50 AM"
  },
  {
    id: "bk-007",
    bookingCode: "CTR-5821",
    roomId: "rm-205",
    guest: {
      id: "gst-007",
      fullName: "Amit Saxena cleartrip",
      phone: "+91 98112 34567",
      email: "amit.saxena@traveler.com",
      address: "Sector 62",
      city: "Noida",
      state: "Uttar Pradesh",
      country: "India",
      nationality: "Indian",
      purposeOfVisit: "Business & Conference via Cleartrip",
      idDocument: {
        idType: "aadhaar",
        idNumber: "Pending at Check-in",
        isVerified: false,
        uploadedAt: "Due at Check-in",
        notes: "Advance booking via Cleartrip. ID to be submitted upon arrival at check-in counter."
      },
      vipTag: false,
      previousStaysCount: 2,
      totalSpent: 14500
    },
    checkInDate: "2026-09-17",
    checkOutDate: "2026-09-20",
    nights: 3,
    adults: 2,
    children: 0,
    channel: "cleartrip",
    channelRefId: "CTR-RES-99381",
    roomRatePerNight: 3200,
    taxRatePercent: 12,
    extraCharges: [],
    payments: [
      { id: "pay-7", amount: 10752, mode: "ota_virtual_card", reference: "CTR-VCC-5821", date: "2026-09-16 03:25 PM" }
    ],
    status: "confirmed",
    createdAt: "2026-09-16 03:15 PM"
  },
  {
    id: "bk-008",
    bookingCode: "OYO-9420",
    roomId: "rm-206",
    guest: {
      id: "gst-008",
      fullName: "Deepak Sharma oyo",
      phone: "+91 97118 90123",
      email: "deepak.sharma@traveler.com",
      address: "Malviya Nagar",
      city: "Jaipur",
      state: "Rajasthan",
      country: "India",
      nationality: "Indian",
      purposeOfVisit: "Leisure via OYO",
      idDocument: {
        idType: "aadhaar",
        idNumber: "Pending at Check-in",
        isVerified: false,
        uploadedAt: "Due at Check-in",
        notes: "Customer checked in. ID proof pending submission at front desk."
      },
      vipTag: false,
      previousStaysCount: 3,
      totalSpent: 18200
    },
    checkInDate: "2026-09-17",
    checkOutDate: "2026-09-19",
    nights: 2,
    adults: 2,
    children: 0,
    channel: "oyo",
    channelRefId: "OYO-IN-44210",
    roomRatePerNight: 3100,
    taxRatePercent: 12,
    extraCharges: [],
    payments: [
      { id: "pay-8", amount: 6944, mode: "ota_virtual_card", reference: "OYO-VCC-9420", date: "2026-09-16 05:45 PM" }
    ],
    status: "checked_in",
    createdAt: "2026-09-16 05:30 PM"
  }
];

export const initialOTAChannels: OTAChannelConfig[] = [
  {
    id: "makemytrip",
    name: "MakeMyTrip (MMT)",
    logo: "Plane",
    color: "#e11d48", // red-rose
    tagColor: "bg-emerald-600 text-white",
    isConnected: true,
    status: "active",
    lastSyncedAt: "Just now",
    autoSync: true,
    rateMarkupPercent: 15,
    mappedRoomsCount: 10,
    totalRoomsCount: 10,
    activeReservationsCount: 18,
    apiEndpoint: "https://api.makemytrip.com/extranet/v2/channel-manager"
  },
  {
    id: "cleartrip",
    name: "Cleartrip",
    logo: "Plane",
    color: "#ff4f17", // signature cleartrip orange
    tagColor: "bg-orange-600 text-white",
    isConnected: true,
    status: "active",
    lastSyncedAt: "1 min ago",
    autoSync: true,
    rateMarkupPercent: 15,
    mappedRoomsCount: 9,
    totalRoomsCount: 10,
    activeReservationsCount: 8,
    apiEndpoint: "https://api.cleartrip.com/extranet/v2/hotel-sync"
  },
  {
    id: "oyo",
    name: "OYO Rooms",
    logo: "Building2",
    color: "#ee2e24", // signature oyo red
    tagColor: "bg-red-600 text-white",
    isConnected: true,
    status: "active",
    lastSyncedAt: "3 mins ago",
    autoSync: true,
    rateMarkupPercent: 12,
    mappedRoomsCount: 8,
    totalRoomsCount: 10,
    activeReservationsCount: 12,
    apiEndpoint: "https://partner.oyorooms.com/api/v3/inventory-sync"
  },
  {
    id: "easemytrip",
    name: "EaseMyTrip",
    logo: "Send",
    color: "#0284c7", // emt sky blue
    tagColor: "bg-sky-600 text-white",
    isConnected: true,
    status: "active",
    lastSyncedAt: "6 mins ago",
    autoSync: true,
    rateMarkupPercent: 14,
    mappedRoomsCount: 7,
    totalRoomsCount: 10,
    activeReservationsCount: 5,
    apiEndpoint: "https://hotelapi.easemytrip.com/channelmanager/v1"
  },
  {
    id: "booking_com",
    name: "Booking.com",
    logo: "Building2",
    color: "#003580", // booking blue
    tagColor: "bg-blue-600 text-white",
    isConnected: true,
    status: "active",
    lastSyncedAt: "2 mins ago",
    autoSync: true,
    rateMarkupPercent: 18,
    mappedRoomsCount: 10,
    totalRoomsCount: 10,
    activeReservationsCount: 14,
    apiEndpoint: "https://distribution-xml.booking.com/2.4/json"
  },
  {
    id: "agoda",
    name: "Agoda",
    logo: "Compass",
    color: "#0d9488", // teal
    tagColor: "bg-teal-600 text-white",
    isConnected: true,
    status: "active",
    lastSyncedAt: "5 mins ago",
    autoSync: true,
    rateMarkupPercent: 16,
    mappedRoomsCount: 8,
    totalRoomsCount: 10,
    activeReservationsCount: 9,
    apiEndpoint: "https://ycs-api.agoda.com/api/v1/sync"
  },
  {
    id: "airbnb",
    name: "Airbnb",
    logo: "Home",
    color: "#ff385c", // airbnb red
    tagColor: "bg-rose-500 text-white",
    isConnected: true,
    status: "active",
    lastSyncedAt: "12 mins ago",
    autoSync: true,
    rateMarkupPercent: 12,
    mappedRoomsCount: 6,
    totalRoomsCount: 10,
    activeReservationsCount: 7,
    apiEndpoint: "https://api.airbnb.com/v2/calendar_sync"
  },
  {
    id: "goibibo",
    name: "Goibibo",
    logo: "Send",
    color: "#f97316", // orange
    tagColor: "bg-amber-600 text-white",
    isConnected: true,
    status: "active",
    lastSyncedAt: "4 mins ago",
    autoSync: true,
    rateMarkupPercent: 14,
    mappedRoomsCount: 10,
    totalRoomsCount: 10,
    activeReservationsCount: 11,
    apiEndpoint: "https://api.goibibo.com/extranet/sync/v1"
  },
  {
    id: "yatra",
    name: "Yatra.com",
    logo: "Compass",
    color: "#dc2626", // yatra red
    tagColor: "bg-rose-700 text-white",
    isConnected: true,
    status: "active",
    lastSyncedAt: "15 mins ago",
    autoSync: true,
    rateMarkupPercent: 15,
    mappedRoomsCount: 8,
    totalRoomsCount: 10,
    activeReservationsCount: 4,
    apiEndpoint: "https://extranet.yatra.com/hotel-distribution/v2"
  },
  {
    id: "expedia",
    name: "Expedia Group",
    logo: "Globe",
    color: "#000033",
    tagColor: "bg-indigo-700 text-white",
    isConnected: false,
    status: "paused",
    lastSyncedAt: "Yesterday",
    autoSync: false,
    rateMarkupPercent: 20,
    mappedRoomsCount: 0,
    totalRoomsCount: 10,
    activeReservationsCount: 0,
    apiEndpoint: "https://api.expediapartnersolutions.com/v3"
  }
];

export const initialRoomMappings: RoomTypeMapping[] = [
  {
    id: "map-1",
    pmsRoomType: "Jambo Family Suite",
    otaChannel: "makemytrip",
    otaRoomCode: "MMT_RM_JAMBO_4P",
    otaRoomTitle: "MMT - Jambo Quad Deluxe Suite",
    isSynced: true,
    rateModifier: 15,
    stopSell: false
  },
  {
    id: "map-2",
    pmsRoomType: "Quad Bedded Room",
    otaChannel: "makemytrip",
    otaRoomCode: "MMT_RM_QUAD_STD",
    otaRoomTitle: "MMT - 4-Bedded Family Classic",
    isSynced: true,
    rateModifier: 15,
    stopSell: false
  },
  {
    id: "map-3",
    pmsRoomType: "Penthouse Heritage Room",
    otaChannel: "makemytrip",
    otaRoomCode: "MMT_RM_PHH_TERRACE",
    otaRoomTitle: "MMT - Penthouse Heritage Terrace",
    isSynced: true,
    rateModifier: 15,
    stopSell: false
  },
  {
    id: "map-4",
    pmsRoomType: "Couple Deluxe Room",
    otaChannel: "booking_com",
    otaRoomCode: "BDC_RM_COUPLE_DLX",
    otaRoomTitle: "Booking.com - Romantic Couple Room",
    isSynced: true,
    rateModifier: 18,
    stopSell: false
  },
  {
    id: "map-5",
    pmsRoomType: "Royal Lakeview Suite",
    otaChannel: "booking_com",
    otaRoomCode: "BDC_RM_ROYAL_SUITE",
    otaRoomTitle: "Booking.com - Royal Presidential Lake Suite",
    isSynced: true,
    rateModifier: 18,
    stopSell: false
  },
  {
    id: "map-6",
    pmsRoomType: "2-Room Interconnected Suite",
    otaChannel: "agoda",
    otaRoomCode: "AGD_2RM_CONNECT",
    otaRoomTitle: "Agoda - 2-Room Grand Family Unit",
    isSynced: true,
    rateModifier: 16,
    stopSell: false
  },
  {
    id: "map-7",
    pmsRoomType: "Executive Deluxe Room",
    otaChannel: "cleartrip",
    otaRoomCode: "CTR_RM_EXEC_DLX",
    otaRoomTitle: "Cleartrip - Executive Deluxe Comfort",
    isSynced: true,
    rateModifier: 15,
    stopSell: false
  },
  {
    id: "map-8",
    pmsRoomType: "Superior Twin Room",
    otaChannel: "oyo",
    otaRoomCode: "OYO_RM_SUP_TWIN",
    otaRoomTitle: "OYO - Superior Twin Townhouse Room",
    isSynced: true,
    rateModifier: 12,
    stopSell: false
  },
  {
    id: "map-9",
    pmsRoomType: "Couple Standard Room",
    otaChannel: "easemytrip",
    otaRoomCode: "EMT_RM_COUPLE_STD",
    otaRoomTitle: "EaseMyTrip - Cozy Couple Economy Room",
    isSynced: true,
    rateModifier: 14,
    stopSell: false
  }
];

export const initialSyncLogs: ChannelSyncLog[] = [
  {
    id: "log-0a",
    timestamp: "12:38 PM",
    channel: "cleartrip",
    channelName: "Cleartrip",
    eventType: "reservation_new",
    status: "success",
    message: "Inbound booking #CTR-5821 ingested for Room 205 (Amit Saxena cleartrip)",
    payloadSummary: "3 Nights • Sep 19 - Sep 22 • ₹10,752 VCC Prepaid"
  },
  {
    id: "log-0b",
    timestamp: "12:30 PM",
    channel: "oyo",
    channelName: "OYO Rooms",
    eventType: "reservation_new",
    status: "success",
    message: "Inbound booking #OYO-9420 ingested for Room 206 (Deepak Sharma oyo)",
    payloadSummary: "2 Nights • Sep 18 - Sep 20 • ₹6,944 VCC Prepaid"
  },
  {
    id: "log-1",
    timestamp: "12:25 PM",
    channel: "makemytrip",
    channelName: "MakeMyTrip",
    eventType: "reservation_new",
    status: "success",
    message: "Inbound booking #MMT-6641 ingested for Room 204 (Tanu shukla)",
    payloadSummary: "1 Night • Sep 17 - Sep 18 • ₹2,912 VCC Prepaid"
  },
  {
    id: "log-2",
    timestamp: "12:15 PM",
    channel: "booking_com",
    channelName: "Booking.com",
    eventType: "inventory_push",
    status: "success",
    message: "Pushed updated room availability for 17 Sep - 17 Oct (9 Rooms free)",
    payloadSummary: "10 Room categories updated • 0 failed"
  },
  {
    id: "log-3",
    timestamp: "11:58 AM",
    channel: "agoda",
    channelName: "Agoda",
    eventType: "rate_update",
    status: "success",
    message: "Dynamic rate update pushed with +16% OTA markup",
    payloadSummary: "Rates synced across 8 mapped categories"
  },
  {
    id: "log-4",
    timestamp: "11:30 AM",
    channel: "airbnb",
    channelName: "Airbnb",
    eventType: "inventory_push",
    status: "success",
    message: "Blocked dates Sep 18 - 21 for Suite 301 after direct lock",
    payloadSummary: "iCal & REST API inventory sync acknowledged"
  },
  {
    id: "log-5",
    timestamp: "10:45 AM",
    channel: "makemytrip",
    channelName: "MakeMyTrip",
    eventType: "reservation_new",
    status: "success",
    message: "Inbound reservation #MMT-8824 for Room 202 (Kishore mmt)",
    payloadSummary: "2 Nights • Sep 21 - Sep 23 • ₹9,408 VCC Prepaid"
  }
];
