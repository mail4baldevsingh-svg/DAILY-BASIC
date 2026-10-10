// Render all frames in parallel browsers: node tools/render.mjs <framesDir> [workers] [from] [to]
import fs from 'node:fs';
import path from 'node:path';
import { serve, openPage, dataUrlToBuffer } from './browser.mjs';

const [outDir, nWorkers = '3', fromArg, toArg] = process.argv.slice(2);
const FPS = 24, DURATION = 46.4;
const total = Math.round(FPS * DURATION);
const from = fromArg ? Number(fromArg) : 0, to = toArg ? Number(toArg) : total - 1;
fs.mkdirSync(outDir, { recursive: true });
const frameFile = (i) => path.join(outDir, `f_${String(i).padStart(5, '0')}.jpg`);
const todo = [];
for (let i = from; i <= to; i++) if (!fs.existsSync(frameFile(i))) todo.push(i);
console.log(`${todo.length} frames to render with ${nWorkers} workers`);

const { srv, port } = await serve();
let next = 0, done = 0;
const t0 = Date.now();
async function worker(id) {
  const { browser, page } = await openPage(port, 'index.html');
  while (next < todo.length) {
    const i = todo[next++];
    const url = await page.evaluate((n) => window.renderFrame(n, 0.94), i);
    fs.writeFileSync(frameFile(i), dataUrlToBuffer(url));
    done++;
    if (done % 24 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${done}/${todo.length} frames, ${(el / done).toFixed(2)}s/frame, eta ${Math.round((todo.length - done) * el / done / 60)} min`);
    }
  }
  await browser.close();
}
await Promise.all(Array.from({ length: Number(nWorkers) }, (_, k) => worker(k)));
srv.close();
console.log(`done in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
