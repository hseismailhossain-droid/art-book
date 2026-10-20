import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  AnimationFrame,
  BrushConfig,
  CanvasLayer,
  JointNode,
  ResolutionPreset,
  RigInteraction,
  SelectionTransform,
  SkeletonRig,
  ToolType,
} from './types/canvas';
import { RESOLUTION_PRESETS } from './utils/exportEngine';
import {
  createEmptyRig,
  addCustomJoint,
  deleteJoint,
  bakeCustomRigToLayer,
} from './utils/riggingPresets';
import { createRigBinding, renderRiggedArtwork, RigBindData } from './utils/rigDeformer';
import { TopBar } from './components/TopBar';
import { Toolbar } from './components/Toolbar';
import { CanvasArea } from './components/CanvasArea';
import { ColorPaletteModal } from './components/ColorPaletteModal';
import { BrushSettingsPanel } from './components/BrushSettingsPanel';
import { LayersPanel } from './components/LayersPanel';
import { AnimationTimeline } from './components/AnimationTimeline';
import { RiggingPanel } from './components/RiggingPanel';
import { ExportModal } from './components/ExportModal';
import { CropModal } from './components/CropModal';
import { Eye, EyeOff } from 'lucide-react';
import { ImageImportModal, ImageImportTarget } from './components/ImageImportModal';
import { ResolutionModal } from './components/ResolutionModal';
import { DeploymentGuideModal } from './components/DeploymentGuideModal';

// Helper to create a pristine canvas layer
function createLayer(id: string, name: string, width: number, height: number): CanvasLayer {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  return {
    id,
    name,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: 'source-over',
    canvas,
    ctx,
  };
}

// Clone layer helper
function cloneLayer(src: CanvasLayer, id?: string, name?: string): CanvasLayer {
  const dest = createLayer(
    id !== undefined ? id : src.id,
    name !== undefined ? name : src.name,
    src.canvas.width,
    src.canvas.height
  );
  dest.visible = src.visible;
  dest.locked = src.locked;
  dest.opacity = src.opacity;
  dest.blendMode = src.blendMode;
  dest.ctx.drawImage(src.canvas, 0, 0);
  return dest;
}

