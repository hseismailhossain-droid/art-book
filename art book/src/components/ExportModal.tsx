import React, { useState } from 'react';
import {
  X,
  Download,
  Image as ImageIcon,
  Video,
  Grid,
  Sparkles,
  Check,
  Loader2,
  FileDown,
} from 'lucide-react';
import { AnimationFrame, CanvasLayer, ResolutionPreset } from '../types/canvas';
import {
  exportPNG,
  exportJPG,
  exportAnimationVideo,
  exportSpriteSheet,
  RESOLUTION_PRESETS,
} from '../utils/exportEngine';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  layers: CanvasLayer[];
  frames: AnimationFrame[];
  canvasWidth: number;
  canvasHeight: number;
  fps: number;
}

type ExportType = 'png_transparent' | 'png_white' | 'jpg' | 'video' | 'spritesheet';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  layers,
  frames,
  canvasWidth,
  canvasHeight,
  fps,
}) => {
  const [exportType, setExportType] = useState<ExportType>('png_transparent');
  const [selectedResolution, setSelectedResolution] = useState<ResolutionPreset>(() => {
    return RESOLUTION_PRESETS.find((r) => r.width === canvasWidth) || RESOLUTION_PRESETS[4]; // 1080p default
  });
  const [jpgQuality, setJpgQuality] = useState(0.95);
  const [videoLoops, setVideoLoops] = useState(3);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress(10);

    try {
      const targetW = selectedResolution.width;
      const targetH = selectedResolution.height;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      if (exportType === 'png_transparent') {
        await exportPNG(
          layers,
          targetW,
          targetH,
          true,
          '#ffffff',
          `chitrakar-transparent-${selectedResolution.tag}-${timestamp}.png`
        );
      } else if (exportType === 'png_white') {
        await exportPNG(
          layers,
          targetW,
          targetH,
          false,
          '#ffffff',
          `chitrakar-${selectedResolution.tag}-${timestamp}.png`
        );
      } else if (exportType === 'jpg') {
        await exportJPG(
          layers,
          targetW,
          targetH,
          jpgQuality,
          '#ffffff',
          `chitrakar-${selectedResolution.tag}-${timestamp}.jpg`
        );
      } else if (exportType === 'video') {
        await exportAnimationVideo(
          frames,
          targetW,
          targetH,
          fps,
          videoLoops,
          '#ffffff',
          (pct) => setProgress(pct)
        );
      } else if (exportType === 'spritesheet') {
        await exportSpriteSheet(
          frames,
          targetW,
          targetH,
          4,
          true,
          '#ffffff',
          `chitrakar-spritesheet-${timestamp}.png`
        );
      }

      setProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Export failed:', err);
      alert('এক্সপোর্ট সম্পন্ন করার সময় ত্রুটি হয়েছে। রেজোলিউশন কমিয়ে চেষ্টা করুন।');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700/80 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">
              হাই রেজোলিউশন এক্সপোর্ট স্টুডিও
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
          {/* 1. Format Selection */}
          <div>
            <span className="text-xs text-neutral-400 block mb-2 font-medium">
              ১. ফাইল ফরম্যাট নির্বাচন করুন:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setExportType('png_transparent')}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  exportType === 'png_transparent'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                    : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold">ট্রান্সপারেন্ট PNG</div>
                  <div className="text-[10px] text-neutral-400">স্বচ্ছ ব্যাকগ্রাউন্ড</div>
                </div>
              </button>

              <button
                onClick={() => setExportType('png_white')}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  exportType === 'png_white'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                    : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 mt-0.5">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold">স্ট্যান্ডার্ড PNG</div>
                  <div className="text-[10px] text-neutral-400">সাদা ব্যাকগ্রাউন্ড সহ</div>
                </div>
              </button>

              <button
                onClick={() => setExportType('jpg')}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  exportType === 'jpg'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                    : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <FileDown className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold">হাই কোয়ালিটি JPG</div>
                  <div className="text-[10px] text-neutral-400">কম্প্রেসড ছবি</div>
                </div>
              </button>

              <button
                onClick={() => setExportType('video')}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  exportType === 'video'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                    : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold">অ্যানিমেশন ভিডিও</div>
                  <div className="text-[10px] text-neutral-400">WebM / MP4 ভিডিও</div>
                </div>
              </button>
            </div>

            {/* Extra: Sprite Sheet */}
            <div className="mt-2">
              <button
                onClick={() => setExportType('spritesheet')}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  exportType === 'spritesheet'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                    : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Grid className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-xs font-semibold">স্প্রাইট শীট (Sprite Sheet PNG)</div>
                    <div className="text-[10px] text-neutral-400">
                      গেম তৈরি ও অ্যানিমেশনের জন্য সব ফ্রেম গ্রিড আকারে
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Target Resolution Selector (220p to 8K) */}
          <div>
            <span className="text-xs text-neutral-400 block mb-2 font-medium">
              ২. এক্সপোর্ট রেজোলিউশন (২২০পি থেকে ৮কে আল্ট্রা এইচডি):
            </span>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {RESOLUTION_PRESETS.map((res) => {
                const isSelected = selectedResolution.label === res.label;
                return (
                  <button
                    key={res.label}
                    onClick={() => setSelectedResolution(res)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                        : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-white">{res.tag}</span>
                      {res.category === 'ultra' && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-mono">
                          ULTRA
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                      {res.bengaliLabel}
                    </div>
                    <div className="text-[9px] text-neutral-500 font-mono mt-0.5">
                      {res.width} × {res.height}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Conditional Parameters */}
          {exportType === 'jpg' && (
            <div>
              <div className="flex justify-between text-xs text-neutral-300 mb-1">
                <span>জেপিজি কোয়ালিটি:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {Math.round(jpgQuality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.0"
                step="0.05"
                value={jpgQuality}
                onChange={(e) => setJpgQuality(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          )}

          {exportType === 'video' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-neutral-800/80 p-2.5 rounded-xl border border-neutral-700">
                <span className="text-[11px] text-neutral-400 block mb-1">লুপ রিপিট সংখ্যা:</span>
                <select
                  value={videoLoops}
                  onChange={(e) => setVideoLoops(parseInt(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-xs text-white"
                >
                  <option value={1}>১ বার লুপ</option>
                  <option value={2}>২ বার লুপ</option>
                  <option value={3}>৩ বার লুপ</option>
                  <option value={5}>৫ বার লুপ</option>
                </select>
              </div>

              <div className="bg-neutral-800/80 p-2.5 rounded-xl border border-neutral-700">
                <span className="text-[11px] text-neutral-400 block mb-1">ফ্রেম রেট (FPS):</span>
                <div className="text-xs font-mono font-bold text-amber-400 mt-1">
                  {fps} FPS (টাইমলাইন অনুযায়ী)
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar during render */}
          {isExporting && (
            <div className="space-y-1.5 p-3 rounded-xl bg-purple-950/40 border border-purple-800/60">
              <div className="flex justify-between text-xs text-purple-200">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span>দ্রুত রেন্ডারিং হচ্ছে...</span>
                </span>
                <span className="font-mono font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/90 flex justify-between items-center">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-3 py-2 text-neutral-400 hover:text-white text-xs disabled:opacity-50"
          >
            বাতিল
          </button>

          <button
            onClick={handleStartExport}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>রেন্ডারিং...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>এখনই এক্সপোর্ট ও ডাউনলোড করুন</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
