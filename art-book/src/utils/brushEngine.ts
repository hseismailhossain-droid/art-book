import { BrushConfig, Point } from '../types/canvas';

/**
 * High-performance smooth drawing engine with pressure simulation,
 * glow bloom, gradients, and specialized brush stylings.
 */

// Stroke point history for stabilizer
let strokePoints: Point[] = [];

export function startStroke(point: Point) {
  strokePoints = [point];
}

export function addStrokePoint(
  currentPoint: Point,
  config: BrushConfig
): { p0: Point; p1: Point } | null {
  strokePoints.push(currentPoint);

  if (strokePoints.length < 2) return null;

  const len = strokePoints.length;
  let p0 = strokePoints[len - 2];
  let p1 = strokePoints[len - 1];

  // Stabilizer / Streamline algorithm
  if (config.stabilizer > 0 && len >= 3) {
    const smoothingFactor = Math.min(0.85, config.stabilizer * 0.7);
    const prev = strokePoints[len - 2];
    p1 = {
      x: prev.x * smoothingFactor + currentPoint.x * (1 - smoothingFactor),
      y: prev.y * smoothingFactor + currentPoint.y * (1 - smoothingFactor),
      pressure: currentPoint.pressure,
      time: currentPoint.time,
    };
    strokePoints[len - 1] = p1;
  }

  return { p0, p1 };
}

