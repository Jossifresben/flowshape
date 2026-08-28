/** Query keys owned by the app shell; pattern params may not use them.
 *  Includes Part 3's poster keys already so patterns can never collide. */
export const RESERVED = new Set([
  'v', 'seed', 'pal', 'bg', 'ink', 'acc', 'theme', 'lang',
  'layout', 'format', 'title', 'caption',
]);
