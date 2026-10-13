# Verificação de qualidade

Revisão em 12/10/2026, atualizada para Anew web e Expo/React Native. Backend, frontend e QA revisam módulos e fronteiras reais; a coordenação verifica builds, exports e interface. O app móvel atual usa Expo SDK 57, React Native 0.86.3 e Expo Router, com componentes nativos. A implementação Capacitor/Vite anterior foi retirada.

## Testes da IA

Runner: `node --test scripts/test-ai.mjs`. Os casos importam código TypeScript real através do compilador já instalado. O `server-only` é substituído apenas no ambiente de teste. O contrato REST simulado corresponde a `status: completed` e `steps` com `type: model_output`, `content`, `type: text` e `text` JSON. Para Auth, a biblioteca `jose` verifica assinaturas RSA verdadeiras; somente o resolvedor de chaves remotas é substituído por chaves públicas sintéticas do teste. Não há bypass de verificação no código de produção. Não carregam `.env.local`, não utilizam chave real nem fazem requests externos.

Casos cobertos:

1. Nenhuma comunicação com o provedor quando faltam consentimento, tipo correto, corpo JSON válido, origem permitida ou limites de tamanho.
2. Geração completa de sete dias, IDs de campos/atividades exclusivos, espiritualidade desligada, contrato da resposta preservado, cabeçalhos privados e credencial ausente da URL.
3. Revisão com contagem recalculada a partir das tarefas e exclusão de títulos, datas e identificadores na comunicação externa.
4. Recusa de saída incompleta, propriedade desconhecida, estrutura incorreta, alegação explícita de diagnóstico ou conteúdo religioso sem escolha.
5. Erros do provedor sanitizados, ausência de chave, IA desativada, nome de modelo inválido, valores booleanos forjados e preferência religiosa incompleta.
6. Limite de taxa em memória e `Retry-After`.
7. Timeout real de cinco segundos que aborta um provedor simulado sem resposta.
8. Configuração Firebase ausente, visitante, e-mail não verificado ou token anônimo bloqueados antes do Gemini.
9. Assinatura RSA inválida, emissor/projeto incorretos, token expirado e autenticação futura rejeitados pelo verificador real.
10. Versões legais antigas, maioridade não confirmada, aceites ausentes ou serviço de metadata indisponível bloqueiam a IA; a leitura recupera somente os campos permitidos do dono do token.
11. CORS do backend permite apenas origens declaradas, recusa método/cabeçalho/origem não autorizado e não dispensa autenticação; wildcard de configuração não abre acesso web.
12. Geração e revisão assumem inglês quando o idioma é omitido, preservam português explícito, retornam erros públicos em inglês e mantêm códigos HTTP/erro e conteúdo privado do provedor protegidos.

## Núcleo local e proteção de callbacks

Runner: `node --test scripts/test-core.cjs`. Importa `SyncEngine`, `backup-validation`, `date-utils`, os modelos PT/EN reais, o `SessionGuard`, o gerador local de onboarding e os helpers nativos de workspace; não copia a implementação desses módulos.

Verifica compatibilidade dos guias reais e backups legados, recusa de esquema desconhecido, associação com guia inexistente, IDs de protótipo, texto/conclusão/escritura/categorias/fichas malformadas e escalas gigantes. Datas são verificadas em mudança de mês, ano e ano bissexto. A persistência real é exercitada com debounce, flush antes de navegação, falha de armazenamento, retry, cancelamento após exclusão e eventos de reconexão. Fixtures de reconciliação preservam textos e idioma do guia quando a interface muda de idioma.

O guard usado no AuthProvider é exercitado com leitura antiga ou iniciada durante escrita de aceite, logout, troca de conta e novo login com o mesmo UID. A implementação usa lock síncrono para impedir duas operações antes do próximo render, snapshot imutável de propriedades públicas do usuário e métodos da instância SDK preservados. Testes do guard não substituem um teste integrado de signup/login contra Firebase real.

O helper API real é testado com fallback web, falta de backend no nativo, origem HTTPS válida e recusa de HTTP, credenciais embutidas, query, caminho relativo malicioso ou origem externa como path. No nativo sem base configurada, retorna `null` antes de qualquer request ao backend local inexistente.

O coordenador real de exclusão da conta também é exercitado: flush das edições pendentes antes de exclusão remota; recuperação após falha de armazenamento ou metadata; exclusão parcial quando Auth falha; troca de conta durante as duas etapas; limpeza restrita às chaves do próprio usuário; e tratamento de uma conta temporária criada pelo login Google. Esses fixtures não substituem teste de exclusão em Firebase real.

Scripts antigos que simulam uma implementação paralela de sync ou regras Firestore não são evidência de verificação do código do aplicativo e não são usados como critério destes resultados. Sync em nuvem de diário/guias continua sem conexão ativa nesta preparação; os testes de reconciliação usam providers sintéticos.

