import type { Family } from '../patterns/registry';
import type { Pair } from './index';

/** Display name for each pattern id. Proper nouns (Voronoi, Truchet,
 *  Hitomezashi, Girih) are never translated — only the common noun around
 *  them is. */
export const PATTERN_NAMES: Record<string, Pair> = {
  phyllotaxis: ['Phyllotaxis', 'Filotaxis'],
  maurer: ['Maurer Rose', 'Rosa de Maurer'],
  stipple: ['Stipple Field', 'Campo punteado'],
  delaunay: ['Delaunay Mesh', 'Malla de Delaunay'],
  voronoi: ['Voronoi Cells', 'Celdas de Voronoi'],
  harmonograph: ['Harmonograph', 'Armonógrafo'],
  timestable: ['Times-Table Chords', 'Cuerdas de la tabla de multiplicar'],
  flowfield: ['Flow Field', 'Campo de flujo'],
  truchet: ['Truchet Arcs', 'Arcos de Truchet'],
  hitomezashi: ['Hitomezashi', 'Hitomezashi'],
  girih: ['Girih Stars', 'Estrellas girih'],
  diffgrowth: ['Differential Growth', 'Crecimiento diferencial'],
  coulomb: ['Coulomb Field', 'Campo de Coulomb'],
  bands: ['Concentric Bands', 'Bandas concéntricas'],
  moire: ['Moiré Weave', 'Tejido muaré'],
  fabric: ['Warped Fabric', 'Tejido deformado'],
  roselattice: ['Rose Lattice', 'Retícula de rosa'],
  chirp: ['Converging Chirp', 'Chirrido convergente'],
  helix: ['Helix Ladder', 'Escalera helicoidal'],
  voxel: ['Voxel Form', 'Forma de vóxeles'],
  apollonian: ['Apollonian Circles', 'Círculos de Apolonio'],
  isoweave: ['Iso Weave', 'Tejido isométrico'],
  nested: ['Nested Shafts', 'Pozos anidados'],
  tumbling: ['Tumbling Blocks', 'Cubos reversibles'],
  interlace: ['Ribbon Interlace', 'Entrelazado de cintas'],
  billiard: ['Elliptic Billiard', 'Billar elíptico'],
  loxodrome: ['Möbius Flow', 'Flujo de Möbius'],
  mystery: ['Mystery Curve', 'Curva misteriosa'],
  curlicue: ['Curlicue Fractal', 'Fractal de volutas'],
  guilloche: ['Guilloché Rosette', 'Roseta guilloché'],
  knot: ['Lissajous Knot', 'Nudo de Lissajous'],
  hyperweave: ['Hyperbolic Weave', 'Tejido hiperbólico'],
};

/** Human label for each pattern family. */
export const FAMILY_NAMES: Record<Family, Pair> = {
  points: ['Points & Meshes', 'Puntos y mallas'],
  curves: ['Curves', 'Curvas'],
  fields: ['Fields', 'Campos'],
  tilings: ['Tilings', 'Teselados'],
  growth: ['Growth', 'Crecimiento'],
  isometric: ['Isometric', 'Isométricos'],
};
