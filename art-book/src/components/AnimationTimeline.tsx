import React from 'react';
import {
  Play,
  Pause,
  Plus,
  Copy,
  Trash2,
  Repeat,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
} from 'lucide-react';
import { AnimationFrame } from '../types/canvas';

interface AnimationTimelineProps {
  isOpen: boolean;
  frames: AnimationFrame[];
  currentFrameIndex: number;
  isPlaying: boolean;
  fps: number;
  loop: boolean;
  onionSkin: boolean;
  onSelectFrame: (index: number) => void;
  onAddFrame: () => void;
  onOpenImageImport: () => void;
  onDuplicateFrame: (index: number) => void;
  onDeleteFrame: (index: number) => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onToggleOnionSkin: () => void;
  onChangeFps: (fps: number) => void;
}

export const AnimationTimeline: React.FC<AnimationTimelineProps> = ({
  isOpen,
  frames,
  currentFrameIndex,
  isPlaying,
  fps,
  loop,
  onionSkin,
  onSelectFrame,
  onAddFrame,
  onOpenImageImport,
  onDuplicateFrame,
  onDeleteFrame,
  onTogglePlay,
  onToggleLoop,
  onToggleOnionSkin,
  onChangeFps,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-20 flex justify-center px-2 pointer-events-none animate-slide-up">
      <div className="pointer-events-auto bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl shadow-2xl p-2 max-w-4xl w-full flex flex-col gap-2">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-2">
          {/* Play/Pause & Frame Nav */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onTogglePlay}
              title={isPlaying ? 'বিরতি (Pause)' : 'প্লে করুন (Play)'}
              className={`p-2 rounded-xl text-white font-medium flex items-center justify-center transition-all active:scale-95 ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={() => onSelectFrame(Math.max(0, currentFrameIndex - 1))}
              disabled={currentFrameIndex === 0}
              title="আগের ফ্রেম"
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono text-neutral-300 px-1 font-semibold">
              {currentFrameIndex + 1} / {frames.length}
            </span>

            <button
              onClick={() => onSelectFrame(Math.min(frames.length - 1, currentFrameIndex + 1))}
              disabled={currentFrameIndex === frames.length - 1}
              title="পরের ফ্রেম"
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Center: Onion Skin & Loop */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleOnionSkin}
              title="অনিয়ন স্কিন (পূর্বের ফ্রেমের আবছা ছায়া দেখতে)"
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all active:scale-95 ${
                onionSkin
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>অনিয়ন স্কিন</span>
            </button>

            <button
              onClick={onToggleLoop}
              title="লুপ প্লেব্যাক"
              className={`p-1.5 rounded-xl border transition-all active:scale-95 ${
                loop
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-400'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Right: FPS & Add Frame */}
          <div className="flex items-center gap-1.5">
            {/* FPS Selector */}
            <div className="flex items-center gap-1 bg-neutral-800/80 px-2 py-1 rounded-xl border border-neutral-700">
              <span className="text-[10px] text-neutral-400 font-mono">FPS:</span>
              <select
                value={fps}
                onChange={(e) => onChangeFps(parseInt(e.target.value))}
                className="bg-transparent text-xs font-mono text-purple-300 focus:outline-none cursor-pointer"
              >
                <option value={12} className="bg-neutral-900">12 fps (ক্লাসিক)</option>
                <option value={24} className="bg-neutral-900">24 fps (সিনেমা)</option>
                <option value={30} className="bg-neutral-900">30 fps (স্মুথ)</option>
                <option value={60} className="bg-neutral-900">60 fps (আল্ট্রা)</option>
              </select>
            </div>

            <button
              onClick={onOpenImageImport}
              title="ফ্রেমে ইমেজ ইম্পোর্ট করুন (Import Image to Frame)"
              className="p-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/60 text-emerald-300 flex items-center gap-1 px-2.5 text-xs font-medium active:scale-95 transition-all shadow-md shadow-emerald-600/10"
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">ছবি ইম্পোর্ট</span>
            </button>

            <button
              onClick={onAddFrame}
              title="নতুন ফাঁকা ফ্রেম যোগ করুন"
              className="p-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 px-2.5 text-xs font-medium active:scale-95 transition-all shadow-md shadow-purple-600/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">নতুন ফ্রেম</span>
            </button>
          </div>
        </div>

        {/* Frames Thumbnail Strip */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
          {frames.map((frame, index) => {
            const isSelected = index === currentFrameIndex;

            return (
              <div
                key={`${frame.id || 'frame'}_${index}`}
                onClick={() => onSelectFrame(index)}
                className={`relative group flex-shrink-0 cursor-pointer rounded-xl border-2 transition-all p-1 flex flex-col items-center ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/15 shadow-md shadow-purple-500/20'
                    : 'border-neutral-700/80 bg-neutral-800/60 hover:bg-neutral-800'
                }`}
              >
                {/* Thumbnail display */}
                <div className="w-14 h-12 rounded-lg bg-neutral-950 checker-pattern overflow-hidden flex items-center justify-center relative">
                  <span className="text-[11px] font-bold font-mono text-neutral-400">
                    #{index + 1}
                  </span>
                </div>

                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                  F{index + 1}
                </div>

                {/* Hover/Touch actions */}
                <div className="absolute -top-2 -right-2 flex gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateFrame(index);
                    }}
                    title="ফ্রেম ডুপ্লিকেট"
                    className="w-5 h-5 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-neutral-200 flex items-center justify-center text-[10px]"
                  >
                    <Copy className="w-2.5 h-2.5" />
                  </button>

                  {frames.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFrame(index);
                      }}
                      title="ফ্রেম মুছুন"
                      className="w-5 h-5 rounded-full bg-red-900/80 hover:bg-red-800 border border-red-600 text-red-200 flex items-center justify-center text-[10px]"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
