const fs = require("node:fs")
const path = require("node:path")
// Original, quiet PCM tones. Smooth attacks/releases avoid sharp UI transients.
const directory = path.resolve(__dirname, "../native/assets")
fs.mkdirSync(directory, { recursive: true })
function write(name, duration, frequencies) {
  const rate = 22050, count = Math.round(duration * rate)
  const data = Buffer.alloc(44 + count * 2)
  data.write("RIFF", 0); data.writeUInt32LE(36 + count * 2, 4); data.write("WAVEfmt ", 8)
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22)
  data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34)
  data.write("data", 36); data.writeUInt32LE(count * 2, 40)
  for (let i = 0; i < count; i++) {
    const t = i / rate, envelope = Math.sin(Math.PI * Math.min(1, t / Math.min(duration / 2, 1.5)) / 2) ** 2 * Math.sin(Math.PI * Math.min(1, (duration - t) / Math.min(duration / 2, 2)) / 2) ** 2
    const wave = frequencies.reduce((n, f, j) => n + Math.sin(2 * Math.PI * f * t + j * .4), 0) / frequencies.length
    data.writeInt16LE(Math.round(wave * envelope * .09 * 32767), 44 + i * 2)
  }
  fs.writeFileSync(path.join(directory, name), data)
}
write("zen.wav", 10, [174.61, 261.63, 349.23])
write("tap.wav", .65, [349.23, 523.25])
console.log("Generated original gentle native sounds")
