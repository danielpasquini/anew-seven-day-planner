import React, { useState } from "react"
import { router } from "expo-router"
import type { DemoScenario } from "../../lib/demo-data"
import { useNativeApp, useNativeAuth } from "./state"
import { useNativeSound } from "./sound"
import { Button, Card, Copy, Eyebrow, Title } from "./ui"

/** Test workspaces stay in memory; account identity and saved records are untouched. */
export function NativeTestAccess({ onStart }: { onStart?: () => void }) {
  const app = useNativeApp(), auth = useNativeAuth(), sound = useNativeSound()
  const [starting, setStarting] = useState(false)
  const [entryFailed, setEntryFailed] = useState(false)
  if (!app.demoAvailable) return null
  const start = async (scenario: DemoScenario) => {
    if (auth.pending || starting) return
    setStarting(true); setEntryFailed(false)
    try {
      if (await app.startDemo(undefined, scenario)) { sound.mute(); onStart?.(); router.replace(scenario === "first-visit" ? "/" : "/guide") }
      else setEntryFailed(true)
    } finally { setStarting(false) }
  }
  return <Card><Eyebrow>TEST ACCESS</Eyebrow><Title small>Choose Your Starting Point</Title>
    <Copy small muted>Explore the app with a temporary workspace. Your real account and saved records stay separate.</Copy>
    <Button title="Test First Visit" variant="outline" disabled={auth.pending || starting} onPress={() => void start("first-visit")} />
    <Copy small muted>Replay the introduction and optional questions, then start a fresh editable week.</Copy>
    <Button title="Test Returning User" disabled={auth.pending || starting} onPress={() => void start("returning-user")} />
    <Copy small muted>Open the workspace directly with example weeks, notes and progress. Test changes reset when this session closes. Real account services and AI require an actual account.</Copy>
    {entryFailed && <Copy accessibilityRole="alert">{app.error || "The test was not started because your access changed. Close this panel to review your workspace status before trying again."}</Copy>}
    {entryFailed && app.storageWarning && <Copy small accessibilityRole="alert">{app.storageWarning}</Copy>}
  </Card>
}
