import React, { useState } from 'react';
import { HotelProfile, Room } from '../types';
import { Sparkles, Trash2, Plus, Image as ImageIcon, CheckCircle2, Globe, ExternalLink, RefreshCw } from 'lucide-react';

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
  const [newUrl, setNewUrl] = useState('');

  const handleAddPhoto = () => {
    if (!newUrl.trim()) return;
    const currentPhotos = hotelProfile.photos || [];
    const updated = { ...hotelProfile, photos: [...currentPhotos, newUrl.trim()] };
    onUpdateProfile(updated);
    setNewUrl('');
    showToast('Photo Added Successfully!', 'Gallery updated and synced with website.');
  };

  const handleAddPreset = (url: string, label: string) => {
    const currentPhotos = hotelProfile.photos || [];
    if (!currentPhotos.includes(url)) {
      const updated = { ...hotelProfile, photos: [...currentPhotos, url] };
      onUpdateProfile(updated);
      showToast('Preset Photo Added!', label);
    } else {
      showToast('Photo Already Exists', label);
    }
  };

  const handleDeletePhoto = (index: number) => {
    const currentPhotos = hotelProfile.photos || [];
    const updatedPhotos = currentPhotos.filter((_, i) => i !== index);
    const updated = { ...hotelProfile, photos: updatedPhotos };
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
                  Property Visual Media
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Live on Direct Website
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-1">
                Hotel Photo Gallery ({hotelProfile.photos?.length || 0} Photos)
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-6">
        
        {/* Add Photo Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Plus size={18} className="text-teal-700" />
            <span>Add New Property Photo</span>
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Paste Image URL (e.g. https://images.unsplash.com/...)"
              className="flex-1 px-4 py-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-hidden font-medium text-slate-900"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddPhoto(); }}
            />
            <button
              type="button"
              onClick={handleAddPhoto}
              className="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus size={16} />
              <span>Add Photo</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-500 block mb-2">Or click to add professional hotel presets:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '🏨 Luxury Lobby', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
                { label: '🛏️ Deluxe Room', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800' },
                { label: '🏊 Swimming Pool', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800' },
                { label: '🍽️ Fine Dining', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800' },
                { label: '🌿 Spa & Wellness', url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800' }
              ].map((preset, idx) => (
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
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Current Gallery ({hotelProfile.photos?.length || 0})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {(hotelProfile.photos || []).map((photoUrl, idx) => (
              <div key={idx} className="relative group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                <div className="h-52 overflow-hidden bg-slate-100">
                  <img src={photoUrl} alt={`Hotel ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
        </div>

      </div>
    </div>
  );
};
