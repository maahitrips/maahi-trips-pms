import React, { useState } from 'react';
import { DynamicPricingConfig } from '../types';
import { 
  X, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  Percent, 
  HelpCircle,
  Sliders,
  DollarSign,
  ArrowRight
} from 'lucide-react';

interface DynamicPricingRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DynamicPricingConfig;
  onSave: (newConfig: DynamicPricingConfig) => void;
}

export const DynamicPricingRulesModal: React.FC<DynamicPricingRulesModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave
}) => {
  if (!isOpen) return null;

  const [isEnabled, setIsEnabled] = useState(config.isEnabled);
  const [tier1Threshold, setTier1Threshold] = useState(config.tier1ThresholdPercent || 50);
  const [tier1Surge, setTier1Surge] = useState(config.tier1SurgePercent || 10);
  const [tier2Threshold, setTier2Threshold] = useState(config.tier2ThresholdPercent || 80);
  const [tier2Surge, setTier2Surge] = useState(config.tier2SurgePercent || 20);
  const [applyToAllChannels, setApplyToAllChannels] = useState(config.applyToAllChannels ?? true);

  const sampleBaseRate = 3000;
  const sampleOtaMarkup = 15; // base 15%

  const standardOtaPrice = Math.round(sampleBaseRate * (1 + sampleOtaMarkup / 100));
  const tier1Price = Math.round(sampleBaseRate * (1 + (sampleOtaMarkup + tier1Surge) / 100));
  const tier2Price = Math.round(sampleBaseRate * (1 + (sampleOtaMarkup + tier2Surge) / 100));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      isEnabled,
      tier1ThresholdPercent: Number(tier1Threshold),
      tier1SurgePercent: Number(tier1Surge),
      tier2ThresholdPercent: Number(tier2Threshold),
      tier2SurgePercent: Number(tier2Surge),
      applyToAllChannels
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg border border-white/20">
              <TrendingUp size={22} className="text-amber-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                Occupancy-Based Dynamic Rate Surge
              </h2>
              <p className="text-xs text-amber-100">
                Automated Yield Management for OTA Channels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          
          {/* Main Master Switch */}
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
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
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
            <p className="text-[10px] text-slate-400 text-center pt-1">
              * Rates automatically adjust on MakeMyTrip, Booking.com, Agoda, Airbnb, etc.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={15} />
              <span>Save &amp; Apply Rules</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
