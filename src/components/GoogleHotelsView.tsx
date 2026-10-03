import React, { useState } from 'react';
import { HotelProfile, Room, Booking } from '../types';
import { 
  Globe, 
  Search, 
  CheckCircle2, 
  Star, 
  MapPin, 
  ExternalLink, 
  RefreshCw, 
  Code, 
  FileText, 
  Sparkles,
  ShieldCheck,
  Check,
  Copy,
  Building
} from 'lucide-react';

interface GoogleHotelsViewProps {
  hotelProfile: HotelProfile;
  rooms: Room[];
  bookings: Booking[];
  showToast: (title: string, subtitle?: string) => void;
}

export const GoogleHotelsView: React.FC<GoogleHotelsViewProps> = ({
  hotelProfile,
  rooms = [],
  bookings = [],
  showToast
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'feed' | 'schema'>('preview');
  const [googleSubTab, setGoogleSubTab] = useState<'prices' | 'overview' | 'reviews' | 'photos' | 'about'>('prices');
  const [isSyncedWithGoogle, setIsSyncedWithGoogle] = useState<boolean>(true);
  const [isFeedGenerating, setIsFeedGenerating] = useState<boolean>(false);

  const lowestRate = rooms.length > 0 ? Math.min(...rooms.map(r => r.baseRate || 3500)) : 1807;

  const handleSyncFeed = () => {
    setIsFeedGenerating(true);
    setTimeout(() => {
      setIsFeedGenerating(false);
      setIsSyncedWithGoogle(true);
      showToast('Google Hotel Center Synced!', 'XML Price Feed & Free Booking Links updated successfully.');
    }, 1200);
  };

  const copySchemaCode = () => {
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Hotel",
      "name": hotelProfile.name,
      "address": hotelProfile.address || "City Center, India",
      "telephone": hotelProfile.phone || "+91 98765 43210",
      "priceRange": `₹${lowestRate} - ₹${lowestRate * 3}`,
      "starRating": {
        "@type": "Rating",
        "ratingValue": "4.9"
      }
    }, null, 2);
    navigator.clipboard.writeText(jsonLd);
    showToast('Schema.org JSON-LD Copied!', 'Paste into your website header for Google Rich Results.');
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 min-h-screen pb-16">
      {/* Top Banner Header */}
      <div className="bg-[#1e293b] text-white p-5 sm:p-8 space-y-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xl shadow-inner">
              <Search size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                  Google Hotels &amp; Free Booking Links
                </span>
                {isSyncedWithGoogle && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Official Site Badge Active
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mt-1">
                Google Meta-Search &amp; Official Direct Booking Integration
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncFeed}
              disabled={isFeedGenerating}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={isFeedGenerating ? 'animate-spin' : ''} />
              <span>{isFeedGenerating ? 'Syncing with Google...' : 'Sync Live Rates with Google'}</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="max-w-6xl mx-auto flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('preview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'preview'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Globe size={14} />
            <span>Google Hotels Preview (Live Mockup)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('feed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'feed'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText size={14} />
            <span>Google Hotel Center XML Feed</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('schema')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'schema'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Code size={14} />
            <span>Schema.org JSON-LD SEO</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-6">

        {/* TAB 1: GOOGLE HOTELS UI PREVIEW (MATCHING USER SCREENSHOT EXACTLY) */}
        {activeSubTab === 'preview' && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Google Travel / Hotels Top Header Mockup */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{hotelProfile.name}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="text-amber-500 font-bold flex items-center gap-0.5">
                    <Star size={13} className="fill-amber-500" /> 4.9
                  </span>
                  <span>• Hotel in {hotelProfile.address || 'Goa, India'}</span>
                  <span>• Free Wi-Fi • Pool</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Google Free Booking Links Active
                </span>
              </div>
            </div>

            {/* Google Tabs Bar (Overview, Prices, Reviews, Photos, About) matching user screenshot */}
            <div className="flex items-center gap-6 px-6 border-b border-slate-200 text-xs font-bold text-slate-600 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'prices', label: 'Prices' },
                { id: 'reviews', label: 'Reviews' },
                { id: 'photos', label: 'Photos' },
                { id: 'about', label: 'About' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setGoogleSubTab(tab.id as any)}
                  className={`py-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    googleSubTab === tab.id
                      ? 'border-blue-600 text-blue-600 font-black'
                      : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* SubTab Content: Prices (matching user uploaded screenshot) */}
            {googleSubTab === 'prices' && (
              <div className="p-6 space-y-4 bg-slate-50/60">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">Hotels.com</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-slate-900">₹{lowestRate + 83}</span>
                      <a href="#visit" onClick={(e) => { e.preventDefault(); showToast('Redirecting to Hotels.com feed', 'Affiliate link'); }} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-full border border-slate-300 transition-colors">
                        Visit site
                      </a>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">Free cancellation until 5 Oct • Free Wi-Fi</div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">MakeMyTrip.com</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-slate-900">₹{lowestRate - 250}</span>
                      <a href="#visit" onClick={(e) => { e.preventDefault(); showToast('Redirecting to MakeMyTrip feed', 'OTA link'); }} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-full border border-slate-300 transition-colors">
                        Visit site
                      </a>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">Free cancellation until 6 Oct</div>
                </div>

                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">All options &amp; Official Direct Site</h3>
                </div>

                {/* OFFICIAL SITE BANNER (MATCHING USER SCREENSHOT EXACTLY) */}
                <div className="bg-blue-50/80 rounded-xl border-2 border-blue-500 p-4 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">{hotelProfile.name}</span>
                      <span className="px-2 py-0.5 bg-blue-600 text-white font-bold text-[10px] rounded-full flex items-center gap-1 shadow-xs">
                        <Check size={10} strokeWidth={3} /> Official site
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-blue-700">₹{lowestRate}</span>
                      <button
                        type="button"
                        onClick={() => showToast('Direct Booking Link Opened', 'Zero commission direct booking')}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-sm transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>Visit site</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-blue-900 font-medium">
                    ⚡ Guaranteed Best Rate • Free Breakfast included • Book direct with hotel PMS
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">Agoda</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-slate-900">₹{lowestRate - 652}</span>
                      <button type="button" onClick={() => showToast('Redirecting to Agoda')} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-full border border-slate-300">
                        Visit site
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {googleSubTab === 'overview' && (
              <div className="p-6 space-y-4 text-xs text-slate-700">
                <p className="leading-relaxed">
                  {hotelProfile.tagline || 'Welcome to our luxurious property offering world-class hospitality, elegant rooms, modern amenities, and prime location convenience.'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="block font-bold text-slate-900">Check-in</span>
                    <span className="text-slate-500">12:00 PM</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="block font-bold text-slate-900">Check-out</span>
                    <span className="text-slate-500">11:00 AM</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="block font-bold text-slate-900">Popular for</span>
                    <span className="text-slate-500">Families &amp; Couples</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="block font-bold text-slate-900">Rating</span>
                    <span className="text-slate-500">4.9 / 5 Stars</span>
                  </div>
                </div>
              </div>
            )}

            {googleSubTab === 'reviews' && (
              <div className="p-6 space-y-4 text-xs text-slate-700">
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 p-4 rounded-xl">
                  <div className="text-2xl font-black text-amber-800">4.9</div>
                  <div>
                    <div className="font-bold text-amber-900">Exceptional Guest Reviews</div>
                    <div className="text-[11px] text-amber-700">Based on 342 verified Google Travel reviews</div>
                  </div>
                </div>
              </div>
            )}

            {googleSubTab === 'photos' && (
              <div className="p-6 grid grid-cols-3 gap-3">
                <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400" alt="Hotel" className="rounded-xl h-36 object-cover" />
                <img src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=400" alt="Room" className="rounded-xl h-36 object-cover" />
                <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=400" alt="Pool" className="rounded-xl h-36 object-cover" />
              </div>
            )}

            {googleSubTab === 'about' && (
              <div className="p-6 space-y-3 text-xs text-slate-700">
                <h4 className="font-bold text-slate-900">Amenities &amp; Highlights</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-lg">✓ Free Wi-Fi</div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">✓ Swimming Pool</div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">✓ Free Breakfast</div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">✓ Air Conditioning</div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">✓ Free Parking</div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">✓ Room Service</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GOOGLE HOTEL CENTER XML FEED */}
        {activeSubTab === 'feed' && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-900">Google Hotel Center XML Feed &amp; Free Booking Links</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Google queries this XML endpoint every 4 hours to index your live room rates and display your <strong>"Official site"</strong> badge in Google Search &amp; Maps.
              </p>
            </div>

            <div className="bg-slate-900 text-teal-300 font-mono text-xs p-4 rounded-xl overflow-x-auto shadow-inner">
              <pre>{`<?xml version="1.0" encoding="UTF-8"?>
<data>
  <listings>
    <listing>
      <id>${hotelProfile.name.toLowerCase().replace(/\s+/g, '_')}</id>
      <name>${hotelProfile.name}</name>
      <address>${hotelProfile.address || 'India'}</address>
      <phone>${hotelProfile.phone || '+919876543210'}</phone>
    </listing>
  </listings>
  <prices>
    <price roomId="all" currency="INR" amount="${lowestRate}" />
  </prices>
</data>`}</pre>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`<data><name>${hotelProfile.name}</name><rate>${lowestRate}</rate></data>`);
                  showToast('XML Feed Copied!', 'Ready for Google Hotel Center upload.');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Copy size={13} />
                <span>Copy XML Feed Endpoint</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: SCHEMA.ORG JSON-LD */}
        {activeSubTab === 'schema' && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-5">
            <div>
              <h3 className="text-base font-black text-slate-900">Schema.org Structured Data (JSON-LD)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Embed this structured data in your website HTML header to enable Google Hotel Rich Snippets and Knowledge Graph cards.
              </p>
            </div>

            <div className="bg-slate-900 text-emerald-300 font-mono text-xs p-4 rounded-xl overflow-x-auto shadow-inner">
              <pre>{JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Hotel",
                "name": hotelProfile.name,
                "address": hotelProfile.address || "City Center, India",
                "telephone": hotelProfile.phone || "+91 98765 43210",
                "priceRange": `₹${lowestRate} - ₹${lowestRate * 3}`,
                "starRating": {
                  "@type": "Rating",
                  "ratingValue": "4.9"
                }
              }, null, 2)}</pre>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={copySchemaCode}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Copy size={13} />
                <span>Copy JSON-LD Schema</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
