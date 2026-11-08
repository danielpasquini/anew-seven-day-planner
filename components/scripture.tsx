"use client"

import type { Scripture } from "@/lib/guide-data"
import { useStore } from "@/lib/store"
import { BibleProvider } from "@/lib/bible/bible-provider"

export function ScriptureBlock({ scripture }: { scripture: Scripture }) {
  const { locale, bibleVersion, activeGuide, t } = useStore()

  // Only render when spiritual content is enabled
  if (!activeGuide.theologyEnabled || !scripture) {
    return null
  }

  const isEn = locale === "en-US"
  const availableVersions = BibleProvider.getAvailableVersions(locale)
  const primaryVersion = availableVersions.includes(bibleVersion) ? bibleVersion : BibleProvider.getDefaultVersion(locale)
  const secondaryVersion = isEn
    ? primaryVersion === "KJV" ? "NIV" : "KJV"
    : primaryVersion === "ARA" ? "NVT" : "ARA"

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-5 sm:p-6">
      <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary/70">
        <span className="h-px w-6 bg-gold" aria-hidden="true" />
        {t.scripture.kicker}
      </p>

      <div className="space-y-5">
        {scripture.verses.map((verse) => {
          const primaryResolved = BibleProvider.resolvePassage(verse.ref, primaryVersion, locale)
          const secondaryResolved = BibleProvider.resolvePassage(verse.ref, secondaryVersion, locale)

          const primaryText = primaryResolved.text || (primaryVersion === "ARA" ? verse.ara : primaryVersion === "NVT" ? verse.nvt : primaryVersion === "KJV" ? verse.kjv : verse.niv)
          const secondaryText = secondaryResolved.text || (secondaryVersion === "ARA" ? verse.ara : secondaryVersion === "NVT" ? verse.nvt : secondaryVersion === "KJV" ? verse.kjv : verse.niv)
          const missingText = isEn ? "An English text for this reference is not available in this guide." : "Não há texto disponível para esta referência nesta versão do guia."

          return (
            <figure key={verse.ref}>
              <figcaption className="mb-2 font-serif text-base font-semibold text-primary">
                {primaryResolved.ref || verse.ref}
              </figcaption>
              <div className="space-y-3">
                <blockquote className="border-l-2 border-gold/70 pl-4">
                  <span className="mb-0.5 block text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {primaryVersion}
                  </span>
                  <p className="font-serif text-base italic leading-relaxed text-foreground text-pretty">
                    {primaryText || missingText}
                  </p>
                </blockquote>
                <blockquote className="border-l-2 border-primary/40 pl-4">
                  <span className="mb-0.5 block text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {secondaryVersion}
                  </span>
                  <p className="font-serif text-base italic leading-relaxed text-foreground text-pretty">
                    {secondaryText || missingText}
                  </p>
                </blockquote>
              </div>
            </figure>
          )
        })}
      </div>

      <div className="mt-5 space-y-4 border-t border-primary/15 pt-5">
        {scripture.comentario && (!isEn || activeGuide.contentLocale === "en-US") && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary/70">
              {t.scripture.commentary}
            </p>
            <p className="text-sm leading-relaxed text-foreground/90 text-pretty">
              {scripture.comentario}
            </p>
          </div>
        )}
        {scripture.oracao && (!isEn || activeGuide.contentLocale === "en-US") && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary/80">
              {t.scripture.prayer}
            </p>
            <p className="font-serif text-base italic leading-relaxed text-foreground text-pretty">
              {scripture.oracao}
            </p>
          </div>
        )}
        {isEn && activeGuide.contentLocale !== "en-US" && (scripture.comentario || scripture.oracao) && <p className="text-xs leading-relaxed text-muted-foreground">Commentary from this older guide is not available in English.</p>}
      </div>

      {/* Attribution notice if NIV is active */}
      {(primaryVersion === "NIV" || secondaryVersion === "NIV") && (
        <div className="mt-4 pt-3 border-t border-primary/10 text-[0.65rem] text-muted-foreground/80 leading-snug">
          {BibleProvider.getAttributionNotice("NIV", locale)}
        </div>
      )}
    </div>
  )
}
