import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  RefreshCw, 
  Zap, 
  Bell, 
  CheckCircle2, 
  Globe2,
  CalendarDays,
  ChevronDown,
  Lock,
  Crown,
  LogOut,
  User,
  ShieldCheck,
  Download,
  Hotel as HotelIcon,
  Check
} from 'lucide-react';
import { UserAccount, Hotel } from '../types';

interface HeaderProps {
  propertyName: string;
  onNewBookingClick: () => void;
  onSimulateOtaClick: () => void;
  onSyncAllOtas: () => void;
  onOpenSearch: () => void;
  isSyncing: boolean;
  activeChannelsCount: number;
  // Multi-Hotel & Multi-User Props
  currentUser: UserAccount | null;
  hotels: Hotel[];
  activeHotelId: string;
  onSelectHotel: (hotelId: string) => void;
  onOpenAddHotel: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onExportBackup?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  propertyName,
  onNewBookingClick,
  onSimulateOtaClick,
  onSyncAllOtas,
  onOpenSearch,
  isSyncing,
  activeChannelsCount,
  currentUser,
  hotels,
  activeHotelId,
  onSelectHotel,
  onOpenAddHotel,
  onOpenLogin,
  onLogout,
  onExportBackup
}) => {
  const [isHotelMenuOpen, setIsHotelMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const hotelMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'hotel_owner';
  const activeHotel = hotels.find(h => h.id === activeHotelId);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (hotelMenuRef.current && !hotelMenuRef.current.contains(e.target as Node)) {
        setIsHotelMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header 
      id="pms-header"
      className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-3 shadow-xs sticky top-0 z-20"
    >
      {/* Left side: Property Selector & New Booking Button */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Multi-Hotel Property Selector */}
        <div className="relative" ref={hotelMenuRef}>
          <div 
            id="property-selector-button"
            onClick={() => setIsHotelMenuOpen(prev => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all shadow-2xs border bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer"
            title="Switch Hotel Property or Add New Hotel"
          >
            <Building2 size={16} className="text-teal-700 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="truncate max-w-[130px] sm:max-w-[180px] md:max-w-[220px] font-bold text-slate-900 leading-tight">
                {activeHotel?.name || propertyName}
              </span>
              <span className="text-[10px] text-slate-500 font-normal leading-tight">
                {activeHotel?.city || 'Property'} • {activeHotel?.code || 'PMS'}
              </span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isHotelMenuOpen ? 'rotate-180 text-teal-700' : ''}`} />
          </div>

          {/* Dropdown Menu for Hotel Management */}
          {isHotelMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isSuperAdmin ? `Hotel Properties (${hotels.length})` : 'My Hotel Property'}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                  isSuperAdmin ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-teal-100 text-teal-900 border-teal-300'
                }`}>
                  {isSuperAdmin ? 'Group Admin' : 'Hotel Partner'}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto py-1">
                {(isSuperAdmin ? hotels : hotels.filter(h => h.id === activeHotelId || h.id === currentUser?.hotelId)).map(hotel => {
                  const isCurrent = hotel.id === activeHotelId;
                  return (
                    <button
                      key={hotel.id}
                      onClick={() => {
                        onSelectHotel(hotel.id);
                        setIsHotelMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 text-left flex items-center justify-between transition-colors hover:bg-slate-50 ${
                        isCurrent ? 'bg-teal-50/80 text-teal-900' : 'text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isCurrent ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {hotel.code || 'HTL'}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-xs truncate">{hotel.name}</div>
                          <div className="text-[11px] text-slate-500">{hotel.city}, {hotel.state || ''}</div>
                        </div>
                      </div>

                      {isCurrent && (
                        <Check size={16} className="text-teal-700 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-2 border-t border-slate-100 mt-1">
                <button
                  id="btn-add-hotel-dropdown"
                  onClick={() => {
                    setIsHotelMenuOpen(false);
                    onOpenAddHotel();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>Add New Hotel Property</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Header "+ Add Property" quick button */}
        <button
          id="btn-header-add-property"
          onClick={onOpenAddHotel}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
          title="Add / Register Your Hotel Property"
        >
          <Building2 size={14} className="text-teal-700" />
          <span>+ Add Property</span>
        </button>

        {/* Primary "+ New Booking" button matching Tripmakerz screenshot styling */}
        <button
          id="btn-new-booking"
          onClick={onNewBookingClick}
          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-3.5 py-2 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white text-xs md:text-sm font-bold rounded-lg shadow-sm transition-all hover:shadow cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">New Booking</span>
          <span className="sm:hidden">Book</span>
        </button>

        {/* OTA Channel Live Status pill */}
        <div 
          onClick={onSyncAllOtas}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 hover:bg-emerald-100 cursor-pointer transition-colors"
          title="Click to force 2-Way OTA synchronization across MakeMyTrip, Booking.com, Agoda, Airbnb"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <Globe2 size={14} className="text-emerald-700" />
          <span>OTA Sync Active ({activeChannelsCount})</span>
          <RefreshCw size={12} className={`text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
        </div>
      </div>

      {/* Right side: Search, Simulate OTA, User Login / Account Switcher */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick Simulate OTA Inbound Booking */}
        <button
          id="btn-simulate-ota"
          onClick={onSimulateOtaClick}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          title="Simulate incoming OTA reservation from MakeMyTrip or Booking.com"
        >
          <Zap size={14} className="text-amber-600 fill-amber-500" />
          <span className="hidden md:inline">Simulate</span> OTA Inflow
        </button>

        {/* Global Search Bar (matching screenshot search box Ctrl K) */}
        <div 
          id="global-search-trigger"
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-500 text-xs md:text-sm cursor-pointer transition-colors shadow-2xs w-28 sm:w-36 md:w-52"
        >
          <Search size={15} className="text-slate-400 shrink-0" />
          <span className="truncate">Search...</span>
          <kbd className="hidden md:inline-block ml-auto text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-400">
            Ctrl K
          </kbd>
        </div>

        {/* User Account / Login Avatar Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            id="btn-user-avatar"
            onClick={() => setIsUserMenuOpen(prev => !prev)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title={currentUser ? `${currentUser.name} (${currentUser.designation})` : 'Login / Switch Account'}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs border transition-all ${
              isSuperAdmin 
                ? 'bg-amber-100 text-amber-900 border-amber-300' 
                : 'bg-teal-800 text-white border-teal-900'
            }`}>
              {isSuperAdmin ? '👑' : currentUser?.avatarText || currentUser?.name.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.name || 'Shahid'}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight">
                {isSuperAdmin ? 'Group Admin' : 'Hotel Staff'}
              </span>
            </div>
            <ChevronDown size={12} className="hidden xl:inline text-slate-400" />
          </button>

          {/* User Account Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-2">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                    isSuperAdmin ? 'bg-amber-200 text-amber-900' : 'bg-teal-800 text-white'
                  }`}>
                    {isSuperAdmin ? '👑' : currentUser?.avatarText || 'VR'}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{currentUser?.name || 'Shahid'}</div>
                    <div className="text-[11px] text-slate-500">{currentUser?.designation || 'Administrator'}</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-slate-200">
                  <div>Access: <strong className="text-teal-900">{isSuperAdmin ? 'All Properties' : activeHotel?.name}</strong></div>
                  <div>Username: <strong className="font-mono text-slate-700">@{currentUser?.username || 'admin'}</strong></div>
                </div>
              </div>

              <div className="space-y-1">
                <button
                  id="btn-switch-account"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium text-slate-700 transition-colors"
                >
                  <ShieldCheck size={15} className="text-teal-700" />
                  <span>Switch Account / Change Login</span>
                </button>

                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenAddHotel();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium text-slate-700 transition-colors"
                  >
                    <Plus size={15} className="text-teal-700" />
                    <span>Add Another Hotel</span>
                  </button>
                )}

                {onExportBackup && (
                  <button
                    id="btn-export-backup"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onExportBackup();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium text-slate-700 transition-colors"
                    title="Export backup of all hotel records (Rooms, Bookings, KYC)"
                  >
                    <Download size={15} className="text-emerald-700" />
                    <span>Download All Data Backup (JSON)</span>
                  </button>
                )}

                <div className="border-t border-slate-100 pt-1 mt-1">
                  <button
                    id="btn-logout"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-700 flex items-center gap-2 font-semibold transition-colors"
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
