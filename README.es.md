# flowshape

[![en vivo en flowshape.art](https://img.shields.io/badge/en%20vivo-flowshape.art-E3261A)](https://flowshape.art)
[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-111111.svg)](LICENSE)
[![ORCID 0009-0000-2026-0836](https://img.shields.io/badge/ORCID-0009--0000--2026--0836-A6CE39?logo=orcid&logoColor=white)](https://orcid.org/0009-0000-2026-0836)

**[flowshape.art](https://flowshape.art)** — juega con patrones matemáticos, ajusta sus parámetros y exporta un póster listo para imprimir.

Gratuito, de código abierto, sin cuentas y sin backend. Todo ocurre en el navegador.

*[Read this in English](README.md)*

---

## Qué es

Elige uno de los **25 generadores de patrones deterministas**, mueve los controles hasta que te guste, escoge un formato de papel y exporta en **SVG o PNG**. El SVG abre limpio en Figma, Illustrator, Inkscape o Canva, de modo que el acabado se hace en la herramienta que ya usas: flowshape, deliberadamente, *no* pretende ser un editor de pósters.

Dos cosas lo separan de un juguete:

- **La URL es el estado.** El identificador del patrón, cada parámetro, la semilla, el color y el formato van codificados en la barra de direcciones. Copia el enlace y cualquiera obtiene exactamente la misma obra, byte a byte. No hay nada que guardar ni sesión que iniciar.
- **Las matemáticas y el código están a la vista.** Cada patrón muestra la fórmula real que lo dibuja, su lectura en lenguaje llano, qué hace cada parámetro, la cita bibliográfica — y el código fuente del generador, sin retocar.

## Dentro de cada patrón

Cada patrón del playground tiene tres vistas.

**1 · La obra.** SVG en vivo, regenerado en cada movimiento de control, determinista a partir de la URL.

**2 · Explain the math.** No una glosa de marketing: la ecuación que el código implementa, en inglés y español, con la fuente primaria citada. Por ejemplo, la filotaxis:

```
θₙ = n · α                  (α ≈ 137,50776°, el ángulo áureo)
rₙ = s · n^p                (p = 0,5 en el modelo original de Vogel)
s  = R / (N − 1)^p          (R = radio máximo disponible en el marco)
```

> Cada punto *n* se coloca en el ángulo *n·α* y el radio *rₙ = s·n^p*. Como α es el ángulo áureo — el giro que divide la circunferencia completa en la proporción áurea — ningún número finito de puntos vuelve a caer sobre el mismo radio. Ese único hecho es todo el truco: es lo que permite que una cabeza de girasol, o este patrón, se rellene sin dejar nunca una costura visible ni un radio repetido.
>
> — *Fuente: Vogel, H. (1979) "A better way to construct the sunflower head", Mathematical Biosciences 44(3-4)*

Después se anota cada parámetro, indicando cuáles son matemática y cuáles son solo decisiones de dibujo: una distinción que la aplicación hace explícita, porque confundirlas es la forma habitual de salir creyendo que se ha entendido una fórmula que no.

**3 · Code.** El módulo generador real, cargado del propio código fuente, no una versión didáctica reescrita. El documento de filotaxis de arriba se corresponde con esto, íntegro:

```ts
const maxR = Math.min(size.w, size.h) * 0.47;
const scale = maxR / Math.pow(points - 1, exp);
for (let n = 0; n < points; n++) {
  const r = scale * Math.pow(n, exp);
  const a = n * angleRad;
  children.push(el('circle', {
    cx: cx + r * Math.cos(a),
    cy: cy + r * Math.sin(a),
    r: p['dotMin']! + n * p['dotGrow']!,
    fill: accent ? 'accent' : 'ink',
  }));
}
```

Cuarenta líneas, sin framework, sin una biblioteca oculta que haga la parte interesante. Esa es la idea: la distancia entre la ecuación y la imagen debería poder leerse de una sentada.

**Todas las fórmulas, explicaciones y citas del catálogo están reunidas en [docs/patterns.md](docs/patterns.md)** — generado a partir del registro vivo y del mismo contenido que sirve la aplicación, así que no puede desincronizarse.

## El catálogo

| Patrón | Familia | Patrón | Familia |
|---|---|---|---|
| Stipple Field | Puntos y mallas | Moiré Weave | Campos |
| Delaunay Mesh | Puntos y mallas | Warped Fabric | Campos |
| Voronoi Cells | Puntos y mallas | Converging Chirp | Campos |
| Phyllotaxis | Puntos y mallas | Truchet Arcs | Teselados |
| Apollonian Circles | Puntos y mallas | Hitomezashi | Teselados |
| Harmonograph | Curvas | Girih Stars | Teselados |
| Maurer Rose | Curvas | Ribbon Interlace | Teselados |
| Times-Table Chords | Curvas | Voxel Form | Isométricos |
| Concentric Bands | Curvas | Iso Weave | Isométricos |
| Rose Lattice | Curvas | Nested Shafts | Isométricos |
| Helix Ladder | Curvas | Tumbling Blocks | Isométricos |
| Flow Field | Campos | Differential Growth | Crecimiento |
| Coulomb Field | Campos | | |

Las fuentes van de Vogel y Descartes a Hankin, Truchet, Seaton, Jobard y Lefer, Quílez, Newell y Müller-Brockmann. Detalle completo — fórmula, explicación, parámetros, cita — en **[docs/patterns.md](docs/patterns.md)**.

## Reglas de diseño

Son restricciones, no accidentes:

- **Determinismo.** Nada de `Math.random` ni de `Date`. Toda la aleatoriedad sale de un PRNG `mulberry32` con semilla, dividido por subsistema para que dos flujos aleatorios dentro de un patrón nunca interfieran. Misma URL ⇒ mismo SVG, siempre. La suite de tests fija instantáneas de cada patrón para garantizarlo.
- **SVG puro.** Sin canvas en la ruta del póster, sin pasos rasterizados, sin degradados, sin filtros, sin desenfoques. La calidad viene del trazo, no de trucos de renderizado.
- **Monocromo por defecto.** Tinta sobre papel. El color es opcional, plano y se genera en OKLCH para que la luminosidad se mantenga perceptualmente pareja entre tonos, con un mínimo de contraste papel/tinta verificado por barrido exhaustivo en todo el espacio de control.
- **Roles de color, no códigos hex.** Los generadores emiten los tokens `ink` / `paper` / `accent`; la paleta se resuelve al renderizar. Eso es lo que permite que cualquier paleta —tinta sobre casi negro, tinta sobre blanco papel— se aplique a todos los patrones sin tocar un solo generador.
- **Marco normalizado.** El lado corto está fijo en 600 unidades de usuario, así que un grosor de trazo pesa lo mismo en A5 que en 24×36″.
- **Ningún archivo por encima de ~400 líneas.** Un archivo por responsabilidad.

## El escenario animado — visualizador de audio

> **En desarrollo.** Especificado, planificado, con un spike funcional que quitó el riesgo, y la capa de análisis construida y testeada. Aún no está en `main` ni publicado.

Coge un patrón que hayas ajustado, dale audio —un archivo o el micrófono— y se mueve con el sonido. La pantalla en vivo es el producto; la exportación de vídeo es una captura de esa misma tubería.

- **Seis características por fotograma** — `bass`, `mid`, `high`, `level`, `bright` (centroide espectral) y `flux` — con autoganancia por banda, para que una nota de voz module tanto como un tema masterizado, y después suavizadas por un seguidor de envolvente. Los fotogramas crudos de la FFT nunca tocan un parámetro: las envolventes son lo que hace que el movimiento sea musical en vez de nervioso.
- **Consciente del pulso.** En modo archivo, los ataques y el tempo se precalculan sobre el búfer completo, así que el siguiente fotograma puede construirse *antes* del golpe y cambiarse justo en él. En modo micrófono, la detección es en tiempo real.
- **Los 25 patrones se animan.** Modulación continua por fotograma donde la geometría lo permite; y un modo de eventos cuantizados al pulso —resembrar, avanzar un parámetro estructural, invertir un booleano— para todo lo demás, incluidos los teselados discretos que no tienen nada continuo que mover.
- **Los mismos generadores, otro renderizador.** Un adaptador dibuja el árbol `SvgNode` existente sobre canvas2d, contrastado con la salida SVG mediante una comparación de píxeles por patrón. La ruta del póster sigue siendo SVG puro.
- **Formatos de escenario** 16:9, 9:16, 1:1. La exportación es hoy una captura con `MediaRecorder`; un codificador WebCodecs offline y determinista —mismo audio + misma URL ⇒ vídeo idéntico byte a byte— es la fase siguiente.
- **El audio nunca sale del navegador.** No hay adónde enviarlo.

Una regla se dobla aquí y solo aquí: **el color y los degradados sí se permiten en el escenario animado**, con el centroide espectral gobernando el tono y el nivel la croma en OKLCH, de modo que el silencio decae de vuelta al monocromo. La ruta del póster queda intacta: colores planos, sin degradados, monocromo por defecto. Una pantalla en movimiento y una hoja impresa son medios distintos.

Diseño completo: **[docs/audio-visualizer.md](docs/audio-visualizer.md)**.

## Puesta en marcha

```bash
npm install
npm run dev
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo Vite (`localhost:5173`) |
| `npm test` | Suite completa de Vitest, con las instantáneas deterministas de los patrones |
| `npm run thumbs` | Regenera las miniaturas `public/thumbs/*.svg` de la galería |
| `npm run build` | Comprueba tipos, regenera miniaturas y empaqueta en `dist/` |
| `npm run preview` | Sirve localmente la compilación de producción |

Sin variables de entorno, sin servicios, sin claves de API. La salida de `npm run build` es una carpeta estática — desplegada aquí en Netlify.

Todos los patrones pasan por un banco de pruebas común que comprueba el determinismo, fija una instantánea de la salida, lleva cada parámetro a sus extremos buscando `NaN`/`Infinity` y hace cumplir un presupuesto de elementos.

## Estructura

```
src/
  core/       prng · url-state · constructor SVG · ruido · geometría · oklch · persist
  patterns/   registro + un módulo por patrón (25) + presets, randomize
  poster/     formatos · paletas · exportación (SVG / PNG)
  ui/         galería · playground · controles · modal · markdown
  content/    explain/<patrón>.<en|es>.md — fórmula, explicación, cita
  audio/      dsp · features · onsets (capa de análisis del escenario animado)
  workers/    generación fuera del hilo principal para patrones pesados
scripts/      build-thumbs.ts (paso prebuild)
tests/        Vitest — core, patrones (con instantáneas), póster, ui, audio
docs/         arquitectura, patrones, esquema de URL, visualizador de audio, specs y planes
```

## Documentación

- **[docs/architecture.md](docs/architecture.md)** — cómo encajan las piezas, el contrato de patrón, el sistema de roles de color, los no-objetivos
- **[docs/patterns.md](docs/patterns.md)** — fórmula, explicación, parámetros y fuente de cada patrón, y cómo añadir uno
- **[docs/url-state.md](docs/url-state.md)** — el esquema de URL y sus reglas de compatibilidad
- **[docs/audio-visualizer.md](docs/audio-visualizer.md)** — el diseño del escenario animado
- **[docs/research/](docs/research/)** — los catálogos matemáticos verificados de los que salieron los patrones
- **[docs/superpowers/](docs/superpowers/)** — especificaciones de diseño y planes de implementación, parte por parte
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — convenciones, tests y qué debe cumplir un patrón nuevo

## Inspiración y créditos

flowshape está **inspirado en [bookofshapes.com](https://bookofshapes.com)**, que sirvió de referencia y guía de calidad durante todo el proyecto: fijó el estándar de oficio al que este trabajo aspira — trazos de grosor capilar, disciplina monocroma estricta, registros compositivos sin medias tintas y oclusión real en lugar de mezcla por transparencia.

flowshape es una implementación independiente. No comparte código con ese sitio; el conjunto de patrones, la interfaz de parámetros, las explicaciones matemáticas bilingües, el modelo de URL-como-estado y la exportación de pósters son propios.

Cada patrón cita sus propias fuentes matemáticas dentro de `src/content/explain/`.

## Autor

**Jose "Jossi" Fresco Benaim** — [ORCID 0009-0000-2026-0836](https://orcid.org/0009-0000-2026-0836) · [jossifresco.com](https://jossifresco.com)

Si usas flowshape en un trabajo publicado, consulta [CITATION.cff](CITATION.cff).

## Licencia

[MIT](LICENSE) © 2026 Jose "Jossi" Fresco Benaim.

Los pósters que generes son tuyos: la licencia cubre este software, no tu obra.
