// Generative Ambient Music Engine for Anew
// Inspired by Brian Eno (Music for Airports), Tero Parviainen asynchronous loops, and HMLA.
// Soft sine/triangle synthesis with long attack/release envelopes and lowpass filtering.

interface ActiveVoice {
  oscillator: OscillatorNode
  gain: GainNode
  filter: BiquadFilterNode
}

export class GenerativeAmbientEngine {
  private ctx: AudioContext
  private outputNode: GainNode
  private isRunning = false
  private loopTimer: NodeJS.Timeout | null = null
  private activeVoices = new Set<ActiveVoice>()

  // Pentatonic/modal scale frequencies in low & warm octaves (F-Major / D-Minor calm)
  private readonly notes = [
    174.61, // F3 (warm anchor)
    220.00, // A3
    261.63, // C4
    293.66, // D4
    329.63, // E4
    349.23, // F4
    440.00, // A4
  ]

  constructor(ctx: AudioContext, destination: GainNode) {
    this.ctx = ctx
    this.outputNode = destination
  }

  /**
   * Synthesizes a soft sine/triangle tone with slow attack and release.
   */
  private playWarmTone(
    frequency: number,
    delaySeconds: number,
    attackSeconds: number,
    sustainSeconds: number,
    releaseSeconds: number,
    peakVolume: number
  ): ActiveVoice | null {
    if (this.ctx.state !== "running") return null

    try {
      const now = this.ctx.currentTime + delaySeconds
      const totalDuration = attackSeconds + sustainSeconds + releaseSeconds

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const filter = this.ctx.createBiquadFilter()

      // Waveform: sine with subtle warmth
      osc.type = "sine"
      osc.frequency.setValueAtTime(frequency, now)

      // Warm lowpass filter to eliminate any harsh high harmonics
      filter.type = "lowpass"
      filter.frequency.setValueAtTime(650, now)
      filter.Q.setValueAtTime(0.7, now)

      // Slow organic envelope
      gain.gain.setValueAtTime(0.00001, now)
      gain.gain.exponentialRampToValueAtTime(peakVolume, now + attackSeconds)
      gain.gain.setValueAtTime(peakVolume, now + attackSeconds + sustainSeconds)
      gain.gain.exponentialRampToValueAtTime(0.00001, now + totalDuration)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.outputNode)

      const voice: ActiveVoice = { oscillator: osc, gain, filter }
      this.activeVoices.add(voice)

      osc.onended = () => {
        try {
          osc.disconnect()
          filter.disconnect()
          gain.disconnect()
        } catch {}
        this.activeVoices.delete(voice)
      }

      osc.start(now)
      osc.stop(now + totalDuration + 0.1)

      return voice
    } catch {
      return null
    }
  }

  /**
   * Plays the calm opening chord sequence.
   * Synchronized with the sprouting branch animation on launch:
   * - First time: lush 7.5s expanding chord progression.
   * - Returning visit: warm, concise 2.2s two-tone greeting.
   */
  public playOpening(isFirstTime: boolean): void {
    if (this.ctx.state !== "running") return

    if (isFirstTime) {
      // Expanding serene 3-layer chord over ~7.5 seconds
      this.playWarmTone(174.61, 0.0, 2.0, 3.0, 2.5, 0.035) // F3 root
      this.playWarmTone(261.63, 0.4, 1.8, 3.2, 2.2, 0.028) // C4 fifth
      this.playWarmTone(349.23, 1.2, 1.6, 2.8, 2.0, 0.022) // F4 octave
      this.playWarmTone(440.00, 2.6, 1.2, 2.0, 2.0, 0.018) // A4 third
      this.playWarmTone(523.25, 4.2, 1.0, 1.8, 1.8, 0.014) // C5
    } else {
      // Returning user: warm 2-second welcoming resonance
      this.playWarmTone(261.63, 0.0, 0.4, 0.8, 1.0, 0.03)
      this.playWarmTone(349.23, 0.25, 0.4, 0.7, 1.0, 0.022)
    }
  }

  /**
   * Starts the continuous Brian Eno-style asynchronous generative ambient texture.
   */
  public start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.scheduleNextNote()
  }

  private scheduleNextNote(): void {
    if (!this.isRunning) return

    // Pick 1 or 2 harmonious notes
    const note1 = this.notes[Math.floor(Math.random() * this.notes.length)]
    const attack = 2.0 + Math.random() * 2.0
    const sustain = 1.5 + Math.random() * 2.5
    const release = 3.0 + Math.random() * 3.0
    const volume = 0.015 + Math.random() * 0.015

    this.playWarmTone(note1, 0, attack, sustain, release, volume)

    // Occasionally play a gentle second note for subtle harmonic dyad
    if (Math.random() > 0.55) {
      const remainingNotes = this.notes.filter((n) => n !== note1)
      const note2 = remainingNotes[Math.floor(Math.random() * remainingNotes.length)]
      this.playWarmTone(note2, 0.8 + Math.random() * 1.2, attack, sustain, release, volume * 0.75)
    }

    // Schedule next iteration with asynchronous organic jitter (3.5 to 7.0 seconds)
    const nextInterval = 3500 + Math.random() * 3500
    this.loopTimer = setTimeout(() => {
      this.scheduleNextNote()
    }, nextInterval)
  }

  public stop(fadeSeconds = 1.5): void {
    this.isRunning = false
    if (this.loopTimer) {
      clearTimeout(this.loopTimer)
      this.loopTimer = null
    }

    const now = this.ctx.currentTime
    for (const voice of this.activeVoices) {
      try {
        const curGain = Math.max(0.00001, voice.gain.gain.value)
        voice.gain.gain.cancelScheduledValues(now)
        voice.gain.gain.setValueAtTime(curGain, now)
        voice.gain.gain.exponentialRampToValueAtTime(0.00001, now + fadeSeconds)
        voice.oscillator.stop(now + fadeSeconds + 0.05)
      } catch {}
    }
  }

  public get active(): boolean {
    return this.isRunning
  }
}
