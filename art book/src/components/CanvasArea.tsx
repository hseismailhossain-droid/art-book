import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  AnimationFrame,
  BrushConfig,
  CanvasLayer,
  JointNode,
  Point,
  RigInteraction,
  SelectionTransform,
  SkeletonRig,
  ToolType,
} from '../types/canvas';
import { drawStrokeSegment, endStroke, floodFill, startStroke } from '../utils/brushEngine';
import { TransformOverlay } from './TransformOverlay';
import { RigBindData, renderRiggedArtwork } from '../utils/rigDeformer';
import {
  Bone,
  Plus,
  Move,
  Trash2,
  Stamp,
  RotateCcw,
  Sparkles,
  X,
  Lasso,
  Square,
  Check,
  Zap,
} from 'lucide-react';

interface CanvasAreaProps {
  canvasWidth: number;
  canvasHeight: number;
  layers: CanvasLayer[];
  activeLayerId: string;
  brushConfig: BrushConfig;
  frames: AnimationFrame[];
  currentFrameIndex: number;
  onionSkin: boolean;
  rig: SkeletonRig | null;
  isRiggingActive: boolean;
  rigInteraction: RigInteraction;
  onChangeRigInteraction: (mode: RigInteraction) => void;
  selectedJointId: string | null;
  onSelectJoint: (id: string | null) => void;
  onAddCustomJoint: (x: number, y: number) => void;
  onUpdateRigJoints: (joints: JointNode[]) => void;
  onDeleteSelectedJoint: () => void;
  onClearAllBones: () => void;
  onBakeRigToLayer: (style: 'mannequin' | 'guide') => void;
  onCloseRigging: () => void;
  rigBindData: RigBindData | null;
  onBindRig: () => void;
  onApplyPose: () => void;
  onResetPose: () => void;
  selectionTransform: SelectionTransform;
  onUpdateSelectionTransform: (partial: Partial<SelectionTransform>) => void;
  onApplySelectionTransform: () => void;
  onCancelSelectionTransform: () => void;
  onDuplicateSelectionTransform: () => void;
  onDeleteSelectionTransform?: () => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onCommitStroke: () => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  canvasWidth,
  canvasHeight,
  layers,
  activeLayerId,
  brushConfig,
  frames,
  currentFrameIndex,
  onionSkin,
  rig,
  isRiggingActive,
  rigInteraction,
  onChangeRigInteraction,
  selectedJointId,
  onSelectJoint,
  onAddCustomJoint,
  onUpdateRigJoints,
  onDeleteSelectedJoint,
  onClearAllBones,
  onBakeRigToLayer,
  onCloseRigging,
  rigBindData,
  onBindRig,
  onApplyPose,
  onResetPose,
  selectionTransform,
  onUpdateSelectionTransform,
  onApplySelectionTransform,
  onCancelSelectionTransform,
  onDuplicateSelectionTransform,
  onDeleteSelectionTransform,
  zoomLevel,
  onZoomChange,
  onCommitStroke,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Pan offset for zooming / panning
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });

  // Touch pinch distance
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef(1);

  // Drawing state
  const isDrawingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);

  // Rigging drag state
  const activeDragJointIdRef = useRef<string | null>(null);

  // Selection Lasso / Box state
  const isSelectingRef = useRef(false);
  const selectionPointsRef = useRef<Point[]>([]);
  const [selectionMode, setSelectionMode] = useState<'lasso' | 'box'>('lasso');
  const [isLassoDrawing, setIsLassoDrawing] = useState(false);

  // Get active layer
  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

  // Helper: Convert screen coords to canvas coords
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): Point => {
      const rect = displayCanvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const rawX = (screenX - rect.left) / zoomLevel;
      const rawY = (screenY - rect.top) / zoomLevel;
      return {
        x: Math.max(0, Math.min(canvasWidth, rawX)),
        y: Math.max(0, Math.min(canvasHeight, rawY)),
      };
    },
    [zoomLevel, canvasWidth, canvasHeight]
  );

  // Main Render Loop onto displayCanvas
  const renderDisplay = useCallback(() => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable pristine high quality bicubic interpolation for 8K rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear display
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Solid White Background (Guaranteed opaque white canvas so it NEVER looks transparent)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw user-painted background layers if any
    for (const layer of layers) {
      if (
        layer.visible &&
        (layer.id === 'layer_bg' ||
          layer.name.includes('Background') ||
          layer.name.includes('ব্যাকগ্রাউন্ড'))
      ) {
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(layer.canvas, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    }

    // 3. Draw Onion Skin (Previous frame's drawing layers with high-contrast colored ghost tint!)
    if (onionSkin && currentFrameIndex > 0) {
      const prevFrame = frames[currentFrameIndex - 1];
      if (prevFrame) {
        ctx.save();
        // Create an offscreen ghost canvas to tint previous frame with high-contrast animation coral-red
        const ghostCanvas = document.createElement('canvas');
        ghostCanvas.width = canvas.width;
        ghostCanvas.height = canvas.height;
        const gctx = ghostCanvas.getContext('2d');
        if (gctx) {
          for (const pLayer of prevFrame.layers) {
            const isBg =
              pLayer.id === 'layer_bg' ||
              pLayer.name.includes('Background') ||
              pLayer.name.includes('ব্যাকগ্রাউন্ড');
            if (pLayer.visible && !isBg) {
              gctx.drawImage(pLayer.canvas, 0, 0, canvas.width, canvas.height);
            }
          }

          // Tint previous frame strokes into unmistakable coral red (#f43f5e)
          gctx.globalCompositeOperation = 'source-in';
          gctx.fillStyle = '#f43f5e';
          gctx.fillRect(0, 0, ghostCanvas.width, ghostCanvas.height);

          // Draw tinted ghost onto main canvas with 0.55 alpha
          ctx.globalAlpha = 0.55;
          ctx.drawImage(ghostCanvas, 0, 0);

          // Also overlay original strokes at 0.25 alpha for natural color reference
          ctx.globalAlpha = 0.25;
          for (const pLayer of prevFrame.layers) {
            const isBg =
              pLayer.id === 'layer_bg' ||
              pLayer.name.includes('Background') ||
              pLayer.name.includes('ব্যাকগ্রাউন্ড');
            if (pLayer.visible && !isBg) {
              ctx.drawImage(pLayer.canvas, 0, 0, canvas.width, canvas.height);
            }
          }
        }
        ctx.restore();
      }
    }

    // 4. Draw Active Frame's Drawing Layers (excluding background)
    for (const layer of layers) {
      const isBg =
        layer.id === 'layer_bg' ||
        layer.name.includes('Background') ||
        layer.name.includes('ব্যাকগ্রাউন্ড');
      if (!layer.visible || isBg) continue;

      // If this layer is currently bound to bones and rigging is active, render live deformed artwork!
      const isLayerBound =
        isRiggingActive &&
        rigBindData &&
        rigBindData.isBound &&
        (layer.id === rigBindData.targetLayerId ||
          (!rigBindData.targetLayerId && layer.id === activeLayerId));

      if (isLayerBound) {
        renderRiggedArtwork(ctx, rigBindData, rig?.joints || []);
      } else {
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode;
        ctx.drawImage(layer.canvas, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    }

    // 5. Draw active selection preview if any
    if (selectionTransform.isActive && selectionTransform.sourceCanvas) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.translate(
        selectionTransform.x + (selectionTransform.width * selectionTransform.scaleX) / 2,
        selectionTransform.y + (selectionTransform.height * selectionTransform.scaleY) / 2
      );
      ctx.rotate((selectionTransform.rotation * Math.PI) / 180);
      ctx.scale(selectionTransform.scaleX, selectionTransform.scaleY);
      ctx.drawImage(
        selectionTransform.sourceCanvas,
        -selectionTransform.width / 2,
        -selectionTransform.height / 2,
        selectionTransform.width,
        selectionTransform.height
      );
      ctx.restore();
    }

    // 6. Draw Live Selection Lasso / Box Stroke
    if (isSelectingRef.current && selectionPointsRef.current.length > 1) {
      ctx.save();
      const pts = selectionPointsRef.current;
      ctx.lineWidth = Math.max(2, 2.5 / zoomLevel);
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.setLineDash([8 / zoomLevel, 6 / zoomLevel]);

      ctx.beginPath();
      if (selectionMode === 'box') {
        const p0 = pts[0];
        const p1 = pts[pts.length - 1];
        const bx = Math.min(p0.x, p1.x);
        const by = Math.min(p0.y, p1.y);
        const bw = Math.abs(p1.x - p0.x);
        const bh = Math.abs(p1.y - p0.y);
        ctx.rect(bx, by, bw, bh);
      } else {
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 7. Draw Custom Rigging Skeleton overlay if active
    if (isRiggingActive && rig && rig.visible) {
      ctx.save();
      const jointMap = new Map(rig.joints.map((j) => [j.id, j]));

      // Draw bones connecting joints
      for (const bone of rig.bones) {
        const from = jointMap.get(bone.fromId);
        const to = jointMap.get(bone.toId);
        if (!from || !to) continue;

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
        ctx.lineWidth = (bone.thickness || 5) * Math.max(1, 1 / zoomLevel);
        ctx.lineCap = 'round';
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // Inner glowing core
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1.5, 2 / zoomLevel);
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }

      // Draw joints
      for (const joint of rig.joints) {
        const isSelected = joint.id === selectedJointId;
        const r = (joint.radius || 9) * Math.max(1, 1 / zoomLevel);

        ctx.beginPath();
        ctx.arc(joint.x, joint.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#f59e0b' : joint.color || '#06b6d4';
        ctx.fill();

        ctx.lineWidth = (isSelected ? 3.5 : 2) * Math.max(1, 1 / zoomLevel);
        ctx.strokeStyle = isSelected ? '#ffffff' : '#ffffff';
        ctx.stroke();

        // Outer pulse ring if selected
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(joint.x, joint.y, r + 5 / zoomLevel, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
          ctx.lineWidth = 2 / zoomLevel;
          ctx.stroke();
        }

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(9, 11 / zoomLevel)}px sans-serif`;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(joint.name, joint.x + r + 3, joint.y + 4);
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }
  }, [
    layers,
    onionSkin,
    frames,
    currentFrameIndex,
    selectionTransform,
    isRiggingActive,
    rig,
    rigBindData,
    zoomLevel,
    selectedJointId,
    selectionMode,
  ]);

  // RAF animation batching for silky smooth 60-120 FPS mobile drawing
  const rafIdRef = useRef<number | null>(null);
  const requestDisplayUpdate = useCallback(() => {
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        renderDisplay();
      });
    }
  }, [renderDisplay]);

  // Redraw hook
  useEffect(() => {
    let animId = requestAnimationFrame(renderDisplay);
    return () => {
      cancelAnimationFrame(animId);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [renderDisplay]);

  // Center canvas initially
  useEffect(() => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;

    const margin = 24;
    const scaleX = (cw - margin) / canvasWidth;
    const scaleY = (ch - margin) / canvasHeight;
    const fitScale = Math.min(1.0, Math.min(scaleX, scaleY));

    onZoomChange(fitScale);
    setPanOffset({
      x: (cw - canvasWidth * fitScale) / 2,
      y: (ch - canvasHeight * fitScale) / 2,
    });
  }, [canvasWidth, canvasHeight]);

  // Pointer Down Handler
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!e.isPrimary) return;

    const pt = screenToCanvas(e.clientX, e.clientY);
    const pressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.8;

    // 1. Rigging Mode
    if (isRiggingActive && rig && rig.visible) {
      const hitRadius = 32 / zoomLevel;
      const clickedJoint = rig.joints.find((j) => {
        const d = Math.hypot(j.x - pt.x, j.y - pt.y);
        return d <= hitRadius;
      });

      if (clickedJoint) {
        onSelectJoint(clickedJoint.id);
        activeDragJointIdRef.current = clickedJoint.id;
        onChangeRigInteraction('pose_bone');
        if (!rigBindData) {
          onBindRig();
        }
        try {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        } catch (_) {}
        return;
      }

      // If clicked empty area: Add new custom bone connected to parent!
      onAddCustomJoint(pt.x, pt.y);
      return;
    }

    // 2. Single Movement / Selection Tool (`select_move`)
    if (brushConfig.type === 'select_move') {
      if (!selectionTransform.isActive) {
        isSelectingRef.current = true;
        selectionPointsRef.current = [pt];
        setIsLassoDrawing(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
      return;
    }

    // 3. Flood Fill
    if (brushConfig.type === 'fill_bucket') {
      if (!activeLayer.locked) {
        floodFill(activeLayer.ctx, Math.round(pt.x), Math.round(pt.y), brushConfig.color);
        renderDisplay();
        onCommitStroke();
      }
      return;
    }

    // 4. Normal Drawing
    if (activeLayer.locked) return;

    isDrawingRef.current = true;
    activePointerIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const startPt: Point = {
      x: pt.x,
      y: pt.y,
      pressure,
      time: Date.now(),
    };

    startStroke(startPt);
    drawStrokeSegment(activeLayer.ctx, startPt, brushConfig, canvasWidth, canvasHeight);
    renderDisplay();
  };

  // Pointer Move Handler
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // 1. Rigging Bone Drag
    if (activeDragJointIdRef.current && rig) {
      if (!rigBindData && (rig?.bones.length || 0) > 0) {
        onBindRig();
      }
      const pt = screenToCanvas(e.clientX, e.clientY);
      const updated = rig.joints.map((j) => {
        if (j.id === activeDragJointIdRef.current) {
          return { ...j, x: pt.x, y: pt.y };
        }
        return j;
      });
      onUpdateRigJoints(updated);
      renderDisplay();
      return;
    }

    // 2. Selection Lasso / Box Drag
    if (isSelectingRef.current) {
      const pt = screenToCanvas(e.clientX, e.clientY);
      selectionPointsRef.current.push(pt);
      requestDisplayUpdate();
      return;
    }

    // 3. Normal Stroke Drawing
    if (!isDrawingRef.current) return;

    const pt = screenToCanvas(e.clientX, e.clientY);
    const pressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.8;

    const currentPt: Point = {
      x: pt.x,
      y: pt.y,
      pressure,
      time: Date.now(),
    };

    drawStrokeSegment(activeLayer.ctx, currentPt, brushConfig, canvasWidth, canvasHeight);
    requestDisplayUpdate();
  };

  // Pointer Up Handler
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // 1. Finish Rigging Drag
    if (activeDragJointIdRef.current) {
      activeDragJointIdRef.current = null;
    }

    // 2. Finish Selection Lasso / Box: Extract EXACT selected pixels!
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      setIsLassoDrawing(false);

      const pts = selectionPointsRef.current;
      if (pts.length > 2) {
        let minX = pts[0].x;
        let minY = pts[0].y;
        let maxX = pts[0].x;
        let maxY = pts[0].y;

        for (const p of pts) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }

        const selW = Math.round(maxX - minX);
        const selH = Math.round(maxY - minY);

        if (selW > 4 && selH > 4) {
          const cutCanvas = document.createElement('canvas');
          cutCanvas.width = selW;
          cutCanvas.height = selH;
          const cutCtx = cutCanvas.getContext('2d')!;

          if (selectionMode === 'box') {
            cutCtx.drawImage(activeLayer.canvas, minX, minY, selW, selH, 0, 0, selW, selH);
            activeLayer.ctx.clearRect(minX, minY, selW, selH);
          } else {
            cutCtx.save();
            cutCtx.beginPath();
            cutCtx.moveTo(pts[0].x - minX, pts[0].y - minY);
            for (let i = 1; i < pts.length; i++) {
              cutCtx.lineTo(pts[i].x - minX, pts[i].y - minY);
            }
            cutCtx.closePath();
            cutCtx.clip();
            cutCtx.drawImage(activeLayer.canvas, -minX, -minY);
            cutCtx.restore();

            activeLayer.ctx.save();
            activeLayer.ctx.beginPath();
            activeLayer.ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
              activeLayer.ctx.lineTo(pts[i].x, pts[i].y);
            }
            activeLayer.ctx.closePath();
            activeLayer.ctx.clip();
            activeLayer.ctx.clearRect(minX - 2, minY - 2, selW + 4, selH + 4);
            activeLayer.ctx.restore();
          }

          renderDisplay();

          onUpdateSelectionTransform({
            isActive: true,
            mode: selectionMode,
            x: minX,
            y: minY,
            width: selW,
            height: selH,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            sourceCanvas: cutCanvas,
            originalLayerId: activeLayer.id,
            polygonPoints: pts,
          });
        }
      }

      selectionPointsRef.current = [];
      renderDisplay();
      return;
    }

    // 3. Normal Stroke End
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      endStroke();
      renderDisplay();
      onCommitStroke();
    }
  };

  // Multi-touch gestures for pinch zoom & 2-finger pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isDrawingRef.current = false;
      isSelectingRef.current = false;
      endStroke();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchStartDistRef.current = dist;
      pinchStartZoomRef.current = zoomLevel;

      isPanningRef.current = true;
      panStartRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const curDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = curDist / pinchStartDistRef.current;
      const newZoom = Math.max(0.15, Math.min(6.0, pinchStartZoomRef.current * ratio));
      onZoomChange(newZoom);

      if (isPanningRef.current) {
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        setPanOffset({
          x: panStartRef.current.startPanX + (midX - panStartRef.current.x),
          y: panStartRef.current.startPanY + (midY - panStartRef.current.y),
        });
      }
    }
  };

  const handleTouchEnd = () => {
    pinchStartDistRef.current = null;
    isPanningRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full bg-neutral-950 overflow-hidden flex items-center justify-center select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Floating Toolbar: Single Movement Selection Mode */}
      {brushConfig.type === 'select_move' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-neutral-900/95 border border-sky-500/60 shadow-2xl rounded-2xl p-1.5 flex items-center gap-2 pointer-events-auto backdrop-blur-md animate-fade-in max-w-[96vw] overflow-x-auto">
          {!selectionTransform.isActive ? (
            <>
              <div className="flex items-center gap-1 bg-neutral-800 p-0.5 rounded-xl flex-shrink-0">
                <button
                  onClick={() => setSelectionMode('lasso')}
                  title="ফ্রিহ্যান্ড ল্যাসো (ঘিরে সিলেক্ট করুন)"
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                    selectionMode === 'lasso'
                      ? 'bg-sky-500 text-black shadow-sm font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Lasso className="w-3.5 h-3.5" />
                  <span>ল্যাসো</span>
                </button>

                <button
                  onClick={() => setSelectionMode('box')}
                  title="বক্স সিলেকশন"
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                    selectionMode === 'box'
                      ? 'bg-sky-500 text-black shadow-sm font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>বক্স</span>
                </button>
              </div>

              <span className="text-[11px] text-sky-200 font-medium px-1">
                আঁকা অংশের চারপাশ ড্র্যাগ করে সিলেক্ট করুন (মুভ বা মুছতে)
              </span>
            </>
          ) : (
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs text-emerald-300 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                সিলেকশন সক্রিয়
              </span>
              {onDeleteSelectionTransform && (
                <button
                  onClick={onDeleteSelectionTransform}
                  title="সিলেক্ট করা অংশ ডিলিট করুন (Delete)"
                  className="px-2.5 py-1 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                  <span>মুছুন</span>
                </button>
              )}
              <button
                onClick={onApplySelectionTransform}
                title="বসিয়ে দিন (Enter)"
                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1 active:scale-95 transition-all shadow-sm"
              >
                <Check className="w-3.5 h-3.5 text-white" />
                <span>বসিয়ে দিন</span>
              </button>
              <button
                onClick={onCancelSelectionTransform}
                title="বাতিল করুন (Esc)"
                className="p-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white active:scale-90"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Indicator: Onion Skin Active */}
      {onionSkin && currentFrameIndex > 0 && !isRiggingActive && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-rose-950/90 border border-rose-500/80 shadow-2xl rounded-2xl px-3 py-1.5 flex items-center gap-2 pointer-events-none backdrop-blur-md animate-fade-in text-xs text-rose-200">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-medium">
            অনিয়ন স্কিন সক্রিয় (ফ্রেম {currentFrameIndex} এর লাল ছায়া দেখা যাচ্ছে)
          </span>
        </div>
      )}

      {/* Floating Toolbar: Custom Rigging Controls on Canvas */}
      {isRiggingActive && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-neutral-900/95 border border-cyan-500/60 shadow-2xl rounded-2xl p-1.5 flex items-center gap-1.5 pointer-events-auto backdrop-blur-md animate-fade-in max-w-[96vw] overflow-x-auto">
          {/* Mode toggle: Add Bone vs Pose */}
          <div className="flex items-center gap-1 bg-neutral-800 p-0.5 rounded-xl flex-shrink-0">
            <button
              onClick={() => onChangeRigInteraction('add_bone')}
              title="হাড় যোগ করুন: ক্যানভাসে ড্রয়িং এর ওপর ট্যাপ করুন"
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                rigInteraction === 'add_bone'
                  ? 'bg-cyan-400 text-black shadow-sm font-semibold'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>হাড় বসান</span>
            </button>

            <button
              onClick={() => {
                onChangeRigInteraction('pose_bone');
                if (!rigBindData && (rig?.bones.length || 0) > 0) {
                  onBindRig();
                }
              }}
              title="হাড় দিয়ে ড্রয়িং মুভ ও বাঁকান"
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                rigInteraction === 'pose_bone'
                  ? 'bg-cyan-400 text-black shadow-sm font-semibold'
                  : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>পোজ ও মুভ</span>
            </button>
          </div>

          {/* Apply / Save Pose */}
          {rigBindData?.isBound && (
            <button
              onClick={onApplyPose}
              title="বাঁকানো পোজ ক্যানভাস লেয়ারে সেভ করুন"
              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 shadow-md shadow-emerald-600/20 flex-shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>পোজ ফ্রেমে সেট করুন</span>
            </button>
          )}

          {/* Reset Pose */}
          {rigBindData?.isBound && (
            <button
              onClick={onResetPose}
              title="মূল অবস্থানে রিসেট করুন"
              className="px-2 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-300 text-xs flex items-center gap-1 active:scale-90 flex-shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>আসল অবস্থান</span>
            </button>
          )}

          {/* Delete Selected Joint */}
          {selectedJointId && (
            <button
              onClick={onDeleteSelectedJoint}
              title="নির্বাচিত হাড় মুছুন"
              className="px-2 py-1 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs flex items-center gap-1 active:scale-90 flex-shrink-0"
            >
              <Trash2 className="w-3 h-3" />
              <span>হাড় ডিলিট</span>
            </button>
          )}

          {/* Clear all bones */}
          {(rig?.joints.length || 0) > 0 && (
            <button
              onClick={onClearAllBones}
              title="সব হাড় মুছে নতুন করে শুরু করুন"
              className="px-2 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-red-300 text-xs flex items-center gap-1 active:scale-90 flex-shrink-0"
            >
              <Trash2 className="w-3 h-3" />
              <span>সব মুছুন</span>
            </button>
          )}

          {/* Close Rigging Mode */}
          <button
            onClick={onCloseRigging}
            title="রিগিং বন্ধ করুন"
            className="p-1 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white flex-shrink-0 ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Canvas Wrapper positioned with zoom and pan - instant tracking without transition lag */}
      <div
        className="absolute shadow-2xl rounded-sm will-change-transform"
        style={{
          left: panOffset.x,
          top: panOffset.y,
          width: canvasWidth * zoomLevel,
          height: canvasHeight * zoomLevel,
          willChange: 'left, top, width, height, transform',
          transform: 'translateZ(0)',
        }}
      >
        {/* Transparent Checkerboard Pattern */}
        <div className="absolute inset-0 checker-pattern rounded-sm shadow-inner" />

        {/* Display Canvas */}
        <canvas
          ref={displayCanvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-full h-full block cursor-crosshair touch-none"
          style={{ imageRendering: 'auto' }}
        />

        {/* Interactive Transform Overlay for Single Movement / Object Select */}
        <TransformOverlay
          transform={selectionTransform}
          canvasScale={zoomLevel}
          viewportOffset={{ x: 0, y: 0 }}
          onUpdateTransform={onUpdateSelectionTransform}
          onApplyTransform={onApplySelectionTransform}
          onCancelTransform={onCancelSelectionTransform}
          onDuplicateSelection={onDuplicateSelectionTransform}
          onDeleteSelection={onDeleteSelectionTransform}
        />
      </div>
    </div>
  );
};
