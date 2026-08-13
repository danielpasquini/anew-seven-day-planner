# PROJECT-STATE.md — Guia de Retomada (Ciclos Semanais)

> Última atualização: 2026-08-13 (Abstração GuideTemplate & Meus Guias Concluída)
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
| Persistência | localStorage (chave `guia-retomada-v2`, schema v4) | — |
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
      route.ts      — POST API Handler Server-Side para Gemini desacoplado (Structured Output JSON via completionConfig)

components/
  guide-app.tsx     — Componente principal com botões de completar semana, header, drawers e Meus Guias
  my-guides-modal.tsx — Modal "Meus Guias" para selecionar guia ativo, ver semanas e criar novas semanas vinculadas
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
  guide-data.ts     — Tipos, GuideTemplate, CompletionConfig, conteúdo estático (intro + 17 sections), DEFAULT_GUIDE_TEMPLATE
  store.tsx         — StoreProvider (Context + useState), GuideTemplateSnapshot, WeekInstance, status,
                      completionSnapshot, aiReview, completeWeek, reopenWeek, generateAIReview,
                      persistência v4, tema/paleta, export MD/JSON, import JSON
  date-utils.ts     — Funções de data: calculateInclusiveEndDate, getNextDayDate, formatDateRangeBR
  utils.ts          — cn() (clsx + tailwind-merge)
```

---

## 3. Schema atual (localStorage `guia-retomada-v2`, `schemaVersion: 4`)

```typescript
type CompletionConfig = {
  enabled: boolean
  reviewTitle: string
  analysisDimensions: string[]
  nextWeekFocusRules: string[]
  theologyReviewEnabled: boolean
}

type GuideTemplate = {
  id: string
  title: string
  description: string
  version: number
  createdAt: string
  updatedAt: string
  schemaVersion: number
  config: {
    targetAudience?: string
    category?: string
  }
  intro: typeof intro
  sections: Section[]
  scheduleTaskIds: string[]
  weeklyPlan: ScheduleActivityItem[]
  quickSheets?: { id: string; title: string; summary: string }[]
  theologyEnabled: boolean
  completionConfig: CompletionConfig
}

type GuideTemplateSnapshot = {
  id: string
  title: string
  version: number
  completionConfig: CompletionConfig
}

type StoreDataV4 = {
  schemaVersion: 4
  guides: GuideTemplate[]
  activeGuideId: string
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
  guideVersion?: number
  guideSnapshot?: GuideTemplateSnapshot | null
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
| Separação GuideTemplate × WeekInstance | `guide-data.ts`, `store.tsx` |
| Versionamento & Snapshot do Template nas Semanas (`guideSnapshot`) | `store.tsx` |
| Área UI "Meus Guias" (selecionar guia, ver semanas, criar semana) | `components/my-guides-modal.tsx`, `guide-app.tsx` |
| Formulário "+ Criar Novo Guia" com Validação, Rascunho e Revisão | `components/create-guide-modal.tsx`, `my-guides-modal.tsx` |
| Cálculo de Teologia no Código (`theologyEnabled` baseado no preenchimento) | `create-guide-modal.tsx` |
| Motor de Conclusão AI Desacoplado via `completionConfig` | `app/api/analyze-week/route.ts` |
| Preservação / Migração segura para schema v4 | `store.tsx` (sem perda de dados de v3/v2/v1) |
| Completar Semana (Encerramento Formal) | `store.tsx`, `complete-week-modal.tsx`, `guide-app.tsx` |
| Snapshot de Conclusão (`completionSnapshot`) | `store.tsx` → `createSnapshot` |
| Análise Inteligente Server-Side Gemini AI | `app/api/analyze-week/route.ts` (Structured Output JSON) |
| Resiliência à Falha de API (Semana Concluída + Retry) | `store.tsx`, `week-review-card.tsx` |
| Reabrir Semana Concluída | `store.tsx` → `reopenWeek` |
| Detecção de Análise Desatualizada após edição | `store.tsx` (`aiReviewOutdated: true`) |
| Toggle `countsTowardCompletion` por Atividade | `schedule-block.tsx` |
| Badge Discreto de Status (`Concluída · X%`) | `guide-app.tsx`, `settings-modal.tsx`, `my-guides-modal.tsx` |
| 17 seções do guia com Escritura | `guide-data.ts`, `section-card.tsx` |
| Múltiplas semanas independentes (CRUD) | `store.tsx`, `week-modal.tsx`, `settings-modal.tsx` |
| 5 paletas de cores com WCAG ≥ 4.5:1 | `globals.css`, `docs/contrast-check.mjs` |
| Guardrails visuais permanentes | `docs/UI-DESIGN-GUARDRAILS.md` |
| Exportação Markdown / JSON semana / PDF com GuideTemplate | `store.tsx` → `exportToMarkdown`, `exportWeekJSON`; `settings-modal.tsx` |
| Exportação Backup Completo JSON (schema v4 com guides) | `store.tsx` → `exportToJSON` |
| Importação com preview de confirmação antes de sobrescrever | `settings-modal.tsx` → `pendingImport` state + `handleConfirmImport` |

---

## 5. Arquivos Modificados / Criados nesta Etapa

- `components/create-guide-modal.tsx` *(novo: modal de formulário em 2 etapas com validação, rascunho local e revisão de novo guia)*
- `components/my-guides-modal.tsx` *(atualizado: integração do botão "+ Criar Novo Guia" com o CreateGuideModal)*
- `lib/guide-data.ts` *(expandido: GuideTemplate, CompletionConfig, DEFAULT_GUIDE_TEMPLATE v1)*
- `app/api/analyze-week/route.ts` *(atualizado: motor de conclusão dinâmico via completionConfig)*
- `lib/store.tsx` *(atualizado: schema v4, GuideTemplateSnapshot, activeGuide, selectGuide, export/import v4)*
- `components/guide-app.tsx` *(atualizado: integração "Meus Guias" no header e mobile drawer)*
- `PROJECT-STATE.md` *(atualizado: documentação do estado e schema v4)*

---

## 6. Status da Verificação

- **TypeScript**: `node_modules\.bin\tsc --noEmit` — **0 erros**.
- **Production Build**: `next build` — compilação bem-sucedida incluindo a rota dinâmica `ƒ /api/analyze-week`.
- **Formulário de Criação de Guia**:
  - Campos: Nome do guia, foco, esquemas, traumas/experiências, dificuldades atuais, áreas prioritárias, linhas da psicologia, teologia/cosmovisão, rotina/horários, o que ajuda, limites/coisas a evitar, intensidade (muito leve / leve / moderada) e observações adicionais.
  - Regra de Teologia: Calculada puramente no código TypeScript (`theologyEnabled = Boolean(theologyCosmovision && theologyCosmovision.trim().length > 0)`).
  - Validação: Validação visual e bloqueio de avanço para campos obrigatórios vazios.
  - Rascunho Local: Persistência automática em `localStorage` (`guia-novo-draft`) com opção de limpar rascunho.
  - Fluxo: Formulário → Revisão detalhada de parâmetros → Pronto para futura geração por IA (sem chamada à IA nesta etapa).
  - Responsividade: Otimizado para iPhone 17 (inputs 16px, touch targets >= 44px) e desktop.

