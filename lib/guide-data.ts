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

export type Verse = { ref: string; ara: string; nvt: string }

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

export const intro = {
  title: `Guia de Retomada`,
  subtitle: `Para recomeçar com clareza, constância e esperança`,
  oracao: `Senhor, dá-me luz para discernir, coragem para agir, humildade para aprender e perseverança para continuar. Guarda meu coração do desespero e conduz meus passos em verdade. Amém.`,
  salmo: {
    ref: `Salmos 27:13-14`,
    ara: `Eu creio que verei a bondade do SENHOR na terra dos viventes. Espera pelo SENHOR, tem bom ânimo, e fortifique-se o teu coração; espera, pois, pelo SENHOR.`,
    nvt: `Ainda assim, confio que verei a bondade do SENHOR enquanto estiver aqui, na terra dos vivos. Espere pelo SENHOR e seja valente e corajoso; sim, espere pelo SENHOR.`,
  },
}

export const sections: Section[] = [
  {
    id: "fundamento",
    number: "01",
    kicker: "FUNDAMENTO",
    title: "Como este guia pensa a mudança",
    blocks: [
      { type: "lead", text: `Psicologia como instrumento; Escritura e doutrina como norma.` },
      {
        type: "p",
        text: `A psicologia pode descrever hábitos, evitação, memória, cognição, afeto e relações. Ela não recebe autoridade para definir o que é pecado, o valor da pessoa, a finalidade da vida ou a esperança última.`,
      },
      {
        type: "note",
        label: "Como usar",
        text: `Use este guia em ciclos independentes de 7 dias. Foque na semana selecionada e não tente fazer tudo de uma vez. O alvo é regularidade, não intensidade.`,
      },
      { type: "h", text: "Ordem das autoridades" },
      {
        type: "table",
        head: ["Nível", "Função neste guia"],
        rows: [
          ["Escritura", "Governa a antropologia, o juízo moral e o telos."],
          ["Confissões reformadas", "Delimitam a doutrina cristã usada na aplicação."],
          ["Psicologia clínica", "Descreve mecanismos e oferece técnicas limitadas."],
          ["Experiência pessoal", "Fornece dados reais, mas não interpreta a si mesma de modo infalível."],
        ],
      },
      { type: "h", text: "Quatro regras práticas" },
      {
        type: "list",
        items: [
          `Sentimento é dado real da experiência, mas não é automaticamente um fato sobre o mundo.`,
          `Esquema é padrão de interpretação e proteção; não é identidade.`,
          `Sofrimento, doença e limitação não devem ser automaticamente convertidos em culpa moral.`,
          `O passado informa o presente, mas não recebe autoridade para decretar o futuro.`,
        ],
      },
      {
        type: "p",
        text: `A meta não é "sentir-se bem" a qualquer custo, mas perceber melhor o que acontece, julgar com proporcionalidade e agir em direção ao que é verdadeiro e bom.`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Salmos 139:23-24",
          ara: `Sonda-me, ó Deus, e conhece o meu coração, prova-me e conhece os meus pensamentos; vê se há em mim algum caminho mau e guia-me pelo caminho eterno.`,
          nvt: `Examina-me, ó Deus, e conhece meu coração; prova-me e vê meus pensamentos. Mostra-me se há em mim algo que te ofende e conduze-me pelo caminho eterno.`,
        },
        {
          ref: "Provérbios 4:23",
          ara: `Sobre tudo o que se deve guardar, guarda o coração, porque dele procedem as fontes da vida.`,
          nvt: `Acima de todas as coisas, guarde seu coração, pois ele dirige o rumo de sua vida.`,
        },
      ],
      comentario: `O coração precisa ser conhecido e guardado, mas não por introspecção autônoma. O pedido é que Deus sonde, mostre e conduza; o cuidado de si permanece debaixo da verdade revelada.`,
      oracao: `Sonda-me, ó Deus. Mostra o que é verdadeiro em mim, corrige o que é torto e guarda meu coração no caminho eterno.`,
    },
  },
  {
    id: "mapa",
    number: "02",
    kicker: "MAPA",
    title: "Esquemas e três eixos",
    blocks: [
      { type: "lead", text: `O diagnóstico de esquema serve como mapa, não como identidade.` },
      {
        type: "p",
        text: `A formulação já obtida com psicóloga especialista em Terapia do Esquema permite começar de um mapa concreto, sem transformar o guia numa caça interminável por "qual esquema eu tenho".`,
      },
      {
        type: "table",
        head: ["Nível", "Esquemas identificados"],
        rows: [
          [
            "Primários",
            "Autocontrole/autodisciplina insuficientes • Desconfiança/abuso • Isolamento social/alienação • Defectividade/vergonha",
          ],
          ["Secundários", "Fracasso • Dependência/incompetência • Postura punitiva"],
        ],
      },
      { type: "h", text: "Três eixos para reconhecer no dia a dia" },
      {
        type: "list",
        items: [
          `A. Eu contra mim mesmo. Defectividade/vergonha + Postura punitiva + Fracasso. O medo social atual parece menos "o que vão pensar de mim" e mais "como vou me condenar depois".`,
          `B. O outro contra mim. Desconfiança/abuso. A mente procura o próximo agente de injustiça ou ataque. O alvo é discernimento por evidências, não confiança indiscriminada.`,
          `C. Eu separado dos outros. Isolamento social/alienação. O afastamento protege no curto prazo e, ao mesmo tempo, pode manter a solidão e a sensação de não pertencimento.`,
        ],
      },
      { type: "h", text: "Coping: o que observar" },
      {
        type: "p",
        text: `Na Terapia do Esquema, três respostas aparecem com frequência: rendimento ao esquema, evitação da dor e supercompensação para provar o contrário. Todas podem aliviar no curto prazo e ainda perpetuar o padrão no longo prazo. [C5–C6]`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Jeremias 17:9-10",
          ara: `Enganoso é o coração, mais do que todas as coisas, e desesperadamente corrupto; quem o conhecerá? Eu, o SENHOR, esquadrinho o coração, eu provo os pensamentos; e isto para dar a cada um segundo o seu proceder, segundo o fruto das suas ações.`,
          nvt: `O coração humano é mais enganoso que qualquer coisa e é extremamente perverso; quem sabe, de fato, o quanto é mau? Eu, o SENHOR, examino o coração e provo os pensamentos. Dou a cada pessoa a devida recompensa, de acordo com suas ações.`,
        },
        {
          ref: "Hebreus 4:12",
          ara: `Porque a palavra de Deus é viva, e eficaz, e mais cortante do que qualquer espada de dois gumes, e penetra até ao ponto de dividir alma e espírito, juntas e medulas, e é apta para discernir os pensamentos e propósitos do coração.`,
          nvt: `Pois a palavra de Deus é viva e poderosa. É mais cortante que qualquer espada de dois gumes, penetrando entre a alma e o espírito, entre a junta e a medula, e trazendo à luz até os pensamentos e desejos mais íntimos.`,
        },
      ],
      comentario: `A Escritura não romantiza a autopercepção: o coração pode enganar, e Deus conhece o que nós mesmos não discernimos. Isso impede tanto autoconfiança ingênua quanto autoacusação soberana.`,
      oracao: `Senhor, discerne meus pensamentos e intenções. Livra-me do autoengano e também de acusações que não correspondem à tua verdade.`,
    },
  },
  {
    id: "limites",
    number: "03",
    kicker: "LIMITES",
    title: "O que fazer sozinho — e o que não fazer",
    blocks: [
      { type: "lead", text: `Segurança antes de profundidade.` },
      {
        type: "p",
        text: `Como você está sem terapeuta, a prioridade é trabalhar técnicas de baixo risco que aumentem funcionamento e discriminação da realidade. Processamento profundo do trauma fica fora da autoaplicação por enquanto.`,
      },
      { type: "h", text: "Pode fazer sozinho agora" },
      {
        type: "list",
        items: [
          `Ativação comportamental e "primeiro passo físico".`,
          `Exposição gradual para sair de casa e reduzir evitação cotidiana.`,
          `Julgamento proporcional, discriminação de ameaça e registro de esquemas.`,
          `Grounding, escrita livre, treino de competência e aproximação relacional.`,
        ],
      },
      { type: "h", text: "Não fazer sozinho nesta semana" },
      {
        type: "list",
        items: [
          `EMDR improvisado ou técnicas de estimulação bilateral com objetivo de reprocessar memórias.`,
          `Revivência imaginária deliberada e detalhada dos episódios mais traumáticos.`,
          `Written Exposure Therapy por conta própria ou longas narrativas traumáticas repetidas.`,
          `Forçar uma exposição até "aguentar", quando o exercício está produzindo desorganização importante.`,
        ],
      },
      { type: "h", text: "Quando interromper" },
      {
        type: "p",
        text: `Se um exercício produzir desorientação, sofrimento muito acima do previsto, ou piora que permanece forte depois de encerrar, pare, volte ao presente com grounding e procure apoio de um adulto de confiança ou de um serviço de saúde. Diretrizes de trauma tratam CPT, PE e EMDR como psicoterapias estruturadas e individualizadas. [C3–C4]`,
      },
      {
        type: "note",
        label: "Regra do ciclo semanal",
        text: `Regularidade vale mais que intensidade. Dia incompleto conta; dia perdido não gera punição nem compensação.`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Salmos 103:13-14",
          ara: `Como um pai se compadece de seus filhos, assim o SENHOR se compadece dos que o temem. Pois ele conhece a nossa estrutura e sabe que somos pó.`,
          nvt: `O SENHOR é como um pai para seus filhos, bondoso e compassivo para os que o temem. Pois ele sabe como somos fracos; lembra que não passamos de pó.`,
        },
        {
          ref: "Isaías 42:3",
          ara: `Não esmagará a cana quebrada, nem apagará a torcida que fumega; em verdade, promulgará o direito.`,
          nvt: `Não esmagará a cana quebrada, nem apagará a chama que já está fraca; fará justiça a todos os injustiçados.`,
        },
      ],
      comentario: `Deus conhece nossa estrutura e não trata fragilidade como se fosse rebelião automática. O Servo prometido não esmaga o que já está ferido; sua justiça não depende de violência contra o fraco.`,
      oracao: `Pai, lembra-me de minha fragilidade sem me entregar à passividade. Sustenta o que está fraco e conduz-me com mansidão e verdade.`,
    },
  },
  {
    id: "acao",
    number: "04",
    kicker: "AÇÃO",
    title: "Ativação comportamental",
    blocks: [
      { type: "lead", text: `Começar antes da vontade; medir o passo, não o humor.` },
      {
        type: "p",
        text: `A primeira prioridade prática é impedir que a vida continue encolhendo enquanto você espera a motivação aparecer. A ativação comportamental trabalha exatamente a relação entre retraimento, atividade e humor. [C1]`,
      },
      { type: "h", text: "Regra do primeiro passo físico" },
      {
        type: "p",
        text: `Não escreva "vou caminhar". Escreva "16h30: colocar o tênis". Não escreva "resolver pendência". Escreva "abrir o arquivo e trabalhar cinco minutos". A unidade de sucesso é iniciar a ação combinada.`,
      },
      {
        type: "table",
        head: ["Tipo", "Exemplo", "Critério"],
        rows: [
          ["Manutenção", "Banho, arrumar algo, responder pendência", "Mantém a vida funcionando"],
          ["Competência", "Fazer uma etapa sem pedir ajuda imediatamente", "Produz evidência de domínio"],
          ["Aproximação", "Sair, conversar, ir a algum lugar", "Reduz evitação e isolamento"],
        ],
      },
      {
        type: "fields",
        title: "Registro de 60 segundos",
        fields: [
          { kind: "static", text: "Antes" },
          { kind: "scale", id: "acao-vontade", label: "Vontade de fazer" },
          { kind: "scale", id: "acao-desconforto-prev", label: "Desconforto previsto" },
          { kind: "static", text: "Depois" },
          { kind: "text", id: "acao-fiz", label: "Fiz o combinado? (sim / não)" },
          { kind: "scale", id: "acao-desconforto-pos", label: "Desconforto (depois)" },
          { kind: "textarea", id: "acao-aprendi", label: "O que aprendi em uma frase" },
        ],
      },
      {
        type: "note",
        label: "Versão mínima para dia ruim",
        text: `Bloco principal = 5 minutos; Saída = 2 minutos; Registro = "O que aconteceu / O que fiz / O que faço amanhã".`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Filipenses 2:12-13",
          ara: `Assim, pois, amados meus, como sempre obedecestes, não só na minha presença, porém, muito mais agora, na minha ausência, desenvolvei a vossa salvação com temor e tremor; porque Deus é quem efetua em vós tanto o querer como o realizar, segundo a sua boa vontade.`,
          nvt: `Quando eu estava aí, meus amados, vocês sempre seguiam minhas instruções. Agora que estou longe, é ainda mais importante que o façam. Trabalhem com afinco a sua salvação, obedecendo a Deus com reverência e temor. Pois Deus está agindo em vocês, dando-lhes o desejo e o poder de realizarem aquilo que é do agrado dele.`,
        },
        {
          ref: "Gálatas 6:9",
          ara: `E não nos cansemos de fazer o bem, porque a seu tempo ceifaremos, se não desfalecermos.`,
          nvt: `Portanto, não nos cansemos de fazer o bem. No momento certo, teremos uma colheita de bênçãos, se não desistirmos.`,
        },
      ],
      comentario: `A ação cristã não nasce de autonomia absoluta: Deus opera o querer e o efetuar. Ao mesmo tempo, a graça não transforma perseverança em passividade. Pequenos atos podem ser obedientemente repetidos sem exigir emoção perfeita.`,
      oracao: `Senhor, opera em mim o querer e o efetuar. Dá-me constância para fazer o bem sem depender de sentir-me pronto.`,
    },
  },
  {
    id: "evitacao",
    number: "05",
    kicker: "EVITAÇÃO",
    title: "Sair de casa: exposição gradual",
    blocks: [
      { type: "lead", text: `Aproximação pequena, repetida e observável.` },
      {
        type: "p",
        text: `Aqui o alvo não é "provar que sair é seguro" nem eliminar toda ansiedade. O objetivo é recuperar liberdade de ação e reduzir o aprendizado de que "só consigo ficar bem se evitar". A exposição gradual é parte importante de tratamentos comportamentais para ansiedade e evitação. [C2]`,
      },
      {
        type: "ladder",
        id: "ladder-saida",
        head: ["Degrau inicial sugerido", "Nota prevista", "Feito"],
        rows: [
          { id: "saida-1", label: "Ficar 5 min do lado de fora" },
          { id: "saida-2", label: "Andar até o fim da rua" },
          { id: "saida-3", label: "Andar uma quadra" },
          { id: "saida-4", label: "Caminhar 10 min" },
          { id: "saida-5", label: "Entrar rapidamente numa loja" },
          { id: "saida-6", label: "Fazer uma tarefa simples sozinho fora" },
        ],
      },
      { type: "h", text: "Como executar" },
      {
        type: "list",
        items: [
          `Comece em algo desconfortável, mas claramente realizável — em geral 3–5/10.`,
          `Repita o mesmo degrau mais de uma vez antes de subir.`,
          `O critério de sucesso é permanecer e concluir o combinado, não atingir ansiedade zero.`,
          `Depois registre: "O que eu esperava que acontecesse?" e "O que aconteceu de fato?".`,
        ],
      },
      {
        type: "note",
        label: "No seu caso",
        text: `Acrescente "Como eu me julguei depois?". O alvo social principal não parece mais ser a avaliação dos outros, mas a condenação retrospectiva de si.`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Salmos 56:3-4",
          ara: `Em me vindo o temor, hei de confiar em ti. Em Deus, cuja palavra eu exalto, neste Deus ponho a minha confiança e nada temerei. Que me pode fazer um mortal?`,
          nvt: `Quando eu tiver medo, porém, confiarei em ti. Louvo a Deus por suas promessas, confio em Deus e não temerei; o que me podem fazer os simples mortais?`,
        },
        {
          ref: "Isaías 41:10",
          ara: `Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a minha destra fiel.`,
          nvt: `Não tenha medo, pois estou com você; não desanime, pois sou o seu Deus. Eu o fortalecerei e o ajudarei; com minha vitoriosa mão direita o sustentarei.`,
        },
      ],
      comentario: `A presença do medo não é tratada como prova de abandono. A confiança bíblica não exige ausência prévia de temor; ela desloca o peso do medo para a presença e a fidelidade de Deus.`,
      oracao: `Deus meu, quando eu temer, ensina-me a confiar em ti e a dar o próximo passo sem transformar o medo em senhor das minhas decisões.`,
    },
  },
  {
    id: "autojulgamento",
    number: "06",
    kicker: "AUTOJULGAMENTO",
    title: "Defectividade/vergonha + Postura punitiva",
    blocks: [
      {
        type: "lead",
        text: `Verdade e proporção em vez de absolvição artificial ou condenação sem fim.`,
      },
      {
        type: "p",
        text: `O circuito mais relevante parece ser: situação → revisão retrospectiva → "fiz algo ridículo/inadequado?" → condenação de si → mais evitação. O exercício abaixo separa conduta, gravidade e identidade.`,
      },
      { type: "h", text: "Julgamento proporcional" },
      {
        type: "fields",
        fields: [
          { kind: "textarea", id: "julg-1", label: "1. O que aconteceu objetivamente?" },
          { kind: "textarea", id: "julg-2", label: "2. Do que exatamente estou me acusando?" },
          {
            kind: "textarea",
            id: "julg-3",
            label: "3. Foi errado, imperfeito, constrangedor ou apenas diferente do ideal?",
          },
          { kind: "scale", id: "julg-4", label: "4. Gravidade objetiva de 0–10?" },
          { kind: "textarea", id: "julg-5", label: "5. Eu daria a mesma nota se outra pessoa fizesse isso?" },
          { kind: "textarea", id: "julg-6", label: "6. Existe algo concreto a reparar?" },
          { kind: "textarea", id: "julg-7", label: "7. Estou corrigindo algo ou apenas me punindo?" },
        ],
      },
      {
        type: "fields",
        note: `"________. Se há algo a reparar, farei o que é proporcional. Se não há, não reabrirei o julgamento apenas para continuar sofrendo."`,
        fields: [{ kind: "textarea", id: "julg-sentenca", label: "Sentença de encerramento" }],
      },
      {
        type: "p",
        text: `Isso não é "autoestima positiva". É buscar um veredicto mais verdadeiro: arrependimento quando há culpa real; correção quando há erro; e fim da punição quando não há mais nada a reparar.`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Romanos 8:1",
          ara: `Agora, pois, já nenhuma condenação há para os que estão em Cristo Jesus.`,
          nvt: `Agora, portanto, já não há nenhuma condenação para os que estão em Cristo Jesus.`,
        },
        {
          ref: "1 João 3:19-20",
          ara: `E nisto conheceremos que somos da verdade, bem como, perante ele, tranquilizaremos o nosso coração; pois, se o nosso coração nos acusar, certamente, Deus é maior do que o nosso coração e conhece todas as coisas.`,
          nvt: `Com isso saberemos que pertencemos à verdade, e nos tranquilizaremos quando estivermos diante de Deus. E, ainda que a consciência nos condene, Deus é maior que nossa consciência e sabe todas as coisas.`,
        },
      ],
      comentario: `O coração pode condenar além da medida, mas não é o tribunal supremo. Para quem está em Cristo, a condenação final foi removida; isso não elimina correção, porém impede que cada falha vire sentença sobre a pessoa inteira.`,
      oracao: `Senhor, quando meu coração me condenar, leva-me a um juízo verdadeiro. Dá-me arrependimento sem desespero e correção sem castigo interminável.`,
    },
  },
  {
    id: "desconfianca",
    number: "07",
    kicker: "DESCONFIANÇA",
    title: `"Tem alguém pronto para me atacar"`,
    blocks: [
      { type: "lead", text: `Nem ingenuidade, nem veredicto antes dos fatos.` },
      {
        type: "p",
        text: `O pensamento "há um vilão pronto para me injustiçar ou atacar lá fora" aponta mais diretamente para Desconfiança/abuso e generalização de ameaça. O alvo não é "confiar nas pessoas", mas aprender confiança discriminativa.`,
      },
      { type: "h", text: "Discriminação de ameaça" },
      {
        type: "fields",
        fields: [
          { kind: "textarea", id: "desc-fato", label: "Fato observado: o que realmente aconteceu?" },
          { kind: "textarea", id: "desc-interp", label: "Interpretação: o que concluí a partir disso?" },
          { kind: "textarea", id: "desc-prev", label: "Previsão: o que acho que a pessoa pretende fazer?" },
          { kind: "textarea", id: "desc-favor", label: "Evidências concretas a favor" },
          { kind: "textarea", id: "desc-contra", label: "Evidências concretas contra" },
          { kind: "textarea", id: "desc-alt", label: "Duas explicações alternativas (1 e 2)" },
          {
            kind: "textarea",
            id: "desc-protecao",
            label: "Proteção proporcional: agir, observar ou não fazer nada?",
          },
          { kind: "text", id: "desc-confianca", label: "Confiança provisória na pessoa: ___/100" },
        ],
      },
      {
        type: "note",
        label: "Pergunta-chave",
        text: `"O que eu precisaria observar para aumentar justificadamente minha suspeita — e o que eu precisaria observar para diminuí-la?" Uma hipótese de ameaça precisa poder ser corrigida pela realidade.`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Provérbios 14:15",
          ara: `O simples dá crédito a toda palavra, mas o prudente atenta para os seus passos.`,
          nvt: `O ingênuo acredita em tudo que ouve; o prudente examina seus passos com cuidado.`,
        },
        {
          ref: "Provérbios 22:3",
          ara: `O prudente vê o mal e esconde-se; mas os simples passam adiante e sofrem a pena.`,
          nvt: `O prudente antevê o perigo e toma precauções; o ingênuo avança às cegas e sofre as consequências.`,
        },
      ],
      comentario: `A prudência bíblica não é credulidade. Ela examina e percebe perigo real. Ao mesmo tempo, não chama toda possibilidade de certeza. Discernir é diferente de presumir hostilidade.`,
      oracao: `Senhor, dá-me prudência sem paranoia e coragem sem ingenuidade. Ensina-me a reconhecer perigo real e a não criar condenações onde ainda não há fatos.`,
    },
  },
  {
    id: "vinculo",
    number: "08",
    kicker: "VÍNCULO",
    title: "Isolamento sem ingenuidade",
    blocks: [
      { type: "lead", text: `Aproximar-se sem entregar discernimento.` },
      {
        type: "p",
        text: `Isolamento social/alienação não exige que você "se torne sociável". O alvo é reduzir a regra implícita de que distância é sempre a opção mais segura. Aproximação e confiança são coisas diferentes: você pode participar de uma relação sem conceder intimidade ou confiança total.`,
      },
      { type: "h", text: "Experimento de vínculo — 2 a 3 vezes por semana" },
      {
        type: "list",
        items: [
          `Mandar uma mensagem curta.`,
          `Permanecer alguns minutos a mais numa conversa.`,
          `Fazer uma pergunta genuína em vez de apenas responder.`,
          `Compartilhar algo moderadamente pessoal com alguém já razoavelmente seguro.`,
        ],
      },
      {
        type: "fields",
        title: "Depois, responda",
        fields: [
          { kind: "textarea", id: "vinc-esperava", label: "Antes eu esperava:" },
          { kind: "textarea", id: "vinc-aconteceu", label: "O que aconteceu de fato:" },
          { kind: "textarea", id: "vinc-julguei", label: "Como me julguei depois:" },
          {
            kind: "textarea",
            id: "vinc-confianca",
            label: "O comportamento da pessoa aumentou, manteve ou diminuiu a confiança que merece?",
          },
        ],
      },
      { type: "h", text: "Confiança graduada" },
      {
        type: "p",
        text: `Não use "confio / não confio". Pergunte: 10%, 30%, 60%? Algumas pessoas merecem apenas convivência cordial; outras podem, com consistência, receber mais acesso. O objetivo não é vulnerabilidade indiscriminada.`,
      },
      {
        type: "note",
        label: "Erro a evitar",
        text: `Confundir "Eu me senti deslocado" com "Essas pessoas são hostis". Um sentimento de não pertencimento é dado importante, mas não prova a intenção dos outros.`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Eclesiastes 4:9-10",
          ara: `Melhor é serem dois do que um, porque têm melhor paga do seu trabalho. Porque se caírem, um levanta o companheiro; ai, porém, do que estiver só; pois, caindo, não haverá quem o levante.`,
          nvt: `É melhor serem dois que um, pois um ajuda o outro a alcançar o sucesso. Se um cair, o outro o ajuda a levantar-se. Mas quem cai sem ter quem o ajude está em sérios apuros.`,
        },
        {
          ref: "Hebreus 10:24-25",
          ara: `Consideremo-nos também uns aos outros, para nos estimularmos ao amor e às boas obras. Não deixemos de congregar-nos, como é costume de alguns; antes, façamos admoestações e tanto mais quanto vedes que o Dia se aproxima.`,
          nvt: `Pensemos em como motivar uns aos outros na prática do amor e das boas obras. E não deixemos de nos reunir, como fazem alguns, mas encorajemo-nos mutuamente, sobretudo agora que o dia está próximo.`,
        },
      ],
      comentario: `A Escritura reconhece o peso de caminhar só e ordena cuidado mútuo. Comunhão não significa confiança indiscriminada; significa que a vida cristã não foi desenhada como projeto de isolamento autossuficiente.`,
      oracao: `Senhor, dá-me pessoas fiéis e coragem para não transformar proteção em isolamento. Ensina-me a oferecer e receber cuidado com sabedoria.`,
    },
  },
  {
    id: "competencia",
    number: "09",
    kicker: "COMPETÊNCIA",
    title: "Domínio gradual + escrita livre",
    blocks: [
      {
        type: "lead",
        text: `Produzir evidência concreta de capacidade; capturar pensamentos sem obedecê-los.`,
      },
      {
        type: "p",
        text: `Dependência/incompetência e Fracasso são melhor contrariados por experiências graduais de domínio do que por frases motivacionais. A escrita livre entra como ferramenta de captura: ela revela material mental sem exigir coerência nem transformá-lo automaticamente em verdade.`,
      },
      {
        type: "fields",
        title: "Treino de competência — 3 vezes por semana",
        fields: [
          { kind: "text", id: "comp-antes", label: "Antes: chance de conseguir sozinho (%)" },
          { kind: "textarea", id: "comp-tarefa", label: "Tarefa:" },
          { kind: "textarea", id: "comp-passo", label: "Primeiro passo físico:" },
          { kind: "text", id: "comp-depois", label: "Depois: consegui aproximadamente ___% sem ajuda" },
          { kind: "textarea", id: "comp-ajuda", label: "Onde precisei de ajuda de fato:" },
        ],
      },
      {
        type: "p",
        text: `"Não sei fazer X ainda" é informação específica. "Sou incompetente" é uma conclusão global.`,
      },
      { type: "h", text: "Escrita livre de 5 minutos — seg/qua/sáb" },
      {
        type: "p",
        text: `Escreva continuamente tudo o que surgir, na velocidade que conseguir, sem corrigir, organizar ou exigir coerência. Quando terminar, circule no máximo duas frases. Não transforme cada linha em descoberta profunda.`,
      },
      {
        type: "p",
        text: `Funções diferentes: escrita livre = captura; registro de esquema = reconhecer padrão; registro cognitivo = examinar interpretação.`,
      },
      {
        type: "note",
        label: "Limite",
        text: `Não use os cinco minutos para reconstruir detalhadamente episódios traumáticos. Escrita terapêutica de exposição é um protocolo diferente e estruturado. [C4]`,
      },
      {
        type: "fields",
        title: "Escrita livre (5 min)",
        fields: [{ kind: "textarea", id: "comp-escrita", label: "Escrita livre de hoje" }],
      },
    ],
    scripture: {
      verses: [
        {
          ref: "2 Coríntios 4:7",
          ara: `Temos, porém, este tesouro em vasos de barro, para que a excelência do poder seja de Deus e não de nós.`,
          nvt: `Agora nós mesmos somos como vasos frágeis de barro que contêm esse grande tesouro. Assim, fica evidente que esse grande poder vem de Deus, e não de nós.`,
        },
        {
          ref: "Salmos 138:8",
          ara: `O que a mim me concerne o SENHOR levará a bom termo; a tua misericórdia, ó SENHOR, dura para sempre; não desampares as obras das tuas mãos.`,
          nvt: `O SENHOR cumprirá seus planos para minha vida, pois teu amor, ó SENHOR, dura para sempre; não me abandones, pois tu me fizeste.`,
        },
      ],
      comentario: `A fragilidade não cancela valor nem torna o poder de Deus dependente de competência pessoal. O que está incompleto em você não precisa ser tratado como obra abandonada.`,
      oracao: `Senhor, livra-me de medir meu valor pela performance. Dá-me humildade para aprender e perseverança para fazer o que hoje está ao meu alcance.`,
    },
  },
  {
    id: "trabalho-1",
    number: "10",
    kicker: "TRABALHO I",
    title: "O prédio: pistas externas, não revivência",
    blocks: [
      { type: "lead", text: `A imagem é um lembrete; não é o acontecimento ocorrendo novamente.` },
      {
        type: "p",
        text: `O "trauma do prédio" será tratado, nesta etapa, como reação intensa a pistas externas associadas ao trabalho. Isso não equivale a afirmar um diagnóstico específico. A meta inicial é distinguir o lembrete presente do acontecimento passado.`,
      },
      {
        type: "ladder",
        id: "ladder-pistas",
        head: ["Pista", "Nota prevista", "Concluído"],
        rows: [
          { id: "pista-1", label: "Prédio corporativo genérico" },
          { id: "pista-2", label: "Prédio um pouco parecido" },
          { id: "pista-3", label: "Prédio muito parecido" },
          { id: "pista-4", label: "Foto pequena/distante do prédio real" },
          { id: "pista-5", label: "Foto normal do prédio real" },
          { id: "pista-6", label: "Outra perspectiva externa / Street View" },
        ],
      },
      { type: "h", text: "O que fica fora do exercício" },
      {
        type: "list",
        items: [
          `Não se imaginar entrando no prédio.`,
          `Não reconstruir mentalmente gestor, colegas, conversas ou obrigação de voltar.`,
          `Não aumentar a intensidade para "provar resistência".`,
        ],
      },
      {
        type: "p",
        text: `A Exposição Prolongada diferencia exposição a situações/lembretes evitados de revisitação imaginária detalhada da memória traumática; esta segunda é uma intervenção clínica mais estruturada. [C3–C4]`,
      },
      {
        type: "note",
        label: "Começo sugerido",
        text: `Escolha uma pista de 3–4/10. Faça 2–3 sessões por semana, apenas uma sessão por dia.`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Naum 1:7",
          ara: `O SENHOR é bom, é fortaleza no dia da angústia e conhece os que nele se refugiam.`,
          nvt: `O SENHOR é bom; é forte refúgio quando vem a aflição. Está perto dos que nele confiam.`,
        },
        {
          ref: "Salmos 46:1-2",
          ara: `Deus é o nosso refúgio e fortaleza, socorro bem-presente nas tribulações. Portanto, não temeremos ainda que a terra se transtorne e os montes se abalem no seio dos mares;`,
          nvt: `Deus é nosso refúgio e nossa força, sempre pronto a nos socorrer em tempos de aflição. Portanto, não temeremos quando vierem terremotos e montes desabarem no mar.`,
        },
      ],
      comentario: `A segurança última do cristão não está em controlar todos os cenários, mas no caráter de Deus. Isso não transforma um gatilho em algo "bobo"; oferece um lugar firme de onde encará-lo sem confundi-lo com o próprio perigo.`,
      oracao: `Senhor, sê minha fortaleza na angústia. Ajuda-me a distinguir lembrança de ameaça presente e a permanecer contigo diante do que hoje é apenas um sinal do passado.`,
    },
  },
  {
    id: "trabalho-2",
    number: "11",
    kicker: "TRABALHO II",
    title: "Grounding e registro da exposição",
    blocks: [
      { type: "lead", text: `Aproximar-se sem se lançar dentro da memória.` },
      {
        type: "p",
        text: `Grounding não processa o trauma. Ele serve para recuperar orientação ao presente quando uma pista sequestra atenção e corpo. O PTSD Coach utiliza exercícios de atenção às sensações corporais e ao ambiente para "estar onde você está". [C7]`,
      },
      {
        type: "fields",
        title: "Sessão curta de exposição — 2 a 3 vezes por semana",
        fields: [
          { kind: "static", text: "1. Escolha o degrau atual." },
          { kind: "scale", id: "expo-inicial", label: "2. Intensidade inicial" },
          {
            kind: "static",
            text: "3. Observe a imagem sem acrescentar cena mental. 4. Se necessário, faça grounding.",
          },
          { kind: "scale", id: "expo-max", label: "5. Máximo atingido" },
          { kind: "scale", id: "expo-final", label: "5. Final" },
          {
            kind: "textarea",
            id: "expo-frase",
            label: `6. Frase: "Meu organismo parecia esperar ___; o que ocorreu de fato foi ___."`,
          },
        ],
      },
      { type: "h", text: "Grounding de 90 segundos" },
      {
        type: "list",
        items: [
          `Diga onde está e que dia é hoje.`,
          `Nomeie 3 coisas que vê, 2 sons que ouve e 1 ponto de contato físico com cadeira/chão.`,
          `Perceba o peso do corpo e os pés apoiados.`,
          `Pergunte: "O acontecimento está ocorrendo agora ou meu organismo está reagindo a um lembrete?".`,
        ],
      },
      {
        type: "note",
        text: `Não use grounding para escapar instantaneamente de qualquer ansiedade leve. Ele é apoio quando a ativação fica alta; se usado como ritual obrigatório para "garantir segurança", pode virar outro comportamento de proteção.`,
      },
      { type: "h", text: "Se a sessão passar do ponto" },
      {
        type: "p",
        text: `Interrompa, oriente-se ao presente e volte a um degrau mais leve na próxima vez. Não compense fazendo outra sessão no mesmo dia.`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Salmos 131:2",
          ara: `Pelo contrário, fiz calar e sossegar a minha alma; como a criança desmamada se aquieta nos braços de sua mãe, como essa criança é a minha alma para comigo.`,
          nvt: `Pelo contrário, acalmei e aquietei a alma, como criança desmamada que não chora mais pelo leite da mãe. Sim, minha alma dentro de mim é como uma criança desmamada.`,
        },
        {
          ref: "Isaías 26:3",
          ara: `Tu, SENHOR, conservarás em perfeita paz aquele cujo propósito é firme; porque ele confia em ti.`,
          nvt: `Tu guardarás em perfeita paz todos que em ti confiam, aqueles cujos propósitos estão firmes em ti.`,
        },
      ],
      comentario: `A quietude bíblica não é negação da realidade. O salmista fala de uma alma aquietada; Isaías liga firmeza da mente à confiança em Deus. O alvo não é anestesia, mas presença estável.`,
      oracao: `Senhor, aquieta minha alma sem me tornar passivo. Firma minha mente em ti e ajuda-me a permanecer no presente com sobriedade.`,
    },
  },
  {
    id: "relacionamento-1",
    number: "12",
    kicker: "RELACIONAMENTO I",
    title: "Fato, regra, identidade e futuro",
    blocks: [
      { type: "lead", text: `O passado merece ser nomeado sem receber poder de profecia.` },
      {
        type: "p",
        text: `O trauma relacional amoroso não será trabalhado como a exposição ao prédio. Nesta etapa, o foco é separar o fato vivido das regras e previsões que ficaram. Uma experiência devastadora pode deixar conclusões globais sem que todas elas sejam logicamente necessárias.`,
      },
      {
        type: "fields",
        title: "2 vezes por semana",
        fields: [
          { kind: "textarea", id: "rel-fato", label: "Fato ocorrido" },
          { kind: "textarea", id: "rel-regra", label: "Regra aprendida" },
          { kind: "textarea", id: "rel-conclusao", label: "Conclusão sobre mim" },
          { kind: "textarea", id: "rel-previsao", label: "Previsão sobre o futuro" },
        ],
      },
      { type: "h", text: "Trabalhe apenas uma frase por sessão" },
      {
        type: "list",
        items: [
          `Isso decorre necessariamente do fato, ou é uma generalização?`,
          `O acontecimento demonstra "pode acontecer" ou "sempre acontecerá"?`,
          `Estou assumindo responsabilidade por uma decisão moral que pertenceu à outra pessoa?`,
          `Qual conclusão preserva o risco real sem transformar o passado em profecia?`,
        ],
      },
      {
        type: "note",
        label: "Exemplo de precisão",
        text: `"Eu fui ferido por alguém em quem confiei" pode ser fato. "Toda intimidade terminará da mesma forma" é uma previsão que precisa de evidência própria.`,
      },
      {
        type: "p",
        text: `Não abra fotos, mensagens antigas ou registros do relacionamento para provocar reação. O exercício atual trabalha conclusões presentes, não revivência.`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Miquéias 7:7",
          ara: `Eu, porém, olharei para o SENHOR e esperarei no Deus da minha salvação; o meu Deus me ouvirá.`,
          nvt: `Quanto a mim, busco o SENHOR e espero confiante que Deus me salve; certamente meu Deus me ouvirá!`,
        },
        {
          ref: "Salmos 147:3",
          ara: `Sara os de coração quebrantado e lhes pensa as feridas.`,
          nvt: `Ele cura os de coração quebrantado e enfaixa suas feridas.`,
        },
      ],
      comentario: `Quando relações humanas falham, a esperança não precisa ser transferida para ingenuidade sobre pessoas. Ela pode permanecer em Deus, que ouve e cura. Isso permite reconhecer a ferida sem torná-la o centro permanente da identidade.`,
      oracao: `Deus da minha salvação, recebe o que foi ferido em mim. Não me deixa negar o mal que aconteceu nem entregar-lhe autoridade sobre todo o meu futuro.`,
    },
  },
  {
    id: "relacionamento-2",
    number: "13",
    kicker: "RELACIONAMENTO II",
    title: "Esperança, confiança e desejo de família",
    blocks: [
      { type: "lead", text: `Desejar um bem sem transformá-lo em salvador.` },
      {
        type: "p",
        text: `Seu desejo de casamento e família pode continuar sendo um bem real sem se tornar a condição pela qual você decide se sua vida vale a pena. O trabalho aqui é preservar esperança sem transformar uma possibilidade futura em garantia — ou sua ausência em sentença.`,
      },
      {
        type: "table",
        head: ["Área", "Pergunta de trabalho"],
        rows: [
          ["Confiança", "Que sinais concretos indicariam confiabilidade crescente?"],
          [
            "Intimidade",
            "Que grau de vulnerabilidade seria proporcional ao nível de confiança atual?",
          ],
          [
            "Valor pessoal",
            "Estou usando a escolha errada de outra pessoa como prova de defeito em mim?",
          ],
          ["Futuro", `Estou convertendo "não consigo ver como" em "não pode acontecer"?`],
        ],
      },
      {
        type: "fields",
        title: "Esperança sem previsão",
        note: "Escreva duas frases distintas:",
        fields: [
          { kind: "textarea", id: "rel2-desejo", label: "O que eu desejo:" },
          {
            kind: "textarea",
            id: "rel2-afirmar",
            label: "O que posso afirmar hoje sem fingir certeza:",
          },
        ],
      },
      {
        type: "note",
        text: `"Hoje não consigo visualizar o caminho até uma família" é diferente de "meu futuro está encerrado". A primeira frase descreve seu campo de visão; a segunda pretende conhecer o que ainda não foi dado a você conhecer.`,
      },
      { type: "h", text: "Uma ação de vínculo nesta semana" },
      {
        type: "p",
        text: `Escolha uma aproximação que não tenha como finalidade "achar alguém". O objetivo é voltar a habitar relações humanas reais: amizade, igreja, família, serviço, conversa, presença.`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Salmos 62:5-6",
          ara: `Somente em Deus, ó minha alma, espera silenciosa, porque dele vem a minha esperança. Só ele é a minha rocha, e a minha salvação, e o meu alto refúgio; não serei jamais abalado.`,
          nvt: `Que minha alma espere em silêncio diante de Deus, pois nele está minha esperança. Somente ele é minha rocha e minha salvação, minha fortaleza onde não serei abalado.`,
        },
        {
          ref: "Lamentações 3:21-24",
          ara: `Quero trazer à memória o que me pode dar esperança. As misericórdias do SENHOR são a causa de não sermos consumidos, porque as suas misericórdias não têm fim; renovam-se cada manhã. Grande é a tua fidelidade. A minha porção é o SENHOR, diz a minha alma; portanto, esperarei nele.`,
          nvt: `Ainda ouso, porém, ter esperança quando me recordo disto: O amor do SENHOR não tem fim! Suas misericórdias são inesgotáveis. Grande é sua fidelidade; suas misericórdias se renovam cada manhã. Digo a mim mesmo: 'O SENHOR é minha porção; por isso, esperarei nele!'.`,
        },
      ],
      comentario: `A esperança bíblica repousa primeiro em Deus, não na capacidade de prever circunstâncias favoráveis. Por isso ela pode coexistir com desejo intenso, espera e incerteza sem chamar a incerteza de abandono.`,
      oracao: `Senhor, guarda meu desejo por uma família sem deixá-lo ocupar teu lugar. Dá-me esperança em ti enquanto caminho, sem exigir de mim uma previsão do futuro.`,
    },
  },
  {
    id: "pensamento-sentido",
    number: "14",
    kicker: "PENSAMENTO E SENTIDO",
    title: "Registro cognitivo + ação orientada por sentido",
    blocks: [
      { type: "lead", text: `Examinar o que penso; agir segundo um bem que não depende do humor.` },
      {
        type: "p",
        text: `Duas ferramentas ficam disponíveis para momentos diferentes: o registro cognitivo examina interpretações; a ação orientada por sentido impede que toda decisão seja submetida à pergunta "isso vai me fazer sentir melhor agora?".`,
      },
      {
        type: "fields",
        title: "Registro cognitivo — quando uma conclusão ficar rígida",
        fields: [
          { kind: "textarea", id: "cog-situacao", label: "Situação:" },
          { kind: "textarea", id: "cog-pensamento", label: "Pensamento automático:" },
          { kind: "text", id: "cog-emocao", label: "Emoção / intensidade:" },
          { kind: "textarea", id: "cog-favor", label: "Fatos a favor:" },
          { kind: "textarea", id: "cog-contra", label: "Fatos contra:" },
          { kind: "textarea", id: "cog-resposta", label: "Resposta mais proporcional:" },
        ],
      },
      {
        type: "p",
        text: `Não troque "ninguém gosta de mim" por "todo mundo gosta de mim". Troque uma conclusão absoluta por uma frase que corresponda aos dados disponíveis.`,
      },
      { type: "h", text: "Ação orientada por sentido — 1 pequena por dia" },
      {
        type: "p",
        text: `Pergunte: "O que vale a pena fazer hoje mesmo se eu não me sentir melhor imediatamente?" Pode ser responsabilidade, vínculo, serviço, fé, cuidado da casa, aprendizagem ou preparação para o futuro.`,
      },
      {
        type: "p",
        text: `A Logoterapia é usada aqui apenas como auxílio para responsabilidade e autotranscendência. O sentido último não é criado pelo humor ou pela escolha individual: a vida pertence ao Senhor.`,
      },
      {
        type: "note",
        label: "Frase para o caderno",
        text: `"Minha emoção merece ser ouvida; minha interpretação precisa ser examinada; minha ação não precisa esperar que ambas estejam perfeitas."`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Salmos 42:5",
          ara: `Por que estás abatida, ó minha alma? Por que te perturbas dentro de mim? Espera em Deus, pois ainda o louvarei, a ele, meu auxílio e Deus meu.`,
          nvt: `Por que você está tão abatida, ó minha alma? Por que está tão triste? Espere em Deus! Ainda voltarei a louvá-lo, meu Salvador e meu Deus!`,
        },
        {
          ref: "Filipenses 4:8",
          ara: `Finalmente, irmãos, tudo o que é verdadeiro, tudo o que é respeitável, tudo o que é justo, tudo o que é puro, tudo o que é amável, tudo o que é de boa fama, se alguma virtude há e se algum louvor existe, seja isso o que ocupe o vosso pensamento.`,
          nvt: `Por fim, irmãos, quero lhes dizer só mais uma coisa. Concentrem-se em tudo que é verdadeiro, tudo que é nobre, tudo que é correto, tudo que é puro, tudo que é amável e tudo que é admirável. Pensem no que é excelente e digno de louvor.`,
        },
      ],
      comentario: `O salmista fala à própria alma sem fingir que ela não está abatida. A mente cristã não é chamada a negar a dor, mas a submetê-la à verdade e dirigir a atenção ao que é verdadeiro, justo e digno.`,
      oracao: `Senhor, ensina-me a falar à minha alma sem mentir para ela. Dá-me mente sóbria para pensar no que é verdadeiro e passos fiéis para viver diante de ti.`,
    },
  },
  {
    id: "semana-1",
    number: "15",
    kicker: "PROGRAMAÇÃO SEMANAL",
    title: "Programação da Semana",
    blocks: [
      { type: "lead", text: `A meta é presença e repetição, não intensidade.` },
      {
        type: "p",
        text: `Nesta semana, não escolha na hora o que fazer. O horário definido para cada atividade já decidiu. Se o dia estiver ruim, execute a versão mínima; não transfira a sessão para a madrugada nem tente "pagar" uma falha com o dobro no dia seguinte.`,
      },
      {
        type: "schedule",
        id: "s1",
        cols: ["16h30", "17h00", "21h30"],
        rows: [
          { id: "s1-dom09", day: "Dom 09", tasks: ["Preparar caderno + duas escadas", "—", "—"] },
          {
            id: "s1-seg10",
            day: "Seg 10",
            tasks: ["Ativação: tarefa de 15 min", "Saída: degrau 1", "Escrita livre 5 min"],
          },
          {
            id: "s1-ter11",
            day: "Ter 11",
            tasks: ["Trabalho: pista externa nível 1", "Repetir saída", "—"],
          },
          {
            id: "s1-qua12",
            day: "Qua 12",
            tasks: ["Julgamento proporcional", "—", "Escrita livre 5 min"],
          },
          {
            id: "s1-qui13",
            day: "Qui 13",
            tasks: ["Relacionamento: 4 colunas", "Saída: mesmo/pequeno avanço", "—"],
          },
          { id: "s1-sex14", day: "Sex 14", tasks: ["Discriminação de ameaça", "—", "—"] },
          {
            id: "s1-sab15",
            day: "Sáb 15",
            tasks: ["Vínculo + competência", "Saída", "Escrita livre 5 min"],
          },
          { id: "s1-dom16", day: "Dom 16", tasks: ["Revisão semanal 30 min", "—", "—"] },
        ],
      },
      { type: "h", text: "O que preparar antes da semana" },
      {
        type: "list",
        items: [
          `Caderno dividido em: saídas • trabalho • relacionamento • autojulgamento • desconfiança.`,
          `Escada 0–10 para sair de casa.`,
          `Escada 0–10 de pistas externas relacionadas ao prédio.`,
          `Primeiro degrau de cada uma: idealmente 3–4/10.`,
        ],
      },
      {
        type: "note",
        label: "Regra de horário",
        text: `O horário definido para cada atividade deve ser respeitado como compromisso do dia. Ajuste os horários das atividades no painel de programação conforme sua rotina.`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Salmos 119:133",
          ara: `Firma os meus passos na tua palavra, e não me domine iniquidade alguma.`,
          nvt: `Firma meus passos conforme a tua palavra, para que o pecado não me domine.`,
        },
        {
          ref: "Salmos 143:8",
          ara: `Faze-me ouvir, pela manhã, da tua graça, pois em ti confio; mostra-me o caminho por onde devo andar, porque a ti elevo a minha alma.`,
          nvt: `Faze-me ouvir do teu amor a cada manhã, pois confio em ti. Mostra-me por onde devo andar, pois me entrego a ti.`,
        },
      ],
      comentario: `Pedir que Deus firme os passos não é pedir um mapa completo. A oração bíblica pede direção suficiente para o caminho que deve ser percorrido hoje.`,
      oracao: `Senhor, firma meus passos na tua Palavra e mostra-me o caminho de hoje. Dá-me fidelidade para o próximo passo, não ansiedade por todos os passos de uma vez.`,
    },
  },
  {
    id: "semana-2",
    number: "16",
    kicker: "AVANÇO E CONSOLIDAÇÃO",
    title: "Avanço e Consolidação",
    blocks: [
      { type: "lead", text: `Repetir a forma; aumentar a dificuldade apenas quando os dados permitem.` },
      {
        type: "p",
        text: `Esta etapa repete a estrutura e muda apenas um pouco a dificuldade. Um degrau só sobe quando o anterior está manejável o bastante para ser repetido sem transformar o exercício em batalha.`,
      },
      { type: "h", text: "Versão mínima obrigatória" },
      {
        type: "table",
        head: ["Bloco", "Versão mínima"],
        rows: [
          ["Atividade principal", "5 minutos"],
          ["Saída", "2 minutos / parte inicial do degrau"],
          ["Escrita livre", "5 minutos"],
          ["Registro", "3 perguntas: o que aconteceu / o que fiz / o que faço amanhã"],
        ],
      },
      {
        type: "note",
        label: "Não subir automaticamente",
        text: `Se a foto real do prédio continuar alta, repita o prédio parecido. Se a saída mais simples ainda está difícil, não force um degrau sem necessidade.`,
      },
      {
        type: "p",
        text: `Três metas para a semana seguinte: 1) próximo degrau de saída; 2) próximo degrau das pistas do trabalho; 3) uma aproximação humana.`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Zacarias 4:10",
          ara: `Pois quem despreza o dia dos humildes começos, esse alegrar-se-á vendo o prumo na mão de Zorobabel. Aqueles sete olhos são os olhos do SENHOR, que percorrem toda a terra.`,
          nvt: `Não desprezem os começos humildes, pois o SENHOR se alegra ao ver a obra começar, ao ver o prumo na mão de Zorobabel. (As sete lâmpadas representam os olhos do SENHOR, que percorrem toda a terra.)`,
        },
        {
          ref: "Salmos 90:17",
          ara: `Seja sobre nós a graça do Senhor, nosso Deus; confirma sobre nós as obras das nossas mãos, sim, confirma a obra das nossas mãos.`,
          nvt: `Seja sobre nós a bondade do Senhor, nosso Deus; faze prosperar nossos esforços, sim, faze prosperar nossos esforços.`,
        },
      ],
      comentario: `A Escritura não despreza o dia das coisas pequenas. O valor do trabalho não depende de parecer grande aos seus olhos; você pode pedir que Deus confirme uma obra feita em passos modestos.`,
      oracao: `Senhor, livra-me de desprezar pequenos começos. Confirma a obra das minhas mãos e dá-me constância para continuar sem transformar lentidão em fracasso.`,
    },
  },
  {
    id: "revisao",
    number: "17",
    kicker: "REVISÃO",
    title: "Revisar, agradecer, ajustar",
    blocks: [
      { type: "lead", text: `O plano termina; a prática continua em passos proporcionais.` },
      {
        type: "p",
        text: `No domingo, avalie movimento, não apenas humor. A pergunta é: "minha vida ficou um pouco menos governada por evitação, condenação e ameaça presumida?"`,
      },
      {
        type: "fields",
        title: "Perguntas de revisão",
        fields: [
          {
            kind: "textarea",
            id: "rev-evitacao",
            label: "Evitação — Saí mais? Qual degrau ficou mais manejável?",
          },
          {
            kind: "textarea",
            id: "rev-autojulgamento",
            label: "Autojulgamento — Consegui encerrar algum tribunal interno mais cedo?",
          },
          {
            kind: "textarea",
            id: "rev-desconfianca",
            label: "Desconfiança — Em que situação distingui fato de interpretação?",
          },
          {
            kind: "textarea",
            id: "rev-isolamento",
            label: "Isolamento — Fiz alguma aproximação humana real?",
          },
          {
            kind: "textarea",
            id: "rev-competencia",
            label: "Competência — O que fiz que antes imaginei não conseguir?",
          },
          { kind: "textarea", id: "rev-trabalho", label: "Trabalho — Qual pista externa tolero melhor?" },
          {
            kind: "textarea",
            id: "rev-relacionamento",
            label: "Relacionamento — Qual generalização parece menos absoluta?",
          },
          { kind: "textarea", id: "rev-sentido", label: "Sentido — Que coisa boa fiz mesmo sem vontade?" },
        ],
      },
      { type: "h", text: "Fontes essenciais" },
      {
        type: "table",
        head: ["Ref.", "Fonte"],
        rows: [
          [
            "C1",
            "NICE. Depression in adults: treatment and management (NG222), recomendações; revisão de vigilância em 30 jan. 2026.",
          ],
          [
            "C2",
            "NICE. Social anxiety disorder: recognition, assessment and treatment (CG159), revisada em 21 maio 2024.",
          ],
          [
            "C3",
            "VA/DoD. Clinical Practice Guideline for Management of PTSD and Acute Stress Disorder, versão 4.0, 2023.",
          ],
          [
            "C4",
            "U.S. Department of Veterans Affairs, National Center for PTSD: materiais sobre CPT, Prolonged Exposure e Written Exposure Therapy.",
          ],
          ["C5", "International Society of Schema Therapy (ISST). Schema Therapy Central Concepts."],
          [
            "C6",
            "International Society of Schema Therapy (ISST). Coping Styles: surrender, avoidance e overcompensation.",
          ],
          ["C7", `VA National Center for PTSD. PTSD Coach Online: "Be in the Moment" / grounding.`],
          [
            "B1",
            "Almeida Atualizada (AA). Texto bíblico em domínio público conforme edição digital Bible4u; reprodução dos trechos deste guia em AA.",
          ],
          [
            "T1",
            "Confissão de Fé de Westminster; Catecismos Maior e Breve; Confissão Belga; Catecismo de Heidelberg; Cânones de Dort. Usados como limites doutrinários, não como técnica clínica.",
          ],
        ],
      },
      {
        type: "note",
        label: "Nota clínica",
        text: `"Trauma" é usado aqui para descrever experiências vividas como profundamente lesivas; isso não equivale automaticamente a diagnóstico de TEPT. Diagnóstico exige avaliação clínica e critérios próprios.`,
      },
      {
        type: "note",
        label: "Nota bíblica",
        text: `Os comentários são breves e subordinados ao contexto dos textos; não tratam os versículos como fórmulas psicológicas. A Escritura oferece o juízo e a esperança; as técnicas apenas organizam respostas humanas limitadas.`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Salmos 90:12",
          ara: `Ensina-nos a contar os nossos dias, para que alcancemos coração sábio.`,
          nvt: `Ajuda-nos a entender como a vida é breve, para que vivamos com sabedoria.`,
        },
        {
          ref: "Judas 1:24-25",
          ara: `Ora, àquele que é poderoso para vos guardar de tropeços e para vos apresentar com exultação, imaculados diante da sua glória, ao único Deus, nosso Salvador, mediante Jesus Cristo, Senhor nosso, glória, majestade, império e soberania, antes de todas as eras, e agora, e por todos os séculos. Amém!`,
          nvt: `Toda a glória seja àquele que é poderoso para guardá-los de cair e para levá-los, com grande alegria e sem defeito, à sua presença gloriosa. Toda a glória seja àquele que é o único Deus, nosso Salvador por meio de Jesus Cristo, nosso Senhor. Glória, majestade, poder e autoridade lhe pertencem desde antes de todos os tempos, agora e para sempre! Amém.`,
        },
      ],
      comentario: `Contar os dias com sabedoria não é controlá-los. O encerramento aponta para Deus, que é capaz de guardar. Sua perseverança importa, mas a esperança cristã não repousa na perfeição do seu desempenho.`,
      oracao: `Senhor, ensina-me a contar meus dias com sabedoria. Guarda-me de tropeçar, sustenta minha perseverança e recebe toda a glória pelo que fizeres em mim. Amém.`,
    },
  },
]

