import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import { AccessibilityInfo, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useNativeSound } from "./sound"
import { Button, Copy, useColors } from "./ui"

export type NativeTourStep = {
  title: string
  copy: string
  target: React.RefObject<View | null>
  inScroll?: boolean
}
type Rect = { x: number; y: number; width: number; height: number }
const seenDemoSessions = new Set<number>()
const measure = (view: View) => new Promise<Rect>((resolve) => view.measureInWindow((x, y, width, height) => resolve({ x, y, width, height })))
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
const focus = (view: View | Text | null) => {
  if (!view) return
  if (Platform.OS === "web") view.focus()
  else AccessibilityInfo.sendAccessibilityEvent(view, "focus")
}

/** A real pressable ref is used for both the spotlight and focus restoration. */
export function NativeTourButton({ targetRef, title, onPress, variant = "outline", disabled }: {
  targetRef: React.RefObject<View | null>; title: string; onPress: () => void; variant?: "outline" | "quiet"; disabled?: boolean
}) {
  const c = useColors(), sound = useNativeSound()
  return <Pressable ref={targetRef} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={() => { sound.tap(); onPress() }} style={({ pressed }) => ({ minHeight: 48, borderRadius: 14, paddingHorizontal: 17, paddingVertical: 13, alignItems: "center", justifyContent: "center", backgroundColor: variant === "outline" ? c.paper : "transparent", borderColor: c.line, borderWidth: variant === "outline" ? 1 : 0, opacity: disabled ? .4 : pressed ? .7 : 1 })}><Text style={{ color: c.primary, fontSize: 14, fontWeight: "600", lineHeight: 21, textAlign: "center" }}>{title}</Text></Pressable>
}

