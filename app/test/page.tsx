import { AppProviders } from "@/components/app-providers"

export default function TestPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO !== "true") {
    return <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-serif text-3xl">Test Access Is Unavailable</h1>
      <p className="mt-4 text-sm text-muted-foreground">This build has test mode disabled.</p>
      <a href="/" className="primary-button mt-6">Open Anew</a>
    </main>
  }
  return <AppProviders testAccessOpen />
}
