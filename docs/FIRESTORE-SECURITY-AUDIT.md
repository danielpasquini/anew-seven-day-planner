# FIRESTORE-SECURITY-AUDIT.md — Auditoria e Regras de Segurança do Firestore

> Documentação técnica oficial de Segurança do Cloud Firestore para o projeto **Guia de Retomada**.
> Data de auditoria: 2026-08-14

---

## 1. Princípios de Segurança Implementados

1. **Default Deny Global**:
   - Todo acesso que não corresponda explicitamente a uma rota autorizada sob `users/{userId}` é bloqueado por padrão (`match /{document=**} { allow read, write: if false; }`).
2. **Proibição Absoluta de Regras Abertas**:
   - Nenhuma regra `allow read, write: if true;` é permitida no projeto.
3. **Isolamento Estrito por UID**:
   - Qualquer operação exige autenticação ativa (`request.auth != null && request.auth.uid != null`) e correspondência exata do UID com o proprietário do documento (`request.auth.uid == userId`).
4. **Subcollections Protegidas em Cascata**:
   - Todas as subcollections sob `users/{userId}` (`settings`, `guides`, `guides/{guideId}/weeks`, `weeks` e o curinga recursivo `{allSubcollections=**}`) herdam a restrição de propriedade por UID.
5. **Independência de Frontend**:
   - O controle de autorização é 100% imposto pela camada de regras do Firestore no servidor da Google Cloud, não dependendo de verificações de UI do cliente.

---

## 2. Mapa de Coleções e Regras (`firestore.rules`)

```
/users/{userId}                           -> allow read, write: if request.auth.uid == userId
  ├── /settings/{settingId}              -> allow read, write: if request.auth.uid == userId
  ├── /guides/{guideId}                  -> allow read, write: if request.auth.uid == userId
  │     └── /weeks/{weekId}              -> allow read, write: if request.auth.uid == userId
  ├── /weeks/{weekId}                    -> allow read, write: if request.auth.uid == userId
  └── /{allSubcollections=**}            -> allow read, write: if request.auth.uid == userId

/{document=**}                           -> allow read, write: if false (DEFAULT DENY)
```

---

## 3. Matriz de Testes de Acesso Cruzado (Cross-UID)