## Núcleo nativo e acesso de teste

Os testes adicionais exercitam exatamente dez perguntas opcionais, escolhas allowlisted, guia local inglês válido sem respostas, variação real por preferências, IDs determinísticos e rotina editável em todos os estilos. Confirmam ausência de mutação dos modelos padrão e de efeitos de rede/armazenamento no gerador. Livro, intervalo e idioma das escrituras opcionais também são verificados sem fallback para referências incorretas.

Os helpers nativos reais são testados com adapters de armazenamento identificados: validação de workspace, revogação, troca de UID, preservação de JSON ilegível, falha de leitura/gravação, fila estável de flush, limpeza e staging do guia derivado. O staging não substitui registros existentes, não guarda respostas brutas e só é consumido após salvamento confirmado. Esses testes não executam AsyncStorage num aparelho nem representam um ensaio completo dos providers React com Firebase conectado.

O demo cria guias/semanas sintéticos em memória, com reset, isolamento e revogação de callbacks. O matcher compartilhado de `tester@anew.local` / `AnewPreview2026!` normaliza o e-mail e exige senha exata. Seu sucesso só abre o demo quando a flag pública está habilitada; não cria identidade, token Firebase ou autorização de API. A interface bloqueia o endereço reservado em signup, recuperação e tentativa de login com senha incorreta. `NEXT_PUBLIC_ENABLE_DEMO` e `EXPO_PUBLIC_ENABLE_DEMO` ficam `false` nos exemplos e no perfil nativo de produção.

A revisão de fonte verificou: prévia limitada a três seções; entradas demo condicionais; conta e IA bloqueadas no demo; recuperação disponível ao proprietário verificado quando edição está suspensa; exclusão que só fecha/navega em sucesso; estado privado e seleção assíncrona de arquivos descartados quando muda o proprietário; tarefas/campos de uma semana registrada só editáveis após reabertura. Sons são opt-in, com mute, cancelamento em background e isolamento de preferências de demo. Verificação de fonte e helpers não comprova comportamento audível ou acessibilidade em iOS/Android físicos.

## Estado da verificação

- `npm test`: **80/80 testes passaram, zero falhas** — 64 de núcleo e 16 de API. Os testes importam módulos reais e usam serviços/armazenamento sintéticos explicitamente. Não carregam chave Gemini real nem fazem pedidos externos.
- TypeScript da web e do workspace `native/` passou. `npm --workspace native run lint` passou. O build de produção Next e `npm run native:export` passaram; a exportação inclui Android, iOS e web.
- O projeto nativo inicia com `npm run native`, equivalente a `cd native` e `npx expo start --go`. Expo Go tem Auth real desativado; test access precisa da flag explícita e usa apenas exemplos em memória. Um app instalado com configuração pública prepara Auth/Firestore, com tokens em memória e notas locais por UID.
- Os bundles Metro/Hermes não são APK, AAB ou IPA assinados. Não foi validada instalação em aparelho, execução iOS/Android física, entrega de e-mail, signup/exclusão real, OAuth real ou submissão às lojas. Verificações da UI web e inspeção dos artefatos ficam registradas pela coordenação e em [QA independente](QA-INDEPENDENT.md); não devem ser confundidas com testes nativos de aparelho.
- Nenhuma credencial privada Firebase ou chave Gemini foi copiada para o app nativo. A inspeção de bundles, metadados e imports e seus limites estão em [QA independente](QA-INDEPENDENT.md). Não há site remoto ou WebView implementando as telas.
- O projeto Firebase existente `anew-58b4a` permanece sem conexão autenticada nesta etapa, por decisão do responsável. Registro web/Apple/Android, Email/Password, Firestore e implantação das regras não foram confirmados na nuvem. Regras foram revisadas como fonte, sem execução no emulador ou no projeto. O runtime Java 1.8 inspecionado não atende aos requisitos do Emulator Suite; atualizar o runtime e executar as regras continua pendente.
- Backup/transferência estão configurados pelo app config e plugin Expo. Gerar e inspecionar os projetos nativos e realizar backup/restore em dispositivos continua necessário. Não há criptografia adicionada pelo app nem sincronização de diários.
- O audit do lockfile reporta **24 vulnerabilidades: 21 altas e 3 moderadas**. Os avisos identificados de `node-forge` e `braces` não têm versões corrigidas disponíveis. O `decode-uri-component` 0.5 usa ESM incompatível com a cadeia instalada `query-string` 7; o override inseguro não foi aplicado. Esses avisos continuam abertos para remediação e verificação antes de release. Builds e testes aprovados não equivalem a audit sem alertas.

Não houve teste com participantes, auditoria clínica profissional, certificação CFP, parecer jurídico profissional ou certificação LGPD. Testes automatizados avaliam contratos e algumas falhas; não certificam o conteúdo gerado pelo modelo ou a adequação de um serviço de saúde.
