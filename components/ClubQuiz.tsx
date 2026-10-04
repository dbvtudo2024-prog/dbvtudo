import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ClubType, Especialidade } from '../types';
import { fetchEspecialidades, resolveGeminiApiKey } from '../services/supabaseService';
import {
  Trophy, Timer, Zap, BookOpen, Award, Shield, Sparkles, Check, X,
  RefreshCw, Play, HelpCircle, ChevronRight, RotateCcw, Flame,
  Lightbulb, Divide, Clock, Star, CheckCircle2, AlertCircle, Search, FileText, Book
} from 'lucide-react';
import {
  NISTO_CREMOS_1_10_QUESTIONS,
  NISTO_CREMOS_11_20_QUESTIONS,
  NISTO_CREMOS_21_28_QUESTIONS,
  MANUAL_ADMINISTRATIVO_DBV_QUESTIONS
} from '../services/quizQuestionsData';

export type QuizCategoryMode =
  | 'HISTORIA_MANUAL'
  | 'MANUAL_ADMINISTRATIVO'
  | 'BOM_DE_BIBLIA'
  | 'NISTO_CREMOS_1_10'
  | 'NISTO_CREMOS_11_20'
  | 'NISTO_CREMOS_21_28'
  | 'QUAL_ESPECIALIDADE';

export interface QuizQuestionItem {
  id: string;
  category: QuizCategoryMode;
  subCategory: string;
  question: string;
  imageUrl?: string;
  specialtyCode?: string;
  specialtyArea?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  reference?: string;
  hint?: string;
}

interface QuizHighScore {
  bestScore: number;
  bestAccuracy: number;
  gamesPlayed: number;
  lastPlayed: string;
}

interface ClubQuizProps {
  club: ClubType;
  specialties?: Especialidade[];
  getImageUrl?: (url: string | undefined | null) => string;
  onBack?: () => void;
  onRegisterBackHandler?: (handler: (() => boolean) | null) => void;
  onOpenSpecialtyDetails?: (specialty: Especialidade) => void;
}

const getImageUrl = (url: string | undefined | null) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `https://mda.wiki.br${trimmed}`;
  if (trimmed.includes('drive.google.com')) {
    const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  return trimmed;
};

// ============================================================================
// BANCO DE QUESTÕES OFICIAIS: HISTÓRIA, IDEAIS, EMBLEMAS E MANUAL (DBV & AVT)
// ============================================================================
const PATHFINDER_HISTORY_QUESTIONS: Omit<QuizQuestionItem, 'id'>[] = [
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'Hino e Ideais',
    question: 'Quem compôs a letra e a música do Hino Oficial dos Desbravadores e em que ano ele foi escrito?',
    options: [
      'Henry T. Bergh, em 1949',
      'John Hancock, em 1946',
      'Lawrence Skinner, em 1950',
      'Arthur W. Spalding, em 1921'
    ],
    correctIndex: 0,
    explanation: 'O pastor Henry T. Bergh compôs o Hino dos Desbravadores em maio de 1949, enquanto dirigia rumo a uma reunião na Califórnia.',
    reference: 'Manual Administrativo do Clube de Desbravadores',
    hint: 'Foi escrito um ano antes do reconhecimento mundial oficial de 1950.'
  },
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'História Mundial',
    question: 'Em que ano a Associação Geral da Igreja Adventista do Sétimo Dia oficializou mundialmente o Clube de Desbravadores?',
    options: [
      '1950',
      '1946',
      '1929',
      '1959'
    ],
    correctIndex: 0,
    explanation: 'Em 24 de agosto de 1950, a Associação Geral reconheceu oficialmente o programa do Clube de Desbravadores em âmbito mundial, tendo Lawrence Skinner como primeiro diretor mundial.',
    reference: 'História Mundial dos Desbravadores',
    hint: 'Meados do século XX, logo após a composição do hino em 1949.'
  },
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'Emblemas e RUD',
    question: 'Quem desenhou o emblema triangular oficial do Clube de Desbravadores em 1946?',
    options: [
      'John Hancock',
      'C. Lester Bond',
      'J. H. N. Tindall',
      'Malcolm Allen'
    ],
    correctIndex: 0,
    explanation: 'O pastor John Hancock, então diretor de jovens da Associação do Sudeste da Califórnia, desenhou o triângulo dos Desbravadores em 1946.',
    reference: 'Manual Administrativo • Emblemas Oficiais',
    hint: 'Era conhecido por tocar acordeão e desenhar cartazes para os jovens.'
  },
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'Emblemas e RUD',
    question: 'No emblema oficial D1 dos Desbravadores, o que simbolizam o Escudo e a Espada?',
    options: [
      'O Escudo da Fé (Gênesis 15:1 / Efésios 6:16) e a Espada do Espírito, que é a Palavra de Deus (Efésios 6:17)',
      'A proteção do acampamento e a coragem física nas atividades de campo',
      'A justiça dos reis de Israel e a força militar de Davi',
      'A honra da liderança e a disciplina da ordem unida'
    ],
    correctIndex: 0,
    explanation: 'O escudo representa a fé que protege o cristão e a espada simboliza a Bíblia Sagrada, a Palavra de Deus, em uma guerra espiritual contra o pecado.',
    reference: 'Efésios 6:16-17 • Regulamento de Uniformes (RUD)',
    hint: 'Baseia-se na armadura do cristão descrita pelo apóstolo Paulo.'
  },
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'Emblemas e RUD',
    question: 'Qual é o significado oficial das 4 cores presentes no emblema dos Desbravadores (Vermelho, Amarelo/Ouro, Branco e Azul)?',
    options: [
      'Vermelho: Sacrifício de Cristo; Amarelo: Excelência; Branco: Pureza; Azul: Lealdade',
      'Vermelho: Coragem; Amarelo: Riqueza; Branco: Paz; Azul: Céu',
      'Vermelho: Fogo do Espírito; Amarelo: Sol da Justiça; Branco: Santidade; Azul: Verdade',
      'Vermelho: Sangue; Amarelo: Luz; Branco: Fé; Azul: Esperança'
    ],
    correctIndex: 0,
    explanation: 'Vermelho lembra o sangue e sacrifício de Cristo (João 3:16); Amarelo/Ouro representa a excelência dos ideais; Branco a pureza (Apoc. 3:5); e Azul a lealdade ao Senhor, à família e ao clube.',
    reference: 'Manual Administrativo • Significado dos Emblemas',
    hint: 'Pense em Sacrifício, Excelência, Pureza e Lealdade.'
  },
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'História na América do Sul',
    question: 'Qual foi o primeiro Clube de Desbravadores oficializado na América do Sul (em 1955) e em que país surgiu?',
    options: [
      'Clube "Conquistadores de Miraflores", em Lima, Peru',
      'Clube "Pioneiros do Catetinho", em Brasília, Brasil',
      'Clube "Cruzeiro do Sul", em Buenos Aires, Argentina',
      'Clube "Vigia do Pacífico", em Santiago, Chile'
    ],
    correctIndex: 0,
    explanation: 'Em 1955, na igreja de Miraflores (Lima, Peru), foi organizado o primeiro clube sul-americano sob a liderança do casal Nercida e Armando Ruiz, após visita do Pr. Jairo Tavares de Araújo.',
    reference: 'História dos Desbravadores na Divisão Sul-Americana',
    hint: 'Surgiu no bairro de Miraflores, capital peruana.'
  },
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'História no Brasil',
    question: 'Em qual cidade brasileira foi organizado o primeiro Clube de Desbravadores do Brasil em 1959, com apoio do Pr. Wilson Sarli?',
    options: [
      'Ribeirão Preto (SP)',
      'Curitiba (PR)',
      'Santo André (SP)',
      'Lajeado (RS)'
    ],
    correctIndex: 0,
    explanation: 'Em 1959, na cidade de Ribeirão Preto (interior de São Paulo), foi organizado o primeiro clube brasileiro sob a direção de Edgar Turcato e apoio do Pr. Wilson Sarli.',
    reference: 'História dos Desbravadores no Brasil',
    hint: 'Importante cidade do interior do estado de São Paulo.'
  },
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'História na América do Sul',
    question: 'Onde e quando foi realizado o 1º Campori Sul-Americano de Desbravadores?',
    options: [
      'Foz do Iguaçu (PR), em dezembro de 1983 / janeiro de 1984',
      'Ponta Grossa (PR), em janeiro de 1994',
      'Barretos (SP), em janeiro de 2005',
      'Santa Helena (PR), em janeiro de 2014'
    ],
    correctIndex: 0,
    explanation: 'O 1º Campori Sul-Americano ("Da Natureza ao Criador") aconteceu em Foz do Iguaçu (PR), de 28 de dezembro de 1983 a 4 de janeiro de 1984, dirigido pelo Pr. Cláudio Belz.',
    reference: 'História dos Camporis da DSA',
    hint: 'Realizado na cidade das Cataratas do Iguaçu.'
  },
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'Manual Administrativo',
    question: 'Qual é a sequência correta das 6 Classes Regulares dos Desbravadores e suas respectivas idades iniciais?',
    options: [
      'Amigo (10), Companheiro (11), Pesquisador (12), Pioneiro (13), Excursionista (14) e Guia (15)',
      'Amigo (10), Pesquisador (11), Companheiro (12), Pioneiro (13), Guia (14) e Excursionista (15)',
      'Companheiro (10), Amigo (11), Pioneiro (12), Pesquisador (13), Excursionista (14) e Guia (15)',
      'Amigo (9), Companheiro (10), Pesquisador (11), Pioneiro (12), Excursionista (13) e Guia (14)'
    ],
    correctIndex: 0,
    explanation: 'As classes regulares atendem juvenis de 10 a 15 anos na ordem: Amigo (Azul, 10), Companheiro (Vermelho, 11), Pesquisador (Verde, 12), Pioneiro (Cinza, 13), Excursionista (Vinho, 14) e Guia (Amarelo, 15).',
    reference: 'Manual Administrativo • Currículo das Classes',
    hint: 'Começa em Amigo aos 10 anos e encerra em Guia aos 15 anos.'
  },
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'Ideais',
    question: 'Qual item abaixo faz parte dos 8 pontos da Lei do Desbravador ("A Lei do Desbravador ordena-me...")?',
    options: [
      'Cumprir fielmente a parte que me corresponde',
      'Ser sempre obediente e ajudar em casa',
      'Prometer fidelidade à Bíblia Sagrada',
      'Levar a mensagem do advento a todo o mundo'
    ],
    correctIndex: 0,
    explanation: 'Os 8 itens da Lei do Desbravador são: 1) Observar a devoção matinal; 2) Cumprir fielmente a parte que me corresponde; 3) Cuidar de meu corpo; 4) Manter a consciência limpa; 5) Ser cortês e obediente; 6) Andar com reverência na casa de Deus; 7) Ter sempre um cântico no coração; 8) Ir aonde Deus mandar.',
    reference: 'Ideais Oficiais dos Desbravadores',
    hint: 'É o segundo item da Lei do Desbravador.'
  },
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'Ideais',
    question: 'Qual é o texto oficial do LEMA e do OBJETIVO do Ministério de Desbravadores / Jovens?',
    options: [
      'Lema: "O amor de Cristo me motiva" • Objetivo: "Salvar do pecado e guiar no serviço"',
      'Lema: "A mensagem do advento a todo o mundo" • Objetivo: "Pela graça de Deus serei puro"',
      'Lema: "Servir a Deus e à pátria" • Objetivo: "Amar ao próximo como a mim mesmo"',
      'Lema: "Sempre alerta para servir" • Objetivo: "Guardar a lei dos Desbravadores"'
    ],
    correctIndex: 0,
    explanation: 'O Alvo é "A mensagem do advento a todo o mundo em minha geração"; o Lema é "O amor de Cristo me motiva" (2 Coríntios 5:14); e o Objetivo é "Salvar do pecado e guiar no serviço".',
    reference: 'Manual Administrativo • Ideais do Clube',
    hint: 'Inspirado em 2 Coríntios 5:14.'
  },
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'Manual Administrativo',
    question: 'No sistema de unidades do Clube de Desbravadores, qual é a composição ideal de uma unidade?',
    options: [
      'De 6 a 8 desbravadores do mesmo sexo, liderados por um Conselheiro(a), com Capitão e Secretário escolhidos entre os membros',
      'De 12 a 15 desbravadores mistos, liderados diretamente pelo Diretor Associado',
      'De 4 a 5 desbravadores de todas as idades sem cargos internos',
      'Até 20 desbravadores divididos apenas por ordem alfabética'
    ],
    correctIndex: 0,
    explanation: 'A unidade é o coração do clube: composta por 6 a 8 membros (separados por sexo e faixa etária próxima), acompanhados por um Conselheiro(a) maior de 16/18 anos, tendo um Capitão e um Secretário.',
    reference: 'Manual Administrativo • Sistema de Unidades',
    hint: 'A unidade é um pequeno grupo de 6 a 8 membros.'
  }
];

