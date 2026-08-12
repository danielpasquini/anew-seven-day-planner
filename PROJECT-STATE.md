# PROJECT-STATE.md — Guia de Retomada (Ciclos Semanais)

> Última atualização: 2026-08-12
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
| Persistência | localStorage (chave `guia-retomada-v2`) | — |
| Build | Turbopack (dev) / Next.js (prod) | — |

**Não há**: Firebase, Firestore, autenticação, cloud sync, banco de dados, API routes.

---

## 2. Arquitetura

```
app/
  layout.tsx        — RootLayout (fontes, script anti-FOUC para tema/paleta)
  page.tsx          — Renderiza <StoreProvider> + <GuideApp />
  globals.css       — Tokens CSS (oklch), paletas light/dark, @print

components/
  guide-app.tsx     — Componente principal: header sticky, hero, sidebar,
                      seções, drawers mobile, modais
  section-card.tsx  — Card wrapper para cada Section
  blocks.tsx        — BlockRenderer: lead, p, h, list, note, table,
                      ladder, fields, schedule
  fields.tsx        — TextField, TextAreaField, ScaleField, CheckField
  scripture.tsx     — ScriptureBlock (versículos ARA/NVT + comentário + oração)
  schedule-block.tsx — InteractiveScheduleBlock (grid 7 dias, CRUD de atividades)
  settings-modal.tsx — Modal de configurações com 4 abas
  week-modal.tsx    — CreateWeekModal + DeleteWeekModal
  ui/button.tsx     — Button (shadcn/base-nova, não utilizado atualmente)

lib/
  guide-data.ts     — Tipos (Field, Block, Section, Scripture, GuideTemplate),
                      conteúdo estático (intro + 17 sections), scheduleTaskIds,
                      DEFAULT_GUIDE_TEMPLATE, GUIDE_TEMPLATES[]
  store.tsx         — StoreProvider (Context + useState), WeekInstance,
                      persistência v2, migração v1, CRUD semanas,
                      getText/setText/isDone/toggleDone, CRUD atividades,
                      tema/paleta, export MD/JSON, import JSON
  date-utils.ts     — Funções de data: calculateInclusiveEndDate (7 dias),
                      getNextDayDate, formatDateBR, formatDateRangeBR, getWeekDays
  utils.ts          — cn() (clsx + tailwind-merge)
```

### Fluxo de dados

```
localStorage ─► StoreProvider (Context) ─► useStore() hook ─► Componentes
                    │                              │
                    ▼                              ▼
              persist() (debounce 150ms)    getText/setText/isDone/toggleDone
```

Não há server components com estado. A página é `"use client"` via `StoreProvider`.

---

## 3. Schema atual (localStorage `guia-retomada-v2`)

```typescript
type StoreDataV2 = {
  schemaVersion: 2
  weeks: WeekInstance[]
  activeWeekId: string
}

type WeekInstance = {
  id: string               // "week-1" ou "week-{timestamp}"
  guideId: string           // DEFAULT_GUIDE_TEMPLATE.id
  templateId: string        // mesmo que guideId por enquanto
  title: string             // "Semana 1", etc.
  startDate: string         // "YYYY-MM-DD"
  endDate: string           // "YYYY-MM-DD" (inclusivo, +6 dias)
  createdAt: string         // ISO string
  updatedAt: string         // ISO string
  data: {
    text: Record<string, string>   // field.id → valor preenchido
    done: Record<string, boolean>  // task.id → concluída?
  }
  programacao: {
    dias: 7                        // sempre 7
    activities: ScheduleActivity[] // atividades editáveis por dia
  }
  progresso: {
    total: number
    concluidas: number
    percentual: number
  }
}

type ScheduleActivity = {
  id: string       // "act-{dayIndex}-{order}" ou "act-{timestamp}-{rand}"
  dayIndex: number // 0..6
  time: string     // "16:30"
  description: string
  order: number
}
```

**Chaves auxiliares no localStorage:**
- `guia-theme` → `"light" | "dark" | "system"`
- `guia-palette` → `"sage" | "terracotta" | "blue" | "graphite" | "olive"`
- `guia-retomada-v1` → formato legado (migrado na inicialização)

---

## 4. Funcionalidades — Status

### ✅ Completas e funcionando

