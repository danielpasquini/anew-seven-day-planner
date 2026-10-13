import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { AppState } from "react-native"
import { setAudioModeAsync, useAudioPlayer } from "expo-audio"

type Sounds = { enabled: boolean; toggle: () => void; tap: () => void; opening: () => void; stop: () => void }
const SoundContext = createContext<Sounds>({ enabled: false, toggle() {}, tap() {}, opening() {}, stop() {} })

/** Sound is optional and stays in memory. No microphone or background playback. */
export function NativeSoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false)
  const enabledRef = useRef(false)
  const lastTap = useRef(0)
  const playbackEpoch = useRef(0)
  const chime = useAudioPlayer(require("../assets/tap.wav"))
  const branch = useAudioPlayer(require("../assets/zen.wav"))
  const stop = useCallback(() => { playbackEpoch.current++; chime.pause(); branch.pause() }, [chime, branch])
  useEffect(() => {
    void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: false, shouldPlayInBackground: false, interruptionMode: "mixWithOthers" }).catch(() => {})
    chime.volume = .25
    branch.volume = .3
    const subscription = AppState.addEventListener("change", state => { if (state !== "active") stop() })
    return () => subscription.remove()
  }, [chime, branch, stop])
  const tap = useCallback(() => {
    if (!enabledRef.current || AppState.currentState !== "active" || Date.now() - lastTap.current < 180) return
    lastTap.current = Date.now()
    const epoch = playbackEpoch.current
    void chime.seekTo(0).then(() => { if (enabledRef.current && epoch === playbackEpoch.current && AppState.currentState === "active") chime.play() }).catch(() => {})
  }, [chime])
  const opening = useCallback(() => {
    if (!enabledRef.current || AppState.currentState !== "active") return
    const epoch = playbackEpoch.current
    void branch.seekTo(0).then(() => { if (enabledRef.current && epoch === playbackEpoch.current && AppState.currentState === "active") branch.play() }).catch(() => {})
  }, [branch])
  const toggle = useCallback(() => {
    enabledRef.current = !enabledRef.current
    setEnabled(enabledRef.current)
    if (!enabledRef.current) stop()
    else {
      const epoch = playbackEpoch.current
      void chime.seekTo(0).then(() => { if (enabledRef.current && epoch === playbackEpoch.current && AppState.currentState === "active") chime.play() }).catch(() => {})
    }
  }, [chime, stop])
  return <SoundContext.Provider value={{ enabled, toggle, tap, opening, stop }}>{children}</SoundContext.Provider>
}
export const useNativeSound = () => useContext(SoundContext)
