import React, { useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Button, Card, Copy, Sheet, Title } from "./ui"

const STEPS = [
  { title: "Your Next Seven Days", copy: "Anew is a weekly planner for small, manageable steps. Start with the sample preview and choose Use This Week when it fits. Nothing needs to be perfect or completed.", tip: "Your first week can be one small step each day." },
  { title: "Choose a Light Start", copy: "Create a Guide offers ready-made weeks for everyday balance or one personal goal. You can also begin with a blank week. Every preset works without AI.", tip: "Pick one preset and change it as you go." },
  { title: "Make the Steps Yours", copy: "Open a day to add a step, change a time, or remove a suggestion. Checks record steps you chose to take. You can leave days empty, skip, or rest.", tip: "Use Weeks to start another seven-day plan or revisit an earlier one." },
  { title: "Customize Your Sections", copy: "Optional sections stay folded until you want them. Customize Sections lets you rename, reorder, add, or remove sections and choose your own field labels and types.", tip: "Keeping just one notes section is enough." },
  { title: "Choose Your Extras", copy: "Optional AI can suggest fields and a weekly plan when the service is available and you consent. Resources, privacy, and other tools live under More. Sounds and spiritual content are optional.", tip: "You can replay this tutorial from Help whenever you want." },
]
let demoSeen = false

export function NativePlannerTutorial({ owner, enabled, replay }: { owner: string; enabled: boolean; replay: number }) {
  const [visible, setVisible] = useState(replay > 0 || (owner === "demo" && !demoSeen)), [step, setStep] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let active = true
    if (owner !== "demo") void AsyncStorage.getItem(`anew-native-planner-tutorial-v1:${owner}`).then((seen) => { if (active && seen !== "seen") { setStep(0); setVisible(true) } }).catch(() => {})
    return () => { active = false }
  }, [owner, enabled])
  const close = () => {
    setVisible(false)
    if (owner === "demo") demoSeen = true
    else void AsyncStorage.setItem(`anew-native-planner-tutorial-v1:${owner}`, "seen").catch(() => {})
  }
  const current = STEPS[step]
  return <Sheet visible={visible && (enabled || replay > 0)} title="Welcome to Your Weekly Planner" onClose={close}>
    <Copy accessibilityRole="alert" small muted>Step {step + 1} of {STEPS.length}: {current.title}</Copy><Title small>{current.title}</Title><Copy>{current.copy}</Copy><Card><Copy small>{current.tip}</Copy></Card>
    <Button title={step === STEPS.length - 1 ? "Start My Week" : "Next"} onPress={() => step === STEPS.length - 1 ? close() : setStep((value) => value + 1)} />
    {step > 0 && <Button title="Back" variant="outline" onPress={() => setStep((value) => value - 1)} />}
    <Button title="Skip Tutorial" variant="quiet" onPress={close} />
  </Sheet>
}
