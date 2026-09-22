import React, { useState, useEffect } from 'react';
import { Booking, Room } from '../types';
import { Search, X, ShieldCheck, User, Calendar, BedDouble, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  rooms: Room[];
  onSelectBooking: (booking: Booking) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  bookings,
  rooms,
  onSelectBooking
}) => {
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // toggle search
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const results = q ? bookings.filter(b => {
    const room = rooms.find(r => r.id === b.roomId);
    return (
      b.guest.fullName.toLowerCase().includes(q) ||
      b.guest.phone.toLowerCase().includes(q) ||
      b.bookingCode.toLowerCase().includes(q) ||
      (b.channelRefId && b.channelRefId.toLowerCase().includes(q)) ||
      b.guest.idDocument.idNumber.toLowerCase().includes(q) ||
      (room && room.name.toLowerCase().includes(q))
    );
  }) : bookings.slice(0, 5); // default show recent 5

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search size={20} className="text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search guests, rooms, Aadhaar / Passport ID, or booking code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-hidden text-sm font-semibold text-slate-900 placeholder:text-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
          <kbd className="text-[10px] bg-white border border-slate-300 px-1.5 py-0.5 rounded text-slate-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 p-2">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {q ? `Search Results (${results.length})` : 'Recent Reservations'}
          </div>

          {results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching reservations, rooms, or guest IDs found.
            </div>
          ) : (
            results.map((b) => {
              const room = rooms.find(r => r.id === b.roomId);
              return (
                <div
                  key={b.id}
                  onClick={() => {
                    onSelectBooking(b);
                    onClose();
                  }}
                  className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-teal-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {b.guest.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {b.guest.fullName}
                        </span>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1 rounded">
                          {b.bookingCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-teal-800">{room?.name}</span>
                        <span>•</span>
                        <span>{b.checkInDate} &rarr; {b.checkOutDate}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-600">ID: {b.guest.idDocument.idNumber}</span>
                      </div>
                    </div>
                  </div>

                  <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-700 transition-colors shrink-0" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
