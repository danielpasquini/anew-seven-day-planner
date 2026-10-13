"use client"

import { titleCase } from "@/lib/title-case"

import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, Bookmark, BookOpen, Globe2, HeartHandshake, Search, SlidersHorizontal } from "lucide-react"
import { FREE_RESOURCES, type ResourceCategory } from "@/lib/resources"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/client"
import { useDemo } from "@/lib/demo"

const categoryNames = {
  care: ["Encontrar cuidado", "Find care"],
  "self-care": ["Autocuidado", "Self-care"],
  learning: ["Aprender", "Learn"],
  rights: ["Direitos e ética", "Rights and ethics"],
  community: ["Redes de apoio", "Support networks"],
} satisfies Record<ResourceCategory, string[]>

const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

export function ResourceLibrary() {
  const demo = useDemo()
  const { locale } = useStore()
  const { status, user, legalAccepted } = useAuth()
  const resourceStorageKey = demo.enabled ? "guia-resource-favorites:demo" : status === "authenticated" && user?.emailVerified === true && legalAccepted ? `guia-resource-favorites:${user.uid}` : null
  const en = locale === "en-US"
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<ResourceCategory | "all">("all")
  const [region, setRegion] = useState("all")
  const [savedOnly, setSavedOnly] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [storageMessage, setStorageMessage] = useState("")

  useEffect(() => {
    setFavorites([])
    if (!resourceStorageKey) return
    try {
      const saved: unknown = JSON.parse((demo.enabled ? demo.demoStorage : localStorage)?.getItem(resourceStorageKey) || "[]")
      if (Array.isArray(saved)) setFavorites(saved.filter((id): id is string => typeof id === "string" && FREE_RESOURCES.some((r) => r.id === id)))
    } catch { /* Favorites are optional; the library works without browser storage. */ }
  }, [resourceStorageKey, demo.enabled, demo.demoStorage])

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id]
    setFavorites(next)
    if (!resourceStorageKey) return
    try {
      ;(demo.enabled ? demo.demoStorage : localStorage)?.setItem(resourceStorageKey, JSON.stringify(next))
      setStorageMessage("")
    } catch {
      setStorageMessage(en ? "Favorites are available for this visit; your browser could not save them." : "Os favoritos valem nesta visita; o navegador não conseguiu salvá-los.")
    }
  }

  const englishResources = useMemo(() => FREE_RESOURCES.filter((r) => r.languages.includes("en")), [])
  const resources = useMemo(() => englishResources.filter((r) => {
    return (category === "all" || r.category === category)
      && (region === "all" || r.region === region)
      && (!savedOnly || favorites.includes(r.id))
      && normalize([r.title, r.titleEn || "", r.description, r.descriptionEn || "", r.provider, ...r.tags, r.approach || "", r.approachEn || ""].join(" ")).includes(normalize(search.trim()))
  }), [search, category, region, savedOnly, favorites, englishResources])

  const resetFilters = () => { setSearch(""); setCategory("all"); setRegion("all"); setSavedOnly(false) }

  return (
    <section id="recursos" aria-labelledby="resource-title" className="scroll-mt-36 md:scroll-mt-24 space-y-8">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><BookOpen className="size-4" aria-hidden="true" />{en ? "A library for your journey" : "Uma biblioteca para o seu caminho"}</div>
          <h2 id="resource-title" className="font-serif text-3xl font-medium leading-tight sm:text-4xl">{titleCase(en ? "Good support should be accessible." : "Bom apoio precisa ser acessível.")}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{en ? "Free resources in English, from trusted institutions around the world. Explore different perspectives and choose what fits your life. Local services and legal information may be specific to a country." : "Recursos gratuitos em inglês, de instituições confiáveis do mundo. Conheça diferentes perspectivas e escolha o que faz sentido para você. Serviços e informações jurídicas podem ser específicos de um país."}</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4"><Globe2 className="size-5 text-primary" aria-hidden="true" /><div><strong className="block text-2xl font-medium tabular-nums">{englishResources.length}</strong><span className="text-xs text-muted-foreground">{en ? "free English resources" : "recursos gratuitos em inglês"}</span></div></div>
      </div>

      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5 text-sm leading-relaxed">
        <div className="flex items-start gap-3"><HeartHandshake className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><div><strong className="font-semibold">{en ? "Need support from a person?" : "Precisa de apoio de uma pessoa?"}</strong><p className="mt-1 text-muted-foreground">{en ? "A qualified professional or local public health service can help you explore your options. Availability and access differ between Brazil, the United States and other countries. If there is immediate danger, seek a local emergency service. This app is not monitored." : "Um profissional habilitado ou serviço público local pode ajudar a conhecer suas opções. A oferta varia entre Brasil, Estados Unidos e outros países. Em perigo imediato, procure um serviço local de emergência. Este app não é monitorado."}</p><a href="https://www.nimh.nih.gov/health/publications/tips-for-talking-with-your-health-care-provider" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1 font-semibold text-primary underline underline-offset-4">{en ? "NIMH: talking with a health care provider" : "NIMH: conversar com um profissional (em inglês)"}<ArrowUpRight className="size-4" aria-hidden="true" /></a></div></div>
      </div>

      <div className="space-y-4">
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-4 focus-within:ring-2 focus-within:ring-ring"><Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" /><span className="sr-only">{en ? "Search free resources" : "Buscar recursos gratuitos"}</span><input value={search} onChange={(e) => setSearch(e.target.value)} type="search" placeholder={en ? "Search by topic, institution, or approach…" : "Busque por tema, instituição ou abordagem…"} className="w-full min-w-0 bg-transparent py-3 text-base outline-none" /></label>
        <div className="flex flex-wrap gap-2" role="group" aria-label={en ? "Resource categories" : "Categorias de recursos"}>
          {(["all", ...Object.keys(categoryNames)] as (ResourceCategory | "all")[]).map((id) => <button key={id} type="button" onClick={() => setCategory(id)} aria-pressed={category === id} className={cn("min-h-11 rounded-full border px-4 text-sm font-medium transition", category === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground")}>{id === "all" ? (en ? "All resources" : "Todos os recursos") : categoryNames[id][en ? 1 : 0]}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
          <label className="flex items-center gap-2 text-sm text-muted-foreground"><span>{en ? "Publisher region" : "Região da instituição"}</span><select value={region} onChange={(e) => setRegion(e.target.value)} className="min-h-11 max-w-44 rounded-lg border border-border bg-card px-3 text-base text-foreground"><option value="all">{en ? "All" : "Todas"}</option><option value="US">United States</option><option value="UK">United Kingdom</option><option value="AU">Australia</option><option value="international">Global</option></select></label>
          <span className="rounded-full bg-primary/10 px-3 py-2 text-xs font-medium text-primary">English resources</span>
          <button type="button" aria-pressed={savedOnly} onClick={() => setSavedOnly((v) => !v)} className={cn("flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm", savedOnly ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground")}><Bookmark className="size-4" aria-hidden="true" />{en ? "Saved" : "Favoritos"}<span className="tabular-nums">{favorites.length}</span></button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">{resources.length} {en ? "resources found" : "recursos encontrados"}{storageMessage && ` · ${storageMessage}`}</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((r) => <article key={r.id} className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-2"><span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{categoryNames[r.category][en ? 1 : 0]}</span><button type="button" onClick={() => toggleFavorite(r.id)} aria-pressed={favorites.includes(r.id)} aria-label={`${favorites.includes(r.id) ? (en ? "Remove from saved" : "Remover dos favoritos") : (en ? "Save" : "Salvar")}: ${r.title}`} className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary/10"><Bookmark className={cn("size-5", favorites.includes(r.id) && "fill-primary")} aria-hidden="true" /></button></div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-primary">{r.provider}</p><h3 className="font-serif text-xl font-medium leading-snug">{titleCase(r.titleEn || r.title)}</h3><p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{r.descriptionEn || r.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{{ US: "United States", UK: "United Kingdom", AU: "Australia", international: "Global", BR: "Brazil" }[r.region]}</span><span aria-hidden="true">·</span><span>English</span>{r.approach && <><span aria-hidden="true">·</span><span>{r.approachEn || r.approach}</span></>}</div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{r.accessEn || r.access}</p><a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-5 flex min-h-11 items-center justify-between gap-3 border-t border-border pt-3 text-sm font-semibold text-primary underline-offset-4 hover:underline">{en ? "Explore resource" : "Conhecer recurso"}<ArrowUpRight className="size-4 shrink-0" aria-hidden="true" /><span className="sr-only">{en ? "Opens the institution's website in a new tab" : "Abre o site da instituição em uma nova aba"}</span></a>
        </article>)}
      </div>
      {resources.length === 0 && <div className="rounded-2xl border border-dashed border-border p-10 text-center"><Search className="mx-auto mb-4 size-7 text-muted-foreground" aria-hidden="true" /><h3 className="font-serif text-xl">{titleCase(en ? "Try another path." : "Vamos tentar outro caminho.")}</h3><p className="mt-2 text-sm text-muted-foreground">{en ? "Change a filter or search for a broader topic." : "Mude um filtro ou busque um tema mais amplo."}</p><button type="button" onClick={resetFilters} className="mt-4 min-h-11 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground">{en ? "Clear filters" : "Limpar filtros"}</button></div>}
      <p className="border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">{en ? "Institutional links reviewed in October 2026. Availability may change. Each resource has its own perspective; inclusion is not endorsement of an approach, a professional, or clinical effectiveness. Source descriptions are shown in their original language. Third-party websites have their own privacy policies." : "Links institucionais revisados em outubro de 2026. A disponibilidade pode mudar. Cada recurso tem sua perspectiva; a inclusão não representa endosso de abordagem, profissional ou eficácia clínica. Sites de terceiros têm políticas de privacidade próprias."}</p>
    </section>
  )
}
