# URL state

The address bar is the save file. Everything needed to reproduce a poster —
pattern, parameters, seed, colour, paper format and language — is encoded in the
hash, so a copied link is a complete, self-contained document.

## Schema

```
#/p/<patternId>?v=1&seed=71203&points=1500&angle=137.5078&hue=250&chroma=0.08&format=a3&lang=es
```

| Key | Meaning |
|---|---|
| `<patternId>` | Path segment. The pattern's stable `id`. |
| `v` | Schema version. Currently `1`. |
| `seed` | Positive integer. Falls back to `1`. |
| `hue` `chroma` `paperL` `accentShift` | The four OKLCH colour controls. Omitted when at their default. |
| `bg` `ink` `acc` | Six-digit hex overrides for the resolved roles. URL-only escape hatch; they win over the derived palette. |
| `lang` | `en` (default, omitted) or `es`. |
| `format` | A format id (`a3`, `letter`, `cm50x70`, …) or `custom`. Omitted when `a3`. |
| `cw` `ch` `cu` | Custom width, height and unit (`mm` \| `cm` \| `in`), used when `format=custom`. |
| *everything else* | Pattern parameters, by key, rounded to four decimals. |

Keys owned by the app shell are listed in `src/core/reserved.ts`; a pattern
parameter may never use one, and `definePattern` throws if it tries. `theme` is
in that list even though the site is dark-only — so stale `theme=` values from
old links are ignored rather than mistaken for a parameter.

## Compatibility rules

These exist so that a link shared today still renders the same artwork years
from now:

- **Ids and parameter keys are permanent.** Renaming either breaks every link
  that already exists.
- **URLs are self-describing.** Every render adopts the fully resolved parameter
  set into state, so the URL always spells out every value. It is never a bare
  `#/p/<id>` meaning "whatever the defaults happen to be today" — otherwise
  tuning a default would silently rewrite artwork behind links already in the
  wild. (This happened once during development, which is why the rule is
  written down.)
- **Unknown keys are ignored, missing keys fall back to defaults**, and every
  decoded value is clamped into its declared range before it reaches a
  generator. A hand-edited or truncated URL degrades; it never throws.
- **Changes that would alter existing output bump `v`.**

## Behaviour

Every control change replaces the current history entry
(`history.replaceState`) rather than pushing one, so the back button leaves the
playground instead of stepping through slider moves.

`src/core/persist.ts` additionally remembers the last state per pattern in
`localStorage`, so returning to a pattern from the gallery restores where you
left it. It is strictly best-effort: every access is wrapped, because
`localStorage` throws outright in Safari private mode and in some sandboxed
contexts, and a convenience must never break the app.

Nothing is sent anywhere. There is no server to send it to.
