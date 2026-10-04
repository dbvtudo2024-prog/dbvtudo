import { QuizQuestionItem } from '../components/ClubQuiz';

// ============================================================================
// LIVRO "NISTO CREMOS" — CAPÍTULOS 1 AO 10 (Doutrinas de Deus, Humanidade e Salvação)
// ============================================================================
export const NISTO_CREMOS_1_10_QUESTIONS: Omit<QuizQuestionItem, 'id'>[] = [
  {
    category: 'NISTO_CREMOS_1_10',
    subCategory: 'Cap. 1 • As Escrituras Sagradas',
    question: 'Segundo o Capítulo 1 do livro "Nisto Cremos" (As Escrituras Sagradas), qual é a regra infalível de fé e prática e o padrão pelo qual todo ensino e experiência devem ser provados?',
    options: [
      'As Escrituras Sagradas (Antigo e Novo Testamentos), a Palavra escrita de Deus dada por inspiração divina',
      'As tradições históricas dos concílios eclesiásticos ao longo dos séculos',
      'A razão filosófica humana aliada às descobertas científicas',
      'As experiências emocionais individuais de cada cristão'
    ],
    correctIndex: 0,
    explanation: 'A Crença Fundamental nº 1 afirma que as Escrituras Sagradas são a infalível revelação da vontade de Deus, constituindo o padrão de caráter, a prova da experiência e o revelador autorizado de doutrinas.',
    reference: 'Nisto Cremos, Cap. 1 • 2 Timóteo 3:16-17; 2 Pedro 1:20-21; Isaías 8:20',
    hint: 'Baseia-se em "À lei e ao testemunho!" (Isaías 8:20) e 2 Timóteo 3:16.'
  },
  {
    category: 'NISTO_CREMOS_1_10',
    subCategory: 'Cap. 2 • A Trindade',
    question: 'De acordo com o Capítulo 2 de "Nisto Cremos" (A Trindade), como a Bíblia apresenta a Divindade?',
    options: [
      'Há um só Deus: Pai, Filho e Espírito Santo, uma unidade de três Pessoas coeternas',
      'Três deuses independentes com propósitos distintos no Universo',
      'Uma única pessoa divina que apenas trocou de nome em diferentes épocas históricas',
      'Um Deus supremo (o Pai) e dois seres criados posteriormente para auxiliá-Lo'
    ],
    correctIndex: 0,
    explanation: 'A Crença Fundamental nº 2 ensina que há um só Deus: Pai, Filho e Espírito Santo, uma unidade de três Pessoas coeternas, imortais, onipotentes e oniscientes.',
    reference: 'Nisto Cremos, Cap. 2 • Mateus 28:19; 2 Coríntios 13:13; Deuteronômio 6:4',
    hint: 'Presente na fórmula batismal de Mateus 28:19 e na bênção apostólica.'
  },
  {
    category: 'NISTO_CREMOS_1_10',
    subCategory: 'Cap. 3 • Deus o Pai',
    question: 'Conforme o Capítulo 3 de "Nisto Cremos" (O Pai), como o caráter de Deus o Pai foi revelado de maneira suprema à humanidade?',
    options: [
      'Através de Seu Filho Jesus Cristo ("Quem Me vê a Mim vê o Pai")',
      'Exclusivamente por meio de fenômenos da natureza como trovões e terremotos',
      'Por meio dos filósofos gregos da antiguidade',
      'Apenas no juízo executivo final sem misericórdia'
    ],
    correctIndex: 0,
    explanation: 'As qualidades e poderes manifestos no Filho e no Espírito Santo também são revelações do Pai, que é amoroso, compassivo, justo e santo.',
    reference: 'Nisto Cremos, Cap. 3 • João 14:9; 1 João 4:8; Êxodo 34:6-7',
    hint: 'Jesus respondeu isso a Filipe no Evangelho de João capítulo 14.'
  },
  {
    category: 'NISTO_CREMOS_1_10',
    subCategory: 'Cap. 4 • Deus o Filho',
    question: 'Segundo o Capítulo 4 de "Nisto Cremos" (O Filho), o que afirma a doutrina bíblica sobre a natureza de Jesus Cristo em Sua encarnação?',
    options: [
      'Sendo eternamente verdadeiro Deus, Ele Se tornou também verdadeiro homem, concebido pelo Espírito Santo e nascido da virgem Maria',
      'Ele deixou completamente de ser Deus enquanto esteve na Terra, tornando-se apenas um profeta humano',
      'Ele apenas aparentava ter um corpo físico, mas nunca sofreu dores reais nem tentação',
      'Ele passou a existir somente a partir de Seu nascimento em Belém'
    ],
    correctIndex: 0,
    explanation: 'Jesus Cristo é o Filho eterno de Deus que Se encarnou como Jesus o Cristo, unindo perfeitamente a natureza divina e a natureza humana sem pecado para salvar a humanidade.',
    reference: 'Nisto Cremos, Cap. 4 • João 1:1-3, 14; Filipenses 2:5-11; Hebreus 4:15',
    hint: 'João 1:14 declara: "E o Verbo se fez carne e habitou entre nós."'
  },
  {
    category: 'NISTO_CREMOS_1_10',
    subCategory: 'Cap. 5 • Deus o Espírito Santo',
    question: 'De acordo com o Capítulo 5 de "Nisto Cremos" (O Espírito Santo), qual é a atuação do Espírito Santo na história da salvação?',
    options: [
      'Atuou na Criação, na encarnação e na redenção, inspirou os escritores bíblicos, convence do pecado e distribui dons espirituais à igreja',
      'É apenas uma força impessoal ou energia elétrica sem vontade nem inteligência',
      'Começou a existir somente no dia de Pentecostes em Atos 2',
      'Sua função restringe-se ao Antigo Testamento, sem atuar na igreja cristã'
    ],
    correctIndex: 0,
    explanation: 'Deus o Espírito Eterno é uma Pessoa divina (o Consolador/Parácleto) que desempenhou parte ativa com o Pai e o Filho na Criação, encarnação e redenção.',
    reference: 'Nisto Cremos, Cap. 5 • João 14:16-18; 16:7-13; Atos 1:8; Gênesis 1:2',
    hint: 'Jesus O chamou de "outro Consolador" e "Espírito da verdade".'
  },
  {
    category: 'NISTO_CREMOS_1_10',
    subCategory: 'Cap. 6 • A Criação',
    question: 'O que ensina o Capítulo 6 de "Nisto Cremos" (A Criação) sobre a origem do mundo e da vida na Terra?',
    options: [
      'Deus criou o Universo e, em uma criação recente de seis dias literais, o Senhor fez "os céus e a terra, o mar e tudo o que neles há" e descansou no sétimo dia',
      'A vida surgiu ao acaso através de bilhões de anos de evolução darwinista sem intervenção divina',
      'Os seis dias da criação simbolizam seis eras geológicas de milhões de anos de morte e seleção natural',
      'A Terra foi criada por anjos menores sem a participação da Trindade'
    ],
    correctIndex: 0,
    explanation: 'Deus é o Criador de todas as coisas e revelou nas Escrituras o relato autêntico de Sua atividade criadora em seis dias literais ("tarde e manhã"), instituindo o sábado como memorial eterno.',
    reference: 'Nisto Cremos, Cap. 6 • Gênesis 1-2; Êxodo 20:8-11; Salmos 33:6, 9',
    hint: 'Pela palavra do Senhor foram feitos os céus; Ele falou, e tudo se fez (Salmos 33:6, 9).'
  },
  {
    category: 'NISTO_CREMOS_1_10',
    subCategory: 'Cap. 7 • A Natureza da Humanidade',
    question: 'Segundo o Capítulo 7 de "Nisto Cremos" (A Natureza da Humanidade), como a Bíblia define a constituição do ser humano?',
    options: [
      'Homem e mulher foram feitos à imagem de Deus como uma unidade indivisível de corpo, mente e espírito, dependentes de Deus para a vida',
      'O ser humano possui uma alma naturalmente imortal presa temporariamente em um corpo físico descartável',
      'A humanidade não possui livre-arbítrio nem responsabilidade moral',
      'Após a queda de Adão, os seres humanos perderam totalmente qualquer valor diante de Deus'
    ],
    correctIndex: 0,
    explanation: 'Em Gênesis 2:7, Deus formou o homem do pó da terra e soprou em suas narinas o fôlego de vida, e o homem "foi feito alma vivente" — uma unidade holística e indivisível.',
    reference: 'Nisto Cremos, Cap. 7 • Gênesis 1:26-28; 2:7; Salmos 8:4-8',
    hint: 'Pó da terra + fôlego de vida = alma/ser vivente (Gênesis 2:7).'
  },
  {
    category: 'NISTO_CREMOS_1_10',
    subCategory: 'Cap. 8 • O Grande Conflito',
    question: 'De acordo com o Capítulo 8 de "Nisto Cremos" (O Grande Conflito), qual é o tema central da controvérsia cósmica entre Cristo e Satanás?',
    options: [
      'O caráter de Deus, Sua Lei e Sua soberania sobre o Universo',
      'Uma disputa territorial apenas pelas riquezas minerais do planeta Terra',
      'Um equilíbrio eterno e necessário entre o bem e o mal que nunca terá fim',
      'Uma guerra meramente política entre impérios humanos antigos'
    ],
    correctIndex: 0,
    explanation: 'Toda a humanidade está envolvida em um grande conflito entre Cristo e Satanás quanto ao caráter de Deus, Sua Lei e Sua soberania sobre o Universo, originado no Céu quando um ser criado se tornou Satanás.',
    reference: 'Nisto Cremos, Cap. 8 • Apocalipse 12:4-9; Isaías 14:12-14; Ezequiel 28:12-18',
    hint: 'Começou no Céu com a rebelião de Lúcifer contra o governo de amor e a Lei de Deus.'
  },
  {
    category: 'NISTO_CREMOS_1_10',
    subCategory: 'Cap. 9 • A Vida, Morte e Ressurreição de Cristo',
    question: 'Segundo o Capítulo 9 de "Nisto Cremos", o que a vida sem pecado, a morte expiatória e a ressurreição de Cristo asseguram?',
    options: [
      'A única provisão de expiação para o pecado humano, vindicando o caráter de Deus e garantindo a vitória final sobre o mal e a morte',
      'Apenas um exemplo moral inspirador, sem necessidade de sacrifício substitutivo',
      'A abolição completa da justiça divina sem perdão dos pecados',
      'Uma salvação automática apenas para os descendentes biológicos de Abraão'
    ],
    correctIndex: 0,
    explanation: 'Na vida de Cristo de perfeita obediência à vontade de Deus, em Seu sofrimento, morte e ressurreição, Deus proveu o único meio de expiação para o pecado humano, para que os que pela fé aceitam essa expiação tenham vida eterna.',
    reference: 'Nisto Cremos, Cap. 9 • João 3:16; Romanos 5:8-10; 1 Coríntios 15:3-4, 20-22',
    hint: 'Cristo morreu por nossos pecados e ressuscitou ao terceiro dia segundo as Escrituras.'
  },
  {
    category: 'NISTO_CREMOS_1_10',
    subCategory: 'Cap. 10 • A Experiência da Salvação',
    question: 'No Capítulo 10 de "Nisto Cremos" (A Experiência da Salvação), como o pecador arrependido recebe a justificação e a santificação?',
    options: [
      'Pela graça de Deus mediante a fé no sacrifício de Jesus, sendo justificado gratuitamente e transformado pelo Espírito Santo para viver uma vida santa',
      'Pelo acúmulo de méritos humanos, penitências físicas e pagamento de indulgências',
      'Por meio do conhecimento secreto reservado a poucos iniciados',
      'Sem necessidade de arrependimento nem de novo nascimento espiritual'
    ],
    correctIndex: 0,
    explanation: 'Guiados pelo Espírito Santo, reconhecemos nossa pecaminosidade, nos arrependemos e exercemos fé em Jesus como Senhor e Cristo, como Substituto e Exemplo.',
    reference: 'Nisto Cremos, Cap. 10 • Efésios 2:8-10; Romanos 3:24; Tito 3:5-7',
    hint: '"Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus" (Efésios 2:8).'
  }
];