// IDs of every checkable task (schedule cells + exposure ladders) — used for progress.
export const scheduleTaskIds: string[] = sections.flatMap((s) =>
  s.blocks.flatMap((b) => {
    if (b.type === "schedule") {
      return b.rows.flatMap((r) =>
        r.tasks.map((t, i) => (t === "—" ? null : `${r.id}-${i}`)).filter((x): x is string => x !== null),
      )
    }
    if (b.type === "ladder") {
      return b.rows.map((r) => r.id)
    }
    return []
  }),
)

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

export type GuideTemplate = {
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

export const DEFAULT_GUIDE_TEMPLATE: GuideTemplate = {
  id: "meu-guia-retomada",
  title: "Meu Guia de Retomada",
  description: "Plano pessoal de trabalho com esquemas, exercícios e Escritura",
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-08-13T00:00:00.000Z",
  schemaVersion: 1,
  config: {
    targetAudience: "Pessoas em busca de clareza, constância e reestruturação pessoal",
    category: "Retomada & Esquemas",
  },
  intro,
  sections,
  scheduleTaskIds,
  weeklyPlan: [
    { id: "act-0-1", dayIndex: 0, time: "16:30", description: "Preparar caderno + duas escadas / Ativação 15 min", order: 0, countsTowardCompletion: true },
    { id: "act-0-2", dayIndex: 0, time: "17:00", description: "Saída: degrau 1", order: 1, countsTowardCompletion: true },
    { id: "act-0-3", dayIndex: 0, time: "21:30", description: "Escrita livre 5 min", order: 2, countsTowardCompletion: true },
    { id: "act-1-1", dayIndex: 1, time: "16:30", description: "Trabalho: pista externa nível 1", order: 0, countsTowardCompletion: true },
    { id: "act-1-2", dayIndex: 1, time: "17:00", description: "Repetir saída", order: 1, countsTowardCompletion: true },
    { id: "act-2-1", dayIndex: 2, time: "16:30", description: "Julgamento proporcional", order: 0, countsTowardCompletion: true },
    { id: "act-2-2", dayIndex: 2, time: "21:30", description: "Escrita livre 5 min", order: 1, countsTowardCompletion: true },
    { id: "act-3-1", dayIndex: 3, time: "16:30", description: "Relacionamento: 4 colunas", order: 0, countsTowardCompletion: true },
    { id: "act-3-2", dayIndex: 3, time: "17:00", description: "Saída: mesmo/pequeno avanço", order: 1, countsTowardCompletion: true },
    { id: "act-4-1", dayIndex: 4, time: "16:30", description: "Discriminação de ameaça", order: 0, countsTowardCompletion: true },
    { id: "act-5-1", dayIndex: 5, time: "16:30", description: "Vínculo + competência", order: 0, countsTowardCompletion: true },
    { id: "act-5-2", dayIndex: 5, time: "17:00", description: "Saída", order: 1, countsTowardCompletion: true },
    { id: "act-5-3", dayIndex: 5, time: "21:30", description: "Escrita livre 5 min", order: 2, countsTowardCompletion: true },
    { id: "act-6-1", dayIndex: 6, time: "16:30", description: "Revisão semanal 30 min", order: 0, countsTowardCompletion: true },
  ],
  quickSheets: [
    { id: "qs-esquemas", title: "Ficha de Esquemas", summary: "Identificação rápida de esquemas ativados e evitação." },
    { id: "qs-ativacao", title: "Ativação Comportamental", summary: "Passos graduais de 15 minutos para sair da paralisia." },
  ],
  theologyEnabled: true,
  completionConfig: {
    enabled: true,
    reviewTitle: "Veredito e Análise da Semana de Retomada",
    analysisDimensions: [
      "Adesão às atividades planejadas no cronograma semanal",
      "Identificação e manejo de esquemas e padrões de evitação",
      "Percepções e sentimentos registrados nas caixas de reflexão",
      "Constância nas rotinas matinais e noturnas"
    ],
    nextWeekFocusRules: [
      "Ajustes graduais e sustentáveis para a rotina semanal",
      "Reforçar práticas que trouxeram clareza e redução da ansiedade"
    ],
    theologyReviewEnabled: true,
  },
}

export const GUIDE_TEMPLATES: GuideTemplate[] = [DEFAULT_GUIDE_TEMPLATE]


