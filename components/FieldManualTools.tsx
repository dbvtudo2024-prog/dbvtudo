import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Compass,
  ShieldAlert,
  Radio,
  Volume2,
  VolumeX,
  Sun,
  Play,
  Square,
  CheckCircle2,
  Search,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  HeartPulse,
  Flame,
  Bug,
  Leaf,
  Users,
  Sparkles,
  BookOpen,
  Award,
  Hand,
  Flag,
  MapPin,
  Check,
  ZoomIn,
  X
} from 'lucide-react';
import { ClubType } from '../types';

interface FieldManualToolsProps {
  club: ClubType;
  initialTab?: 'NOS_AMARRAS' | 'CODIGOS' | 'PRIMEIROS_SOCORROS';
  onBack?: () => void;
}

type ManualTab = 'NOS_AMARRAS' | 'CODIGOS' | 'PRIMEIROS_SOCORROS';
type CodeSubTab = 'TRADUTOR_MORSE' | 'SEMAFORA' | 'LIBRAS' | 'SINAIS_PISTA';
type FirstAidCategory = 'TODOS' | 'BANDAGENS' | 'TRANSPORTE' | 'EMERGENCIAS' | 'PECONHENTOS_PLANTAS';

interface KnotStep {
  title: string;
  description: string;
}

interface KnotGuideItem {
  id: string;
  name: string;
  classLevel: 'AMIGO' | 'COMPANHEIRO' | 'PESQUISADOR_PIONEIRO' | 'EXCURSIONISTA_GUIA' | 'AMARRAS_PIONEIRIA';
  classLabel: string;
  classColor: string;
  category: 'NO' | 'AMARRA';
  imageUrl: string;
  imageCaption: string;
  practicalUse: string;
  safetyTip: string;
  svgType:
    | 'DIREITO'
    | 'ESCOTA'
    | 'LAIS_GUIA'
    | 'FIEL'
    | 'CATAU'
    | 'PESCADOR'
    | 'CIRURGIAO'
    | 'AMARRA_QUADRADA'
    | 'AMARRA_DIAGONAL'
    | 'AMARRA_PARALELA'
    | 'AMARRA_TRIPE'
    | 'PRUSIK';
  steps: KnotStep[];
}

