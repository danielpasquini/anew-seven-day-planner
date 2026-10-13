"use client"

import { AuthProvider } from "@/lib/auth/client"
import { LaunchExperience } from "@/components/launch-experience"
import { GentleSoundEvents } from "@/components/sound-control"
import { DemoProvider, useDemo } from "@/lib/demo"
import { TestAccessControls } from "@/components/test-access-controls"

function AppExperience({ testAccessOpen }: { testAccessOpen: boolean }) {
  const demo = useDemo()
  const choosingTest = testAccessOpen && !demo.enabled
  return <><TestAccessControls initiallyOpen={testAccessOpen} />{choosingTest
    ? <main className="mx-auto max-w-6xl px-6 py-10"><h1 className="font-serif text-3xl text-primary">Choose Your Test Experience</h1><p className="mt-3 text-sm text-muted-foreground">Use the options above to begin. Each test has its own temporary workspace.</p><a href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm text-primary">Open Normal App</a></main>
    : <><GentleSoundEvents /><LaunchExperience key={demo.sessionId ?? "account"} /></>}</>
}

export function AppProviders({ testAccessOpen = false }: { testAccessOpen?: boolean }) {
  return <AuthProvider><DemoProvider><AppExperience testAccessOpen={testAccessOpen} /></DemoProvider></AuthProvider>
}
