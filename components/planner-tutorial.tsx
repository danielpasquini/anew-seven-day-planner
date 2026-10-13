"use client"

import { titleCase } from "@/lib/title-case"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, CalendarDays, X } from "lucide-react"
import { useModalAccessibility } from "@/components/modal-accessibility"

export function PlannerTutorial({ isOpen, onClose, en }: { isOpen: boolean; onClose: () => void; en: boolean }) {
  const [step, setStep] = useState(0)
  const dialogRef = useModalAccessibility(isOpen, onClose)
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (isOpen) setStep(0) }, [isOpen])
  useEffect(() => { if (isOpen) headingRef.current?.focus({ preventScroll: true }) }, [isOpen, step])
  if (!isOpen) return null
  const copy = (pt: string, english: string) => en ? english : pt
  const steps = [
    { title: copy("Sete Dias, Pequenos Passos", "Seven Days, Small Steps"), text: copy("Anew é um planejador de sete dias. Comece com um pequeno passo por dia, ajuste ao seu tempo e deixe espaço para descansar.", "Anew is a seven-day planner. Start with one small step per day, fit it to your time and leave room to rest."), hint: copy("O primeiro exemplo é uma prévia. Escolha Usar Esta Semana quando quiser começar.", "Your first example is a preview. Choose Use This Week whenever you are ready to begin.") },
    { title: copy("Uma Semana Pronta, Sem IA", "A Ready-Made Week, Without AI"), text: copy("Use o botão Escolher Outra Semana para encontrar um começo leve, equilíbrio cotidiano, um objetivo pessoal ou uma semana vazia.", "Use the Choose Another Week button to find a gentle start, everyday balance, one personal goal or a blank week."), hint: copy("Os modelos funcionam sem IA. Não é necessário responder um questionário.", "Presets work without AI. You do not need to complete a questionnaire.") },
    { title: copy("Seus Dias Podem Mudar", "Your Days Can Change"), text: copy("Depois de usar a semana, marque um passo quando fizer sentido. Acrescente, edite, remova ou reorganize atividades pelos controles de cada dia.", "After you use the week, mark a step whenever it makes sense. Add, edit, remove or reorder activities with each day’s controls."), hint: copy("Pular um passo ou descansar também é uma escolha. Não há obrigação de completar tudo.", "Skipping a step or resting is also a choice. You do not have to complete everything.") },
    { title: copy("Seções e Campos do Seu Jeito", "Sections and Fields Your Way"), text: copy("Abra Personalizar Seções para escolher títulos e perguntas, adicionar campos e remover o que não ajuda. As anotações ficam em seções recolhidas.", "Open Customize Sections to choose titles and questions, add fields and remove what does not help. Notes stay in collapsed sections."), hint: copy("Você pode usar só os dias do planejador. As respostas e outras semanas são preservadas ao editar.", "You can use just the planner days. Answers and other weeks are preserved when you edit.") },
    { title: copy("Mais Ajuda, Quando Quiser", "More Help, When You Want It"), text: copy("Ao criar uma semana, a IA pode sugerir textos ou um plano, se você escolher compartilhar preferências. Recursos, privacidade e este tutorial ficam em Mais.", "When creating a week, AI can suggest text or a plan if you choose to share preferences. Resources, privacy and this tutorial are in More."), hint: copy("Tudo isso é opcional. Seu planejador funciona com os modelos prontos e suas próprias escolhas.", "All of this is optional. Your planner works with ready-made weeks and your own choices.") },
  ]
  return <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="planner-tutorial-title" aria-describedby="planner-tutorial-text" className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5">
    <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
    <div className="relative max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-2xl sm:p-8">
      <div className="flex items-center justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="size-6" aria-hidden="true" /></span><button type="button" onClick={onClose} className="icon-button" aria-label={copy("Fechar Tutorial", "Close Tutorial")}><X className="size-5" aria-hidden="true" /></button></div>
      <p className="eyebrow mt-6 text-primary">{copy("GUIA RÁPIDO", "QUICK TOUR")} · {step + 1} / {steps.length}</p>
      <h2 ref={headingRef} tabIndex={-1} id="planner-tutorial-title" className="mt-3 font-serif text-2xl outline-none sm:text-3xl" aria-live="polite">{titleCase(steps[step].title)}</h2>
      <p id="planner-tutorial-text" className="mt-4 leading-relaxed text-muted-foreground">{steps[step].text}</p>
      <p className="mt-5 rounded-xl bg-primary/5 p-4 text-sm leading-relaxed">{steps[step].hint}</p>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2"><button type="button" onClick={onClose} className="min-h-11 rounded-xl px-3 text-sm text-muted-foreground hover:bg-accent">{copy("Pular Tutorial", "Skip Tour")}</button><div className="flex gap-2">{step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="icon-button border border-border" aria-label={copy("Etapa Anterior", "Previous Step")}><ArrowLeft className="size-4" aria-hidden="true" /></button>}<button type="button" onClick={() => step === steps.length - 1 ? onClose() : setStep(step + 1)} className="primary-button">{step === steps.length - 1 ? copy("Ir para Minha Semana", "Go to My Week") : copy("Próximo", "Next")}<ArrowRight className="size-4" aria-hidden="true" /></button></div></div>
    </div>
  </div>
}
