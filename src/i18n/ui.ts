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
  'pg.animate': ['Animate this pattern', 'Animar este patrón'],
  'pg.poster': ['Compose a poster from this pattern', 'Componer un póster con este patrón'],
  'pg.reset': ['Reset to sample', 'Volver al ejemplo'],
  // The action row fits three buttons on one line down to a 320px panel only
  // with mono-width abbreviations; the full wording above stays as each
  // button's accessible name and tooltip, so nothing is lost to the shorthand.
  'pg.randomizeShort': ['RANDOM', 'AZAR'],
  'pg.explainShort': ['MATH', 'FÓRMULA'],
  'pg.animateShort': ['ANIMATE', 'ANIMAR'],
  'pg.posterShort': ['POSTER', 'PÓSTER'],
  'pg.parameters': ['PARAMETERS', 'PARÁMETROS'],
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

  // --- animate stage ------------------------------------------------------
  // `pg.colour` is reused for the stage's COLOUR toggle: it is literally the
  // same word for the same concept, and a second key would be a second place
  // to keep it in sync.
  'anim.back': ['← DESIGN', '← DISEÑO'],
  'anim.play': ['PLAY', 'REPRODUCIR'],
  'anim.pause': ['PAUSE', 'PAUSA'],
  'anim.record': ['REC', 'REC'],
  'anim.stop': ['STOP', 'PARAR'],
  'anim.fullscreen': ['FULLSCREEN', 'PANTALLA COMPLETA'],
  'anim.mic': ['MIC', 'MIC'],
  'anim.demo': ['DEMO', 'DEMO'],
  'anim.dropHint': ['DROP AUDIO / CLICK TO CHOOSE', 'ARRASTRA AUDIO / CLIC PARA ELEGIR'],
  'anim.privacy': [
    'Audio is processed in your browser and never uploaded.',
    'El audio se procesa en tu navegador y nunca se sube.',
  ],
  'anim.intensity': ['INTENSITY', 'INTENSIDAD'],
  'anim.preset': ['PRESET', 'PRESET'],
  'anim.aspect': ['ASPECT', 'ASPECTO'],
  'anim.decodeError': [
    'Could not decode this audio file.',
    'No se pudo decodificar este archivo de audio.',
  ],
  'anim.demoError': ['Could not load the demo track.', 'No se pudo cargar la pista de demostración.'],
  'anim.micError': [
    'Microphone unavailable or permission denied.',
    'Micrófono no disponible o permiso denegado.',
  ],
  // Three distinct recorder failure causes get three distinct messages —
  // conflating them told a user who simply had not loaded audio yet that
  // their browser was broken.
  'anim.recNoAudio': ['Load audio first.', 'Carga audio primero.'],
  'anim.recError': ['Recording is not supported in this browser.', 'Este navegador no permite grabar.'],
  'anim.recNoMime': [
    'No compatible recording format found in this browser.',
    'No se encontró un formato de grabación compatible en este navegador.',
  ],

  // --- footer -------------------------------------------------------------
  'footer.builtBy': ['Built by', 'Hecho por'],
  'footer.source': ['Source on GitHub', 'Código en GitHub'],
  'footer.licence': ['MIT licence', 'Licencia MIT'],
  'footer.about': ['About this project', 'Acerca del proyecto'],

  // --- share --------------------------------------------------------------
  'share.action': ['Share', 'Compartir'],
  'share.copied': ['Link copied', 'Enlace copiado'],
  'share.selected': ['Link selected', 'Enlace seleccionado'],

  // --- favourites ---------------------------------------------------------
  'fav.save': ['Save to favourites', 'Guardar en favoritos'],
  'fav.remove': ['Remove from favourites', 'Quitar de favoritos'],
  'fav.unavailable': [
    'Saving is unavailable in this browser mode.',
    'No se puede guardar en este modo del navegador.',
  ],
  'fav.quota': [
    'Storage is full — remove a favourite and try again.',
    'El almacenamiento está lleno: quita un favorito e inténtalo de nuevo.',
  ],

  // --- saved page ---------------------------------------------------------
  'nav.saved': ['Saved', 'Guardados'],
  'saved.title': ['SAVED', 'GUARDADOS'],
  'saved.count': ['ITEMS', 'ELEMENTOS'],
  'saved.empty': [
    'Nothing saved yet. Open a pattern, make it yours, then press the star.',
    'Aún no hay nada guardado. Abre un patrón, hazlo tuyo y pulsa la estrella.',
  ],
  'saved.emptyCta': ['Browse patterns', 'Ver patrones'],
  'saved.kindP': ['DESIGN', 'DISEÑO'],
  'saved.kindA': ['ANIMATION', 'ANIMACIÓN'],
  'saved.kindC': ['POSTER', 'PÓSTER'],
  'saved.rename': ['Rename', 'Renombrar'],
  'saved.delete': ['Delete', 'Eliminar'],
  'saved.deleted': ['Deleted', 'Eliminado'],
  'saved.undo': ['Undo', 'Deshacer'],
  'saved.export': ['Export', 'Exportar'],
  'saved.import': ['Import', 'Importar'],
  'saved.imported': ['Added {added}, skipped {skipped}', 'Añadidos {added}, omitidos {skipped}'],
  'saved.importFailed': ['That is not a favourites file.', 'Ese archivo no es de favoritos.'],
  'saved.importFuture': [
    'That file was saved by a newer version of the site. Reload and try again.',
    'Ese archivo se guardó con una versión más reciente del sitio. Recarga e inténtalo de nuevo.',
  ],
  'saved.exportFailed': [
    'Your saved data could not be read, so there is nothing safe to export.',
    'No se han podido leer tus datos guardados, así que no hay nada seguro que exportar.',
  ],
  'saved.future': [
    'These favourites were saved by a newer version of the site. Reload to see them.',
    'Estos favoritos se guardaron con una versión más reciente del sitio. Recarga para verlos.',
  ],
  'saved.corrupt': [
    'Your saved data could not be read. It has been left untouched — resetting will discard it.',
    'No se han podido leer tus datos guardados. Se han dejado intactos: restablecer los descartará.',
  ],
  'saved.reset': ['Reset saved data', 'Restablecer datos guardados'],
  'saved.gone': ['Unavailable pattern', 'Patrón no disponible'],
};
