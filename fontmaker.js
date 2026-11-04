// Icon font maker: SVG icons -> .ttf / .woff / .woff2 + .css + preview.html (ported from make_iconfont.bat).
const fs = require('fs');
const path = require('path');
const svg2ttf = require('svg2ttf');
const ttf2woff = require('ttf2woff');
const wawoff2 = require('wawoff2');

const UPM = 1024, ASCENT = 896, DESCENT = -128, FIRST_CODEPOINT = 0xE001;

const slugify = (s, sep = '-') => s.toLowerCase().replace(/[^a-z0-9]+/g, sep).replace(new RegExp('^' + sep + '|' + sep + '$', 'g'), '');
const escHtml = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Return { subpaths, scale }. Each subpath is a list of [op, points].
function parseSvg(text) {
  const head = text.match(/<svg\b[^>]*>/)[0];
  const vb = head.match(/viewBox="([^"]+)"/);
  let w, h;
  if (vb) { const v = vb[1].trim().split(/[ ,]+/).map(Number); w = v[2]; h = v[3]; }
  else { w = parseFloat(head.match(/\bwidth="([\d.]+)/)[1]); h = parseFloat(head.match(/\bheight="([\d.]+)/)[1]); }
  const scale = UPM / Math.max(w, h);
  const subpaths = [];
  for (const m of text.matchAll(/<path\b([^>]*)>/g)) {
    const attrs = m[1];
    const fm = attrs.match(/fill="([^"]*)"/);
    const fill = fm ? fm[1].toLowerCase() : '#000000';
    if (fill === 'none' || fill === 'transparent') continue;
    if (/^#[0-9a-f]{6}$/.test(fill)) {
      const [r, g, b] = [1, 3, 5].map(i => parseInt(fill.slice(i, i + 2), 16));
      if (0.299 * r + 0.587 * g + 0.114 * b > 230) continue; // white-ish background shape
    }
    const d = attrs.match(/\bd="([^"]*)"/)[1];
    let tx = 0, ty = 0;
    const t = attrs.match(/translate\(\s*([-\d.eE]+)[ ,]+([-\d.eE]+)\s*\)/);
    if (t) { tx = parseFloat(t[1]); ty = parseFloat(t[2]); }
    const tokens = d.match(/[MLCZmlcz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) || [];
    let i = 0, cmd = null, cur = null;
    while (i < tokens.length) {
      if (/^[MLCZmlcz]$/.test(tokens[i])) {
        cmd = tokens[i++];
        if (cmd === 'Z' || cmd === 'z') {
          if (cur) { cur.push(['Z', []]); subpaths.push(cur); cur = null; }
          continue;
        }
      }
      if (cmd === 'M' || cmd === 'L') {
        const x = parseFloat(tokens[i]) + tx, y = parseFloat(tokens[i + 1]) + ty;
        i += 2;
        if (cmd === 'M') {
          if (cur) { cur.push(['Z', []]); subpaths.push(cur); }
          cur = [['M', [[x, y]]]];
          cmd = 'L';
        } else cur.push(['L', [[x, y]]]);
      } else if (cmd === 'C') {
        const v = tokens.slice(i, i + 6).map(Number);
        i += 6;
        cur.push(['C', [[v[0] + tx, v[1] + ty], [v[2] + tx, v[3] + ty], [v[4] + tx, v[5] + ty]]]);
      } else throw new Error('Unsupported path command ' + cmd);
    }
    if (cur) { cur.push(['Z', []]); subpaths.push(cur); }
  }
  return { subpaths, scale };
}

// SVG-font glyph outline: y points up, baseline at 0.
function glyphD(subpaths, scale) {
  const r = v => Math.round(v * 100) / 100;
  const pt = p => r(p[0] * scale) + ' ' + r(ASCENT - p[1] * scale);
  const out = [];
  for (const sp of subpaths) {
    for (const [op, pts] of sp) {
      if (op === 'M') out.push('M' + pt(pts[0]));
      else if (op === 'L') out.push('L' + pt(pts[0]));
      else if (op === 'C') out.push('C' + pt(pts[0]) + ' ' + pt(pts[1]) + ' ' + pt(pts[2]));
      else out.push('Z');
    }
  }
  return out.join('');
}

