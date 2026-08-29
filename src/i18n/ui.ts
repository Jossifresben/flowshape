import type { Pair } from './index';

/** Every string the app chrome shows, in both languages. Content that is
 *  longer than a label — the pattern explanations, the about page — lives with
 *  its own module instead of here. */
export const UI: Record<string, Pair> = {
  // --- navigation ---------------------------------------------------------
  'nav.patterns': ['Patterns', 'Patrones'],
  'nav.about': ['About', 'Acerca de'],
  'nav.language': ['Language', 'Idioma'],
  'nav.home': ['flowshape home', 'inicio de flowshape'],

  // --- gallery ------------------------------------------------------------
  'gal.headlineA': ['Shape mathematics', 'Convierte las matemáticas'],
  'gal.headlineB': ['into art.', 'en arte.'],
  'gal.subtitle': [
    'Play with a pattern, tune every parameter, then take it out as a poster — or set it moving to music. Open source and free.',
    'Juega con un patrón, ajusta cada parámetro y llévatelo como póster, o ponlo a moverse con la música. Libre y gratuito.',
  ],
  'gal.patterns': ['PATTERNS', 'PATRONES'],
  'gal.families': ['FAMILIES', 'FAMILIAS'],
  'gal.all': ['All', 'Todos'],

  // --- playground ---------------------------------------------------------
  'pg.back': ['← All patterns', '← Todos los patrones'],
  'pg.seed': ['SEED', 'SEMILLA'],
  'pg.randomize': ['Randomize', 'Al azar'],
  'pg.explain': ['Explain the math', 'Explica las matemáticas'],
  'pg.reset': ['Reset to sample', 'Volver al ejemplo'],
  'pg.format': ['FORMAT', 'FORMATO'],
  'pg.custom': ['Custom…', 'A medida…'],
  'pg.colour': ['COLOUR', 'COLOR'],
  'pg.export': ['EXPORT', 'EXPORTAR'],
  'pg.exportSvg': ['Export SVG', 'Exportar SVG'],
  'pg.exportPng': ['Export PNG', 'Exportar PNG'],
  'pg.rendering': ['Rendering…', 'Generando…'],
  'pg.unknownPattern': ['Unknown pattern', 'Patrón desconocido'],
  'pg.renderFailed': ['Could not render this pattern.', 'No se pudo generar este patrón.'],

  // --- explain / code modal ----------------------------------------------
  'modal.math': ['Math', 'Matemáticas'],
  'modal.code': ['Code', 'Código'],
  'modal.close': ['Close', 'Cerrar'],
  'math.missing': [
    'No explanation found for this pattern.',
    'No hay explicación para este patrón.',
  ],
  'code.missing': ['Source not found for this pattern.', 'No se encuentra el código de este patrón.'],
  'code.preambleA': [
    'This is the actual generator that renders this pattern — uses ',
    'Este es el generador real que dibuja este patrón: usa ',
  ],
  'code.preambleB': [' from ', ' de '],
  'code.preambleC': [' and ', ' y '],
  'code.preambleD': ['. Full source: ', '. Código completo: '],
  'code.repo': ['the flowshape repo', 'el repositorio de flowshape'],
  'code.copy': ['Copy', 'Copiar'],
  'code.copied': ['Copied', 'Copiado'],
  'code.selected': ['Selected — press ⌘/Ctrl+C', 'Seleccionado — pulsa ⌘/Ctrl+C'],

  // --- footer -------------------------------------------------------------
  'footer.builtBy': ['Built by', 'Hecho por'],
  'footer.source': ['Source on GitHub', 'Código en GitHub'],
  'footer.licence': ['MIT licence', 'Licencia MIT'],
  'footer.about': ['About this project', 'Acerca del proyecto'],
};
