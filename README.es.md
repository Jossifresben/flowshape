# flowshape

**[flowshape.art](https://flowshape.art)** — juega con patrones matemáticos, ajusta sus parámetros y exporta un póster listo para imprimir.

Gratuito, de código abierto, sin cuentas y sin backend. Todo ocurre en el navegador.

*[Read this in English](README.md)*

---

## Qué es

Elige uno de los **25 generadores de patrones deterministas**, mueve los controles hasta que te guste, escoge un formato de papel y exporta en **SVG o PNG**. El SVG abre limpio en Figma, Illustrator, Inkscape o Canva, de modo que el acabado se hace en la herramienta que ya usas: flowshape, deliberadamente, *no* pretende ser un editor de pósters.

Dos cosas lo separan de un juguete:

- **La URL es el estado.** El identificador del patrón, cada parámetro, la semilla, el color y el formato van codificados en la barra de direcciones. Copia el enlace y cualquiera obtiene exactamente la misma obra, byte a byte. No hay nada que guardar ni sesión que iniciar.
- **Las matemáticas están a la vista.** Cada patrón tiene un panel *Explain the math*: la fórmula real, su lectura en lenguaje llano, qué hace cada parámetro y la cita bibliográfica; más una pestaña *Code* con el código fuente del generador que acaba de dibujar lo que estás viendo.

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

Tabla completa con parámetros y fuentes: **[docs/patterns.md](docs/patterns.md)**.

## Reglas de diseño

Son restricciones, no accidentes:

- **Determinismo.** Nada de `Math.random` ni de `Date`. Toda la aleatoriedad sale de un PRNG `mulberry32` con semilla. Misma URL ⇒ mismo SVG, siempre. La suite de tests fija instantáneas de la salida para garantizarlo.
- **SVG puro.** Sin canvas en la ruta del póster, sin pasos rasterizados, sin degradados, sin filtros, sin desenfoques. La calidad viene del trazo, no de trucos de renderizado.
- **Monocromo por defecto.** Tinta sobre papel. El color es opcional, plano y se genera en OKLCH para que la luminosidad se mantenga perceptualmente pareja entre tonos.
- **Roles de color, no códigos hex.** Los generadores emiten los tokens `ink` / `paper` / `accent`; la paleta se resuelve al renderizar. Eso es lo que permite que cualquier paleta —tinta sobre casi negro, tinta sobre blanco papel— se aplique a todos los patrones sin tocar un solo generador.
- **Ningún archivo por encima de ~400 líneas.** Un archivo por responsabilidad.

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

## Estructura

```
src/
  core/       prng · url-state · constructor SVG · ruido · geometría · oklch · persist
  patterns/   registro + un módulo por patrón (25) + presets, randomize
  poster/     formatos · paletas · exportación (SVG / PNG)
  ui/         galería · playground · controles · modal · markdown
  content/    explain/<patrón>.<en|es>.md — fórmula, explicación, cita
  workers/    generación fuera del hilo principal para patrones pesados
scripts/      build-thumbs.ts (paso prebuild)
tests/        Vitest — core, patrones (con instantáneas), póster, ui, audio
docs/         arquitectura, patrones, esquema de URL, investigación, specs y planes
```

## Documentación

- **[docs/architecture.md](docs/architecture.md)** — cómo encajan las piezas, el contrato de patrón, el sistema de roles de color
- **[docs/patterns.md](docs/patterns.md)** — el catálogo y cómo añadir un patrón
- **[docs/url-state.md](docs/url-state.md)** — el esquema de URL y sus reglas de compatibilidad
- **[docs/research/](docs/research/)** — los catálogos matemáticos verificados de los que salieron los patrones
- **[docs/superpowers/](docs/superpowers/)** — especificaciones de diseño y planes de implementación, parte por parte
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — convenciones, tests y qué debe cumplir un patrón nuevo

## Inspiración y créditos

flowshape está **inspirado en [bookofshapes.com](https://bookofshapes.com)**, que sirvió de referencia y guía de calidad durante todo el proyecto: fijó el estándar de oficio al que este trabajo aspira — trazos de grosor capilar, disciplina monocroma estricta, registros compositivos sin medias tintas y oclusión real en lugar de mezcla por transparencia. El análisis que orientó el rumbo propio de flowshape se conserva en [docs/research/2026-08-29-bookofshapes-competitive.md](docs/research/2026-08-29-bookofshapes-competitive.md).

flowshape es una implementación independiente. No comparte código con ese sitio; el conjunto de patrones, la interfaz de parámetros, las explicaciones matemáticas bilingües, el modelo de URL-como-estado y la exportación de pósters son propios.

Cada patrón cita sus propias fuentes matemáticas — Vogel, Descartes, Jobard y Lefer, Quilez, Hankin, Müller-Brockmann y otros — dentro de `src/content/explain/`.

## Autor

**Jose "Jossi" Fresco Benaim** — [ORCID 0009-0000-2026-0836](https://orcid.org/0009-0000-2026-0836) · [jossifresco.com](https://jossifresco.com)

Si usas flowshape en un trabajo publicado, consulta [CITATION.cff](CITATION.cff).

## Licencia

[MIT](LICENSE) © 2026 Jose "Jossi" Fresco Benaim.

Los pósters que generes son tuyos: la licencia cubre este software, no tu obra.
