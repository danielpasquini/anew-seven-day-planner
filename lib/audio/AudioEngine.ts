// AudioEngine Singleton for Anew
// Manages master audio bus, sub-busses, mobile touch unlocking, visibility lifecycle,
// and procedural sound engines.

import { soundStore, type SoundState } from "./soundStore"
import { WarmNoiseGenerator } from "./WarmNoiseGenerator"
import { GenerativeAmbientEngine } from "./GenerativeAmbientEngine"
import { SoundFxManager } from "./SoundFxManager"

class AudioEngineSingleton {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private musicGain: GainNode | null = null
  private ambientGain: GainNode | null = null
  private sfxGain: GainNode | null = null

  public warmNoise: WarmNoiseGenerator | null = null
  public ambientMusic: GenerativeAmbientEngine | null = null
  public sfx: SoundFxManager | null = null

  private isUnlocked = false
  private isMinimized = false
  private hasStartedEngines = false
  private unsubscribeStore: (() => void) | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.attachMobileUnlockListeners()
      this.attachVisibilityListeners()
    }
  }

  /**
   * Initializes AudioContext and audio routing tree.
   */
  public ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx
    if (typeof window === "undefined") return null

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtxClass) return null

      this.ctx = new AudioCtxClass()

      // Master Bus -> destination
      this.masterGain = this.ctx.createGain()
      this.masterGain.connect(this.ctx.destination)

      // Sub-busses -> masterGain
      this.musicGain = this.ctx.createGain()
      this.musicGain.connect(this.masterGain)

      this.ambientGain = this.ctx.createGain()
      this.ambientGain.connect(this.masterGain)

      this.sfxGain = this.ctx.createGain()
      this.sfxGain.connect(this.masterGain)

      // Initialize sub-engines
      this.warmNoise = new WarmNoiseGenerator(this.ctx, this.ambientGain)
      this.ambientMusic = new GenerativeAmbientEngine(this.ctx, this.musicGain)
      this.sfx = new SoundFxManager(this.ctx, this.sfxGain)

      // Initial gain values from soundStore
      this.applyGainsFromState(soundStore.getState(), false)

      // Subscribe to reactive store changes
      this.unsubscribeStore = soundStore.subscribe((state) => {
        this.applyGainsFromState(state, true)
      })

      return this.ctx
    } catch (err) {
      console.warn("[AudioEngine] AudioContext initialization deferred:", err)
      return null
    }
  }

  /**
   * Mobile touch unlock listener (iOS/Safari/Webview/Capacitor autoplay policy)
   */
  private attachMobileUnlockListeners() {
    const unlockHandler = () => {
      this.unlock()
      window.removeEventListener("touchstart", unlockHandler)
      window.removeEventListener("pointerdown", unlockHandler)
      window.removeEventListener("click", unlockHandler)
    }

    window.addEventListener("touchstart", unlockHandler, { passive: true, once: true })
    window.addEventListener("pointerdown", unlockHandler, { passive: true, once: true })
    window.addEventListener("click", unlockHandler, { passive: true, once: true })
  }

  /**
   * Visibility listener for automatic background pause / foreground resume
   */
  private attachVisibilityListeners() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.fadeForBackground(true)
      } else {
        this.fadeForBackground(false)
      }
    })
  }

  public async unlock(): Promise<boolean> {
    const ctx = this.ensureContext()
    if (!ctx) return false

    if (ctx.state === "suspended") {
      try {
        await ctx.resume()
      } catch {}
    }

    if (ctx.state === "running") {
      this.isUnlocked = true

      // Start continuous ambient engines if not muted
      const state = soundStore.getState()
      if (!this.hasStartedEngines && !state.isMuted) {
        this.startBackgroundEngines(state)
      }
      return true
    }
    return false
  }

  private applyGainsFromState(state: SoundState, ramp = true) {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.ambientGain || !this.sfxGain) {
      return
    }

    const now = this.ctx.currentTime
    const rampTime = ramp ? 0.08 : 0.001

    // Master
    const targetMaster = (state.isMuted || this.isMinimized) ? 0.0001 : Math.max(0.0001, state.masterVolume)
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now)
    this.masterGain.gain.linearRampToValueAtTime(targetMaster, now + rampTime)

    // Music
    const targetMusic = Math.max(0.0001, state.musicVolume)
    this.musicGain.gain.cancelScheduledValues(now)
    this.musicGain.gain.setValueAtTime(Math.max(0.0001, this.musicGain.gain.value), now)
    this.musicGain.gain.linearRampToValueAtTime(targetMusic, now + rampTime)

    // Ambient (Warm Noise)
    const targetAmbient = Math.max(0.0001, state.ambientVolume)
    this.ambientGain.gain.cancelScheduledValues(now)
    this.ambientGain.gain.setValueAtTime(Math.max(0.0001, this.ambientGain.gain.value), now)
    this.ambientGain.gain.linearRampToValueAtTime(targetAmbient, now + rampTime)

    // SFX
    const targetSfx = Math.max(0.0001, state.sfxVolume)
    this.sfxGain.gain.cancelScheduledValues(now)
    this.sfxGain.gain.setValueAtTime(Math.max(0.0001, this.sfxGain.gain.value), now)
    this.sfxGain.gain.linearRampToValueAtTime(targetSfx, now + rampTime)

    // Manage continuous engine activation based on state
    if (this.ctx.state === "running" && !state.isMuted && !this.isMinimized) {
      // Warm brown noise starts when ambientVolume > 0
      if (state.ambientVolume > 0.01) {
        if (!this.warmNoise?.active) this.warmNoise?.start(2.0)
      } else {
        if (this.warmNoise?.active) this.warmNoise?.stop(1.5)
      }

      // Generative music runs when musicVolume > 0
      if (state.musicVolume > 0.01) {
        if (!this.ambientMusic?.active) this.ambientMusic?.start()
      } else {
        if (this.ambientMusic?.active) this.ambientMusic?.stop(1.5)
      }
    } else {
      if (this.warmNoise?.active) this.warmNoise?.stop(0.5)
      if (this.ambientMusic?.active) this.ambientMusic?.stop(0.5)
    }
  }

  private startBackgroundEngines(state: SoundState) {
    this.hasStartedEngines = true
    if (state.musicVolume > 0.01) {
      this.ambientMusic?.start()
    }
    if (state.ambientVolume > 0.01) {
      this.warmNoise?.start(2.0)
    }
  }

  private fadeForBackground(minimized: boolean) {
    this.isMinimized = minimized
    if (!this.ctx || !this.masterGain) return

    const now = this.ctx.currentTime
    const fadeDuration = minimized ? 0.6 : 0.8
    const state = soundStore.getState()
    const targetMaster = (minimized || state.isMuted) ? 0.0001 : Math.max(0.0001, state.masterVolume)

    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setValueAtTime(Math.max(0.0001, this.masterGain.gain.value), now)
    this.masterGain.gain.exponentialRampToValueAtTime(targetMaster, now + fadeDuration)

    if (minimized) {
      setTimeout(() => {
        if (this.isMinimized) {
          void this.ctx?.suspend().catch(() => {})
        }
      }, fadeDuration * 1000)
    } else {
      if (this.ctx.state === "suspended") {
        void this.ctx.resume().catch(() => {})
      }
    }
  }

  /**
   * Triggers the opening musical sequence (synchronized with the launch animation).
   */
  public playOpening(isFirstTime: boolean) {
    this.ensureContext()
    void this.unlock().then(() => {
      const state = soundStore.getState()
      if (!state.isMuted) {
        this.ambientMusic?.playOpening(isFirstTime)
      }
    })
  }

  public getContext(): AudioContext | null {
    return this.ensureContext()
  }

  public get active(): boolean {
    return this.isUnlocked && this.ctx?.state === "running" && !soundStore.getState().isMuted
  }
}

export const AudioEngine = new AudioEngineSingleton()