const KNOTS_DATABASE: KnotGuideItem[] = [
  {
    id: 'no_direito',
    name: 'Nó Direito (Quadrado)',
    classLevel: 'AMIGO',
    classLabel: 'Classe de Amigo',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    imageUrl: '/knots/no_direito.svg',
    imageCaption: 'Ilustração Oficial do Nó Direito (Direito sobre Direito, Esquerdo sobre Esquerdo)',
    practicalUse: 'Unir dois cabos de mesma espessura (bitola) que não sofrerão tração excessiva e finalizar bandagens/ataduras de primeiros socorros (por ser plano e não machucar).',
    safetyTip: 'Direito com direito, esquerdo com esquerdo. Nunca use para unir cordas de espessuras diferentes ou para sustentação em altura.',
    svgType: 'DIREITO',
    steps: [
      { title: '1. Primeiro cruzamento (Direita sobre Esquerda)', description: 'Segure uma ponta em cada mão. Passe o chicote da direita por cima e por baixo do chicote da esquerda.' },
      { title: '2. Segundo cruzamento (Esquerda sobre Direita)', description: 'Agora pegue a ponta que está na esquerda e passe por cima e por dentro da alça da direita.' },
      { title: '3. Ajuste simétrico', description: 'Puxe as quatro partes firmemente até formar dois elos simétricos entrelaçados (Direito sobre Direito, Esquerdo sobre Esquerdo).' }
    ]
  },
  {
    id: 'no_cirurgiao',
    name: 'Nó de Cirurgião',
    classLevel: 'AMIGO',
    classLabel: 'Classe de Amigo',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    imageUrl: '/knots/no_cirurgiao.jpg',
    imageCaption: 'Execução real do Nó de Cirurgião com dupla torção na base e fechamento plano',
    practicalUse: 'Variação do Nó Direito com uma volta extra na primeira laçada; evita que o nó afrouxe enquanto você faz a segunda laçada em ataduras médicas ou fardos.',
    safetyTip: 'A volta dupla na base cria atrito extra que mantém a tensão firme antes do fechamento.',
    svgType: 'CIRURGIAO',
    steps: [
      { title: '1. Volta dupla inicial', description: 'Cruze a ponta direita sobre a esquerda dando DUAS voltas completas (torção dupla na base).' },
      { title: '2. Fechamento superior simples', description: 'Cruze a ponta esquerda sobre a direita dando uma volta simples, igual ao Nó Direito.' },
      { title: '3. Aperto firme', description: 'Tracione as duas pontas para travar o nó de forma plana e segura.' }
    ]
  },
  {
    id: 'lais_de_guia',
    name: 'Lais de Guia (Rei dos Nós)',
    classLevel: 'AMIGO',
    classLabel: 'Classe de Amigo',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    imageUrl: '/knots/lais_de_guia.png',
    imageCaption: 'Sequência visual em 4 etapas do Lais de Guia (Lago, Cobrinha e Árvore)',
    practicalUse: 'Cria uma alça fixa que NUNCA corre nem aperta sob peso. Essencial para salvamento, içar pessoas/equipamentos e amarrar embarcações.',
    safetyTip: 'Mnemônico clássico: "A cobrinha sai do lago (alça), dá a volta por trás da árvore (firme) e entra no lago novamente."',
    svgType: 'LAIS_GUIA',
    steps: [
      { title: '1. Faça o "lago" (pequeno cote)', description: 'Forme uma pequena alça (cote) no cabo firme, deixando a parte superior passando por cima.' },
      { title: '2. Suba pelo lago', description: 'Passe o chicote (ponta) de baixo para cima por dentro do pequeno cote.' },
      { title: '3. Contorne a árvore e volte ao lago', description: 'Passe o chicote por trás do cabo firme principal e introduza-o de volta para baixo dentro do mesmo cote, puxando firme.' }
    ]
  },
  {
    id: 'volta_do_fiel',
    name: 'Volta do Fiel (Calote / Barqueiro)',
    classLevel: 'AMIGO',
    classLabel: 'Classe de Amigo',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    imageUrl: '/knots/volta_do_fiel.jpg',
    imageCaption: 'Ilustração clássica da Volta do Fiel aplicada em poste cilíndrico',
    practicalUse: 'Iniciar e finalizar quase todas as amarras de pioneiria (Quadrada, Paralela, Tripé) e fixar corda em um tronco ou estaca.',
    safetyTip: 'Mantenha tensão constante nas duas extremidades para que não afrouxe no bambu liso.',
    svgType: 'FIEL',
    steps: [
      { title: '1. Primeira volta diagonal', description: 'Passe a corda ao redor do tronco ou vara de bambu cruzando por cima de si mesma em "X".' },
      { title: '2. Segunda volta ao redor do tronco', description: 'Dê uma segunda volta completa ao redor do tronco, passando ao lado da primeira.' },
      { title: '3. Passagem sob a ponte central', description: 'Passe o chicote por baixo da diagonal central (formando duas voltas paralelas travadas por uma diagonal) e aperte.' }
    ]
  },
  {
    id: 'no_escota',
    name: 'Nó de Escota (Simples e Duplo)',
    classLevel: 'AMIGO',
    classLabel: 'Classe de Amigo',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    imageUrl: '/knots/no_escota.jpg',
    imageCaption: 'Fotografia do Nó de Escota unindo dois cabos de cores e espessuras distintas',
    practicalUse: 'Unir duas cordas de ESPESSURAS DIFERENTES (uma grossa e uma fina) ou prender a corda no olhal da Bandeira Oficial no mastro.',
    safetyTip: 'O seio (alça em U) deve ser feito sempre com a corda MAIS GROSSA, e a corda mais fina faz o contorno.',
    svgType: 'ESCOTA',
    steps: [
      { title: '1. Forme um "U" (seio) na corda mais grossa', description: 'Dobre a ponta da corda mais grossa formando uma alça estreita em formato de U.' },
      { title: '2. Entre por baixo e contorne', description: 'Passe a ponta da corda mais fina por dentro do "U" (de baixo para cima) e dê a volta completa por trás das duas pernas do "U".' },
      { title: '3. Trave sob si mesma', description: 'Passe a corda fina por baixo de si mesma (entre ela e o "U" da corda grossa) e puxe para travar.' }
    ]
  },
  {
    id: 'no_catau',
    name: 'Nó Catau (Camphoneiro)',
    classLevel: 'AMIGO',
    classLabel: 'Classe de Amigo',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    imageUrl: '/knots/no_catau.jpg',
    imageCaption: 'Fotografia real do Nó Catau isolando o trecho central e encurtando o cabo',
    practicalUse: 'Encurtar uma corda longa sem precisar cortá-la ou isolar um trecho puído/danificado da corda para que não sofra tensão.',
    safetyTip: 'O trecho danificado deve ficar exatamente na perna central entre as duas alças laterais.',
    svgType: 'CATAU',
    steps: [
      { title: '1. Forme um "S" triplo no meio da corda', description: 'Dobre a corda em três partes paralelas formando duas dobras nas extremidades (deixando a parte danificada no centro).' },
      { title: '2. Meia-volta em cada extremidade', description: 'Em cada lado, faça um pequeno cote com o cabo firme e passe a extremidade da dobra por dentro dele.' },
      { title: '3. Mantenha sob tensão', description: 'Ao esticar as duas pontas principais da corda, os dois cotes travam as dobras e aliviam o centro.' }
    ]
  },
  {
    id: 'no_pescador',
    name: 'Nó de Pescador',
    classLevel: 'AMIGO',
    classLabel: 'Classe de Amigo',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    imageUrl: '/knots/no_pescador.png',
    imageCaption: 'Ilustração dos dois nós simples simétricos do Nó de Pescador antes da união',
    practicalUse: 'Unir duas linhas finas, cordins, cabos molhados ou escorregadios (como linhas de pesca ou cordas de nylon).',
    safetyTip: 'São dois nós simples espelhados que deslizam um até o outro e se travam mutuamente.',
    svgType: 'PESCADOR',
    steps: [
      { title: '1. Coloque as pontas paralelas em sentidos opostos', description: 'Sobreponha as duas pontas das cordas que deseja unir por cerca de 25 cm.' },
      { title: '2. Primeiro nó simples abraçando a outra corda', description: 'Com a ponta da corda A, dê um nó simples ao redor do corpo da corda B.' },
      { title: '3. Segundo nó simples e união', description: 'Com a ponta da corda B, dê um nó simples ao redor do corpo da corda A e puxe os dois cabos principais até os nós encostarem.' }
    ]
  },
  {
    id: 'amarra_quadrada',
    name: 'Amarra Quadrada (Japonesa)',
    classLevel: 'COMPANHEIRO',
    classLabel: 'Companheiro • Pioneiria',
    classColor: 'bg-red-600 text-white',
    category: 'AMARRA',
    imageUrl: '/knots/amarra_quadrada.jpg',
    imageCaption: 'Fotografia real da Amarra Quadrada em duas hastes de madeira a 90°',
    practicalUse: 'Unir duas varas ou bambus que se cruzam em ângulo reto (90°). Indispensável para construir mesas de acampamento, portais, sapateiras e torres.',
    safetyTip: 'Nunca esqueça o "enforcamento" (2 a 3 voltas bem apertadas entre as duas madeiras) antes de finalizar com a Volta do Fiel!',
    svgType: 'AMARRA_QUADRADA',
    steps: [
      { title: '1. Inicie com a Volta do Fiel', description: 'Faça uma Volta do Fiel bem firme na vara vertical, logo abaixo do ponto onde a vara horizontal irá cruzar.' },
      { title: '2. Voltas de amarração (Por frente e por trás)', description: 'Passe a corda pela frente da vara horizontal, por trás da vertical, pela frente da horizontal em cima e por trás da vertical embaixo (3 a 4 voltas completas sem cavalgar a corda).' },
      { title: '3. Enforcamento (Trava de Tensão)', description: 'Dê 2 a 3 voltas horizontais bem esticadas ENTRE as duas madeiras, estrangulando as voltas anteriores.' },
      { title: '4. Finalização com Volta do Fiel', description: 'Encerre com uma Volta do Fiel na vara horizontal e esconda a sobra do chicote.' }
    ]
  },
  {
    id: 'amarra_diagonal',
    name: 'Amarra Diagonal',
    classLevel: 'COMPANHEIRO',
    classLabel: 'Companheiro • Pioneiria',
    classColor: 'bg-red-600 text-white',
    category: 'AMARRA',
    imageUrl: '/knots/amarra_diagonal.jpg',
    imageCaption: 'Ilustração clássica da Amarra Diagonal unindo duas madeiras em "X"',
    practicalUse: 'Unir duas varas que se cruzam em ângulo agudo/diagonal ("X") ou que estão sob tensão para se afastarem (contraventamento de portais e pontes).',
    safetyTip: 'Diferente da quadrada, a Amarra Diagonal começa com a Volta da Ribeira (ou Fiel) abraçando as DUAS madeiras juntas!',
    svgType: 'AMARRA_DIAGONAL',
    steps: [
      { title: '1. Inicie com Volta da Ribeira nas duas varas', description: 'Envolva as duas varas juntas na diagonal com uma Volta da Ribeira bem apertada para aproximá-las.' },
      { title: '2. Três voltas no primeiro eixo diagonal', description: 'Dê 3 a 4 voltas completas acompanhando o primeiro ângulo do "X".' },
      { title: '3. Três voltas no segundo eixo diagonal', description: 'Cruze e dê 3 a 4 voltas completas no outro ângulo do "X", formando uma cruz sobre a junção.' },
      { title: '4. Enforcamento e Volta do Fiel', description: 'Dê 2 a 3 voltas de enforcamento entre as duas madeiras e finalize com Volta do Fiel em uma das varas.' }
    ]
  },
  {
    id: 'amarra_paralela',
    name: 'Amarra Paralela (Redonda)',
    classLevel: 'COMPANHEIRO',
    classLabel: 'Companheiro • Pioneiria',
    classColor: 'bg-red-600 text-white',
    category: 'AMARRA',
    imageUrl: '/knots/amarra_paralela.jpg',
    imageCaption: 'Fotografia real da Amarra Paralela com voltas circulares e enforcamento central',
    practicalUse: 'Unir duas varas paralelamente para aumentar o comprimento de um mastro de bandeira, poste de portal ou perna de torre.',
    safetyTip: 'Para mastros altos, faça DUAS amarras paralelas afastadas entre si na área de sobreposição das varas para evitar que girem.',
    svgType: 'AMARRA_PARALELA',
    steps: [
      { title: '1. Volta do Fiel em uma das varas', description: 'Coloque as duas varas lado a lado e inicie com uma Volta do Fiel em apenas uma delas.' },
      { title: '2. Voltas circulares firmes (7 a 10 voltas)', description: 'Enrole a corda ao redor das duas varas juntas, lado a lado de forma bem justa e alinhada.' },
      { title: '3. Enforcamento central e fechamento', description: 'Passe a corda 2 vezes entre as duas varas (enforcamento) e finalize com Volta do Fiel na segunda vara.' }
    ]
  },
  {
    id: 'amarra_tripe',
    name: 'Amarra de Tripé (em Oito)',
    classLevel: 'PESQUISADOR_PIONEIRO',
    classLabel: 'Pesquisador & Pioneiro',
    classColor: 'bg-emerald-600 text-white',
    category: 'AMARRA',
    imageUrl: '/knots/amarra_tripe.gif',
    imageCaption: 'Ilustração técnica da Amarra de Tripé costurada em oito com duplo enforcamento',
    practicalUse: 'Unir 3 varas para formar um Tripé de acampamento (suporte de bacia/pia de cozinha, torre de vigia ou suporte de lampião).',
    safetyTip: 'Não aperte exageradamente as voltas em "8" para permitir que as pernas do tripé se abram ao levantar.',
    svgType: 'AMARRA_TRIPE',
    steps: [
      { title: '1. Alinhe as 3 varas com a central invertida', description: 'Coloque as 3 varas no chão lado a lado e inicie com Volta do Fiel em uma das varas das pontas.' },
      { title: '2. Costura em "8" (Por cima, por baixo)', description: 'Teça a corda passando por cima da vara do meio, por baixo da outra ponta, voltando por cima da do meio (6 voltas em "8").' },
      { title: '3. Duplo Enforcamento e Abertura', description: 'Enforque nos dois vãos entre as varas, finalize com Volta do Fiel e abra as 3 pernas formando o tripé.' }
    ]
  },
  {
    id: 'no_prusik',
    name: 'Nó Prusik (Blocante de Escalada)',
    classLevel: 'EXCURSIONISTA_GUIA',
    classLabel: 'Excursionista & Guia',
    classColor: 'bg-purple-700 text-white',
    category: 'NO',
    imageUrl: '/knots/no_prusik.jpg',
    imageCaption: 'Fotografia real do Nó Prusik (cordim blocante envolvendo o cabo principal)',
    practicalUse: 'Nó autoblocante feito com cordim fino ao redor de uma corda principal de rapel/escalada: desliza livremente quando empurrado pela mão, mas trava instantaneamente quando recebe peso!',
    safetyTip: 'O cordim do Prusik deve ter diâmetro menor (6mm a 7mm) que a corda principal (10mm a 11mm) para travar com eficiência.',
    svgType: 'PRUSIK',
    steps: [
      { title: '1. Envolva a corda principal com o anel de cordim', description: 'Posicione uma alça fechada de cordim atrás do cabo principal vertical.' },
      { title: '2. Três passagens internas (Boca de Lobo tripla)', description: 'Passe a extremidade do cordim por dentro de sua própria alça ao redor da corda principal por 3 voltas completas.' },
      { title: '3. Alinhe as espirais ("penteie" o nó)', description: 'Ajuste as 6 voltas paralelas com uma ponte transversal sem cruzar as espirais e teste o travamento.' }
    ]
  }
];

