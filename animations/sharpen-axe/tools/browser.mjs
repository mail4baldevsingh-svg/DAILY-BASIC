// Static file server + headless Chromium with software WebGL (SwiftShader).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };

export function serve(root = ROOT) {
  const srv = http.createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port })));
}

export async function openPage(port, page = 'index.html', { query = '' } = {}) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling'],
  });
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', (e) => console.error('[pageerror]', e.message));
  p.on('console', (m) => { if (m.type() === 'error' || m.text().startsWith('[log]')) console.error('[console]', m.text()); });
  await p.goto(`http://127.0.0.1:${port}/${page}${query}`);
  await p.waitForFunction(() => window.READY === true, null, { timeout: 180000 });
  return { browser, page: p };
}

export const dataUrlToBuffer = (u) => Buffer.from(u.slice(u.indexOf(',') + 1), 'base64');
