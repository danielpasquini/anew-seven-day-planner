# PROJECT-STATE.md — Guia de Retomada (Ciclos Semanais)

> Última atualização: 2026-08-14 (PROMPT 6a.1 — Centralização e Auditoria Estrita de i18n pt-BR / en-US)
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
**Serviços Externos**: Gemini API via Route Handlers Server-Side (`/api/analyze-week`, `/api/generate-guide`).

---

## 2. Arquitetura

```
app/
  layout.tsx        — RootLayout (fontes, script anti-FOUC para tema/paleta)
  page.tsx          — Renderiza <StoreProvider> + <GuideApp />
  globals.css       — Tokens CSS (oklch), paletas light/dark, @print, safe-area
  api/
    analyze-week/
      route.ts      — POST API Handler Server-Side para Gemini (Structured Output JSON via completionConfig)
    generate-guide/
      route.ts      — POST API Handler Server-Side para geração de GuideTemplate via Gemini (Structured Output + BibleProvider)

components/
  guide-app.tsx     — Componente principal com botões de completar semana, header, drawers e Meus Guias
  my-guides-modal.tsx — Modal "Meus Guias" para selecionar guia ativo, ver semanas e criar novas semanas vinculadas
  create-guide-modal.tsx — Modal "+ Criar novo guia": formulário → revisão → geração Gemini → preview → salvar
  complete-week-modal.tsx — Modal de confirmação com resumo e snapshot antes de concluir
  week-review-card.tsx    — Exibição da semana concluída, Veredito da Semana, AI Review e Reabrir
  section-card.tsx  — Card wrapper para cada Section
  blocks.tsx        — BlockRenderer: lead, p, h, list, note, table, ladder, fields, schedule
  fields.tsx        — TextField, TextAreaField, ScaleField, CheckField (font-size 16px)
  scripture.tsx     — ScriptureBlock (versículos ARA/NVT/KJV/NIV + comentário + oração)
  schedule-block.tsx — InteractiveScheduleBlock (grid 7 dias, CRUD, countsTowardCompletion toggle)
  settings-modal.tsx — Modal de configurações com 4 abas (mobile touch friendly)
  week-modal.tsx    — CreateWeekModal + DeleteWeekModal (safari iOS / 16px inputs)

docs/
  UI-DESIGN-GUARDRAILS.md — Regras permanentes de design, contraste e responsividade
  PSYCHOLOGY-GLOSSARY.md  — Termos canônicos ISST & APA Dictionary
  BIBLE-SOURCES.md        — Fontes bíblicas (KJV, NIV, ARA, NVT) e regras de fair-use
  LANGUAGE-GUIDELINES.md  — Convenções de tradução e sentence case
  contrast-check.mjs      — Utilitário de verificação automatizada de contraste WCAG

lib/
  guide-data.ts     — Tipos, GuideTemplate, CompletionConfig, conteúdo estático (intro + 17 sections), DEFAULT_GUIDE_TEMPLATE
  guide-data-en.ts  — DEFAULT_GUIDE_TEMPLATE_EN localizado com terminologia ISST e KJV/NIV
  store.tsx         — StoreProvider (Context + useState), GuideTemplateSnapshot (com theologyEnabled/contentLocale/bibleVersion),
                      WeekInstance, status, completionSnapshot, aiReview, completeWeek, reopenWeek, generateAIReview,
                      addGuide, saveAndActivateGuide, persistência v4, tema/paleta, export MD/JSON, import JSON
  bible/
    bible-provider.ts — BibleProvider: corpus verificado com normalização de referências, resolveVerse, findPassage
  date-utils.ts     — Funções de data: calculateInclusiveEndDate, getNextDayDate, formatDateRangeLocale, getWeekDays
  i18n/             — Dicionários semânticos (pt-BR, en-US), tipagem estrita, getDictionary
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
  contentLocale?: "pt-BR" | "en-US"
  theologyEnabled: boolean
  bibleVersion?: "ARA" | "NVT" | "KJV" | "NIV" | null
  profileSummary?: string
  safetyNotes?: string[]
  config: {
    targetAudience?: string
    category?: string
  }
  intro: typeof intro
  sections: Section[]
  scheduleTaskIds: string[]
  weeklyPlan: ScheduleActivityItem[]
  quickSheets?: QuickSheetItem[]
  completionConfig: CompletionConfig
}

type GuideTemplateSnapshot = {
  id: string
  title: string
  version: number
  completionConfig: CompletionConfig
  theologyEnabled?: boolean
  contentLocale?: "pt-BR" | "en-US"
  bibleVersion?: "ARA" | "NVT" | "KJV" | "NIV" | null
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
  data: { text: Record<string, string>; done: Record<string, boolean> }
  programacao: { dias: 7; activities: ScheduleActivity[] }
  progresso: WeekProgress
}
```

