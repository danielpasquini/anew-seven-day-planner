// Original, quiet synthesized tones. No media downloads, microphone or analytics.
const SOUND_KEY = "anew-gentle-sound"
let enabled = false
let initialized = false
let soundStorage: Pick<Storage, "getItem" | "setItem"> | null = null
let context: AudioContext | null = null
let opening = false
let openingPlaying = false
let lastFeedback = 0
const listeners = new Set<() => void>()
const openingVoices = new Set<{ oscillator: OscillatorNode; gain: GainNode }>()

export const soundSnapshot = () => enabled
export const subscribeSounds = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export function initializeSounds(storage?: Pick<Storage, "getItem" | "setItem"> | null, reset = false) {
  if ((initialized && !reset) || typeof window === "undefined") return
  initialized = true
  enabled = false
  try { soundStorage = storage || localStorage; enabled = soundStorage.getItem(SOUND_KEY) === "on" } catch { soundStorage = null }
  listeners.forEach((listener) => listener())
}

function tone(frequency: number, delay: number, duration: number, volume: number, isOpening = false) {
  if (!context || context.state !== "running") return
  const audio = context
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  const start = audio.currentTime + delay
  oscillator.type = "sine"
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0.00001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(.45, duration / 4))
  gain.gain.exponentialRampToValueAtTime(0.00001, start + duration)
  oscillator.connect(gain)
  gain.connect(audio.destination)
  const voice = { oscillator, gain }
  if (isOpening) openingVoices.add(voice)
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); openingVoices.delete(voice) }
  oscillator.start(start)
  oscillator.stop(start + duration + .05)
}

function playOpening() {
  if (!enabled || !opening || openingPlaying || context?.state !== "running") return
  openingPlaying = true
  // Soft overlapping chords and a few rounded notes, with slow attack/release.
  for (const [frequency, delay] of [[174.61, 0], [261.63, .4], [349.23, 1.1]]) tone(frequency, delay, 7.3, .012, true)
  for (const [frequency, delay] of [[523.25, .8], [392, 2.7], [440, 4.5], [349.23, 6.2]]) tone(frequency, delay, 2.3, .009, true)
}

/** Must be called from a user gesture; browsers otherwise suspend Web Audio. */
export function unlockGentleSound() {
  if (!enabled || typeof window === "undefined") return
  try {
    context ||= new AudioContext()
    void context.resume().then(() => { if (enabled) playOpening() }).catch(() => {})
  } catch { /* The interface remains usable when audio is unavailable. */ }
}

export function setGentleSound(value: boolean) {
  enabled = value
  try { soundStorage?.setItem(SOUND_KEY, value ? "on" : "off") } catch {}
  if (value) unlockGentleSound()
  else {
    const requestedOpening = opening
    stopOpeningSound()
    opening = requestedOpening
    void context?.suspend().catch(() => {})
  }
  listeners.forEach((listener) => listener())
}

export function beginOpeningSound() { opening = true; openingPlaying = false; playOpening() }
export function stopOpeningSound() {
  opening = false
  openingPlaying = false
  if (!context) return
  const now = context.currentTime
  for (const voice of openingVoices) {
    voice.gain.gain.cancelScheduledValues(now)
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, .00001), now)
    voice.gain.gain.exponentialRampToValueAtTime(.00001, now + .3)
    try { voice.oscillator.stop(now + .35) } catch {}
  }
  openingVoices.clear()
}

export function gentleFeedback() {
  if (!enabled || opening || context?.state !== "running") return
  const now = Date.now()
  if (now - lastFeedback < 220) return
  lastFeedback = now
  tone(261.63, 0, .32, .008)
  tone(349.23, .07, .35, .005)
}

export function quietOnBackground() { stopOpeningSound(); void context?.suspend().catch(() => {}) }
