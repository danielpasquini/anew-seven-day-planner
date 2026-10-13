/**
 * Bible Provider Abstraction
 * 
 * Provides verified scripture passage resolutions for ARA, NVT, KJV, and NIV,
 * handling copyright notices, attribution, and language switching.
 * Reference: docs/BIBLE-SOURCES.md
 */

export type BibleVersion = "ARA" | "NVT" | "KJV" | "NIV"
export type BibleLocale = "pt-BR" | "en-US"

export interface VerseText {
  ref: string
  text: string
  version: BibleVersion
}

export interface ScripturePassage {
  ref: string
  ara: string
  nvt: string
  kjv: string
  niv: string
}

export interface ResolvedScriptureBlock {
  verses: {
    ref: string
    primaryText: string
    primaryVersion: BibleVersion
    secondaryText: string
    secondaryVersion: BibleVersion
  }[]
  comentario: string
  oracao: string
  attributionNotice?: string
}

/**
 * Verified canonical scripture corpus for the default guide sections
 */
export const VERIFIED_SCRIPTURES: Record<string, ScripturePassage> = {
  // Intro
  "intro-psalm": {
    ref: "Salmos 27:13-14",
    ara: "Eu creio que verei a bondade do SENHOR na terra dos viventes. Espera pelo SENHOR, tem bom ânimo, e fortifique-se o teu coração; espera, pois, pelo SENHOR.",
    nvt: "Ainda assim, confio que verei a bondade do SENHOR enquanto estiver aqui, na terra dos vivos. Espere pelo SENHOR e seja valente e corajoso; sim, espere pelo SENHOR.",
    kjv: "I had fainted, unless I had believed to see the goodness of the LORD in the land of the living. Wait on the LORD: be of good courage, and he shall strengthen thine heart: wait, I say, on the LORD.",
    niv: "I remain confident of this: I will see the goodness of the LORD in the land of the living. Wait for the LORD; be strong and take heart and wait for the LORD.",
  },

  // Section 01
  "psalm-139-23-24": {
    ref: "Salmos 139:23-24",
    ara: "Sonda-me, ó Deus, e conhece o meu coração, prova-me e conhece os meus pensamentos; vê se há em mim algum caminho mau e guia-me pelo caminho eterno.",
    nvt: "Examina-me, ó Deus, e conhece meu coração; prova-me e vê meus pensamentos. Mostra-me se há em mim algo que te ofende e conduze-me pelo caminho eterno.",
    kjv: "Search me, O God, and know my heart: try me, and know my thoughts: And see if there be any wicked way in me, and lead me in the way everlasting.",
    niv: "Search me, God, and know my heart; test me and know my anxious thoughts. See if there is any offensive way in me, and lead me in the way everlasting.",
  },
  "proverbs-4-23": {
    ref: "Provérbios 4:23",
    ara: "Sobre tudo o que se deve guardar, guarda o coração, porque dele procedem as fontes da vida.",
    nvt: "Acima de todas as coisas, guarde seu coração, pois ele dirige o rumo de sua vida.",
    kjv: "Keep thy heart with all diligence; for out of it are the issues of life.",
    niv: "Above all else, guard your heart, for everything you do flows from it.",
  },

  // Section 02
  "jeremiah-17-9-10": {
    ref: "Jeremias 17:9-10",
    ara: "Enganoso é o coração, mais do que todas as coisas, e desesperadamente corrupto; quem o conhecerá? Eu, o SENHOR, esquadrinho o coração, eu provo os pensamentos; e isto para dar a cada um segundo o seu proceder, segundo o fruto das suas ações.",
    nvt: "O coração humano é mais enganoso que qualquer coisa e é extremamente perverso; quem sabe, de fato, o quanto é mau? Eu, o SENHOR, examino o coração e provo os pensamentos. Dou a cada pessoa a devida recompensa, de acordo com suas ações.",
    kjv: "The heart is deceitful above all things, and desperately wicked: who can know it? I the LORD search the heart, I try the reins, even to give every man according to his ways, and according to the fruit of his doings.",
    niv: "The heart is deceitful above all things and beyond cure. Who can understand it? 'I the LORD search the heart and examine the mind, to reward each person according to their conduct, according to what their deeds deserve.'",
  },
  "hebrews-4-12": {
    ref: "Hebreus 4:12",
    ara: "Porque a palavra de Deus é viva, e eficaz, e mais cortante do que qualquer espada de dois gumes, e penetra até ao ponto de dividir alma e espírito, juntas e medulas, e é apta para discernir os pensamentos e propósitos do coração.",
    nvt: "Pois a palavra de Deus é viva e poderosa. É mais cortante que qualquer espada de dois gumes, penetrando entre a alma e o espírito, entre a junta e a medula, e trazendo à luz até os pensamentos e desejos mais íntimos.",
    kjv: "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart.",
    niv: "For the word of God is alive and active. Sharper than any double-edged sword, it penetrates even to dividing soul and spirit, joints and marrow; it judges the thoughts and attitudes of the heart.",
  },

  // Section 03
  "proverbs-14-15": {
    ref: "Provérbios 14:15",
    ara: "O simples dá crédito a toda palavra, mas o prudente atenta para os seus passos.",
    nvt: "O ingênuo acredita em tudo que ouve; o prudente examina seus passos com cuidado.",
    kjv: "The simple believeth every word: but the prudent man looketh well to his going.",
    niv: "The simple believe anything, but the prudent give thought to their steps.",
  },
  "romans-12-3": {
    ref: "Romanos 12:3",
    ara: "Porque, pela graça que me foi dada, digo a cada um dentre vós que não pense de si mesmo além do que convém; antes, pense com moderação, segundo a medida da fé que Deus repartiu a cada um.",
    nvt: "Com base no privilégio e na autoridade que me foram dados, dou a cada um de vocês este aviso: não se considerem melhores do que realmente são. Sejam honestos em sua autoavaliação, medindo-se de acordo com a fé que Deus nos deu.",
    kjv: "For I say, through the grace given unto me, to every man that is among you, not to think of himself more highly than he ought to think; but to think soberly, according as God hath dealt to every man the measure of faith.",
    niv: "For by the grace given me I say to every one of you: Do not think of yourself more highly than you ought, but rather think of yourself with sober judgment, in accordance with the faith God has distributed to each of you.",
  },

  // Section 04
  "1-thessalonians-4-11-12": {
    ref: "1 Tessalonicenses 4:11-12",
    ara: "e a diligenciardes por viver tranqüilamente, cuidar do que é vosso e trabalhar com as próprias mãos, como vos ordenamos; de modo que vos porteis com dignidade para com os de fora e de nada venhais a precisar.",
    nvt: "Tenham como objetivo viver em paz, cuidar dos seus próprios assuntos e trabalhar com as próprias mãos, como antes os instruímos. Assim, as pessoas que não são cristãs respeitarão a maneira como vocês vivem, e vocês não precisarão depender dos outros.",
    kjv: "And that ye study to be quiet, and to do your own business, and to work with your own hands, as we commanded you; That ye may walk honestly toward them that are without, and that ye may have lack of nothing.",
    niv: "and to make it your ambition to lead a quiet life: You should mind your own business and work with your hands, just as we told you, so that your daily life may win the respect of outsiders and so that you will not be dependent on anybody.",
  },
  "proverbs-6-6-8": {
    ref: "Provérbios 6:6-8",
    ara: "Vai ter com a formiga, ó preguiçoso, considera os seus caminhos e sê sábio. Não tendo ela chefe, nem oficial, nem comandante, no estio, prepara o seu pão, na sega, ajunta o seu mantimento.",
    nvt: "Observe a formiga, preguiçoso! Reflita nos caminhos dela e seja sábio! Ela não tem chefe, nem líder, nem governador, mas no verão ajunta suas provisões e na época da colheita armazena alimento.",
    kjv: "Go to the ant, thou sluggard; consider her ways, and be wise: Which having no guide, overseer, or ruler, Provideth her meat in the summer, and gathereth her food in the harvest.",
    niv: "Go to the ant, you sluggard; consider its ways and be wise! It has no commander, no overseer or ruler, yet it stores its provisions in summer and gathers its food at harvest.",
  },

  // Section 05
  "2-timothy-1-7": {
    ref: "2 Timóteo 1:7",
    ara: "Porque Deus não nos tem dado espírito de covardia, mas de poder, de amor e de moderação.",
    nvt: "Pois Deus não nos deu um espírito de covardia, mas de poder, de amor e de bom senso.",
    kjv: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
    niv: "For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.",
  },
  "psalm-56-3-4": {
    ref: "Salmos 56:3-4",
    ara: "Em me vindo o temor, hei de confiar em ti. Em Deus, cuja palavra eu louvo, em Deus ponho a minha confiança e nada temerei. Que me pode fazer um simples mortal?",
    nvt: "Quando eu tiver medo, confiarei em ti. Louvo a Deus pelo que prometeu; confio em Deus e não tenho medo. Que podem meros mortais fazer contra mim?",
    kjv: "What time I am afraid, I will trust in thee. In God I will praise his word, in God I have put my trust; I will not fear what flesh can do unto me.",
    niv: "When I am afraid, I put my trust in you. In God, whose word I praise—in God I trust and am not afraid. What can mere mortals do to me?",
  },

  // Section 06
  "proverbs-18-17": {
    ref: "Provérbios 18:17",
    ara: "O primeiro que pleiteia a sua causa parece justo, até que vem o outro e o examina.",
    nvt: "O primeiro a apresentar sua causa parece ter razão, até que outro se apresenta e o questiona.",
    kjv: "He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.",
    niv: "In a lawsuit the first to speak seems right, until someone comes forward and cross-examines.",
  },
  "philippians-4-8": {
    ref: "Filipenses 4:8",
    ara: "Finalmente, irmãos, tudo o que é verdadeiro, tudo o que é respeitável, tudo o que é justo, tudo o que é puro, tudo o que é amável, tudo o que é de boa fama, se alguma virtude há e se algum louvor há, seja isso o que ocupe o vosso pensamento.",
    nvt: "Por fim, irmãos, quero lhes dizer mais uma coisa. Concentrem-se em tudo que é verdadeiro, tudo que é nobre, tudo que é correto, tudo que é puro, tudo que é amável e tudo que é admirável. Pensem no que é excelente e digno de louvor.",
    kjv: "Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.",
    niv: "Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirable—if anything is excellent or praiseworthy—think about such things.",
  },

  // Section 07
  "james-3-17-18": {
    ref: "Tiago 3:17-18",
    ara: "A sabedoria, porém, lá do alto é, primeiramente, pura; depois, pacífica, indulgente, tratável, plena de misericórdia e de bons frutos, imparcial, sem fingimento. Ora, é em paz que se semeia o fruto da justiça, para os que promovem a paz.",
    nvt: "Mas a sabedoria que vem do alto é, antes de tudo, pura. Também é pacífica, amável e compreensiva. É cheia de misericórdia e de bons frutos, não mostra favoritismo e é sempre sincera. E aqueles que são pacificadores semearão sementes de paz e ajuntarão uma colheita de justiça.",
    kjv: "But the wisdom that is from above is first pure, then peaceable, gentle, and easy to be intreated, full of mercy and good fruits, without partiality, and without hypocrisy. And the fruit of righteousness is sown in peace of them that make peace.",
    niv: "But the wisdom that comes from heaven is first of all pure; then peace-loving, considerate, submissive, full of mercy and good fruit, impartial and sincere. Peacemakers who sow in peace reap a harvest of righteousness.",
  },
  "romans-12-18": {
    ref: "Romanos 12:18",
    ara: "Se possível, quanto depender de vós, tende paz com todos os homens.",
    nvt: "Façam todo o possível para viver em paz com todos.",
    kjv: "If it be possible, as much as lieth in you, live peaceably with all men.",
    niv: "If it is possible, as far as it depends on you, live at peace with everyone.",
  },

  // Section 08
  "psalm-112-7-8": {
    ref: "Salmos 112:7-8",
    ara: "Não se atemoriza de más notícias; o seu coração é firme, confiante no SENHOR. O seu coração, bem assestado, não teme, até que veja cumprido o seu desejo sobre os adversários.",
    nvt: "Não temem más notícias; confiam plenamente no SENHOR para protegê-los. Estão seguros e não têm medo; sabem que seus inimigos serão derrotados.",
    kjv: "He shall not be afraid of evil tidings: his heart is fixed, trusting in the LORD. His heart is established, he shall not be afraid, until he see his desire upon his enemies.",
    niv: "They will have no fear of bad news; their hearts are steadfast, trusting in the LORD. Their hearts are secure, they will have no fear; in the end they will look in triumph on their foes.",
  },
  "1-john-4-18": {
    ref: "1 João 4:18",
    ara: "No amor não existe medo; antes, o perfeito amor lança fora o medo. Ora, o medo produz tormento; logo, aquele que teme não é aperfeiçoado no amor.",
    nvt: "No amor não há medo; ao contrário, o perfeito amor expulsa o medo, porque o medo supõe castigo. Aquele que teme não está aperfeiçoado no amor.",
    kjv: "There is no fear in love; but perfect love casteth out fear: because fear hath torment. He that feareth is not made perfect in love.",
    niv: "There is no fear in love. But perfect love drives out fear, because fear has to do with punishment. The one who fears is not made perfect in love.",
  },

  // Section 09
  "1-corinthians-13-4-7": {
    ref: "1 Coríntios 13:4-7",
    ara: "O amor é paciente, é benigno; o amor não arde em ciúmes, não se ufana, não se ensoberbece, não se conduz inconvenientemente, não procura os seus interesses, não se exaspera, não se ressente do mal; não se alegra com a injustiça, mas regozija-se com a verdade; tudo sofre, tudo crê, tudo espera, tudo suporta.",
    nvt: "O amor é paciente e bondoso. O amor não é ciumento, nem presunçoso, nem orgulhoso, nem grosseiro. Não exige que as coisas sejam feitas à sua maneira. Não é irritadiço, nem guarda rancor. Não se alegra com a injustiça, mas sim com a verdade. O amor nunca desiste, nunca perde a fé, sempre tem esperança e sempre se mantém firme.",
    kjv: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up, Doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil; Rejoiceth not in iniquity, but rejoiceth in the truth; Beareth all things, believeth all things, hopeth all things, endureth all things.",
    niv: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs. Love does not delight in evil but rejoices with the truth. It always protects, always trusts, always hopes, always perseveres.",
  },
  "romans-12-9-10": {
    ref: "Romanos 12:9-10",
    ara: "O amor seja sem hipocrisia. Detestai o mal, apegando-vos ao bem. Amai-vos cordialmente uns aos outros com amor fraternal, preferindo-vos em honra uns aos outros.",
    nvt: "O amor não deve ser fingido. Odeiem o que é mau; apeguem-se firmemente ao que é bom. Amem-se com amor fraternal e tenham prazer em honrar uns aos outros.",
    kjv: "Let love be without dissimulation. Abhor that which is evil; cleave to that which is good. Be kindly affectioned one to another with brotherly love; in honour preferring one another;",
    niv: "Love must be sincere. Hate what is evil; cling to what is good. Be devoted to one another in love. Honor one another above yourselves.",
  },

  // Section 10
  "colossians-3-23-24": {
    ref: "Colossenses 3:23-24",
    ara: "Tudo quanto fizerdes, fazei-o de todo o coração, como para o Senhor e não para homens, cientes de que recebereis do Senhor a recompensa da herança. A Cristo, o Senhor, é que estais servindo.",
    nvt: "Trabalhem de boa vontade em tudo que fizerem, como se trabalhassem para o Senhor, e não para pessoas. Lembrem-se de que o Senhor lhes dará uma herança como recompensa e de que o Senhor a quem vocês servem é Cristo.",
    kjv: "And whatsoever ye do, do it heartily, as to the Lord, and not unto men; Knowing that of the Lord ye shall receive the reward of the inheritance: for ye serve the Lord Christ.",
    niv: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters, since you know that you will receive an inheritance from the Lord as a reward. It is the Lord Christ you are serving.",
  },
  "proverbs-22-29": {
    ref: "Provérbios 22:29",
    ara: "Vês a um homem perito na sua obra? Perante reis será posto; não entre a plebe.",
    nvt: "Você já viu alguém competente no que faz? Essa pessoa servirá diante de reis, e não de gente qualquer.",
    kjv: "Seest thou a man diligent in his business? he shall stand before kings; he shall not stand before mean men.",
    niv: "Do you see someone skilled in their work? They will serve before kings; they will not serve before officials of low rank.",
  },

  // Section 11
  "1-kings-19-5-8": {
    ref: "1 Reis 19:5-8",
    ara: "Deitou-se e dormiu debaixo do zimbro; eis que um anjo o tocou e lhe disse: Levanta-te e come. Olhou ele e viu, junto à cabeceira, um pão cozido sobre pedras em brasa e uma botija de água. Comeu, bebeu e tornou a dormir. Voltou segunda vez o anjo do SENHOR, tocou-o e lhe disse: Levanta-te e come, porque o caminho te será sobremodo longo. Levantou-se, pois, comeu e bebeu; e, com a força daquela comida, caminhou quarenta dias e quarenta noites até Horebe, o monte de Deus.",
    nvt: "Ele se deitou debaixo da árvore e dormiu. De repente, um anjo o tocou e disse: 'Levante-se e coma!'. Elias olhou ao redor e viu, perto de sua cabeça, um pão assado sobre pedras quentes e uma jarra de água. Ele comeu, bebeu e voltou a dormir. O anjo do SENHOR voltou, tocou-o e disse: 'Levante-se e coma mais um pouco, senão você não aguentará a viagem'. Ele se levantou, comeu e bebeu, e o alimento lhe deu forças para uma caminhada de quarenta dias e quarenta noites até o Horebe, o monte de Deus.",
    kjv: "And as he lay and slept under a juniper tree, behold, then an angel touched him, and said unto him, Arise and eat. And he looked, and, behold, there was a cake baken on the coals, and a cruse of water at his head. And he did eat and drink, and laid him down again. And the angel of the LORD came again the second time, and touched him, and said, Arise and eat; because the journey is too great for thee. And he arose, and did eat and drink, and went in the strength of that meat forty days and forty nights unto Horeb the mount of God.",
    niv: "Then he lay down under the bush and fell asleep. All at once an angel touched him and said, 'Get up and eat.' He looked around, and there by his head was some bread baked over hot coals, and a jar of water. He ate and drank and then lay down again. The angel of the LORD came back a second time and touched him and said, 'Get up and eat, for the journey is too much for you.' So he got up and ate and drank. Strengthened by that food, he traveled forty days and forty nights until he reached Horeb, the mountain of God.",
  },
  "psalm-127-2": {
    ref: "Salmos 127:2",
    ara: "Inútil vos será levantar de madrugada, repousar tarde, comer o pão que penosamente granjeastes; aos seus amados ele o dá enquanto dormem.",
    nvt: "É inútil acordar cedo e ir dormir tarde, trabalhando arduamente para conseguir o que comer; pois Deus provê para aqueles a quem ama enquanto eles dormem.",
    kjv: "It is vain for you to rise up early, to sit up late, to eat the bread of sorrows: for so he giveth his beloved sleep.",
    niv: "In vain you rise early and stay up late, toiling for food to eat—for he grants sleep to those he loves.",
  },

  // Section 12
  "ephesians-4-31-32": {
    ref: "Efésios 4:31-32",
    ara: "Longe de vós, toda amargura, e cólera, e ira, e gritaria, e blasfêmias, e bem assim toda malícia. Antes, sede uns para com os outros benignos, compassivos, perdoando-vos uns aos outros, como também Deus, em Cristo, vos perdoou.",
    nvt: "Livrem-se de toda amargura, indignação, ira, gritaria e calúnia, bem como de toda maldade. Em vez disso, sejam bondosos e tenham compaixão uns dos outros, perdoando-se mutuamente, assim como Deus os perdoou em Cristo.",
    kjv: "Let all bitterness, and wrath, and anger, and clamour, and evil speaking, be put away from you, with all malice: And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you.",
    niv: "Get rid of all bitterness, rage and anger, brawling and slander, along with every form of malice. Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.",
  },
  "romans-12-19-21": {
    ref: "Romanos 12:19-21",
    ara: "Não vos vingueis a vós mesmos, amados, mas dai lugar à ira; porque está escrito: A mim me pertence a vingança; eu é que retribuirei, diz o Senhor. Pelo contrário, se o teu inimigo tiver fome, dá-lhe de comer; se tiver sede, dá-lhe de beber; porque, fazendo isto, amontoarás brasas vivas sobre a sua cabeça. Não te deixes vencer do mal, mas vence o mal com o bem.",
    nvt: "Amados, nunca se vinguem; deixem isso com Deus. Pois dizem as Escrituras: 'A vingança pertence a mim; eu lhes darei o troco, diz o SENHOR'. Pelo contrário: 'Se seu inimigo tiver fome, dê-lhe de comer; se tiver sede, dê-lhe de beber. Ao fazer isso, você amontoará brasas vivas sobre a cabeça dele'. Não se deixem vencer pelo mal, mas vençam o mal com o bem.",
    kjv: "Dearly beloved, avenge not yourselves, but rather give place unto wrath: for it is written, Vengeance is mine; I will repay, saith the Lord. Therefore if thine enemy hunger, feed him; if he thirst, give him drink: for in so doing thou shalt heap coals of fire on his head. Be not overcome of evil, but overcome evil with good.",
    niv: "Do not take revenge, my dear friends, but leave room for God's wrath, for it is written: 'It is mine to avenge; I will repay,' says the Lord. On the contrary: 'If your enemy is hungry, feed him; if he is thirsty, give him something to drink. In doing this, you will heap burning coals on his head.' Do not be overcome by evil, but overcome evil with good.",
  },

  // Section 13
  "galatians-6-9-10": {
    ref: "Gálatas 6:9-10",
    ara: "E não nos cansemos de fazer o bem, porque a seu tempo ceifaremos, se não desfalecermos. Por isso, enquanto tivermos oportunidade, façamos o bem a todos, mas principalmente aos da família da fé.",
    nvt: "Não nos cansemos de fazer o bem. No momento certo, colheremos se não desistirmos. Por isso, sempre que tivermos oportunidade, façamos o bem a todos, especialmente aos da família da fé.",
    kjv: "And let us not be weary in well doing: for in due season we shall reap, if we faint not. As we have therefore opportunity, let us do good unto all men, especially unto them who are of the household of faith.",
    niv: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up. Therefore, as we have opportunity, let us do good to all people, especially to those who belong to the family of believers.",
  },
  "1-corinthians-15-58": {
    ref: "1 Coríntios 15:58",
    ara: "Portanto, meus amados irmãos, sede firmes, inabaláveis e sempre abundantes na obra do Senhor, sabendo que, no Senhor, o vosso trabalho não é vão.",
    nvt: "Portanto, meus amados irmãos, sejam firmes e constantes. Sejam sempre dedicados à obra do Senhor, pois vocês sabem que no Senhor o trabalho de vocês não é inútil.",
    kjv: "Therefore, my beloved brethren, be ye stedfast, unmoveable, always abounding in the work of the Lord, forasmuch as ye know that your labour is not in vain in the Lord.",
    niv: "Therefore, my dear brothers and sisters, stand firm. Let nothing move you. Always give yourselves fully to the work of the Lord, because you know that your labor in the Lord is not in vain.",
  },

  // Section 14
  "lamentations-3-22-23": {
    ref: "Lamentações 3:22-23",
    ara: "As misericórdias do SENHOR são a causa de não sermos consumidos, porque as suas misericórdias não têm fim; renovam-se cada manhã. Grande é a tua fidelidade.",
    nvt: "O amor do SENHOR não tem fim! Suas misericórdias são inesgotáveis. Grande é sua fidelidade; suas misericórdias se renovam a cada manhã.",
    kjv: "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.",
    niv: "Because of the LORD's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
  },
  "psalm-90-12": {
    ref: "Salmos 90:12",
    ara: "Ensina-nos a contar os nossos dias, para que alcancemos coração sábio.",
    nvt: "Ensina-nos a contar nossos dias para que tenhamos um coração sábio.",
    kjv: "So teach us to number our days, that we may apply our hearts unto wisdom.",
    niv: "Teach us to number our days, that we may gain a heart of wisdom.",
  },

  // Section 15
  "psalm-46-1-3": {
    ref: "Salmos 46:1-3",
    ara: "Deus é o nosso refúgio e fortaleza, socorro bem presente nas tribulações. Portanto, não temeremos ainda que a terra se transtorne e os montes se abalem no seio dos mares; ainda que as águas tumultuem e espumejem e os montes se estremeçam com a sua fúria.",
    nvt: "Deus é nosso refúgio e fortaleza, socorro sempre presente nos momentos de angústia. Por isso não temeremos quando a terra tremer e os montes caírem no mar, quando as águas do oceano rugirem e espumarem e os montes estremecerem.",
    kjv: "God is our refuge and strength, a very present help in trouble. Therefore will not we fear, though the earth be removed, and though the mountains be carried into the midst of the sea; Though the waters thereof roar and be troubled, though the mountains shake with the swelling thereof. Selah.",
    niv: "God is our refuge and strength, an ever-present help in trouble. Therefore we will not fear, though the earth give way and the mountains fall into the heart of the sea, though its waters roar and foam and the mountains quake with their surging.",
  },
  "isaiah-41-10": {
    ref: "Isaías 41:10",
    ara: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.",
    nvt: "Não tenha medo, pois estou com você; não desanime, pois sou o seu Deus. Eu o fortalecerei e o ajudarei; com minha mão direita vitoriosa o sustentarei.",
    kjv: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.",
    niv: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.",
  },

  // Section 16
  "matthew-11-28-30": {
    ref: "Mateus 11:28-30",
    ara: "Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei. Tomai sobre vós o meu jugo e aprendei de mim, porque sou manso e humilde de coração; e achareis descanso para a vossa alma. Porque o meu jugo é suave, e o meu fardo é leve.",
    nvt: "Venham a mim todos vocês que estão cansados e sobrecarregados, e eu lhes darei descanso. Tomem sobre vocês o meu jugo e aprendam de mim, pois sou manso e humilde de coração, e encontrarão descanso para sua alma. Pois meu jugo é suave e meu fardo é leve.",
    kjv: "Come unto me, all ye that labour and are heavy laden, and I will give you rest. Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls. For my yoke is easy, and my burden is light.",
    niv: "'Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls. For my yoke is easy and my burden is light.'",
  },
  "psalm-23-1-3": {
    ref: "Salmos 23:1-3",
    ara: "O SENHOR é o meu pastor; nada me faltará. Ele me faz repousar em pastos verdejantes. Leva-me para junto das águas de descanso; refrigera-me a alma. Guia-me pelas veredas da justiça por amor do seu nome.",
    nvt: "O SENHOR é meu pastor; nada me faltará. Em verdes pastagens me faz repousar e me conduz a águas tranquilas. Restaura minhas forças e me guia pelos caminhos da justiça por causa do seu nome.",
    kjv: "The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake.",
    niv: "The LORD is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul. He guides me along the right paths for his name's sake.",
  },

  // Section 17
  "hebrews-10-24-25": {
    ref: "Hebreus 10:24-25",
    ara: "Consideremo-nos também uns aos outros, para nos estimularmos ao amor e às boas obras. Não deixemos de congregar-nos, como é costume de alguns; antes, façamos admoestações e tanto mais quanto vedes que o Dia se aproxima.",
    nvt: "Pensemos em maneiras de motivar uns aos outros para a prática do amor e das boas ações. E não deixemos de nos reunir, como alguns fazem, mas encorajemo-nos mutuamente, sobretudo agora que o dia se aproxima.",
    kjv: "And let us consider one another to provoke unto love and to good works: Not forsaking the assembling of ourselves together, as the manner of some is; but exhorting one another: and so much the more, as ye see the day approaching.",
    niv: "And let us consider how we may spur one another on toward love and good deeds, not giving up meeting together, as some are in the habit of doing, but encouraging one another—and all the more as you see the Day approaching.",
  },
  "ecclesiastes-4-9-10": {
    ref: "Eclesiastes 4:9-10",
    ara: "Melhor é serem dois do que um, porque têm melhor paga do seu trabalho. Porque se caírem, um levanta o companheiro; ai, porém, do que estiver só; pois, caindo, não haverá quem o levante.",
    nvt: "Dois homens podem resistir a um ataque que derrotaria um deles se estivesse sozinho. Um cordão de três dobras não se rompe com facilidade.",
    kjv: "Two are better than one; because they have a good reward for their labour. For if they fall, the one will lift up his fellow: but woe to him that is alone when he falleth; for he hath not another to help him up.",
    niv: "Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up. But pity anyone who falls and has no one to help them up.",
  },
}

