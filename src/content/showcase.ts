import type { Pair } from '../i18n';

/**
 * The curated gallery: work chosen by hand — a set, not a sequence. `#/gallery`
 * shuffles this list once per page load, so a repeat visitor meets a
 * different piece first each time rather than the same curated order.
 *
 * Every entry is a design hash — the same self-describing URL the address bar
 * carries, so an entry is the artwork rather than a description of it, and
 * adding one is a single line.
 *
 * `title` is optional. Without it the card shows the pattern's own name, which
 * is already bilingual, so naming an entry is a deliberate act rather than a
 * chore. Two entries of the same pattern therefore read alike — that is
 * accepted: the artwork distinguishes them, and a `title` settles it if not. `tests/content/showcase.test.ts` asserts every hash still decodes to
 * a registered pattern, because these are hand-written URLs and that is
 * exactly where a typo enters.
 */
export interface ShowcaseEntry {
  /** A `#/p/` design hash. Posters and animations are deliberately excluded. */
  hash: string;
  title?: Pair;
}

export const SHOWCASE: ShowcaseEntry[] = [
  { hash: '#/p/maurer?v=1&seed=1&hue=0&accentShift=130&n=10&d=73&strokeWidth=0.5&envelope=1&size=1.12&phase=0' },
  { hash: '#/p/apollonian?v=1&seed=1&hue=0&accentShift=130&maxDepth=7&minRadius=1&strokeWidth=0.95&fillAlternate=0&size=0.92&phase=0' },
  { hash: '#/p/bands?v=1&seed=1&hue=119&chroma=0.16&paperL=0.08&accentShift=130&bandCount=6&minThickness=28&maxThickness=24&growthExponent=0.85&gap=20&startAngle=168&sweepAngle=271&accentEvery=2&size=1&phase=0' },
  { hash: '#/p/chirp?v=1&seed=1&hue=200&chroma=0.065&paperL=0.08&accentShift=130&lineCount=75&freqStart=19.4&freqEnd=1.4&amplitude=56.5&phaseStep=0.72&strokeWidth=0.4&size=1&phase=0' },
  { hash: '#/p/coulomb?v=1&seed=42034&hue=0&paperL=0.08&accentShift=130&charges=4&spacing=10&steps=300&coreRadius=12&strokeWidth=1.1&emphasisEvery=0&size=1&phase=0' },
  { hash: '#/p/delaunay?v=1&seed=40186&hue=0&paperL=0.08&accentShift=130&points=220&mode=0&strokeWidth=0.4&vertexSize=3.4&accentEvery=23&size=1' },
  { hash: '#/p/delaunay?v=1&seed=40186&hue=278&chroma=0.075&paperL=0.08&accentShift=130&points=220&mode=1&strokeWidth=0.9&vertexSize=3.4&accentEvery=36&size=1' },
  { hash: '#/p/diffgrowth?v=1&seed=82403&hue=0&paperL=0.08&accentShift=130&iterations=500&repulsion=18&rings=2&strokeWidth=1.1&size=1.31' },
  { hash: '#/p/fabric?v=1&seed=61555&hue=0&paperL=0.08&accentShift=130&gridSize=52&warpAmount=58&noiseScale=3.2&mode=0&dotSize=1.7&strokeWidth=0.4&size=1&phase=0' },
  { hash: '#/p/flowfield?v=1&seed=41399&hue=97&chroma=0.115&paperL=0.08&accentShift=130&freq=0.011&curl=2.15&spacing=9&steps=300&strokeWidth=0.85&emphasisEvery=26&size=1&phase=0' },
  { hash: '#/p/girih?v=1&seed=41399&hue=0&chroma=0.145&paperL=0.08&accentShift=130&hexSize=62&contactAngle=78&render=1&ribbonWidth=15.5&strokeWidth=0.9&size=1' },
  { hash: '#/p/harmonograph?v=1&seed=38978&hue=0&paperL=0.08&accentShift=130&ratio=0&detune=0.017&damping=0.001&duration=570&strokeWidth=0.3&opacity=0.52&size=1.1&phase=0' },
  { hash: '#/p/helix?v=1&seed=38978&hue=0&paperL=0.08&accentShift=130&turns=8.2&radiusFraction=0.27&rungEvery=2&depthFade=1.25&strokeWidth=0.8&size=1&phase=0' },
  { hash: '#/p/hitomezashi?v=1&seed=26280&hue=267&paperL=0.08&accentShift=130&cell=17&bitChance=0.6&strokeWidth=1.1&fillParity=0&size=0.91&phase=0' },
  { hash: '#/p/interlace?v=1&seed=26280&hue=267&paperL=0.08&accentShift=130&cell=54&ribbonWidth=0.2&ringScale=0.82&coreRatio=0.42&junctions=1&gapScale=2.4&strokeWidth=0.8&size=1' },
  { hash: '#/p/isoweave?v=1&seed=26280&hue=267&paperL=0.08&accentShift=130&cell=39&unit=0&armLength=0.59&beamWidth=0.59&stagger=2&render=0&hatchDensity=8.4&faceShading=0.8&strokeWidth=0.5&size=1' },
  { hash: '#/p/isoweave?v=1&seed=26280&hue=267&paperL=0.08&accentShift=130&cell=22&unit=0&armLength=0.85&beamWidth=0.42&stagger=1&render=2&hatchDensity=2.6&faceShading=0.58&strokeWidth=0.5&size=1' },
  { hash: '#/p/moire?v=1&seed=26280&hue=151&chroma=0.13&paperL=0.08&accentShift=130&mode=1&spacingA=15.5&spacingB=15.8&angleA=124&angleB=44&offset=79&strokeWidth=0.6&size=1&phase=0' },
  { hash: '#/p/nested?v=1&seed=26280&hue=0&paperL=0.08&accentShift=130&cell=43&depth=3&stepRatio=0.6&coreSize=0.3&render=2&twist=1&faceShading=0.87&strokeWidth=0.6&size=1&phase=0' },
  { hash: '#/p/phyllotaxis?v=1&seed=26280&hue=254&paperL=0.08&accentShift=130&points=1110&angle=124.3445&radialExp=0.65&dotMin=3.15&dotGrow=0.0004&accentEvery=108&size=1&phase=0' },
  { hash: '#/p/roselattice?v=1&seed=26280&hue=254&paperL=0.08&accentShift=130&petals=8&rings=27&spokes=83&petalDepth=26&innerFraction=0.02&strokeWidth=0.65&size=1&phase=0' },
  { hash: '#/p/stipple?v=1&seed=26280&hue=54&paperL=0.08&accentShift=130&minGap=2&maxGap=20.5&noiseScale=1.6&contrast=0.15&dotSize=0.7&accentEvery=244&size=1' },
  { hash: '#/p/timestable?v=1&seed=46681&hue=54&paperL=0.08&accentShift=130&chords=440&multiplier=3.6&strokeWidth=0.35&opacity=0.5&showCircle=0&size=1&phase=0' },
  { hash: '#/p/truchet?v=1&seed=36131&hue=15&paperL=0.08&accentShift=130&cell=30&variant=0&render=0&strokeWidth=1&boldChance=0.14&accentChance=0.04&size=1' },
  { hash: '#/p/tumbling?v=1&seed=54166&hue=15&paperL=0.08&accentShift=130&cell=24&flipChance=0.54&coherence=0.45&voidChance=0&render=0&hatchDensity=11&faceShading=0.71&strokeWidth=0.95&size=1&phase=0' },
  { hash: '#/p/voxel?v=1&seed=68182&hue=266&chroma=0.115&paperL=0.08&accentShift=130&shape=1&dimension=14&gap=0.09&shellOnly=1&scatter=0.53&faceShading=0.75&depthShading=0.55&strokeWidth=0.75&size=1.17&phase=0' },
];

