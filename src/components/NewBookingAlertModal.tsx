import React from 'react';
import { Booking } from '../types';
import { 
  BellRing, 
  Calendar, 
  User, 
  Phone, 
  CreditCard, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  BedDouble, 
  Building2 
} from 'lucide-react';

interface NewBookingAlertModalProps {
  booking: Booking | null;
  hotelName: string;
  onClose: () => void;
  onViewBooking: (booking: Booking) => void;
  onNavigateToDesk: () => void;
}

export const NewBookingAlertModal: React.FC<NewBookingAlertModalProps> = ({
  booking,
  hotelName,
  onClose,
  onViewBooking,
  onNavigateToDesk
}) => {
  if (!booking) return null;

  const guest = booking.guest;
  const isDirectWeb = booking.source === 'Direct (Website)' || booking.source === 'Direct' || booking.channel === 'walkin';

  return (
    <div className="fixed inset-0 z-70 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="new-booking-alert-container"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border-2 border-emerald-500 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Header with vibrant green pulse badge */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-4 sm:p-5 relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/30 border border-emerald-400 flex items-center justify-center text-emerald-300 animate-bounce">
              <BellRing size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-emerald-400 text-emerald-950 rounded-full">
                  Live Online Booking
                </span>
                <span className="text-xs text-emerald-200">Just Now</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                New Reservation Received!
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <X size={18} />
          </button>
        </div>

        {/* Booking Details Card */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Hotel & Booking Code Tag */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-teal-700" />
              <span className="font-bold text-slate-800">{hotelName}</span>
            </div>
            <div className="font-mono font-bold text-teal-800 bg-teal-100 px-2 py-1 rounded">
              #{booking.bookingCode}
            </div>
          </div>

          {/* Guest and Stay Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                <User size={12} /> Guest Name
              </div>
              <div className="font-bold text-slate-900 text-sm">{guest?.fullName || 'Guest'}</div>
              {guest?.phone && (
                <div className="text-slate-600 flex items-center gap-1 pt-0.5">
                  <Phone size={11} className="text-teal-700" />
                  <a href={`tel:${guest.phone}`} className="hover:underline font-mono">{guest.phone}</a>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                <BedDouble size={12} /> Room &amp; Occupancy
              </div>
              <div className="font-bold text-slate-900 text-sm">
                Room {booking.roomNumber || 'Assigned'} • {booking.roomName || 'Standard Room'}
              </div>
              <div className="text-slate-600">
                {booking.adults} Adults {booking.children ? `, ${booking.children} Kids` : ''} • {booking.groupTotalRooms || 1} Room
              </div>
            </div>
          </div>

          {/* Dates & Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-400 font-semibold uppercase text-[10px] flex items-center gap-1">
                <Calendar size={12} /> Stay Dates
              </div>
              <div className="font-bold text-slate-800">
                {booking.checkInDate} → {booking.checkOutDate}
              </div>
              <div className="text-slate-500">{booking.nights} Night(s)</div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
              <div className="text-emerald-700 font-semibold uppercase text-[10px] flex items-center gap-1">
                <CreditCard size={12} /> Billing &amp; Payment
              </div>
              <div className="font-extrabold text-emerald-950 text-base">
                ₹{booking.totalAmount?.toLocaleString('en-IN') || 0}
              </div>
              <div className="text-[11px] text-emerald-800">
                Paid: ₹{booking.paidAmount?.toLocaleString('en-IN') || 0} • Bal: ₹{booking.balanceAmount?.toLocaleString('en-IN') || 0}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              id="btn-view-booking-details"
              type="button"
              onClick={() => {
                onViewBooking(booking);
                onClose();
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all"
            >
              <span>Open Booking Card</span>
              <ArrowRight size={15} />
            </button>
            <button
              id="btn-go-to-desk-calendar"
              type="button"
              onClick={() => {
                onNavigateToDesk();
                onClose();
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold border border-slate-300 cursor-pointer transition-all"
            >
              <Calendar size={15} />
              <span>View on Desk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
