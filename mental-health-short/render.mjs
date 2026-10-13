// Renders the film headlessly with Playwright + ffmpeg.
//   node render.mjs                     full render → out/someone-stayed-1080x1920.mp4
//   node render.mjs --stills 2,8.5,13   PNG stills at given seconds → out/stills/
//   node render.mjs --workers 3         parallel browser workers (default 3)
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
const port = 8700 + Math.floor(Math.random() * 200)

const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]))
  if (!f.startsWith(root)) { res.writeHead(403); return res.end() }
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); return res.end() }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' })
    res.end(data)
  })
}).listen(port)

const chromePath = fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
  ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined
const browser = await chromium.launch({
  executablePath: chromePath,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})

async function openPage(query = '') {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } })
  page.on('pageerror', (e) => console.error('page error:', e.message))
  page.on('console', (m) => m.type() === 'warning' && console.warn('page:', m.text()))
  await page.goto(`http://localhost:${port}/index.html${query}`)
  await page.waitForFunction(() => window.filmReady === true, null, { timeout: 120000 })
  return page
}

async function renderTo(page, d, file) {
  const url = await page.evaluate((d) => window.renderDrawing(d), d)
  fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'))
}

fs.mkdirSync(outDir, { recursive: true })
const t0 = Date.now()

// 1) Background plates (3 palette states x 3 boil variants), painted once at 2x.
const platesDir = path.join(outDir, 'plates')
fs.mkdirSync(platesDir, { recursive: true })
const plateJobs = []
for (const k of ['A', 'B', 'C']) for (const b of [0, 1, 2]) {
  const f = path.join(platesDir, `${k}${b}.png`)
  if (!fs.existsSync(f)) plateJobs.push([k, b, f])
}
if (plateJobs.length) {
  const page = await openPage('?plate=1')
  for (const [k, b, f] of plateJobs) {
    const t = Date.now()
    const url = await page.evaluate(([k, b]) => window.renderPlate(k, b), [k, b])
    fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'))
    console.log(`plate ${k}${b} in ${((Date.now() - t) / 1000).toFixed(1)}s`)
  }
  await page.close()
}

if (stills) {
  const dir = path.join(outDir, 'stills')
  fs.mkdirSync(dir, { recursive: true })
  const page = await openPage()
  for (const s of stills.split(',').map(Number)) {
    const d = Math.min(359, Math.round(s * 12))
    const t = Date.now()
    await renderTo(page, d, path.join(dir, `t${s.toFixed(2).padStart(5, '0')}.png`))
    console.log(`still ${s}s (drawing ${d}) in ${((Date.now() - t) / 1000).toFixed(1)}s`)
  }
} else {
  fs.mkdirSync(framesDir, { recursive: true })
  const { N_DRAWINGS } = { N_DRAWINGS: 360 }
  const todo = []
  for (let d = 0; d < N_DRAWINGS; d++) {
    const f = path.join(framesDir, `d${String(d).padStart(4, '0')}.png`)
    if (!fs.existsSync(f)) todo.push([d, f])
  }
  console.log(`${todo.length} drawings to render with ${workers} workers`)
  let done = 0
  await Promise.all(Array.from({ length: workers }, async () => {
    const page = await openPage()
    while (todo.length) {
      const [d, f] = todo.shift()
      await renderTo(page, d, f + '.tmp')
      fs.renameSync(f + '.tmp', f)
      done++
      if (done % 10 === 0) {
        const el = (Date.now() - t0) / 1000
        console.log(`${done} done, ${el.toFixed(0)}s elapsed, ~${(el / done * todo.length / 60).toFixed(1)} min left`)
      }
    }
  }))
  // 12 drawings/s held on twos → 24 fps, H.264 High profile, 1080x1920
  const mp4 = path.join(outDir, 'someone-stayed-1080x1920.mp4')
  execFileSync('ffmpeg', ['-y', '-framerate', '12', '-i', path.join(framesDir, 'd%04d.png'),
    '-vf', 'fps=24,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
    '-profile:v', 'high', '-tune', 'animation', '-movflags', '+faststart', mp4], { stdio: 'inherit' })
  console.log('wrote', mp4)
}

console.log(`total ${((Date.now() - t0) / 1000).toFixed(0)}s`)
await browser.close()
server.close()
