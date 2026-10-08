import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Building2, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  BedDouble, 
  Wifi, 
  Coffee, 
  Car, 
  Tv, 
  AirVent, 
  Utensils, 
  ChevronRight, 
  ArrowLeft, 
  Copy, 
  Check,
  AlertCircle
} from 'lucide-react';
import { db } from '../services/firebase';
import { doc, getDoc, getDocs, collection, setDoc } from 'firebase/firestore';

interface PublicHotelBookingViewProps {
  slug: string;
}

export const PublicHotelBookingView: React.FC<PublicHotelBookingViewProps> = ({ slug }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hotelData, setHotelData] = useState<any>(null);
  const [comingSoon, setComingSoon] = useState(false);
  const [hotelId, setHotelId] = useState<string>('');

  // Search state
  const [checkIn, setCheckIn] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // Availability results
  const [searching, setSearching] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [nightsCount, setNightsCount] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);

  // Booking form state
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Spam protection
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<any | null>(null);

  useEffect(() => {
    fetchHotelFromFirestore();
  }, [slug]);

  const fetchHotelFromFirestore = async () => {
    try {
      setLoading(true);
      setError(null);

      let foundHotelId = '';
      
      // 1. Try slug index
      try {
        const slugDocRef = doc(db, 'hotelSlugs', slug);
        const slugSnap = await getDoc(slugDocRef);
        if (slugSnap.exists()) {
          foundHotelId = slugSnap.data()?.hotelId;
        }
      } catch (e) {
        console.warn('Slug index lookup error:', e);
      }

      // 2. Fallback: scan all hotel bundles
      if (!foundHotelId) {
        const bundlesSnap = await getDocs(collection(db, 'hotelBundles'));
        for (const d of bundlesSnap.docs) {
          const data = d.data();
          const pSlug = data?.profile?.slug || data?.slug;
          if (pSlug === slug) {
            foundHotelId = d.id;
            break;
          }
        }
      }

      if (!foundHotelId) {
        throw new Error('Property not found or slug does not exist.');
      }

      setHotelId(foundHotelId);

      const bundleDocRef = doc(db, 'hotelBundles', foundHotelId);
      const bundleSnap = await getDoc(bundleDocRef);
      if (!bundleSnap.exists()) {
        throw new Error('Property bundle data not found.');
      }

      const bundle = bundleSnap.data();
      const profile = bundle.profile || {};
      const isPublished = profile.isPublished !== false;

      if (!isPublished) {
        throw new Error('This property is not available for public booking.');
      }

      const rooms = bundle.rooms || [];
      const hasRates = rooms.some((r: any) => Number(r.baseRate) > 0);

      if (!hasRates) {
        setComingSoon(true);
        setHotelData({ profile });
        return;
      }

      const dataFormatted = {
        hotelId: foundHotelId,
        profile: {
          name: profile.name || 'Hotel',
          tagline: profile.tagline || '',
          address: profile.address || '',
          city: profile.city || '',
          phone: profile.phone || '',
          whatsapp: profile.whatsapp || profile.phone || '',
          email: profile.email || '',
          currencySymbol: profile.currencySymbol || '₹',
          checkInTime: profile.checkInTime || '12:00 PM',
          checkOutTime: profile.checkOutTime || '11:00 AM',
          slug: profile.slug || slug,
          description: profile.description || '',
          heroPhotoUrl: profile.heroPhotoUrl || '',
          photos: profile.photos || [],
          roomPhotos: profile.roomPhotos || [],
          amenities: profile.amenities || [],
          policies: profile.policies || ''
        },
        rooms: rooms.map((r: any) => ({
          id: r.id,
          number: r.number,
          name: r.name,
          type: r.type || 'Standard Room',
          baseRate: Number(r.baseRate) || 0,
          maxOccupancy: Number(r.maxOccupancy) || 2,
          amenities: r.amenities || [],
          photoUrl: r.photoUrl || ''
        })),
        rawBundle: bundle
      };

      setHotelData(dataFormatted);

      // Set SEO meta tags & JSON-LD
      if (dataFormatted.profile) {
        document.title = `${dataFormatted.profile.name} - Direct Booking`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content', dataFormatted.profile.description || dataFormatted.profile.tagline);
        } else {
          const meta = document.createElement('meta');
          meta.name = 'description';
          meta.content = dataFormatted.profile.description || dataFormatted.profile.tagline;
          document.head.appendChild(meta);
        }

        const scriptId = 'json-ld-hotel-schema';
        let script = document.getElementById(scriptId) as HTMLScriptElement;
        if (!script) {
          script = document.createElement('script') as HTMLScriptElement;
          script.id = scriptId;
          script.type = 'application/ld+json';
          document.head.appendChild(script);
        }
        script.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Hotel",
          "name": dataFormatted.profile.name,
          "description": dataFormatted.profile.description,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": dataFormatted.profile.address,
            "addressLocality": dataFormatted.profile.city
          },
          "telephone": dataFormatted.profile.phone,
          "priceRange": "₹₹"
        });
      }
    } catch (err: any) {
      setError(err.message || 'This property is not available.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId || !hotelData) return;
    try {
      setSearching(true);
      // Fetch latest bundle snapshot directly from Firestore
      const bundleSnap = await getDoc(doc(db, 'hotelBundles', hotelId));
      if (!bundleSnap.exists()) throw new Error('Property data not found');
      const bundle = bundleSnap.data();
      const rooms = bundle.rooms || [];
      const bookings = bundle.bookings || [];

      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);
      const nights = Math.max(1, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));
      setNightsCount(nights);

      const roomTypesMap: Record<string, any> = {};
      rooms.forEach((r: any) => {
        const rType = r.type || 'Standard Room';
        if (!roomTypesMap[rType]) {
          roomTypesMap[rType] = {
            type: rType,
            baseRate: Number(r.baseRate) || 0,
            maxOccupancy: Number(r.maxOccupancy) || 2,
            totalCount: 0,
            availableCount: 0,
            photoUrl: r.photoUrl || ''
          };
        }
        roomTypesMap[rType].totalCount += 1;
      });

      const bookedRoomNumbers = new Set<string>();
      bookings.forEach((b: any) => {
        if (b.status === 'Cancelled' || b.status === 'Rejected') return;
        const bIn = b.checkIn;
        const bOut = b.checkOut;
        if (!(bIn >= checkOut || bOut <= checkIn)) {
          if (b.roomNumber) bookedRoomNumbers.add(b.roomNumber);
        }
      });

      rooms.forEach((r: any) => {
        const rType = r.type || 'Standard Room';
        if (!bookedRoomNumbers.has(r.number)) {
          if (roomTypesMap[rType]) {
            roomTypesMap[rType].availableCount += 1;
          }
        }
      });

      const available = Object.values(roomTypesMap).filter((rt: any) => rt.availableCount > 0 && rt.baseRate > 0);
      setAvailableRooms(available);
    } catch (err: any) {
      alert(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !hotelId) return;

    if (honeypot) {
      alert('Spam detected');
      return;
    }

    try {
      setSubmitting(true);
      const bundleSnap = await getDoc(doc(db, 'hotelBundles', hotelId));
      if (!bundleSnap.exists()) throw new Error('Property not found');
      const bundle = bundleSnap.data();
      const rooms = bundle.rooms || [];
      const bookings = bundle.bookings || [];

      const matchingRoom = rooms.find((r: any) => (r.type || 'Standard Room') === selectedRoom.type && Number(r.baseRate) > 0);
      if (!matchingRoom) {
        throw new Error('Selected room type is no longer available');
      }

      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);
      const nights = Math.max(1, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));
      const baseRate = Number(matchingRoom.baseRate) || 0;
      const totalAmount = baseRate * nights;

      const bookingId = `bk-web-${Date.now()}`;
      const bookingRef = `WEB-${Math.floor(100000 + Math.random() * 900000)}`;

      const newBooking = {
        id: bookingId,
        bookingRef,
        guestName: String(guestName).trim(),
        phone: String(phone).trim(),
        email: email ? String(email).trim() : '',
        checkIn,
        checkOut,
        adults: Number(adults) || 1,
        children: Number(children) || 0,
        roomTypeId: matchingRoom.type || selectedRoom.type,
        roomNumber: matchingRoom.number || '',
        status: 'Pending',
        source: 'Direct (Website)',
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        specialRequest: specialRequest ? String(specialRequest).trim() : '',
        createdAt: new Date().toISOString()
      };

      const updatedBookings = [newBooking, ...(bookings || [])];

      // Write to Firestore bundle doc
      await setDoc(doc(db, 'hotelBundles', hotelId), {
        ...bundle,
        bookings: updatedBookings,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Write to liveBookings subcollection for instant PMS sync
      await setDoc(doc(db, 'hotelBundles', hotelId, 'liveBookings', bookingId), newBooking, { merge: true });

      setBookingResult({
        bookingRef,
        totalAmount,
        hotelName: bundle.profile?.name || 'Hotel',
        whatsapp: bundle.profile?.whatsapp || bundle.profile?.phone || ''
      });
    } catch (err: any) {
      alert(err.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-300">Loading public booking page...</p>
        </div>
      </div>
    );
  }

  if (error || !hotelData) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white p-6 font-sans">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <h1 className="text-xl font-black">Property Not Available</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            {error || 'The hotel you are looking for is not published or does not exist.'}
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Go to Maahi Trips PMS
          </a>
        </div>
      </div>
    );
  }

  if (comingSoon) {
    const { profile } = hotelData;
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white p-6 font-sans">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles size={28} />
          </div>
          <h1 className="text-xl font-black">{profile.name} - Coming Soon</h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            This property is set up and published, but room rates are currently being configured by management. Please check back soon or contact us directly.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Phone size={14} /> Call Hotel
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { profile, rooms } = hotelData;

  if (bookingResult) {
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${profile.whatsapp || profile.phone}&text=Hello%20${encodeURIComponent(profile.name)}%2C%20I%20have%20submitted%20a%20new%20booking%20Ref%3A%20${bookingResult.bookingRef}%20for%20${encodeURIComponent(guestName)}%20(${checkIn}%20to%20${checkOut}).%20Please%20confirm!`;

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-lg w-full bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
              Booking Submitted Successfully
            </span>
            <h1 className="text-2xl font-black tracking-tight mt-1">Thank You, {guestName}!</h1>
            <p className="text-xs text-slate-500">Your reservation request has been received and is pending staff confirmation.</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Booking Reference:</span>
              <span className="font-mono font-bold text-teal-900 text-sm">{bookingResult.bookingRef}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Hotel:</span>
              <span className="font-bold">{profile.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Dates:</span>
              <span className="font-bold">{checkIn} to {checkOut} ({nightsCount} Nights)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Total Amount:</span>
              <span className="font-extrabold text-emerald-700">{profile.currencySymbol || '₹'}{bookingResult.totalAmount} (Pay at Hotel)</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <MessageCircle size={18} />
              <span>Chat on WhatsApp to Confirm</span>
            </a>
            <button
              onClick={() => { setBookingResult(null); setSelectedRoom(null); }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Book Another Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Top Bar / Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight">{profile.name}</h1>
              <p className="text-[10px] text-slate-400">{profile.city}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Phone size={13} />
                <span className="hidden sm:inline">Call</span>
              </a>
            )}
            {profile.whatsapp && (
              <a
                href={`https://api.whatsapp.com/send?phone=${profile.whatsapp}&text=Hello%2C%20I%20would%20like%20to%20inquire%20about%20booking%20at%20${encodeURIComponent(profile.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <MessageCircle size={13} />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Photo & Gallery Preview */}
      <div className="max-w-5xl mx-auto px-4 pt-4 sm:pt-6">
        <div className="relative h-64 sm:h-96 rounded-3xl overflow-hidden shadow-xl bg-slate-200">
          <img
            src={profile.heroPhotoUrl || profile.photos?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200'}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-500/30 text-teal-300 backdrop-blur-md w-max border border-teal-400/30 mb-2">
              Official Direct Booking
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">{profile.name}</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-1.5">
              <MapPin size={15} className="text-teal-400 shrink-0" />
              <span>{profile.address}, {profile.city}</span>
            </p>
          </div>
        </div>

        {/* Thumbnails Gallery */}
        {profile.photos && profile.photos.length > 1 && (
          <div className="grid grid-cols-4 gap-2.5 mt-3">
            {profile.photos.slice(0, 4).map((pUrl: string, idx: number) => (
              <div key={idx} className="h-20 sm:h-24 rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-white">
                <img src={pUrl} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content & Search Widget */}
      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left / Main Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* About / Description rendered via ReactMarkdown */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-3">
            <h3 className="text-base font-black text-slate-900">About {profile.name}</h3>
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed prose prose-slate max-w-none">
              <ReactMarkdown>{profile.description || profile.tagline}</ReactMarkdown>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Clock size={16} className="text-teal-700" />
                <span>Check-in: <strong>{profile.checkInTime || '12:00 PM'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Clock size={16} className="text-teal-700" />
                <span>Check-out: <strong>{profile.checkOutTime || '11:00 AM'}</strong></span>
              </div>
            </div>
          </div>

          {/* Amenities */}
          {profile.amenities && profile.amenities.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-base font-black text-slate-900">Popular Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profile.amenities.map((amenity: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800">
                    <CheckCircle2 size={16} className="text-teal-700 shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room Photos Gallery */}
          {profile.roomPhotos && profile.roomPhotos.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-base font-black text-slate-900">Room Photos &amp; Interiors</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profile.roomPhotos.map((rPhoto: string, idx: number) => (
                  <div key={idx} className="h-36 rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-slate-100">
                    <img src={rPhoto} alt={`Room ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room Types & Availability Section */}
          <div id="rooms-section" className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Available Rooms &amp; Rates</h3>
            
            {availableRooms.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3 shadow-sm">
                <BedDouble size={36} className="text-teal-700 mx-auto" />
                <h4 className="font-bold text-sm text-slate-800">Select Dates to Check Live Rates</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Use the search box on the right (or below on mobile) to pick your check-in &amp; check-out dates and view available rooms.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableRooms.map((roomType, idx) => (
                  <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row">
                    <div className="sm:w-56 h-48 sm:h-auto bg-slate-100 relative">
                      <img
                        src={roomType.photoUrl || profile.heroPhotoUrl || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800'}
                        alt={roomType.type}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-black text-base text-slate-900">{roomType.type}</h4>
                          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                            {roomType.availableCount} Rooms Available
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Max Occupancy: {roomType.maxOccupancy} Guests</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div>
                          <span className="text-lg font-black text-slate-900">{profile.currencySymbol || '₹'}{roomType.baseRate}</span>
                          <span className="text-[11px] text-slate-500 block">per night</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedRoom(roomType)}
                          className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          Select Room
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Policies */}
          {profile.policies && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-2">
              <h3 className="text-sm font-black text-slate-900">Hotel Policies</h3>
              <div className="text-xs text-slate-600 leading-relaxed prose prose-slate max-w-none">
                <ReactMarkdown>{profile.policies}</ReactMarkdown>
              </div>
            </div>
          )}

        </div>

        {/* Right / Sticky Search & Booking Widget */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 sticky top-20 space-y-5">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">Direct Booking</span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">Check Availability</h3>
            </div>

            <form onSubmit={handleSearch} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Check-in Date</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:bg-white focus:border-teal-700 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Check-out Date</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800 focus:bg-white focus:border-teal-700 outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Adults</label>
                  <select
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Children</label>
                  <select
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-800"
                  >
                    {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Child{n !== 1 ? 'ren' : ''}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={searching}
                className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {searching ? 'Checking...' : 'Search Available Rooms'}
              </button>
            </form>

            {/* Selected Room & Booking Form Modal / Drawer */}
            {selectedRoom && (
              <div className="mt-6 pt-5 border-t border-slate-200 space-y-4 animate-in fade-in">
                <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Selected Room</span>
                  <div className="font-bold text-slate-900 text-sm">{selectedRoom.type}</div>
                  <div className="text-xs font-extrabold text-emerald-700">
                    {profile.currencySymbol || '₹'}{selectedRoom.baseRate * nightsCount} total for {nightsCount} night{nightsCount > 1 ? 's' : ''}
                  </div>
                </div>

                <form onSubmit={handleBookSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number (WhatsApp) *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rahul@example.com"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Special Requests</label>
                    <textarea
                      value={specialRequest}
                      onChange={(e) => setSpecialRequest(e.target.value)}
                      placeholder="Early check-in, quiet room, etc."
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium"
                    ></textarea>
                  </div>

                  {/* Honeypot hidden spam field */}
                  <div className="hidden">
                    <input
                      type="text"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {submitting ? 'Submitting Booking...' : 'Confirm Reservation (Pay at Hotel)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRoom(null)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
