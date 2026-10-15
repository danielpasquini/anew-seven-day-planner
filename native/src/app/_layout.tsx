import React, { useEffect, useState } from "react"
import { AccessibilityInfo, Platform, Pressable, Text, View } from "react-native"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { NativeAuthProvider } from "../session"
import { NativeAppProvider, useNativeApp } from "../state"
import { UITheme, useColors } from "../ui"
import { NativeOpening } from "../opening"
import { NativeSoundProvider, useNativeSound } from "../sound"

function SoundControl() {
  const { enabled, toggle } = useNativeSound()
  const c = useColors()
  return <View style={{ alignItems: "flex-end", paddingHorizontal: 20, backgroundColor: c.background }}><Pressable accessibilityRole="switch" accessibilityLabel="Gentle sounds" accessibilityState={{ checked: enabled }} {...(Platform.OS === "web" ? { "aria-checked": enabled } : {})} onPress={toggle} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 8 }}><Text style={{ color: c.primary, fontSize: 12 }}>{enabled ? "Gentle sounds · On" : "Gentle sounds · Off"}</Text></Pressable></View>
}
function NativeCanvas() {
  const [reduced, setReduced] = useState(false)
  const c = useColors(), app = useNativeApp()
  const { mute } = useNativeSound()
  useEffect(() => { if (app.demoEpoch > 0) mute() }, [app.demoEpoch, mute])
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced)
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced)
    return () => sub.remove()
  }, [])
  return <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top"]}>
      <StatusBar style={app.theme === "dark" ? "light" : "dark"} />
      <NativeOpening replay={app.demoEpoch} firstVisit={app.demo ? app.demoScenario === "first-visit" : undefined}>
        <SoundControl />
        <Stack screenOptions={{ headerShown: false, animation: reduced ? "none" : "fade", animationDuration: 450, contentStyle: { backgroundColor: c.background } }} />
      </NativeOpening>
    </SafeAreaView>
}
function NativeTheme() { const app = useNativeApp(); return <UITheme dark={app.theme === "dark"}><NativeCanvas /></UITheme> }
export default function RootLayout() {
  return <SafeAreaProvider><NativeSoundProvider><NativeAuthProvider><NativeAppProvider><NativeTheme /></NativeAppProvider></NativeAuthProvider></NativeSoundProvider></SafeAreaProvider>
}
