"use client"

import React from "react"
import { Volume2, VolumeX, Music, Wind, Sparkles } from "lucide-react"
import { useSound } from "@/lib/audio/useSound"
import { cn } from "@/lib/utils"

export function SoundSettings({ className }: { className?: string }) {
  const {
    isMuted,
    masterVolume,
    musicVolume,
    ambientVolume,
    sfxVolume,
    setVolume,
    toggleMute,
    playTap,
  } = useSound()

  return (
    <section
      aria-labelledby="sound-settings-title"
      className={cn(
        "rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm sm:p-6",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Volume2 className="size-4 text-primary" aria-hidden="true" />
            <h3
              id="sound-settings-title"
              className="font-serif text-base font-medium tracking-tight text-foreground"
            >
              Ambientação Sonora
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Áudio procedural suave gerado no dispositivo, sem arquivos pesados ou repetições.
          </p>
        </div>

        {/* Master Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={!isMuted}
          aria-label={!isMuted ? "Desativar ambientação sonora" : "Ativar ambientação sonora"}
          onClick={toggleMute}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            !isMuted ? "bg-primary" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
              !isMuted ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>

      <div className={cn("mt-5 space-y-5 transition-opacity duration-200", isMuted && "opacity-45 pointer-events-none")}>
        {/* Slider 1: Master Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <label htmlFor="sound-master-volume" className="text-foreground flex items-center gap-1.5">
              {!isMuted ? <Volume2 className="size-3.5 text-primary" /> : <VolumeX className="size-3.5 text-muted-foreground" />}
              Volume Geral (Master)
            </label>
            <span className="text-muted-foreground font-mono">{Math.round(masterVolume * 100)}%</span>
          </div>
          <input
            id="sound-master-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            disabled={isMuted}
            value={masterVolume}
            onChange={(e) => setVolume("master", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* Slider 2: Generative Music */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <label htmlFor="sound-music-volume" className="text-foreground flex items-center gap-1.5">
              <Music className="size-3.5 text-primary" />
              Música Meditativa (Acordes Esparsos)
            </label>
            <span className="text-muted-foreground font-mono">{Math.round(musicVolume * 100)}%</span>
          </div>
          <input
            id="sound-music-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            disabled={isMuted}
            value={musicVolume}
            onChange={(e) => setVolume("music", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* Slider 3: Ambient Drone / Brown Noise */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <label htmlFor="sound-ambient-volume" className="text-foreground flex items-center gap-1.5">
              <Wind className="size-3.5 text-primary" />
              Som de Fundo (Ruído Calmante / Brown Noise)
            </label>
            <span className="text-muted-foreground font-mono">{Math.round(ambientVolume * 100)}%</span>
          </div>
          <input
            id="sound-ambient-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            disabled={isMuted}
            value={ambientVolume}
            onChange={(e) => setVolume("ambient", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* Slider 4: UI SFX with pointerUp immediate preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <label htmlFor="sound-sfx-volume" className="text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              Sons de Toque e Interação (SFX Táteis)
            </label>
            <span className="text-muted-foreground font-mono">{Math.round(sfxVolume * 100)}%</span>
          </div>
          <input
            id="sound-sfx-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            disabled={isMuted}
            value={sfxVolume}
            onChange={(e) => setVolume("sfx", parseFloat(e.target.value))}
            onPointerUp={() => playTap()}
            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>
    </section>
  )
}
