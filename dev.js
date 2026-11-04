// Browser-only preview of the UI (no Electron): node dev.js  ->  http://127.0.0.1:8766/
const path = require('path');
const os = require('os');
const modelstore = require('./modelstore');
const generate = require('./generate');
const server = require('./server');
const baseDir = process.env.ICONFORGE_LIBRARY || path.join(os.tmpdir(), 'ifbase');
const models = modelstore.create(process.env.ICONFORGE_DATA || path.join(os.tmpdir(), 'ifdata'), baseDir);
const gen = generate.create({ baseDir, engineDir: path.join(__dirname, 'engine'), models });
// The browser preview has no Recycle Bin, so "trash" moves things into a temp folder instead.
const trashDir = path.join(os.tmpdir(), 'iftrash');
const trash = async p => { require('fs').mkdirSync(trashDir, { recursive: true }); require('fs').renameSync(p, path.join(trashDir, Date.now() + '-' + path.basename(p))); };
const host = { trash, openPath: p => console.log('open', p), pickModel: async () => '', pickFolder: async () => '' };
server.create({ publicDir: path.join(__dirname, 'public'), baseDir, gen, models, host, fixedPort: Number(process.env.PORT) || 8766 }).listen().then(s => console.log('Icon Forge UI at ' + s.url));
