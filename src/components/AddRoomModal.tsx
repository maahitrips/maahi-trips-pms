import React, { useState, useEffect, useMemo } from 'react';
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
  Wind,
  Edit3,
  PenLine,
  Trash2
} from 'lucide-react';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRoom: (newRoom: Room) => void;
  existingRooms: Room[];
  hotelName: string;
  roomToEdit?: Room | null;
  onUpdateRoom?: (updatedRoom: Room) => void;
  onDeleteRoom?: (room: Room) => void;
  isSuperAdmin?: boolean;
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
  hotelName,
  roomToEdit,
  onUpdateRoom,
  onDeleteRoom,
  isSuperAdmin
}) => {
  // Extract custom categories that exist in this hotel
  const existingCategories = useMemo(() => {
    return Array.from(new Set(existingRooms.map(r => r.type).filter(Boolean)));
  }, [existingRooms]);

  const customExistingCategories = useMemo(() => {
    return existingCategories.filter(c => !ROOM_TYPES.includes(c));
  }, [existingCategories]);

  // Combined suggestions for datalist
  const allCategorySuggestions = useMemo(() => {
    return Array.from(new Set([...ROOM_TYPES, ...existingCategories]));
  }, [existingCategories]);

  const [number, setNumber] = useState('');
  const [type, setType] = useState(ROOM_TYPES[0]);
  const [isManualCategory, setIsManualCategory] = useState<boolean>(false);
  const [floor, setFloor] = useState<number>(1);
  const [baseRate, setBaseRate] = useState<number>(2500);
  const [maxOccupancy, setMaxOccupancy] = useState<number>(2);
  const [status, setStatus] = useState<RoomStatus>('clean');
  const [amenities, setAmenities] = useState<string[]>(['AC', 'Wi-Fi', 'Geyser', 'Smart TV']);
  const [customAmenity, setCustomAmenity] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset form when opened or roomToEdit changes
  useEffect(() => {
    if (!isOpen) return;

    if (roomToEdit) {
      setNumber(roomToEdit.number);
      setType(roomToEdit.type);
      setFloor(roomToEdit.floor);
      setBaseRate(roomToEdit.baseRate);
      setMaxOccupancy(roomToEdit.maxOccupancy);
      setStatus(roomToEdit.status);
      setAmenities(roomToEdit.amenities && roomToEdit.amenities.length > 0 ? roomToEdit.amenities : ['AC', 'Wi-Fi']);
      // If room category is custom, turn on manual typing mode automatically
      setIsManualCategory(!ROOM_TYPES.includes(roomToEdit.type));
    } else {
      const nextNum = existingRooms.length > 0 
        ? (Math.max(...existingRooms.map(r => parseInt(r.number, 10) || 100)) + 1).toString()
        : '101';
      setNumber(nextNum);
      setType(ROOM_TYPES[0]);
      setFloor(1);
      setBaseRate(2500);
      setMaxOccupancy(2);
      setStatus('clean');
      setAmenities(['AC', 'Wi-Fi', 'Geyser', 'Smart TV']);
      setIsManualCategory(false);
    }
    setError(null);
  }, [isOpen, roomToEdit, existingRooms]);

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

    const finalType = type.trim();
    if (!finalType) {
      setError('Room category cannot be empty. Please type or select a category.');
      return;
    }

    // Check duplicate (ignore if editing the same room)
    const isDuplicate = existingRooms.some(r => 
      r.number.toLowerCase() === trimmedNumber.toLowerCase() && 
      (!roomToEdit || r.id !== roomToEdit.id)
    );
    if (isDuplicate) {
      setError(`Room number "${trimmedNumber}" already exists in ${hotelName}. Please choose a unique room number.`);
      return;
    }

    if (roomToEdit && onUpdateRoom) {
      const updated: Room = {
        ...roomToEdit,
        number: trimmedNumber,
        name: `${trimmedNumber} - ${finalType}`,
        type: finalType,
        floor: Number(floor) || 1,
        baseRate: Number(baseRate) || 2000,
        maxOccupancy: Number(maxOccupancy) || 2,
        status,
        amenities
      };
      onUpdateRoom(updated);
      onClose();
      return;
    }

    const newRoom: Room = {
      id: `rm-${Date.now()}-${trimmedNumber}`,
      number: trimmedNumber,
      name: `${trimmedNumber} - ${finalType}`,
      type: finalType,
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
              {roomToEdit ? <Edit3 size={20} className="text-amber-300" /> : <BedDouble size={20} className="text-teal-300" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">
                  {roomToEdit ? `Edit Room ${roomToEdit.number}` : 'Add New Room'}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-teal-400/20 text-teal-200 px-2 py-0.5 rounded-full border border-teal-400/30">
                  {hotelName}
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                Setup room number, custom category (manual or preset), tariff and amenities
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
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
              Quick Category Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('Deluxe AC Double', 2500, 2, 1)}
                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-950 font-bold rounded-lg border border-teal-200 transition-colors cursor-pointer"
              >
                + Deluxe AC (₹2,500)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('Executive Luxury Suite', 4500, 3, 2)}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold rounded-lg border border-amber-200 transition-colors cursor-pointer"
              >
                + Executive Suite (₹4,500)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('Family 4-Bed Suite', 5500, 5, 2)}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-950 font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer"
              >
                + Family Suite (₹5,500)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('Standard AC Room', 1800, 2, 1)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                + Standard AC (₹1,800)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Room Number */}
            <div>
              <label className="block font-bold text-slate-900 mb-1">Room Number *</label>
              <input
                id="input-room-number"
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="e.g. 101, 204, 301"
                className="w-full text-sm font-bold text-slate-950 bg-white border-2 border-slate-300 rounded-lg p-2.5 focus:border-teal-700 focus:ring-2 focus:ring-teal-500/20 outline-hidden font-mono shadow-2xs"
                required
              />
            </div>

            {/* Room Category / Type with Manual Typing Option */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Room Category *</span>
                  {isManualCategory && (
                    <span className="text-[10px] bg-teal-100 text-teal-900 px-1.5 py-0.5 rounded font-bold">
                      Manual Input
                    </span>
                  )}
                </label>

                {/* Switch between Preset Dropdown & Manual Typing */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualCategory(false);
                      if (!ROOM_TYPES.includes(type) && !customExistingCategories.includes(type)) {
                        setType(ROOM_TYPES[0]);
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                      !isManualCategory 
                        ? 'bg-teal-700 text-white shadow-2xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Preset List
                  </button>
                  <button
                    type="button"
                    id="btn-toggle-manual-category"
                    onClick={() => setIsManualCategory(true)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                      isManualCategory 
                        ? 'bg-teal-700 text-white shadow-2xs' 
                        : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
                    }`}
                    title="Click to type any custom room category manually"
                  >
                    <PenLine size={12} />
                    <span>✍️ Type Manually</span>
                  </button>
                </div>
              </div>

              {isManualCategory ? (
                <div className="space-y-1">
                  <div className="relative">
                    <input
                      id="input-manual-room-type"
                      type="text"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      placeholder="Type custom category (e.g. Honeymoon Suite, Cottage, Dormitory...)"
                      list="existing-category-suggestions"
                      className="w-full text-xs sm:text-sm font-bold text-slate-950 bg-white border-2 border-teal-600 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 outline-hidden shadow-2xs"
                      required
                      autoFocus
                    />
                  </div>
                  <datalist id="existing-category-suggestions">
                    {allCategorySuggestions.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 px-0.5">
                    <span>💡 Free text: Type any custom category (e.g. Maharaja Suite, Couple Deluxe, 3-Bed AC).</span>
                    <button
                      type="button"
                      onClick={() => setIsManualCategory(false)}
                      className="text-teal-700 hover:underline font-bold"
                    >
                      Use Dropdown
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <select
                    id="select-room-type"
                    value={type}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM_MANUAL__') {
                        setIsManualCategory(true);
                      } else {
                        setType(e.target.value);
                      }
                    }}
                    className="w-full text-xs sm:text-sm font-bold text-slate-950 bg-white border-2 border-slate-300 rounded-lg p-2.5 focus:border-teal-700 focus:ring-2 focus:ring-teal-500/20 outline-hidden shadow-2xs"
                  >
                    <optgroup label="Standard Categories">
                      {ROOM_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </optgroup>
                    {customExistingCategories.length > 0 && (
                      <optgroup label="Hotel Custom Categories">
                        {customExistingCategories.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </optgroup>
                    )}
                    <option value="__CUSTOM_MANUAL__" className="text-teal-800 font-bold bg-teal-50">
                      ✍️ + Type Custom Category Manually...
                    </option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Floor */}
            <div>
              <label className="block font-bold text-slate-900 mb-1">Floor Level</label>
              <div className="relative">
                <Layers size={15} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={floor}
                  onChange={(e) => setFloor(Number(e.target.value))}
                  className="w-full pl-9 pr-2 py-2 bg-white border-2 border-slate-300 rounded-lg font-bold text-slate-950 focus:border-teal-700 outline-hidden"
                  required
                />
              </div>
            </div>

            {/* Base Tariff */}
            <div>
              <label className="block font-bold text-slate-900 mb-1">Base Tariff / Night (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-500 text-sm">₹</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={baseRate}
                  onChange={(e) => setBaseRate(Number(e.target.value))}
                  className="w-full pl-8 pr-2 py-2 bg-white border-2 border-slate-300 rounded-lg font-bold text-slate-950 text-sm focus:border-teal-700 outline-hidden"
                  required
                />
              </div>
            </div>

            {/* Max Occupancy */}
            <div>
              <label className="block font-bold text-slate-900 mb-1">Max Guests (Adults)</label>
              <div className="relative">
                <Users size={15} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={maxOccupancy}
                  onChange={(e) => setMaxOccupancy(Number(e.target.value))}
                  className="w-full pl-9 pr-2 py-2 bg-white border-2 border-slate-300 rounded-lg font-bold text-slate-950 focus:border-teal-700 outline-hidden"
                  required
                />
              </div>
            </div>
          </div>

          {/* Initial Cleanliness Status */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">Room Cleanliness Status</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'clean', label: 'Clean & Ready', color: 'border-emerald-500 text-emerald-950 bg-emerald-50' },
                { key: 'dirty', label: 'Needs Cleaning', color: 'border-amber-500 text-amber-950 bg-amber-50' },
                { key: 'cleaning', label: 'Cleaning Now', color: 'border-blue-500 text-blue-950 bg-blue-50' },
                { key: 'ooo', label: 'Out of Order', color: 'border-rose-500 text-rose-950 bg-rose-50' },
              ].map(st => (
                <button
                  type="button"
                  key={st.key}
                  onClick={() => setStatus(st.key as RoomStatus)}
                  className={`p-2 rounded-lg border-2 text-center font-bold text-[11px] transition-all cursor-pointer ${
                    status === st.key 
                      ? `${st.color} ring-2 ring-teal-600/30 font-extrabold shadow-2xs` 
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities Selector */}
          <div>
            <label className="block font-bold text-slate-900 mb-1.5">
              Room Amenities &amp; Features ({amenities.length} selected)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border-2 border-slate-200">
              {COMMON_AMENITIES.map(am => {
                const isSelected = amenities.includes(am);
                return (
                  <button
                    type="button"
                    key={am}
                    onClick={() => toggleAmenity(am)}
                    className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-800 text-white border-teal-900 shadow-2xs'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
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
                placeholder="Add custom amenity (e.g. Jacuzzi, Lake View, Extra Bed)"
                className="flex-1 px-3 py-1.5 text-xs font-bold text-slate-950 bg-white border-2 border-slate-300 rounded-lg focus:border-teal-700 outline-hidden"
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
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {roomToEdit && onDeleteRoom && (
                <button
                  type="button"
                  onClick={() => {
                    const roomToDelete = roomToEdit;
                    onClose();
                    onDeleteRoom(roomToDelete);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 hover:border-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                  title={isSuperAdmin ? "Delete Room (Super Admin Direct)" : "Delete Room (Super Admin Authorization Required)"}
                >
                  <Trash2 size={14} />
                  <span>Delete Room</span>
                </button>
              )}
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                Changes reflect instantly on Tape Chart &amp; Channel Manager.
              </span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 font-bold rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-add-room"
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
              >
                {roomToEdit ? <Edit3 size={15} strokeWidth={2.5} /> : <Plus size={15} strokeWidth={2.5} />}
                <span>{roomToEdit ? 'Update Room' : 'Save Room'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
