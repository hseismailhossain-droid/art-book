import React, { useState } from 'react';
import {
  X,
  Play,
  Globe,
  Search,
  CheckCircle,
  Copy,
  ExternalLink,
  Smartphone,
  Cpu,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface DeploymentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentGuideModal: React.FC<DeploymentGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'playstore' | 'vercel' | 'searchconsole' | 'mobile'>('playstore');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-neutral-900 border border-neutral-700/80 shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                প্লেস্টোর, ভার্সেল ও সার্চ কনসোল প্রস্তুতি
              </h2>
              <p className="text-xs text-neutral-400">
                Play Store, Vercel & Google Search Console Deployment Center
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-neutral-800/80 bg-neutral-950/40 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('playstore')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'playstore'
                ? 'border-emerald-500 text-emerald-400 bg-neutral-800/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>গুগল প্লেস্টোর (TWA/AAB)</span>
          </button>

          <button
            onClick={() => setActiveTab('vercel')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'vercel'
                ? 'border-sky-500 text-sky-400 bg-neutral-800/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>ভার্সেল (Vercel Deploy)</span>
          </button>

          <button
            onClick={() => setActiveTab('searchconsole')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'searchconsole'
                ? 'border-amber-500 text-amber-400 bg-neutral-800/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>গুগল সার্চ কনসোল</span>
          </button>

          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
              activeTab === 'mobile'
                ? 'border-purple-500 text-purple-400 bg-neutral-800/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>মোবাইল অপ্টিমাইজেশন</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-neutral-300">
          {/* TAB 1: PLAY STORE */}
          {activeTab === 'playstore' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-emerald-300 text-sm">
                    প্লেস্টোর রেডি (TWA & PWA Standards Passed)
                  </h3>
                  <p className="mt-1 text-neutral-300 leading-relaxed">
                    অ্যাপটিতে সম্পূর্ণ Web App Manifest, 512x512 মাস্কেবল আইকন, অফলাইন সার্ভিস ওয়ার্কার, এবং <code>.well-known/assetlinks.json</code> প্রস্তুত রয়েছে।
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  পদ্ধতি ১: PWABuilder (সবচেয়ে সহজ - ১ ক্লিকে APK / AAB)
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-neutral-300 leading-relaxed">
                  <li>ভার্সেলে অ্যাপটি ডিপ্লয় করার পর আপনার লাইভ URL টি কপি করুন।</li>
                  <li>
                    <a
                      href="https://www.pwabuilder.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      pwabuilder.com <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    এ গিয়ে আপনার URL পেস্ট করুন এবং "Start" চাপুন।
                  </li>
                  <li>"Package for Store" থেকে <strong>Google Play</strong> নির্বাচন করুন।</li>
                  <li>সরাসরি ডাউনলোড করুন প্রস্তুতকৃত <code>.aab</code> ফাইল এবং প্লে কনসোলে আপলোড করুন!</li>
                </ol>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-neutral-800">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  পদ্ধতি ২: Google Bubblewrap CLI (প্রফেশনাল কমান্ড লাইন)
                </h4>
                <p>প্রজেক্টের রুটে প্রস্তুতকৃত <code>twa-manifest.json</code> দিয়ে ১ কমান্ডে বিল্ড করুন:</p>
                <div className="relative group bg-neutral-950 p-3 rounded-xl border border-neutral-800 font-mono text-[11px] text-emerald-400">
                  <span>npx @bubblewrap/cli build</span>
                  <button
                    onClick={() => handleCopy('npx @bubblewrap/cli build', 'bubblewrap')}
                    className="absolute right-2 top-2 p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                    title="কপি করুন"
                  >
                    {copiedText === 'bubblewrap' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VERCEL */}
          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/30 flex items-start gap-3">
                <Globe className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sky-300 text-sm">
                    ভার্সেল ডিপ্লয়মেন্ট প্রস্তুত (vercel.json কনফিগার করা হয়েছে)
                  </h3>
                  <p className="mt-1 text-neutral-300 leading-relaxed">
                    <code>vercel.json</code> ফাইলে SPA রাউটিং, ক্যাশ হেডার এবং সিকিউরিটি হেডার সম্পূর্ণ সেটআপ করা আছে।
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  ভার্সেলে আপলোড করার ধাপসমূহ:
                </h4>
                <ol className="list-decimal pl-5 space-y-2 text-neutral-300 leading-relaxed">
                  <li>
                    GitHub এ প্রজেক্টটি পুশ করুন:
                    <div className="mt-1 relative bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 font-mono text-[11px] text-sky-400">
                      git add . && git commit -m "Chitrakar Studio Ready" && git push
                    </div>
                  </li>
                  <li>
                    <a
                      href="https://vercel.com/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      vercel.com/new <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    এ যান এবং আপনার GitHub রিপোজিটরিটি Import করুন।
                  </li>
                  <li>
                    Framework Preset: <strong>Vite</strong><br />
                    Build Command: <code>vite build</code><br />
                    Output Directory: <code>dist</code>
                  </li>
                  <li><strong>Deploy</strong> বাটনে চাপলেই কয়েক সেকেন্ডে আপনার স্টুডিও লাইভ হয়ে যাবে!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE SEARCH CONSOLE */}
          {activeTab === 'searchconsole' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
                <Search className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-300 text-sm">
                    গুগল সার্চ কনসোল ও এসইও (SEO Ready)
                  </h3>
                  <p className="mt-1 text-neutral-300 leading-relaxed">
                    গুগলে সার্চ দিলে যেন অ্যাপটি দ্রুত খুঁজে পাওয়া যায় সেজন্য সাইটম্যাপ, robots.txt এবং Schema.org JSON-LD যুক্ত করা হয়েছে।
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-white text-xs">১. সাইট ভেরিফিকেশন মেটা ট্যাগ:</h4>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    <code>index.html</code> এ আপনার সার্চ কনসোল ভেরিফিকেশন কোড যুক্ত করুন:
                  </p>
                  <div className="mt-1 relative bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 font-mono text-[11px] text-amber-400">
                    &lt;meta name="google-site-verification" content="YOUR_CODE" /&gt;
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs">২. সাইটম্যাপ সাবমিট (Sitemap Submission):</h4>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    Google Search Console &gt; Sitemaps এ গিয়ে নিচের লিংকটি সাবমিট করুন:
                  </p>
                  <div className="mt-1 relative bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 font-mono text-[11px] text-amber-400">
                    sitemap.xml
                  </div>
                </div>

                <div className="bg-neutral-800/40 p-3 rounded-xl border border-neutral-700/60 text-[11px] leading-relaxed">
                  ✓ <strong>robots.txt</strong> তৈরি আছে যা গুগলবটকে সম্পূর্ণ সাইট ইনডেক্স করতে দেয়।<br />
                  ✓ <strong>Schema.org WebApplication</strong> যুক্ত আছে যা গুগলে রিচ স্নিপেট কার্ড প্রদর্শন করে।
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MOBILE SMOOTHNESS */}
          {activeTab === 'mobile' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-3">
                <Cpu className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-purple-300 text-sm">
                    মোবাইলে পানির মতো স্মুথ পারফরম্যান্স (60+ FPS Engine)
                  </h3>
                  <p className="mt-1 text-neutral-300 leading-relaxed">
                    স্মার্টফোন ও ট্যাবলেটে কোনোরকম ল্যাগ ছাড়া আঁকার জন্য বিশেষ আর্কিটেকচার প্রয়োগ করা হয়েছে।
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 space-y-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    টুলবার হাইড / জেন মোড (Hide Toolbar / Fullscreen)
                  </span>
                  <p className="text-neutral-400 leading-relaxed text-[11px]">
                    উপরের বারে থাকা <strong>টুলবার লুকান (Zen Mode)</strong> বাটনে ট্যাপ করলেই সমস্ত বার গায়েব হয়ে ১০০% ফুল স্ক্রিন ক্যানভাস উন্মুক্ত হবে! ভাসমান বাটনে ট্যাপ করলেই মুহূর্তের মধ্যে টুলবার ফিরে আসবে।
                  </p>
                </div>

                <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 space-y-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    হ্যান্ড পাম রিজেকশন ও নো রাবার-ব্যান্ড
                  </span>
                  <p className="text-neutral-400 leading-relaxed text-[11px]">
                    <code>touch-action: none</code> এবং <code>overscroll-behavior: none</code> থাকায় আঁকার সময় পাতা রিফ্রেশ হবে না বা স্ক্রিন কাঁপবে না।
                  </p>
                </div>

                <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 space-y-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    GPU হার্ডওয়্যার অ্যাকসেলেরেশন ও RAF অপ্টিমাইজেশন
                  </span>
                  <p className="text-neutral-400 leading-relaxed text-[11px]">
                    প্রতিটি স্ট্রোক ব্রাউজারের GPU কম্পোজিটর এবং <code>requestAnimationFrame</code> এর মাধ্যমে রেন্ডার হয়, ফলে লো-এন্ড ফোনেও মাখনের মতো মসৃণ চলে।
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-800 bg-neutral-900/90">
          <span className="text-[11px] text-neutral-400">
            Chitrakar Studio • Ready for Production & Distribution
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
};
