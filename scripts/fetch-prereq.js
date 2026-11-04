// Downloads Microsoft's Visual C++ runtime installer into build/prereq so the Icon Forge installer can carry it.
// The image engine needs this runtime; the installer runs it only when the PC does not have it yet.
// Run once with `npm run prereq` (it also runs before `npm run dist`). Skipped when the file is already there.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const URL = 'https://aka.ms/vs/17/release/vc_redist.x64.exe';
const target = path.join(__dirname, '..', 'build', 'prereq', 'vc_redist.x64.exe');

async function main() {
  if (process.platform !== 'win32') { console.log('Prerequisite step is only needed on Windows.'); return; }
  if (fs.existsSync(target)) { console.log('Visual C++ runtime installer already in ' + target); return; }
  console.log('Downloading the Microsoft Visual C++ runtime installer (about 25 MB)...');
  const res = await fetch(URL, { redirect: 'follow' });
  if (!res.ok) throw new Error('Download failed: ' + res.status + ' ' + URL);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const part = target + '.part';
  fs.writeFileSync(part, Buffer.from(await res.arrayBuffer()));
  // Only keep it if Windows says it is really signed by Microsoft.
  const out = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    "$s = Get-AuthenticodeSignature -LiteralPath '" + part.replace(/'/g, "''") + "'; Write-Output $s.Status; Write-Output $s.SignerCertificate.Subject"],
    { encoding: 'utf8' }).trim().split(/\r?\n/);
  if (out[0] !== 'Valid' || !/O=Microsoft Corporation/.test(out[1] || '')) {
    fs.rmSync(part, { force: true });
    throw new Error('The downloaded file is not signed by Microsoft (' + out.join(' / ') + '). Not using it.');
  }
  fs.renameSync(part, target);
  console.log('Visual C++ runtime installer ready (signed by Microsoft): ' + target);
}

main().catch(e => { console.error(e.message); process.exit(1); });
