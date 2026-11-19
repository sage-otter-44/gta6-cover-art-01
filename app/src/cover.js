// Palm Heat's cover renderer: draws a multi-panel poster cover onto any 2D
// canvas at any size. Everything is drawn from the state — the layout, the
// colour grade, the title and subtitle, and one photo (with its own zoom and
// position) per panel — so the preview, the PNG export and the screenshot
// scenes all render through this one function.

/** The five panel layouts, each a function of the inner area (unit space). */
export const LAYOUTS = {
  quad: {
    label: 'Quad · 2×2',
    rects: (g) => [
      { x: 0, y: 0, w: 0.5 - g / 2, h: 0.5 - g / 2 },
      { x: 0.5 + g / 2, y: 0, w: 0.5 - g / 2, h: 0.5 - g / 2 },
      { x: 0, y: 0.5 + g / 2, w: 0.5 - g / 2, h: 0.5 - g / 2 },
      { x: 0.5 + g / 2, y: 0.5 + g / 2, w: 0.5 - g / 2, h: 0.5 - g / 2 },
    ],
  },
  hero: {
    label: 'Hero + trio',
    rects: (g) => [
      { x: 0, y: 0, w: 0.6 - g / 2, h: 1 },
      { x: 0.6 + g / 2, y: 0, w: 0.4 - g / 2, h: (1 - 2 * g) / 3 },
      { x: 0.6 + g / 2, y: (1 + g) / 3, w: 0.4 - g / 2, h: (1 - 2 * g) / 3 },
      { x: 0.6 + g / 2, y: (2 + 2 * g) / 3, w: 0.4 - g / 2, h: (1 - 2 * g) / 3 },
    ],
  },
  triptych: {
    label: 'Triptych · 3 strips',
    rects: (g) => [
      { x: 0, y: 0, w: (1 - 2 * g) / 3, h: 1 },
      { x: (1 + g) / 3, y: 0, w: (1 - 2 * g) / 3, h: 1 },
      { x: (2 + 2 * g) / 3, y: 0, w: (1 - 2 * g) / 3, h: 1 },
    ],
  },
  grid9: {
    label: 'Grid · 3×3',
    rects: (g) => {
      const cell = (1 - 2 * g) / 3;
      const out = [];
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          out.push({ x: col * (cell + g), y: row * (cell + g), w: cell, h: cell });
        }
      }
      return out;
    },
  },
  bleed: {
    label: 'Full bleed · one photo',
    rects: () => [{ x: 0, y: 0, w: 1, h: 1 }],
  },
};

/** The five colour grades: a photo filter, an overlay wash, and the inks. */
export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.18) contrast(1.06)',
    washTop: 'rgba(255, 176, 92, 0.20)',
    washBottom: 'rgba(214, 48, 130, 0.34)',
    titleTop: '#fff7dd',
    titleMid: '#ffd76a',
    titleBottom: '#ff5e7a',
    subtitle: '#ffe9a8',
    emptyTop: '#3a1c4d',
    emptyBottom: '#120a1e',
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.38) contrast(1.09) hue-rotate(-10deg)',
    washTop: 'rgba(64, 224, 255, 0.20)',
    washBottom: 'rgba(255, 46, 164, 0.36)',
    titleTop: '#eafcff',
    titleMid: '#7df3ff',
    titleBottom: '#ff4fd8',
    subtitle: '#ff7ad9',
    emptyTop: '#12233d',
    emptyBottom: '#0a0616',
  },
  teal: {
    label: 'Teal Heat',
    filter: 'saturate(1.12) contrast(1.05) hue-rotate(14deg)',
    washTop: 'rgba(64, 255, 214, 0.16)',
    washBottom: 'rgba(0, 122, 140, 0.34)',
    titleTop: '#f2fff9',
    titleMid: '#8affd8',
    titleBottom: '#00b39a',
    subtitle: '#b8ffe9',
    emptyTop: '#0f2e33',
    emptyBottom: '#081418',
  },
  gold: {
    label: 'Palm Gold',
    filter: 'sepia(0.28) saturate(1.32) contrast(1.04)',
    washTop: 'rgba(255, 214, 110, 0.22)',
    washBottom: 'rgba(176, 92, 12, 0.34)',
    titleTop: '#fffbe8',
    titleMid: '#ffdf6b',
    titleBottom: '#ff9d2e',
    subtitle: '#ffe9a8',
    emptyTop: '#33240f',
    emptyBottom: '#160e04',
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(0.92) contrast(1.12)',
    washTop: 'rgba(220, 220, 230, 0.12)',
    washBottom: 'rgba(255, 46, 120, 0.22)',
    titleTop: '#ffffff',
    titleMid: '#e8e8f0',
    titleBottom: '#ff4f7a',
    subtitle: '#ffb3c8',
    emptyTop: '#26262e',
    emptyBottom: '#0c0c10',
  },
};

/** The three post sizes the bounty asks for. */
export const SIZES = {
  square: { label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

/**
 * The panel rectangles of a layout in pixels, inside the white poster frame.
 * `gutter` is the gap between panels as a fraction of the inner width.
 */
export function panelRects(layoutId, w, h) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.quad;
  const frame = Math.round(Math.min(w, h) * 0.016);
  const innerX = frame;
  const innerY = frame;
  const innerW = w - frame * 2;
  const innerH = h - frame * 2;
  const gutter = 0.012;
  return layout.rects(gutter).map((r) => ({
    x: innerX + r.x * innerW,
    y: innerY + r.y * innerH,
    w: r.w * innerW,
    h: r.h * innerH,
  }));
}

let grainPattern = null;

/** A small tile of random grey noise, reused as the film grain. */
function grainTile() {
  if (grainPattern) return grainPattern;
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const ctx = tile.getContext('2d');
  const image = ctx.createImageData(128, 128);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 64);
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  grainPattern = tile;
  return tile;
}

