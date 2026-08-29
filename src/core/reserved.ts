/** Query keys owned by the app shell; pattern params may not use them.
 *  Includes Part 3's poster keys already so patterns can never collide.
 *  'theme' is no longer a real app state field (the site is dark-only), but it
 *  stays reserved so stale `theme=` params from old shared links are silently
 *  ignored rather than misread as a pattern param. */
export const RESERVED = new Set([
  'v', 'seed', 'pal', 'bg', 'ink', 'acc', 'theme', 'lang',
  'layout', 'format', 'title', 'caption', 'cway', 'notext',
  'hue', 'chroma', 'paperL', 'accentShift',
  'cw', 'ch', 'cu',
]);
