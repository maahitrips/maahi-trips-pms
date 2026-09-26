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
  Cloud
} from 'lucide-react';
import { UserAccount, Hotel, HotelProfile } from '../types';
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
  onRequestDeleteHotel?: (hotel: Hotel) => void;
  onNavigateToSettingsHotels?: () => void;
  onOpenMobileMenu?: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onExportBackup?: () => void;
  isCloudConnected?: boolean;
  onOpenCloudSync?: () => void;
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
  onOpenAddHotel,
  onRequestDeleteHotel,
  onNavigateToSettingsHotels,
  onOpenMobileMenu,
  onOpenLogin,
  onLogout,
  onExportBackup,
  isCloudConnected = true,
  onOpenCloudSync
}) => {
  const [isHotelMenuOpen, setIsHotelMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const hotelMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isSuper = isSuperAdminUser(currentUser);
  const isOwner = isPropertyOwnerUser(currentUser);
  const isStaff = isStaffUser(currentUser);
  const propertyAddCheck = canUserAddProperty(currentUser, hotels);
  const accessibleHotels = getAccessibleHotels(currentUser, hotels);
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
      className="h-14 sm:h-16 bg-white border-b border-slate-200 px-2.5 sm:px-4 md:px-6 flex items-center justify-between gap-2 sm:gap-3 shadow-xs sticky top-0 z-20"
    >
      {/* Left side: Mobile Hamburger + Property Selector & New Booking Button */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 min-w-0">
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

        {/* Multi-Hotel Property Selector */}
        <div className="relative" ref={hotelMenuRef}>
          <div 
            id="property-selector-button"
            onClick={() => setIsHotelMenuOpen(prev => !prev)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all shadow-2xs border bg-slate-50 hover:bg-slate-100 border-slate-200 cursor-pointer"
            title="Switch Hotel Property or View Properties"
          >
            <Building2 size={15} className="text-teal-700 shrink-0" />
            <div className="flex flex-col text-left min-w-0">
              <span className="truncate max-w-[105px] xs:max-w-[130px] sm:max-w-[180px] md:max-w-[220px] font-bold text-slate-900 leading-tight">
                {hotelProfile?.name || activeHotel?.name || propertyName}
              </span>
              <span className="text-[10px] text-slate-500 font-normal leading-tight truncate max-w-[105px] xs:max-w-[130px] sm:max-w-[180px]">
                {hotelProfile?.city || activeHotel?.city || 'Property'} • {activeHotel?.code || 'PMS'}
              </span>
            </div>
            <ChevronDown size={13} className={`text-slate-400 shrink-0 transition-transform ${isHotelMenuOpen ? 'rotate-180 text-teal-700' : ''}`} />
          </div>

          {/* Dropdown Menu for Hotel Management */}
          {isHotelMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-80 max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isSuper 
                    ? `Hotel Properties (${hotels.length})` 
                    : isOwner 
                      ? `My Properties (${accessibleHotels.length}/5)` 
                      : 'Assigned Hotel'}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                  isSuper 
                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                    : isOwner 
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : 'bg-teal-100 text-teal-900 border-teal-300'
                }`}>
                  {isSuper ? 'Group Admin' : isOwner ? `Owner (${accessibleHotels.length}/5)` : 'Hotel Staff'}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto py-1">
                {accessibleHotels.map(hotel => {
                  const isCurrent = hotel.id === activeHotelId;
                  return (
                    <div
                      key={hotel.id}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors hover:bg-slate-50 group ${
                        isCurrent ? 'bg-teal-50/80 text-teal-900' : 'text-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectHotel(hotel.id);
                          setIsHotelMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isCurrent ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {hotel.code || 'HTL'}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-xs truncate">{hotel.name}</div>
                          <div className="text-[11px] text-slate-500">{hotel.city}, {hotel.state || ''}</div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isCurrent && (
                          <Check size={16} className="text-teal-700 shrink-0" />
                        )}

                        {isSuper && onRequestDeleteHotel && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsHotelMenuOpen(false);
                              onRequestDeleteHotel(hotel);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={`Delete Property: ${hotel.name} (Super Admin)`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom action in hotel dropdown */}
              {isStaff ? (
                <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-center text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-1.5 rounded-b-xl">
                  <Lock size={12} className="text-slate-400" />
                  <span>Staff Member • Cannot add new property</span>
                </div>
              ) : isOwner ? (
                <div className="p-2 border-t border-slate-100 mt-1">
                  <button
                    id="btn-add-hotel-dropdown"
                    onClick={() => {
                      setIsHotelMenuOpen(false);
                      onOpenAddHotel();
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      propertyAddCheck.currentCount >= 5 
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300' 
                        : 'bg-teal-800 hover:bg-teal-900 text-white'
                    }`}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>
                      {propertyAddCheck.currentCount >= 5 
                        ? 'Quota Reached (5/5 Properties)' 
                        : `Add Property (${propertyAddCheck.currentCount}/5)`}
                    </span>
                  </button>
                </div>
              ) : isSuper ? (
                <div className="p-2 border-t border-slate-100 mt-1 space-y-1">
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
                  {onNavigateToSettingsHotels && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsHotelMenuOpen(false);
                        onNavigateToSettingsHotels();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <Settings size={12} />
                      <span>Manage &amp; Delete Properties in Settings</span>
                    </button>
                  )}
                </div>
              ) : (
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
              )}
            </div>
          )}
        </div>

        {/* Header "+ Add Property" quick button: HIDDEN FOR STAFF */}
        {!isStaff && (
          <button
            id="btn-header-add-property"
            onClick={onOpenAddHotel}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer ${
              isOwner && propertyAddCheck.currentCount >= 5
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200'
            }`}
            title={
              isOwner 
                ? (propertyAddCheck.currentCount >= 5 
                    ? 'Maximum 5 Properties Limit Reached (Contact Super Admin)' 
                    : `Add Property (${propertyAddCheck.currentCount}/5 Allowed)`)
                : 'Add / Register New Hotel Property'
            }
          >
            <Building2 size={14} className={isOwner && propertyAddCheck.currentCount >= 5 ? 'text-amber-700' : 'text-teal-700'} />
            <span>
              {isOwner 
                ? (propertyAddCheck.currentCount >= 5 ? 'Properties: 5/5 (Max)' : `+ Add Property (${propertyAddCheck.currentCount}/5)`) 
                : '+ Add Property'}
            </span>
          </button>
        )}

        {/* Primary "+ New Booking" button matching Maahi Trips styling */}
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

        {/* Multi-Device Cloud Sync Status pill */}
        <div 
          onClick={onOpenCloudSync}
          className={`flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border shrink-0 ${
            isCloudConnected 
              ? 'bg-teal-50 border-teal-200 text-teal-900 hover:bg-teal-100'
              : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
          }`}
          title={isCloudConnected ? "Google Cloud Firestore Real-Time Multi-Device Sync Active" : "Local Storage Only (Offline)"}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCloudConnected ? 'bg-teal-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isCloudConnected ? 'bg-teal-600' : 'bg-amber-600'}`}></span>
          </span>
          <Cloud size={13} className={`${isCloudConnected ? "text-teal-700" : "text-amber-700"} shrink-0`} />
          <span className="hidden sm:inline">{isCloudConnected ? "Cloud Sync Active" : "Local Only"}</span>
          <span className="sm:hidden">{isCloudConnected ? "Cloud" : "Local"}</span>
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

        {/* Mobile Search Icon Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Search Bookings & Rooms"
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        {/* Global Search Bar (matching screenshot search box Ctrl K) */}
        <div 
          id="global-search-trigger"
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-500 text-xs md:text-sm cursor-pointer transition-colors shadow-2xs w-28 sm:w-36 md:w-52"
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
