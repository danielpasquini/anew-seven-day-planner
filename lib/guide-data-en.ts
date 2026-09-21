import type { Section, GuideTemplate } from "./guide-data"

export const introEn = {
  title: `Recovery Guide`,
  subtitle: `To restart with clarity, consistency, and hope`,
  oracao: `Lord, grant me light to discern, courage to act, humility to learn, and perseverance to continue. Guard my heart from despair and guide my steps in truth. Amen.`,
  salmo: {
    ref: `Psalm 27:13-14`,
    ara: `Eu creio que verei a bondade do SENHOR na terra dos viventes. Espera pelo SENHOR, tem bom ânimo, e fortifique-se o teu coração; espera, pois, pelo SENHOR.`,
    nvt: `Ainda assim, confio que verei a bondade do SENHOR enquanto estiver aqui, na terra dos vivos. Espere pelo SENHOR e seja valente e corajoso; sim, espere pelo SENHOR.`,
    kjv: `I had fainted, unless I had believed to see the goodness of the LORD in the land of the living. Wait on the LORD: be of good courage, and he shall strengthen thine heart: wait, I say, on the LORD.`,
    niv: `I remain confident of this: I will see the goodness of the LORD in the land of the living. Wait for the LORD; be strong and take heart and wait for the LORD.`,
  },
}

