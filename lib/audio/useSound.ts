"use client"

import { useSyncExternalStore, useCallback } from "react"
import { soundStore, type SoundChannel, type SoundState } from "./soundStore"
import { AudioEngine } from "./AudioEngine"

const emptyServerState: SoundState = {
  isMuted: false,
  masterVolume: 0.5,
  musicVolume: 0.5,
  ambientVolume: 0.0,
  sfxVolume: 0.5,
}

export function useSound() {
  const state = useSyncExternalStore(
    soundStore.subscribe,
    soundStore.getState,
    () => emptyServerState
  )

  const playTap = useCallback(() => {
    if (state.isMuted) return
    AudioEngine.ensureContext()
    void AudioEngine.unlock().then(() => {
      AudioEngine.sfx?.playTap()
    })
  }, [state.isMuted])

  const playComplete = useCallback(() => {
    if (state.isMuted) return
    AudioEngine.ensureContext()
    void AudioEngine.unlock().then(() => {
      AudioEngine.sfx?.playComplete()
    })
  }, [state.isMuted])

  const playSheetDrag = useCallback(() => {
    if (state.isMuted) return
    AudioEngine.ensureContext()
    void AudioEngine.unlock().then(() => {
      AudioEngine.sfx?.playSheetDrag()
    })
  }, [state.isMuted])

  const toggleMute = useCallback(() => {
    return soundStore.toggleMute()
  }, [])

  const toggleAudio = useCallback(() => {
    return soundStore.toggleMute()
  }, [])

  const setVolume = useCallback((channel: SoundChannel, value: number) => {
    soundStore.setVolume(channel, value)
  }, [])

  const isAudioActive = !state.isMuted && AudioEngine.active

  return {
    ...state,
    playTap,
    playComplete,
    playSheetDrag,
    toggleMute,
    toggleAudio,
    setVolume,
    isAudioActive,
    initializeAudioContext: soundStore.initializeAudioContext,
  }
}
