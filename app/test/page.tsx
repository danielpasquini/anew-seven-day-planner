"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AppProviders } from "@/components/app-providers"
import { ArrowRight, CheckCircle2, Crown, RefreshCw, Sparkles, User, UserCheck } from "lucide-react"

type ScenarioType = "first-visit" | "returning" | "guest" | "free" | "premium"

function TestScenarioRunner() {
  const searchParams = useSearchParams()
  const scenario = searchParams.get("scenario") as ScenarioType | null
  const [activeScenario, setActiveScenario] = useState<ScenarioType | null>(scenario)
  const [ready, setReady] = useState(false)

  const setupScenario = (target: ScenarioType) => {
    try {
      if (target === "first-visit") {
        localStorage.removeItem("anew-first-open-v1")
        localStorage.removeItem("anew-introduction-seen-v1")
        localStorage.removeItem("anew-user-tier")
        localStorage.removeItem("guia-retomada-v2:guest")
      } else if (target === "returning") {
        localStorage.setItem("anew-first-open-v1", "seen")
        localStorage.setItem("anew-introduction-seen-v1", "seen")
        localStorage.setItem("anew-user-tier", "guest")
      } else if (target === "guest") {
        localStorage.setItem("anew-first-open-v1", "seen")
        localStorage.setItem("anew-introduction-seen-v1", "seen")
        localStorage.setItem("anew-user-tier", "guest")
      } else if (target === "free") {
        localStorage.setItem("anew-first-open-v1", "seen")
        localStorage.setItem("anew-introduction-seen-v1", "seen")
        localStorage.setItem("anew-user-tier", "free")
      } else if (target === "premium") {
        localStorage.setItem("anew-first-open-v1", "seen")
        localStorage.setItem("anew-introduction-seen-v1", "seen")
        localStorage.setItem("anew-user-tier", "premium")
      }
    } catch {
      // Storage fallback
    }
    setActiveScenario(target)
    setReady(true)
  }

  useEffect(() => {
    if (scenario) {
      setupScenario(scenario)
    } else {
      setReady(true)
    }
  }, [scenario])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
        Carregando cenário de teste…
      </div>
    )
  }

  // If a scenario is active, render the clean, authentic app experience without any UI test clutter!
  if (activeScenario) {
    return <AppProviders key={activeScenario} />
  }

  // Dedicated Developer Portal when navigating directly to /test
  return (
    <main className="min-h-screen bg-background text-foreground p-6 sm:p-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span>Portal de Testes Dedicado · Anew</span>
          </div>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold">
            Porta Dedicada de Cenários
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Selecione o cenário desejado abaixo. O aplicativo será carregado com a interface <strong>100% limpa</strong>, exatamente como será executado no WebApp, iOS e Android, sem barras ou banners de teste poluindo a tela.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Cenário 1: Primeira Visita */}
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between gap-4 hover:border-primary/40 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg font-semibold">1. Primeira Entrada</span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">Onboarding</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Abre o app como visitante pela 1ª vez: exibe a animação do galho crescendo e o wizard com as 10 perguntas de personalização para criar a Starter Week.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setupScenario("first-visit")}
              className="primary-button text-xs w-full justify-center"
            >
              <span>Abrir Primeira Entrada</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Cenário 2: Usuário Retornando */}
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between gap-4 hover:border-primary/40 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg font-semibold">2. Retornando ao App</span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-xs">Direto</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Já passou pelo onboarding. Entra diretamente na visualização da sua semana ativa no dashboard, sem animação longa e sem perguntas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setupScenario("returning")}
              className="rounded-xl border border-border bg-card hover:bg-accent px-4 py-2.5 text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              <span>Abrir como Retornando</span>
            </button>
          </div>

          {/* Cenário 3: Visitante sem Cadastro */}
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between gap-4 hover:border-primary/40 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg font-semibold">3. Visitante sem Cadastro</span>
                <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 text-xs">Storage Local</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Usa o app com armazenamento local completo (marca/desmarca tarefas, edita notas e semanas no localStorage), mas sem os recursos premium como IA.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setupScenario("guest")}
              className="rounded-xl border border-border bg-card hover:bg-accent px-4 py-2.5 text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 transition"
            >
              <User className="size-3.5" aria-hidden="true" />
              <span>Abrir como Visitante Local</span>
            </button>
          </div>

          {/* Cenário 4: Usuário Cadastrado Free */}
          <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between gap-4 hover:border-primary/40 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg font-semibold">4. Cadastrado Free</span>
                <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 text-xs">Conta Free</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Usuário autenticado com conta normal. Dados salvos com isolamento de UID, mas sem assinatura Premium (IA bloqueada com convite de upgrade).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setupScenario("free")}
              className="rounded-xl border border-border bg-card hover:bg-accent px-4 py-2.5 text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 transition"
            >
              <UserCheck className="size-3.5" aria-hidden="true" />
              <span>Abrir como Cadastrado Free</span>
            </button>
          </div>

          {/* Cenário 5: Usuário Cadastrado Premium */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 flex flex-col justify-between gap-4 hover:border-primary/50 transition sm:col-span-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg font-semibold flex items-center gap-2">
                  <Crown className="size-4 text-primary" aria-hidden="true" />
                  <span>5. Cadastrado Premium</span>
                </span>
                <span className="rounded-full bg-primary/20 text-primary px-2.5 py-0.5 text-xs font-semibold">Tudo Liberado</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Usuário autenticado Premium com acesso completo: planejamento local e em nuvem, mais IA Gemini desbloqueada para análise semanal e reflexão reflexiva.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setupScenario("premium")}
              className="primary-button text-xs w-full justify-center"
            >
              <Crown className="size-3.5" aria-hidden="true" />
              <span>Abrir como Usuário Premium</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <a href="/" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4">
            ← Voltar ao App Normal (Produção)
          </a>
          <span className="text-xs text-muted-foreground">
            Instruções e comandos em <code>TEST-SCENARIOS.txt</code>
          </span>
        </div>
      </div>
    </main>
  )
}

export default function TestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <TestScenarioRunner />
    </Suspense>
  )
}
