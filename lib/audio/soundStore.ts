// Global sound state and local storage persistence for Anew
// Safe for SSR, Webapp, PWA, and Capacitor.

export type SoundChannel = "master" | "music" | "ambient" | "sfx"

export interface SoundState {
  isMuted: boolean
  masterVolume: number
  musicVolume: number
  ambientVolume: number
  sfxVolume: number
}

const SOUND_STORAGE_KEY = "anew_sound_store_v1"

const DEFAULT_STATE: SoundState = {
  isMuted: false, // Sound is ON by default
  masterVolume: 0.5,
  musicVolume: 0.5,
  ambientVolume: 0.0, // Ambient/drone starts at zero as required
  sfxVolume: 0.5,
}

let currentState: SoundState = { ...DEFAULT_STATE }
let isInitialized = false
const subscribers = new Set<(state: SoundState) => void>()

function loadPersistedState(): SoundState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE }
  try {
    const raw = localStorage.getItem(SOUND_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        isMuted: typeof parsed.isMuted === "boolean" ? parsed.isMuted : DEFAULT_STATE.isMuted,
        masterVolume: typeof parsed.masterVolume === "number" ? Math.max(0, Math.min(1, parsed.masterVolume)) : DEFAULT_STATE.masterVolume,
        musicVolume: typeof parsed.musicVolume === "number" ? Math.max(0, Math.min(1, parsed.musicVolume)) : DEFAULT_STATE.musicVolume,
        ambientVolume: typeof parsed.ambientVolume === "number" ? Math.max(0, Math.min(1, parsed.ambientVolume)) : DEFAULT_STATE.ambientVolume,
        sfxVolume: typeof parsed.sfxVolume === "number" ? Math.max(0, Math.min(1, parsed.sfxVolume)) : DEFAULT_STATE.sfxVolume,
      }
    }
  } catch {
    // Fallback to default
  }
  return { ...DEFAULT_STATE }
}

function persistState(state: SoundState) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function notifySubscribers() {
  subscribers.forEach((cb) => cb(currentState))
}

export const soundStore = {
  getState(): SoundState {
    if (!isInitialized && typeof window !== "undefined") {
      currentState = loadPersistedState()
      isInitialized = true
    }
    return currentState
  },

  subscribe(callback: (state: SoundState) => void): () => void {
    subscribers.add(callback)
    return () => {
      subscribers.delete(callback)
    }
  },

  setVolume(channel: SoundChannel, value: number) {
    const clamped = Math.max(0, Math.min(1, value))
    const key = `${channel}Volume` as keyof SoundState
    currentState = {
      ...currentState,
      [key]: clamped,
    }
    persistState(currentState)
    notifySubscribers()
  },

  toggleMute(): boolean {
    currentState = {
      ...currentState,
      isMuted: !currentState.isMuted,
    }
    persistState(currentState)
    notifySubscribers()
    return currentState.isMuted
  },

  setMuted(muted: boolean) {
    if (currentState.isMuted === muted) return
    currentState = {
      ...currentState,
      isMuted: muted,
    }
    persistState(currentState)
    notifySubscribers()
  },

  initializeAudioContext() {
    if (!isInitialized && typeof window !== "undefined") {
      currentState = loadPersistedState()
      isInitialized = true
      notifySubscribers()
    }
  },
}
