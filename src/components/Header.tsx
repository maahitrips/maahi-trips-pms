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
  Check,
  Trash2,
  Settings,
  Menu,
  Cloud,
  Smartphone
} from 'lucide-react';
import { UserAccount, Hotel, HotelProfile } from '../types';
import { LastMinuteRuleStatus } from '../utils/pricingHelper';
import { 
  canUserAddProperty, 
  getAccessibleHotels, 
  isSuperAdminUser, 
  isPropertyOwnerUser, 
  isStaffUser 
} from '../utils/permissionHelper';

interface HeaderProps {
  propertyName: string;
  hotelProfile?: HotelProfile;
  onNewBookingClick: (mode?: 'single' | 'multi') => void;
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
  onRestoreHotelData?: (hotelId: string) => void;
  onOpenAddHotel: () => void;
  onRequestDeleteHotel?: (hotel: Hotel) => void;
  onNavigateToSettingsHotels?: () => void;
  onOpenMobileMenu?: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onExportBackup?: () => void;
  isCloudConnected?: boolean;
  onOpenCloudSync?: () => void;
  lastMinuteStatus?: LastMinuteRuleStatus;
  onOpenLastMinuteModal?: () => void;
  onOpenInstallModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  propertyName,
  hotelProfile,
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
  onRestoreHotelData,
  onOpenAddHotel,
  onRequestDeleteHotel,
  onNavigateToSettingsHotels,
  onOpenMobileMenu,
  onOpenLogin,
  onLogout,
  onExportBackup,
  isCloudConnected = true,
  onOpenCloudSync,
  lastMinuteStatus,
  onOpenLastMinuteModal,
  onOpenInstallModal
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPropertyMenuOpen, setIsPropertyMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const propertyMenuRef = useRef<HTMLDivElement>(null);

  const isSuper = isSuperAdminUser(currentUser);
  const isOwner = isPropertyOwnerUser(currentUser);
  const isStaff = isStaffUser(currentUser);
  const propertyAddCheck = canUserAddProperty(currentUser, hotels);
  const accessibleHotels = getAccessibleHotels(currentUser, hotels);
  const activeHotel = hotels.find(h => h.id === activeHotelId);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (propertyMenuRef.current && !propertyMenuRef.current.contains(e.target as Node)) {
        setIsPropertyMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header 
      id="pms-header"
      className="h-14 sm:h-16 bg-white border-b border-slate-200 px-2.5 sm:px-4 md:px-6 flex items-center justify-between gap-2 sm:gap-3 shadow-xs sticky top-0 z-20"
    >
      {/* Left side: Mobile Hamburger + Property Switcher + New Booking Button */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
        {/* Mobile Hamburger Drawer Trigger */}
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden transition-colors cursor-pointer shrink-0"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu size={22} />
          </button>
        )}