/**
 * Book name normalization mappings
 */
const BOOK_SYNONYMS: Record<string, string[]> = {
  "Salmos": ["salmo", "salmos", "psalm", "psalms", "sl", "ps"],
  "Provérbios": ["proverbio", "proverbios", "provérbio", "provérbios", "proverb", "proverbs", "pv", "pr"],
  "Jeremias": ["jeremias", "jeremiah", "jr", "jer"],
  "Hebreus": ["hebreus", "hebrews", "hb", "heb"],
  "1 Tessalonicenses": ["1 tessalonicenses", "1 thessalonians", "1ts", "1thess", "1 thess"],
  "2 Timóteo": ["2 timoteo", "2 timóteo", "2 timothy", "2tm", "2tim", "2 tim"],
  "Tiago": ["tiago", "james", "tg", "jas"],
  "1 João": ["1 joao", "1 joão", "1 john", "1jo", "1jn", "1 john"],
  "1 Coríntios": ["1 corintios", "1 coríntios", "1 corinthians", "1co", "1cor", "1 cor"],
  "2 Coríntios": ["2 corintios", "2 coríntios", "2 corinthians", "2co", "2cor", "2 cor"],
  "Colossenses": ["colossenses", "colossians", "cl", "col"],
  "1 Reis": ["1 reis", "1 kings", "1rs", "1kgs", "1 kgs", "1 kings"],
  "Efésios": ["efesios", "efésios", "ephesians", "ef", "eph"],
  "Romanos": ["romanos", "romans", "rm", "rom"],
  "Gálatas": ["galatas", "gálatas", "galatians", "gl", "gal"],
  "Lamentações": ["lamentacoes", "lamentações", "lamentations", "lm", "lam"],
  "Naum": ["naum", "nahum", "na", "nah"],
  "Isaías": ["isaias", "isaías", "isaiah", "is", "isa"],
  "Mateus": ["mateus", "matthew", "mt", "matt"],
  "Zacarias": ["zacarias", "zechariah", "zc", "zech"],
  "Eclesiastes": ["eclesiastes", "ecclesiastes", "ec", "eccl"],
  "Miquéias": ["miqueias", "miquéias", "micah", "mq", "mic"],
  "Filipenses": ["filipenses", "philippians", "fp", "phil"],
}