/**
 * Draws `img` into `rect` so the photo's point (cx, cy) — fractions of the
 * photo — lands at the panel's centre, scaled to cover the panel and then
 * by `zoom`. `cx`/`cy` are clamped so the photo always covers the panel.
 */
export function drawPhotoInto(ctx, img, rect, zoom, cx, cy, filter) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const halfW = rect.w / 2 / dw;
  const halfH = rect.h / 2 / dh;
  const px = Math.min(Math.max(cx, halfW), 1 - halfW);
  const py = Math.min(Math.max(cy, halfH), 1 - halfH);
  const dx = rect.x + rect.w / 2 - px * dw;
  const dy = rect.y + rect.h / 2 - py * dh;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (filter) ctx.filter = filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

/** Fills a panel that holds no photo yet: a grade-tinted field and a star. */
function drawEmptyPanel(ctx, rect, grade) {
  const fill = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  fill.addColorStop(0, grade.emptyTop);
  fill.addColorStop(1, grade.emptyBottom);
  ctx.fillStyle = fill;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const size = Math.min(rect.w, rect.h) * 0.22;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', rect.x + rect.w / 2, rect.y + rect.h / 2);
}

/** Fits `text` in Anton caps to `maxWidth`, starting at `baseSize`. */
function fitTitleFont(ctx, text, maxWidth, baseSize) {
  let size = baseSize;
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  }
  return size;
}

/** Draws the title block: sunset-gradient Anton caps over a dark band. */
function drawTitleBlock(ctx, w, h, grade, title, subtitle) {
  const text = title.trim().toUpperCase();
  if (!text && !subtitle.trim()) return;
  const bandTop = h * 0.74;
  const band = ctx.createLinearGradient(0, bandTop, 0, h);
  band.addColorStop(0, 'rgba(16, 6, 22, 0)');
  band.addColorStop(0.45, 'rgba(16, 6, 22, 0.55)');
  band.addColorStop(1, 'rgba(16, 6, 22, 0.78)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandTop, w, h - bandTop);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (text) {
    const size = fitTitleFont(ctx, text, w * 0.92, h * 0.105);
    const baseline = h - h * 0.055 - (subtitle.trim() ? h * 0.045 : 0);
    const ink = ctx.createLinearGradient(0, baseline - size, 0, baseline);
    ink.addColorStop(0, grade.titleTop);
    ink.addColorStop(0.55, grade.titleMid);
    ink.addColorStop(1, grade.titleBottom);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#170a1c';
    ctx.lineWidth = size * 0.1;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.07;
    ctx.shadowOffsetY = size * 0.035;
    ctx.strokeText(text, w / 2, baseline);
    ctx.fillStyle = ink;
    ctx.fillText(text, w / 2, baseline);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  const sub = subtitle.trim();
  if (sub) {
    const size = h * 0.04;
    ctx.save();
    ctx.translate(w / 2, h - h * 0.045);
    ctx.rotate(-0.02);
    ctx.font = `${size}px Pacifico, cursive`;
    ctx.fillStyle = grade.subtitle;
    ctx.shadowColor = grade.subtitle;
    ctx.shadowBlur = size * 0.45;
    ctx.fillText(sub, 0, 0);
    ctx.restore();
  }
}

/** A small brand pill in the top-left corner of the cover. */
function drawBrandPill(ctx, w, h) {
  const size = Math.round(Math.min(w, h) * 0.021);
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  const label = '★ PALM HEAT';
  const padX = size * 0.7;
  const pillW = ctx.measureText(label).width + padX * 2;
  const pillH = size * 2.1;
  const x = Math.min(w, h) * 0.016 + 2;
  const y = Math.min(w, h) * 0.016 + 2;
  ctx.fillStyle = 'rgba(16, 6, 22, 0.72)';
  ctx.beginPath();
  ctx.roundRect(x, y, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + padX, y + pillH / 2 + 1);
}

/**
 * Renders the whole cover onto `canvas` (any size) from `state`:
 * `{ layout, grade, title, subtitle, grain, panels }` where each panel is
 * `{ photo, zoom, cx, cy }` and `photo` is an image or null.
 */
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const rects = panelRects(state.layout, w, h);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    if (panel && panel.photo) {
      drawPhotoInto(ctx, panel.photo, rect, panel.zoom ?? 1, panel.cx ?? 0.5, panel.cy ?? 0.5, grade.filter);
    } else {
      drawEmptyPanel(ctx, rect, grade);
    }
  });

  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(1, grade.washBottom);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';

  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat');
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  const vignette = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(10, 2, 14, 0.3)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  drawBrandPill(ctx, w, h);
  drawTitleBlock(ctx, w, h, grade, state.title, state.subtitle);

  // Re-paint the white poster frame over the title band's lower edge.
  const frame = Math.round(Math.min(w, h) * 0.016);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = frame;
  ctx.strokeRect(frame / 2, frame / 2, w - frame, h - frame);
}
