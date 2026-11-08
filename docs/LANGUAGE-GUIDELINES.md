# LANGUAGE-GUIDELINES.md — Diretrizes de Linguagem e Internacionalização

> Regras oficiais para o suporte bilíngue (**pt-BR** e **en-US**), gramática, redação e internacionalização no projeto **Guia de Retomada**.
> Data de atualização: 2026-08-13

---

## 1. Princípios Gerais de Internacionalização

1. **Locales Oficiais Suportados**:
   - `pt-BR` — Português do Brasil (**Idioma Padrão**).
   - `en-US` — Inglês (Estados Unidos).
2. **Separação entre Idioma da Interface e Conteúdo do Guia**:
   - **Interface Locale (`locale`)**: Determina os textos da navegação, menus, botões, modais, rótulos de configurações e mensagens do sistema.
   - **Content Locale (`contentLocale`)**: Determina o idioma do `GuideTemplate` selecionado.
   - Alterar o idioma da interface **não reescreve** guias existentes salvos em outro idioma.
3. **Invariante: Nunca Traduzir Conteúdo Livre do Usuário**:
   - Respostas digitadas pelo usuário (`week.data.text`), status de checkboxes (`week.data.done`), títulos personalizados de semanas, anotações de reflexão e dados históricos são estritamente preservados e nunca submetidos a tradução automática.

---

## 2. Padrões Gramaticais e Redação por Idioma

### 2.1 Português do Brasil (`pt-BR`)
- **Tom de Voz**: Contemplativo, lúcido, pastoral, acolhedor e clinicamente rigoroso.
- **Capitalização**: *Sentence case* em títulos, seções e botões (ex.: *"Completar semana"*, *"Meus guias"*, *"Revisão da semana"*), exceto para substantivos próprios e siglas.
- **Tratamento**: Direto, respeitoso e sóbrio (2ª pessoa amigável: *"o que você quer trabalhar agora"*, *"suas respostas"*).
- **Pontuação**: Uso formal da norma culta com acentuação e pontuação expressiva em citações.

### 2.2 Inglês (`en-US`)
- **Tone of Voice**: Clear, grounded, reflective, clinically accurate, and compassionate.
- **Capitalization**: *Sentence case* em botões e labels (ex.: *"Complete week"*, *"My guides"*, *"Weekly review"*); *Title Case* moderado apenas em títulos de seções principais editoriais.
- **Spelling**: Padrão americano (*behavioral*, *counseling*, *judgment*, *program*, *center*).
- **Termos Técnicos**: Obrigatoriamente alinhados ao [PSYCHOLOGY-GLOSSARY.md](PSYCHOLOGY-GLOSSARY.md).

---

## 3. Diretrizes para Conceitos Clínicos e Bíblia

1. **Psicologia**: Qualquer tradução ou novo termo psicológico deve obrigatoriamente consultar o arquivo [`docs/PSYCHOLOGY-GLOSSARY.md`](PSYCHOLOGY-GLOSSARY.md). Não invente termos ou faça traduções literais livres.
2. **Escritura e Teologia**:
   - Em `pt-BR`: versões **ARA** (Almeida Revista e Atualizada) e **NVT** (Nova Versão Transformadora).
   - Em `en-US`: versões **KJV** (King James Version) e **NIV** (New International Version).
   - Consulte [`docs/BIBLE-SOURCES.md`](BIBLE-SOURCES.md) para detalhes de copyright e identificadores de API.
   - **Regra Absoluta**: Nunca traduza versículos bíblicos de português para inglês via IA ou tradução automática. Utilize sempre as passagens verificadas das versões canônicas resolvidas pelo `BibleProvider`.

---

## 4. Datas e Formatação com `Intl`

A formatação de datas e intervalos semanais deve utilizar a API nativa `Intl.DateTimeFormat` associada ao locale ativo:

| Locale | Formato de Intervalo Semanal | Exemplo |
|--------|------------------------------|---------|
| `pt-BR` | `[dia]–[dia] de [mês] de [ano]` | `11–17 de agosto de 2026` |
| `en-US` | `[Month] [day]–[day], [year]` | `August 11–17, 2026` |

---

## 5. Arquitetura Centralizada de Chaves (i18n)

Não utilize condicionais dispersas como `locale === "pt-BR" ? "Salvar" : "Save"` dentro dos componentes. Todo texto de interface deve ser referenciado a partir do dicionário semântico estruturado (`lib/i18n/`).
