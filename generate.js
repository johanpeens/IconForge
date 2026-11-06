// Draws icons: Flux Schnell (stable-diffusion.cpp server) -> VTracer -> one SVG per icon.
const fs = require('fs');
const net = require('net');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');
const { vectorize, ColorMode, Hierarchical, PathSimplifyMode } = require('@neplex/vectorizer');
const { addMeta } = require('./svgedit');

const SET_MARK = '.iconforge-set';
const slugUnderscore = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'icon';
const natural = s => s.split(/(\d+)/).map(t => (/^\d+$/.test(t) ? parseInt(t, 10) : t.toLowerCase()));
function naturalCmp(a, b) {
  const x = natural(a), y = natural(b);
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    if (x[i] === y[i]) continue;
    if (typeof x[i] === typeof y[i]) return x[i] < y[i] ? -1 : 1;
    return typeof x[i] === 'number' ? -1 : 1;
  }
  return x.length - y.length;
}

// ---------------------------------------------------------------- prompts (same wording as make_icons.bat)
const STYLES = {
  line: { kind: 'line icon', text: {
    1: 'drawn with one uniform very thick black outline stroke, no fill, no shading, rounded line ends, very few bold simple shapes',
    2: 'drawn with one uniform thick black outline stroke, no fill, no shading, rounded line ends, simple geometric shapes',
    3: 'drawn with fine uniform black outline strokes, no fill, no shading, rounded line ends, rich interior detail and small features' } },
  // Filled: a solid black figure that stays readable because white gaps separate its parts. One figure, no frame or badge.
  filled: { kind: 'solid glyph icon', lead: 'A flat black glyph pictogram of a single ', tail: ', centred with a generous margin on a plain white background.', text: {
    1: 'filled solid black, with a few large white cut-out gaps that separate the main parts, plenty of white space, no outline, no shading, no grey, no frame, no border, no badge, rounded corners, one bold simple shape',
    2: 'filled solid black, with clear white cut-out gaps and bold white lines that separate the main parts, white cut-outs for the key details, generous white space between the parts so every part is easy to read at small sizes, no outline, no shading, no grey, no frame, no border, no badge, rounded corners',
    3: 'filled solid black, with many fine white cut-out lines and gaps that separate every part and show the details, plenty of white space so it stays legible, no outline, no shading, no grey, no frame, no border, no badge, crisp edges' } },
  double: { kind: 'double-line icon', text: {
    1: 'drawn with a very thick black outline and one inner line running parallel to it, no fill, no shading, rounded line ends, very few shapes',
    2: 'drawn with a bold black outline and a thin inner line running parallel to it, no fill, no shading, rounded line ends, simple shapes',
    3: 'drawn with a fine black outline and a thin inner line running parallel to it, no fill, no shading, rounded line ends, rich interior detail' } },
  // Hand-drawn: must look clearly different from Line, so it asks for uneven, overshooting pen strokes (tested 4 Nov 2026; the
  // words "in a notebook" made the AI draw a spiral binding, so they are not used).
  hand: { kind: 'hand-drawn ink sketch icon', lead: 'A hand-drawn ink sketch icon of ', text: {
    1: 'drawn with a thick black marker line that wobbles visibly, uneven strokes that vary a little in thickness, no fill, no shading, rounded line ends, very few loose shapes, like a quick pen sketch',
    2: 'drawn with a black pen-and-ink line with visibly wobbly, uneven strokes that vary in thickness, corners that overshoot a little and lines that do not quite meet, no fill, no shading, rounded line ends, simple loose shapes, like a quick pen sketch',
    3: 'drawn as a fine black pen-and-ink sketch with sketchy, uneven strokes, a few doubled-up lines and small gaps where the pen lifted, strokes that vary in thickness, no fill, no shading, rounded line ends, rich interior detail, like a careful pen sketch' } },
};
const SPECKLE = { 1: 6, 2: 4, 3: 2 };

function promptFor(subject, style, detail) {
  const st = STYLES[style];
  // A style may bring its own opening and ending (Filled does); the others keep the original wording exactly.
  return (st.lead || 'A flat vector ' + st.kind + ' of ') + subject + ', ' + st.text[detail] + (st.tail || ', centred with a generous margin on a plain white background, front view, even flat light.');
}

