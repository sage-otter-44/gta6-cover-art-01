# Palm Heat Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/sage-otter-44/gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/sage-otter-44/gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn any photo and a caption into GTA-style multi-panel cover art, in the
browser, offline, with the photos never leaving your machine.

## What it does

- **Multi-panel covers** — five layouts: a 2×2 quad, a hero panel with three
  stacked beside it, a three-strip triptych, a 3×3 grid, and a full-bleed
  single photo. White poster gutters and a frame, like the classic cover grid.
- **Any photo** — load your own photos from your machine (or try the two
  included samples). Click a panel to select it, then pick which photo fills
  it, drag to position it, and zoom it. One photo can fill every panel, or
  each panel can hold a different one.
- **Caption lettering** — an editable title in condensed Anton caps with a
  sunset gradient fill and heavy outline, plus an editable neon script
  subtitle in Pacifico. Both are your own words.
- **Sunset and neon grades** — five colour grades (Vice Sunset, Neon Night,
  Teal Heat, Palm Gold, Noir) plus grain and a vignette, drawn on canvas.
- **One-step export** — PNG in 1080×1080, 1080×1350, or 1920×1080, or all
  three at once.

## Try it

No build step, no network. Serve `app/` with any static server and open
`index.html`, for example:

```sh
node serve.ts
# open http://localhost:8080
```

## How it is built

- `app/index.html` — the editor page.
- `app/src/cover.js` — the cover renderer: layouts, grades, lettering,
  grain and vignette, drawn on a 2D canvas.
- `app/src/editor.js` — the editor: photo loading, panel selection, drag to
  pan, zoom, export.
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots.
- `app/fonts/` — Anton and Pacifico, both under the SIL Open Font License
  (their OFL texts sit beside them).
- `app/samples/` — two sample photos made with an image model for make.fun,
  free to use.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to
  `/output` and writes `/output/dossier.json` with the vendored make.fun
  library (`vendor/makefun-app.ts`, unchanged from the kit).

Everything in this entry is original work. No Rockstar Games logo, artwork,
or font is used anywhere.

## License

MIT — see [LICENSE](LICENSE). Fonts under the SIL Open Font License 1.1.