/** Curated posters. Same idea as SHOWCASE but `#/c/` hashes, rendered through
 *  the composer so a card shows layout, colourway and type block rather than
 *  bare artwork. */
export const SHOWCASE_POSTERS: ShowcaseEntry[] = [
  { hash: '#/c/maurer?v=1&seed=1&hue=0&accentShift=130&layout=3a.s0.d1.a0&cway=11&n=10&d=73&strokeWidth=0.5&envelope=1&size=1.12&phase=0' },
  { hash: '#/c/coulomb?v=1&seed=42034&hue=0&paperL=0.08&accentShift=130&layout=3a.s0.d0.a0&cway=8&charges=4&spacing=10&steps=300&coreRadius=12&strokeWidth=1.1&emphasisEvery=0&size=1&phase=0' },
  { hash: '#/c/delaunay?v=1&seed=40186&hue=278&chroma=0.075&paperL=0.08&accentShift=130&layout=3a.s0.d0.a0&cway=0&points=220&mode=1&strokeWidth=0.9&vertexSize=3.4&accentEvery=36&size=1' },
  { hash: '#/c/fabric?v=1&seed=61555&hue=0&paperL=0.08&accentShift=130&layout=3a.s0.d0.a0&cway=0&gridSize=52&warpAmount=58&noiseScale=3.2&mode=0&dotSize=1.7&strokeWidth=0.4&size=1&phase=0' },
  { hash: '#/c/flowfield?v=1&seed=41399&hue=97&chroma=0.115&paperL=0.08&accentShift=130&layout=3a.s0.d0.a1&cway=0&freq=0.011&curl=2.15&spacing=9&steps=300&strokeWidth=0.85&emphasisEvery=26&size=1&phase=0' },
  { hash: '#/c/harmonograph?v=1&seed=38978&hue=0&paperL=0.08&accentShift=130&layout=3d.s0.d0.a0&cway=8&ratio=0&detune=0.017&damping=0.001&duration=570&strokeWidth=0.3&opacity=0.52&size=1.1&phase=0' },
  { hash: '#/c/truchet?v=1&seed=36131&hue=15&paperL=0.08&accentShift=130&layout=3c.s0.d0.a1&cway=0&cell=30&variant=0&render=0&strokeWidth=1&boldChance=0.14&accentChance=0.04&size=1' },
  { hash: '#/c/tumbling?v=1&seed=54166&hue=15&paperL=0.08&accentShift=130&layout=3d.s0.d0.a0&cway=7&cell=24&flipChance=0.54&coherence=0.45&voidChance=0&render=0&hatchDensity=11&faceShading=0.71&strokeWidth=0.95&size=1&phase=0' },
  { hash: '#/c/voxel?v=1&seed=68182&hue=266&chroma=0.115&paperL=0.08&accentShift=130&layout=3d.s0.d0.a0&cway=9&shape=1&dimension=14&gap=0.09&shellOnly=1&scatter=0.53&faceShading=0.75&depthShading=0.55&strokeWidth=0.75&size=1.17&phase=0' },
];

