// Small local web server that the app window talks to (same routes as the icon_app.py prototype).
// Only reachable from this PC (127.0.0.1).
const fs = require('fs');
const http = require('http');
const path = require('path');
const { URL } = require('url');
const { editParams, isIdentity, parseDels, dropPaths, bake, safePath } = require('./svgedit');
const { makeFont, slugify } = require('./fontmaker');

const TYPES = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.png': 'image/png', '.ico': 'image/x-icon' };
const cleanKeyword = s => s.replace(/[^A-Za-z0-9 \-]/g, '').trim().slice(0, 60);

function create({ publicDir, baseDir, gen, models, host, fixedPort = 0 }) {
  const fontsDir = path.join(baseDir, 'iconfonts');
  let port = 0;

  function send(res, code, body, ctype = 'application/json') {
    if (body !== null && typeof body === 'object' && !Buffer.isBuffer(body)) body = JSON.stringify(body);
    const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body), 'utf8');
    res.writeHead(code, { 'Content-Type': ctype, 'Content-Length': buf.length, 'Cache-Control': 'no-store' });
    res.end(buf);
  }

  function sendFile(res, p) {
    if (!p || !fs.existsSync(p) || !fs.statSync(p).isFile()) return send(res, 404, { error: 'not found' });
    send(res, 200, fs.readFileSync(p), TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream');
  }

  function readBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(e); } });
      req.on('error', reject);
    });
  }

  async function route(req, res) {
    // Refuse anything that is not this app talking to itself (blocks other web pages and DNS rebinding).
    if (req.headers.host !== '127.0.0.1:' + port) return send(res, 403, { error: 'forbidden' });
    if (req.method === 'POST' && req.headers.origin && req.headers.origin !== 'http://127.0.0.1:' + port) return send(res, 403, { error: 'forbidden' });

    const u = new URL(req.url, 'http://127.0.0.1');
    const p = decodeURIComponent(u.pathname);

    if (req.method === 'GET') {
      if (p === '/' || p === '/index.html') {
        // Put the saved theme on the page before it paints, so dark users never see a white flash.
        const theme = models.getSetting('theme');
        let html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
        if (theme === 'light' || theme === 'dark') html = html.replace('<html lang="en">', '<html lang="en" data-theme="' + theme + '">');
        return send(res, 200, html, TYPES['.html']);
      }
      if (p === '/api/status') return send(res, 200, { model: models.status(), library: gen.library(), theme: models.getSetting('theme') || '' });
      if (p === '/api/job') {
        const j = gen.jobs[u.searchParams.get('id') || ''];
        return send(res, j ? 200 : 404, j || { error: 'unknown job' });
      }
      if (p.startsWith('/svg/')) {
        const parts = p.slice(5).split('/');
        if (parts.length === 2 && parts[1].toLowerCase().endsWith('.svg')) {
          const f = safePath(baseDir, parts[0], parts[1]);
          const dels = parseDels(u.searchParams.get('del') || '');
          if (dels.size && f && fs.existsSync(f)) return send(res, 200, dropPaths(fs.readFileSync(f, 'utf8'), dels), 'image/svg+xml');
          return sendFile(res, f);
        }
      }
      if (p.startsWith('/iconfonts/')) return sendFile(res, safePath(fontsDir, ...p.slice(11).split('/')));
      if (p === '/favicon.ico') return send(res, 204, '', 'image/x-icon');
      return send(res, 404, { error: 'not found' });
    }

    if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' });
    let data;
    try { data = await readBody(req); } catch (e) { return send(res, 400, { error: 'bad json' }); }

    if (p === '/api/generate') {
      const kws = [];
      for (const k of data.keywords || []) {
        const c = cleanKeyword(String(k));
        if (c && !kws.some(x => x.toLowerCase() === c.toLowerCase())) kws.push(c);
      }
      const per = Math.max(1, Math.min(24, parseInt(data.per, 10) || 5));
      let detail = parseInt(data.detail, 10);
      if (![1, 2, 3].includes(detail)) detail = 2;
      let style = String(data.style || 'line');
      if (!['line', 'filled', 'double', 'hand'].includes(style)) style = 'line';
      if (!kws.length) return send(res, 400, { error: 'no keywords' });
      return send(res, 200, gen.start(kws, per, detail, style));
    }

    if (p === '/api/generate/cancel') return send(res, 200, gen.cancel(String(data.id || '')));

    if (p === '/api/font') {
      const icons = [];
      for (const ic of data.icons || []) {
        const src = safePath(baseDir, String(ic.folder || ''), String(ic.file || ''));
        if (!src || !fs.existsSync(src) || !src.toLowerCase().endsWith('.svg')) continue;
        let text = fs.readFileSync(src, 'utf8');
        if (ic.edit && typeof ic.edit === 'object' && !isIdentity(ic.edit)) text = bake(text, ic.edit);
        icons.push({ name: ic.name || path.basename(ic.file, '.svg'), svg: text });
      }
      if (!icons.length) return send(res, 200, { ok: false, error: 'No icons in the basket.' });
      try { return send(res, 200, await makeFont(fontsDir, String(data.name || ''), icons)); }
      catch (e) { return send(res, 200, { ok: false, error: 'The font maker did not finish.', log: String(e && e.stack || e).slice(0, 1500) }); }
    }

    if (p === '/api/bake') {
      const src = safePath(baseDir, String(data.folder || ''), String(data.file || ''));
      if (!src || !fs.existsSync(src) || !src.toLowerCase().endsWith('.svg')) return send(res, 404, { error: 'icon not found' });
      let text = fs.readFileSync(src, 'utf8');
      if (data.edit && typeof data.edit === 'object' && !isIdentity(data.edit)) text = bake(text, data.edit);
      return send(res, 200, { svg: text.slice(text.indexOf('<svg')) });
    }

    if (p === '/api/reveal') {
      const slug = slugify(String(data.slug || ''));
      const d = slug ? safePath(fontsDir, slug) : baseDir;
      if (d && fs.existsSync(d)) { host.openPath(d); return send(res, 200, { ok: true }); }
      return send(res, 404, { error: 'folder not found' });
    }

    if (p === '/api/theme') {
      const t = data.theme === 'dark' ? 'dark' : 'light';
      models.setSetting('theme', t);
      return send(res, 200, { ok: true, theme: t });
    }

    if (p === '/api/model/folder') {
      const d = await host.pickFolder();
      if (!d) return send(res, 200, { ok: false });
      try { models.setFolder(d); return send(res, 200, { ok: true }); } catch (e) { return send(res, 200, { ok: false, error: 'Cannot save into that folder: ' + e.message }); }
    }
    if (p === '/api/model/download') { models.download(); return send(res, 200, { ok: true }); }
    if (p === '/api/model/cancel') { models.cancel(); return send(res, 200, { ok: true }); }
    if (p === '/api/model/browse') {
      const f = await host.pickModel();
      if (!f) return send(res, 200, { ok: false });
      try { models.usePath(f); return send(res, 200, { ok: true }); } catch (e) { return send(res, 200, { ok: false, error: e.message }); }
    }
    send(res, 404, { error: 'not found' });
  }

  function listen() {
    return new Promise((resolve, reject) => {
      const srv = http.createServer((req, res) => { route(req, res).catch(e => { try { send(res, 500, { error: String(e && e.message || e) }); } catch (x) { /* response already closed */ } }); });
      srv.once('error', reject);
      srv.listen(fixedPort, '127.0.0.1', () => { port = srv.address().port; resolve({ port, url: 'http://127.0.0.1:' + port + '/', close: () => srv.close() }); });
    });
  }

  return { listen };
}

module.exports = { create };
