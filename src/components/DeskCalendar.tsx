import React, { useState, useMemo, useEffect } from 'react';
import { 
  Room, 
  Booking, 
  BookingChannel,
  UserAccount
} from '../types';
import { isSuperAdminUser } from '../utils/permissionHelper';
import { getTodayDateStr, addDaysToStr, formatDisplayDate } from '../utils/dateHelper';
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
  X,
  Zap,
  Clock,
  SlidersHorizontal,
  Tag,
  Coins,
  TrendingUp,
  Percent
} from 'lucide-react';
import { 
  LastMinuteRuleStatus, 
  getRoomDailyRate, 
  isDateCustomRate 
} from '../utils/pricingHelper';

interface DeskCalendarProps {
  rooms: Room[];
  bookings: Booking[];
  startDateStr?: string; // e.g. "2026-09-25"
  daysToShow?: number;
  onSelectBooking: (booking: Booking) => void;
  onCellClick: (roomId: string, dateStr: string) => void;
  onRefresh: () => void;
  onOpenAddRoom?: () => void;
  onEditRoom?: (room: Room) => void;
  onRequestDeleteRoom?: (room: Room) => void;
  currentUser?: UserAccount | null;
  isLastMinuteFlashActive?: boolean;
  onOpenChannelManager?: () => void;
  lastMinuteStatus?: LastMinuteRuleStatus;
  onOpenLastMinuteModal?: () => void;
  onToggleSimulate7am?: () => void;
  onUpdateDailyRate?: (targetRoomIds: string[], dateStrings: string[], newRate: number | null) => void;
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
  isLastMinuteFlashActive = false,
  onOpenChannelManager,
  lastMinuteStatus,
  onOpenLastMinuteModal,
  onToggleSimulate7am,
  onUpdateDailyRate
}) => {
  const isSuperAdmin = isSuperAdminUser(currentUser);
  const todayStr = useMemo(() => getTodayDateStr(), []);
  const [calendarBaseDate, setCalendarBaseDate] = useState<string>(() => startDateStr || todayStr);
  const [currentStartOffset, setCurrentStartOffset] = useState<number>(0);
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'clean' | 'dirty' | 'occupied'>('all');
  const [viewMode, setViewMode] = useState<'tape' | 'agenda'>('tape');
  const [agendaTab, setAgendaTab] = useState<'all' | 'arrivals' | 'in_house' | 'departures'>('all');
  const [agendaSearch, setAgendaSearch] = useState<string>('');

  // Quick Daily Rate Editor Modal State
  const [quickRateModal, setQuickRateModal] = useState<{
    isOpen: boolean;
    roomId: string | null;
    dateStr: string;
    currentRate: number;
    baseRate: number;
    newRate: string;
    applyTo: 'single' | 'category' | 'all';
  }>({
    isOpen: false,
    roomId: null,
    dateStr: '',
    currentRate: 0,
    baseRate: 0,
    newRate: '',
    applyTo: 'single'
  });

  // Bulk Daily Rate / Weekend Surge Manager Modal State
  const [isBulkRateModalOpen, setIsBulkRateModalOpen] = useState<boolean>(false);
  const [bulkRateState, setBulkRateState] = useState<{
    startDate: string;
    endDate: string;
    filterDays: 'all' | 'weekends' | 'weekdays';
    targetCategory: string;
    adjustMode: 'set' | 'increase_amt' | 'decrease_amt' | 'increase_pct' | 'reset';
    rateValue: string;
  }>({
    startDate: todayStr,
    endDate: addDaysToStr(todayStr, 14),
    filterDays: 'all',
    targetCategory: 'all',
    adjustMode: 'set',
    rateValue: '2500'
  });

  // Unique Room Categories
  const roomCategories = useMemo(() => {
    return Array.from(new Set(rooms.map(r => r.type)));
  }, [rooms]);

  // Open Quick Rate Editor Handler
  const handleOpenQuickRateEdit = (targetRoomId: string | null, targetDateStr: string) => {
    let rm = targetRoomId ? rooms.find(r => r.id === targetRoomId) : null;
    if (!rm && rooms.length > 0) {
      rm = rooms[0];
    }
    const currentR = rm ? getRoomDailyRate(rm, targetDateStr, lastMinuteStatus) : 2000;
    const baseR = rm ? rm.baseRate : 2000;

    setQuickRateModal({
      isOpen: true,
      roomId: targetRoomId,
      dateStr: targetDateStr,
      currentRate: currentR,
      baseRate: baseR,
      newRate: currentR.toString(),
      applyTo: targetRoomId ? 'single' : 'all'
    });
  };

  // Save Quick Daily Rate Handler
  const handleSaveQuickRate = () => {
    if (!onUpdateDailyRate) return;
    const numericRate = parseFloat(quickRateModal.newRate);
    if (isNaN(numericRate) || numericRate < 0) return;

    let targetIds: string[] = [];
    const targetRm = quickRateModal.roomId ? rooms.find(r => r.id === quickRateModal.roomId) : null;

    if (quickRateModal.applyTo === 'single' && targetRm) {
      targetIds = [targetRm.id];
    } else if (quickRateModal.applyTo === 'category' && targetRm) {
      targetIds = rooms.filter(r => r.type === targetRm.type).map(r => r.id);
    } else {
      targetIds = rooms.map(r => r.id);
    }

    onUpdateDailyRate(targetIds, [quickRateModal.dateStr], numericRate);
    setQuickRateModal(prev => ({ ...prev, isOpen: false }));
  };

  // Reset Quick Daily Rate to Base Rate Handler
  const handleResetQuickRate = () => {
    if (!onUpdateDailyRate) return;
    let targetIds: string[] = [];
    const targetRm = quickRateModal.roomId ? rooms.find(r => r.id === quickRateModal.roomId) : null;

    if (quickRateModal.applyTo === 'single' && targetRm) {
      targetIds = [targetRm.id];
    } else if (quickRateModal.applyTo === 'category' && targetRm) {
      targetIds = rooms.filter(r => r.type === targetRm.type).map(r => r.id);
    } else {
      targetIds = rooms.map(r => r.id);
    }

    onUpdateDailyRate(targetIds, [quickRateModal.dateStr], null);
    setQuickRateModal(prev => ({ ...prev, isOpen: false }));
  };

  // Apply Bulk Rates Handler
  const handleApplyBulkRates = () => {
    if (!onUpdateDailyRate) return;

    const dateList: string[] = [];
    let curr = bulkRateState.startDate;
    const maxDays = 90;
    let count = 0;

    while (curr <= bulkRateState.endDate && count < maxDays) {
      const [y, m, dNum] = curr.split('-').map(Number);
      const dObj = new Date(y, m - 1, dNum);
      const dayOfWeek = dObj.getDay();
      const isWknd = dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5;

      if (bulkRateState.filterDays === 'weekends' && isWknd) {
        dateList.push(curr);
      } else if (bulkRateState.filterDays === 'weekdays' && !isWknd) {
        dateList.push(curr);
      } else if (bulkRateState.filterDays === 'all') {
        dateList.push(curr);
      }
      curr = addDaysToStr(curr, 1);
      count++;
    }

    if (dateList.length === 0) return;

    const targetRooms = bulkRateState.targetCategory === 'all'
      ? rooms
      : rooms.filter(r => r.type === bulkRateState.targetCategory);

    const targetIds = targetRooms.map(r => r.id);
    if (targetIds.length === 0) return;

    const val = parseFloat(bulkRateState.rateValue) || 0;

    if (bulkRateState.adjustMode === 'reset') {
      onUpdateDailyRate(targetIds, dateList, null);
    } else if (bulkRateState.adjustMode === 'set') {
      onUpdateDailyRate(targetIds, dateList, Math.max(100, Math.round(val)));
    } else {
      targetRooms.forEach(rm => {
        let newCalculatedRate = rm.baseRate;
        if (bulkRateState.adjustMode === 'increase_amt') {
          newCalculatedRate = rm.baseRate + val;
        } else if (bulkRateState.adjustMode === 'decrease_amt') {
          newCalculatedRate = Math.max(100, rm.baseRate - val);
        } else if (bulkRateState.adjustMode === 'increase_pct') {
          newCalculatedRate = Math.round(rm.baseRate * (1 + val / 100));
        }
        onUpdateDailyRate([rm.id], dateList, Math.max(100, newCalculatedRate));
      });
    }

    setIsBulkRateModalOpen(false);
  };

  // Keep calendar in sync if parent updates startDateStr
  useEffect(() => {
    if (startDateStr) {
      setCalendarBaseDate(startDateStr);
      setCurrentStartOffset(0);
    }
  }, [startDateStr]);

  // Compute date series
  const dates = useMemo(() => {
    const list: { dateStr: string; dayName: string; dayNumber: number; monthName: string; isToday: boolean; isWeekend: boolean }[] = [];
    const effectiveBase = addDaysToStr(calendarBaseDate, currentStartOffset);

    for (let i = 0; i < daysToShow; i++) {
      const iso = addDaysToStr(effectiveBase, i);
      const [y, m, dNum] = iso.split('-').map(Number);
      const d = new Date(y, m - 1, dNum);
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
  }, [calendarBaseDate, currentStartOffset, daysToShow, todayStr]);

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
      <div className="p-2 sm:p-3 md:p-3.5 pb-2 bg-white border-b border-slate-200 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-2.5 mb-2">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              Desk
              <span className="text-[9px] sm:text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded-full font-medium">
                Live Tape Chart
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.2">
              Front desk booking calendar &amp; room status grid
            </p>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 self-start sm:self-auto">
            {/* View Mode Switcher: Tape Chart vs Today's Quick Operations */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('tape')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === 'tape'
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Full Tape Chart Grid"
              >
                <Grid3X3 size={12} />
                <span>Tape Chart</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer relative ${
                  viewMode === 'agenda'
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Today's Arrivals, In-House, & Departures (Mobile Friendly)"
              >
                <LayoutList size={12} />
                <span>Today's View</span>
                {(todayArrivals.length > 0 || todayDepartures.length > 0) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                )}
              </button>
            </div>

            {/* Bulk Rate & Surge Manager button */}
            <button
              id="btn-desk-bulk-rates"
              type="button"
              onClick={() => setIsBulkRateModalOpen(true)}
              className="flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Bulk Rate & Surge Manager (Weekends, Holidays, Custom Date Ranges)"
            >
              <TrendingUp size={12} className="text-amber-700" />
              <span className="hidden sm:inline">Bulk Rates</span>
              <span className="sm:hidden">Bulk</span>
            </button>

            {onOpenAddRoom && (
              <button
                id="btn-desk-add-room"
                onClick={onOpenAddRoom}
                className="flex items-center gap-1 px-2 py-1 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span className="hidden sm:inline">Add Room</span>
              </button>
            )}

            {/* Refresh Grid Button */}
            <button
              id="refresh-calendar-btn"
              onClick={onRefresh}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Refresh desk bookings"
            >
              <RotateCw size={13} />
            </button>
          </div>
        </div>

        {/* Date Selector Row with interactive date picker and dynamic range */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            <label 
              className="relative flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-300 hover:border-teal-700 rounded-lg text-[11px] font-semibold text-slate-800 shadow-2xs transition-all cursor-pointer group"
              title="Click to jump to another date"
            >
              <CalendarIcon size={12} className="text-teal-700 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-semibold text-slate-900">
                {dates[0] && dates[dates.length - 1] 
                  ? `${dates[0].dayNumber} ${dates[0].monthName} ${dates[0].dateStr.split('-')[0]} — ${dates[dates.length - 1].dayNumber} ${dates[dates.length - 1].monthName} ${dates[dates.length - 1].dateStr.split('-')[0]}`
                  : ''}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-[10px] text-slate-500 font-normal">{dates.length} days</span>
              <input
                type="date"
                value={dates[0]?.dateStr || todayStr}
                onChange={(e) => {
                  if (e.target.value) {
                    setCalendarBaseDate(e.target.value);
                    setCurrentStartOffset(0);
                  }
                }}
                className="sr-only"
              />
            </label>

            {/* Quick Navigation Buttons */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs gap-0.5">
              <button
                type="button"
                onClick={() => setCurrentStartOffset(prev => prev - 7)}
                className="p-0.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Previous 7 days"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalendarBaseDate('2026-09-29');
                  setCurrentStartOffset(0);
                }}
                className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold rounded transition-colors cursor-pointer ${
                  dates[0]?.dateStr === '2026-09-29'
                    ? 'bg-amber-700 text-white shadow-2xs font-bold'
                    : 'text-amber-900 bg-amber-50 hover:bg-amber-100'
                }`}
                title="29 Sep (पुरानी तारीख / Historical View)"
              >
                29 Sep
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalendarBaseDate(addDaysToStr(todayStr, -1));
                  setCurrentStartOffset(0);
                }}
                className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold rounded transition-colors cursor-pointer ${
                  dates[0]?.dateStr === addDaysToStr(todayStr, -1)
                    ? 'bg-teal-800 text-white shadow-2xs font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title={`Jump to Yesterday (${formatDisplayDate(addDaysToStr(todayStr, -1))})`}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalendarBaseDate(todayStr);
                  setCurrentStartOffset(0);
                }}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-colors cursor-pointer ${
                  dates[0]?.dateStr === todayStr
                    ? 'bg-teal-800 text-white shadow-2xs'
                    : 'text-teal-800 hover:bg-teal-50'
                }`}
                title={`Jump to Today (${formatDisplayDate(todayStr)})`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setCurrentStartOffset(prev => prev + 7)}
                className="p-0.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Next 7 days"
              >
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Today indicator badge */}
            <div className="hidden xs:flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse"></span>
              <span>Today: {formatDisplayDate(todayStr)}</span>
            </div>
          </div>

          {/* Floor & Room Filter Chips */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-400 font-medium hidden sm:inline text-[10px]">Floor:</span>
            <button
              onClick={() => setSelectedFloor('all')}
              className={`px-1.5 py-0.2 rounded font-medium text-[10px] transition-colors cursor-pointer ${
                selectedFloor === 'all' 
                  ? 'bg-teal-800 text-white' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFloor(1)}
              className={`px-1.5 py-0.2 rounded font-medium text-[10px] transition-colors cursor-pointer ${
                selectedFloor === 1 
                  ? 'bg-teal-800 text-white' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              F1
            </button>
            <button
              onClick={() => setSelectedFloor(2)}
              className={`px-1.5 py-0.2 rounded font-medium text-[10px] transition-colors cursor-pointer ${
                selectedFloor === 2 
                  ? 'bg-teal-800 text-white' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              F2
            </button>
            <button
              onClick={() => setSelectedFloor(3)}
              className={`px-1.5 py-0.2 rounded font-medium text-[10px] transition-colors cursor-pointer ${
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

      {/* ⚡ Morning 7:00 AM Last-Minute Booking Automation Banner */}
      {lastMinuteStatus && (
        <div className={`mx-2 sm:mx-3 mt-1.5 p-2 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-2 transition-all shrink-0 ${
          lastMinuteStatus.isTriggered
            ? 'bg-gradient-to-r from-rose-50 via-pink-50 to-orange-50 border-rose-300 text-rose-950 shadow-2xs'
            : lastMinuteStatus.isPast7Am
            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-950'
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-950'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              lastMinuteStatus.isTriggered ? 'bg-rose-600 text-white animate-pulse' : lastMinuteStatus.isPast7Am ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
            }`}>
              <Clock size={12} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-xs">
                  {lastMinuteStatus.isTriggered
                    ? `⚡ 7:00 AM Last-Minute Flash Sale Active: Base Rates -${lastMinuteStatus.discountPercent}% Reduced`
                    : lastMinuteStatus.isPast7Am
                    ? `🎯 60% Booking Target Met (${lastMinuteStatus.currentOccupancyPercent}% Occupancy)`
                    : `⏳ Pending 7:00 AM Last-Minute Cutoff (${lastMinuteStatus.currentOccupancyPercent}% Booked)`}
                </span>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full border ${
                  lastMinuteStatus.isTriggered 
                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                    : lastMinuteStatus.isPast7Am 
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  Today: {lastMinuteStatus.currentOccupancyPercent}% Occupied ({lastMinuteStatus.occupiedRoomsCount}/{lastMinuteStatus.totalRoomsCount} Rooms)
                </span>
              </div>
              <p className="text-[10px] opacity-80 mt-0.5">
                {lastMinuteStatus.isTriggered
                  ? `Same-date occupancy is under 60% after 7:00 AM cutoff. 15% discount is automatically applied to today's walk-in bookings and OTA channels.`
                  : lastMinuteStatus.isPast7Am
                  ? `Today's booking reached or exceeded 60% target. Normal standard base rates remain in effect.`
                  : `Automated rule runs every morning at 7:00 AM. If today's booking is under 60%, rates will automatically reduce by 15%.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
            {onToggleSimulate7am && (
              <button
                type="button"
                onClick={onToggleSimulate7am}
                className="px-2 py-0.5 text-[11px] font-semibold rounded-lg border bg-white hover:bg-slate-50 text-slate-700 shadow-2xs flex items-center gap-1 cursor-pointer"
                title="Toggle 7:00 AM Cutoff Simulation to test 15% discount immediately"
              >
                <Zap size={11} className={lastMinuteStatus.isPast7Am ? 'text-amber-600 fill-amber-500' : 'text-slate-400'} />
                <span>{lastMinuteStatus.isPast7Am ? 'Simulation (ON)' : 'Test 7 AM'}</span>
              </button>
            )}
            {onOpenLastMinuteModal && (
              <button
                type="button"
                onClick={onOpenLastMinuteModal}
                className="px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-teal-800 hover:bg-teal-900 text-white shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <SlidersHorizontal size={11} />
                <span>Rule Settings</span>
              </button>
            )}
          </div>
        </div>
      )}

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
                const q = agendaSearch.toLowerCase().trim();
                const normalizedQ = q.replace(/nikta/g, 'nikita');
                list = list.filter(b => {
                  const name = b.guest.fullName.toLowerCase();
                  return (
                    name.includes(q) ||
                    name.includes(normalizedQ) ||
                    (q.includes('nikta') && name.includes('nikita')) ||
                    b.roomNumber.toLowerCase().includes(q) ||
                    b.bookingCode.toLowerCase().includes(q) ||
                    b.channel.toLowerCase().includes(q)
                  );
                });
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
                          <span className="font-semibold text-slate-700">₹{(b.nights * b.roomRatePerNight).toLocaleString()}</span>
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
              {/* Sticky Header Container: Dates + Daily Rates Rows */}
              <div className="sticky top-0 bg-slate-50 z-20 shadow-xs border-b border-slate-200">
                {/* Row 1: Room & Dates */}
                <div className="flex border-b border-slate-200">
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
                            <span className="truncate max-w-[65px] sm:max-w-[90px]" title={room.type}>{room.type}</span>
                            {lastMinuteStatus?.isTriggered ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 line-through">₹{room.baseRate}</span>
                                <span className="font-extrabold text-rose-700 font-mono text-[10px] sm:text-xs">
                                  ₹{Math.round(room.baseRate * (1 - (lastMinuteStatus.discountPercent || 15) / 100))}
                                </span>
                                <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                                  ⚡-15%
                                </span>
                              </div>
                            ) : (
                              <span className="font-semibold text-slate-700 font-mono text-[10px] sm:text-xs">₹{room.baseRate}</span>
                            )}
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
                        {dates.map((d) => {
                          const rRate = getRoomDailyRate(room, d.dateStr, lastMinuteStatus);
                          const isCustom = isDateCustomRate(room, d.dateStr);

                          return (
                            <div
                              key={d.dateStr}
                              onClick={() => onCellClick(room.id, d.dateStr)}
                              className={`w-24 shrink-0 border-r border-slate-100 hover:bg-teal-50/40 cursor-pointer transition-colors relative flex flex-col justify-between p-1 group/cell ${
                                d.isToday ? 'bg-teal-50/20' : d.isWeekend ? 'bg-slate-50/40' : ''
                              }`}
                              title={`Click to book ${room.name} on ${d.dateStr} • Rate: ₹${rRate}/night`}
                            >
                              {/* Top cell header: Daily Rate & Direct Edit button */}
                              <div className="flex items-center justify-between w-full z-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenQuickRateEdit(room.id, d.dateStr);
                                  }}
                                  className={`flex items-center gap-1 text-[9px] font-mono leading-none px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                                    isCustom 
                                      ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-2xs hover:bg-amber-200' 
                                      : 'text-slate-600 bg-white/70 hover:text-teal-900 hover:bg-teal-100 border border-slate-200/80 hover:border-teal-300 shadow-2xs'
                                  }`}
                                  title={`Har din ka rate edit karein: ${room.name} on ${d.dateStr} (Current: ₹${rRate})`}
                                >
                                  <span>₹{rRate}</span>
                                  <Edit3 size={8} className="text-teal-700 opacity-60 hover:opacity-100 shrink-0" />
                                </button>
                              </div>

                              <span className="opacity-0 group-hover/cell:opacity-100 text-teal-700 text-[10px] font-semibold bg-white/95 px-1.5 py-0.5 rounded shadow-xs border border-teal-200 transition-opacity self-center my-auto">
                                + Book
                              </span>

                              {isCustom && (
                                <div className="text-[8px] font-bold text-amber-800 text-right leading-none truncate">
                                  Custom ⚡
                                </div>
                              )}
                            </div>
                          );
                        })}

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

                                  {booking.groupTotalRooms && booking.groupTotalRooms > 1 && (
                                    <span 
                                      className="text-[8px] font-bold px-1 py-0.2 bg-slate-900/60 text-amber-200 rounded border border-amber-400/40"
                                      title={`Multi-Room Booking (${booking.groupTotalRooms} Rooms under ${booking.guest.fullName})`}
                                    >
                                      {booking.groupTotalRooms} Rms
                                    </span>
                                  )}
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

      {/* MODAL 1: Quick Daily Rate Editor Modal */}
      {quickRateModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setQuickRateModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-700/80 flex items-center justify-center text-amber-300">
                  <Tag size={17} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">
                    Edit Daily Room Rate
                  </h3>
                  <p className="text-xs text-teal-200 mt-0.5">
                    {formatDisplayDate(quickRateModal.dateStr)} ({quickRateModal.dateStr})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickRateModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg text-teal-300 hover:text-white hover:bg-teal-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 text-xs">
              {/* Target Room Context */}
              {quickRateModal.roomId ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Selected Room:</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {rooms.find(r => r.id === quickRateModal.roomId)?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Category: <strong className="text-slate-800">{rooms.find(r => r.id === quickRateModal.roomId)?.type}</strong></span>
                    <span>Standard Base Rate: <strong className="font-mono text-slate-900">₹{quickRateModal.baseRate}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-teal-900">Date: {quickRateModal.dateStr}</span>
                  <span className="text-teal-700 text-[11px]">Updating Calendar Rates</span>
                </div>
              )}

              {/* Apply Scope Selector */}
              {quickRateModal.roomId && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 text-xs block">Apply this rate to:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuickRateModal(prev => ({ ...prev, applyTo: 'single' }))}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer font-bold text-[11px] ${
                        quickRateModal.applyTo === 'single'
                          ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      This Room Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickRateModal(prev => ({ ...prev, applyTo: 'category' }))}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer font-bold text-[11px] ${
                        quickRateModal.applyTo === 'category'
                          ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      All {rooms.find(r => r.id === quickRateModal.roomId)?.type}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickRateModal(prev => ({ ...prev, applyTo: 'all' }))}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer font-bold text-[11px] ${
                        quickRateModal.applyTo === 'all'
                          ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      All Rooms
                    </button>
                  </div>
                </div>
              )}

              {/* Rate Input Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs">
                    New Rate for {quickRateModal.dateStr} (₹ / Night):
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Current: <strong className="font-mono text-slate-900">₹{quickRateModal.currentRate}</strong>
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400 font-bold text-base">₹</span>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={quickRateModal.newRate}
                    onChange={(e) => setQuickRateModal(prev => ({ ...prev, newRate: e.target.value }))}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border-2 border-slate-300 focus:border-teal-700 focus:bg-white rounded-xl text-lg font-bold font-mono text-slate-900 outline-hidden transition-all"
                    placeholder="e.g. 2500"
                    autoFocus
                  />
                  <span className="absolute right-3.5 text-xs text-slate-400 font-medium">/ night</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 block">Quick Rate Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '+₹200', val: (parseFloat(quickRateModal.newRate) || quickRateModal.baseRate) + 200 },
                    { label: '+₹500', val: (parseFloat(quickRateModal.newRate) || quickRateModal.baseRate) + 500 },
                    { label: '+10% Wknd', val: Math.round(quickRateModal.baseRate * 1.1) },
                    { label: '+20% Peak', val: Math.round(quickRateModal.baseRate * 1.2) },
                    { label: '-15% Flash', val: Math.round(quickRateModal.baseRate * 0.85) },
                    { label: '₹1,500', val: 1500 },
                    { label: '₹2,000', val: 2000 },
                    { label: '₹2,500', val: 2500 },
                    { label: '₹3,000', val: 3000 },
                    { label: '₹3,500', val: 3500 }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuickRateModal(prev => ({ ...prev, newRate: p.val.toString() }))}
                      className="px-2 py-1 bg-slate-100 hover:bg-teal-100 hover:text-teal-900 border border-slate-200 rounded-md font-mono font-bold text-[11px] text-slate-700 transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleResetQuickRate}
                className="px-3 py-2 bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                title="Clear custom rate and revert back to standard room base rate"
              >
                ↺ Reset to Base Rate
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickRateModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickRate}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>Save Rate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Bulk Daily Rate & Weekend Surge Manager Modal */}
      {isBulkRateModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setIsBulkRateModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-700/80 flex items-center justify-center text-amber-300 shadow-xs">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg leading-tight">
                    Bulk Daily Rate &amp; Surge Manager
                  </h3>
                  <p className="text-xs text-teal-200 mt-0.5">
                    Har din ka rate set karein (Weekends, Holidays, Custom Date Ranges)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkRateModalOpen(false)}
                className="p-1.5 rounded-lg text-teal-300 hover:text-white hover:bg-teal-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs text-slate-800">
              {/* 1. Date Range Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CalendarIcon size={14} className="text-teal-700" />
                    1. Select Date Range:
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setBulkRateState(prev => ({
                        ...prev,
                        startDate: todayStr,
                        endDate: addDaysToStr(todayStr, 7)
                      }))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-teal-50 text-teal-800 rounded font-semibold transition-colors cursor-pointer"
                    >
                      Next 7D
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkRateState(prev => ({
                        ...prev,
                        startDate: todayStr,
                        endDate: addDaysToStr(todayStr, 14)
                      }))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-teal-50 text-teal-800 rounded font-semibold transition-colors cursor-pointer"
                    >
                      Next 14D
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkRateState(prev => ({
                        ...prev,
                        startDate: todayStr,
                        endDate: addDaysToStr(todayStr, 30)
                      }))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-teal-50 text-teal-800 rounded font-semibold transition-colors cursor-pointer"
                    >
                      Next 30D
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">From Date:</span>
                    <input
                      type="date"
                      value={bulkRateState.startDate}
                      onChange={(e) => setBulkRateState(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 outline-hidden focus:border-teal-700"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">To Date (Inclusive):</span>
                    <input
                      type="date"
                      value={bulkRateState.endDate}
                      min={bulkRateState.startDate}
                      onChange={(e) => setBulkRateState(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 outline-hidden focus:border-teal-700"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Days Filter */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                  2. Apply to Days of the Week:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkRateState(prev => ({ ...prev, filterDays: 'all' }))}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                      bulkRateState.filterDays === 'all'
                        ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    All Days
                    <span className="block text-[10px] font-normal opacity-80">Mon – Sun</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkRateState(prev => ({ ...prev, filterDays: 'weekends' }))}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                      bulkRateState.filterDays === 'weekends'
                        ? 'bg-amber-800 text-white border-amber-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Weekends Only
                    <span className="block text-[10px] font-normal opacity-80">Fri, Sat, Sun</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkRateState(prev => ({ ...prev, filterDays: 'weekdays' }))}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                      bulkRateState.filterDays === 'weekdays'
                        ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Weekdays Only
                    <span className="block text-[10px] font-normal opacity-80">Mon – Thu</span>
                  </button>
                </div>
              </div>

              {/* 3. Room Selection */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                  3. Select Rooms / Categories:
                </label>
                <select
                  value={bulkRateState.targetCategory}
                  onChange={(e) => setBulkRateState(prev => ({ ...prev, targetCategory: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 outline-hidden focus:border-teal-700"
                >
                  <option value="all">All Rooms ({rooms.length} rooms in Hotel)</option>
                  {roomCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat} Rooms ({rooms.filter(r => r.type === cat).length} rooms)
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Pricing Action Mode */}
              <div className="space-y-2 pt-1">
                <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                  4. Choose Rate Adjustment:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBulkRateState(prev => ({ ...prev, adjustMode: 'set', rateValue: '2800' }))}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer font-bold text-[11px] ${
                      bulkRateState.adjustMode === 'set'
                        ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Fixed Rate (₹)
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkRateState(prev => ({ ...prev, adjustMode: 'increase_pct', rateValue: '20' }))}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer font-bold text-[11px] ${
                      bulkRateState.adjustMode === 'increase_pct'
                        ? 'bg-amber-800 text-white border-amber-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    + % Surge (e.g. 20%)
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkRateState(prev => ({ ...prev, adjustMode: 'increase_amt', rateValue: '500' }))}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer font-bold text-[11px] ${
                      bulkRateState.adjustMode === 'increase_amt'
                        ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    + Amount (e.g. +₹500)
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkRateState(prev => ({ ...prev, adjustMode: 'decrease_amt', rateValue: '300' }))}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer font-bold text-[11px] ${
                      bulkRateState.adjustMode === 'decrease_amt'
                        ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    - Discount (-₹300)
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkRateState(prev => ({ ...prev, adjustMode: 'reset' }))}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer font-bold text-[11px] col-span-2 sm:col-span-2 ${
                      bulkRateState.adjustMode === 'reset'
                        ? 'bg-rose-800 text-white border-rose-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    ↺ Reset to Standard Base Rates
                  </button>
                </div>

                {bulkRateState.adjustMode !== 'reset' && (
                  <div className="pt-1">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      {bulkRateState.adjustMode === 'set' && 'Enter Fixed Rate per Night:'}
                      {bulkRateState.adjustMode === 'increase_pct' && 'Enter Surge Percentage (%):'}
                      {bulkRateState.adjustMode === 'increase_amt' && 'Enter Addition Amount (₹):'}
                      {bulkRateState.adjustMode === 'decrease_amt' && 'Enter Discount Amount (₹):'}
                    </span>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-slate-400 font-bold text-base">
                        {bulkRateState.adjustMode === 'increase_pct' ? '%' : '₹'}
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={bulkRateState.rateValue}
                        onChange={(e) => setBulkRateState(prev => ({ ...prev, rateValue: e.target.value }))}
                        className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-base font-bold font-mono text-slate-900 outline-hidden focus:border-teal-700"
                        placeholder="e.g. 2800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-[11px] space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-teal-700" />
                  Live Sync Guarantee:
                </span>
                <p className="text-teal-800">
                  Yeh rates update hote hi calendar me reflect honge aur naye bookings banate waqt automatic apply honge.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsBulkRateModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkRates}
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} />
                <span>Apply Rates to Calendar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
