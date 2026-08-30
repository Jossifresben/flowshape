import { listPatterns } from '../patterns/registry';
import { currentLang, t, type Lang, type Pair } from '../i18n';
import { openTipJar } from './tip';
import { buildNav } from './nav';
import { buildFooter, AUTHOR_NAME, AUTHOR_URL, ORCID_URL, REPO_URL } from './footer';

type Block =
  | { kind: 'h2'; text: Pair }
  | { kind: 'p'; text: Pair }
  | { kind: 'ul'; items: Pair[] }
  | { kind: 'video'; src: string; poster: string; label: Pair }
  /** The tip jar's heading, blurb and button. A block rather than a trailing
   *  section so its position in the page is chosen here, with the rest of the
   *  order, instead of being fixed to the end. */
  | { kind: 'support' };

/** `{n}` and `{f}` are filled with the live pattern and family counts, so the
 *  page can never claim a number the registry disagrees with. */
const BLOCKS: Block[] = [
  {
    kind: 'p',
    text: [
      'flowshape turns mathematics into art. Pick one of {n} pattern generators across {f} families — a Voronoi mesh, a Truchet tiling, a flow field, an isometric voxel form — and move every parameter it has until the shape is yours.',
      'flowshape convierte las matemáticas en arte. Elige uno de sus {n} generadores de patrones, repartidos en {f} familias —una malla de Voronoi, un teselado de Truchet, un campo de flujo, una forma de vóxeles— y mueve cada parámetro que tenga hasta que la forma sea tuya.',
    ],
  },
  { kind: 'support' },
  {
    kind: 'video',
    src: 'https://pub-6a0f4482746040e4a9d5bac43683870a.r2.dev/flowshape-promo.mp4',
    poster: '/showcase/promo.jpg',
    label: ['flowshape in 50 seconds', 'flowshape en 50 segundos'],
  },
  {
    kind: 'p',
    text: [
      'Then take it somewhere. Export a print-ready SVG or PNG at any paper size and finish it in Figma, Illustrator, Inkscape or Canva — flowshape deliberately does not try to be a design editor. Or give the same pattern a piece of music and let it move.',
      'Después llévatelo a alguna parte. Exporta un SVG o un PNG listo para imprimir en cualquier tamaño de papel y remátalo en Figma, Illustrator, Inkscape o Canva: flowshape, deliberadamente, no pretende ser un editor de diseño. O dale una pieza de música al mismo patrón y déjalo moverse.',
    ],
  },
  {
    kind: 'p',
    text: [
      'It is free and open source. There are no accounts and no back end: every pattern is computed in your browser, and your work never reaches anyone else’s machine.',
      'Es libre y de código abierto. No hay cuentas ni servidor propio: cada patrón se calcula en tu navegador, y tu trabajo nunca llega a la máquina de nadie más.',
    ],
  },
  { kind: 'h2', text: ['The link is the artwork', 'El enlace es la obra'] },
  {
    kind: 'p',
    text: [
      'The pattern, every parameter, the seed, the colour and the format are all encoded in the address bar. Copy the link and whoever opens it sees exactly what you saw — identical, down to the last coordinate. There is nothing to save and nothing to sign in to.',
      'El patrón, cada parámetro, la semilla, el color y el formato van codificados en la barra de direcciones. Copia el enlace y quien lo abra verá exactamente lo que tú viste, idéntico hasta la última coordenada. No hay nada que guardar ni sesión que iniciar.',
    ],
  },
  { kind: 'h2', text: ['The maths is not hidden', 'Las matemáticas no se esconden'] },
  {
    kind: 'p',
    text: [
      'Every pattern carries the equation that draws it, a plain-language reading of that equation, a note on what each parameter really does, and the primary source it comes from — in English and Spanish. Next to it sits the generator’s own code, exactly as it runs. Nothing is a rewritten teaching version.',
      'Cada patrón lleva consigo la ecuación que lo dibuja, una lectura en lenguaje llano de esa ecuación, una nota sobre lo que hace realmente cada parámetro y la fuente original de la que procede, en inglés y en español. Al lado está el propio código del generador, tal cual se ejecuta. Nada es una versión didáctica reescrita.',
    ],
  },
  { kind: 'h2', text: ['Patterns that move', 'Patrones que se mueven'] },
  {
    kind: 'p',
    text: [
      'Give a pattern an audio file or your microphone and it becomes a live visual. The weight of the bass, the brightness of the timbre and the attack of each onset drive its parameters, and a pattern with nothing continuous to move instead rebuilds itself on the beat. It plays on a stage sized 16:9 for a screen, 9:16 for a phone, or 1:1.',
      'Dale a un patrón un archivo de audio o tu micrófono y se convierte en un visual en vivo. El peso de los graves, el brillo del timbre y el ataque de cada golpe gobiernan sus parámetros, y un patrón que no tenga nada continuo que mover se reconstruye a sí mismo al ritmo. Se reproduce en un escenario 16:9 para pantalla, 9:16 para móvil o 1:1.',
    ],
  },
  {
    kind: 'p',
    text: [
      'Record it and download a video file with your audio in it, ready to post as it is. That file is encoded in your browser as well — nothing is uploaded to produce it.',
      'Grábalo y descarga un archivo de vídeo con tu audio dentro, listo para publicar tal cual. Ese archivo también se codifica en tu navegador: no se sube nada para generarlo.',
    ],
  },
  {
    kind: 'p',
    text: [
      'Your audio never leaves your browser. It is analysed as it plays, and there is nowhere to send it.',
      'Tu audio nunca sale del navegador. Se analiza mientras suena, y no hay adónde enviarlo.',
    ],
  },
  {
    kind: 'p',
    text: [
      'The animated stage is in development and is not live on the site yet.',
      'El escenario animado está en desarrollo y todavía no está publicado en el sitio.',
    ],
  },
  { kind: 'h2', text: ['The rules it keeps', 'Las reglas que respeta'] },
  {
    kind: 'ul',
    items: [
      [
        'Deterministic. The same link always produces the same image, because every random number comes from a seeded generator.',
        'Determinista. El mismo enlace produce siempre la misma imagen, porque todo número aleatorio sale de un generador con semilla.',
      ],
      [
        'Vector only. Pure SVG, no gradients, no filters, no blur. The quality has to come from the line, not from effects.',
        'Solo vectores. SVG puro, sin degradados, sin filtros, sin desenfoques. La calidad tiene que venir del trazo, no de los efectos.',
      ],
      [
        'Monochrome by default. Colour is opt-in and always flat.',
        'Monocromo por defecto. El color es opcional y siempre plano.',
      ],
      [
        'Bilingual throughout, English and Spanish, with nothing available in one language and missing in the other.',
        'Bilingüe de principio a fin, en inglés y español, sin nada que exista en un idioma y falte en el otro.',
      ],
    ],
  },
  { kind: 'h2', text: ['Privacy', 'Privacidad'] },
  {
    kind: 'p',
    text: [
      'Analytics is the only thing here that reaches a third party, and only if you agree to it. Accept the banner and Google Analytics counts which pages are opened, from which country, and on what kind of device. Decline and none of it loads — no script, no cookie, nothing stored. The tip jar is a plain link: nothing belonging to the payment host runs on this site. Your patterns, your parameters and your audio stay out of all of it, because they are never sent anywhere at all.',
      'La analítica es lo único aquí que llega a un tercero, y solo si lo aceptas. Si aceptas el aviso, Google Analytics cuenta qué páginas se abren, desde qué país y en qué tipo de dispositivo. Si lo rechazas, no se carga nada: ni script, ni cookie, ni dato guardado. El bote de propinas es un simple enlace: nada de la pasarela de pago se ejecuta en este sitio. Tus patrones, tus parámetros y tu audio quedan fuera de todo, porque no se envían a ninguna parte.',
    ],
  },
  {
    kind: 'p',
    text: [
      'You can change your mind whenever you like. The “Privacy choice” link in the footer of any page reopens the question, and withdrawing consent also deletes the cookies analytics had already set.',
      'Puedes cambiar de opinión cuando quieras. El enlace «Privacidad» del pie de cualquier página vuelve a abrir la pregunta, y al retirar el consentimiento se borran también las cookies que la analítica hubiera dejado.',
    ],
  },
  { kind: 'h2', text: ['Inspiration', 'Inspiración'] },
  {
    kind: 'p',
    text: [
      'flowshape was inspired by bookofshapes.com, which set the standard of craft this project aims at: hairline strokes, strict monochrome discipline, and compositions that commit rather than hedge. flowshape is an independent implementation — it shares no code with that site, and its pattern set, its parameter interface and its bilingual explanations are its own.',
      'flowshape se inspiró en bookofshapes.com, que fijó el estándar de oficio al que este proyecto aspira: trazos de grosor capilar, disciplina monocroma estricta y composiciones que se comprometen en lugar de quedarse a medias. flowshape es una implementación independiente: no comparte código con ese sitio, y su conjunto de patrones, su interfaz de parámetros y sus explicaciones bilingües son propios.',
    ],
  },
];

