// Renders the mobile PNG assets from the SVGs written by pixel_icon.py.
// Every size is an integer multiple of the 32 px grid so pixels stay sharp.
const { chromium } = require('playwright')
const fs = require('fs')

const build = 'scripts/icon/build'
const assets = 'apps/mobile/assets'
const jobs = [
  // [output, svg, canvas width, canvas height, art size]
  // The adaptive icon art stays inside the circle Android launchers may crop it to.
  ['icon.png', 'icon.svg', 1024, 1024, 1024],
  ['adaptive-icon.png', 'art.svg', 1024, 1024, 512],
  ['splash.png', 'art.svg', 1284, 2778, 512],
  ['favicon.png', 'favicon.svg', 64, 64, 64],
]

;(async () => {
  const browser = await chromium.launch()
  for (const [output, svgFile, width, height, artSize] of jobs) {
    const svg = fs
      .readFileSync(`${build}/${svgFile}`, 'utf8')
      .replace(/width="\d+" height="\d+"/, `width="${artSize}" height="${artSize}"`)
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
    await page.setContent(
      `<body style="margin:0;width:${width}px;height:${height}px;display:flex;align-items:center;justify-content:center">${svg}</body>`,
    )
    await page.screenshot({ path: `${assets}/${output}`, omitBackground: true, clip: { x: 0, y: 0, width, height } })
    await page.close()
    console.log(`wrote ${assets}/${output}`)
  }
  await browser.close()
})()
