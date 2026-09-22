import React, { useState } from 'react';
import { Room, RoomStatus } from '../types';
import { 
  BedDouble, 
  X, 
  Plus, 
  Sparkles, 
  Check, 
  IndianRupee, 
  Layers, 
  Users, 
  Tv, 
  Wifi, 
  Flame, 
  Wind 
} from 'lucide-react';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRoom: (newRoom: Room) => void;
  existingRooms: Room[];
  hotelName: string;
}

const COMMON_AMENITIES = [
  'AC',
  'Wi-Fi',
  'Geyser',
  'Smart TV',
  'Balcony',
  'Kettle',
  'Mini Bar',
  'Bathtub',
  'Sofa',
  'Wardrobe',
  'Mountain View',
  'Room Service'
];

const ROOM_TYPES = [
  'Deluxe AC Double',
  'Standard AC Room',
  'Executive Luxury Suite',
  'Family 4-Bed Suite',
  'Super Deluxe Balcony',
  'Heritage Maharaja Suite',
  'Classic Non-AC Double'
];

export const AddRoomModal: React.FC<AddRoomModalProps> = ({
  isOpen,
  onClose,
  onAddRoom,
  existingRooms,
  hotelName
}) => {
  // Suggest next room number based on existing
  const nextNum = existingRooms.length > 0 
    ? (Math.max(...existingRooms.map(r => parseInt(r.number, 10) || 100)) + 1).toString()
    : '101';

  const [number, setNumber] = useState(nextNum);
  const [type, setType] = useState(ROOM_TYPES[0]);
  const [floor, setFloor] = useState<number>(1);
  const [baseRate, setBaseRate] = useState<number>(2500);
  const [maxOccupancy, setMaxOccupancy] = useState<number>(2);
  const [status, setStatus] = useState<RoomStatus>('clean');
  const [amenities, setAmenities] = useState<string[]>(['AC', 'Wi-Fi', 'Geyser', 'Smart TV']);
  const [customAmenity, setCustomAmenity] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleAmenity = (item: string) => {
    if (amenities.includes(item)) {
      setAmenities(amenities.filter(a => a !== item));
    } else {
      setAmenities([...amenities, item]);
    }
  };

  const handleAddCustomAmenity = () => {
    if (customAmenity.trim() && !amenities.includes(customAmenity.trim())) {
      setAmenities([...amenities, customAmenity.trim()]);
      setCustomAmenity('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedNumber = number.trim();
    if (!trimmedNumber) {
      setError('Room number is required');
      return;
    }

    // Check duplicate
    if (existingRooms.some(r => r.number.toLowerCase() === trimmedNumber.toLowerCase())) {
      setError(`Room number "${trimmedNumber}" already exists in ${hotelName}. Please pick a unique room number.`);
      return;
    }

    const newRoom: Room = {
      id: `rm-${Date.now()}-${trimmedNumber}`,
      number: trimmedNumber,
      name: `${trimmedNumber} - ${type}`,
      type,
      floor: Number(floor) || 1,
      baseRate: Number(baseRate) || 2000,
      maxOccupancy: Number(maxOccupancy) || 2,
      status,
      amenities
    };

    onAddRoom(newRoom);
    onClose();
  };

  // Quick preset helper
  const applyPreset = (presetType: string, defaultRate: number, occ: number, flr: number) => {
    setType(presetType);
    setBaseRate(defaultRate);
    setMaxOccupancy(occ);
    setFloor(flr);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="add-room-modal-container"
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <BedDouble size={20} className="text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Add New Room</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-teal-400/20 text-teal-200 px-2 py-0.5 rounded-full border border-teal-400/30">
                  {hotelName}
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                Setup room number, tariff, floor, category and amenities
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

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Quick Room Category Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('Deluxe AC Double', 2500, 2, 1)}
                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 font-semibold rounded-lg border border-teal-200 transition-colors cursor-pointer"
              >
                + Deluxe AC (₹2,500)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('Executive Luxury Suite', 4500, 3, 2)}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold rounded-lg border border-amber-200 transition-colors cursor-pointer"
              >
                + Executive Suite (₹4,500)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('Family 4-Bed Suite', 5500, 5, 2)}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold rounded-lg border border-blue-200 transition-colors cursor-pointer"
              >
                + Family Suite (₹5,500)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('Standard AC Room', 1800, 2, 1)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                + Standard AC (₹1,800)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Room Number */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Room Number *</label>
              <input
                id="input-room-number"
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="e.g. 101, 204"
                className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-hidden font-mono"
                required
              />
            </div>

            {/* Room Category / Type */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Room Category *</label>
              <select
                id="select-room-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-hidden"
              >
                {ROOM_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Floor */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Floor Level</label>
              <div className="relative">
                <Layers size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={floor}
                  onChange={(e) => setFloor(Number(e.target.value))}
                  className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  required
                />
              </div>
            </div>

            {/* Base Tariff */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Base Tariff / Night (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={baseRate}
                  onChange={(e) => setBaseRate(Number(e.target.value))}
                  className="w-full pl-7 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
                  required
                />
              </div>
            </div>

            {/* Max Occupancy */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Guests (Adults)</label>
              <div className="relative">
                <Users size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxOccupancy}
                  onChange={(e) => setMaxOccupancy(Number(e.target.value))}
                  className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Initial Cleanliness Status */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Initial Cleanliness Status</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'clean', label: 'Clean & Ready', color: 'border-emerald-400 text-emerald-900 bg-emerald-50' },
                { key: 'dirty', label: 'Needs Cleaning', color: 'border-amber-400 text-amber-900 bg-amber-50' },
                { key: 'cleaning', label: 'Cleaning Now', color: 'border-blue-400 text-blue-900 bg-blue-50' },
                { key: 'ooo', label: 'Out of Order', color: 'border-rose-400 text-rose-900 bg-rose-50' },
              ].map(st => (
                <button
                  type="button"
                  key={st.key}
                  onClick={() => setStatus(st.key as RoomStatus)}
                  className={`p-2 rounded-lg border text-center font-bold text-[11px] transition-all cursor-pointer ${
                    status === st.key 
                      ? `${st.color} ring-2 ring-teal-600/30 font-extrabold shadow-2xs` 
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Room Amenities &amp; Features ({amenities.length} selected)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {COMMON_AMENITIES.map(am => {
                const isSelected = amenities.includes(am);
                return (
                  <button
                    type="button"
                    key={am}
                    onClick={() => toggleAmenity(am)}
                    className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-800 text-white border-teal-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{am}</span>
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>

            {/* Add Custom Amenity Input */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                placeholder="Custom amenity (e.g. Jacuzzi, Sea View)"
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomAmenity();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomAmenity}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Room will appear instantly on the Tape Chart.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-add-room"
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg text-xs shadow-md transition-colors cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Save Room</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
