// Render a few timestamps to stills + a contact sheet:
//   node tools/preview.mjs <outdir> <t1> <t2> ...
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { serve, openPage, dataUrlToBuffer } from './browser.mjs';

const [outDir, ...times] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const { srv, port } = await serve();
const { browser, page } = await openPage(port, 'index.html');
const files = [];
for (const ts of times) {
  const t0 = Date.now();
  const url = await page.evaluate((t) => window.renderTime(t, 0.9), Number(ts));
  const f = path.join(outDir, `t_${Number(ts).toFixed(2).padStart(6, '0')}.jpg`);
  fs.writeFileSync(f, dataUrlToBuffer(url));
  files.push(f);
  console.log(`t=${ts} ${Date.now() - t0}ms`);
}
await browser.close();
srv.close();
if (files.length > 1) {
  const cols = Math.min(files.length, 4);
  const args = ['-v', 'error', '-y'];
  for (const f of files) args.push('-i', f);
  const scaled = files.map((_, i) => `[${i}]scale=360:640,drawtext=text='${times[i]}':x=8:y=8:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.5[s${i}]`).join(';');
  const pad = (cols - (files.length % cols)) % cols;
  let filter = scaled;
  const inputsList = files.map((_, i) => `[s${i}]`);
  for (let i = 0; i < pad; i++) { filter += `;color=black:s=360x640:d=1[p${i}]`; inputsList.push(`[p${i}]`); }
  const rows = Math.ceil(inputsList.length / cols);
  filter += `;${inputsList.join('')}xstack=inputs=${inputsList.length}:layout=${Array.from({ length: inputsList.length }, (_, i) => `${(i % cols) * 360}_${Math.floor(i / cols) * 640}`).join('|')}`;
  execFileSync('ffmpeg', [...args, '-filter_complex', filter, '-frames:v', '1', path.join(outDir, 'sheet.jpg')]);
  console.log('sheet', path.join(outDir, 'sheet.jpg'), rows, 'rows');
}