export function renderStrokeSegment(
  ctx: CanvasRenderingContext2D,
  p0: Point,
  p1: Point,
  config: BrushConfig,
  canvasWidth: number,
  canvasHeight: number
) {
  ctx.save();
  // CRITICAL FIX: Always reset line dash so brush strokes are NEVER rendered as dashed lines!
  ctx.setLineDash([]);

  // Calculate dynamic size based on pressure and canvas resolution (for crisp 8K ultra drawing)
  const resScale = Math.max(1, canvasWidth / 1920);
  const pressure = Math.max(0.2, Math.min(1.5, p1.pressure || 1));
  let dynamicSize = config.size * pressure * resScale;

  const midX = (p0.x + p1.x) / 2;
  const midY = (p0.y + p1.y) / 2;

  // Apply blend mode
  if (config.type === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = config.opacity;
    dynamicSize = config.eraserSize * pressure * resScale;

    if (config.eraserType === 'soft') {
      ctx.shadowBlur = dynamicSize * 0.8;
      ctx.shadowColor = 'rgba(0,0,0,1)';
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = dynamicSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.globalCompositeOperation = config.blendMode;
  ctx.globalAlpha = config.opacity;

  // Determine stroke style based on colorMode (solid, gradient, glow)
  let strokeStyle: string | CanvasGradient = config.color;

  if (config.colorMode === 'gradient') {
    if (config.gradient.type === 'linear') {
      const grad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      grad.addColorStop(0, config.gradient.color1);
      grad.addColorStop(1, config.gradient.color2);
      strokeStyle = grad;
    } else {
      const grad = ctx.createRadialGradient(
        canvasWidth / 2,
        canvasHeight / 2,
        20,
        canvasWidth / 2,
        canvasHeight / 2,
        canvasWidth / 2
      );
      grad.addColorStop(0, config.gradient.color1);
      grad.addColorStop(1, config.gradient.color2);
      strokeStyle = grad;
    }
  }

  // Handle Brush Types
  switch (config.type) {
    case 'glow_neon': {
      // Glow brush with high bloom
      const bloomSize = config.size * (1 + config.glowIntensity * 1.5);
      ctx.shadowColor = config.glowColor || config.color;
      ctx.shadowBlur = bloomSize;
      ctx.lineWidth = Math.max(2, dynamicSize * 0.6);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#ffffff'; // White inner core
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();

      // Outer aura
      ctx.shadowBlur = bloomSize * 1.8;
      ctx.lineWidth = dynamicSize;
      ctx.strokeStyle = strokeStyle;
      ctx.stroke();
      break;
    }

    case 'pencil': {
      // Graphite texture feel - smooth fluid drawing with fine organic texture
      ctx.lineWidth = Math.max(1.5, dynamicSize * 0.75);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = strokeStyle;
      ctx.globalAlpha = config.opacity * 0.85;

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();

      // Fine grain texture
      const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      if (dist > 3) {
        ctx.beginPath();
        const jx = (Math.random() - 0.5) * 1.2;
        const jy = (Math.random() - 0.5) * 1.2;
        ctx.lineWidth = Math.max(0.8, dynamicSize * 0.35);
        ctx.globalAlpha = config.opacity * 0.35;
        ctx.moveTo(p0.x + jx, p0.y + jy);
        ctx.lineTo(p1.x + jx, p1.y + jy);
        ctx.stroke();
      }
      break;
    }

    case 'ink_pen': {
      // Studio calligraphy ink pen with taper
      ctx.lineWidth = dynamicSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = strokeStyle;

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      break;
    }

    case 'ballpoint': {
      // Fine consistent ballpoint line
      ctx.lineWidth = Math.max(1, dynamicSize * 0.5);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = strokeStyle;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      break;
    }

    case 'brush_paint': {
      // Watercolor / acrylic soft edge
      ctx.lineWidth = dynamicSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = strokeStyle;
      ctx.shadowBlur = dynamicSize * 0.35;
      ctx.shadowColor = typeof strokeStyle === 'string' ? strokeStyle : config.color;

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      break;
    }

    case 'marker': {
      // Translucent marker with flat/chisel angle
      ctx.lineWidth = dynamicSize * 1.2;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'bevel';
      ctx.globalAlpha = config.opacity * 0.45;
      ctx.strokeStyle = strokeStyle;

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      break;
    }

    case 'airbrush': {
      // Soft radial spray
      const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const steps = Math.max(1, Math.floor(dist / (dynamicSize * 0.25)));
      const baseAlpha = config.opacity * 0.08;

      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const curX = p0.x + (p1.x - p0.x) * t;
        const curY = p0.y + (p1.y - p0.y) * t;

        const radGrad = ctx.createRadialGradient(
          curX,
          curY,
          0,
          curX,
          curY,
          dynamicSize
        );
        const col = typeof strokeStyle === 'string' ? strokeStyle : config.color;
        radGrad.addColorStop(0, col);
        radGrad.addColorStop(0.5, col);
        radGrad.addColorStop(1, 'transparent');

        ctx.globalAlpha = baseAlpha;
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(curX, curY, dynamicSize, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'technical':
    default: {
      // Crisp technical pen with no blur
      ctx.lineWidth = dynamicSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = strokeStyle;

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

export function drawStrokeSegment(
  ctx: CanvasRenderingContext2D,
  currentPoint: Point,
  config: BrushConfig,
  canvasWidth: number,
  canvasHeight: number
) {
  const seg = addStrokePoint(currentPoint, config);
  if (seg) {
    renderStrokeSegment(ctx, seg.p0, seg.p1, config, canvasWidth, canvasHeight);
  }
}

export function endStroke() {
  strokePoints = [];
}

/**
 * High-speed Flood Fill (Bucket Tool)
 */
export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string,
  tolerance = 32
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Parse fill color
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 1;
  tempCanvas.height = 1;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.fillStyle = fillColorHex;
  tempCtx.fillRect(0, 0, 1, 1);
  const fillRgba = tempCtx.getImageData(0, 0, 1, 1).data;

  const startIndex = (startY * width + startX) * 4;
  const startR = data[startIndex];
  const startG = data[startIndex + 1];
  const startB = data[startIndex + 2];
  const startA = data[startIndex + 3];

  // If already same color, return
  if (
    Math.abs(startR - fillRgba[0]) < 5 &&
    Math.abs(startG - fillRgba[1]) < 5 &&
    Math.abs(startB - fillRgba[2]) < 5 &&
    Math.abs(startA - fillRgba[3]) < 5
  ) {
    return;
  }

  function matches(index: number) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const a = data[index + 3];
    return (
      Math.abs(r - startR) <= tolerance &&
      Math.abs(g - startG) <= tolerance &&
      Math.abs(b - startB) <= tolerance &&
      Math.abs(a - startA) <= tolerance
    );
  }

  const queue: [number, number][] = [[startX, startY]];
  const visited = new Uint8Array(width * height);

  while (queue.length > 0) {
    const [x, y] = queue.pop()!;
    const pos = y * width + x;

    if (visited[pos]) continue;
    visited[pos] = 1;

    const idx = pos * 4;
    data[idx] = fillRgba[0];
    data[idx + 1] = fillRgba[1];
    data[idx + 2] = fillRgba[2];
    data[idx + 3] = fillRgba[3];

    // Push 4-way neighbors
    if (x > 0 && !visited[pos - 1] && matches(idx - 4)) {
      queue.push([x - 1, y]);
    }
    if (x < width - 1 && !visited[pos + 1] && matches(idx + 4)) {
      queue.push([x + 1, y]);
    }
    if (y > 0 && !visited[pos - width] && matches(idx - width * 4)) {
      queue.push([x, y - 1]);
    }
    if (y < height - 1 && !visited[pos + width] && matches(idx + width * 4)) {
      queue.push([x, y + 1]);
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