export const sectionsEn: Section[] = [
  {
    id: "fundamento",
    number: "01",
    kicker: "FOUNDATION",
    title: "How this guide views change",
    blocks: [
      { type: "lead", text: `Psychology as an instrument; Scripture and doctrine as the norm.` },
      {
        type: "p",
        text: `Psychology can describe habits, avoidance, memory, cognition, affect, and relationships. It does not possess authority to define sin, human worth, the purpose of life, or ultimate hope.`,
      },
      {
        type: "note",
        label: "How to use",
        text: `Use this guide in independent 7-day cycles. Focus on the active week and do not try to accomplish everything at once. The goal is regularity, not intensity.`,
      },
      { type: "h", text: "Hierarchy of authorities" },
      {
        type: "table",
        head: ["Level", "Function in this guide"],
        rows: [
          ["Scripture", "Governs anthropology, moral judgment, and telos."],
          ["Reformed confessions", "Delineate Christian doctrine applied in daily life."],
          ["Clinical psychology", "Describes mechanisms and offers bounded techniques."],
          ["Personal experience", "Provides real data, but cannot infallibly interpret itself."],
        ],
      },
      { type: "h", text: "Four practical rules" },
      {
        type: "list",
        items: [
          `Feelings are real experiential data, but not automatically facts about the world.`,
          `A schema is an interpretive and protective pattern; it is not identity.`,
          `Suffering, illness, and limitation must not be automatically converted into moral guilt.`,
          `The past informs the present, but receives no authority to decree the future.`,
        ],
      },
      {
        type: "p",
        text: `The goal is not to "feel good" at all costs, but to better perceive reality, evaluate with proportionality, and act toward what is true and good.`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Psalm 139:23-24",
          ara: `Sonda-me, ó Deus, e conhece o meu coração, prova-me e conhece os meus pensamentos; vê se há em mim algum caminho mau e guia-me pelo caminho eterno.`,
          nvt: `Examina-me, ó Deus, e conhece meu coração; prova-me e vê meus pensamentos. Mostra-me se há em mim algo que te ofende e conduze-me pelo caminho eterno.`,
          kjv: `Search me, O God, and know my heart: try me, and know my thoughts: And see if there be any wicked way in me, and lead me in the way everlasting.`,
          niv: `Search me, God, and know my heart; test me and know my anxious thoughts. See if there is any offensive way in me, and lead me in the way everlasting.`,
        },
        {
          ref: "Proverbs 4:23",
          ara: `Sobre tudo o que se deve guardar, guarda o coração, porque dele procedem as fontes da vida.`,
          nvt: `Acima de todas as coisas, guarde seu coração, pois ele dirige o rumo de sua vida.`,
          kjv: `Keep thy heart with all diligence; for out of it are the issues of life.`,
          niv: `Above all else, guard your heart, for everything you do flows from it.`,
        },
      ],
      comentario: `The heart needs to be known and guarded, but not through autonomous introspection. The prayer asks God to search, show, and lead; self-care remains under revealed truth.`,
      oracao: `Search me, O God. Show what is true in me, correct what is crooked, and guard my heart in the way everlasting.`,
    },
  },
  {
    id: "mapa",
    number: "02",
    kicker: "SCHEMA MAP",
    title: "Schemas and three core axes",
    blocks: [
      { type: "lead", text: `Schema formulation serves as a map, not an identity.` },
      {
        type: "p",
        text: `The formulation established with a Schema Therapy specialist provides a concrete map, avoiding turning the guide into an endless hunt for "which schema do I have."`,
      },
      {
        type: "table",
        head: ["Level", "Identified schemas"],
        rows: [
          [
            "Primary",
            "Insufficient self-control/self-discipline • Mistrust/abuse • Social isolation/alienation • Defectiveness/shame",
          ],
          ["Secondary", "Failure • Dependence/incompetence • Punitiveness"],
        ],
      },
      { type: "h", text: "Three daily axes to recognize" },
      {
        type: "list",
        items: [
          `A. Me against myself. Defectiveness/shame + Punitiveness + Failure. Social anxiety is often less about "what they will think" and more about "how harshly I will condemn myself afterward."`,
          `B. The other against me. Mistrust/abuse. The mind scans for the next perceived injustice or attack. The target is evidence-based discernment, not indiscriminate trust.`,
          `C. Me separated from others. Social isolation/alienation. Withdrawal protects in the short term while sustaining loneliness and non-belonging.`,
        ],
      },
      { type: "h", text: "Coping: what to observe" },
      {
        type: "p",
        text: `In Schema Therapy, three coping responses appear frequently: surrender, avoidance, and overcompensation. All three may offer short-term relief while perpetuating the maladaptive pattern long-term.`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Jeremiah 17:9-10",
          ara: `Enganoso é o coração, mais do que todas as coisas, e desesperadamente corrupto; quem o conhecerá? Eu, o SENHOR, esquadrinho o coração, eu provo os pensamentos; e isto para dar a cada um segundo o seu proceder, segundo o fruto das suas ações.`,
          nvt: `O coração humano é mais enganoso que qualquer coisa e é extremamente perverso; quem sabe, de fato, o quanto é mau? Eu, o SENHOR, examino o coração e provo os pensamentos. Dou a cada pessoa a devida recompensa, de acordo com suas ações.`,
          kjv: `The heart is deceitful above all things, and desperately wicked: who can know it? I the LORD search the heart, I try the reins, even to give every man according to his ways, and according to the fruit of his doings.`,
          niv: `The heart is deceitful above all things and beyond cure. Who can understand it? 'I the LORD search the heart and examine the mind, to reward each person according to their conduct, according to what their deeds deserve.'`,
        },
        {
          ref: "Hebrews 4:12",
          ara: `Porque a palavra de Deus é viva, e eficaz, e mais cortante do que qualquer espada de dois gumes, e penetra até ao ponto de dividir alma e espírito, juntas e medulas, e é apta para discernir os pensamentos e propósitos do coração.`,
          nvt: `Pois a palavra de Deus é viva e poderosa. É mais cortante que qualquer espada de dois gumes, penetrando entre a alma e o espírito, entre a junta e a medula, e trazendo à luz até os pensamentos e desejos mais íntimos.`,
          kjv: `For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart.`,
          niv: `For the word of God is alive and active. Sharper than any double-edged sword, it penetrates even to dividing soul and spirit, joints and marrow; it judges the thoughts and attitudes of the heart.`,
        },
      ],
      comentario: `Scripture does not romanticize self-perception: the heart can deceive, and God knows what we cannot discern on our own. This prevents both naive self-confidence and autonomous self-condemnation.`,
      oracao: `Lord, discern my thoughts and intentions. Deliver me from self-deception and from accusations that do not align with your truth.`,
    },
  },
  {
    id: "limites",
    number: "03",
    kicker: "BOUNDARIES",
    title: "What to do alone — and what not to do",
    blocks: [
      { type: "lead", text: `Safety before depth.` },
      {
        type: "p",
        text: `When working autonomously, the priority is low-risk techniques that enhance functioning and reality discrimination. Deep trauma reprocessing remains outside self-application for now.`,
      },
      { type: "h", text: "Safe to do alone now" },
      {
        type: "list",
        items: [
          `Behavioral activation and the physical first step.`,
          `Graded exposure to leave the house and reduce daily avoidance.`,
          `Proportional judgment, threat discrimination, and schema tracking.`,
          `Grounding, expressive writing, competence training, and relational contact.`,
        ],
      },
      { type: "h", text: "Do not attempt alone this week" },
      {
        type: "list",
        items: [
          `Improvised EMDR or bilateral stimulation aimed at reprocessing memories.`,
          `Deliberate and detailed imaginal reliving of highly traumatic episodes.`,
          `Unassisted written trauma narratives or repeated detailed exposure.`,
          `Forcing exposure to endurance limits when the exercise causes acute disorganization.`,
        ],
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Proverbs 14:15",
          ara: `O simples dá crédito a toda palavra, mas o prudente atenta para os seus passos.`,
          nvt: `O ingênuo acredita em tudo que ouve; o prudente examina seus passos com cuidado.`,
          kjv: `The simple believeth every word: but the prudent man looketh well to his going.`,
          niv: `The simple believe anything, but the prudent give thought to their steps.`,
        },
        {
          ref: "Romans 12:3",
          ara: `Porque, pela graça que me foi dada, digo a cada um dentre vós que não pense de si mesmo além do que convém; antes, pense com moderação, segundo a medida da fé que Deus repartiu a cada um.`,
          nvt: `Com base no privilégio e na autoridade que me foram dados, dou a cada um de vocês este aviso: não se considerem melhores do que realmente são. Sejam honestos em sua autoavaliação, medindo-se de acordo com a fé que Deus nos deu.`,
          kjv: `For I say, through the grace given unto me, to every man that is among you, not to think of himself more highly than he ought to think; but to think soberly, according as God hath dealt to every man the measure of faith.`,
          niv: `For by the grace given me I say to every one of you: Do not think of yourself more highly than you ought, but rather think of yourself with sober judgment, in accordance with the faith God has distributed to each of you.`,
        },
      ],
      comentario: `Prudence is not cowardice; it is sober evaluation of limits. Recognizing what can be done now honors the reality of the present stage.`,
      oracao: `Give me sobriety to recognize my limits without hiding behind false excuses, and courage to take the steps that are within my reach today.`,
    },
  },
  {
    id: "ativacao",
    number: "04",
    kicker: "ACTIVATION",
    title: "Behavioral activation: movement before mood",
    blocks: [
      { type: "lead", text: `Action produces mood, not the reverse.` },
      {
        type: "p",
        text: `The primary practical priority is preventing life from continuing to contract while waiting for motivation to appear. Behavioral activation directly targets the loop between withdrawal, activity, and mood.`,
      },
      { type: "h", text: "Physical first step rule" },
      {
        type: "p",
        text: `Do not write "I will walk". Write "16:30: put on sneakers". Do not write "resolve backlog". Write "open the document and work for five minutes". The unit of success is initiating the agreed action.`,
      },
      {
        type: "table",
        head: ["Type", "Example", "Criterion"],
        rows: [
          ["Maintenance", "Shower, tidy up, answer email", "Keeps daily life functioning"],
          ["Competence", "Complete one stage without immediate help", "Builds mastery evidence"],
          ["Approach", "Go out, talk, visit a place", "Reduces avoidance and isolation"],
        ],
      },
      {
        type: "fields",
        title: "60-second record",
        fields: [
          { kind: "static", text: "Before" },
          { kind: "scale", id: "acao-vontade", label: "Desire to act" },
          { kind: "scale", id: "acao-desconforto-prev", label: "Predicted discomfort" },
          { kind: "static", text: "After" },
          { kind: "text", id: "acao-fiz", label: "Did I complete the step? (yes / no)" },
          { kind: "scale", id: "acao-desconforto-pos", label: "Discomfort (after)" },
          { kind: "textarea", id: "acao-aprendi", label: "What I learned in one sentence" },
        ],
      },
      {
        type: "note",
        label: "Minimum version for difficult days",
        text: `Main block = 5 minutes; Outing = 2 minutes; Record = "What happened / What I did / What I do tomorrow".`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "1 Thessalonians 4:11-12",
          ara: `e a diligenciardes por viver tranqüilamente, cuidar do que é vosso e trabalhar com as próprias mãos, como vos ordenamos; de modo que vos porteis com dignidade para com os de fora e de nada venhais a precisar.`,
          nvt: `Tenham como objetivo viver em paz, cuidar dos seus próprios assuntos e trabalhar com as próprias mãos, como antes os instruímos. Assim, as pessoas que não são cristãs respeitarão a maneira como vocês vivem, e vocês não precisarão depender dos outros.`,
          kjv: `And that ye study to be quiet, and to do your own business, and to work with your own hands, as we commanded you; That ye may walk honestly toward them that are without, and that ye may have lack of nothing.`,
          niv: `and to make it your ambition to lead a quiet life: You should mind your own business and work with your hands, just as we told you, so that your daily life may win the respect of outsiders and so that you will not be dependent on anybody.`,
        },
        {
          ref: "Proverbs 6:6-8",
          ara: `Vai ter com a formiga, ó preguiçoso, considera os seus caminhos e sê sábio. Não tendo ela chefe, nem oficial, nem comandante, no estio, prepara o seu pão, na sega, ajunta o seu mantimento.`,
          nvt: `Observe a formiga, preguiçoso! Reflita nos caminhos dela e seja sábio! Ela não tem chefe, nem líder, nem governador, mas no verão ajunta suas provisões e na época da colheita armazena alimento.`,
          kjv: `Go to the ant, thou sluggard; consider her ways, and be wise: Which having no guide, overseer, or ruler, Provideth her meat in the summer, and gathereth her food in the harvest.`,
          niv: `Go to the ant, you sluggard; consider its ways and be wise! It has no commander, no overseer or ruler, yet it stores its provisions in summer and gathers its food at harvest.`,
        },
      ],
      comentario: `Christian action does not spring from absolute autonomy: God works both to will and to act. Small, faithful steps can be repeated without waiting for perfect mood.`,
      oracao: `Lord, grant me consistency to do good without depending on feeling ready.`,
    },
  },
  {
    id: "evitacao",
    number: "05",
    kicker: "AVOIDANCE",
    title: "Leaving the house: graded exposure",
    blocks: [
      { type: "lead", text: `Small, repeated, and observable approach steps.` },
      {
        type: "p",
        text: `The goal is not to eliminate all anxiety, but to recover freedom of movement and unlearn the belief that one can only cope through avoidance.`,
      },
      {
        type: "ladder",
        id: "ladder-saida",
        head: ["Suggested initial step", "Predicted score", "Done"],
        rows: [
          { id: "saida-1", label: "Stand outside for 5 min" },
          { id: "saida-2", label: "Walk to the end of the street" },
          { id: "saida-3", label: "Walk one block" },
          { id: "saida-4", label: "Walk for 10 min" },
          { id: "saida-5", label: "Step inside a shop briefly" },
          { id: "saida-6", label: "Complete a simple errand alone outside" },
        ],
      },
      { type: "h", text: "How to execute" },
      {
        type: "list",
        items: [
          `Start with a step that feels uncomfortable but clearly achievable (typically 3–5/10).`,
          `Repeat the same step more than once before advancing.`,
          `The criterion for success is remaining and finishing the agreed task, not reaching zero anxiety.`,
          `Record afterward: "What did I expect to happen?" and "What actually happened?".`,
        ],
      },
    ],
    scripture: {
      verses: [
        {
          ref: "2 Timothy 1:7",
          ara: `Porque Deus não nos tem dado espírito de covardia, mas de poder, de amor e de moderação.`,
          nvt: `Pois Deus não nos deu um espírito de covardia, mas de poder, de amor e de bom senso.`,
          kjv: `For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.`,
          niv: `For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.`,
        },
        {
          ref: "Psalm 56:3-4",
          ara: `Em me vindo o temor, hei de confiar em ti. Em Deus, cuja palavra eu louvo, em Deus ponho a minha confiança e nada temerei. Que me pode fazer um simples mortal?`,
          nvt: `Quando eu tiver medo, confiarei em ti. Louvo a Deus pelo que prometeu; confio em Deus e não tenho medo. Que podem meros mortais fazer contra mim?`,
          kjv: `What time I am afraid, I will trust in thee. In God I will praise his word, in God I have put my trust; I will not fear what flesh can do unto me.`,
          niv: `When I am afraid, I put my trust in you. In God, whose word I praise—in God I trust and am not afraid. What can mere mortals do to me?`,
        },
      ],
      comentario: `The presence of fear does not mean abandonment. Biblical trust shifts the weight from fear to the presence and faithfulness of God.`,
      oracao: `Lord, when I am afraid, teach me to trust in you and take the next step with courage.`,
    },
  },
  {
    id: "autojulgamento",
    number: "06",
    kicker: "SELF-JUDGMENT",
    title: "Defectiveness/shame + Punitiveness",
    blocks: [
      {
        type: "lead",
        text: `Truth and proportion instead of artificial acquittal or endless condemnation.`,
      },
      {
        type: "p",
        text: `The core loop is: situation → retrospective rumination → "did I do something defective?" → self-condemnation → more avoidance. This exercise separates conduct, severity, and identity.`,
      },
      { type: "h", text: "Proportional judgment" },
      {
        type: "fields",
        fields: [
          { kind: "textarea", id: "julg-1", label: "1. What objectively occurred?" },
          { kind: "textarea", id: "julg-2", label: "2. What exactly am I accusing myself of?" },
          {
            kind: "textarea",
            id: "julg-3",
            label: "3. Was it wrong, imperfect, embarrassing, or just different from ideal?",
          },
          { kind: "scale", id: "julg-4", label: "4. Objective severity from 0–10?" },
          { kind: "textarea", id: "julg-5", label: "5. Would I rate someone else identically?" },
          { kind: "textarea", id: "julg-6", label: "6. Is there anything concrete to repair?" },
          { kind: "textarea", id: "julg-7", label: "7. Am I correcting something or merely punishing myself?" },
        ],
      },
      {
        type: "fields",
        note: `"If there is something to repair, I will do what is proportional. If not, I will not reopen the trial just to keep suffering."`,
        fields: [{ kind: "textarea", id: "julg-sentenca", label: "Closing statement" }],
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Proverbs 18:17",
          ara: `O primeiro que pleiteia a sua causa parece justo, até que vem o outro e o examina.`,
          nvt: `O primeiro a apresentar sua causa parece ter razão, até que outro se apresenta e o questiona.`,
          kjv: `He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.`,
          niv: `In a lawsuit the first to speak seems right, until someone comes forward and cross-examines.`,
        },
        {
          ref: "Philippians 4:8",
          ara: `Finalmente, irmãos, tudo o que é verdadeiro, tudo o que é respeitável, tudo o que é justo, tudo o que é puro, tudo o que é amável, tudo o que é de boa fama, se alguma virtude há e se algum louvor há, seja isso o que ocupe o vosso pensamento.`,
          nvt: `Por fim, irmãos, quero lhes dizer mais uma coisa. Concentrem-se em tudo que é verdadeiro, tudo que é nobre, tudo que é correto, tudo que é puro, tudo que é amável e tudo que é admirável. Pensem no que é excelente e digno de louvor.`,
          kjv: `Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.`,
          niv: `Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirable—if anything is excellent or praiseworthy—think about such things.`,
        },
      ],
      comentario: `The heart can over-condemn, but it is not the supreme court. True judgment brings repentance when there is fault, and peace when there is nothing more to punish.`,
      oracao: `Lord, when my heart accuses me, guide me into true judgment. Grant me repentance without despair.`,
    },
  },
  {
    id: "desconfianca",
    number: "07",
    kicker: "MISTRUST",
    title: `"Someone is ready to attack me"`,
    blocks: [
      { type: "lead", text: `Neither naivety nor verdict before the facts.` },
      {
        type: "p",
        text: `The belief that someone is always ready to exploit or hurt points to Mistrust/abuse schema activation. The target is discriminative trust, not indiscriminate openness.`,
      },
      { type: "h", text: "Threat discrimination" },
      {
        type: "fields",
        fields: [
          { kind: "textarea", id: "desc-fato", label: "Observed fact: what actually happened?" },
          { kind: "textarea", id: "desc-interp", label: "Interpretation: what did I conclude?" },
          { kind: "textarea", id: "desc-prev", label: "Prediction: what do I think they intend to do?" },
          { kind: "textarea", id: "desc-favor", label: "Concrete evidence in favor" },
          { kind: "textarea", id: "desc-contra", label: "Concrete evidence against" },
          { kind: "textarea", id: "desc-alt", label: "Two alternative explanations (1 and 2)" },
          {
            kind: "textarea",
            id: "desc-protecao",
            label: "Proportional protection: act, observe, or take no action?",
          },
          { kind: "text", id: "desc-confianca", label: "Provisional trust in person: ___/100" },
        ],
      },
    ],
    scripture: {
      verses: [
        {
          ref: "James 3:17-18",
          ara: `A sabedoria, porém, lá do alto é, primeiramente, pura; depois, pacífica, indulgente, tratável, plena de misericórdia e de bons frutos, imparcial, sem fingimento. Ora, é em paz que se semeia o fruto da justiça, para os que promovem a paz.`,
          nvt: `Mas a sabedoria que vem do alto é, antes de tudo, pura. Também é pacífica, amável e compreensiva. É cheia de misericórdia e de bons frutos, não mostra favoritismo e é sempre sincera. E aqueles que são pacificadores semearão sementes de paz e ajuntarão uma colheita de justiça.`,
          kjv: `But the wisdom that is from above is first pure, then peaceable, gentle, and easy to be intreated, full of mercy and good fruits, without partiality, and without hypocrisy. And the fruit of righteousness is sown in peace of them that make peace.`,
          niv: `But the wisdom that comes from heaven is first of all pure; then peace-loving, considerate, submissive, full of mercy and good fruit, impartial and sincere. Peacemakers who sow in peace reap a harvest of righteousness.`,
        },
        {
          ref: "Romans 12:18",
          ara: `Se possível, quanto depender de vós, tende paz com todos os homens.`,
          nvt: `Façam todo o possível para viver em paz com todos.`,
          kjv: `If it be possible, as much as lieth in you, live peaceably with all men.`,
          niv: `If it is possible, as far as it depends on you, live at peace with everyone.`,
        },
      ],
      comentario: `Biblical prudence evaluates real danger while avoiding paranoid hostility. Discernment is distinct from assuming ill will in advance.`,
      oracao: `Grant me prudence without paranoia, and courage without naivety.`,
    },
  },
  {
    id: "vinculo",
    number: "08",
    kicker: "ATTACHMENT",
    title: "Isolation without naivety",
    blocks: [
      { type: "lead", text: `Moving closer without surrendering discernment.` },
      {
        type: "p",
        text: `Social isolation/alienation does not require becoming an extrovert. The target is reducing the rule that emotional distance is always the safest response.`,
      },
      {
        type: "fields",
        title: "Attachment record",
        fields: [
          { kind: "textarea", id: "vinc-esperava", label: "Before I expected:" },
          { kind: "textarea", id: "vinc-aconteceu", label: "What actually happened:" },
          { kind: "textarea", id: "vinc-julguei", label: "How I judged myself afterward:" },
          {
            kind: "textarea",
            id: "vinc-confianca",
            label: "Did their response increase, maintain, or reduce earned trust?",
          },
        ],
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Psalm 112:7-8",
          ara: `Não se atemoriza de más notícias; o seu coração é firme, confiante no SENHOR. O seu coração, bem assestado, não teme, até que veja cumprido o seu desejo sobre os adversários.`,
          nvt: `Não temem más notícias; confiam plenamente no SENHOR para protegê-los. Estão seguros e não têm medo; sabem que seus inimigos serão derrotados.`,
          kjv: `He shall not be afraid of evil tidings: his heart is fixed, trusting in the LORD. His heart is established, he shall not be afraid, until he see his desire upon his enemies.`,
          niv: `They will have no fear of bad news; their hearts are steadfast, trusting in the LORD. Their hearts are secure, they will have no fear; in the end they will look in triumph on their foes.",`,
        },
        {
          ref: "1 John 4:18",
          ara: `No amor não existe medo; antes, o perfeito amor lança fora o medo. Ora, o medo produz tormento; logo, aquele que teme não é aperfeiçoado no amor.`,
          nvt: `No amor não há medo; ao contrário, o perfeito amor expulsa o medo, porque o medo supõe castigo. Aquele que teme não está aperfeiçoado no amor.`,
          kjv: `There is no fear in love; but perfect love casteth out fear: because fear hath torment. He that feareth is not made perfect in love.`,
          niv: `There is no fear in love. But perfect love drives out fear, because fear has to do with punishment. The one who fears is not made perfect in love.`,
        },
      ],
      comentario: `Christian community is not built on blind trust in human perfection, but on mutual fellowship in Christ.`,
      oracao: `Lord, deliver me from transforming healthy boundaries into self-imposed isolation.`,
    },
  },
  {
    id: "competencia",
    number: "09",
    kicker: "COMPETENCE",
    title: "Gradual mastery + expressive writing",
    blocks: [
      {
        type: "lead",
        text: `Producing concrete evidence of mastery; capturing thoughts without obeying them.`,
      },
      {
        type: "fields",
        title: "Competence practice",
        fields: [
          { kind: "text", id: "comp-antes", label: "Before: estimated chance of managing alone (%)" },
          { kind: "textarea", id: "comp-tarefa", label: "Task:" },
          { kind: "textarea", id: "comp-passo", label: "Physical first step:" },
          { kind: "text", id: "comp-depois", label: "After: completed approx ___% without help" },
        ],
      },
      {
        type: "fields",
        title: "5-minute expressive writing",
        fields: [{ kind: "textarea", id: "comp-escrita", label: "Today's expressive writing" }],
      },
    ],
    scripture: {
      verses: [
        {
          ref: "1 Corinthians 13:4-7",
          ara: `O amor é paciente, é benigno; o amor não arde em ciúmes, não se ufana, não se ensoberbece, não se conduz inconvenientemente, não procura os seus interesses, não se exaspera, não se ressente do mal; não se alegra com a injustiça, mas regozija-se com a verdade; tudo sofre, tudo crê, tudo espera, tudo suporta.`,
          nvt: `O amor é paciente e bondoso. O amor não é ciumento, nem presunçoso, nem orgulhoso, nem grosseiro. Não exige que as coisas sejam feitas à sua maneira. Não é irritadiço, nem guarda rancor. Não se alegra com a injustiça, mas sim com a verdade. O amor nunca desiste, nunca perde a fé, sempre tem esperança e sempre se mantém firme.`,
          kjv: `Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up, Doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil; Rejoiceth not in iniquity, but rejoiceth in the truth; Beareth all things, believeth all things, hopeth all things, endureth all things.`,
          niv: `Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs. Love does not delight in evil but rejoices with the truth. It always protects, always trusts, always hopes, always perseveres.`,
        },
        {
          ref: "Romans 12:9-10",
          ara: `O amor seja sem hipocrisia. Detestai o mal, apegando-vos ao bem. Amai-vos cordialmente uns aos outros com amor fraternal, preferindo-vos em honra uns aos outros.`,
          nvt: `O amor não deve ser fingido. Odeiem o que é mau; apeguem-se firmemente ao que é bom. Amem-se com amor fraternal e tenham prazer em honrar uns aos outros.`,
          kjv: `Let love be without dissimulation. Abhor that which is evil; cleave to that which is good. Be kindly affectioned one to another with brotherly love; in honour preferring one another;`,
          niv: `Love must be sincere. Hate what is evil; cling to what is good. Be devoted to one another in love. Honor one another above yourselves.`,
        },
      ],
      comentario: `Mastery and patience develop over time. Love and discipline sustain daily perseverance.`,
      oracao: `Teach me diligence and deliver me from tying my worth solely to immediate performance.`,
    },
  },
  {
    id: "trabalho-1",
    number: "10",
    kicker: "WORK I",
    title: "External cues, not reliving",
    blocks: [
      { type: "lead", text: `The image is a reminder; it is not the event occurring again.` },
      {
        type: "ladder",
        id: "ladder-pistas",
        head: ["Cue", "Predicted score", "Completed"],
        rows: [
          { id: "pista-1", label: "Generic corporate building" },
          { id: "pista-2", label: "Slightly similar building" },
          { id: "pista-3", label: "Very similar building" },
          { id: "pista-4", label: "Small/distant photo of real building" },
          { id: "pista-5", label: "Standard photo of real building" },
        ],
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Colossians 3:23-24",
          ara: `Tudo quanto fizerdes, fazei-o de todo o coração, como para o Senhor e não para homens, cientes de que recebereis do Senhor a recompensa da herança. A Cristo, o Senhor, é que estais servindo.`,
          nvt: `Trabalhem de boa vontade em tudo que fizerem, como se trabalhassem para o Senhor, e não para pessoas. Lembrem-se de que o Senhor lhes dará uma herança como recompensa e de que o Senhor a quem vocês servem é Cristo.`,
          kjv: `And whatsoever ye do, do it heartily, as to the Lord, and not unto men; Knowing that of the Lord ye shall receive the reward of the inheritance: for ye serve the Lord Christ.`,
          niv: `Whatever you do, work at it with all your heart, as working for the Lord, not for human masters, since you know that you will receive an inheritance from the Lord as a reward. It is the Lord Christ you are serving.`,
        },
        {
          ref: "Proverbs 22:29",
          ara: `Vês a um homem perito na sua obra? Perante reis será posto; não entre a plebe.`,
          nvt: `Você já viu alguém competente no que faz? Essa pessoa servirá diante de reis, e não de gente qualquer.`,
          kjv: `Seest thou a man diligent in his business? he shall stand before kings; he shall not stand before mean men.`,
          niv: `Do you see someone skilled in their work? They will serve before kings; they will not serve before officials of low rank.`,
        },
      ],
      comentario: `Work is performed before God. Distinguishing past trauma from present vocation brings clarity.`,
      oracao: `Strengthen my hands for honest work, delivered from crippling fear of the past.`,
    },
  },
  {
    id: "trabalho-2",
    number: "11",
    kicker: "WORK II",
    title: "Grounding and exposure tracking",
    blocks: [
      { type: "lead", text: `Approaching without becoming overwhelmed.` },
      {
        type: "fields",
        title: "Short exposure session",
        fields: [
          { kind: "scale", id: "expo-inicial", label: "Initial intensity" },
          { kind: "scale", id: "expo-max", label: "Peak intensity" },
          { kind: "scale", id: "expo-final", label: "Final intensity" },
          {
            kind: "textarea",
            id: "expo-frase",
            label: `Summary sentence: "My nervous system anticipated ___; what actually occurred was ___."`,
          },
        ],
      },
    ],
    scripture: {
      verses: [
        {
          ref: "1 Kings 19:5-8",
          ara: `Deitou-se e dormiu debaixo do zimbro; eis que um anjo o tocou e lhe disse: Levanta-te e come. Olhou ele e viu, junto à cabeceira, um pão cozido sobre pedras em brasa e uma botija de água. Comeu, bebeu e tornou a dormir. Voltou segunda vez o anjo do SENHOR, tocou-o e lhe disse: Levanta-te e come, porque o caminho te será sobremodo longo. Levantou-se, pois, comeu e bebeu; e, com a força daquela comida, caminhou quarenta dias e quarenta noites até Horebe, o monte de Deus.`,
          nvt: `Ele se deitou debaixo da árvore e dormiu. De repente, um anjo o tocou e disse: 'Levante-se e coma!'. Elias olhou ao redor e viu, perto de sua cabeça, um pão assado sobre pedras quentes e uma jarra de água. Ele comeu, bebeu e voltou a dormir. O anjo do SENHOR voltou, tocou-o e disse: 'Levante-se e coma mais um pouco, senão você não aguentará a viagem'. Ele se levantou, comeu e bebeu, e o alimento lhe deu forças para uma caminhada de quarenta dias e quarenta noites até o Horebe, o monte de Deus.`,
          kjv: `And as he lay and slept under a juniper tree, behold, then an angel touched him, and said unto him, Arise and eat. And he looked, and, behold, there was a cake baken on the coals, and a cruse of water at his head. And he did eat and drink, and laid him down again. And the angel of the LORD came again the second time, and touched him, and said, Arise and eat; because the journey is too great for thee. And he arose, and did eat and drink, and went in the strength of that meat forty days and forty nights unto Horeb the mount of God.`,
          niv: `Then he lay down under the bush and fell asleep. All at once an angel touched him and said, 'Get up and eat.' He looked around, and there by his head was some bread baked over hot coals, and a jar of water. He ate and drank and then lay down again. The angel of the LORD came back a second time and touched him and said, 'Get up and eat, for the journey is too much for you.' So he got up and ate and drank. Strengthened by that food, he traveled forty days and forty nights until he reached Horeb, the mountain of God.`,
        },
        {
          ref: "Psalm 127:2",
          ara: `Inútil vos será levantar de madrugada, repousar tarde, comer o pão que penosamente granjeastes; aos seus amados ele o dá enquanto dormem.`,
          nvt: `É inútil acordar cedo e ir dormir tarde, trabalhando arduamente para conseguir o que comer; pois Deus provê para aqueles a quem ama enquanto eles dormem.`,
          kjv: `It is vain for you to rise up early, to sit up late, to eat the bread of sorrows: for so he giveth his beloved sleep.`,
          niv: `In vain you rise early and stay up late, toiling for food to eat—for he grants sleep to those he loves.`,
        },
      ],
      comentario: `God sustains weary souls with practical nourishment, rest, and steadfast peace.`,
      oracao: `Grant me quietness of heart and steadfast peace in your sovereign care.`,
    },
  },
  {
    id: "relacionamento-1",
    number: "12",
    kicker: "RELATIONSHIPS I",
    title: "Facts, rules, identity, and future",
    blocks: [
      { type: "lead", text: `Naming the past without granting it prophetic power.` },
      {
        type: "fields",
        title: "Relational record",
        fields: [
          { kind: "textarea", id: "rel-fato", label: "Observed fact" },
          { kind: "textarea", id: "rel-regra", label: "Learned rule" },
          { kind: "textarea", id: "rel-conclusao", label: "Conclusion about self" },
          { kind: "textarea", id: "rel-previsao", label: "Prediction about the future" },
        ],
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Ephesians 4:31-32",
          ara: `Longe de vós, toda amargura, e cólera, e ira, e gritaria, e blasfêmias, e bem assim toda malícia. Antes, sede uns para com os outros benignos, compassivos, perdoando-vos uns aos outros, como também Deus, em Cristo, vos perdoou.`,
          nvt: `Livrem-se de toda amargura, indignação, ira, gritaria e calúnia, bem como de toda maldade. Em vez disso, sejam bondosos e tenham compaixão uns dos outros, perdoando-se mutuamente, assim como Deus os perdoou em Cristo.`,
          kjv: `Let all bitterness, and wrath, and anger, and clamour, and evil speaking, be put away from you, with all malice: And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you.`,
          niv: `Get rid of all bitterness, rage and anger, brawling and slander, along with every form of malice. Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.`,
        },
        {
          ref: "Romans 12:19-21",
          ara: `Não vos vingueis a vós mesmos, amados, mas dai lugar à ira; porque está escrito: A mim me pertence a vingança; eu é que retribuirei, diz o Senhor. Pelo contrário, se o teu inimigo tiver fome, dá-lhe de comer; se tiver sede, dá-lhe de beber; porque, fazendo isto, amontoarás brasas vivas sobre a sua cabeça. Não te deixes vencer do mal, mas vence o mal com o bem.`,
          nvt: `Amados, nunca se vinguem; deixem isso com Deus. Pois dizem as Escrituras: 'A vingança pertence a mim; eu lhes darei o troco, diz o SENHOR'. Pelo contrário: 'Se seu inimigo tiver fome, dê-lhe de comer; se tiver sede, dê-lhe de beber. Ao fazer isso, você amontoará brasas vivas sobre a cabeça dele'. Não se deixem vencer pelo mal, mas vençam o mal com o bem.`,
          kjv: `Dearly beloved, avenge not yourselves, but rather give place unto wrath: for it is written, Vengeance is mine; I will repay, saith the Lord. Therefore if thine enemy hunger, feed him; if he thirst, give him drink: for in so doing thou shalt heap coals of fire on his head. Be not overcome of evil, but overcome evil with good.`,
          niv: `Do not take revenge, my dear friends, but leave room for God's wrath, for it is written: 'It is mine to avenge; I will repay,' says the Lord. On the contrary: 'If your enemy is hungry, feed him; if he is thirsty, give him something to drink. In doing this, you will heap burning coals on his head.' Do not be overcome by evil, but overcome evil with good.`,
        },
      ],
      comentario: `Healing comes through truthful boundaries, forgiveness, and entrusting justice to God.`,
      oracao: `Deliver my heart from bitterness and guard my steps in grace and truth.`,
    },
  },
  {
    id: "relacionamento-2",
    number: "13",
    kicker: "RELATIONSHIPS II",
    title: "Hope, trust, and family desire",
    blocks: [
      { type: "lead", text: `Desiring a genuine good without turning it into a savior.` },
      {
        type: "fields",
        title: "Hope without absolute forecasting",
        fields: [
          { kind: "textarea", id: "rel2-desejo", label: "What I genuinely desire:" },
          {
            kind: "textarea",
            id: "rel2-afirmar",
            label: "What I can affirm today without pretending certainty:",
          },
        ],
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Galatians 6:9-10",
          ara: `E não nos cansemos de fazer o bem, porque a seu tempo ceifaremos, se não desfalecermos. Por isso, enquanto tivermos oportunidade, façamos o bem a todos, mas principalmente aos da família da fé.`,
          nvt: `Não nos cansemos de fazer o bem. No momento certo, colheremos se não desistirmos. Por isso, sempre que tivermos oportunidade, façamos o bem a todos, especialmente aos da família da fé.`,
          kjv: `And let us not be weary in well doing: for in due season we shall reap, if we faint not. As we have therefore opportunity, let us do good unto all men, especially unto them who are of the household of faith.`,
          niv: `Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up. Therefore, as we have opportunity, let us do good to all people, especially to those who belong to the family of believers.`,
        },
        {
          ref: "1 Corinthians 15:58",
          ara: `Portanto, meus amados irmãos, sede firmes, inabaláveis e sempre abundantes na obra do Senhor, sabendo que, no Senhor, o vosso trabalho não é vão.`,
          nvt: `Portanto, meus amados irmãos, sejam firmes e constantes. Sejam sempre dedicados à obra do Senhor, pois vocês sabem que no Senhor o trabalho de vocês não é inútil.`,
          kjv: `Therefore, my beloved brethren, be ye stedfast, unmoveable, always abounding in the work of the Lord, forasmuch as ye know that your labour is not in vain in the Lord.`,
          niv: `Therefore, my dear brothers and sisters, stand firm. Let nothing move you. Always give yourselves fully to the work of the Lord, because you know that your labor in the Lord is not in vain.`,
        },
      ],
      comentario: `Hope rests in God's faithfulness. Daily perseverance in doing good is never in vain.`,
      oracao: `Keep my heart anchored in your hope and grant me peace for the road ahead.`,
    },
  },
  {
    id: "pensamento-sentido",
    number: "14",
    kicker: "THOUGHT & MEANING",
    title: "Cognitive thought record + meaning-oriented action",
    blocks: [
      { type: "lead", text: `Examining what I think; acting toward a good that does not depend on mood.` },
      {
        type: "fields",
        title: "Thought record",
        fields: [
          { kind: "textarea", id: "cog-situacao", label: "Situation:" },
          { kind: "textarea", id: "cog-pensamento", label: "Automatic thought:" },
          { kind: "text", id: "cog-emocao", label: "Emotion / intensity:" },
          { kind: "textarea", id: "cog-favor", label: "Evidence in favor:" },
          { kind: "textarea", id: "cog-contra", label: "Evidence against:" },
          { kind: "textarea", id: "cog-resposta", label: "Balanced, proportional response:" },
        ],
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Lamentations 3:22-23",
          ara: `As misericórdias do SENHOR são a causa de não sermos consumidos, porque as suas misericórdias não têm fim; renovam-se cada manhã. Grande é a tua fidelidade.`,
          nvt: `O amor do SENHOR não tem fim! Suas misericórdias são inesgotáveis. Grande é sua fidelidade; suas misericórdias se renovam a cada manhã.`,
          kjv: `It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.`,
          niv: `Because of the LORD's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.`,
        },
        {
          ref: "Psalm 90:12",
          ara: `Ensina-nos a contar os nossos dias, para que alcancemos coração sábio.`,
          nvt: `Ensina-nos a contar nossos dias para que tenhamos um coração sábio.`,
          kjv: `So teach us to number our days, that we may apply our hearts unto wisdom.`,
          niv: `Teach us to number our days, that we may gain a heart of wisdom.`,
        },
      ],
      comentario: `Truth frees the mind from catastrophic thinking. God's mercies renew each morning.`,
      oracao: `Teach me to number my days and ground my thoughts in your unchanging truth.`,
    },
  },
  {
    id: "semana-1",
    number: "15",
    kicker: "WEEKLY SCHEDULE",
    title: "Weekly Activity Schedule",
    blocks: [
      { type: "lead", text: `Presence and repetition, not exhaustion.` },
      {
        type: "schedule",
        id: "s1",
        cols: ["16:30", "17:00", "21:30"],
        rows: [
          { id: "s1-dom09", day: "Sun 09", tasks: ["Prepare notebook + two ladders", "—", "—"] },
          { id: "s1-seg10", day: "Mon 10", tasks: ["Activation: 15-min task", "Leaving house: step 1", "5-min expressive writing"] },
          { id: "s1-ter11", day: "Tue 11", tasks: ["Work: external cue level 1", "Repeat leaving step", "—"] },
          { id: "s1-qua12", day: "Wed 12", tasks: ["Proportional judgment", "—", "5-min expressive writing"] },
          { id: "s1-qui13", day: "Thu 13", tasks: ["Relationships: 4-column record", "Leaving house: small step", "—"] },
          { id: "s1-sex14", day: "Fri 14", tasks: ["Threat discrimination", "—", "—"] },
          { id: "s1-sab15", day: "Sat 15", tasks: ["Attachment + competence", "Leaving house", "5-min expressive writing"] },
          { id: "s1-dom16", day: "Sun 16", tasks: ["30-min weekly review", "—", "—"] },
        ],
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Psalm 46:1-3",
          ara: `Deus é o nosso refúgio e fortaleza, socorro bem presente nas tribulações. Portanto, não temeremos ainda que a terra se transtorne e os montes se abalem no seio dos mares; ainda que as águas tumultuem e espumejem e os montes se estremeçam com a sua fúria.`,
          nvt: `Deus é nosso refúgio e fortaleza, socorro sempre presente nos momentos de angústia. Por isso não temeremos quando a terra tremer e os montes caírem no mar, quando as águas do oceano rugirem e espumarem e os montes estremecerem.`,
          kjv: `God is our refuge and strength, a very present help in trouble. Therefore will not we fear, though the earth be removed, and though the mountains be carried into the midst of the sea; Though the waters thereof roar and be troubled, though the mountains shake with the swelling thereof. Selah.`,
          niv: `God is our refuge and strength, an ever-present help in trouble. Therefore we will not fear, though the earth give way and the mountains fall into the heart of the sea, though its waters roar and foam and the mountains quake with their surging.`,
        },
        {
          ref: "Isaiah 41:10",
          ara: `Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.`,
          nvt: `Não tenha medo, pois estou com você; não desanime, pois sou o seu Deus. Eu o fortalecerei e o ajudarei; com minha mão direita vitoriosa o sustentarei.`,
          kjv: `Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.`,
          niv: `So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.`,
        },
      ],
      comentario: `Order and scheduled routine give structure to daily life, under God's refuge.`,
      oracao: `Lord, establish my steps in your peace and give me faithfulness for the day's routine.`,
    },
  },
  {
    id: "semana-2",
    number: "16",
    kicker: "PROGRESS & CONSOLIDATION",
    title: "Progress and Consolidation",
    blocks: [
      { type: "lead", text: `Repeating the structure; advancing only when data supports it.` },
      {
        type: "p",
        text: `Only move to a higher ladder step when the previous one is manageable and consistent.`,
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Matthew 11:28-30",
          ara: `Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei. Tomai sobre vós o meu jugo e aprendei de mim, porque sou manso e humilde de coração; e achareis descanso para a vossa alma. Porque o meu jugo é suave, e o meu fardo é leve.`,
          nvt: `Venham a mim todos vocês que estão cansados e sobrecarregados, e eu lhes darei descanso. Tomem sobre vocês o meu jugo e aprendam de mim, pois sou manso e humilde de coração, e encontrarão descanso para sua alma. Pois meu jugo é suave e meu fardo é leve.`,
          kjv: `Come unto me, all ye that labour and are heavy laden, and I will give you rest. Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls. For my yoke is easy, and my burden is light.`,
          niv: `'Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls. For my yoke is easy and my burden is light.'`,
        },
        {
          ref: "Psalm 23:1-3",
          ara: `O SENHOR é o meu pastor; nada me faltará. Ele me faz repousar em pastos verdejantes. Leva-me para junto das águas de descanso; refrigera-me a alma. Guia-me pelas veredas da justiça por amor do seu nome.`,
          nvt: `O SENHOR é meu pastor; nada me faltará. Em verdes pastagens me faz repousar e me conduz a águas tranquilas. Restaura minhas forças e me guia pelos caminhos da justiça por causa do seu nome.`,
          kjv: `The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake.`,
          niv: `The LORD is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul. He guides me along the right paths for his name's sake.`,
        },
      ],
      comentario: `True rest is found in Christ. His yoke is gentle and his burden is light.`,
      oracao: `Lead me beside still waters and restore my soul in your righteousness.`,
    },
  },
  {
    id: "revisao",
    number: "17",
    kicker: "REVIEW",
    title: "Review, gratitude, and adjustments",
    blocks: [
      { type: "lead", text: `The weekly cycle finishes; faithful practice continues.` },
      {
        type: "fields",
        title: "Review questions",
        fields: [
          {
            kind: "textarea",
            id: "rev-evitacao",
            label: "Avoidance — Did I leave the house more? Which step felt more manageable?",
          },
          {
            kind: "textarea",
            id: "rev-autojulgamento",
            label: "Self-judgment — Was I able to dismiss harsh inner accusations earlier?",
          },
          {
            kind: "textarea",
            id: "rev-desconfianca",
            label: "Mistrust — In what situation did I distinguish fact from suspicion?",
          },
          {
            kind: "textarea",
            id: "rev-isolamento",
            label: "Isolation — Did I make any genuine interpersonal connection?",
          },
          {
            kind: "textarea",
            id: "rev-competencia",
            label: "Competence — What did I accomplish that I previously avoided?",
          },
          { kind: "textarea", id: "rev-trabalho", label: "Work — Which external cue felt more tolerable?" },
          {
            kind: "textarea",
            id: "rev-relacionamento",
            label: "Relationships — Which generalization felt less absolute?",
          },
          { kind: "textarea", id: "rev-sentido", label: "Meaning — What meaningful action did I carry out?" },
        ],
      },
    ],
    scripture: {
      verses: [
        {
          ref: "Hebrews 10:24-25",
          ara: `Consideremo-nos também uns aos outros, para nos estimularmos ao amor e às boas obras. Não deixemos de congregar-nos, como é costume de alguns; antes, façamos admoestações e tanto mais quanto vedes que o Dia se aproxima.`,
          nvt: `Pensemos em maneiras de motivar uns aos outros para a prática do amor e das boas ações. E não deixemos de nos reunir, como alguns fazem, mas encorajemo-nos mutuamente, sobretudo agora que o dia se aproxima.`,
          kjv: `And let us consider one another to provoke unto love and to good works: Not forsaking the assembling of ourselves together, as the manner of some is; but exhorting one another: and so much the more, as ye see the day approaching.`,
          niv: `And let us consider how we may spur one another on toward love and good deeds, not giving up meeting together, as some are in the habit of doing, but encouraging one another—and all the more as you see the Day approaching.`,
        },
        {
          ref: "Ecclesiastes 4:9-10",
          ara: `Melhor é serem dois do que um, porque têm melhor paga do seu trabalho. Porque se caírem, um levanta o companheiro; ai, porém, do que estiver só; pois, caindo, não haverá quem o levante.`,
          nvt: `Dois homens podem resistir a um ataque que derrotaria um deles se estivesse sozinho. Um cordão de três dobras não se rompe com facilidade.`,
          kjv: `Two are better than one; because they have a good reward for their labour. For if they fall, the one will lift up his fellow: but woe to him that is alone when he falleth; for he hath not another to help him up.`,
          niv: `Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up. But pity anyone who falls and has no one to help them up.`,
        },
      ],
      comentario: `Growth happens gradually through consistent small adjustments and fellowship.`,
      oracao: `Lord, grant me wisdom to review my steps, gratitude for your mercies, and hope for the days ahead.`,
    },
  },
]

