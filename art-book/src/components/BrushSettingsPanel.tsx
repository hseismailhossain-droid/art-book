import React from 'react';
import { X, Sliders, Sparkles, Trash2 } from 'lucide-react';
import { BrushConfig, EraserType } from '../types/canvas';

interface BrushSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  brushConfig: BrushConfig;
  onUpdateConfig: (partial: Partial<BrushConfig>) => void;
  onClearActiveLayer: () => void;
}

export const BrushSettingsPanel: React.FC<BrushSettingsPanelProps> = ({
  isOpen,
  onClose,
  brushConfig,
  onUpdateConfig,
  onClearActiveLayer,
}) => {
  if (!isOpen) return null;

  const isEraser = brushConfig.type === 'eraser';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700/80 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">
              {isEraser ? 'ইরেজার সেটিংস (Eraser)' : 'ব্রাশ ও সাইজ সেটিংস (Brush)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Live Tip Preview */}
          <div className="h-24 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-center relative overflow-hidden">
            <div
              className="rounded-full transition-all duration-75 shadow-sm"
              style={{
                width: Math.min(80, isEraser ? brushConfig.eraserSize : brushConfig.size),
                height: Math.min(80, isEraser ? brushConfig.eraserSize : brushConfig.size),
                backgroundColor: isEraser ? '#f43f5e' : brushConfig.color,
                opacity: brushConfig.opacity,
                boxShadow:
                  brushConfig.type === 'glow_neon' || brushConfig.colorMode === 'glow'
                    ? `0 0 15px ${brushConfig.glowColor || brushConfig.color}`
                    : undefined,
              }}
            />
            <span className="absolute bottom-1 right-2 text-[10px] font-mono text-neutral-500">
              {isEraser ? brushConfig.eraserSize : brushConfig.size} px
            </span>
          </div>

          {/* Size Slider */}
          <div>
            <div className="flex justify-between text-xs text-neutral-300 mb-1.5">
              <span>সাইজ (Brush Size):</span>
              <span className="font-mono text-purple-400 font-semibold">
                {isEraser ? brushConfig.eraserSize : brushConfig.size} px
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="200"
              value={isEraser ? brushConfig.eraserSize : brushConfig.size}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (isEraser) {
                  onUpdateConfig({ eraserSize: val });
                } else {
                  onUpdateConfig({ size: val });
                }
              }}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 mt-1 font-mono">
              <span>1px</span>
              <span>50px</span>
              <span>100px</span>
              <span>200px</span>
            </div>
          </div>

          {/* Opacity Slider */}
          <div>
            <div className="flex justify-between text-xs text-neutral-300 mb-1.5">
              <span>অপাসিটি (Opacity):</span>
              <span className="font-mono text-indigo-400 font-semibold">
                {Math.round(brushConfig.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={brushConfig.opacity}
              onChange={(e) => onUpdateConfig({ opacity: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Stabilizer (স্মুথ ড্রয়িং) */}
          {!isEraser && (
            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1.5">
                <span>স্ট্যাবিলাইজার / স্মুথনেস (Stabilizer):</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {Math.round(brushConfig.stabilizer * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={brushConfig.stabilizer}
                onChange={(e) => onUpdateConfig({ stabilizer: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                মোবাইলে কাঁপাকাঁপি দূর করে প্রফেশনাল পরিষ্কার মসৃণ লাইন আঁকতে সাহায্য করে।
              </p>
            </div>
          )}

          {/* Eraser Specific Options */}
          {isEraser && (
            <div className="space-y-3 pt-2 border-t border-neutral-800">
              <span className="text-xs text-neutral-400 block font-medium">ইরেজার ধরন:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateConfig({ eraserType: 'hard' })}
                  className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                    brushConfig.eraserType === 'hard'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                >
                  হার্ড ইরেজার (Hard)
                </button>
                <button
                  onClick={() => onUpdateConfig({ eraserType: 'soft' })}
                  className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                    brushConfig.eraserType === 'soft'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                >
                  সফট এয়ারব্রাশ ইরেজার
                </button>
              </div>

              <button
                onClick={() => {
                  if (confirm('বর্তমান লেয়ারের সব ড্রয়িং মুছে ফেলতে চান?')) {
                    onClearActiveLayer();
                    onClose();
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/80 text-red-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>বর্তমান লেয়ার পুরো পরিষ্কার করুন (Clear Layer)</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-medium active:scale-95 transition-all"
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