// ============================================================================
// DICIONÁRIO DE CÓDIGO MORSE E ÂNGULOS DE SEMÁFORA (A-Z e 0-9)
// ============================================================================
const MORSE_MAP: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.'
};

// Ângulos em graus (0 = para baixo, 45 = baixo-esquerda do observador, 90 = esquerda, 135 = alto-esquerda, 180 = alto, 225 = alto-direita, 270 = direita, 315 = baixo-direita)
const SEMAPHORE_ANGLES: Record<string, [number, number]> = {
  A: [45, 0],
  B: [90, 0],
  C: [135, 0],
  D: [180, 0],
  E: [0, 225],
  F: [0, 270],
  G: [0, 315],
  H: [90, 45],
  I: [135, 45],
  J: [180, 270],
  K: [45, 180],
  L: [45, 225],
  M: [45, 270],
  N: [45, 315],
  O: [90, 135],
  P: [90, 180],
  Q: [90, 225],
  R: [90, 270],
  S: [90, 315],
  T: [135, 180],
  U: [135, 225],
  V: [180, 315],
  W: [225, 270],
  X: [225, 315],
  Y: [135, 270],
  Z: [315, 270]
};

// Guia do Alfabeto Manual em Libras (Configuração da Mão)
const LIBRAS_GUIDE: Record<string, { handShape: string; tip: string }> = {
  A: { handShape: 'Punho fechado com o polegar encostado na lateral do indicador', tip: 'Palma voltada para frente.' },
  B: { handShape: 'Quatro dedos esticados e unidos para cima; polegar dobrado na palma', tip: 'Mão reta vertical.' },
  C: { handShape: 'Dedos curvados formando a letra "C"', tip: 'Formato idêntico à letra C impressa.' },
  D: { handShape: 'Indicador apontando para cima; demais dedos unidos ao polegar em círculo', tip: 'Forma o bojo e a haste do D.' },
  E: { handShape: 'Pontas dos cinco dedos curvadas para dentro (em garra fechada)', tip: 'Sem fechar o punho totalmente.' },
  F: { handShape: 'Indicador dobrado para frente e polegar cruzado por fora dele; outros 3 dedos erguidos', tip: 'Atenção: não cruze o polegar por dentro (que é o T).' },
  G: { handShape: 'Indicador apontando para cima e polegar encostado na lateral; demais dedos fechados', tip: 'Mão vertical.' },
  H: { handShape: 'Indicador e médio estendidos com polegar entre eles, fazendo um giro no ar', tip: 'Possui movimento circular curto.' },
  I: { handShape: 'Apenas o dedo mínimo (mindinho) esticado para cima', tip: 'Demais dedos fechados.' },
  J: { handShape: 'Dedo mínimo esticado desenhando a curva da letra "J" no ar', tip: 'Começa como o I e faz a curva.' },
  K: { handShape: 'Indicador e médio em "V" com polegar no meio, movendo para cima', tip: 'Mesma mão do H, mas com impulso vertical.' },
  L: { handShape: 'Polegar e indicador abertos em 90° formando um "L"', tip: 'Demais dedos fechados.' },
  M: { handShape: 'Dedo indicador, médio e anelar unidos apontando para baixo (3 pernas)', tip: 'Representa as 3 hastes do M.' },
  N: { handShape: 'Dedo indicador e médio unidos apontando para baixo (2 pernas)', tip: 'Representa as 2 hastes do N.' },
  O: { handShape: 'Todos os dedos curvados tocando a ponta do polegar em círculo', tip: 'Formato exato da letra O.' },
  P: { handShape: 'Mesma configuração do H/K, porém apontada horizontalmente para frente/baixo', tip: 'Estático (sem giro).' },
  Q: { handShape: 'Igual ao G, mas com o indicador apontando para baixo', tip: 'Ponta para baixo.' },
  R: { handShape: 'Dedo médio cruzado sobre o dedo indicador esticado', tip: 'Dedos trançados.' },
  S: { handShape: 'Punho fechado com o polegar cruzado na frente dos dedos dobrados', tip: 'Diferente do A (onde o polegar fica na lateral).' },
  T: { handShape: 'Indicador dobrado e polegar passando POR DENTRO entre o indicador e o médio', tip: 'Outros 3 dedos erguidos.' },
  U: { handShape: 'Indicador e médio esticados e UNIDOS para cima', tip: 'Sem separar os dois dedos.' },
  V: { handShape: 'Indicador e médio esticados e SEPARADOS formando um "V"', tip: 'Sinal clássico de vitória.' },
  W: { handShape: 'Indicador, médio e anelar esticados e separados formando um "W"', tip: 'Três dedos abertos para cima.' },
  X: { handShape: 'Dedo indicador curvado em gancho puxando levemente para trás', tip: 'Lembra um gancho em movimento.' },
  Y: { handShape: 'Polegar e dedo mínimo abertos ("hang loose") com leve movimento', tip: 'Indicador, médio e anelar fechados.' },
  Z: { handShape: 'Dedo indicador esticado desenhando o zigue-zague da letra "Z" no ar', tip: 'Traçado visual da letra.' }
};

// Sinais de Pista Oficiais para Trilhas
const TRAIL_SIGNS = [
  {
    id: 'ts_1',
    name: 'Seguir em Frente (Caminho Certo)',
    description: 'Seta de gravetos/pedras apontando reto ou feixe de capim amarrado com a ponta caída para frente.',
    svgType: 'ARROW_UP'
  },
  {
    id: 'ts_2',
    name: 'Virar à Direita',
    description: 'Seta no chão, galho quebrado ou tufo de capim amarrado inclinado para o lado direito.',
    svgType: 'ARROW_RIGHT'
  },
  {
    id: 'ts_3',
    name: 'Virar à Esquerda',
    description: 'Seta no chão, pedra menor sobre pedra maior à esquerda ou capim inclinado para a esquerda.',
    svgType: 'ARROW_LEFT'
  },
  {
    id: 'ts_4',
    name: 'Caminho Errado / Não Siga por Aqui',
    description: 'Dois gravetos cruzados em "X" no meio da bifurcação ou três tufos de capim amarrados.',
    svgType: 'CROSS_X'
  },
  {
    id: 'ts_5',
    name: 'Perigo / Alerta / Socorro!',
    description: 'Triângulo formado por três gravetos ou três pedras empilhadas no centro da trilha.',
    svgType: 'TRIANGLE'
  },
  {
    id: 'ts_6',
    name: 'Água Potável',
    description: 'Linhas onduladas dentro de um círculo ou seta limpa apontando para a fonte.',
    svgType: 'WATER_GOOD'
  },
  {
    id: 'ts_7',
    name: 'Água NÃO Potável (Contaminada)',
    description: 'Linhas onduladas cortadas por um "X" ou traço diagonal.',
    svgType: 'WATER_BAD'
  },
  {
    id: 'ts_8',
    name: 'Acampamento Nesta Direção',
    description: 'Desenho triangular de barraca (tenda) com uma seta indicando o rumo.',
    svgType: 'CAMP'
  },
  {
    id: 'ts_9',
    name: 'Mensagem Escondida a "N" Passos',
    description: 'Quadrado ou retângulo com um número dentro e uma seta indicando onde procurar.',
    svgType: 'MESSAGE'
  },
  {
    id: 'ts_10',
    name: 'Missão Cumprida / Fim da Pista',
    description: 'Dois círculos concêntricos (um círculo com um ponto central de pedra/graveto).',
    svgType: 'END_TRAIL'
  }
];

// ============================================================================
// CARTÕES DO GUIA RÁPIDO DE PRIMEIROS SOCORROS E PEÇONHENTOS
// ============================================================================
interface FirstAidCardItem {
  id: string;
  category: Exclude<FirstAidCategory, 'TODOS'>;
  categoryLabel: string;
  title: string;
  urgencyBadge: string;
  stepsToDo: string[];
  neverDo: string;
}

