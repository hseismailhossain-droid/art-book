import React from 'react';
import {
  Undo2,
  Redo2,
  Layers,
  Download,
  Maximize2,
  Sliders,
  Settings,
  Film,
  Sparkles,
  Bone,
  Image as ImageIcon,
  EyeOff,
  Play,
} from 'lucide-react';
import { ResolutionPreset } from '../types/canvas';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetZoom: () => void;
  zoomLevel: number;
  activeLayerName: string;
  totalLayers: number;
  onOpenLayers: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenImageImport: () => void;
  onToggleTimeline: () => void;
  isTimelineOpen: boolean;
  currentResolution: ResolutionPreset;
  onOpenResolution: () => void;
  onToggle8K: () => void;
  isRiggingActive: boolean;
  onToggleRigging: () => void;
  onToggleHideToolbar: () => void;
  onOpenDeployGuide: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetZoom,
  zoomLevel,
  activeLayerName,
  totalLayers,
  onOpenLayers,
  onOpenExport,
  onOpenSettings,
  onOpenImageImport,
  onToggleTimeline,
  isTimelineOpen,
  currentResolution,
  onOpenResolution,
  onToggle8K,
  isRiggingActive,
  onToggleRigging,
  onToggleHideToolbar,
  onOpenDeployGuide,
}) => {
  const is8K = currentResolution.tag === '8K';

  return (
    <header className="h-14 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-3 flex items-center justify-between z-30 select-none text-white">
      {/* Left: App Logo & Resolution Badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={onOpenResolution}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block text-left">
            <span className="font-bold text-sm tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300">
              চিত্রকার
            </span>
            <span className="text-[10px] block text-neutral-400 font-mono">Chitrakar Studio</span>
          </div>
        </div>

        {/* Resolution selector badge */}
        <button
          onClick={onOpenResolution}
          title="রেজোলিউশন পরিবর্তন করুন (২২০পি - ৮কে)"
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700 text-xs font-mono text-purple-300 transition-all active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{currentResolution.tag}</span>
        </button>

        {/* 8K Ultra Quality Mode Quick Toggle */}
        <button
          onClick={onToggle8K}
          title={
            is8K
              ? '৮কে আল্ট্রা কোয়ালিটি মোড সক্রিয় আছে (7680x4320)'
              : '৮কে আল্ট্রা কোয়ালিটি মোড চালু করুন (7680x4320)'
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono font-bold transition-all active:scale-95 shadow-sm ${
            is8K
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white border-rose-400 shadow-rose-600/30 ring-1 ring-rose-400'
              : 'bg-neutral-800/80 hover:bg-neutral-700/80 border-neutral-700 text-rose-300 hover:text-white'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${is8K ? 'text-amber-300' : 'text-rose-400'}`} />
          <span>8K ULTRA</span>
        </button>
      </div>

      {/* Center: Undo/Redo & Zoom */}
      <div className="flex items-center gap-1 bg-neutral-800/70 p-1 rounded-lg border border-neutral-700/60">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="আনডু (Undo)"
          className={`p-1.5 rounded-md transition-all ${
            canUndo
              ? 'text-neutral-200 hover:bg-neutral-700 active:scale-90'
              : 'text-neutral-600 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="রিডু (Redo)"
          className={`p-1.5 rounded-md transition-all ${
            canRedo
              ? 'text-neutral-200 hover:bg-neutral-700 active:scale-90'
              : 'text-neutral-600 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-neutral-700 mx-0.5"></div>

        <button
          onClick={onResetZoom}
          title="জুম রিসেট (১০০%)"
          className="px-2 py-1 rounded text-xs font-mono text-neutral-300 hover:bg-neutral-700 flex items-center gap-1"
        >
          <Maximize2 className="w-3 h-3 text-neutral-400" />
          <span>{Math.round(zoomLevel * 100)}%</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Image Import button */}
        <button
          onClick={onOpenImageImport}
          title="ইমেজ ইম্পোর্ট (ছবি যোগ করুন)"
          className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 active:scale-95 transition-all"
        >
          <ImageIcon className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Rigging character skeleton toggle */}
        <button
          onClick={onToggleRigging}
          title="ক্যারেক্টার রিগিং ও বোন সিস্টেম (Rigging)"
          className={`p-2 rounded-lg border transition-all active:scale-95 flex items-center gap-1 text-xs font-medium ${
            isRiggingActive
              ? 'bg-purple-600/30 border-purple-500 text-purple-300 shadow-md shadow-purple-500/20'
              : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
          }`}
        >
          <Bone className="w-4 h-4 text-cyan-400" />
          <span className="hidden md:inline">রিগিং</span>
        </button>

        {/* Animation Timeline toggle */}
        <button
          onClick={onToggleTimeline}
          title="ফ্রেম অ্যানিমেশন টাইমলাইন"
          className={`p-2 rounded-lg border transition-all active:scale-95 flex items-center gap-1 text-xs font-medium ${
            isTimelineOpen
              ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
              : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300'
          }`}
        >
          <Film className="w-4 h-4 text-amber-400" />
          <span className="hidden md:inline">টাইমলাইন</span>
        </button>

        {/* Layers toggle */}
        <button
          onClick={onOpenLayers}
          title="লেয়ার ম্যানেজমেন্ট"
          className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 active:scale-95 transition-all relative flex items-center gap-1"
        >
          <Layers className="w-4 h-4 text-sky-400" />
          <span className="text-xs bg-sky-500/20 text-sky-300 font-mono px-1 rounded">
            {totalLayers}
          </span>
        </button>

        {/* PWA Install Button (Android / iOS / Desktop) */}
        <PWAInstallButton />

        {/* Play Store & Vercel Deployment Center */}
        <button
          onClick={onOpenDeployGuide}
          title="প্লেস্টোর, ভার্সেল ও সার্চ কনসোল প্রস্তুতি গাইড"
          className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-emerald-500/40 text-emerald-300 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-medium shadow-sm"
        >
          <Play className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">প্লেস্টোর ও ডিপ্লয়</span>
        </button>

        {/* Hide Toolbars / Zen Fullscreen Mode */}
        <button
          onClick={onToggleHideToolbar}
          title="টুলবার লুকান (ফুলস্ক্রিন জেন মোড - Tab চাপুন)"
          className="px-2 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-purple-500/40 text-purple-300 hover:text-white active:scale-95 transition-all flex items-center gap-1 text-xs font-medium"
        >
          <EyeOff className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden lg:inline">টুলবার লুকান</span>
        </button>

        {/* Fast Export button */}
        <button
          onClick={onOpenExport}
          title="সেভ ও এক্সপোর্ট (PNG, JPG, Video, 8K)"
          className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium text-xs flex items-center gap-1 shadow-md shadow-purple-600/20 active:scale-95 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>এক্সপোর্ট</span>
        </button>
      </div>
    </header>
  );
};