/**
 * Curated videos: recordings from the animate stage.
 *
 * The video files live in Cloudflare R2, not in this repository — at 1080p and
 * full length they are ~180 MB, which git would carry forever. R2 charges
 * nothing for egress, so hosting them there costs less than committing them
 * and keeps the clone small. Poster frames stay local: they are ~380 KB in
 * total and are needed on first paint, so serving them beside the site avoids
 * a second origin on the critical path.
 *
 * Unlike designs and posters, a video is NOT a hash — it is a real file, so it
 * carries its own poster frame and an optional link back to the live stage.
 */
export interface ShowcaseVideo {
  /** Absolute site path, e.g. `/showcase/voronoi-drift.mp4`. */
  src: string;
  /** First-frame image, same folder. Shown before playback and where autoplay is refused. */
  poster: string;
  /** Optional `#/a/` hash, so the card can link through to the live stage. */
  hash?: string;
  title?: Pair;
  /** Attribution for an entry that carries music. Setting it marks the entry
   *  as a song in both places it is named: the card is qualified with the
   *  translated word for "song", and the modal — which has room — carries this
   *  full credit. One field, so the two can never drift apart. */
  credit?: Pair;
}

export const SHOWCASE_VIDEOS: ShowcaseVideo[] = [
  // First deliberately: it is the only entry with music, and the one to meet
  // first. The song title itself is not translated; `credit` is what marks it
  // apart from the silent stage recordings below. The credit is also burned
  // into the video itself, so it travels with the file wherever it is shared.
  { src: 'https://pub-6a0f4482746040e4a9d5bac43683870a.r2.dev/conecto.mp4', poster: '/showcase/conecto.jpg',
    title: ['Conecto con ese lugar', 'Conecto con ese lugar'],
    credit: ['Song by Jossi Fresco', 'Canción de Jossi Fresco'] },
  { src: 'https://pub-6a0f4482746040e4a9d5bac43683870a.r2.dev/harmonograph.mp4', poster: '/showcase/harmonograph.jpg',
    title: ['Harmonograph', 'Armonógrafo'] },
  { src: 'https://pub-6a0f4482746040e4a9d5bac43683870a.r2.dev/timestable.mp4', poster: '/showcase/timestable.jpg',
    title: ['Times-Table Chords', 'Cuerdas de la tabla de multiplicar'] },
  { src: 'https://pub-6a0f4482746040e4a9d5bac43683870a.r2.dev/flowfield.mp4', poster: '/showcase/flowfield.jpg',
    title: ['Flow Field', 'Campo de flujo'] },
  { src: 'https://pub-6a0f4482746040e4a9d5bac43683870a.r2.dev/fabric.mp4', poster: '/showcase/fabric.jpg',
    title: ['Warped Fabric', 'Tejido deformado'] },
  { src: 'https://pub-6a0f4482746040e4a9d5bac43683870a.r2.dev/harmonograph-wide.mp4', poster: '/showcase/harmonograph-wide.jpg',
    title: ['Harmonograph, wide', 'Armonógrafo, panorámico'] },
  { src: 'https://pub-6a0f4482746040e4a9d5bac43683870a.r2.dev/mystery.mp4', poster: '/showcase/mystery.jpg',
    title: ['Mystery Curve', 'Curva misteriosa'] },
  { src: 'https://pub-6a0f4482746040e4a9d5bac43683870a.r2.dev/guilloche.mp4', poster: '/showcase/guilloche.jpg',
    hash: '#/a/guilloche?v=1&seed=1&stage=11&apre=engrave&acol=1&rings=29&lobes=12&depth=0.145&inner=0.33&twist=0.74&strokeWidth=0.4&opacity=0.8&size=1&phase=0',
    title: ['Guilloché Rosette', 'Roseta guilloché'] },
];