// ============================================================================
// LIVRO "NISTO CREMOS" — CAPÍTULOS 11 AO 20 (Doutrinas da Igreja e Vida Cristã)
// ============================================================================
export const NISTO_CREMOS_11_20_QUESTIONS: Omit<QuizQuestionItem, 'id'>[] = [
  {
    category: 'NISTO_CREMOS_11_20',
    subCategory: 'Cap. 11 • Crescer em Cristo',
    question: 'Segundo o Capítulo 11 de "Nisto Cremos" (Crescer em Cristo), por quais meios práticos o cristão cresce diariamente em maturidade espiritual e vitória sobre as forças do mal?',
    options: [
      'Comunhão diária em oração, estudo da Palavra, meditação, louvor, reunião para adoração e participação na missão da igreja',
      'Isolamento completo da sociedade em cavernas ou mosteiros',
      'Confiança na própria força humana sem depender do Espírito Santo',
      'Apenas comparecendo à igreja uma vez por ano sem vida devocional'
    ],
    correctIndex: 0,
    explanation: 'Por Sua morte na cruz, Jesus triunfou sobre as forças do mal, e enquanto permanecemos Nele pela oração, estudo da Bíblia, adoração e serviço amoroso, crescemos na semelhança de Seu caráter.',
    reference: 'Nisto Cremos, Cap. 11 • Colossenses 2:6, 14-15; 2 Pedro 3:18; Filipenses 3:12-14',
    hint: '"Antes, crescei na graça e no conhecimento de nosso Senhor e Salvador Jesus Cristo" (2 Pedro 3:18).'
  },
  {
    category: 'NISTO_CREMOS_11_20',
    subCategory: 'Cap. 12 • A Igreja',
    question: 'Conforme o Capítulo 12 de "Nisto Cremos" (A Igreja), quem é a Cabeça da Igreja e quais metáforas bíblicas descrevem a comunidade dos crentes?',
    options: [
      'Cristo é a Cabeça da Igreja, que é descrita como o Corpo de Cristo, a Família de Deus e a Noiva pela qual Ele morreu',
      'Um líder político terreno é o cabeça supremo e infalível da igreja',
      'A igreja é apenas o prédio de alvenaria e madeira onde ocorrem reuniões',
      'A igreja não possui organização nem missão no mundo'
    ],
    correctIndex: 0,
    explanation: 'A igreja é a comunidade de crentes que confessam a Jesus Cristo como Senhor e Salvador; ela deriva sua autoridade de Cristo, que é a Palavra encarnada, e das Escrituras.',
    reference: 'Nisto Cremos, Cap. 12 • Efésios 1:22-23; 5:23-27; 1 Coríntios 12:12-14',
    hint: 'Em Efésios, Paulo chama a igreja de "o corpo de Cristo" e a "noiva" de Cristo.'
  },
  {
    category: 'NISTO_CREMOS_11_20',
    subCategory: 'Cap. 13 • O Remanescente e Sua Missão',
    question: 'De acordo com o Capítulo 13 de "Nisto Cremos", quais são as características proféticas da Igreja Remanescente dos últimos dias e qual é a sua missão especial?',
    options: [
      'Guardar os mandamentos de Deus e ter a fé de Jesus (Apoc. 12:17; 14:12), proclamando as Três Mensagens Angélicas de Apocalipse 14:6-12',
      'Buscar alianças políticas para estabelecer um império militar na Terra',
      'Abolir os Dez Mandamentos e ocultar as profecias de Daniel e Apocalipse',
      'Limitar a pregação do evangelho a apenas um país ou idioma'
    ],
    correctIndex: 0,
    explanation: 'Nos últimos dias, um tempo de ampla apostasia, um remanescente tem sido chamado para guardar os mandamentos de Deus e a fé de Jesus, anunciando a chegada da hora do juízo e a iminente volta de Cristo.',
    reference: 'Nisto Cremos, Cap. 13 • Apocalipse 12:17; 14:6-12; 18:1-4',
    hint: 'Apocalipse 12:17 e 14:6-12 descrevem a identidade e a mensagem do remanescente.'
  },
  {
    category: 'NISTO_CREMOS_11_20',
    subCategory: 'Cap. 14 • Unidade no Corpo de Cristo',
    question: 'Segundo o Capítulo 14 de "Nisto Cremos" (Unidade no Corpo de Cristo), como a igreja deve tratar as diferenças de raça, cultura, nacionalidade e posição social?',
    options: [
      'Em Cristo somos uma nova criação e todos somos iguais, sem distinções divisórias de raça, cultura, instrução, nacionalidade, sexo ou posição social',
      'Separando as congregações em castas sociais superiores e inferiores',
      'Exigindo que todos abandonem seu idioma natal para ser aceitos por Deus',
      'Priorizando os membros mais ricos nas decisões espirituais da igreja'
    ],
    correctIndex: 0,
    explanation: 'A igreja é um corpo com muitos membros, chamados de toda nação, tribo, língua e povo. Em Cristo somos todos um, servindo e sendo servidos sem parcialidade.',
    reference: 'Nisto Cremos, Cap. 14 • Gálatas 3:27-29; João 17:20-23; Efésios 4:1-6',
    hint: 'Baseia-se na oração sacerdotal de Jesus ("para que todos sejam um" - João 17:21) e Gálatas 3:28.'
  },
  {
    category: 'NISTO_CREMOS_11_20',
    subCategory: 'Cap. 15 • O Batismo',
    question: 'O que ensina o Capítulo 15 de "Nisto Cremos" sobre o modo bíblico do Batismo e o seu significado espiritual?',
    options: [
      'É realizado por imersão na água, simbolizando a união com Cristo em Sua morte, sepultamento e ressurreição para uma nova vida',
      'É feito por aspersão em recém-nascidos sem necessidade de instrução bíblica ou fé pessoal',
      'É opcional e desnecessário para aqueles que desejam seguir a Cristo',
      'Deve ser repetido todos os meses como ritual de purificação física'
    ],
    correctIndex: 0,
    explanation: 'Pelo batismo por imersão confessamos nossa fé na morte e ressurreição de Jesus Cristo e testemunhamos nossa morte para o pecado e nosso propósito de andar em novidade de vida.',
    reference: 'Nisto Cremos, Cap. 15 • Romanos 6:1-6; Mateus 3:13-17; Atos 2:38',
    hint: 'Romanos 6:4 explica o sepultamento com Cristo pelo batismo na morte.'
  },
  {
    category: 'NISTO_CREMOS_11_20',
    subCategory: 'Cap. 16 • A Ceia do Senhor',
    question: 'Conforme o Capítulo 16 de "Nisto Cremos" (A Ceia do Senhor), qual cerimônia instituída por Jesus precede a participação nos emblemas do pão sem fermento e do fruto da vide (suco de uva)?',
    options: [
      'A cerimônia do Lava-pés (Ordenança da Humildade), segundo o exemplo de Cristo em João 13',
      'O sacrifício de cordeiros no pátio da igreja',
      'Uma procissão pública com incenso e velas',
      'O pagamento de uma taxa obrigatória de ingresso no templo'
    ],
    correctIndex: 0,
    explanation: 'A preparação para a Ceia inclui o exame de consciência, o arrependimento e a confissão. O Mestre instituiu a cerimônia do lava-pés para representar renovada purificação e disposição de servir uns aos outros em humildade.',
    reference: 'Nisto Cremos, Cap. 16 • João 13:1-17; 1 Coríntios 11:23-30',
    hint: 'Jesus cingiu-Se com uma toalha e disse: "Ora, se Eu, Senhor e Mestre, vos lavei os pés, vós deveis também lavar os pés uns aos outros."'
  },
  {
    category: 'NISTO_CREMOS_11_20',
    subCategory: 'Cap. 17 • Dons e Ministérios Espirituais',
    question: 'Segundo o Capítulo 17 de "Nisto Cremos", com que finalidade o Espírito Santo concede dons espirituais aos membros da igreja?',
    options: [
      'Para o aperfeiçoamento dos santos, o desempenho de um ministério de amor para o bem comum da igreja e da humanidade',
      'Para promover exaltação pessoal, orgulho espiritual e competição entre os membros',
      'Apenas para os apóstolos do primeiro século, tendo cessado completamente hoje',
      'Para substituir o estudo da Bíblia e a obediência aos mandamentos'
    ],
    correctIndex: 0,
    explanation: 'Deus concede a todos os membros de Sua igreja, em todas as épocas, dons espirituais que cada membro deve empregar em amoroso ministério para a edificação da igreja e o cumprimento de sua missão.',
    reference: 'Nisto Cremos, Cap. 17 • 1 Coríntios 12:4-11; Efésios 4:11-16; Romanos 12:4-8',
    hint: 'São distribuídos pelo Espírito "como lhe apraz", visando a edificação do Corpo de Cristo.'
  },
  {
    category: 'NISTO_CREMOS_11_20',
    subCategory: 'Cap. 18 • O Dom de Profecia',
    question: 'De acordo com o Capítulo 18 de "Nisto Cremos" (O Dom de Profecia), como esse dom se manifestou na história da Igreja Remanescente?',
    options: [
      'No ministério de Ellen G. White, cujos escritos falam com autoridade profética para confortar, orientar, instruir e corrigir a igreja, exaltando sempre a Bíblia como regra suprema',
      'Por meio de adivinhos e horóscopos consultados pelos cristãos',
      'Substituindo a Bíblia Sagrada por um terceiro testamento superior às Escrituras',
      'Exclusivamente nos profetas anteriores a João Batista, sem manifestação nos últimos dias'
    ],
    correctIndex: 0,
    explanation: 'As Escrituras dão testemunho de que um dos dons do Espírito Santo é a profecia. Esse dom é uma característica da igreja remanescente (Apocalipse 12:17; 19:10) e se manifestou no ministério de Ellen G. White.',
    reference: 'Nisto Cremos, Cap. 18 • Apocalipse 12:17; 19:10; Joel 2:28-29; 1 Tessalonicenses 5:20-21',
    hint: 'Apocalipse 19:10 declara que "o testemunho de Jesus é o espírito de profecia".'
  },
  {
    category: 'NISTO_CREMOS_11_20',
    subCategory: 'Cap. 19 • A Lei de Deus',
    question: 'O que afirma o Capítulo 19 de "Nisto Cremos" a respeito dos grandes princípios da Lei de Deus expressos nos Dez Mandamentos?',
    options: [
      'São exemplificados na vida de Cristo, expressam o amor, a vontade e os propósitos de Deus e são obrigatórios para todas as pessoas, em todas as épocas',
      'Foram abolidos na cruz para que o cristão não precise mais obedecer a nenhum mandamento moral',
      'São o meio pelo qual o pecador conquista a salvação por suas próprias obras sem precisar da graça',
      'Aplicavam-se exclusivamente ao povo hebreu durante a peregrinação no deserto do Sinai'
    ],
    correctIndex: 0,
    explanation: 'A salvação é totalmente pela graça e não pelas obras, mas seu fruto é a obediência aos Mandamentos (João 14:15; Romanos 3:31). Os Dez Mandamentos são imutáveis e eternos.',
    reference: 'Nisto Cremos, Cap. 19 • Êxodo 20:1-17; Mateus 5:17-19; João 14:15; Romanos 3:31',
    hint: '"Anulamos, pois, a lei pela fé? De maneira nenhuma! Antes, confirmamos a lei" (Romanos 3:31).'
  },
  {
    category: 'NISTO_CREMOS_11_20',
    subCategory: 'Cap. 20 • O Sábado',
    question: 'Segundo o Capítulo 20 de "Nisto Cremos" (O Sábado), quando começa e termina a observância bíblica do santo Sábado e o que ele representa?',
    options: [
      'De pôr do sol a pôr do sol (sexta-feira ao pôr do sol até sábado ao pôr do sol), sendo memorial da Criação e símbolo de redenção e santificação em Cristo',
      'Da meia-noite de sexta-feira até a meia-noite de sábado, apenas como feriado comercial',
      'Do nascer do sol de domingo até o meio-dia de domingo',
      'Em qualquer dia da semana escolhido individualmente segundo a conveniência de cada pessoa'
    ],
    correctIndex: 0,
    explanation: 'O bondoso Criador, após os seis dias da Criação, descansou no sétimo dia e instituiu o sábado para todas as pessoas como memorial da Criação e sinal eterno de Seu concerto (Levítico 23:32; Ezequiel 20:12, 20).',
    reference: 'Nisto Cremos, Cap. 20 • Gênesis 2:1-3; Êxodo 20:8-11; Levítico 23:32; Marcos 2:27-28',
    hint: 'Conforme Levítico 23:32, o dia bíblico é celebrado "duma tarde a outra tarde" (pôr do sol a pôr do sol).'
  }
];

