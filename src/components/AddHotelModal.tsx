import React, { useState } from 'react';
import { Hotel, UserAccount } from '../types';
import { 
  Building2, 
  X, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  ShieldAlert,
  Lock, 
  User, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { 
  canUserAddProperty, 
  isStaffUser, 
  isPropertyOwnerUser, 
  MAX_OWNER_PROPERTIES 
} from '../utils/permissionHelper';

interface AddHotelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHotel: (newHotel: Hotel, initialManager?: UserAccount, roomCountTemplate?: number) => void;
  currentUser?: UserAccount | null;
  hotels?: Hotel[];
}

export const AddHotelModal: React.FC<AddHotelModalProps> = ({
  isOpen,
  onClose,
  onAddHotel,
  currentUser,
  hotels = []
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [tagline, setTagline] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Uttar Pradesh');
  const [phone, setPhone] = useState('+91 9');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [starCategory, setStarCategory] = useState('3-Star Premium');
  const [checkInTime, setCheckInTime] = useState('12:00 PM');
  const [checkOutTime, setCheckOutTime] = useState('11:00 AM');
  const [roomTemplate, setRoomTemplate] = useState<number>(0);

  // Manager Credentials
  const [createManager, setCreateManager] = useState(true);
  const [managerName, setManagerName] = useState('');
  const [managerUsername, setManagerUsername] = useState('');
  const [managerPassword, setManagerPassword] = useState('password123');

  if (!isOpen) return null;

  // Permission check for current user
  const permission = canUserAddProperty(currentUser, hotels);
  const isStaff = isStaffUser(currentUser);
  const isOwner = isPropertyOwnerUser(currentUser);

  // Auto-generate short code and manager username from name
  const handleNameChange = (val: string) => {
    setName(val);
    const words = val.trim().split(/\s+/);
    if (words.length > 0 && words[0]) {
      const suggestedCode = words.map(w => w[0]).join('').toUpperCase().slice(0, 4);
      setCode(suggestedCode);
      const cleanSlug = val.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
      setManagerUsername(`manager.${cleanSlug}`);
      if (!managerName) setManagerName(`Manager - ${val}`);
      if (!email) setEmail(`contact@${cleanSlug || 'hotel'}.com`);
    }
  };

  const handleFillSample = () => {
    setName('Hotel Sea Breeze Resort');
    setCode('HSBR');
    setTagline('Luxury Beachfront Villas & Suites');
    setAddress('Calangute Beach Road, North Goa');
    setCity('Goa');
    setState('Goa');
    setPhone('+91 832 2459012');
    setEmail('reservations@seabreezegoa.com');
    setGstin('30AABCS4491M1Z4');
    setStarCategory('4-Star Resort');
    setManagerName('Karan Deshmukh');
    setManagerUsername('manager.seabreeze');
    setManagerPassword('password123');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permission.allowed) return;
    if (!name.trim()) return;

    const newHotelId = `hotel-${Date.now()}`;
    const newHotel: Hotel = {
      id: newHotelId,
      name: name.trim(),
      code: code.trim().toUpperCase() || 'HTL',
      tagline: tagline.trim() || 'Premium Hotel & Suites',
      address: address.trim() || 'Main Market Road',
      city: city.trim() || 'City Center',
      state: state.trim(),
      phone: phone.trim(),
      email: email.trim() || `frontdesk@${newHotelId}.com`,
      gstin: gstin.trim() || '09AAAAA0000A1Z5',
      checkInTime,
      checkOutTime,
      currencySymbol: '₹',
      starCategory,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      ownerId: currentUser?.role === 'hotel_owner' ? currentUser.id : (currentUser?.id || 'user-admin'),
      ownerUsername: currentUser?.role === 'hotel_owner' ? currentUser.username : (currentUser?.username || 'maahitrips')
    };

    let newManager: UserAccount | undefined;
    if (createManager) {
      newManager = {
        id: `user-${Date.now()}`,
        username: managerUsername.trim().toLowerCase() || `mgr.${code.toLowerCase()}`,
        password: managerPassword || 'password123',
        name: managerName.trim() || `Manager (${newHotel.name})`,
        designation: `General Manager (${newHotel.name})`,
        role: 'hotel_manager',
        email: email.trim(),
        phone,
        hotelId: newHotelId,
        hotelName: newHotel.name,
        avatarText: (managerName ? managerName.slice(0, 2) : code.slice(0, 2)).toUpperCase()
      };
    }

    onAddHotel(newHotel, newManager, roomTemplate);
    onClose();
  };

  // Blocked View 1: If user is Staff (Staff cannot add properties)
  if (isStaff) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border-2 border-rose-200">
            <ShieldAlert size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Staff Access Restriction</h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            Aapka account <strong>Hotel Staff ({currentUser?.designation || 'Staff'})</strong> ke roop me logged-in hai.
            <br /><br />
            <strong>Staff members nayi property register ya add nahi kar sakte.</strong> Yeh suvidha keval Property Owner ya Super Admin ke paas hai.
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 mb-5">
            Aap apni assigned property: <strong>{currentUser?.hotelName || 'Assigned Hotel'}</strong> ke bookings, tape chart, guest bills aur housekeeping handle kar sakte hain.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            I Understand (Close)
          </button>
        </div>
      </div>
    );
  }

  // Blocked View 2: If Property Owner has reached 5 properties limit
  if (isOwner && !permission.allowed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 border-2 border-amber-200">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Maximum 5 Properties Limit Reached</h3>
          <span className="inline-block bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold px-3 py-1 rounded-full mb-3">
            Quota: {permission.currentCount} / {MAX_OWNER_PROPERTIES} Properties Added
          </span>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            Super Admin niyam ke mutabiq, ek <strong>Property Owner maximum 5 property</strong> add kar sakta hai. 
            Aapke account me already 5 properties active hain.
          </p>

          <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-950 mb-5 text-left space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles size={14} className="text-teal-700" />
              <span>Property Limit Badhane Ke Liye:</span>
            </div>
            <p className="text-[11px] text-teal-800">
              Aur properties add karne ke liye kripya Super Admin se contact karein:
              <br />
              📞 <strong>+91 96481 33671</strong> (Shahid - Maahi Trips Super Admin)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
            <a
              href="tel:+919648133671"
              className="flex-1 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl text-xs transition-colors text-center shadow-xs"
            >
              Call Super Admin
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div 
        id="add-hotel-modal-container"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Building2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Add New Hotel Property</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isOwner ? 'bg-amber-400/20 text-amber-200 border-amber-400/30' : 'bg-teal-400/20 text-teal-200 border-teal-400/30'
                }`}>
                  {isOwner 
                    ? `Quota: ${permission.currentCount + 1}/${MAX_OWNER_PROPERTIES} Allowed`
                    : 'Super Admin: Unlimited'}
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                Register a new property with independent rooms, bookings, and separate manager login
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFillSample}
              className="text-[11px] font-bold text-amber-200 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              Fill Sample
            </button>
            <button 
              onClick={onClose}
              className="text-white/70 hover:text-white text-base p-1 rounded-md transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Quota Banner for Property Owner */}
        {isOwner && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-950">
            <div className="flex items-center gap-2 font-bold">
              <Info size={15} className="text-amber-700" />
              <span>Property Owner Allowance:</span>
              <span className="font-normal text-amber-800">
                Aap maximum 5 property add kar sakte hain. Currently adding property <strong>#{permission.currentCount + 1}</strong>.
              </span>
            </div>
            <span className="font-bold text-[11px] bg-amber-200/80 px-2 py-0.5 rounded text-amber-900">
              {MAX_OWNER_PROPERTIES - (permission.currentCount + 1)} slots left after this
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Section 1: Property Identity */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1 border-b border-slate-200 pb-1.5">
              <Building2 size={14} /> Property Details
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Hotel Property Name *</label>
                <input
                  id="input-new-hotel-name"
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Hotel Mountain Breeze"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold focus:ring-2 focus:ring-teal-500 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Property Code *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HMB"
                  className="w-full text-xs font-mono font-bold uppercase bg-slate-50 border border-slate-300 rounded-lg p-2.5"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Brand Tagline / Caption</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Boutique Luxury Stay"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Star / Category</label>
                <select
                  value={starCategory}
                  onChange={(e) => setStarCategory(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  <option value="3-Star Premium">3-Star Premium Hotel</option>
                  <option value="4-Star Resort">4-Star Resort &amp; Spa</option>
                  <option value="5-Star Heritage">5-Star Heritage Palace</option>
                  <option value="Boutique Luxury">Boutique Luxury Suites</option>
                  <option value="Budget Smart Stay">Budget Smart Stay</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Address / Location *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot/Street Address"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Udaipur"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Rajasthan"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Phone *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 96481 33671"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@hotel.com"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="08AABCB1234F1Z8"
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2 uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Standard Check-In</label>
                <input
                  type="text"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Standard Check-Out</label>
                <input
                  type="text"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Room Templates */}
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1">
              <Sparkles size={14} /> Initial Room Inventory Setup
            </div>
            <p className="text-[11px] text-slate-500">
              Aap blank hotel bhi create kar sakte hain ya quick testing ke liye sample rooms generate kar sakte hain:
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { val: 0, label: 'Empty Hotel', desc: 'No rooms initially (add your own)' },
                { val: 6, label: '6 Rooms Setup', desc: 'Deluxe, Suite & Standard' },
                { val: 12, label: '12 Rooms Setup', desc: 'Full sample inventory' }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setRoomTemplate(opt.val)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    roomTemplate === opt.val 
                      ? 'border-teal-700 bg-teal-50 text-teal-900 font-bold ring-1 ring-teal-700' 
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">{opt.label}</div>
                  <div className="text-[10px] text-slate-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Initial Manager Account */}
          <div className="space-y-3 border-t border-slate-200 pt-4 bg-teal-50/50 p-4 rounded-xl border border-teal-100">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-teal-700" />
                <span>Create Dedicated Staff / Manager Account</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-teal-900">
                <input
                  type="checkbox"
                  checked={createManager}
                  onChange={(e) => setCreateManager(e.target.checked)}
                  className="rounded text-teal-700 focus:ring-teal-500"
                />
                <span>Generate Login ID</span>
              </label>
            </div>

            {createManager && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-teal-950 mb-1">Staff / Manager Name</label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full text-xs bg-white border border-teal-300 rounded-lg p-2"
                    required={createManager}
                  />
                </div>

                <div>
                  <label className="block font-bold text-teal-950 mb-1">Staff Username *</label>
                  <input
                    type="text"
                    value={managerUsername}
                    onChange={(e) => setManagerUsername(e.target.value.toLowerCase())}
                    placeholder="e.g. manager.goa"
                    className="w-full text-xs font-mono font-bold bg-white border border-teal-300 rounded-lg p-2"
                    required={createManager}
                  />
                </div>

                <div>
                  <label className="block font-bold text-teal-950 mb-1">Password *</label>
                  <input
                    type="text"
                    value={managerPassword}
                    onChange={(e) => setManagerPassword(e.target.value)}
                    placeholder="password123"
                    className="w-full text-xs font-mono bg-white border border-teal-300 rounded-lg p-2"
                    required={createManager}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="btn-confirm-add-hotel"
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold shadow-sm transition-all hover:shadow cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Create Hotel Property</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
