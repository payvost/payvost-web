const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../public');
const OUT = path.resolve(SRC, 'optimized');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const files = [
  'CTO - Tyler Grant.png',
  'Dashboard.png',
  'Global CFO - Kendra Allen.png',
  'COO- Erica Johnson.png',
  'Payvost Building.png',
  'dashboard mockup.png',
  'Payment option 2.png',
  'Payvost mockup.png'
].map((f) => path.join(SRC, f)).filter((p) => fs.existsSync(p));

(async () => {
  for (const file of files) {
    try {
      const outPath = path.join(OUT, path.basename(file));
      console.log('Optimizing', file, '->', outPath);
      await sharp(file)
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toFile(outPath.replace(/\.png$/i, '.jpg'));
    } catch (err) {
      console.error('Failed to optimize', file, err);
    }
  }
  console.log('Done. Optimized files are in public/optimized/');
})();
