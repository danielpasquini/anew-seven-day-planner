"use client"

import { Check, Moon, Monitor, Sun, BookOpen } from "lucide-react"
import { useStore, PALETTES } from "@/lib/store"
import { titleCase } from "@/lib/title-case"
import { cn } from "@/lib/utils"
import { SoundSettings } from "./sound-settings"

const SETTINGS_TEXT: Record<string, string> = {
  "Tradução clássica de referência": "Traditional Portuguese translation",
  "Linguagem contemporânea e clara": "Contemporary Portuguese translation",
  "Ativa": "Active",
  "Fundo (Background)": "Background",
  "Superfície (Card)": "Surface",
  "Cor Primária": "Primary color",
  "Destaque / Títulos": "Accent color",
  "Original (Pinho Sálvia)": "Sage & paper",
  "Pinho & Papel Quente": "Sage & warm paper",
  "Visual original do aplicativo. Equilíbrio, serenidade e papel aquecido.": "Soft greens and warm paper for a calm reading space.",
  "Terracota Editorial": "Terracotta",
  "Argila & Barro Quente": "Clay & warm earth",
  "Cores quentes e orgânicas com tom de barro e aterramento.": "Warm, earthy colors with a soft clay accent.",
  "Sábia Editorial": "Ocean blue",
  "Azul Marinho & Índigo": "Navy & indigo",
  "Serenidade oceânica, clareza mental e estrutura sóbria.": "Quiet blues and clean, readable surfaces.",
  "Grafite Elefante": "Graphite",
  "Carvão Monocromático": "Charcoal & neutral paper",
  "Minimalismo contemporâneo e sóbrio em escala neutra.": "A simple, neutral palette with charcoal accents.",
  "Oliva Editorial": "Olive",
  "Verde Oliva & Amêndoa": "Olive & almond",
  "Tons botânicos de oliva e terra com leiturabilidade acolhedora.": "Botanical greens and soft earth tones."
}

