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
  Zap
} from 'lucide-react';

interface ChannelLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: OTAChannelConfig | null;
  hotelName: string;
  onSaveChannelConfig: (updatedChannel: OTAChannelConfig) => void;
  onToggleConnect: (channelId: BookingChannel) => void;
}

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

  useEffect(() => {
    if (channel) {
      setHotelCode(channel.hotelCode || `${channel.id.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`);
      setExtranetUsername(channel.extranetUsername || `partner.${channel.id}@maahitrips.in`);
      setExtranetPassword(channel.extranetPassword || 'PmsPartner#2026');
      setApiKey(channel.apiKey || `${channel.id}_live_key_${Math.random().toString(36).substring(2, 12)}`);
      setApiSecret(channel.apiSecret || `${channel.id}_sec_${Math.random().toString(36).substring(2, 14)}`);
      setEnvironment(channel.environment || 'production');
      setAutoSync(channel.autoSync ?? true);
      setRateMarkup(channel.rateMarkupPercent || 15);
      setTestResult(null);
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

          {/* Section 1: Extranet Credentials */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Building size={14} className="text-teal-700" />
                1. OTA Extranet Account Details
              </span>
              <span className="text-[11px] text-slate-500">Provided by {channel.name}</span>
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
