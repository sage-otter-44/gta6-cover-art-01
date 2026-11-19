// Palm Heat's editor: wires the controls to the cover renderer. Photos are
// read on this machine only — a file input, or the two bundled samples — and
// never uploaded anywhere. Click a panel to select it, drag it to move its
// photo, pick a photo from the strip to fill it.
import { GRADES, LAYOUTS, SIZES, panelRects, renderCover } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const zoomSlider = document.getElementById('zoom');
const photoStrip = document.getElementById('photoStrip');

const state = {
  layout: 'hero',
  grade: 'sunset',
  size: 'square',
  title: 'NEON SHORE',
  subtitle: 'palm trees & fast cars',
  grain: true,
  photos: [],
  panels: [],
  selected: 0,
};

function panelCount() {
  return panelRects(state.layout, 100, 100).length;
}

/** Rebuilds the panel list for the current layout, keeping photo picks by index. */
function resetPanels() {
  const old = state.panels;
  const count = panelCount();
  state.panels = Array.from({ length: count }, (_, i) => {
    const kept = old[i];
    const fallback = state.photos.length > 0 ? state.photos[i % state.photos.length].img : null;
    return {
      photo: kept && kept.photo ? kept.photo : fallback,
      zoom: kept ? kept.zoom : 1,
      cx: kept ? kept.cx : 0.5,
      cy: kept ? kept.cy : 0.5,
    };
  });
  if (state.selected >= count) state.selected = 0;
}

/** Sizes the preview canvas to the export aspect, capped at a 900 px side. */
function sizePreview() {
  const size = SIZES[state.size];
  const scale = 900 / Math.max(size.w, size.h);
  canvas.width = Math.round(size.w * scale);
  canvas.height = Math.round(size.h * scale);
}

/** Draws the preview and outlines the selected panel. */
function redraw() {
  renderCover(canvas, state);
  if (document.body.classList.contains('shot-cover')) return;
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const rect = rects[state.selected];
  if (rect) {
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.strokeStyle = '#ff2ea4';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    ctx.restore();
  }
  const panel = state.panels[state.selected];
  if (panel) zoomSlider.value = String(panel.zoom);
}

function setStatus(text) {
  status.textContent = text;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Adds a loaded photo to the strip and fills empty panels with it. */
function addPhoto(img, name) {
  const index = state.photos.length;
  state.photos.push({ img, name });
  const thumb = document.createElement('button');
  thumb.type = 'button';
  thumb.className = 'thumb';
  thumb.title = `Put ${name} in the selected panel`;
  const preview = document.createElement('img');
  preview.src = img.src;
  preview.alt = name;
  thumb.appendChild(preview);
  thumb.addEventListener('click', () => {
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.photo = img;
    panel.zoom = 1;
    panel.cx = 0.5;
    panel.cy = 0.5;
    redraw();
    setStatus(`${name} is in panel ${state.selected + 1}.`);
  });
  photoStrip.appendChild(thumb);
  state.panels.forEach((panel, i) => {
    if (!panel.photo) panel.photo = img;
  });
  if (state.photos.length === 1) resetPanels();
  redraw();
}

async function loadSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  addPhoto(img, name);
  return img;
}

/** Builds a row of toggle buttons from a map of { id: { label } }. */
function buildPicker(elementId, entries, current, onPick) {
  const host = document.getElementById(elementId);
  Object.entries(entries).forEach(([id, entry]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = entry.label;
    button.dataset.pick = id;
    if (id === current) button.classList.add('active');
    button.addEventListener('click', () => {
      host.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      onPick(id);
    });
    host.appendChild(button);
  });
}

buildPicker('layoutPicker', LAYOUTS, state.layout, (id) => {
  state.layout = id;
  resetPanels();
  redraw();
  setStatus(`Layout: ${LAYOUTS[id].label}.`);
});
buildPicker('gradePicker', GRADES, state.grade, (id) => {
  state.grade = id;
  redraw();
  setStatus(`Grade: ${GRADES[id].label}.`);
});
buildPicker('sizePicker', SIZES, state.size, (id) => {
  state.size = id;
  sizePreview();
  redraw();
  setStatus(`Export size: ${SIZES[id].label}.`);
});

