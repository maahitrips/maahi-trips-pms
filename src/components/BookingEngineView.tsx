import React, { useState } from 'react';
import { 
  HotelProfile, 
  Room, 
  Booking, 
  BookingChannel 
} from '../types';
import { getTodayDateStr, addDaysToStr } from '../utils/dateHelper';
import { 
  Building2, 
  MapPin, 
  Star, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Wifi, 
  Coffee, 
  Car, 
  Tv, 
  Sparkles, 
  ArrowRight, 
  Share2, 
  Copy, 
  Globe, 
  ShieldCheck, 
  CreditCard, 
  Phone, 
  Mail, 
  Check,
  BedDouble,
  Heart
} from 'lucide-react';

interface BookingEngineViewProps {
  hotelProfile: HotelProfile;
  rooms: Room[];
  bookings: Booking[];
  onSaveBooking: (booking: Booking) => void;
  showToast: (title: string, subtitle?: string) => void;
  hotels?: any[];
  activeHotelId?: string;
  onSelectHotel?: (hotelId: string) => void;
}

export const BookingEngineView: React.FC<BookingEngineViewProps> = ({
  hotelProfile,
  rooms = [],
  bookings = [],
  onSaveBooking,
  showToast,
  hotels = [],
  activeHotelId,
  onSelectHotel
}) => {
  const [checkInDate, setCheckInDate] = useState<string>(getTodayDateStr());
  const [checkOutDate, setCheckOutDate] = useState<string>(addDaysToStr(getTodayDateStr(), 2));
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | null>(null);

  // Guest Checkout form state
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestRemarks, setGuestRemarks] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'upi' | 'card' | 'pay_at_hotel'>('upi');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [confirmedBookingCode, setConfirmedBookingCode] = useState<string>('');

  const computeNights = () => {
    if (!checkInDate || !checkOutDate) return 2;
    const start = new Date(checkInDate).getTime();
    const end = new Date(checkOutDate).getTime();
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };
  const nights = computeNights();

  const handleBookRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomForBooking) return;
    if (!guestName.trim() || !guestPhone.trim()) {
      showToast('Missing Details', 'Please provide your Full Name and Mobile Number.');
      return;
    }

    const rate = selectedRoomForBooking.baseRate;
    const subtotal = nights * rate;
    const code = `BE-${Math.floor(100000 + Math.random() * 900000)}`;

    const newBooking: Booking = {
      id: `bk-be-${Date.now()}`,
      bookingCode: code,
      roomId: selectedRoomForBooking.id,
      roomNumber: selectedRoomForBooking.number,
      groupTotalRooms: 1,
      guest: {
        id: `gst-${Date.now()}`,
        fullName: guestName.trim(),
        phone: guestPhone.trim(),
        email: guestEmail.trim(),
        country: 'India',
        nationality: 'Indian',
        purposeOfVisit: 'Tourism & Leisure',
        idDocument: {
          idType: 'aadhaar',
          idNumber: 'Pending at Check-in',
          isVerified: false,
          uploadedAt: 'Direct Booking Engine'
        },
        previousStaysCount: 0,
        totalSpent: subtotal
      },
      checkInDate,
      checkOutDate,
      nights,
      adults,
      children,
      channel: 'walkin', // direct web booking
      roomRatePerNight: rate,
      taxRatePercent: 0,
      extraCharges: [],
      payments: paymentMode !== 'pay_at_hotel' ? [{
        id: `pay-${Date.now()}`,
        amount: Math.round(subtotal * 0.3), // 30% advance deposit
        mode: paymentMode === 'upi' ? 'upi' : 'card',
        date: new Date().toLocaleString(),
        reference: `BE-ONLINE-${code}`
      }] : [],
      status: 'confirmed',
      specialRequests: guestRemarks.trim() || 'Direct Website Booking Engine Reservation',
      createdAt: new Date().toLocaleString()
    };

    onSaveBooking(newBooking);
    setConfirmedBookingCode(code);
    setIsSuccessModalOpen(true);
    setSelectedRoomForBooking(null);
    showToast('Direct Booking Confirmed!', `Booking #${code} saved to PMS Calendar.`);
  };

  const copyWidgetLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Booking Link Copied!', 'Share this page with guests for direct bookings.');
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 min-h-screen">
      {/* Top Banner & Hotel Showcase Header */}
      <div className="bg-slate-900 text-white pb-12 pt-6 px-4 sm:px-8 relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-6xl mx-auto relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold text-xl shadow-inner">
                <Globe size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-500 text-slate-950 uppercase tracking-wider">
                    Direct Booking Engine Active
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Zero Commission 0% OTA Fees</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                  {hotelProfile.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyWidgetLink}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Share2 size={14} className="text-teal-400" />
                <span>Share Booking Link</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1">
              <MapPin size={14} className="text-teal-400" />
              <span>{hotelProfile.address || 'Prime City Center Location'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone size={14} className="text-teal-400" />
              <span>{hotelProfile.phone || '+91 98765 43210'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Mail size={14} className="text-teal-400" />
              <span>{hotelProfile.email || 'reservations@hotel.com'}</span>
            </div>
            <div className="flex items-center gap-1 bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded border border-amber-400/20 font-bold">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span>4.9 / 5 Guest Rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 -mt-6 relative z-20 space-y-8 pb-16">
        
        {/* Instant Search / Booking Bar Widget */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Calendar size={13} className="text-teal-700" /> Check-in Date
            </label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Calendar size={13} className="text-teal-700" /> Check-out Date
            </label>
            <input
              type="date"
              value={checkOutDate}
              min={addDaysToStr(checkInDate, 1)}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Users size={13} className="text-teal-700" /> Guests &amp; Rooms
            </label>
            <div className="px-3.5 py-2.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl flex items-center justify-between">
              <span>{adults} Adults, {children} Child</span>
              <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-extrabold">{nights}N Stay</span>
            </div>
          </div>

          <div>
            <a
              href="#rooms-section"
              className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <span>Check Live Rates</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>

        {/* Hotel Photo Gallery Grid */}
        <div className="space-y-3">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles size={18} className="text-teal-700" />
            <span>Property Gallery &amp; Highlights</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative h-64 rounded-2xl overflow-hidden shadow-md group">
              <img 
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800" 
                alt="Hotel Exterior" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent flex items-end p-4">
                <span className="text-white font-bold text-xs bg-black/40 px-3 py-1 rounded-lg backdrop-blur-xs">Luxury Exterior &amp; Lobby</span>
              </div>
            </div>

            <div className="relative h-64 rounded-2xl overflow-hidden shadow-md group">
              <img 
                src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800" 
                alt="Hotel Room" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent flex items-end p-4">
                <span className="text-white font-bold text-xs bg-black/40 px-3 py-1 rounded-lg backdrop-blur-xs">Deluxe Air-Conditioned Rooms</span>
              </div>
            </div>

            <div className="relative h-64 rounded-2xl overflow-hidden shadow-md group">
              <img 
                src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800" 
                alt="Amenities" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent flex items-end p-4">
                <span className="text-white font-bold text-xs bg-black/40 px-3 py-1 rounded-lg backdrop-blur-xs">Swimming Pool &amp; Dining</span>
              </div>
            </div>
          </div>
        </div>

        {/* Amenities Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Wifi size={18} className="text-teal-700" />
            <span>High Speed Free Wi-Fi</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Coffee size={18} className="text-teal-700" />
            <span>Complimentary Breakfast</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Car size={18} className="text-teal-700" />
            <span>Free Valet Parking</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <ShieldCheck size={18} className="text-teal-700" />
            <span>24/7 Front Desk &amp; Security</span>
          </div>
        </div>

        {/* Available Rooms Section */}
        <div id="rooms-section" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <BedDouble size={18} className="text-teal-700" />
                <span>Select Your Room &amp; Rate</span>
              </h2>
              <p className="text-xs text-slate-500">Live inventory synced with front desk PMS calendar</p>
            </div>
            <span className="text-xs font-bold bg-teal-100 text-teal-900 px-3 py-1 rounded-full">
              {rooms.length} Room Types Available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {rooms.map(room => {
              const rate = room.baseRate || 3500;
              const totalPrice = nights * rate;

              return (
                <div key={room.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-md flex flex-col justify-between hover:border-teal-500 transition-all">
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wider">
                          {room.type}
                        </span>
                        <h3 className="text-base font-black text-slate-900 mt-1">
                          Room {room.number} — {room.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-teal-800">₹{rate}</div>
                        <div className="text-[10px] text-slate-400">per night + taxes</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Users size={14} className="text-slate-400" />
                      <span>Max Occupancy: {room.maxOccupancy} Guests</span>
                      <span>• Floor {room.floor}</span>
                    </div>

                    {room.amenities && room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {room.amenities.map((am, i) => (
                          <span key={i} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            {am}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Total for {nights} Night(s):</span>
                      <div className="text-sm font-extrabold text-slate-900">₹{totalPrice}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRoomForBooking(room)}
                      className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Book Now</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Direct Booking Checkout Modal */}
      {selectedRoomForBooking && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150"
          onClick={() => setSelectedRoomForBooking(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Complete Direct Booking</h3>
                <p className="text-xs text-slate-500">Room {selectedRoomForBooking.number} ({selectedRoomForBooking.type}) • {nights} Nights</p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedRoomForBooking(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookRoomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number <span className="text-rose-500">*</span></label>
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={e => setGuestPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={e => setGuestEmail(e.target.value)}
                    placeholder="guest@gmail.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Special Requests / Notes</label>
                <input
                  type="text"
                  value={guestRemarks}
                  onChange={e => setGuestRemarks(e.target.value)}
                  placeholder="e.g. Late check-in at 8 PM"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Preference</label>
                <select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-hidden"
                >
                  <option value="upi">UPI / GPay / PhonePe (Instant Guarantee)</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="pay_at_hotel">Pay at Hotel Front Desk</option>
                </select>
              </div>

              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-teal-900 font-bold block">Total Amount Payable:</span>
                  <span className="text-[10px] text-teal-700">Check-in: {checkInDate} to {checkOutDate}</span>
                </div>
                <div className="text-base font-black text-teal-950">
                  ₹{nights * selectedRoomForBooking.baseRate}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRoomForBooking(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 size={16} />
                  <span>Confirm Direct Reservation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Confirmation Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check size={32} strokeWidth={3} />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Booking Confirmed Successfully!</h3>
              <p className="text-xs text-slate-500">Your direct reservation has been logged into the front desk PMS calendar.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-sm font-black text-teal-800">
              #{confirmedBookingCode}
            </div>

            <p className="text-[11px] text-slate-500">
              A confirmation voucher &amp; WhatsApp notification have been queued for the guest.
            </p>

            <button
              type="button"
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Back to Booking Engine Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
