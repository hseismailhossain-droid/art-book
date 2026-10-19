import React, { useState } from 'react';
import { X, Sparkles, Palette, Blend, Layers, Check } from 'lucide-react';
import { BlendMode, BrushConfig, GradientColor } from '../types/canvas';

interface ColorPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  brushConfig: BrushConfig;
  onUpdateConfig: (partial: Partial<BrushConfig>) => void;
}

const SOLID_PRESETS = [
  // Basics & Inking
  '#000000', '#222222', '#555555', '#888888', '#cccccc', '#ffffff',
  // Vibrant Anime & Character Colors
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#10b981',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
  '#ec4899', '#f43f5e',
  // Skin Tones (ক্যারেক্টার স্কিন টোন)
  '#ffdfd3', '#fcd5ce', '#f8edeb', '#e8d8c8', '#d4a373', '#bb855a',
  '#a36842', '#78462a', '#4a2810',
];

const GRADIENT_PRESETS: { name: string; bengali: string; g: GradientColor }[] = [
  { name: 'Cyber Neon', bengali: 'সাইবার নিয়ন', g: { type: 'linear', color1: '#ec4899', color2: '#06b6d4' } },
  { name: 'Sunset Glow', bengali: 'সূর্যাস্ত আভা', g: { type: 'linear', color1: '#ff0844', color2: '#ffb199' } },
  { name: 'Royal Gold', bengali: 'গোল্ডেন লাক্সারি', g: { type: 'linear', color1: '#f59e0b', color2: '#ef4444' } },
  { name: 'Cosmic Purple', bengali: 'কসমিক গ্যালাক্সি', g: { type: 'linear', color1: '#8b5cf6', color2: '#3b82f6' } },
  { name: 'Emerald Forest', bengali: 'পান্না সবুজ', g: { type: 'linear', color1: '#10b981', color2: '#047857' } },
  { name: 'Radial Aura', bengali: 'রেডিয়াল অরা', g: { type: 'radial', color1: '#f43f5e', color2: '#4f46e5' } },
];

const BLEND_MODES: { mode: BlendMode; bengali: string; desc: string }[] = [
  { mode: 'source-over', bengali: 'নরমাল (Normal)', desc: 'সাধারণ স্বাভাবিক কালার ব্রাশ' },
  { mode: 'multiply', bengali: 'মাল্টিপ্লাই (Multiply)', desc: 'ছায়া ও ডার্ক শেডিং তৈরির জন্য সেরা' },
  { mode: 'screen', bengali: 'স্ক্রিন (Screen)', desc: 'উজ্জ্বল আলো ও হাইলাইটস' },
  { mode: 'overlay', bengali: 'ওভারলে (Overlay)', desc: 'রং গাঢ় ও প্রাণবন্ত করে' },
  { mode: 'color-dodge', bengali: 'কালার ডজ (Color Dodge)', desc: 'তীব্র নিয়ন ও জাদুকরী ম্যাজিক লাইটিং' },
  { mode: 'hard-light', bengali: 'হার্ড লাইট (Hard Light)', desc: 'কঠিন তীব্র কন্ট্রাস্ট' },
  { mode: 'soft-light', bengali: 'সফট লাইট (Soft Light)', desc: 'নরম মসৃণ টোন ও আভা' },
  { mode: 'difference', bengali: 'ডিফারেন্স (Difference)', desc: 'কালার ইনভার্ট ও শৈল্পিক এফেক্ট' },
];