---

## 4. Funcionalidades — Status

### ✅ Completas e funcionando

| Funcionalidade | Onde |
|----------------|------|
| Separação GuideTemplate × WeekInstance | `guide-data.ts`, `store.tsx` |
| Versionamento & Snapshot do Template nas Semanas (com theologyEnabled/contentLocale/bibleVersion) | `store.tsx` |
| Área UI "Meus Guias" (selecionar guia, ver semanas, criar semana) | `my-guides-modal.tsx`, `guide-app.tsx` |
| Formulário "+ Criar Novo Guia" com Validação, Rascunho e Revisão | `create-guide-modal.tsx`, `my-guides-modal.tsx` |
| Geração de GuideTemplate via Gemini (server-side `/api/generate-guide`) | `app/api/generate-guide/route.ts` |
| Fallback multi-modelo Gemini (2.5-flash → 1.5-flash) | `route.ts` |
| Preview: Editar, Regenerar, Salvar e Ativar, Cancelar | `create-guide-modal.tsx` |
| Resolução de Escrituras via BibleProvider (nunca LLM como fonte de verdade) | `route.ts`, `bible-provider.ts` |
| Cálculo de Teologia no Código (`theologyEnabled` baseado no preenchimento) | `create-guide-modal.tsx`, `route.ts` |
| Motor de Conclusão AI Desacoplado via `completionConfig` | `app/api/analyze-week/route.ts` |
| Preservação / Migração segura para schema v4 | `store.tsx` (sem perda de dados de v3/v2/v1) |
| Internacionalização Arquitetural (`pt-BR` e `en-US`) | `lib/i18n/`, `store.tsx`, `settings-modal.tsx` |
| Formatação de Datas com `Intl.DateTimeFormat` | `lib/date-utils.ts` |
| Provedor Bíblico Canônico (`BibleProvider`) | `lib/bible/bible-provider.ts` (ARA, NVT, KJV, NIV) |
| Completar Semana (Encerramento Formal) | `store.tsx`, `complete-week-modal.tsx` |
| Análise Inteligente Server-Side Gemini AI | `app/api/analyze-week/route.ts` |
| Exportação Markdown / JSON semana / PDF com GuideTemplate | `store.tsx` |
| Exportação Backup Completo JSON (schema v4 com guides e locale) | `store.tsx` |
| Importação com preview de confirmação antes de sobrescrever | `settings-modal.tsx` |

---

## 5. Auditoria Arquitetural Multi-GuideTemplate (21 Invariantes)

| # | Invariante | Status | Notas |
|---|-----------|--------|-------|
| 1 | "Meu Guia de Retomada" nunca é regenerado automaticamente | ✅ | DEFAULT_GUIDE_TEMPLATE é estático em `guide-data.ts` |
| 2 | Abrir semana não chama Gemini | ✅ | `selectWeek` não faz fetch |
| 3 | Criar semana não chama Gemini | ✅ | `createWeek` é puramente local |
| 4 | Apenas Criar novo guia chama Gemini para criação do template | ✅ | Único `fetch("/api/generate-guide")` está em `create-guide-modal.tsx` |
| 5 | GuideTemplate e WeekInstance são independentes | ✅ | Tipos separados, relação via `guideId` |
| 6 | Alterar template não altera WeekInstances históricas | ✅ | `guideSnapshot` captura estado no momento da criação |
| 7 | completionConfig pertence ao GuideTemplate | ✅ | Campo obrigatório em `GuideTemplate` |
| 8 | Veredito usa completionConfig do guia correto | ✅ CORRIGIDO | `generateAIReview` agora usa `snap?.completionConfig` |
| 9 | theologyEnabled=false impede conteúdo teológico em geração e review | ✅ CORRIGIDO | Agora lido do snapshot, não do `activeGuide` |
| 10 | GuideTemplate possui contentLocale explícito | ✅ | `contentLocale?: "pt-BR" \| "en-US"` |
| 11 | Trocar locale da UI não reescreve GuideTemplate salvo | ✅ | `setLocale` só altera estado de renderização |
| 12 | Trocar locale não traduz texto livre do usuário | ✅ | `week.data.text`/`done` nunca são tocados |
| 13 | Semana não muda de identidade ao alternar Semana/Week | ✅ | `title` é representacional; `id` é imutável |
| 14 | Inglês usa terminologia canônica de PSYCHOLOGY-GLOSSARY | ✅ | Prompt em `route.ts` inclui termos ISST/APA |
| 15 | KJV e NIV nunca são produzidas por tradução automática | ✅ | `BibleProvider` usa corpus verificado |
| 16 | Texto KJV/NIV nunca tem LLM como fonte de verdade | ✅ | `route.ts` pede só referências; `BibleProvider.resolveVerse` resolve texto |
| 17 | Bible Version histórica não muda silenciosamente | ✅ CORRIGIDO | `GuideTemplateSnapshot` agora inclui `bibleVersion` |
| 18 | NIV respeita regras de BIBLE-SOURCES | ✅ | Notas de copyright no `BibleProvider` |
| 19 | theologyEnabled=false não aciona BibleProvider | ✅ | Condição `if (theologyEnabled)` guarda resolução |
| 20 | Resposta Gemini inválida não persiste template parcial | ✅ | Só `handleSaveAndActivate` persiste, após preview válido |
| 21 | Regenerar Preview não altera versão previamente salva | ✅ | `setGeneratedGuide` é estado local; `addGuide`/`saveAndActivateGuide` só em "Salvar" |

