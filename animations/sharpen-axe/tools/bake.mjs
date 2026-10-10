// Paint the watercolour plates once: node tools/bake.mjs [name ...]
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, openPage, dataUrlToBuffer } from './browser.mjs';

const outDir = path.join(ROOT, 'assets', 'plates');
fs.mkdirSync(outDir, { recursive: true });
const { srv, port } = await serve();
const { browser, page } = await openPage(port, 'bake.html');
const names = process.argv.length > 2 ? process.argv.slice(2) : await page.evaluate(() => window.PLATE_NAMES);
for (const name of names) {
  const t0 = Date.now();
  const url = await page.evaluate((n) => window.bakePlate(n, 7), name);
  fs.writeFileSync(path.join(outDir, `${name}.png`), dataUrlToBuffer(url));
  console.log(`baked ${name} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
await browser.close();
srv.close();
