import { listPatterns, type Family } from '../patterns/registry';
import { encodeState } from '../core/url-state';

/** Display name for each pattern id. Falls back to the id when absent. */
export const NAMES: Record<string, string> = {
  phyllotaxis: 'Phyllotaxis',
  maurer: 'Maurer Rose',
  stipple: 'Stipple Field',
  delaunay: 'Delaunay Mesh',
  voronoi: 'Voronoi Cells',
  harmonograph: 'Harmonograph',
  timestable: 'Times-Table Chords',
  flowfield: 'Flow Field',
  truchet: 'Truchet Arcs',
  hitomezashi: 'Hitomezashi',
  girih: 'Girih Stars',
  diffgrowth: 'Differential Growth',
  coulomb: 'Coulomb Field',
  bands: 'Concentric Bands',
  moire: 'Moiré Weave',
  fabric: 'Warped Fabric',
  roselattice: 'Rose Lattice',
  chirp: 'Converging Chirp',
  helix: 'Helix Ladder',
  voxel: 'Voxel Form',
  apollonian: 'Apollonian Circles',
};

/** Human label for each pattern family. */
export const FAMILY_LABELS: Record<Family, string> = {
  points: 'Points & Meshes',
  curves: 'Curves',
  fields: 'Fields',
  tilings: 'Tilings',
  growth: 'Growth',
  isometric: 'Isometric',
};

/** Canonical family display order for the filter chips. */
const FAMILY_ORDER: Family[] = ['points', 'curves', 'fields', 'tilings', 'isometric', 'growth'];

function patternHref(id: string): string {
  return encodeState({
    patternId: id,
    seed: 1,
    params: {},
    color: {},
    lang: 'en',
  });
}

export function mountGallery(root: HTMLElement): void {
  const patterns = listPatterns().sort((a, b) => a.id.localeCompare(b.id));
  const families = FAMILY_ORDER.filter((f) => patterns.some((p) => p.family === f));

  let activeFamily: Family | 'all' = 'all';

  root.innerHTML = '';

  // --- top bar ---
  const topbar = document.createElement('div');
  topbar.className = 'gal-topbar';

  const wordmark = document.createElement('div');
  wordmark.className = 'gal-wordmark';
  wordmark.innerHTML = 'flowshape<span class="gal-wordmark-dot">.art</span>';

  topbar.append(wordmark);

  // --- hero ---
  const hero = document.createElement('div');
  hero.className = 'gal-hero';

  const heroTop = document.createElement('div');
  heroTop.className = 'gal-hero-top';

  const headline = document.createElement('h1');
  headline.className = 'gal-headline';
  headline.innerHTML = 'Shape mathematics<br>into art.';

  const stats = document.createElement('div');
  stats.className = 'gal-stats';
  stats.textContent = `${patterns.length} PATTERNS · ${families.length} FAMILIES`;

  heroTop.append(headline, stats);

  const subtitle = document.createElement('p');
  subtitle.className = 'gal-subtitle';
  subtitle.textContent =
    'Play with a pattern, tune every parameter, then export a poster. Open source and free.';

  hero.append(heroTop, subtitle);

  // --- family filter chips ---
  const chipsRow = document.createElement('div');
  chipsRow.className = 'gal-chips';

  const grid = document.createElement('div');
  grid.className = 'gal-grid';

  function renderChips(): void {
    chipsRow.innerHTML = '';
    const makeChip = (key: Family | 'all', label: string): void => {
      const chip = document.createElement('button');
      chip.className = 'gal-chip' + (activeFamily === key ? ' active' : '');
      chip.textContent = label;
      chip.addEventListener('click', () => {
        activeFamily = key;
        renderChips();
        renderGrid();
      });
      chipsRow.append(chip);
    };
    makeChip('all', 'All');
    for (const f of families) makeChip(f, FAMILY_LABELS[f]);
  }

  function renderGrid(): void {
    grid.innerHTML = '';
    const visible = patterns.filter((p) => activeFamily === 'all' || p.family === activeFamily);
    for (const def of visible) {
      const card = document.createElement('a');
      card.className = 'gal-card';
      card.href = patternHref(def.id);

      const thumbBox = document.createElement('div');
      thumbBox.className = 'gal-thumb';
      const img = document.createElement('img');
      img.src = `/thumbs/${def.id}.svg`;
      img.alt = '';
      img.width = 240;
      img.height = 320;
      img.loading = 'lazy';
      img.decoding = 'async';
      thumbBox.append(img);

      const meta = document.createElement('div');
      meta.className = 'gal-meta';

      const name = document.createElement('span');
      name.className = 'gal-name';
      name.textContent = NAMES[def.id] ?? def.id;

      const family = document.createElement('span');
      family.className = 'gal-family';
      family.textContent = FAMILY_LABELS[def.family];

      meta.append(name, family);
      card.append(thumbBox, meta);
      grid.append(card);
    }
  }

  renderChips();
  renderGrid();

  root.append(topbar, hero, chipsRow, grid);
}