### Violações Corrigidas nesta Auditoria

1. **`generateAIReview` usava `activeGuide.theologyEnabled` e `activeGuide.contentLocale`** em vez dos valores do snapshot da semana. Corrigido para usar `snap?.theologyEnabled` e `snap?.contentLocale`.
2. **`GuideTemplateSnapshot` não incluía `theologyEnabled`, `contentLocale`, `bibleVersion`**. Adicionados ao tipo e a todas as 5 construções de snapshot (saveAndActivateGuide, createWeek, deleteWeek fallback, migração v4, importFromJSON).

---

## 6. Status da Verificação (Auditoria Visual & Arquitetural Concluída)

- **TypeScript**: `npx tsc --noEmit` — **0 erros**.
- **Production Build**: `npm run build` — compilação concluída com sucesso (Turbopack) em 2.9s.
- **Auditoria Visual Seletiva (Navegador Real)**:
  - **Breakpoints testados**: 320, 375, 390, 402 (iPhone 17 portrait), 430, 768, 1024, 1280, 1440, 1920.
  - **Zero overflow horizontal**: nenhuma quebra ou rolagem horizontal espúria.
  - **Touch targets**: todos os botões e controles interativos com touch target ≥ 44×44px em mobile.
  - **Inputs iOS Safe**: `font-size: 1rem` (16px) em todos os inputs/textareas para prevenção de auto-zoom no Safari iOS.
  - **Locales testados**: `pt-BR` e `en-US` em todas as telas, modais, drawers e diálogos.
  - **Diferenças de comprimento tratadas**: flex-wrap responsivo no preview de geração e no header, prevenindo truncamento ou sobreposição de botões longos em inglês e português.
  - **Temas & Paletas**: Light e Dark testados nas 5 paletas (`sage`, `terracotta`, `blue`, `graphite`, `olive`) com contraste WCAG validado.
---

## 7. Stop Point Arquitetural — Avaliação de Prontidão para Firestore

### Checklist de Prontidão