| Funcionalidade | Onde |
|----------------|------|
| 17 seções de conteúdo do guia com Escritura | `guide-data.ts`, `section-card.tsx` |
| Múltiplas semanas independentes (CRUD) | `store.tsx`, `week-modal.tsx`, `settings-modal.tsx` |
| Semanas com exatamente 7 dias (data inclusiva) | `date-utils.ts`, `calculateInclusiveEndDate` |
| WeekInstance com dados isolados por semana | `store.tsx` |
| Persistência v2 em localStorage | `store.tsx` (chave `guia-retomada-v2`) |
| Migração automática de v1 para v2 | `store.tsx` (L314-326) |
| Navegação entre semanas (prev/next/select) | `guide-app.tsx` header |
| Programação semanal dinâmica (CRUD atividades) | `schedule-block.tsx`, `settings-modal.tsx` tab 2 |
| Edição de atividades (horário, descrição, dia, reordenação) | `schedule-block.tsx`, `settings-modal.tsx` |
| Settings modal com 4 abas | `settings-modal.tsx` |
| Tema Light / Dark / System (com anti-FOUC) | `layout.tsx`, `store.tsx`, `globals.css` |
| 5 paletas de cores (sage, terracotta, blue, graphite, olive) | `globals.css`, `store.tsx` |
| Exportação para Markdown (.md) | `store.tsx` → `exportToMarkdown` |
| Exportação/importação JSON (backup completo) | `store.tsx` → `exportToJSON` / `importFromJSON` |
| Impressão / PDF (via `window.print()`) | `settings-modal.tsx`, `globals.css` @print |
| Campos interativos: text, textarea, scale 0-10, checkbox | `fields.tsx` |
| Escada de exposição (ladder) com nota + checkbox | `blocks.tsx` |
| Progresso por semana (total, concluídas, %) | `store.tsx` → `computeProgress` |
| Sidebar desktop com semanas + índice de seções | `guide-app.tsx` |
| Drawer mobile para semanas + índice | `guide-app.tsx` |
| Hero com oração de abertura e salmo | `guide-app.tsx` |
| Abstração inicial GuideTemplate | `guide-data.ts` (L1156-1174) |
| Reiniciar respostas da semana ativa | `store.tsx` → `resetActiveWeek` |
| Atualizar metadados de semana (título, data início) | `store.tsx` → `updateWeekMeta` |

### ⚠️ Parcial / Início

| Item | Status |
|------|--------|
| `GuideTemplate` | Tipo definido + `DEFAULT_GUIDE_TEMPLATE` + `GUIDE_TEMPLATES[]` com 1 item. Não há UI para selecionar template nem geração dinâmica. |
| `scheduleTaskIds` | Calculado a partir do conteúdo estático da seção `schedule`, usado historicamente. O progresso agora é baseado em `programacao.activities`. Os IDs legados do schedule estático (`s1-dom09-0`, etc.) permanecem mortos na seção de conteúdo. |
| `button.tsx` (shadcn) | Componente instalado, mas **não é usado** em nenhum lugar do projeto. |
| `updateWeekMeta` | Funcionalidade no store, mas **sem UI** para edição inline de título/data no Settings. |
| `output: 'standalone'` em next.config | Configurado para deploy containerizado, mas sem Docker ou deploy configurado. |
| `ignoreBuildErrors: true` em next.config | Máscara de erros TypeScript no build. Atualmente não há erros, mas é um risco. |

### ❌ Não existem (e não devem ser criados agora)

- Firebase / Firestore
- Autenticação / login
- Cloud sync
- Geração de GuideTemplate com Gemini (IA)
- Conclusão formal de semana (`completionSnapshot`)
- Revisão por IA (`aiReview`)

---

## 5. Código morto / duplicações

