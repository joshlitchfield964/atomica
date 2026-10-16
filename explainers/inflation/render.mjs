/* Offline, frame-exact render: steps the animation deterministically and
   pipes PNG frames straight into ffmpeg (no 450 temp files on disk). */
import pw from '/opt/node-tools/node_modules/playwright/index.js';
import { spawn } from 'node:child_process';
const { chromium } = pw;

const src = process.argv[2];
const out = process.argv[3];
const fps = Number(process.argv[4] || 30);

const browser = await chromium.launch({ args: ['--force-device-scale-factor=1'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));
await page.goto('file://' + src + '?clean=1');
await page.waitForFunction('window.__ready === true', { timeout: 20000 });
const DUR = await page.evaluate(() => window.__duration);
const el = await page.$('#stage');
const total = Math.round(DUR * fps);

const ff = spawn('ffmpeg', [
  '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', 'pipe:0',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  '-r', String(fps), out,
], { stdio: ['pipe', 'ignore', 'pipe'] });
let err = '';
ff.stderr.on('data', (d) => { err += d.toString(); });
const done = new Promise((res, rej) =>
  ff.on('close', (c) => c === 0 ? res() : rej(new Error('ffmpeg ' + c + '\n' + err.slice(-2500)))));

const write = (buf) => new Promise((res) => ff.stdin.write(buf) ? res() : ff.stdin.once('drain', res));

for (let i = 0; i < total; i++) {
  await page.evaluate((t) => window.__renderFrame(t), i / fps);
  await write(await el.screenshot({ type: 'png' }));
  if (i % 60 === 0) process.stdout.write(`  ${i}/${total}\r`);
}
ff.stdin.end();
await done;
await browser.close();
console.log('\nrendered', out, `(${total} frames @ ${fps}fps)`);
