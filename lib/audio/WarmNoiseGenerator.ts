// Lowpass filtered brownian noise generator for ambient sound masking

export class WarmNoiseGenerator {
  private ctx: AudioContext
  private outputNode: GainNode
  private sourceNode: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private filterNode: BiquadFilterNode | null = null
  private isPlaying = false
  private noiseBuffer: AudioBuffer | null = null

  constructor(ctx: AudioContext, destination: GainNode) {
    this.ctx = ctx
    this.outputNode = destination
  }

  /**
   * Generates a 5-second seamlessly loopable stereo Brown Noise buffer
   * using a leaky integrator on white noise.
   */
  private getOrCreateBuffer(): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer

    const sampleRate = this.ctx.sampleRate
    const bufferLength = sampleRate * 5 // 5 seconds
    const buffer = this.ctx.createBuffer(2, bufferLength, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      let lastOut = 0.0

      for (let i = 0; i < bufferLength; i++) {
        const white = Math.random() * 2 - 1
        // Leaky integrator to create brownian/red noise without DC drift
        lastOut = (lastOut + 0.02 * white) / 1.02
        data[i] = lastOut * 3.5 // Scale to comfortable level
      }

      // Smooth circular fade at boundary for infinite seamless loop
      const fadeSamples = Math.floor(sampleRate * 0.05)
      for (let i = 0; i < fadeSamples; i++) {
        const factor = i / fadeSamples
        data[i] = data[i] * factor + data[bufferLength - 1 - i] * (1 - factor)
      }
    }

    this.noiseBuffer = buffer
    return buffer
  }

  public start(fadeSeconds = 2.0): void {
    if (this.isPlaying) return
    if (this.ctx.state !== "running") return

    try {
      const buffer = this.getOrCreateBuffer()
      const now = this.ctx.currentTime

      this.sourceNode = this.ctx.createBufferSource()
      this.sourceNode.buffer = buffer
      this.sourceNode.loop = true

      // Filter: warm lowpass at 320 Hz
      this.filterNode = this.ctx.createBiquadFilter()
      this.filterNode.type = "lowpass"
      this.filterNode.frequency.setValueAtTime(320, now)
      this.filterNode.Q.setValueAtTime(0.707, now)

      // Dedicated envelope gain
      this.gainNode = this.ctx.createGain()
      this.gainNode.gain.setValueAtTime(0.0001, now)
      this.gainNode.gain.exponentialRampToValueAtTime(1.0, now + Math.max(0.1, fadeSeconds))

      // Connect: source -> filter -> gain -> ambient output
      this.sourceNode.connect(this.filterNode)
      this.filterNode.connect(this.gainNode)
      this.gainNode.connect(this.outputNode)

      this.sourceNode.start(now)
      this.isPlaying = true
    } catch (err) {
      console.warn("[WarmNoiseGenerator] Audio start failed:", err)
    }
  }

  public stop(fadeSeconds = 1.5): void {
    if (!this.isPlaying || !this.gainNode || !this.sourceNode) {
      this.isPlaying = false
      return
    }

    try {
      const now = this.ctx.currentTime
      const currentGain = Math.max(0.0001, this.gainNode.gain.value)
      this.gainNode.gain.cancelScheduledValues(now)
      this.gainNode.gain.setValueAtTime(currentGain, now)
      this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + fadeSeconds)

      const src = this.sourceNode
      const gain = this.gainNode
      const filter = this.filterNode

      setTimeout(() => {
        try {
          src.stop()
          src.disconnect()
          filter?.disconnect()
          gain.disconnect()
        } catch {}
      }, (fadeSeconds + 0.1) * 1000)

      this.sourceNode = null
      this.gainNode = null
      this.filterNode = null
      this.isPlaying = false
    } catch {
      this.isPlaying = false
    }
  }

  public get active(): boolean {
    return this.isPlaying
  }
}
