import React, { useState, useMemo } from 'react';
import { 
  Room, 
  Booking, 
  BookingChannel 
} from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Plus, 
  ShieldCheck, 
  CreditCard, 
  Filter, 
  UserCheck, 
  Bed, 
  Sparkles,
  Info,
  CalendarCheck2,
  AlertTriangle
} from 'lucide-react';

interface DeskCalendarProps {
  rooms: Room[];
  bookings: Booking[];
  startDateStr: string; // e.g. "2026-09-17"
  daysToShow?: number;
  onSelectBooking: (booking: Booking) => void;
  onCellClick: (roomId: string, dateStr: string) => void;
  onRefresh: () => void;
  onOpenAddRoom?: () => void;
}

export const DeskCalendar: React.FC<DeskCalendarProps> = ({
  rooms,
  bookings,
  startDateStr,
  daysToShow = 18,
  onSelectBooking,
  onCellClick,
  onRefresh,
  onOpenAddRoom,
}) => {
  const [currentStartOffset, setCurrentStartOffset] = useState<number>(0);
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'clean' | 'dirty' | 'occupied'>('all');

  // Compute date series
  const dates = useMemo(() => {
    const list: { dateStr: string; dayName: string; dayNumber: number; monthName: string; isToday: boolean; isWeekend: boolean }[] = [];
    const base = new Date(startDateStr);
    base.setDate(base.getDate() + currentStartOffset);

    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const dayNumber = d.getDate();
      const isToday = iso === '2026-09-17';
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

      list.push({
        dateStr: iso,
        dayName,
        dayNumber,
        monthName,
        isToday,
        isWeekend
      });
    }
    return list;
  }, [startDateStr, currentStartOffset, daysToShow]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      if (selectedFloor !== 'all' && room.floor !== selectedFloor) return false;
      return true;
    });
  }, [rooms, selectedFloor]);

  // Channel badge colors matching the screenshot exact style:
  // "Kishore mmt" is bright green, "Nizamuddin saifi" is bright orange
  const getChannelStyle = (channel: BookingChannel) => {
    switch (channel) {
      case 'makemytrip':
        return {
          bg: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700',
          dot: 'bg-emerald-200',
          label: 'mmt'
        };
      case 'cleartrip':
        return {
          bg: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600',
          dot: 'bg-orange-200',
          label: 'cleartrip'
        };
      case 'oyo':
        return {
          bg: 'bg-red-600 hover:bg-red-700 text-white border-red-700',
          dot: 'bg-red-200',
          label: 'oyo'
        };
      case 'easemytrip':
        return {
          bg: 'bg-sky-600 hover:bg-sky-700 text-white border-sky-700',
          dot: 'bg-sky-200',
          label: 'easemytrip'
        };
      case 'yatra':
        return {
          bg: 'bg-rose-700 hover:bg-rose-800 text-white border-rose-800',
          dot: 'bg-rose-200',
          label: 'yatra'
        };
      case 'walkin':
      case 'phone':
        return {
          bg: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600',
          dot: 'bg-amber-200',
          label: 'direct'
        };
      case 'booking_com':
        return {
          bg: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700',
          dot: 'bg-blue-200',
          label: 'booking'
        };
      case 'agoda':
        return {
          bg: 'bg-teal-600 hover:bg-teal-700 text-white border-teal-700',
          dot: 'bg-teal-200',
          label: 'agoda'
        };
      case 'airbnb':
        return {
          bg: 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600',
          dot: 'bg-rose-200',
          label: 'airbnb'
        };
      case 'goibibo':
        return {
          bg: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700',
          dot: 'bg-amber-200',
          label: 'goibibo'
        };
      case 'expedia':
        return {
          bg: 'bg-indigo-700 hover:bg-indigo-800 text-white border-indigo-800',
          dot: 'bg-indigo-200',
          label: 'expedia'
        };
      default:
        return {
          bg: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700',
          dot: 'bg-indigo-200',
          label: 'ota'
        };
    }
  };

  // Helper to calculate date index in current view
  const getDateIndex = (dateStr: string) => {
    return dates.findIndex(d => d.dateStr === dateStr);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Top Banner: Title & Controls */}
      <div className="p-4 md:p-6 pb-2 md:pb-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Desk
              <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
                Live Tape Chart
              </span>
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Front desk booking calendar &amp; room status grid
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAddRoom && (
              <button
                id="btn-desk-add-room"
                onClick={onOpenAddRoom}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Add Room</span>
              </button>
            )}

            {/* Refresh Grid Button (as seen on top right of screenshot) */}
            <button
              id="refresh-calendar-btn"
              onClick={onRefresh}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Refresh desk bookings"
            >
              <RotateCw size={17} />
            </button>
          </div>
        </div>

        {/* Date Selector Row matching screenshot `17 Sep 2026 — 17 Oct 2026 [X] | 31 days` */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs md:text-sm font-medium text-slate-800 shadow-2xs">
              <CalendarIcon size={16} className="text-slate-500" />
              <span>17 Sep 2026 — 17 Oct 2026</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500 font-normal">31 days</span>
            </div>

            {/* Quick Navigation Buttons */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={() => setCurrentStartOffset(prev => prev - 7)}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                title="Previous 7 days"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentStartOffset(0)}
                className="px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-50 rounded transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentStartOffset(prev => prev + 7)}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                title="Next 7 days"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Floor & Room Filter Chips */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Floor:</span>
            <button
              onClick={() => setSelectedFloor('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedFloor === 'all' 
                  ? 'bg-teal-800 text-white' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFloor(1)}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                selectedFloor === 1 
                  ? 'bg-teal-800 text-white' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              F1
            </button>
            <button
              onClick={() => setSelectedFloor(2)}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                selectedFloor === 2 
                  ? 'bg-teal-800 text-white' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              F2
            </button>
            <button
              onClick={() => setSelectedFloor(3)}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                selectedFloor === 3 
                  ? 'bg-teal-800 text-white' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              F3
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Matrix Scrollable Area */}
      <div className="flex-1 overflow-auto bg-white select-none relative">
        <div className="inline-block min-w-full align-top">
          {/* Header Row: Room & Dates */}
          <div className="flex border-b border-slate-200 sticky top-0 bg-slate-50 z-20 shadow-xs">
            {/* Top-Left Corner: Room Column Header */}
            <div className="w-44 md:w-52 shrink-0 p-3 font-bold text-xs md:text-sm text-slate-700 uppercase tracking-wider bg-slate-100 border-r border-slate-200 sticky left-0 z-30 flex items-center justify-between">
              <span>Room</span>
              <span className="text-[10px] font-normal lowercase text-slate-500">
                {filteredRooms.length} rooms
              </span>
            </div>

            {/* Date Columns */}
            <div className="flex flex-1">
              {dates.map((d) => (
                <div
                  key={d.dateStr}
                  className={`w-24 md:w-28 shrink-0 text-center py-2 px-1 border-r border-slate-200 transition-colors ${
                    d.isToday 
                      ? 'bg-teal-50/90 font-bold text-teal-900 ring-1 ring-inset ring-teal-400' 
                      : d.isWeekend 
                        ? 'bg-slate-100/60 text-slate-600' 
                        : 'text-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-semibold uppercase">
                    {d.monthName} {d.dayNumber}
                  </div>
                  <div className={`text-[10px] ${d.isToday ? 'text-teal-700 font-bold' : 'text-slate-400 font-medium'}`}>
                    {d.dayName} {d.isToday && '• Today'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Room Rows & Booking Tape Grid */}
          <div className="divide-y divide-slate-200">
            {filteredRooms.map((room) => {
              // Find all bookings that intersect this room
              const roomBookings = bookings.filter(b => b.roomId === room.id && b.status !== 'cancelled');

              return (
                <div key={room.id} className="flex relative hover:bg-slate-50/40 transition-colors group">
                  {/* Sticky Room Info Cell */}
                  <div 
                    className="w-44 md:w-52 shrink-0 p-2.5 md:p-3 bg-white border-r border-slate-200 sticky left-0 z-10 flex flex-col justify-center shadow-xs group-hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs md:text-sm text-slate-900 truncate">
                        {room.name}
                      </span>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        room.status === 'clean' ? 'bg-emerald-500' :
                        room.status === 'dirty' ? 'bg-amber-500' :
                        room.status === 'cleaning' ? 'bg-blue-500' : 'bg-rose-500'
                      }`} title={`Status: ${room.status}`} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                      <span className="truncate max-w-[90px]">{room.type}</span>
                      <span className="font-semibold text-slate-700">₹{room.baseRate}</span>
                    </div>
                  </div>

                  {/* Date Grid Cells */}
                  <div className="flex flex-1 relative h-16 md:h-18">
                    {/* Background interactive grid cells */}
                    {dates.map((d) => (
                      <div
                        key={d.dateStr}
                        onClick={() => onCellClick(room.id, d.dateStr)}
                        className={`w-24 md:w-28 shrink-0 border-r border-slate-100 hover:bg-teal-50/40 cursor-pointer transition-colors relative flex items-center justify-center ${
                          d.isToday ? 'bg-teal-50/20' : d.isWeekend ? 'bg-slate-50/40' : ''
                        }`}
                        title={`Click to book ${room.name} on ${d.dateStr}`}
                      >
                        <span className="opacity-0 hover:opacity-100 text-teal-700 text-xs font-semibold bg-white px-2 py-0.5 rounded shadow-xs border border-teal-200 transition-opacity">
                          + Book
                        </span>
                      </div>
                    ))}

                    {/* Booking Bars Overlay */}
                    {roomBookings.map((booking) => {
                      const checkInIndex = getDateIndex(booking.checkInDate);
                      const checkOutIndex = getDateIndex(booking.checkOutDate);

                      // Check if booking is visible in current date window
                      const viewStartStr = dates[0]?.dateStr;
                      const viewEndStr = dates[dates.length - 1]?.dateStr;

                      if (!viewStartStr || !viewEndStr) return null;
                      if (booking.checkOutDate <= viewStartStr || booking.checkInDate > viewEndStr) {
                        return null;
                      }

                      // Calculate span
                      const colWidth = 96; // 6rem / 24 tailwind units on mobile, 112 on md
                      const effectiveStart = Math.max(0, checkInIndex);
                      const effectiveEnd = checkOutIndex === -1 ? dates.length : checkOutIndex;
                      const spanDays = Math.max(1, effectiveEnd - effectiveStart);

                      const styleInfo = getChannelStyle(booking.channel);
                      const isIdVerified = Boolean(
                        booking.guest.idDocument?.isVerified && 
                        booking.guest.idDocument?.idNumber && 
                        booking.guest.idDocument.idNumber !== 'Pending at Check-in'
                      );
                      const isCheckedIn = booking.status === 'checked_in';

                      // Position calculation
                      const leftPos = `${effectiveStart * 6}rem`; // matches w-24 (6rem)
                      const barWidth = `calc(${spanDays * 6}rem - 6px)`;

                      return (
                        <div
                          key={booking.id}
                          id={`booking-bar-${booking.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBooking(booking);
                          }}
                          style={{
                            left: leftPos,
                            width: barWidth,
                            top: '8px',
                            bottom: '8px',
                          }}
                          className={`absolute z-10 rounded-lg ${styleInfo.bg} shadow-md border px-2.5 py-1.5 flex flex-col justify-between cursor-pointer transition-all duration-150 hover:brightness-105 hover:scale-[1.01] overflow-hidden select-none`}
                        >
                          <div className="flex items-center justify-between gap-1 overflow-hidden">
                            <span className="font-bold text-xs md:text-sm tracking-tight truncate text-white drop-shadow-xs">
                              {booking.guest.fullName}
                            </span>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Customer ID verification status badges */}
                              {isIdVerified ? (
                                <span 
                                  className="p-0.5 bg-black/25 text-emerald-300 rounded" 
                                  title={`ID Verified: ${booking.guest.idDocument.idType.toUpperCase()} (${booking.guest.idDocument.idNumber})`}
                                >
                                  <ShieldCheck size={13} className="text-emerald-300" />
                                </span>
                              ) : isCheckedIn ? (
                                <span 
                                  className="px-1 py-0.2 bg-amber-400 text-amber-950 font-black text-[9px] uppercase rounded flex items-center gap-0.5 shadow-xs" 
                                  title="Guest Checked-In: ID Proof Pending Submission!"
                                >
                                  <AlertTriangle size={10} /> ID Due
                                </span>
                              ) : (
                                <span 
                                  className="text-[9px] bg-black/20 text-white/80 px-1 py-0.2 rounded font-medium" 
                                  title="Customer ID to be submitted upon check-in"
                                >
                                  ID at Check-in
                                </span>
                              )}

                              {/* Channel Identifier pill */}
                              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-black/25 text-white rounded">
                                {styleInfo.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-white/90">
                            <span className="truncate">
                              {booking.nights}N • {booking.adults}A
                            </span>
                            <span className="font-mono text-[9px] bg-white/20 px-1 rounded">
                              {booking.status === 'checked_in' ? 'IN-HOUSE' : booking.bookingCode}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Color & Status Legend */}
      <div className="p-2.5 md:p-3 bg-white border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Channel Legend:</span>
          
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-600"></span>
            <span className="text-xs font-medium">MakeMyTrip (MMT)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
            <span className="text-xs font-medium">Direct / Walk-in</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-600"></span>
            <span className="text-xs font-medium">Booking.com</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-teal-600"></span>
            <span className="text-xs font-medium">Agoda</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500"></span>
            <span className="text-xs font-medium">Airbnb</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-600" /> ID Proof Attached
          </span>
          <span className="text-slate-300">•</span>
          <span>Click any empty cell to create a new reservation</span>
        </div>
      </div>
    </div>
  );
};
