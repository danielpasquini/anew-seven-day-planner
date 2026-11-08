// Synthesized tactile UI sound effects for tap, completion, and drawer drag

export class SoundFxManager {
  private ctx: AudioContext
  private outputNode: GainNode
  private lastTapTime = 0
  private lastCompleteTime = 0
  private lastDragTime = 0

  constructor(ctx: AudioContext, destination: GainNode) {
    this.ctx = ctx
    this.outputNode = destination
  }

  /**
   * playTap:
   * Soft, deep, woody pop (~120Hz exponential decay in 40ms).
   * Contained frequency spectrum prevents ear fatigue during frequent interactions.
   */
  public playTap(): void {
    if (this.ctx.state !== "running") return

    const nowMs = Date.now()
    if (nowMs - this.lastTapTime < 45) return
    this.lastTapTime = nowMs

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const filter = this.ctx.createBiquadFilter()

      // 120Hz body pitch decaying rapidly down to 70Hz for a deep wooden tap
      osc.type = "sine"
      osc.frequency.setValueAtTime(124, now)
      osc.frequency.exponentialRampToValueAtTime(68, now + 0.042)

      // Warm lowpass filter to remove upper clickiness
      filter.type = "lowpass"
      filter.frequency.setValueAtTime(380, now)

      // Quick 40ms percussive envelope
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.linearRampToValueAtTime(0.28, now + 0.004)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.042)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.outputNode)

      osc.onended = () => {
        try {
          osc.disconnect()
          filter.disconnect()
          gain.disconnect()
        } catch {}
      }

      osc.start(now)
      osc.stop(now + 0.046)
    } catch {}
  }

  /**
   * playComplete:
   * Gentle dual-tone harmonic resonance (G4 392Hz -> C5 523.25Hz).
   * Rewarding sense of habit completion without high-frequency chime harshness.
   */
  public playComplete(): void {
    if (this.ctx.state !== "running") return

    const nowMs = Date.now()
    if (nowMs - this.lastCompleteTime < 180) return
    this.lastCompleteTime = nowMs

    try {
      const now = this.ctx.currentTime

      const tones = [
        { freq: 392.00, delay: 0.0, dur: 0.28, gain: 0.16 }, // G4
        { freq: 523.25, delay: 0.065, dur: 0.38, gain: 0.14 }, // C5
      ]

      for (const t of tones) {
        const start = now + t.delay
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        const filter = this.ctx.createBiquadFilter()

        osc.type = "sine"
        osc.frequency.setValueAtTime(t.freq, start)

        // Filter keeps it warm and mellow
        filter.type = "lowpass"
        filter.frequency.setValueAtTime(700, start)

        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.linearRampToValueAtTime(t.gain, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + t.dur)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.outputNode)

        osc.onended = () => {
          try {
            osc.disconnect()
            filter.disconnect()
            gain.disconnect()
          } catch {}
        }

        osc.start(start)
        osc.stop(start + t.dur + 0.02)
      }
    } catch {}
  }

  /**
   * playSheetDrag:
   * Ultra-short filtered noise burst (28ms) simulating tactile organic friction
   * when dragging drawers, sheets, or cards.
   */
  public playSheetDrag(): void {
    if (this.ctx.state !== "running") return

    const nowMs = Date.now()
    if (nowMs - this.lastDragTime < 120) return
    this.lastDragTime = nowMs

    try {
      const now = this.ctx.currentTime
      const sampleRate = this.ctx.sampleRate
      const duration = 0.03 // 30ms
      const bufferSize = Math.floor(sampleRate * duration)
      const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.18
      }

      const noise = this.ctx.createBufferSource()
      noise.buffer = buffer

      const bandpass = this.ctx.createBiquadFilter()
      bandpass.type = "bandpass"
      bandpass.frequency.setValueAtTime(450, now)
      bandpass.Q.setValueAtTime(1.2, now)

      const gain = this.ctx.createGain()
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.linearRampToValueAtTime(0.12, now + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

      noise.connect(bandpass)
      bandpass.connect(gain)
      gain.connect(this.outputNode)

      noise.onended = () => {
        try {
          noise.disconnect()
          bandpass.disconnect()
          gain.disconnect()
        } catch {}
      }

      noise.start(now)
      noise.stop(now + duration + 0.01)
    } catch {}
  }
}