const ADVENTURER_HISTORY_QUESTIONS: Omit<QuizQuestionItem, 'id'>[] = [
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'Classes dos Aventureiros',
    question: 'Qual é a sequência correta das 4 Classes dos Aventureiros e suas respectivas idades e cores?',
    options: [
      'Abelhinhas Laboriosas (6 anos, Azul Claro), Luminares (7 anos, Laranja), Edificadores (8 anos, Azul Escuro) e Mãos Ajudadoras (9 anos, Vinho/Bordô)',
      'Luminares (6 anos), Abelhinhas Laboriosas (7 anos), Edificadores (8 anos) e Mãos Ajudadoras (9 anos)',
      'Abelhinhas Laboriosas (5 anos), Edificadores (6 anos), Luminares (7 anos) e Mãos Ajudadoras (8 anos)',
      'Pequenos Amigos (6 anos), Luminares (7 anos), Construtores (8 anos) e Ajudantes (9 anos)'
    ],
    correctIndex: 0,
    explanation: 'O currículo oficial dos Aventureiros atende crianças de 6 a 9 anos: Abelhinhas Laboriosas (6), Luminares (7), Edificadores (8) e Mãos Ajudadoras (9).',
    reference: 'Manual Administrativo do Clube de Aventureiros',
    hint: 'Começa aos 6 anos com as Abelhinhas Laboriosas.'
  },
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'Ideais dos Aventureiros',
    question: 'Qual é o texto oficial do VOTO do Clube de Aventureiros?',
    options: [
      '"Por amor a Jesus, farei sempre o meu melhor."',
      '"Pela graça de Deus, serei puro, bondoso e leal."',
      '"Prometo ajudar em casa e ser amigo de todos."',
      '"O amor de Cristo me motiva a fazer o bem."'
    ],
    correctIndex: 0,
    explanation: 'O Voto dos Aventureiros é curto, significativo e adaptado à faixa etária infantil: "Por amor a Jesus, farei sempre o meu melhor."',
    reference: 'Ideais Oficiais dos Aventureiros',
    hint: 'Tem apenas 9 palavras e começa com "Por amor a Jesus...".'
  },
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'Ideais dos Aventureiros',
    question: 'Quantos itens compõem a Lei do Aventureiro ("Jesus me ajuda a ser...") e quais são eles?',
    options: [
      '5 itens: Obediente, Puro, Reverente, Bondoso e Colaborador',
      '8 itens: Devoção matinal, Fiel, Cuidar do corpo, Consciência limpa, Cortês, Reverente, Cântico e Ir aonde Deus mandar',
      '3 itens: Obediente aos pais, Amigo da natureza e Fiel a Jesus',
      '4 itens: Puro, Bondoso, Leal e Servo de Deus'
    ],
    correctIndex: 0,
    explanation: 'A Lei do Aventureiro declara: "Jesus me ajuda a ser: obediente, puro, reverente, bondoso e colaborador."',
    reference: 'Manual Administrativo • Ideais dos Aventureiros',
    hint: 'São 5 qualidades começando com "Obediente".'
  },
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'Hino dos Aventureiros',
    question: 'Quem é o autor do Hino Oficial dos Aventureiros ("Somos Aventureiros alegres, confiantes no amigo Jesus...")?',
    options: [
      'Pr. Wanderson Paiva (em 1995)',
      'Pr. Henry T. Bergh (em 1949)',
      'Pr. John Hancock (em 1972)',
      'Pr. Erton Köhler (em 1998)'
    ],
    correctIndex: 0,
    explanation: 'O Hino Oficial dos Aventureiros na Divisão Sul-Americana foi composto pelo Pr. Wanderson Paiva em 1995.',
    reference: 'Manual Administrativo dos Aventureiros',
    hint: 'Foi composto no Brasil na década de 1990.'
  },
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'História dos Aventureiros',
    question: 'Em que ano a Associação Geral oficializou mundialmente o Ministério do Clube de Aventureiros como departamento próprio?',
    options: [
      '1989 / 1990 (com Teresa Reeve no desenvolvimento do currículo)',
      '1950 (junto com os Desbravadores)',
      '2002',
      '1965'
    ],
    correctIndex: 0,
    explanation: 'Após experiências pioneiras desde 1972, em 1989/1990 a Associação Geral aprovou o currículo mundial oficial do Clube de Aventureiros e a criação da Rede Familiar dos Aventureiros (RFA).',
    reference: 'História Mundial dos Aventureiros',
    hint: 'Final da década de 1980 e início de 1990.'
  },
  {
    category: 'HISTORIA_MANUAL',
    subCategory: 'Rede Familiar (RFA)',
    question: 'Qual é o papel fundamental da Rede Familiar dos Aventureiros (RFA) no clube?',
    options: [
      'Integrar e capacitar os pais/responsáveis para participarem ativamente do desenvolvimento espiritual, físico e social dos filhos junto ao clube',
      'Substituir os pais nas responsabilidades escolares das crianças',
      'Organizar apenas acampamentos de sobrevivência na selva',
      'Realizar cobrança financeira mensal sem participação pedagógica'
    ],
    correctIndex: 0,
    explanation: 'O Clube de Aventureiros existe para apoiar os pais na missão de educar os filhos para Jesus; por isso, a Rede Familiar (RFA) envolve diretamente a família nas atividades e classes.',
    reference: 'Manual Administrativo dos Aventureiros • RFA',
    hint: 'O clube de Aventureiros trabalha em parceria direta com o lar.'
  }
];

