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
  // Prefix for a dimmed control's tooltip, completed with the gate's own
  // label and the option(s) that switch it back on: "Only in RENDER · Ribbons".
  'pg.onlyIn': ['Only in', 'Solo en'],
  'pg.on': ['on', 'activado'],
  'pg.off': ['off', 'desactivado'],
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
  'anim.demos': ['DEMOS', 'DEMOS'],
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
  'footer.privacy': ['Privacy choice', 'Privacidad'],
  // --- tip jar ------------------------------------------------------------
  // One string for the footer link, the About heading and the modal title:
  // they name the same thing, and three copies would only drift apart.
  'tip.support': ['Support this project', 'Apoya el proyecto'],
  'tip.blurb': [
    'flowshape is free, open source, and carries no ads or accounts. If it has been useful to you, a tip helps keep it that way.',
    'flowshape es gratuito, de código abierto y no lleva anuncios ni cuentas. Si te ha resultado útil, una propina ayuda a que siga así.',
  ],
  'tip.direct': ['Open the tip page in a new tab', 'Abrir la página de propinas en otra pestaña'],
  'tip.cta': ['Send a tip', 'Enviar una propina'],

  // --- references ---------------------------------------------------------
  'refs.title': ['References', 'Referencias'],
  'refs.intro': [
    'Every generator here rests on mathematics that was already there. Below is the primary source behind each pattern.',
    'Todos los generadores se apoyan en matemáticas que ya existían. Abajo está la fuente original de cada patrón.',
  ],
  // The legend for the marker below. Says plainly what it does NOT claim,
  // because a bibliography that lets a reader infer new mathematics from a
  // rearrangement has cost more credibility than the note would have saved.
  // `{n}` is filled with the live count of marked entries.
  'refs.note': [
    'The note original construction appears on {n} of the entries below. It marks the composition and the parameterisation as this project’s own — never the mathematics, which is classical in every case and cited alongside.',
    'La nota construcción propia aparece en {n} de las entradas de abajo. Señala que la composición y la parametrización son propias de este proyecto; nunca las matemáticas, que son clásicas en todos los casos y se citan al lado.',
  ],
  'refs.own': ['Original construction', 'Construcción propia'],
  'tip.methods': [
    'Card, PayPal, Apple Pay or Google Pay',
    'Tarjeta, PayPal, Apple Pay o Google Pay',
  ],
  'tip.hosted': ['Payments are handled by TipTopJar.', 'Los pagos los gestiona TipTopJar.'],

  // --- analytics consent --------------------------------------------------
  // Deliberately plain about what is being asked. The two buttons carry equal
  // visual weight in the stylesheet: refusing has to be exactly as easy as
  // agreeing, which is a legal requirement and not a design preference.
  'consent.body': [
    'May we count your visit with Google Analytics? It tells us which patterns people actually use. Nothing is loaded or stored unless you say yes, and you can change your mind from any page.',
    '¿Podemos contar tu visita con Google Analytics? Nos dice qué patrones se usan de verdad. No se carga ni se guarda nada a menos que aceptes, y puedes cambiar de opinión desde cualquier página.',
  ],
  'consent.accept': ['Accept', 'Aceptar'],
  'consent.decline': ['Decline', 'Rechazar'],
  'consent.label': ['Analytics consent', 'Consentimiento de analítica'],
  'consent.current.granted': ['Analytics: on', 'Analítica: activada'],
  'consent.current.denied': ['Analytics: off', 'Analítica: desactivada'],

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
  'saved.countOne': ['ITEM', 'ELEMENTO'],
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
  'saved.importFailed': ['That is not a favourites file.', 'Ese archivo no es favorito'],
  'saved.importFuture': [
    'That file was saved by a newer version of the site. Reload and try again.',
    'Ese archivo se guardó con una versión más reciente del sitio. Recarga e inténtalo de nuevo.',
  ],
  'saved.exportFailed': [
    'Your saved data could not be read, so there is nothing safe to export.',
    'Nada por exportar',
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

  // --- curated gallery ----------------------------------------------------
  'nav.gallery': ['Gallery', 'Galería'],
  'show.title': ['GALLERY', 'GALERÍA'],
  'show.subtitle': [
    'A selection, chosen by hand. Open any one to take it apart and make it yours.',
    'Una selección, elegida a mano. Abre cualquiera para desmontarla y hacerla tuya.',
  ],
  'show.empty': ['Nothing here yet.', 'Aún no hay nada aquí.'],
  'show.tabDesigns': ['Designs', 'Diseños'],
  'show.tabPosters': ['Posters', 'Pósters'],
  'show.song': ['Song', 'Canción'],
  'show.tabVideos': ['Videos', 'Vídeos'],
  'show.play': ['Play', 'Reproducir'],
  'show.openStage': ['Open the live stage', 'Abrir el escenario en vivo'],
};
