# Revisão do backend e dos dados locais

Revisado em 12/10/2026, incluindo a migração para Expo/React Native. Este documento registra implementação e limitações; não é certificação de conformidade jurídica, parecer do CFP, validação clínica ou garantia de segurança.

## O que mudou

- As duas rotas exigem `aiConsent: true` antes de qualquer comunicação com o provedor. A interface deve obter essa confirmação para cada envio e apresentar os dados selecionados. Um booleano enviado pelo cliente não é comprovação independente de consentimento válido, idade ou identidade.
- IA também exige configuração Firebase, ID token assinado para o projeto correto, e-mail verificado e aceites atuais da conta. Sem projeto configurado, a API recusa com `AUTH_NOT_CONFIGURED`. Sem sessão válida, recusa com 401; sem e-mail verificado ou aceites, recusa com 403. O operador precisa habilitar expressamente `AI_ENABLED=true`.
- Espiritualidade fica desligada por omissão. Geração exige `theologyEnabled: true` e preferência explícita preenchida; a revisão exige também `completionConfig.theologyReviewEnabled: true`. Preferências religiosas não são inferidas. O plano secular deve permanecer completo.
- Os prompts descrevem sugestões educativas de autocuidado. Não apresentam IA como profissional, nem fazem diagnóstico, tratamento, julgamento moral, promessa de cura ou classificação clínica pela porcentagem de tarefas. Nenhuma abordagem psicológica é padrão ou apresentada como superior. Preferências explícitas podem orientar a linguagem.
- JSON de entrada tem tipo, enums, comprimentos, listas, dias e horários verificados. A resposta passa por validação recursiva, incluindo blocos discriminados, campos, comprimentos, sete dias completos, horários válidos e tabelas retangulares. Respostas incompletas são rejeitadas; não são preenchidas com exercícios clínicos inventados.
- IDs são criados no servidor, com prefixo exclusivo por guia e por campo, evitando colisões entre formulários de guias diferentes. Dados históricos no navegador não são apagados nem migrados pelas APIs.
- Chave existe somente em `GEMINI_API_KEY` no servidor. É enviada em `x-goog-api-key`, sem segredo na URL. Helpers com acesso a credenciais usam `server-only`. Não há logs de prompts, perfis, reflexões, chave ou respostas brutas do provedor.
- Usa `/v1beta/interactions`, conforme o exemplo oficial atual para Gemini 3.8, modelo configurável em `GEMINI_MODEL` e `store: false`. A API v1 existe, mas sua documentação consultada não lista esse modelo novo; não há alegação de uso do endpoint v1 estável. Não encadeia sessões nem tenta modelos diferentes silenciosamente. Evita repetir uma solicitação cobrada sem escolha do usuário.
- Respostas têm `Cache-Control: no-store, private`, mensagens de erro sanitizadas e códigos úteis ao cliente. `GET /api/ai-status` informa apenas disponibilidade de configuração; não confirma acesso, quota ou validade da chave.
- Geração e revisão usam `en-US` quando `contentLocale` não é informado; `pt-BR` explícito continua disponível. Mensagens públicas de validação, provedor, sessão e aceites estão em inglês. As chaves existentes dos perfis e respostas continuam compatíveis com os guias históricos.

## Minimização e limites

O nome do guia é usado localmente na resposta e não é incluído no pedido ao Gemini. Revisões excluem nomes/títulos, datas exatas, IDs de atividades/campos e rótulos da antiga biblioteca de exercícios. Enviam atividades, contagens recalculadas, preferências pertinentes e somente as reflexões recebidas explicitamente para aquela solicitação. O frontend deve permitir omitir textos de reflexão e nunca enviar a revisão automaticamente ao concluir uma semana.

Há mascaramento por padrão textual de e-mail, CPF e telefone. É uma redução parcial de identificadores, **não anonimização**: nomes, locais, relatos e outras informações sensíveis ainda podem existir em textos livres. O usuário precisa poder revisar, resumir ou excluir o que vai enviar.

