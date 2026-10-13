export type Field =
  | { kind: "static"; text: string }
  | { kind: "text"; id: string; label: string }
  | { kind: "textarea"; id: string; label: string }
  | { kind: "scale"; id: string; label: string; max?: number }

export type Block =
  | { type: "lead"; text: string }
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "note"; label?: string; text: string }
  | {
      type: "ladder"
      id: string
      head: [string, string, string]
      rows: { id: string; label: string }[]
    }
  | { type: "fields"; title?: string; note?: string; fields: Field[] }
  | {
      type: "schedule"
      id: string
      cols: [string, string, string]
      rows: { id: string; day: string; tasks: [string, string, string] }[]
    }

export type Verse = { ref: string; ara: string; nvt: string; kjv?: string; niv?: string }

export type Scripture = {
  verses: Verse[]
  comentario: string
  oracao: string
}

export type Section = {
  id: string
  number: string
  kicker: string
  title: string
  blocks: Block[]
  scripture?: Scripture
}

// Secular defaults. Spiritual content is added only by explicit personal choice.
export const intro = {
  "title": "Guia de Retomada",
  "subtitle": "Um espaço para organizar o cotidiano, registrar experiências e encontrar apoio.",
  "oracao": "",
  "salmo": {
    "ref": "",
    "ara": "",
    "nvt": "",
    "kjv": "",
    "niv": ""
  }
}

