import { AnimationFrame, CanvasLayer, ResolutionPreset } from '../types/canvas';

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { label: '240p Mobile Low', bengaliLabel: '২৪০পি (লো-এন্ড মোবাইল)', width: 426, height: 240, tag: '240p', category: 'mobile' },
  { label: '360p Fast', bengaliLabel: '৩৬০পি (সুপার ফাস্ট)', width: 640, height: 360, tag: '360p', category: 'mobile' },
  { label: '480p SD', bengaliLabel: '৪৮০পি (এসডি স্ট্যান্ডার্ড)', width: 854, height: 480, tag: '480p', category: 'standard' },
  { label: '720p HD', bengaliLabel: '৭২০পি (এইচডি)', width: 1280, height: 720, tag: '720p', category: 'standard' },
  { label: '1080p Full HD', bengaliLabel: '১০৮০পি (ফুল এইচডি - সেরা)', width: 1920, height: 1080, tag: '1080p', category: 'high' },
  { label: '2K QHD', bengaliLabel: '২কে কিউএইচডি', width: 2560, height: 1440, tag: '2K', category: 'high' },
  { label: '4K UHD', bengaliLabel: '৪কে আল্ট্রা এইচডি (প্রিন্ট কোয়ালিটি)', width: 3840, height: 2160, tag: '4K', category: 'ultra' },
  { label: '8K Ultra High', bengaliLabel: '৮কে সুপার আল্ট্রা এইচডি', width: 7680, height: 4320, tag: '8K', category: 'ultra' },
  { label: '1:1 Square (Post)', bengaliLabel: '১:১ স্কয়ার (সোশ্যাল পোস্ট)', width: 1080, height: 1080, tag: '1:1', category: 'standard' },
  { label: '9:16 Mobile Story/Reel', bengaliLabel: '৯:১৬ মোবাইল রিলস / স্টোরি', width: 1080, height: 1920, tag: '9:16', category: 'standard' },
];

/**
 * Composite layers into a single canvas with options for scaling, background, and transparency
 */
export function compositeLayers(
  layers: CanvasLayer[],
  targetWidth: number,
  targetHeight: number,
  options: {
    transparent?: boolean;
    bgColor?: string;
  } = {}
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  // Smooth image scaling algorithm
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill background if not transparent
  if (!options.transparent) {
    ctx.fillStyle = options.bgColor || '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Draw layers in order from bottom to top
  for (const layer of layers) {
    if (!layer.visible) continue;

    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blendMode;
    ctx.drawImage(layer.canvas, 0, 0, targetWidth, targetHeight);
    ctx.restore();
  }

  return canvas;
}

/**
 * Fast export as PNG (Transparent or Solid)
 */
export async function exportPNG(
  layers: CanvasLayer[],
  targetWidth: number,
  targetHeight: number,
  transparent = true,
  bgColor = '#ffffff',
  filename = 'chitrakar-artwork.png'
) {
  const comp = compositeLayers(layers, targetWidth, targetHeight, {
    transparent,
    bgColor,
  });

  return new Promise<void>((resolve) => {
    comp.toBlob((blob) => {
      if (blob) {
        triggerDownload(blob, filename);
      }
      resolve();
    }, 'image/png');
  });
}

/**
 * Fast export as JPG with quality parameter
 */
export async function exportJPG(
  layers: CanvasLayer[],
  targetWidth: number,
  targetHeight: number,
  quality = 0.95,
  bgColor = '#ffffff',
  filename = 'chitrakar-artwork.jpg'
) {
  const comp = compositeLayers(layers, targetWidth, targetHeight, {
    transparent: false,
    bgColor,
  });

  return new Promise<void>((resolve) => {
    comp.toBlob(
      (blob) => {
        if (blob) {
          triggerDownload(blob, filename);
        }
        resolve();
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Export animation as high-speed WebM Video via hardware-accelerated MediaRecorder
 */
export async function exportAnimationVideo(
  frames: AnimationFrame[],
  targetWidth: number,
  targetHeight: number,
  fps = 24,
  loopCycles = 3,
  bgColor = '#ffffff',
  onProgress?: (progressPct: number) => void
): Promise<Blob> {
  if (frames.length === 0) throw new Error('No frames to export');

  // Video render canvas
  const renderCanvas = document.createElement('canvas');
  // Constrain render canvas max dimension for mobile video encoder compatibility
  const videoW = Math.min(1920, targetWidth % 2 === 0 ? targetWidth : targetWidth - 1);
  const videoH = Math.min(1080, targetHeight % 2 === 0 ? targetHeight : targetHeight - 1);
  renderCanvas.width = videoW;
  renderCanvas.height = videoH;
  const ctx = renderCanvas.getContext('2d')!;

  const stream = renderCanvas.captureStream(fps);

  // Check supported mime types
  const mimeTypes = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  let selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

  const chunks: Blob[] = [];
  const recorder = selectedMime
    ? new MediaRecorder(stream, { mimeType: selectedMime, videoBitsPerSecond: 5000000 })
    : new MediaRecorder(stream);

  return new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const videoBlob = new Blob(chunks, { type: selectedMime || 'video/webm' });
      triggerDownload(videoBlob, `chitrakar-animation-${Date.now()}.webm`);
      resolve(videoBlob);
    };

    recorder.onerror = (e) => reject(e);

    recorder.start(100);

    // Render loop
    const frameDurationMs = 1000 / fps;
    const totalRenders = frames.length * loopCycles;
    let currentRender = 0;

    const interval = setInterval(() => {
      if (currentRender >= totalRenders) {
        clearInterval(interval);
        setTimeout(() => recorder.stop(), 200);
        return;
      }

      const frameIndex = currentRender % frames.length;
      const frame = frames[frameIndex];

      // Draw background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, videoW, videoH);

      // Draw frame layers
      for (const layer of frame.layers) {
        if (!layer.visible) continue;
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode;
        ctx.drawImage(layer.canvas, 0, 0, videoW, videoH);
        ctx.restore();
      }

      currentRender++;
      if (onProgress) {
        onProgress(Math.round((currentRender / totalRenders) * 100));
      }
    }, frameDurationMs);
  });
}

/**
 * Export all animation frames as a Sprite Sheet PNG
 */
export async function exportSpriteSheet(
  frames: AnimationFrame[],
  targetWidth: number,
  targetHeight: number,
  columns = 4,
  transparent = true,
  bgColor = '#ffffff',
  filename = 'chitrakar-spritesheet.png'
) {
  if (frames.length === 0) return;

  const totalFrames = frames.length;
  const cols = Math.min(columns, totalFrames);
  const rows = Math.ceil(totalFrames / cols);

  // Scaled dimensions per frame for sprite sheet
  const fWidth = Math.min(512, targetWidth);
  const fHeight = Math.round((fWidth / targetWidth) * targetHeight);

  const sheetCanvas = document.createElement('canvas');
  sheetCanvas.width = cols * fWidth;
  sheetCanvas.height = rows * fHeight;
  const ctx = sheetCanvas.getContext('2d')!;

  if (!transparent) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);
  }

  for (let i = 0; i < totalFrames; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const destX = col * fWidth;
    const destY = row * fHeight;

    const frameCanvas = compositeLayers(frames[i].layers, fWidth, fHeight, {
      transparent: true,
    });
    ctx.drawImage(frameCanvas, destX, destY);
  }

  sheetCanvas.toBlob((blob) => {
    if (blob) {
      triggerDownload(blob, filename);
    }
  }, 'image/png');
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
