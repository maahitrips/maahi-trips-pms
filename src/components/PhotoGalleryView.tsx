import React, { useState } from 'react';
import { HotelProfile, GalleryPhoto } from '../types';
import { Sparkles, Trash2, Plus, Upload, CheckCircle2, Building, BedDouble, Tag, Video, Play } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'property' | 'rooms' | 'youtube'>('property');
  const [newUrl, setNewUrl] = useState('');
  const [newTag, setNewTag] = useState('Exterior / Front View');
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');

  const rawPhotos = activeTab === 'property' 
    ? (hotelProfile.photos || []) 
    : (hotelProfile.roomPhotos || []);

  const youtubeVideos = hotelProfile.youtubeVideos || [];

  // Normalize items to GalleryPhoto objects
  const photosList: GalleryPhoto[] = rawPhotos.map((p: any) => {
    if (typeof p === 'string') {
      return { url: p, tag: activeTab === 'property' ? 'General Property' : 'Bedroom - Standard Room' };
    }
    return { url: p.url, tag: p.tag || (activeTab === 'property' ? 'General Property' : 'Bedroom - Standard Room') };
  });

  const propertyTagOptions = [
    'Exterior / Front View',
    'Lobby / Reception',
    'Swimming Pool',
    'Restaurant / Dining',
    'Spa & Wellness',
    'Garden / Exterior',
    'Parking Area',
    'Building View'
  ];

  const roomTagOptions = [
    'Bedroom (General)',
    'Washroom / Bathroom',
    'Deluxe Room - Bedroom',
    'Deluxe Room - Washroom',
    'Super Deluxe Room - Bedroom',
    'Super Deluxe Room - Washroom',
    'Executive Suite - Bedroom',
    'Executive Suite - Washroom',
    'Family Suite',
    'Balcony / View',
    'Room Interior & Decor',
    'Bedding & Amenities'
  ];

  const currentTagOptions = activeTab === 'property' ? propertyTagOptions : roomTagOptions;

  const handleAddPhoto = () => {
    if (!newUrl.trim()) return;
    const newPhotoItem: GalleryPhoto = {
      url: newUrl.trim(),
      tag: newTag.trim() || (activeTab === 'property' ? 'General Property' : 'Bedroom - Standard Room')
    };

    const updatedList = [...rawPhotos, newPhotoItem];
    const updated = activeTab === 'property'
      ? { ...hotelProfile, photos: updatedList }
      : { ...hotelProfile, roomPhotos: updatedList };
    
    onUpdateProfile(updated);
    setNewUrl('');
    showToast(`${activeTab === 'property' ? 'Property' : 'Room'} Photo Added with Tag!`, `Tagged as: ${newPhotoItem.tag}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
        const newPhotoItem: GalleryPhoto = {
          url: compressedBase64,
          tag: newTag.trim() || (activeTab === 'property' ? 'General Property' : 'Bedroom - Standard Room')
        };

        const updatedList = [...rawPhotos, newPhotoItem];
        const updated = activeTab === 'property'
          ? { ...hotelProfile, photos: updatedList }
          : { ...hotelProfile, roomPhotos: updatedList };
        
        onUpdateProfile(updated);
        showToast('Photo Uploaded, Tagged & Compressed!', `Tag: ${newPhotoItem.tag}`);
      };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddPreset = (url: string, label: string, tagPreset: string) => {
    const exists = photosList.some(p => p.url === url);
    if (!exists) {
      const newPhotoItem: GalleryPhoto = {
        url,
        tag: tagPreset
      };
      const updatedList = [...rawPhotos, newPhotoItem];
      const updated = activeTab === 'property'
        ? { ...hotelProfile, photos: updatedList }
        : { ...hotelProfile, roomPhotos: updatedList };
      
      onUpdateProfile(updated);
      showToast('Preset Photo Added!', `${label} (${tagPreset})`);
    } else {
      showToast('Photo Already Exists', label);
    }
  };

  const handleDeletePhoto = (index: number) => {
    const updatedList = rawPhotos.filter((_, i) => i !== index);
    const updated = activeTab === 'property'
      ? { ...hotelProfile, photos: updatedList }
      : { ...hotelProfile, roomPhotos: updatedList };
    
    onUpdateProfile(updated);
    showToast('Photo Removed', 'Gallery updated successfully.');
  };

  const handleUpdateTag = (index: number, newPhotoTag: string) => {
    const updatedList = [...rawPhotos];
    const existing = updatedList[index];
    if (typeof existing === 'string') {
      updatedList[index] = { url: existing, tag: newPhotoTag };
    } else {
      updatedList[index] = { ...existing, tag: newPhotoTag };
    }

    const updated = activeTab === 'property'
      ? { ...hotelProfile, photos: updatedList }
      : { ...hotelProfile, roomPhotos: updatedList };
    
    onUpdateProfile(updated);
    showToast('Photo Tag Updated!', `New Tag: ${newPhotoTag}`);
  };

  const handleAddYoutube = () => {
    if (!newYoutubeUrl.trim()) return;
    const updatedVideos = [...youtubeVideos, newYoutubeUrl.trim()];
    onUpdateProfile({ ...hotelProfile, youtubeVideos: updatedVideos });
    setNewYoutubeUrl('');
    showToast('YouTube Video Added!', 'Tour video linked to hotel gallery successfully.');
  };

  const handleDeleteYoutube = (index: number) => {
    const updatedVideos = youtubeVideos.filter((_, i) => i !== index);
    onUpdateProfile({ ...hotelProfile, youtubeVideos: updatedVideos });
    showToast('YouTube Video Removed', 'Gallery updated.');
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11)
      ? `https://www.youtube.com/embed/${match[2]}`
      : url;
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
                  Unlimited Tagged Media Library
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Live on Direct Website
                </span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-1">
                Hotel Photo Gallery, Room Tags &amp; YouTube Tour
              </h1>
            </div>
          </div>
        </div>

        {/* Category Tabs: Property vs Room Photos vs YouTube */}
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => { setActiveTab('property'); setNewTag('Exterior / Front View'); }}
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
            onClick={() => { setActiveTab('rooms'); setNewTag('Deluxe Room - Bedroom'); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BedDouble size={16} />
            <span>Room Photos ({hotelProfile.roomPhotos?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('youtube')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'youtube'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Video size={16} />
            <span>YouTube Videos ({youtubeVideos.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-6">
        
        {activeTab === 'youtube' ? (
          <div className="space-y-6">
            {/* Add YouTube Video Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Video size={18} className="text-rose-600" />
                <span>Add YouTube Video Tour Link</span>
              </h2>
              <p className="text-xs text-slate-500">
                Paste any YouTube video link (e.g. <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">https://www.youtube.com/watch?v=...</code>) to feature your property walkthrough on the public booking page.
              </p>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={newYoutubeUrl}
                  onChange={(e) => setNewYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-teal-600 outline-hidden font-medium text-slate-900"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddYoutube(); }}
                />
                <button
                  type="button"
                  onClick={handleAddYoutube}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>Add Video</span>
                </button>
              </div>
            </div>

            {/* YouTube Videos List */}
            <div className="space-y-4">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Embedded YouTube Tours ({youtubeVideos.length})
              </h2>

              {youtubeVideos.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 space-y-2">
                  <Video size={32} className="mx-auto text-teal-600" />
                  <p className="font-bold text-sm text-slate-700">No YouTube Videos Added Yet</p>
                  <p className="text-xs text-slate-500">Add YouTube tour links above so guests can watch your hotel video on the direct booking page.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {youtubeVideos.map((vidUrl, idx) => {
                    const embedUrl = getYouTubeEmbedUrl(vidUrl);
                    return (
                      <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-md flex flex-col justify-between">
                        <div className="h-56 bg-slate-900 relative">
                          {embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title={`YouTube Tour ${idx + 1}`}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 text-xs">Invalid YouTube URL</div>
                          )}
                        </div>
                        <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-slate-600 truncate">{vidUrl}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteYoutube(idx)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-rose-200 shrink-0"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Add Photo Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Plus size={18} className="text-teal-700" />
                  <span>Add Unlimited {activeTab === 'property' ? 'Property' : 'Room'} Photos with Tag</span>
                </h2>

                {/* Tag Selection Dropdown + Custom Input */}
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-300">
                  <Tag size={15} className="text-teal-700 shrink-0 ml-1" />
                  <span className="text-xs font-bold text-slate-700 shrink-0">Photo Tag:</span>
                  <input
                    type="text"
                    list="tag-options"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Select or type tag (e.g. Washroom - Standard Room)..."
                    className="text-xs bg-white font-bold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-teal-600 outline-hidden w-60"
                  />
                  <datalist id="tag-options">
                    {currentTagOptions.map((opt, i) => (
                      <option key={i} value={opt} />
                    ))}
                  </datalist>
                </div>
              </div>

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
                    <span className="text-[11px] text-teal-800">Tagged as: <strong>{newTag}</strong> (Unlimited)</span>
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
                <span className="text-xs font-bold text-slate-500 block mb-2">Or click to add professional presets with tags:</span>
                <div className="flex flex-wrap gap-2">
                  {(activeTab === 'property' ? [
                    { label: '🏨 Luxury Lobby', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800', tag: 'Lobby / Reception' },
                    { label: '🏊 Swimming Pool', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800', tag: 'Swimming Pool' },
                    { label: '🍽️ Fine Dining', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=800', tag: 'Restaurant / Dining' },
                    { label: '🌿 Spa & Wellness', url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800', tag: 'Spa & Wellness' }
                  ] : [
                    { label: '🛏️ Deluxe Bedroom', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800', tag: 'Deluxe Room - Bedroom' },
                    { label: '🛁 Deluxe Washroom', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800', tag: 'Deluxe Room - Washroom' },
                    { label: '👑 Suite Bedroom', url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=800', tag: 'Executive Suite - Bedroom' },
                    { label: '🌅 Balcony View', url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800', tag: 'Balcony / View' }
                  ]).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddPreset(preset.url, preset.label, preset.tag)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{preset.label}</span>
                      <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-md font-mono">{preset.tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="space-y-4">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {activeTab === 'property' ? 'Property Photos' : 'Room Photos'} ({photosList.length})
              </h2>

              {photosList.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 space-y-2">
                  <Sparkles size={32} className="mx-auto text-teal-600" />
                  <p className="font-bold text-sm text-slate-700">No {activeTab === 'property' ? 'Property' : 'Room'} Photos Added Yet</p>
                  <p className="text-xs text-slate-500">Upload unlimited tagged photos above to showcase your hotel rooms and amenities.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {photosList.map((photo, idx) => (
                    <div key={idx} className="relative group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-md flex flex-col justify-between">
                      <div>
                        <div className="h-48 overflow-hidden bg-slate-100 relative">
                          <img src={photo.url} alt={photo.tag} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/20 shadow-sm flex items-center gap-1">
                            <Tag size={12} className="text-teal-400" />
                            <span>{photo.tag}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                        <input
                          type="text"
                          list="tag-options-grid"
                          value={photo.tag}
                          onChange={(e) => handleUpdateTag(idx, e.target.value)}
                          className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-teal-600 outline-hidden flex-1"
                          placeholder="Edit tag..."
                        />
                        <datalist id="tag-options-grid">
                          {currentTagOptions.map((opt, i) => (
                            <option key={i} value={opt} />
                          ))}
                        </datalist>

                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(idx)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-rose-200 shrink-0"
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
          </>
        )}

      </div>
    </div>
  );
};
