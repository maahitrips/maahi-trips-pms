import React from 'react';
import { 
  Calendar, 
  Globe2, 
  Plus, 
  ShieldCheck, 
  Menu 
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewBooking: () => void;
  onOpenMobileMenu: () => void;
  activeChannelsCount?: number;
  unverifiedGuestsCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewBooking,
  onOpenMobileMenu,
  activeChannelsCount = 0,
  unverifiedGuestsCount = 0
}) => {
  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
    >
      {/* 1. Desk (Tape Chart / Calendar) */}
      <button
        type="button"
        onClick={() => setActiveTab('desk')}
        className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-colors cursor-pointer ${
          activeTab === 'desk' 
            ? 'text-teal-800 font-bold' 
            : 'text-slate-500 hover:text-slate-800 font-medium'
        }`}
      >
        <Calendar size={19} className={activeTab === 'desk' ? 'stroke-[2.5px] text-teal-800' : 'text-slate-500'} />
        <span className="text-[10px] mt-0.5 tracking-tight">Desk</span>
      </button>

      {/* 2. OTA Channels */}
      <button
        type="button"
        onClick={() => setActiveTab('channels')}
        className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-colors relative cursor-pointer ${
          activeTab === 'channels' 
            ? 'text-teal-800 font-bold' 
            : 'text-slate-500 hover:text-slate-800 font-medium'
        }`}
      >
        <Globe2 size={19} className={activeTab === 'channels' ? 'stroke-[2.5px] text-teal-800' : 'text-slate-500'} />
        <span className="text-[10px] mt-0.5 tracking-tight">Channels</span>
        {activeChannelsCount > 0 && (
          <span className="absolute top-0.5 right-4 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
        )}
      </button>

      {/* 3. Center Elevated + BOOK Button */}
      <div className="flex-1 flex justify-center -mt-5">
        <button
          type="button"
          onClick={onOpenNewBooking}
          className="w-12 h-12 rounded-full bg-teal-800 hover:bg-teal-900 active:scale-95 text-white flex items-center justify-center shadow-lg ring-4 ring-white transition-all cursor-pointer"
          title="New Booking / Check-in"
          aria-label="Create New Booking"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      {/* 4. Guest KYC Vault */}
      <button
        type="button"
        onClick={() => setActiveTab('kyc_vault')}
        className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-colors relative cursor-pointer ${
          activeTab === 'kyc_vault' 
            ? 'text-teal-800 font-bold' 
            : 'text-slate-500 hover:text-slate-800 font-medium'
        }`}
      >
        <ShieldCheck size={19} className={activeTab === 'kyc_vault' ? 'stroke-[2.5px] text-teal-800' : 'text-slate-500'} />
        <span className="text-[10px] mt-0.5 tracking-tight">KYC ID</span>
        {unverifiedGuestsCount > 0 && (
          <span className="absolute top-0.5 right-4 text-[9px] font-bold bg-amber-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center ring-2 ring-white">
            {unverifiedGuestsCount}
          </span>
        )}
      </button>

      {/* 5. Menu Drawer */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className={`flex flex-col items-center justify-center flex-1 py-1 rounded-lg transition-colors cursor-pointer ${
          ['housekeeping', 'invoices', 'gmail', 'settings', 'analytics'].includes(activeTab)
            ? 'text-teal-800 font-bold' 
            : 'text-slate-500 hover:text-slate-800 font-medium'
        }`}
      >
        <Menu size={19} className={['housekeeping', 'invoices', 'gmail', 'settings', 'analytics'].includes(activeTab) ? 'stroke-[2.5px] text-teal-800' : 'text-slate-500'} />
        <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
      </button>
    </nav>
  );
};
