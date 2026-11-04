const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, dialog, shell, Menu } = require('electron');
const modelstore = require('./modelstore');
const generate = require('./generate');
const server = require('./server');

// Optional folders for testing and screenshots, so a demo never touches the real library or settings.
if (process.env.ICONFORGE_DATA) app.setPath('userData', process.env.ICONFORGE_DATA);

if (!app.requestSingleInstanceLock()) { app.quit(); }

// Icon sets and fonts live in Documents\Icon Forge; the model and settings in the app's data folder.
const baseDir = process.env.ICONFORGE_LIBRARY || path.join(app.getPath('documents'), 'Icon Forge');
const dataDir = app.getPath('userData');
const engineDir = app.isPackaged ? path.join(process.resourcesPath, 'engine') : path.join(__dirname, 'engine');

let win = null, gen = null, splash = null;
const SPLASH_MIN_MS = 1800;

// Purple splash with the app icon; shown at once while the app sets itself up.
function showSplash() {
  splash = new BrowserWindow({
    width: 520, height: 360, frame: false, transparent: true, resizable: false, movable: false, show: false,
    skipTaskbar: true, alwaysOnTop: true, hasShadow: false, title: 'Icon Forge', icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  splash.once('ready-to-show', () => splash && splash.show());
  splash.on('closed', () => { splash = null; });
  splash.loadFile(path.join(__dirname, 'public', 'splash.html'));
  return Date.now();
}
const closeSplash = () => { if (splash) splash.destroy(); };

async function start() {
  const splashAt = showSplash();
  fs.mkdirSync(baseDir, { recursive: true });
  const models = modelstore.create(dataDir, baseDir);
  gen = generate.create({ baseDir, engineDir, models });
  const host = {
    openPath: p => shell.openPath(p),
    pickFolder: async () => {
      const r = await dialog.showOpenDialog(win, { title: 'Choose where to save the Flux model (about 17 GB)', properties: ['openDirectory', 'createDirectory'] });
      return r.canceled ? '' : r.filePaths[0];
    },
    pickModel: async () => {
      const r = await dialog.showOpenDialog(win, { title: 'Choose ' + modelstore.MODEL.name, properties: ['openFile'], filters: [{ name: 'Model', extensions: ['safetensors'] }] });
      return r.canceled ? '' : r.filePaths[0];
    },
  };
  const srv = await server.create({ publicDir: path.join(__dirname, 'public'), baseDir, gen, models, host }).listen();

  Menu.setApplicationMenu(null);
  win = new BrowserWindow({
    width: 1240, height: 880, minWidth: 760, minHeight: 560, title: 'Icon Forge', backgroundColor: '#f5f6f8', show: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  // The font preview opens in its own window; anything outside this app goes to the normal browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(srv.url)) return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true, width: 1100, height: 800 } };
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(srv.url)) e.preventDefault(); });
  const shown = new Promise(r => { win.once('ready-to-show', r); setTimeout(r, 15000); });
  await win.loadURL(srv.url);
  await shown;
  // Keep the splash up long enough to be seen, then swap to the real window.
  await new Promise(r => setTimeout(r, Math.max(0, SPLASH_MIN_MS - (Date.now() - splashAt))));
  win.show();
  closeSplash();
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(start).catch(e => { closeSplash(); dialog.showErrorBox('Icon Forge could not start', String(e && e.stack || e)); app.quit(); });
app.on('before-quit', () => { if (gen) gen.stopEngine(); });
app.on('will-quit', () => { if (gen) gen.stopEngine(); });
process.on('exit', () => { if (gen) gen.stopEngine(); });
app.on('window-all-closed', () => app.quit());
