// Downloads the image engine (stable-diffusion.cpp, Vulkan build for Windows) into ./engine.
// Run once with `npm run engine`. It is skipped when the engine is already there.
// Usage: node scripts/fetch-engine.js [target folder]
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RELEASE = 'master-1043-3be2378';
const FILE = 'sd-master-3be2378-bin-win-vulkan-x64.zip';
const URL = 'https://github.com/leejet/stable-diffusion.cpp/releases/download/' + RELEASE + '/' + FILE;
const target = path.resolve(process.argv[2] || path.join(__dirname, '..', 'engine'));

async function main() {
  if (fs.existsSync(path.join(target, 'sd-server.exe'))) { console.log('Engine already in ' + target); return; }
  console.log('Downloading the image engine (' + RELEASE + ', about 30 MB)...');
  const res = await fetch(URL, { redirect: 'follow' });
  if (!res.ok) throw new Error('Download failed: ' + res.status + ' ' + URL);
  const zip = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'iconforge-engine-')), FILE);
  fs.writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
  fs.mkdirSync(target, { recursive: true });
  // Windows 10 and 11 ship their own tar.exe; use it by full path so a Git Bash tar earlier on PATH is not picked up.
  const tar = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
  execFileSync(tar, ['-xf', zip, '-C', target], { stdio: 'inherit' });
  fs.rmSync(path.dirname(zip), { recursive: true, force: true });
  if (!fs.existsSync(path.join(target, 'sd-server.exe'))) throw new Error('sd-server.exe not found after unpacking.');
  console.log('Engine ready in ' + target);
}

main().catch(e => { console.error(e.message); process.exit(1); });