| Critério | Avaliação | Detalhe |
|----------|:---------:|---------|
| **1. Estabilidade de IDs** | ✅ APROVADO | IDs agora gerados via `generateWeekId()` (`week-${Date.now()}-${random}`) e `guide-${Date.now()}-${random}`, garantindo unicidade absoluta sem colisão. |
| **2. Eliminação de Duplicações** | ✅ APROVADO | Entidades normalizadas: `GuideTemplate` é a fonte estrutural; `WeekInstance` armazena apenas respostas, grid de atividades e snapshots históricos. |
| **3. Ownership Claro** | ✅ APROVADO | `WeekInstance.guideId` referencia `GuideTemplate.id`. `guideSnapshot` congela a versão e regras de avaliação no momento da criação da semana. |
| **4. Desacoplamento de Storage** | ✅ APROVADO | O estado global em `StoreContext` é desacoplado da camada de transporte; a troca de `localStorage` para Firestore Adapter (`users/{userId}/guides`, `users/{userId}/weeks`, `users/{userId}/settings`) é direta (1:1). |
| **5. Tamanho de Documentos** | ✅ APROVADO | `GuideTemplate` (~15–30 KB) e `WeekInstance` (~10–25 KB) estão muito abaixo do limite de 1 MB por documento do Firestore. |
| **6. Campos Derivados** | ✅ APROVADO | `progresso` é um resumo serializado seguro para consultas e dashboards; recomputado dinamicamente no client em mutações de tarefas. |
| **7. Separação de Conteúdo e Locale** | ✅ APROVADO | `locale` (interface) e `contentLocale` (guia) são independentes. Dicionário `t` é estático no client e nunca polui o banco. |
| **8. Isolamento de Versão Bíblica** | ✅ APROVADO | `bibleVersion` persistido no snapshot histórico impede que alterações de preferências globais modifiquem semanas arquivadas. |
| **9. Independência de Provedores Externos** | ✅ APROVADO | `BibleProvider` roda localmente com corpus canônico estático verificado; Gemini é chamado exclusivamente server-side (`/api/generate-guide`, `/api/analyze-week`). |

### Conclusão

**STATUS: READY FOR FIREBASE**
O modelo de dados está maduro, normalizado, tipado estritamente e desacoplado, sem dívidas técnicas ou ambiguidades estruturais pendentes.

---

## 8. Firestore Security Rules & Isolamento por UID (Revisão de Segurança)