export const DEFAULT_GUIDE_TEMPLATE_EN: GuideTemplate = {
  id: "my-recovery-guide",
  title: "My Recovery Guide",
  description: "Personal plan for schema work, behavioral exercises, and Scripture",
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-08-13T00:00:00.000Z",
  schemaVersion: 1,
  contentLocale: "en-US",
  config: {
    targetAudience: "Individuals seeking clarity, consistency, and personal restructuring",
    category: "Recovery & Schemas",
  },
  intro: introEn as any,
  sections: sectionsEn,
  scheduleTaskIds: ["act-0-1", "act-0-2", "act-0-3"],
  weeklyPlan: [
    { id: "act-0-1", dayIndex: 0, time: "16:30", description: "Prepare notebook + two ladders / 15-min activation", order: 0, countsTowardCompletion: true },
    { id: "act-0-2", dayIndex: 0, time: "17:00", description: "Leaving house: step 1", order: 1, countsTowardCompletion: true },
    { id: "act-0-3", dayIndex: 0, time: "21:30", description: "5-min expressive writing", order: 2, countsTowardCompletion: true },
    { id: "act-1-1", dayIndex: 1, time: "16:30", description: "Work: external cue level 1", order: 0, countsTowardCompletion: true },
    { id: "act-1-2", dayIndex: 1, time: "17:00", description: "Repeat leaving step", order: 1, countsTowardCompletion: true },
    { id: "act-2-1", dayIndex: 2, time: "16:30", description: "Proportional judgment exercise", order: 0, countsTowardCompletion: true },
    { id: "act-2-2", dayIndex: 2, time: "21:30", description: "5-min expressive writing", order: 1, countsTowardCompletion: true },
    { id: "act-3-1", dayIndex: 3, time: "16:30", description: "Relationships: 4-column record", order: 0, countsTowardCompletion: true },
    { id: "act-3-2", dayIndex: 3, time: "17:00", description: "Leaving house: small advance", order: 1, countsTowardCompletion: true },
    { id: "act-4-1", dayIndex: 4, time: "16:30", description: "Threat discrimination", order: 0, countsTowardCompletion: true },
    { id: "act-5-1", dayIndex: 5, time: "16:30", description: "Attachment + competence", order: 0, countsTowardCompletion: true },
    { id: "act-5-2", dayIndex: 5, time: "17:00", description: "Leaving house", order: 1, countsTowardCompletion: true },
    { id: "act-5-3", dayIndex: 5, time: "21:30", description: "5-min expressive writing", order: 2, countsTowardCompletion: true },
    { id: "act-6-1", dayIndex: 6, time: "16:30", description: "30-min weekly review", order: 0, countsTowardCompletion: true },
  ],
  quickSheets: [
    { id: "qs-esquemas", title: "Schema Quick Sheet", summary: "Rapid identification of triggered schemas and avoidance." },
    { id: "qs-ativacao", title: "Behavioral Activation Sheet", summary: "Gradual 15-minute steps to move past paralysis." },
  ],
  theologyEnabled: true,
  completionConfig: {
    enabled: true,
    reviewTitle: "Recovery Week Verdict and Clinical Review",
    analysisDimensions: [
      "Adherence to scheduled weekly activities",
      "Identification and management of schemas and avoidance patterns",
      "Reflections and observations recorded in thought boxes",
      "Consistency in morning and evening routines"
    ],
    nextWeekFocusRules: [
      "Gradual and sustainable adjustments for the weekly routine",
      "Reinforce practices that fostered clarity and anxiety reduction"
    ],
    theologyReviewEnabled: true,
  },
}
