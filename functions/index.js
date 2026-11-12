const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const express = require('express');
const fs = require('fs');
const path = require('path');

admin.initializeApp();
const db = admin.firestore();
// Use specific Firestore database ID if configured
const dbName = 'ai-studio-hotelpmschannelm-abfd041c-9c6e-439a-989f-dcc913c9c69f';
const firestoreDb = db; // Firestore client handles default or named database if initialized via admin with databaseId if supported, or standard db.

const app = express();

let indexTemplate = '';
try {
  const templatePath = path.join(__dirname, 'index.html');
  if (fs.existsSync(templatePath)) {
    indexTemplate = fs.readFileSync(templatePath, 'utf8');
  } else {
    // Fallback template
    indexTemplate = `<!DOCTYPE html><html><head><title>Maahi Trips - Hotel PMS</title><meta name="description" content="Hotel Property Management & Direct Booking" /></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`;
  }
} catch (e) {
  console.error('Error loading index template:', e);
}

// Sitemap.xml endpoint
app.get('/sitemap.xml', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.set('Content-Type', 'application/xml');

    const host = req.get('host') || 'maahi-trips.web.app';
    const bundlesSnap = await firestoreDb.collection('hotelBundles').get();
    
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
    console.error('Sitemap generation error:', err);
    return res.status(500).send('Error generating sitemap');
  }
});

// SSR endpoint for /h/:slug
app.get('/h/:slug', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    const { slug } = req.params;
    if (!slug) {
      return res.status(404).send('Property not found');
    }

    let hotelId = '';
    const slugDoc = await firestoreDb.collection('hotelSlugs').doc(slug).get();
    if (slugDoc.exists) {
      hotelId = slugDoc.data().hotelId;
    }

    if (!hotelId) {
      const bundlesSnap = await firestoreDb.collection('hotelBundles').get();
      for (const docSnap of bundlesSnap.docs) {
        const data = docSnap.data();
        const pSlug = data?.profile?.slug || data?.slug;
        if (pSlug === slug) {
          hotelId = docSnap.id;
          break;
        }
      }
    }

    if (!hotelId) {
      return res.status(404).send('<!DOCTYPE html><html><head><title>Property Not Found - Maahi Trips</title></head><body style="background:#020617;color:#fff;text-align:center;padding:80px;font-family:sans-serif;"><h1>Property Not Found</h1><p>The requested hotel property does not exist or has been removed.</p><a href="/" style="color:#2dd4bf;">Back to Home</a></body></html>');
    }

    const bundleDoc = await firestoreDb.collection('hotelBundles').doc(hotelId).get();
    if (!bundleDoc.exists) {
      return res.status(404).send('Property not found');
    }

    const bundle = bundleDoc.data();
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

    // JSON-LD Schema
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

    // Server-rendered fallback HTML inside root
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

    // Replace in template
    let html = indexTemplate;

    // Replace title
    html = html.replace(/<title>.*?<\/title>/i, `<title>${titleTag}</title>`);
    
    // Replace meta description
    html = html.replace(/<meta name="description" content=".*?"/i, `<meta name="description" content="${metaDesc}"`);

    // Inject OG tags & canonical & JSON-LD before </head>
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

    // Replace root div content
    html = html.replace('<div id="root"></div>', `<div id="root">${ssrContent}</div>`);
    html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${ssrContent}</div>`);

    return res.status(200).send(html);
  } catch (err) {
    console.error('SSR error for /h/:slug:', err);
    return res.status(500).send('Internal Server Error');
  }
});

// Export Cloud Function
exports.ssrServer = onRequest({ region: 'us-central1', memory: '512MiB' }, app);
