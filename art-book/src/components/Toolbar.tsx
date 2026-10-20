import React from 'react';
import {
  Pencil,
  PenTool,
  Pen,
  Paintbrush,
  Highlighter,
  Wind,
  Sparkles,
  Minus,
  Eraser,
  PaintBucket,
  Move,
  Bone,
  Crop,
  SlidersVertical,
  EyeOff,
} from 'lucide-react';
import { BrushConfig, ToolType } from '../types/canvas';

interface ToolbarProps {
  brushConfig: BrushConfig;
  onSelectTool: (tool: ToolType) => void;
  onOpenBrushSettings: () => void;
  onOpenColorPalette: () => void;
  onOpenCrop: () => void;
  onToggleRigging: () => void;
  isRiggingActive: boolean;
  onHideToolbar?: () => void;
}

interface ToolItem {
  id: ToolType;
  label: string;
  bengali: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const TOOLS: ToolItem[] = [
  { id: 'pencil', label: 'Pencil', bengali: 'পেন্সিল', icon: Pencil, color: 'text-amber-400' },
  { id: 'ink_pen', label: 'Ink Pen', bengali: 'কালি কলম', icon: PenTool, color: 'text-sky-400' },
  { id: 'ballpoint', label: 'Ballpoint', bengali: 'বলপেন', icon: Pen, color: 'text-blue-400' },
  { id: 'brush_paint', label: 'Watercolor Brush', bengali: 'জলরং ব্রাশ', icon: Paintbrush, color: 'text-emerald-400' },
  { id: 'marker', label: 'Marker', bengali: 'মার্কার', icon: Highlighter, color: 'text-yellow-400' },
  { id: 'airbrush', label: 'Airbrush', bengali: 'এয়ারব্রাশ', icon: Wind, color: 'text-cyan-400' },
  { id: 'glow_neon', label: 'Glow Neon', bengali: 'নিয়ন গ্লো', icon: Sparkles, color: 'text-pink-400' },
  { id: 'technical', label: 'Fine Line', bengali: 'ফাইন লাইনার', icon: Minus, color: 'text-violet-400' },
  { id: 'eraser', label: 'Eraser', bengali: 'ইরেজার', icon: Eraser, color: 'text-rose-400' },
  { id: 'fill_bucket', label: 'Bucket Fill', bengali: 'কালার বালতি', icon: PaintBucket, color: 'text-indigo-400' },
  { id: 'select_move', label: 'Select & Move', bengali: 'সিঙ্গেল মুভমেন্ট', icon: Move, color: 'text-emerald-300' },
  { id: 'rigging', label: '2D Rigging', bengali: 'বোন রিগিং', icon: Bone, color: 'text-purple-400' },
  { id: 'crop', label: 'Canvas Crop', bengali: 'ক্রপ টুল', icon: Crop, color: 'text-orange-400' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  brushConfig,
  onSelectTool,
  onOpenBrushSettings,
  onOpenColorPalette,
  onOpenCrop,
  onToggleRigging,
  isRiggingActive,
  onHideToolbar,
}) => {
  return (
    <div className="fixed bottom-2 left-0 right-0 z-20 flex justify-center px-2 pointer-events-none">
      <div className="pointer-events-auto bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl shadow-2xl p-1.5 flex items-center gap-1.5 max-w-full overflow-x-auto scrollbar-none overscroll-x-contain touch-pan-x">
        {/* Quick Color Disc Button */}
        <button
          onClick={onOpenColorPalette}
          title="কালার, গ্রেডিয়েন্ট ও গ্লো নির্বাচন করুন"
          className="relative group p-1 rounded-xl bg-neutral-800 border border-neutral-700 hover:border-neutral-500 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
        >
          {brushConfig.colorMode === 'gradient' ? (
            <div
              className="w-7 h-7 rounded-lg shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${brushConfig.gradient.color1}, ${brushConfig.gradient.color2})`,
              }}
            />
          ) : brushConfig.colorMode === 'glow' ? (
            <div
              className="w-7 h-7 rounded-lg shadow-lg relative flex items-center justify-center"
              style={{
                backgroundColor: brushConfig.color,
                boxShadow: `0 0 10px ${brushConfig.glowColor || brushConfig.color}`,
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-white drop-shadow" />
            </div>
          ) : (
            <div
              className="w-7 h-7 rounded-lg shadow-sm border border-white/20"
              style={{ backgroundColor: brushConfig.color }}
            />
          )}
        </button>

        {/* Brush Settings Button (Size & Opacity indicator) */}
        <button
          onClick={onOpenBrushSettings}
          title="ব্রাশ সাইজ ও সেটিংস"
          className="px-2 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 hover:bg-neutral-750 text-neutral-300 active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
        >
          <SlidersVertical className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-[11px] font-mono text-neutral-200">
            {brushConfig.type === 'eraser' ? brushConfig.eraserSize : brushConfig.size}px
          </span>
        </button>

        <div className="h-6 w-px bg-neutral-800 flex-shrink-0 mx-0.5"></div>

        {/* Scrollable primary tools */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isSelected =
              brushConfig.type === tool.id || (tool.id === 'rigging' && isRiggingActive);

            return (
              <button
                key={tool.id}
                onClick={() => {
                  if (tool.id === 'crop') {
                    onOpenCrop();
                  } else if (tool.id === 'rigging') {
                    onToggleRigging();
                  } else {
                    onSelectTool(tool.id);
                  }
                }}
                title={`${tool.bengali} (${tool.label})`}
                className={`flex flex-col items-center justify-center min-w-9 h-11 px-1.5 rounded-xl transition-all active:scale-90 flex-shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-b from-neutral-700 to-neutral-800 border border-purple-500 shadow-md shadow-purple-500/20 text-white'
                    : 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isSelected ? tool.color : 'text-neutral-400'}`}
                />
                <span className="text-[9px] mt-0.5 whitespace-nowrap leading-tight">
                  {tool.bengali}
                </span>
              </button>
            );
          })}

          {onHideToolbar && (
            <>
              <div className="h-6 w-px bg-neutral-800 flex-shrink-0 mx-0.5" />
              <button
                onClick={onHideToolbar}
                title="টুলবার লুকান (ফুলস্ক্রিন মোড - Tab)"
                className="flex flex-col items-center justify-center min-w-9 h-11 px-1.5 rounded-xl text-neutral-400 hover:text-purple-300 hover:bg-neutral-800/80 transition-all active:scale-90 flex-shrink-0"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span className="text-[8px] mt-0.5 whitespace-nowrap">লুকান</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
