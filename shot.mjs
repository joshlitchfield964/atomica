import { chromium } from 'playwright'

const base = 'http://localhost:5173'
const browser = await chromium.launch({ args: ['--use-gl=angle'] })
const errors = []

async function shoot(name, { width, height }, actions) {
  const page = await browser.newPage({ viewport: { width, height } })
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${name}] ${m.text()}`))
  page.on('pageerror', (e) => errors.push(`[${name}] ${e.message}`))
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2600)
  if (actions) await actions(page)
  await page.screenshot({ path: `screens/${name}.png`, fullPage: false })
  await page.close()
}

const enter = async (p) => {
  await p.click('button:has-text("Enter the lab")')
  await p.waitForTimeout(1600)
}

await shoot('00-hero', { width: 1440, height: 900 })
await shoot('01-explore-desktop', { width: 1440, height: 900 }, enter)
await shoot('02-detail-bohr', { width: 1440, height: 900 }, async (p) => {
  await enter(p)
  await p.click('[data-number="26"]') // Iron
  await p.waitForTimeout(3200)
})
await shoot('02b-detail-cloud', { width: 1440, height: 900 }, async (p) => {
  await enter(p)
  await p.click('[data-number="16"]') // Sulfur → 3p cloud
  await p.waitForTimeout(2600)
  await p.click('button:has-text("Quantum cloud")')
  await p.waitForTimeout(1800)
})
await shoot('03-trends', { width: 1440, height: 900 }, async (p) => {
  await enter(p)
  await p.click('button:has-text("Trends")')
  await p.waitForTimeout(900)
})
await shoot('04-temperature', { width: 1440, height: 900 }, async (p) => {
  await enter(p)
  await p.click('button:has-text("Temperature")')
  await p.waitForTimeout(500)
  await p.fill('input[type="range"]', '2500')
  await p.waitForTimeout(700)
})
await shoot('05-quiz', { width: 1440, height: 900 }, async (p) => {
  await enter(p)
  await p.click('nav >> button:has-text("Quiz")')
  await p.waitForTimeout(900)
})
await shoot('06-compare', { width: 1440, height: 900 }, async (p) => {
  await enter(p)
  await p.click('button:has-text("Compare")')
  await p.click('[data-number="11"]')
  await p.click('[data-number="19"]')
  await p.waitForTimeout(900)
})
await shoot('07-mobile-hero', { width: 375, height: 812 })
await shoot('08-mobile-detail', { width: 375, height: 812 }, async (p) => {
  await enter(p)
  await p.click('[data-number="8"]')
  await p.waitForTimeout(3000)
})

await browser.close()
console.log(errors.length ? 'CONSOLE ERRORS:\n' + errors.join('\n') : 'No console errors.')
