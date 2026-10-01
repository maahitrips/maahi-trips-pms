import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  BarChart3, 
  Globe, 
  ShieldCheck, 
  BedDouble, 
  Receipt, 
  Settings, 
  Building2, 
  ChevronDown, 
  ChevronsLeft,
  ChevronsRight,
  Plus,
  HelpCircle,
  Sparkles,
  Users,
  Mail,
  X,
  Smartphone,
  Check,
  Trash2,
  Lock
} from 'lucide-react';
import { Hotel, UserAccount, HotelProfile } from '../types';
import { 
  canUserAddProperty, 
  getAccessibleHotels, 
  isSuperAdminUser, 
  isPropertyOwnerUser, 
  isStaffUser 
} from '../utils/permissionHelper';

export type ActiveTab = 'desk' | 'analytics' | 'channels' | 'kyc_vault' | 'housekeeping' | 'invoices' | 'gmail' | 'gemini_assistant' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  propertyName: string;
  hotelProfile?: HotelProfile;
  hotels?: Hotel[];
  activeHotelId?: string;
  onSelectHotel?: (hotelId: string) => void;
  hotelsCount?: number;
  currentUser?: UserAccount | null;
  isSuperAdmin?: boolean;
  onOpenAddHotel?: () => void;
  onRequestDeleteHotel?: (hotel: Hotel) => void;
  onNavigateToSettingsHotels?: () => void;
  onNewBookingClick?: () => void;
  onOpenLogin?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenInstallModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  propertyName,
  hotelProfile,
  hotels = [],
  activeHotelId = 'hotel-bighouse',
  onSelectHotel,
  hotelsCount = 1,
  currentUser,
  isSuperAdmin = false,
  onOpenAddHotel,
  onRequestDeleteHotel,
  onNavigateToSettingsHotels,
  onNewBookingClick,
  onOpenLogin,
  isMobileOpen = false,
  onCloseMobile,
  onOpenInstallModal
}) => {
  const [isPropertyMenuOpen, setIsPropertyMenuOpen] = useState(false);
  const propertyMenuRef = useRef<HTMLDivElement>(null);

  const isSuper = isSuperAdminUser(currentUser);
  const isOwner = isPropertyOwnerUser(currentUser);
  const isStaff = isStaffUser(currentUser);
  const propertyAddCheck = canUserAddProperty(currentUser, hotels);
  const accessibleHotels = getAccessibleHotels(currentUser, hotels);
  const activeHotel = hotels.find(h => h.id === activeHotelId);

  // Close property dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (propertyMenuRef.current && !propertyMenuRef.current.contains(e.target as Node)) {
        setIsPropertyMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    {
      group: 'DASHBOARDS',
      items: [
        { id: 'desk', label: 'Desk', sublabel: 'Front desk booking calendar', icon: Calendar },
        { id: 'channels', label: 'OTA Channels', sublabel: '2-way Channel Manager', icon: Globe, badge: '5 Active' },
        { id: 'kyc_vault', label: 'Guest ID Vault', sublabel: 'ID Proofs & KYC Police Form', icon: ShieldCheck, badge: 'KYC' },
        { id: 'analytics', label: 'Analytics', sublabel: 'Occupancy & Revenue', icon: BarChart3 },
      ]
    },
    {
      group: 'OPERATIONS',
      items: [
        { id: 'housekeeping', label: 'Housekeeping', sublabel: 'Room cleanliness & status', icon: BedDouble },
        { id: 'invoices', label: 'Billing & Folios', sublabel: 'GST Invoices & GRC Cards', icon: Receipt },
        { id: 'gmail', label: 'Gmail & Vouchers', sublabel: 'Guest vouchers & inquiries', icon: Mail, badge: 'Gmail' },
      ]
    },
    {
      group: 'AI INTELLIGENCE',
      items: [
        { id: 'gemini_assistant', label: 'Gemini AI Assistant', sublabel: 'Maps & Search Grounded Chat', icon: Sparkles, badge: 'Live AI' },
      ]
    },
    {
      group: 'ADMINISTRATION',
      items: [
        { id: 'settings', label: 'Settings', sublabel: 'Property & Tax config', icon: Settings },
      ]
    }
  ];

  const handleNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderContent = (isMobileView: boolean) => (
    <>
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center font-bold text-white text-lg shadow-md shrink-0">
            M
          </div>
          {(!collapsed || isMobileView) && (
            <div className="leading-tight truncate">
              <div className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
                Maahi Trips
                <span className="text-[10px] bg-teal-900/80 text-teal-300 font-semibold px-1.5 py-0.5 rounded">PMS</span>
              </div>
              <div className="text-xs text-slate-400 truncate">Hotel Cloud Suite</div>
            </div>
          )}
        </div>

        {isMobileView ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        ) : (
          <button
            id="toggle-sidebar-btn"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        )}
      </div>

      {/* Property Selector & Multi-Hotel Management (Moved to Left Side Panel) */}
      <div className="p-3 border-b border-slate-800/80 shrink-0" ref={propertyMenuRef}>
        {collapsed && !isMobileView ? (
          <div 
            onClick={() => setCollapsed(false)}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-teal-400 border border-slate-700/80 cursor-pointer transition-colors"
            title={`${activeHotel?.name || propertyName} • Click to expand hotel options`}
          >
            <Building2 size={20} />
            <span className="text-[9px] font-black text-slate-300 mt-1 uppercase">
              {activeHotel?.code || 'BHI'}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Active Property Card Tile */}
            <div 
              id="sidebar-property-selector"
              onClick={() => setIsPropertyMenuOpen(prev => !prev)}
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/90 transition-all cursor-pointer shadow-xs group"
              title="Click to Switch Hotel Property or Manage Properties"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-xs truncate leading-snug">
                      {hotelProfile?.name || activeHotel?.name || propertyName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate leading-tight font-medium mt-0.5">
                      {hotelProfile?.city || activeHotel?.city || 'Calangute, Goa'} {activeHotel?.code ? `• ${activeHotel.code}` : ''}
                    </div>
                  </div>
                </div>
                <ChevronDown 
                  size={15} 
                  className={`text-slate-400 group-hover:text-white transition-transform shrink-0 ${
                    isPropertyMenuOpen ? 'rotate-180 text-teal-400' : ''
                  }`} 
                />
              </div>
            </div>

            {/* Quick "+ Add Property" button */}
            {!isStaff && onOpenAddHotel && (
              <button
                type="button"
                id="sidebar-btn-add-property"
                onClick={() => {
                  onOpenAddHotel();
                  if (isMobileView && onCloseMobile) onCloseMobile();
                }}
                className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border shadow-2xs ${
                  isOwner && propertyAddCheck.currentCount >= 5
                    ? 'bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border-amber-800/80'
                    : 'bg-teal-950/70 hover:bg-teal-900/80 text-teal-300 border-teal-800/80 hover:border-teal-600'
                }`}
                title={isOwner ? `Owned Properties: ${propertyAddCheck.currentCount}/5` : 'Add New Property to Portfolio'}
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>
                  {isOwner && propertyAddCheck.currentCount >= 5
                    ? 'Property Quota Full (5/5)'
                    : isOwner
                    ? `+ Add Property (${propertyAddCheck.currentCount}/5)`
                    : '+ Add Property'}
                </span>
              </button>
            )}

            {/* Expandable Property Switcher Dropdown */}
            {isPropertyMenuOpen && (
              <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-2 space-y-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span>Switch Hotel ({accessibleHotels.length})</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    isSuper ? 'bg-amber-900 text-amber-200' : isOwner ? 'bg-blue-900 text-blue-200' : 'bg-teal-900 text-teal-200'
                  }`}>
                    {isSuper ? 'Admin' : isOwner ? 'Owner' : 'Staff'}
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 py-1 scrollbar-thin">
                  {accessibleHotels.map(h => {
                    const isCurrent = h.id === activeHotelId;
                    return (
                      <div
                        key={h.id}
                        onClick={() => {
                          if (onSelectHotel) onSelectHotel(h.id);
                          setIsPropertyMenuOpen(false);
                          if (isMobileView && onCloseMobile) onCloseMobile();
                        }}
                        className={`p-2 rounded-lg flex items-center justify-between text-left cursor-pointer transition-colors ${
                          isCurrent 
                            ? 'bg-teal-900/60 border border-teal-700/80 text-white' 
                            : 'hover:bg-slate-800 text-slate-300 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                            isCurrent ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {h.code || 'HTL'}
                          </span>
                          <div className="truncate">
                            <div className="font-bold text-xs truncate">{h.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{h.city}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-1.5">
                          {isCurrent && <Check size={14} className="text-teal-400" />}
                          {isSuper && onRequestDeleteHotel && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsPropertyMenuOpen(false);
                                onRequestDeleteHotel(h);
                              }}
                              className="p-1 hover:text-rose-400 text-slate-500 rounded transition-colors"
                              title="Delete Hotel"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {onNavigateToSettingsHotels && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPropertyMenuOpen(false);
                      onNavigateToSettingsHotels();
                      if (isMobileView && onCloseMobile) onCloseMobile();
                    }}
                    className="w-full text-center py-1 text-[10px] text-slate-400 hover:text-teal-300 transition-colors font-semibold"
                  >
                    Manage Properties in Settings →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prominent "+ New Booking" Primary Action Button in Sidebar */}
      {onNewBookingClick && (
        <div className="px-3 pt-2 pb-1 shrink-0">
          <button
            type="button"
            id="sidebar-btn-new-booking"
            onClick={() => {
              onNewBookingClick();
              if (isMobileView && onCloseMobile) onCloseMobile();
            }}
            className={`w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
              collapsed && !isMobileView ? 'p-2.5' : 'py-2.5 px-3 text-xs'
            }`}
            title="Create New Front Desk or Walk-in Booking"
          >
            <Plus size={16} strokeWidth={2.5} />
            {(!collapsed || isMobileView) && <span>New Booking</span>}
          </button>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin">
        {navItems.map((group) => (
          <div key={group.group} className="space-y-1">
            {(!collapsed || isMobileView) && (
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                {group.group}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleNavClick(item.id as ActiveTab)}
                  title={collapsed && !isMobileView ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative cursor-pointer ${
                    isActive 
                      ? 'bg-teal-600 text-white shadow-sm font-semibold' 
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  } ${collapsed && !isMobileView ? 'justify-center' : 'justify-between'}`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon size={19} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400 transition-colors'} />
                    {(!collapsed || isMobileView) && (
                      <span className="truncate text-left">{item.label}</span>
                    )}
                  </div>
                  {(!collapsed || isMobileView) && item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-teal-950 text-teal-300 border border-teal-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Install Mobile App Prompt in Sidebar */}
      {(!collapsed || isMobileView) && onOpenInstallModal && (
        <div className="px-3 pb-2 pt-1 shrink-0">
          <button
            type="button"
            onClick={onOpenInstallModal}
            className="w-full p-2.5 bg-gradient-to-r from-teal-900/90 to-slate-800 border border-teal-700/60 hover:border-teal-400 rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer group shadow-2xs"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-600 group-hover:bg-teal-500 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Smartphone size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate">Install Mobile App</span>
                <span className="text-[9px] bg-teal-400/20 text-teal-300 font-bold px-1.5 py-0.2 rounded">PWA</span>
              </div>
              <p className="text-[10px] text-teal-200/70 truncate">Android &amp; iOS 10s</p>
            </div>
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 text-center shrink-0">
        {!collapsed || isMobileView ? (
          <div>
            <div className="flex items-center justify-center gap-1 text-slate-400 font-medium mb-0.5">
              <Sparkles size={12} className="text-teal-400" />
              <span>Two-Way OTA Connected</span>
            </div>
            <p className="text-[10px] text-slate-500">© 2016-2026 Maahi Trips • v2.0.4</p>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-teal-400">v2.0</span>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar (Hidden on mobile) */}
      <aside 
        id="pms-sidebar-desktop"
        className={`hidden md:flex bg-slate-900 text-slate-200 border-r border-slate-800 flex-col transition-all duration-300 select-none z-30 shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderContent(false)}
      </aside>

      {/* 2. Mobile Drawer & Backdrop (Rendered on mobile when open) */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Slide-over Drawer */}
          <aside 
            id="pms-sidebar-mobile"
            className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-200 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250 select-none"
          >
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
