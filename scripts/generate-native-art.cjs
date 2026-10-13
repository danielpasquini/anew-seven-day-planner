// Rasterise our own vector mark; no downloaded or generated third-party art.
const fs = require("node:fs/promises")
const path = require("node:path")
const sharp = require("sharp")
const root = path.resolve(__dirname, "..")

async function main() {
  const icon = await fs.readFile(path.join(root, "public/anew-icon.svg"))
  await sharp(icon).resize(512, 512).png().toFile(path.join(root, "app/icon.png"))
  await sharp(icon).resize(180, 180).png().toFile(path.join(root, "app/apple-icon.png"))
  const assets = path.join(root, "native/assets")
  await fs.mkdir(assets, { recursive: true })
  await sharp(icon).resize(1024, 1024).flatten({ background: "#f7f6f0" }).removeAlpha().png().toFile(path.join(assets, "icon.png"))
  await sharp(icon).resize(432, 432).extend({ top: 72, bottom: 72, left: 72, right: 72, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(assets, "adaptive-icon.png"))
  await sharp(icon).resize(64, 64).png().toFile(path.join(assets, "favicon.png"))
  console.log("Anew artwork rendered for the web and Expo; native launch screens use app.json.")
}
main().catch((error) => { console.error(error.message); process.exitCode = 1 })
