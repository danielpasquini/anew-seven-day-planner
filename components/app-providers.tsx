"use client"

import { AuthProvider } from "@/lib/auth/client"
import { LaunchExperience } from "@/components/launch-experience"
import { GentleSoundEvents } from "@/components/sound-control"
import { DemoProvider } from "@/lib/demo"

export function AppProviders() {
  return <AuthProvider><DemoProvider><GentleSoundEvents /><LaunchExperience /></DemoProvider></AuthProvider>
}