Limites aplicados: corpo de entrada de 80 KiB por leitura limitada; nome de 100 caracteres; cada texto de perfil de 1.200 caracteres e conjunto de 10.000; 80 atividades por revisão e descrição de 500 caracteres; 60 reflexões de 1.500 caracteres e total de 12.000. Resposta do provedor tem limite de 256 KiB e conteúdo final de 100.000 caracteres. O tempo do provedor é 45 segundos por padrão, configurável entre 5 e 60 segundos. Não há envio de anexos, histórico completo ou armazenamento no servidor do aplicativo.

Existe bloqueio de origem cruzada para solicitações do navegador e um limite em memória por processo de seis pedidos/minuto por UID verificado. Guarda apenas hash da identidade em memória, com limite de 2.000 identidades e expiração em um minuto. Cabeçalhos de IP fornecidos pelo cliente não alteram esse limite.

## Conta e aceites

`jose` verifica a assinatura RS256 com chaves públicas Google e os campos emissor, destinatário, validade, emissão, autenticação e usuário. Tokens anônimos ou sem `email_verified: true` não dão acesso à IA. Há tolerância de cinco segundos para relógio, com expiração exigida no futuro e autenticação não futura. O UID não é enviado ao Gemini.

O servidor lê somente cinco campos de `users/{uid}/settings/legal` via REST Firestore e token do próprio usuário, preservando as regras de acesso: versões de termos, privacidade e aviso de saúde, confirmação de maioridade e timestamp. Exige `LEGAL_VERSION` atual, declaração adulta verdadeira e timestamp válido. Não usa credencial administrativa para ignorar regras nem aceita esse registro diretamente do corpo enviado pelo cliente. A declaração de maioridade não verifica identidade ou data de nascimento.

O projeto existente solicitado é `anew-58b4a`. As skills oficiais Firebase foram consultadas e o servidor MCP foi registrado, mas o responsável adiou a conexão: o login CLI foi interrompido antes da autenticação. Registro dos apps web/Apple/Android, habilitação Email/Password, banco e publicação das regras continuam pendentes; nenhum recurso ou configuração pública foi recuperado ou alterado na nuvem. Auth/Firestore sem configuração não são substituídos por sessões falsas. Quando conectado, Firebase recebe identidade e metadata dos aceites; diário, guias, favoritos e respostas de onboarding não são enviados a essas APIs.

## Aplicativo nativo Expo

`native/` usa Expo SDK 57, React Native 0.86.3 e Expo Router. As telas são componentes React Native; não carregam Next.js, um site remoto ou WebView. A implementação Capacitor/Vite anterior e os diretórios de plataforma foram retirados. `npm run native` executa `expo start --go`; dentro de `native/`, o comando equivalente é `npx expo start --go`.

`native/src/session.tsx` prepara Email/Password, senha mínima de 12 caracteres, recuperação, verificação de e-mail e quatro aceites separados. O SDK JavaScript Firebase é inicializado somente em um app instalado configurado, fora do Expo Go. Usa `EXPO_PUBLIC_FIREBASE_*`, tokens Auth em memória e cache Firestore em memória. Não copia service accounts, credenciais privadas ou `GEMINI_API_KEY`. Reiniciar o app exige novo login; isso é distinto da persistência de sessão web. Google OAuth nativo não foi implementado.

Expo Go bloqueia os serviços reais de conta mesmo quando há configuração pública. O acesso de teste compartilhado `tester@anew.local` / `AnewPreview2026!` exige a flag explícita `NEXT_PUBLIC_ENABLE_DEMO` na web ou `EXPO_PUBLIC_ENABLE_DEMO` no nativo. A correspondência abre somente um workspace sintético em memória, antes de qualquer chamada Auth. Não cria usuário, token, sessão Firebase ou autorização de servidor. Senha incorreta para esse endereço reservado, signup e recuperação são recusados localmente. Os arquivos de exemplo e o perfil de produção mantêm a flag desligada.

