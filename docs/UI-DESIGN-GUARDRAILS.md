# UI-DESIGN-GUARDRAILS.md

> Regras obrigatórias de design para o projeto **Guia de Retomada**.
> Todo agente/modelo que modifique componentes visuais **deve ler e obedecer** este documento antes de fazer qualquer alteração.

---

## 1. Identidade Visual — Preservar Sem Redesenho

- O projeto tem uma identidade visual estabelecida: paleta editorial com tons quentes (sage/pergaminho por padrão), tipografia serif+sans, estilo limpo e contemplativo.
- **Não redesenhe partes que já estejam boas.** Correções de contraste, acessibilidade e responsividade não são justificativa para substituir a identidade visual.
- Mantenha os mesmos componentes, hierarquia de seções, e estrutura de layout. Ajuste apenas o que está quebrado ou abaixo dos requisitos.
- Preservar: hero section, sidebar desktop, section-cards, scripture blocks, schedule grid, settings modal.

---

## 2. Sistema de Tokens — Regras de Uso

### 2.1 Sempre usar tokens semânticos

```css
/* CORRETO */
color: var(--foreground);
background: var(--card);
border-color: var(--border);

/* ERRADO — hardcoded */
color: #333;
background: #fff;
border-color: oklch(0.9 0.014 110);  /* se há token disponível */
```

### 2.2 Tokens obrigatórios por palette × theme

Cada combinação `[palette] × [light|dark]` **deve definir todos** os tokens abaixo:

| Token | Uso |
|-------|-----|
| `--background` | Fundo da página |
| `--foreground` | Texto principal |
| `--card` | Superfície de cards |
| `--card-foreground` | Texto em cards |
| `--popover` | Fundo de popovers/modais |
| `--popover-foreground` | Texto em popovers |
| `--primary` | Cor primária (botões, links, destaques) |
| `--primary-foreground` | Texto sobre primário |
| `--secondary` | Superfície secundária |
| `--secondary-foreground` | Texto sobre secundário |
| `--muted` | Superfície atenuada |
| `--muted-foreground` | Texto atenuado (mínimo 4.5:1 sobre `--background`) |
| `--accent` | Superfície de hover/accent |
| `--accent-foreground` | Texto sobre accent |
| `--border` | Bordas |
| `--input` | Bordas de inputs |
| `--ring` | Focus ring |
| `--destructive` | Erros, ações destrutivas |
| `--gold` | Destaque editorial (numeração, kickers) |
| `--gold-foreground` | Texto sobre gold |

### 2.3 Não adicionar tokens desnecessários

Antes de criar um token novo, verifique se um semântico existente atende. Tokens novos só com justificativa documentada aqui.

---

## 3. Contraste WCAG — Limites Mínimos

### Regras de contraste

| Tipo de elemento | Mínimo WCAG | Notas |
|-----------------|-------------|-------|
| Texto normal (< 18pt / < 14pt bold) | **4.5:1** | Padrão AA |
| Texto grande (≥ 18pt / ≥ 14pt bold) | **3:1** | Padrão AA large |
| Controles visuais (ícones, bordas, indicadores) | **3:1** | |
| Texto decorativo / inativo (disabled) | Isento | Mas não abusar |

### Regras de aplicação

- `--muted-foreground` sobre `--background` deve ser **≥ 4.5:1** (é texto normal, não decorativo).
- `--muted-foreground` sobre `--muted` deve ser **≥ 4.5:1**.
- `--foreground` sobre `--card` deve ser **≥ 7:1** (texto de leitura, objetivo AAA).
- `--primary` sobre `--background` deve ser **≥ 3:1** (é controle visual e texto grande).
- `--primary-foreground` sobre `--primary` deve ser **≥ 4.5:1**.
- `--gold-foreground` sobre `--background` deve ser **≥ 4.5:1**.
- `--gold-foreground` sobre `--card` deve ser **≥ 4.5:1**.
- `--destructive` sobre `--background` deve ser **≥ 3:1**.

### Proibido

- Resolver hierarquia visual tornando textos **quase invisíveis** (opacity < 0.4 em texto informativo).
- Usar `opacity-X` em texto que precisa ser lido (prefira `--muted-foreground`).
- `text-muted-foreground/30` ou qualquer opacity abaixo de 60% em texto de conteúdo.

---

## 4. Dark Mode

