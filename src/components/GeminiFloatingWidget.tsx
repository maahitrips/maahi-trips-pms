import React, { useState } from 'react';
import { Sparkles, Bot, X, Maximize2, MapPin, Search, Send, RefreshCw } from 'lucide-react';
import { ChatMessage, sendGeminiChatMessage, getCurrentCoordinates } from '../services/gemini';
import { HotelProfile } from '../types';

interface GeminiFloatingWidgetProps {
  hotelProfile?: HotelProfile;
  onOpenFullChat: () => void;
}

export const GeminiFloatingWidget: React.FC<GeminiFloatingWidgetProps> = ({
  hotelProfile,
  onOpenFullChat
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [useMaps, setUseMaps] = useState<boolean>(false);
  const [useSearch, setUseSearch] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'quick-welcome',
      role: 'model',
      content: `Hi! Need quick help with guest requests, nearby places, or front-desk policies? Ask me anytime!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash'
    }
  ]);

  const handleSend = async (text?: string) => {
    const query = (text || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `quick-msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      const coords = await getCurrentCoordinates();
      const res = await sendGeminiChatMessage({
        messages: nextHistory.map(m => ({ role: m.role, content: m.content })),
        model: 'gemini-3.5-flash',
        systemInstruction: `You are the quick concierge assistant for ${hotelProfile?.name || 'Maahi Trips Hotel'}. Keep responses concise, direct, helpful, and friendly.`,
        useSearch,
        useMaps,
        userLocation: coords || undefined
      });

      const replyMsg: ChatMessage = {
        id: `quick-reply-${Date.now()}`,
        role: 'model',
        content: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: res.modelUsed,
        groundingChunks: res.groundingChunks
      };

      setMessages(prev => [...prev, replyMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `quick-err-${Date.now()}`,
          role: 'model',
          content: `⚠️ ${err?.message || 'Error communicating with Gemini'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-18 sm:bottom-6 right-4 sm:right-6 z-40 bg-gradient-to-tr from-teal-700 via-indigo-700 to-purple-600 text-white p-3.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 group border-2 border-white/20"
        title="Open Gemini AI Hotel Assistant"
      >
        <Sparkles size={18} className="animate-spin" style={{ animationDuration: '6s' }} />
        <span className="font-bold text-xs pr-1 hidden sm:inline">Ask Gemini AI</span>
      </button>

      {/* Slide-over Quick Drawer */}
      {isOpen && (
        <div className="fixed bottom-28 sm:bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 to-teal-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div>
                <span className="font-bold text-xs block">Gemini AI Concierge</span>
                <span className="text-[10px] text-teal-300">Live Grounded Assistant</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenFullChat();
                }}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Expand to Full Screen View"
              >
                <Maximize2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick Grounding Toggles */}
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-500">Live Tools:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setUseMaps(!useMaps);
                  if (!useMaps) setUseSearch(false);
                }}
                className={`px-2 py-0.5 rounded-md font-semibold text-[10px] flex items-center gap-1 cursor-pointer transition-colors ${
                  useMaps ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                <MapPin size={9} /> Maps
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseSearch(!useSearch);
                  if (!useSearch) setUseMaps(false);
                }}
                className={`px-2 py-0.5 rounded-md font-semibold text-[10px] flex items-center gap-1 cursor-pointer transition-colors ${
                  useSearch ? 'bg-emerald-700 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                <Search size={9} /> Search
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-2.5 rounded-xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-2xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {m.groundingChunks && m.groundingChunks.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                        {m.groundingChunks.map((c, i) => {
                          const url = c.maps?.uri || c.web?.uri;
                          const title = c.maps?.title || c.web?.title || 'Source';
                          if (!url) return null;
                          return (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold underline"
                            >
                              {title}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 px-1 mt-0.5">{m.timestamp}</span>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white p-2 rounded-xl border border-slate-200 w-fit">
                <RefreshCw size={12} className="animate-spin text-teal-700" />
                <span>Thinking...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-2.5 py-1 bg-white border-t border-slate-100 flex gap-1 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => handleSend('Top 3 dinner spots near our hotel?')}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full whitespace-nowrap cursor-pointer shrink-0"
            >
              📍 Nearby Dinner
            </button>
            <button
              type="button"
              onClick={() => handleSend('How to handle early check-in politely?')}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full whitespace-nowrap cursor-pointer shrink-0"
            >
              🛎️ Early Check-in
            </button>
          </div>

          {/* Input Box */}
          <div className="p-2.5 bg-white border-t border-slate-200 flex gap-1.5">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Ask anything..."
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputMessage.trim() || isLoading}
              className={`p-2 rounded-xl text-white transition-all cursor-pointer ${
                inputMessage.trim() && !isLoading ? 'bg-teal-700 hover:bg-teal-800' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
