import React, { useState } from 'react';
import { 
  OTAChannelConfig, 
  RoomTypeMapping, 
  ChannelSyncLog, 
  Room, 
  Booking,
  BookingChannel,
  HotelProfile,
  DynamicPricingConfig
} from '../types';
import { ChannelLoginModal } from './ChannelLoginModal';
import { DynamicPricingRulesModal } from './DynamicPricingRulesModal';
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
  Check,
  Power,
  Settings2,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Server,
  Code2,
  FileCheck,
  Edit3,
  TrendingUp,
  Percent,
  SlidersHorizontal,
  Flame,
  Gauge
} from 'lucide-react';

interface ChannelManagerViewProps {
  channels: OTAChannelConfig[];
  roomMappings: RoomTypeMapping[];
  syncLogs: ChannelSyncLog[];
  rooms: Room[];
  bookings?: Booking[];
  isSyncing: boolean;
  onSyncAll: () => void;
  onToggleAutoSync: (channelId: BookingChannel) => void;
  onToggleStopSell: (mappingId: string) => void;
  onUpdateRateModifier: (mappingId: string, delta: number) => void;
  onOpenSimulateModal: () => void;
  onToggleChannelConnect: (channelId: BookingChannel) => void;
  onUpdateChannelConfig?: (updatedChannel: OTAChannelConfig) => void;
  onTestInboundWebhook?: (channelId: BookingChannel) => void;
  onDisconnectAll?: () => void;
  onConnectAll?: () => void;
  hotelProfile?: HotelProfile;
  dynamicPricing?: DynamicPricingConfig;
  onUpdateDynamicPricing?: (newConfig: DynamicPricingConfig) => void;
  onPushSurgeRateLogs?: (surgePercent: number, occupancyPercent: number) => void;
}

