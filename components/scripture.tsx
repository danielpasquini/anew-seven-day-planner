import type { Scripture } from "@/lib/guide-data"

export function ScriptureBlock({ scripture }: { scripture: Scripture }) {
  return (
    <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-5 sm:p-6">
      <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary/70">
        <span className="h-px w-6 bg-gold" aria-hidden="true" />
        Escritura
      </p>

      <div className="space-y-5">
        {scripture.verses.map((verse) => (
          <figure key={verse.ref}>
            <figcaption className="mb-2 font-serif text-base font-semibold text-primary">{verse.ref}</figcaption>
            <div className="space-y-3">
              <blockquote className="border-l-2 border-gold/60 pl-4">
                <span className="mb-0.5 block text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  ARA
                </span>
                <p className="font-serif italic leading-relaxed text-foreground/90 text-pretty">{verse.ara}</p>
              </blockquote>
              <blockquote className="border-l-2 border-primary/30 pl-4">
                <span className="mb-0.5 block text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  NVT
                </span>
                <p className="font-serif italic leading-relaxed text-foreground/90 text-pretty">{verse.nvt}</p>
              </blockquote>
            </div>
          </figure>
        ))}
      </div>

      <div className="mt-5 space-y-4 border-t border-primary/15 pt-5">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary/70">Comentário</p>
          <p className="text-sm leading-relaxed text-foreground/90 text-pretty">{scripture.comentario}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary/70">Oração</p>
          <p className="font-serif text-sm italic leading-relaxed text-foreground/90 text-pretty">
            {scripture.oracao}
          </p>
        </div>
      </div>
    </div>
  )
}