export const sections: Section[] = [
  {
    "id": "fundamento",
    "number": "01",
    "kicker": "SUA PRÁTICA",
    "title": "Seu guia, suas escolhas",
    "blocks": [
      {
        "type": "lead",
        "text": "Um espaço para organizar o cotidiano com cuidado e autonomia."
      },
      {
        "type": "p",
        "text": "Você pode registrar experiências, planejar pequenos cuidados e conhecer recursos gratuitos. Use apenas o que fizer sentido: adaptar, descansar e pedir ajuda também fazem parte do caminho."
      },
      {
        "type": "note",
        "label": "Escolha pessoal",
        "text": "Sua cultura, condições materiais e limites importam. Espiritualidade é opcional; vivências religiosas, agnósticas e ateístas são respeitadas. Nenhuma crença é exigida para usar o guia."
      }
    ]
  },
  {
    "id": "mapa",
    "number": "02",
    "kicker": "SUA PRÁTICA",
    "title": "Maneiras de compreender suas experiências",
    "blocks": [
      {
        "type": "lead",
        "text": "A Psicologia reúne diferentes tradições."
      },
      {
        "type": "p",
        "text": "Uma perspectiva pode ajudar a conversar sobre o que acontece; ela não define quem você é. Explore a linguagem que fizer sentido para você, sem precisar adotar uma abordagem específica."
      },
      {
        "type": "table",
        "head": [
          "Perspectiva",
          "Exemplos de temas"
        ],
        "rows": [
          [
            "Cognitivas e comportamentais",
            "Pensamentos, aprendizagem, hábitos e ações no contexto."
          ],
          [
            "Psicodinâmicas e psicanalíticas",
            "História, conflitos, relações e sentidos da experiência."
          ],
          [
            "Humanistas, fenomenológicas e existenciais",
            "Experiência vivida, escolhas, valores e possibilidades."
          ],
          [
            "Sistêmicas, sociais e comunitárias",
            "Relações, redes de apoio e condições sociais."
          ],
          [
            "Terapia do Esquema",
            "Padrões de necessidades, interpretações e proteção, quando essa linguagem for útil."
          ]
        ]
      },
      {
        "type": "note",
        "label": "Escolha informada",
        "text": "Estes são pontos de partida para conversa, sem hierarquia entre abordagens. Pergunte ao profissional sobre formação, objetivos, como o trabalho funciona, limites e alternativas. O encaixe depende de suas necessidades e de uma avaliação individual."
      }
    ]
  },
  {
    "id": "limites",
    "number": "03",
    "kicker": "SUA PRÁTICA",
    "title": "Cuidado e limites de uso",
    "blocks": [
      {
        "type": "lead",
        "text": "Você decide quando começar, adaptar e parar."
      },
      {
        "type": "p",
        "text": "Prefira atividades cotidianas acessíveis: alimentação, descanso, contato escolhido e uma tarefa pequena. O app não oferece diagnóstico, prescrição ou acompanhamento de emergências."
      },
      {
        "type": "list",
        "items": [
          "Não use o app para alterar medicamentos ou substituir acompanhamento.",
          "Reprocessamento de trauma, exposição a lembranças dolorosas e técnicas clínicas estruturadas pedem avaliação e acompanhamento profissional.",
          "Se um registro aumentar muito o sofrimento ou causar desorientação, interrompa e procure apoio."
        ]
      },
      {
        "type": "note",
        "label": "Caminhos de apoio",
        "text": "No Brasil, a UBS é uma porta de entrada do SUS. CAPS acolhem pessoas em sofrimento intenso e com necessidades relacionadas a álcool e outras drogas. Se houver perigo imediato ou você não conseguir se manter em segurança, procure um serviço de urgência e uma pessoa de confiança. O app não acompanha crises em tempo real."
      }
    ]
  },
  {
    "id": "acao",
    "number": "04",
    "kicker": "SUA PRÁTICA",
    "title": "Um pequeno cuidado possível",
    "blocks": [
      {
        "type": "lead",
        "text": "Um passo pode ser pequeno o suficiente para caber no seu dia."
      },
      {
        "type": "p",
        "text": "Escolha algo relevante e acessível: beber água, preparar uma refeição, abrir um arquivo por alguns minutos ou descansar. Ajuste à sua condição física, energia, acessibilidade e recursos."
      },
      {
        "type": "fields",
        "title": "Registro pessoal opcional",
        "fields": [
          {
            "kind": "scale",
            "id": "acao-vontade",
            "label": "Vontade de fazer"
          },
          {
            "kind": "scale",
            "id": "acao-desconforto-prev",
            "label": "Desconforto previsto"
          },
          {
            "kind": "text",
            "id": "acao-fiz",
            "label": "Fiz o combinado? (sim / não)"
          },
          {
            "kind": "scale",
            "id": "acao-desconforto-pos",
            "label": "Desconforto (depois)"
          },
          {
            "kind": "textarea",
            "id": "acao-aprendi",
            "label": "O que aprendi em uma frase"
          }
        ]
      }
    ]
  },
  {
    "id": "evitacao",
    "number": "05",
    "kicker": "SUA PRÁTICA",
    "title": "Retomar espaços no seu ritmo",
    "blocks": [
      {
        "type": "lead",
        "text": "Planeje contatos com o cotidiano que sejam desejados e seguros para você."
      },
      {
        "type": "p",
        "text": "Os passos abaixo são exemplos opcionais, adaptáveis à mobilidade e ao ambiente. Não constituem um protocolo de exposição. Se sair estiver ligado a trauma, pânico intenso ou risco real, converse com um profissional antes de praticar."
      },
      {
        "type": "ladder",
        "id": "ladder-saida",
        "head": [
          "Passo opcional",
          "Como me sinto",
          "Registrei"
        ],
        "rows": [
          {
            "id": "saida-1",
            "label": "Escolher um lugar acessível e seguro"
          },
          {
            "id": "saida-2",
            "label": "Planejar como chegar ou participar à distância"
          },
          {
            "id": "saida-3",
            "label": "Combinar apoio, se eu desejar"
          },
          {
            "id": "saida-4",
            "label": "Fazer um contato breve escolhido"
          },
          {
            "id": "saida-5",
            "label": "Observar como me senti, sem cobrança"
          },
          {
            "id": "saida-6",
            "label": "Decidir se quero repetir, adaptar ou parar"
          }
        ]
      }
    ]
  },
  {
    "id": "autojulgamento",
    "number": "06",
    "kicker": "SUA PRÁTICA",
    "title": "Responder à autocrítica com cuidado",
    "blocks": [
      {
        "type": "lead",
        "text": "Uma dificuldade merece contexto, cuidado e uma resposta proporcional."
      },
      {
        "type": "p",
        "text": "Observe um episódio cotidiano que você queira compreender. Se escrever virar uma revisão repetitiva que piora seu sofrimento, deixe o registro e procure outra forma de apoio. Cansaço, adoecimento, desigualdade e limites reais não são defeitos de caráter."
      },
      {
        "type": "fields",
        "fields": [
          {
            "kind": "textarea",
            "id": "julg-1",
            "label": "1. O que aconteceu objetivamente?"
          },
          {
            "kind": "textarea",
            "id": "julg-2",
            "label": "2. Que pensamento crítico apareceu?"
          },
          {
            "kind": "textarea",
            "id": "julg-3",
            "label": "3. O que foi difícil e que contexto preciso considerar?"
          },
          {
            "kind": "scale",
            "id": "julg-4",
            "label": "4. Impacto que percebi, de 0 a 10"
          },
          {
            "kind": "textarea",
            "id": "julg-5",
            "label": "5. Como eu acolheria alguém na mesma situação?"
          },
          {
            "kind": "textarea",
            "id": "julg-6",
            "label": "6. Existe algo concreto a reparar?"
          },
          {
            "kind": "textarea",
            "id": "julg-7",
            "label": "7. De que cuidado ou limite preciso agora?"
          }
        ],
        "title": "Registro pessoal opcional"
      },
      {
        "type": "fields",
        "fields": [
          {
            "kind": "textarea",
            "id": "julg-sentenca",
            "label": "Uma resposta mais gentil e realista"
          }
        ],
        "title": "Registro pessoal opcional"
      }
    ]
  },
  {
    "id": "desconfianca",
    "number": "07",
    "kicker": "SUA PRÁTICA",
    "title": "Segurança, fatos e limites",
    "blocks": [
      {
        "type": "lead",
        "text": "Use este registro para organizar o que percebeu e pensar em apoio."
      },
      {
        "type": "p",
        "text": "Você não precisa provar uma ameaça nem abrir mão de limites para merecer proteção. Em violência ou abuso, priorize segurança e suporte adequado. O exercício não decide se um relato é verdadeiro nem avalia quem é confiável."
      },
      {
        "type": "fields",
        "fields": [
          {
            "kind": "textarea",
            "id": "desc-fato",
            "label": "Fato observado: o que realmente aconteceu?"
          },
          {
            "kind": "textarea",
            "id": "desc-interp",
            "label": "Interpretação: o que concluí a partir disso?"
          },
          {
            "kind": "textarea",
            "id": "desc-prev",
            "label": "Previsão: o que acho que a pessoa pretende fazer?"
          },
          {
            "kind": "textarea",
            "id": "desc-favor",
            "label": "Evidências concretas a favor"
          },
          {
            "kind": "textarea",
            "id": "desc-contra",
            "label": "Evidências concretas contra"
          },
          {
            "kind": "textarea",
            "id": "desc-alt",
            "label": "Duas explicações alternativas (1 e 2)"
          },
          {
            "kind": "textarea",
            "id": "desc-protecao",
            "label": "Que apoio ou proteção posso buscar?"
          },
          {
            "kind": "text",
            "id": "desc-confianca",
            "label": "Que limite ou condição de confiança faz sentido?"
          }
        ],
        "title": "Registro pessoal opcional"
      }
    ]
  },
  {
    "id": "vinculo",
    "number": "08",
    "kicker": "SUA PRÁTICA",
    "title": "Conexões com consentimento e limites",
    "blocks": [
      {
        "type": "lead",
        "text": "Contato pode fazer sentido sem exigir intimidade."
      },
      {
        "type": "p",
        "text": "Escolha um contato que você queira: uma mensagem, uma atividade comunitária, uma conversa breve ou tempo com alguém de confiança. Respeite a sua vontade e a da outra pessoa. Bibliotecas, cultura e espaços de convivência podem ampliar possibilidades, sem obrigação de socializar."
      },
      {
        "type": "fields",
        "title": "Registro pessoal opcional",
        "fields": [
          {
            "kind": "textarea",
            "id": "vinc-esperava",
            "label": "Antes eu esperava:"
          },
          {
            "kind": "textarea",
            "id": "vinc-aconteceu",
            "label": "O que aconteceu de fato:"
          },
          {
            "kind": "textarea",
            "id": "vinc-julguei",
            "label": "Como me julguei depois:"
          },
          {
            "kind": "textarea",
            "id": "vinc-confianca",
            "label": "O comportamento da pessoa aumentou, manteve ou diminuiu a confiança que merece?"
          }
        ]
      }
    ]
  },
  {
    "id": "competencia",
    "number": "09",
    "kicker": "SUA PRÁTICA",
    "title": "Aprender com apoio e registrar o cotidiano",
    "blocks": [
      {
        "type": "lead",
        "text": "Pedir ajuda pode fazer parte de aprender."
      },
      {
        "type": "p",
        "text": "Escolha uma tarefa possível, divida em etapas e identifique recursos úteis. Seu valor não depende de fazer tudo sozinho. A escrita é opcional: registre apenas o que deseja guardar sobre o presente, sem detalhar lembranças traumáticas."
      },
      {
        "type": "fields",
        "title": "Registro pessoal opcional",
        "fields": [
          {
            "kind": "text",
            "id": "comp-antes",
            "label": "Antes: de que apoio posso precisar?"
          },
          {
            "kind": "textarea",
            "id": "comp-tarefa",
            "label": "Tarefa:"
          },
          {
            "kind": "textarea",
            "id": "comp-passo",
            "label": "Primeiro passo físico:"
          },
          {
            "kind": "text",
            "id": "comp-depois",
            "label": "Depois: o que consegui e o que ainda pede apoio?"
          },
          {
            "kind": "textarea",
            "id": "comp-ajuda",
            "label": "Que ajuda foi útil ou posso pedir?"
          }
        ]
      },
      {
        "type": "fields",
        "title": "Registro pessoal opcional",
        "fields": [
          {
            "kind": "textarea",
            "id": "comp-escrita",
            "label": "Escrita livre de hoje"
          }
        ]
      }
    ]
  },
  {
    "id": "trabalho-1",
    "number": "10",
    "kicker": "SUA PRÁTICA",
    "title": "Trabalho: necessidades e caminhos de apoio",
    "blocks": [
      {
        "type": "lead",
        "text": "Seu contexto de trabalho também precisa de cuidado."
      },
      {
        "type": "p",
        "text": "Organize demandas, limites, recursos e pessoas que podem apoiar você. Os passos são de planejamento, sem olhar imagens de situações traumáticas ou se obrigar a retornar a ambientes nocivos. Se houver violência, assédio ou sofrimento persistente, considere atenção em saúde e orientação sobre seus direitos."
      },
      {
        "type": "ladder",
        "id": "ladder-pistas",
        "head": [
          "Passo opcional",
          "Como me sinto",
          "Registrei"
        ],
        "rows": [
          {
            "id": "pista-1",
            "label": "Nomear uma necessidade atual"
          },
          {
            "id": "pista-2",
            "label": "Identificar uma pessoa ou serviço de apoio"
          },
          {
            "id": "pista-3",
            "label": "Conhecer um recurso sobre saúde no trabalho"
          },
          {
            "id": "pista-4",
            "label": "Rascunhar um pedido ou limite"
          },
          {
            "id": "pista-5",
            "label": "Planejar uma conversa, se fizer sentido"
          },
          {
            "id": "pista-6",
            "label": "Rever opções com apoio qualificado"
          }
        ]
      }
    ]
  },
  {
    "id": "trabalho-2",
    "number": "11",
    "kicker": "SUA PRÁTICA",
    "title": "Voltar a atenção ao presente",
    "blocks": [
      {
        "type": "lead",
        "text": "Uma pausa breve pode ajudar a perceber onde você está."
      },
      {
        "type": "p",
        "text": "Se for confortável, observe o ambiente e o apoio dos pés ou do corpo. Você pode nomear algumas cores ou sons e escolher o que fazer a seguir. Adapte às suas condições sensoriais; não prenda a respiração nem force relaxamento. Se prestar atenção ao corpo piorar a experiência, pare e prefira uma atividade externa simples ou contato com apoio."
      },
      {
        "type": "fields",
        "title": "Registro pessoal opcional",
        "fields": [
          {
            "kind": "scale",
            "id": "expo-inicial",
            "label": "Como me senti antes (0–10)"
          },
          {
            "kind": "scale",
            "id": "expo-max",
            "label": "Maior intensidade percebida (0–10)"
          },
          {
            "kind": "scale",
            "id": "expo-final",
            "label": "Como me sinto agora (0–10)"
          },
          {
            "kind": "textarea",
            "id": "expo-frase",
            "label": "O que percebi agora e o que pode me apoiar?"
          }
        ]
      }
    ]
  },
  {
    "id": "relacionamento-1",
    "number": "12",
    "kicker": "SUA PRÁTICA",
    "title": "Experiências, interpretações e relações",
    "blocks": [
      {
        "type": "lead",
        "text": "Você pode compreender uma relação sem reviver todos os detalhes."
      },
      {
        "type": "p",
        "text": "Escolha um episódio cotidiano que seja possível abordar agora. Diferencie o que aconteceu, o sentido que teve para você e o que espera do futuro. Relatos de violência merecem acolhimento e proteção, não confronto ou reconciliação obrigatória. Não é necessário abrir mensagens antigas ou fotografias que você não quer revisitar."
      },
      {
        "type": "fields",
        "title": "Registro pessoal opcional",
        "fields": [
          {
            "kind": "textarea",
            "id": "rel-fato",
            "label": "Fato ocorrido"
          },
          {
            "kind": "textarea",
            "id": "rel-regra",
            "label": "Regra aprendida"
          },
          {
            "kind": "textarea",
            "id": "rel-conclusao",
            "label": "Conclusão sobre mim"
          },
          {
            "kind": "textarea",
            "id": "rel-previsao",
            "label": "Previsão sobre o futuro"
          }
        ]
      }
    ]
  },
  {
    "id": "relacionamento-2",
    "number": "13",
    "kicker": "SUA PRÁTICA",
    "title": "Desejos e possibilidades de futuro",
    "blocks": [
      {
        "type": "lead",
        "text": "Seus projetos podem ser diferentes dos de outras pessoas."
      },
      {
        "type": "p",
        "text": "Amizades, parceria, família, estudo, trabalho, comunidade e tempo sozinho podem ter sentidos diversos. Nenhum formato de vida, estado civil, orientação sexual ou identidade de gênero determina seu valor. Separe um desejo de uma garantia; explorar uma possibilidade, cuidar de um limite ou descansar podem ser próximos passos."
      },
      {
        "type": "fields",
        "title": "Registro pessoal opcional",
        "fields": [
          {
            "kind": "textarea",
            "id": "rel2-desejo",
            "label": "O que eu desejo:"
          },
          {
            "kind": "textarea",
            "id": "rel2-afirmar",
            "label": "O que posso afirmar hoje sem fingir certeza:"
          }
        ]
      }
    ]
  },
  {
    "id": "pensamento-sentido",
    "number": "14",
    "kicker": "SUA PRÁTICA",
    "title": "Pensamentos, emoções e o que importa",
    "blocks": [
      {
        "type": "lead",
        "text": "Seus registros podem abrir perguntas, sem exigir uma resposta perfeita."
      },
      {
        "type": "p",
        "text": "Este é um modo opcional de organizar pensamentos. Se não combina com você, experimente uma conversa, um desenho ou uma anotação livre. Pergunte o que importa para você hoje e que escolha pequena pode expressar isso. Valores podem ser pessoais, culturais e coletivos; você não precisa adotar uma crença para usar o guia."
      },
      {
        "type": "fields",
        "title": "Registro pessoal opcional",
        "fields": [
          {
            "kind": "textarea",
            "id": "cog-situacao",
            "label": "Situação:"
          },
          {
            "kind": "textarea",
            "id": "cog-pensamento",
            "label": "Pensamento automático:"
          },
          {
            "kind": "text",
            "id": "cog-emocao",
            "label": "Emoção / intensidade:"
          },
          {
            "kind": "textarea",
            "id": "cog-favor",
            "label": "Fatos a favor:"
          },
          {
            "kind": "textarea",
            "id": "cog-contra",
            "label": "Fatos contra:"
          },
          {
            "kind": "textarea",
            "id": "cog-resposta",
            "label": "Resposta mais proporcional:"
          }
        ]
      }
    ]
  },
  {
    "id": "semana-1",
    "number": "15",
    "kicker": "SUA PRÁTICA",
    "title": "Uma semana adaptável",
    "blocks": [
      {
        "type": "lead",
        "text": "A programação deve caber na sua vida."
      },
      {
        "type": "p",
        "text": "Estes horários e atividades são exemplos editáveis. Escolha dias possíveis, reserve descanso e reduza o plano se necessário. Não há dívida de atividades nem obrigação de recuperar uma semana. Você pode deixar atividades de fora e acrescentar cuidados cotidianos, apoio social ou uma consulta."
      },
      {
        "type": "schedule",
        "id": "s1",
        "cols": [
          "16h30",
          "17h00",
          "21h30"
        ],
        "rows": [
          {
            "id": "s1-dom09",
            "day": "Preparação",
            "tasks": [
              "Escolher um cuidado possível",
              "—",
              "—"
            ]
          },
          {
            "id": "s1-seg10",
            "day": "Segunda",
            "tasks": [
              "Uma tarefa curta",
              "Um contato ou pausa",
              "Escrita opcional"
            ]
          },
          {
            "id": "s1-ter11",
            "day": "Terça",
            "tasks": [
              "Organizar uma demanda de trabalho",
              "Repetir cuidado escolhido",
              "—"
            ]
          },
          {
            "id": "s1-qua12",
            "day": "Quarta",
            "tasks": [
              "Responder à autocrítica",
              "—",
              "Escrita opcional"
            ]
          },
          {
            "id": "s1-qui13",
            "day": "Quinta",
            "tasks": [
              "Refletir sobre uma relação",
              "Um contato escolhido",
              "—"
            ]
          },
          {
            "id": "s1-sex14",
            "day": "Sexta",
            "tasks": [
              "Revisar limites e segurança",
              "—",
              "—"
            ]
          },
          {
            "id": "s1-sab15",
            "day": "Sábado",
            "tasks": [
              "Aprender com apoio",
              "Tempo para descanso",
              "Escrita opcional"
            ]
          },
          {
            "id": "s1-dom16",
            "day": "Revisão",
            "tasks": [
              "Revisão breve da semana",
              "—",
              "—"
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "semana-2",
    "number": "16",
    "kicker": "SUA PRÁTICA",
    "title": "Ajustar com gentileza",
    "blocks": [
      {
        "type": "lead",
        "text": "Repetir, mudar ou pausar são opções possíveis."
      },
      {
        "type": "p",
        "text": "Olhe para o que ajudou, o que ficou difícil e que condições precisam mudar. Não é preciso aumentar a dificuldade automaticamente. Reduzir tarefas, buscar apoio ou priorizar descanso pode ser o próximo passo."
      }
    ]
  },
  {
    "id": "revisao",
    "number": "17",
    "kicker": "SUA PRÁTICA",
    "title": "Perceber, reconhecer e ajustar",
    "blocks": [
      {
        "type": "lead",
        "text": "A semana é uma experiência para compreender, não um teste a passar."
      },
      {
        "type": "p",
        "text": "Escolha as perguntas úteis e deixe as demais. Considere também descanso, condições externas e apoio recebido. Marcações e escalas são registros subjetivos; não medem melhora clínica. Escolha apenas um ajuste que pareça possível para a próxima semana."
      },
      {
        "type": "fields",
        "title": "Registro pessoal opcional",
        "fields": [
          {
            "kind": "textarea",
            "id": "rev-evitacao",
            "label": "Escolhas — O que ficou mais acessível nesta semana?"
          },
          {
            "kind": "textarea",
            "id": "rev-autojulgamento",
            "label": "Autocuidado — Como respondi à autocrítica?"
          },
          {
            "kind": "textarea",
            "id": "rev-desconfianca",
            "label": "Segurança — Que fatos e limites considerei?"
          },
          {
            "kind": "textarea",
            "id": "rev-isolamento",
            "label": "Conexão — Que contato fez sentido para mim?"
          },
          {
            "kind": "textarea",
            "id": "rev-competencia",
            "label": "Aprendizagem — Que apoio e recursos foram úteis?"
          },
          {
            "kind": "textarea",
            "id": "rev-trabalho",
            "label": "Trabalho — Que necessidade ou limite reconheci?"
          },
          {
            "kind": "textarea",
            "id": "rev-relacionamento",
            "label": "Relacionamento — Qual generalização parece menos absoluta?"
          },
          {
            "kind": "textarea",
            "id": "rev-sentido",
            "label": "Valores — Que escolha combinou com o que importa para mim?"
          }
        ]
      }
    ]
  }
]

export const scheduleTaskIds: string[] = sections.flatMap((s) => s.blocks.flatMap((b) => {
  if (b.type === "schedule") return b.rows.flatMap((r) => r.tasks.map((t, i) => t === "—" ? null : r.id + "-" + i).filter((x): x is string => x !== null))
  if (b.type === "ladder") return b.rows.map((r) => r.id)
  return []
}))

export type ScheduleActivityItem = {
  id: string
  dayIndex: number
  time: string
  description: string
  order: number
  countsTowardCompletion?: boolean
}

export type CompletionConfig = {
  enabled: boolean
  reviewTitle: string
  analysisDimensions: string[]
  nextWeekFocusRules: string[]
  theologyReviewEnabled: boolean
}

export type WeeklyPlanItem = ScheduleActivityItem
export type QuickSheetItem = { id: string; title: string; summary: string }

export type GuideTemplate = {
  id: string
  title: string
  description: string
  version: number
  customized?: boolean
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

export const DEFAULT_GUIDE_TEMPLATE: GuideTemplate = {
  "id": "meu-guia-retomada",
  "title": "Meu Guia de Retomada",
  "description": "Um espaço pessoal de cuidado cotidiano, reflexão e apoio",
  "version": 2,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-10-12T00:00:00.000Z",
  "schemaVersion": 1,
  "contentLocale": "pt-BR",
  "config": {
    "targetAudience": "Pessoas adultas que desejam organizar cuidados cotidianos no próprio ritmo",
    "category": "Cuidado cotidiano e reflexão"
  },
  "intro": intro,
  "sections": sections,
  "scheduleTaskIds": scheduleTaskIds,
  "weeklyPlan": [
    {
      "id": "act-0-1",
      "dayIndex": 0,
      "time": "16:30",
      "description": "Escolher um cuidado / tarefa curta",
      "order": 0,
      "countsTowardCompletion": true
    },
    {
      "id": "act-0-2",
      "dayIndex": 0,
      "time": "17:00",
      "description": "Contato escolhido ou pausa",
      "order": 1,
      "countsTowardCompletion": true
    },
    {
      "id": "act-0-3",
      "dayIndex": 0,
      "time": "21:30",
      "description": "Escrita livre opcional",
      "order": 2,
      "countsTowardCompletion": true
    },
    {
      "id": "act-1-1",
      "dayIndex": 1,
      "time": "16:30",
      "description": "Organizar uma demanda de trabalho",
      "order": 0,
      "countsTowardCompletion": true
    },
    {
      "id": "act-1-2",
      "dayIndex": 1,
      "time": "17:00",
      "description": "Repetir cuidado escolhido",
      "order": 1,
      "countsTowardCompletion": true
    },
    {
      "id": "act-2-1",
      "dayIndex": 2,
      "time": "16:30",
      "description": "Refletir com gentileza",
      "order": 0,
      "countsTowardCompletion": true
    },
    {
      "id": "act-2-2",
      "dayIndex": 2,
      "time": "21:30",
      "description": "Escrita livre opcional",
      "order": 1,
      "countsTowardCompletion": true
    },
    {
      "id": "act-3-1",
      "dayIndex": 3,
      "time": "16:30",
      "description": "Refletir sobre uma relação",
      "order": 0,
      "countsTowardCompletion": true
    },
    {
      "id": "act-3-2",
      "dayIndex": 3,
      "time": "17:00",
      "description": "Contato escolhido",
      "order": 1,
      "countsTowardCompletion": true
    },
    {
      "id": "act-4-1",
      "dayIndex": 4,
      "time": "16:30",
      "description": "Revisar limites e segurança",
      "order": 0,
      "countsTowardCompletion": true
    },
    {
      "id": "act-5-1",
      "dayIndex": 5,
      "time": "16:30",
      "description": "Aprender com apoio",
      "order": 0,
      "countsTowardCompletion": true
    },
    {
      "id": "act-5-2",
      "dayIndex": 5,
      "time": "17:00",
      "description": "Descanso ou atividade escolhida",
      "order": 1,
      "countsTowardCompletion": true
    },
    {
      "id": "act-5-3",
      "dayIndex": 5,
      "time": "21:30",
      "description": "Escrita livre opcional",
      "order": 2,
      "countsTowardCompletion": true
    },
    {
      "id": "act-6-1",
      "dayIndex": 6,
      "time": "16:30",
      "description": "Revisão breve da semana",
      "order": 0,
      "countsTowardCompletion": true
    }
  ],
  "quickSheets": [
    {
      "id": "qs-esquemas",
      "title": "Registro de experiências",
      "summary": "Perceba contexto, sentimentos e necessidades com suas próprias palavras."
    },
    {
      "id": "qs-ativacao",
      "title": "Cuidado cotidiano",
      "summary": "Planeje um cuidado pequeno e opcional que caiba no seu dia."
    }
  ],
  "theologyEnabled": false,
  "completionConfig": {
    "enabled": true,
    "reviewTitle": "Reflexão da semana",
    "analysisDimensions": [
      "Atividades escolhidas e condições para realizá-las",
      "Necessidades, sentimentos e contexto registrados voluntariamente",
      "Descanso, apoio e limites",
      "Mudanças que a pessoa deseja fazer"
    ],
    "nextWeekFocusRules": [
      "Sugerir ajustes opcionais e realistas sem julgar adesão",
      "Respeitar descanso, necessidades de apoio e escolhas pessoais"
    ],
    "theologyReviewEnabled": false
  },
  "bibleVersion": null,
  "safetyNotes": [
    "Apoio educativo e organização pessoal; não substitui cuidado profissional.",
    "Atividades são opcionais, adaptáveis e podem ser interrompidas.",
    "O app não oferece diagnóstico nem acompanhamento de emergências."
  ]
}

import { DEFAULT_GUIDE_TEMPLATE_EN } from "./guide-data-en"
export { DEFAULT_GUIDE_TEMPLATE_EN }
export const GUIDE_TEMPLATES: GuideTemplate[] = [DEFAULT_GUIDE_TEMPLATE_EN, DEFAULT_GUIDE_TEMPLATE]