const BOOK_ENGLISH_NAMES: Record<string, string> = {
  "Salmos": "Psalm",
  "Provérbios": "Proverbs",
  "Jeremias": "Jeremiah",
  "Hebreus": "Hebrews",
  "1 Tessalonicenses": "1 Thessalonians",
  "2 Timóteo": "2 Timothy",
  "Tiago": "James",
  "1 João": "1 John",
  "1 Coríntios": "1 Corinthians",
  "2 Coríntios": "2 Corinthians",
  "Colossenses": "Colossians",
  "1 Reis": "1 Kings",
  "Efésios": "Ephesians",
  "Romanos": "Romans",
  "Gálatas": "Galatians",
  "Lamentações": "Lamentations",
  "Naum": "Nahum",
  "Isaías": "Isaiah",
  "Mateus": "Matthew",
  "Zacarias": "Zechariah",
  "Eclesiastes": "Ecclesiastes",
  "Miquéias": "Micah",
  "Filipenses": "Philippians",
}

/**
 * Bible Provider Implementation
 */
export class BibleProvider {
  /**
   * Resolves only an exact known book, chapter and verse range. Unknown references stay unavailable.
   */
  static findPassage(reference: string): ScripturePassage | null {
    if (!reference || typeof reference !== "string" || reference.length > 150) return null
    const cleanRef = reference.trim().replace(/[–—]/g, "-")
    const parts = cleanRef.match(/^(.+?)\s*(\d+):(\d+)(?:-(\d+))?$/)
    if (!parts) return null
    const [, book, chapter, startVerse, endVerse] = parts
    if (Number(chapter) < 1 || Number(startVerse) < 1 || (endVerse && Number(endVerse) < Number(startVerse))) return null
    const normalizeBook = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[.\s]/g, "")
    const bookKey = normalizeBook(book)
    const canonicalBook = Object.entries(BOOK_SYNONYMS).find(([name, synonyms]) => normalizeBook(name) === bookKey || synonyms.some((synonym) => normalizeBook(synonym) === bookKey))?.[0]
    if (!canonicalBook) return null
    const range = `${Number(chapter)}:${Number(startVerse)}${endVerse ? `-${Number(endVerse)}` : ""}`
    return Object.values(VERIFIED_SCRIPTURES).find((passage) => {
      const match = passage.ref.match(/^(.+?)\s*(\d+):(\d+)(?:-(\d+))?$/)
      if (!match || normalizeBook(match[1]) !== normalizeBook(canonicalBook)) return false
      const knownRange = `${Number(match[2])}:${Number(match[3])}${match[4] ? `-${Number(match[4])}` : ""}`
      return knownRange === range
    }) || null
  }

  /**
   * Resolves a complete Verse object ({ ref, ara, nvt, kjv, niv })
   */
  static resolveVerse(reference: string, contentLocale: BibleLocale = "en-US"): { ref: string; ara: string; nvt: string; kjv?: string; niv?: string } | null {
    const entry = BibleProvider.findPassage(reference)
    if (!entry) return null

    let formattedRef = entry.ref
    if (contentLocale === "en-US") {
      for (const [ptBook, enBook] of Object.entries(BOOK_ENGLISH_NAMES)) {
        if (entry.ref.startsWith(ptBook)) {
          formattedRef = entry.ref.replace(ptBook, enBook)
          break
        }
      }
    }

    return {
      ref: formattedRef,
      ara: entry.ara,
      nvt: entry.nvt,
      kjv: entry.kjv,
      niv: entry.niv,
    }
  }

  /**
   * Resolves a passage by reference, preferred version and locale
   */
  static resolvePassage(reference: string, version?: BibleVersion, locale: BibleLocale = "en-US"): VerseText {
    const available = BibleProvider.getAvailableVersions(locale)
    const selectedVersion: BibleVersion = version && available.includes(version) ? version : BibleProvider.getDefaultVersion(locale)
    const entry = BibleProvider.findPassage(reference)

    if (entry) {
      let text = ""
      if (selectedVersion === "ARA") text = entry.ara
      else if (selectedVersion === "NVT") text = entry.nvt
      else if (selectedVersion === "KJV") text = entry.kjv
      else if (selectedVersion === "NIV") text = entry.niv
      else text = locale === "en-US" ? entry.kjv : entry.ara

      let ref = entry.ref
      if (locale === "en-US") {
        for (const [ptBook, enBook] of Object.entries(BOOK_ENGLISH_NAMES)) {
          if (entry.ref.startsWith(ptBook)) {
            ref = entry.ref.replace(ptBook, enBook)
            break
          }
        }
      }

      return {
        ref,
        text,
        version: selectedVersion,
      }
    }

    return {
      ref: reference,
      text: "",
      version: selectedVersion,
    }
  }

  /**
   * Returns standard attribution notice for exports and footer display
   */
  static getAttributionNotice(version: BibleVersion, locale: BibleLocale = "en-US"): string {
    switch (version) {
      case "NIV":
        return "Scripture quotations taken from The Holy Bible, New International Version®, NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide."
      case "KJV":
        return "Scripture quotations taken from the King James Version (KJV). Public Domain."
      case "ARA":
        return "Texto bíblico extraído da Bíblia Sagrada, Almeida Revista e Atualizada®, © Sociedade Bíblica do Brasil."
      case "NVT":
        return "Texto bíblico: Nova Versão Transformadora (NVT), © 2016 Editora Mundo Cristão."
      default:
        return ""
    }
  }

  /**
   * Returns available versions for a given locale
   */
  static getAvailableVersions(locale: BibleLocale): BibleVersion[] {
    return locale === "en-US" ? ["KJV", "NIV"] : ["ARA", "NVT"]
  }

  /**
   * Returns default version for a given locale
   */
  static getDefaultVersion(locale: BibleLocale): BibleVersion {
    return locale === "en-US" ? "KJV" : "ARA"
  }
}