// ============================================================================
// BANCO DE QUESTÕES OFICIAIS: SIMULADO "BOM DE BÍBLIA" E LIVRO DO ANO
// ============================================================================
const BIBLE_QUIZ_QUESTIONS: Omit<QuizQuestionItem, 'id'>[] = [
  {
    category: 'BOM_DE_BIBLIA',
    subCategory: 'Heróis da Fé & Jovens',
    question: 'Segundo Daniel 1:8, o que Daniel assentou em seu coração ao chegar à corte de Babilônia?',
    options: [
      'Não se contaminar com a porção das iguarias do rei, nem com o vinho que ele bebia',
      'Fugir de Babilônia de volta para Jerusalém durante a noite',
      'Desafiar os sábios caldeus para um duelo militar na praça central',
      'Aceitar a comida real apenas nos dias de festa do palácio'
    ],
    correctIndex: 0,
    explanation: 'Daniel e seus três amigos (Ananias, Misael e Azarias) permaneceram fiéis aos princípios de saúde e adoração ao verdadeiro Deus, pedindo legumes e água por 10 dias.',
    reference: 'Daniel 1:8-12',
    hint: 'Envolve fidelidade alimentar e temperança no palácio de Nabucodonosor.'
  },
  {
    category: 'BOM_DE_BIBLIA',
    subCategory: 'Antigo Testamento',
    question: 'Quais eram os nomes hebraicos originais de Sadraque, Mesaque e Abede-Nego?',
    options: [
      'Ananias, Misael e Azarias',
      'Efraim, Manassés e Benjamim',
      'Gersom, Coate e Merari',
      'Nadabe, Abiú e Eleazar'
    ],
    correctIndex: 0,
    explanation: 'O chefe dos eunucos pôs novos nomes babilônicos aos jovens hebreus: a Daniel pôs Beltessazar; a Ananias, Sadraque; a Misael, Mesaque; e a Azarias, Abede-Nego.',
    reference: 'Daniel 1:6-7',
    hint: 'Seus nomes originais honravam ao Deus de Israel.'
  },
  {
    category: 'BOM_DE_BIBLIA',
    subCategory: 'Antigo Testamento',
    question: 'Quantos homens permaneceram com Gideão para enfrentar os midianitas após a prova das águas na fonte de Harode?',
    options: [
      '300 homens que lamberam a água levando a mão à boca',
      '10.000 homens armados com lanças e escudos',
      '22.000 guerreiros da tribo de Judá',
      '120 príncipes de Israel'
    ],
    correctIndex: 0,
    explanation: 'Deus reduziu o exército de Gideão de 32.000 para 300 homens vigilantes para que Israel não se gloriasse contra o Senhor dizendo "a minha própria mão me livrou".',
    reference: 'Juízes 7:2-7',
    hint: 'Eles usaram trombetas, cântaros vazios e tochas acesas.'
  },
  {
    category: 'BOM_DE_BIBLIA',
    subCategory: 'Poéticos e Sabedoria',
    question: 'Qual versículo bíblico fundamenta o Voto à Bíblia ("Lâmpada para os meus pés é tua palavra, e luz para o meu caminho")?',
    options: [
      'Salmos 119:105',
      'Salmos 23:1',
      'Provérbios 3:5',
      'Josué 1:9'
    ],
    correctIndex: 0,
    explanation: 'Salmos 119:105 e Salmos 119:11 ("Escondi a tua palavra no meu coração, para eu não pecar contra ti") são a base direta do Voto à Bíblia dos Desbravadores.',
    reference: 'Salmos 119:105',
    hint: 'Está no maior capítulo da Bíblia Sagrada.'
  },
  {
    category: 'BOM_DE_BIBLIA',
    subCategory: 'Novo Testamento',
    question: 'Em Atos dos Apóstolos, qual casal vendeu uma propriedade, mas reteve parte do valor mentindo ao Espírito Santo?',
    options: [
      'Ananias e Safira',
      'Áquila e Priscila',
      'Zacarias e Isabel',
      'Félix e Drusila'
    ],
    correctIndex: 0,
    explanation: 'Enquanto Barnabé ofertou sinceramente o valor de seu campo, Ananias e Safira fingiram entregar tudo, mentindo não aos homens, mas a Deus.',
    reference: 'Atos 5:1-10',
    hint: 'Relatado no capítulo 5 de Atos dos Apóstolos.'
  },
  {
    category: 'BOM_DE_BIBLIA',
    subCategory: 'Evangelhos',
    question: 'Qual foi o primeiro milagre público realizado por Jesus, segundo o Evangelho de João?',
    options: [
      'A transformação da água em suco de uva (vinho novo sem fermento) nas bodas de Caná da Galileia',
      'A multiplicação dos cinco pães e dois peixes junto ao mar da Galileia',
      'A cura do cego Bartimeu na saída de Jericó',
      'A ressurreição de Lázaro em Betânia'
    ],
    correctIndex: 0,
    explanation: 'Em João 2:11 está escrito: "Jesus principiou assim os seus sinais em Caná da Galileia, e manifestou a sua glória; e os seus discípulos creram nele."',
    reference: 'João 2:1-11',
    hint: 'Aconteceu durante uma festa de casamento na Galileia.'
  },
  {
    category: 'BOM_DE_BIBLIA',
    subCategory: 'Heróis da Fé & Jovens',
    question: 'Qual jovem foi chamado por Deus ainda menino no templo de Siló, enquanto servia perante o sacerdote Eli?',
    options: [
      'Samuel ("Fala, Senhor, porque o teu servo ouve")',
      'Josias, rei de Judá',
      'Davi, filho de Jessé',
      'João Marcos'
    ],
    correctIndex: 0,
    explanation: 'O Senhor chamou Samuel três vezes durante a noite; orientado por Eli, na quarta vez Samuel respondeu: "Fala, porque o teu servo ouve."',
    reference: '1 Samuel 3:1-10',
    hint: 'Sua mãe, Ana, havia orado ardentemente por seu nascimento.'
  },
  {
    category: 'BOM_DE_BIBLIA',
    subCategory: 'Profecias e Apocalipse',
    question: 'Em Apocalipse 14:6-7, qual é o apelo proclamado pelo Primeiro Anjo a toda nação, tribo, língua e povo?',
    options: [
      '"Temei a Deus, e dai-lhe glória; porque é vinda a hora do seu juízo. E adorai aquele que fez o céu, e a terra, e o mar, e as fontes das águas."',
      '"Sai dela, povo meu, para que não sejas participante dos seus pecados."',
      '"Eis que estou à porta, e bato; se alguém ouvir a minha voz, e abrir a porta, entrarei em sua casa."',
      '"Sê fiel até à morte, e dar-te-ei a coroa da vida."'
    ],
    correctIndex: 0,
    explanation: 'As Três Mensagens Angélicas de Apocalipse 14:6-12 constituem o coração da missão adventista, convidando o mundo a adorar o Criador na hora do Seu juízo.',
    reference: 'Apocalipse 14:6-7',
    hint: 'Faz alusão direta ao quarto mandamento da Lei de Deus (Êxodo 20:11).'
  },
  {
    category: 'BOM_DE_BIBLIA',
    subCategory: 'Antigo Testamento',
    question: 'Qual rainha judia arriscou a própria vida ao comparecer diante do rei Assuero para salvar seu povo do decreto de Hamã, dizendo "E, se perecer, pereci"?',
    options: [
      'Rainha Ester (Hadassa), orientada por seu primo Mardoqueu',
      'Débora, profetisa e juíza de Israel',
      'Rute, a moabita, bisavó do rei Davi',
      'Abigail, esposa de Nabal'
    ],
    correctIndex: 0,
    explanation: 'Mardoqueu enviou a célebre mensagem a Ester: "E quem sabe se para tal tempo como este chegaste a este reino?" (Ester 4:14), e Ester pediu três dias de jejum antes de ir ao rei.',
    reference: 'Ester 4:14-16',
    hint: 'Seu nome hebraico era Hadassa.'
  },
  {
    category: 'BOM_DE_BIBLIA',
    subCategory: 'Novo Testamento',
    question: 'A qual jovem obreiro o apóstolo Paulo escreveu: "Ninguém despreze a tua mocidade; mas sê o exemplo dos fiéis, na palavra, no trato, na caridade, no espírito, na fé, na pureza"?',
    options: [
      'Timóteo',
      'Tito',
      'Filemom',
      'Silas'
    ],
    correctIndex: 0,
    explanation: 'Timóteo conhecia as Sagradas Letras desde a infância por influência de sua avó Lóide e de sua mãe Eunice (2 Timóteo 1:5; 3:15).',
    reference: '1 Timóteo 4:12',
    hint: 'Filho espiritual de Paulo, neto de Lóide e filho de Eunice.'
  },
  {
    category: 'BOM_DE_BIBLIA',
    subCategory: 'Antigo Testamento',
    question: 'No monte Carmelo, qual profeta desafiou os 450 profetas de Baal, orando ao Senhor que respondesse com fogo do céu sobre o altar encharcado de água?',
    options: [
      'O profeta Elias',
      'O profeta Eliseu',
      'O profeta Isaías',
      'O profeta Jeremias'
    ],
    correctIndex: 0,
    explanation: 'Elias reconstruiu o altar do Senhor com 12 pedras, derramou água três vezes sobre o holocausto e a lenha, e o fogo do Senhor caiu e consumiu tudo.',
    reference: '1 Reis 18:30-39',
    hint: 'Mais tarde foi trasladado ao céu em um carro de fogo.'
  },
  {
    category: 'BOM_DE_BIBLIA',
    subCategory: 'Pentateuco',
    question: 'Quais dos 12 espias enviados por Moisés a Canaã trouxeram um relatório de fé e coragem, confiando que Deus lhes daria a terra?',
    options: [
      'Josué (filho de Num) e Calebe (filho de Jefoné)',
      'Arão e Hur',
      'Moisés e Jetro',
      'Eldade e Medade'
    ],
    correctIndex: 0,
    explanation: 'Enquanto 10 espias amedrontaram o povo falando dos gigantes de Enaque, Calebe e Josué declararam: "Se o Senhor se agradar de nós, então nos porá nesta terra" (Números 14:8).',
    reference: 'Números 13:30; 14:6-9',
    hint: 'Foram os únicos daquela geração adulta que entraram na Terra Prometida 40 anos depois.'
  },
  {
    category: 'BOM_DE_BIBLIA',
    subCategory: 'Novo Testamento',
    question: 'Segundo Gálatas 5:22-23, quais são as nove virtudes que compõem o Fruto do Espírito?',
    options: [
      'Amor (caridade), gozo (alegria), paz, longanimidade, benignidade, bondade, fé (fidelidade), mansidão e temperança (domínio próprio)',
      'Sabedoria, ciência, entendimento, conselho, fortaleza, piedade, temor de Deus, coragem e justiça',
      'Fé, esperança, caridade, oração, jejum, esmola, hospitalidade, perdão e humildade',
      'Verdade, justiça, evangelho da paz, fé, salvação, palavra de Deus e oração'
    ],
    correctIndex: 0,
    explanation: 'O Fruto do Espírito é singular e indivisível, manifestando o caráter de Cristo na vida do cristão guiado pelo Espírito Santo.',
    reference: 'Gálatas 5:22-23',
    hint: 'Começa com Amor, Alegria e Paz e termina com Mansidão e Temperança.'
  },
  {
    category: 'BOM_DE_BIBLIA',
    subCategory: 'Pioneiros e Livro do Ano',
    question: 'Na história dos pioneiros adventistas e dos livros inspirados, quem era o jovem capitão marítimo que se tornou um dos fundadores da Igreja Adventista do Sétimo Dia?',
    options: [
      'José Bates (Joseph Bates)',
      'Tiago White (James White)',
      'J. N. Andrews',
      'Urias Smith'
    ],
    correctIndex: 0,
    explanation: 'O capitão José Bates abandonou o álcool, o fumo e o chá ainda no mar, investiu toda sua fortuna na pregação do advento e foi o grande pioneiro da verdade do Sábado bíblico.',
    reference: 'Nossa Herança • História Denominacional',
    hint: 'Era um ex-capitão de navio conhecido por sua vida de reforma de saúde e guarda do sábado.'
  },
  {
    category: 'BOM_DE_BIBLIA',
    subCategory: 'Pioneiros e Livro do Ano',
    question: 'Qual pioneiro adventista foi o primeiro missionário oficial enviado para fora da América do Norte (para a Europa, em 1874) e hoje dá nome à principal universidade adventista mundial?',
    options: [
      'John Nevins Andrews (J. N. Andrews)',
      'Guilherme Miller (William Miller)',
      'Hiram Edson',
      'F. H. Westphal'
    ],
    correctIndex: 0,
    explanation: 'J. N. Andrews partiu para a Suíça em 1874 com seus dois filhos (Charles e Mary), inaugurando as missões mundiais da Igreja Adventista do Sétimo Dia.',
    reference: 'Nossa Herança • Missões Mundiais',
    hint: 'Conhecido por seu extraordinário conhecimento bíblico e de idiomas.'
  }
];