// ============================================================================
// LIVRO "NISTO CREMOS" — CAPÍTULOS 21 AO 28 (Vida Cristã e Eventos Finais)
// ============================================================================
export const NISTO_CREMOS_21_28_QUESTIONS: Omit<QuizQuestionItem, 'id'>[] = [
  {
    category: 'NISTO_CREMOS_21_28',
    subCategory: 'Cap. 21 • Mordomia',
    question: 'Segundo o Capítulo 21 de "Nisto Cremos" (Mordomia), quem somos nós em relação a Deus e como reconhecemos Sua propriedade sobre tudo?',
    options: [
      'Somos mordomos de Deus, a quem Ele confiou tempo, oportunidades, capacidades, posses e as bênçãos da Terra, reconhecendo Seu senhorio pela devolução fiel dos dízimos e entrega de ofertas',
      'Somos donos absolutos de nossa vida e bens, sem prestar contas a ninguém',
      'A mordomia refere-se apenas ao dinheiro, não tendo relação com o uso do tempo, dos talentos ou do cuidado com a natureza',
      'Os dízimos destinam-se ao enriquecimento pessoal de quem os recolhe, sem relação com a pregação do evangelho'
    ],
    correctIndex: 0,
    explanation: 'Mordomia cristã abrange toda a vida: o cuidado responsável da Terra, o uso sábio do tempo, dos talentos, do corpo e a fidelidade financeira nos dízimos e ofertas para o sustento do ministério e difusão do evangelho.',
    reference: 'Nisto Cremos, Cap. 21 • Malaquias 3:8-12; 1 Coríntios 4:1-2; Salmos 24:1',
    hint: '"Do Senhor é a terra e a sua plenitude" (Salmos 24:1).'
  },
  {
    category: 'NISTO_CREMOS_21_28',
    subCategory: 'Cap. 22 • Conduta Cristã',
    question: 'De acordo com o Capítulo 22 de "Nisto Cremos" (Conduta Cristã), por que o cristão cuida da saúde do corpo, abstendo-se de alimentos impuros, bebidas alcoólicas, fumo e drogas?',
    options: [
      'Porque nosso corpo é o templo do Espírito Santo, e somos chamados a glorificar a Deus em nosso corpo, mente e escolhas culturais e recreativas',
      'Para obter salvação pelas obras da dieta alimentar',
      'Apenas por estética social, sem relação com a espiritualidade ou discernimento mental',
      'Porque a Bíblia proíbe qualquer tipo de alegria ou recreação sadia'
    ],
    correctIndex: 0,
    explanation: 'Somos chamados a ser um povo piedoso que pensa, sente e age de acordo com os princípios bíblicos em todas as facetas da vida pessoal e social, cuidando do templo do Espírito Santo.',
    reference: 'Nisto Cremos, Cap. 22 • 1 Coríntios 6:19-20; 10:31; Filipenses 4:8; Romanos 12:1-2',
    hint: '"Portanto, quer comais, quer bebais ou façais outra qualquer coisa, fazei tudo para a glória de Deus" (1 Cor. 10:31).'
  },
  {
    category: 'NISTO_CREMOS_21_28',
    subCategory: 'Cap. 23 • O Casamento e a Família',
    question: 'O que ensina o Capítulo 23 de "Nisto Cremos" sobre a origem e a natureza do casamento e da família?',
    options: [
      'O casamento foi divinamente estabelecido no Éden e confirmado por Jesus como união vitalícia e amorosa entre um homem e uma mulher, sendo a família o núcleo de educação espiritual e afeto',
      'O casamento foi inventado pelo Estado moderno apenas como contrato financeiro temporário',
      'Os pais não têm responsabilidade de ensinar as Escrituras aos filhos em casa',
      'O Evangelho de Cristo desvaloriza o relacionamento entre pais e filhos'
    ],
    correctIndex: 0,
    explanation: 'Estabelecido por Deus no Éden (Gênesis 2:18-24) e confirmado por Jesus (Mateus 19:4-6), o casamento é um compromisso mútuo para toda a vida, e os pais devem criar os filhos para amarem e obedecerem ao Senhor (Deut. 6:5-9).',
    reference: 'Nisto Cremos, Cap. 23 • Gênesis 2:18-25; Efésios 5:21-33; Deuteronômio 6:5-9; Malaquias 4:5-6',
    hint: 'Foi uma das duas instituições estabelecidas por Deus no próprio Jardim do Éden (junto com o Sábado).'
  },
  {
    category: 'NISTO_CREMOS_21_28',
    subCategory: 'Cap. 24 • O Ministério de Cristo no Santuário Celestial',
    question: 'Segundo o Capítulo 24 de "Nisto Cremos", em que ano começou a segunda e última fase do ministério expiatório de Cristo no lugar santíssimo do santuário celestial (o Juízo Investigativo)?',
    options: [
      'Em 1844, ao término do período profético das 2.300 tardes e manhãs de Daniel 8:14',
      'No ano 31 d.C., imediatamente no dia da crucificação',
      'No ano 70 d.C., durante a destruição do templo de Jerusalém pelos romanos',
      'No ano 1950, com a organização mundial dos clubes de jovens'
    ],
    correctIndex: 0,
    explanation: 'Há um santuário no Céu, o verdadeiro tabernáculo que o Senhor erigiu (Hebreus 8:1-2). Em 1844, ao fim dos 2.300 anos proféticos de Daniel 8:14, Cristo entrou na segunda fase de Seu ministério para purificar o santuário celestial.',
    reference: 'Nisto Cremos, Cap. 24 • Daniel 7:9-10; 8:14; Hebreus 8:1-5; Levítico 16',
    hint: '"Até duas mil e trezentas tardes e manhãs; e o santuário será purificado" (Daniel 8:14).'
  },
  {
    category: 'NISTO_CREMOS_21_28',
    subCategory: 'Cap. 25 • A Segunda Vinda de Cristo',
    question: 'Como o Capítulo 25 de "Nisto Cremos" descreve a Segunda Vinda de Cristo ("a bendita esperança da igreja")?',
    options: [
      'A vinda do Salvador será literal, pessoal, visível e de alcance mundial ("todo olho O verá")',
      'Será um evento secreto e invisível percebido apenas no coração dos crentes',
      'Cristo já voltou espiritualmente no século XIX e não haverá retorno visível nas nuvens',
      'Acontecerá somente depois que a humanidade converter 100% do planeta em mil anos de paz política'
    ],
    correctIndex: 0,
    explanation: 'A segunda vinda de Cristo é a bendita esperança da igreja, o grande clímax do evangelho. Quando Ele voltar, os justos mortos serão ressuscitados e, juntamente com os justos vivos, serão glorificados e levados para o Céu.',
    reference: 'Nisto Cremos, Cap. 25 • Tito 2:13; Atos 1:9-11; Apocalipse 1:7; 1 Tessalonicenses 4:16-17',
    hint: 'Apocalipse 1:7 declara: "Eis que vem com as nuvens, e todo olho O verá."'
  },
  {
    category: 'NISTO_CREMOS_21_28',
    subCategory: 'Cap. 26 • Morte e Ressurreição',
    question: 'Segundo o Capítulo 26 de "Nisto Cremos" (Morte e Ressurreição), qual é o estado dos mortos até o dia da ressurreição?',
    options: [
      'A morte é um estado de inconsciência ("sono") para todas as pessoas; os mortos não sabem coisa alguma até a ressurreição',
      'No instante da morte, as almas sobem imediatamente para o Céu ou descem para um purgatório consciente',
      'Os mortos podem se comunicar com os vivos através de médiuns e sessões espíritas',
      'A alma reencarna sucessivas vezes em outros corpos na Terra'
    ],
    correctIndex: 0,
    explanation: 'O salário do pecado é a morte, mas Deus, o único que é imortal, concederá vida eterna a Seus remidos. Até aquele dia, a morte é um sono inconsciente (Eclesiastes 9:5-6; João 11:11-14).',
    reference: 'Nisto Cremos, Cap. 26 • Eclesiastes 9:5-6, 10; João 11:11-14; 1 Tessalonicenses 4:13-17',
    hint: 'Jesus comparou a morte de Lázaro a um "sono" (João 11:11) e Eclesiastes 9:5 diz que "os mortos não sabem coisa nenhuma".'
  },
  {
    category: 'NISTO_CREMOS_21_28',
    subCategory: 'Cap. 27 • O Milênio e o Fim do Pecado',
    question: 'De acordo com o Capítulo 27 de "Nisto Cremos", onde estarão os justos redimidos durante os mil anos (o Milênio de Apocalipse 20) e em que condição estará a Terra?',
    options: [
      'Os justos reinarão com Cristo no Céu durante os mil anos, enquanto a Terra ficará desolada, sem habitantes humanos vivos, com Satanás e seus anjos presos às circunstâncias',
      'Os justos passarão os mil anos construindo cidades na Terra antiga junto com as nações ímpias',
      'Satanás estará no Céu durante o milênio tentando os salvos',
      'Durante os mil anos haverá uma segunda oportunidade de salvação para os que rejeitaram a Cristo'
    ],
    correctIndex: 0,
    explanation: 'O milênio é o reinado de mil anos de Cristo com Seus santos no Céu, entre a primeira e a segunda ressurreição. Ao fim dos mil anos, a Cidade Santa descerá à Terra, ocorrerá o juízo final e o fogo de Deus purificará a Terra, erradicando para sempre o pecado e os pecadores.',
    reference: 'Nisto Cremos, Cap. 27 • Apocalipse 20:1-15; 1 Coríntios 6:2-3; Jeremias 4:23-26; Malaquias 4:1',
    hint: 'Durante os mil anos no Céu, os santos participarão do juízo de revisão (1 Coríntios 6:2-3; Apocalipse 20:4).'
  },
  {
    category: 'NISTO_CREMOS_21_28',
    subCategory: 'Cap. 28 • A Nova Terra',
    question: 'Como o Capítulo 28 de "Nisto Cremos" (A Nova Terra) encerra as 28 Crenças Fundamentais ao descrever o lar eterno dos remidos?',
    options: [
      'Na Nova Terra, em que habita a justiça, Deus proverá um lar eterno para os remidos; não haverá mais morte, pranto, clamor nem dor, e o grande conflito estará encerrado para sempre',
      'Os salvos viverão flutuando no espaço sem mundo físico nem atividades criativas',
      'O pecado voltará a surgir periodicamente a cada milhão de anos',
      'Deus viverá distante dos redimidos, em outra galáxia inacessível'
    ],
    correctIndex: 0,
    explanation: 'Deus fará novas todas as coisas e habitará pessoalmente com Seu povo (Apocalipse 21:1-5). O pecado e os pecadores não mais existirão, e o Universo inteiro declarará que Deus é amor (Naum 1:9; 1 João 4:8).',
    reference: 'Nisto Cremos, Cap. 28 • Apocalipse 21:1-5; 22:1-5; 2 Pedro 3:13; Isaías 65:17-25',
    hint: '"E Deus limpará de seus olhos toda lágrima, e não haverá mais morte, nem pranto, nem clamor, nem dor" (Apocalipse 21:4).'
  }
];

