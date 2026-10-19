import { BoneConnection, JointNode, SkeletonRig } from '../types/canvas';

export interface RigBindData {
  isBound: boolean;
  targetLayerId: string;
  sourceCanvas: HTMLCanvasElement;
  sourceBounds: { x: number; y: number; w: number; h: number };
  initialJoints: JointNode[];
  initialBones: BoneConnection[];
  gridCols: number;
  gridRows: number;
  vertices: {
    origX: number;
    origY: number;
    weights: { boneIndex: number; weight: number }[];
  }[];
}

/**
 * Calculates distance from a point to a line segment (bone).
 */
function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/**
 * Creates or updates a puppet-warp mesh binding between the drawing and the custom skeleton rig.
 */
export function createRigBinding(
  sourceCtx: CanvasRenderingContext2D,
  rig: SkeletonRig,
  targetLayerId: string
): RigBindData | null {
  if (!rig || rig.joints.length === 0) return null;

  const w = sourceCtx.canvas.width;
  const h = sourceCtx.canvas.height;

  // 1. Scan bounding box of drawing on target layer
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let hasPixels = false;

  try {
    const imgData = sourceCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Fast 4px step sampling
    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        if (data[(y * w + x) * 4 + 3] > 12) {
          hasPixels = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  } catch (err) {
    console.warn('Could not read image data for rig binding', err);
  }

  // 2. Include bone coordinates in bounds so deformation covers the whole character
  for (const j of rig.joints) {
    if (j.x < minX) minX = j.x;
    if (j.x > maxX) maxX = j.x;
    if (j.y < minY) minY = j.y;
    if (j.y > maxY) maxY = j.y;
  }

  if (!hasPixels && rig.joints.length === 0) {
    return null;
  }

  // Add generous margin
  const pad = 60;
  const bx = Math.max(0, Math.floor(minX - pad));
  const by = Math.max(0, Math.floor(minY - pad));
  const bw = Math.min(w - bx, Math.ceil(maxX - minX + pad * 2));
  const bh = Math.min(h - by, Math.ceil(maxY - minY + pad * 2));

  if (bw <= 8 || bh <= 8) return null;

  // 3. Clone drawing into sourceCanvas
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = bw;
  sourceCanvas.height = bh;
  const sctx = sourceCanvas.getContext('2d')!;
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(sourceCtx.canvas, bx, by, bw, bh, 0, 0, bw, bh);

  // If there are no bones yet but at least 1 joint, create a root anchor bone
  let activeBones = [...rig.bones];
  let activeJoints = [...rig.joints];

  if (activeBones.length === 0 && activeJoints.length >= 1) {
    // Virtual anchor point 40px down to define orientation
    const rootJ = activeJoints[0];
    const anchorId = `anchor_${rootJ.id}`;
    const anchorJ: JointNode = {
      id: anchorId,
      name: 'অ্যাঙ্কর',
      x: rootJ.x,
      y: rootJ.y + 40,
      parentId: rootJ.id,
    };
    activeJoints = [...activeJoints, anchorJ];
    activeBones = [
      {
        id: `bone_${rootJ.id}_anchor`,
        fromId: rootJ.id,
        toId: anchorId,
        thickness: 5,
      },
    ];
  }

  // 4. Build adaptive skinning grid (14x14 grid is ultra-smooth and blazing fast on mobile 60fps)
  const gridCols = 14;
  const gridRows = 14;
  const stepX = bw / gridCols;
  const stepY = bh / gridRows;

  const initialJointMap = new Map(activeJoints.map((j) => [j.id, j]));
  const vertices: {
    origX: number;
    origY: number;
    weights: { boneIndex: number; weight: number }[];
  }[] = [];

  for (let r = 0; r <= gridRows; r++) {
    for (let c = 0; c <= gridCols; c++) {
      const vx = bx + c * stepX;
      const vy = by + r * stepY;

      const rawWeights: { boneIndex: number; weight: number }[] = [];
      let totalW = 0;

      for (let bIdx = 0; bIdx < activeBones.length; bIdx++) {
        const bone = activeBones[bIdx];
        const jFrom = initialJointMap.get(bone.fromId);
        const jTo = initialJointMap.get(bone.toId);
        if (!jFrom || !jTo) continue;

        const dist = distToSegment(vx, vy, jFrom.x, jFrom.y, jTo.x, jTo.y);
        // Inverse distance squared with soft falloff
        const wVal = 1 / Math.pow(Math.max(20, dist), 2);
        rawWeights.push({ boneIndex: bIdx, weight: wVal });
        totalW += wVal;
      }

      // Normalize weights
      const normalizedWeights = rawWeights.map((rw) => ({
        boneIndex: rw.boneIndex,
        weight: totalW > 0 ? rw.weight / totalW : 0,
      }));

      // Keep top 3 influences for silky performance
      normalizedWeights.sort((a, b) => b.weight - a.weight);
      const topWeights = normalizedWeights.slice(0, 3);
      const topTotal = topWeights.reduce((sum, tw) => sum + tw.weight, 0);
      const finalWeights = topWeights.map((tw) => ({
        boneIndex: tw.boneIndex,
        weight: topTotal > 0 ? tw.weight / topTotal : 0,
      }));

      vertices.push({ origX: vx, origY: vy, weights: finalWeights });
    }
  }

  return {
    isBound: true,
    targetLayerId,
    sourceCanvas,
    sourceBounds: { x: bx, y: by, w: bw, h: bh },
    initialJoints: activeJoints.map((j) => ({ ...j })),
    initialBones: activeBones.map((b) => ({ ...b })),
    gridCols,
    gridRows,
    vertices,
  };
}

/**
 * Renders the smoothly deformed drawing based on current bone poses.
 */
export function renderRiggedArtwork(
  ctx: CanvasRenderingContext2D,
  bindData: RigBindData,
  currentJoints: JointNode[]
) {
  if (!bindData || !bindData.isBound || !bindData.sourceCanvas) return;

  const currentJointMap = new Map(currentJoints.map((j) => [j.id, j]));
  const initJointMap = new Map(bindData.initialJoints.map((j) => [j.id, j]));

  // Calculate forward transformations for every bone from bind pose to current pose
  const boneTransforms: {
    fromInit: { x: number; y: number };
    fromCur: { x: number; y: number };
    cos: number;
    sin: number;
    scale: number;
  }[] = [];

  for (const bone of bindData.initialBones) {
    const fInit = initJointMap.get(bone.fromId);
    const tInit = initJointMap.get(bone.toId);
    let fCur = currentJointMap.get(bone.fromId);
    let tCur = currentJointMap.get(bone.toId);

    // If virtual anchor joint, calculate proportional anchor
    if (!tCur && fCur && bone.toId.startsWith('anchor_')) {
      const initDy = tInit ? tInit.y - fInit!.y : 40;
      tCur = {
        id: bone.toId,
        name: 'অ্যাঙ্কর',
        x: fCur.x,
        y: fCur.y + initDy,
        parentId: fCur.id,
      };
    }

    if (!fInit || !tInit || !fCur || !tCur) {
      boneTransforms.push({
        fromInit: { x: 0, y: 0 },
        fromCur: { x: 0, y: 0 },
        cos: 1,
        sin: 0,
        scale: 1,
      });
      continue;
    }

    const dxInit = tInit.x - fInit.x;
    const dyInit = tInit.y - fInit.y;
    const lenInit = Math.hypot(dxInit, dyInit) || 1;
    const angleInit = Math.atan2(dyInit, dxInit);

    const dxCur = tCur.x - fCur.x;
    const dyCur = tCur.y - fCur.y;
    const lenCur = Math.hypot(dxCur, dyCur) || 1;
    const angleCur = Math.atan2(dyCur, dxCur);

    const dAngle = angleCur - angleInit;
    // Mild stretch damping to avoid distortion
    const scale = Math.max(0.2, Math.min(3.0, lenCur / lenInit));

    boneTransforms.push({
      fromInit: { x: fInit.x, y: fInit.y },
      fromCur: { x: fCur.x, y: fCur.y },
      cos: Math.cos(dAngle),
      sin: Math.sin(dAngle),
      scale,
    });
  }

  // Deform grid vertices with Linear Blend Skinning
  const deformedVertices: { x: number; y: number }[] = [];

  for (const v of bindData.vertices) {
    let defX = 0;
    let defY = 0;

    for (const w of v.weights) {
      const bt = boneTransforms[w.boneIndex];
      if (!bt) continue;

      const rx = (v.origX - bt.fromInit.x) * bt.scale;
      const ry = (v.origY - bt.fromInit.y) * bt.scale;

      const tx = bt.fromCur.x + (rx * bt.cos - ry * bt.sin);
      const ty = bt.fromCur.y + (rx * bt.sin + ry * bt.cos);

      defX += tx * w.weight;
      defY += ty * w.weight;
    }

    deformedVertices.push({ x: defX, y: defY });
  }

  // Render grid quads as pairs of affine textured triangles
  const cols = bindData.gridCols;
  const rows = bindData.gridRows;
  const sw = bindData.sourceBounds.w / cols;
  const sh = bindData.sourceBounds.h / rows;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i00 = r * (cols + 1) + c;
      const i10 = i00 + 1;
      const i01 = (r + 1) * (cols + 1) + c;
      const i11 = i01 + 1;

      const p00 = deformedVertices[i00];
      const p10 = deformedVertices[i10];
      const p01 = deformedVertices[i01];
      const p11 = deformedVertices[i11];

      if (!p00 || !p10 || !p01 || !p11) continue;

      const u0 = c * sw;
      const v0 = r * sh;
      const u1 = u0 + sw;
      const v1 = v0 + sh;

      // Triangle 1: (p00, p10, p01)
      drawTexturedTriangle(
        ctx,
        bindData.sourceCanvas,
        u0,
        v0,
        u1,
        v0,
        u0,
        v1,
        p00.x,
        p00.y,
        p10.x,
        p10.y,
        p01.x,
        p01.y
      );

      // Triangle 2: (p10, p11, p01)
      drawTexturedTriangle(
        ctx,
        bindData.sourceCanvas,
        u1,
        v0,
        u1,
        v1,
        u0,
        v1,
        p10.x,
        p10.y,
        p11.x,
        p11.y,
        p01.x,
        p01.y
      );
    }
  }

  ctx.restore();
}

/**
 * Precise affine triangle texture mapping for HTML5 Canvas 2D
 */
function drawTexturedTriangle(
  ctx: CanvasRenderingContext2D,
  img: HTMLCanvasElement,
  u0: number,
  v0: number,
  u1: number,
  v1: number,
  u2: number,
  v2: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  // Determinant
  const D = (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0);
  if (Math.abs(D) < 0.0001) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.clip();

  // Forward affine matrix coefficients
  const a = ((x1 - x0) * (v2 - v0) - (x2 - x0) * (v1 - v0)) / D;
  const b = ((y1 - y0) * (v2 - v0) - (y2 - y0) * (v1 - v0)) / D;
  const c = ((u1 - u0) * (x2 - x0) - (u2 - u0) * (x1 - x0)) / D;
  const d = ((u1 - u0) * (y2 - y0) - (u2 - u0) * (y1 - y0)) / D;
  const e = x0 - a * u0 - c * v0;
  const f = y0 - b * u0 - d * v0;

  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}