// ---------------------------------------------------------------- the image engine
function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); });
  });
}

function createEngine(engineDir) {
  let proc = null, port = 0, loadedModel = '', log = '', starting = null;
  const exe = path.join(engineDir, 'sd-server.exe');

  // Kill the engine and anything it started (sync, so it also works while the app is quitting).
  function stop() {
    if (proc) {
      try { execFileSync('taskkill', ['/pid', String(proc.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true }); } catch (e) { try { proc.kill(); } catch (x) { /* already gone */ } }
    }
    proc = null; loadedModel = ''; starting = null;
  }

  async function up() {
    try { return (await fetch('http://127.0.0.1:' + port + '/sdapi/v1/sd-models', { headers: { Connection: 'close' }, signal: AbortSignal.timeout(3000) })).ok; } catch (e) { return false; }
  }

  async function ensure(model, onStage) {
    if (proc && loadedModel === model && await up()) return;
    if (starting) return starting;
    starting = (async () => {
      stop();
      if (!fs.existsSync(exe)) throw new Error('The image engine is missing (' + exe + '). Reinstall Icon Forge.');
      port = await freePort();
      log = '';
      // --offload-to-cpu keeps the 17 GB checkpoint usable on 8 GB graphics cards. --max-vram 3 is what keeps the
      // Vulkan driver from losing the device mid-image (without it, most runs crashed on an RTX 5060 laptop).
      const args = ['--model', model, '--listen-ip', '127.0.0.1', '--listen-port', String(port), '--offload-to-cpu', '--max-vram', '3'];
      const p = spawn(exe, args, { cwd: engineDir, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      proc = p;
      let exited = null;
      const add = d => { log = (log + d.toString()).slice(-4000); };
      p.stdout.on('data', add); p.stderr.on('data', add);
      p.on('exit', code => { exited = code; if (proc === p) { proc = null; loadedModel = ''; } });
      p.on('error', e => { exited = -1; add(String(e)); });
      if (onStage) onStage('Starting the image engine');
      const t0 = Date.now();
      while (Date.now() - t0 < 15 * 60 * 1000) {
        // 0xC0000135 / 0xC0000139: Windows could not load a DLL the engine needs (the Microsoft Visual C++ runtime).
        if (exited === 3221225781 || exited === 3221225785) throw new Error('Windows is missing the Microsoft Visual C++ runtime that the image engine needs. The Icon Forge installer adds it; run the installer again, or get it free from https://aka.ms/vs/17/release/vc_redist.x64.exe');
        if (exited !== null) throw new Error('The image engine stopped (code ' + exited + ').\n' + log.slice(-1500));
        if (await up()) { loadedModel = model; return; }
        await new Promise(r => setTimeout(r, 1500));
      }
      stop();
      throw new Error('The image engine did not start in time.\n' + log.slice(-1500));
    })();
    try { await starting; } finally { starting = null; }
  }

  // Draw one picture. If the engine dies or hangs up on us, start a fresh one and try again (up to 3 goes).
  // `init` ({ b64, strength }) makes it start from an existing picture instead of from nothing (the "Vary" tool).
  async function draw(model, prompt, seed, onStage, cancelled, init) {
    let last;
    for (let a = 0; a < 3; a++) {
      try {
        await ensure(model, onStage);
        return init ? await img2imgOnce(prompt, seed, init) : await txt2imgOnce(prompt, seed);
      } catch (e) {
        if (cancelled && cancelled()) throw e;
        last = e;
        if (!proc) last = new Error('The image engine stopped.\n' + log.slice(-1500));
        stop();
      }
    }
    throw last;
  }

  async function callEngine(route, body) {
    const res = await fetch('http://127.0.0.1:' + port + route, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10 * 60 * 1000),
    });
    if (!res.ok) throw new Error('The image engine answered ' + res.status + ': ' + (await res.text()).slice(0, 300));
    const j = await res.json();
    const b64 = (j.images && j.images[0]) || '';
    if (!b64) throw new Error('The image engine returned no picture.\n' + log.slice(-800));
    return Buffer.from(b64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  }

  function txt2imgOnce(prompt, seed) {
    return callEngine('/sdapi/v1/txt2img', { prompt, negative_prompt: '', width: 1024, height: 1024, steps: 4, cfg_scale: 1, seed, sampler_name: 'euler', scheduler: 'simple', batch_size: 1 });
  }

  // Start from a picture: strength is how much it may change (0.2 = a little, 0.95 = almost anything). The engine only
  // runs the last part of the steps, so a lower strength gets more steps to keep the number of real steps about 4.
  function img2imgOnce(prompt, seed, init) {
    const strength = Math.max(0.2, Math.min(0.95, +init.strength || 0.6));
    const steps = Math.max(4, Math.min(12, Math.round(4 / strength)));
    return callEngine('/sdapi/v1/img2img', { prompt, negative_prompt: '', init_images: [init.b64], denoising_strength: strength, width: 1024, height: 1024, steps, cfg_scale: 1, seed, sampler_name: 'euler', scheduler: 'simple', batch_size: 1 });
  }

  return { ensure, draw, stop, tail: () => log };
}

// ---------------------------------------------------------------- tracing
function trace(png, detail) {
  return vectorize(png, {
    colorMode: ColorMode.Binary, hierarchical: Hierarchical.Stacked, mode: PathSimplifyMode.Spline,
    filterSpeckle: SPECKLE[detail], cornerThreshold: 60, lengthThreshold: 4.0, spliceThreshold: 45,
    colorPrecision: 6, layerDifference: 16, maxIterations: 10, pathPrecision: 2,
  });
}

// ---------------------------------------------------------------- jobs
function create({ baseDir, engineDir, models }) {
  const jobs = {};
  const engine = createEngine(engineDir);

  function listSvgs(folder) {
    const d = path.join(baseDir, folder);
    try { return fs.readdirSync(d).filter(f => f.toLowerCase().endsWith('.svg')).sort(naturalCmp); } catch (e) { return []; }
  }

  function library() {
    const out = [];
    let names = [];
    try { names = fs.readdirSync(baseDir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name); } catch (e) { /* no library yet */ }
    for (const name of names.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))) {
      if (name === 'iconfonts') continue;
      const files = listSvgs(name);
      let mtime = 0;
      try { mtime = fs.statSync(path.join(baseDir, name)).mtimeMs; } catch (e) { /* keep 0 */ }
      // A set you made yourself can be empty for now; the marker file says "this folder is one of ours".
      if (files.length || fs.existsSync(path.join(baseDir, name, SET_MARK))) out.push({ folder: name, files, mtime });
    }
    return out;
  }

  // The real folder name of a set (matched without regard to upper/lower case), or '' if there is no such set.
  function findSet(name) {
    name = String(name || '');
    if (!name || /[\\/]/.test(name) || name.startsWith('.') || name.toLowerCase() === 'iconfonts') return '';
    try { const hit = fs.readdirSync(baseDir, { withFileTypes: true }).find(e => e.isDirectory() && e.name.toLowerCase() === name.toLowerCase()); return hit ? hit.name : ''; } catch (e) { return ''; }
  }

  // Make a new, empty set (a folder in the library). If the name is taken, say so and name the existing set.
  function createSet(rawName) {
    const name = String(rawName || '').replace(/[^A-Za-z0-9 \-]/g, '').trim().slice(0, 60);
    if (!name) return { error: 'Type a name for the new set. Letters, numbers, spaces and dashes work.' };
    const folder = slugUnderscore(name);
    if (folder === 'iconfonts') return { error: 'That name is kept for fonts. Please choose another.' };
    const have = findSet(folder);
    if (have) return { error: 'A set called "' + have.replace(/_/g, ' ') + '" already exists.', folder: have };
    const dir = path.join(baseDir, folder);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, SET_MARK), '');
    return { ok: true, folder };
  }

  // Copy or move icons from one set to another. A name that is already taken gets the next free number.
  function transfer({ from, to, files, mode }) {
    const src = findSet(from), dst = findSet(to);
    if (!src || !dst) return { error: 'That set was not found.' };
    if (src === dst) return { error: 'Choose a different set to send the icons to.' };
    const done = [], skipped = [];
    for (const f of (Array.isArray(files) ? files : []).slice(0, 2000)) {
      const name0 = String(f);
      const a = path.join(baseDir, src, name0);
      if (!/^[^\\/]+\.svg$/i.test(name0) || !fs.existsSync(a) || !fs.statSync(a).isFile()) { skipped.push(name0); continue; }
      let name = name0;
      if (fs.existsSync(path.join(baseDir, dst, name))) name = dst.replace(/_+$/, '') + '_' + String(nextNumber(dst)).padStart(2, '0') + '.svg';
      const b = path.join(baseDir, dst, name);
      if (mode === 'move') fs.renameSync(a, b); else fs.copyFileSync(a, b);
      done.push({ from: name0, to: name });
    }
    // A set that was emptied by moving stays as an (empty) set, so you do not lose it by accident.
    if (mode === 'move' && !listSvgs(src).length) { try { fs.writeFileSync(path.join(baseDir, src, SET_MARK), ''); } catch (e) { /* not important */ } }
    return { ok: true, src, dst, mode: mode === 'move' ? 'move' : 'copy', done, skipped };
  }

  async function run(job, keywords, per, detail, style) {
    const model = models.modelPath();
    try {
      await engine.ensure(model, s => { job.stage = s; });
      job.stage = '';
      for (const k of keywords) {
        if (job.cancel) break;
        const folder = slugUnderscore(k) + (style === 'line' ? '' : '_' + style);
        const dir = path.join(baseDir, folder);
        fs.mkdirSync(dir, { recursive: true });
        const before = new Set(listSvgs(folder));
        const item = { keyword: k, folder, done: 0, failed: 0, total: per, files: [] };
        job.items.push(item);
        for (let n = 0; n < per; n++) {
          if (job.cancel) break;
          // The model loads on the first picture, so the very first icon of a run takes a good while longer.
          job.current = { keyword: k, n: n + 1, startedAt: Date.now(), first: !job.warm };
          const t0 = Date.now();
          try {
            const existing = listSvgs(folder).filter(f => f.startsWith(folder + '_')).length;
            const name = folder + '_' + String(existing + 1).padStart(2, '0');
            const seed = crypto.randomInt(1, 2147483647);
            const prompt = promptFor(k, style, detail);
            const png = await engine.draw(model, prompt, seed, null, () => job.cancel);
            const svg = addMeta(await trace(png, detail), {
              v: 1, app: 'Icon Forge', created: new Date().toISOString(), subject: k, prompt, style, detail, seed,
              model: path.basename(model || ''), size: 1024, steps: 4,
            });
            fs.writeFileSync(path.join(dir, name + '.svg'), svg);
            item.done++;
            if (job.warm) job.timings.push(Date.now() - t0); else job.firstMs = Date.now() - t0;
            job.avgMs = job.timings.length ? job.timings.reduce((a, b) => a + b, 0) / job.timings.length : 0;
            job.log = (job.log + name + ' saved\n').slice(-4000);
          } catch (e) {
            if (job.cancel) break;
            item.failed++;
            job.log = (job.log + k + ' failed: ' + (e.message || e) + (e.cause ? ' (' + (e.cause.code || e.cause.message || e.cause) + ')' : '') + '\n' + engine.tail().slice(-1200) + '\n').slice(-4000);
            if (/image engine (stopped|did not start|is missing)/.test(String(e.message))) throw e;
          } finally {
            job.warm = true;
          }
        }
        item.files = listSvgs(folder).filter(f => !before.has(f));
      }
      job.current = null;
    } catch (e) {
      if (!job.cancel) job.error = e.message || String(e);
    }
    job.stage = '';
    job.current = null;
    job.state = job.error ? 'error' : job.cancel ? 'stopped' : 'done';
  }

  // Stop a running job: no new icons start, and the engine is killed so a picture in progress is dropped.
  function cancel(id) {
    const job = jobs[id];
    if (!job || job.state !== 'running') return { ok: false };
    job.cancel = true; job.stage = 'Stopping'; job.current = null;
    engine.stop();
    return { ok: true };
  }

  function start(keywords, per, detail, style) {
    if (!models.modelPath()) return { error: 'The Flux model is not installed yet. Open Settings (the gear, top right) and download it.' };
    if (Object.values(jobs).some(j => j.state === 'running')) return { error: 'Another generation is still running.' };
    const id = crypto.randomBytes(4).toString('hex');
    const job = jobs[id] = { id, state: 'running', items: [], log: '', stage: '', current: null, timings: [], avgMs: 0, firstMs: 0, per, detail, style, started: Date.now() };
    run(job, keywords, per, detail, style);
    return { id };
  }

  // ---- Vary: make new versions of one existing icon (change the words, or start from its picture) ----
  function nextNumber(folder) {
    let max = 0;
    for (const f of listSvgs(folder)) { const m = /_(\d+)\.svg$/i.exec(f); if (m) max = Math.max(max, +m[1]); }
    return max + 1;
  }

  async function runVary(job, o) {
    const model = models.modelPath(), dir = path.join(baseDir, o.folder);
    const item = { keyword: o.subject, folder: o.folder, done: 0, failed: 0, total: o.count, files: [] };
    job.items.push(item);
    try {
      await engine.ensure(model, s => { job.stage = s; });
      job.stage = '';
      for (let n = 0; n < o.count; n++) {
        if (job.cancel) break;
        job.current = { keyword: o.subject, n: n + 1, startedAt: Date.now(), first: !job.warm };
        const t0 = Date.now();
        try {
          // The first version can reuse the original's seed, which keeps it as close to the original as the new words allow.
          const seed = n === 0 && o.keepSeed && Number.isFinite(o.parentSeed) ? o.parentSeed : crypto.randomInt(1, 2147483647);
          const init = o.mode === 'image' ? { b64: o.initPng, strength: o.strength } : null;
          const png = await engine.draw(model, o.prompt, seed, null, () => job.cancel, init);
          const name = o.folder.replace(/_+$/, '') + '_' + String(nextNumber(o.folder)).padStart(2, '0');
          const meta = {
            v: 1, app: 'Icon Forge', created: new Date().toISOString(), subject: o.subject, prompt: o.prompt, style: o.style, detail: o.detail, seed,
            model: path.basename(model || ''), size: 1024, steps: 4, mode: o.mode, parent: { set: o.folder, file: o.file, seed: Number.isFinite(o.parentSeed) ? o.parentSeed : null },
          };
          if (o.mode === 'image') meta.strength = o.strength;
          fs.writeFileSync(path.join(dir, name + '.svg'), addMeta(await trace(png, o.detail), meta));
          item.done++; item.files.push(name + '.svg');
          if (job.warm) job.timings.push(Date.now() - t0); else job.firstMs = Date.now() - t0;
          job.avgMs = job.timings.length ? job.timings.reduce((a, b) => a + b, 0) / job.timings.length : 0;
          job.log = (job.log + name + ' saved\n').slice(-4000);
        } catch (e) {
          if (job.cancel) break;
          item.failed++;
          job.log = (job.log + 'vary failed: ' + (e.message || e) + '\n' + engine.tail().slice(-1200) + '\n').slice(-4000);
          if (/image engine (stopped|did not start|is missing)/.test(String(e.message))) throw e;
          if (!job.firstError) job.firstError = String(e.message || e).split('\n')[0];
        } finally {
          job.warm = true;
        }
      }
    } catch (e) {
      if (!job.cancel) job.error = e.message || String(e);
    }
    if (!job.error && !item.done && item.failed && job.firstError) job.error = job.firstError;
    job.stage = ''; job.current = null;
    job.state = job.error ? 'error' : job.cancel ? 'stopped' : 'done';
  }

  // o: { folder, file, subject, style, detail, prompt, count, mode ('prompt' | 'image'), strength, initPng (base64), keepSeed, parentSeed }
  function startVary(o) {
    if (!models.modelPath()) return { error: 'The Flux model is not installed yet. Open Settings (the gear, top right) and download it.' };
    if (Object.values(jobs).some(j => j.state === 'running')) return { error: 'Another generation is still running.' };
    const id = crypto.randomBytes(4).toString('hex');
    const job = jobs[id] = { id, kind: 'vary', state: 'running', items: [], log: '', stage: '', current: null, timings: [], avgMs: 0, firstMs: 0, per: o.count, detail: o.detail, style: o.style, started: Date.now() };
    runVary(job, o);
    return { id };
  }

  return { jobs, start, startVary, cancel, library, listSvgs, promptFor, findSet, createSet, transfer, stopEngine: engine.stop };
}

module.exports = { create, slugUnderscore, trace, promptFor };
