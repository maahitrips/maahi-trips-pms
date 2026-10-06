import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Firebase for server API endpoints
let db: any = null;
try {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const fbApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
      ? getFirestore(fbApp, firebaseConfig.firestoreDatabaseId)
      : getFirestore(fbApp);
  }
} catch (e) {
  console.warn('Firebase server initialization warning:', e);
}

// Initialize GoogleGenAI SDK per SKILL.md guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// --- Public Booking API Endpoints ---

// 1. Get Hotel Public Page Data
app.get('/api/public/hotel/:slug', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { slug } = req.params;
    if (!slug) return res.status(400).json({ error: 'Slug is required' });

    let hotelId = '';
    const slugDocRef = doc(db, 'hotelSlugs', slug);
    const slugSnap = await getDoc(slugDocRef);
    if (slugSnap.exists()) {
      hotelId = slugSnap.data()?.hotelId;
    }

    if (!hotelId) {
      const bundlesSnap = await getDocs(collection(db, 'hotelBundles'));
      for (const d of bundlesSnap.docs) {
        const data = d.data();
        const pSlug = data?.profile?.slug || data?.slug;
        if (pSlug === slug) {
          hotelId = d.id;
          break;
        }
      }
    }

    if (!hotelId) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const bundleDocRef = doc(db, 'hotelBundles', hotelId);
    const bundleSnap = await getDoc(bundleDocRef);
    if (!bundleSnap.exists()) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const bundle = bundleSnap.data();
    const profile = bundle.profile || {};
    const isPublished = profile.isPublished !== false;

    if (!isPublished) {
      return res.status(404).json({ error: 'This property is not available for public booking.' });
    }

    const rooms = bundle.rooms || [];
    const hasRates = rooms.some((r: any) => Number(r.baseRate) > 0);

    if (!hasRates) {
      return res.json({ comingSoon: true, profile: { name: profile.name } });
    }

    return res.json({
      hotelId,
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
      }))
    });
  } catch (err: any) {
    console.error('Public hotel fetch error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 2. Check Availability
app.post('/api/public/availability', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { slug, checkIn, checkOut, adults, children } = req.body;
    if (!slug || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Slug, checkIn and checkOut are required' });
    }

    let hotelId = '';
    const slugDocRef = doc(db, 'hotelSlugs', slug);
    const slugSnap = await getDoc(slugDocRef);
    if (slugSnap.exists()) hotelId = slugSnap.data()?.hotelId;

    if (!hotelId) {
      const bundlesSnap = await getDocs(collection(db, 'hotelBundles'));
      for (const d of bundlesSnap.docs) {
        if (d.data()?.profile?.slug === slug) {
          hotelId = d.id;
          break;
        }
      }
    }

    if (!hotelId) return res.status(404).json({ error: 'Property not found' });

    const bundleDocRef = doc(db, 'hotelBundles', hotelId);
    const bundleSnap = await getDoc(bundleDocRef);
    if (!bundleSnap.exists()) return res.status(404).json({ error: 'Property not found' });

    const bundle = bundleSnap.data();
    const rooms = bundle.rooms || [];
    const bookings = bundle.bookings || [];

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const nights = Math.max(1, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));

    const roomTypesMap: Record<string, { type: string; baseRate: number; maxOccupancy: number; totalCount: number; availableCount: number; photoUrl: string }> = {};

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

    const availableRooms = Object.values(roomTypesMap).filter(rt => rt.availableCount > 0 && rt.baseRate > 0);

    return res.json({ availableRooms, nights });
  } catch (err: any) {
    console.error('Availability check error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 3. Create Public Booking
app.post('/api/public/booking', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { slug, guestName, phone, email, checkIn, checkOut, adults, children, roomTypeId, specialRequest, honeypot } = req.body;
    
    if (honeypot) {
      return res.status(400).json({ error: 'Invalid submission' });
    }

    if (!slug || !guestName || !phone || !checkIn || !checkOut || !roomTypeId) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    let hotelId = '';
    const slugDocRef = doc(db, 'hotelSlugs', slug);
    const slugSnap = await getDoc(slugDocRef);
    if (slugSnap.exists()) hotelId = slugSnap.data()?.hotelId;

    if (!hotelId) {
      const bundlesSnap = await getDocs(collection(db, 'hotelBundles'));
      for (const d of bundlesSnap.docs) {
        if (d.data()?.profile?.slug === slug) {
          hotelId = d.id;
          break;
        }
      }
    }

    if (!hotelId) return res.status(404).json({ error: 'Property not found' });

    const bundleDocRef = doc(db, 'hotelBundles', hotelId);
    const bundleSnap = await getDoc(bundleDocRef);
    if (!bundleSnap.exists()) return res.status(404).json({ error: 'Property not found' });

    const bundle = bundleSnap.data();
    const rooms = bundle.rooms || [];
    const bookings = bundle.bookings || [];

    const matchingRoom = rooms.find((r: any) => (r.type || 'Standard Room') === roomTypeId && Number(r.baseRate) > 0);
    if (!matchingRoom) {
      return res.status(400).json({ error: 'Selected room type is not available' });
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
      roomTypeId: matchingRoom.type || roomTypeId,
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

    await setDoc(bundleDocRef, {
      ...bundle,
      bookings: updatedBookings,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const bRef = doc(db, 'hotelBundles', hotelId, 'liveBookings', bookingId);
    await setDoc(bRef, newBooking, { merge: true });

    return res.json({
      success: true,
      bookingRef,
      totalAmount,
      hotelName: bundle.profile?.name || 'Hotel',
      whatsapp: bundle.profile?.whatsapp || bundle.profile?.phone || ''
    });
  } catch (err: any) {
    console.error('Booking creation error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create booking' });
  }
});

interface ChatMessagePayload {
  role: 'user' | 'model';
  content: string;
}

// Multi-turn Gemini Chat API endpoint with Google Search & Maps Grounding
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { 
      messages, 
      model = 'gemini-3.5-flash', 
      systemInstruction, 
      useSearch = false, 
      useMaps = false, 
      userLocation 
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Determine target model
    let targetModel = model;

    // Grounding constraints: Use gemini-3.5-flash for Search Grounding and Maps Grounding
    if (useSearch || useMaps) {
      targetModel = 'gemini-3.5-flash';
    } else if (!['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'].includes(targetModel)) {
      targetModel = 'gemini-3.5-flash';
    }

    // Format multi-turn contents for @google/genai
    const contents = messages.map((m: ChatMessagePayload) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || '' }]
    }));

    // Configure tools
    const tools: any[] = [];
    let toolConfig: any = undefined;

    if (useMaps) {
      // Maps Grounding per SKILL.md:
      // Note: googleMaps cannot be used with googleSearch or urlContext
      tools.push({ googleMaps: {} });
      if (userLocation && typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number') {
        toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude
            }
          }
        };
      }
    } else if (useSearch) {
      // Search Grounding per SKILL.md:
      tools.push({ googleSearch: {} });
    }

    const config: any = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (tools.length > 0) {
      config.tools = tools;
    }
    if (toolConfig) {
      config.toolConfig = toolConfig;
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: targetModel,
        contents,
        config
      });
    } catch (modelErr: any) {
      // If gemini-3.1-pro-preview fails due to tier/quota, gracefully fallback to gemini-3.5-flash
      if (targetModel === 'gemini-3.1-pro-preview' && modelErr?.message?.includes('quota')) {
        console.warn('Pro model quota hit, falling back to gemini-3.5-flash');
        targetModel = 'gemini-3.5-flash';
        response = await ai.models.generateContent({
          model: targetModel,
          contents,
          config
        });
      } else {
        throw modelErr;
      }
    }

    const text = response.text || '';
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks || [];
    const webSearchQueries = groundingMetadata?.webSearchQueries || [];

    return res.json({
      text,
      modelUsed: targetModel,
      groundingChunks,
      webSearchQueries
    });

  } catch (err: any) {
    console.error('Gemini API chat error:', err);
    let userFriendlyMessage = 'Failed to generate response from Gemini API';
    const errStr = err?.message || err?.toString() || '';
    if (errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('429')) {
      userFriendlyMessage = 'Gemini API rate limit or quota exceeded. Please wait a few moments before sending another message, or configure a billing-enabled key in Settings > Secrets.';
    } else if (errStr.includes('PERMISSION_DENIED') || errStr.includes('403')) {
      userFriendlyMessage = 'Permission denied. Please verify your Gemini API key in Settings > Secrets.';
    } else if (errStr.includes('API_KEY_INVALID') || errStr.includes('400')) {
      userFriendlyMessage = 'Invalid Gemini API key. Please verify your key in Settings > Secrets.';
    } else if (err?.message) {
      userFriendlyMessage = err.message;
    }

    return res.status(500).json({
      error: userFriendlyMessage,
      details: errStr
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Vite middleware setup for dev / static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Maahi Trips PMS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