export default function App() {
  // 1. Canvas Resolution (Default 1080p FHD for ideal mobile 60fps & true 8K export ready)
  const [currentResolution, setCurrentResolution] = useState<ResolutionPreset>(
    RESOLUTION_PRESETS[4] // 1080p Full HD
  );
  const canvasWidth = currentResolution.width;
  const canvasHeight = currentResolution.height;

  // 2. Layers State
  const [layers, setLayers] = useState<CanvasLayer[]>(() => {
    const l1 = createLayer('layer_bg', 'ব্যাকগ্রাউন্ড (Background)', 1920, 1080);
    // Fill subtle white on background layer
    l1.ctx.fillStyle = '#ffffff';
    l1.ctx.fillRect(0, 0, 1920, 1080);

    const l2 = createLayer('layer_color', 'কালার ও শেডিং', 1920, 1080);
    const l3 = createLayer('layer_line', 'লাইন আর্ট / ক্যারেক্টার', 1920, 1080);

    return [l1, l2, l3];
  });
  const [activeLayerId, setActiveLayerId] = useState<string>('layer_line');

  // 3. Animation Frames State
  const [frames, setFrames] = useState<AnimationFrame[]>(() => [
    {
      id: `frame_${Date.now()}_init`,
      name: 'ফ্রেম ১',
      layers: layers,
    },
  ]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(24);
  const [loop, setLoop] = useState(true);
  const [onionSkin, setOnionSkin] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  // 4. Brush & Tools Config
  const [brushConfig, setBrushConfig] = useState<BrushConfig>({
    type: 'pencil',
    size: 8,
    opacity: 1,
    color: '#000000',
    colorMode: 'solid',
    gradient: {
      type: 'linear',
      color1: '#ec4899',
      color2: '#06b6d4',
    },
    glowIntensity: 1.2,
    glowColor: '#38bdf8',
    stabilizer: 0.6,
    blendMode: 'source-over',
    eraserType: 'hard',
    eraserSize: 24,
  });

  // 5. Custom 2D Rigging System State (Clean & direct over drawn art)
  const [rig, setRig] = useState<SkeletonRig>(createEmptyRig);
  const [isRiggingActive, setIsRiggingActive] = useState(false);
  const [rigInteraction, setRigInteraction] = useState<RigInteraction>('add_bone');
  const [selectedJointId, setSelectedJointId] = useState<string | null>(null);
  const [rigBindData, setRigBindData] = useState<RigBindData | null>(null);

  // 6. Single Movement / Selection Transform State (Lasso / Box)
  const [selectionTransform, setSelectionTransform] = useState<SelectionTransform>({
    isActive: false,
    mode: 'lasso',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    sourceCanvas: null,
    originalLayerId: null,
  });

  // 7. Viewport Zoom
  const [zoomLevel, setZoomLevel] = useState(1);

  // 8. Modals Visibility
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isBrushModalOpen, setIsBrushModalOpen] = useState(false);
  const [isLayersModalOpen, setIsLayersModalOpen] = useState(false);
  const [isRiggingModalOpen, setIsRiggingModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isImageImportModalOpen, setIsImageImportModalOpen] = useState(false);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState(false);
  const [isToolbarHidden, setIsToolbarHidden] = useState(false);

  // 9. Undo / Redo History Stack (Layer snapshots)
  const historyRef = useRef<{ layerId: string; data: ImageData }[][]>([]);
  const historyIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Take snapshot for undo
  const pushHistorySnapshot = useCallback(() => {
    const snapshot = layers.map((l) => ({
      layerId: l.id,
      data: l.ctx.getImageData(0, 0, l.canvas.width, l.canvas.height),
    }));

    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(snapshot);
    if (newHistory.length > 20) newHistory.shift();

    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, [layers]);

  // Initial history snapshot
  useEffect(() => {
    if (historyRef.current.length === 0 && layers.length > 0) {
      pushHistorySnapshot();
    }
  }, [layers, pushHistorySnapshot]);

  // Undo Action
  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const targetSnapshot = historyRef.current[historyIndexRef.current];

    for (const snap of targetSnapshot) {
      const targetLayer = layers.find((l) => l.id === snap.layerId);
      if (targetLayer) {
        targetLayer.ctx.putImageData(snap.data, 0, 0);
      }
    }
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    setLayers([...layers]);
  };

  // Redo Action
  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    const targetSnapshot = historyRef.current[historyIndexRef.current];

    for (const snap of targetSnapshot) {
      const targetLayer = layers.find((l) => l.id === snap.layerId);
      if (targetLayer) {
        targetLayer.ctx.putImageData(snap.data, 0, 0);
      }
    }
    setCanUndo(true);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    setLayers([...layers]);
  };

  // Layer Operations
  const handleAddLayer = () => {
    const newId = `layer_${Date.now()}`;
    const newName = `লেয়ার ${layers.length + 1}`;
    const newL = createLayer(newId, newName, canvasWidth, canvasHeight);
    const updated = [...layers, newL];
    setLayers(updated);
    setActiveLayerId(newId);
    pushHistorySnapshot();
  };

  const handleDuplicateLayer = (id: string) => {
    const target = layers.find((l) => l.id === id);
    if (!target) return;
    const dup = cloneLayer(target);
    const index = layers.findIndex((l) => l.id === id);
    const updated = [...layers];
    updated.splice(index + 1, 0, dup);
    setLayers(updated);
    setActiveLayerId(dup.id);
    pushHistorySnapshot();
  };

  const handleDeleteLayer = (id: string) => {
    if (layers.length <= 1) return;
    const updated = layers.filter((l) => l.id !== id);
    setLayers(updated);
    setActiveLayerId(updated[updated.length - 1].id);
    pushHistorySnapshot();
  };

  const handleToggleVisibility = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  const handleToggleLock = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l))
    );
  };

  const handleChangeOpacity = (id: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  };

  const handleChangeBlendMode = (id: string, blendMode: any) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, blendMode } : l))
    );
  };

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= layers.length) return;

    const next = [...layers];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    setLayers(next);
  };

  const handleRenameLayer = (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, name: trimmed } : l))
    );
  };

  const handleMergeDown = (id: string) => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx <= 0) return;

    const upper = layers[idx];
    const lower = layers[idx - 1];

    lower.ctx.save();
    lower.ctx.globalAlpha = upper.opacity;
    lower.ctx.globalCompositeOperation = upper.blendMode;
    lower.ctx.drawImage(upper.canvas, 0, 0);
    lower.ctx.restore();

    const updated = layers.filter((l) => l.id !== id);
    setLayers(updated);
    setActiveLayerId(lower.id);
    pushHistorySnapshot();
  };

  const handleClearActiveLayer = () => {
    const current = layers.find((l) => l.id === activeLayerId);
    if (!current) return;
    current.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    setLayers([...layers]);
    pushHistorySnapshot();
  };

  // Timeline / Frame Animation Controls
  const handleAddFrame = () => {
    // 1. If currently posing with rig, bake or capture pose before switching frame
    if (isRiggingActive && rigBindData && rigBindData.isBound) {
      const targetLayer =
        layers.find((l) => l.id === rigBindData.targetLayerId) ||
        layers.find((l) => l.id === activeLayerId);
      if (targetLayer) {
        targetLayer.ctx.clearRect(
          rigBindData.sourceBounds.x,
          rigBindData.sourceBounds.y,
          rigBindData.sourceBounds.w,
          rigBindData.sourceBounds.h
        );
        renderRiggedArtwork(targetLayer.ctx, rigBindData, rig.joints);
      }
    }

    // 2. Save current frame state first so onion skinning has the user's latest drawing!
    const updatedFrames = [...frames];
    updatedFrames[currentFrameIndex] = {
      ...updatedFrames[currentFrameIndex],
      layers: layers.map((l) => cloneLayer(l, l.id, l.name)),
      rigPose: rig?.joints.map((j) => ({ ...j })),
    };

    // 3. Build new frame layers: Keep stable layer IDs (layer_bg, layer_line, etc.)
    const newLayers = layers.map((l) => {
      const isBg =
        l.id === 'layer_bg' ||
        l.name.includes('Background') ||
        l.name.includes('ব্যাকগ্রাউন্ড');
      const fresh = createLayer(l.id, l.name, canvasWidth, canvasHeight);
      fresh.visible = l.visible;
      fresh.locked = l.locked;
      fresh.opacity = l.opacity;
      fresh.blendMode = l.blendMode;
      if (isBg) {
        // Guarantee clean solid white background
        fresh.ctx.fillStyle = '#ffffff';
        fresh.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
      return fresh;
    });

    // Guarantee that at least layer_bg or first layer has solid white background
    const bgFound = newLayers.some(
      (l) =>
        l.id === 'layer_bg' ||
        l.name.includes('Background') ||
        l.name.includes('ব্যাকগ্রাউন্ড')
    );
    if (!bgFound && newLayers.length > 0) {
      newLayers[0].ctx.fillStyle = '#ffffff';
      newLayers[0].ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    const timestamp = Date.now();
    const rand = Math.random().toString(36).substring(2, 8);
    const newF: AnimationFrame = {
      id: `frame_${timestamp}_${rand}`,
      name: `ফ্রেম ${updatedFrames.length + 1}`,
      layers: newLayers,
      rigPose: rig?.joints.map((j) => ({ ...j })),
    };

    const nextFrames = [...updatedFrames, newF];
    setFrames(nextFrames);
    setCurrentFrameIndex(nextFrames.length - 1);
    setLayers(newLayers);
    // Explicitly make sure drawing layer is active, NOT background!
    const drawingLayer =
      newLayers.find((l) => l.id !== 'layer_bg') || newLayers[newLayers.length - 1];
    setActiveLayerId(drawingLayer.id);
    setOnionSkin(true); // Automatically enable onion skin so artist can trace!
    setIsTimelineOpen(true);
    setRigBindData(null);
  };

  const handleDuplicateFrame = (index: number) => {
    // 1. Sync current frame
    const updatedFrames = [...frames];
    updatedFrames[currentFrameIndex] = {
      ...updatedFrames[currentFrameIndex],
      layers: layers.map((l) => cloneLayer(l, l.id, l.name)),
      rigPose: rig?.joints.map((j) => ({ ...j })),
    };

    const sourceF = updatedFrames[index];
    const timestamp = Date.now();
    const rand = Math.random().toString(36).substring(2, 8);
    const clonedLayers = sourceF.layers.map((l) => cloneLayer(l, l.id, l.name));
    const newF: AnimationFrame = {
      id: `frame_${timestamp}_${rand}`,
      name: `${sourceF.name} (কপি)`,
      layers: clonedLayers,
      rigPose: sourceF.rigPose?.map((j) => ({ ...j })),
    };

    updatedFrames.splice(index + 1, 0, newF);
    setFrames(updatedFrames);
    setCurrentFrameIndex(index + 1);
    setLayers(clonedLayers);
    const drawingLayer =
      clonedLayers.find((l) => l.id !== 'layer_bg') || clonedLayers[clonedLayers.length - 1];
    setActiveLayerId(drawingLayer.id);
    setOnionSkin(true);
    setRigBindData(null);
  };

  const handleDeleteFrame = (index: number) => {
    if (frames.length <= 1) return;
    const nextFrames = frames.filter((_, i) => i !== index);
    const newIdx = Math.max(0, Math.min(index, nextFrames.length - 1));
    setFrames(nextFrames);
    setCurrentFrameIndex(newIdx);
    setLayers(nextFrames[newIdx].layers);
    const drawingLayer =
      nextFrames[newIdx].layers.find((l) => l.id !== 'layer_bg') || nextFrames[newIdx].layers[0];
    setActiveLayerId(drawingLayer.id);
    setRigBindData(null);
  };

  const handleSelectFrame = (index: number) => {
    const updatedFrames = [...frames];
    updatedFrames[currentFrameIndex] = {
      ...updatedFrames[currentFrameIndex],
      layers: layers.map((l) => cloneLayer(l, l.id, l.name)),
      rigPose: rig?.joints.map((j) => ({ ...j })),
    };

    setCurrentFrameIndex(index);
    setLayers(updatedFrames[index].layers);
    const drawingLayer =
      updatedFrames[index].layers.find((l) => l.id !== 'layer_bg') || updatedFrames[index].layers[0];
    setActiveLayerId(drawingLayer.id);
    if (updatedFrames[index].rigPose && rig) {
      setRig({ ...rig, joints: updatedFrames[index].rigPose! });
    }
    setRigBindData(null);
  };

  // Playback loop
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => {
        const next = prev + 1;
        if (next >= frames.length) {
          if (!loop) {
            setIsPlaying(false);
            return prev;
          }
          return 0;
        }
        return next;
      });
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [isPlaying, frames.length, fps, loop]);

  // Sync displayed layers when playing
  useEffect(() => {
    if (isPlaying && frames[currentFrameIndex]) {
      setLayers(frames[currentFrameIndex].layers);
      if (frames[currentFrameIndex].rigPose && rig) {
        setRig((r) => (r ? { ...r, joints: frames[currentFrameIndex].rigPose! } : createEmptyRig()));
      }
    }
  }, [currentFrameIndex, isPlaying]);

  // Custom Rigging Actions on User's Drawing
  const handleAddCustomJoint = (x: number, y: number) => {
    const { newRig, newJointId } = addCustomJoint(rig, x, y, selectedJointId);
    setRig(newRig);
    setSelectedJointId(newJointId);

    // Auto-bind drawing on the active drawing layer
    let targetLayer = layers.find((l) => l.id === activeLayerId && l.id !== 'layer_bg');
    if (!targetLayer) {
      targetLayer = layers.find((l) => l.id !== 'layer_bg' && l.visible);
    }
    if (!targetLayer) {
      targetLayer = layers[layers.length - 1];
    }
    if (targetLayer && newRig.joints.length >= 1) {
      const bind = createRigBinding(targetLayer.ctx, newRig, targetLayer.id);
      if (bind) {
        setRigBindData(bind);
      }
    }
  };

  const handleDeleteSelectedJoint = () => {
    if (!selectedJointId) return;
    const updatedRig = deleteJoint(rig, selectedJointId);
    setRig(updatedRig);
    setSelectedJointId(null);
    if (updatedRig.joints.length === 0) {
      setRigBindData(null);
    }
  };

  const handleClearAllBones = () => {
    setRig(createEmptyRig());
    setSelectedJointId(null);
    setRigBindData(null);
  };

  const handleBakeRigToLayer = (style: 'mannequin' | 'guide') => {
    if (!rig || rig.joints.length === 0) return;
    const current = layers.find((l) => l.id === activeLayerId);
    if (!current) return;
    bakeCustomRigToLayer(current.ctx, rig, style);
    setLayers([...layers]);
    pushHistorySnapshot();
  };

  const handleCommitStroke = useCallback(() => {
    pushHistorySnapshot();
    // Keep current frame synced with latest canvas drawing in real time
    setFrames((prevFrames) => {
      const updated = [...prevFrames];
      if (updated[currentFrameIndex]) {
        updated[currentFrameIndex] = {
          ...updated[currentFrameIndex],
          layers: layers.map((l) => cloneLayer(l, l.id, l.name)),
          rigPose: rig?.joints.map((j) => ({ ...j })),
        };
      }
      return updated;
    });
  }, [pushHistorySnapshot, layers, currentFrameIndex, rig]);

  const handleBindRig = () => {
    let targetLayer = layers.find((l) => l.id === activeLayerId && l.id !== 'layer_bg');
    if (!targetLayer) {
      targetLayer = layers.find((l) => l.id !== 'layer_bg' && l.visible);
    }
    if (!targetLayer) {
      targetLayer = layers[layers.length - 1];
    }
    if (!targetLayer || !rig || rig.joints.length === 0) return;

    const bind = createRigBinding(targetLayer.ctx, rig, targetLayer.id);
    if (bind) {
      setRigBindData(bind);
      setActiveLayerId(targetLayer.id);
      setRigInteraction('pose_bone');
    }
  };

  const handleApplyPose = () => {
    if (!rigBindData || !rigBindData.isBound) return;
    const target =
      layers.find((l) => l.id === rigBindData.targetLayerId) ||
      layers.find((l) => l.id === activeLayerId) ||
      layers[0];
    if (!target) return;

    // Clear original area and stamp deformed pose onto active layer!
    target.ctx.clearRect(
      rigBindData.sourceBounds.x,
      rigBindData.sourceBounds.y,
      rigBindData.sourceBounds.w,
      rigBindData.sourceBounds.h
    );
    renderRiggedArtwork(target.ctx, rigBindData, rig.joints);

    // Re-bind to current stamped pose so user can continue posing or drawing!
    const newBind = createRigBinding(target.ctx, rig, target.id);
    setRigBindData(newBind);
    setLayers([...layers]);
    pushHistorySnapshot();
  };

  const handleResetPose = () => {
    if (!rigBindData) return;
    setRig((r) => ({
      ...r,
      joints: rigBindData.initialJoints.map((j) => ({ ...j })),
    }));
  };

  // Single Movement / Transform Actions
  const handleApplyTransform = () => {
    if (!selectionTransform.isActive || !selectionTransform.sourceCanvas) return;
    const targetLayer = layers.find((l) => l.id === (selectionTransform.originalLayerId || activeLayerId));
    if (!targetLayer) return;

    targetLayer.ctx.save();
    targetLayer.ctx.imageSmoothingEnabled = true;
    targetLayer.ctx.imageSmoothingQuality = 'high';
    targetLayer.ctx.translate(
      selectionTransform.x + (selectionTransform.width * selectionTransform.scaleX) / 2,
      selectionTransform.y + (selectionTransform.height * selectionTransform.scaleY) / 2
    );
    targetLayer.ctx.rotate((selectionTransform.rotation * Math.PI) / 180);
    targetLayer.ctx.scale(selectionTransform.scaleX, selectionTransform.scaleY);
    targetLayer.ctx.drawImage(
      selectionTransform.sourceCanvas,
      -selectionTransform.width / 2,
      -selectionTransform.height / 2,
      selectionTransform.width,
      selectionTransform.height
    );
    targetLayer.ctx.restore();

    setSelectionTransform({
      isActive: false,
      mode: 'lasso',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      sourceCanvas: null,
      originalLayerId: null,
    });

    setLayers([...layers]);
    pushHistorySnapshot();
  };

  const handleCancelTransform = () => {
    if (!selectionTransform.isActive || !selectionTransform.sourceCanvas) return;
    const targetLayer = layers.find((l) => l.id === selectionTransform.originalLayerId);
    if (targetLayer) {
      targetLayer.ctx.save();
      targetLayer.ctx.imageSmoothingEnabled = true;
      targetLayer.ctx.imageSmoothingQuality = 'high';
      targetLayer.ctx.drawImage(
        selectionTransform.sourceCanvas,
        selectionTransform.x,
        selectionTransform.y,
        selectionTransform.width,
        selectionTransform.height
      );
      targetLayer.ctx.restore();
    }
    setSelectionTransform({
      isActive: false,
      mode: 'lasso',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      sourceCanvas: null,
      originalLayerId: null,
    });
    setLayers([...layers]);
  };

  const handleDuplicateSelection = () => {
    if (!selectionTransform.isActive || !selectionTransform.sourceCanvas) return;
    const targetLayer = layers.find((l) => l.id === activeLayerId);
    if (!targetLayer) return;

    targetLayer.ctx.save();
    targetLayer.ctx.imageSmoothingEnabled = true;
    targetLayer.ctx.imageSmoothingQuality = 'high';
    targetLayer.ctx.translate(
      selectionTransform.x + (selectionTransform.width * selectionTransform.scaleX) / 2,
      selectionTransform.y + (selectionTransform.height * selectionTransform.scaleY) / 2
    );
    targetLayer.ctx.rotate((selectionTransform.rotation * Math.PI) / 180);
    targetLayer.ctx.scale(selectionTransform.scaleX, selectionTransform.scaleY);
    targetLayer.ctx.drawImage(
      selectionTransform.sourceCanvas,
      -selectionTransform.width / 2,
      -selectionTransform.height / 2,
      selectionTransform.width,
      selectionTransform.height
    );
    targetLayer.ctx.restore();

    setSelectionTransform({
      ...selectionTransform,
      x: selectionTransform.x + 30,
      y: selectionTransform.y + 30,
    });
    setLayers([...layers]);
  };

  const handleDeleteSelection = () => {
    if (!selectionTransform.isActive) return;
    // The selected area was cut from the layer upon selection; discarding it permanently removes it.
    setSelectionTransform({
      isActive: false,
      mode: 'lasso',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      sourceCanvas: null,
      originalLayerId: null,
    });
    setLayers([...layers]);
    pushHistorySnapshot();
  };

  // Image Import Handling with High-Res preservation and Frame/Layer targets
  const handleImportImage = (
    images: HTMLImageElement[],
    target: ImageImportTarget
  ) => {
    if (!images || images.length === 0) return;

    // Sequence import for multiple animation frames
    if (target === 'frame_sequence' || (images.length > 1 && target === 'new_frame')) {
      const newFrames = [...frames];
      const startIdx = frames.length;

      images.forEach((img, idx) => {
        const frameId = `frame_seq_${Date.now()}_${idx}`;
        const bgLayer = createLayer(`bg_${frameId}`, 'ব্যাকগ্রাউন্ড (Background)', canvasWidth, canvasHeight);
        bgLayer.ctx.fillStyle = '#ffffff';
        bgLayer.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const imgLayer = createLayer(`img_${frameId}`, `ইম্পোর্ট ফ্রেম #${newFrames.length + 1}`, canvasWidth, canvasHeight);
        imgLayer.ctx.imageSmoothingEnabled = true;
        imgLayer.ctx.imageSmoothingQuality = 'high';

        const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const x = Math.round((canvasWidth - w) / 2);
        const y = Math.round((canvasHeight - h) / 2);

        imgLayer.ctx.drawImage(img, x, y, w, h);

        const drawLayer = createLayer(`draw_${frameId}`, 'ড্রয়িং লেয়ার', canvasWidth, canvasHeight);

        newFrames.push({
          id: frameId,
          name: `ফ্রেম ${newFrames.length + 1}`,
          layers: [bgLayer, imgLayer, drawLayer],
        });
      });

      setFrames(newFrames);
      handleSelectFrame(startIdx);
      return;
    }

    const img = images[0];
    const imgCanvas = document.createElement('canvas');
    imgCanvas.width = img.width;
    imgCanvas.height = img.height;
    const ictx = imgCanvas.getContext('2d')!;
    ictx.imageSmoothingEnabled = true;
    ictx.imageSmoothingQuality = 'high';
    ictx.drawImage(img, 0, 0);

    const maxDimension = Math.min(canvasWidth * 0.75, canvasHeight * 0.75);
    const scale = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
    const targetW = Math.round(img.width * scale);
    const targetH = Math.round(img.height * scale);
    const posX = Math.round((canvasWidth - targetW) / 2);
    const posY = Math.round((canvasHeight - targetH) / 2);

    if (target === 'active_layer') {
      const targetLayer = layers.find((l) => l.id === activeLayerId) || layers[layers.length - 1];
      if (targetLayer) {
        targetLayer.ctx.save();
        targetLayer.ctx.imageSmoothingEnabled = true;
        targetLayer.ctx.imageSmoothingQuality = 'high';
        targetLayer.ctx.drawImage(img, posX, posY, targetW, targetH);
        targetLayer.ctx.restore();
        setLayers([...layers]);
        pushHistorySnapshot();
      }
    } else if (target === 'new_layer' || target === 'reference') {
      const newLayer = createLayer(
        `layer_img_${Date.now()}`,
        target === 'reference' ? 'রেফারেন্স ট্রেসিং ফটো' : `ইম্পোর্ট ছবি (${img.width}x${img.height})`,
        canvasWidth,
        canvasHeight
      );
      if (target === 'reference') {
        newLayer.opacity = 0.5;
      }
      newLayer.ctx.imageSmoothingEnabled = true;
      newLayer.ctx.imageSmoothingQuality = 'high';
      newLayer.ctx.drawImage(img, posX, posY, targetW, targetH);
      const next = [...layers, newLayer];
      setLayers(next);
      setActiveLayerId(newLayer.id);
      pushHistorySnapshot();
    } else if (target === 'new_frame') {
      const newFrameId = `frame_${Date.now()}_img`;
      const bg = createLayer(`bg_${newFrameId}`, 'ব্যাকগ্রাউন্ড (Background)', canvasWidth, canvasHeight);
      bg.ctx.fillStyle = '#ffffff';
      bg.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const imgLayer = createLayer(`img_${newFrameId}`, 'ইম্পোর্ট করা ইমেজ', canvasWidth, canvasHeight);
      imgLayer.ctx.imageSmoothingEnabled = true;
      imgLayer.ctx.imageSmoothingQuality = 'high';
      imgLayer.ctx.drawImage(img, posX, posY, targetW, targetH);

      const drawLayer = createLayer(`draw_${newFrameId}`, 'ড্রয়িং লেয়ার', canvasWidth, canvasHeight);

      const updatedFrames = [
        ...frames,
        {
          id: newFrameId,
          name: `ফ্রেম ${frames.length + 1}`,
          layers: [bg, imgLayer, drawLayer],
        },
      ];
      setFrames(updatedFrames);
      handleSelectFrame(updatedFrames.length - 1);
    } else {
      // Interactive Transform & Place (User can resize, move, rotate without losing image quality)
      setBrushConfig((c) => ({ ...c, type: 'select_move' }));
      setSelectionTransform({
        isActive: true,
        mode: 'box',
        x: posX,
        y: posY,
        width: targetW,
        height: targetH,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        sourceCanvas: imgCanvas,
        originalLayerId: activeLayerId,
        originalWidth: img.width,
        originalHeight: img.height,
        keepAspectRatio: true,
      });
    }
  };

  // Canvas Crop & Resize
  const handleApplyCrop = (cropBox: { x: number; y: number; width: number; height: number }) => {
    const newLayers = layers.map((layer) => {
      const nextL = createLayer(layer.id, layer.name, cropBox.width, cropBox.height);
      nextL.visible = layer.visible;
      nextL.locked = layer.locked;
      nextL.opacity = layer.opacity;
      nextL.blendMode = layer.blendMode;
      nextL.ctx.imageSmoothingEnabled = true;
      nextL.ctx.imageSmoothingQuality = 'high';
      nextL.ctx.drawImage(
        layer.canvas,
        cropBox.x,
        cropBox.y,
        cropBox.width,
        cropBox.height,
        0,
        0,
        cropBox.width,
        cropBox.height
      );
      return nextL;
    });

    setCurrentResolution({
      label: `Custom ${cropBox.width}x${cropBox.height}`,
      bengaliLabel: `ক্রপ করা ক্যানভাস (${cropBox.width}x${cropBox.height})`,
      width: cropBox.width,
      height: cropBox.height,
      tag: `${cropBox.width}p`,
      category: 'standard',
    });

    setLayers(newLayers);
    pushHistorySnapshot();
  };

  // Resolution Change with Complete Multi-Frame Rescaling
  const handleSelectResolution = (res: ResolutionPreset) => {
    setCurrentResolution(res);

    const rescaledLayers = layers.map((layer) => {
      const newL = createLayer(layer.id, layer.name, res.width, res.height);
      newL.visible = layer.visible;
      newL.locked = layer.locked;
      newL.opacity = layer.opacity;
      newL.blendMode = layer.blendMode;
      newL.ctx.imageSmoothingEnabled = true;
      newL.ctx.imageSmoothingQuality = 'high';
      newL.ctx.drawImage(layer.canvas, 0, 0, res.width, res.height);
      return newL;
    });

    const rescaledFrames = frames.map((frame, fIdx) => {
      if (fIdx === currentFrameIndex) {
        return { ...frame, layers: rescaledLayers };
      }
      const nextLayers = frame.layers.map((l) => {
        const newL = createLayer(l.id, l.name, res.width, res.height);
        newL.visible = l.visible;
        newL.locked = l.locked;
        newL.opacity = l.opacity;
        newL.blendMode = l.blendMode;
        newL.ctx.imageSmoothingEnabled = true;
        newL.ctx.imageSmoothingQuality = 'high';
        newL.ctx.drawImage(l.canvas, 0, 0, res.width, res.height);
        return newL;
      });
      return { ...frame, layers: nextLayers };
    });

    setLayers(rescaledLayers);
    setFrames(rescaledFrames);
    pushHistorySnapshot();
  };

  // 8K Ultra Quality Mode Quick Toggle (7680x4320)
  const handleToggle8K = () => {
    if (currentResolution.tag === '8K') {
      // Toggle back to 1080p
      handleSelectResolution(RESOLUTION_PRESETS[4]);
    } else {
      // Switch to 8K Ultra High (7680x4320)
      const res8k = RESOLUTION_PRESETS.find((r) => r.tag === '8K') || RESOLUTION_PRESETS[7];
      handleSelectResolution(res8k);
    }
  };

  // Keyboard Shortcuts: Delete/Backspace to delete selection, Enter to apply, Esc to cancel, Tab/H for toolbar, Ctrl+Z/Y for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectionTransform.isActive) {
          e.preventDefault();
          handleDeleteSelection();
          return;
        }
      }

      if (e.key === 'Escape' && selectionTransform.isActive) {
        e.preventDefault();
        handleCancelTransform();
        return;
      }

      if (e.key === 'Enter' && selectionTransform.isActive) {
        e.preventDefault();
        handleApplyTransform();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        setIsToolbarHidden((prev) => !prev);
      } else if (e.key === 'h' || e.key === 'H') {
        setIsToolbarHidden((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectionTransform.isActive, handleApplyTransform, handleCancelTransform, handleDeleteSelection]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-white select-none">
      {/* Top Bar with mobile ergonomics */}
      <TopBar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onResetZoom={() => setZoomLevel(1)}
        zoomLevel={zoomLevel}
        activeLayerName={layers.find((l) => l.id === activeLayerId)?.name || 'লেয়ার'}
        totalLayers={layers.length}
        onOpenLayers={() => setIsLayersModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenSettings={() => setIsBrushModalOpen(true)}
        onOpenImageImport={() => setIsImageImportModalOpen(true)}
        onToggleTimeline={() => setIsTimelineOpen(!isTimelineOpen)}
        isTimelineOpen={isTimelineOpen}
        currentResolution={currentResolution}
        onOpenResolution={() => setIsResolutionModalOpen(true)}
        onToggle8K={handleToggle8K}
        isRiggingActive={isRiggingActive}
        onToggleRigging={() => {
          setIsRiggingActive(!isRiggingActive);
          if (!isRiggingActive) {
            setRigInteraction('add_bone');
          }
        }}
        onToggleHideToolbar={() => setIsToolbarHidden((prev) => !prev)}
        onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
      />

      {/* Main Drawing Canvas Viewport */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <CanvasArea
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          layers={layers}
          activeLayerId={activeLayerId}
          brushConfig={brushConfig}
          frames={frames}
          currentFrameIndex={currentFrameIndex}
          onionSkin={onionSkin}
          rig={rig}
          isRiggingActive={isRiggingActive}
          rigInteraction={rigInteraction}
          onChangeRigInteraction={setRigInteraction}
          selectedJointId={selectedJointId}
          onSelectJoint={setSelectedJointId}
          onAddCustomJoint={handleAddCustomJoint}
          onUpdateRigJoints={(updated) => setRig((prev) => ({ ...prev, joints: updated }))}
          onDeleteSelectedJoint={handleDeleteSelectedJoint}
          onClearAllBones={handleClearAllBones}
          onBakeRigToLayer={handleBakeRigToLayer}
          onCloseRigging={() => setIsRiggingActive(false)}
          rigBindData={rigBindData}
          onBindRig={handleBindRig}
          onApplyPose={handleApplyPose}
          onResetPose={handleResetPose}
          selectionTransform={selectionTransform}
          onUpdateSelectionTransform={(partial) =>
            setSelectionTransform((prev) => ({ ...prev, ...partial }))
          }
          onApplySelectionTransform={handleApplyTransform}
          onCancelSelectionTransform={handleCancelTransform}
          onDuplicateSelectionTransform={handleDuplicateSelection}
          onDeleteSelectionTransform={handleDeleteSelection}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          onCommitStroke={handleCommitStroke}
        />
      </main>

      {/* Frame Animation Timeline Strip */}
      <AnimationTimeline
        isOpen={isTimelineOpen}
        frames={frames}
        currentFrameIndex={currentFrameIndex}
        isPlaying={isPlaying}
        fps={fps}
        loop={loop}
        onionSkin={onionSkin}
        onSelectFrame={handleSelectFrame}
        onAddFrame={handleAddFrame}
        onOpenImageImport={() => setIsImageImportModalOpen(true)}
        onDuplicateFrame={handleDuplicateFrame}
        onDeleteFrame={handleDeleteFrame}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onToggleLoop={() => setLoop(!loop)}
        onToggleOnionSkin={() => setOnionSkin(!onionSkin)}
        onChangeFps={setFps}
      />

      {/* Bottom Primary Tool Bar with smooth hide/show toggle */}
      <div
        className={`transition-all duration-300 ease-in-out transform ${
          isToolbarHidden
            ? 'translate-y-28 opacity-0 pointer-events-none'
            : 'translate-y-0 opacity-100'
        }`}
      >
        <Toolbar
          brushConfig={brushConfig}
          onSelectTool={(tool) => {
            setBrushConfig((c) => ({ ...c, type: tool }));
            if (tool !== 'rigging') {
              setIsRiggingActive(false);
            }
          }}
          onOpenBrushSettings={() => setIsBrushModalOpen(true)}
          onOpenColorPalette={() => setIsColorModalOpen(true)}
          onOpenCrop={() => setIsCropModalOpen(true)}
          onToggleRigging={() => {
            setIsRiggingActive(!isRiggingActive);
            if (!isRiggingActive) {
              setRigInteraction('add_bone');
            }
          }}
          isRiggingActive={isRiggingActive}
          onHideToolbar={() => setIsToolbarHidden(true)}
        />
      </div>

      {/* Floating Restore Toolbar Button for Zen Fullscreen Drawing Mode */}
      {isToolbarHidden && (
        <button
          onClick={() => setIsToolbarHidden(false)}
          title="টুলবার দেখান (Tab বা H চাপুন)"
          className="fixed bottom-4 right-4 z-40 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-xl shadow-purple-900/50 border border-purple-400/40 flex items-center gap-2 transition-all active:scale-95 animate-pulse"
        >
          <Eye className="w-4 h-4 text-purple-200" />
          <span>টুলবার দেখান</span>
          <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded font-mono">Tab</span>
        </button>
      )}

      {/* Modals & Panels */}
      <ColorPaletteModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        brushConfig={brushConfig}
        onUpdateConfig={(partial) => setBrushConfig((c) => ({ ...c, ...partial }))}
      />

      <BrushSettingsPanel
        isOpen={isBrushModalOpen}
        onClose={() => setIsBrushModalOpen(false)}
        brushConfig={brushConfig}
        onUpdateConfig={(partial) => setBrushConfig((c) => ({ ...c, ...partial }))}
        onClearActiveLayer={handleClearActiveLayer}
      />

      <LayersPanel
        isOpen={isLayersModalOpen}
        onClose={() => setIsLayersModalOpen(false)}
        layers={layers}
        activeLayerId={activeLayerId}
        onSelectLayer={setActiveLayerId}
        onAddLayer={handleAddLayer}
        onOpenImageImport={() => setIsImageImportModalOpen(true)}
        onDuplicateLayer={handleDuplicateLayer}
        onDeleteLayer={handleDeleteLayer}
        onToggleVisibility={handleToggleVisibility}
        onToggleLock={handleToggleLock}
        onChangeOpacity={handleChangeOpacity}
        onChangeBlendMode={handleChangeBlendMode}
        onMoveLayer={handleMoveLayer}
        onMergeDown={handleMergeDown}
        onRenameLayer={handleRenameLayer}
      />

      <RiggingPanel
        isOpen={isRiggingModalOpen}
        onClose={() => setIsRiggingModalOpen(false)}
        rig={rig}
        rigInteraction={rigInteraction}
        onChangeRigInteraction={setRigInteraction}
        selectedJointId={selectedJointId}
        onDeleteSelectedJoint={handleDeleteSelectedJoint}
        onClearAllBones={handleClearAllBones}
        onBakeToLayer={handleBakeRigToLayer}
        onToggleRigVisibility={() => setRig((prev) => ({ ...prev, visible: !prev.visible }))}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        layers={layers}
        frames={frames}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        fps={fps}
      />

      <CropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        onApplyCrop={handleApplyCrop}
      />

      <ImageImportModal
        isOpen={isImageImportModalOpen}
        onClose={() => setIsImageImportModalOpen(false)}
        onImportImage={handleImportImage}
      />

      <ResolutionModal
        isOpen={isResolutionModalOpen}
        onClose={() => setIsResolutionModalOpen(false)}
        currentResolution={currentResolution}
        onSelectResolution={handleSelectResolution}
      />

      <DeploymentGuideModal
        isOpen={isDeployGuideOpen}
        onClose={() => setIsDeployGuideOpen(false)}
      />
    </div>
  );
}