function cryptoRandomInt(max: number): number {
  if (max <= 1) return 0;
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return array[0] % max;
    }
  } catch {}
  return Math.floor(Math.random() * max);
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = cryptoRandomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateBalancedCorrectPositions(count: number): number[] {
  const positions: number[] = [];
  while (positions.length < count) {
    const block = shuffleArray([0, 1, 2, 3]);
    if (positions.length > 0 && block[0] === positions[positions.length - 1]) {
      const swapIdx = 1 + cryptoRandomInt(3);
      [block[0], block[swapIdx]] = [block[swapIdx], block[0]];
    }
    positions.push(...block);
  }
  return positions.slice(0, count);
}

function balanceAndShuffleQuizQuestions(questions: QuizQuestionItem[]): QuizQuestionItem[] {
  const targetPositions = generateBalancedCorrectPositions(questions.length);

  return questions.map((q, idx) => {
    const rawOpts = Array.isArray(q.options) && q.options.length >= 4
      ? q.options.slice(0, 4)
      : ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D'];

    const safeCorrectIdx =
      typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < rawOpts.length
        ? q.correctIndex
        : 0;

    const correctText = rawOpts[safeCorrectIdx];
    const wrongOpts = shuffleArray(rawOpts.filter((_, i) => i !== safeCorrectIdx));
    const targetIdx = targetPositions[idx] ?? cryptoRandomInt(4);

    const finalOptions: string[] = [];
    let wrongCursor = 0;
    for (let slot = 0; slot < 4; slot++) {
      if (slot === targetIdx) {
        finalOptions.push(correctText);
      } else {
        finalOptions.push(wrongOpts[wrongCursor++] ?? `Alternativa ${slot + 1}`);
      }
    }

    return {
      ...q,
      id: q.id || `q_${Date.now()}_${idx}`,
      options: finalOptions,
      correctIndex: targetIdx
    };
  });
}

