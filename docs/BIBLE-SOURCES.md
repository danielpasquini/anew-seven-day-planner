# BIBLE-SOURCES.md — Fontes Bíblicas, Licenciamento e Identificadores

> Documentação oficial de versões bíblicas, identificadores de API, licenciamento e regras de citação para o projeto **Guia de Retomada**.
> Data de verificação: 2026-08-13

---

## 1. Versões Canônicas por Idioma

| Idioma | Versões Disponíveis | Padrão | Ordem no Seletor |
|--------|---------------------|--------|------------------|
| `pt-BR` | **ARA** (Almeida Revista e Atualizada)<br>**NVT** (Nova Versão Transformadora) | **ARA** | 1. ARA<br>2. NVT |
| `en-US` | **KJV** (King James Version)<br>**NIV** (New International Version) | **KJV** | 1. KJV<br>2. NIV |

---

## 2. Especificação Detalhada por Versão

### 2.1 KJV — King James Version (Authorized Version)
- **Idioma**: `en-US` / `en-GB`
- **Nome Oficial**: The Holy Bible, King James Version (1611 / 1769 Blayney Oxford Revision)
- **Detentor dos Direitos**: Domínio Público nos Estados Unidos e mundialmente (Crown Copyright reservado no Reino Unido sob Letters Patent da Coroa Britânica).
- **Provedor / API Identifiers**:
  - **API.Bible (American Bible Society)**: `de4e12af7f28f599-02` (eng-KJV)
  - **YouVersion Bible Platform**: `1` (KJV)
  - **Crosswire Sword Module**: `KJV`
- **Condições de Uso e Citação**:
  - Uso irrestrito em meios impressos, digitais, exportações e armazenamento local fora do Reino Unido.
  - No Reino Unido, uso acadêmico e sem fins lucrativos é permitido até 500 versículos sem autorização explícita da Crown's Patentee (Cambridge University Press).
- **Requisitos de Atribuição**: Nenhuma atribuição restritiva obrigatória; identificar a sigla `KJV` ou `King James Version` junto à citação.
- **Regras de Caching e Exportação**: Armazenamento em cache local, geração de PDF, Markdown e JSON permitidos sem restrição de volume.

### 2.2 NIV — New International Version
- **Idioma**: `en-US`
- **Nome Oficial**: The Holy Bible, New International Version®
- **Detentor dos Direitos / Licenciante**: Biblica, Inc.™ (publicada e distribuída nos EUA por Zondervan e no Reino Unido por Hodder & Stoughton).
- **Provedor / API Identifiers**:
  - **API.Bible (American Bible Society)**: `engNIV` (sujeito à chave API comercial de licenciamento Biblica)
  - **YouVersion Bible Platform**: `111` (NIV)
  - **Biblica Direct Platform**: `NIV-2011`
- **Política Oficial de Fair-Use (Uso Justo Não-Comercial da Biblica)**:
  1. Permite a citação de até **500 versículos** em trabalhos não-comerciais sem autorização prévia por escrito.
  2. Os versículos citados não podem somar um livro bíblico completo nem representar mais de **25% do total do documento** no qual estão inseridos.
  3. Toda exibição, exportação em PDF ou Markdown deve conter a menção explícita `NIV` e o aviso de copyright da Biblica.
- **Requisito Obrigatório de Atribuição**:
  > *Scripture quotations taken from The Holy Bible, New International Version®, NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide.*
- **Regras de Caching e Exportação**:
  - Permitido o armazenamento de passagens isoladas no app para consulta rápida offline do usuário.
  - Exportações em PDF e Markdown incluem o aviso de copyright oficial da Biblica no rodapé do documento exportado.

### 2.3 ARA — Almeida Revista e Atualizada
- **Idioma**: `pt-BR`
- **Nome Oficial**: A Bíblia Sagrada: Almeida Revista e Atualizada (2ª Edição)
- **Detentor dos Direitos**: Sociedade Bíblica do Brasil (SBB), © 1993.
- **Provedor / API Identifiers**:
  - **YouVersion Bible Platform**: `160` (ARA)
  - **SBB Digital**: `ARA`
- **Requisito de Atribuição**: *Texto bíblico extraído da Bíblia Sagrada, Almeida Revista e Atualizada®, Sociedade Bíblica do Brasil.*
- **Regras de Exportação**: Permitida citação pontual de passagens breves com indicação de autoria.

### 2.4 NVT — Nova Versão Transformadora
- **Idioma**: `pt-BR`
- **Nome Oficial**: Bíblia Sagrada, Nova Versão Transformadora®
- **Detentor dos Direitos**: Editora Mundo Cristão, © 2016.
- **Provedor / API Identifiers**:
  - **YouVersion Bible Platform**: `1930` (NVT)
  - **Mundo Cristão**: `NVT-2016`
- **Requisito de Atribuição**: *Texto bíblico: Nova Versão Transformadora (NVT), © 2016 Editora Mundo Cristão.*

---

## 3. Abstração de Arquitetura (`BibleProvider`)

O aplicativo não realiza chamadas dispersas ou acopladas. Todas as consultas bíblicas são tratadas pela camada de serviço:

```typescript
type BibleResolveQuery = {
  reference: string
  version: "KJV" | "NIV" | "ARA" | "NVT"
  locale: "pt-BR" | "en-US"
}

interface BiblePassageResult {
  reference: string
  version: string
  text: string
  copyrightNotice?: string
}

interface BibleProvider {
  resolvePassage(query: BibleResolveQuery): BiblePassageResult
  getAttributionNotice(version: string, locale: string): string
}
```

### Regras Absolutas de Integridade
1. **Nunca traduzir texto bíblico via modelo de linguagem (LLM)**: O texto exibido em inglês (KJV ou NIV) deve ser oriundo da fonte textual oficial da versão, jamais uma tradução automática do texto em português.
2. **Nunca reproduzir KJV ou NIV de memória por LLM**: Todas as passagens do modelo canônico são resolvidas através do `BibleProvider` alimentado com os textos canônicos verificados.
3. **Invariante Teologia Desativada**: Quando `theologyEnabled === false`, nenhum componente renderiza seletor de versão bíblica, blocos de escritura ou avisos de copyright, e nenhuma chamada ao `BibleProvider` é realizada.
