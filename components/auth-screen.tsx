"use client"

import { titleCase } from "@/lib/title-case"

import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2, Mail, ShieldCheck, X } from "lucide-react"
import { useAuth } from "@/lib/auth/client"
import { isNativeApp } from "@/lib/platform"
import { useModalAccessibility } from "@/components/modal-accessibility"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { getConsentCopy, LEGAL_LINKS, LEGAL_VERSION } from "@/lib/legal"
import { AccountDeletionNotice } from "@/components/account-deletion"
import { BrandMark } from "@/components/brand-mark"
import { isTestCredentials, matchesTestAccess, TEST_EMAIL, TEST_PASSWORD } from "@/lib/test-access"


const AUTH_TEXT: Record<string, string> = {
  "Revise e marque os quatro aceites para continuar.": "Review and check all four acknowledgements to continue.",
  "Se este e-mail puder receber instruções, enviaremos um link de recuperação. Confira também a caixa de spam.": "If this email can receive instructions, we will send a recovery link. Check your spam folder too.",
  "Use uma senha com pelo menos 12 caracteres.": "Use a password with at least 12 characters.",
  "As senhas precisam ser iguais.": "The passwords must match.",
  "Revise e marque os quatro aceites para criar sua conta.": "Review and check all four acknowledgements to create your account.",
  "Antes de continuar com Google, revise os quatro aceites abaixo. Isso também vale para contas existentes.": "Before continuing with Google, review the four acknowledgements below. This also applies to existing accounts.",
  "Revise os quatro aceites antes de criar uma conta com Google.": "Review all four acknowledgements before creating an account with Google.",
  "Fechar acesso à conta": "Close account access",
  "Um último passo no seu e-mail.": "One last step in your inbox.",
  "Antes de começar.": "Before you begin.",
  "Sua Semana, No Seu Ritmo.": "Your Week, at Your Pace.",
  "Vamos recuperar seu acesso.": "Let’s recover your access.",
  "Bom ter você por aqui.": "Good to have you here.",
  "Confirme seu endereço de e-mail para liberar seu espaço pessoal.": "Verify your email address to unlock your personal space.",
  "Leia os documentos e confirme suas escolhas para usar o espaço pessoal.": "Read the documents and confirm your choices to use your personal space.",
  "Crie uma conta para salvar seu planejador de sete dias, adaptar pequenos passos e continuar no seu ritmo.": "Create an account to save your seven-day planner, adapt small steps and continue at your own pace.",
  "Informe o e-mail usado na conta. Você receberá as instruções quando aplicável.": "Enter the email used for your account. You will receive instructions when applicable.",
  "Entre para continuar seu planejador de sete dias e seus pequenos passos. Você também pode experimentar a prévia.": "Sign in to continue your seven-day planner and small steps. You can also try the preview.",
  "Solicitação de reenvio concluída. Confira sua caixa de entrada e o spam.": "The resend request is complete. Check your inbox and spam folder.",
  "Use 12 caracteres ou mais. Uma frase longa pode ser mais fácil de lembrar.": "Use 12 or more characters. A long phrase can be easier to remember.",
  "Comprimento mínimo atingido. Uma senha mais longa e única oferece proteção adicional.": "Minimum length reached. A longer, unique password provides additional protection.",
  "Senha longa. Evite reutilizá-la em outros serviços.": "Long password. Avoid reusing it on other services.",
  "Crie uma senha": "Create a password",
  "Sua senha": "Your password",
  "Ocultar senha": "Hide password",
  "Mostrar senha": "Show password",
  "Confirmar e continuar": "Confirm and continue",
  "Criar minha conta": "Create my account",
  "Solicitar recuperação": "Request recovery",
  "Entrar no meu espaço": "Enter my space",
  "Criar conta com Google": "Create an account with Google",
  "Continuar com Google": "Continue with Google",
  "UM ESPAÇO SEU": "A SPACE OF YOUR OWN",
  "Integração de contas preparada": "Account integration is ready",
  "O Firebase ainda precisa ser configurado pelo responsável pelo app. Login e cadastro estarão disponíveis depois dessa configuração. Você já pode explorar a prévia.": "Firebase still needs to be configured by the app operator. Sign-in and registration will be available after setup. You can explore the preview now.",
  "Verificando acesso…": "Checking access…",
  "Já confirmei meu e-mail": "I have verified my email",
  "Reenviar mensagem": "Resend message",
  "Sair e usar outro e-mail": "Sign out and use another email",
  "Entrar": "Sign in",
  "Criar conta": "Create account",
  "Seu e-mail": "Your email",
  "Esqueci minha senha": "Forgot password",
  "Confirme sua senha": "Confirm your password",
  "Voltar para entrar": "Back to sign in",
  "Explorar prévia sem criar conta": "Explore preview without an account",
  "Um planejador de sete dias com pequenos passos, escolhas pessoais e privacidade para suas anotações.": "A seven-day planner with small steps, personal choices and privacy for your notes."
}

