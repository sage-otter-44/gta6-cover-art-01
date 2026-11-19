// Fixed scenes for screenshots: ?shot=cover draws the exported cover alone,
// full frame, at the viewport's size; ?shot=editor shows the editor with
// photos loaded. `layout`, `grade`, `size`, `caption` and `subtitle` come
// from the query. window.__shotReady is set once the scene has painted.

function pick(query, name, fallback) {
  const value = query.get(name);
  return value === null || value === '' ? fallback : value;
}

/** Loads both bundled samples and deals them across the panels, alternating. */
async function dealSamples(api) {
  const boulevard = await api.loadSample('boulevard');
  const pier = await api.loadSample('pier');
  api.state.panels.forEach((panel, i) => {
    // The pier photo's face sits high in the frame, so favour its top half;
    // the boulevard photo's face sits just above centre.
    const isPier = i % 2 === 1;
    panel.photo = isPier ? pier : boulevard;
    panel.zoom = 1;
    panel.cx = 0.5;
    panel.cy = isPier ? 0.3 : 0.45;
  });
}

export async function runShot(shot, query, api) {
  const { state } = api;
  state.layout = pick(query, 'layout', state.layout);
  state.grade = pick(query, 'grade', state.grade);
  state.title = pick(query, 'caption', state.title);
  state.subtitle = pick(query, 'subtitle', state.subtitle);
  state.size = pick(query, 'size', state.size);
  api.resetPanels();
  if (api.syncControls) api.syncControls();

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    await dealSamples(api);
    // Draw the cover itself at the viewport's size — the app's own drawing
    // of the export, scaled to the screenshot limits.
    api.canvas.width = window.innerWidth;
    api.canvas.height = window.innerHeight;
    api.redraw();
  } else {
    await dealSamples(api);
    api.sizePreview();
    api.redraw();
  }

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
