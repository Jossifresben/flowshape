# flowshape

[![en vivo en flowshape.art](https://img.shields.io/badge/en%20vivo-flowshape.art-E3261A)](https://flowshape.art)
[![DOI 10.5281/zenodo.22164865](https://zenodo.org/badge/DOI/10.5281/zenodo.22164865.svg)](https://doi.org/10.5281/zenodo.22164865)
[![código en GitHub](https://img.shields.io/badge/c%C3%B3digo-GitHub-181717?logo=github&logoColor=white)](https://github.com/Jossifresben/flowshape)
[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-111111.svg)](LICENSE)
[![ORCID 0009-0000-2026-0836](https://img.shields.io/badge/ORCID-0009--0000--2026--0836-A6CE39?logo=orcid&logoColor=white)](https://orcid.org/0009-0000-2026-0836)

**[flowshape.art](https://flowshape.art)** — convierte las matemáticas en arte.

Explora 30 generadores de patrones, lee las matemáticas que dibujan cada uno y llévate el resultado como póster listo para imprimir o como un visual que se mueve con tu música.

Gratuito, de código abierto, sin cuentas y sin backend. Todo ocurre en el navegador.

*[Read this in English](README.md)*

---

## Novedades

**v1.2.0 — una galería comisariada.** Obra escogida a mano en **[flowshape.art/#/gallery](https://flowshape.art/#/gallery)**, en tres pestañas: diseños, pósters y grabaciones del escenario animado. Los pósters son URL vivas del compositor, no imágenes exportadas: se mantienen nítidos a cualquier tamaño y se abren en el compositor en ese estado exacto. Los vídeos suenan y se ven enteros, al pulsar y no al pasar.

**v1.1.0 — guardar y compartir.** Guarda cualquier diseño, póster o animación y vuelve a encontrarlo en **#/saved** — renómbralo, elimínalo o exporta la colección como JSON para llevártela a otro navegador. Un control de compartir en cada vista entrega el enlace que reproduce exactamente lo que estás viendo.

Ambas cosas descansan sobre la misma idea que todo lo demás: un favorito *es* una URL, así que nada de la obra se duplica y nada se queda desfasado.

---

## Qué es

flowshape convierte las matemáticas en arte. Elige uno de los **30 generadores de patrones deterministas** —una malla de Voronoi, un teselado de Truchet, un campo de flujo, una forma de vóxeles— mueve cada parámetro que tenga y observa cómo responde la forma.

Después, llévatelo a alguna parte:

- **Impresión.** Exporta el patrón desnudo en **SVG o PNG** a cualquier tamaño de papel. El SVG abre limpio en Figma, Illustrator, Inkscape o Canva, de modo que el acabado se hace en la herramienta que ya usas.
- **Composición.** O coloca el patrón dentro de una hoja diseñada —campo de obra, bloque de título, tabla de parámetros, marca de acento— y recorre composiciones con una flecha. flowshape sigue sin ser un editor por elementos: eliges entre composiciones validadas en lugar de arrastrar cajas. *Véase [el compositor de pósters](#el-compositor-de-pósters).*
- **Guardar.** Marca con una estrella lo que merezca la pena y te espera en **#/saved** — diseños, pósters y animaciones juntos, con nombre editable y exportables a un archivo.
- **Movimiento.** Dale audio al mismo patrón —un archivo o el micrófono— y se moverá con el sonido en un escenario 16:9, 9:16 o 1:1. Grábalo y descarga un archivo de vídeo con tu audio dentro. *Véase [el escenario animado](#el-escenario-animado--visualizador-de-audio).*

Dos cosas lo separan de un juguete:

- **La URL es el estado.** El identificador del patrón, cada parámetro, la semilla, el color y el formato van codificados en la barra de direcciones. Copia el enlace y cualquiera obtiene exactamente la misma obra, byte a byte. No hay cuenta ni servidor: lo que decidas conservar se guarda en tu propio navegador.
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

**Puntos y mallas** *(5)* — [Phyllotaxis](docs/patterns.md#phyllotaxis) · [Stipple Field](docs/patterns.md#stipple-field) · [Delaunay Mesh](docs/patterns.md#delaunay-mesh) · [Voronoi Cells](docs/patterns.md#voronoi-cells) · [Apollonian Circles](docs/patterns.md#apollonian-circles)

**Curvas** *(6)* — [Maurer Rose](docs/patterns.md#maurer-rose) · [Harmonograph](docs/patterns.md#harmonograph) · [Times-Table Chords](docs/patterns.md#times-table-chords) · [Concentric Bands](docs/patterns.md#concentric-bands) · [Rose Lattice](docs/patterns.md#rose-lattice) · [Helix Ladder](docs/patterns.md#helix-ladder)

**Campos** *(5)* — [Flow Field](docs/patterns.md#flow-field) · [Coulomb Field](docs/patterns.md#coulomb-field) · [Moiré Weave](docs/patterns.md#moiré-weave) · [Warped Fabric](docs/patterns.md#warped-fabric) · [Converging Chirp](docs/patterns.md#converging-chirp)

**Teselados** *(4)* — [Truchet Arcs](docs/patterns.md#truchet-arcs) · [Hitomezashi](docs/patterns.md#hitomezashi) · [Girih Stars](docs/patterns.md#girih-stars) · [Ribbon Interlace](docs/patterns.md#ribbon-interlace)

**Isométricos** *(4)* — [Voxel Form](docs/patterns.md#voxel-form) · [Iso Weave](docs/patterns.md#iso-weave) · [Nested Shafts](docs/patterns.md#nested-shafts) · [Tumbling Blocks](docs/patterns.md#tumbling-blocks)

**Crecimiento** *(1)* — [Differential Growth](docs/patterns.md#differential-growth)

Los 30, con la fórmula, la explicación, los parámetros y la cita de cada uno, en **[docs/patterns.md](docs/patterns.md)**. Las fuentes van de Vogel y Descartes a Hankin, Truchet, Seaton, Jobard y Lefer, Quílez, Newell y Müller-Brockmann.

## Reglas de diseño

Son restricciones, no accidentes:

- **Determinismo.** Nada de `Math.random` ni de `Date`. Toda la aleatoriedad sale de un PRNG `mulberry32` con semilla, dividido por subsistema para que dos flujos aleatorios dentro de un patrón nunca interfieran. Misma URL ⇒ mismo SVG, siempre. La suite de tests fija instantáneas de cada patrón para garantizarlo.
- **SVG puro.** Sin canvas en la ruta del póster, sin pasos rasterizados, sin degradados, sin filtros, sin desenfoques. La calidad viene del trazo, no de trucos de renderizado.
- **Monocromo por defecto.** Tinta sobre papel. El color es opcional, plano y se genera en OKLCH para que la luminosidad se mantenga perceptualmente pareja entre tonos, con un mínimo de contraste papel/tinta verificado por barrido exhaustivo en todo el espacio de control.
- **Roles de color, no códigos hex.** Los generadores emiten los tokens `ink` / `paper` / `accent`; la paleta se resuelve al renderizar. Eso es lo que permite que cualquier paleta —tinta sobre casi negro, tinta sobre blanco papel— se aplique a todos los patrones sin tocar un solo generador.
- **Marco normalizado.** El lado corto está fijo en 600 unidades de usuario, así que un grosor de trazo pesa lo mismo en A5 que en 24×36″.
- **Ningún archivo por encima de ~400 líneas.** Un archivo por responsabilidad.

## El compositor de pósters

La exportación te da la obra. El compositor te da la hoja: el patrón colocado dentro de un póster diseñado, con bloque de título, su descripción de una frase, una tabla de parámetros y una única marca de acento.

No es un editor. **Una composición es un dato, no código**: un registro que nombra un modo por región (campo de obra, bloque de título, bloque de datos, marca de acento) más un punto de corte, márgenes y el rango de proporciones que admite. Un único renderizador resuelve cualquiera de esos registros, y un validador reúne en un solo predicado todas las reglas de composición. Añadir una novena composición es un registro en `src/compose/skeletons.ts` y ningún otro archivo; fuera de ese archivo, nada puede ramificar según el id de una composición.

- **Ocho composiciones de referencia, expandidas.** Cada una varía en sus ejes libres —posición del corte, decoración, marca de acento— hasta dar 68 variantes navegables en A3, todas validadas. Una pasada por la lista muestra cada composición distinta antes de empezar a refinarlas.
- **Manda el formato que ya elegiste.** Los puntos de corte se guardan como fracciones, nunca como píxeles, y cada composición declara las proporciones de hoja que resiste. Elige una hoja cuadrada o apaisada y se te ofrecen las que funcionan en esa proporción (20 de las 68) en vez de una que se romperá.
- **Las gamas se generan, no se tabulan.** Doce pasos alrededor del círculo de tono, muestreados en OKLCH a claridades fijas. El acento se muestrea dos veces, porque hace dos trabajos: una marca en L 0,50 que supera 4,5:1 sobre el papel en todos los tonos, y un campo en L 0,78 para las composiciones donde el acento pasa a ser fondo entero. Los neutros llevan algo de croma para que responda la hoja entera, y no solo el rincón que sostiene la marca.
- **Invertir es cambiar la paleta.** La obra es SVG con tokens de rol de color, así que poner formas oscuras sobre una hoja clara reemite el árbol con otra paleta. Sin filtros, sin paso rasterizado, sin modos de fusión: la exportación sigue siendo un vector limpio.
- **Ocultar el texto.** Una casilla elimina todo elemento de texto y conserva la composición, para cuando quieras la hoja sin las palabras.
- **El desbordamiento está especificado, no confiado a la suerte.** Un título que no cabe reduce un 8% por intento hasta un suelo, y por debajo de ahí la composición se rechaza en vez de recortarse con puntos suspensivos: la lista sencillamente no ofrece una composición incapaz de sostener el nombre del patrón.

Todo queda en la URL como en el resto de la app, así que un póster compuesto se reproduce desde su enlace.

Diseño completo: **[docs/poster-composer.md](docs/poster-composer.md)**.

## El escenario animado — visualizador de audio

> **En producción.**

Coge un patrón que hayas ajustado, dale audio —un archivo o el micrófono— y se mueve con el sonido. La pantalla en vivo es el producto; la exportación de vídeo es una captura de esa misma tubería.

- **Seis características por fotograma** — `bass`, `mid`, `high`, `level`, `bright` (centroide espectral) y `flux` — con autoganancia por banda, para que una nota de voz module tanto como un tema masterizado, y después suavizadas por un seguidor de envolvente. Los fotogramas crudos de la FFT nunca tocan un parámetro: las envolventes son lo que hace que el movimiento sea musical en vez de nervioso.
- **Consciente del pulso.** En modo archivo, los ataques y el tempo se precalculan sobre el búfer completo, así que el siguiente fotograma puede construirse *antes* del golpe y cambiarse justo en él. En modo micrófono, la detección es en tiempo real.
- **Los 30 patrones se animan.** Modulación continua por fotograma donde la geometría lo permite; y un modo de eventos cuantizados al pulso —resembrar, avanzar un parámetro estructural, invertir un booleano— para todo lo demás, incluidos los teselados discretos que no tienen nada continuo que mover.
- **Los mismos generadores, otro renderizador.** Un adaptador dibuja el árbol `SvgNode` existente sobre canvas2d, contrastado con la salida SVG mediante una comparación de píxeles por patrón. La ruta del póster sigue siendo SVG puro.
- **Descarga el vídeo.** Graba el escenario y guarda un **MP4** con el audio incorporado, a 1920×1080, 1080×1920 o 1080×1080. La captura pasa por `MediaRecorder`, con reserva en WebM para los navegadores que no graben H.264/AAC; un codificador WebCodecs offline y determinista —mismo audio + misma URL ⇒ MP4 idéntico byte a byte, más rápido que en tiempo real— es la fase siguiente.
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
  core/       prng · url-state · constructor SVG · ruido · geometría · oklch · persist · saved
  patterns/   registro + un módulo por patrón (30) + presets, randomize
  poster/     formatos · paletas · exportación (SVG / PNG)
  compose/    compositor de pósters — units · colorways · regions · skeletons · variants · render
  ui/         galería · showcase · playground · póster · animate · saved · acerca de
              nav · pie · controles · modal · tabs · thumb · star · share · toast
  i18n/       tablas EN/ES: textos de la interfaz, nombres de patrones, etiquetas
  content/    explain/<patrón>.<en|es>.md — fórmula, explicación, cita
              blurbs.ts — la descripción de una línea EN/ES que imprime cada póster
              showcase.ts — la galería comisariada: diseños, pósters, vídeos
  audio/      dsp · features · onsets (capa de análisis del escenario animado)
  workers/    generación fuera del hilo principal para patrones pesados
scripts/      build-thumbs.ts (paso prebuild)
tests/        Vitest — core, patrones (con instantáneas), póster, compose, ui, audio, anim
docs/         arquitectura, patrones, esquema de URL, visualizador de audio, specs y planes
```

## Documentación

- **[docs/architecture.md](docs/architecture.md)** — cómo encajan las piezas, el contrato de patrón, el sistema de roles de color, los no-objetivos
- **[docs/patterns.md](docs/patterns.md)** — fórmula, explicación, parámetros y fuente de cada patrón, y cómo añadir uno
- **[docs/url-state.md](docs/url-state.md)** — el esquema de URL y sus reglas de compatibilidad
- **[docs/poster-composer.md](docs/poster-composer.md)** — el modelo de regiones, el registro de composiciones y el sistema de color
- **[docs/audio-visualizer.md](docs/audio-visualizer.md)** — el diseño del escenario animado
- **[docs/research/](docs/research/)** — los catálogos matemáticos verificados de los que salieron los patrones
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
