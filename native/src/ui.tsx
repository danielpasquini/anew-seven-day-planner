import React, { createContext, useContext, useEffect, useState } from "react"
import { AccessibilityInfo, ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from "react-native"
import { titleCase } from "../../lib/title-case"
import { useNativeSound } from "./sound"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const light = { background: "#f7f6f0", paper: "#fffef9", ink: "#263a2d", muted: "#637069", primary: "#285238", onPrimary: "#ffffff", line: "#dce1d7", soft: "#eaf0e5", gold: "#9b7841", danger: "#a63f35" }
const dark = { background: "#17231c", paper: "#213028", ink: "#f0f2e8", muted: "#b6c1b6", primary: "#b4cea8", onPrimary: "#1c2d21", line: "#405045", soft: "#2c4031", gold: "#d8bb86", danger: "#ffb4a8" }
const Theme = createContext(light)
export const titleFont = Platform.OS === "ios" ? "Georgia" : "serif"
export function UITheme({ dark: isDark, children }: { dark?: boolean; children: React.ReactNode }) { return <Theme.Provider value={isDark ? dark : light}>{children}</Theme.Provider> }
export function useColors() { return useContext(Theme) }

export function Copy({ children, small, muted, strong, selectable, style, accessibilityRole }: { children: React.ReactNode; small?: boolean; muted?: boolean; strong?: boolean; selectable?: boolean; style?: StyleProp<TextStyle>; accessibilityRole?: "header" | "text" | "alert" }) {
  const c = useColors()
  return <Text selectable={selectable} accessibilityRole={accessibilityRole} accessibilityLiveRegion={accessibilityRole === "alert" ? "polite" : undefined} style={[{ color: muted ? c.muted : c.ink, fontSize: small ? 13 : 16, lineHeight: small ? 20 : 25, fontWeight: strong ? "600" : "400" }, style]}>{children}</Text>
}
export function Title({ children, small = false }: { children: React.ReactNode; small?: boolean }) {
  const c = useColors()
  return <Text accessibilityRole="header" style={{ fontFamily: titleFont, fontSize: small ? 25 : 35, lineHeight: small ? 33 : 43, letterSpacing: -.7, color: c.ink }}>{React.Children.map(children, (child) => typeof child === "string" ? titleCase(child) : child)}</Text>
}
export function Eyebrow({ children }: { children: React.ReactNode }) { const c = useColors(); return <Text style={{ color: c.primary, fontSize: 11, letterSpacing: 1.8, fontWeight: "600", lineHeight: 19 }}>{children}</Text> }
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) { const c = useColors(); return <View style={[{ backgroundColor: c.paper, borderColor: c.line, borderWidth: 1, borderRadius: 20, padding: 19, gap: 12 }, style]}>{children}</View> }
export function Button({ title, onPress, variant = "primary", disabled, accessibilityLabel }: { title: string; onPress: () => void; variant?: "primary" | "quiet" | "outline" | "danger"; disabled?: boolean; accessibilityLabel?: string }) {
  const c = useColors(), sound = useNativeSound()
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || title} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={() => { sound.tap(); onPress() }} style={({ pressed }) => ({ minHeight: 48, borderRadius: 14, paddingHorizontal: 17, paddingVertical: 13, alignItems: "center", justifyContent: "center", backgroundColor: variant === "primary" ? c.primary : variant === "danger" ? c.danger : variant === "outline" ? c.paper : "transparent", borderColor: c.line, borderWidth: variant === "outline" ? 1 : 0, opacity: disabled ? .4 : pressed ? .7 : 1 })}><Text style={{ color: variant === "primary" || variant === "danger" ? c.onPrimary : c.primary, fontSize: 14, fontWeight: "600", lineHeight: 21, textAlign: "center" }}>{title}</Text></Pressable>
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const c = useColors()
  return <View style={{ gap: 7 }}><Copy small strong>{label}</Copy><TextInput accessibilityLabel={label} placeholderTextColor={c.muted} {...props} style={[{ color: c.ink, backgroundColor: c.paper, borderColor: c.line, borderWidth: 1, borderRadius: 13, minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, textAlignVertical: props.multiline ? "top" : "center", opacity: props.editable === false ? .6 : 1 }, props.multiline && { minHeight: 100 }, props.style]} /></View>
}
export function CheckRow({ label, checked, onPress, disabled }: { label: string; checked: boolean; onPress: () => void; disabled?: boolean }) {
  const c = useColors(), sound = useNativeSound()
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked, disabled: !!disabled }} onPress={() => { sound.tap(); onPress() }} disabled={disabled} style={({ pressed }) => ({ minHeight: 48, flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12, paddingHorizontal: 13, borderColor: checked ? c.primary : c.line, borderWidth: 1, borderRadius: 13, backgroundColor: checked ? c.soft : c.paper, opacity: disabled ? .5 : pressed ? .7 : 1 })}><View style={{ width: 21, height: 21, borderRadius: 6, borderWidth: 1, borderColor: c.primary, backgroundColor: checked ? c.primary : "transparent", alignItems: "center", justifyContent: "center", marginTop: 2 }}><Text style={{ color: c.onPrimary, fontSize: 14 }}>{checked ? "✓" : ""}</Text></View><Text style={{ flex: 1, fontSize: 14, color: c.ink, lineHeight: 22 }}>{label}</Text></Pressable>
}
export function Pill({ title, selected, onPress }: { title: string; selected?: boolean; onPress: () => void }) { const c = useColors(), sound = useNativeSound(); return <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} {...(Platform.OS === "web" ? { "aria-pressed": !!selected } : {})} onPress={() => { sound.tap(); onPress() }} style={({ pressed }) => ({ minHeight: 44, paddingHorizontal: 14, paddingVertical: 11, borderColor: selected ? c.primary : c.line, borderWidth: 1, borderRadius: 22, backgroundColor: selected ? c.soft : c.paper, opacity: pressed ? .7 : 1 })}><Text style={{ color: selected ? c.primary : c.muted, fontSize: 13, fontWeight: selected ? "600" : "400", lineHeight: 20 }}>{title}</Text></Pressable> }
export function Page({ children }: { children: React.ReactNode }) { const c = useColors(); return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 23, paddingBottom: 35, gap: 18 }}><View style={{ width: "100%", maxWidth: 700, alignSelf: "center", gap: 18 }}>{children}</View></ScrollView></KeyboardAvoidingView> }
export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const c = useColors(), insets = useSafeAreaInsets()
  const [reduced, setReduced] = useState(true)
  useEffect(() => {
    let active = true
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduced(value) }).catch(() => {})
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced)
    return () => { active = false; subscription.remove() }
  }, [])
  return <Modal visible={visible} transparent animationType={reduced ? "none" : "fade"} onRequestClose={onClose}><KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#15231899", justifyContent: "flex-end", paddingTop: Math.max(insets.top, 25) }} behavior={Platform.OS === "ios" ? "padding" : undefined}><View accessibilityViewIsModal style={{ maxHeight: "95%", backgroundColor: c.background, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: Math.max(insets.bottom, 16), paddingHorizontal: 20, maxWidth: 760, alignSelf: "center", width: "100%" }}><View style={{ paddingTop: 17, paddingBottom: 10, gap: 9 }}><View style={{ width: 34, height: 4, backgroundColor: c.line, borderRadius: 9, alignSelf: "center" }} /><View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}><View style={{ flex: 1 }}><Title small>{title}</Title></View><Button title="Close" onPress={onClose} variant="quiet" /></View></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 22, gap: 17 }}>{children}</ScrollView></View></KeyboardAvoidingView></Modal>
}
export function Busy({ label = "Opening your space…" }: { label?: string }) { const c = useColors(); return <View style={{ flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center", padding: 24, gap: 20 }}><ActivityIndicator color={c.primary} /><Copy muted>{label}</Copy></View> }
export const shared = StyleSheet.create({ row: { flexDirection: "row", alignItems: "center", gap: 10 }, wrap: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, stack: { gap: 12 }, spread: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 } })
