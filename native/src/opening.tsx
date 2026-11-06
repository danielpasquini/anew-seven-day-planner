import React, { useCallback, useEffect, useState } from "react"
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Svg, { Path } from "react-native-svg"
import { useNativeSound } from "./sound"

const INK = "#416847"
const NATIVE_DRIVER = Platform.OS !== "web"
export function NativeLeaf({ size = 64 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...(Platform.OS === "web" ? { "aria-hidden": true } : { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" as const })}>
    <Path d="M16 46C9 30 21 15 47 10C53 34 40 52 21 48C17 53 14 56 9 58" fill={INK} fillOpacity={.12} />
    <Path d="M17 46C9 30 21 15 47 10C53 34 40 52 21 48" stroke={INK} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M11 55C20 44 26 32 40 20M24 39L22 29M30 31L40 31" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
}
const leaves = [
  { x: 51, y: 192, angle: "-62deg", delay: 1100 }, { x: 145, y: 161, angle: "22deg", delay: 3100 },
  { x: 64, y: 123, angle: "-51deg", delay: 4800 }, { x: 132, y: 89, angle: "20deg", delay: 6100 },
  { x: 88, y: 56, angle: "-47deg", delay: 7000 }, { x: 116, y: 27, angle: "-13deg", delay: 7550 },
]

export function NativeOpening({ children, replay = 0, firstVisit }: { children: React.ReactNode; replay?: number; firstVisit?: boolean }) {
  const openingKey = `${replay}-${firstVisit === undefined ? "device" : firstVisit ? "first" : "returning"}`
  const [completedKey, setCompletedKey] = useState<string | null>(null)
  const finish = useCallback(() => setCompletedKey(openingKey), [openingKey])
  const done = completedKey === openingKey || (replay > 0 && firstVisit !== true)
  return <View style={{ flex: 1 }}><View style={{ flex: 1, display: done ? "flex" : "none" }}>{children}</View>{!done && <NativeOpeningSequence key={openingKey} firstVisit={firstVisit} onDone={finish} />}</View>
}

function NativeOpeningSequence({ firstVisit, onDone }: { firstVisit?: boolean; onDone: () => void }) {
  const [ready, setReady] = useState(false)
  const [first, setFirst] = useState(true)
  const [reduced, setReduced] = useState(false)
  const [stem] = useState(() => new Animated.Value(0))
  const [opacity] = useState(() => new Animated.Value(1))
  const [growth] = useState(() => leaves.map(() => new Animated.Value(0)))
  const sound = useNativeSound()
  const { stop } = sound
  const finish = useCallback(() => { stop(); onDone() }, [stop, onDone])
  useEffect(() => {
    let alive = true
    void Promise.all([firstVisit === undefined ? AsyncStorage.getItem("anew-native-opened-v1") : Promise.resolve(null), AccessibilityInfo.isReduceMotionEnabled()]).then(([seen, reduce]) => {
      if (!alive) return
      setFirst(firstVisit ?? !seen); setReduced(reduce); setReady(true)
      if (firstVisit === undefined) void AsyncStorage.setItem("anew-native-opened-v1", "1").catch(() => {})
    }).catch(() => { if (alive) { setReduced(true); setReady(true) } })
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced)
    return () => { alive = false; sub.remove() }
  }, [firstVisit])
  useEffect(() => {
    if (!ready) return
    const length = reduced ? 100 : first ? 1200 : 800
    if (first && !reduced) {
      Animated.timing(stem, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }).start()
      growth.forEach((value, index) => Animated.sequence([
        Animated.delay(Math.min(leaves[index].delay, 600)),
        Animated.timing(value, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER }),
      ]).start())
    }
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: reduced ? 0 : 350, useNativeDriver: NATIVE_DRIVER }).start(({ finished }) => { if (finished) finish() })
    }, Math.max(0, length - 350))
    return () => { clearTimeout(timer); stem.stopAnimation(); growth.forEach(v => v.stopAnimation()); opacity.stopAnimation() }
  }, [ready, first, reduced, stem, growth, opacity, finish])
  return <Animated.View style={[styles.screen, StyleSheet.absoluteFill, { opacity }]}>
    <View style={styles.paper} accessibilityLabel={first ? "A branch slowly growing leaves" : "Anew leaf on ivory paper"}>
      <View style={styles.paperLine} />
      {first && !reduced ? <View style={{ width: 250, height: 300 }}>
        <Animated.View style={{ position: "absolute", left: 121, top: 24, width: 7, height: 248, opacity: stem, transform: [{ scaleY: stem }] }}>
          <Svg width={7} height={248} viewBox="0 0 7 248"><Path d="M3 245C-1 183 7 109 3 3" stroke={INK} strokeWidth={2} strokeLinecap="round" /></Svg>
        </Animated.View>
        {leaves.map((leaf, i) => <Animated.View key={i} style={{ position: "absolute", left: leaf.x, top: leaf.y, opacity: growth[i], transform: [{ rotate: leaf.angle }, { scale: growth[i] }] }}><NativeLeaf size={65 - i * 3} /></Animated.View>)}
      </View> : <View style={{ padding: 45 }}><NativeLeaf size={114} /></View>}
    </View>
    <Text accessibilityRole="header" style={styles.brand}>Anew.</Text>
    <Text style={styles.tagline}>Seven days. Small steps. Your pace.</Text>
    <View style={{ gap: 8, marginTop: 28 }}>
      <Pressable accessibilityRole="button" onPress={() => { sound.toggle(); if (!sound.enabled) sound.opening() }} style={styles.control}><Text style={styles.controlText}>{sound.enabled ? "Sound on · Mute" : "Add gentle sound"}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={finish} style={styles.control}><Text style={styles.controlText}>Skip introduction</Text></Pressable>
    </View>
  </Animated.View>
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7f6f0", alignItems: "center", justifyContent: "center", padding: 24 },
  paper: { backgroundColor: "#fffef9", borderColor: "#e3e2d8", borderWidth: 1, borderRadius: 5, padding: 9, transform: [{ rotate: "-3deg" }], shadowColor: "#4d593e", shadowOffset: { width: 0, height: 12 }, shadowOpacity: .08, shadowRadius: 22, elevation: 3 },
  paperLine: { position: "absolute", left: 16, right: 16, top: 18, height: 1, backgroundColor: "#f0eee4" },
  brand: { fontFamily: "serif", color: "#263a2d", fontSize: 46, marginTop: 26, letterSpacing: -2 },
  tagline: { color: "#637069", fontSize: 14, lineHeight: 22, marginTop: 7, textAlign: "center" },
  control: { minHeight: 44, padding: 12, justifyContent: "center", alignItems: "center" },
  controlText: { color: "#416847", fontSize: 13, lineHeight: 20 },
})