const PREVIEW = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__FAMILY__ icon font</title>
<style>
@font-face { font-family: "__FAMILY__"; src: url(data:font/woff;base64,__B64__) format("woff"); }
__BASECSS__
:root { --bg:#f6f7f9; --card:#fff; --ink:#1b1f24; --muted:#6b7280; --line:#e2e5ea; --icon:#1b1f24; --accent:#2563eb; --size:56px; }
:root[data-theme="dark"] { --bg:#14171b; --card:#1d2227; --ink:#e8eaed; --muted:#9aa3ad; --line:#2d343b; --icon:#e8eaed; --accent:#60a5fa; }
* { box-sizing:border-box; }
body { margin:0; font:15px/1.5 system-ui, Segoe UI, sans-serif; background:var(--bg); color:var(--ink); }
header { padding:20px 16px 8px; max-width:1200px; margin:0 auto; }
h1 { margin:0 0 4px; font-size:24px; }
.sub { color:var(--muted); margin:0; }
.bar { display:flex; flex-wrap:wrap; gap:12px 20px; align-items:center; padding:12px 16px; max-width:1200px; margin:0 auto; }
.bar label { display:flex; gap:8px; align-items:center; color:var(--muted); }
input[type=search] { padding:8px 12px; border:1px solid var(--line); border-radius:8px; background:var(--card); color:var(--ink); min-width:200px; }
button.toggle { padding:8px 12px; border:1px solid var(--line); border-radius:8px; background:var(--card); color:var(--ink); cursor:pointer; }
.grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:12px; padding:8px 16px 24px; max-width:1200px; margin:0 auto; }
.card { display:flex; flex-direction:column; align-items:center; gap:6px; padding:16px 8px 12px; border:1px solid var(--line); border-radius:12px; background:var(--card); color:var(--ink); cursor:pointer; font:inherit; }
.card:hover, .card:focus-visible { border-color:var(--accent); outline:none; }
.card i { font-size:var(--size); color:var(--icon); }
.n { font-size:12px; word-break:break-all; text-align:center; }
.c { font-size:11px; color:var(--muted); }
pre { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:14px 16px; overflow:auto; margin:0 16px 24px; max-width:1168px; }
@media (min-width:1232px) { pre { margin:0 auto 24px; } }
#toast { position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:var(--ink); color:var(--bg); padding:8px 14px; border-radius:8px; opacity:0; transition:opacity .2s; pointer-events:none; }
#toast.show { opacity:1; }
</style></head><body>
<header><h1>__FAMILY__</h1>
<p class="sub">__COUNT__ icons. Click an icon to copy its class. Files: __FILES__</p></header>
<div class="bar">
<input type="search" id="q" placeholder="Search icons" aria-label="Search icons">
<label>Size <input type="range" id="size" min="16" max="128" value="56"> <span id="sv">56px</span></label>
<label>Colour <input type="color" id="col" value="#1b1f24"></label>
<button class="toggle" id="theme">Light / dark</button>
</div>
<main class="grid" id="grid">
__CARDS__</main>
<pre>&lt;link rel="stylesheet" href="__SLUG__.css"&gt;
&lt;i class="__SLUG__ __SLUG__-<span id="ex">__FIRST__</span>"&gt;&lt;/i&gt;</pre>
<div id="toast" role="status"></div>
<script>
const root = document.documentElement, toast = document.getElementById('toast');
const q = document.getElementById('q'), cards = [...document.querySelectorAll('.card')];
q.addEventListener('input', () => { const t = q.value.toLowerCase(); cards.forEach(c => c.style.display = c.dataset.name.includes(t) ? '' : 'none'); });
const size = document.getElementById('size');
size.addEventListener('input', () => { root.style.setProperty('--size', size.value + 'px'); document.getElementById('sv').textContent = size.value + 'px'; });
const col = document.getElementById('col');
col.addEventListener('input', () => root.style.setProperty('--icon', col.value));
document.getElementById('theme').addEventListener('click', () => {
  const dark = root.dataset.theme !== 'dark'; root.dataset.theme = dark ? 'dark' : 'light';
  root.style.removeProperty('--icon'); col.value = dark ? '#e8eaed' : '#1b1f24';
});
function say(m) { toast.textContent = m; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 1400); }
cards.forEach(c => c.addEventListener('click', () => {
  const cls = '__SLUG__ __SLUG__-' + c.dataset.name;
  document.getElementById('ex').textContent = c.dataset.name;
  const done = () => say('Copied: ' + cls);
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(cls).then(done, () => fallback(cls, done));
  else fallback(cls, done);
}));
function fallback(text, done) { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} t.remove(); done(); }
</script></body></html>
`;

// icons: [{ name, svg }] with the SVG text already edited. Writes into fontsRoot/<slug>/.
async function makeFont(fontsRoot, rawName, icons) {
  const family = rawName.replace(/[^A-Za-z0-9 _-]/g, '').trim() || 'icons';
  const slug = slugify(family) || 'icons';
  const glyphs = [], names = [];
  const used = new Set();
  let cp = FIRST_CODEPOINT;
  for (const ic of icons) {
    const base = slugify(ic.name) || 'icon';
    let nm = base, k = 2;
    while (used.has(nm)) nm = base + '-' + k++;
    used.add(nm);
    try {
      const { subpaths, scale } = parseSvg(ic.svg);
      if (!subpaths.length) continue;
      glyphs.push('<glyph glyph-name="i_' + nm.replace(/-/g, '_') + '" unicode="&#x' + cp.toString(16) + ';" horiz-adv-x="' + UPM + '" d="' + glyphD(subpaths, scale) + '"/>');
      names.push([nm, cp]);
      cp++;
    } catch (e) { /* skip an icon we cannot read */ }
  }
  if (!names.length) return { ok: false, error: 'Nothing to build: none of the icons has a drawable shape.' };

  const svgFont = '<?xml version="1.0" standalone="no"?><svg xmlns="http://www.w3.org/2000/svg"><defs><font id="' + slug + '" horiz-adv-x="' + UPM + '">' +
    '<font-face font-family="' + escHtml(family) + '" units-per-em="' + UPM + '" ascent="' + ASCENT + '" descent="' + DESCENT + '"/>' +
    '<missing-glyph horiz-adv-x="' + UPM + '"/>' + glyphs.join('') + '</font></defs></svg>';
  const ttf = Buffer.from(svg2ttf(svgFont, {}).buffer);

  const outDir = path.join(fontsRoot, slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, slug + '.ttf'), ttf);
  const woff = Buffer.from(ttf2woff(new Uint8Array(ttf)).buffer);
  fs.writeFileSync(path.join(outDir, slug + '.woff'), woff);
  const formats = [['woff', 'woff'], ['truetype', 'ttf']];
  try {
    fs.writeFileSync(path.join(outDir, slug + '.woff2'), Buffer.from(await wawoff2.compress(new Uint8Array(ttf))));
    formats.unshift(['woff2', 'woff2']);
  } catch (e) { /* woff2 is optional */ }

  const src = formats.map(([fmt, ext]) => 'url("' + slug + '.' + ext + '") format("' + fmt + '")').join(',\n       ');
  let css = '@font-face {\n  font-family: "' + family + '";\n  src: ' + src + ';\n  font-weight: normal;\n  font-style: normal;\n  font-display: block;\n}\n' +
    '.' + slug + ' {\n  font-family: "' + family + '" !important;\n  font-style: normal;\n  font-weight: normal;\n  font-variant: normal;\n  text-transform: none;\n  line-height: 1;\n  display: inline-block;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n';
  for (const [nm, c] of names) css += '.' + slug + '-' + nm + '::before { content: "\\' + c.toString(16) + '"; }\n';
  fs.writeFileSync(path.join(outDir, slug + '.css'), css);

  const cards = names.map(([nm, c]) => '<button class="card" data-name="' + escHtml(nm) + '" title="Click to copy the class"><i class="' + slug + ' ' + slug + '-' + escHtml(nm) + '"></i>' +
    '<span class="n">' + escHtml(nm) + '</span><span class="c">U+' + c.toString(16).toUpperCase() + '</span></button>\n').join('');
  const baseCss = css.replace(/@font-face \{[\s\S]*?\}\n/, '');
  const files = fs.readdirSync(outDir).filter(n => n !== 'preview.html').sort().concat('preview.html');
  const page = PREVIEW.split('__FAMILY__').join(escHtml(family)).split('__B64__').join(woff.toString('base64'))
    .split('__BASECSS__').join(baseCss).split('__COUNT__').join(String(names.length))
    .split('__FILES__').join(escHtml(files.join(', '))).split('__CARDS__').join(cards)
    .split('__SLUG__').join(slug).split('__FIRST__').join(escHtml(names[0][0]));
  fs.writeFileSync(path.join(outDir, 'preview.html'), page);
  return { ok: true, name: family, slug, count: names.length, files: fs.readdirSync(outDir).sort(), preview: '/iconfonts/' + slug + '/preview.html', outDir };
}

module.exports = { makeFont, slugify };
