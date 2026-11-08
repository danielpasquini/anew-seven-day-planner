// Web Audio feedback tones for UI interactions

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

export const subscribeSounds = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function initializeSounds(
  storage?: Pick<Storage, "getItem" | "setItem"> | null,
  reset = false
) {
  if ((initialized && !reset) || typeof window === "undefined") return
  initialized = true
  enabled = false

  try {
    soundStorage = storage || localStorage
    enabled = soundStorage.getItem(SOUND_KEY) === "on"
  } catch {
    soundStorage = null
  }

  listeners.forEach((listener) => listener())
}

function tone(
  frequency: number,
  delay: number,
  duration: number,
  volume: number,
  isOpening = false
) {
  if (!context || context.state !== "running") return

  const audio = context
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  const start = audio.currentTime + delay

  oscillator.type = "sine"
  oscillator.frequency.value = frequency

  gain.gain.setValueAtTime(0.00001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.45, duration / 4))
  gain.gain.exponentialRampToValueAtTime(0.00001, start + duration)

  oscillator.connect(gain)
  gain.connect(audio.destination)

  const voice = { oscillator, gain }
  if (isOpening) openingVoices.add(voice)

  oscillator.onended = () => {
    oscillator.disconnect()
    gain.disconnect()
    openingVoices.delete(voice)
  }

  oscillator.start(start)
  oscillator.stop(start + duration + 0.05)
}

function playOpening() {
  if (!enabled || !opening || openingPlaying || context?.state !== "running") return
  openingPlaying = true

  // Soft chords progression
  const bassNotes: [number, number][] = [
    [174.61, 0],
    [261.63, 0.4],
    [349.23, 1.1],
  ]
  for (const [freq, delay] of bassNotes) {
    tone(freq, delay, 7.3, 0.012, true)
  }

  const leadNotes: [number, number][] = [
    [523.25, 0.8],
    [392.0, 2.7],
    [440.0, 4.5],
    [349.23, 6.2],
  ]
  for (const [freq, delay] of leadNotes) {
    tone(freq, delay, 2.3, 0.009, true)
  }
}

/** Resume audio context on user gesture to comply with browser autoplay policies */
export function unlockGentleSound() {
  if (!enabled || typeof window === "undefined") return
  try {
    context ||= new AudioContext()
    void context.resume().then(() => {
      if (enabled) playOpening()
    }).catch(() => {})
  } catch {
    // Audio unavailable in current environment
  }
}

export function setGentleSound(value: boolean) {
  enabled = value
  try {
    soundStorage?.setItem(SOUND_KEY, value ? "on" : "off")
  } catch {}

  if (value) {
    unlockGentleSound()
  } else {
    const requestedOpening = opening
    stopOpeningSound()
    opening = requestedOpening
    void context?.suspend().catch(() => {})
  }

  listeners.forEach((listener) => listener())
}

export function beginOpeningSound() {
  opening = true
  openingPlaying = false
  playOpening()
}

export function stopOpeningSound() {
  opening = false
  openingPlaying = false
  if (!context) return

  const now = context.currentTime
  for (const voice of openingVoices) {
    voice.gain.gain.cancelScheduledValues(now)
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.00001), now)
    voice.gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.3)
    try {
      voice.oscillator.stop(now + 0.35)
    } catch {}
  }
  openingVoices.clear()
}

export function gentleFeedback() {
  if (!enabled || opening || context?.state !== "running") return

  const now = Date.now()
  if (now - lastFeedback < 220) return
  lastFeedback = now

  tone(261.63, 0, 0.32, 0.008)
  tone(349.23, 0.07, 0.35, 0.005)
}

export function quietOnBackground() {
  stopOpeningSound()
  void context?.suspend().catch(() => {})
}
