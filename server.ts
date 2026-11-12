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

// --- SSR & Sitemap Routes for Googlebot / SEO ---
app.get('/sitemap.xml', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.set('Content-Type', 'application/xml');
    if (!db) return res.status(500).send('<error>Database not initialized</error>');

    const host = req.get('host') || 'maahi-trips.web.app';
    const bundlesSnap = await getDocs(collection(db, 'hotelBundles'));
    
    let urls = [`  <url>\n    <loc>https://${host}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`];

    bundlesSnap.forEach(docSnap => {
      const data = docSnap.data();
      const profile = data.profile || {};
      const isPublished = profile.isPublished !== false;
      const slug = profile.slug || data.slug || docSnap.id;
      if (isPublished && slug) {
        urls.push(`  <url>\n    <loc>https://${host}/h/${slug}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`);
      }
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    return res.status(200).send(sitemap);
  } catch (err) {
    console.error('Sitemap error:', err);
    return res.status(500).send('Error generating sitemap');
  }
});

app.get('/h/:slug', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    const { slug } = req.params;
    if (!slug) return res.status(404).send('Property not found');
    if (!db) return res.status(500).send('Database not initialized');

    let hotelId = '';
    const slugDocRef = doc(db, 'hotelSlugs', slug);
    const slugSnap = await getDoc(slugDocRef);
    if (slugSnap.exists()) hotelId = slugSnap.data()?.hotelId;

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
      return res.status(404).send('<!DOCTYPE html><html><head><title>Property Not Found - Maahi Trips</title></head><body style="background:#020617;color:#fff;text-align:center;padding:80px;font-family:sans-serif;"><h1>Property Not Found</h1><p>The requested hotel property does not exist.</p><a href="/" style="color:#2dd4bf;">Back to Home</a></body></html>');
    }

    const bundleDocRef = doc(db, 'hotelBundles', hotelId);
    const bundleSnap = await getDoc(bundleDocRef);
    if (!bundleSnap.exists()) return res.status(404).send('Property not found');

    const bundle = bundleSnap.data();
    const profile = bundle.profile || {};
    const isPublished = profile.isPublished !== false;

    if (!isPublished) {
      return res.status(403).send('<!DOCTYPE html><html><head><title>Property Unpublished - Maahi Trips</title></head><body style="background:#020617;color:#fff;text-align:center;padding:80px;font-family:sans-serif;"><h1>Property Not Available</h1><p>This property is currently not published for public bookings.</p><a href="/" style="color:#2dd4bf;">Back to Home</a></body></html>');
    }

    const name = profile.name || 'Hotel Property';
    const city = profile.city || 'India';
    const address = profile.address || city;
    const phone = profile.phone || '';
    const description = profile.description || profile.tagline || `Book ${name} in ${city} directly through Maahi Trips for best rates, instant confirmation, and verified KYC stay.`;
    const heroPhotoUrl = profile.heroPhotoUrl || (profile.photos && profile.photos[0]) || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
    const host = req.get('host') || 'maahi-trips.web.app';
    const canonicalUrl = `https://${host}/h/${slug}`;

    const titleTag = `${name}, ${city} - Direct Booking | Maahi Trips`;
    const metaDesc = description.substring(0, 160);

    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Hotel",
      "name": name,
      "image": heroPhotoUrl,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": address,
        "addressLocality": city,
        "addressCountry": "IN"
      },
      "telephone": phone,
      "url": canonicalUrl,
      "description": description
    });

    const ssrContent = `
      <div style="min-height:100vh;background:#020617;color:#f8fafc;padding:24px;font-family:system-ui,-apple-system,sans-serif;">
        <div style="max-width:840px;margin:0 auto;background:#0f172a;border-radius:20px;overflow:hidden;border:1px solid #1e293b;box-shadow:0 20px 40px rgba(0,0,0,0.6);">
          <div style="position:relative;height:360px;background:#1e293b;">
            <img src="${heroPhotoUrl}" alt="${name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'" />
            <div style="position:absolute;bottom:16px;left:24px;background:rgba(15,23,42,0.85);backdrop-filter:blur(8px);padding:8px 16px;border-radius:30px;border:1px solid rgba(255,255,255,0.1);font-size:13px;font-weight:600;color:#2dd4bf;">
              ✨ Verified Property • Instant Direct Booking
            </div>
          </div>
          <div style="padding:40px;">
            <h1 style="font-size:36px;font-weight:900;letter-spacing:-0.03em;margin:0 0 12px;color:#ffffff;">${name}</h1>
            <p style="font-size:16px;color:#94a3b8;margin:0 0 24px;display:flex;align-items:center;gap:6px;">
              📍 ${address}, ${city}
            </p>
            <p style="font-size:16px;color:#cbd5e1;line-height:1.7;margin:0 0 32px;">${description}</p>
            <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;padding-top:24px;border-top:1px solid #1e293b;">
              <a href="#book" style="background:#0d9488;color:#ffffff;padding:14px 28px;border-radius:12px;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(13,148,136,0.4);">
                Book Room Now
              </a>
              ${phone ? `<a href="tel:${phone}" style="background:#1e293b;color:#f8fafc;padding:14px 24px;border-radius:12px;font-weight:600;text-decoration:none;border:1px solid #334155;">📞 ${phone}</a>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    const indexPath = path.resolve(__dirname, 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    html = html.replace(/<title>.*?<\/title>/i, `<title>${titleTag}</title>`);
    html = html.replace(/<meta name="description" content=".*?"/i, `<meta name="description" content="${metaDesc}"`);

    const seoMetaTags = `
      <link rel="canonical" href="${canonicalUrl}" />
      <meta property="og:title" content="${titleTag}" />
      <meta property="og:description" content="${metaDesc}" />
      <meta property="og:image" content="${heroPhotoUrl}" />
      <meta property="og:url" content="${canonicalUrl}" />
      <meta property="og:type" content="hotel" />
      <script type="application/ld+json">${jsonLd}</script>
    `;

    html = html.replace('</head>', `${seoMetaTags}\n</head>`);
    html = html.replace('<div id="root"></div>', `<div id="root">${ssrContent}</div>`);
    html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${ssrContent}</div>`);

    return res.status(200).send(html);
  } catch (err) {
    console.error('SSR error for /h/:slug:', err);
    return res.status(500).send('Internal Server Error');
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