// ============================================================================
// MANUAL ADMINISTRATIVO DOS DESBRAVADORES (Organização, Diretoria, Unidades, Classes, Finanças e Eventos)
// ============================================================================
export const MANUAL_ADMINISTRATIVO_DBV_QUESTIONS: Omit<QuizQuestionItem, 'id'>[] = [
  {
    category: 'MANUAL_ADMINISTRATIVO',
    subCategory: 'Filosofia e Faixa Etária',
    question: 'Segundo o Manual Administrativo do Clube de Desbravadores, qual é a faixa etária oficial atendida pelo Clube de Desbravadores?',
    options: [
      'Juvenis e adolescentes de 10 a 15 anos de idade (podendo ingressar no ano em que completam 10 anos)',
      'Crianças de 6 a 9 anos de idade',
      'Jovens adultos de 16 a 30 anos exclusivamente',
      'Qualquer idade a partir dos 4 anos sem separação com os Aventureiros'
    ],
    correctIndex: 0,
    explanation: 'O Clube de Desbravadores é um programa oficial da Igreja Adventista do Sétimo Dia voltado especificamente para meninos e meninas de 10 a 15 anos, desenvolvendo de forma harmoniosa as faculdades físicas, mentais, sociais e espirituais.',
    reference: 'Manual Administrativo dos Desbravadores • Cap. 1 e 2',
    hint: 'Compreende as 6 classes regulares, dos 10 aos 15 anos.'
  },
  {
    category: 'MANUAL_ADMINISTRATIVO',
    subCategory: 'Eleição e Diretoria',
    question: 'De acordo com o Manual Administrativo e o Manual da Igreja, quem elege o Diretor(a) do Clube de Desbravadores da igreja local?',
    options: [
      'A Comissão de Nomeações da Igreja local (com aprovação da igreja em reunião regular)',
      'Exclusivamente os capitães das unidades por votação secreta no acampamento',
      'O próprio diretor anterior por indicação particular sem passar pela igreja',
      'A prefeitura municipal da cidade onde o clube se reúne'
    ],
    correctIndex: 0,
    explanation: 'O Diretor do Clube de Desbravadores é um oficial da igreja eleito pela Comissão de Nomeações da igreja local e membro nato da Comissão da Igreja e do Ministério Jovem.',
    reference: 'Manual Administrativo • Administração e Liderança do Clube',
    hint: 'Segue o mesmo processo oficial dos demais diretores de departamentos da igreja local.'
  },
  {
    category: 'MANUAL_ADMINISTRATIVO',
    subCategory: 'Comissões do Clube',
    question: 'Segundo o Manual Administrativo, quem compõe a Comissão Executiva do Clube de Desbravadores?',
    options: [
      'Diretor(a), Diretores Associados, Secretário(a), Tesoureiro(a), Capelão e Pastor Distrital / Ancião Conselheiro',
      'Apenas os desbravadores de 10 anos recém-admitidos em lenço',
      'Somente os pais que não possuem cargos no clube',
      'Apenas o Coordenador Regional e o Departamental da Associação'
    ],
    correctIndex: 0,
    explanation: 'A Comissão Executiva trata do planejamento macro, finanças e decisões administrativas, enquanto a Comissão Regular (Diretoria + Conselheiros + Instrutores) planeja e avalia a execução semanal das unidades e classes.',
    reference: 'Manual Administrativo • Comissões do Clube',
    hint: 'Reúne o núcleo diretivo central do clube e a liderança pastoral.'
  },
  {
    category: 'MANUAL_ADMINISTRATIVO',
    subCategory: 'Sistema de Unidades',
    question: 'No Manual Administrativo, qual é o papel do Conselheiro(a) de Unidade dentro do Clube de Desbravadores?',
    options: [
      'É o líder adulto (mínimo 16/18 anos) que acompanha de perto os 6 a 8 desbravadores da unidade, sendo exemplo espiritual, amigo, mentor, visitando os lares e acompanhando as classes',
      'Apenas cobrar mensalidades na porta da reunião e aplicar punições físicas',
      'Atuar somente uma vez por ano no dia da investidura',
      'Substituir o pastor na realização de casamentos e batismos'
    ],
    correctIndex: 0,
    explanation: 'O Conselheiro é a peça-chave do Clube de Desbravadores, pois convive diretamente com os juvenis da unidade, conhece suas famílias, lidera o cantinho da unidade e acompanha seu crescimento cristão.',
    reference: 'Manual Administrativo • O Conselheiro de Unidade',
    hint: 'Lidera diretamente o "Cantinho da Unidade" e acompanha a vida de cada desbravador.'
  },
  {
    category: 'MANUAL_ADMINISTRATIVO',
    subCategory: 'Cargos da Unidade',
    question: 'Segundo o Manual Administrativo, quais são os dois cargos exercidos pelos próprios desbravadores (10 a 15 anos) dentro de cada Unidade e qual é o tempo recomendado de mandato?',
    options: [
      'Capitão(ã) e Secretário(a) da Unidade, com rodízio recomendado a cada 3 a 6 meses (ou trimestre/semestre) para treinar novos líderes',
      'Diretor Geral e Tesoureiro da Igreja, com mandato vitalício',
      'Conselheiro Sênior e Regional, eleitos por 10 anos',
      'Ancião e Diácono da Unidade, sem troca de funções'
    ],
    correctIndex: 0,
    explanation: 'O Capitão porta o banderim e auxilia na liderança e ordem da unidade; o Secretário faz a chamada, registra pontuações e substitui o capitão quando ausente. O rodízio permite que todos desenvolvam liderança.',
    reference: 'Manual Administrativo • Cargos da Unidade (Capitão e Secretário)',
    hint: 'Um conduz o banderim da unidade e o outro cuida da frequência e relatórios do cantinho.'
  },
  {
    category: 'MANUAL_ADMINISTRATIVO',
    subCategory: 'Cerimônia de Admissão em Lenço',
    question: 'De acordo com o Manual Administrativo, o que o candidato precisa cumprir para ser recebido oficialmente na Cerimônia de Admissão em Lenço?',
    options: [
      'Estar frequentando regularmente o clube (período probatório), memorizar e compreender o Voto e a Lei do Desbravador, conhecer o Hino, os emblemas e a história básica do clube',
      'Ter concluído todas as 6 classes regulares e o Mestrado em Vida Campestre',
      'Ter no mínimo 18 anos completos e ser membro da diretoria há 3 anos',
      'Apenas comprar o uniforme de gala sem conhecer os ideais do clube'
    ],
    correctIndex: 0,
    explanation: 'A Admissão em Lenço marca o ingresso oficial do juvenil na família mundial dos Desbravadores, após demonstrar compromisso com os ideais (Voto, Lei, Hino) e frequência regular.',
    reference: 'Manual Administrativo • Cerimônias Oficiais (Admissão em Lenço)',
    hint: 'É a primeira grande cerimônia do desbravador ao receber o lenço amarelo.'
  },
  {
    category: 'MANUAL_ADMINISTRATIVO',
    subCategory: 'Finanças e Patrimônio',
    question: 'Segundo o Manual Administrativo, como devem ser geridos os recursos financeiros e o patrimônio (barracas, equipamentos) do Clube de Desbravadores?',
    options: [
      'Todo movimento financeiro do clube deve passar pela Tesouraria da Igreja local (conta específica do clube), com recibos e relatórios transparentes, e todo patrimônio pertence à igreja local',
      'O dinheiro do clube deve ser guardado na conta pessoal privada do diretor sem prestação de contas à igreja',
      'O clube não pode ter tesoureiro nem livro de patrimônio',
      'Caso o diretor mude de cidade, ele leva consigo as barracas e os fundos financeiros do clube'
    ],
    correctIndex: 0,
    explanation: 'O Tesoureiro do Clube trabalha em estreita harmonia com o Tesoureiro da Igreja local; todas as receitas e despesas são auditáveis pela igreja, e os bens adquiridos pertencem ao patrimônio da congregação.',
    reference: 'Manual Administrativo • Finanças, Orçamento e Patrimônio do Clube',
    hint: 'O clube é um ministério oficial da igreja local e opera integrado à tesouraria da igreja.'
  },
  {
    category: 'MANUAL_ADMINISTRATIVO',
    subCategory: 'Seguro Anual e SGC',
    question: 'O que determina o Manual Administrativo sobre o Seguro Anual Obrigatório e o cadastro no Sistema de Gerenciamento de Clubes (SGC) para saídas, acampamentos e Camporis?',
    options: [
      'Todo membro e líder deve estar devidamente cadastrado e com o Seguro Anual ativo no SGC, além de possuir autorização expressa assinada pelos pais/responsáveis e aprovação da Comissão da Igreja',
      'O seguro é necessário apenas para viagens internacionais fora da América do Sul',
      'Menores de 15 anos podem viajar e acampar sem autorização dos pais desde que o capitão permita',
      'O clube pode realizar acampamentos secretos sem comunicar o pastor nem a comissão da igreja'
    ],
    correctIndex: 0,
    explanation: 'A segurança dos juvenis é prioridade absoluta: nenhuma atividade externa ou acampamento pode ocorrer sem aprovação da Comissão da Igreja, autorização assinada pelos pais, ficha médica atualizada e Seguro Anual ativo no SGC.',
    reference: 'Manual Administrativo • Segurança, Seguro Anual e Acampamentos',
    hint: 'Envolve o SGC, Seguro Anual, Ficha Médica e Autorização dos Pais.'
  },
  {
    category: 'MANUAL_ADMINISTRATIVO',
    subCategory: 'Ordem Unida e Banderim',
    question: 'Conforme o Manual Administrativo e o Regulamento de Uniformes (RUD), quais são as medidas oficiais do Banderim de Unidade e da Bandeira Oficial dos Desbravadores?',
    options: [
      'Banderim: 36 cm de altura no mastro por 55 cm de comprimento (estreitando na ponta), em mastro de 1,70 m a 2,00 m; Bandeira Oficial: 90 cm x 135 cm dividida em 4 partes (azul e branca) com o emblema D1 no centro',
      'Banderim quadrado de 1 metro por 1 metro na cor preta; Bandeira redonda toda vermelha',
      'Não existem medidas nem cores padronizadas para a bandeira e o banderim',
      'O banderim deve conter apenas propagandas comerciais e nenhuma insígnia do clube'
    ],
    correctIndex: 0,
    explanation: 'A Bandeira Oficial dos Desbravadores (criada por Henry Bergh e Helen Hobbs em 1948) mede 90 x 135 cm, com quadrantes superior esquerdo e inferior direito em azul royal e os outros dois em branco, trazendo o emblema D1 ao centro e o nome do clube bordado no quadrante inferior direito.',
    reference: 'Manual Administrativo • Bandeira Oficial e Banderim de Unidade',
    hint: 'A bandeira oficial é dividida em 4 retângulos (azul e branco) com o triângulo D1 no centro.'
  },
  {
    category: 'MANUAL_ADMINISTRATIVO',
    subCategory: 'Disciplina Cristã no Clube',
    question: 'Segundo o Manual Administrativo, qual é o objetivo e o princípio orientador da disciplina no Clube de Desbravadores?',
    options: [
      'A disciplina deve ser redentiva, preventiva e educativa, baseada no amor cristão, no diálogo e no domínio próprio — jamais utilizando castigos físicos, humilhações ou exercícios punitivos',
      'Aplicar flexões físicas exaustivas e exposição pública para corrigir erros',
      'Expulsar sumariamente qualquer juvenil na primeira falha sem conversar com os pais',
      'Não ter nenhuma regra de convivência ou horário nas reuniões'
    ],
    correctIndex: 0,
    explanation: 'O Manual Administrativo proíbe terminantemente qualquer castigo físico, moral ou exercício físico punitivo ("pagar flexões"). A verdadeira disciplina busca conquistar o coração do juvenil para o autogoverno e para Cristo.',
    reference: 'Manual Administrativo • Princípios de Disciplina no Clube',
    hint: 'A disciplina adventista é sempre redentora e proíbe castigos físicos ou constrangimento.'
  }
];