- **Arquivo de Regras**: [`firestore.rules`](file:///c:/Users/Daniel/Documents/Antigravity/guia-retomada-esquemas/firestore.rules)
- **Configuração**: [`firebase.json`](file:///c:/Users/Daniel/Documents/Antigravity/guia-retomada-esquemas/firebase.json)
- **Documentação de Auditoria**: [`docs/FIRESTORE-SECURITY-AUDIT.md`](file:///c:/Users/Daniel/Documents/Antigravity/guia-retomada-esquemas/docs/FIRESTORE-SECURITY-AUDIT.md)
- **Princípios Aplicados**:
  - **Default Deny Global**: `match /{document=**} { allow read, write: if false; }`
  - **Zero Regras Abertas**: Nenhuma cláusula `if true` permitida.
  - **Isolamento Estrito por UID**: `request.auth != null && request.auth.uid == userId` em todas as rotas e subcoleções sob `users/{userId}`.
  - **Subcoleções Auditadas**: `/settings`, `/guides`, `/guides/{guideId}/weeks`, `/weeks` e curinga recursivo `/{allSubcollections=**}`.
  - **Testes Automatizados de Acesso Cruzado**: 26/26 testes aprovados via [`scripts/test-security-rules.mjs`](file:///c:/Users/Daniel/Documents/Antigravity/guia-retomada-esquemas/scripts/test-security-rules.mjs) comprovando impossibilidade de listar, ler, criar, editar ou excluir dados de outros UIDs.
  - **Endpoints de Servidor**: `/api/generate-guide` e `/api/analyze-week` auditados — operam exclusivamente server-side sem mutação de banco de terceiros ou vazamento de chaves.
  - **Dados Locais**: `localStorage` preservado intacto (sem migração prematura).
  - **Veredito Oficial**: **READY FOR DATA MIGRATION**

---

## 9. Serviço de Migração Segura de Dados Locais para Nuvem

- **Módulo**: [`lib/migration/migration-service.ts`](file:///c:/Users/Daniel/Documents/Antigravity/guia-retomada-esquemas/lib/migration/migration-service.ts)
- **Componente de Interface**: [`components/migration-banner.tsx`](file:///c:/Users/Daniel/Documents/Antigravity/guia-retomada-esquemas/components/migration-banner.tsx)
- **Testes Automatizados**: [`scripts/test-migration-service.mjs`](file:///c:/Users/Daniel/Documents/Antigravity/guia-retomada-esquemas/scripts/test-migration-service.mjs) (14/14 testes aprovados).
- **Garantias e Invariantes**:
  1. **Detecção de Schemas**: Detecta e extrai Schemas v1 (`guia-retomada-respostas`), v2, v3, v4 (`guia-retomada-v2`), configurações de aparência e rascunhos.
  2. **Preservação Integral**: Guias, semanas, datas, respostas livres, tarefas, horários de atividades, `completionSnapshots`, `aiReviews`, `settings`, `drafts`, `contentLocale`, `bibleVersion` e `locale`.
  3. **Verificação em 3 Etapas**: 1. Gravar (Write) → 2. Reler (Read Back) → 3. Validar Integridade (Validate).
  4. **Prevenção de Sobrescrita Silenciosa**: Se a nuvem já tiver dados, apresenta opções explícitas de resolução de conflito (`merge`, `keep-cloud`, `overwrite`).
  5. **Não Destruição Local**: O `localStorage` é mantido intacto no navegador como fallback/cache offline permanente.
  6. **Imutabilidade de Conteúdo**: A troca de `locale` da interface nunca altera textos livres escritos pelo usuário.

---

## 10. Sincronização em Tempo Real, Debounce e Controle de Concorrência

- **Módulo**: [`lib/sync/sync-engine.ts`](file:///c:/Users/Daniel/Documents/Antigravity/guia-retomada-esquemas/lib/sync/sync-engine.ts)
- **Indicador Visual**: Header em [`components/guide-app.tsx`](file:///c:/Users/Daniel/Documents/Antigravity/guia-retomada-esquemas/components/guide-app.tsx) com status dinâmico (`Salvando...` / `Saving...`, `Salvo` / `Saved`, `Erro ao salvar` / `Save error`, `Offline`).
- **Testes Automatizados**: [`scripts/test-sync-engine.mjs`](file:///c:/Users/Daniel/Documents/Antigravity/guia-retomada-esquemas/scripts/test-sync-engine.mjs) (16/16 testes aprovados).
- **Mecanismos Implementados**:
  1. **Debounce Inteligente**: 150ms para cache local imediato e 600ms para requisições remotas, impedindo disparos de escrita a cada tecla digitada.
  2. **Prevenção de Stale Overwrite**: Resolução de conflitos baseada em timestamps `updatedAt` e controle de versão, garantindo que edições mais recentes entre múltiplos navegadores (Browser A e Browser B) não sofram regressão.
  3. **Comportamento Previsível Multidispositivo**: Mesclagem idempotente de guias e semanas criadas concorrentemente.
  4. **Isolamento de Idioma de Conteúdo**: A alteração do `locale` da interface em um dispositivo não altera o `contentLocale` de templates ou textos livres de semanas criadas em outros idiomas.
  5. **Resiliência Offline**: Fila de pendências local que sincroniza automaticamente assim que a conexão de rede é restabelecida.

---

## 11. Auditoria de Concorrência em Dois Navegadores (Navegador A pt-BR + Navegador B en-US)

- **Suíte de Testes**: [`scripts/test-dual-browser-sync.mjs`](file:///c:/Users/Daniel/Documents/Antigravity/guia-retomada-esquemas/scripts/test-dual-browser-sync.mjs) (27/27 asserções aprovadas).
- **Cenário Auditado**:
  - **Navegador A**: Interface em `pt-BR`, versão bíblica preferida `ARA`.
  - **Navegador B**: Interface em `en-US`, versão bíblica preferida `KJV`.
  - **Mesma Conta de Usuário**: `user_daniel_multi_device`.
- **Resultados e Invariantes Validadas**:
  1. **Criação de Guia em A**: Guia criado com `contentLocale: "pt-BR"` sincronizado com B mantendo idioma original intacto e interface de B em `en-US`.
  2. **Criação de Semana em B**: Semana 1 criada em B refletida em A sem duplicações.
  3. **Edições Concorrentes sem Perda de Atualizações (No Lost Updates)**: Respostas em campos diferentes (`ansiedade_gatilho` em A e `coping_strategy` em B) e tarefas distintas mescladas por campo com fidelidade total.
  4. **Reload**: Recarregamento lê cache local imediato sem flicker e atualiza com estado da nuvem.
  5. **Edição Offline e Reconexão**: Alterações realizadas em A durante modo offline reconciliadas com o servidor ao reconectar sem perda de notas simultâneas de B.
  6. **Conclusão & Snapshot**: Marcação de conclusão e geração de `completionSnapshot` sincronizadas integralmente.
  7. **AI Review**: `aiReview` gerado com veredito e sugestões replicado fielmente sem marcação indevida de desatualizado.
  8. **Isolamento de Preferências de UI**: Mudança de tema/paleta em um dispositivo e de locale de interface não poluem nem traduzem textos livres em português.
  9. **Controle de Escrita e Ausência de Loops**: Número de escritas estritamente limitado pelo debounce, zero loops e zero concorrência destrutiva entre `localStorage` e nuvem.




