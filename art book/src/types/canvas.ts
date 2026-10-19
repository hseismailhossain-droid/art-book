export type ToolType =
  | 'pencil'
  | 'ink_pen'
  | 'ballpoint'
  | 'brush_paint'
  | 'marker'
  | 'airbrush'
  | 'glow_neon'
  | 'technical'
  | 'eraser'
  | 'fill_bucket'
  | 'select_move'
  | 'rigging'
  | 'crop';

export type EraserType = 'hard' | 'soft' | 'layer_clear';

export type BlendMode =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

export interface GradientColor {
  type: 'linear' | 'radial';
  color1: string;
  color2: string;
  angle?: number;
}

export interface BrushConfig {
  type: ToolType;
  size: number;
  opacity: number;
  color: string;
  colorMode: 'solid' | 'gradient' | 'glow';
  gradient: GradientColor;
  glowIntensity: number;
  glowColor: string;
  stabilizer: number; // 0 to 1 smoothing
  blendMode: BlendMode;
  eraserType: EraserType;
  eraserSize: number;
}

export interface CanvasLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export interface JointNode {
  id: string;
  name: string;
  x: number; // in canvas coordinate space
  y: number;
  parentId: string | null;
  color?: string;
  radius?: number;
}

export interface BoneConnection {
  id: string;
  fromId: string;
  toId: string;
  color?: string;
  thickness?: number;
}

export interface SkeletonRig {
  id: string;
  name: string;
  visible: boolean;
  joints: JointNode[];
  bones: BoneConnection[];
}

export interface AnimationFrame {
  id: string;
  name: string;
  layers: CanvasLayer[];
  rigPose?: JointNode[];
}

export interface ResolutionPreset {
  label: string;
  bengaliLabel: string;
  width: number;
  height: number;
  tag: string;
  category: 'mobile' | 'standard' | 'high' | 'ultra';
}

export interface SelectionTransform {
  isActive: boolean;
  mode: 'lasso' | 'box';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  sourceCanvas: HTMLCanvasElement | null;
  originalLayerId: string | null;
  polygonPoints?: Point[];
  originalWidth?: number;
  originalHeight?: number;
  keepAspectRatio?: boolean;
}

export type RigInteraction = 'add_bone' | 'pose_bone';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  time?: number;
}

