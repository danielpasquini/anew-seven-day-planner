"use client"

import { useEffect, useSyncExternalStore } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { gentleFeedback, initializeSounds, quietOnBackground, setGentleSound, soundSnapshot, subscribeSounds, unlockGentleSound } from "@/lib/sounds"
import { useDemo } from "@/lib/demo"

export function GentleSoundEvents() {
  const demo = useDemo()
  useEffect(() => {
    initializeSounds(demo.enabled ? demo.demoStorage : undefined, true)
    const interact = (event: Event) => {
      if (!event.isTrusted || !(event.target instanceof Element)) return
      if (event.target.closest("[data-sound-control]")) return
      unlockGentleSound()
      if (event.target.closest("button, a[href]")) gentleFeedback()
    }
    const visibility = () => { if (document.hidden) quietOnBackground() }
    document.addEventListener("click", interact)
    document.addEventListener("visibilitychange", visibility)
    window.addEventListener("retomada:pause", quietOnBackground)
    return () => {
      document.removeEventListener("click", interact)
      document.removeEventListener("visibilitychange", visibility)
      window.removeEventListener("retomada:pause", quietOnBackground)
      quietOnBackground()
    }
  }, [demo.enabled, demo.demoStorage])
  return null
}

export function SoundControl({ label = false }: { label?: boolean }) {
  const enabled = useSyncExternalStore(subscribeSounds, soundSnapshot, () => false)
  return <button type="button" data-sound-control aria-pressed={enabled} aria-label={enabled ? "Mute gentle sounds" : "Enable gentle sounds"} title={enabled ? "Mute gentle sounds" : "Enable gentle sounds"} onClick={() => setGentleSound(!enabled)} className={label ? "inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-xs text-muted-foreground hover:bg-primary/5" : "icon-button"}>{enabled ? <Volume2 className="size-[18px]" aria-hidden="true" /> : <VolumeX className="size-[18px]" aria-hidden="true" />}{label && <span>{enabled ? "Gentle sound on · tap to mute" : "Tap for gentle sound"}</span>}</button>
}
