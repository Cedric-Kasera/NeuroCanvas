import { toPng, toSvg } from 'html-to-image';
import { SerializedCanvas, migrateCanvas } from './schema';

export function downloadJson(canvas: SerializedCanvas, filename?: string): void {
  const jsonStr = JSON.stringify(canvas, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (filename || canvas.name || 'neurocanvas').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  a.download = `${safeName}.nncanvas.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyJsonToClipboard(canvas: SerializedCanvas): Promise<boolean> {
  try {
    const jsonStr = JSON.stringify(canvas, null, 2);
    await navigator.clipboard.writeText(jsonStr);
    return true;
  } catch {
    return false;
  }
}

export async function exportCanvasToImage(
  element: HTMLElement,
  format: 'png' | 'svg' = 'png',
  transparent: boolean = false
): Promise<string> {
  const options = {
    backgroundColor: transparent ? undefined : '#faf9f5',
    pixelRatio: 2,
    filter: (node: HTMLElement) => {
      // Exclude controls / overlays from image export
      if (node.classList && (node.classList.contains('react-flow__controls') || node.classList.contains('react-flow__panel'))) {
        return false;
      }
      return true;
    },
  };

  if (format === 'svg') {
    return await toSvg(element, options);
  }
  return await toPng(element, options);
}

export function parseCanvasJson(rawText: string): { success: boolean; data?: SerializedCanvas; error?: string } {
  try {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'File is not a valid JSON object.' };
    }
    if (parsed.app && parsed.app !== 'neurocanvas') {
      return { success: false, error: 'File was created by a different application.' };
    }
    const validated = migrateCanvas(parsed);
    return { success: true, data: validated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Malformed JSON file.' };
  }
}
