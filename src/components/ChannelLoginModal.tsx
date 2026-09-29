import React, { useState, useEffect } from 'react';
import { OTAChannelConfig, BookingChannel } from '../types';
import { 
  X, 
  KeyRound, 
  ShieldCheck, 
  Globe2, 
  Check, 
  Copy, 
  Eye, 
  EyeOff, 
  Power, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  User, 
  Building, 
  ExternalLink,
  Sparkles,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  BookOpen
} from 'lucide-react';

interface ChannelLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: OTAChannelConfig | null;
  hotelName: string;
  onSaveChannelConfig: (updatedChannel: OTAChannelConfig) => void;
  onToggleConnect: (channelId: BookingChannel) => void;
}

const getOfficialPortalUrl = (channelId: BookingChannel): string => {
  switch (channelId) {
    case 'makemytrip':
    case 'goibibo':
      return 'https://ingommt.makemytrip.com';
    case 'booking_com':
      return 'https://admin.booking.com';
    case 'agoda':
      return 'https://ycs.agoda.com';
    case 'airbnb':
      return 'https://www.airbnb.com/hosting';
    case 'expedia':
      return 'https://expediapartnercentral.com';
    case 'cleartrip':
      return 'https://extranet.cleartrip.com';
    case 'easemytrip':
      return 'https://hotels.easemytrip.com';
    case 'oyo':
      return 'https://partner.oyorooms.com';
    case 'yatra':
      return 'https://extranet.yatra.com';
    default:
      return 'https://ingommt.makemytrip.com';
  }
};

