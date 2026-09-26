export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunkMap {
  uri?: string;
  title?: string;
  address?: string;
  placeAnswerSources?: {
    reviewSnippets?: Array<{ text: string }>;
  };
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  maps?: GroundingChunkMap;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
  groundingChunks?: GroundingChunk[];
  webSearchQueries?: string[];
}

export interface GeminiChatOptions {
  messages: Array<{ role: 'user' | 'model'; content: string }>;
  model?: 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';
  systemInstruction?: string;
  useSearch?: boolean;
  useMaps?: boolean;
  userLocation?: { latitude: number; longitude: number };
}

export interface GeminiChatResponse {
  text: string;
  modelUsed: string;
  groundingChunks: GroundingChunk[];
  webSearchQueries?: string[];
}

/**
 * Client service to communicate with backend server-side Gemini API
 */
export async function sendGeminiChatMessage(options: GeminiChatOptions): Promise<GeminiChatResponse> {
  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with status ${response.status}`);
  }

  const data: GeminiChatResponse = await response.json();
  return data;
}

/**
 * Helper to get current browser geolocation if available
 */
export function getCurrentCoordinates(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      () => {
        // Fallback: Calangute, Goa coordinates for Maahi Trips default property
        resolve({
          latitude: 15.5447,
          longitude: 73.7553
        });
      },
      { timeout: 5000 }
    );
  });
}
