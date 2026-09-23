import React, { useState } from 'react';
import { UserAccount, Hotel } from '../types';
import { 
  UserPlus, 
  X, 
  KeyRound, 
  User, 
  Lock, 
  Phone, 
  Mail, 
  Building2, 
  Check, 
  Copy, 
  Sparkles, 
  ShieldCheck, 
  Share2 
} from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (newUser: UserAccount) => void;
  hotels: Hotel[];
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onAddUser,
  hotels
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 9');
  const [designation, setDesignation] = useState('Hotel Partner & Owner');
  const [assignedHotelId, setAssignedHotelId] = useState<'new' | string>('new');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    const cleanSlug = val.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
    if (cleanSlug && !username) {
      setUsername(`${cleanSlug}.hotel`);
    }
    if (cleanSlug && !email) {
      setEmail(`${cleanSlug}@gmail.com`);
    }
  };

  const handleCopyCredentials = () => {
    const text = `🏨 *Maahi Trips PMS Login Details:*\n👤 *Name:* ${name || 'Friend'}\n🔑 *Username:* ${username}\n🔒 *Password:* ${password}\n🌐 *Role:* ${designation}\n\n👉 *Login Link:* ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!name.trim()) {
      setError('Please enter friend/partner name');
      return;
    }
    if (!cleanUsername) {
      setError('Please enter a username');
      return;
    }

    const assignedHotel = hotels.find(h => h.id === assignedHotelId);

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      password: password.trim() || 'password123',
      name: name.trim(),
      designation: designation.trim() || 'Hotel Partner',
      role: 'hotel_manager',
      email: email.trim() || `${cleanUsername}@gmail.com`,
      phone: phone.trim(),
      hotelId: assignedHotelId === 'new' ? '' : assignedHotelId,
      hotelName: assignedHotelId === 'new' ? 'Will Add Own Property' : (assignedHotel?.name || 'Assigned Property'),
      avatarText: name.trim().slice(0, 2).toUpperCase()
    };

    onAddUser(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="create-user-modal-container"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <UserPlus size={20} className="text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Create Friend / Partner Login</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-teal-400/20 text-teal-200 px-2 py-0.5 rounded-full border border-teal-400/30">
                  Separate Access
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                Setup separate login ID &amp; password for your friend or hotelier
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Helper banner */}
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-start gap-2">
            <Sparkles size={16} className="text-teal-700 shrink-0 mt-0.5" />
            <div>
              <strong>Dost ke liye ID banayein:</strong> Login karte hi aapka dost "+ Add Property" par click karke apni hotel details fill karega aur rooms add karega.
            </div>
          </div>

          {/* Friend Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Friend / Partner Full Name *</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Rahul Verma or Farhan Khan"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Username */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Login Username *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="e.g. rahul.hotel"
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Login Password *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password123"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Phone */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone / WhatsApp Number</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 96481 33671"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Designation */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Role / Designation</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold"
              />
            </div>
          </div>

          {/* Hotel Property Assignment */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Initial Hotel Property Assignment</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-teal-300 bg-teal-50/50 cursor-pointer">
                <input
                  type="radio"
                  name="hotelAssignment"
                  checked={assignedHotelId === 'new'}
                  onChange={() => setAssignedHotelId('new')}
                  className="text-teal-700"
                />
                <div>
                  <span className="font-bold text-teal-950 block">None (Friend will click "+ Add Property" to setup)</span>
                  <span className="text-[11px] text-teal-700">Friend will add their own property name, address, GST, and rooms.</span>
                </div>
              </label>

              {hotels.map(h => (
                <label key={h.id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="hotelAssignment"
                    checked={assignedHotelId === h.id}
                    onChange={() => setAssignedHotelId(h.id)}
                    className="text-teal-700"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Assign to existing: {h.name}</span>
                    <span className="text-[10px] text-slate-500">{h.city} • Code: {h.code}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Quick Copy Preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Share with Friend:</span>
              <div className="font-mono text-slate-700 font-bold text-[11px]">
                Username: @{username || 'username'} | Pass: {password}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : 'Copy Info'}</span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              id="btn-save-friend-account"
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg text-xs shadow-md transition-colors cursor-pointer"
            >
              <UserPlus size={15} />
              <span>Create Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
