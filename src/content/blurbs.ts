/**
 * One sentence per pattern, in both languages, inside the poster's
 * 140-character budget.
 *
 * Deliberately separate from `src/content/explain/*.md`: those are long-form
 * teaching documents with citations and per-parameter notes, and a poster
 * needs a line.
 */
export const BLURBS: Record<string, { en: string; es: string }> = {
  phyllotaxis: {
    en: 'Seeds placed one golden angle apart, the packing that sunflowers and pinecones arrive at.',
    es: 'Semillas separadas por el ángulo áureo, el empaquetado al que llegan girasoles y piñas.',
  },
  maurer: {
    en: 'A rose curve walked in fixed angular steps, so the chords draw a lattice the petals never show.',
    es: 'Una curva rosa recorrida a pasos angulares fijos: las cuerdas dibujan una retícula que los pétalos ocultan.',
  },
  stipple: {
    en: 'Points relaxed away from each other until their density, not their position, carries the image.',
    es: 'Puntos que se repelen hasta que la densidad, y no la posición, es la que sostiene la imagen.',
  },
  delaunay: {
    en: 'The triangulation that avoids thin slivers, built by inserting one point at a time.',
    es: 'La triangulación que evita triángulos alargados, construida insertando un punto cada vez.',
  },
  voronoi: {
    en: 'Every point claims the region closer to it than to any other, and the borders fall where claims meet.',
    es: 'Cada punto reclama la región más cercana a él, y las fronteras caen donde los reclamos se encuentran.',
  },
  harmonograph: {
    en: 'Two decaying pendulums drawing against each other, the trace a Victorian drawing machine leaves.',
    es: 'Dos péndulos que se amortiguan dibujando uno contra otro: el trazo de una máquina victoriana.',
  },
  timestable: {
    en: 'Chords joining n to n times k around a circle, where the envelope becomes a cardioid.',
    es: 'Cuerdas que unen n con n por k en un círculo, cuya envolvente se convierte en una cardioide.',
  },
  flowfield: {
    en: 'Particles carried by a noise field, each path a record of where the current took it.',
    es: 'Partículas arrastradas por un campo de ruido; cada trazo registra adónde las llevó la corriente.',
  },
  truchet: {
    en: 'One tile with two rotations, laid at random until the arcs join into loops nobody placed.',
    es: 'Una tesela con dos rotaciones, colocada al azar hasta que los arcos forman bucles que nadie trazó.',
  },
  hitomezashi: {
    en: 'Running stitches offset by a binary sequence, the sashiko pattern that emerges from coin flips.',
    es: 'Puntadas desplazadas por una secuencia binaria: el sashiko japonés que surge de lanzar monedas.',
  },
  girih: {
    en: 'Five tiles with strapwork lines that continue across every edge, the geometry of Islamic star patterns.',
    es: 'Cinco teselas con líneas que continúan por cada arista: la geometría de los patrones estrellados islámicos.',
  },
  diffgrowth: {
    en: 'A closed curve that lengthens faster than its space allows, so it buckles the way coral does.',
    es: 'Una curva cerrada que crece más rápido de lo que su espacio permite y se pliega como el coral.',
  },
  coulomb: {
    en: 'Field lines leaving charges and bending toward their opposites, traced step by step.',
    es: 'Líneas de campo que salen de las cargas y se curvan hacia sus opuestas, trazadas paso a paso.',
  },
  bands: {
    en: 'Concentric arcs whose thickness grows by a power law, so the spacing reads as depth.',
    es: 'Arcos concéntricos cuyo grosor crece según una ley de potencias, y el espaciado se lee como profundidad.',
  },
  moire: {
    en: 'Two regular grids overlaid at a small angle, where the interference is larger than either grid.',
    es: 'Dos retículas regulares superpuestas en ángulo pequeño: la interferencia es mayor que ambas.',
  },
  fabric: {
    en: 'A woven grid pushed through a smooth distortion, so the weave reports the shape of the field.',
    es: 'Una retícula tejida atravesada por una distorsión suave: el tejido revela la forma del campo.',
  },
  roselattice: {
    en: 'Rose curves at stacked frequencies, their crossings settling into a lattice.',
    es: 'Curvas rosa en frecuencias apiladas, cuyos cruces se asientan en una retícula.',
  },
  chirp: {
    en: 'A wave whose frequency climbs as it travels, drawn until the crests collide.',
    es: 'Una onda cuya frecuencia sube al avanzar, dibujada hasta que las crestas colisionan.',
  },
  helix: {
    en: 'Two offset spirals joined by rungs, the ladder a double helix makes when flattened.',
    es: 'Dos espirales desfasadas unidas por travesaños: la escalera que forma una doble hélice al aplanarse.',
  },
  voxel: {
    en: 'A cubic lattice sampled by a density field and drawn back to front in isometric projection.',
    es: 'Una malla cúbica muestreada por un campo de densidad y dibujada de atrás hacia delante en isometría.',
  },
  apollonian: {
    en: 'Circles packed into the gaps between circles, each generation smaller and exactly tangent.',
    es: 'Círculos empaquetados en los huecos entre círculos, cada generación menor y exactamente tangente.',
  },
  isoweave: {
    en: 'Isometric strands crossing over and under on a triangular grid, so the plane reads as woven.',
    es: 'Hebras isométricas que se cruzan por encima y por debajo en una retícula triangular.',
  },
  nested: {
    en: 'Shafts set inside shafts in isometric projection, each opening onto the next.',
    es: 'Ejes encajados dentro de ejes en proyección isométrica, cada uno abriéndose al siguiente.',
  },
  tumbling: {
    en: 'Three rhombi shaded as cube faces, the tiling that flips between convex and concave as you look.',
    es: 'Tres rombos sombreados como caras de un cubo: el teselado que oscila entre convexo y cóncavo.',
  },
  interlace: {
    en: 'Ribbons woven over and under in a closed circuit, the logic behind Celtic knotwork.',
    es: 'Cintas entrelazadas por encima y por debajo en circuito cerrado: la lógica del nudo celta.',
  },
};