O demo usa dois guias e três semanas de exemplo, favoritos e edições em memória. Reset/saída revogam gravações pendentes e descartam esses exemplos. Ações de conta são bloqueadas durante a demonstração. A prévia pública continua separada e limitada a três seções, biblioteca e avisos, sem carregar dados privados.

`native/src/state.tsx` e `workspace.ts` mantêm workspaces validados em AsyncStorage por UID somente após e-mail verificado e aceites atuais. Resultados antigos de leitura/gravação não alteram uma conta posterior. Dados ilegíveis permanecem na chave original, com edição suspensa e recuperação explícita pelo proprietário verificado. O demo e Expo Go não persistem diários; preferências não sensíveis, como conclusão da introdução, podem ser armazenadas separadamente.

As dez perguntas opcionais geram o guia localmente por `lib/onboarding.ts`. Respostas brutas não são persistidas nem enviadas. Após conta e aceites, um guia derivado validado pode ser preparado sob o UID antes da verificação do e-mail; não substitui qualquer workspace já existente, mesmo vazio ou corrompido. O primeiro workspace verificado só remove o rascunho após salvamento bem-sucedido.

A saída normal e a exclusão suspendem edições antes de aguardar uma fila estável de gravações. Falha de salvamento mantém a conta aberta para recuperação. A exclusão reautentica, remove o registro legal, pede exclusão Auth e limpa somente o UID capturado. Uma falha remota preserva os registros; sucesso remoto com limpeza local parcial produz aviso separado. Na interface, falha não fecha a confirmação nem navega como sucesso.

Exportação nativa usa FileSystem/Sharing e um arquivo temporário no cache. A seleção de JSON usa DocumentPicker; importar exige confirmação e validação antes de substituir o workspace. Somente cópias temporárias são removidas, não o arquivo original escolhido. O fechamento da share sheet não comprova que uma cópia foi salva. Não há criptografia adicionada pelo app ou sincronização de notas entre aparelhos. Configuração de backup/transferência por app config e plugin requer comprovação no build gerado e em dispositivos.

## Fronteira da IA web

A IA está indisponível no app nativo atual. Personalização e conclusão de semana são locais e não chamam Gemini. O backend Next mantém as rotas opcionais web e seus segredos no servidor. O helper `lib/api-url.ts` é testado como código de fronteira, mas não constitui uma integração de IA Expo ativa.

CORS das rotas de geração, reflexão e status aceita a própria origem e origens exatas da allowlist; não aceita wildcard ou cookies cross-origin. Preflight limita método e cabeçalhos. A allowlist herdada dos helpers não estabelece conectividade ou suporte de IA no app Expo. CORS não autoriza usuários: qualquer caller continua precisando de token assinado, e-mail verificado, aceites atuais e consentimento por envio.

