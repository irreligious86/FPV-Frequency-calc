# FPV Frequency Analyzer

Offline-first PWA for planning FPV video channels. Pick the channels your pilots
fly and the app colours every other channel by how badly it would clash, explains
why, and can fill the remaining pilot slots with the cleanest combination.

**Live:** https://irreligious86.github.io/FPV-Frequency-calc/

No backend, no build step, no dependencies: plain HTML, CSS and ES modules.

## Features

- 265 channels across 7 ranges (5.8 / 5.3 / 4.9 / 3.3 / 2.4 / 1.3 GHz, 900 MHz), analog and digital
- Direct interference rating that uses the real width of both channels
- Third-order intermodulation (IMD3) check: `2a − b` and `a + b − c`
- Every warning comes with a reason ("only 7 MHz clear of R2")
- **Optimize**: fills the free pilot slots from the band(s) already in use
- Installable, works with no network after the first visit
- Selection, filters and pilot count survive a reload

## How interference is rated

All logic lives in [`js/interference.js`](js/interference.js) as pure functions.

**Direct.** `gap = |f1 − f2| − (w1 + w2) / 2` is the clear spectrum between the
edges of two channels.

| Gap | Level |
|---|---|
| below 0 MHz (spectra overlap) | conflict |
| below 10 MHz | medium |
| below 25 MHz | low |
| 25 MHz and more | clear |

**IMD3.** Products of the *other* transmitters are checked against each channel.
A product inside the channel rates medium, one within 10 MHz of its edge rates low.

A channel's level is the worse of the two. A candidate channel is also charged for
any selected channel it would make worse.

The thresholds are constants at the top of the file (`GUARD`, `IMD_MARGIN`).

### Limits of the model

It looks at frequencies only. Output power, antenna type and polarisation, distance
between pilots and receiver quality are not modelled, so the result is a planning
aid and not a guarantee. Channel widths come from `data/channels.json`.

## Run locally

Service workers and ES modules need HTTP, so opening `index.html` from disk will not work.

```sh
python3 -m http.server 8000
# or: npm start
```

Then open http://localhost:8000.

## Tests

```sh
npm test
```

Uses the built-in Node.js test runner (Node 20+), nothing to install.

## Project layout

```
index.html              page markup
manifest.webmanifest    PWA manifest
sw.js                   service worker (stale-while-revalidate)
css/styles.css
js/app.js               entry point
js/ui.js                rendering, selection, persistence
js/interference.js      interference model and optimiser (pure)
js/channels.js          channel table loading
js/matrix.js            background animation
data/channels.json      channel table
icons/                  app icons
tests/                  unit tests
docs/pilots_guide.md    interference explained for pilots (Russian)
```

## Deploy

GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `(root)`.

After a deploy, users get the new version on their second visit (the service worker
serves the cached copy first and refreshes it in the background).

## Adding a band

Add an entry to `data/channels.json` under `analog` or `digital` and the range key:

```json
"R": {
  "bandName": "Raceband (ImmersionRC)",
  "bandTitle": "R",
  "region": "FCC/CE",
  "channelWidth": 30,
  "channels": { "1": 5658, "2": 5695 }
}
```

`channelWidth` and frequencies are in MHz.
