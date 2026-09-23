import React from 'react';
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
  PlusCircle,
  HelpCircle,
  Sparkles,
  Users,
  Mail,
  X
} from 'lucide-react';

export type ActiveTab = 'desk' | 'analytics' | 'channels' | 'kyc_vault' | 'housekeeping' | 'invoices' | 'gmail' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  propertyName: string;
  hotelsCount?: number;
  isSuperAdmin?: boolean;
  onOpenAddHotel?: () => void;
  onOpenLogin?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  propertyName,
  hotelsCount = 1,
  isSuperAdmin = false,
  onOpenAddHotel,
  onOpenLogin,
  isMobileOpen = false,
  onCloseMobile
}) => {
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

      {/* Property Selector Tile */}
      <div className="p-3 border-b border-slate-800/80 shrink-0">
        <div 
          onClick={() => {
            if (isSuperAdmin && onOpenAddHotel) {
              onOpenAddHotel();
              if (isMobileView && onCloseMobile) onCloseMobile();
            }
          }}
          className={`flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 transition-colors ${
            collapsed && !isMobileView ? 'justify-center' : 'justify-between'
          } hover:bg-slate-800 cursor-pointer`}
          title={`${hotelsCount} Hotel Properties Active - Click to Add Hotel`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Building2 size={18} className="text-teal-400 shrink-0" />
            {(!collapsed || isMobileView) && (
              <div className="truncate text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <span>Hotel Property</span>
                  {hotelsCount > 1 && (
                    <span className="bg-teal-900/90 text-teal-200 px-1.5 rounded text-[9px] font-mono">
                      {hotelsCount} Active
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-white truncate">{propertyName}</div>
              </div>
            )}
          </div>
          {(!collapsed || isMobileView) && (
            <span className="text-[10px] bg-slate-700 hover:bg-teal-700 text-slate-200 px-1.5 py-0.5 rounded font-bold transition-colors">
              + Add
            </span>
          )}
        </div>
      </div>

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

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 text-center shrink-0">
        {!collapsed || isMobileView ? (
          <div>
            <div className="flex items-center justify-center gap-1 text-slate-400 font-medium mb-0.5">
              <Sparkles size={12} className="text-teal-400" />
              <span>Two-Way OTA Connected</span>
            </div>
            <p className="text-[10px] text-slate-500">© 2016-2026 Tripmakerz • v2.0.4</p>
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
