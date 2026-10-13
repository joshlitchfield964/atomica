// Headless renderer: Playwright (Chromium, software WebGL) + ffmpeg.
//   node render.mjs                         full film → out/someone-stayed-1080x1920.mp4
//   node render.mjs --stills 2,8.5,13       PNG stills at given seconds → out/stills/
//   node render.mjs --workers 3             parallel browser pages (default 3)
//   node render.mjs --from 0 --to 120       render a frame range only (no encode)
//   node render.mjs --stills 3 --noplates   preview with the set painted live (skips plates)
import { chromium } from 'playwright'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def }
const root = path.dirname(new URL(import.meta.url).pathname)
const outDir = path.join(root, 'out')
const framesDir = path.join(outDir, 'frames')
const stills = opt('stills', null)
const workers = Number(opt('workers', 3))
const FPS = 24, NF = 720
const from = Number(opt('from', 0)), to = Number(opt('to', NF))
const noPlates = args.includes('--noplates')

const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]))
  if (!f.startsWith(root)) { res.writeHead(403); return res.end() }
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); return res.end() }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' })
    res.end(data)
  })
})
await new Promise((r) => server.listen(0, r))
const port = server.address().port

const chromePath = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const browser = await chromium.launch({
  executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})

async function openPage(query = '') {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } })
  page.on('pageerror', (e) => console.error('page error:', e.message))
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) || m.text().startsWith('physics')) console.log('page:', m.text()) })
  await page.goto(`http://localhost:${port}/index.html${query}`)
  await page.waitForFunction(() => window.filmReady === true, null, { timeout: 300000 })
  return page
}
const save = (file, url) => fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'))

fs.mkdirSync(outDir, { recursive: true })
const t0 = Date.now()

// 1) background plates: 3 palette states x 3 boil variants, painted once at 2x
const platesDir = path.join(outDir, 'plates')
fs.mkdirSync(platesDir, { recursive: true })
const plateJobs = []
for (const k of ['A', 'B', 'C']) for (const b of [0, 1, 2]) {
  const f = path.join(platesDir, `${k}${b}.png`)
  if (!fs.existsSync(f)) plateJobs.push([k, b, f])
}
if (plateJobs.length && !noPlates) {
  const page = await openPage('?plate=1')
  for (const [k, b, f] of plateJobs) {
    const t = Date.now()
    save(f, await page.evaluate(([k, b]) => window.renderPlate(k, b), [k, b]))
    console.log(`plate ${k}${b} in ${((Date.now() - t) / 1000).toFixed(1)}s`)
  }
  await page.close()
}

if (stills) {
  const dir = path.join(outDir, 'stills')
  fs.mkdirSync(dir, { recursive: true })
  const page = await openPage(noPlates ? '?noplates=1' : '')
  for (const s of stills.split(',').map(Number)) {
    const fi = Math.min(NF - 1, Math.round(s * FPS))
    const t = Date.now()
    save(path.join(dir, `t${s.toFixed(2).padStart(5, '0')}.png`), await page.evaluate((f) => window.renderFrame(f), fi))
    console.log(`still ${s}s (frame ${fi}) in ${((Date.now() - t) / 1000).toFixed(1)}s`)
  }
} else {
  fs.mkdirSync(framesDir, { recursive: true })
  const todo = []
  for (let fi = from; fi < to; fi++) {
    const f = path.join(framesDir, `f${String(fi).padStart(4, '0')}.png`)
    if (!fs.existsSync(f)) todo.push([fi, f])
  }
  const total = todo.length
  console.log(`${total} frames to render with ${workers} workers`)
  let done = 0
  await Promise.all(Array.from({ length: workers }, async () => {
    const page = await openPage()
    while (todo.length) {
      const [fi, f] = todo.shift()
      save(f + '.tmp', await page.evaluate((x) => window.renderFrame(x), fi))
      fs.renameSync(f + '.tmp', f)
      done++
      if (done % 12 === 0 || done === total) {
        const el = (Date.now() - t0) / 1000
        console.log(`${done}/${total} frames, ${el.toFixed(0)}s elapsed, ~${(el / done * (total - done) / 60).toFixed(1)} min left`)
      }
    }
  }))
  const have = fs.readdirSync(framesDir).filter((n) => /^f\d{4}\.png$/.test(n)).length
  if (have === NF) {
    const mp4 = path.join(outDir, 'someone-stayed-1080x1920.mp4')
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(framesDir, 'f%04d.png'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-profile:v', 'high', '-tune', 'animation',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], { stdio: 'inherit' })
    console.log('wrote', mp4)
  } else {
    console.log(`${have}/${NF} frames present; skipping encode`)
  }
}

console.log(`total ${((Date.now() - t0) / 1000).toFixed(0)}s`)
await browser.close()
server.close()