const FIRST_AID_CARDS: FirstAidCardItem[] = [
  {
    id: 'fa_1',
    category: 'BANDAGENS',
    categoryLabel: 'Bandagens e Ataduras',
    title: 'Bandagem Triangular (Tipóia de Braço e Crânio)',
    urgencyBadge: 'Especialidade de Primeiros Socorros',
    stepsToDo: [
      'Tipóia para Braço/Clavícula: Posicione o antebraço a 90° (levemente elevado), passe o lenço triangular aberto por baixo do braço ferido com o vértice apontando para o cotovelo.',
      'Amarre as duas pontas no pescoço (na lateral, nunca sobre as vértebras) usando o Nó Direito e prenda a ponta do cotovelo com alfinete ou meia-volta.',
      'Bandagem de Cabeça (Capelina): Dobre a base da bandagem triangular em 3 cm, posicione acima das sobrancelhas, cruze as pontas na nuca e amarre na testa com Nó Direito.'
    ],
    neverDo: 'Nunca dê nó comum (que aperta ou machuca o pescoço) nem deixe a mão pendente abaixo da linha do cotovelo.'
  },
  {
    id: 'fa_2',
    category: 'BANDAGENS',
    categoryLabel: 'Bandagens e Ataduras',
    title: 'Bandagem em Oito (Tornozelo / Punho) e Compressiva',
    urgencyBadge: 'Entorses e Hemorragias',
    stepsToDo: [
      'Entorse (Regra PRICE): Proteja, faça Repouso, aplique Gelo (envolto em pano por 15-20 min), faça Compressão moderada em "8" e Eleve o membro.',
      'Bandagem em Oito: Dê 2 voltas circulares de ancoragem no pé, suba cruzando pela frente do tornozelo, contorne a canela e desça formando um "8" que estabiliza a articulação.',
      'Hemorragia Externa: Faça pressão direta firme com gaze ou pano limpo sobre o ferimento; se encharcar, coloque outro pano POR CIMA sem remover o primeiro.'
    ],
    neverDo: 'Não aperte a ponto de deixar os dedos roxos/frios e nunca retire o primeiro curativo encharcado (para não arrancar o coágulo em formação).'
  },
  {
    id: 'fa_3',
    category: 'TRANSPORTE',
    categoryLabel: 'Transporte de Acidentados',
    title: 'Maca Improvisada e Transporte com 1 ou 2 Socorristas',
    urgencyBadge: 'Resgate de Campo',
    stepsToDo: [
      'Maca com 2 Varas e Camisas/Gandolas: Abotoe 2 ou 3 camisas resistentes com as mangas viradas para dentro e passe as duas varas de bambu pelas mangas.',
      'Maca com Cobertor: Abra o cobertor, coloque a 1ª vara a 1/3 da borda, dobre a aba menor sobre ela, posicione a 2ª vara e dobre a aba maior por cima (o peso do paciente trava o tecido).',
      'Cadeirinha de 4 Mãos (2 Socorristas): Para vítima consciente sem trauma de coluna, cada socorrista segura o próprio punho direito com a mão esquerda e o punho do colega com a mão livre.'
    ],
    neverDo: 'Em suspeita de trauma na coluna ou queda de altura, NUNCA sente ou dobre a vítima — mantenha cabeça, pescoço e tronco alinhados em bloco!'
  },
  {
    id: 'fa_4',
    category: 'EMERGENCIAS',
    categoryLabel: 'Emergências Vitais',
    title: 'Engasgo (Manobra de Heimlich) em Jovens/Adultos e Bebês',
    urgencyBadge: 'Urgência Imediata • Vias Aéreas',
    stepsToDo: [
      'Jovem ou Adulto Engasgado (sem conseguir falar/tossir): Posicione-se atrás da vítima, feche uma mão em punho com o polegar voltado para o abdômen (2 dedos acima do umbigo, abaixo do osso esterno).',
      'Cubra o punho com a outra mão e faça compressões rápidas em "J" (para dentro e para cima) até o objeto sair.',
      'Em Bebês (< 1 ano): Apoie o bebê de bruços no antebraço (cabeça mais baixa que o tronco) e aplique 5 tapas firmes entre as escápulas, alternando com 5 compressões torácicas com 2 dedos.'
    ],
    neverDo: 'Nunca tente retirar objetos às cegas com o dedo na garganta (isso pode empurrar o corpo estranho mais para o fundo).'
  },
  {
    id: 'fa_5',
    category: 'EMERGENCIAS',
    categoryLabel: 'Emergências Vitais',
    title: 'Queimaduras (1º, 2º e 3º Graus) e Insolação em Trilha',
    urgencyBadge: 'Acampamento e Cozinha',
    stepsToDo: [
      'Resfriamento Imediato: Coloque a área queimada sob água corrente limpa em temperatura ambiente/fresca por 10 a 15 minutos para interromper a lesão térmica.',
      'Remova anéis, relógios ou pulseiras ANTES que o local comece a inchar.',
      'Cubra frouxamente com compressa estéril ou pano limpo úmido com soro fisiológico.',
      'Insolação / Exaustão pelo Calor: Leve para sombra ventilada, afrouxe o uniforme, aplique compressas frias no pescoço/axilas e hidrate em pequenos goles se consciente.'
    ],
    neverDo: 'JAMAIS passe pasta de dente, manteiga, pó de café, óleo ou gelo direto na queimadura, NUNCA fure as bolhas (2º grau) e não arranque roupas grudadas na pele!'
  },
  {
    id: 'fa_6',
    category: 'PECONHENTOS_PLANTAS',
    categoryLabel: 'Peçonhentos & Plantas',
    title: 'Acidentes com Serpentes Peçonhentas (Jararaca, Cascavel, Coral, Surucucu)',
    urgencyBadge: 'Acidente Ofídico • Ligue 192 / 193',
    stepsToDo: [
      'Identificação (Não arrisque capturar!): Jararaca, Cascavel e Surucucu possuem fosseta loreal (orifício termorreceptor entre o olho e a narina) e presas inoculadoras.',
      'Mantenha a vítima em REPOUSO ABSOLUTO (caminhar ou correr acelera a circulação do veneno pelo sangue).',
      'Lave o local da picada apenas com água e sabão neutro, retire anéis/botas apertadas e encaminhe imediatamente ao hospital de referência para Soro Antiofídico.'
    ],
    neverDo: 'NUNCA faça torniquete/garrote (causa necrose e amputação!), NÃO corte o local da picada e JAMAIS chupe o veneno com a boca!'
  },
  {
    id: 'fa_7',
    category: 'PECONHENTOS_PLANTAS',
    categoryLabel: 'Peçonhentos & Plantas',
    title: 'Escorpiões, Aranhas (Marrom / Armadeira) e Abelhas',
    urgencyBadge: 'Prevenção no Acampamento',
    stepsToDo: [
      'Regra de Ouro no Acampamento: Sempre sacuda botas/tênis, roupas e saco de dormir antes de usar e mantenha o zíper do mosquiteiro da barraca sempre fechado!',
      'Picada de Escorpião / Aranha Armadeira: Causa dor intensa imediata; aplique compressa MORNA no local para aliviar a dor e leve ao pronto-socorro (especialmente crianças).',
      'Ferrada de Abelha: Remova o ferrão raspando lateralmente com uma lâmina cega ou cartão (sem espremer a bolsa de veneno) e aplique compressa fria.'
    ],
    neverDo: 'Não esprema o ferrão da abelha com pinça ou unha, pois isso injeta o restante do veneno na pele.'
  },
  {
    id: 'fa_8',
    category: 'PECONHENTOS_PLANTAS',
    categoryLabel: 'Peçonhentos & Plantas',
    title: 'Plantas Tóxicas e Urtigantes (Urtiga, Aroeira-brava, Comigo-ninguém-pode)',
    urgencyBadge: 'Botânica & Campo',
    stepsToDo: [
      'Urtiga / Cansanção: Possui pelos urticantes microscópicos; lave abundantemente com água fria e sabão sem esfregar e aplique compressa fria.',
      'Aroeira-brava (Bugreiro): Causa dermatite alérgica pelo contato ou fumaça; nunca use galhos de aroeira como lenha da fogueira!',
      'Comigo-ninguém-pode e Mandioca-brava: Contêm oxalato de cálcio / ácido cianídrico; em caso de ingestão acidental, enxágue a boca com água (sem engolir) e procure socorro médico.'
    ],
    neverDo: 'Nunca provoque vômito em intoxicações por plantas cáusticas nem queime lenha desconhecida ou com látex branco leitoso.'
  }
];