const CREDIT_HEADING: Pair = ['Who made this', 'Quién lo hizo'];
const CREDIT_TEXT: Pair = [
  'flowshape is built and maintained by {author}, in Madrid.',
  'flowshape está desarrollado y mantenido por {author}, en Madrid.',
];
const LICENCE_HEADING: Pair = ['Licence and source', 'Licencia y código'];
const LICENCE_TEXT: Pair = [
  'Released under the MIT licence. The full source lives on GitHub — issues and pull requests are welcome. Posters you generate are yours; the licence covers the software, not your output.',
  'Publicado bajo licencia MIT. El código completo está en GitHub y las incidencias y propuestas son bienvenidas. Los pósters que generes son tuyos: la licencia cubre el software, no tu obra.',
];

const at = (p: Pair, lang: Lang): string => (lang === 'es' ? p[1] : p[0]);

function extLink(href: string, text: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}

export function mountAbout(root: HTMLElement): void {
  const lang = currentLang();
  const patterns = listPatterns();
  const families = new Set(patterns.map((p) => p.family)).size;
  const fill = (s: string): string =>
    s.replace('{n}', String(patterns.length)).replace('{f}', String(families));

  root.innerHTML = '';
  document.documentElement.lang = lang;

  const article = document.createElement('article');
  article.className = 'about';

  const h1 = document.createElement('h1');
  h1.className = 'about-title';
  h1.textContent = lang === 'es' ? 'Acerca de flowshape' : 'About flowshape';
  article.append(h1);

  for (const block of BLOCKS) {
    if (block.kind === 'h2') {
      const h = document.createElement('h2');
      h.textContent = at(block.text, lang);
      article.append(h);
    } else if (block.kind === 'p') {
      const p = document.createElement('p');
      p.textContent = fill(at(block.text, lang));
      article.append(p);
    } else if (block.kind === 'video') {
      const figure = document.createElement('figure');
      figure.className = 'about-video';
      const video = document.createElement('video');
      video.src = block.src;
      video.poster = block.poster;
      video.controls = true;
      video.preload = 'none';
      video.playsInline = true;
      video.setAttribute('aria-label', at(block.label, lang));
      figure.append(video);
      article.append(figure);
    } else if (block.kind === 'support') {
      const heading = document.createElement('h2');
      heading.textContent = t('tip.support', lang);
      const text = document.createElement('p');
      text.textContent = t('tip.blurb', lang);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn about-tip-btn';
      btn.textContent = t('tip.support', lang);
      btn.addEventListener('click', () => openTipJar(lang));
      article.append(heading, text, btn);
    } else {
      const ul = document.createElement('ul');
      for (const item of block.items) {
        const li = document.createElement('li');
        li.textContent = fill(at(item, lang));
        ul.append(li);
      }
      article.append(ul);
    }
  }

  const creditHeading = document.createElement('h2');
  creditHeading.textContent = at(CREDIT_HEADING, lang);
  const credit = document.createElement('p');
  const [creditBefore, creditAfter] = at(CREDIT_TEXT, lang).split('{author}');
  credit.append(creditBefore!, extLink(AUTHOR_URL, AUTHOR_NAME), creditAfter ?? '');
  const orcid = document.createElement('p');
  orcid.className = 'about-orcid';
  orcid.append('ORCID ', extLink(ORCID_URL, '0009-0000-2026-0836'));
  article.append(creditHeading, credit, orcid);

  const licenceHeading = document.createElement('h2');
  licenceHeading.textContent = at(LICENCE_HEADING, lang);
  const licence = document.createElement('p');
  licence.textContent = at(LICENCE_TEXT, lang);
  const repo = document.createElement('p');
  repo.append(extLink(REPO_URL, 'github.com/Jossifresben/flowshape'));
  article.append(licenceHeading, licence, repo);

  root.append(buildNav(lang, 'about'), article, buildFooter(lang));
}
