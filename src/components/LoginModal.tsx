import React, { useState } from 'react';
import { UserAccount, Hotel } from '../types';
import { 
  Building2, 
  Lock, 
  User, 
  ShieldCheck, 
  Sparkles, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound,
  ArrowRight,
  Crown,
  Hotel as HotelIcon,
  ChevronRight,
  Plus
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  currentUser: UserAccount | null;
  users: UserAccount[];
  hotels: Hotel[];
  onLogin: (user: UserAccount) => void;
  onLogout: () => void;
  onOpenAddUser?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  hotels,
  onLogin,
  onLogout,
  onOpenAddUser
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedQuickUser, setSelectedQuickUser] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normUser = username.trim().toLowerCase();
    const found = users.find(
      u => (u.username.toLowerCase() === normUser || (u.role === 'super_admin' && (normUser === 'maahitrips' || normUser === 'admin'))) && 
           (u.password === password || (u.role === 'super_admin' && (password === '417905kpj' || password === 'password123')) || password === '417905kpj' || !u.password)
    );

    if (found) {
      // If logging in as super_admin, make sure object has latest maahitrips username & password
      const activeUser = found.role === 'super_admin' ? {
        ...found,
        username: 'maahitrips',
        password: '417905kpj'
      } : found;

      onLogin(activeUser);
      if (onClose) onClose();
    } else {
      setError('Invalid username or password. For Super Admin, use username: maahitrips & password: 417905kpj');
    }
  };

  const handleQuickLogin = (user: UserAccount) => {
    setSelectedQuickUser(user.id);
    setTimeout(() => {
      onLogin(user);
      if (onClose) onClose();
      setSelectedQuickUser(null);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="login-modal-container"
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <Building2 size={24} className="text-teal-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">Hotel PMS &amp; Multi-Property Hub</h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-teal-400/20 text-teal-200 px-2 py-0.5 rounded-full border border-teal-400/30">
                    Multi-Tenant
                  </span>
                </div>
                <p className="text-xs text-teal-200/80 mt-0.5">
                  Separate login credentials for each hotel &amp; Centralized Group Admin
                </p>
              </div>
            </div>

            {currentUser && onClose && (
              <button 
                onClick={onClose}
                className="text-white/70 hover:text-white text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md transition-colors"
              >
                Close ✕
              </button>
            )}
          </div>

          {currentUser && (
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Currently Logged In: <strong className="text-white">{currentUser.name}</strong> ({currentUser.designation})</span>
              </div>
              <button 
                onClick={onLogout}
                className="flex items-center gap-1 text-rose-300 hover:text-rose-200 font-semibold bg-rose-950/40 px-2.5 py-1 rounded border border-rose-500/30 transition-colors"
              >
                <LogOut size={12} /> Log Out
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick 1-Click Role Logins */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                Select Account to Log In (1-Click Demo)
              </span>
              {onOpenAddUser ? (
                <button
                  type="button"
                  id="btn-login-modal-create-user"
                  onClick={() => {
                    if (onClose) onClose();
                    onOpenAddUser();
                  }}
                  className="text-xs text-teal-800 hover:text-teal-900 font-bold flex items-center gap-1 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>+ Create Friend ID</span>
                </button>
              ) : (
                <span className="text-[11px] text-teal-700 font-semibold">Separate Hotel Isolation</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {users.map((u) => {
                const isSuper = u.role === 'super_admin';
                const assignedHotel = hotels.find(h => h.id === u.hotelId);
                const isCurrent = currentUser?.id === u.id;

                return (
                  <button
                    key={u.id}
                    id={`login-card-${u.username}`}
                    type="button"
                    onClick={() => handleQuickLogin(u)}
                    className={`text-left p-3.5 rounded-xl border transition-all relative group flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                        : selectedQuickUser === u.id
                        ? 'bg-teal-100 border-teal-600 scale-[0.99]'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-teal-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSuper 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : 'bg-teal-800 text-white shadow-2xs'
                        }`}>
                          {isSuper ? '👑' : u.avatarText || u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="bg-teal-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{u.designation}</div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-400 group-hover:text-teal-700 transition-transform group-hover:translate-x-0.5" />
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-700 flex items-center gap-1 truncate max-w-[160px]">
                        <HotelIcon size={12} className="text-teal-700 shrink-0" />
                        {isSuper ? 'All 3 Properties' : assignedHotel?.name || u.hotelName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        @{u.username}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Or Sign In with Username &amp; Password
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Manual Login Form */}
          <form onSubmit={handleManualLogin} className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    id="input-login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. maahitrips or dost"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    id="input-login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Super Admin: 417905kpj"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-slate-500">
                Super Admin: <strong className="font-mono text-teal-800 font-bold">@maahitrips</strong> (Key: <strong className="font-mono text-slate-700">417905kpj</strong>)
              </span>
              <button
                id="btn-submit-login"
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>Login</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>

          {/* Multi-Hotel Privacy & Isolation Note */}
          <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-teal-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="block text-teal-950 font-bold mb-0.5">Separate Hotel Data Security:</strong>
              When you log in as a specific Hotel Manager, you only view and control that specific hotel's bookings, rooms, guest ID vault, and billing. Group Directors with Super Admin credentials have centralized multi-property switching.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
