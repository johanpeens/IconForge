// Flip / rotate / scale / move / delete-shape edits applied to a traced SVG (ported from icon_app.py).
const path = require('path');

function editParams(e) {
  const num = (k, d, lo, hi) => {
    const v = parseFloat(e[k]);
    return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d;
  };
  const rot = ((Math.floor(num("rot", 0, -3600, 3600) / 90) * 90) % 360 + 360) % 360;
  return [e.fx === -1 ? -1 : 1, e.fy === -1 ? -1 : 1, rot, num('s', 1, 0.2, 3.0), num('dx', 0, -1024, 1024), num('dy', 0, -1024, 1024)];
}

function isIdentity(e) {
  const p = editParams(e);
  return p[0] === 1 && p[1] === 1 && p[2] === 0 && p[3] === 1 && p[4] === 0 && p[5] === 0 && !(e.del && e.del.length);
}

function parseDels(v) {
  const out = new Set();
  const list = Array.isArray(v) ? v : String(v || '').split(',');
  for (const i of list) {
    const n = parseInt(i, 10);
    if (Number.isFinite(n)) out.add(n);
  }
  return out;
}

// Remove the <path> elements whose position (0, 1, 2 ...) is in dels.
function dropPaths(text, dels) {
  if (!dels.size) return text;
  let idx = 0;
  return text.replace(/<path\b[^>]*>/g, m => (dels.has(idx++) ? '' : m));
}

// Return the SVG with the edits applied to every path point (same maths as the page).
function bake(text, e) {
  const [fx, fy, rot, sc, dx, dy] = editParams(e);
  const head = text.match(/<svg\b[^>]*>/)[0];
  const w = parseFloat(head.match(/\bwidth="([\d.]+)/)[1]);
  const h = parseFloat(head.match(/\bheight="([\d.]+)/)[1]);
  const cx = w / 2, cy = h / 2;
  const dels = parseDels(e.del);

  const tf = (x, y) => {
    x -= cx; y -= cy;
    for (let i = 0; i < rot / 90; i++) [x, y] = [-y, x];
    return [x * sc * fx + cx + dx, y * sc * fy + cy + dy];
  };

  const paths = [];
  let idx = 0;
  for (const m of text.matchAll(/<path\b([^>]*)>/g)) {
    if (dels.has(idx++)) continue;
    const attrs = m[1];
    const d = attrs.match(/\bd="([^"]*)"/)[1];
    const fill = attrs.match(/fill="([^"]*)"/);
    let tx = 0, ty = 0;
    const t = attrs.match(/translate\(\s*([-\d.eE]+)[ ,]+([-\d.eE]+)\s*\)/);
    if (t) { tx = parseFloat(t[1]); ty = parseFloat(t[2]); }
    const tok = d.match(/[MLCZmlcz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) || [];
    const out = [];
    let i = 0;
    while (i < tok.length) {
      const c = tok[i++];
      if (c === 'Z' || c === 'z') { out.push('Z'); continue; }
      const n = c === 'C' || c === 'c' ? 6 : 2;
      const nums = tok.slice(i, i + n).map(Number);
      i += n;
      const pts = [];
      for (let k = 0; k < n; k += 2) {
        const [x, y] = tf(nums[k] + tx, nums[k + 1] + ty);
        pts.push(x.toFixed(1) + ' ' + y.toFixed(1));
      }
      out.push(c.toUpperCase() + ' ' + pts.join(' '));
    }
    paths.push('<path d="' + out.join(' ') + '" fill="' + (fill ? fill[1] : '#000000') + '"/>');
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="' + Math.trunc(w) + '" height="' + Math.trunc(h) + '">\n' + paths.join('\n') + '\n</svg>\n';
}

// Join and make sure the result stays inside root.
function safePath(root, ...parts) {
  const r = path.resolve(root);
  const p = path.resolve(r, ...parts);
  return p === r || p.startsWith(r + path.sep) ? p : null;
}

module.exports = { editParams, isIdentity, parseDels, dropPaths, bake, safePath };
