import React, { useState, useMemo } from 'react';
import { 
  Room, 
  Booking, 
  BookingChannel,
  UserAccount
} from '../types';
import { isSuperAdminUser } from '../utils/permissionHelper';
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
  AlertTriangle,
  Edit3,
  Trash2,
  LayoutList,
  Grid3X3,
  Phone,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Search,
  X
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
  onEditRoom?: (room: Room) => void;
  onRequestDeleteRoom?: (room: Room) => void;
  currentUser?: UserAccount | null;
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
  onEditRoom,
  onRequestDeleteRoom,
  currentUser,
}) => {
  const isSuperAdmin = isSuperAdminUser(currentUser);
  const [currentStartOffset, setCurrentStartOffset] = useState<number>(0);
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'clean' | 'dirty' | 'occupied'>('all');
  const [viewMode, setViewMode] = useState<'tape' | 'agenda'>('tape');
  const [agendaTab, setAgendaTab] = useState<'all' | 'arrivals' | 'in_house' | 'departures'>('all');
  const [agendaSearch, setAgendaSearch] = useState<string>('');

  const todayStr = '2026-09-17';

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
      const isToday = iso === todayStr;
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
  }, [startDateStr, currentStartOffset, daysToShow, todayStr]);

  // Today's Operations computed lists for mobile / quick agenda
  const todayArrivals = useMemo(() => {
    return bookings.filter(b => b.checkInDate === todayStr && b.status !== 'cancelled');
  }, [bookings, todayStr]);

  const inHouseBookings = useMemo(() => {
    return bookings.filter(b => b.status === 'checked_in');
  }, [bookings]);

  const todayDepartures = useMemo(() => {
    return bookings.filter(b => b.checkOutDate === todayStr && b.status !== 'cancelled');
  }, [bookings, todayStr]);

  const occupiedRoomIds = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach(b => {
      if (b.status !== 'cancelled' && b.checkInDate <= todayStr && b.checkOutDate > todayStr) {
        set.add(b.roomId);
      }
    });
    return set;
  }, [bookings, todayStr]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      if (selectedFloor !== 'all' && room.floor !== selectedFloor) return false;
      if (statusFilter !== 'all') {
        if (statusFilter === 'occupied' && !occupiedRoomIds.has(room.id)) return false;
        if (statusFilter !== 'occupied' && room.status !== statusFilter) return false;
      }
      return true;
    });
  }, [rooms, selectedFloor, statusFilter, occupiedRoomIds]);

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
      <div className="p-3 sm:p-4 md:p-6 pb-2 md:pb-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Desk
              <span className="text-[10px] sm:text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
                Live Tape Chart
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-0.5">
              Front desk booking calendar &amp; room status grid
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto">
            {/* View Mode Switcher: Tape Chart vs Today's Quick Operations */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('tape')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'tape'
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Full Tape Chart Grid"
              >
                <Grid3X3 size={14} />
                <span>Tape Chart</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer relative ${
                  viewMode === 'agenda'
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Today's Arrivals, In-House, & Departures (Mobile Friendly)"
              >
                <LayoutList size={14} />
                <span>Today's View</span>
                {(todayArrivals.length > 0 || todayDepartures.length > 0) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                )}
              </button>
            </div>

            {onOpenAddRoom && (
              <button
                id="btn-desk-add-room"
                onClick={onOpenAddRoom}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span className="hidden sm:inline">Add Room</span>
              </button>
            )}

            {/* Refresh Grid Button */}
            <button
              id="refresh-calendar-btn"
              onClick={onRefresh}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Refresh desk bookings"
            >
              <RotateCw size={16} />
            </button>
          </div>
        </div>

        {/* Date Selector Row matching screenshot `17 Sep 2026 — 17 Oct 2026 [X] | 31 days` */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs md:text-sm font-medium text-slate-800 shadow-2xs">
              <CalendarIcon size={14} className="text-slate-500 shrink-0" />
              <span className="text-xs">17 Sep 2026 — 17 Oct 2026</span>
              <span className="text-slate-300">|</span>
              <span className="text-[11px] text-slate-500 font-normal">31 days</span>
            </div>

            {/* Quick Navigation Buttons */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={() => setCurrentStartOffset(prev => prev - 7)}
                className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors cursor-pointer"
                title="Previous 7 days"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setCurrentStartOffset(0)}
                className="px-2 py-0.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 rounded transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentStartOffset(prev => prev + 7)}
                className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors cursor-pointer"
                title="Next 7 days"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Floor & Room Filter Chips */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Floor:</span>
            <button
              onClick={() => setSelectedFloor('all')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                selectedFloor === 'all' 
                  ? 'bg-teal-800 text-white' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFloor(1)}
              className={`px-1.5 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                selectedFloor === 1 
                  ? 'bg-teal-800 text-white' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              F1
            </button>
            <button
              onClick={() => setSelectedFloor(2)}
              className={`px-1.5 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                selectedFloor === 2 
                  ? 'bg-teal-800 text-white' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              F2
            </button>
            <button
              onClick={() => setSelectedFloor(3)}
              className={`px-1.5 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
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

      {/* VIEW MODE 1: TODAY'S OPERATIONS AGENDA (Mobile-Optimized) */}
      {viewMode === 'agenda' ? (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 bg-slate-50">
          {/* Quick Operations Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            <div 
              onClick={() => setAgendaTab('arrivals')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                agendaTab === 'arrivals' 
                  ? 'bg-emerald-50 border-emerald-400 shadow-sm ring-1 ring-emerald-400' 
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Expected Arrivals</span>
                <span className="p-1 rounded-md bg-emerald-100 text-emerald-800">
                  <ArrowDownLeft size={14} />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {todayArrivals.length}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Checking-in today</div>
            </div>

            <div 
              onClick={() => setAgendaTab('in_house')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                agendaTab === 'in_house' 
                  ? 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-400' 
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">In-House Guests</span>
                <span className="p-1 rounded-md bg-blue-100 text-blue-800">
                  <UserCheck size={14} />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {inHouseBookings.length}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Currently staying</div>
            </div>

            <div 
              onClick={() => setAgendaTab('departures')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                agendaTab === 'departures' 
                  ? 'bg-amber-50 border-amber-400 shadow-sm ring-1 ring-amber-400' 
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Departures Today</span>
                <span className="p-1 rounded-md bg-amber-100 text-amber-800">
                  <ArrowUpRight size={14} />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {todayDepartures.length}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Expected checkout</div>
            </div>

            <div 
              onClick={() => setAgendaTab('all')}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                agendaTab === 'all' 
                  ? 'bg-teal-50 border-teal-400 shadow-sm ring-1 ring-teal-400' 
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Occupancy</span>
                <span className="p-1 rounded-md bg-teal-100 text-teal-800">
                  <Bed size={14} />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {Math.round((occupiedRoomIds.size / (rooms.length || 1)) * 100)}%
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {occupiedRoomIds.size} / {rooms.length} Rooms
              </div>
            </div>
          </div>

          {/* Agenda Search & Filter Bar */}
          <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search guest name, room, or code..."
                value={agendaSearch}
                onChange={(e) => setAgendaSearch(e.target.value)}
                className="w-full text-xs bg-transparent border-none outline-hidden text-slate-900 placeholder:text-slate-400"
              />
              {agendaSearch && (
                <button onClick={() => setAgendaSearch('')} className="text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setAgendaTab('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  agendaTab === 'all'
                    ? 'bg-teal-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Operations
              </button>
              <button
                type="button"
                onClick={() => setAgendaTab('arrivals')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  agendaTab === 'arrivals'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Arrivals ({todayArrivals.length})
              </button>
              <button
                type="button"
                onClick={() => setAgendaTab('in_house')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  agendaTab === 'in_house'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                In-House ({inHouseBookings.length})
              </button>
              <button
                type="button"
                onClick={() => setAgendaTab('departures')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  agendaTab === 'departures'
                    ? 'bg-amber-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Departures ({todayDepartures.length})
              </button>
            </div>
          </div>

          {/* Bookings Card Feed */}
          <div className="space-y-3">
            {(() => {
              let list = bookings.filter(b => b.status !== 'cancelled');
              if (agendaTab === 'arrivals') {
                list = todayArrivals;
              } else if (agendaTab === 'in_house') {
                list = inHouseBookings;
              } else if (agendaTab === 'departures') {
                list = todayDepartures;
              }

              if (agendaSearch.trim()) {
                const q = agendaSearch.toLowerCase();
                list = list.filter(b => 
                  b.guest.fullName.toLowerCase().includes(q) ||
                  b.roomNumber.toLowerCase().includes(q) ||
                  b.bookingCode.toLowerCase().includes(q) ||
                  b.channel.toLowerCase().includes(q)
                );
              }

              if (list.length === 0) {
                return (
                  <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
                    <CalendarCheck2 size={36} className="mx-auto text-slate-300 mb-2" />
                    <h3 className="font-bold text-slate-800 text-sm">No reservations found in this filter</h3>
                    <p className="text-xs text-slate-400 mt-1">Switch to "All Operations" or clear the search query</p>
                  </div>
                );
              }

              return list.map((b) => {
                const room = rooms.find(r => r.id === b.roomId);
                const styleInfo = getChannelStyle(b.channel);
                const isIdVerified = Boolean(
                  b.guest.idDocument?.isVerified && 
                  b.guest.idDocument?.idNumber && 
                  b.guest.idDocument.idNumber !== 'Pending at Check-in'
                );

                return (
                  <div
                    key={b.id}
                    onClick={() => onSelectBooking(b)}
                    className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center font-bold shrink-0 text-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase leading-none">Room</span>
                        <span className="text-base font-black text-teal-800 leading-tight">{b.roomNumber}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h4 className="font-bold text-sm text-slate-900 truncate">{b.guest.fullName}</h4>
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded text-white ${styleInfo.bg}`}>
                            {styleInfo.label}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            b.status === 'checked_in' ? 'bg-emerald-100 text-emerald-800' :
                            b.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            b.status === 'checked_out' ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {b.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                          <span>{b.checkInDate} → {b.checkOutDate}</span>
                          <span>•</span>
                          <span>{b.nights} Nights</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">₹{b.totalAmount}</span>
                        </div>

                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          {isIdVerified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <ShieldCheck size={11} /> ID Verified ({b.guest.idDocument.idType})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <AlertTriangle size={11} /> ID Pending at Check-in
                            </span>
                          )}

                          {b.guest.phone && (
                            <a
                              href={`tel:${b.guest.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-800 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                            >
                              <Phone size={10} /> {b.guest.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBooking(b);
                        }}
                        className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        Manage / Folio
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: FULL TAPE CHART GRID (Horizontally scrollable with sticky room column) */
        <div className="flex-1 flex flex-col overflow-hidden bg-white select-none relative">
          {/* Mobile swipe hint banner */}
          <div className="sm:hidden flex items-center justify-between text-[11px] text-teal-900 bg-teal-50 px-3 py-1.5 border-b border-teal-200 font-medium">
            <span>👉 Swipe horizontally for more dates</span>
            <span className="text-teal-700 font-bold">17 Sep — 17 Oct</span>
          </div>

          <div className="flex-1 overflow-auto bg-white select-none relative" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="inline-block min-w-full align-top">
              {/* Header Row: Room & Dates */}
              <div className="flex border-b border-slate-200 sticky top-0 bg-slate-50 z-20 shadow-xs">
                {/* Top-Left Corner: Room Column Header */}
                <div className="w-32 sm:w-44 md:w-56 shrink-0 p-2 sm:p-3 font-bold text-xs md:text-sm text-slate-700 uppercase tracking-wider bg-slate-100 border-r border-slate-200 sticky left-0 z-30 flex items-center justify-between">
                  <span>Room</span>
                  <span className="text-[10px] font-normal lowercase text-slate-500">
                    {filteredRooms.length}
                  </span>
                </div>

                {/* Date Columns */}
                <div className="flex flex-1">
                  {dates.map((d) => (
                    <div
                      key={d.dateStr}
                      className={`w-24 shrink-0 text-center py-2 px-1 border-r border-slate-200 transition-colors ${
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
                  const roomBookings = bookings.filter(b => b.roomId === room.id && b.status !== 'cancelled');

                  return (
                    <div key={room.id} className="flex relative hover:bg-slate-50/40 transition-colors group">
                      {/* Sticky Room Info Cell */}
                      <div 
                        className="w-32 sm:w-44 md:w-56 shrink-0 p-2 sm:p-2.5 bg-white border-r border-slate-200 sticky left-0 z-10 flex flex-col justify-between shadow-xs group-hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs md:text-sm text-slate-900 truncate" title={room.name}>
                              {room.name}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`w-2 h-2 rounded-full ${
                                room.status === 'clean' ? 'bg-emerald-500' :
                                room.status === 'dirty' ? 'bg-amber-500' :
                                room.status === 'cleaning' ? 'bg-blue-500' : 'bg-rose-500'
                              }`} title={`Status: ${room.status}`} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                            <span className="truncate max-w-[70px] sm:max-w-[95px]" title={room.type}>{room.type}</span>
                            <span className="font-semibold text-slate-700 font-mono text-[10px] sm:text-xs">₹{room.baseRate}</span>
                          </div>
                        </div>

                        {/* Quick Room Action Buttons for Edit & Delete */}
                        <div className="flex items-center gap-1 mt-1 pt-1 border-t border-slate-100">
                          {onEditRoom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditRoom(room);
                              }}
                              className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded transition-colors cursor-pointer"
                              title="Edit Room Details & Rates"
                            >
                              <Edit3 size={9} className="text-teal-700" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                          )}
                          {onRequestDeleteRoom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequestDeleteRoom(room);
                              }}
                              className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded transition-colors cursor-pointer ml-auto"
                              title={isSuperAdmin ? "Delete Room (Super Admin Direct)" : "Delete Room"}
                            >
                              <Trash2 size={9} />
                              <span className="hidden sm:inline">Del</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Date Grid Cells */}
                      <div className="flex flex-1 relative h-16 md:h-18">
                        {dates.map((d) => (
                          <div
                            key={d.dateStr}
                            onClick={() => onCellClick(room.id, d.dateStr)}
                            className={`w-24 shrink-0 border-r border-slate-100 hover:bg-teal-50/40 cursor-pointer transition-colors relative flex items-center justify-center ${
                              d.isToday ? 'bg-teal-50/20' : d.isWeekend ? 'bg-slate-50/40' : ''
                            }`}
                            title={`Click to book ${room.name} on ${d.dateStr}`}
                          >
                            <span className="opacity-0 hover:opacity-100 text-teal-700 text-[10px] sm:text-xs font-semibold bg-white px-1.5 sm:px-2 py-0.5 rounded shadow-xs border border-teal-200 transition-opacity">
                              + Book
                            </span>
                          </div>
                        ))}

                        {/* Booking Bars Overlay */}
                        {roomBookings.map((booking) => {
                          const checkInIndex = getDateIndex(booking.checkInDate);
                          const checkOutIndex = getDateIndex(booking.checkOutDate);

                          const viewStartStr = dates[0]?.dateStr;
                          const viewEndStr = dates[dates.length - 1]?.dateStr;

                          if (!viewStartStr || !viewEndStr) return null;
                          if (booking.checkOutDate <= viewStartStr || booking.checkInDate > viewEndStr) {
                            return null;
                          }

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

                          const leftPos = `${effectiveStart * 6}rem`;
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
                              className={`absolute z-10 rounded-lg ${styleInfo.bg} shadow-md border px-2 py-1 flex flex-col justify-between cursor-pointer transition-all duration-150 hover:brightness-105 hover:scale-[1.01] overflow-hidden select-none`}
                            >
                              <div className="flex items-center justify-between gap-1 overflow-hidden">
                                <span className="font-bold text-[11px] sm:text-xs md:text-sm tracking-tight truncate text-white drop-shadow-xs">
                                  {booking.guest.fullName}
                                </span>

                                <div className="flex items-center gap-1 shrink-0">
                                  {isIdVerified ? (
                                    <span 
                                      className="p-0.5 bg-black/25 text-emerald-300 rounded" 
                                      title={`ID Verified: ${booking.guest.idDocument.idType.toUpperCase()}`}
                                    >
                                      <ShieldCheck size={12} className="text-emerald-300" />
                                    </span>
                                  ) : isCheckedIn ? (
                                    <span 
                                      className="px-1 py-0.2 bg-amber-400 text-amber-950 font-black text-[8px] uppercase rounded flex items-center gap-0.5 shadow-xs" 
                                      title="ID Proof Pending Submission!"
                                    >
                                      <AlertTriangle size={9} /> ID Due
                                    </span>
                                  ) : null}

                                  <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 bg-black/25 text-white rounded">
                                    {styleInfo.label}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-white/90">
                                <span className="truncate">
                                  {booking.nights}N • {booking.adults}A
                                </span>
                                <span className="font-mono text-[8px] sm:text-[9px] bg-white/20 px-1 rounded">
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
        </div>
      )}

      {/* Bottom Color & Status Legend */}
      <div className="p-2 sm:p-2.5 md:p-3 bg-white border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-[11px]">
          <span className="font-bold text-slate-700 uppercase tracking-wider hidden sm:inline">Legend:</span>
          
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
            <span className="font-medium text-[10px] sm:text-xs">MMT</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
            <span className="font-medium text-[10px] sm:text-xs">Direct</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
            <span className="font-medium text-[10px] sm:text-xs">Booking.com</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-teal-600"></span>
            <span className="font-medium text-[10px] sm:text-xs">Agoda</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
            <span className="font-medium text-[10px] sm:text-xs">Airbnb</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-600" /> ID Attached
          </span>
        </div>
      </div>
    </div>
  );
};
