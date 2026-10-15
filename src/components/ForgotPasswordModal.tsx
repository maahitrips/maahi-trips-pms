import React, { useState } from 'react';
import { UserAccount } from '../types';
import { KeyRound, User, Phone, CheckCircle2, AlertCircle, ArrowRight, X, ShieldCheck } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  onLoginDirect: (user: UserAccount) => void;
  showToast: (title: string, sub?: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  users = [],
  onLoginDirect,
  showToast
}) => {
  const [query, setQuery] = useState('');
  const [foundUser, setFoundUser] = useState<UserAccount | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFoundUser(null);

    const q = query.trim().toLowerCase();
    if (!q) {
      setError('Please enter your username or mobile phone number.');
      return;
    }

    // 1. Search in users array
    let matched = users.find(u => 
      (u.username || '').toLowerCase() === q || 
      (u.phone || '').includes(q) ||
      (u.name || '').toLowerCase().includes(q)
    );

    // 2. Built-in system fallbacks if not in list
    if (!matched) {
      if (q === 'sadik8806' || q.includes('9648133671') || q.includes('sadik')) {
        matched = {
          id: 'user-sadik8806',
          username: 'sadik8806',
          password: '8806sadik',
          name: 'Partner Sadik',
          designation: 'Partner & Co-Owner',
          role: 'hotel_owner',
          email: 'partner.sadik@gmail.com',
          phone: '+91 96481 33671',
          hotelId: 'hotel-bighouse',
          hotelName: 'Big House Inn (Udaipur)',
          avatarText: 'SK'
        };
      } else if (q === 'manager.udaipur' || q.includes('manager')) {
        matched = {
          id: 'user-bighouse-mgr',
          username: 'manager.udaipur',
          password: '417905kpj',
          name: 'GM Udaipur',
          designation: 'General Manager',
          role: 'hotel_manager',
          email: 'gm.udaipur@bighouseinn.com',
          phone: '+91 96481 33671',
          hotelId: 'hotel-bighouse',
          hotelName: 'Big House Inn (Udaipur)',
          avatarText: 'GM'
        };
      } else if (q === 'maahitrips' || q === 'admin' || q.includes('shahid')) {
        matched = {
          id: 'user-admin',
          username: 'maahitrips',
          password: '417905kpj',
          name: 'Maahi Trips',
          designation: 'Super Admin • Group Managing Director',
          role: 'super_admin',
          email: 'shahidkpj@gmail.com',
          phone: '+91 96481 33671',
          hotelId: 'all',
          hotelName: 'All Properties (Super Admin)',
          avatarText: '👑'
        };
      }
    }

    if (matched) {
      setFoundUser(matched);
      showToast('Account Found!', `Credentials recovered for @${matched.username}`);
    } else {
      setError('No account found matching this username or phone number. Please check with Super Admin (Shahid).');
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-5 relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <KeyRound size={20} className="text-teal-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">Forgot Password Recovery</h3>
              <p className="text-xs text-teal-200/80">Retrieve your PMS login credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {!foundUser ? (
            <form onSubmit={handleSearch} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered <strong>Username</strong> (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-bold">manager.udaipur</code>) or your <strong>Mobile Number</strong> to retrieve your login password.
              </p>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Username or Mobile Number
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. manager.udaipur or 9648133671"
                    className="w-full pl-11 pr-3 py-2.5 text-sm font-bold text-slate-950 bg-white border-2 border-slate-300 rounded-xl focus:border-teal-700 focus:ring-3 focus:ring-teal-500/20 outline-hidden transition-all"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Retrieve Credentials</span>
                  <ArrowRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5 text-xs text-emerald-950">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm border-b border-emerald-200 pb-2">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>Account Found Successfully!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block">Name &amp; Role</span>
                    <strong className="text-slate-900 text-sm">{foundUser.name}</strong>
                    <div className="text-[11px] text-slate-500">{foundUser.designation}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block">Hotel Property</span>
                    <strong className="text-teal-900">{foundUser.hotelName || 'Assigned Property'}</strong>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-1 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Username:</span>
                    <strong className="font-mono text-slate-950">@{foundUser.username}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px]">Password:</span>
                    <strong className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-sm">
                      {foundUser.password || 'password123'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onLoginDirect(foundUser);
                    onClose();
                  }}
                  className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Sign In Immediately as {foundUser.name}</span>
                  <ArrowRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
                >
                  Close &amp; Back to Login
                </button>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck size={13} className="text-teal-700" />
            <span>Need further assistance? Contact Super Admin Shahid (+91 96481 33671)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