export const ChannelManagerView: React.FC<ChannelManagerViewProps> = ({
  channels,
  roomMappings,
  syncLogs,
  rooms,
  bookings = [],
  isSyncing,
  onSyncAll,
  onToggleAutoSync,
  onToggleStopSell,
  onUpdateRateModifier,
  onOpenSimulateModal,
  onToggleChannelConnect,
  onUpdateChannelConfig,
  onTestInboundWebhook,
  onDisconnectAll,
  onConnectAll,
  hotelProfile,
  dynamicPricing: externalDynamicPricing,
  onUpdateDynamicPricing,
  onPushSurgeRateLogs
}) => {
  const [activeTab, setActiveTab] = useState<'channels' | 'mappings' | 'logs' | 'webhooks'>('channels');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Selected channel for Extranet Login & API Key Modal
  const [loginModalChannel, setLoginModalChannel] = useState<OTAChannelConfig | null>(null);

  // Dynamic Pricing Rules Modal State
  const [isDynamicRulesModalOpen, setIsDynamicRulesModalOpen] = useState(false);

  // Internal Dynamic Pricing State (50% sold -> +10% rate, 80% sold -> +20% rate)
  const [internalDynamicPricing, setInternalDynamicPricing] = useState<DynamicPricingConfig>({
    isEnabled: false,
    tier1ThresholdPercent: 50,
    tier1SurgePercent: 10,
    tier2ThresholdPercent: 80,
    tier2SurgePercent: 20,
    applyToAllChannels: true
  });

  const dynamicPricing = externalDynamicPricing || internalDynamicPricing;

  // Simulator / manual testing override for occupancy percentage
  const [simulatedOccupancyOverride, setSimulatedOccupancyOverride] = useState<number | null>(null);

  // Master PMS API Key State
  const [masterApiKey, setMasterApiKey] = useState('mt_live_api_9941a89c20108be14022_bighouse');
  const [showMasterApiKey, setShowMasterApiKey] = useState(false);
  const [isEditingMasterApiKey, setIsEditingMasterApiKey] = useState(false);
  const [tempMasterApiKey, setTempMasterApiKey] = useState(masterApiKey);

  // Webhook HMAC Secret State
  const [hmacSecret, setHmacSecret] = useState('whsec_9941a89c20108be14022_kpj');
  const [showHmacSecret, setShowHmacSecret] = useState(false);

  // Unmask channel key in table
  const [revealedChannelKeys, setRevealedChannelKeys] = useState<Record<string, boolean>>({});

  const hotelSlug = (hotelProfile?.name || 'bighouseinn')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const webhookUrl = `https://hotelpms.maahitrips.in/api/v2/webhook/${hotelSlug}/events`;

  // Occupancy Calculations
  const occupiedRoomsCount = rooms.filter(r => r.status === 'occupied').length;
  const liveOccupancyPercent = rooms.length > 0 ? Math.round((occupiedRoomsCount / rooms.length) * 100) : 0;
  const effectiveOccupancyPercent = simulatedOccupancyOverride !== null ? simulatedOccupancyOverride : liveOccupancyPercent;

  // Surge Calculations based on user request: 50% sold -> +10%, 80% sold -> +20%
  let activeSurgePercent = 0;
  let activeTierLabel = 'Base Rates (No Surge)';
  let surgeLevel: 'none' | 'tier1' | 'tier2' = 'none';

  if (dynamicPricing.isEnabled) {
    if (effectiveOccupancyPercent >= dynamicPricing.tier2ThresholdPercent) {
      activeSurgePercent = dynamicPricing.tier2SurgePercent; // 20%
      activeTierLabel = `Tier 2 Surge: +${activeSurgePercent}% Active (≥${dynamicPricing.tier2ThresholdPercent}% Sold Out)`;
      surgeLevel = 'tier2';
    } else if (effectiveOccupancyPercent >= dynamicPricing.tier1ThresholdPercent) {
      activeSurgePercent = dynamicPricing.tier1SurgePercent; // 10%
      activeTierLabel = `Tier 1 Surge: +${activeSurgePercent}% Active (≥${dynamicPricing.tier1ThresholdPercent}% Sold Out)`;
      surgeLevel = 'tier1';
    }
  }

  const handleToggleDynamicPricing = () => {
    const updated = {
      ...dynamicPricing,
      isEnabled: !dynamicPricing.isEnabled
    };
    if (onUpdateDynamicPricing) {
      onUpdateDynamicPricing(updated);
    } else {
      setInternalDynamicPricing(updated);
    }

    if (onPushSurgeRateLogs) {
      onPushSurgeRateLogs(!dynamicPricing.isEnabled ? activeSurgePercent : 0, effectiveOccupancyPercent);
    }
  };

  const handleSaveDynamicPricingConfig = (newConfig: DynamicPricingConfig) => {
    if (onUpdateDynamicPricing) {
      onUpdateDynamicPricing(newConfig);
    } else {
      setInternalDynamicPricing(newConfig);
    }
  };

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

  const handleRegenerateMasterApiKey = () => {
    const newKey = `mt_live_api_${Math.random().toString(36).substring(2, 10)}_${Math.random().toString(36).substring(2, 8)}_${hotelSlug}`;
    setMasterApiKey(newKey);
    setTempMasterApiKey(newKey);
    handleCopy(newKey, 'master-key');
  };

  const handleRegenerateHmacSecret = () => {
    const newSecret = `whsec_${Math.random().toString(36).substring(2, 12)}_${Math.random().toString(36).substring(2, 10)}`;
    setHmacSecret(newSecret);
    handleCopy(newSecret, 'hmac-key');
  };

  const handleSaveCustomMasterApiKey = () => {
    if (tempMasterApiKey.trim()) {
      setMasterApiKey(tempMasterApiKey.trim());
      setIsEditingMasterApiKey(false);
    }
  };

  const toggleRevealChannelKey = (channelId: string) => {
    setRevealedChannelKeys(prev => ({
      ...prev,
      [channelId]: !prev[channelId]
    }));
  };

  const connectedCount = channels.filter(c => c.isConnected).length;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 p-4 md:p-6 space-y-6">
      
      {/* Top Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              OTA Channel Manager
            </h1>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
              connectedCount > 0 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${connectedCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              {connectedCount > 0 ? `${connectedCount} Channels Active` : 'All Channels Offline'}
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time automated inventory, rate distribution, and instant booking ingestion across online travel portals
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* USER REQUESTED OPTIONAL BUTTON: Dynamic Yield Pricing Toggle */}
          <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all shadow-2xs ${
            dynamicPricing.isEnabled 
              ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300' 
              : 'bg-slate-100 border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg text-white shadow-2xs ${
                dynamicPricing.isEnabled ? 'bg-amber-600 animate-pulse' : 'bg-slate-400'
              }`}>
                <TrendingUp size={14} />
              </span>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">
                    Occupancy Rate Surge
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                    dynamicPricing.isEnabled
                      ? activeSurgePercent > 0 
                        ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}>
                    {dynamicPricing.isEnabled 
                      ? (activeSurgePercent > 0 ? `+${activeSurgePercent}% SURGE` : 'STANDBY') 
                      : 'OFF'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  50% Sold → +10% | 80% Sold → +20%
                </div>
              </div>
            </div>

            {/* Optional Button Switch */}
            <button
              type="button"
              onClick={handleToggleDynamicPricing}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                dynamicPricing.isEnabled ? 'bg-amber-600' : 'bg-slate-300'
              }`}
              title="Toggle Dynamic Rate Surge: 50% rooms sold -> +10% rate | 80% rooms sold -> +20% rate"
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                dynamicPricing.isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {connectedCount > 0 && onDisconnectAll && (
            <button
              onClick={onDisconnectAll}
              className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              title="Disconnect all channels to start fresh"
            >
              <Power size={13} className="text-slate-500" />
              <span>Disconnect All</span>
            </button>
          )}

          {connectedCount < channels.length && onConnectAll && (
            <button
              onClick={onConnectAll}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              title="Activate all channels"
            >
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Connect All</span>
            </button>
          )}

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

      {/* DYNAMIC PRICING YIELD MANAGEMENT PANEL (Shown when feature is active or opened) */}
      {dynamicPricing.isEnabled && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 border border-amber-300/80 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
                <Flame size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm md:text-base">
                    Dynamic Occupancy Surge Pricing Engine
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-400">
                    Active on all OTAs
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Automated Rule: <strong>≥50% Rooms Sold → +10% Rate Boost</strong> | <strong>≥80% Rooms Sold → +20% Rate Boost</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDynamicRulesModalOpen(true)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-amber-300 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <SlidersHorizontal size={13} className="text-amber-700" />
                <span>Configure Rules</span>
              </button>
            </div>
          </div>

          {/* Occupancy Progress Bar & Visual Thresholds */}
          <div className="bg-white p-4 rounded-xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Gauge size={16} className="text-amber-700" />
                <span className="font-bold text-slate-800">
                  Current Occupancy: <span className="text-amber-900 font-extrabold">{effectiveOccupancyPercent}%</span>
                </span>
                <span className="text-slate-500 font-medium">
                  ({Math.round((effectiveOccupancyPercent / 100) * rooms.length)} of {rooms.length} rooms sold)
                </span>
                {simulatedOccupancyOverride !== null && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                    Simulation Mode
                  </span>
                )}
              </div>

              <div className={`font-bold text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                surgeLevel === 'tier2'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : surgeLevel === 'tier1'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {surgeLevel === 'tier2' && <Flame size={14} className="text-rose-600" />}
                {surgeLevel === 'tier1' && <Zap size={14} className="text-amber-600" />}
                <span>{activeTierLabel}</span>
              </div>
            </div>

            {/* Visual Multi-Zone Progress Track */}
            <div className="relative pt-2 pb-1">
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200 shadow-inner">
                {/* 0% to 50% zone */}
                <div 
                  style={{ width: `${dynamicPricing.tier1ThresholdPercent}%` }} 
                  className="bg-emerald-100/80 border-r border-slate-300 relative flex items-center justify-center text-[9px] font-bold text-emerald-800"
                >
                  Base Rate (0 - 49%)
                </div>
                {/* 50% to 80% zone */}
                <div 
                  style={{ width: `${dynamicPricing.tier2ThresholdPercent - dynamicPricing.tier1ThresholdPercent}%` }} 
                  className="bg-amber-100/90 border-r border-slate-300 relative flex items-center justify-center text-[9px] font-bold text-amber-900"
                >
                  Tier 1 (+10% Surge)
                </div>
                {/* 80% to 100% zone */}
                <div 
                  style={{ width: `${100 - dynamicPricing.tier2ThresholdPercent}%` }} 
                  className="bg-rose-100 relative flex items-center justify-center text-[9px] font-bold text-rose-900"
                >
                  Tier 2 (+20% Surge)
                </div>
              </div>

              {/* Pin indicator */}
              <div 
                style={{ left: `${Math.min(100, Math.max(0, effectiveOccupancyPercent))}%` }} 
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300"
              >
                <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-md ${
                  effectiveOccupancyPercent >= 80 ? 'bg-rose-600' :
                  effectiveOccupancyPercent >= 50 ? 'bg-amber-600' :
                  'bg-emerald-600'
                }`}></div>
              </div>
            </div>

            {/* Quick Simulation Pills to Test Surge Levels */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-500">Test Scenarios:</span>
                
                <button
                  type="button"
                  onClick={() => setSimulatedOccupancyOverride(null)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                    simulatedOccupancyOverride === null 
                      ? 'bg-slate-800 text-white border-slate-900' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Live ({liveOccupancyPercent}%)
                </button>

                <button
                  type="button"
                  onClick={() => setSimulatedOccupancyOverride(30)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                    simulatedOccupancyOverride === 30 
                      ? 'bg-emerald-700 text-white border-emerald-800' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  30% Sold (Base Rate)
                </button>

                <button
                  type="button"
                  onClick={() => setSimulatedOccupancyOverride(50)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                    simulatedOccupancyOverride === 50 
                      ? 'bg-amber-600 text-white border-amber-700' 
                      : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  ⚡ 50% Sold (+10% Surge)
                </button>

                <button
                  type="button"
                  onClick={() => setSimulatedOccupancyOverride(80)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                    simulatedOccupancyOverride === 80 
                      ? 'bg-rose-600 text-white border-rose-700' 
                      : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
                  }`}
                >
                  🔥 80% Sold (+20% Surge)
                </button>

                <button
                  type="button"
                  onClick={() => setSimulatedOccupancyOverride(90)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                    simulatedOccupancyOverride === 90 
                      ? 'bg-rose-700 text-white border-rose-800' 
                      : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
                  }`}
                >
                  🔥 90% Sold (+20% Surge)
                </button>
              </div>

              <div className="text-[11px] text-slate-500">
                All {channels.length} OTA channels update in real-time
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'channels'
              ? 'border-teal-600 text-teal-900 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Connected Channels ({channels.filter(c => c.isConnected).length})</span>
          {dynamicPricing.isEnabled && activeSurgePercent > 0 && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-500 text-white animate-pulse">
              +{activeSurgePercent}% Surge
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('mappings')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'mappings'
              ? 'border-teal-600 text-teal-900 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Room Category Mappings ({roomMappings.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'logs'
              ? 'border-teal-600 text-teal-900 bg-white rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Live Sync Logs &amp; Activity ({syncLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
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
            const effectiveMarkup = ch.rateMarkupPercent + (dynamicPricing.isEnabled ? activeSurgePercent : 0);

            return (
              <div
                key={ch.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-xs shrink-0 ${
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
                        <Icon size={22} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-base truncate">{ch.name}</h3>
                        <span className="text-[11px] text-slate-400 font-mono truncate block max-w-[170px]" title={ch.apiEndpoint}>
                          {ch.apiEndpoint}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      ch.isConnected 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}>
                      {ch.isConnected ? '● Connected' : '○ Disconnected'}
                    </span>
                  </div>

                  {/* Channel Credentials Overview Box */}
                  <div className="mt-3.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-slate-500">Property ID:</span>
                      <span className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {ch.hotelCode || `${ch.id.toUpperCase()}-001`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-slate-500">Extranet User:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[140px]" title={ch.extranetUsername}>
                        {ch.extranetUsername || `partner@${ch.id}.com`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-semibold text-slate-500 flex items-center gap-1">
                        <KeyRound size={11} className="text-teal-700" /> API Key:
                      </span>
                      <span className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {ch.apiKey ? `${ch.apiKey.substring(0, 6)}••••${ch.apiKey.slice(-4)}` : 'Auto-generated'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: Login & Configure API + Disconnect */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setLoginModalChannel(ch)}
                      className="flex-1 py-1.5 px-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300/80 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Edit Login Credentials, Property ID, and API Key"
                    >
                      <KeyRound size={13} className="text-teal-700" />
                      <span>Extranet Login &amp; API</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleChannelConnect(ch.id)}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        ch.isConnected
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300'
                      }`}
                      title={ch.isConnected ? "Disconnect / Logout this channel" : "Connect / Login this channel"}
                    >
                      <Power size={12} className={ch.isConnected ? "text-rose-600" : "text-emerald-600"} />
                      <span>{ch.isConnected ? 'Disconnect' : 'Connect'}</span>
                    </button>
                  </div>

                  {/* Channel Stats with Dynamic Surge Indication */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                    <div className={`p-2 rounded-lg border transition-colors ${
                      dynamicPricing.isEnabled && activeSurgePercent > 0 
                        ? 'bg-amber-50 border-amber-200' 
                        : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center justify-center gap-1">
                        Markup
                        {dynamicPricing.isEnabled && activeSurgePercent > 0 && (
                          <Flame size={10} className="text-amber-600" />
                        )}
                      </div>
                      <div className={`text-sm font-bold mt-0.5 ${
                        dynamicPricing.isEnabled && activeSurgePercent > 0 
                          ? 'text-amber-900 font-extrabold' 
                          : 'text-slate-900'
                      }`}>
                        +{effectiveMarkup}%
                      </div>
                      {dynamicPricing.isEnabled && activeSurgePercent > 0 && (
                        <div className="text-[9px] text-amber-700 font-bold mt-0.5">
                          (+{activeSurgePercent}% Surge)
                        </div>
                      )}
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
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>PMS Room to OTA Channel Mapping</span>
                {dynamicPricing.isEnabled && activeSurgePercent > 0 && (
                  <span className="text-[10px] font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    +{activeSurgePercent}% Dynamic Surge Applied
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Maps internal PMS room categories with external OTA room types for rate &amp; inventory syncing
              </p>
            </div>
            <button
              onClick={onOpenSimulateModal}
              className="text-xs bg-teal-800 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-teal-900 transition-colors flex items-center gap-1"
            >
              <Plus size={13} /> Add Mapping
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">PMS Room Type</th>
                  <th className="p-3">OTA Channel</th>
                  <th className="p-3">OTA Room Code</th>
                  <th className="p-3">Base Modifier</th>
                  {dynamicPricing.isEnabled && (
                    <th className="p-3 text-amber-900 bg-amber-50">Occupancy Surge</th>
                  )}
                  <th className="p-3">Effective OTA Rate</th>
                  <th className="p-3">Stop Sell</th>
                  <th className="p-3 text-right">Sync Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roomMappings.map((map) => {
                  const effectiveModifier = map.rateModifier + (dynamicPricing.isEnabled ? activeSurgePercent : 0);

                  return (
                    <tr key={map.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">{map.pmsRoomType}</td>
                      <td className="p-3">
                        <span className="capitalize font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {map.otaChannel}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">{map.otaRoomCode}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onUpdateRateModifier(map.id, -5)}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-bold text-slate-800 min-w-[36px] text-center">
                            {map.rateModifier > 0 ? `+${map.rateModifier}%` : `${map.rateModifier}%`}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateRateModifier(map.id, 5)}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {dynamicPricing.isEnabled && (
                        <td className="p-3 bg-amber-50/60 font-bold">
                          {activeSurgePercent > 0 ? (
                            <span className="text-amber-800 flex items-center gap-1">
                              <Flame size={12} className="text-amber-600" />
                              +{activeSurgePercent}%
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">0% (&lt;50% sold)</span>
                          )}
                        </td>
                      )}

                      <td className="p-3 font-bold text-slate-900">
                        <span className={dynamicPricing.isEnabled && activeSurgePercent > 0 ? 'text-amber-800 font-extrabold' : ''}>
                          +{effectiveModifier}%
                        </span>
                      </td>

                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => onToggleStopSell(map.id)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                            map.stopSell 
                              ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {map.stopSell ? 'Stop-Sell Active' : 'Selling Open'}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 size={13} /> Synced
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
              className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
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
        <div className="space-y-6">

          {/* Section A: Live Master PMS API Key & Webhook Endpoints */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Box 1: PMS Master Production API Key */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <KeyRound size={17} className="text-teal-700" />
                  Hotel PMS Master Live API Key
                </h3>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                  Active Production Key
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Use this Master API Key to authenticate external API calls, PMS webhook webhooks, and third-party channel aggregators for <strong>{hotelProfile?.name || 'this property'}</strong>.
              </p>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold flex items-center gap-1.5">
                    <Server size={13} className="text-slate-500" />
                    Live Authorization Bearer Key:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMasterApiKey(!showMasterApiKey)}
                      className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {showMasterApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{showMasterApiKey ? 'Hide' : 'Reveal'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(masterApiKey, "master-api-key")}
                      className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'master-api-key' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedKey === 'master-api-key' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {isEditingMasterApiKey ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempMasterApiKey}
                      onChange={(e) => setTempMasterApiKey(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-teal-500 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomMasterApiKey}
                      className="px-3 py-1.5 bg-teal-800 text-white rounded-lg text-xs font-bold hover:bg-teal-900 cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTempMasterApiKey(masterApiKey);
                        setIsEditingMasterApiKey(false);
                      }}
                      className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="font-mono text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-slate-300 break-all select-all flex items-center justify-between">
                    <span>
                      {showMasterApiKey 
                        ? masterApiKey 
                        : `${masterApiKey.substring(0, 12)}••••••••••••••••••••••••${masterApiKey.slice(-6)}`}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingMasterApiKey(true)}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={11} />
                    <span>Edit Custom Key</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerateMasterApiKey}
                    className="text-[11px] font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} />
                    <span>Regenerate API Key</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Box 2: Inbound Webhook Endpoint URL */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Zap size={17} className="text-amber-600" />
                  Incoming Inbound Webhook Endpoint
                </h3>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                  Real-Time Inflow
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Provide this webhook URL to MakeMyTrip Extranet, BookingSuite, or Agoda YCS partner portals to receive real-time instant booking notifications.
              </p>

              {/* URL */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold">POST Webhook URL:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(webhookUrl, "wh-url")}
                    className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'wh-url' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedKey === 'wh-url' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-800 bg-white p-2 rounded border border-slate-300 break-all select-all">
                  {webhookUrl}
                </div>
              </div>

              {/* Secret HMAC */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold">Secret HMAC Key:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowHmacSecret(!showHmacSecret)}
                      className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {showHmacSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{showHmacSecret ? 'Hide' : 'Reveal'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(hmacSecret, "wh-key")}
                      className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'wh-key' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedKey === 'wh-key' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <div className="font-mono text-xs text-slate-800 bg-white p-2 rounded border border-slate-300 flex items-center justify-between">
                  <span>
                    {showHmacSecret 
                      ? hmacSecret 
                      : `${hmacSecret.substring(0, 10)}••••••••••••••••${hmacSecret.slice(-4)}`}
                  </span>
                  <button
                    type="button"
                    onClick={handleRegenerateHmacSecret}
                    className="text-[10px] font-bold text-teal-800 hover:underline cursor-pointer ml-2"
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              {/* Test Webhook Ping Button */}
              {onTestInboundWebhook && (
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Test incoming webhook handshake:</span>
                  <button
                    type="button"
                    onClick={() => onTestInboundWebhook('makemytrip')}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Zap size={13} className="text-amber-600 fill-amber-500" />
                    <span>Send Test Webhook Ping</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section B: All Channels Extranet Logins & API Keys Directory */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <KeyRound size={16} className="text-teal-700" />
                  All Connected OTA Channels — Extranet Credentials &amp; API Keys Directory
                </h3>
                <p className="text-xs text-slate-500">
                  Quickly view, copy, or edit Extranet login details and API authorization tokens for each individual travel portal
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">
                  {channels.length} Portals Available
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">OTA Channel</th>
                    <th className="p-3">Property Extranet ID</th>
                    <th className="p-3">Extranet Username</th>
                    <th className="p-3">Channel API Key / Token</th>
                    <th className="p-3">Environment</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {channels.map((ch) => {
                    const Icon = getChannelIcon(ch.logo);
                    const isRevealed = !!revealedChannelKeys[ch.id];
                    const displayKey = ch.apiKey || `${ch.id}_key_default_${ch.hotelCode || '001'}`;

                    return (
                      <tr key={ch.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                              <Icon size={14} />
                            </div>
                            <span>{ch.name}</span>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {ch.hotelCode || `${ch.id.toUpperCase()}-001`}
                          </span>
                        </td>

                        <td className="p-3 font-medium text-slate-700">
                          {ch.extranetUsername || `partner.${ch.id}@maahitrips.in`}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 max-w-[160px] truncate">
                              {isRevealed 
                                ? displayKey 
                                : `${displayKey.substring(0, 6)}••••${displayKey.slice(-4)}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleRevealChannelKey(ch.id)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                              title={isRevealed ? "Hide key" : "Show key"}
                            >
                              {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(displayKey, `ch-${ch.id}`)}
                              className="text-slate-400 hover:text-teal-700 p-0.5 cursor-pointer"
                              title="Copy API Key"
                            >
                              {copiedKey === `ch-${ch.id}` ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            </button>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            ch.environment === 'sandbox' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {ch.environment === 'sandbox' ? 'Sandbox' : 'Production'}
                          </span>
                        </td>

                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            ch.isConnected 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-slate-100 text-slate-500 border border-slate-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${ch.isConnected ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                            {ch.isConnected ? 'Connected' : 'Offline'}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => setLoginModalChannel(ch)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Edit Extranet Login & API Key"
                          >
                            <KeyRound size={12} className="text-teal-700" />
                            <span>Edit Login &amp; API</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section C: Security & Rate Parity Policy */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck size={16} className="text-teal-700" />
              Channel Security &amp; Rate Parity Guarantee
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-900">
                <span className="font-bold block text-sm mb-1">Rate Parity Guard:</span>
                Ensures contracted rates between MakeMyTrip, Agoda, and Booking.com stay in strict compliance with automatic OTA markup ratios. Direct guest bookings always receive best rate guarantee.
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-bold block text-sm text-slate-800 mb-1">Inventory Auto-Decrement:</span>
                When a direct walk-in booking is saved in the Desk tape chart, all connected channels immediately receive updated availability within 300 milliseconds to avoid overbooking.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Extranet Login & API Key Modal */}
      {loginModalChannel && (
        <ChannelLoginModal
          isOpen={!!loginModalChannel}
          onClose={() => setLoginModalChannel(null)}
          channel={loginModalChannel}
          hotelName={hotelProfile?.name || 'Active Property'}
          onSaveChannelConfig={(updated) => {
            if (onUpdateChannelConfig) {
              onUpdateChannelConfig(updated);
            }
          }}
          onToggleConnect={onToggleChannelConnect}
        />
      )}

      {/* Dynamic Pricing Rules Modal */}
      <DynamicPricingRulesModal
        isOpen={isDynamicRulesModalOpen}
        onClose={() => setIsDynamicRulesModalOpen(false)}
        config={dynamicPricing}
        onSave={handleSaveDynamicPricingConfig}
      />

    </div>
  );
};
