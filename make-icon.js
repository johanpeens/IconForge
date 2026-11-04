// Cuts the rounded square out of build/iconforge-source.png and writes build/icon.png (512x512, transparent corners)
// for the window, the installer and the splash screen.
const sharp = require('sharp');
const fs = require('fs');
(async () => {
  const src = 'build/iconforge-source.png';
  const m = await sharp(src).metadata();
  const pad = Math.round(m.width * 0.135);          // the tile sits inside a light margin with a soft shadow
  const side = m.width - pad * 2;
  const N = 512;
  const mask = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="' + N + '" height="' + N + '"><rect width="' + N + '" height="' + N + '" rx="' + Math.round(N * 0.18) + '"/></svg>');
  const square = await sharp(src).extract({ left: pad, top: pad, width: side, height: side }).resize(N, N).png().toBuffer();
  const tile = await sharp(square).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  fs.writeFileSync('build/icon.png', tile);
  fs.copyFileSync('build/icon.png', 'public/splash-icon.png');
  console.log('icon ok', m.width, m.height, 'tile', side);
})();
