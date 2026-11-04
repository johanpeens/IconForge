// Switches the wiki pages between two link styles, so the same pages work in both places:
//   node scripts/wiki-links.js folder   -> links end in .md        (reading the wiki/ folder on GitHub, and the README)
//   node scripts/wiki-links.js wiki     -> links have no .md       (the real GitHub Wiki tab, which wants Page-Name)
//   node scripts/wiki-links.js check    -> only checks that every link and image points at a real file
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const wikiDir = path.join(root, 'wiki');
const mode = process.argv[2];
if (!['folder', 'wiki', 'check'].includes(mode)) { console.log('Usage: node scripts/wiki-links.js folder|wiki|check'); process.exit(1); }

const pages = fs.readdirSync(wikiDir).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3));
const isPage = n => pages.includes(n);
// [text](Page) or [text](Page#anchor) or [text](Page.md#anchor), never web links, images or pure anchors
const LINK = /\]\(((?:\.\.\/\.\.\/wiki\/|wiki\/)?)([A-Za-z0-9_\-]+)(\.md)?(#[^)\s]*)?\)/g;

function convertWikiPage(text) {
  return text.replace(LINK, (all, pre, name, md, anchor) => {
    if (pre || !isPage(name)) return all;
    return '](' + name + (mode === 'folder' ? '.md' : '') + (anchor || '') + ')';
  });
}
function convertReadme(text) {
  text = text.replace(/\]\(\.\.\/\.\.\/wiki\)/g, '](wiki/Home.md)');
  return text.replace(LINK, (all, pre, name, md, anchor) => {
    if (!pre || !isPage(name)) return all;
    return '](wiki/' + name + '.md' + (anchor || '') + ')';
  });
}

let problems = 0;
function checkFile(file, base) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const target = m[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const rel = target.split('#')[0];
    if (!rel || rel.startsWith('../../releases')) continue;
    const full = path.resolve(base, rel);
    if (!fs.existsSync(full)) { problems++; console.log('BROKEN in ' + path.relative(root, file) + ': ' + target); }
  }
}

if (mode !== 'check') {
  for (const f of fs.readdirSync(wikiDir).filter(f => f.endsWith('.md'))) {
    const p = path.join(wikiDir, f), t = fs.readFileSync(p, 'utf8'), c = convertWikiPage(t);
    if (c !== t) fs.writeFileSync(p, c);
  }
  if (mode === 'folder') {
    const p = path.join(root, 'README.md'), t = fs.readFileSync(p, 'utf8'), c = convertReadme(t);
    if (c !== t) fs.writeFileSync(p, c);
  }
}
if (mode !== 'wiki') {
  for (const f of fs.readdirSync(wikiDir).filter(f => f.endsWith('.md'))) checkFile(path.join(wikiDir, f), wikiDir);
  checkFile(path.join(root, 'README.md'), root);
  console.log(problems ? problems + ' broken link(s)' : 'All links and images in wiki/ and the README point at real files.');
  process.exit(problems ? 1 : 0);
}
console.log('Wiki links are now in the Wiki-tab style (no .md).');