- **Cada paleta deve ter variante dark funcional.** Não basta inverter lightness — as relações de contraste devem ser verificadas independentemente.
- Em dark mode, backgrounds devem ser escuros (L < 0.25), foregrounds claros (L > 0.75).
- Em dark mode, `--primary` deve ser mais claro (L ≥ 0.60) para manter legibilidade.
- Testar: `sage-dark`, `terracotta-dark`, `blue-dark`, `graphite-dark`, `olive-dark`.

---

## 5. Responsividade Mobile

### Dispositivo prioritário
**iPhone 17 portrait em Safari/iOS** — mas **não hardcode pixels físicos**.

### Breakpoints de validação (CSS px)
`320 · 360 · 375 · 390 · 402 · 430 · 768 · 1024 · 1440`

### Regras obrigatórias

1. **Sem overflow horizontal da página** (`overflow-x: hidden` na raiz não é solução — a causa deve ser corrigida).
2. **Mínimo touch target: 44×44 CSS px** para botões e controles interativos.
3. **font-size ≥ 16px** em inputs e textareas para **evitar zoom automático no iOS Safari**.
4. **safe-area-inset** deve ser respeitado onde aplicável:
   - Header fixo/sticky: `padding-top: env(safe-area-inset-top)` se `position: fixed`.
   - Drawers/modais que tocam a borda inferior: `padding-bottom: env(safe-area-inset-bottom)`.
   - Bottom navigation (se houver): mesma regra.
5. **Não comprimir o layout desktop em mobile.** Redesenhar para mobile quando necessário.
6. **Drawers mobile** devem ter área de toque de fechamento (overlay) funcional.
7. **Inputs de formulário**: label visível, placeholder complementar (não substituto).

### Checklist por componente

| Componente | Validação |
|-----------|-----------|
| Header | Sem overflow, botões acessíveis, safe-area-top se fixed |
| Drawers mobile | Overlay de fechamento, safe-area-bottom |
| Modais | Full-screen em mobile, safe-area em ambas extremidades |
| Cards de seção | Padding fluido (não fixo) |
| Schedule grid (7 dias) | Colapsa em lista/grid 2-col em mobile |
| Settings modal | Abas com scroll horizontal, conteúdo scrollável |
| Inputs/textareas | font-size ≥ 16px, largura 100% |
| Botões | min-height 44px, padding adequado |
| Scale (0-10) | Botões de 36×36px mínimo, wrap adequado |

---

## 6. Interatividade — Requisitos

- Todo `<button>` deve ter `type="button"` ou `type="submit"` explícito.
- Botões em formulários que **não submetem** devem ter `type="button"`.
- `onClick` deve ser testado e funcional (sem handlers vazios).
- Estados `disabled` devem ter `cursor: not-allowed` e opacity reduzida, mas legível.
- **z-index hierarchy** (ordem crescente):
  - Content: 0–10
  - Sticky header: 40
  - Drawers mobile: 50
  - Modais/overlays: 50
  - Toast/alerts: 60
- Overlays de fechamento devem capturar click mas não ter `pointer-events: none`.
- Focus ring visível em todos os controles (`outline-ring/40` ou similar).

---

## 7. Acessibilidade Básica

- Usar `aria-label` em botões sem texto visível.
- `aria-pressed` em toggle buttons.
- `role="checkbox"` em checkboxes customizadas.
- Não remover `:focus-visible` sem substituto.
- Imagens decorativas: `aria-hidden="true"`.

---

## 8. O que NÃO fazer

- Não instalar novas dependências de UI sem justificativa.
- Não substituir o sistema de design tokens por outro (ex: não migrar para tailwind.config.ts, não adicionar variáveis CSS paralelas).
- Não alterar o schema de dados do localStorage.
- Não criar novas features visuais (novos modais, novas abas, novos fluxos) sem aprovação explícita do usuário.
- Não remover funcionalidades existentes para "simplificar".
- Não usar `!important` exceto em `@print`.
- Não usar `@apply` com classes que não existam no projeto.

---

## 9. Checklist de Revisão Antes de Commit

```
[ ] TypeScript: `tsc --noEmit` sem erros
[ ] Build: `next build` sem erros
[ ] Light mode: sage / terracotta / blue / graphite / olive — legíveis
[ ] Dark mode: sage / terracotta / blue / graphite / olive — legíveis
[ ] Mobile 375px: sem overflow horizontal
[ ] Mobile 375px: botões acessíveis com toque
[ ] Mobile 375px: inputs sem zoom (font-size ≥ 16px)
[ ] Modais: abre e fecha corretamente
[ ] Drawers: abre e fecha corretamente
[ ] Formulários: submit funciona
[ ] Contraste muted-foreground/background: ≥ 4.5:1 em todas combinações
```
