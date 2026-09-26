import React, { useState } from 'react';
import { DynamicPricingConfig, LastMinuteRateAutomationConfig } from '../types';
import { 
  X, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  Percent, 
  Clock, 
  Sliders, 
  ArrowRight,
  Flame,
  Check,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { defaultLastMinuteConfig } from '../utils/pricingHelper';

interface DynamicPricingRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DynamicPricingConfig;
  onSave: (newConfig: DynamicPricingConfig) => void;
  initialTab?: 'last_minute' | 'surge';
}

export const DynamicPricingRulesModal: React.FC<DynamicPricingRulesModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  initialTab = 'last_minute'
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'last_minute' | 'surge'>(initialTab);

  // Last Minute Automation state (User request: morning 7 am <60% occupancy -> 15% discount)
  const lmConfig = config.lastMinuteAutomation || defaultLastMinuteConfig;
  const [lmEnabled, setLmEnabled] = useState(lmConfig.isEnabled);
  const [lmHour, setLmHour] = useState(lmConfig.evaluationTimeHour ?? 7);
  const [lmMinute, setLmMinute] = useState(lmConfig.evaluationTimeMinute ?? 0);
  const [lmTargetOccupancy, setLmTargetOccupancy] = useState(lmConfig.targetOccupancyPercent ?? 60);
  const [lmDiscount, setLmDiscount] = useState(lmConfig.discountPercent ?? 15);
  const [lmApplyChannels, setLmApplyChannels] = useState(lmConfig.applyToChannels ?? true);
  const [lmApplyWalkIn, setLmApplyWalkIn] = useState(lmConfig.applyToDirectWalkIn ?? true);
  const [lmSimulateTest, setLmSimulateTest] = useState(!!lmConfig.simulatedTimePassed7am);

  // Surge state
  const [isSurgeEnabled, setIsSurgeEnabled] = useState(config.isEnabled);
  const [tier1Threshold, setTier1Threshold] = useState(config.tier1ThresholdPercent || 50);
  const [tier1Surge, setTier1Surge] = useState(config.tier1SurgePercent || 10);
  const [tier2Threshold, setTier2Threshold] = useState(config.tier2ThresholdPercent || 80);
  const [tier2Surge, setTier2Surge] = useState(config.tier2SurgePercent || 20);
  const [applyToAllChannels, setApplyToAllChannels] = useState(config.applyToAllChannels ?? true);

  // Sample Rate Calculations for Preview
  const sampleBaseRate = 3000;
  const sampleOtaMarkup = 15; // standard base 15% OTA markup

  // Flash Rate preview
  const flashDiscountAmount = Math.round(sampleBaseRate * (lmDiscount / 100));
  const flashReducedBaseRate = sampleBaseRate - flashDiscountAmount;
  const flashOtaRate = Math.round(flashReducedBaseRate * (1 + sampleOtaMarkup / 100));

  // Surge preview
  const standardOtaPrice = Math.round(sampleBaseRate * (1 + sampleOtaMarkup / 100));
  const tier1Price = Math.round(sampleBaseRate * (1 + (sampleOtaMarkup + tier1Surge) / 100));
  const tier2Price = Math.round(sampleBaseRate * (1 + (sampleOtaMarkup + tier2Surge) / 100));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedLastMinute: LastMinuteRateAutomationConfig = {
      isEnabled: lmEnabled,
      evaluationTimeHour: Number(lmHour),
      evaluationTimeMinute: Number(lmMinute),
      targetOccupancyPercent: Number(lmTargetOccupancy),
      discountPercent: Number(lmDiscount),
      applyToChannels: lmApplyChannels,
      applyToDirectWalkIn: lmApplyWalkIn,
      simulatedTimePassed7am: lmSimulateTest
    };

    onSave({
      isEnabled: isSurgeEnabled,
      tier1ThresholdPercent: Number(tier1Threshold),
      tier1SurgePercent: Number(tier1Surge),
      tier2ThresholdPercent: Number(tier2Threshold),
      tier2SurgePercent: Number(tier2Surge),
      applyToAllChannels,
      lastMinuteAutomation: updatedLastMinute
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg border border-white/20">
              <Sparkles size={22} className="text-teal-200" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Automated Rate &amp; Yield Management</span>
                <span className="text-[10px] bg-teal-400 text-teal-950 font-black px-2 py-0.5 rounded-full uppercase">
                  Automatic
                </span>
              </h2>
              <p className="text-xs text-teal-100">
                Last-minute flash reductions and occupancy surge rules
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('last_minute')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'last_minute'
                ? 'bg-white text-teal-900 border-teal-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Clock size={14} className={activeTab === 'last_minute' ? 'text-teal-700' : 'text-slate-400'} />
            <span>⚡ 7:00 AM Last-Minute Flash (-15%)</span>
            {lmEnabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 inline-block"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('surge')}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'surge'
                ? 'bg-white text-amber-900 border-amber-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <TrendingUp size={14} className={activeTab === 'surge' ? 'text-amber-600' : 'text-slate-400'} />
            <span>📈 Occupancy Surge (+10% / +20%)</span>
            {isSurgeEnabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block"></span>
            )}
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">

          {/* TAB 1: LAST-MINUTE 7:00 AM FLASH RATE AUTOMATION */}
          {activeTab === 'last_minute' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Hindi & English Rule Summary Card */}
              <div className="p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-950">
                  <Clock size={16} className="text-teal-700" />
                  <span>Rule: Morning 7:00 AM Last-Minute Booking Automation</span>
                </div>
                <p className="text-xs text-teal-900 leading-relaxed font-medium">
                  <strong>नियम (Rule):</strong> हर सुबह <strong>7:00 AM</strong> पर सिस्टम आज की सेम-डेट बुकिंग चेक करेगा। अगर आज की कुल ऑक्यूपेंसी <strong>60% से कम</strong> होगी, तो आज की लास्ट-मिनट बुकिंग के लिए रूम के बेस रेट से <strong>15% रेट ऑटोमैटिक कम (डिस्काउंट)</strong> हो जाएगा।
                </p>
              </div>

              {/* Master Switch for Last-Minute Automation */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${lmEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Enable 7:00 AM Last-Minute Automation
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Automatic 15% discount when today's occupancy is under 60%
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={lmEnabled}
                    onChange={(e) => setLmEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700"></div>
                </label>
              </div>

              {/* Configuration Inputs */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                <span className="text-xs font-bold text-slate-800 block">
                  Rule Evaluation Parameters:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Evaluation Cutoff Time */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Morning Cutoff Time
                    </label>
                    <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-teal-700">
                      <Clock size={13} className="text-slate-400 shrink-0" />
                      <select
                        value={lmHour}
                        onChange={(e) => setLmHour(Number(e.target.value))}
                        className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full"
                      >
                        <option value={5}>05:00 AM</option>
                        <option value={6}>06:00 AM</option>
                        <option value={7}>07:00 AM (Default)</option>
                        <option value={8}>08:00 AM</option>
                        <option value={9}>09:00 AM</option>
                        <option value={10}>10:00 AM</option>
                      </select>
                    </div>
                  </div>

                  {/* Occupancy Threshold */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      If Occupancy Is Under
                    </label>
                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-teal-700">
                      <input
                        type="number"
                        min="10"
                        max="90"
                        required
                        value={lmTargetOccupancy}
                        onChange={(e) => setLmTargetOccupancy(Number(e.target.value))}
                        className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </div>

                  {/* Rate Reduction */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Reduce Base Rate By
                    </label>
                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-teal-700">
                      <input
                        type="number"
                        min="5"
                        max="50"
                        required
                        value={lmDiscount}
                        onChange={(e) => setLmDiscount(Number(e.target.value))}
                        className="w-full text-xs font-bold text-rose-700 bg-transparent focus:outline-none"
                      />
                      <span className="text-xs font-bold text-rose-700">% OFF</span>
                    </div>
                  </div>
                </div>

                {/* Where to apply checkboxes */}
                <div className="pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={lmApplyChannels}
                      onChange={(e) => setLmApplyChannels(e.target.checked)}
                      className="rounded border-slate-300 text-teal-700 focus:ring-teal-700 cursor-pointer"
                    />
                    <span>Push to OTAs (MMT, Agoda, Booking.com)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={lmApplyWalkIn}
                      onChange={(e) => setLmApplyWalkIn(e.target.checked)}
                      className="rounded border-slate-300 text-teal-700 focus:ring-teal-700 cursor-pointer"
                    />
                    <span>Apply to Front Desk direct walk-ins</span>
                  </label>
                </div>
              </div>

              {/* Simulation Mode Toggle (Allows immediate testing) */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-950">
                  <AlertCircle size={16} className="text-amber-700 shrink-0" />
                  <div>
                    <span className="font-bold block">Testing Simulation Mode</span>
                    <span className="text-[11px] text-amber-800">
                      Simulate that 7:00 AM has already passed to test the 15% discount immediately right now
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                  <input
                    type="checkbox"
                    checked={lmSimulateTest}
                    onChange={(e) => setLmSimulateTest(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {/* Live Rate Preview */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                    <Sparkles size={13} />
                    Last-Minute 15% Reduction Preview
                  </span>
                  <span className="text-slate-400">Sample Base: ₹{sampleBaseRate.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                  <div className="bg-white/10 p-2.5 rounded-lg border border-white/10">
                    <span className="text-[10px] text-slate-300 block">Standard Base Rate</span>
                    <span className="font-bold text-white text-base">₹{sampleBaseRate.toLocaleString()}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Regular Direct Walk-in</span>
                  </div>

                  <div className="bg-rose-500/20 p-2.5 rounded-lg border border-rose-500/30">
                    <span className="text-[10px] text-rose-300 block">⚡ Flash Rate (-{lmDiscount}%)</span>
                    <span className="font-bold text-rose-300 text-base">₹{flashReducedBaseRate.toLocaleString()}</span>
                    <span className="text-[9px] text-emerald-300 font-semibold block mt-0.5">
                      Save ₹{flashDiscountAmount.toLocaleString()} per room/night
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: OCCUPANCY SURGE PRICING */}
          {activeTab === 'surge' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Main Master Switch for Surge */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Zap size={18} className="text-amber-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Enable Dynamic Surge Pricing
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Automatically boost rates when room occupancy hits surge thresholds
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isSurgeEnabled}
                    onChange={(e) => setIsSurgeEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {/* Tier 1 Rule: 50% Sold -> +10% */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Tier 1 Surge Rule (Moderate Occupancy)
                  </span>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    +{tier1Surge}% Rate Boost
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      When Rooms Sold Out ≥
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="10"
                        max="99"
                        required
                        value={tier1Threshold}
                        onChange={(e) => setTier1Threshold(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Increase Rate on All OTAs by
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={tier1Surge}
                        onChange={(e) => setTier1Surge(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-amber-800 focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tier 2 Rule: 80% Sold -> +20% */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    Tier 2 Surge Rule (High Occupancy)
                  </span>
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    +{tier2Surge}% Rate Boost
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      When Rooms Sold Out ≥
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="20"
                        max="100"
                        required
                        value={tier2Threshold}
                        onChange={(e) => setTier2Threshold(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Increase Rate on All OTAs by
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={tier2Surge}
                        onChange={(e) => setTier2Surge(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-rose-700 focus:ring-2 focus:ring-rose-500"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-Time Live Calculation Preview */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block flex items-center gap-1.5">
                  <Sparkles size={13} />
                  Rate Surge Live Calculation Preview
                </span>

                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                    <span className="text-[10px] text-slate-300 block">&lt; {tier1Threshold}% Sold</span>
                    <span className="font-bold text-white text-sm">₹{standardOtaPrice.toLocaleString()}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Base OTA Rate</span>
                  </div>

                  <div className="bg-amber-500/20 p-2 rounded-lg border border-amber-500/30">
                    <span className="text-[10px] text-amber-300 block">≥ {tier1Threshold}% Sold</span>
                    <span className="font-bold text-amber-300 text-sm">₹{tier1Price.toLocaleString()}</span>
                    <span className="text-[9px] text-amber-200 block mt-0.5">+{tier1Surge}% Surge</span>
                  </div>

                  <div className="bg-rose-500/20 p-2 rounded-lg border border-rose-500/30">
                    <span className="text-[10px] text-rose-300 block">≥ {tier2Threshold}% Sold</span>
                    <span className="font-bold text-rose-300 text-sm">₹{tier2Price.toLocaleString()}</span>
                    <span className="text-[9px] text-rose-200 block mt-0.5">+{tier2Surge}% Surge</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              * Rates update automatically across all PMS calendars and OTAs
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>Save &amp; Apply Rules</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
