import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Search, 
  MapPin, 
  Bot, 
  User, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  Compass, 
  Check, 
  Copy, 
  Building2, 
  TrendingUp, 
  Zap, 
  BrainCircuit, 
  HelpCircle,
  ChevronDown,
  Navigation,
  Globe
} from 'lucide-react';
import { 
  ChatMessage, 
  sendGeminiChatMessage, 
  getCurrentCoordinates, 
  GroundingChunk 
} from '../services/gemini';
import { HotelProfile, Hotel } from '../types';

interface GeminiChatViewProps {
  hotelProfile?: HotelProfile;
  hotels?: Hotel[];
  activeHotelId?: string;
  onNavigateTab?: (tab: any) => void;
}

type ModelChoice = 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview';

interface Persona {
  id: string;
  title: string;
  shortLabel: string;
  icon: any;
  description: string;
  systemInstruction: string;
  defaultUseSearch?: boolean;
  defaultUseMaps?: boolean;
  suggestedPrompts: string[];
}

const PERSONAS: Persona[] = [
  {
    id: 'concierge',
    title: 'Hotel Concierge & Desk Assistant',
    shortLabel: 'Concierge',
    icon: Building2,
    description: 'Assists front desk staff with guest relations, check-in policies, room upselling scripts, and hospitality communication.',
    systemInstruction: `You are the AI Hotel Concierge and Operations Assistant for Maahi Trips Hotel PMS.
You assist hotel owners, front desk managers, and guests with:
1. Professional guest communication, polite check-in/check-out scripts, handling guest complaints gracefully.
2. Room upselling advice, early check-in & late check-out fee explanations, luggage holding guidelines.
3. Hotel operational best practices in India (GST compliance, KYC ID verification requirements, housekeeping standards).
Be friendly, professional, practical, and hospitality-focused.`,
    defaultUseSearch: false,
    defaultUseMaps: false,
    suggestedPrompts: [
      'Polite script to tell a guest their room is ready before 12 PM',
      'How to explain the 5% GST tax calculation on hotel invoice',
      'Best practice for handling lost room key cards',
      'Script for upselling a Deluxe Suite to a walk-in couple'
    ]
  },
  {
    id: 'maps_guide',
    title: 'Local Attractions & Places Guide (Google Maps)',
    shortLabel: 'Maps Guide',
    icon: MapPin,
    description: 'Recommends nearby restaurants, beaches, markets, and travel directions with Google Maps Grounding.',
    systemInstruction: `You are the local destination guide and concierge for guests staying at the hotel.
Use Google Maps grounding to provide real, accurate, and up-to-date recommendations for:
1. Popular restaurants, cafes, seafood shacks, and family dining spots nearby.
2. Beaches, heritage sites, sunset viewpoints, and adventure activities.
3. Transit options, distances, and travel tips.
Always specify names of places and landmarks clearly.`,
    defaultUseSearch: false,
    defaultUseMaps: true,
    suggestedPrompts: [
      'Top 5 seafood restaurants and beach shacks near Calangute Goa',
      'Best sunset viewpoints and quiet beaches within 10 km',
      'Famous night markets and shopping streets nearby',
      'Family-friendly water sports and dolphin watching spots'
    ]
  },
  {
    id: 'search_trends',
    title: 'Live Market & Web Intelligence (Google Search)',
    shortLabel: 'Live Web',
    icon: Globe,
    description: 'Searches real-time web data for upcoming festivals, flight arrivals, weather forecasts, and tourism demand.',
    systemInstruction: `You are the hospitality market intelligence expert.
Use Google Search grounding to fetch real-time web facts, current calendar dates, upcoming festivals, flight patterns, and regional tourist influx trends.
Provide factual, timely information to help the hotel anticipate guest arrival surges.`,
    defaultUseSearch: true,
    defaultUseMaps: false,
    suggestedPrompts: [
      'Upcoming festival dates and peak holiday long-weekends this year in India',
      'Current weather forecast and travel advisories for Goa tourism',
      'Top flight routes and rail schedule trends into Goa airports (GOI/GOX)',
      'What major concerts, events, or conventions are happening this month?'
    ]
  },
  {
    id: 'revenue_strategist',
    title: 'Revenue & Yield Strategist (Complex Reasoning)',
    shortLabel: 'Revenue AI',
    icon: TrendingUp,
    description: 'Deep business analysis on dynamic pricing, OTA commission offsets, and occupancy maximization.',
    systemInstruction: `You are an elite hospitality Revenue Manager and Pricing Strategist.
You analyze occupancy metrics, RevPAR, ADR, and OTA distribution channels (MakeMyTrip, Booking.com, Agoda).
Provide structured, quantitative, and strategic advice on:
1. Dynamic rate parity and seasonal pricing multipliers.
2. Minimizing high OTA commission costs by converting OTA guests to direct website bookers.
3. Weekend versus weekday rate spreads.
Provide actionable, numbered recommendations.`,
    defaultUseSearch: false,
    defaultUseMaps: false,
    suggestedPrompts: [
      'How to price rooms when local occupancy crosses 85% for long weekends',
      'Strategy to convert MakeMyTrip guests into repeat direct WhatsApp bookers',
      'Setting minimum length of stay (MLOS) during peak New Year holiday season',
      'Calculate optimal discount percentage for corporate group reservations'
    ]
  }
];

