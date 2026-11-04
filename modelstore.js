// Where the Flux Schnell model lives, and downloading it (resumable).
const fs = require('fs');
const path = require('path');

const MODEL = {
  name: 'flux1-schnell-fp8.safetensors',
  size: 17236328572,
  url: 'https://huggingface.co/Comfy-Org/flux1-schnell/resolve/main/flux1-schnell-fp8.safetensors',
};
const MIN_OWN_FILE = 1024 * 1024 * 1024; // a model the user points to just has to look like a real checkpoint

function create(dataDir, libraryDir) {
  const modelsDir = path.join(dataDir, 'models');
  const settingsFile = path.join(dataDir, 'settings.json');
  const dl = { active: false, got: 0, error: '', abort: null, samples: [] };

  function loadSettings() {
    try { return JSON.parse(fs.readFileSync(settingsFile, 'utf8')); } catch (e) { return {}; }
  }
  function saveSettings(s) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(settingsFile, JSON.stringify(s, null, 2));
  }

  // Where the model is downloaded to: the folder the user picked, else the app's own models folder.
  const downloadDir = () => loadSettings().modelDir || modelsDir;
  const defaultPath = () => path.join(downloadDir(), MODEL.name);
  function fileSize(p) { try { return fs.statSync(p).size; } catch (e) { return -1; } }

  // The model file to use, or '' when none is installed.
  function modelPath() {
    const own = loadSettings().modelPath;
    if (own && fileSize(own) >= MIN_OWN_FILE) return own;
    return fileSize(defaultPath()) === MODEL.size ? defaultPath() : '';
  }

  function status() {
    const p = modelPath();
    const got = dl.active ? dl.got : 0;
    // Speed over the last ~15 seconds, so the time-left figure does not jump about.
    let speed = 0;
    if (dl.active && dl.samples.length > 1) {
      const a = dl.samples[0], b = dl.samples[dl.samples.length - 1];
      speed = b[0] > a[0] ? (b[1] - a[1]) / ((b[0] - a[0]) / 1000) : 0;
    }
    return {
      ready: !!p, name: MODEL.name, size: MODEL.size, path: p, folder: downloadDir(), library: libraryDir,
      downloading: dl.active, got, percent: dl.active ? Math.min(100, got / MODEL.size * 100) : 0, error: dl.error,
      speed, eta: speed > 0 ? (MODEL.size - got) / speed : 0,
    };
  }

  function usePath(p) {
    if (fileSize(p) < MIN_OWN_FILE) throw new Error('That file is too small to be the Flux Schnell model (' + MODEL.name + ').');
    saveSettings(Object.assign(loadSettings(), { modelPath: p }));
    dl.error = '';
  }

  // Pick the folder the model is downloaded into.
  function setFolder(dir) {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    saveSettings(Object.assign(loadSettings(), { modelDir: dir }));
    dl.error = '';
  }

  async function download() {
    if (dl.active || modelPath()) return;
    dl.active = true; dl.error = ''; dl.abort = new AbortController();
    dl.samples = [];
    const dir = downloadDir();
    const part = defaultPath() + '.part';
    try {
      fs.mkdirSync(dir, { recursive: true });
      let have = Math.max(0, fileSize(part));
      try {
        const st = fs.statfsSync(dir);
        const need = MODEL.size - Math.min(have, MODEL.size) + 512 * 1024 * 1024;
        if (st.bavail * st.bsize < need) throw new Error('Not enough free space in ' + dir + ': the model needs about ' + (need / 1e9).toFixed(1) + ' GB. Choose another folder.');
      } catch (e) { if (/Not enough free space/.test(e.message)) throw e; }
      if (have > MODEL.size) { fs.rmSync(part, { force: true }); have = 0; }
      dl.got = have;
      if (have < MODEL.size) {
        const res = await fetch(MODEL.url, { headers: have ? { Range: 'bytes=' + have + '-' } : {}, signal: dl.abort.signal, redirect: 'follow' });
        if (!res.ok && res.status !== 206) throw new Error('The download server answered ' + res.status + '. Try again in a minute.');
        if (res.status === 200 && have) { have = 0; dl.got = 0; fs.rmSync(part, { force: true }); } // server ignored the resume request
        const out = fs.createWriteStream(part, { flags: have ? 'a' : 'w' });
        const reader = res.body.getReader();
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!out.write(value)) await new Promise(r => out.once('drain', r));
            dl.got += value.length;
            const now = Date.now();
            dl.samples.push([now, dl.got]);
            while (dl.samples.length > 2 && now - dl.samples[0][0] > 15000) dl.samples.shift();
          }
        } finally {
          await new Promise(r => out.end(r));
        }
      }
      if (fileSize(part) !== MODEL.size) throw new Error('The download stopped early (' + fileSize(part) + ' of ' + MODEL.size + ' bytes). Press Download again to carry on.');
      fs.renameSync(part, defaultPath());
      // Point the app at the finished download.
      saveSettings(Object.assign(loadSettings(), { modelPath: defaultPath() }));
    } catch (e) {
      dl.error = e.name === 'AbortError' ? '' : (e.message || String(e));
    } finally {
      dl.active = false; dl.abort = null;
    }
  }

  function cancel() { if (dl.abort) dl.abort.abort(); }

  const getSetting = k => loadSettings()[k];
  const setSetting = (k, v) => saveSettings(Object.assign(loadSettings(), { [k]: v }));

  return { MODEL, status, modelPath, usePath, setFolder, download, cancel, getSetting, setSetting };
}

module.exports = { create, MODEL };