type Agreements = { terms: boolean; privacy: boolean; health: boolean; adult: boolean }
const EMPTY_AGREEMENTS: Agreements = { terms: false, privacy: false, health: false, adult: false }

function AgreementFields({ value, onChange, disabled, locale }: { value: Agreements; onChange: (next: Agreements) => void; disabled: boolean; locale: string }) {
  const text = getConsentCopy(locale)
  const en = locale === "en-US"
  const options: { key: keyof Agreements; text: React.ReactNode }[] = [
    { key: "terms", text: <>{text.terms} <a href={LEGAL_LINKS.terms} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4">{en ? "Read ↗" : "Ler ↗"}</a></> },
    { key: "privacy", text: <>{text.privacy} <a href={LEGAL_LINKS.privacy} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4">{en ? "Read ↗" : "Ler ↗"}</a></> },
    { key: "health", text: <>{text.health} <a href={LEGAL_LINKS.health} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-4">{en ? "Read ↗" : "Ler ↗"}</a></> },
    { key: "adult", text: text.adult },
  ]
  return <fieldset disabled={disabled} className="space-y-3"><legend className="mb-3 text-sm font-medium">{titleCase(en ? "Separate, explicit acknowledgements" : "Seus aceites, separados e explícitos")}</legend>{options.map((option) => <label key={option.key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3"><input type="checkbox" checked={value[option.key]} onChange={(event) => onChange({ ...value, [option.key]: event.target.checked })} className="mt-1 size-4 shrink-0" /><span className="text-xs leading-relaxed text-muted-foreground">{option.text}</span></label>)}<p className="text-xs leading-relaxed text-muted-foreground">{text.explanation}</p><p className="text-[10px] text-muted-foreground">{en ? "Document version" : "Versão dos documentos"}: {LEGAL_VERSION}</p></fieldset>
}

export function AuthScreen({ onGuest, onDemo, onClose, embedded = false, initialMode = "login" }: { onGuest?: () => void; onDemo?: () => void; onClose?: () => void; embedded?: boolean; initialMode?: "login" | "register" }) {
  const { locale, setLocale } = useStore()
  const copy = (pt: string) => locale === "en-US" ? AUTH_TEXT[pt] || pt : pt
  const { status, user, configured, googleConfigured, legalAccepted, error, busy, signIn, signUp, signInGoogle, signOut, resetPassword, resendVerification, refreshVerification, acceptAgreements, clearError } = useAuth()
  const [mode, setMode] = useState<"login" | "register" | "reset">(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [agreements, setAgreements] = useState<Agreements>({ ...EMPTY_AGREEMENTS })
  const [localError, setLocalError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const accepted = Object.values(agreements).every(Boolean)
  const canUseTestLogin = mode === "login" && !!onDemo && !user
  const unverified = status === "authenticated" && user && !user.emailVerified
  const needsAgreements = status === "authenticated" && user?.emailVerified && !legalAccepted
  const fullAccess = status === "authenticated" && user?.emailVerified && legalAccepted

  useEffect(() => { if (fullAccess) onClose?.() }, [fullAccess, onClose])
  const changeMode = (next: typeof mode) => { setMode(next); setLocalError(null); setMessage(null); setPassword(""); setConfirmation(""); setAgreements({ ...EMPTY_AGREEMENTS }); clearError() }
  const run = async (action: () => Promise<unknown>, success?: string) => {
    setLocalError(null); setMessage(null); clearError()
    try { await action(); if (success) setMessage(success) } catch { /* The auth provider supplies the user-facing error. */ }
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    const cleanEmail = email.trim().toLowerCase()
    if (isTestCredentials(cleanEmail, password)) {
      await run(() => signIn(cleanEmail, password))
      onClose?.()
      return
    }
    if (canUseTestLogin && matchesTestAccess(email, password)) { onDemo?.(); onClose?.(); return }
    if (!configured) {
      setLocalError(locale === "en-US" ? "Real accounts need Firebase setup. You can explore without an account." : "Contas reais precisam da configuração do Firebase. Você pode explorar sem conta.")
      return
    }
    if (needsAgreements) {
      if (!accepted) { setLocalError(copy("Revise e marque os quatro aceites para continuar.")); return }
      await run(() => acceptAgreements(agreements)); return
    }
    if (mode === "reset") { await run(() => resetPassword(email.trim()), copy("Se este e-mail puder receber instruções, enviaremos um link de recuperação. Confira também a caixa de spam.")); return }
    if (mode === "register") {
      if (password.length < 12) { setLocalError(copy("Use uma senha com pelo menos 12 caracteres.")); return }
      if (password !== confirmation) { setLocalError(copy("As senhas precisam ser iguais.")); return }
      if (!accepted) { setLocalError(copy("Revise e marque os quatro aceites para criar sua conta.")); return }
      await run(() => signUp(email.trim(), password, agreements))
    } else await run(() => signIn(email.trim(), password))
  }
  const google = () => {
    if (mode !== "register") { changeMode("register"); setMessage(copy("Antes de continuar com Google, revise os quatro aceites abaixo. Isso também vale para contas existentes.")); return }
    if (!accepted) { setLocalError(copy("Revise os quatro aceites antes de criar uma conta com Google.")); return }
    return run(() => signInGoogle(agreements))
  }

  return (
    <div className={cn("flex items-center justify-center bg-background", embedded ? "w-full" : "min-h-dvh px-4 py-8 sm:py-14")}>
      <div className={cn("relative w-full max-w-[480px]", embedded ? "p-5 sm:p-7" : "rounded-[24px] border border-border bg-card p-6 shadow-sm sm:p-9")}>
        {onClose && (
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="icon-button"
              aria-label={copy("Fechar acesso à conta")}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="mb-7 flex flex-wrap items-center gap-2.5 text-primary">
          <span className="flex size-10 items-center justify-center rounded-[14px] bg-primary text-primary-foreground">
            <BrandMark className="size-6" />
          </span>
          <span className="font-serif text-2xl font-semibold tracking-tight">Anew.</span>

          <div className="ml-auto flex items-center gap-1">
            <label className="text-xs text-muted-foreground">
              <span className="sr-only">{locale === "en-US" ? "Language" : "Idioma"}</span>
              <select
                value={locale}
                onChange={(event) => setLocale(event.target.value as "pt-BR" | "en-US")}
                className="min-h-11 rounded-lg border border-border bg-card px-2 text-xs"
              >
                <option value="en-US">EN</option>
                <option value="pt-BR">PT</option>
              </select>
            </label>
          </div>
        </div>

        <p className="eyebrow text-primary">{copy("UM ESPAÇO SEU")}</p>
        <h1 id="auth-title" className="mt-2 font-serif text-[32px] leading-tight tracking-tight">
          {titleCase(
            unverified
              ? copy("Um último passo no seu e-mail.")
              : needsAgreements
              ? copy("Antes de começar.")
              : mode === "register"
              ? copy("Sua Semana, No Seu Ritmo.")
              : mode === "reset"
              ? copy("Vamos recuperar seu acesso.")
              : copy("Bom ter você por aqui.")
          )}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {unverified
            ? copy("Confirme seu endereço de e-mail para liberar seu espaço pessoal.")
            : needsAgreements
            ? copy("Leia os documentos e confirme suas escolhas para usar o espaço pessoal.")
            : mode === "register"
            ? copy("Crie uma conta para salvar seu planejador de sete dias, adaptar pequenos passos e continuar no seu ritmo.")
            : mode === "reset"
            ? copy("Informe o e-mail usado na conta. Você receberá as instruções quando aplicável.")
            : copy("Entre para continuar seu planejador de sete dias e seus pequenos passos. Você também pode experimentar a prévia.")}
        </p>

        {(onGuest || onDemo) && (
          <section aria-label={locale === "en-US" ? "Try Anew" : "Experimente Anew"} className="mt-5 space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            {onGuest && (
              <div className="space-y-2">
                <button type="button" onClick={onGuest} className="primary-button w-full">
                  {locale === "en-US" ? "Try Without an Account" : "Experimentar Sem Conta"}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {locale === "en-US"
                    ? "Read-only preview. Sign in with a verified account to save your own weeks and optionally use Gemini."
                    : "Prévia somente para leitura. Entre com uma conta verificada para salvar suas próprias semanas e usar Gemini se quiser."}
                </p>
              </div>
            )}
            {onDemo && (
              <div className={cn("space-y-2", onGuest && "border-t border-primary/15 pt-3")}>
                <button
                  type="button"
                  onClick={onDemo}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium text-primary hover:bg-accent"
                >
                  {locale === "en-US" ? "Try Interactive Demo" : "Testar Demonstração Interativa"}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {locale === "en-US"
                    ? "Explore the tools with example records kept only for this session. Gemini is disabled in the demo."
                    : "Explore as ferramentas com exemplos mantidos apenas nesta sessão. Gemini fica desativado no demo."}
                </p>
              </div>
            )}
          </section>
        )}
      {!configured && <div role="status" className="mt-5 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground"><strong className="block font-medium text-foreground">{copy("Integração de contas preparada")}</strong>{copy("O Firebase ainda precisa ser configurado pelo responsável pelo app. Login e cadastro estarão disponíveis depois dessa configuração. Você já pode explorar a prévia.")}</div>}
      {(localError || error) && <p role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm leading-relaxed text-destructive">{localError || error}</p>}
      {message && <p role="status" aria-live="polite" className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm leading-relaxed">{message}</p>}
      {status === "loading" ? <p role="status" className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden="true" />{copy("Verificando acesso…")}</p> : unverified ? <div className="mt-6 space-y-3"><p className="flex items-center gap-2 rounded-xl bg-muted p-3 text-sm"><Mail className="size-4 text-primary" aria-hidden="true" />{user.email}</p><button type="button" disabled={!configured || busy} onClick={() => run(refreshVerification)} className="primary-button w-full">{busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}{copy("Já confirmei meu e-mail")}</button><button type="button" disabled={!configured || busy} onClick={() => run(resendVerification, copy("Solicitação de reenvio concluída. Confira sua caixa de entrada e o spam."))} className="min-h-11 w-full rounded-xl border border-border text-sm hover:bg-accent">{copy("Reenviar mensagem")}</button><button type="button" onClick={() => run(signOut)} disabled={busy} className="min-h-11 w-full rounded-xl text-sm text-muted-foreground hover:bg-accent">{copy("Sair e usar outro e-mail")}</button></div> : <form onSubmit={submit} className="mt-6 space-y-5">
        {!needsAgreements && <>
          {mode !== "reset" && <div className="grid grid-cols-2 rounded-xl border border-border bg-muted/30 p-1"><button type="button" aria-pressed={mode === "login"} onClick={() => changeMode("login")} className={cn("min-h-11 rounded-lg text-sm font-medium", mode === "login" && "bg-card text-primary shadow-xs")}>{copy("Entrar")}</button><button type="button" aria-pressed={mode === "register"} onClick={() => changeMode("register")} className={cn("min-h-11 rounded-lg text-sm font-medium", mode === "register" && "bg-card text-primary shadow-xs")}>{copy("Criar conta")}</button></div>}
          <div><label htmlFor="auth-email" className="mb-2 block text-sm font-medium">{copy("Seu e-mail")}</label><input id="auth-email" type="email" autoComplete="email" inputMode="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} className="w-full rounded-xl border border-input bg-background/50 px-3.5 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/20" /></div>
          {mode !== "reset" && <div><label htmlFor="auth-password" className="mb-2 block text-sm font-medium">{mode === "register" ? copy("Crie uma senha") : copy("Sua senha")}</label><div className="relative"><input id="auth-password" type={showPassword ? "text" : "password"} autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={mode === "register" ? 12 : undefined} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} aria-describedby={mode === "register" ? "auth-password-hint" : undefined} className="w-full rounded-xl border border-input bg-background/50 py-3 pl-3.5 pr-14 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/20" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="icon-button absolute right-1 top-1" aria-label={showPassword ? copy("Ocultar senha") : copy("Mostrar senha")}>{showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}</button></div>{mode === "register" ? <p id="auth-password-hint" className="mt-2 text-xs leading-relaxed text-muted-foreground">{password.length < 12 ? copy("Use 12 caracteres ou mais. Uma frase longa pode ser mais fácil de lembrar.") : password.length < 16 ? copy("Comprimento mínimo atingido. Uma senha mais longa e única oferece proteção adicional.") : copy("Senha longa. Evite reutilizá-la em outros serviços.")}</p> : <button type="button" onClick={() => changeMode("reset")} className="mt-2 min-h-11 rounded-lg text-xs font-medium text-primary underline underline-offset-4">{copy("Esqueci minha senha")}</button>}</div>}
          {mode === "register" && <div><label htmlFor="auth-password-confirm" className="mb-2 block text-sm font-medium">{copy("Confirme sua senha")}</label><input id="auth-password-confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={12} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={!configured || busy} className="w-full rounded-xl border border-input bg-background/50 px-3.5 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-ring/20" /></div>}
        </>}
        {(mode === "register" || needsAgreements) && <AgreementFields locale={locale} value={agreements} onChange={(next) => { setAgreements(next); setLocalError(null) }} disabled={!configured || busy} />}
        <button type="submit" disabled={busy || ((mode === "register" || needsAgreements) && !accepted)} className="primary-button w-full">{busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}{needsAgreements ? copy("Confirmar e continuar") : mode === "register" ? copy("Criar minha conta") : mode === "reset" ? copy("Solicitar recuperação") : copy("Entrar no meu espaço")}</button>
        {!isNativeApp() && !needsAgreements && mode !== "reset" && <><div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{locale === "en-US" ? "or" : "ou"}<span className="h-px flex-1 bg-border" /></div><button type="button" disabled={!googleConfigured || busy || (mode === "register" && !accepted)} onClick={google} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-medium hover:bg-accent disabled:opacity-40"><span className="font-sans text-lg font-semibold" aria-hidden="true">G</span>{mode === "register" ? copy("Criar conta com Google") : copy("Continuar com Google")}</button>{configured && !googleConfigured && <p className="text-xs leading-relaxed text-muted-foreground">{locale === "en-US" ? "Google sign-in is not available yet. Use email and password." : "O acesso com Google ainda não está disponível. Use e-mail e senha."}</p>}</>}
        {mode === "reset" && <button type="button" onClick={() => changeMode("login")} className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm text-primary hover:bg-accent"><ArrowLeft className="size-4" aria-hidden="true" />{copy("Voltar para entrar")}</button>}
      </form>}
      {onDemo && !user && <details className="mt-5 rounded-xl border border-border p-4 text-sm"><summary className="cursor-pointer font-medium text-primary">{locale === "en-US" ? "Test Credentials · Optional" : "Credenciais de Teste · Opcional"}</summary><div className="mt-3 space-y-2"><p className="break-all">{locale === "en-US" ? "Email" : "E-mail"}: {TEST_EMAIL}<br />{locale === "en-US" ? "Password" : "Senha"}: {TEST_PASSWORD}</p><p className="text-xs leading-relaxed text-muted-foreground">{locale === "en-US" ? "Public test credentials open the same demo with sample records in memory. They do not create an account, connect to Firebase or enable Gemini." : "As credenciais públicas abrem o mesmo demo com exemplos na memória. Elas não criam uma conta, conectam ao Firebase ou ativam Gemini."}</p><button type="button" className="min-h-11 rounded-lg px-2 font-medium text-primary underline" onClick={() => { changeMode("login"); setEmail(TEST_EMAIL); setPassword(TEST_PASSWORD) }}>{locale === "en-US" ? "Fill Test Credentials" : "Preencher Credenciais de Teste"}</button></div></details>}
      <AccountDeletionNotice />
      {user && <a href="/delete-account" className="mt-4 inline-flex min-h-11 text-xs text-primary underline">Manage account deletion</a>}
      <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{copy("Um planejador de sete dias com pequenos passos, escolhas pessoais e privacidade para suas anotações.")}</p>
    </div>
  </div>
)}

export function AuthDialog({ isOpen, onClose, onGuest, onDemo }: { isOpen: boolean; onClose: () => void; onGuest?: () => void; onDemo?: () => void }) {
  const dialogRef = useModalAccessibility(isOpen, onClose)
  if (!isOpen) return null
  return <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="auth-title" className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5"><div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" /><div className="relative max-h-[94dvh] w-full max-w-[480px] overflow-y-auto rounded-[24px] border border-border bg-card shadow-2xl"><AuthScreen embedded onClose={onClose} onGuest={onGuest} onDemo={onDemo} /></div></div>
}