export const GeminiChatView: React.FC<GeminiChatViewProps> = ({
  hotelProfile,
  hotels,
  activeHotelId
}) => {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [selectedModel, setSelectedModel] = useState<ModelChoice>('gemini-3.5-flash');
  const [useSearch, setUseSearch] = useState<boolean>(false);
  const [useMaps, setUseMaps] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Default initial welcome conversation
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = sessionStorage.getItem('maahitrips_gemini_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved chat history:', e);
      }
    }
    return [
      {
        id: 'msg-initial-welcome',
        role: 'model',
        content: `Hello! I am your **Gemini AI Hotel Concierge & Operations Assistant** for ${hotelProfile?.name || 'Maahi Trips'}.

I can help you with:
- 🗺️ **Google Maps Grounding**: Find nearby restaurants, beaches, viewpoints, and directions.
- 🌐 **Google Search Grounding**: Look up live web data, festival dates, flights, and weather.
- 🛎️ **Front Desk Scripts**: Guest communication, upsell pitches, and policies.
- 📊 **Revenue Analysis**: Dynamic pricing and OTA commission strategies.

How can I assist your hotel front desk today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.5-flash'
      }
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of conversation thread
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Persist chat history in session storage
  useEffect(() => {
    try {
      sessionStorage.setItem('maahitrips_gemini_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history to session:', e);
    }
  }, [messages]);

  // Pre-fetch user location for maps grounding
  useEffect(() => {
    getCurrentCoordinates().then(coords => {
      if (coords) setUserLocation(coords);
    });
  }, []);

  // Update persona and its default grounding tools
  const handleSelectPersona = (p: Persona) => {
    setSelectedPersona(p);
    setUseSearch(!!p.defaultUseSearch);
    setUseMaps(!!p.defaultUseMaps);
    if (p.id === 'revenue_strategist') {
      setSelectedModel('gemini-3.1-pro-preview');
    } else if (p.id === 'maps_guide' || p.id === 'search_trends') {
      setSelectedModel('gemini-3.5-flash');
    }
  };

  // Toggle Search Grounding (mutually exclusive with Maps per SDK guidelines)
  const handleToggleSearch = () => {
    if (!useSearch) {
      setUseSearch(true);
      setUseMaps(false);
      setSelectedModel('gemini-3.5-flash');
    } else {
      setUseSearch(false);
    }
  };

  // Toggle Maps Grounding (mutually exclusive with Search per SDK guidelines)
  const handleToggleMaps = () => {
    if (!useMaps) {
      setUseMaps(true);
      setUseSearch(false);
      setSelectedModel('gemini-3.5-flash');
    } else {
      setUseMaps(false);
    }
  };

  // Clear conversation history
  const handleClearChat = () => {
    const initialMsg: ChatMessage = {
      id: `msg-welcome-${Date.now()}`,
      role: 'model',
      content: `Conversation cleared. I am ready to assist with ${hotelProfile?.name || 'Maahi Trips'}. What would you like to ask?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: selectedModel
    };
    setMessages([initialMsg]);
    sessionStorage.removeItem('maahitrips_gemini_chat_history');
  };

  // Copy message text to clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Submit chat message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build system prompt enriched with hotel context
      const hotelContext = hotelProfile ? `
Active Hotel Context:
- Property Name: ${hotelProfile.name}
- Address: ${hotelProfile.address || 'Calangute, Goa'}
- City: ${hotelProfile.city || 'Goa 403516'}
- Phone: ${hotelProfile.phone || '+91 98765 43210'}
- Base check-in time: 12:00 PM, Check-out time: 11:00 AM
` : '';

      const finalSystemInstruction = `${selectedPersona.systemInstruction}\n${hotelContext}`;

      // Convert messages to history payload for backend
      const historyPayload = nextHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await sendGeminiChatMessage({
        messages: historyPayload,
        model: selectedModel,
        systemInstruction: finalSystemInstruction,
        useSearch,
        useMaps,
        userLocation: userLocation || undefined
      });

      const modelReply: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        role: 'model',
        content: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: res.modelUsed,
        groundingChunks: res.groundingChunks,
        webSearchQueries: res.webSearchQueries
      };

      setMessages(prev => [...prev, modelReply]);
    } catch (err: any) {
      console.error('Failed to receive response from Gemini:', err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'model',
        content: `⚠️ **Unable to complete request:** ${err?.message || 'Connection to Gemini API failed.'}\n\nPlease verify your network connection or try switching to another model.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto p-2 sm:p-4 gap-3">
      {/* Top Header Card: Persona and Model Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 sm:p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Gemini AI Hotel Assistant
                </h1>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Multi-Turn
                </span>
                {useMaps && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                    <MapPin size={10} /> Google Maps
                  </span>
                )}
                {useSearch && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <Search size={10} /> Google Search
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Grounding with live Google Maps & Google Search for real-time guest assistance and PMS strategy
              </p>
            </div>
          </div>

          {/* Action buttons (Clear chat, Model selector) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Model Selector */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.5-flash')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  selectedModel === 'gemini-3.5-flash'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="gemini-3.5-flash: Balanced, supports Google Search & Maps grounding"
              >
                3.5 Flash
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedModel('gemini-3.1-flash-lite');
                  setUseSearch(false);
                  setUseMaps(false);
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  selectedModel === 'gemini-3.1-flash-lite'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="gemini-3.1-flash-lite: Fast, low latency"
              >
                <Zap size={11} className="text-amber-500" />
                <span>3.1 Lite</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedModel('gemini-3.1-pro-preview');
                  setUseSearch(false);
                  setUseMaps(false);
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  selectedModel === 'gemini-3.1-pro-preview'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="gemini-3.1-pro-preview: Deep reasoning and complex tasks"
              >
                <BrainCircuit size={11} className="text-purple-600" />
                <span>3.1 Pro</span>
              </button>
            </div>

            {/* Clear Chat Button */}
            <button
              type="button"
              onClick={handleClearChat}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
              title="Clear conversation history"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Persona Selectors & Grounding Toggles */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Persona Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {PERSONAS.map(p => {
              const Icon = p.icon;
              const isSelected = selectedPersona.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPersona(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Icon size={14} className={isSelected ? 'text-teal-300' : 'text-slate-500'} />
                  <span>{p.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Real-time Grounding Toggles */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Live Grounding:
            </span>

            {/* Google Maps Grounding Toggle */}
            <button
              type="button"
              onClick={handleToggleMaps}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                useMaps
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Ground responses with Google Maps places, reviews, and directions (gemini-3.5-flash)"
            >
              <MapPin size={13} className={useMaps ? 'text-blue-100' : 'text-blue-600'} />
              <span>Google Maps</span>
              <span className={`w-1.5 h-1.5 rounded-full ${useMaps ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
            </button>

            {/* Google Search Grounding Toggle */}
            <button
              type="button"
              onClick={handleToggleSearch}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                useSearch
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title="Ground responses with live Google Search web information (gemini-3.5-flash)"
            >
              <Search size={13} className={useSearch ? 'text-emerald-100' : 'text-emerald-600'} />
              <span>Google Search</span>
              <span className={`w-1.5 h-1.5 rounded-full ${useSearch ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Conversation Thread (Scrollable) */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                  isUser
                    ? 'bg-gradient-to-tr from-slate-800 to-slate-900'
                    : 'bg-gradient-to-tr from-teal-700 via-emerald-700 to-teal-800'
                }`}
              >
                {isUser ? <User size={15} /> : <Bot size={16} />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-1.5 max-w-[85%] sm:max-w-[78%]">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                  <span className="font-bold text-slate-700">
                    {isUser ? 'You' : 'Gemini AI'}
                  </span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                  {msg.modelUsed && (
                    <>
                      <span>•</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                        {msg.modelUsed}
                      </span>
                    </>
                  )}
                </div>

                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed relative group ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  {/* Message content formatted with markdown linebreaks */}
                  <div className="space-y-2 whitespace-pre-wrap break-words font-sans">
                    {msg.content}
                  </div>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 hover:bg-black/20 text-slate-700 cursor-pointer"
                    title="Copy text"
                  >
                    {copiedMessageId === msg.id ? (
                      <Check size={12} className="text-emerald-600" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>

                  {/* Grounding Sources (Google Maps or Google Search) */}
                  {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                        <Compass size={13} className="text-teal-700" />
                        <span>Grounding Sources & References:</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {msg.groundingChunks.map((chunk, cIdx) => {
                          if (chunk.maps && chunk.maps.uri) {
                            return (
                              <a
                                key={`map-${cIdx}`}
                                href={chunk.maps.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-[11px] font-bold rounded-lg transition-colors"
                              >
                                <MapPin size={11} className="text-blue-600 shrink-0" />
                                <span className="truncate max-w-[200px]">{chunk.maps.title || 'Google Maps Location'}</span>
                                <ExternalLink size={10} className="text-blue-400 shrink-0" />
                              </a>
                            );
                          }
                          if (chunk.web && chunk.web.uri) {
                            return (
                              <a
                                key={`web-${cIdx}`}
                                href={chunk.web.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 text-[11px] font-bold rounded-lg transition-colors"
                              >
                                <Search size={11} className="text-emerald-700 shrink-0" />
                                <span className="truncate max-w-[200px]">{chunk.web.title || chunk.web.uri}</span>
                                <ExternalLink size={10} className="text-emerald-500 shrink-0" />
                              </a>
                            );
                          }
                          return null;
                        })}
                      </div>

                      {/* Web search queries if present */}
                      {msg.webSearchQueries && msg.webSearchQueries.length > 0 && (
                        <div className="text-[10px] text-slate-400 italic pt-1">
                          Searched: "{msg.webSearchQueries.join('", "')}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-700 to-emerald-700 flex items-center justify-center text-white shrink-0 shadow-xs animate-pulse">
              <Bot size={16} />
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-xs flex items-center gap-2 text-xs font-semibold text-slate-600">
              <RefreshCw size={14} className="animate-spin text-teal-700" />
              <span>
                {useMaps 
                  ? 'Querying Google Maps & generating response...' 
                  : useSearch 
                  ? 'Searching live web data with Google Search...' 
                  : `Gemini ${selectedModel} is thinking...`}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts Bar */}
      {selectedPersona.suggestedPrompts && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles size={11} className="text-teal-700" /> Quick:
          </span>
          {selectedPersona.suggestedPrompts.map((prompt, pIdx) => (
            <button
              key={pIdx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Composer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 sm:p-3 space-y-2">
        <div className="flex items-end gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask Gemini as ${selectedPersona.shortLabel}... (${useMaps ? 'Google Maps ON' : useSearch ? 'Google Search ON' : selectedModel})`}
            rows={2}
            className="flex-1 resize-none bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all placeholder:text-slate-400"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className={`p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              inputMessage.trim() && !isLoading
                ? 'bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white shadow-md'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            title="Send Message (Enter)"
          >
            <Send size={16} />
          </button>
        </div>

        {/* Footer Guidance */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
          <div className="flex items-center gap-2">
            <span>Powered by Gemini API</span>
            <span>•</span>
            <span className="font-mono text-slate-500">{selectedModel}</span>
            {userLocation && (
              <>
                <span>•</span>
                <span className="text-blue-700 flex items-center gap-1 font-semibold">
                  <Navigation size={10} /> Location Active
                </span>
              </>
            )}
          </div>
          <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
};
