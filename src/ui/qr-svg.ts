import { qrMatrix } from '../core/qr';

/** The light margin every QR code needs to be found by a scanner. The
 *  standard calls for four modules; anything less and the finder patterns
 *  blur into whatever surrounds them. */
const QUIET_ZONE = 4;

/**
 * Renders `text` as an SVG QR code.
 *
 * SVG rather than canvas: the code stays sharp at any size and on any pixel
 * ratio, which is the whole point for something a person will hold a phone up
 * to. The modules are emitted as one `<path>` of small squares rather than
 * hundreds of `<rect>` elements — a version 10 symbol has over three thousand
 * modules, and that many nodes is a visible cost for no gain.
 *
 * The colours are literal black on white, deliberately, and do NOT follow the
 * site's ink/paper tokens: a QR code has to be dark-on-light with real
 * contrast to scan, and the tokens flip in dark mode.
 */
export function qrSvg(text: string, alt: string): SVGSVGElement {
  const modules = qrMatrix(text);
  const n = modules.length;
  const size = n + QUIET_ZONE * 2;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', alt);
  svg.classList.add('qr');

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', String(size));
  bg.setAttribute('height', String(size));
  bg.setAttribute('fill', '#fff');
  svg.append(bg);

  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (modules[r]![c]) d += `M${c + QUIET_ZONE} ${r + QUIET_ZONE}h1v1h-1z`;
    }
  }
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', '#000');
  // Without this, adjacent modules can leave hairline seams when the browser
  // scales the symbol to a non-integer module size.
  path.setAttribute('shape-rendering', 'crispEdges');
  svg.append(path);

  return svg;
}
