import React, { useState } from 'react';
import { HotelProfile } from '../types';
import { Sparkles, Trash2, Plus, Upload, CheckCircle2, Building, BedDouble } from 'lucide-react';

interface PhotoGalleryViewProps {
  hotelProfile: HotelProfile;
  onUpdateProfile: (updated: HotelProfile) => void;
  showToast: (title: string, subtitle?: string) => void;
}

export const PhotoGalleryView: React.FC<PhotoGalleryViewProps> = ({
  hotelProfile,
  onUpdateProfile,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'property' | 'rooms'>('property');
  const [newUrl, setNewUrl] = useState('');

  const currentPhotos = activeTab === 'property' 
    ? (hotelProfile.photos || []) 
    : (hotelProfile.roomPhotos || []);

  const handleAddPhoto = () => {
    if (!newUrl.trim()) return;
    const updatedList = [...currentPhotos, newUrl.trim()];
    const updated = activeTab === 'property'
      ? { ...hotelProfile, photos: updatedList }
      : { ...hotelProfile, roomPhotos: updatedList };
    
    onUpdateProfile(updated);
    setNewUrl('');
    showToast(`${activeTab === 'property' ? 'Property' : 'Room'} Photo Added!`, 'Gallery updated and synced with website.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      if (base64String) {
        const updatedList = [...currentPhotos, base64String];
        const updated = activeTab === 'property'
          ? { ...hotelProfile, photos: updatedList }
          : { ...hotelProfile, roomPhotos: updatedList };
        
        onUpdateProfile(updated);
        showToast('Photo Uploaded Successfully!', file.name);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddPreset = (url: string, label: string) => {
    if (!currentPhotos.includes(url)) {
      const updatedList = [...currentPhotos, url];
      const updated = activeTab === 'property'
        ? { ...hotelProfile, photos: updatedList }
        : { ...hotelProfile, roomPhotos: updatedList };
      
      onUpdateProfile(updated);
      showToast('Preset Photo Added!', label);
    } else {
      showToast('Photo Already Exists', label);
    }
  };

  const handleDeletePhoto = (index: number) => {
    const updatedList = currentPhotos.filter((_, i) => i !== index);
    const updated = activeTab === 'property'
      ? { ...hotelProfile, photos: updatedList }
      : { ...hotelProfile, roomPhotos: updatedList };
    
    onUpdateProfile(updated);
    showToast('Photo Removed', 'Gallery updated successfully.');
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 min-h-screen pb-16">
      {/* Top Header */}
      <div className="bg-[#1e293b] text-white p-6 sm:p-8 space-y-3 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold text-xl shadow-inner">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                  Unlimited Media Library
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Live on Direct Website
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-1">
                Hotel Visual Media Gallery
              </h1>
            </div>
          </div>
        </div>

        {/* Category Tabs: Property vs Room Photos */}
        <div className="max-w-6xl mx-auto flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('property')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'property'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Building size={16} />
            <span>Property Photos ({hotelProfile.photos?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rooms')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BedDouble size={16} />
            <span>Room Photos ({hotelProfile.roomPhotos?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-6">
        
        {/* Add Photo Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-5">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Plus size={18} className="text-teal-700" />
            <span>Add Unlimited {activeTab === 'property' ? 'Property' : 'Room'} Photos</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: Direct File Upload */}
            <div className="p-4 bg-teal-50/60 rounded-2xl border-2 border-dashed border-teal-300 flex flex-col items-center justify-center text-center space-y-2 hover:bg-teal-50 transition-colors relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Click to upload image from device"
              />
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                <Upload size={20} />
              </div>
              <div>
                <span className="font-bold text-xs text-teal-950 block">Upload Image from Device / Phone</span>
                <span className="text-[11px] text-teal-800">Click to browse JPG, PNG, WEBP (Unlimited)</span>
              </div>
            </div>

            {/* Option 2: Image URL */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 flex flex-col justify-center">
              <span className="font-bold text-xs text-slate-800 block">Or Paste Image URL</span>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-teal-600 outline-hidden font-medium text-slate-900"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddPhoto(); }}
                />
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer shrink-0"
                >
                  Add URL
                </button>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 block mb-2">Or click to add professional presets:</span>
            <div className="flex flex-wrap gap-2">
              {(activeTab === 'property' ? [
                { label: '🏨 Luxury Lobby', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
                { label: '🏊 Swimming Pool', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800' },
                { label: '🍽️ Fine Dining', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800' },
                { label: '🌿 Spa & Wellness', url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800' }
              ] : [
                { label: '🛏️ Deluxe Room', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800' },
                { label: '👑 Executive Suite', url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=800' },
                { label: '🌅 Balcony View Suite', url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800' },
                { label: '🛁 Luxury Bathroom', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800' }
              ]).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddPreset(preset.url, preset.label)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            {activeTab === 'property' ? 'Property Photos' : 'Room Photos'} ({currentPhotos.length})
          </h2>

          {currentPhotos.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 space-y-2">
              <Sparkles size={32} className="mx-auto text-teal-600" />
              <p className="font-bold text-sm text-slate-700">No {activeTab === 'property' ? 'Property' : 'Room'} Photos Added Yet</p>
              <p className="text-xs text-slate-500">Upload unlimited photos above to showcase your hotel to guests.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {currentPhotos.map((photoUrl, idx) => (
                <div key={idx} className="relative group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                  <div className="h-52 overflow-hidden bg-slate-100">
                    <img src={photoUrl} alt={`${activeTab} ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-4 flex items-center justify-between bg-white border-t border-slate-100">
                    <span className="font-bold text-xs text-slate-800">Photo #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(idx)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-rose-200"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