Executado via [`scripts/test-security-rules.mjs`](file:///c:/Users/Daniel/Documents/Antigravity/guia-retomada-esquemas/scripts/test-security-rules.mjs) (**26/26 testes aprovados**):

| Vetor de Teste | Operação | Origem da Requisição | Alvo do Recurso | Resultado Esperado | Status |
|----------------|----------|----------------------|-----------------|:------------------:|:------:|
| Não autenticado | Leitura | `auth: null` | `/users/user_123` | **DENY** | ✅ PASS |
| Não autenticado | Escrita | `auth: null` | `/users/user_123/guides/g1` | **DENY** | ✅ PASS |
| Não autenticado | Leitura | `auth: null` | `/users/user_123/guides/g1/weeks/w1` | **DENY** | ✅ PASS |
| Não autenticado | Leitura | `auth: null` | `/public_data/doc1` | **DENY** | ✅ PASS |
| Proprietário | Leitura | `auth.uid: user_A` | `/users/user_A` | **ALLOW** | ✅ PASS |
| Proprietário | Escrita | `auth.uid: user_A` | `/users/user_A/settings/appearance` | **ALLOW** | ✅ PASS |
| Proprietário | Criação | `auth.uid: user_A` | `/users/user_A/guides/guide_1` | **ALLOW** | ✅ PASS |
| Proprietário | Edição | `auth.uid: user_A` | `/users/user_A/guides/guide_1/weeks/w1` | **ALLOW** | ✅ PASS |
| Proprietário | Subcoleção genérica | `auth.uid: user_A` | `/users/user_A/backups/b1` | **ALLOW** | ✅ PASS |
| **Acesso Cruzado (Cross-UID)** | Listar Guides | `auth.uid: user_A` | `/users/user_B/guides` | **DENY** | ✅ PASS |
| **Acesso Cruzado (Cross-UID)** | Ler Guide | `auth.uid: user_A` | `/users/user_B/guides/g1` | **DENY** | ✅ PASS |
| **Acesso Cruzado (Cross-UID)** | Acessar WeekInstance | `auth.uid: user_A` | `/users/user_B/guides/g1/weeks/w1` | **DENY** | ✅ PASS |
| **Acesso Cruzado (Cross-UID)** | Acessar WeekInstance flat | `auth.uid: user_A` | `/users/user_B/weeks/w1` | **DENY** | ✅ PASS |
| **Acesso Cruzado (Cross-UID)** | Criar Doc sob B | `auth.uid: user_A` | `/users/user_B/guides/g_new` | **DENY** | ✅ PASS |
| **Acesso Cruzado (Cross-UID)** | Criar Week sob B | `auth.uid: user_A` | `/users/user_B/guides/g1/weeks/w_new` | **DENY** | ✅ PASS |
| **Acesso Cruzado (Cross-UID)** | Editar Doc Raiz de B | `auth.uid: user_A` | `/users/user_B` | **DENY** | ✅ PASS |
| **Acesso Cruzado (Cross-UID)** | Editar Config de B | `auth.uid: user_A` | `/users/user_B/settings/theme` | **DENY** | ✅ PASS |
| **Acesso Cruzado (Cross-UID)** | Editar Guide de B | `auth.uid: user_A` | `/users/user_B/guides/g1` | **DENY** | ✅ PASS |
| **Acesso Cruzado (Cross-UID)** | Editar Week de B | `auth.uid: user_A` | `/users/user_B/guides/g1/weeks/w1` | **DENY** | ✅ PASS |
| **Acesso Cruzado (Cross-UID)** | Excluir Doc Raiz de B | `auth.uid: user_A` | `/users/user_B` | **DENY** | ✅ PASS |
| **Acesso Cruzado (Cross-UID)** | Excluir Guide de B | `auth.uid: user_A` | `/users/user_B/guides/g1` | **DENY** | ✅ PASS |
| **Acesso Cruzado (Cross-UID)** | Excluir Week de B | `auth.uid: user_A` | `/users/user_B/guides/g1/weeks/w1` | **DENY** | ✅ PASS |
| **Acesso Cruzado (Cross-UID)** | Subcoleção genérica de B | `auth.uid: user_A` | `/users/user_B/exports/exp_1` | **DENY** | ✅ PASS |
| Coleção Raiz Não Mapeada | Leitura | `auth.uid: user_A` | `/guides/global_guide` | **DENY** | ✅ PASS |
| Coleção Raiz Não Mapeada | Escrita | `auth.uid: user_A` | `/weeks/week_123` | **DENY** | ✅ PASS |
| Coleção Raiz Não Mapeada | Escrita | `auth.uid: user_A` | `/analytics/event_1` | **DENY** | ✅ PASS |

---

## 4. Riscos Restantes Documentados

Ao avançar para a integração do Firebase Auth / Firestore (Prompt 11a), os seguintes pontos de atenção arquitetural devem ser considerados:

1. **Validação de Schema nos Documentos**:
   - As regras atuais focam estritamente em **Autorização e Isolamento por UID**. Ao conectar a escrita do Firestore, deve-se manter a validação TypeScript e considerar validação de campos obrigatórios (`title`, `schemaVersion`, `createdAt`) nas regras para impedir injeção de payload corrompido.
2. **Limite de Quotas e Operações em Lote**:
   - Operações como restaurar backup completo (`importFromJSON`) ou salvar guias com dezenas de semanas devem utilizar `writeBatch` ou escrita transacional ordenada para respeitar os limites de 500 operações por batch do Firestore.
3. **Persistência Offline & Transição do localStorage**:
   - Conforme exigido nas invariantes do projeto, o `localStorage` não deve ser destruído prematuramente, devendo servir como cache local resiliente até que a migração de conta e login seja confirmada pelo usuário.

---

## 5. Veredito de Segurança

**STATUS: READY FOR DATA MIGRATION**
A camada de regras e isolamento de segurança está comprovada, com 100% de rejeição de acessos não autorizados e cross-UID em todos os verbos CRUD.
