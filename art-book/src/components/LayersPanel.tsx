import React, { useState } from 'react';
import {
  X,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Layers,
  ChevronDown,
  Image as ImageIcon,
  Pencil,
  Check,
} from 'lucide-react';
import { BlendMode, CanvasLayer } from '../types/canvas';

interface LayersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  layers: CanvasLayer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onOpenImageImport: () => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  onChangeBlendMode: (id: string, mode: BlendMode) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onMergeDown: (id: string) => void;
  onRenameLayer: (id: string, newName: string) => void;
}

const BLEND_MODES: { mode: BlendMode; label: string }[] = [
  { mode: 'source-over', label: 'নরমাল (Normal)' },
  { mode: 'multiply', label: 'মাল্টিপ্লাই (ছায়া)' },
  { mode: 'screen', label: 'স্ক্রিন (আলো)' },
  { mode: 'overlay', label: 'ওভারলে' },
  { mode: 'color-dodge', label: 'কালার ডজ (গ্লো)' },
  { mode: 'color-burn', label: 'কালার বার্ন' },
  { mode: 'hard-light', label: 'হার্ড লাইট' },
  { mode: 'soft-light', label: 'সফট লাইট' },
  { mode: 'difference', label: 'ডিফারেন্স' },
];

export const LayersPanel: React.FC<LayersPanelProps> = ({
  isOpen,
  onClose,
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onOpenImageImport,
  onDuplicateLayer,
  onDeleteLayer,
  onToggleVisibility,
  onToggleLock,
  onChangeOpacity,
  onChangeBlendMode,
  onMoveLayer,
  onMergeDown,
  onRenameLayer,
}) => {
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];
  const activeIndex = layers.findIndex((l) => l.id === activeLayerId);

  const handleStartRename = (id: string, currentName: string) => {
    setEditingLayerId(id);
    setEditingName(currentName);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      onRenameLayer(id, editingName.trim());
    }
    setEditingLayerId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700/80 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-semibold text-white">লেয়ার প্যানেল (Layers)</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenImageImport}
              title="লেয়ারে ছবি ইম্পোর্ট করুন (Import Image to Layer)"
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 text-xs px-2 font-medium active:scale-95 transition-all shadow-md shadow-emerald-600/20"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>ছবি</span>
            </button>
            <button
              onClick={onAddLayer}
              title="নতুন লেয়ার যোগ করুন"
              className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1 text-xs px-2 font-medium active:scale-95 transition-all shadow-md shadow-sky-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Layer Properties Box */}
        {activeLayer && (
          <div className="p-3 bg-neutral-950/60 border-b border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate max-w-[55%]">
                <span className="text-xs text-neutral-400 font-medium flex-shrink-0">সিলেক্টেড:</span>
                <button
                  onClick={() => handleStartRename(activeLayer.id, activeLayer.name)}
                  title="লেয়ারের নাম পরিবর্তন করুন (Rename)"
                  className="text-xs text-sky-300 font-semibold truncate hover:underline flex items-center gap-1 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-800/60 hover:border-sky-500 active:scale-95 transition-all"
                >
                  <span className="truncate">{activeLayer.name}</span>
                  <Pencil className="w-3 h-3 text-sky-400 flex-shrink-0" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onMoveLayer(activeLayer.id, 'up')}
                  disabled={activeIndex === layers.length - 1}
                  title="লেয়ার উপরে নিন"
                  className="p-1 rounded bg-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onMoveLayer(activeLayer.id, 'down')}
                  disabled={activeIndex === 0}
                  title="লেয়ার নিচে নিন"
                  className="p-1 rounded bg-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDuplicateLayer(activeLayer.id)}
                  title="লেয়ার ডুপ্লিকেট করুন"
                  className="p-1 rounded bg-neutral-800 text-neutral-300 hover:text-white active:scale-90"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {activeIndex > 0 && (
                  <button
                    onClick={() => onMergeDown(activeLayer.id)}
                    title="নিচের লেয়ারের সাথে একত্র (Merge Down)"
                    className="px-1.5 py-1 rounded bg-neutral-800 text-[10px] text-sky-300 hover:text-white"
                  >
                    মার্জ
                  </button>
                )}
                {layers.length > 1 && (
                  <button
                    onClick={() => onDeleteLayer(activeLayer.id)}
                    title="লেয়ার মুছে ফেলুন"
                    className="p-1 rounded bg-neutral-800 text-red-400 hover:text-red-300 active:scale-90"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Opacity & Blend Mode Row */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>অপাসিটি:</span>
                  <span className="font-mono text-sky-400">{Math.round(activeLayer.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={activeLayer.opacity}
                  onChange={(e) => onChangeOpacity(activeLayer.id, parseFloat(e.target.value))}
                  className="w-full accent-sky-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">ব্লেন্ডিং মুড:</label>
                <div className="relative">
                  <select
                    value={activeLayer.blendMode}
                    onChange={(e) => onChangeBlendMode(activeLayer.id, e.target.value as BlendMode)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-neutral-200 appearance-none pr-6 font-medium"
                  >
                    {BLEND_MODES.map((b) => (
                      <option key={b.mode} value={b.mode}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layers Stack List (rendered from top to bottom) */}
        <div className="p-3 overflow-y-auto space-y-1.5 flex-1">
          {layers
            .slice()
            .reverse()
            .map((layer) => {
              const isSelected = layer.id === activeLayerId;

              return (
                <div
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-500 shadow-sm'
                      : 'bg-neutral-800/60 border-neutral-700/60 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {/* Layer Preview / Canvas Mini Icon */}
                    <div className="w-10 h-10 rounded-lg bg-neutral-950 border border-neutral-700 checker-pattern flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                      <span className="text-[9px] font-mono text-neutral-500">
                        {layer.name.slice(0, 3)}
                      </span>
                    </div>

                    <div className="truncate flex-1 min-w-0">
                      {editingLayerId === layer.id ? (
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(layer.id);
                              if (e.key === 'Escape') setEditingLayerId(null);
                            }}
                            autoFocus
                            className="bg-neutral-950 border border-sky-400 rounded px-1.5 py-0.5 text-xs text-white outline-none w-28 sm:w-36 font-semibold"
                            placeholder="লেয়ারের নাম..."
                          />
                          <button
                            onClick={() => handleSaveRename(layer.id)}
                            title="সেভ করুন"
                            className="p-1 rounded bg-sky-600 hover:bg-sky-500 text-white active:scale-90"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1.5 group/rename"
                          onDoubleClick={() => handleStartRename(layer.id, layer.name)}
                        >
                          <span
                            className={`text-xs font-semibold truncate ${
                              isSelected ? 'text-sky-300' : 'text-neutral-200'
                            }`}
                          >
                            {layer.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(layer.id, layer.name);
                            }}
                            title="লেয়ার রিনেম করুন (Rename Layer)"
                            className="p-0.5 rounded text-neutral-400 hover:text-sky-300 hover:bg-neutral-700/80 transition-all opacity-80 sm:opacity-0 sm:group-hover/rename:opacity-100 flex-shrink-0"
                          >
                            <Pencil className="w-3 h-3 text-sky-400" />
                          </button>
                        </div>
                      )}
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {Math.round(layer.opacity * 100)}% • {layer.blendMode}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Visibility & Lock */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleVisibility(layer.id)}
                      title={layer.visible ? 'লেয়ার লুকান' : 'লেয়ার দেখান'}
                      className={`p-1.5 rounded-lg transition-all ${
                        layer.visible
                          ? 'text-neutral-300 hover:bg-neutral-700'
                          : 'text-neutral-600 hover:bg-neutral-800'
                      }`}
                    >
                      {layer.visible ? <Eye className="w-4 h-4 text-sky-400" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => onToggleLock(layer.id)}
                      title={layer.locked ? 'আনলক করুন' : 'লক করুন'}
                      className={`p-1.5 rounded-lg transition-all ${
                        layer.locked
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-neutral-500 hover:bg-neutral-700'
                      }`}
                    >
                      {layer.locked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/90 flex justify-between items-center text-xs text-neutral-400">
          <span>মোট লেয়ার: {layers.length}</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg active:scale-95 transition-all"
          >
            সম্পন্ন
          </button>
        </div>
      </div>
    </div>
  );
};
