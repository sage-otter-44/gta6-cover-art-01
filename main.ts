// Palm Heat Cover Studio — the entry program for make.fun's gta6-cover-art-01.
// Node 22, standard library only. It hands the app in: it copies this
// repository's app/ (the offline cover maker) and screenshots/ (the cover and
// the editor, taken in the browser) into the output directory and writes
// dossier.json there with the vendored make.fun library, so the sealed scorer
// can check the entry and the judge can read it.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader, /output is the writable directory and this repository is
// read-only; the program writes nothing back into the repository.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The repository root is the directory this file lives in.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's own caps, from the kit's reference/gate.json. The program
// refuses an entry the scorer would refuse instead of handing in bad bytes:
// at most 4 screenshots, each at most 256 KiB; app/ at most 993 files and
// directories and 48 MiB in all, every path at most 1,000 UTF-8 bytes.
const SCREENSHOT_LIMIT = 4;
const SCREENSHOT_MAX_BYTES = 262144;
const APP_MAX_ENTRIES = 993;
const APP_MAX_BYTES = 50331648;
const APP_PATH_MAX_BYTES = 1000;
const DOSSIER_TEXT_MAX_BYTES = 163840;

/** Counts the files and directories under `dir`, and their bytes, walking it. */
function measureTree(dir: string): { entries: number; bytes: number; longestPath: number } {
  let entries = 0;
  let bytes = 0;
  let longestPath = 0;
  const walk = (current: string): void => {
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      const info = statSync(path);
      entries += 1;
      longestPath = Math.max(longestPath, Buffer.byteLength(path, 'utf8'));
      if (info.isDirectory()) walk(path);
      else bytes += info.size;
    }
  };
  walk(dir);
  return { entries, bytes, longestPath };
}

/** Fails the run with a plain message when `ok` is false. */
function requireGate(ok: boolean, message: string): void {
  if (!ok) throw new Error(`gate refused: ${message}`);
}

const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

const appTree = measureTree(appDir);
requireGate(appTree.entries <= APP_MAX_ENTRIES, `app/ holds ${appTree.entries} entries (cap ${APP_MAX_ENTRIES})`);
requireGate(appTree.bytes <= APP_MAX_BYTES, `app/ is ${appTree.bytes} bytes (cap ${APP_MAX_BYTES})`);
requireGate(appTree.longestPath <= APP_PATH_MAX_BYTES, `an app/ path is over ${APP_PATH_MAX_BYTES} bytes`);
requireGate(existsSync(join(appDir, 'index.html')), 'app/index.html is missing');

const shotNames = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => !name.startsWith('.')).sort()
  : [];
requireGate(shotNames.length >= 3 && shotNames.length <= SCREENSHOT_LIMIT,
  `screenshots/ holds ${shotNames.length} images (need 3 or 4)`);
for (const name of shotNames) {
  const size = statSync(join(shotsDir, name)).size;
  requireGate(size <= SCREENSHOT_MAX_BYTES, `screenshots/${name} is ${size} bytes (cap ${SCREENSHOT_MAX_BYTES})`);
}

mkdirSync(outputDir, { recursive: true });
cpSync(appDir, join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (shotNames.length > 0) cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });

writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: DOSSIER_TEXT_MAX_BYTES,
    screenshots: { max: SCREENSHOT_LIMIT, max_bytes: SCREENSHOT_MAX_BYTES },
    app_max_files: APP_MAX_ENTRIES,
    app_max_bytes: APP_MAX_BYTES,
    app_path_max_bytes: APP_PATH_MAX_BYTES,
  }),
);

// The dossier is the entry the judge reads: refuse a run that wrote nothing.
const dossierSize = statSync(join(outputDir, 'dossier.json')).size;
requireGate(dossierSize > 0, 'dossier.json came out empty');

console.log(`handed in ${shotNames.length} screenshots and app/ (${appTree.entries} entries) to ${outputDir}`);
