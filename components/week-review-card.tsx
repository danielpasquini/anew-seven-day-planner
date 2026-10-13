"use client"

import { titleCase } from "@/lib/title-case"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, ShieldCheck, Sparkles } from "lucide-react"
import { useStore } from "@/lib/store"
import { useDemo } from "@/lib/demo"

export function WeekReviewCard() {
  const demo = useDemo()
  const { activeWeek, reopenWeek, generateAIReview, isGeneratingAI, aiError, locale, t } = useStore()
  const [showOptions, setShowOptions] = useState(false)
  const [aiConsent, setAIConsent] = useState(false)
  const [includeTexts, setIncludeTexts] = useState(false)
  const copy = (pt: string, en: string) => locale === "en-US" ? en : pt
  useEffect(() => { setShowOptions(false); setAIConsent(false); setIncludeTexts(false) }, [activeWeek?.id])
  if (!activeWeek || activeWeek.status !== "completed") return null
  const review = activeWeek.aiReview
  const generate = async () => {
    if (!aiConsent || isGeneratingAI) return
    await generateAIReview(activeWeek.id, true, includeTexts)
    setAIConsent(false)
    setIncludeTexts(false)
    setShowOptions(false)
  }
  const groups = review ? [
    { title: copy("O que você pode reconhecer", "What you can acknowledge"), items: review.whatWorked },
    { title: copy("O que talvez precise de apoio", "What may need support"), items: review.difficulties },
    { title: copy("Possíveis temas para refletir", "Possible themes to reflect on"), items: review.observedPatterns },
    { title: copy("Possibilidades para a próxima semana", "Possibilities for next week"), items: review.nextWeekSuggestions },
  ] : []
  return <section aria-labelledby="week-reflection-title" className="week-review-card space-y-5 rounded-[20px] border border-primary/20 bg-card p-5 sm:p-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><CheckCircle2 className="size-5" aria-hidden="true" /></span><div><p className="eyebrow text-primary">{copy("UM CICLO REGISTRADO", "A CYCLE RECORDED")}</p><h3 id="week-reflection-title" className="mt-1 font-serif text-xl">{titleCase(copy("Sua semana está encerrada.", "Your week is closed."))}</h3></div></div>
      <button type="button" onClick={() => reopenWeek(activeWeek.id)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium hover:bg-accent"><RotateCcw className="size-4" aria-hidden="true" />{t.nav.reopenWeek}</button>
    </div>
    <p className="text-sm leading-relaxed text-muted-foreground">{copy("O que ficou por fazer também faz parte da vida. Você pode reabrir, editar seus registros ou iniciar outro ciclo quando quiser.", "What was left undone is part of life too. You can reopen, edit your notes or begin another cycle whenever you wish.")}</p>
    {activeWeek.aiReviewOutdated && <p role="status" className="rounded-xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground">{copy("Seus registros mudaram depois desta reflexão. O texto abaixo corresponde a uma versão anterior da semana.", "Your notes changed after this reflection. The text below reflects an earlier version of your week.")}</p>}
    {review && <div className="space-y-5 border-t border-border pt-5"><div><p className="eyebrow flex items-center gap-2 text-primary"><Sparkles className="size-3.5" aria-hidden="true" />{copy("REFLEXÃO GERADA POR IA", "AI-GENERATED REFLECTION")}</p><p className="mt-3 text-sm leading-relaxed">{review.summary || review.verdict}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{copy("Esta é uma sugestão automática, pode errar e não avalia sua saúde, personalidade ou valor. Fique apenas com o que fizer sentido.", "This is an automated suggestion. It can be wrong and does not assess your health, personality or worth. Keep only what makes sense.")}</p></div><div className="grid gap-3 sm:grid-cols-2">{groups.filter((group) => group.items?.length).map((group) => <div key={group.title} className="rounded-xl border border-border p-4"><h4 className="mb-3 text-sm font-medium">{titleCase(group.title)}</h4><ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted-foreground">{group.items.map((item, index) => <li key={index}>{item}</li>)}</ul></div>)}</div></div>}
    {aiError && <p role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/20 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{aiError}</p>}
    {demo.enabled ? <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">AI reflections require configured account and server services. This demo never sends its records to an AI provider.</p> : isGeneratingAI ? <p role="status" aria-live="polite" className="flex items-center gap-3 rounded-xl bg-muted p-4 text-sm"><Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />{copy("Preparando uma reflexão opcional para você revisar…", "Preparing an optional reflection for you to review…")}</p> : !showOptions ? <button type="button" onClick={() => { setAIConsent(false); setIncludeTexts(false); setShowOptions(true) }} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-primary hover:bg-accent"><Sparkles className="size-4" aria-hidden="true" />{review ? copy("Criar outra reflexão com IA · opcional", "Create another AI reflection · optional") : copy("Refletir com IA · opcional", "Reflect with AI · optional")}</button> : <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-primary"><ShieldCheck className="size-4" aria-hidden="true" />{titleCase(copy("Escolha o que enviar", "Choose what to send"))}</h4>
      <p className="text-sm leading-relaxed text-muted-foreground">{copy("Ao gerar, o servidor deste app envia ao Google Gemini o cronograma, as atividades e suas marcações. Por padrão, suas anotações pessoais ficam fora desse envio. A IA pode errar e não substitui cuidado profissional.", "When you generate, this app’s server sends the schedule, activities and your checkmarks to Google Gemini. Personal notes are excluded by default. AI can be wrong and does not replace professional care.")}</p>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3"><input type="checkbox" checked={includeTexts} onChange={(event) => { setIncludeTexts(event.target.checked); setAIConsent(false) }} className="mt-1 size-4 shrink-0" /><span className="text-sm leading-relaxed">{copy("Também quero enviar as anotações desta semana. Elas podem conter informações sensíveis de saúde ou crenças.", "I also want to send this week’s notes. They may contain sensitive health or belief information.")}</span></label>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-primary/20 bg-card p-3"><input type="checkbox" checked={aiConsent} onChange={(event) => setAIConsent(event.target.checked)} className="mt-1 size-4 shrink-0" /><span className="text-sm leading-relaxed">{copy("Concordo com o envio dos dados escolhidos ao Google Gemini para esta reflexão e entendo os limites da IA.", "I agree to send the selected data to Google Gemini for this reflection and understand AI’s limits.")}</span></label>
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-medium text-primary underline underline-offset-4">{copy("Privacidade do Google ↗", "Google privacy ↗")}</a>
      <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => { setShowOptions(false); setAIConsent(false) }} className="min-h-11 rounded-xl px-4 text-sm hover:bg-accent">{t.common.cancel}</button><button type="button" onClick={generate} disabled={!aiConsent} className="primary-button"><Sparkles className="size-4" aria-hidden="true" />{copy("Gerar reflexão", "Generate reflection")}</button></div>
    </div>}
  </section>
}