export function SettingsAppearanceTab() {
  const {
    activeGuide,
    theme,
    setTheme,
    palette,
    setPalette,
    locale,
    setLocale,
    bibleVersion,
    setBibleVersion,
    toggleSpirituality,
    t,
  } = useStore()

  const copy = (pt: string) => locale === "en-US" ? SETTINGS_TEXT[pt] || pt : pt

  return (
    <div className="space-y-6">
      {/* Idioma da Interface */}
      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-bold tracking-wider text-muted-foreground">
            {titleCase(t.settings.language.label)}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.settings.language.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setLocale("pt-BR")}
            className={cn(
              "flex items-center justify-between rounded-xl border p-3.5 transition text-left touch-manipulation",
              locale === "pt-BR"
                ? "border-primary bg-primary/8 shadow-xs ring-1 ring-primary/30"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base leading-none">🇧🇷</span>
              <span className="text-xs font-semibold text-foreground">{t.settings.language.ptBR}</span>
            </div>
            {locale === "pt-BR" && <Check className="size-4 text-primary" aria-hidden="true" />}
          </button>

          <button
            type="button"
            onClick={() => setLocale("en-US")}
            className={cn(
              "flex items-center justify-between rounded-xl border p-3.5 transition text-left touch-manipulation",
              locale === "en-US"
                ? "border-primary bg-primary/8 shadow-xs ring-1 ring-primary/30"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base leading-none">🇺🇸</span>
              <span className="text-xs font-semibold text-foreground">{t.settings.language.enUS}</span>
            </div>
            {locale === "en-US" && <Check className="size-4 text-primary" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Seção Sonora Procedural */}
      <div className="pt-4 border-t border-border">
        <SoundSettings />
      </div>

      {/* Conteúdo Espiritual & Reflexivo (Não mais escondido!) */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm sm:p-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/70">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-primary" aria-hidden="true" />
                <h4 className="font-serif text-base font-medium tracking-tight text-foreground">
                  {locale === "en-US" ? "Reflective & Spiritual Content (Optional)" : "Conteúdo Espiritual & Reflexivo (Opcional)"}
                </h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                {locale === "en-US"
                  ? "Includes gentle scriptures and supportive prayers at the end of daily readings. Disabled by default to respect secular and personal paths."
                  : "Inclui versículos acolhedores e orações reflexivas ao final dos blocos diários. Desativado por padrão em respeito a caminhos seculares."}
              </p>
            </div>

            {/* Toggle Principal de Espiritualidade */}
            <button
              type="button"
              role="switch"
              aria-checked={activeGuide.theologyEnabled}
              aria-label={
                activeGuide.theologyEnabled
                  ? (locale === "en-US" ? "Disable spiritual content" : "Desativar conteúdo espiritual")
                  : (locale === "en-US" ? "Enable spiritual content" : "Ativar conteúdo espiritual")
              }
              onClick={() => toggleSpirituality()}
              className={cn(
                "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                activeGuide.theologyEnabled ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  activeGuide.theologyEnabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Tradução Bíblica quando ativado */}
          {activeGuide.theologyEnabled ? (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {titleCase(t.settings.bibleVersion.label)}
                </p>
                <p className="text-[0.75rem] text-muted-foreground mt-0.5">
                  {t.settings.bibleVersion.desc}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {locale === "en-US" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setBibleVersion("KJV")}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-3.5 transition text-left touch-manipulation",
                        bibleVersion === "KJV"
                          ? "border-primary bg-primary/8 shadow-xs ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <div>
                        <p className="text-xs font-semibold text-foreground">King James Version (KJV)</p>
                        <p className="text-[0.7rem] text-muted-foreground">Traditional English translation</p>
                      </div>
                      {bibleVersion === "KJV" && <Check className="size-4 text-primary" aria-hidden="true" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setBibleVersion("NIV")}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-3.5 transition text-left touch-manipulation",
                        bibleVersion === "NIV"
                          ? "border-primary bg-primary/8 shadow-xs ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <div>
                        <p className="text-xs font-semibold text-foreground">New International Version (NIV)</p>
                        <p className="text-[0.7rem] text-muted-foreground">Modern readable translation</p>
                      </div>
                      {bibleVersion === "NIV" && <Check className="size-4 text-primary" aria-hidden="true" />}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setBibleVersion("ARA")}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-3.5 transition text-left touch-manipulation",
                        bibleVersion === "ARA"
                          ? "border-primary bg-primary/8 shadow-xs ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <div>
                        <p className="text-xs font-semibold text-foreground">Almeida Revista e Atualizada (ARA)</p>
                        <p className="text-[0.7rem] text-muted-foreground">{copy("Tradução clássica de referência")}</p>
                      </div>
                      {bibleVersion === "ARA" && <Check className="size-4 text-primary" aria-hidden="true" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setBibleVersion("NVT")}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-3.5 transition text-left touch-manipulation",
                        bibleVersion === "NVT"
                          ? "border-primary bg-primary/8 shadow-xs ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <div>
                        <p className="text-xs font-semibold text-foreground">Nova Versão Transformadora (NVT)</p>
                        <p className="text-[0.7rem] text-muted-foreground">{copy("Linguagem contemporânea e clara")}</p>
                      </div>
                      {bibleVersion === "NVT" && <Check className="size-4 text-primary" aria-hidden="true" />}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-3.5 py-2.5 text-[0.75rem] text-muted-foreground">
              {locale === "en-US"
                ? "Spirituality is currently turned off. To include devotional passages and prayers, toggle the switch above."
                : "Espiritualidade está desativada no momento. Para incluir versículos e orações, ative a chave acima."}
            </div>
          )}
        </div>
      </div>

      {/* Tema */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h4 className="text-xs font-bold tracking-wider text-muted-foreground">
          {titleCase(t.settings.theme.label)}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            aria-pressed={theme === "light"}
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3.5 transition text-left touch-manipulation",
              theme === "light"
                ? "border-primary bg-primary/8 shadow-xs"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <Sun className="size-5 text-amber-500 shrink-0" aria-hidden="true" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">{t.settings.theme.light}</span>
                {theme === "light" && <Check className="size-3.5 text-primary" aria-hidden="true" />}
              </div>
            </div>
          </button>

          <button
            type="button"
            aria-pressed={theme === "dark"}
            onClick={() => setTheme("dark")}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3.5 transition text-left touch-manipulation",
              theme === "dark"
                ? "border-primary bg-primary/8 shadow-xs"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <Moon className="size-5 text-indigo-400 shrink-0" aria-hidden="true" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">{t.settings.theme.dark}</span>
                {theme === "dark" && <Check className="size-3.5 text-primary" aria-hidden="true" />}
              </div>
            </div>
          </button>

          <button
            type="button"
            aria-pressed={theme === "system"}
            onClick={() => setTheme("system")}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3.5 transition text-left touch-manipulation",
              theme === "system"
                ? "border-primary bg-primary/8 shadow-xs"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <Monitor className="size-5 text-muted-foreground shrink-0" aria-hidden="true" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">{t.settings.theme.system}</span>
                {theme === "system" && <Check className="size-3.5 text-primary" aria-hidden="true" />}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Paleta de Cores */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h4 className="text-xs font-bold tracking-wider text-muted-foreground">
          {titleCase(t.settings.palette.label)}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PALETTES.map((p) => {
            const isSel = palette === p.id

            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={palette === p.id}
                onClick={() => setPalette(p.id)}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border p-3.5 transition text-left touch-manipulation",
                  isSel
                    ? "border-primary bg-primary/8 shadow-xs ring-1 ring-primary/30"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-foreground">
                    {copy(p.name)}
                  </span>
                  {isSel && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] font-bold text-primary">
                      <Check className="size-3" aria-hidden="true" /> {copy("Ativa")}
                    </span>
                  )}
                </div>

                {/* Preview Swatches */}
                <div className="flex items-center gap-1.5 py-1">
                  <div className="flex items-center gap-1 rounded-md border border-border/60 p-1 bg-background/50">
                    <span
                      className="size-3.5 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: p.bgHex }}
                      title={copy("Fundo (Background)")}
                    />
                    <span
                      className="size-3.5 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: p.cardHex }}
                      title={copy("Superfície (Card)")}
                    />
                    <span
                      className="size-3.5 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: p.primaryHex }}
                      title={copy("Cor Primária")}
                    />
                    <span
                      className="size-3.5 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: p.goldHex }}
                      title={copy("Destaque / Títulos")}
                    />
                  </div>
                  <span className="text-[0.65rem] text-muted-foreground font-medium">
                    {copy(p.subtitle)}
                  </span>
                </div>

                <p className="text-[0.7rem] text-muted-foreground leading-relaxed">
                  {copy(p.description)}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