export function NativePlannerTutorial({ owner, enabled, steps, scrollRef, contentRef, returnFocusRef, replay, autoStart = true, demoSession = 0 }: {
  owner: string; enabled: boolean; steps: NativeTourStep[]; scrollRef: React.RefObject<ScrollView | null>; contentRef: React.RefObject<View | null>
  returnFocusRef?: React.RefObject<View | null>; replay: number; autoStart?: boolean; demoSession?: number
}) {
  const c = useColors(), insets = useSafeAreaInsets(), window = useWindowDimensions()
  const [visible, setVisible] = useState(replay > 0 || (owner === "demo" && autoStart && !seenDemoSessions.has(demoSession)))
  const [step, setStep] = useState(0), [measured, setMeasured] = useState<{ target: NativeTourStep; rect: Rect } | null>(null), [cardHeight, setCardHeight] = useState(300), [layout, setLayout] = useState(0)
  const rootRef = useRef<View | null>(null), titleRef = useRef<Text | null>(null), dismissed = useRef(false)
  const current = steps[Math.min(step, steps.length - 1)]
  const rect = measured?.target === current ? measured.rect : null
  const open = visible && enabled && !!current

  useEffect(() => {
    if (!enabled || !autoStart || dismissed.current || replay > 0) return
    if (owner === "demo") return
    let active = true
    void AsyncStorage.getItem(`anew-native-planner-tutorial-v1:${owner}`).then((seen) => {
      if (active && !dismissed.current && seen !== "seen") { setStep(0); setVisible(true) }
    }).catch(() => {})
    return () => { active = false }
  }, [owner, enabled, autoStart, replay, demoSession])

  useLayoutEffect(() => {
    if (!open || !current) return
    let active = true
    const position = async () => {
      await nextFrame()
      const target = current.target.current
      if (!active || !target) return
      const initial = await measure(target)
      if (current.inScroll !== false && contentRef.current && scrollRef.current) {
        const content = await measure(contentRef.current)
        if (!active) return
        // Immediate movement respects reduced motion and makes the real control visible.
        scrollRef.current.scrollTo({ y: Math.max(0, initial.y - content.y - 24), animated: false })
        await nextFrame()
      }
      await nextFrame()
      if (!active || !rootRef.current || !current.target.current) return
      const [targetRect, rootRect] = await Promise.all([measure(current.target.current), measure(rootRef.current)])
      if (!active) return
      const x = Math.max(8, targetRect.x - rootRect.x - 5), y = Math.max(0, targetRect.y - rootRect.y - 5)
      const width = Math.min(targetRect.width + 10, window.width - x - 8), height = Math.min(targetRect.height + 10, window.height - y)
      if (width > 0 && height > 0 && targetRect.width > 0 && targetRect.height > 0) setMeasured({ target: current, rect: { x, y, width, height } })
      focus(titleRef.current)
    }
    void position().catch(() => { /* Skip and close remain available if a control cannot be measured. */ })
    return () => { active = false }
  }, [open, current, contentRef, scrollRef, window.width, window.height, layout])

  const close = () => {
    dismissed.current = true
    setVisible(false)
    if (owner === "demo") seenDemoSessions.add(demoSession)
    else void AsyncStorage.setItem(`anew-native-planner-tutorial-v1:${owner}`, "seen").catch(() => {})
    requestAnimationFrame(() => focus(returnFocusRef?.current ?? current?.target.current ?? null))
  }
  const topLimit = Math.max(insets.top + 12, 16), bottomLimit = window.height - Math.max(insets.bottom + 12, 16)
  const preferredTop = rect ? rect.y + rect.height + 12 + cardHeight <= bottomLimit ? rect.y + rect.height + 12 : rect.y - cardHeight - 12 : topLimit
  const cardTop = Math.max(topLimit, Math.min(preferredTop, bottomLimit - cardHeight))
  const cardWidth = Math.min(420, window.width - 32), cardLeft = Math.max(16, Math.min(rect?.x ?? 16, window.width - cardWidth - 16))
  const shade = "#15231899"
  return <Modal visible={open} transparent animationType="none" onRequestClose={close} onShow={() => setLayout((value) => value + 1)}>
    <View ref={rootRef} style={StyleSheet.absoluteFill} onLayout={() => setLayout((value) => value + 1)}>
      {rect ? <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: rect.y, backgroundColor: shade }} />
        <View style={{ position: "absolute", top: rect.y, left: 0, width: rect.x, height: rect.height, backgroundColor: shade }} />
        <View style={{ position: "absolute", top: rect.y, left: rect.x + rect.width, right: 0, height: rect.height, backgroundColor: shade }} />
        <View style={{ position: "absolute", top: rect.y + rect.height, left: 0, right: 0, bottom: 0, backgroundColor: shade }} />
        <View testID="native-tour-spotlight" style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.width, height: rect.height, borderWidth: 3, borderColor: c.primary, borderRadius: 17 }} />
      </View> : <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: shade }]} />}
      <View role="dialog" accessibilityLabel={`Quick Tour: ${current?.title ?? "Your Week"}`} accessibilityViewIsModal onAccessibilityEscape={close} onLayout={(event) => setCardHeight(event.nativeEvent.layout.height)} style={{ position: "absolute", top: cardTop, left: cardLeft, width: cardWidth, maxHeight: bottomLimit - topLimit, borderRadius: 20, borderWidth: 1, borderColor: c.line, backgroundColor: c.paper }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 19, gap: 12 }}>
          <Copy small muted>QUICK TOUR · {Math.min(step + 1, steps.length)} / {steps.length}</Copy>
          <Text ref={titleRef} accessible accessibilityRole="header" tabIndex={Platform.OS === "web" ? -1 : undefined} style={{ color: c.ink, fontSize: 25, lineHeight: 33, fontFamily: Platform.OS === "ios" ? "Georgia" : "serif" }}>{current?.title}</Text>
          <Copy>{current?.copy}</Copy>
          <Button title="Close Tutorial" variant="quiet" onPress={close} />
          {step > 0 && <Button title="Back" variant="outline" onPress={() => setStep((value) => value - 1)} />}
          <Button title="Skip Tour" variant="quiet" onPress={close} />
          <Button title={step >= steps.length - 1 ? "Done" : "Next"} onPress={() => step >= steps.length - 1 ? close() : setStep((value) => value + 1)} />
        </ScrollView>
      </View>
    </View>
  </Modal>
}
