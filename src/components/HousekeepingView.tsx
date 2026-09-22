import React from 'react';
import { Room, RoomStatus, UserAccount } from '../types';
import { BedDouble, Sparkles, AlertCircle, Wrench, CheckCircle2, RotateCcw, Plus, Trash2, ShieldCheck, Lock } from 'lucide-react';

interface HousekeepingViewProps {
  rooms: Room[];
  onUpdateStatus: (roomId: string, newStatus: RoomStatus) => void;
  onOpenAddRoom?: () => void;
  onRequestDeleteRoom?: (room: Room) => void;
  currentUser?: UserAccount | null;
  hotelName?: string;
}

export const HousekeepingView: React.FC<HousekeepingViewProps> = ({
  rooms,
  onUpdateStatus,
  onOpenAddRoom,
  onRequestDeleteRoom,
  currentUser,
  hotelName
}) => {
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const statusCounts = {
    clean: rooms.filter(r => r.status === 'clean').length,
    dirty: rooms.filter(r => r.status === 'dirty').length,
    cleaning: rooms.filter(r => r.status === 'cleaning').length,
    ooo: rooms.filter(r => r.status === 'ooo').length,
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Housekeeping &amp; Room Inventory
            </h1>
            {hotelName && (
              <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                {hotelName}
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Track room cleanliness, daily turnovers, and manage active room inventory
          </p>
        </div>

        {/* Add Room Button */}
        {onOpenAddRoom && (
          <button
            id="btn-housekeeping-add-room"
            onClick={onOpenAddRoom}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add New Room</span>
          </button>
        )}
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="font-bold text-emerald-800 uppercase text-[10px]">Clean &amp; Ready</span>
            <div className="text-2xl font-black text-emerald-950">{statusCounts.clean}</div>
          </div>
          <CheckCircle2 size={24} className="text-emerald-700" />
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="font-bold text-amber-800 uppercase text-[10px]">Dirty / Needs Cleaning</span>
            <div className="text-2xl font-black text-amber-950">{statusCounts.dirty}</div>
          </div>
          <AlertCircle size={24} className="text-amber-700" />
        </div>

        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="font-bold text-blue-800 uppercase text-[10px]">In Cleaning Progress</span>
            <div className="text-2xl font-black text-blue-950">{statusCounts.cleaning}</div>
          </div>
          <Sparkles size={24} className="text-blue-700" />
        </div>

        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="font-bold text-rose-800 uppercase text-[10px]">Out of Order (OOO)</span>
            <div className="text-2xl font-black text-rose-950">{statusCounts.ooo}</div>
          </div>
          <Wrench size={24} className="text-rose-700" />
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((rm) => (
          <div
            key={rm.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-lg leading-tight">{rm.name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {rm.type} • Floor {rm.floor} • ₹{rm.baseRate}/night
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    rm.status === 'clean' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    rm.status === 'dirty' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    rm.status === 'cleaning' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                    'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {rm.status === 'ooo' ? 'Out of Order' : rm.status}
                  </span>

                  {onRequestDeleteRoom && (
                    <button
                      type="button"
                      onClick={() => onRequestDeleteRoom(rm)}
                      title={isSuperAdmin ? "Delete Room (Super Admin)" : "Delete Room (Super Admin authorization required)"}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer ml-1"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {rm.amenities.slice(0, 4).map(a => (
                  <span key={a} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                    {a}
                  </span>
                ))}
                {rm.amenities.length > 4 && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    +{rm.amenities.length - 4} more
                  </span>
                )}
              </div>
            </div>

            {/* Change status buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-xs">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onUpdateStatus(rm.id, 'clean')}
                  className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                    rm.status === 'clean' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800'
                  }`}
                >
                  Clean
                </button>
                <button
                  onClick={() => onUpdateStatus(rm.id, 'dirty')}
                  className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                    rm.status === 'dirty' 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800'
                  }`}
                >
                  Dirty
                </button>
                <button
                  onClick={() => onUpdateStatus(rm.id, 'cleaning')}
                  className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                    rm.status === 'cleaning' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800'
                  }`}
                >
                  Cleaning
                </button>
                <button
                  onClick={() => onUpdateStatus(rm.id, 'ooo')}
                  className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                    rm.status === 'ooo' 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-800'
                  }`}
                >
                  OOO
                </button>
              </div>

              {!isSuperAdmin && (
                <span className="text-[10px] text-slate-400 flex items-center gap-0.5" title="Room delete protected">
                  <Lock size={11} />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
