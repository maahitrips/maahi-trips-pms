import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  Check, 
  Copy, 
  ExternalLink, 
  Share2, 
  Play, 
  QrCode, 
  Layers, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onInstallPrompt?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallPrompt
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'mobile' | 'playstore'>('mobile');
  const [isCopied, setIsCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.origin || window.location.href);
    }
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Generate a clean inline SVG QR code representation for quick phone camera scanning
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl)}&color=0f766e&bgcolor=f8fafc`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xs">
              <Smartphone size={22} className="text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  Mobile Me Download &amp; Install
                </h3>
                <span className="text-[10px] bg-teal-400/20 text-teal-200 border border-teal-400/30 px-2 py-0.5 rounded-full font-bold">
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-teal-200/80 mt-0.5">
                Android, iPhone, aur Play Store par chalane ka pura tarika
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

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'mobile'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone size={14} />
            <span>Direct Mobile Install (10 Seconds)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('playstore')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'playstore'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Play size={14} className="text-teal-700 fill-teal-600" />
            <span>Google Play Store (APK Guide)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-slate-700">

          {/* TAB 1: DIRECT MOBILE INSTALL */}
          {activeTab === 'mobile' && (
            <div className="space-y-4">
              
              {/* Native 1-Click Install Button if browser supports it */}
              {deferredPrompt && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                      <Zap size={14} className="text-emerald-600 fill-emerald-500" />
                      Aapka Browser Direct Install Support Karta Hai!
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Neeche diye button par click karke turant app install karein
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onInstallPrompt}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Install Now</span>
                  </button>
                </div>
              )}

              {/* QR Code and Share link */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs shrink-0 flex flex-col items-center">
                  <img 
                    src={qrSvgUrl} 
                    alt="Scan with mobile" 
                    className="w-28 h-28 object-contain rounded-lg"
                    onError={(e) => {
                      // Fallback if external QR API is offline
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-[10px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
                    <QrCode size={11} /> Phone camera se scan karein
                  </span>
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Apne Mobile Me Ye Link Kholein
                  </h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Aap is link ko WhatsApp par bhejkar apne ya staff ke mobile me kholein:
                  </p>
                  <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border border-slate-300">
                    <input
                      type="text"
                      readOnly
                      value={currentUrl}
                      className="bg-transparent font-mono text-[11px] text-slate-700 flex-1 px-1 outline-hidden truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2.5 py-1 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded text-[11px] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step by Step Android Chrome Guide */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">A</span>
                    <span>Android Phone (Google Chrome) Me Install Karne Ka Tarika:</span>
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Sabse Fast (10s)
                  </span>
                </div>

                <ol className="space-y-2 text-[11px] text-slate-700 pl-2">
                  <li className="flex items-start gap-2">
                    <strong className="text-emerald-900 min-w-[14px]">1.</strong>
                    <span>Mobile ke <strong>Google Chrome Browser</strong> me apna PMS link kholein.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <strong className="text-emerald-900 min-w-[14px]">2.</strong>
                    <span>Chrome ke upar daayein (Top-Right) kone me <strong>3 Dots (⋮)</strong> par click karein.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <strong className="text-emerald-900 min-w-[14px]">3.</strong>
                    <span>Menu me <strong>"Install app"</strong> (ya <strong>"Add to Home screen"</strong>) par click karein.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <strong className="text-emerald-900 min-w-[14px]">4.</strong>
                    <span><strong>"Install"</strong> par tap karein. Bas! Aapke mobile screen par <strong>Hotel PMS</strong> ka icon aa jayega aur bilkul Play Store app ki tarah full-screen chalega!</span>
                  </li>
                </ol>
              </div>

              {/* Step by Step iPhone Safari Guide */}
              <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sky-950 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-700 text-white flex items-center justify-center text-[10px] font-bold">i</span>
                    <span>iPhone / iPad (Apple Safari) Me Install Karne Ka Tarika:</span>
                  </h4>
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                    iOS Ready
                  </span>
                </div>

                <ol className="space-y-2 text-[11px] text-slate-700 pl-2">
                  <li className="flex items-start gap-2">
                    <strong className="text-sky-900 min-w-[14px]">1.</strong>
                    <span>iPhone me <strong>Safari Browser</strong> me link kholein.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <strong className="text-sky-900 min-w-[14px]">2.</strong>
                    <span>Neeche center me <strong>Share Button (📤)</strong> par tap karein.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <strong className="text-sky-900 min-w-[14px]">3.</strong>
                    <span>Thoda niche scroll karke <strong>"Add to Home Screen" (+)</strong> chunein aur <strong>"Add"</strong> dabayein.</span>
                  </li>
                </ol>
              </div>

            </div>
          )}

          {/* TAB 2: GOOGLE PLAY STORE APK GUIDE */}
          {activeTab === 'playstore' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <h4 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                  <Play size={14} className="text-amber-700 fill-amber-600" />
                  Google Play Store Par Kaise Publish Hoga?
                </h4>
                <p className="text-amber-900 text-[11px] leading-relaxed">
                  Ye app <strong>PWA (Progressive Web App)</strong> standard par bani hui hai. Isko <strong>Google Play Store APK / AAB</strong> me convert karna 100% supported hai.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-slate-900 text-xs">
                  APK / AAB Generate Karne Ke 3 Aasan Steps:
                </h5>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                  <div>
                    <h6 className="font-bold text-slate-900">PWABuilder Website Open Karein:</h6>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Google aur Microsoft ka official tool <a href="https://www.pwabuilder.com" target="_blank" rel="noopener noreferrer" className="text-teal-800 font-bold underline inline-flex items-center gap-0.5">pwabuilder.com <ExternalLink size={10} /></a> kholein.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                  <div>
                    <h6 className="font-bold text-slate-900">Apna App URL Enter Karein:</h6>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Apna live URL (jaise <code className="bg-slate-200 px-1 py-0.2 rounded font-mono text-[10px]">{currentUrl}</code>) daalein aur <strong>"Start"</strong> par click karein. Ye manifest aur icons ko verify karega.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                  <div>
                    <h6 className="font-bold text-slate-900">Download Android Package (APK / AAB):</h6>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      <strong>"Package for Android"</strong> par click karein. Aapko ready-to-upload signed <strong>.AAB (Android App Bundle)</strong> aur <strong>.APK</strong> mil jayega jisko aap Google Play Console account ($25 one-time fee) me upload karke Play Store par live kar sakte hain!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-teal-950">
                  Tip: Staff aur reception ke liye Play Store ki zaroorat nahi hoti, direct mobile me "Install App" dabane se turant install ho jata hai!
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck size={14} className="text-teal-700" />
            <span>Fully Secure &amp; Auto-Updating</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Samajh Gaya (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
