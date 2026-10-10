import LZString from 'lz-string';
import { SerializedCanvas, migrateCanvas } from './schema';

const MAX_URL_SAFE_LENGTH = 6000;

export interface ShareResult {
  url?: string;
  payload?: string;
  tooLarge: boolean;
  charCount: number;
}

export function encodeCanvasToShareUrl(canvas: SerializedCanvas, baseUrl: string): ShareResult {
  const minified = {
    v: 2,
    n: canvas.name,
    vp: canvas.viewport,
    s: canvas.settings,
    l: canvas.layers?.map((l) => ({
      i: l.id,
      k: l.kind,
      lb: l.label,
      o: l.order,
      n: l.nodeIds,
    })),
    nodes: canvas.nodes.map((n) => ({
      id: n.id,
      t: n.type,
      p: n.position,
      d: n.data,
    })),
    edges: canvas.edges.map((e) => ({
      id: e.id,
      s: e.source,
      t: e.target,
      d: e.data,
    })),
  };

  const jsonStr = JSON.stringify(minified);
  const compressed = LZString.compressToEncodedURIComponent(jsonStr);

  const cleanBase = baseUrl.split('#')[0].replace(/\/$/, '');
  const url = `${cleanBase}/#s=${compressed}`;
  const charCount = url.length;

  if (charCount > MAX_URL_SAFE_LENGTH) {
    return {
      tooLarge: true,
      charCount,
      payload: compressed,
    };
  }

  return {
    url,
    payload: compressed,
    tooLarge: false,
    charCount,
  };
}

export function decodeCanvasFromPayload(payload: string): SerializedCanvas | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(payload);
    if (!decompressed) return null;

    const parsed = JSON.parse(decompressed);
    if ((parsed.v === 1 || parsed.v === 2) && Array.isArray(parsed.nodes)) {
      const fullCanvas: any = {
        app: 'neurocanvas',
        schemaVersion: 2,
        name: parsed.n || 'Shared Canvas',
        viewport: parsed.vp || { x: 0, y: 0, zoom: 1 },
        settings: parsed.s || { mode: 'beginner', snap: true, grid: true, minimap: true, precision: 2 },
        layers: parsed.l
          ? parsed.l.map((l: any) => ({
              id: l.i,
              kind: l.k,
              label: l.lb,
              order: l.o,
              nodeIds: l.n,
            }))
          : [],
        nodes: parsed.nodes.map((n: any) => ({
          id: n.id,
          type: n.t,
          position: n.p,
          data: n.d,
        })),
        edges: parsed.edges.map((e: any) => ({
          id: e.id,
          source: e.s,
          target: e.t,
          data: e.d,
        })),
      };
      return migrateCanvas(fullCanvas);
    }

    return migrateCanvas(parsed);
  } catch (err) {
    console.error('Failed to decode shared canvas payload:', err);
    return null;
  }
}
