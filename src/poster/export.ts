import { serialize, type SvgNode, type Palette } from '../core/svg';

const MAX_PX = 12000;

/** A print-ready, self-contained SVG: viewBox for geometry, mm for physical size. */
export function toSvgString(node: SvgNode, pal: Palette, phys: { wmm: number; hmm: number }): string {
  const withSize: SvgNode = {
    ...node,
    attrs: {
      ...node.attrs,
      width: `${phys.wmm}mm`,
      height: `${phys.hmm}mm`,
    },
  };
  return serialize(withSize, pal);
}

/** Pixel size for a given dpi, preserving aspect and capping the long edge. */
export function pixelDimensions(phys: { wmm: number; hmm: number }, dpi: number): { w: number; h: number } {
  const perMm = dpi / 25.4;
  let w = Math.round(phys.wmm * perMm);
  let h = Math.round(phys.hmm * perMm);
  const long = Math.max(w, h);
  if (long > MAX_PX) {
    const k = MAX_PX / long;
    w = Math.round(w * k);
    h = Math.round(h * k);
  }
  return { w, h };
}

export function exportFilename(patternId: string, seed: number, format: string, ext: 'svg' | 'png'): string {
  return `flowshape-${patternId}-${seed}-${format}.${ext}`;
}

/** Rasterise an SVG string to PNG. Browser-only: needs Image and canvas. */
export function toPngBlob(svg: string, px: { w: number; h: number }): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = px.w;
        canvas.height = px.h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas 2d context unavailable');
        ctx.drawImage(img, 0, 0, px.w, px.h);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('PNG encoding failed'));
        }, 'image/png');
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('the SVG could not be rasterised'));
    };
    img.src = url;
  });
}

/** Hands the file to the browser. Must be called from a real user gesture. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
