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
  User, 
  Lock 
} from 'lucide-react';

interface AddHotelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHotel: (newHotel: Hotel, initialManager?: UserAccount, roomCountTemplate?: number) => void;
}

export const AddHotelModal: React.FC<AddHotelModalProps> = ({
  isOpen,
  onClose,
  onAddHotel
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
  const [roomTemplate, setRoomTemplate] = useState<number>(8);

  // Manager Credentials
  const [createManager, setCreateManager] = useState(true);
  const [managerName, setManagerName] = useState('');
  const [managerUsername, setManagerUsername] = useState('');
  const [managerPassword, setManagerPassword] = useState('password123');

  if (!isOpen) return null;

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
      createdAt: new Date().toISOString().split('T')[0]
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
              <h2 className="text-lg font-bold">Add New Hotel Property</h2>
              <p className="text-xs text-teal-200/80">
                Register a new property with independent rooms, bookings, and separate manager login
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFillSample}
              className="text-[11px] font-bold text-amber-200 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 px-2.5 py-1 rounded-md transition-colors"
            >
              Fill Sample (Goa Resort)
            </button>
            <button 
              onClick={onClose}
              className="text-white/70 hover:text-white text-base p-1 rounded-md transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

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
                  placeholder="e.g. Heritage Luxury with Valley View"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Star / Category</label>
                <select
                  value={starCategory}
                  onChange={(e) => setStarCategory(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="Boutique Stay">Boutique Stay</option>
                  <option value="3-Star Premium">3-Star Premium</option>
                  <option value="4-Star Luxury">4-Star Luxury</option>
                  <option value="5-Star Heritage">5-Star Heritage</option>
                  <option value="Budget Friendly">Budget Friendly</option>
                  <option value="Resort & Villas">Resort &amp; Villas</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Mall Road, Near Clock Tower"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City / Town *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Manali, Shimla, Goa"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Himachal Pradesh"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98000 00000"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="frontdesk@hotel.com"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">GSTIN (Tax ID)</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="08AABCB1234F1Z8"
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Room Count Provisioning */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 block">
              Initial Room Inventory Setup
            </span>
            <div className="grid grid-cols-3 gap-3">
              {[
                { count: 6, label: '6 Rooms', desc: 'Boutique / B&B Setup' },
                { count: 10, label: '10 Rooms', desc: 'Standard Midscale' },
                { count: 15, label: '15 Rooms', desc: 'Full Hotel Setup' },
              ].map(opt => (
                <label 
                  key={opt.count}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                    roomTemplate === opt.count 
                      ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500/20' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">{opt.label}</span>
                    <input
                      type="radio"
                      name="roomTemplate"
                      checked={roomTemplate === opt.count}
                      onChange={() => setRoomTemplate(opt.count)}
                      className="text-teal-700"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 3: Separate Manager Login Credentials */}
          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-teal-800" />
                <span className="font-bold text-teal-950 text-xs">Create Dedicated Login For This Hotel</span>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createManager}
                  onChange={(e) => setCreateManager(e.target.checked)}
                  className="rounded text-teal-700"
                />
                <span>Enable Separate Manager Account</span>
              </label>
            </div>

            {createManager && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-teal-950 mb-1">Manager Full Name</label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full text-xs bg-white border border-teal-300 rounded-lg p-2 font-medium"
                    required={createManager}
                  />
                </div>

                <div>
                  <label className="block font-bold text-teal-950 mb-1">Login Username *</label>
                  <input
                    id="input-new-manager-username"
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
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              id="btn-confirm-add-hotel"
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold shadow-sm transition-all hover:shadow cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Create Hotel &amp; Provision Login</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
