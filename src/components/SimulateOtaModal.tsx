import React, { useState } from 'react';
import { 
  Booking, 
  BookingChannel, 
  Room 
} from '../types';
import { sampleAadhaarFront, samplePassportFront } from '../data/initialData';
import { getTodayDateStr, addDaysToStr } from '../utils/dateHelper';
import { 
  X, 
  Zap, 
  Globe2, 
  Plane, 
  Building2, 
  Compass, 
  Home, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

interface SimulateOtaModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  onIngestOtaBooking: (newBooking: Booking, channelName: string) => void;
}

export const SimulateOtaModal: React.FC<SimulateOtaModalProps> = ({
  isOpen,
  onClose,
  rooms,
  onIngestOtaBooking
}) => {
  if (!isOpen) return null;

  const [channel, setChannel] = useState<BookingChannel>('makemytrip');
  const [guestName, setGuestName] = useState<string>('Rohan Mehra');
  const [phone, setPhone] = useState<string>('+91 99887 11223');
  const [roomId, setRoomId] = useState<string>(rooms[1]?.id || rooms[0]?.id || '');
  const [checkInDate, setCheckInDate] = useState<string>(() => getTodayDateStr());
  const [checkOutDate, setCheckOutDate] = useState<string>(() => addDaysToStr(getTodayDateStr(), 2));
  const [ratePerNight, setRatePerNight] = useState<number>(3800);
  const [idType, setIdType] = useState<'aadhaar' | 'passport'>('aadhaar');

  const selectedRoom = rooms.find(r => r.id === roomId);

  const getChannelDetails = (ch: BookingChannel) => {
    switch (ch) {
      case 'makemytrip':
        return { name: 'MakeMyTrip (MMT)', prefix: 'MMT', tag: 'mmt' };
      case 'cleartrip':
        return { name: 'Cleartrip', prefix: 'CTR', tag: 'cleartrip' };
      case 'oyo':
        return { name: 'OYO Rooms', prefix: 'OYO', tag: 'oyo' };
      case 'easemytrip':
        return { name: 'EaseMyTrip', prefix: 'EMT', tag: 'easemytrip' };
      case 'booking_com':
        return { name: 'Booking.com', prefix: 'BDC', tag: 'booking' };
      case 'agoda':
        return { name: 'Agoda', prefix: 'AGD', tag: 'agoda' };
      case 'airbnb':
        return { name: 'Airbnb', prefix: 'AIR', tag: 'airbnb' };
      case 'goibibo':
        return { name: 'Goibibo', prefix: 'GO', tag: 'goibibo' };
      case 'yatra':
        return { name: 'Yatra.com', prefix: 'YTR', tag: 'yatra' };
      case 'expedia':
        return { name: 'Expedia Group', prefix: 'EXP', tag: 'expedia' };
      default:
        return { name: 'OTA Channel', prefix: 'OTA', tag: 'ota' };
    }
  };

  const currentCh = getChannelDetails(channel);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `${currentCh.prefix}-${randomNum}`;
    const nights = Math.max(1, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)));
    const totalTariff = nights * ratePerNight;
    const taxes = Math.round(totalTariff * 0.05);
    const grandTotal = totalTariff + taxes;

    const newBooking: Booking = {
      id: `bk-ota-${Date.now()}`,
      bookingCode,
      roomId,
      guest: {
        id: `gst-ota-${Date.now()}`,
        fullName: `${guestName} ${currentCh.tag}`, // Formatted like the screenshot "Kishore mmt"!
        phone,
        email: `${guestName.toLowerCase().replace(/\s+/g, '.')}@traveler.com`,
        country: 'India',
        nationality: 'Indian',
        purposeOfVisit: 'Holiday & Tourism via ' + currentCh.name,
        idDocument: {
          idType,
          idNumber: idType === 'aadhaar' ? '7491 8203 1194' : 'P8920194',
          frontImageUrl: idType === 'aadhaar' ? sampleAadhaarFront : samplePassportFront,
          isVerified: true,
          uploadedAt: new Date().toLocaleString(),
          notes: `OTA Channel Pre-Registration via ${currentCh.name} API`
        },
        previousStaysCount: 1,
        totalSpent: grandTotal
      },
      checkInDate,
      checkOutDate,
      nights,
      adults: 2,
      children: 0,
      channel,
      channelRefId: `${currentCh.prefix}-VCC-${Date.now().toString().slice(-6)}`,
      roomRatePerNight: ratePerNight,
      taxRatePercent: 5,
      extraCharges: [],
      payments: [
        {
          id: `pay-ota-${Date.now()}`,
          amount: grandTotal,
          mode: 'ota_virtual_card',
          reference: `${currentCh.prefix}-VCC-AUTO`,
          date: new Date().toLocaleString()
        }
      ],
      status: 'confirmed',
      specialRequests: `OTA Inbound Push: Confirmed via ${currentCh.name} 2-way sync`,
      createdAt: new Date().toLocaleString()
    };

    onIngestOtaBooking(newBooking, currentCh.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-amber-400 fill-amber-400" />
            <div>
              <h3 className="font-bold text-base">Simulate Inbound OTA Reservation</h3>
              <p className="text-xs text-slate-400">Test real-time channel manager webhook and calendar plot</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Channel Selector */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Incoming OTA Portal *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'makemytrip', name: 'MakeMyTrip (MMT)', border: 'border-emerald-500 bg-emerald-50' },
                { id: 'cleartrip', name: 'Cleartrip', border: 'border-orange-500 bg-orange-50' },
                { id: 'oyo', name: 'OYO Rooms', border: 'border-red-500 bg-red-50' },
                { id: 'easemytrip', name: 'EaseMyTrip', border: 'border-sky-500 bg-sky-50' },
                { id: 'booking_com', name: 'Booking.com', border: 'border-blue-500 bg-blue-50' },
                { id: 'agoda', name: 'Agoda', border: 'border-teal-500 bg-teal-50' },
                { id: 'airbnb', name: 'Airbnb', border: 'border-rose-500 bg-rose-50' },
                { id: 'goibibo', name: 'Goibibo', border: 'border-amber-500 bg-amber-50' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChannel(c.id as BookingChannel)}
                  className={`p-2.5 rounded-lg border font-bold text-left transition-all ${
                    channel === c.id 
                      ? `${c.border} ring-2 ring-teal-600 text-slate-900 shadow-2xs` 
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Guest Name & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Guest Name</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                required
              />
            </div>
          </div>

          {/* Room Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Room</label>
            <select
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value);
                const rm = rooms.find(r => r.id === e.target.value);
                if (rm) setRatePerNight(rm.baseRate);
              }}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
            >
              {rooms.map(rm => (
                <option key={rm.id} value={rm.id}>
                  {rm.name} ({rm.type})
                </option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Check-in Date</label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Check-out Date</label>
              <input
                type="date"
                value={checkOutDate}
                min={checkInDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2"
                required
              />
            </div>
          </div>

          {/* ID Type simulation */}
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
            <span className="font-bold text-teal-900 block">Attached Guest KYC ID Document:</span>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-teal-800">
                <input
                  type="radio"
                  name="simIdType"
                  checked={idType === 'aadhaar'}
                  onChange={() => setIdType('aadhaar')}
                />
                <span>Aadhaar Card (Simulated UIDAI Proof)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-teal-800">
                <input
                  type="radio"
                  name="simIdType"
                  checked={idType === 'passport'}
                  onChange={() => setIdType('passport')}
                />
                <span>Passport</span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              Inject Booking to Desk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