Fontes de integração: [Firebase Authentication](https://firebase.google.com/docs/auth), [Firestore](https://firebase.google.com/docs/firestore), [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) e [Expo Router](https://docs.expo.dev/router/introduction/). O código e essas referências não comprovam fluxo de conta real em aparelho ou aprovação em loja.

## Limitações e operação

Prompts e uma verificação textual de respostas reduzem algumas saídas indevidas, mas não comprovam precisão, neutralidade, proteção contra todas as injeções ou segurança clínica. O filtro textual pode bloquear conteúdo aceitável e não identifica todos os diagnósticos, instruções perigosas ou referências religiosas. Não existe monitoramento de crise; o app não deve ser apresentado como serviço de emergência.

Há autenticação, mas não controle distribuído de quotas, App Check, limite de gastos por usuário nem checagem administrativa da revogação imediata de um token ou desativação de conta. Um token assinado pode permanecer válido até sua expiração; Firestore continua aplicando as regras de segurança. O limite em memória reinicia com o processo e não é compartilhado entre instâncias. Bloqueio de origem é defesa do navegador; clientes HTTP externos continuam precisando de token e aceites válidos. Uma publicação pública exige decisões operacionais sobre proteção na borda, orçamento e gestão de sessões.

`store: false` desativa armazenamento da interação para recuperação/encadeamento nessa API; não resolve sozinho logs, retenção de segurança, uso para melhoria de produtos, transferência internacional ou termos ligados ao projeto Google. Os termos Gemini vedam informações pessoais, sensíveis ou confidenciais no plano gratuito e preveem melhoria de produtos/revisão humana; o aceite do usuário não elimina essa restrição. A escolha de projeto com billing ativo, termos, transparência, base legal e transferência precisa ser avaliada pelo responsável antes da ativação. `.env.example` mantém IA desligada. Esta aplicação é preparada para público adulto; não implementa verificação documental de idade.

## Fontes oficiais verificadas

- [Modelos Gemini](https://ai.google.dev/gemini-api/docs/models): em 12/10/2026, `gemini-3.8-flash` consta como estável; acesso a 2.5 é limitado a projetos que já usavam esses modelos. Disponibilidade de um modelo na documentação não comprova acesso da chave configurada.
- [Visão geral da Interactions API](https://ai.google.dev/gemini-api/docs/interactions-overview): API recomendada para novos projetos; parâmetro `store: false` permite interação sem estado recuperável.
- [Referência Interactions](https://ai.google.dev/api/interactions-api) e [saída estruturada](https://ai.google.dev/gemini-api/docs/structured-output): contrato beta usado, saída `steps/model_output/content` e JSON Schema. O app valida a estrutura e regras necessárias localmente.
- [Chaves Gemini](https://ai.google.dev/gemini-api/docs/api-key): credenciais no servidor e autenticação por cabeçalho. Não há suposição de prefixo fixo da chave: o tipo de autorização atual difere de chaves históricas.

- [Verificação de ID tokens Firebase](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [API REST Firestore](https://firebase.google.com/docs/firestore/use-rest-api) e [chaves públicas Google](https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com): assinatura, claims, autorização por regras e chaves públicas do emissor.
- [Termos Gemini](https://ai.google.dev/gemini-api/terms): diferenças entre projetos com/sem billing ativo, tratamento das informações e limitações de uso.

Guias locais Next.js lidos antes da implementação: Route Handlers, referência `route`, variáveis de ambiente e limite Server/Client Components em `node_modules/next/dist/docs/`. O projeto foi atualizado de 16.3 para 16.4 durante a integração final.

## Verificação

O runner `node --test scripts/test-ai.mjs` transpila e importa os arquivos reais TypeScript de rotas/helpers, simula a resposta REST documentada e usa somente chave fictícia. Não faz chamadas ao Google. Cobre consentimento, origem, tipos/corpo, limites de tamanho, modelos configurados, minimização, dias/campos do guia, estatísticas recalculadas, validação da saída, espiritualidade desligada, mensagens sanitizadas, limite de taxa e timeout. A verificação integrada registra 80 testes passando (64 de núcleo, 16 de API), TypeScript, lint Expo, build Next e exportação Expo Android/iOS/web. Fixtures, bundles Metro/Hermes e revisão de fonte não substituem Firebase conectado, entrega de e-mail, aparelhos, APK/IPA assinado ou validação clínica. Os resultados e limites estão em `QA-REVIEW.md` e `QA-INDEPENDENT.md`.

O audit atual informa 24 vulnerabilidades (21 altas, 3 moderadas). Os avisos identificados de `node-forge` e `braces` não têm versões corrigidas disponíveis; a cadeia `query-string` 7 não aceita com segurança um override para o `decode-uri-component` 0.5 ESM. O override incompatível não foi aplicado. Remediação e verificação de compatibilidade continuam necessárias antes de release; aprovação de build não resolve esses avisos.
