"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, ArrowRight, X } from "lucide-react"
import { titleCase } from "@/lib/title-case"
import { useModalAccessibility } from "@/components/modal-accessibility"

export type PlannerTourStep = { target: string; title: string; text: string }

type ResolvedStep = PlannerTourStep & { index: number; element: HTMLElement }
type TourLayout = {
  left: number; top: number; width: number; height: number
  cardLeft: number; cardTop: number; cardWidth: number; cardMaxHeight: number
  pointerLeft: number; pointerTop: number
}

const EDGE = 12
const GAP = 14
const HIGHLIGHT_PADDING = 6
const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), Math.max(minimum, maximum))

function findTarget(selector: string) {
  try {
    return Array.from(document.querySelectorAll<HTMLElement>(selector)).find((element) => {
      if (!element.isConnected || !element.getClientRects().length || element.closest("[hidden], [inert]")) return false
      const rect = element.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return false
      for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent)
        if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || style.opacity === "0") return false
      }
      return true
    })
  } catch {
    return undefined
  }
}

export function PlannerTutorial({ isOpen, onClose, en, steps }: {
  isOpen: boolean; onClose: () => void; en: boolean; steps: PlannerTourStep[]
}) {
  const [mounted, setMounted] = useState(false)
  const [available, setAvailable] = useState<ResolvedStep[]>([])
  const [stepIndex, setStepIndex] = useState(0)
  const [layout, setLayout] = useState<TourLayout | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const closeRef = useRef(onClose)
  const requestedClose = useRef(false)
  closeRef.current = onClose
  const position = Math.max(0, available.findIndex((item) => item.index === stepIndex))
  const step = available[position]
  const active = mounted && isOpen && !!step
  const dialogRef = useModalAccessibility(active, onClose)
  const copy = (pt: string, english: string) => en ? english : pt

  useEffect(() => { setMounted(true) }, [])

  useLayoutEffect(() => {
    if (!mounted || !isOpen) {
      requestedClose.current = false
      setAvailable([])
      setLayout(null)
      return
    }
    setStepIndex(0)
    let frame = 0
    const resolve = () => {
      const next = steps.flatMap((item, index) => {
        const element = findTarget(item.target)
        return element ? [{ ...item, index, element }] : []
      })
      setAvailable((previous) => previous.length === next.length && previous.every((item, index) =>
        item.index === next[index].index && item.element === next[index].element && item.title === next[index].title && item.text === next[index].text,
      ) ? previous : next)
      setStepIndex((previous) => next.find((item) => item.index >= previous)?.index ?? next.at(-1)?.index ?? 0)
      if (!next.length && !requestedClose.current) {
        requestedClose.current = true
        closeRef.current()
      }
    }
    const scheduleResolve = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(resolve)
    }
    resolve()
    const observer = new MutationObserver(scheduleResolve)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden", "open", "aria-hidden"] })
    window.addEventListener("resize", scheduleResolve)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("resize", scheduleResolve)
    }
  }, [mounted, isOpen, steps])

  useLayoutEffect(() => {
    if (!active || !step) return
    let frame = 0
    const measure = () => {
      if (!step.element.isConnected || !findTarget(step.target)) {
        setLayout(null)
        return
      }
      const viewport = window.visualViewport
      const viewLeft = viewport?.offsetLeft ?? 0
      const viewTop = viewport?.offsetTop ?? 0
      const viewWidth = viewport?.width ?? window.innerWidth
      const viewHeight = viewport?.height ?? window.innerHeight
      const viewRight = viewLeft + viewWidth
      const viewBottom = viewTop + viewHeight
      const target = step.element.getBoundingClientRect()
      const left = clamp(target.left - HIGHLIGHT_PADDING, viewLeft + EDGE, viewRight - EDGE)
      const top = clamp(target.top - HIGHLIGHT_PADDING, viewTop + EDGE, viewBottom - EDGE)
      const right = clamp(target.right + HIGHLIGHT_PADDING, left, viewRight - EDGE)
      const bottom = clamp(target.bottom + HIGHLIGHT_PADDING, top, viewBottom - EDGE)
      const cardWidth = Math.min(360, Math.max(0, viewWidth - EDGE * 2))
      const cardLeft = clamp(target.left + target.width / 2 - cardWidth / 2, viewLeft + EDGE, viewRight - EDGE - cardWidth)
      const naturalHeight = cardRef.current?.scrollHeight ?? 240
      const belowSpace = Math.max(0, viewBottom - EDGE - bottom - GAP)
      const aboveSpace = Math.max(0, top - GAP - viewTop - EDGE)
      const below = belowSpace >= naturalHeight || belowSpace >= aboveSpace
      const cardMaxHeight = below ? belowSpace : aboveSpace
      const cardHeight = Math.min(naturalHeight, cardMaxHeight)
      const cardTop = below ? bottom + GAP : top - GAP - cardHeight
      const next = {
        left, top, width: right - left, height: bottom - top,
        cardLeft, cardTop, cardWidth, cardMaxHeight,
        pointerLeft: clamp(target.left + target.width / 2 - 5, cardLeft + 20, cardLeft + cardWidth - 30),
        pointerTop: below ? cardTop - 5 : cardTop + cardHeight - 5,
      }
      setLayout((previous) => previous && Object.keys(next).every((key) => previous[key as keyof TourLayout] === next[key as keyof TourLayout]) ? previous : next)
    }
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    // Programmatic instant scrolling still works while the modal hook locks user scrolling.
    step.element.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" })
    measure()
    scheduleMeasure()
    const observer = new ResizeObserver(scheduleMeasure)
    observer.observe(step.element)
    if (cardRef.current) observer.observe(cardRef.current)
    window.addEventListener("scroll", scheduleMeasure, true)
    window.addEventListener("resize", scheduleMeasure)
    window.visualViewport?.addEventListener("resize", scheduleMeasure)
    window.visualViewport?.addEventListener("scroll", scheduleMeasure)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("scroll", scheduleMeasure, true)
      window.removeEventListener("resize", scheduleMeasure)
      window.visualViewport?.removeEventListener("resize", scheduleMeasure)
      window.visualViewport?.removeEventListener("scroll", scheduleMeasure)
    }
  }, [active, step])

  useEffect(() => {
    if (!active) return
    const frame = requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(frame)
  }, [active, step?.index])

  if (!active || !step) return null
  return createPortal(
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="planner-tutorial-title" aria-describedby="planner-tutorial-text" className="fixed inset-0 z-[60] outline-none" data-planner-tour="true" data-planner-tour-target={step.target}>
      <div className="absolute inset-0" aria-hidden="true" />
      {layout && <>
        <div aria-hidden="true" className="fixed left-0 right-0 top-0 bg-foreground/20" style={{ height: layout.top }} />
        <div aria-hidden="true" className="fixed bottom-0 left-0 right-0 bg-foreground/20" style={{ top: layout.top + layout.height }} />
        <div aria-hidden="true" className="fixed left-0 bg-foreground/20" style={{ top: layout.top, width: layout.left, height: layout.height }} />
        <div aria-hidden="true" className="fixed right-0 bg-foreground/20" style={{ top: layout.top, left: layout.left + layout.width, height: layout.height }} />
        <div data-planner-tour-highlight aria-hidden="true" className="pointer-events-none fixed rounded-xl border-2 border-primary shadow-[0_0_0_2px_var(--background)]" style={{ left: layout.left, top: layout.top, width: layout.width, height: layout.height }} />
        <div aria-hidden="true" className="pointer-events-none fixed size-2.5 rotate-45 border border-border bg-card" style={{ left: layout.pointerLeft, top: layout.pointerTop }} />
      </>}
      <div data-planner-tour-card ref={cardRef} className="fixed overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-xl" style={{ left: layout?.cardLeft ?? EDGE, top: layout?.cardTop ?? EDGE, width: layout?.cardWidth ?? "min(360px, calc(100vw - 24px))", maxHeight: layout?.cardMaxHeight, visibility: layout ? "visible" : "hidden" }}>
        <div className="flex items-center justify-between gap-3"><p className="eyebrow text-primary">{copy("GUIA RÁPIDO", "QUICK TOUR")} · {position + 1} / {available.length}</p><button type="button" onClick={onClose} className="icon-button shrink-0" aria-label={copy("Fechar Tutorial", "Close Tutorial")}><X className="size-4" aria-hidden="true" /></button></div>
        <h2 ref={headingRef} tabIndex={-1} id="planner-tutorial-title" className="mt-2 font-serif text-xl leading-snug outline-none" aria-live="polite">{titleCase(step.title)}</h2>
        <p id="planner-tutorial-text" className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><button type="button" onClick={onClose} className="min-h-11 rounded-xl px-2 text-sm text-muted-foreground hover:bg-accent">{copy("Pular Tutorial", "Skip Tour")}</button><div className="flex gap-2">{position > 0 && <button type="button" onClick={() => setStepIndex(available[position - 1].index)} className="icon-button border border-border" aria-label={copy("Etapa Anterior", "Previous Step")}><ArrowLeft className="size-4" aria-hidden="true" /></button>}<button type="button" onClick={() => position === available.length - 1 ? onClose() : setStepIndex(available[position + 1].index)} className="primary-button">{position === available.length - 1 ? copy("Concluir", "Done") : copy("Próximo", "Next")}<ArrowRight className="size-4" aria-hidden="true" /></button></div></div>
      </div>
    </div>, document.body,
  )
}