        {/* Current Active Property Badge with Interactive Dropdown */}
        <div className="relative" ref={propertyMenuRef}>
          <button 
            type="button"
            onClick={() => setIsPropertyMenuOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-800 shadow-2xs shrink-0 cursor-pointer transition-colors"
            title="Click to Switch Hotel Property or Restore Data"
          >
            <Building2 size={13} className="text-teal-700 shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-[180px] font-bold text-slate-900">
              {hotelProfile?.name || activeHotel?.name || propertyName}
            </span>
            <span className="text-[9px] text-slate-500 font-medium hidden sm:inline">
              • {activeHotel?.city || 'Calangute, Goa'}
            </span>
            <ChevronDown size={12} className={`text-slate-500 transition-transform ${isPropertyMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Interactive Property Switcher Dropdown */}
          {isPropertyMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Switch Hotel Property ({accessibleHotels.length})
                </span>
                {onNavigateToSettingsHotels && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPropertyMenuOpen(false);
                      onNavigateToSettingsHotels();
                    }}
                    className="text-[10px] text-teal-700 hover:text-teal-900 font-bold"
                  >
                    Manage &rarr;
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin">
                {accessibleHotels.map(h => {
                  const isCurrent = h.id === activeHotelId;

                  return (
                    <div
                      key={h.id}
                      onClick={() => {
                        onSelectHotel(h.id);
                        setIsPropertyMenuOpen(false);
                      }}
                      className={`px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-teal-50 text-teal-950 font-bold border-l-4 border-teal-600'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                          isCurrent
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {h.code || 'HTL'}
                        </span>
                        <div className="truncate">
                          <div className="text-xs font-bold truncate flex items-center gap-1">
                            <span>{h.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{h.city || 'India'}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {isCurrent && <Check size={14} className="text-teal-600 shrink-0" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {onOpenAddHotel && !isStaff && (
                <div className="p-2 border-t border-slate-100 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPropertyMenuOpen(false);
                      onOpenAddHotel();
                    }}
                    className="w-full py-1.5 px-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    <span>+ Add New Hotel Property</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary "+ New Booking" & "Multi-Room" buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="btn-new-booking"
            onClick={() => onNewBookingClick('single')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all hover:shadow cursor-pointer"
            title="Single room reservation"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">New Booking</span>
            <span className="sm:hidden">Book</span>
          </button>

          <button
            id="btn-multi-room-booking"
            onClick={() => onNewBookingClick('multi')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/40 text-xs font-semibold rounded-lg shadow-2xs transition-all hover:shadow cursor-pointer"
            title="Multi-Room Group Booking (2+ rooms)"
          >
            <Building size={13} className="text-teal-400" />
            <span className="hidden sm:inline">Multi-Room</span>
          </button>
        </div>

        {/* OTA Channel Live Status pill */}
        <div 
          onClick={onSyncAllOtas}
          className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-medium text-emerald-800 hover:bg-emerald-100 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          title="Click to force 2-Way OTA synchronization across MakeMyTrip, Booking.com, Agoda, Airbnb"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
          </span>
          <Globe2 size={12} className="text-emerald-700 shrink-0" />
          <span>OTA Sync Active ({activeChannelsCount})</span>
          <RefreshCw size={10} className={`text-emerald-600 ${isSyncing ? 'animate-spin' : ''} shrink-0`} />
        </div>

        {/* Multi-Device Cloud Sync Status pill */}
        <div 
          onClick={onOpenCloudSync}
          className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors border shrink-0 whitespace-nowrap ${
            isCloudConnected 
              ? 'bg-teal-50 border-teal-200 text-teal-900 hover:bg-teal-100'
              : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
          }`}
          title={isCloudConnected ? "Google Cloud Firestore Real-Time Multi-Device Sync Active" : "Local Storage Only (Offline)"}
        >
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCloudConnected ? 'bg-teal-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isCloudConnected ? 'bg-teal-600' : 'bg-amber-600'}`}></span>
          </span>
          <Cloud size={12} className={`${isCloudConnected ? "text-teal-700" : "text-amber-700"} shrink-0`} />
          <span className="hidden md:inline">{isCloudConnected ? "Cloud Sync Active" : "Local Only"}</span>
          <span className="md:hidden">{isCloudConnected ? "Cloud" : "Local"}</span>
        </div>

        {/* ⚡ 7:00 AM Last-Minute Flash Rate Pill */}
        {lastMinuteStatus && (
          <div
            onClick={onOpenLastMinuteModal}
            className={`hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors border shrink-0 whitespace-nowrap ${
              lastMinuteStatus.isTriggered
                ? 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100 shadow-2xs'
                : lastMinuteStatus.isPast7Am
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
            }`}
            title={`7:00 AM Last-Minute Automation: ${lastMinuteStatus.statusLabel}`}
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                lastMinuteStatus.isTriggered ? 'bg-rose-400' : lastMinuteStatus.isPast7Am ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                lastMinuteStatus.isTriggered ? 'bg-rose-600' : lastMinuteStatus.isPast7Am ? 'bg-emerald-600' : 'bg-amber-600'
              }`}></span>
            </span>
            <Zap size={12} className={`${lastMinuteStatus.isTriggered ? 'text-rose-600 fill-rose-500' : 'text-slate-500'} shrink-0`} />
            <span>
              {lastMinuteStatus.isTriggered 
                ? `⚡ 7 AM Flash: -${lastMinuteStatus.discountPercent}%` 
                : lastMinuteStatus.isPast7Am 
                ? `🎯 Target Met (${lastMinuteStatus.currentOccupancyPercent}%)` 
                : `⏱️ 7 AM Cutoff Ready`}
            </span>
          </div>
        )}
      </div>

      {/* Right side: Search, Simulate OTA, User Login / Account Switcher */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Quick Simulate OTA Inbound Booking */}
        <button
          id="btn-simulate-ota"
          onClick={onSimulateOtaClick}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
          title="Simulate incoming OTA reservation from MakeMyTrip or Booking.com"
        >
          <Zap size={12} className="text-amber-600 fill-amber-500" />
          <span className="hidden md:inline">Simulate</span> OTA Inflow
        </button>

        {/* Mobile Search Icon Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Search Bookings & Rooms"
          aria-label="Search"
        >
          <Search size={16} />
        </button>

        {/* Global Search Bar (matching screenshot search box Ctrl K) */}
        <div 
          id="global-search-trigger"
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-500 text-xs cursor-pointer transition-colors shadow-2xs w-28 sm:w-36 md:w-44"
        >
          <Search size={13} className="text-slate-400 shrink-0" />
          <span className="truncate text-xs">Search...</span>
          <kbd className="hidden md:inline-block ml-auto text-[9px] bg-white border border-slate-200 px-1 py-0.5 rounded font-mono text-slate-400">
            Ctrl K
          </kbd>
        </div>

        {/* 👑 Super Admin Quick Access Pill/Button in Header */}
        {isSuper ? (
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-[11px] font-semibold shadow-2xs shrink-0">
            <span>👑</span>
            <span>Super Admin</span>
          </div>
        ) : (
          <button
            type="button"
            id="btn-header-super-admin-login"
            onClick={onOpenLogin}
            className="flex items-center gap-1 px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400 hover:border-amber-500 text-amber-950 rounded-lg text-[11px] font-semibold transition-all shadow-2xs cursor-pointer shrink-0"
            title="Login as Super Admin (Maahi Trips)"
          >
            <span>👑</span>
            <span className="hidden sm:inline">Super Admin</span>
            <span className="sm:hidden">Admin</span>
          </button>
        )}

        {/* User Account / Login Avatar Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            id="btn-user-avatar"
            onClick={() => setIsUserMenuOpen(prev => !prev)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title={currentUser ? `${currentUser.name} (${currentUser.designation})` : 'Login / Switch Account'}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs border transition-all ${
              isSuper 
                ? 'bg-amber-100 text-amber-900 border-amber-300' 
                : isOwner
                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                  : 'bg-teal-800 text-white border-teal-900'
            }`}>
              {isSuper ? '👑' : isOwner ? '🏨' : currentUser?.avatarText || currentUser?.name.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.name || (isSuper ? 'Maahi Trips' : isOwner ? 'Property Owner' : 'Hotel Staff')}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight">
                {isSuper ? 'Super Admin' : isOwner ? 'Property Owner' : 'Hotel Staff'}
              </span>
            </div>
            <ChevronDown size={12} className="hidden xl:inline text-slate-400" />
          </button>

          {/* User Account Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-2">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                    isSuper ? 'bg-amber-200 text-amber-900' : isOwner ? 'bg-blue-200 text-blue-900' : 'bg-teal-800 text-white'
                  }`}>
                    {isSuper ? '👑' : isOwner ? '🏨' : currentUser?.avatarText || 'VR'}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{currentUser?.name || (isSuper ? 'Maahi Trips' : 'User')}</div>
                    <div className="text-[11px] text-slate-500">{currentUser?.designation || (isSuper ? 'Super Admin' : isOwner ? 'Property Owner' : 'Staff')}</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-slate-200">
                  <div>Access: <strong className="text-teal-900">{isSuper ? 'All Properties (Super Admin)' : isOwner ? `${accessibleHotels.length} Properties (Max 5)` : activeHotel?.name}</strong></div>
                  <div>Username: <strong className="font-mono text-slate-700">@{currentUser?.username || (isSuper ? 'maahitrips' : 'user')}</strong></div>
                  {isOwner && (
                    <div className="text-[10px] font-semibold text-amber-800 pt-0.5">
                      Quota: {propertyAddCheck.currentCount} of 5 properties used
                    </div>
                  )}
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

                {!isStaff && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenAddHotel();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center gap-2 font-medium text-slate-700 transition-colors"
                  >
                    <Plus size={15} className="text-teal-700" />
                    <span>{isOwner ? `Add Property (${propertyAddCheck.currentCount}/5)` : 'Add Another Hotel'}</span>
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
