import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Check,
  X,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Copy,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  Unlock,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { SelectionTransform } from '../types/canvas';

interface TransformOverlayProps {
  transform: SelectionTransform;
  canvasScale: number;
  viewportOffset: { x: number; y: number };
  onUpdateTransform: (partial: Partial<SelectionTransform>) => void;
  onApplyTransform: () => void;
  onCancelTransform: () => void;
  onDuplicateSelection: () => void;
  onDeleteSelection?: () => void;
}

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'rotate';

export const TransformOverlay: React.FC<TransformOverlayProps> = ({
  transform,
  canvasScale,
  viewportOffset,
  onUpdateTransform,
  onApplyTransform,
  onCancelTransform,
  onDuplicateSelection,
  onDeleteSelection,
}) => {
  const [activeDrag, setActiveDrag] = useState<DragMode | null>(null);
  const [lockAspect, setLockAspect] = useState(true);

  const dragStart = useRef<{
    clientX: number;
    clientY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    origScaleX: number;
    origScaleY: number;
    centerX: number;
    centerY: number;
    startAngle: number;
    origRotation: number;
  } | null>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!activeDrag || !dragStart.current) return;

      const deltaX = (e.clientX - dragStart.current.clientX) / canvasScale;
      const deltaY = (e.clientY - dragStart.current.clientY) / canvasScale;

      if (activeDrag === 'move') {
        onUpdateTransform({
          x: dragStart.current.origX + deltaX,
          y: dragStart.current.origY + deltaY,
        });
        return;
      }

      // 360-Degree Free Rotation
      if (activeDrag === 'rotate') {
        const { centerX, centerY, startAngle, origRotation } = dragStart.current;
        const centerScreenX = centerX * canvasScale + viewportOffset.x;
        const centerScreenY = centerY * canvasScale + viewportOffset.y;
        const curAngle = Math.atan2(e.clientY - centerScreenY, e.clientX - centerScreenX);
        const deltaDeg = ((curAngle - startAngle) * 180) / Math.PI;
        let newAngle = Math.round(origRotation + deltaDeg) % 360;
        if (newAngle < 0) newAngle += 360;
        onUpdateTransform({ rotation: newAngle });
        return;
      }

      // Corner Scaling with real-time aspect ratio lock and high quality preservation
      const { origW, origH, origScaleX, origScaleY, origX, origY } = dragStart.current;
      const currentScaleMagX = Math.abs(origScaleX);
      const currentScaleMagY = Math.abs(origScaleY);
      const signX = origScaleX >= 0 ? 1 : -1;
      const signY = origScaleY >= 0 ? 1 : -1;

      let factorX = 1;
      let factorY = 1;

      if (activeDrag === 'se') {
        factorX = (origW * currentScaleMagX + deltaX) / (origW * currentScaleMagX);
        factorY = (origH * currentScaleMagY + deltaY) / (origH * currentScaleMagY);
      } else if (activeDrag === 'sw') {
        factorX = (origW * currentScaleMagX - deltaX) / (origW * currentScaleMagX);
        factorY = (origH * currentScaleMagY + deltaY) / (origH * currentScaleMagY);
      } else if (activeDrag === 'ne') {
        factorX = (origW * currentScaleMagX + deltaX) / (origW * currentScaleMagX);
        factorY = (origH * currentScaleMagY - deltaY) / (origH * currentScaleMagY);
      } else if (activeDrag === 'nw') {
        factorX = (origW * currentScaleMagX - deltaX) / (origW * currentScaleMagX);
        factorY = (origH * currentScaleMagY - deltaY) / (origH * currentScaleMagY);
      }

      let newScaleMagX = Math.max(0.05, Math.min(10.0, currentScaleMagX * factorX));
      let newScaleMagY = Math.max(0.05, Math.min(10.0, currentScaleMagY * factorY));

      if (lockAspect) {
        const uniformFactor = Math.max(0.05, (factorX + factorY) / 2);
        newScaleMagX = Math.max(0.05, Math.min(10.0, currentScaleMagX * uniformFactor));
        newScaleMagY = Math.max(0.05, Math.min(10.0, currentScaleMagY * uniformFactor));
      }

      onUpdateTransform({
        scaleX: newScaleMagX * signX,
        scaleY: newScaleMagY * signY,
      });
    };

    const handlePointerUp = () => {
      setActiveDrag(null);
      dragStart.current = null;
    };

    if (activeDrag) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeDrag, canvasScale, lockAspect, onUpdateTransform]);

  if (!transform.isActive || !transform.sourceCanvas) return null;

  // Convert canvas coordinates to screen coordinates
  const screenX = transform.x * canvasScale + viewportOffset.x;
  const screenY = transform.y * canvasScale + viewportOffset.y;
  const screenW = Math.abs(transform.width * canvasScale * transform.scaleX);
  const screenH = Math.abs(transform.height * canvasScale * transform.scaleY);

  const startDrag = (e: React.PointerEvent, mode: DragMode) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveDrag(mode);

    const centerX = transform.x + (transform.width * transform.scaleX) / 2;
    const centerY = transform.y + (transform.height * transform.scaleY) / 2;
    const centerScreenX = centerX * canvasScale + viewportOffset.x;
    const centerScreenY = centerY * canvasScale + viewportOffset.y;
    const startAngle = Math.atan2(e.clientY - centerScreenY, e.clientX - centerScreenX);

    dragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      origX: transform.x,
      origY: transform.y,
      origW: transform.width,
      origH: transform.height,
      origScaleX: transform.scaleX,
      origScaleY: transform.scaleY,
      centerX,
      centerY,
      startAngle,
      origRotation: transform.rotation,
    };
  };

  const handleStepScale = (multiplier: number) => {
    const signX = transform.scaleX >= 0 ? 1 : -1;
    const signY = transform.scaleY >= 0 ? 1 : -1;
    const currentMagX = Math.abs(transform.scaleX);
    const currentMagY = Math.abs(transform.scaleY);
    const nextMagX = Math.max(0.1, Math.min(8.0, currentMagX * multiplier));
    const nextMagY = Math.max(0.1, Math.min(8.0, currentMagY * multiplier));
    onUpdateTransform({
      scaleX: nextMagX * signX,
      scaleY: nextMagY * signY,
    });
  };

  const handleResetScale = () => {
    const signX = transform.scaleX >= 0 ? 1 : -1;
    const signY = transform.scaleY >= 0 ? 1 : -1;
    onUpdateTransform({
      scaleX: 1 * signX,
      scaleY: 1 * signY,
      rotation: 0,
    });
  };

  const currentScalePercent = Math.round(Math.abs(transform.scaleX) * 100);

  return (
    <div
      className="absolute border-2 border-dashed border-emerald-400 pointer-events-auto rounded-lg select-none"
      style={{
        left: screenX,
        top: screenY,
        width: Math.max(20, screenW),
        height: Math.max(20, screenH),
        transform: `rotate(${transform.rotation}deg)`,
        transformOrigin: 'center center',
      }}
      onPointerDown={(e) => startDrag(e, 'move')}
    >
      {/* Center Drag Handle Indicator */}
      <div className="absolute inset-0 flex items-center justify-center cursor-move bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 transition-colors">
        <div className="bg-neutral-900/95 border border-emerald-500 text-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-mono flex items-center gap-1.5 shadow-xl">
          <Move className="w-3.5 h-3.5" />
          <span>মুভ করুন ({currentScalePercent}%)</span>
        </div>
      </div>

      {/* 360° Free Rotation Stem and Handle */}
      <div
        onPointerDown={(e) => startDrag(e, 'rotate')}
        title="৩৬০° ডিগ্রি ঘুরান (Drag to rotate 360°)"
        className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-50 group cursor-grab active:cursor-grabbing select-none"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 border-2 border-white shadow-xl flex items-center justify-center group-hover:scale-125 transition-transform">
          <RotateCw className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="w-0.5 h-3 bg-emerald-400/80" />
      </div>

      {/* 4 Interactive Corner Scale Handles */}
      {/* Top Left (NW) */}
      <div
        onPointerDown={(e) => startDrag(e, 'nw')}
        title="টেনে ছোট-বড় করুন"
        className="absolute -top-3 -left-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-50 group"
      >
        <div className="w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-sm shadow-md group-hover:scale-125 transition-transform" />
      </div>

      {/* Top Right (NE) */}
      <div
        onPointerDown={(e) => startDrag(e, 'ne')}
        title="টেনে ছোট-বড় করুন"
        className="absolute -top-3 -right-3 w-6 h-6 flex items-center justify-center cursor-nesw-resize z-50 group"
      >
        <div className="w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-sm shadow-md group-hover:scale-125 transition-transform" />
      </div>

      {/* Bottom Left (SW) */}
      <div
        onPointerDown={(e) => startDrag(e, 'sw')}
        title="টেনে ছোট-বড় করুন"
        className="absolute -bottom-3 -left-3 w-6 h-6 flex items-center justify-center cursor-nesw-resize z-50 group"
      >
        <div className="w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-sm shadow-md group-hover:scale-125 transition-transform" />
      </div>

      {/* Bottom Right (SE) */}
      <div
        onPointerDown={(e) => startDrag(e, 'se')}
        title="টেনে ছোট-বড় করুন"
        className="absolute -bottom-3 -right-3 w-6 h-6 flex items-center justify-center cursor-nwse-resize z-50 group"
      >
        <div className="w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-sm shadow-md group-hover:scale-125 transition-transform" />
      </div>

      {/* Floating Action Menu for the selected element */}
      <div
        className={`absolute ${
          screenY < 75 ? 'top-full mt-3' : '-top-14'
        } left-1/2 -translate-x-1/2 bg-neutral-900/95 border border-emerald-500/70 rounded-2xl shadow-2xl p-1.5 flex items-center gap-1.5 text-white z-50 whitespace-nowrap backdrop-blur-md`}
        style={{
          transform: `translateX(-50%) rotate(${-transform.rotation}deg)`,
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Scale Down button */}
        <button
          onClick={() => handleStepScale(0.85)}
          title="ছোট করুন (-15%)"
          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-300 hover:text-emerald-200 active:scale-90 flex items-center gap-0.5 text-xs font-mono"
        >
          <ZoomOut className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden sm:inline">-15%</span>
        </button>

        {/* Scale Up button */}
        <button
          onClick={() => handleStepScale(1.15)}
          title="বড় করুন (+15%)"
          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-300 hover:text-emerald-200 active:scale-90 flex items-center gap-0.5 text-xs font-mono"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden sm:inline">+15%</span>
        </button>

        {/* Current Scale Reset */}
        <button
          onClick={handleResetScale}
          title="১০০% অরিজিনাল সাইজ"
          className="px-2 py-1 rounded-lg bg-neutral-800/90 hover:bg-neutral-750 text-neutral-300 font-mono text-[11px] active:scale-90"
        >
          {currentScalePercent}%
        </button>

        {/* Lock Aspect Ratio Toggle */}
        <button
          onClick={() => setLockAspect(!lockAspect)}
          title={lockAspect ? 'অনুপাত লক করা আছে' : 'ফ্রি স্কেলিং'}
          className={`p-1.5 rounded-lg active:scale-90 transition-all ${
            lockAspect
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          {lockAspect ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>

        <div className="h-4 w-px bg-neutral-700 mx-0.5" />

        {/* 360° Degree Rotation Controller & Angle Badge */}
        <div className="flex items-center gap-1 bg-neutral-800/90 rounded-xl px-1.5 py-1 border border-neutral-700/60">
          <button
            onClick={() => onUpdateTransform({ rotation: (transform.rotation + 45) % 360 })}
            title="৪৫° ডিগ্রি ঘোরান (+45° Rotate)"
            className="p-0.5 rounded text-neutral-300 hover:text-sky-300 active:scale-90 transition-transform"
          >
            <RotateCw className="w-3.5 h-3.5 text-sky-400" />
          </button>
          <button
            onClick={() => onUpdateTransform({ rotation: 0 })}
            title="ঘোরানো ০° ডিগ্রিতে রিসেট করুন (Reset to 0°)"
            className="text-[11px] font-mono text-sky-300 hover:text-white px-1 font-semibold"
          >
            {transform.rotation}°
          </button>
        </div>

        {/* Flip Horizontal */}
        <button
          onClick={() => onUpdateTransform({ scaleX: transform.scaleX * -1 })}
          title="বামে/ডানে ফ্লিপ করুন"
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white active:scale-90"
        >
          <FlipHorizontal className="w-3.5 h-3.5" />
        </button>

        {/* Flip Vertical */}
        <button
          onClick={() => onUpdateTransform({ scaleY: transform.scaleY * -1 })}
          title="উপরে/নিচে ফ্লিপ করুন"
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white active:scale-90"
        >
          <FlipVertical className="w-3.5 h-3.5" />
        </button>

        {/* Duplicate */}
        <button
          onClick={onDuplicateSelection}
          title="ডুপ্লিকেট কপি"
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white active:scale-90"
        >
          <Copy className="w-3.5 h-3.5 text-sky-400" />
        </button>

        <div className="h-4 w-px bg-neutral-700 mx-0.5" />

        {/* Apply */}
        <button
          onClick={onApplyTransform}
          title="বসিয়ে দিন (Apply / Stamp - Enter চাপুন)"
          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 active:scale-95 shadow-md shadow-emerald-600/30"
        >
          <Check className="w-4 h-4" />
          <span className="hidden sm:inline">বসিয়ে দিন</span>
        </button>

        {/* Delete Selection */}
        {onDeleteSelection && (
          <button
            onClick={onDeleteSelection}
            title="সিলেক্ট করা অংশ ডিলিট করুন (Delete / Backspace চাপুন)"
            className="px-2.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-1 active:scale-95 shadow-md shadow-rose-600/30 transition-all"
          >
            <Trash2 className="w-4 h-4 text-white" />
            <span>মুছুন</span>
          </button>
        )}

        {/* Cancel */}
        <button
          onClick={onCancelTransform}
          title="বাতিল করুন (Cancel - Esc চাপুন)"
          className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-white active:scale-90"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
