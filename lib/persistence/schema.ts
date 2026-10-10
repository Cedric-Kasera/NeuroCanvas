import { type Node, type Edge, type Viewport } from '@xyflow/react';
import { Layer } from '../engine/types';

export interface CanvasSettings {
  mode: 'beginner' | 'student';
  snap: boolean;
  grid: boolean;
  minimap: boolean;
  showLayerFrames?: boolean;
  precision: number;
}

export interface SerializedCanvas {
  app: 'neurocanvas';
  schemaVersion: number;
  id?: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  viewport: Viewport;
  settings: CanvasSettings;
  nodes: Node[];
  edges: Edge[];
  layers?: Layer[];
}

export interface SavedCanvasMeta {
  id: string;
  name: string;
  updatedAt: string;
  nodeCount: number;
  edgeCount: number;
  architecture?: string;
}

export interface LessonProgress {
  lessonId: string;
  completedStepIds: string[];
  completed: boolean;
  quizzesAnswered?: Record<string, boolean>;
  updatedAt: string;
}

export function migrateCanvas(raw: any): SerializedCanvas {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid canvas data.');
  }

  // Version 2 validation & normalizer with layers support
  return {
    app: 'neurocanvas',
    schemaVersion: 2,
    id: raw.id || `canvas_${Date.now()}`,
    name: raw.name || 'Untitled Network',
    description: raw.description || '',
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
    viewport: raw.viewport || { x: 0, y: 0, zoom: 1 },
    settings: {
      mode: raw.settings?.mode === 'student' ? 'student' : 'beginner',
      snap: raw.settings?.snap ?? true,
      grid: raw.settings?.grid ?? true,
      minimap: raw.settings?.minimap ?? true,
      showLayerFrames: raw.settings?.showLayerFrames ?? true,
      precision: raw.settings?.precision ?? 2,
    },
    nodes: Array.isArray(raw.nodes) ? raw.nodes : [],
    edges: Array.isArray(raw.edges) ? raw.edges : [],
    layers: Array.isArray(raw.layers) ? raw.layers : [],
  };
}