document.getElementById('photoFiles').addEventListener('change', async (event) => {
  const files = [...event.target.files];
  for (const file of files) {
    try {
      const img = await loadImage(URL.createObjectURL(file));
      addPhoto(img, file.name);
    } catch {
      setStatus(`Could not read ${file.name}.`);
    }
  }
  if (files.length > 0) setStatus(`${files.length} photo${files.length > 1 ? 's' : ''} loaded — click one to fill the selected panel.`);
  event.target.value = '';
});
document.getElementById('sampleBoulevard').addEventListener('click', () => {
  loadSample('boulevard').then(() => setStatus('Boulevard sample loaded.'));
});
document.getElementById('samplePier').addEventListener('click', () => {
  loadSample('pier').then(() => setStatus('Pier sample loaded.'));
});
document.getElementById('title').addEventListener('input', (event) => {
  state.title = event.target.value;
  redraw();
});
document.getElementById('subtitle').addEventListener('input', (event) => {
  state.subtitle = event.target.value;
  redraw();
});
document.getElementById('grain').addEventListener('change', (event) => {
  state.grain = event.target.checked;
  redraw();
});
zoomSlider.addEventListener('input', () => {
  const panel = state.panels[state.selected];
  if (!panel) return;
  panel.zoom = Number(zoomSlider.value);
  redraw();
});
document.getElementById('fillAll').addEventListener('click', () => {
  const panel = state.panels[state.selected];
  if (!panel || !panel.photo) {
    setStatus('Load a photo first.');
    return;
  }
  state.panels.forEach((p) => {
    p.photo = panel.photo;
    p.zoom = 1;
    p.cx = 0.5;
    p.cy = 0.5;
  });
  redraw();
  setStatus('Every panel now shows that photo.');
});
document.getElementById('resetPanel').addEventListener('click', () => {
  const panel = state.panels[state.selected];
  if (!panel) return;
  panel.zoom = 1;
  panel.cx = 0.5;
  panel.cy = 0.5;
  redraw();
});

/** Renders the cover at full export size and returns its PNG bytes. */
export async function exportPng(sizeId) {
  const size = SIZES[sizeId];
  const offscreen = document.createElement('canvas');
  offscreen.width = size.w;
  offscreen.height = size.h;
  renderCover(offscreen, state);
  const blob = await new Promise((resolve) => offscreen.toBlob(resolve, 'image/png'));
  return { blob, width: size.w, height: size.h };
}

function downloadPng(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
}

document.getElementById('exportOne').addEventListener('click', async () => {
  const { blob, width, height } = await exportPng(state.size);
  downloadPng(blob, `palm-heat-${width}x${height}.png`);
  setStatus(`Saved palm-heat-${width}x${height}.png (${Math.round(blob.size / 1024)} KiB).`);
});
document.getElementById('exportAll').addEventListener('click', async () => {
  for (const sizeId of Object.keys(SIZES)) {
    const { blob, width, height } = await exportPng(sizeId);
    downloadPng(blob, `palm-heat-${width}x${height}.png`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  setStatus('Saved all three sizes.');
});

// Pointer: click selects a panel, drag pans the selected panel's photo.
let drag = null;

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function panelAt(point) {
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  return rects.findIndex((r) => point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h);
}

canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const index = panelAt(point);
  if (index === -1) return;
  state.selected = index;
  const panel = state.panels[index];
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  drag = { start: point, rect: rects[index], panel, moved: false };
  canvas.setPointerCapture(event.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag || !drag.panel.photo) return;
  const point = canvasPoint(event);
  const dx = point.x - drag.start.x;
  const dy = point.y - drag.start.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  const { rect, panel } = drag;
  const img = panel.photo;
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * panel.zoom;
  panel.cx -= dx / (img.naturalWidth * scale);
  panel.cy -= dy / (img.naturalHeight * scale);
  drag.start = point;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
});

/** Syncs every control to the state — used after a ?shot= scene sets it. */
function syncControls() {
  const markActive = (elementId, current) => {
    document.getElementById(elementId).querySelectorAll('button').forEach((b) => {
      b.classList.toggle('active', b.dataset.pick === current);
    });
  };
  markActive('layoutPicker', state.layout);
  markActive('gradePicker', state.grade);
  markActive('sizePicker', state.size);
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('grain').checked = state.grain;
}

// A test handle for the screenshot and verification scripts: renders and
// exports without touching the download flow.
window.__coverStudio = {
  state,
  renderCover,
  exportPng,
  loadSample,
  redraw,
  resetPanels,
  syncControls,
};

// Load the bundled fonts before the first paint, then the two samples so the
// app opens with a finished cover on screen.
sizePreview();
resetPanels();
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
Promise.all([
  document.fonts.load('80px Anton'),
  document.fonts.load('40px Pacifico'),
  document.fonts.ready,
]).then(async () => {
  if (shot) {
    await runShot(shot, query, { loadSample, state, redraw, canvas, sizePreview, resetPanels, syncControls });
  } else {
    await loadSample('boulevard');
    await loadSample('pier');
    setStatus('Samples loaded — add your own photos, or export this cover.');
  }
  redraw();
});
