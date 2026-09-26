import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK per SKILL.md guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
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
