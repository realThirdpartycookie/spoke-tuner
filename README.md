# SpokeTuner

Measure bicycle **spoke tension** with your microphone. Pluck a spoke; the app reads the
fundamental frequency (Hz), shows the nearest **musical note** (with a cents tuner), and computes
the tension in newtons. Manage a wheel, check side-by-side evenness, read the guide.

Pure web app — `index.html` + `app.js` + `i18n.js`, no framework, no build step. Installable
(PWA) and works offline.

**Live:** https://realthirdpartycookie.github.io/spoke-tuner/

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

- **Measure**: Web Audio API + autocorrelation pitch detection → Hz, musical note + cent deviation,
  and tension via the vibrating-string model (Hz → newtons, optional kgf).
- **Wheel**: per-spoke readings, radial view, side statistics (mean, min/max, spread, % within
  ±10% band).
- **Guide**: causes of nipple failure, roadside fixes, tensioning, the Hz/note method, centering.
- **6 languages**: German, English, French, Spanish, Italian, Dutch — auto-detected from the
  browser, switchable in the top bar. Number formatting follows the locale.
- **Offline / installable**: service worker caches the app shell; add it to your home screen.

## Physics

```
T = 4 * mu * L^2 * f^2
```

`mu` is derived from spoke diameter and material density (`mu = rho * pi * r^2`), not a flat guess.

## Run locally

A secure context is required for the microphone (HTTPS or `localhost`):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

State (wheel, unit, language) is stored in the browser via `localStorage`.

## Tests

```bash
node selftest.js   # physics, Hz→note, side stats, and i18n key-parity across all languages
```

## Deploy

`.github/workflows/deploy.yml` runs the self-test, then publishes the static files to GitHub Pages
on every push to `main`. Asset paths are relative, so it works under a project subpath.

**After changing any cached asset, bump the cache version** in [`sw.js`](sw.js) (`CACHE = 'spoketuner-vN'`)
so clients fetch the new files.

## Translations

The non-German translations were machine-generated. They're solid, but bike-mechanic jargon may
benefit from a native review — corrections welcome in [`i18n.js`](i18n.js).

## Project layout

- `index.html`, `app.js`, `i18n.js`, `sw.js`, `manifest.json`, `favicon.png`, `icons/` — the app.
- `selftest.js` — Node test (also the CI gate).
- `archive/` — the old Flutter version, kept locally, git-ignored. Safe to `rm -rf archive`.

## License

[MIT](LICENSE) © 2026 realThirdpartycookie
