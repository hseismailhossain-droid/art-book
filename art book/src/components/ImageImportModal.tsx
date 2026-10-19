import React, { useRef, useState } from 'react';
import {
  X,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Layers,
  Film,
  Move,
  Check,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';

export type ImageImportTarget =
  | 'transform' // Move & scale interactively with high quality
  | 'active_layer' // Stamp directly onto active layer
  | 'new_layer' // Add as brand new layer in current frame
  | 'current_frame' // Stamp onto current frame
  | 'new_frame' // Add as a new frame in animation timeline
  | 'frame_sequence' // Multi-image animation sequence
  | 'reference'; // Semi-transparent tracing layer

interface ImageImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportImage: (
    images: HTMLImageElement[],
    target: ImageImportTarget
  ) => void;
  defaultTarget?: ImageImportTarget;
}

export const ImageImportModal: React.FC<ImageImportModalProps> = ({
  isOpen,
  onClose,
  onImportImage,
  defaultTarget = 'transform',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImgs, setSelectedImgs] = useState<HTMLImageElement[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [importTarget, setImportTarget] = useState<ImageImportTarget>(defaultTarget);

  if (!isOpen) return null;

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const loadedImgs: HTMLImageElement[] = [];
    const urls: string[] = [];

    let loadedCount = 0;
    fileList.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      urls.push(url);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loadedImgs[index] = img;
        loadedCount++;
        if (loadedCount === fileList.length) {
          // If multiple images are chosen, auto switch to frame_sequence or new_layer
          if (fileList.length > 1 && importTarget === 'transform') {
            setImportTarget('frame_sequence');
          }
          setSelectedImgs(loadedImgs);
          setPreviewUrls(urls);
        }
      };
      img.src = url;
    });
  };

  const handleConfirm = () => {
    if (selectedImgs.length === 0) return;
    onImportImage(selectedImgs, importTarget);
    onClose();
    // Reset state for next use
    setSelectedImgs([]);
    setPreviewUrls([]);
  };

  const handleResetFiles = () => {
    setSelectedImgs([]);
    setPreviewUrls([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700/80 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/95">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                লেয়ার ও ফ্রেমে ইমেজ ইম্পোর্ট স্টুডিও
              </h2>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                ৮কে কোয়ালিটি সংরক্ষিত থাকবে (স্কেল করলেও ঘোলা হবে না)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* File Picker Hidden Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            className="hidden"
          />

          {selectedImgs.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-700 hover:border-emerald-500 rounded-2xl p-7 flex flex-col items-center justify-center gap-3 cursor-pointer bg-neutral-800/40 hover:bg-neutral-800/70 transition-all text-center group"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 flex items-center justify-center transition-transform shadow-lg shadow-emerald-500/10">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-neutral-100">
                  ডিভাইস থেকে ছবি বেছে নিন বা ড্র্যাগ করে ফেলুন
                </div>
                <div className="text-[11px] text-neutral-400">
                  একটি বা একাধিক ছবি (PNG, JPG, WebP) একসাথে সিলেক্ট করতে পারবেন
                </div>
              </div>
              <div className="mt-1 flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-700/50 rounded-full text-[11px] text-emerald-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>অরিজিনাল রেজোলিউশন ও ৮কে ক্ল্যারিটি অক্ষুণ্ণ থাকবে</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Preview Box */}
              <div className="w-full h-48 rounded-xl bg-neutral-950 checker-pattern overflow-hidden flex items-center justify-center relative border border-neutral-800 p-2">
                {selectedImgs.length === 1 ? (
                  <img
                    src={previewUrls[0]}
                    alt="Import Preview"
                    className="max-h-full max-w-full object-contain rounded-lg shadow-md"
                  />
                ) : (
                  <div className="grid grid-cols-3 gap-2 w-full h-full overflow-y-auto p-1">
                    {previewUrls.map((url, i) => (
                      <div
                        key={i}
                        className="relative rounded-lg overflow-hidden border border-neutral-700 bg-neutral-900 aspect-video flex items-center justify-center"
                      >
                        <img src={url} alt={`Preview ${i}`} className="max-h-full max-w-full object-contain" />
                        <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-mono px-1 rounded text-neutral-300">
                          #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-neutral-900/90 text-[10px] font-mono text-emerald-300 border border-neutral-700">
                    {selectedImgs.length === 1
                      ? `${selectedImgs[0].naturalWidth} × ${selectedImgs[0].naturalHeight} px`
                      : `${selectedImgs.length} টি ছবি প্রস্তুত`}
                  </span>
                  <button
                    onClick={handleResetFiles}
                    className="px-2 py-0.5 rounded-md bg-neutral-900/90 hover:bg-neutral-800 text-[11px] text-neutral-300 border border-neutral-700"
                  >
                    বদলান
                  </button>
                </div>
              </div>

              {/* Target Destination Selector */}
              <div className="space-y-2">
                <span className="text-xs text-neutral-300 block font-semibold">
                  কোথায় ইম্পোর্ট করতে চান? (টার্গেট অপশন):
                </span>

                <div className="grid grid-cols-1 gap-2">
                  {/* Option 1: Move & Transform (Interactive Resize) */}
                  <button
                    onClick={() => setImportTarget('transform')}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      importTarget === 'transform'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-100 shadow-sm'
                        : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-300 hover:bg-neutral-750'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 mt-0.5">
                        <Move className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          <span>মুভ ও রিসাইজ মোড (প্রস্তাবিত)</span>
                          <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-1 py-0.2 rounded font-mono">
                            HIGH-RES
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          ক্যানভাসে সরাসরি টেনে ছোট-বড় বা ঘোরানো যাবে, ছবির কোয়ালিটি পুরোপুরি অক্ষত থাকবে
                        </div>
                      </div>
                    </div>
                    {importTarget === 'transform' && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  </button>

                  {/* Option 2: Active Layer */}
                  <button
                    onClick={() => setImportTarget('active_layer')}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      importTarget === 'active_layer'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-100 shadow-sm'
                        : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-300 hover:bg-neutral-750'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300 mt-0.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">বর্তমান সক্রিয় লেয়ারে বসিয়ে দিন</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          এখন যে লেয়ার সিলেক্ট আছে সরাসরি সেই লেয়ারে হাই-রেজোলিউশনে যুক্ত হবে
                        </div>
                      </div>
                    </div>
                    {importTarget === 'active_layer' && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  </button>

                  {/* Option 3: New Independent Layer */}
                  <button
                    onClick={() => setImportTarget('new_layer')}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      importTarget === 'new_layer'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-100 shadow-sm'
                        : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-300 hover:bg-neutral-750'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 mt-0.5">
                        <PlusCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">নতুন স্বতন্ত্র লেয়ার তৈরি করুন</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          আলাদা নতুন লেয়ার তৈরি হবে যার অপাসিটি, ব্লেন্ড মোড ইচ্ছামতো নিয়ন্ত্রণ করা যাবে
                        </div>
                      </div>
                    </div>
                    {importTarget === 'new_layer' && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  </button>

                  {/* Option 4: New Frame or Frame Sequence */}
                  <button
                    onClick={() => setImportTarget(selectedImgs.length > 1 ? 'frame_sequence' : 'new_frame')}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      importTarget === 'new_frame' || importTarget === 'frame_sequence'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-100 shadow-sm'
                        : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-300 hover:bg-neutral-750'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 mt-0.5">
                        <Film className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">
                          {selectedImgs.length > 1
                            ? 'টাইমলাইনে অ্যানিমেশন ফ্রেম সিকোয়েন্স তৈরি করুন'
                            : 'টাইমলাইনে নতুন ফ্রেম হিসেবে যুক্ত করুন'}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          {selectedImgs.length > 1
                            ? 'সিলেক্ট করা সব ছবি পর পর নতুন ফ্রেমে বসে আস্ত অ্যানিমেশন তৈরি হবে'
                            : 'একটি নতুন অ্যানিমেশন ফ্রেম তৈরি করে ছবিটি বসানো হবে'}
                        </div>
                      </div>
                    </div>
                    {(importTarget === 'new_frame' || importTarget === 'frame_sequence') && (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    )}
                  </button>

                  {/* Option 5: Reference Layer */}
                  <button
                    onClick={() => setImportTarget('reference')}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      importTarget === 'reference'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-100 shadow-sm'
                        : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-300 hover:bg-neutral-750'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-300 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">আর্টিস্ট ট্রেসিং রেফারেন্স লেয়ার</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          ৫০% স্বচ্ছতায় থাকবে, যাতে এর ওপর নতুন লেয়ার নিয়ে সুন্দর করে ড্রয়িং করা যায়
                        </div>
                      </div>
                    </div>
                    {importTarget === 'reference' && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/95 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-xl text-xs font-medium"
          >
            বাতিল
          </button>

          <button
            onClick={handleConfirm}
            disabled={selectedImgs.length === 0}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>ইম্পোর্ট সম্পূর্ণ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
