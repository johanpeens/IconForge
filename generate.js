// Draws icons: Flux Schnell (stable-diffusion.cpp server) -> VTracer -> one SVG per icon.
const fs = require('fs');
const net = require('net');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');
const { vectorize, ColorMode, Hierarchical, PathSimplifyMode } = require('@neplex/vectorizer');

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
  filled: { kind: 'solid glyph icon', text: {
    1: 'a solid black filled silhouette, no outline, no shading, rounded corners, one bold simple shape',
    2: 'a solid black filled silhouette with a few small white cut-out details, no outline, no shading, rounded corners',
    3: 'a solid black filled silhouette with many fine white cut-out details, no outline, no shading, crisp edges' } },
  double: { kind: 'double-line icon', text: {
    1: 'drawn with a very thick black outline and one inner line running parallel to it, no fill, no shading, rounded line ends, very few shapes',
    2: 'drawn with a bold black outline and a thin inner line running parallel to it, no fill, no shading, rounded line ends, simple shapes',
    3: 'drawn with a fine black outline and a thin inner line running parallel to it, no fill, no shading, rounded line ends, rich interior detail' } },
  hand: { kind: 'hand-drawn line icon', text: {
    1: 'drawn as a thick wobbly black ink line, no fill, no shading, rounded line ends, very few loose shapes',
    2: 'drawn as a hand-drawn black ink line with slightly wobbly strokes, no fill, no shading, rounded line ends, simple loose shapes',
    3: 'drawn as a fine hand-drawn black ink line with sketchy strokes, no fill, no shading, rounded line ends, rich interior detail' } },
};
const SPECKLE = { 1: 6, 2: 4, 3: 2 };

function promptFor(subject, style, detail) {
  const st = STYLES[style];
  return 'A flat vector ' + st.kind + ' of ' + subject + ', ' + st.text[detail] + ', centred with a generous margin on a plain white background, front view, even flat light.';
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
  async function draw(model, prompt, seed, onStage, cancelled) {
    let last;
    for (let a = 0; a < 3; a++) {
      try {
        await ensure(model, onStage);
        return await txt2imgOnce(prompt, seed);
      } catch (e) {
        if (cancelled && cancelled()) throw e;
        last = e;
        if (!proc) last = new Error('The image engine stopped.\n' + log.slice(-1500));
        stop();
      }
    }
    throw last;
  }

  async function txt2imgOnce(prompt, seed) {
    const res = await fetch('http://127.0.0.1:' + port + '/sdapi/v1/txt2img', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify({ prompt, negative_prompt: '', width: 1024, height: 1024, steps: 4, cfg_scale: 1, seed, sampler_name: 'euler', scheduler: 'simple', batch_size: 1 }),
      signal: AbortSignal.timeout(10 * 60 * 1000),
    });
    if (!res.ok) throw new Error('The image engine answered ' + res.status + ': ' + (await res.text()).slice(0, 300));
    const j = await res.json();
    const b64 = (j.images && j.images[0]) || '';
    if (!b64) throw new Error('The image engine returned no picture.\n' + log.slice(-800));
    return Buffer.from(b64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
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
      if (files.length) out.push({ folder: name, files });
    }
    return out;
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
            const png = await engine.draw(model, promptFor(k, style, detail), seed, null, () => job.cancel);
            const svg = await trace(png, detail);
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

  return { jobs, start, cancel, library, listSvgs, stopEngine: engine.stop };
}

module.exports = { create, slugUnderscore, trace };
