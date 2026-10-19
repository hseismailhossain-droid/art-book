import React from 'react';
import { X, Check, Monitor, Smartphone, Sparkles, AlertTriangle } from 'lucide-react';
import { ResolutionPreset } from '../types/canvas';
import { RESOLUTION_PRESETS } from '../utils/exportEngine';

interface ResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentResolution: ResolutionPreset;
  onSelectResolution: (res: ResolutionPreset) => void;
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({
  isOpen,
  onClose,
  currentResolution,
  onSelectResolution,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700/80 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">
              ক্যানভাস রেজোলিউশন (২২০পি থেকে ৮কে)
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
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Note on 8K Ultra Resolution */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-purple-950/60 to-rose-950/60 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-2.5 shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block text-white flex items-center gap-1.5">
                <span>৮কে সুপার আল্ট্রা এইচডি ড্রয়িং (7680 × 4320):</span>
                <span className="text-[9px] bg-rose-500/30 text-rose-300 px-1.5 py-0.2 rounded font-mono">
                  8K NATIVE
                </span>
              </span>
              <p className="text-[11px] text-rose-200/90 leading-relaxed">
                ৮কে রেজোলিউশনে ড্রয়িং স্ট্রোকে পাবেন ক্রিস্টাল ক্লিয়ার শার্পনেস। ইমেজ ইম্পোর্ট করে ছোট বা বড় করলেও ছবির প্রতিটা পিক্সেল ও কোয়ালিটি ১০০% অক্ষত থাকবে!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {RESOLUTION_PRESETS.map((res) => {
              const isSelected = currentResolution.label === res.label;

              return (
                <button
                  key={res.label}
                  onClick={() => {
                    onSelectResolution(res);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500 shadow-sm'
                      : 'bg-neutral-800/60 border-neutral-700/60 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                        res.category === 'ultra'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : res.category === 'high'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-neutral-700 text-neutral-300'
                      }`}
                    >
                      {res.tag}
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>{res.bengaliLabel}</span>
                        {res.category === 'ultra' && (
                          <span className="text-[9px] bg-red-500/20 text-red-300 px-1 py-0.5 rounded font-mono">
                            8K ULTRA
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        {res.width} × {res.height} px
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check className="w-5 h-5 text-purple-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-medium"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