export const ColorPaletteModal: React.FC<ColorPaletteModalProps> = ({
  isOpen,
  onClose,
  brushConfig,
  onUpdateConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'solid' | 'gradient' | 'glow' | 'blend'>('solid');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700/80 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">কালার, গ্রেডিয়েন্ট ও ব্লেন্ডিং স্টুডিও</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 p-1 gap-1">
          <button
            onClick={() => {
              setActiveTab('solid');
              onUpdateConfig({ colorMode: 'solid' });
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'solid'
                ? 'bg-neutral-800 text-purple-300 shadow border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            সলিড কালার
          </button>
          <button
            onClick={() => {
              setActiveTab('gradient');
              onUpdateConfig({ colorMode: 'gradient' });
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'gradient'
                ? 'bg-neutral-800 text-pink-300 shadow border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            গ্রেডিয়েন্ট
          </button>
          <button
            onClick={() => {
              setActiveTab('glow');
              onUpdateConfig({ colorMode: 'glow' });
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
              activeTab === 'glow'
                ? 'bg-neutral-800 text-cyan-300 shadow border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>নিয়ন গ্লো</span>
          </button>
          <button
            onClick={() => setActiveTab('blend')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
              activeTab === 'blend'
                ? 'bg-neutral-800 text-amber-300 shadow border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Blend className="w-3 h-3 text-amber-400" />
            <span>ব্লেন্ডিং</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* TAB 1: Solid Color */}
          {activeTab === 'solid' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brushConfig.color}
                  onChange={(e) => onUpdateConfig({ color: e.target.value, colorMode: 'solid' })}
                  className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0"
                />
                <div className="flex-1">
                  <label className="text-xs text-neutral-400 block mb-1">HEX কোড:</label>
                  <input
                    type="text"
                    value={brushConfig.color}
                    onChange={(e) => onUpdateConfig({ color: e.target.value, colorMode: 'solid' })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <span className="text-xs text-neutral-400 block mb-2 font-medium">আর্টিস্ট প্রিসেট কালার প্যালেট:</span>
                <div className="grid grid-cols-7 gap-2">
                  {SOLID_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => onUpdateConfig({ color, colorMode: 'solid' })}
                      className="w-full aspect-square rounded-lg border border-neutral-700 hover:scale-110 active:scale-95 transition-all relative flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {brushConfig.color.toLowerCase() === color.toLowerCase() && (
                        <Check
                          className={`w-3.5 h-3.5 ${
                            color === '#ffffff' || color === '#ffdfd3' ? 'text-black' : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Gradient Maker */}
          {activeTab === 'gradient' && (
            <div className="space-y-4">
              <div
                className="w-full h-14 rounded-xl border border-neutral-700 shadow-inner flex items-center justify-center text-xs font-semibold text-white drop-shadow"
                style={{
                  background:
                    brushConfig.gradient.type === 'linear'
                      ? `linear-gradient(90deg, ${brushConfig.gradient.color1}, ${brushConfig.gradient.color2})`
                      : `radial-gradient(circle, ${brushConfig.gradient.color1}, ${brushConfig.gradient.color2})`,
                }}
              >
                গ্রেডিয়েন্ট প্রিভিউ
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    onUpdateConfig({
                      colorMode: 'gradient',
                      gradient: { ...brushConfig.gradient, type: 'linear' },
                    })
                  }
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                    brushConfig.gradient.type === 'linear'
                      ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                >
                  লিনিয়ার গ্রেডিয়েন্ট
                </button>
                <button
                  onClick={() =>
                    onUpdateConfig({
                      colorMode: 'gradient',
                      gradient: { ...brushConfig.gradient, type: 'radial' },
                    })
                  }
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${
                    brushConfig.gradient.type === 'radial'
                      ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                >
                  রেডিয়াল গ্রেডিয়েন্ট
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-800/80 p-2.5 rounded-xl border border-neutral-700">
                  <span className="text-[11px] text-neutral-400 block mb-1.5">প্রথম কালার স্টপ:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brushConfig.gradient.color1}
                      onChange={(e) =>
                        onUpdateConfig({
                          colorMode: 'gradient',
                          gradient: { ...brushConfig.gradient, color1: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-neutral-300 uppercase">
                      {brushConfig.gradient.color1}
                    </span>
                  </div>
                </div>

                <div className="bg-neutral-800/80 p-2.5 rounded-xl border border-neutral-700">
                  <span className="text-[11px] text-neutral-400 block mb-1.5">দ্বিতীয় কালার স্টপ:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brushConfig.gradient.color2}
                      onChange={(e) =>
                        onUpdateConfig({
                          colorMode: 'gradient',
                          gradient: { ...brushConfig.gradient, color2: e.target.value },
                        })
                      }
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-neutral-300 uppercase">
                      {brushConfig.gradient.color2}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs text-neutral-400 block mb-2 font-medium">প্রিসেট গ্রেডিয়েন্টসমূহ:</span>
                <div className="grid grid-cols-2 gap-2">
                  {GRADIENT_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => onUpdateConfig({ colorMode: 'gradient', gradient: p.g })}
                      className="flex items-center gap-2 p-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-left active:scale-95 transition-all"
                    >
                      <div
                        className="w-7 h-7 rounded-lg shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${p.g.color1}, ${p.g.color2})`,
                        }}
                      />
                      <div>
                        <div className="text-xs text-neutral-200 font-medium">{p.bengali}</div>
                        <div className="text-[10px] text-neutral-400">{p.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Neon Glow */}
          {activeTab === 'glow' && (
            <div className="space-y-4">
              <div
                className="w-full h-16 rounded-xl border border-neutral-700 flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: '#09090b' }}
              >
                <span
                  className="text-lg font-bold tracking-wider"
                  style={{
                    color: brushConfig.color,
                    textShadow: `0 0 ${brushConfig.glowIntensity * 12}px ${brushConfig.glowColor || brushConfig.color}, 0 0 ${brushConfig.glowIntensity * 24}px ${brushConfig.glowColor || brushConfig.color}`,
                  }}
                >
                  ✨ NEON GLOW LIVE
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs text-neutral-300 mb-1">
                  <span>গ্লো ব্লুম তীব্রতা (Bloom Intensity):</span>
                  <span className="font-mono text-cyan-400">{Math.round(brushConfig.glowIntensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={brushConfig.glowIntensity}
                  onChange={(e) =>
                    onUpdateConfig({
                      colorMode: 'glow',
                      glowIntensity: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-800/80 p-2.5 rounded-xl border border-neutral-700">
                  <span className="text-[11px] text-neutral-400 block mb-1">কোর কালার (Core Color):</span>
                  <input
                    type="color"
                    value={brushConfig.color}
                    onChange={(e) => onUpdateConfig({ color: e.target.value, colorMode: 'glow' })}
                    className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                </div>

                <div className="bg-neutral-800/80 p-2.5 rounded-xl border border-neutral-700">
                  <span className="text-[11px] text-neutral-400 block mb-1">অরা কালার (Aura Color):</span>
                  <input
                    type="color"
                    value={brushConfig.glowColor || brushConfig.color}
                    onChange={(e) =>
                      onUpdateConfig({
                        glowColor: e.target.value,
                        colorMode: 'glow',
                      })
                    }
                    className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Blend Modes */}
          {activeTab === 'blend' && (
            <div className="space-y-2">
              <span className="text-xs text-neutral-400 block mb-1">
                প্রফেশনাল ডিজিটাল পেইন্টিং ব্লেন্ডিং মোড:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {BLEND_MODES.map((b) => (
                  <button
                    key={b.mode}
                    onClick={() => onUpdateConfig({ blendMode: b.mode })}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      brushConfig.blendMode === b.mode
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                        : 'bg-neutral-800/80 border-neutral-700/80 hover:bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{b.bengali}</div>
                      <div className="text-[11px] text-neutral-400">{b.desc}</div>
                    </div>
                    {brushConfig.blendMode === b.mode && (
                      <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-medium active:scale-95 transition-all"
          >
            সম্পন্ন (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
