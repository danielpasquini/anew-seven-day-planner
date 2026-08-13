# PROJECT-STATE.md — Guia de Retomada (Ciclos Semanais)

> Última atualização: 2026-08-13
> Baseline commit: `f5c3f16` (tag: v0-import)

---

## 1. Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16.3.0 |
| Runtime | React | 19.x |
| Linguagem | TypeScript | 5.7.3 |
| CSS | Tailwind CSS 4 (via `@tailwindcss/postcss`) | 4.3.3 |
| Componentes UI | shadcn/Base UI (`base-nova` style) | 4.8.0 |
| Ícones | lucide-react | 1.16.0 |
| Fontes | Geist Sans + Lora (next/font/google) | — |
| Persistência | localStorage (chave `guia-retomada-v2`, schema v3) | — |
| Build | Turbopack (dev) / Next.js (prod) | — |

**Não há**: Firebase, Firestore, autenticação, cloud sync, banco de dados.
**Serviços Externos**: Gemini API via Route Handler Server-Side (`/api/analyze-week`).

---

## 2. Arquitetura

```
app/
  layout.tsx        — RootLayout (fontes, script anti-FOUC para tema/paleta)
  page.tsx          — Renderiza <StoreProvider> + <GuideApp />
  globals.css       — Tokens CSS (oklch), paletas light/dark, @print, safe-area
  api/
    analyze-week/
      route.ts      — POST API Handler Server-Side para Gemini (Structured Output JSON)

components/
  guide-app.tsx     — Componente principal com botões de completar semana, header, drawers
  complete-week-modal.tsx — Modal de confirmação com resumo e snapshot antes de concluir
  week-review-card.tsx    — Exibição da semana concluída, Veredito da Semana, AI Review e Reabrir
  section-card.tsx  — Card wrapper para cada Section
  blocks.tsx        — BlockRenderer: lead, p, h, list, note, table, ladder, fields, schedule
  fields.tsx        — TextField, TextAreaField, ScaleField, CheckField (font-size 16px)
  scripture.tsx     — ScriptureBlock (versículos ARA/NVT + comentário + oração)
  schedule-block.tsx — InteractiveScheduleBlock (grid 7 dias, CRUD, countsTowardCompletion toggle)
  settings-modal.tsx — Modal de configurações com 4 abas (mobile touch friendly)
  week-modal.tsx    — CreateWeekModal + DeleteWeekModal (safari iOS / 16px inputs)

docs/
  UI-DESIGN-GUARDRAILS.md — Regras permanentes de design, contraste e responsividade
  contrast-check.mjs      — Utilitário de verificação automatizada de contraste WCAG

lib/
  guide-data.ts     — Tipos, conteúdo estático (intro + 17 sections), DEFAULT_GUIDE_TEMPLATE
  store.tsx         — StoreProvider (Context + useState), WeekInstance, status,
                      completionSnapshot, aiReview, completeWeek, reopenWeek, generateAIReview,
                      persistência v3, tema/paleta, export MD/JSON, import JSON
  date-utils.ts     — Funções de data: calculateInclusiveEndDate, getNextDayDate, formatDateRangeBR
  utils.ts          — cn() (clsx + tailwind-merge)
```

---

## 3. Schema atual (localStorage `guia-retomada-v2`, `schemaVersion: 3`)

```typescript
type StoreDataV3 = {
  schemaVersion: 3
  weeks: WeekInstance[]
  activeWeekId: string
}

type WeekStatus = "active" | "completed"

type TaskResultItem = {
  id: string
  description: string
  time?: string
  dayIndex: number
  done: boolean
  countsTowardCompletion: boolean
}

type CompletionSnapshot = {
  totalTasks: number
  completedTasks: number
  completionPercentage: number
  taskResults: TaskResultItem[]
  completedAt: string
}

type AIReview = {
  verdict: string
  summary: string
  whatWorked: string[]
  difficulties: string[]
  observedPatterns: string[]
  nextWeekSuggestions: string[]
  generatedAt: string
  analysisVersion: number
}

type ScheduleActivity = {
  id: string
  dayIndex: number
  time: string
  description: string
  order: number
  countsTowardCompletion?: boolean // padrão true
}

type WeekInstance = {
  id: string
  guideId: string
  templateId: string
  title: string
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  status: WeekStatus
  completedAt?: string | null
  completionSnapshot?: CompletionSnapshot | null
  aiReview?: AIReview | null
  aiReviewVersion?: number
  aiReviewOutdated?: boolean
  data: {
    text: Record<string, string>
    done: Record<string, boolean>
  }
  programacao: {
    dias: 7
    activities: ScheduleActivity[]
  }
  progresso: {
    total: number
    concluidas: number
    percentual: number
  }
}
```

