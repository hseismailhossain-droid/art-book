import React from 'react';
import {
  X,
  Bone,
  Plus,
  Move,
  Trash2,
  Stamp,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import { RigInteraction, SkeletonRig } from '../types/canvas';

interface RiggingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  rig: SkeletonRig | null;
  rigInteraction: RigInteraction;
  onChangeRigInteraction: (mode: RigInteraction) => void;
  selectedJointId: string | null;
  onDeleteSelectedJoint: () => void;
  onClearAllBones: () => void;
  onBakeToLayer: (style: 'mannequin' | 'guide') => void;
  onToggleRigVisibility: () => void;
}

export const RiggingPanel: React.FC<RiggingPanelProps> = ({
  isOpen,
  onClose,
  rig,
  rigInteraction,
  onChangeRigInteraction,
  selectedJointId,
  onDeleteSelectedJoint,
  onClearAllBones,
  onBakeToLayer,
  onToggleRigVisibility,
}) => {
  if (!isOpen) return null;

  const jointCount = rig?.joints.length || 0;
  const boneCount = rig?.bones.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700/80 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Bone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">কাস্টম হাড় ও রিগিং টুল</h2>
              <span className="text-[10px] text-neutral-400">ড্রয়িং এর ওপর নিজের মতো হাড় বসান</span>
            </div>
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
          {/* Status Banner */}
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-xs font-semibold text-cyan-200">মোট হাড়ের জয়েন্ট: {jointCount} টি</span>
                <p className="text-[10px] text-cyan-300/80">কানেকশন হাড়: {boneCount} টি</p>
              </div>
            </div>

            {jointCount > 0 && (
              <button
                onClick={onClearAllBones}
                title="সব হাড় মুছে নতুন করে শুরু করুন"
                className="px-2 py-1 rounded-lg bg-red-950/50 hover:bg-red-900/50 border border-red-800 text-red-300 text-[11px] flex items-center gap-1 active:scale-95 transition-all"
              >
                <Trash2 className="w-3 h-3" />
                <span>রিসেট</span>
              </button>
            )}
          </div>

          {/* Mode Selector */}
          <div>
            <span className="text-xs text-neutral-400 block mb-2 font-medium">
              মোড নির্বাচন করুন:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onChangeRigInteraction('add_bone')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all active:scale-95 ${
                  rigInteraction === 'add_bone'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/10'
                    : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-750'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    rigInteraction === 'add_bone' ? 'bg-cyan-500 text-black' : 'bg-neutral-700 text-cyan-400'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold">হাড় বসান (Add Bone)</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    ক্যানভাসে ড্রয়িং এর ওপর ট্যাপ করে হাড় যোগ করুন
                  </div>
                </div>
              </button>

              <button
                onClick={() => onChangeRigInteraction('pose_bone')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all active:scale-95 ${
                  rigInteraction === 'pose_bone'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/10'
                    : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-750'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    rigInteraction === 'pose_bone' ? 'bg-cyan-500 text-black' : 'bg-neutral-700 text-cyan-400'
                  }`}
                >
                  <Move className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold">পোজ ও মুভ (Move Rig)</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    যেকোনো হাড়ের জয়েন্ট ড্র্যাগ করে নাড়াচাড়া করুন
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="p-3 bg-neutral-800/70 border border-neutral-700/80 rounded-xl space-y-1.5 text-xs text-neutral-300">
            <span className="font-semibold text-white flex items-center gap-1.5">
              💡 কীভাবে ব্যবহার করবেন:
            </span>
            <ul className="text-[11px] text-neutral-400 space-y-1 list-disc list-inside">
              <li>আপনার আঁকা অবজেক্টের কাঁধ, কনুই বা হাত যেখানে ইচ্ছে সেখানে সরাসরি ট্যাপ করলেই একটির পর একটি হাড়ের জয়েন্ট জুড়ে যাবে।</li>
              <li>অন্য কোনো নতুন ডাল বা পা শুরু করতে যেকোনো পুরোনো জয়েন্টে ট্যাপ করে সিলেক্ট করুন।</li>
              <li>এরপর <strong>'পোজ ও মুভ'</strong> দিয়ে জয়েন্টগুলো নাড়িয়ে চরিত্র বা বস্তুটি ইচ্ছেমতো বাঁকান!</li>
            </ul>
          </div>

          {/* Selected Joint Actions */}
          {selectedJointId && (
            <div className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-between">
              <span className="text-xs text-neutral-300">একটি হাড় সিলেক্ট করা আছে</span>
              <button
                onClick={onDeleteSelectedJoint}
                className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-800 text-red-300 text-xs flex items-center gap-1 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>এই হাড় মুছুন</span>
              </button>
            </div>
          )}

          {/* Stamp to Layer */}
          {jointCount > 0 && (
            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <span className="text-xs text-neutral-400 block font-medium">
                ক্যানভাস লেয়ারে হাড়ের দাগ বসান:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onBakeToLayer('mannequin');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-cyan-600/20"
                >
                  <Stamp className="w-4 h-4" />
                  <span>বডি হাড় আঁকুন</span>
                </button>

                <button
                  onClick={() => {
                    onBakeToLayer('guide');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <span>গাইড লাইন বসান</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/90 flex justify-between items-center">
          <button
            onClick={onToggleRigVisibility}
            className="text-xs text-neutral-400 hover:text-white"
          >
            {rig?.visible ? '👁️ হাড় লুকান' : '👁️ হাড় দেখান'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-medium active:scale-95 transition-all"
          >
            সম্পন্ন
          </button>
        </div>
      </div>
    </div>
  );
};
