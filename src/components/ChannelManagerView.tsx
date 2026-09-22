import React, { useState } from 'react';
import { 
  OTAChannelConfig, 
  RoomTypeMapping, 
  ChannelSyncLog, 
  Room, 
  BookingChannel 
} from '../types';
import { 
  Globe2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  ArrowRightLeft, 
  Sliders, 
  Lock, 
  Unlock, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  Layers, 
  Plus, 
  Send,
  Plane,
  Building2,
  Compass,
  Home,
  Copy,
  Check
} from 'lucide-react';

interface ChannelManagerViewProps {
  channels: OTAChannelConfig[];
  roomMappings: RoomTypeMapping[];
  syncLogs: ChannelSyncLog[];
  rooms: Room[];
  isSyncing: boolean;
  onSyncAll: () => void;
  onToggleAutoSync: (channelId: BookingChannel) => void;
  onToggleStopSell: (mappingId: string) => void;
  onUpdateRateModifier: (mappingId: string, delta: number) => void;
  onOpenSimulateModal: () => void;
}

export const ChannelManagerView: React.FC<ChannelManagerViewProps> = ({
  channels,
  roomMappings,
  syncLogs,
  rooms,
  isSyncing,
  onSyncAll,
  onToggleAutoSync,
  onToggleStopSell,
  onUpdateRateModifier,
  onOpenSimulateModal
}) => {
  const [activeTab, setActiveTab] = useState<'channels' | 'mappings' | 'logs' | 'webhooks'>('channels');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const getChannelIcon = (logo: string) => {
    switch (logo) {
      case 'Plane': return Plane;
      case 'Building2': return Building2;
      case 'Compass': return Compass;
      case 'Home': return Home;
      case 'Send': return Send;
      default: return Globe2;
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 p-4 md:p-6 space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              OTA Channel Manager
            </h1>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Two-Way Sync Active
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time automated inventory, rate distribution, and instant booking ingestion across online travel portals
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenSimulateModal}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Inject simulated inbound reservation from MakeMyTrip or Booking.com"
          >
            <Zap size={15} className="text-amber-600 fill-amber-500" />
            Simulate Inbound OTA Booking
          </button>

          <button
            onClick={onSyncAll}
            disabled={isSyncing}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Synchronizing OTAs...' : 'Sync All Channels Now'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'channels'
              ? 'border-teal-600 text-teal-900 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Connected Channels ({channels.filter(c => c.isConnected).length})
        </button>

        <button
          onClick={() => setActiveTab('mappings')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'mappings'
              ? 'border-teal-600 text-teal-900 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Room Category Mappings ({roomMappings.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-teal-600 text-teal-900 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Live Sync Logs &amp; Activity ({syncLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'webhooks'
              ? 'border-teal-600 text-teal-900 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          API &amp; Webhooks Config
        </button>
      </div>

      {/* TAB 1: CONNECTED CHANNELS CARDS */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((ch) => {
            const Icon = getChannelIcon(ch.logo);
            return (
              <div
                key={ch.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-xs ${
                        ch.id === 'makemytrip' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                        ch.id === 'cleartrip' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                        ch.id === 'oyo' ? 'bg-red-50 text-red-600 border border-red-200' :
                        ch.id === 'easemytrip' ? 'bg-sky-50 text-sky-600 border border-sky-200' :
                        ch.id === 'booking_com' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        ch.id === 'agoda' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                        ch.id === 'airbnb' ? 'bg-rose-50 text-rose-500 border border-rose-200' :
                        ch.id === 'goibibo' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        ch.id === 'yatra' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        ch.id === 'expedia' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{ch.name}</h3>
                        <span className="text-[11px] text-slate-400 font-mono truncate block max-w-[180px]">
                          {ch.apiEndpoint}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      ch.isConnected 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}>
                      {ch.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>

                  {/* Channel Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Markup</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">+{ch.rateMarkupPercent}%</div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Mapped</div>
                      <div className="text-sm font-bold text-teal-900 mt-0.5">{ch.mappedRoomsCount}/{ch.totalRoomsCount}</div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Active</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{ch.activeReservationsCount} stays</div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                    <Clock size={13} className="text-slate-400" />
                    <span>Last synced: {ch.lastSyncedAt}</span>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-semibold">
                    <input
                      type="checkbox"
                      checked={ch.autoSync}
                      onChange={() => onToggleAutoSync(ch.id)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Auto-Sync</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: ROOM CATEGORY MAPPINGS */}
      {activeTab === 'mappings' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">PMS Room to OTA Channel Mapping</h3>
              <p className="text-xs text-slate-500">
                Maps your hotel inventory to respective OTA room identifiers with custom rate markups &amp; stop-sell switches
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-300 px-3 py-1 rounded-md">
              {roomMappings.length} Active Mappings
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3">PMS Room Category</th>
                  <th className="p-3">OTA Channel</th>
                  <th className="p-3">OTA Room Code</th>
                  <th className="p-3">OTA Title</th>
                  <th className="p-3">Rate Markup</th>
                  <th className="p-3">Stop-Sell</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {roomMappings.map((map) => (
                  <tr key={map.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      {map.pmsRoomType}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        map.otaChannel === 'makemytrip' ? 'bg-emerald-100 text-emerald-800' :
                        map.otaChannel === 'cleartrip' ? 'bg-orange-100 text-orange-800' :
                        map.otaChannel === 'oyo' ? 'bg-red-100 text-red-800' :
                        map.otaChannel === 'easemytrip' ? 'bg-sky-100 text-sky-800' :
                        map.otaChannel === 'booking_com' ? 'bg-blue-100 text-blue-800' :
                        map.otaChannel === 'agoda' ? 'bg-teal-100 text-teal-800' :
                        map.otaChannel === 'goibibo' ? 'bg-amber-100 text-amber-800' :
                        map.otaChannel === 'yatra' ? 'bg-rose-100 text-rose-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {map.otaChannel.replace('_', '.')}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{map.otaRoomCode}</td>
                    <td className="p-3 text-slate-700">{map.otaRoomTitle}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onUpdateRateModifier(map.id, -2)}
                          className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded font-bold text-slate-700 flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="font-bold text-slate-800 font-mono w-8 text-center">
                          +{map.rateModifier}%
                        </span>
                        <button
                          onClick={() => onUpdateRateModifier(map.id, 2)}
                          className="w-5 h-5 bg-slate-200 hover:bg-slate-300 rounded font-bold text-slate-700 flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => onToggleStopSell(map.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-colors ${
                          map.stopSell 
                            ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={map.stopSell ? "Stop-Sell is ACTIVE (Bookings blocked)" : "Open for Bookings"}
                      >
                        {map.stopSell ? <Lock size={12} /> : <Unlock size={12} />}
                        {map.stopSell ? 'BLOCKED' : 'OPEN'}
                      </button>
                    </td>
                    <td className="p-3">
                      <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 size={13} /> Synced
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE SYNC LOGS & ACTIVITY */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Two-Way Channel Sync Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Log of real-time inventory adjustments, rate changes, and inbound OTA webhook notifications
              </p>
            </div>
            <button
              onClick={onSyncAll}
              className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1"
            >
              <RefreshCw size={13} /> Trigger Sync
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {syncLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/60 transition-colors flex items-start gap-3">
                <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                  log.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                  log.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  <CheckCircle2 size={14} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px] uppercase font-mono">
                        {log.channelName}
                      </span>
                      {log.eventType.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-700 mt-1 font-medium">{log.message}</p>

                  {log.payloadSummary && (
                    <div className="mt-1.5 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono">
                      {log.payloadSummary}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: API & WEBHOOKS CONFIG */}
      {activeTab === 'webhooks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Zap size={16} className="text-amber-600" />
              Incoming Inbound Webhook Endpoint
            </h3>
            <p className="text-xs text-slate-500">
              Provide this webhook URL to MakeMyTrip Extranet, BookingSuite, or Agoda YCS to receive real-time push reservations
            </p>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold">POST Webhook URL:</span>
                <button
                  onClick={() => handleCopy("https://api.tripmakerz.in/v2/webhook/bighouseinn/events", "wh-url")}
                  className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                >
                  {copiedKey === 'wh-url' ? <Check size={13} /> : <Copy size={13} />}
                  {copiedKey === 'wh-url' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-xs text-slate-800 bg-white p-2 rounded border border-slate-300 break-all">
                https://api.tripmakerz.in/v2/webhook/bighouseinn/events
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold">Secret HMAC Key:</span>
                <button
                  onClick={() => handleCopy("whsec_9941a89c20108be14022", "wh-key")}
                  className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                >
                  {copiedKey === 'wh-key' ? <Check size={13} /> : <Copy size={13} />}
                  {copiedKey === 'wh-key' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono text-xs text-slate-800 bg-white p-2 rounded border border-slate-300">
                whsec_9941a89c20108be14022
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck size={16} className="text-teal-700" />
              Channel Security &amp; Rate Parity
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900">
                <span className="font-bold block mb-0.5">Rate Parity Guard:</span>
                Ensures contracted rates between MakeMyTrip, Agoda, and Booking.com stay in compliance with automatic OTA markup ratios.
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold block text-slate-800 mb-0.5">Inventory Auto-Decrement:</span>
                When a direct walk-in booking is saved in the Desk tape chart, all connected channels immediately receive updated availability within 300 milliseconds.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