| Item | Localização | Nota |
|------|-------------|------|
| `components/ui/button.tsx` | `components/ui/` | Componente shadcn instalado, não importado em nenhum lugar |
| `ScheduleCell` | `blocks.tsx` L23-50 | Renderiza células de schedule estático (tipo `schedule` no `guide-data`), mas o bloco agora é substituído pelo `InteractiveScheduleBlock` — as tasks estáticas do `guide-data` (`s1-dom09`, etc.) não são checkáveis pelo schedule dinâmico |
| `scheduleTaskIds` export | `guide-data.ts` L1141-1154 | Calculados do schedule estático. O progresso real usa `programacao.activities`. IDs não correspondem ao sistema dinâmico. |
| `CheckField` | `fields.tsx` L71-111 | Componente definido e exportado, mas **não é instanciado** em nenhum lugar |
| `metadata.json` (raiz) | raiz | Metadados do v0.app, irrelevante para o projeto local |
| `AGENTS.md` / `CLAUDE.md` | raiz | Auto-gerados pelo Next.js 16.3 (`agentRules` config) |
| `public/placeholder-*` | `public/` | Assets placeholder do v0.app, não referenciados |

---

## 6. Problemas identificados

### Nenhum erro bloqueante

- **TypeScript**: `tsc --noEmit` passa com 0 erros
- **Build**: `next build` compila e gera estático sem erros
- **Runtime**: App carrega e funciona (todas as 17 seções renderizam, campos interativos respondem, CRUD de semanas funciona)

### Alertas / riscos não-bloqueantes

| Risco | Severidade | Detalhes |
|-------|-----------|----------|
| Hydration mismatch (tema) | Baixa | O script anti-FOUC no `<head>` pode gerar hydration warning no dev. Comportamento esperado e inofensivo. |
| `ignoreBuildErrors: true` | Média | Mascara erros TS no build. Sem erros atualmente, mas deve ser removido quando estabilizar. |
| localStorage sem limite de quota | Média | Nenhum tratamento de `QuotaExceededError` além de `catch {}`. Muitas semanas com muitos dados de texto poderiam atingir o limite (~5-10MB). |
| Sem confirmação de perda de dados no import JSON | Média | `importFromJSON` sobrescreve todos os dados sem confirmação. |
| Schedule estático vs dinâmico | Baixa | O bloco `schedule` no `guide-data.ts` (seção 15) ainda existe com tasks hardcoded. O `InteractiveScheduleBlock` sobrescreve visualmente, mas os dados estáticos permanecem no schema. |
| Sem validação de startDate ao criar semana | Baixa | Permite criar semanas com datas sobrepostas ou no passado distante. |

---

## 7. Invariantes que NÃO podem ser quebradas

1. **Semana = exatamente 7 dias inclusivos.** `calculateInclusiveEndDate(start)` retorna `start + 6 dias`.
2. **Dados isolados por semana.** Cada `WeekInstance.data` é independente. Nunca compartilhar `text`/`done` entre semanas.
3. **Persistência em `guia-retomada-v2`.** Schema versão 2. Qualquer alteração de schema deve incrementar versão e incluir migração.
4. **Migração de v1 é one-way.** Dados v1 são lidos uma vez na inicialização e migrados para v2.
5. **Theme/palette via atributos no `<html>`.** Classe `dark` e atributo `data-palette` controlam as variáveis CSS.
6. **Progresso calculado a partir de `programacao.activities`.** Não do `scheduleTaskIds` estático.
7. **Sem remote git.** Repositório local apenas. Não configurar remote nem fazer push.
8. **Sem Firebase/auth/cloud.** Qualquer integração remota requer decisão explícita do dono do projeto.
9. **Conteúdo do guia (seções, versículos, orações) é dado sensível e pessoal.** Não modificar conteúdo textual das seções sem autorização.
10. **`useStore()` requer estar dentro de `<StoreProvider>`.** Todos os componentes que usam store devem estar abaixo dele na árvore.

---

## 8. Backlog sugerido (próximos passos, não implementar sem aprovação)

- [ ] Remover `ignoreBuildErrors: true` de `next.config.mjs`
- [ ] Limpar código morto (`CheckField`, `ScheduleCell` estático, `scheduleTaskIds`, `button.tsx`, `placeholder-*`)
- [ ] Adicionar UI para edição inline de título/data de semana no Settings
- [ ] Tratamento de `QuotaExceededError` no localStorage com alerta ao usuário
- [ ] Confirmação antes de importar JSON (sobrescreve tudo)
- [ ] Validação de datas ao criar semana (sobreposição, passado)
- [ ] Conclusão formal de semana com snapshot de progresso
- [ ] Geração dinâmica de GuideTemplate
- [ ] Testes automatizados (vitest ou playwright)
