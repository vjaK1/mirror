// Generates the PWA icon set from public/mirror-mark.svg (BLUEPRINT §3).
// Run via: npm run icons
import { mkdir } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const root = path.resolve(import.meta.dirname, "..")
const svgPath = path.join(root, "public", "mirror-mark.svg")
const outDir = path.join(root, "public", "icons")
const SVG_SIZE = 88
const BACKGROUND = "#1C1C1A" // the mark's own tile color

await mkdir(outDir, { recursive: true })

async function renderMark(size) {
  return sharp(svgPath, { density: (72 * size) / SVG_SIZE })
    .resize(size, size)
    .png()
    .toBuffer()
}

// Standard icons: the mark as-is (rounded tile, transparent corners).
for (const size of [192, 512]) {
  await sharp(await renderMark(size)).toFile(path.join(outDir, `icon-${size}.png`))
}

// Maskable / iOS icons must be full-bleed: solid background with the mark
// scaled into the safe zone (the OS applies its own corner mask).
async function fullBleed(size, contentRatio, filename) {
  const content = Math.round(size * contentRatio)
  await sharp({
    create: { width: size, height: size, channels: 4, background: BACKGROUND },
  })
    .composite([{ input: await renderMark(content), gravity: "center" }])
    .png()
    .toFile(path.join(outDir, filename))
}

await fullBleed(512, 0.8, "icon-maskable-512.png")
await fullBleed(180, 0.85, "apple-touch-icon.png")

console.log("Icons written to public/icons/")
