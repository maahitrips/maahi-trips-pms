import React, { useState, useEffect } from 'react';
import { UserAccount, Hotel, UserRole } from '../types';
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
  ShieldAlert,
  Info,
  Briefcase,
  Users
} from 'lucide-react';
import { getAccessibleHotels, isSuperAdminUser, isPropertyOwnerUser } from '../utils/permissionHelper';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (newUser: UserAccount) => void;
  hotels: Hotel[];
  currentUser: UserAccount | null;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onAddUser,
  hotels,
  currentUser
}) => {
  const isSuperAdmin = isSuperAdminUser(currentUser);
  const isOwner = isPropertyOwnerUser(currentUser);

  // For owner, only show hotels owned by them
  const accessibleHotels = getAccessibleHotels(currentUser, hotels);

  // Default account type: Super admin defaults to 'hotel_owner', Owner defaults to 'hotel_manager' (staff)
  const [accountType, setAccountType] = useState<'owner' | 'staff'>(isOwner ? 'staff' : 'owner');
  const [selectedStaffRole, setSelectedStaffRole] = useState<'hotel_manager' | 'front_desk'>('hotel_manager');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 9');
  const [designation, setDesignation] = useState('Front Desk Receptionist');
  const [assignedHotelId, setAssignedHotelId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize defaults on open
  useEffect(() => {
    if (!isOpen) return;
    if (isOwner) {
      setAccountType('staff');
      setSelectedStaffRole('front_desk');
      setDesignation('Front Desk Receptionist');
      if (accessibleHotels.length > 0) {
        setAssignedHotelId(accessibleHotels[0].id);
      }
    } else {
      setAccountType('owner');
      setDesignation('Hotel Partner & Owner');
      setAssignedHotelId('new');
    }
    setError(null);
  }, [isOpen, isOwner, accessibleHotels.length]);

  if (!isOpen) return null;

  const handleAccountTypeChange = (type: 'owner' | 'staff') => {
    setAccountType(type);
    if (type === 'owner') {
      setDesignation('Hotel Partner & Owner');
      setAssignedHotelId('new');
    } else {
      setSelectedStaffRole('hotel_manager');
      setDesignation('Hotel Manager');
      if (accessibleHotels.length > 0) {
        setAssignedHotelId(accessibleHotels[0].id);
      }
    }
  };

  const handleStaffRoleChange = (role: 'hotel_manager' | 'front_desk') => {
    setSelectedStaffRole(role);
    if (role === 'hotel_manager') {
      setDesignation('Hotel General Manager');
    } else {
      setDesignation('Front Desk Receptionist');
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    const cleanSlug = val.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
    if (cleanSlug && !username) {
      if (accountType === 'staff') {
        setUsername(`staff.${cleanSlug}`);
      } else {
        setUsername(`${cleanSlug}.hotel`);
      }
    }
    if (cleanSlug && !email) {
      setEmail(`${cleanSlug}@gmail.com`);
    }
  };

  const handleCopyCredentials = () => {
    const text = `🏨 *Maahi Trips PMS Login Details:*\n👤 *Name:* ${name || 'User'}\n🔑 *Username:* ${username}\n🔒 *Password:* ${password}\n🌐 *Role:* ${designation}\n🏨 *Property:* ${hotels.find(h => h.id === assignedHotelId)?.name || 'Direct Property'}\n\n👉 *Login Link:* ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!name.trim()) {
      setError('Please enter user full name');
      return;
    }
    if (!cleanUsername) {
      setError('Please enter a unique login username');
      return;
    }

    if (accountType === 'staff' && (!assignedHotelId || assignedHotelId === 'new')) {
      setError('Staff must be assigned to an active hotel property');
      return;
    }

    const assignedHotel = hotels.find(h => h.id === assignedHotelId);

    // Final role calculation
    const finalRole: UserRole = accountType === 'owner' ? 'hotel_owner' : selectedStaffRole;

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      password: password.trim() || 'password123',
      name: name.trim(),
      designation: designation.trim() || (accountType === 'owner' ? 'Property Owner' : 'Hotel Staff'),
      role: finalRole,
      email: email.trim() || `${cleanUsername}@gmail.com`,
      phone: phone.trim(),
      hotelId: accountType === 'owner' && assignedHotelId === 'new' ? '' : (assignedHotelId || ''),
      hotelName: accountType === 'owner' && assignedHotelId === 'new' 
        ? 'Can Add Up to 5 Properties' 
        : (assignedHotel?.name || 'Assigned Property'),
      avatarText: name.trim().slice(0, 2).toUpperCase()
    };

    onAddUser(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="create-user-modal-container"
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <UserPlus size={20} className="text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">
                  {isOwner ? 'Add Property Staff Member' : 'Create User / Partner / Staff Login'}
                </h2>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  isOwner 
                    ? 'bg-blue-400/20 text-blue-200 border-blue-400/30' 
                    : 'bg-teal-400/20 text-teal-200 border-teal-400/30'
                }`}>
                  {isOwner ? 'Owner Staff Panel' : 'Super Admin Panel'}
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                {isOwner 
                  ? 'Setup staff logins for your hotel (Staff cannot add new properties)'
                  : 'Register property owners (max 5 properties) or dedicated hotel staff'}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Account Type Selector (Only for Super Admin; Owner adds Staff) */}
          {isSuperAdmin ? (
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">Select Account Type *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleAccountTypeChange('owner')}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    accountType === 'owner'
                      ? 'border-teal-700 bg-teal-50/70 shadow-xs ring-2 ring-teal-600/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">🏨</span>
                    <span className="font-bold text-slate-900 text-xs">Property Owner / Partner</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Can add <strong>max 5 properties</strong> and manage their own staff.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleAccountTypeChange('staff')}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    accountType === 'staff'
                      ? 'border-teal-700 bg-teal-50/70 shadow-xs ring-2 ring-teal-600/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">👔</span>
                    <span className="font-bold text-slate-900 text-xs">Hotel Staff Member</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Desk/Manager access. <strong>Cannot add new properties.</strong>
                  </p>
                </button>
              </div>
            </div>
          ) : (
            /* Property Owner view: Informative Banner */
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 text-xs flex items-start gap-2.5">
              <Users size={18} className="text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Property Owner Staff Panel:</strong>
                <span className="text-[11px] text-blue-800">
                  Aap apne hotel ke liye Manager, Receptionist ya Staff add kar rahe hain. 
                  Aapka staff bookings aur operations handle kar sakta hai, par <strong>nayi property add nahi kar sakta</strong>.
                </span>
              </div>
            </div>
          )}

          {/* If Staff: Choose Specific Role */}
          {accountType === 'staff' && (
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">Staff Responsibility / Role *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleStaffRoleChange('hotel_manager')}
                  className={`p-2.5 rounded-lg border text-left font-bold text-xs transition-all cursor-pointer ${
                    selectedStaffRole === 'hotel_manager'
                      ? 'border-teal-700 bg-teal-800 text-white shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>👔</span>
                    <span>General / Shift Manager</span>
                  </div>
                  <span className={`text-[10px] block mt-0.5 ${selectedStaffRole === 'hotel_manager' ? 'text-teal-200' : 'text-slate-400'}`}>
                    Full operations access • Cannot add properties
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStaffRoleChange('front_desk')}
                  className={`p-2.5 rounded-lg border text-left font-bold text-xs transition-all cursor-pointer ${
                    selectedStaffRole === 'front_desk'
                      ? 'border-teal-700 bg-teal-800 text-white shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>🖥️</span>
                    <span>Front Desk / Receptionist</span>
                  </div>
                  <span className={`text-[10px] block mt-0.5 ${selectedStaffRole === 'front_desk' ? 'text-teal-200' : 'text-slate-400'}`}>
                    Check-in, billing, rooms • Cannot add properties
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              {accountType === 'owner' ? 'Property Owner / Partner Full Name *' : 'Staff Member Full Name *'}
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                id="input-create-user-name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={accountType === 'owner' ? "e.g. Sadik Khan or Farhan Akhtar" : "e.g. Rohit Sharma or Priya Singh"}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border-2 border-slate-300 rounded-lg focus:border-teal-700 font-bold text-slate-950 outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Username */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Login Username / ID *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 font-bold">@</span>
                <input
                  id="input-create-user-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder={accountType === 'owner' ? "e.g. sadik.hotel" : "e.g. staff.rohit"}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border-2 border-slate-300 rounded-lg focus:border-teal-700 font-mono font-bold text-slate-950 outline-hidden"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Login Password *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  id="input-create-user-password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password123"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border-2 border-slate-300 rounded-lg focus:border-teal-700 font-mono font-bold text-slate-950 outline-hidden"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Phone */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Phone / WhatsApp Number</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 96481 33671"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border-2 border-slate-300 rounded-lg font-bold text-slate-950 outline-hidden"
                />
              </div>
            </div>

            {/* Designation */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Designation Title</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border-2 border-slate-300 rounded-lg font-bold text-slate-950 outline-hidden"
              />
            </div>
          </div>

          {/* Hotel Property Assignment */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              {accountType === 'owner' ? 'Initial Property Setup' : 'Assign to Hotel Property *'}
            </label>
            <div className="space-y-2">
              {accountType === 'owner' && (
                <label className="flex items-center gap-2 p-2.5 rounded-lg border-2 border-teal-500 bg-teal-50/60 cursor-pointer">
                  <input
                    type="radio"
                    name="hotelAssignment"
                    checked={assignedHotelId === 'new'}
                    onChange={() => setAssignedHotelId('new')}
                    className="text-teal-700"
                  />
                  <div>
                    <span className="font-bold text-teal-950 block">Setup New Properties (Max 5 allowed)</span>
                    <span className="text-[11px] text-teal-800">
                      Owner will click "+ Add Property" to register their own properties (up to 5 maximum).
                    </span>
                  </div>
                </label>
              )}

              {accessibleHotels.map(h => (
                <label 
                  key={h.id} 
                  className={`flex items-center gap-2 p-2.5 rounded-lg border-2 cursor-pointer transition-colors ${
                    assignedHotelId === h.id 
                      ? 'border-teal-700 bg-teal-50/50' 
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="hotelAssignment"
                    checked={assignedHotelId === h.id}
                    onChange={() => setAssignedHotelId(h.id)}
                    className="text-teal-700"
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate">Assign to: {h.name}</span>
                    <span className="text-[10px] text-slate-500">{h.city} • Code: {h.code}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Security Rules Banner */}
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck size={14} className="text-teal-700" />
              <span>Permission &amp; Safety Rule Enforced:</span>
            </div>
            {accountType === 'owner' ? (
              <p className="text-slate-600">
                • Property Owner maximum <strong>5 property</strong> add kar sakta hai.<br />
                • Property Owner apne user panel se apne hotels ke liye staff create kar sakta hai.
              </p>
            ) : (
              <p className="text-slate-600">
                • Staff member bookings, guests aur billing handle kar sakta hai.<br />
                • <strong>Staff nayi property add nahi kar sakta.</strong>
              </p>
            )}
          </div>

          {/* Quick Copy Credentials */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-500">Share with User:</span>
              <div className="font-mono text-slate-900 font-bold text-[11px]">
                ID: @{username || 'username'} | Pass: {password}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
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
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 font-bold rounded-lg text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-save-friend-account"
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
            >
              <UserPlus size={15} />
              <span>{accountType === 'owner' ? 'Create Owner Account' : 'Create Staff Member'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