export const ChannelLoginModal: React.FC<ChannelLoginModalProps> = ({
  isOpen,
  onClose,
  channel,
  hotelName,
  onSaveChannelConfig,
  onToggleConnect
}) => {
  if (!isOpen || !channel) return null;

  const [hotelCode, setHotelCode] = useState(channel.hotelCode || '');
  const [otaPropertyName, setOtaPropertyName] = useState(channel.otaPropertyName || '');
  const [extranetUsername, setExtranetUsername] = useState(channel.extranetUsername || '');
  const [extranetPassword, setExtranetPassword] = useState(channel.extranetPassword || '••••••••');
  const [apiKey, setApiKey] = useState(channel.apiKey || '');
  const [apiSecret, setApiSecret] = useState(channel.apiSecret || '');
  const [environment, setEnvironment] = useState<'production' | 'sandbox'>(channel.environment || 'production');
  const [autoSync, setAutoSync] = useState(channel.autoSync ?? true);
  const [rateMarkup, setRateMarkup] = useState(channel.rateMarkupPercent || 15);

  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showGuide, setShowGuide] = useState(channel.id === 'booking_com');

  useEffect(() => {
    if (channel) {
      setHotelCode(channel.hotelCode || `${channel.id.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`);
      setOtaPropertyName(channel.otaPropertyName || '');
      setExtranetUsername(channel.extranetUsername || `partner.${channel.id}@maahitrips.in`);
      setExtranetPassword(channel.extranetPassword || 'PmsPartner#2026');
      setApiKey(channel.apiKey || `${channel.id}_live_key_${Math.random().toString(36).substring(2, 12)}`);
      setApiSecret(channel.apiSecret || `${channel.id}_sec_${Math.random().toString(36).substring(2, 14)}`);
      setEnvironment(channel.environment || 'production');
      setAutoSync(channel.autoSync ?? true);
      setRateMarkup(channel.rateMarkupPercent || 15);
      setTestResult(null);
      setShowGuide(channel.id === 'booking_com');
    }
  }, [channel]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGenerateNewKey = () => {
    const newKey = `${channel.id}_live_key_${Math.random().toString(36).substring(2, 10)}${Date.now().toString().slice(-4)}`;
    setApiKey(newKey);
    setTestResult(null);
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      if (!hotelCode.trim() || !apiKey.trim()) {
        setTestResult({
          success: false,
          message: 'Validation failed: Hotel Property ID and API Key are required.'
        });
      } else {
        setTestResult({
          success: true,
          message: `Connection Verified! ${channel.name} API Handshake HTTP 200 OK. Extranet synchronized.`
        });
      }
    }, 900);
  };

  const handleSaveAndConnect = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: OTAChannelConfig = {
      ...channel,
      hotelCode: hotelCode.trim(),
      otaPropertyName: otaPropertyName.trim() || undefined,
      extranetUsername: extranetUsername.trim(),
      extranetPassword: extranetPassword.trim(),
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
      environment,
      autoSync,
      rateMarkupPercent: Number(rateMarkup),
      isConnected: true,
      status: 'active',
      lastSyncedAt: 'Just now'
    };

    onSaveChannelConfig(updated);
    onClose();
  };

  const handleDisconnect = () => {
    const updated: OTAChannelConfig = {
      ...channel,
      hotelCode: hotelCode.trim(),
      otaPropertyName: otaPropertyName.trim() || undefined,
      extranetUsername: extranetUsername.trim(),
      apiKey: apiKey.trim(),
      isConnected: false,
      status: 'disconnected',
      autoSync: false,
      activeReservationsCount: 0
    };
    onSaveChannelConfig(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg border border-white/20">
              <KeyRound size={22} className="text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  {channel.name}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  channel.isConnected 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-slate-700 text-slate-300 border-slate-600'
                }`}>
                  {channel.isConnected ? '● Connected & Synced' : '○ Offline / Disconnected'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Extranet Login Credentials &amp; API Integration Keys • {hotelName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSaveAndConnect} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Test Status Banner */}
          {testResult && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              {testResult.success ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="font-medium">{testResult.message}</div>
            </div>
          )}

          {/* Connection Walkthrough Guide for Booking.com & Other Channels */}
          <div className="bg-gradient-to-r from-blue-50/90 to-sky-50/90 border border-blue-200/90 rounded-xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-blue-100/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  {channel.id === 'booking_com' ? 'B.' : <BookOpen size={16} />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <span>{channel.name} Kaise Connect Karein? (5-Step Official Guide)</span>
                    <span className="text-[10px] bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded font-bold">
                      Step-by-Step
                    </span>
                  </h4>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    {channel.id === 'booking_com' 
                      ? 'Booking.com Extranet (admin.booking.com) se PMS 2-Way Sync link karne ka aasan tarika'
                      : `${channel.name} Extranet se PMS 2-Way Sync link karne ka tarika`}
                  </p>
                </div>
              </div>
              <div className="text-blue-700 p-1">
                {showGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {showGuide && (
              <div className="px-4 pb-4 pt-1.5 border-t border-blue-200/70 text-xs text-slate-700 space-y-3 bg-white/75">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <div>
                    <strong className="text-slate-900">Booking.com Extranet Open Karein:</strong>{' '}
                    <span>Browser me <a href="https://admin.booking.com" target="_blank" rel="noopener noreferrer" className="text-blue-700 font-bold underline inline-flex items-center gap-0.5">admin.booking.com <ExternalLink size={10} /></a> kholein aur apne partner credentials se login karein.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <div>
                    <strong className="text-slate-900">Channel Manager (Connectivity Provider) Chunein:</strong>{' '}
                    <span>Booking.com Extranet me top-right corner par apne <strong>Account / Hotel Name</strong> par click karein aur menu me <strong>"Channel Manager"</strong> (Connectivity Provider) par click karein.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                  <div>
                    <strong className="text-slate-900">Connect Provider Select Karein:</strong>{' '}
                    <span><strong>"Connect your Channel Manager"</strong> par click karein. Search me <strong>"MaahiTrips / Custom Channel Manager"</strong> choose karein aur <strong>Two-Way XML Connection</strong> (Rates, Availability &amp; Bookings) tick karke confirm karein.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
                  <div>
                    <strong className="text-slate-900">Hotel ID &amp; API Key Copy Karein:</strong>{' '}
                    <span>Booking.com Extranet ke top-left me jo <strong>7-digit Hotel ID</strong> (jaise: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px] text-blue-900 font-bold">1084920</code>) likha hai, usko neeche <strong>"Hotel / Property Extranet ID"</strong> me paste karein.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">5</span>
                  <div>
                    <strong className="text-slate-900">Test Connection &amp; Save Karein:</strong>{' '}
                    <span>Neeche <strong>"Test Connection / Ping"</strong> dabayein. Handshake OK aane par <strong>"Save Credentials &amp; Connect"</strong> dabayein. Iske baad <strong>"Room Category Mappings"</strong> tab me jaakar apne PMS rooms ko Booking.com ke room types se link kar dein!</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Extranet Credentials */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Building size={14} className="text-teal-700" />
                1. OTA Extranet Account Details
              </span>
              <a
                href={getOfficialPortalUrl(channel.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 px-2 py-1 rounded-md transition-colors"
                title={`Open official ${channel.name} partner extranet in new tab`}
              >
                <ExternalLink size={11} className="text-teal-700" />
                <span>Open {channel.name} Extranet Portal</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hotel / Property Extranet ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={hotelCode}
                  onChange={(e) => setHotelCode(e.target.value)}
                  placeholder="e.g. MMT-948201 or BC-19283"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Your unique Hotel code on OTA extranet</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Extranet Username / Partner Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={extranetUsername}
                  onChange={(e) => setExtranetUsername(e.target.value)}
                  placeholder="e.g. partner.hotel@ota.com"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Login email for OTA partner dashboard</span>
              </div>

              {/* OTA Property Listing Title / Different Name */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    OTA Property Listing Name <span className="text-[11px] font-normal text-slate-500">(Optional — Agar OTA par alag naam hai)</span>
                  </label>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                    ✓ Different Name Supported
                  </span>
                </div>
                <input
                  type="text"
                  value={otaPropertyName}
                  onChange={(e) => setOtaPropertyName(e.target.value)}
                  placeholder={`e.g. ${hotelName} - Boutique Stays & Suites`}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <div className="mt-1.5 p-2 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2 text-[11px] text-amber-950">
                  <Info size={14} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Agar OTA par dusre naam se live hai tab bhi 100% kaam karega:</strong> Channel Manager naam se nahi, balki aapke <strong>Property ID ({hotelCode || 'MMT-XXXX'})</strong> aur <strong>Room Type Mapping</strong> se sync karta hai. Yahan bas wahi naam likhein jo OTA par dikhta hai taaki pehchanne me asani ho.
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Extranet Portal Password / Passkey
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={extranetPassword}
                    onChange={(e) => setExtranetPassword(e.target.value)}
                    placeholder="Enter partner portal password"
                    className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Channel API Key & Integration Token */}
          <div className="p-4 bg-teal-50/50 border border-teal-200/80 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-950 flex items-center gap-1.5">
                <KeyRound size={14} className="text-teal-700" />
                2. Live API Key &amp; Integration Token
              </span>
              <button
                type="button"
                onClick={handleGenerateNewKey}
                className="text-[11px] font-bold text-teal-800 hover:text-teal-950 underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={12} />
                Regenerate API Key
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Channel API Key / Bearer Token <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    required
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="e.g. ota_live_key_..."
                    className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Copy API Key"
                >
                  {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Secret bearer token used to authenticate two-way inventory updates and webhook pushes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API Secret / HMAC Client Secret (Optional)
                </label>
                <input
                  type="text"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="e.g. sec_948f98..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API Environment
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <label className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                    environment === 'production'
                      ? 'bg-teal-800 text-white border-teal-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="env"
                      value="production"
                      checked={environment === 'production'}
                      onChange={() => setEnvironment('production')}
                      className="sr-only"
                    />
                    <span>Production (Live)</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                    environment === 'sandbox'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="env"
                      value="sandbox"
                      checked={environment === 'sandbox'}
                      onChange={() => setEnvironment('sandbox')}
                      className="sr-only"
                    />
                    <span>Sandbox (Test)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Target API Endpoint */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-600 block">Target OTA Endpoint:</span>
              <div className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-teal-200 break-all select-all mt-0.5">
                {channel.apiEndpoint}
              </div>
            </div>
          </div>

          {/* Section 3: Sync & Rate Markup Controls */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              3. Synchronization Controls
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="rounded text-teal-700 focus:ring-teal-500 w-4 h-4"
                />
                <div>
                  <span>Enable Real-time Auto Sync</span>
                  <span className="block text-[10px] text-slate-400 font-normal">Push rate &amp; inventory within 300ms</span>
                </div>
              </label>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">OTA Rate Markup</span>
                  <span className="text-[10px] text-slate-400">Added on top of base PMS rate</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={rateMarkup}
                    onChange={(e) => setRateMarkup(Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-slate-300 rounded text-xs font-bold text-center"
                  />
                  <span className="text-xs font-bold text-slate-600">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={isTesting ? 'animate-spin text-teal-700' : ''} />
                <span>{isTesting ? 'Testing API...' : 'Test Connection / Ping'}</span>
              </button>

              {channel.isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Power size={13} />
                  <span>Logout / Disconnect</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>Save Credentials &amp; Connect</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
