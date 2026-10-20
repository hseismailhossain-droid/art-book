import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  if (isInstalled) {
    if (variant === 'full') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>অ্যাপটি ইতিমধ্যে ইনস্টল করা আছে</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 3000);
    }
  };

  return (
    <>
      {isInstallable && (
        <button
          onClick={handleInstallClick}
          title="প্লেস্টোর / ফোনের হোম স্ক্রিনে ইনস্টল করুন"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 active:scale-95 transition-all flex-shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{justInstalled ? 'ইনস্টল হয়েছে!' : 'অ্যাপ ইনস্টল'}</span>
        </button>
      )}

      {isIOS && !isInstallable && (
        <>
          <button
            onClick={() => setShowIOSGuide(true)}
            title="iPhone / iPad এ হোম স্ক্রিনে ইনস্টল করুন"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 text-xs font-medium active:scale-95 transition-all flex-shrink-0"
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span>iOS ইনস্টল</span>
          </button>

          {showIOSGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-700 p-5 shadow-2xl text-white">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-sky-400" />
                    <h3 className="text-sm font-semibold">iPhone / iPad এ ইনস্টল করুন</h3>
                  </div>
                  <button
                    onClick={() => setShowIOSGuide(false)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-4 space-y-3 text-xs text-neutral-300">
                  <div className="flex items-start gap-2.5 bg-neutral-800/60 p-2.5 rounded-xl">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center flex-shrink-0">
                      ১
                    </span>
                    <p>Safari ব্রাউজারে নিচে থাকা <strong>Share (শেয়ার)</strong> বাটনে ট্যাপ করুন।</p>
                  </div>
                  <div className="flex items-start gap-2.5 bg-neutral-800/60 p-2.5 rounded-xl">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center flex-shrink-0">
                      ২
                    </span>
                    <p>মেনু স্ক্রল করে <strong>'Add to Home Screen' (হোম স্ক্রিনে যোগ করুন)</strong> নির্বাচন করুন।</p>
                  </div>
                  <div className="flex items-start gap-2.5 bg-neutral-800/60 p-2.5 rounded-xl">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0">
                      ৩
                    </span>
                    <p>উপরে <strong>Add</strong> চাপুন। অ্যাপটি সরাসরি নেটিভ অ্যাপের মতো ফুলস্ক্রিনে চলবে!</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="mt-5 w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200"
                >
                  বুঝেছি
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};
