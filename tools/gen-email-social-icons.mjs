import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { execFileSync } from 'node:child_process';

// Use lucide-static icons (MIT). Brand-perfect icons are inconsistent across libraries,
// but these render reliably in email clients once converted to PNG.
const ICONS = [
  // We keep the filename `x.png` but use the twitter glyph for now.
  { name: 'x', slug: 'twitter' },
  { name: 'instagram', slug: 'instagram' },
  { name: 'facebook', slug: 'facebook' },
  { name: 'linkedin', slug: 'linkedin' },
  { name: 'youtube', slug: 'youtube' },
  { name: 'github', slug: 'github' },
];

const OUT_DIR = path.join('public', 'email', 'social');
fs.mkdirSync(OUT_DIR, { recursive: true });

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'user-agent': 'payvost-email-icons',
            accept: 'image/svg+xml,text/plain,*/*',
          },
        },
        (res) => {
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve({ status: res.statusCode || 0, body: data, location: res.headers.location }));
        }
      )
      .on('error', reject);
  });
}

function forceWhite(svg) {
  let s = svg;
  s = s.replaceAll('stroke="currentColor"', 'stroke="#ffffff"');
  s = s.replaceAll('fill="currentColor"', 'fill="#ffffff"');
  return s;
}

for (const icon of ICONS) {
  let url = `https://unpkg.com/lucide-static@latest/icons/${icon.slug}.svg`;
  let res = await fetchText(url);
  if (res.status === 302 && res.location) {
    url = `https://unpkg.com${res.location}`;
    res = await fetchText(url);
  }
  if (res.status !== 200) {
    throw new Error(`Failed to download ${icon.name}: ${res.status}`);
  }

  const svgPath = path.join(OUT_DIR, `${icon.name}.svg`);
  const pngPath = path.join(OUT_DIR, `${icon.name}.png`);
  fs.writeFileSync(svgPath, forceWhite(res.body), 'utf8');

  // Convert to PNG with resvg-js-cli (downloaded on demand via npx).
  const args = ['--yes', '@resvg/resvg-js-cli', '--fit-width', '18', '--fit-height', '18', svgPath, pngPath];
  if (process.platform === 'win32') {
    execFileSync('cmd.exe', ['/c', 'npx', ...args], { stdio: 'inherit' });
  } else {
    execFileSync('npx', args, { stdio: 'inherit' });
  }

  fs.unlinkSync(svgPath);
}

console.log(`Generated ${ICONS.length} icons in ${OUT_DIR}`);