const FieldManualTools: React.FC<FieldManualToolsProps> = ({ club, initialTab = 'NOS_AMARRAS' }) => {
  const isPathfinder = club === ClubType.PATHFINDER;
  const storageKeyMastered = `dbv_mastered_knots_${isPathfinder ? 'DBV' : 'AVT'}`;

  const [activeTab, setActiveTab] = useState<ManualTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // ============================================================================
  // 1. ESTADOS DE NÓS E AMARRAS
  // ============================================================================
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('TODOS');
  const [selectedKnotId, setSelectedKnotId] = useState<string>(KNOTS_DATABASE[0].id);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [isKnotZoomOpen, setIsKnotZoomOpen] = useState<boolean>(false);
  const [masteredKnots, setMasteredKnots] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeyMastered);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKeyMastered, JSON.stringify(masteredKnots));
    } catch {}
  }, [masteredKnots, storageKeyMastered]);

  const filteredKnots = useMemo(() => {
    if (selectedClassFilter === 'TODOS') return KNOTS_DATABASE;
    return KNOTS_DATABASE.filter((k) => k.classLevel === selectedClassFilter);
  }, [selectedClassFilter]);

  const currentKnot = useMemo(() => {
    return KNOTS_DATABASE.find((k) => k.id === selectedKnotId) || filteredKnots[0] || KNOTS_DATABASE[0];
  }, [selectedKnotId, filteredKnots]);

  const toggleMasteredKnot = (id: string) => {
    setMasteredKnots((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  };

  // ============================================================================
  // 2. ESTADOS DO TRADUTOR DE CÓDIGOS (MORSE, SEMÁFORA, LIBRAS, SINAIS DE PISTA)
  // ============================================================================
  const [codeSubTab, setCodeSubTab] = useState<CodeSubTab>('TRADUTOR_MORSE');
  const [inputText, setInputText] = useState<string>('MARANATA');
  const [isPlayingMorseAudio, setIsPlayingMorseAudio] = useState<boolean>(false);
  const [isFlashingMorseLight, setIsFlashingMorseLight] = useState<boolean>(false);
  const [lightActiveOn, setLightActiveOn] = useState<boolean>(false);
  const [activeCharIndex, setActiveCharIndex] = useState<number | null>(null);
  const [semaphorePlayIdx, setSemaphorePlayIdx] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const cancelPlaybackRef = useRef<boolean>(false);

  const normalizedChars = useMemo(() => {
    return inputText
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .split('')
      .filter((ch) => /[A-Z0-9\s]/.test(ch));
  }, [inputText]);

  const stopAllSignalPlayback = () => {
    cancelPlaybackRef.current = true;
    setIsPlayingMorseAudio(false);
    setIsFlashingMorseLight(false);
    setLightActiveOn(false);
    setActiveCharIndex(null);
    setSemaphorePlayIdx(null);
  };

  useEffect(() => {
    return () => {
      cancelPlaybackRef.current = true;
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const playSingleTone = async (durationMs: number, playAudio: boolean, flashLight: boolean) => {
    if (cancelPlaybackRef.current) return;

    if (flashLight) setLightActiveOn(true);

    let osc: OscillatorNode | null = null;
    let gain: GainNode | null = null;

    if (playAudio) {
      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }
        if (audioCtxRef.current.state === 'suspended') {
          await audioCtxRef.current.resume();
        }
        osc = audioCtxRef.current.createOscillator();
        gain = audioCtxRef.current.createGain();
        osc.type = 'sine';
        osc.frequency.value = 760; // Frequência limpa de apito
        gain.gain.setValueAtTime(0.22, audioCtxRef.current.currentTime);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
      } catch {}
    }

    await sleep(durationMs);

    if (osc) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    }
    if (flashLight) setLightActiveOn(false);
  };

  const handlePlayMorseSequence = async (mode: 'AUDIO' | 'LIGHT' | 'BOTH') => {
    if (isPlayingMorseAudio || isFlashingMorseLight) {
      stopAllSignalPlayback();
      return;
    }

    cancelPlaybackRef.current = false;
    const playAudio = mode === 'AUDIO' || mode === 'BOTH';
    const flashLight = mode === 'LIGHT' || mode === 'BOTH';

    if (playAudio) setIsPlayingMorseAudio(true);
    if (flashLight) setIsFlashingMorseLight(true);

    const ditMs = 110;
    const dahMs = ditMs * 3;

    for (let i = 0; i < normalizedChars.length; i++) {
      if (cancelPlaybackRef.current) break;
      const ch = normalizedChars[i];
      setActiveCharIndex(i);

      if (ch === ' ') {
        await sleep(ditMs * 5);
        continue;
      }

      const code = MORSE_MAP[ch];
      if (!code) continue;

      for (let s = 0; s < code.length; s++) {
        if (cancelPlaybackRef.current) break;
        const sym = code[s];
        await playSingleTone(sym === '.' ? ditMs : dahMs, playAudio, flashLight);
        await sleep(ditMs);
      }
      await sleep(ditMs * 2.5);
    }

    stopAllSignalPlayback();
  };

  const handlePlaySingleLetterMorse = async (letter: string) => {
    stopAllSignalPlayback();
    await sleep(40);
    cancelPlaybackRef.current = false;
    const code = MORSE_MAP[letter];
    if (!code) return;
    const ditMs = 110;
    for (let s = 0; s < code.length; s++) {
      if (cancelPlaybackRef.current) break;
      await playSingleTone(code[s] === '.' ? ditMs : ditMs * 3, true, true);
      await sleep(ditMs);
    }
  };

  const handleAnimateSemaphoreWord = async () => {
    if (semaphorePlayIdx !== null) {
      stopAllSignalPlayback();
      return;
    }
    cancelPlaybackRef.current = false;
    const lettersOnly = normalizedChars.filter((c) => /[A-Z]/.test(c));
    for (let i = 0; i < lettersOnly.length; i++) {
      if (cancelPlaybackRef.current) break;
      setSemaphorePlayIdx(i);
      await sleep(950);
    }
    setSemaphorePlayIdx(null);
  };

  // ============================================================================
  // 3. ESTADOS DE PRIMEIROS SOCORROS E PEÇONHENTOS
  // ============================================================================
  const [selectedFirstAidCat, setSelectedFirstAidCat] = useState<FirstAidCategory>('TODOS');
  const [firstAidSearch, setFirstAidSearch] = useState<string>('');

  const filteredFirstAidCards = useMemo(() => {
    return FIRST_AID_CARDS.filter((card) => {
      const matchesCat = selectedFirstAidCat === 'TODOS' || card.category === selectedFirstAidCat;
      if (!matchesCat) return false;
      if (!firstAidSearch.trim()) return true;
      const q = firstAidSearch.toLowerCase();
      return (
        card.title.toLowerCase().includes(q) ||
        card.categoryLabel.toLowerCase().includes(q) ||
        card.stepsToDo.some((s) => s.toLowerCase().includes(q)) ||
        card.neverDo.toLowerCase().includes(q)
      );
    });
  }, [selectedFirstAidCat, firstAidSearch]);

  // ============================================================================
  // RENDERIZADORES VISUAIS SVG (NÓS, SEMÁFORA E SINAIS DE PISTA)
  // ============================================================================
  const renderKnotSvg = (svgType: KnotGuideItem['svgType'], stepIdx: number) => {
    return (
      <svg viewBox="0 0 260 150" className="w-full h-36 sm:h-44 mx-auto drop-shadow-sm select-none">
        <defs>
          <linearGradient id="ropeRed" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <linearGradient id="ropeBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="bambooGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>

        {svgType === 'DIREITO' || svgType === 'CIRURGIAO' ? (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Alça Esquerda (Azul) */}
            <path
              d="M 25 45 C 85 45, 115 45, 115 75 C 115 105, 85 105, 25 105"
              stroke="url(#ropeBlue)"
              strokeWidth="12"
            />
            {/* Alça Direita Entrelaçada (Vermelha) */}
            <path
              d={
                stepIdx === 0
                  ? 'M 235 45 C 165 45, 130 65, 95 95'
                  : 'M 235 45 C 175 45, 145 45, 145 75 C 145 105, 175 105, 235 105'
              }
              stroke="url(#ropeRed)"
              strokeWidth="12"
              transform={stepIdx >= 1 ? 'translate(-42, 0)' : ''}
            />
            {svgType === 'CIRURGIAO' && (
              <circle cx="130" cy="75" r="14" stroke="#fbbf24" strokeWidth="3" strokeDasharray="4 3" />
            )}
            <text x="130" y="138" textAnchor="middle" className="fill-slate-400 text-[10px] font-bold">
              {svgType === 'CIRURGIAO' ? 'Dupla torção na base + fechamento plano' : 'Direito sobre Direito • Esquerdo sobre Esquerdo'}
            </text>
          </g>
        ) : svgType === 'LAIS_GUIA' ? (
          <g fill="none" strokeLinecap="round">
            {/* Cabo firme vertical ("Árvore") */}
            <path d="M 130 12 L 130 95" stroke="url(#ropeBlue)" strokeWidth="11" />
            {/* O "Lago" (Cote central) */}
            <circle cx="130" cy="60" r="18" stroke="url(#ropeBlue)" strokeWidth="10" fill="#0f172a" fillOpacity="0.15" />
            {/* A "Cobrinha" e a grande alça fixa */}
            {stepIdx >= 1 && (
              <path
                d="M 130 60 C 75 85, 75 135, 130 135 C 185 135, 185 85, 130 42 C 112 32, 148 32, 130 60"
                stroke="url(#ropeRed)"
                strokeWidth="10"
              />
            )}
          </g>
        ) : svgType === 'FIEL' ? (
          <g fill="none" strokeLinecap="round">
            {/* Tronco de Madeira Horizontal */}
            <rect x="30" y="55" width="200" height="36" rx="10" fill="url(#bambooGrad)" />
            {/* Duas Voltas Verticais + Diagonal Central */}
            <path d="M 95 30 L 95 110" stroke="url(#ropeBlue)" strokeWidth="11" />
            {stepIdx >= 1 && <path d="M 165 30 L 165 110" stroke="url(#ropeBlue)" strokeWidth="11" />}
            <path d="M 75 105 L 185 40" stroke="url(#ropeRed)" strokeWidth="11" />
          </g>
        ) : svgType === 'ESCOTA' ? (
          <g fill="none" strokeLinecap="round">
            {/* Seio em U da Corda Grossa */}
            <path d="M 35 50 L 145 50 C 175 50, 175 100, 145 100 L 35 100" stroke="url(#ropeBlue)" strokeWidth="14" />
            {/* Corda Fina contornando e travando */}
            <path
              d="M 225 75 L 130 75 C 110 30, 165 30, 155 112 L 125 65"
              stroke="url(#ropeRed)"
              strokeWidth="8"
            />
          </g>
        ) : svgType === 'AMARRA_QUADRADA' || svgType === 'AMARRA_DIAGONAL' ? (
          <g fill="none" strokeLinecap="round">
            {/* Duas Varas de Bambu Cruzadas */}
            <rect
              x="114"
              y="12"
              width="32"
              height="126"
              rx="8"
              fill="url(#bambooGrad)"
              transform={svgType === 'AMARRA_DIAGONAL' ? 'rotate(-28 130 75)' : ''}
            />
            <rect
              x="35"
              y="59"
              width="190"
              height="32"
              rx="8"
              fill="url(#bambooGrad)"
              transform={svgType === 'AMARRA_DIAGONAL' ? 'rotate(28 130 75)' : ''}
            />
            {/* Voltas de Corda de Sisal */}
            <rect x="104" y="49" width="52" height="52" rx="8" stroke="url(#ropeRed)" strokeWidth="8" />
            <line x1="104" y1="49" x2="156" y2="101" stroke="url(#ropeBlue)" strokeWidth="7" />
            <line x1="156" y1="49" x2="104" y2="101" stroke="url(#ropeBlue)" strokeWidth="7" />
          </g>
        ) : svgType === 'AMARRA_PARALELA' || svgType === 'AMARRA_TRIPE' ? (
          <g fill="none" strokeLinecap="round">
            <rect x="40" y="38" width="180" height="22" rx="6" fill="url(#bambooGrad)" />
            <rect x="40" y="64" width="180" height="22" rx="6" fill="url(#bambooGrad)" />
            {svgType === 'AMARRA_TRIPE' && (
              <rect x="40" y="90" width="180" height="22" rx="6" fill="url(#bambooGrad)" />
            )}
            {[95, 110, 125, 140, 155, 170].map((xPos) => (
              <line
                key={xPos}
                x1={xPos}
                y1="34"
                x2={xPos}
                y2={svgType === 'AMARRA_TRIPE' ? '116' : '90'}
                stroke="url(#ropeRed)"
                strokeWidth="8"
              />
            ))}
          </g>
        ) : (
          <g fill="none" strokeLinecap="round">
            <path d="M 30 75 L 230 75" stroke="url(#ropeBlue)" strokeWidth="12" />
            <circle cx="110" cy="75" r="18" stroke="url(#ropeRed)" strokeWidth="9" />
            <circle cx="150" cy="75" r="18" stroke="url(#ropeRed)" strokeWidth="9" />
          </g>
        )}
      </svg>
    );
  };

  // Renderiza o boneco de Semáfora com as duas bandeirolas nos ângulos oficiais da letra
  const renderSemaphoreFigure = (letter: string, size: 'SMALL' | 'LARGE' = 'SMALL') => {
    const angles = SEMAPHORE_ANGLES[letter];
    if (!angles) return null;

    const toCoords = (deg: number, armLen: number) => {
      // 0 deg = para baixo (0, +1), sentido horário
      const rad = (deg * Math.PI) / 180;
      const dx = -Math.sin(rad) * armLen;
      const dy = Math.cos(rad) * armLen;
      return { dx, dy };
    };

    const leftArm = toCoords(angles[0], 26);
    const rightArm = toCoords(angles[1], 26);

    return (
      <svg
        viewBox="0 0 100 100"
        className={size === 'LARGE' ? 'w-32 h-32 mx-auto' : 'w-16 h-16 mx-auto'}
      >
        {/* Corpo do Desbravador */}
        <circle cx="50" cy="24" r="7" className="fill-slate-700 dark:fill-slate-200" />
        <rect x="44" y="33" width="12" height="28" rx="4" className="fill-indigo-600" />
        <line x1="46" y1="61" x2="44" y2="84" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-slate-600 dark:text-slate-300" />
        <line x1="54" y1="61" x2="56" y2="84" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-slate-600 dark:text-slate-300" />

        {/* Braço e Bandeirola Direita do Boneco (Esquerda da tela: x=44, y=37) */}
        <line
          x1="44"
          y1="37"
          x2={44 + leftArm.dx}
          y2={37 + leftArm.dy}
          stroke="#ef4444"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <rect
          x={44 + leftArm.dx - 5}
          y={37 + leftArm.dy - 5}
          width="10"
          height="10"
          rx="1.5"
          fill="#ef4444"
          stroke="#fbbf24"
          strokeWidth="1.5"
        />

        {/* Braço e Bandeirola Esquerda do Boneco (Direita da tela: x=56, y=37) */}
        <line
          x1="56"
          y1="37"
          x2={56 + rightArm.dx}
          y2={37 + rightArm.dy}
          stroke="#f59e0b"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <rect
          x={56 + rightArm.dx - 5}
          y={37 + rightArm.dy - 5}
          width="10"
          height="10"
          rx="1.5"
          fill="#fbbf24"
          stroke="#ef4444"
          strokeWidth="1.5"
        />
      </svg>
    );
  };

  const renderTrailSignSvg = (svgType: string) => {
    return (
      <svg viewBox="0 0 80 60" className="w-16 h-12 shrink-0 text-indigo-600 dark:text-indigo-400">
        {svgType === 'ARROW_UP' && (
          <path d="M 40 52 L 40 10 M 26 24 L 40 10 L 54 24" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {svgType === 'ARROW_RIGHT' && (
          <path d="M 14 30 L 64 30 M 50 16 L 64 30 L 50 44" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {svgType === 'ARROW_LEFT' && (
          <path d="M 66 30 L 16 30 M 30 16 L 16 30 L 30 44" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {svgType === 'CROSS_X' && (
          <path d="M 22 12 L 58 48 M 58 12 L 22 48" stroke="#ef4444" strokeWidth="6" fill="none" strokeLinecap="round" />
        )}
        {svgType === 'TRIANGLE' && (
          <polygon points="40,10 18,48 62,48" stroke="#f59e0b" strokeWidth="5" fill="none" strokeLinejoin="round" />
        )}
        {svgType === 'WATER_GOOD' && (
          <g stroke="#0ea5e9" strokeWidth="4" fill="none" strokeLinecap="round">
            <path d="M 16 24 Q 28 16, 40 24 T 64 24" />
            <path d="M 16 38 Q 28 30, 40 38 T 64 38" />
          </g>
        )}
        {svgType === 'WATER_BAD' && (
          <g fill="none" strokeLinecap="round">
            <path d="M 16 24 Q 28 16, 40 24 T 64 24" stroke="#64748b" strokeWidth="4" />
            <path d="M 16 38 Q 28 30, 40 38 T 64 38" stroke="#64748b" strokeWidth="4" />
            <line x1="22" y1="12" x2="58" y2="48" stroke="#ef4444" strokeWidth="5" />
          </g>
        )}
        {svgType === 'CAMP' && (
          <g stroke="#10b981" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="34,12 14,46 54,46" />
            <path d="M 56 30 L 72 30 M 65 23 L 72 30 L 65 37" />
          </g>
        )}
        {svgType === 'MESSAGE' && (
          <g stroke="currentColor" strokeWidth="4" fill="none">
            <rect x="16" y="14" width="34" height="32" rx="4" />
            <text x="33" y="35" textAnchor="middle" stroke="none" fill="currentColor" className="text-xs font-black">
              3
            </text>
            <path d="M 54 30 L 70 30 M 64 24 L 70 30 L 64 36" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        {svgType === 'END_TRAIL' && (
          <g stroke="#10b981" strokeWidth="4.5" fill="none">
            <circle cx="40" cy="30" r="20" />
            <circle cx="40" cy="30" r="5" fill="#10b981" />
          </g>
        )}
      </svg>
    );
  };

  return (
    <div className="animate-slide-in space-y-5 pb-28 max-w-5xl mx-auto">
      {/* Banner Principal + Navegação Clara entre as 3 Ferramentas Práticas */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[28px] p-4 sm:p-6 text-white shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 text-white/10 pointer-events-none">
          <Compass className="w-36 h-36 stroke-[1.2]" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-widest">
              <Compass size={12} />
              <span>Manual Prático de Instrução & Campo</span>
            </div>
            <h3 className="text-base sm:text-xl font-black uppercase tracking-tight mt-1">
              Nós e Amarras • Códigos • Primeiros Socorros
            </h3>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2 text-center shrink-0 self-start sm:self-auto">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-200 block">
              Nós Dominados
            </span>
            <span className="text-sm font-black text-white">
              {masteredKnots.length}/{KNOTS_DATABASE.length}
            </span>
          </div>
        </div>

        {/* 3 Botões Superiores Claros e Sem Corte no Celular */}
        <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3 mt-4 pt-4 border-t border-white/15">
          <button
            type="button"
            onClick={() => {
              stopAllSignalPlayback();
              setActiveTab('NOS_AMARRAS');
            }}
            className={`py-2.5 px-1.5 sm:px-4 rounded-2xl transition-all active:scale-95 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 text-center sm:text-left border ${
              activeTab === 'NOS_AMARRAS'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg ring-2 ring-inset ring-white/40'
                : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
            }`}
          >
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                activeTab === 'NOS_AMARRAS' ? 'bg-slate-950/15 text-slate-950' : 'bg-white/15 text-amber-300'
              }`}
            >
              <Compass size={18} strokeWidth={2.5} />
            </div>
            <div className="leading-tight min-w-0">
              <span className="font-black text-[11px] sm:text-xs uppercase tracking-tight block">
                Nós & Amarras
              </span>
              <span
                className={`text-[8.5px] sm:text-[10px] font-bold block mt-0.5 ${
                  activeTab === 'NOS_AMARRAS' ? 'text-slate-900/80' : 'text-indigo-100/80'
                }`}
              >
                Passo a Passo
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              stopAllSignalPlayback();
              setActiveTab('CODIGOS');
            }}
            className={`py-2.5 px-1.5 sm:px-4 rounded-2xl transition-all active:scale-95 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 text-center sm:text-left border ${
              activeTab === 'CODIGOS'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg ring-2 ring-inset ring-white/40'
                : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
            }`}
          >
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                activeTab === 'CODIGOS' ? 'bg-slate-950/15 text-slate-950' : 'bg-white/15 text-amber-300'
              }`}
            >
              <Radio size={18} strokeWidth={2.5} />
            </div>
            <div className="leading-tight min-w-0">
              <span className="font-black text-[11px] sm:text-xs uppercase tracking-tight block">
                Códigos
              </span>
              <span
                className={`text-[8.5px] sm:text-[10px] font-bold block mt-0.5 ${
                  activeTab === 'CODIGOS' ? 'text-slate-900/80' : 'text-indigo-100/80'
                }`}
              >
                Morse & Sinais
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              stopAllSignalPlayback();
              setActiveTab('PRIMEIROS_SOCORROS');
            }}
            className={`py-2.5 px-1.5 sm:px-4 rounded-2xl transition-all active:scale-95 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 text-center sm:text-left border ${
              activeTab === 'PRIMEIROS_SOCORROS'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg ring-2 ring-inset ring-white/40'
                : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
            }`}
          >
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                activeTab === 'PRIMEIROS_SOCORROS' ? 'bg-slate-950/15 text-slate-950' : 'bg-white/15 text-amber-300'
              }`}
            >
              <HeartPulse size={18} strokeWidth={2.5} />
            </div>
            <div className="leading-tight min-w-0">
              <span className="font-black text-[11px] sm:text-xs uppercase tracking-tight block">
                Socorros
              </span>
              <span
                className={`text-[8.5px] sm:text-[10px] font-bold block mt-0.5 ${
                  activeTab === 'PRIMEIROS_SOCORROS' ? 'text-slate-900/80' : 'text-indigo-100/80'
                }`}
              >
                Guia & Peçonhentos
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================
          MÓDULO 1: PASSO A PASSO DE NÓS E AMARRAS (SEPARADO POR CLASSE)
          ======================================================================== */}
      {activeTab === 'NOS_AMARRAS' && (
        <div className="space-y-4">
          {/* Filtro por Classe (Amigo a Guia) */}
          <div className="bg-white dark:bg-slate-800 rounded-[24px] p-3.5 sm:p-4 border border-slate-100 dark:border-slate-700 shadow-xs space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">
              Filtrar por Classe Progressiva / Pioneiria
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
              {[
                { id: 'TODOS', label: 'Todos (12)' },
                { id: 'AMIGO', label: 'Amigo (Nós Básicos)' },
                { id: 'COMPANHEIRO', label: 'Companheiro (Amarras)' },
                { id: 'PESQUISADOR_PIONEIRO', label: 'Pesquisador & Pioneiro' },
                { id: 'EXCURSIONISTA_GUIA', label: 'Excursionista & Guia' }
              ].map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => {
                    setSelectedClassFilter(cls.id);
                    const firstMatch =
                      cls.id === 'TODOS'
                        ? KNOTS_DATABASE[0]
                        : KNOTS_DATABASE.find((k) => k.classLevel === cls.id);
                    if (firstMatch) {
                      setSelectedKnotId(firstMatch.id);
                      setActiveStepIdx(0);
                    }
                  }}
                  className={`px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                    selectedClassFilter === cls.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cls.label}
                </button>
              ))}
            </div>

            {/* Grade de Seleção de Nó / Amarra */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
              {filteredKnots.map((k) => {
                const isSelected = currentKnot.id === k.id;
                const isMastered = masteredKnots.includes(k.id);
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => {
                      setSelectedKnotId(k.id);
                      setActiveStepIdx(0);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <span
                        className={`text-[8.5px] font-black uppercase tracking-wider block truncate ${
                          isSelected ? 'text-indigo-200' : 'text-slate-400'
                        }`}
                      >
                        {k.category === 'AMARRA' ? 'Amarra' : 'Nó Oficial'}
                      </span>
                      <span className="text-xs font-black leading-tight block truncate">
                        {k.name}
                      </span>
                    </div>
                    {isMastered && (
                      <CheckCircle2
                        size={15}
                        className={isSelected ? 'text-amber-300 shrink-0' : 'text-emerald-500 shrink-0'}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card Detalhado de Instrução Passo a Passo do Nó/Amarra Selecionado */}
          <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider ${currentKnot.classColor}`}>
                  {currentKnot.classLabel}
                </span>
                <h4 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mt-1">
                  {currentKnot.name}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => toggleMasteredKnot(currentKnot.id)}
                className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 border transition-all active:scale-95 shrink-0 ${
                  masteredKnots.includes(currentKnot.id)
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                }`}
              >
                <Check size={15} strokeWidth={3} />
                <span>{masteredKnots.includes(currentKnot.id) ? 'Nó Dominado!' : 'Marcar como Dominado'}</span>
              </button>
            </div>

            {/* Fotografia / Ilustração Real do Nó ou Amarra + Seletor de Passos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-700 text-center space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <span>Demonstração Visual Real</span>
                  <button
                    type="button"
                    onClick={() => setIsKnotZoomOpen(true)}
                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-black"
                  >
                    <ZoomIn size={13} />
                    <span>Ampliar Imagem</span>
                  </button>
                </div>

                <div
                  onClick={() => setIsKnotZoomOpen(true)}
                  className="cursor-zoom-in bg-white rounded-xl p-3 border border-slate-200/80 flex items-center justify-center h-52 sm:h-60 overflow-hidden shadow-inner group relative"
                >
                  <img
                    src={currentKnot.imageUrl}
                    alt={currentKnot.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-snug">
                  {currentKnot.imageCaption}
                </p>
              </div>

              {/* Lista Interativa dos Passos */}
              <div className="space-y-2.5">
                {currentKnot.steps.map((st, idx) => {
                  const isCurrentStep = activeStepIdx === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveStepIdx(idx)}
                      className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                        isCurrentStep
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500 shadow-xs'
                          : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-700'
                      }`}
                    >
                      <h5 className="font-black text-xs sm:text-sm text-indigo-700 dark:text-indigo-300 uppercase tracking-tight">
                        {st.title}
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                        {st.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Para que Serve na Pioneiria + Dica de Segurança */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300 block">
                  Para que serve na Prática e Pioneiria
                </span>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                  {currentKnot.practicalUse}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300 block">
                  Dica Técnica do Instrutor
                </span>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                  {currentKnot.safetyTip}
                </p>
              </div>
            </div>
          </div>

          {/* Modal de Zoom da Imagem do Nó/Amarra */}
          {isKnotZoomOpen && (
            <div
              onClick={() => setIsKnotZoomOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider ${currentKnot.classColor}`}>
                      {currentKnot.classLabel}
                    </span>
                    <h4 className="font-black text-base sm:text-lg text-slate-800 dark:text-white uppercase tracking-tight mt-1">
                      {currentKnot.name}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsKnotZoomOpen(false)}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-center max-h-[65vh] overflow-hidden">
                  <img
                    src={currentKnot.imageUrl}
                    alt={currentKnot.name}
                    className="max-h-[60vh] max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <p className="text-xs font-bold text-center text-slate-600 dark:text-slate-300">
                  {currentKnot.imageCaption}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================
          MÓDULO 2: TRADUTOR E GUIA DE CÓDIGOS (MORSE, SEMÁFORA, LIBRAS E PISTA)
          ======================================================================== */}
      {activeTab === 'CODIGOS' && (
        <div className="space-y-4">
          {/* Sub-abas dos 4 Sistemas de Código */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'TRADUTOR_MORSE' as CodeSubTab, label: 'Código Morse (Som/Luz)', icon: Radio },
              { id: 'SEMAFORA' as CodeSubTab, label: 'Código Semáfora', icon: Flag },
              { id: 'LIBRAS' as CodeSubTab, label: 'Alfabeto Libras', icon: Hand },
              { id: 'SINAIS_PISTA' as CodeSubTab, label: 'Sinais de Pista', icon: MapPin }
            ].map((sub) => {
              const SubIcon = sub.icon;
              const isAct = codeSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    stopAllSignalPlayback();
                    setCodeSubTab(sub.id);
                  }}
                  className={`p-3 rounded-2xl border font-black text-[11px] uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-95 ${
                    isAct
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <SubIcon size={15} />
                  <span className="truncate">{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* Barra de Digitação Instantânea (para Morse, Semáfora e Libras) */}
          {codeSubTab !== 'SINAIS_PISTA' && (
            <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Digite a Palavra ou Mensagem para Traduzir Instantaneamente:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['MARANATA', 'DESBRAVADOR', 'SOS', 'SEMPRE ALERTA'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        stopAllSignalPlayback();
                        setInputText(preset);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  stopAllSignalPlayback();
                  setInputText(e.target.value);
                }}
                placeholder="Digite qualquer palavra..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-black text-base sm:text-lg uppercase tracking-wider text-slate-800 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* 2.1 TRADUTOR DE CÓDIGO MORSE (COM APITO E LANTERNA VISUAL) */}
          {codeSubTab === 'TRADUTOR_MORSE' && (
            <div className="space-y-4">
              {/* Painel de Transmissão Sonora e Luminosa */}
              <div
                className={`rounded-[26px] p-5 border transition-all duration-100 ${
                  lightActiveOn
                    ? 'bg-amber-300 text-slate-950 border-amber-400 shadow-2xl shadow-amber-400/50 scale-[1.01]'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-100 dark:border-slate-700 shadow-sm'
                } space-y-4`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
                      Tradução Instantânea em Código Morse (• Ponto Curto | — Traço Longo)
                    </span>
                    <h4 className="font-black text-sm sm:text-base uppercase tracking-tight">
                      Toque em uma letra ou transmita a mensagem completa
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePlayMorseSequence('AUDIO')}
                      className={`px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all active:scale-95 ${
                        isPlayingMorseAudio
                          ? 'bg-red-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      }`}
                    >
                      {isPlayingMorseAudio ? <Square size={14} /> : <Volume2 size={15} />}
                      <span>{isPlayingMorseAudio ? 'Parar Apito' : 'Emitir Apito / Som'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlayMorseSequence('BOTH')}
                      className={`px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all active:scale-95 ${
                        isFlashingMorseLight
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                      }`}
                    >
                      <Sun size={15} />
                      <span>{isFlashingMorseLight ? 'Parar Sinal' : 'Piscar Tela + Som'}</span>
                    </button>
                  </div>
                </div>

                {/* Cartões de Cada Letra da Palavra Digitada em Morse */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {normalizedChars.map((ch, idx) => {
                    if (ch === ' ') {
                      return (
                        <div
                          key={idx}
                          className="px-3 py-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] font-black uppercase text-slate-400"
                        >
                          Espaço (/)
                        </div>
                      );
                    }
                    const code = MORSE_MAP[ch] || '';
                    const isHighlighted = activeCharIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePlaySingleLetterMorse(ch)}
                        className={`min-w-[68px] p-3 rounded-2xl border text-center transition-all ${
                          isHighlighted
                            ? 'bg-indigo-600 text-white border-indigo-400 scale-105 shadow-lg'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        <span className="text-base font-black block">{ch}</span>
                        <span className="text-sm font-black tracking-[0.2em] text-amber-500 block mt-0.5">
                          {code.replace(/\./g, '•').replace(/-/g, '—')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tabela Completa de Referência Morse (A-Z e 0-9) */}
              <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 border border-slate-100 dark:border-slate-700 shadow-xs space-y-3">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tabela Oficial Internacional de Código Morse (Toque para Ouvir o Apito)
                </h5>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-2">
                  {Object.entries(MORSE_MAP).map(([char, code]) => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => handlePlaySingleLetterMorse(char)}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200/70 dark:border-slate-700 text-center transition-all active:scale-95"
                    >
                      <span className="text-xs font-black text-slate-800 dark:text-white block">{char}</span>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 tracking-widest block">
                        {code.replace(/\./g, '•').replace(/-/g, '—')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2.2 TRADUTOR VISUAL DE CÓDIGO SEMÁFORA (BANDEIROLAS) */}
          {codeSubTab === 'SEMAFORA' && (
            <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight">
                    Posição das Bandeirolas em Código Semáfora
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Visão de frente do sinaleiro com bandeirolas vermelha e amarela.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAnimateSemaphoreWord}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 active:scale-95 transition-all self-start sm:self-auto"
                >
                  <Play size={14} fill="currentColor" />
                  <span>{semaphorePlayIdx !== null ? 'Parar Animação' : 'Animar Letra por Letra'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                {normalizedChars
                  .filter((c) => /[A-Z]/.test(c))
                  .map((ch, idx) => {
                    const isPlayingThis = semaphorePlayIdx === idx;
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-2xl border text-center transition-all ${
                          isPlayingThis
                            ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 scale-105 shadow-md'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {renderSemaphoreFigure(ch, 'SMALL')}
                        <span className="font-black text-sm text-slate-800 dark:text-white block mt-1">
                          {ch}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 2.3 GUIA DO ALFABETO MANUAL EM LIBRAS */}
          {codeSubTab === 'LIBRAS' && (
            <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <div>
                <h4 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight">
                  Datilologia em Libras (Configuração de Mão Letra por Letra)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Como posicionar os dedos para soletrar cada letra da palavra digitada:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {normalizedChars
                  .filter((c) => /[A-Z]/.test(c))
                  .map((ch, idx) => {
                    const info = LIBRAS_GUIDE[ch];
                    if (!info) return null;
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex items-start space-x-3"
                      >
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                          {ch}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 dark:text-white leading-snug">
                            {info.handShape}
                          </p>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block mt-1">
                            {info.tip}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 2.4 TABELA VISUAL DE SINAIS DE PISTA PARA TRILHAS */}
          {codeSubTab === 'SINAIS_PISTA' && (
            <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <div>
                <h4 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight">
                  Tabela Oficial de Sinais de Pista para Trilhas e Acampamentos
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Os sinais devem ser feitos sempre do lado DIREITO da trilha com gravetos, pedras ou capim (sem agredir árvores vivas).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TRAIL_SIGNS.map((sign) => (
                  <div
                    key={sign.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex items-center space-x-3.5"
                  >
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {renderTrailSignSvg(sign.svgType)}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-black text-xs sm:text-sm text-slate-800 dark:text-white uppercase tracking-tight">
                        {sign.name}
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5 leading-snug">
                        {sign.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================
          MÓDULO 3: GUIA RÁPIDO DE PRIMEIROS SOCORROS E PEÇONHENTOS / PLANTAS
          ======================================================================== */}
      {activeTab === 'PRIMEIROS_SOCORROS' && (
        <div className="space-y-4">
          {/* Busca e Filtro Rápido */}
          <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 border border-slate-100 dark:border-slate-700 shadow-xs space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={firstAidSearch}
                onChange={(e) => setFirstAidSearch(e.target.value)}
                placeholder="Buscar por engasgo, queimadura, picada de cobra, maca, bandagem..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {[
                { id: 'TODOS' as FirstAidCategory, label: 'Todos os Guias (8)' },
                { id: 'BANDAGENS' as FirstAidCategory, label: 'Bandagens & Ataduras' },
                { id: 'TRANSPORTE' as FirstAidCategory, label: 'Transporte & Macas' },
                { id: 'EMERGENCIAS' as FirstAidCategory, label: 'Queimaduras & Engasgo' },
                { id: 'PECONHENTOS_PLANTAS' as FirstAidCategory, label: 'Peçonhentos & Plantas' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedFirstAidCat(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                    selectedFirstAidCat === cat.id
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cartões de Consulta Rápida de Primeiros Socorros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFirstAidCards.map((card) => (
              <div
                key={card.id}
                className="bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[9.5px] font-black uppercase tracking-wider">
                      {card.categoryLabel}
                    </span>
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400">
                      {card.urgencyBadge}
                    </span>
                  </div>

                  <h5 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight leading-snug">
                    {card.title}
                  </h5>

                  <div className="space-y-2">
                    {card.stepsToDo.map((step, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-200">
                        <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="font-medium leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-red-50/80 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50 flex items-start space-x-2">
                  <AlertTriangle size={15} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-red-900 dark:text-red-200 leading-snug">
                    <strong className="uppercase">O que NUNCA fazer: </strong>
                    {card.neverDo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldManualTools;
