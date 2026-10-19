import React, { useState } from 'react';
import { X, Crop, Check, RotateCcw } from 'lucide-react';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasWidth: number;
  canvasHeight: number;
  onApplyCrop: (cropBox: { x: number; y: number; width: number; height: number }) => void;
}

export const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  onClose,
  canvasWidth,
  canvasHeight,
  onApplyCrop,
}) => {
  const [aspectPreset, setAspectPreset] = useState<'free' | '1:1' | '16:9' | '9:16' | '4:3'>('free');
  const [cropBox, setCropBox] = useState({
    x: 0,
    y: 0,
    width: canvasWidth,
    height: canvasHeight,
  });

  if (!isOpen) return null;

  const handlePreset = (preset: 'free' | '1:1' | '16:9' | '9:16' | '4:3') => {
    setAspectPreset(preset);
    let newW = canvasWidth;
    let newH = canvasHeight;

    if (preset === '1:1') {
      const minSide = Math.min(canvasWidth, canvasHeight);
      newW = minSide;
      newH = minSide;
    } else if (preset === '16:9') {
      newW = canvasWidth;
      newH = Math.round((canvasWidth * 9) / 16);
      if (newH > canvasHeight) {
        newH = canvasHeight;
        newW = Math.round((canvasHeight * 16) / 9);
      }
    } else if (preset === '9:16') {
      newH = canvasHeight;
      newW = Math.round((canvasHeight * 9) / 16);
      if (newW > canvasWidth) {
        newW = canvasWidth;
        newH = Math.round((canvasWidth * 16) / 9);
      }
    } else if (preset === '4:3') {
      newW = canvasWidth;
      newH = Math.round((canvasWidth * 3) / 4);
      if (newH > canvasHeight) {
        newH = canvasHeight;
        newW = Math.round((canvasHeight * 4) / 3);
      }
    }

    const newX = Math.max(0, Math.round((canvasWidth - newW) / 2));
    const newY = Math.max(0, Math.round((canvasHeight - newH) / 2));
    setCropBox({ x: newX, y: newY, width: newW, height: newH });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700/80 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-orange-400" />
            <h2 className="text-sm font-semibold text-white">ক্যানভাস ক্রপিং ও রিসাইজ</h2>
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
          {/* Aspect Presets */}
          <div>
            <span className="text-xs text-neutral-400 block mb-2 font-medium">
              অ্যাসপেক্ট রেশিও প্রিসেট:
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: 'free', label: 'মুক্ত (Free)' },
                { id: '1:1', label: '১:১ স্কয়ার' },
                { id: '16:9', label: '১৬:৯ সিনেমা' },
                { id: '9:16', label: '৯:১৬ স্টোরি' },
                { id: '4:3', label: '৪:৩ ফটোজ' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePreset(p.id as any)}
                  className={`py-1.5 px-1 rounded-lg text-[11px] font-medium border text-center transition-all ${
                    aspectPreset === p.id
                      ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-750'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinate Inputs */}
          <div className="bg-neutral-800/60 p-3 rounded-xl border border-neutral-700/80 space-y-3">
            <div className="text-xs font-semibold text-neutral-200">ক্রপ ডাইমেনশন:</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">প্রস্থ (Width):</label>
                <input
                  type="number"
                  min="50"
                  max={canvasWidth}
                  value={cropBox.width}
                  onChange={(e) =>
                    setCropBox({
                      ...cropBox,
                      width: Math.min(canvasWidth, Math.max(50, parseInt(e.target.value) || 50)),
                    })
                  }
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">উচ্চতা (Height):</label>
                <input
                  type="number"
                  min="50"
                  max={canvasHeight}
                  value={cropBox.height}
                  onChange={(e) =>
                    setCropBox({
                      ...cropBox,
                      height: Math.min(canvasHeight, Math.max(50, parseInt(e.target.value) || 50)),
                    })
                  }
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-neutral-400 pt-1">
              <span>মূল সাইজ: {canvasWidth} × {canvasHeight} px</span>
              <button
                onClick={() => setCropBox({ x: 0, y: 0, width: canvasWidth, height: canvasHeight })}
                className="text-orange-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>রিসেট</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/90 flex justify-between items-center">
          <button onClick={onClose} className="px-3 py-2 text-neutral-400 hover:text-white text-xs">
            বাতিল
          </button>
          <button
            onClick={() => {
              onApplyCrop(cropBox);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-orange-600/20"
          >
            <Check className="w-4 h-4" />
            <span>ক্রপ সম্পন্ন করুন (Apply Crop)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