---

## 4. Funcionalidades — Status

### ✅ Completas e funcionando

| Funcionalidade | Onde |
|----------------|------|
| Completar Semana (Encerramento Formal) | `store.tsx`, `complete-week-modal.tsx`, `guide-app.tsx` |
| Snapshot de Conclusão (`completionSnapshot`) | `store.tsx` → `createSnapshot` |
| Análise Inteligente Server-Side Gemini AI | `app/api/analyze-week/route.ts` (Structured Output JSON) |
| Resiliência à Falha de API (Semana Concluída + Retry) | `store.tsx`, `week-review-card.tsx` |
| Reabrir Semana Concluída | `store.tsx` → `reopenWeek` |
| Detecção de Análise Desatualizada após edição | `store.tsx` (`aiReviewOutdated: true`) |
| Toggle `countsTowardCompletion` por Atividade | `schedule-block.tsx` |
| Badge Discreto de Status (`Concluída · X%`) | `guide-app.tsx`, `settings-modal.tsx` |
| Preservação / Migração segura para schema v3 | `store.tsx` (sem perda de dados de v2/v1) |
| 17 seções do guia com Escritura | `guide-data.ts`, `section-card.tsx` |
| Múltiplas semanas independentes (CRUD) | `store.tsx`, `week-modal.tsx`, `settings-modal.tsx` |
| 5 paletas de cores com WCAG ≥ 4.5:1 | `globals.css`, `docs/contrast-check.mjs` |
| Guardrails visuais permanentes | `docs/UI-DESIGN-GUARDRAILS.md` |
| Exportação Markdown / JSON semana / PDF | `store.tsx` → `exportToMarkdown`, `exportWeekJSON`; `settings-modal.tsx` |
| Exportação Backup Completo JSON (todas as semanas) | `store.tsx` → `exportToJSON` |
| Importação com preview de confirmação antes de sobrescrever | `settings-modal.tsx` → `pendingImport` state + `handleConfirmImport` |

---

## 5. Arquivos Modificados / Criados nesta Etapa

- `app/api/analyze-week/route.ts` *(novo)*
- `components/complete-week-modal.tsx` *(novo)*
- `components/week-review-card.tsx` *(novo)*
- `lib/store.tsx` *(atualizado: schema v3, status, snapshot, aiReview, exportWeekJSON)*
- `components/schedule-block.tsx` *(atualizado: toggle countsTowardCompletion)*
- `components/guide-app.tsx` *(atualizado: botões de completar, integração dos modais/cards)*
- `components/settings-modal.tsx` *(atualizado: tab Exportação dividida em duas seções; import com confirmação)*
- `app/globals.css` *(atualizado: print CSS aprimorado — A4, @page, oculta dialogs/drawers)*
- `.env.example` *(documentação da chave GEMINI_API_KEY)*

---

## 6. Status da Verificação

- **TypeScript**: `node_modules\.bin\tsc --noEmit` — **0 erros**.
- **Production Build**: `next build` — compilação bem-sucedida incluindo a rota dinâmica `ƒ /api/analyze-week`.
- **API Gemini**: Processada exclusivamente no servidor via `process.env.GEMINI_API_KEY`.
- **Resiliência a Falhas**: Se a chave Gemini não estiver definida no ambiente ou a API falhar, a semana permanece concluída com snapshot salvo e o cartão exibe aviso com opção de tentar novamente.
- **Visual & UX**: Botões e badges discretos sem estados de erro para porcentagens baixas.
- **Export Semana Atual**: PDF (window.print A4), Markdown, JSON semana (exportVersion, guide, metadata, schedule, responses, tasks, progress, completionSnapshot, aiReview).
- **Backup Completo**: JSON com todas as semanas + tema/paleta; sem API keys ou credenciais.
- **Import com confirmação**: Parsing e validação antes de sobrescrever; preview de semanas + data de exportação; cancelável.