const ClubQuiz: React.FC<ClubQuizProps> = ({ club, onRegisterBackHandler }) => {
  const isPathfinder = club === ClubType.PATHFINDER;
  const storageKey = `dbv_quiz_scores_${isPathfinder ? 'DBV' : 'AVT'}`;

  // Estado da navegação interna do Quiz
  const [selectedArena, setSelectedArena] = useState<QuizCategoryMode>('BOM_DE_BIBLIA');
  const [questionLimit, setQuestionLimit] = useState<number>(10);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState<number>(25);
  const [customBibleTopic, setCustomBibleTopic] = useState<string>('');
  const [selectedSpecialtyAreaFilter, setSelectedSpecialtyAreaFilter] = useState<string>('TODAS');
  const [showSpecialtyAreaBadgeInQuiz, setShowSpecialtyAreaBadgeInQuiz] = useState<boolean>(false);

  // Catálogo de especialidades para o modo "Qual é esta Especialidade?"
  const [specialtiesCatalog, setSpecialtiesCatalog] = useState<Especialidade[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);
  const [isGeneratingAiQuiz, setIsGeneratingAiQuiz] = useState<boolean>(false);

  // Estado da partida em andamento
  const [gameState, setGameState] = useState<'SETUP' | 'PLAYING' | 'FINISHED'>('SETUP');
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(25);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState<boolean>(false);

  // Pontuação e Estatísticas da Partida
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [answerHistory, setAnswerHistory] = useState<{
    question: QuizQuestionItem;
    chosenIndex: number | null;
    isCorrect: boolean;
    timeSpent: number;
  }[]>([]);

  // Ajudas / Power-ups da partida
  const [lifeline5050Used, setLifeline5050Used] = useState<boolean>(false);
  const [hiddenOptionIndices, setHiddenOptionIndices] = useState<number[]>([]);
  const [lifelineExtraTimeUsed, setLifelineExtraTimeUsed] = useState<boolean>(false);
  const [lifelineHintUsed, setLifelineHintUsed] = useState<boolean>(false);
  const [showCurrentHint, setShowCurrentHint] = useState<boolean>(false);

  const defaultScores: Record<QuizCategoryMode, QuizHighScore> = {
    BOM_DE_BIBLIA: { bestScore: 0, bestAccuracy: 0, gamesPlayed: 0, lastPlayed: '' },
    HISTORIA_MANUAL: { bestScore: 0, bestAccuracy: 0, gamesPlayed: 0, lastPlayed: '' },
    MANUAL_ADMINISTRATIVO: { bestScore: 0, bestAccuracy: 0, gamesPlayed: 0, lastPlayed: '' },
    NISTO_CREMOS_1_10: { bestScore: 0, bestAccuracy: 0, gamesPlayed: 0, lastPlayed: '' },
    NISTO_CREMOS_11_20: { bestScore: 0, bestAccuracy: 0, gamesPlayed: 0, lastPlayed: '' },
    NISTO_CREMOS_21_28: { bestScore: 0, bestAccuracy: 0, gamesPlayed: 0, lastPlayed: '' },
    QUAL_ESPECIALIDADE: { bestScore: 0, bestAccuracy: 0, gamesPlayed: 0, lastPlayed: '' }
  };

  // Recordes salvos localmente
  const [highScores, setHighScores] = useState<Record<QuizCategoryMode, QuizHighScore>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return { ...defaultScores, ...JSON.parse(saved) };
    } catch {}
    return defaultScores;
  });

  const timerRef = useRef<any>(null);

  // Registra o botão Voltar do cabeçalho principal para voltar ao menu do Quiz quando estiver em partida
  useEffect(() => {
    if (!onRegisterBackHandler) return;
    onRegisterBackHandler(() => {
      if (gameState !== 'SETUP') {
        if (timerRef.current) clearInterval(timerRef.current);
        setGameState('SETUP');
        return true;
      }
      return false;
    });
    return () => {
      onRegisterBackHandler(null);
    };
  }, [gameState, onRegisterBackHandler]);

  // Carrega recordes quando alternar entre DBV e AVT
  useEffect(() => {
    setGameState('SETUP');
    if (!isPathfinder && selectedArena.startsWith('NISTO_CREMOS')) {
      setSelectedArena('BOM_DE_BIBLIA');
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setHighScores({ ...defaultScores, ...JSON.parse(saved) });
      } else {
        setHighScores(defaultScores);
      }
    } catch {}
  }, [club, storageKey, isPathfinder]);

  // Carrega especialidades leves (sem coluna Questoes) para o desafio "Qual é esta Especialidade?"
  useEffect(() => {
    let active = true;
    setIsLoadingCatalog(true);
    fetchEspecialidades(club, undefined, { excludeQuestions: true })
      .then((list) => {
        if (!active) return;
        const withLogos = list.filter(
          (e) => e.logo && e.logo.trim().length > 5 && !e.nome.toLowerCase().includes('mestrado')
        );
        setSpecialtiesCatalog(withLogos);
      })
      .catch((err) => console.warn('Erro ao carregar catálogo para Quiz:', err))
      .finally(() => {
        if (active) setIsLoadingCatalog(false);
      });
    return () => {
      active = false;
    };
  }, [club]);

  // Áreas disponíveis no catálogo de especialidades
  const availableSpecialtyAreas = useMemo(() => {
    const areas = new Set<string>();
    specialtiesCatalog.forEach((s) => {
      if (s.area) areas.add(s.area);
    });
    return Array.from(areas).sort();
  }, [specialtiesCatalog]);

  // Cronômetro regressivo durante a partida
  useEffect(() => {
    if (gameState !== 'PLAYING' || isAnswerLocked) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSelectAnswer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, isAnswerLocked, currentIdx]);

  // Embaralha as alternativas de uma questão preservando qual é a correta
  const randomizeQuestionOptions = (q: Omit<QuizQuestionItem, 'id'>, idx: number): QuizQuestionItem => {
    const correctText = q.options[q.correctIndex];
    const shuffledOpts = shuffleArray(q.options);
    const newCorrectIdx = shuffledOpts.indexOf(correctText);
    return {
      ...q,
      id: `q_${Date.now()}_${idx}`,
      options: shuffledOpts,
      correctIndex: newCorrectIdx >= 0 ? newCorrectIdx : 0
    };
  };

  // Constrói questões para "Qual é esta Especialidade?" a partir dos emblemas reais do banco
  const buildVisualSpecialtyQuestions = (limit: number): QuizQuestionItem[] => {
    const filteredPool =
      selectedSpecialtyAreaFilter === 'TODAS'
        ? specialtiesCatalog
        : specialtiesCatalog.filter((e) => e.area === selectedSpecialtyAreaFilter);

    const poolToUse = filteredPool.length >= 4 ? filteredPool : specialtiesCatalog;
    if (poolToUse.length < 4) return [];

    const shuffledTargets = shuffleArray(poolToUse).slice(0, limit);

    return shuffledTargets.map((target, idx) => {
      // Busca 3 distratores preferencialmente da mesma área para aumentar o desafio
      const sameAreaDistractors = specialtiesCatalog.filter(
        (s) => s.id !== target.id && s.area === target.area && s.nome !== target.nome
      );
      const otherDistractors = specialtiesCatalog.filter(
        (s) => s.id !== target.id && s.nome !== target.nome
      );

      const distractorPool = sameAreaDistractors.length >= 3 ? sameAreaDistractors : otherDistractors;
      const chosenDistractors = shuffleArray(distractorPool)
        .slice(0, 3)
        .map((d) => d.nome);

      const allOptions = shuffleArray([target.nome, ...chosenDistractors]);
      const correctIndex = allOptions.indexOf(target.nome);
      const codeStr = target.codigo || `${target.sigla || 'ESP'}-${String(target.id).padStart(3, '0')}`;

      return {
        id: `esp_quiz_${target.id}_${idx}`,
        category: 'QUAL_ESPECIALIDADE',
        subCategory: target.area || 'Especialidades',
        question: 'Qual é o nome oficial desta Especialidade?',
        imageUrl: getImageUrl(target.logo),
        specialtyCode: codeStr,
        specialtyArea: target.area,
        options: allOptions,
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
        explanation: `Esta é a especialidade oficial de "${target.nome}" (${codeStr}), pertencente à área de ${target.area || 'Especialidades'}.`,
        reference: `Código Oficial: ${codeStr} • Área: ${target.area || 'Geral'}`,
        hint: `Pertence à área de "${target.area || 'Geral'}" e seu código é ${codeStr}.`
      };
    });
  };

  // Inicia partida rápida com o banco oficial + catálogo
  const handleStartStandardQuiz = () => {
    let generatedList: QuizQuestionItem[] = [];

    if (selectedArena === 'QUAL_ESPECIALIDADE') {
      generatedList = buildVisualSpecialtyQuestions(questionLimit);
    } else if (selectedArena === 'MANUAL_ADMINISTRATIVO') {
      generatedList = shuffleArray(MANUAL_ADMINISTRATIVO_DBV_QUESTIONS)
        .slice(0, questionLimit)
        .map((q, i) => randomizeQuestionOptions(q, i));
    } else if (selectedArena === 'NISTO_CREMOS_1_10') {
      generatedList = shuffleArray(NISTO_CREMOS_1_10_QUESTIONS)
        .slice(0, questionLimit)
        .map((q, i) => randomizeQuestionOptions(q, i));
    } else if (selectedArena === 'NISTO_CREMOS_11_20') {
      generatedList = shuffleArray(NISTO_CREMOS_11_20_QUESTIONS)
        .slice(0, questionLimit)
        .map((q, i) => randomizeQuestionOptions(q, i));
    } else if (selectedArena === 'NISTO_CREMOS_21_28') {
      generatedList = shuffleArray(NISTO_CREMOS_21_28_QUESTIONS)
        .slice(0, questionLimit)
        .map((q, i) => randomizeQuestionOptions(q, i));
    } else if (selectedArena === 'HISTORIA_MANUAL') {
      const basePool = isPathfinder
        ? PATHFINDER_HISTORY_QUESTIONS
        : [...ADVENTURER_HISTORY_QUESTIONS, ...PATHFINDER_HISTORY_QUESTIONS.slice(0, 6)];
      generatedList = shuffleArray(basePool)
        .slice(0, questionLimit)
        .map((q, i) => randomizeQuestionOptions(q, i));
    } else {
      generatedList = shuffleArray(BIBLE_QUIZ_QUESTIONS)
        .slice(0, questionLimit)
        .map((q, i) => randomizeQuestionOptions(q, i));
    }

    if (generatedList.length === 0) return;

    startWithQuestions(generatedList);
  };

  // Gera um Simulado Inédito sob demanda com Inteligência Artificial (Bom de Bíblia / Livro do Ano / Nisto Cremos / Manual)
  const handleStartAiGeneratedQuiz = async () => {
    if (isGeneratingAiQuiz) return;
    setIsGeneratingAiQuiz(true);

    try {
      const clubLabel = isPathfinder ? 'Clube de Desbravadores' : 'Clube de Aventureiros';
      let topicContext = '';
      if (selectedArena === 'BOM_DE_BIBLIA') {
        topicContext = customBibleTopic.trim()
          ? `Foco específico solicitado pelo usuário: "${customBibleTopic.trim()}" (Bíblia Sagrada Almeida Revista e Corrigida / Livro do Ano / Bom de Bíblia).`
          : `Concurso Oficial "Bom de Bíblia" (Antigo Testamento, Novo Testamento, Heróis da Fé, Profecias de Daniel e Apocalipse, e História dos Pioneiros Adventistas).`;
      } else if (selectedArena === 'MANUAL_ADMINISTRATIVO') {
        topicContext = `Manual Administrativo Oficial do Clube de Desbravadores da Divisão Sul-Americana (DSA): Filosofia e Objetivos, Faixa Etária (10-15 anos), Eleição da Diretoria, Comissão Executiva e Regular, Sistema de Unidades (Conselheiro, Capitão, Secretário), Classes Regulares e Avançadas, Especialidades, Cerimônias (Admissão em Lenço, Investidura), Finanças e Patrimônio na Tesouraria da Igreja, Seguro Anual e SGC, Bandeira Oficial, Banderim, Ordem Unida, Acampamentos e Disciplina Redentiva.`;
      } else if (selectedArena === 'NISTO_CREMOS_1_10') {
        topicContext = `Livro "Nisto Cremos" (As 28 Crenças Fundamentais da IASD) — EXCLUSIVAMENTE os Capítulos 1 ao 10: 1. As Escrituras Sagradas; 2. A Trindade; 3. O Pai; 4. O Filho; 5. O Espírito Santo; 6. A Criação; 7. A Natureza da Humanidade; 8. O Grande Conflito; 9. A Vida, Morte e Ressurreição de Cristo; 10. A Experiência da Salvação.`;
      } else if (selectedArena === 'NISTO_CREMOS_11_20') {
        topicContext = `Livro "Nisto Cremos" (As 28 Crenças Fundamentais da IASD) — EXCLUSIVAMENTE os Capítulos 11 ao 20: 11. Crescer em Cristo; 12. A Igreja; 13. O Remanescente e Sua Missão; 14. Unidade no Corpo de Cristo; 15. O Batismo; 16. A Ceia do Senhor; 17. Dons e Ministérios Espirituais; 18. O Dom de Profecia; 19. A Lei de Deus; 20. O Sábado.`;
      } else if (selectedArena === 'NISTO_CREMOS_21_28') {
        topicContext = `Livro "Nisto Cremos" (As 28 Crenças Fundamentais da IASD) — EXCLUSIVAMENTE os Capítulos 21 ao 28: 21. Mordomia; 22. Conduta Cristã; 23. O Casamento e a Família; 24. O Ministério de Cristo no Santuário Celestial; 25. A Segunda Vinda de Cristo; 26. Morte e Ressurreição; 27. O Milênio e o Fim do Pecado; 28. A Nova Terra.`;
      } else {
        topicContext = `História Mundial e Sul-Americana do ${clubLabel}, Significado dos Ideais (Voto, Lei, Alvo, Lema, Objetivo), Hino Oficial, Emblemas e Regulamento de Uniformes (RUD).`;
      }

      const prompt = `Você é o Coordenador Oficial de Concursos e do "Bom de Bíblia" do ${clubLabel} da Divisão Sul-Americana (IASD).
Elabore um simulado inédito com exatamente ${questionLimit} perguntas de múltipla escolha sobre:
${topicContext}

REGRAS OBRIGATÓRIAS:
1. Cada pergunta deve ter 4 alternativas ("options": array de 4 strings), sendo apenas UMA correta ("correctIndex": 0, 1, 2 ou 3).
2. Inclua "explanation" (explicação didática clara da resposta correta), "reference" (capítulo e versículo bíblico exato ou seção do Manual Administrativo) e "hint" (uma pista sutil sem entregar a resposta direta).
3. Retorne EXCLUSIVAMENTE um JSON array válido no formato:
[
  {
    "subCategory": "Subtema da questão",
    "question": "Enunciado completo da pergunta?",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correctIndex": 0,
    "explanation": "Explicação detalhada...",
    "reference": "Ex: Daniel 1:8 ou Manual Administrativo",
    "hint": "Pista curta..."
  }
]`;

      let parsedArray: any[] = [];

      // 1. Tenta via rota server-side (/api/gemini/generate-didactic)
      try {
        const res = await fetch('/api/gemini/generate-didactic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            responseMimeType: 'application/json',
            temperature: 0.55
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.text) {
            const clean = data.text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
            const first = clean.indexOf('[');
            const last = clean.lastIndexOf(']');
            if (first !== -1 && last > first) {
              parsedArray = JSON.parse(clean.substring(first, last + 1));
            }
          }
        }
      } catch {}

      // 2. Fallback REST caso necessário
      if (!Array.isArray(parsedArray) || parsedArray.length === 0) {
        const apiKey = await resolveGeminiApiKey();
        if (apiKey) {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json', temperature: 0.55 }
              })
            }
          );
          if (res.ok) {
            const data = await res.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const clean = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
            const first = clean.indexOf('[');
            const last = clean.lastIndexOf(']');
            if (first !== -1 && last > first) {
              parsedArray = JSON.parse(clean.substring(first, last + 1));
            }
          }
        }
      }

      if (Array.isArray(parsedArray) && parsedArray.length >= 3) {
        const mapped: QuizQuestionItem[] = parsedArray.slice(0, questionLimit).map((item, idx) => {
          const opts = Array.isArray(item.options) && item.options.length >= 4
            ? item.options.slice(0, 4).map((o: any) => String(o).replace(/^[A-Da-d][\)\.\-]\s*/, '').trim())
            : ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D'];
          const cIdx = typeof item.correctIndex === 'number' && item.correctIndex >= 0 && item.correctIndex < 4
            ? item.correctIndex
            : 0;
          return randomizeQuestionOptions(
            {
              category: selectedArena,
              subCategory: item.subCategory || (selectedArena === 'BOM_DE_BIBLIA' ? 'Bom de Bíblia' : 'Cultura & Manual'),
              question: String(item.question || ''),
              options: opts,
              correctIndex: cIdx,
              explanation: String(item.explanation || 'Resposta fundamentada nos manuais e nas Escrituras.'),
              reference: String(item.reference || 'Referência Oficial'),
              hint: String(item.hint || 'Analise com atenção os detalhes do enunciado.')
            },
            idx
          );
        });
        startWithQuestions(mapped);
        return;
      }
    } catch (e) {
      console.warn('Fallback para banco local no Quiz:', e);
    } finally {
      setIsGeneratingAiQuiz(false);
    }

    // Se a IA não retornar a tempo, inicia imediatamente com o banco oficial
    handleStartStandardQuiz();
  };

  const startWithQuestions = (questions: QuizQuestionItem[]) => {
    const balancedQuestions = balanceAndShuffleQuizQuestions(questions);
    setActiveQuestions(balancedQuestions);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setAnswerHistory([]);
    setSelectedOptionIdx(null);
    setIsAnswerLocked(false);
    setTimeLeft(secondsPerQuestion);
    setLifeline5050Used(false);
    setLifelineExtraTimeUsed(false);
    setLifelineHintUsed(false);
    setHiddenOptionIndices([]);
    setShowCurrentHint(false);
    setGameState('PLAYING');
  };

  const handleSelectAnswer = (optionIdx: number | null) => {
    if (isAnswerLocked) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const currentQ = activeQuestions[currentIdx];
    if (!currentQ) return;

    setIsAnswerLocked(true);
    setSelectedOptionIdx(optionIdx);

    const isCorrect = optionIdx !== null && optionIdx === currentQ.correctIndex;
    const timeSpent = Math.max(1, secondsPerQuestion - timeLeft);

    let newScore = score;
    let newStreak = streak;
    let newMaxStreak = maxStreak;
    let newCorrectCount = correctCount;

    if (isCorrect) {
      newStreak = streak + 1;
      newMaxStreak = Math.max(maxStreak, newStreak);
      newCorrectCount = correctCount + 1;
      const speedBonus = Math.round((timeLeft / secondsPerQuestion) * 50);
      const comboBonus = Math.min(50, (newStreak - 1) * 15);
      newScore = score + 100 + speedBonus + comboBonus;
      setScore(newScore);
      setStreak(newStreak);
      setMaxStreak(newMaxStreak);
      setCorrectCount(newCorrectCount);
    } else {
      setStreak(0);
    }

    setAnswerHistory((prev) => [
      ...prev,
      {
        question: currentQ,
        chosenIndex: optionIdx,
        isCorrect,
        timeSpent
      }
    ]);
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < activeQuestions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOptionIdx(null);
      setIsAnswerLocked(false);
      setTimeLeft(secondsPerQuestion);
      setHiddenOptionIndices([]);
      setShowCurrentHint(false);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const total = activeQuestions.length || 1;
    const accuracy = Math.round((correctCount / total) * 100);

    setHighScores((prev) => {
      const currentRecord = prev[selectedArena] || {
        bestScore: 0,
        bestAccuracy: 0,
        gamesPlayed: 0,
        lastPlayed: ''
      };
      const updated: Record<QuizCategoryMode, QuizHighScore> = {
        ...prev,
        [selectedArena]: {
          bestScore: Math.max(currentRecord.bestScore, score),
          bestAccuracy: Math.max(currentRecord.bestAccuracy, accuracy),
          gamesPlayed: currentRecord.gamesPlayed + 1,
          lastPlayed: new Date().toLocaleDateString('pt-BR')
        }
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setGameState('FINISHED');
  };

  // Ajudas durante a pergunta
  const handleUse5050 = () => {
    if (lifeline5050Used || isAnswerLocked) return;
    const currentQ = activeQuestions[currentIdx];
    if (!currentQ) return;

    const wrongIndices = currentQ.options
      .map((_, i) => i)
      .filter((i) => i !== currentQ.correctIndex);
    const toHide = shuffleArray(wrongIndices).slice(0, 2);
    setHiddenOptionIndices(toHide);
    setLifeline5050Used(true);
  };

  const handleUseExtraTime = () => {
    if (lifelineExtraTimeUsed || isAnswerLocked) return;
    setTimeLeft((prev) => prev + 15);
    setLifelineExtraTimeUsed(true);
  };

  const handleUseHint = () => {
    if (lifelineHintUsed || isAnswerLocked) return;
    setShowCurrentHint(true);
    setLifelineHintUsed(true);
  };

  const arenaCards = [
    {
      id: 'BOM_DE_BIBLIA' as QuizCategoryMode,
      title: 'Simulado "Bom de Bíblia" & Livro do Ano',
      subtitle: 'Treino cronometrado com referências bíblicas, heróis da fé e história denominacional',
      icon: BookOpen,
      gradient: 'from-blue-600 via-indigo-600 to-blue-500',
      badge: 'Concurso Bíblico'
    },
    {
      id: 'MANUAL_ADMINISTRATIVO' as QuizCategoryMode,
      title: 'Manual Administrativo dos Desbravadores',
      subtitle: 'Organização do Clube, Diretoria, Comissões, Sistema de Unidades, Cerimônias, Finanças, SGC e Disciplina',
      icon: FileText,
      gradient: 'from-red-700 via-rose-600 to-red-500',
      badge: 'Manual Oficial DBV'
    },
    {
      id: 'HISTORIA_MANUAL' as QuizCategoryMode,
      title: isPathfinder
        ? 'História, Ideais, Emblemas e Uniformes'
        : 'História, Ideais e Classes dos Aventureiros',
      subtitle: isPathfinder
        ? 'Pioneiros, Camporis, Voto, Lei, Hino Oficial, Emblemas e Regulamento de Uniformes (RUD)'
        : 'Classes (Abelhinhas a Mãos Ajudadoras), Voto, Lei, Hino, Emblemas e RFA',
      icon: Shield,
      gradient: isPathfinder
        ? 'from-[#dc371b] via-[#b91c1c] to-[#ef4444]'
        : 'from-[#800000] via-[#660000] to-[#991b1b]',
      badge: 'Cultura & Tradição'
    },
    ...(isPathfinder
      ? [
          {
            id: 'NISTO_CREMOS_1_10' as QuizCategoryMode,
            title: 'Livro "Nisto Cremos" • Capítulos 1 ao 10',
            subtitle: 'Escrituras, Trindade, Pai, Filho, Espírito Santo, Criação, Natureza Humana, Grande Conflito e Salvação',
            icon: Book,
            gradient: 'from-emerald-600 via-teal-600 to-emerald-500',
            badge: 'Capítulos 1 a 10'
          },
          {
            id: 'NISTO_CREMOS_11_20' as QuizCategoryMode,
            title: 'Livro "Nisto Cremos" • Capítulos 11 ao 20',
            subtitle: 'Crescer em Cristo, Igreja, Remanescente, Unidade, Batismo, Santa Ceia, Dons, Profecia, Lei e Sábado',
            icon: Book,
            gradient: 'from-teal-700 via-cyan-600 to-teal-500',
            badge: 'Capítulos 11 a 20'
          },
          {
            id: 'NISTO_CREMOS_21_28' as QuizCategoryMode,
            title: 'Livro "Nisto Cremos" • Capítulos 21 ao 28',
            subtitle: 'Mordomia, Conduta Cristã, Casamento e Família, Santuário Celestial, Segunda Vinda, Milênio e Nova Terra',
            icon: Book,
            gradient: 'from-purple-700 via-violet-600 to-indigo-600',
            badge: 'Capítulos 21 a 28'
          }
        ]
      : []),
    {
      id: 'QUAL_ESPECIALIDADE' as QuizCategoryMode,
      title: '"Qual é esta Especialidade?"',
      subtitle: 'Desafio visual: veja apenas o emblema oficial da especialidade e acerte o nome!',
      icon: Award,
      gradient: 'from-amber-600 via-orange-600 to-amber-500',
      badge: `${specialtiesCatalog.length || 534} Insígnias Reais`
    }
  ];

  // ==========================================================================
  // RENDER: TELA DE CONFIGURAÇÃO E ESCOLHA DE ARENA (SETUP) — SEM ROLAGEM GERAL
  // ==========================================================================
  if (gameState === 'SETUP') {
    const activeArenaRecord = highScores[selectedArena];

    return (
      <div className="animate-slide-in h-full min-h-0 w-full max-w-4xl mx-auto flex flex-col justify-between gap-2 sm:gap-3 pb-1 overflow-hidden">
        {/* Banner Superior Compacto */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-[26px] px-3.5 py-2.5 sm:px-5 sm:py-3.5 text-white shadow-md border border-white/10 relative overflow-hidden shrink-0">
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest">
                <Trophy size={10} />
                <span>Concursos • {isPathfinder ? 'Desbravadores' : 'Aventureiros'}</span>
              </div>
              <h3 className="text-sm sm:text-lg font-black uppercase tracking-tight leading-tight mt-0.5 truncate">
                Escolha a Modalidade do Quiz
              </h3>
            </div>

            {activeArenaRecord && activeArenaRecord.gamesPlayed > 0 && (
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-2.5 py-1.5 shrink-0 flex items-center space-x-2">
                <Star size={15} className="text-amber-300 shrink-0" fill="currentColor" />
                <div className="text-right leading-tight">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-300 block">
                    Recorde
                  </span>
                  <span className="text-xs sm:text-sm font-black text-white">
                    {activeArenaRecord.bestScore} pts ({activeArenaRecord.bestAccuracy}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 1. Grade de Modalidades: 2 Colunas no Celular, 3-4 no Desktop */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 h-full content-start">
            {arenaCards.map((card) => {
              const IconComp = card.icon;
              const isSelected = selectedArena === card.id;
              const record = highScores[card.id];
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedArena(card.id)}
                  className={`w-full relative overflow-hidden rounded-2xl p-2.5 sm:p-3.5 text-left transition-all flex flex-col justify-between border ${
                    isSelected
                      ? `bg-gradient-to-br ${card.gradient} text-white shadow-md ring-2 ring-indigo-400 dark:ring-indigo-400 border-white/30`
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200/80 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-xs'
                  }`}
                >
                  <div className={`absolute -right-2 -bottom-2 pointer-events-none transition-transform duration-300 ${isSelected ? 'text-white/15 scale-105' : 'text-slate-100 dark:text-slate-700/35'}`}>
                    <IconComp className="w-16 h-16 sm:w-20 sm:h-20 stroke-[1.4]" />
                  </div>

                  <div className="relative z-10 flex items-center justify-between w-full gap-1">
                    <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      <IconComp size={15} strokeWidth={2.4} />
                    </div>
                    <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full truncate ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                    }`}>
                      {card.badge}
                    </span>
                  </div>

                  <div className="relative z-10 mt-1.5 sm:mt-2.5">
                    <h4 className="font-black text-[11px] sm:text-xs uppercase tracking-tight leading-tight line-clamp-2">
                      {card.title}
                    </h4>
                    <p className={`text-[9px] sm:text-[10px] mt-0.5 leading-tight font-medium line-clamp-2 hidden sm:block ${
                      isSelected ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {card.subtitle}
                    </p>
                    {record && record.gamesPlayed > 0 && (
                      <div className={`mt-1 pt-1 border-t text-[8.5px] font-black uppercase tracking-wider flex items-center justify-between ${
                        isSelected ? 'border-white/20 text-amber-200' : 'border-slate-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        <span>{record.bestScore} pts</span>
                        <span>{record.bestAccuracy}%</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Painel Inferior Compacto: Rodadas, Tempo, Filtro e Botões Iniciar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-[24px] p-2.5 sm:p-4 shadow-sm border border-slate-100 dark:border-slate-700 space-y-2 sm:space-y-3 shrink-0">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* Quantidade de Perguntas */}
            <div>
              <label className="text-[8.5px] sm:text-[9.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Rodadas
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                {[5, 10, 15].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionLimit(cnt)}
                    className={`py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${
                      questionLimit === cnt
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cnt} Q
                  </button>
                ))}
              </div>
            </div>

            {/* Tempo do Cronômetro por Questão */}
            <div>
              <label className="text-[8.5px] sm:text-[9.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Tempo / Questão
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                {[
                  { sec: 15, label: '15s' },
                  { sec: 25, label: '25s' },
                  { sec: 40, label: '40s' }
                ].map((t) => (
                  <button
                    key={t.sec}
                    type="button"
                    onClick={() => setSecondsPerQuestion(t.sec)}
                    className={`py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all ${
                      secondsPerQuestion === t.sec
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Opções Extras Compactas para "Qual é esta Especialidade?" */}
          {selectedArena === 'QUAL_ESPECIALIDADE' && (
            <div className="flex items-center justify-between gap-2 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl px-2.5 py-1.5 border border-amber-200/70 dark:border-amber-900/50">
              <select
                value={selectedSpecialtyAreaFilter}
                onChange={(e) => setSelectedSpecialtyAreaFilter(e.target.value)}
                className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800 dark:text-white focus:outline-none"
              >
                <option value="TODAS">Todas as Áreas ({specialtiesCatalog.length})</option>
                {availableSpecialtyAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>

              <label className="flex items-center space-x-1.5 cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={showSpecialtyAreaBadgeInQuiz}
                  onChange={(e) => setShowSpecialtyAreaBadgeInQuiz(e.target.checked)}
                  className="w-3.5 h-3.5 accent-amber-600 rounded"
                />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                  Mostrar Área
                </span>
              </label>
            </div>
          )}

          {/* Opção de Tema Específico para o Simulado Bom de Bíblia */}
          {selectedArena === 'BOM_DE_BIBLIA' && (
            <input
              type="text"
              value={customBibleTopic}
              onChange={(e) => setCustomBibleTopic(e.target.value)}
              placeholder="Foco opcional p/ IA: Ex: Livro de Daniel, Mateus, ou em branco p/ Geral..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-800/80 rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
          )}

          {/* Botões de Ação para Iniciar */}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isGeneratingAiQuiz || (selectedArena === 'QUAL_ESPECIALIDADE' && isLoadingCatalog)}
              onClick={handleStartStandardQuiz}
              className="flex-1 py-2.5 sm:py-3 px-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-black uppercase tracking-wider text-[11px] sm:text-xs shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Play size={15} fill="currentColor" />
              <span>
                {selectedArena === 'QUAL_ESPECIALIDADE' && isLoadingCatalog
                  ? 'Carregando...'
                  : 'Iniciar Desafio'}
              </span>
            </button>

            {selectedArena !== 'QUAL_ESPECIALIDADE' && (
              <button
                type="button"
                disabled={isGeneratingAiQuiz}
                onClick={handleStartAiGeneratedQuiz}
                className="py-2.5 sm:py-3 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-black uppercase tracking-wider text-[11px] sm:text-xs shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 shrink-0"
              >
                {isGeneratingAiQuiz ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Gerando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Simulado IA</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: TELA DE PARTIDA EM ANDAMENTO (PLAYING) — 100% AJUSTADA NA TELA
  // ==========================================================================
  if (gameState === 'PLAYING') {
    const currentQ = activeQuestions[currentIdx];
    if (!currentQ) return null;

    const timerPercent = Math.max(0, Math.min(100, (timeLeft / secondsPerQuestion) * 100));
    const isUrgent = timeLeft <= 6 && !isAnswerLocked;

    return (
      <div className="animate-fade-in h-full min-h-0 w-full max-w-3xl mx-auto flex flex-col justify-between gap-2 pb-1 overflow-hidden">
        {/* Barra Superior Compacta (Sem botão Sair redundante) + Barra de Progresso */}
        <div className="shrink-0 space-y-1.5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-xs border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 shrink-0">
                  Pergunta {currentIdx + 1} de {activeQuestions.length}
                </span>
                {streak >= 2 && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-black text-[9px] uppercase inline-flex items-center space-x-1">
                    <Flame size={11} fill="currentColor" />
                    <span>{streak}x</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                {currentQ.subCategory}
              </p>
            </div>

            {/* Pontos & Relógio Cronômetro */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              <div className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-black text-[11px] sm:text-xs tabular-nums">
                {score} pts
              </div>

              <div
                className={`px-2.5 py-1 rounded-xl font-black text-[11px] sm:text-xs tabular-nums flex items-center space-x-1 border ${
                  isUrgent
                    ? 'bg-red-600 text-white border-red-600 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white border-slate-200 dark:border-slate-600'
                }`}
              >
                <Timer size={13} />
                <span>{timeLeft}s</span>
              </div>
            </div>
          </div>

          {/* Barra de Tempo Visual */}
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isUrgent
                  ? 'bg-red-500'
                  : timeLeft <= secondsPerQuestion * 0.45
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>

        {/* Cartão Principal da Pergunta — Flexível para caber 100% sem rolagem */}
        <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[28px] p-3.5 sm:p-5 shadow-md border border-slate-100 dark:border-slate-700 flex flex-col justify-between gap-2 overflow-hidden">
          {/* Topo: Emblema Limpo (sem container) + Enunciado + Dica */}
          <div className="flex flex-col items-center justify-center space-y-1.5 shrink-0">
            {currentQ.category === 'QUAL_ESPECIALIDADE' && currentQ.imageUrl && (
              <div className="flex flex-col items-center justify-center space-y-1">
                {(showSpecialtyAreaBadgeInQuiz || isAnswerLocked) && currentQ.specialtyArea && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-[9px] font-black uppercase tracking-widest">
                    Área: {currentQ.specialtyArea}
                  </span>
                )}
                <img
                  src={currentQ.imageUrl}
                  alt="Insígnia da Especialidade"
                  className="w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-xl select-none"
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <h4 className="text-xs sm:text-base font-black text-slate-800 dark:text-white leading-snug text-center w-full line-clamp-3">
              {currentQ.question}
            </h4>

            {showCurrentHint && currentQ.hint && !isAnswerLocked && (
              <div className="w-full px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center space-x-2 text-[11px] text-amber-900 dark:text-amber-200 animate-fade-in">
                <Lightbulb size={13} className="text-amber-500 shrink-0" />
                <span className="font-medium truncate">{currentQ.hint}</span>
              </div>
            )}
          </div>

          {/* Meio: Alternativas A, B, C, D */}
          <div className="grid grid-cols-1 gap-1.5 sm:gap-2 my-auto">
            {currentQ.options.map((optText, idx) => {
              const isHiddenBy5050 = hiddenOptionIndices.includes(idx);
              if (isHiddenBy5050 && !isAnswerLocked) {
                return (
                  <div
                    key={idx}
                    className="w-full py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60 text-slate-300 dark:text-slate-600 text-[11px] font-bold flex items-center space-x-2.5 opacity-40 select-none"
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[10px]">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="line-through truncate">Alternativa eliminada (50/50)</span>
                  </div>
                );
              }

              const isCorrectOption = idx === currentQ.correctIndex;
              const isChosenOption = selectedOptionIdx === idx;

              let buttonStyle =
                'bg-slate-50 hover:bg-indigo-50/60 dark:bg-slate-900/70 dark:hover:bg-slate-700/70 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100';
              let letterBadgeStyle =
                'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600';

              if (isAnswerLocked) {
                if (isCorrectOption) {
                  buttonStyle =
                    'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/40';
                  letterBadgeStyle = 'bg-emerald-600 text-white border-emerald-600';
                } else if (isChosenOption && !isCorrectOption) {
                  buttonStyle =
                    'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-950 dark:text-red-100 ring-1 ring-red-500/40';
                  letterBadgeStyle = 'bg-red-600 text-white border-red-600';
                } else {
                  buttonStyle =
                    'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/40 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-55';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswerLocked}
                  onClick={() => handleSelectAnswer(idx)}
                  className={`w-full py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 active:scale-[0.99] ${buttonStyle}`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg font-black text-[11px] flex items-center justify-center shrink-0 transition-colors ${letterBadgeStyle}`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold leading-tight line-clamp-2">
                      {optText}
                    </span>
                  </div>

                  {isAnswerLocked && isCorrectOption && (
                    <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  {isAnswerLocked && isChosenOption && !isCorrectOption && (
                    <AlertCircle size={17} className="text-red-600 dark:text-red-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Rodapé do Card: Ajudas antes de responder OU Explicação + Próxima após responder */}
          <div className="shrink-0 pt-1.5 border-t border-slate-100 dark:border-slate-700/70">
            {!isAnswerLocked ? (
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider hidden sm:inline">
                  Ajudas (1x):
                </span>
                <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto sm:flex">
                  <button
                    type="button"
                    disabled={lifeline5050Used}
                    onClick={handleUse5050}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-[9.5px] font-black uppercase tracking-wider hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-35 text-center"
                  >
                    50/50 (-2)
                  </button>
                  <button
                    type="button"
                    disabled={lifelineExtraTimeUsed}
                    onClick={handleUseExtraTime}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-[9.5px] font-black uppercase tracking-wider hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-35 inline-flex items-center justify-center gap-1"
                  >
                    <Clock size={11} />
                    <span>+15s</span>
                  </button>
                  <button
                    type="button"
                    disabled={lifelineHintUsed}
                    onClick={handleUseHint}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-[9.5px] font-black uppercase tracking-wider hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-35 inline-flex items-center justify-center gap-1"
                  >
                    <Lightbulb size={11} />
                    <span>Dica</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 animate-fade-in">
                <div
                  className={`px-3 py-1.5 rounded-xl border text-[10.5px] leading-snug ${
                    selectedOptionIdx === currentQ.correctIndex
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-emerald-950 dark:text-emerald-100'
                      : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/70 text-amber-950 dark:text-amber-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black uppercase text-[9.5px] tracking-wider">
                      {selectedOptionIdx === currentQ.correctIndex
                        ? 'Correto!'
                        : selectedOptionIdx === null
                        ? 'Tempo Esgotado!'
                        : 'Resposta Incorreta'}
                    </span>
                    {currentQ.reference && (
                      <span className="text-[9px] font-black uppercase tracking-wider opacity-80 truncate">
                        {currentQ.reference}
                      </span>
                    )}
                  </div>
                  <p className="font-medium opacity-90 line-clamp-2 mt-0.5">
                    {currentQ.explanation}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="w-full py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-[11px] sm:text-xs shadow-md active:scale-[0.99] transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>
                    {currentIdx + 1 < activeQuestions.length
                      ? 'Próxima Pergunta'
                      : 'Ver Resultado Final'}
                  </span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: TELA DE RESULTADO FINAL E GABARITO DA PARTIDA (FINISHED)
  // ==========================================================================
  const totalQuestions = activeQuestions.length || 1;
  const accuracyPercent = Math.round((correctCount / totalQuestions) * 100);
  const rankBadge =
    accuracyPercent >= 90
      ? { title: 'Excelência Ouro • Bom de Bíblia!', color: 'text-amber-400', bg: 'from-amber-500 to-yellow-500' }
      : accuracyPercent >= 70
      ? { title: 'Aprovado com Honra • Prata!', color: 'text-emerald-400', bg: 'from-emerald-500 to-teal-500' }
      : { title: 'Continue Treinando • Bronze', color: 'text-blue-400', bg: 'from-blue-500 to-indigo-500' };

  return (
    <div className="animate-slide-in h-full min-h-0 w-full max-w-3xl mx-auto flex flex-col justify-between gap-2.5 pb-1 overflow-hidden">
      {/* Card Compacto de Placar Final */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[24px] p-4 sm:p-5 text-white text-center shadow-lg border border-white/10 space-y-3 shrink-0">
        <div className="flex items-center justify-center space-x-3">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${rankBadge.bg} flex items-center justify-center shadow-md shrink-0`}>
            <Trophy size={24} className="text-white" />
          </div>
          <div className="text-left">
            <span className={`text-[10px] font-black uppercase tracking-widest block ${rankBadge.color}`}>
              {rankBadge.title}
            </span>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-none">
              {score} Pontos • {accuracyPercent}%
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Acertos: <strong className="text-white">{correctCount}/{totalQuestions}</strong> • Maior Combo: <strong className="text-indigo-300">{maxStreak}x</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleStartStandardQuiz}
            className="py-2.5 px-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-black uppercase tracking-wider text-[11px] shadow-xs active:scale-95 transition-all inline-flex items-center justify-center space-x-1.5"
          >
            <RotateCcw size={14} />
            <span>Jogar Novamente</span>
          </button>
          <button
            type="button"
            onClick={() => setGameState('SETUP')}
            className="py-2.5 px-3 bg-white/15 hover:bg-white/25 text-white rounded-xl font-black uppercase tracking-wider text-[11px] border border-white/20 active:scale-95 transition-all inline-flex items-center justify-center space-x-1.5"
          >
            <span>Trocar Modalidade</span>
          </button>
        </div>
      </div>

      {/* Revisão Detalhada das Questões da Partida (Rolagem interna limpa) */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-[24px] p-3.5 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1 mb-2 shrink-0">
          Gabarito Comentado da Partida ({answerHistory.length} Questões)
        </h4>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-2 pr-0.5">
          {answerHistory.map((entry, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border ${
                entry.isCorrect
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/50'
                  : 'bg-red-50/40 dark:bg-red-950/20 border-red-200/70 dark:border-red-900/50'
              } space-y-1`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  {entry.question.imageUrl && (
                    <img
                      src={entry.question.imageUrl}
                      alt=""
                      className="w-8 h-8 object-contain shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block truncate">
                      Q{idx + 1} • {entry.question.subCategory}
                    </span>
                    <p className="text-[11px] sm:text-xs font-black text-slate-800 dark:text-white leading-snug">
                      {entry.question.question}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase shrink-0 ${
                    entry.isCorrect
                      ? 'bg-emerald-100 dark:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-100 dark:bg-red-900/70 text-red-700 dark:text-red-300'
                  }`}
                >
                  {entry.isCorrect ? 'Acertou' : 'Errou'}
                </span>
              </div>

              <div className="text-[11px] space-y-0.5 pl-0.5">
                {!entry.isCorrect && (
                  <p className="text-red-600 dark:text-red-400 font-bold">
                    Sua resposta:{' '}
                    {entry.chosenIndex !== null
                      ? entry.question.options[entry.chosenIndex]
                      : 'Tempo esgotado'}
                  </p>
                )}
                <p className="text-emerald-700 dark:text-emerald-400 font-black">
                  Correta: {entry.question.options[entry.question.correctIndex]}
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-[10px] leading-snug">
                  {entry.question.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClubQuiz;
