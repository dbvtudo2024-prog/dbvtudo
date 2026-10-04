import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  classLevel: 'AMIGO' | 'COMPANHEIRO' | 'PESQUISADOR_GUIA';
  alsoInCompanheiro?: boolean;
  classLabel: string;
  classColor: string;
  category: 'NO' | 'AMARRA';
  image3dUrl: string;
  imageCaption: string;
  practicalUse: string;
  safetyTip: string;
  steps: KnotStep[];
}

const KNOTS_DATABASE: KnotGuideItem[] = [
  // ==========================================================================
  // CLASSE DE AMIGO (14 NÓS OFICIAIS DO CARTÃO: a-n)
  // ==========================================================================
  {
    id: 'no_simples',
    name: 'a) Nó Simples (Meia-Volta)',
    classLevel: 'AMIGO',
    alsoInCompanheiro: true,
    classLabel: 'Classe de Amigo & Companheiro',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/no_simples.webp',
    imageCaption: 'Renderização 3D do Nó Simples (base para diversos outros nós e retenção na ponta do cabo)',
    practicalUse: 'Evitar que a ponta de uma corda desfie provisoriamente, servir de trava (stopper) na extremidade ou iniciar o Nó de Pescador.',
    safetyTip: 'Atenção: quando submetido a muita tensão ou molhado, aperta demasiadamente e torna-se difícil de desatar.',
    steps: [
      { title: '1. Forme uma alça (cote) na corda', description: 'Cruze o chicote (ponta) por cima do cabo firme formando um pequeno anel.' },
      { title: '2. Passe a ponta por dentro do anel', description: 'Introduza o chicote por trás e para frente através do interior da alça.' },
      { title: '3. Puxe as duas extremidades', description: 'Estique o chicote e o cabo firme para ajustar o nó.' }
    ]
  },
  {
    id: 'no_cego',
    name: 'b) Nó Cego (Nó Torto / da Avó)',
    classLevel: 'AMIGO',
    classLabel: 'Classe de Amigo',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/no_cego.webp',
    imageCaption: 'Renderização 3D do Nó Cego (cruzamento assimétrico ensinado para diferenciar do Nó Direito)',
    practicalUse: 'Ensinado na Classe de Amigo para que o desbravador saiba identificá-lo e EVITÁ-LO: ocorre quando erramos a segunda laçada do Nó Direito.',
    safetyTip: 'Desliza sob tração e, quando aperta, encavala e trava (fica "cego"). Sempre confira se fez Direito com Direito, Esquerdo com Esquerdo.',
    steps: [
      { title: '1. Primeira meia-volta (Direita sobre Esquerda)', description: 'Cruze a ponta da direita por cima e por baixo da ponta da esquerda.' },
      { title: '2. Segunda meia-volta no MESMO sentido (Direita sobre Esquerda)', description: 'Ao repetir o mesmo sentido em vez de inverter, as pontas saem atravessadas (uma para cima e outra para baixo).' },
      { title: '3. Identificação visual para correção', description: 'Observe que os dois elos não ficam paralelos como no Nó Direito — desfaça a segunda volta e corrija!' }
    ]
  },
  {
    id: 'no_direito',
    name: 'c) Nó Direito (Quadrado)',
    classLevel: 'AMIGO',
    alsoInCompanheiro: true,
    classLabel: 'Classe de Amigo & Companheiro',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/no_direito.webp',
    imageCaption: 'Renderização 3D do Nó Direito (Direito sobre Direito, Esquerdo sobre Esquerdo)',
    practicalUse: 'Unir dois cabos de mesma espessura (bitola) que não sofrerão tração excessiva e finalizar ataduras/bandagens de primeiros socorros (por ser plano e não machucar).',
    safetyTip: 'Direito com direito, esquerdo com esquerdo. Nunca use para unir cordas de espessuras diferentes.',
    steps: [
      { title: '1. Primeiro cruzamento (Direita sobre Esquerda)', description: 'Segure uma ponta em cada mão. Passe o chicote da direita por cima e por baixo do chicote da esquerda.' },
      { title: '2. Segundo cruzamento (Esquerda sobre Direita)', description: 'Agora pegue a ponta que está na esquerda e passe por cima e por dentro da alça da direita.' },
      { title: '3. Ajuste simétrico', description: 'Puxe as quatro partes firmemente até formar dois elos simétricos entrelaçados.' }
    ]
  },
  {
    id: 'no_cirurgiao',
    name: 'd) Nó de Cirurgião',
    classLevel: 'AMIGO',
    classLabel: 'Classe de Amigo',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/no_cirurgiao.webp',
    imageCaption: 'Renderização 3D do Nó de Cirurgião com dupla torção na base e fechamento plano',
    practicalUse: 'Variação do Nó Direito com uma volta extra na primeira laçada; evita que o nó afrouxe enquanto você faz a segunda laçada em ataduras médicas ou fardos.',
    safetyTip: 'A volta dupla na base cria atrito extra que mantém a tensão firme antes do fechamento.',
    steps: [
      { title: '1. Volta dupla inicial', description: 'Cruze a ponta direita sobre a esquerda dando DUAS voltas completas (torção dupla na base).' },
      { title: '2. Fechamento superior simples', description: 'Cruze a ponta esquerda sobre a direita dando uma volta simples, igual ao Nó Direito.' },
      { title: '3. Aperto firme', description: 'Tracione as duas pontas para travar o nó de forma plana e segura.' }
    ]
  },
  {
    id: 'lais_de_guia',
    name: 'e) Lais de Guia (Rei dos Nós)',
    classLevel: 'AMIGO',
    alsoInCompanheiro: true,
    classLabel: 'Classe de Amigo & Companheiro',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/lais_de_guia.webp',
    imageCaption: 'Renderização 3D do Lais de Guia (Alça fixa que nunca corre sob tensão)',
    practicalUse: 'Cria uma alça fixa que NUNCA corre nem aperta sob peso. Essencial para salvamento, içar pessoas/equipamentos e amarrar embarcações.',
    safetyTip: 'Mnemônico clássico: "A cobrinha sai do lago (alça), dá a volta por trás da árvore (firme) e entra no lago novamente."',
    steps: [
      { title: '1. Faça o "lago" (pequeno cote)', description: 'Forme uma pequena alça (cote) no cabo firme, deixando a parte superior passando por cima.' },
      { title: '2. Suba pelo lago', description: 'Passe o chicote (ponta) de baixo para cima por dentro do pequeno cote.' },
      { title: '3. Contorne a árvore e volte ao lago', description: 'Passe o chicote por trás do cabo firme principal e introduza-o de volta para baixo dentro do mesmo cote, puxando firme.' }
    ]
  },
  {
    id: 'lais_de_guia_duplo',
    name: 'f) Lais de Guia Duplo',
    classLevel: 'AMIGO',
    classLabel: 'Classe de Amigo',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/lais_de_guia_duplo.webp',
    imageCaption: 'Renderização 3D do Lais de Guia Duplo com alça reforçada e colar duplo',
    practicalUse: 'Versão reforçada do Lais de Guia para resgate e içamento seguro: o colar duplo aumenta o atrito interno e impede que o nó escorregue em cordas sintéticas lisas.',
    safetyTip: 'Excelente para operações de salvamento; mantém todas as vantagens do Lais de Guia simples com segurança redobrada.',
    steps: [
      { title: '1. Forme DOIS anéis sobrepostos ("lago duplo")', description: 'No cabo firme, dê duas voltas circulares pequenas uma sobre a outra.' },
      { title: '2. Passe o chicote pelos dois anéis', description: 'Introduza a ponta de baixo para cima atravessando os dois anéis juntos.' },
      { title: '3. Contorne o cabo firme e desça pelos dois anéis', description: 'Passe por trás do cabo principal e retorne de cima para baixo por dentro dos dois anéis, ajustando firme.' }
    ]
  },
  {
    id: 'no_escota',
    name: 'g) Nó de Escota',
    classLevel: 'AMIGO',
    alsoInCompanheiro: true,
    classLabel: 'Classe de Amigo & Companheiro',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/no_escota.webp',
    imageCaption: 'Renderização 3D do Nó de Escota unindo dois cabos de espessuras distintas',
    practicalUse: 'Unir duas cordas de ESPESSURAS DIFERENTES (uma grossa e uma fina) ou prender a adriça no olhal da Bandeira Oficial para hasteamento no mastro.',
    safetyTip: 'O seio (alça em U) deve ser feito sempre com a corda MAIS GROSSA, e a corda mais fina faz o contorno.',
    steps: [
      { title: '1. Forme um "U" (seio) na corda mais grossa', description: 'Dobre a ponta da corda mais grossa formando uma alça estreita em formato de U.' },
      { title: '2. Entre por baixo e contorne', description: 'Passe a ponta da corda mais fina por dentro do "U" (de baixo para cima) e dê a volta completa por trás das duas pernas do "U".' },
      { title: '3. Trave sob si mesma', description: 'Passe a corda fina por baixo de si mesma (entre ela e o "U" da corda grossa) e puxe para travar.' }
    ]
  },
  {
    id: 'no_catau',
    name: 'h) Nó Catau',
    classLevel: 'AMIGO',
    classLabel: 'Classe de Amigo',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/no_catau.webp',
    imageCaption: 'Renderização 3D do Nó Catau isolando o trecho central e encurtando o cabo',
    practicalUse: 'Encurtar uma corda longa sem precisar cortá-la ou isolar um trecho puído/danificado da corda para que não sofra tensão.',
    safetyTip: 'O trecho danificado deve ficar exatamente na perna central entre as duas alças laterais.',
    steps: [
      { title: '1. Forme um "S" triplo no meio da corda', description: 'Dobre a corda em três partes paralelas formando duas dobras nas extremidades (deixando a parte danificada no centro).' },
      { title: '2. Meia-volta em cada extremidade', description: 'Em cada lado, faça um pequeno cote com o cabo firme e passe a extremidade da dobra por dentro dele.' },
      { title: '3. Mantenha sob tensão', description: 'Ao esticar as duas pontas principais da corda, os dois cotes travam as dobras e aliviam o centro.' }
    ]
  },
  {
    id: 'no_pescador',
    name: 'i) Nó de Pescador',
    classLevel: 'AMIGO',
    classLabel: 'Classe de Amigo',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/no_pescador.webp',
    imageCaption: 'Renderização 3D dos dois nós simples simétricos do Nó de Pescador',
    practicalUse: 'Unir duas linhas finas, cordins, cabos molhados ou escorregadios (como linhas de pesca ou cordas de nylon).',
    safetyTip: 'São dois nós simples espelhados que deslizam um até o outro e se travam mutuamente.',
    steps: [
      { title: '1. Coloque as pontas paralelas em sentidos opostos', description: 'Sobreponha as duas pontas das cordas que deseja unir por cerca de 25 cm.' },
      { title: '2. Primeiro nó simples abraçando a outra corda', description: 'Com a ponta da corda A, dê um nó simples ao redor do corpo da corda B.' },
      { title: '3. Segundo nó simples e união', description: 'Com a ponta da corda B, dê um nó simples ao redor do corpo da corda A e puxe os dois cabos principais até os nós encostarem.' }
    ]
  },
  {
    id: 'no_fateixa',
    name: 'j) Nó Fateixa (Nó de Âncora)',
    classLevel: 'AMIGO',
    classLabel: 'Classe de Amigo',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/no_fateixa.webp',
    imageCaption: 'Renderização 3D do Nó Fateixa (volta redonda dupla travada no anel/argola)',
    practicalUse: 'Prender com máxima segurança uma corda a uma argola de ferro, âncora (fateixa), balde ou mosquetão sujeito a atrito e puxões constantes.',
    safetyTip: 'As duas voltas ao redor da argola evitam o desgaste da corda no metal antes de travar o meio-cote.',
    steps: [
      { title: '1. Dê duas voltas completas na argola', description: 'Passe o chicote duas vezes ao redor do anel ou barra formando uma volta redonda frouxa.' },
      { title: '2. Contorne o cabo firme e passe por dentro das voltas', description: 'Cruze a ponta por trás do cabo principal e passe-a por baixo das duas voltas que envolvem a argola.' },
      { title: '3. Finalize com meio-cote de segurança', description: 'Dê mais um meio-cote ao redor do cabo principal para travar definitivamente.' }
    ]
  },
  {
    id: 'volta_do_fiel',
    name: 'k) Volta do Fiel (Calote / Barqueiro)',
    classLevel: 'AMIGO',
    alsoInCompanheiro: true,
    classLabel: 'Classe de Amigo & Companheiro',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/volta_do_fiel.webp',
    imageCaption: 'Renderização 3D da Volta do Fiel aplicada em haste cilíndrica',
    practicalUse: 'Iniciar e finalizar quase todas as amarras de pioneiria (Quadrada, Paralela, Tripé) e fixar corda em um tronco ou estaca.',
    safetyTip: 'Mantenha tensão constante nas duas extremidades para que não afrouxe no bambu liso.',
    steps: [
      { title: '1. Primeira volta diagonal', description: 'Passe a corda ao redor do tronco ou vara de bambu cruzando por cima de si mesma em "X".' },
      { title: '2. Segunda volta ao redor do tronco', description: 'Dê uma segunda volta completa ao redor do tronco, passando ao lado da primeira.' },
      { title: '3. Passagem sob a ponte central', description: 'Passe o chicote por baixo da diagonal central (formando duas voltas paralelas travadas por uma diagonal) e aperte.' }
    ]
  },
  {
    id: 'no_gancho',
    name: 'l) Nó de Gancho (Engate de Revés)',
    classLevel: 'AMIGO',
    classLabel: 'Classe de Amigo',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/no_gancho.webp',
    imageCaption: 'Renderização 3D do Nó de Gancho fixado em gancho metálico de carga',
    practicalUse: 'Prender rapidamente uma corda a um gancho de guincho, roldana ou moitão para içar cargas temporárias.',
    safetyTip: 'Funciona exclusivamente enquanto houver peso na carga: o próprio cabo firme esmaga o chicote contra o dorso do gancho!',
    steps: [
      { title: '1. Passe a corda por trás do pescoço do gancho', description: 'Envolva a parte de trás do gancho com a corda.' },
      { title: '2. Cruze o chicote no interior do gancho', description: 'Deixe a ponta curta (chicote) passando por baixo no fundo da curvatura do gancho.' },
      { title: '3. Trave o cabo firme por cima do chicote', description: 'Passe o cabo principal (que vai para a carga) por cima do chicote dentro do gancho para mordê-lo sob tensão.' }
    ]
  },
  {
    id: 'volta_ribeira',
    name: 'm) Volta da Ribeira (Nó de Madeira)',
    classLevel: 'AMIGO',
    classLabel: 'Classe de Amigo',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/volta_ribeira.webp',
    imageCaption: 'Renderização 3D da Volta da Ribeira (ideal para arrastar troncos e iniciar Amarra Diagonal)',
    practicalUse: 'Arrastar ou içar feixes de lenha e troncos pesados, além de ser o nó oficial que INICIA a Amarra Diagonal.',
    safetyTip: 'Dê pelo menos 3 a 5 voltas do chicote sobre si mesmo para garantir atrito suficiente na casca da madeira.',
    steps: [
      { title: '1. Contorne o tronco completamente', description: 'Passe a corda ao redor do tronco e dê a volta por trás do cabo firme.' },
      { title: '2. Enrole o chicote na própria alça (3 a 5 vezes)', description: 'Torça a ponta várias vezes ao redor da própria parte da corda que abraça o tronco.' },
      { title: '3. Puxe o cabo principal para apertar', description: 'Quanto maior a tração no cabo principal, mais forte a Volta da Ribeira morde o tronco.' }
    ]
  },
  {
    id: 'no_ordinario',
    name: 'n) Nó Ordinário (Nó de Espia / Calabrote)',
    classLevel: 'AMIGO',
    classLabel: 'Classe de Amigo',
    classColor: 'bg-blue-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/no_ordinario.webp',
    imageCaption: 'Renderização 3D do Nó Ordinário (entrelaçamento simétrico para unir cabos grossos)',
    practicalUse: 'Unir dois cabos grossos, pesados ou rígidos sob grande tração sem que o nó " estrangule" e trave a corda.',
    safetyTip: 'Mesmo após puxar cargas muito pesadas ou molhar, o Nó Ordinário permanece fácil de desatar!',
    steps: [
      { title: '1. Forme uma alça cruzada na corda A', description: 'Com a primeira corda, faça um cote cruzando o chicote por baixo do cabo firme.' },
      { title: '2. Posicione a corda B sobre a alça', description: 'Passe a segunda corda por baixo da alça da corda A e contorne por cima do cabo firme.' },
      { title: '3. Teça por cima e por baixo ("tabuleiro")', description: 'Passe a ponta da corda B alternando por cima, por baixo, por cima e por baixo até formar o trançado simétrico diagonal.' }
    ]
  },

  // ==========================================================================
  // CLASSE DE COMPANHEIRO (4 NOVOS NÓS + 5 RECAPITULAÇÕES DE AMIGO)
  // ==========================================================================
  {
    id: 'no_oito',
    name: 'a) Nó em Oito (Azélia em Oito)',
    classLevel: 'COMPANHEIRO',
    classLabel: 'Classe de Companheiro',
    classColor: 'bg-red-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/no_oito.webp',
    imageCaption: 'Renderização 3D do Nó em Oito (nó de retenção/parada na extremidade do cabo)',
    practicalUse: 'Nó de retenção (stopper) na ponta da corda para impedir que ela escape de roldanas ou olhais e base para o Oito Duplo na escalada.',
    safetyTip: 'Ao contrário do nó simples, o Nó em Oito não estrangula as fibras da corda e é fácil de desatar mesmo após suportar grande carga.',
    steps: [
      { title: '1. Forme uma alça passando pela frente', description: 'Faça um cote passando o chicote pela frente do cabo firme.' },
      { title: '2. Contorne por trás do cabo firme', description: 'Dê uma volta completa por trás do cabo principal (uma meia-volta a mais que o nó simples).' },
      { title: '3. Entre pela alça frontal', description: 'Introduza a ponta de cima para baixo dentro da alça superior, formando o número "8" perfeito.' }
    ]
  },
  {
    id: 'volta_salteador',
    name: 'b) Volta do Salteador (Fuga Rápida)',
    classLevel: 'COMPANHEIRO',
    classLabel: 'Classe de Companheiro',
    classColor: 'bg-red-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/volta_salteador.webp',
    imageCaption: 'Renderização 3D da Volta do Salteador (trava no cabo principal e solta ao puxar o chicote)',
    practicalUse: 'Prender uma corda em tronco ou galho de modo que suporte peso no cabo firme, mas se desfaça instantaneamente à distância ao puxar a ponta livre (chicote).',
    safetyTip: 'Nunca confie a segurança de uma pessoa em altura à Volta do Salteador sem travar a alça final com um mosquetão!',
    steps: [
      { title: '1. Passe um seio (dobra) por trás do tronco', description: 'Dobre a corda e passe a alça (seio 1) por trás do suporte.' },
      { title: '2. Passe um segundo seio do cabo firme por dentro', description: 'Pegue uma dobra do cabo principal (seio 2), passe por frente do tronco e por dentro do seio 1.' },
      { title: '3. Trave com um terceiro seio do chicote', description: 'Pegue uma dobra da ponta livre (seio 3), passe por dentro do seio 2 e aperte puxando o cabo firme.' }
    ]
  },
  {
    id: 'no_duplo',
    name: 'c) Nó Duplo (Azelha Dupla / Sobreposto)',
    classLevel: 'COMPANHEIRO',
    classLabel: 'Classe de Companheiro',
    classColor: 'bg-red-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/no_duplo.webp',
    imageCaption: 'Renderização 3D do Nó Duplo criando uma alça fixa no meio ou extremidade do cabo',
    practicalUse: 'Criar rapidamente uma alça fixa resistente com a corda dobrada (pelo seio) para pendurar equipamentos ou isolar um ponto na corda.',
    safetyTip: 'Muito rápido de executar com a corda dupla, porém aperta bastante se submetido a cargas elevadas.',
    steps: [
      { title: '1. Dobre a corda formando um seio', description: 'Junte as duas pernas da corda formando uma ponta dobrada em "U".' },
      { title: '2. Faça uma laçada com a corda dupla', description: 'Com a corda dobrada, forme um anel igual ao Nó Simples.' },
      { title: '3. Passe a ponta em "U" por dentro do anel', description: 'Introduza a ponta dobrada por dentro do anel e puxe para ajustar a alça.' }
    ]
  },
  {
    id: 'no_caminhoneiro',
    name: 'd) Nó de Caminhoneiro (Carioca)',
    classLevel: 'COMPANHEIRO',
    classLabel: 'Classe de Companheiro',
    classColor: 'bg-red-600 text-white',
    category: 'NO',
    image3dUrl: '/knots3d/no_caminhoneiro.webp',
    imageCaption: 'Renderização 3D do Nó de Caminhoneiro com sistema de polia multiplicadora de força',
    practicalUse: 'Esticar com máxima tensão lonas de acampamento, toldos, varais, cabos de barraca, tirolesas leves e amarrar cargas em veículos.',
    safetyTip: 'Funciona como uma roldana (polia 3:1), triplicando a força aplicada ao puxar o chicote!',
    steps: [
      { title: '1. Forme uma alça travada no meio do cabo firme', description: 'A cerca de 1 metro do ponto de fixação, faça uma pequena alça (cote corrediço ou azelha) no cabo principal.' },
      { title: '2. Contorne o espeque, gancho ou árvore', description: 'Passe a ponta livre (chicote) ao redor do suporte onde deseja prender.' },
      { title: '3. Passe pela alça como roldana e trave', description: 'Passe o chicote por dentro da alça superior, puxe para esticar a corda como um violão e trave com dois meios-cotes.' }
    ]
  },

  // ==========================================================================
  // CLASSE DE PESQUISADOR, EXCURSIONISTA E GUIA (AS 4 AMARRAS BÁSICAS)
  // ==========================================================================
  {
    id: 'amarra_quadrada',
    name: 'a) Amarra Quadrada',
    classLevel: 'PESQUISADOR_GUIA',
    classLabel: 'Pesquisador a Guia • 4 Amarras',
    classColor: 'bg-emerald-600 text-white',
    category: 'AMARRA',
    image3dUrl: '/knots3d/amarra_quadrada.webp',
    imageCaption: 'Renderização 3D da Amarra Quadrada em duas hastes de madeira a 90°',
    practicalUse: 'Unir duas varas ou bambus que se cruzam em ângulo reto (90°). Indispensável para construir mesas de acampamento, portais, sapateiras e torres.',
    safetyTip: 'Nunca esqueça o "enforcamento" (2 a 3 voltas bem apertadas entre as duas madeiras) antes de finalizar com a Volta do Fiel!',
    steps: [
      { title: '1. Inicie com a Volta do Fiel', description: 'Faça uma Volta do Fiel bem firme na vara vertical, logo abaixo do ponto onde a vara horizontal irá cruzar.' },
      { title: '2. Voltas de amarração (Por frente e por trás)', description: 'Passe a corda pela frente da vara horizontal, por trás da vertical, pela frente da horizontal em cima e por trás da vertical embaixo (3 a 4 voltas completas sem cavalgar a corda).' },
      { title: '3. Enforcamento (Trava de Tensão)', description: 'Dê 2 a 3 voltas horizontais bem esticadas ENTRE as duas madeiras, estrangulando as voltas anteriores.' },
      { title: '4. Finalização com Volta do Fiel', description: 'Encerre com uma Volta do Fiel na vara horizontal e esconda a sobra do chicote.' }
    ]
  },
  {
    id: 'amarra_diagonal',
    name: 'b) Amarra Diagonal',
    classLevel: 'PESQUISADOR_GUIA',
    classLabel: 'Pesquisador a Guia • 4 Amarras',
    classColor: 'bg-emerald-600 text-white',
    category: 'AMARRA',
    image3dUrl: '/knots3d/amarra_diagonal.webp',
    imageCaption: 'Renderização 3D da Amarra Diagonal unindo duas madeiras em "X"',
    practicalUse: 'Unir duas varas que se cruzam em ângulo agudo/diagonal ("X") ou que estão sob tensão para se afastarem (contraventamento de portais e pontes).',
    safetyTip: 'Diferente da quadrada, a Amarra Diagonal começa com a Volta da Ribeira abraçando as DUAS madeiras juntas!',
    steps: [
      { title: '1. Inicie com Volta da Ribeira nas duas varas', description: 'Envolva as duas varas juntas na diagonal com uma Volta da Ribeira bem apertada para aproximá-las.' },
      { title: '2. Três voltas no primeiro eixo diagonal', description: 'Dê 3 a 4 voltas completas acompanhando o primeiro ângulo do "X".' },
      { title: '3. Três voltas no segundo eixo diagonal', description: 'Cruze e dê 3 a 4 voltas completas no outro ângulo do "X", formando uma cruz sobre a junção.' },
      { title: '4. Enforcamento e Volta do Fiel', description: 'Dê 2 a 3 voltas de enforcamento entre as duas madeiras e finalize com Volta do Fiel em uma das varas.' }
    ]
  },
  {
    id: 'amarra_paralela',
    name: 'c) Amarra Paralela (ou Redonda)',
    classLevel: 'PESQUISADOR_GUIA',
    classLabel: 'Pesquisador a Guia • 4 Amarras',
    classColor: 'bg-emerald-600 text-white',
    category: 'AMARRA',
    image3dUrl: '/knots3d/amarra_paralela.webp',
    imageCaption: 'Renderização 3D da Amarra Paralela / Redonda com enforcamento central',
    practicalUse: 'Unir duas varas paralelamente para aumentar o comprimento de um mastro de bandeira, poste de portal ou formar uma tesoura (bípode).',
    safetyTip: 'Para emendar mastros altos, faça DUAS amarras paralelas sem enforcamento; para abrir em "V" (tesoura), faça o enforcamento no meio.',
    steps: [
      { title: '1. Volta do Fiel em uma das varas', description: 'Coloque as duas varas lado a lado e inicie com uma Volta do Fiel em apenas uma delas.' },
      { title: '2. Voltas circulares firmes (7 a 10 voltas)', description: 'Enrole a corda ao redor das duas varas juntas, lado a lado de forma bem justa e alinhada.' },
      { title: '3. Enforcamento central e fechamento', description: 'Passe a corda 2 vezes entre as duas varas (enforcamento) e finalize com Volta do Fiel na segunda vara.' }
    ]
  },
  {
    id: 'amarra_tripe',
    name: 'd) Amarra de Tripé (em Oito / Contínua)',
    classLevel: 'PESQUISADOR_GUIA',
    classLabel: 'Pesquisador a Guia • 4 Amarras',
    classColor: 'bg-emerald-600 text-white',
    category: 'AMARRA',
    image3dUrl: '/knots3d/amarra_tripe.webp',
    imageCaption: 'Renderização 3D da Amarra de Tripé costurada em oito com duplo enforcamento',
    practicalUse: 'Unir 3 varas para formar um Tripé de acampamento (suporte de bacia/pia de cozinha, torre de vigia ou suporte de lampião).',
    safetyTip: 'Não aperte exageradamente as voltas em "8" para permitir que as pernas do tripé se abram ao levantar.',
    steps: [
      { title: '1. Alinhe as 3 varas com a central invertida', description: 'Coloque as 3 varas no chão lado a lado e inicie com Volta do Fiel em uma das varas das pontas.' },
      { title: '2. Costura em "8" (Por cima, por baixo)', description: 'Teça a corda passando por cima da vara do meio, por baixo da outra ponta, voltando por cima da do meio (6 voltas em "8").' },
      { title: '3. Duplo Enforcamento e Abertura', description: 'Enforque nos dois vãos entre as varas, finalize com Volta do Fiel e abra as 3 pernas formando o tripé.' }
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
  Z: [315, 270],
  // Números em Semáfora (Precedidos pelo Sinal Numérico # e usando as posições de A–I para 1–9 e K para 0)
  '1': [45, 0],
  '2': [90, 0],
  '3': [135, 0],
  '4': [180, 0],
  '5': [0, 225],
  '6': [0, 270],
  '7': [0, 315],
  '8': [90, 45],
  '9': [135, 45],
  '0': [45, 180],
  // Sinais Especiais de Controle em Semáfora
  NUM: [180, 225], // Sinal Numérico (#)
  ESP: [0, 0]      // Descanso / Espaço entre palavras
};

const SEMAPHORE_ALPHABET_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G',
  'H', 'I', 'J', 'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T', 'U',
  'V', 'W', 'X', 'Y', 'Z'
];

interface SemaphoreNumberItem {
  digit: string;
  name: string;
  equivLetter: string;
  circleNote: string;
}

const SEMAPHORE_NUMBERS_LIST: SemaphoreNumberItem[] = [
  { digit: '1', name: 'Um', equivLetter: 'Posição A', circleNote: '1º Círculo • Bandeirola direita a 45° (baixo-diagonal)' },
  { digit: '2', name: 'Dois', equivLetter: 'Posição B', circleNote: '1º Círculo • Bandeirola direita a 90° (horizontal)' },
  { digit: '3', name: 'Três', equivLetter: 'Posição C', circleNote: '1º Círculo • Bandeirola direita a 135° (alto-diagonal)' },
  { digit: '4', name: 'Quatro', equivLetter: 'Posição D', circleNote: '1º Círculo • Bandeirola direita a 180° (vertical no alto)' },
  { digit: '5', name: 'Cinco', equivLetter: 'Posição E', circleNote: '1º Círculo • Bandeirola esquerda no alto-diagonal' },
  { digit: '6', name: 'Seis', equivLetter: 'Posição F', circleNote: '1º Círculo • Bandeirola esquerda na horizontal' },
  { digit: '7', name: 'Sete', equivLetter: 'Posição G', circleNote: '1º Círculo • Bandeirola esquerda em baixo-diagonal' },
  { digit: '8', name: 'Oito', equivLetter: 'Posição H', circleNote: '2º Círculo • Direita na horizontal e esquerda cruzada em baixo' },
  { digit: '9', name: 'Nove', equivLetter: 'Posição I', circleNote: '2º Círculo • Direita no alto-diagonal e esquerda cruzada em baixo' },
  { digit: '0', name: 'Zero', equivLetter: 'Posição K', circleNote: '2º Círculo • Direita em baixo-diagonal e esquerda vertical no alto' }
];

const getSemaphoreArmDescription = (deg: number, side: 'DIREITA' | 'ESQUERDA'): string => {
  switch (deg) {
    case 0:
      return 'Para baixo (6h / descanso)';
    case 45:
      return side === 'DIREITA'
        ? 'Diagonal baixa-direita (7h30 na visão frontal)'
        : 'Cruzada à frente em diagonal baixa (7h30)';
    case 90:
      return side === 'DIREITA'
        ? 'Horizontal aberta (9h na visão frontal)'
        : 'Cruzada à frente na horizontal (9h)';
    case 135:
      return side === 'DIREITA'
        ? 'Diagonal alta-direita (10h30 na visão frontal)'
        : 'Cruzada no alto-diagonal (10h30)';
    case 180:
      return 'Estendida verticalmente para cima (12h)';
    case 225:
      return side === 'ESQUERDA'
        ? 'Diagonal alta-esquerda (1h30 na visão frontal)'
        : 'Cruzada no alto-diagonal (1h30)';
    case 270:
      return side === 'ESQUERDA'
        ? 'Horizontal aberta (3h na visão frontal)'
        : 'Cruzada na horizontal (3h)';
    case 315:
      return side === 'ESQUERDA'
        ? 'Diagonal baixa-esquerda (4h30 na visão frontal)'
        : 'Cruzada em diagonal baixa (4h30)';
    default:
      return `${deg}°`;
  }
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

// Guia Ilustrado de Números em Libras (0 a 9)
interface LibrasNumberItem {
  digit: string;
  name: string;
  handSvg: string;
  svgRotation?: string;
  handShape: string;
  tip: string;
}

const LIBRAS_NUMBERS: LibrasNumberItem[] = [
  {
    digit: '0',
    name: 'Zero',
    handSvg: '/libras/O.svg',
    handShape: 'Todos os dedos curvados tocando a ponta do polegar em círculo fechado (mesma configuração da letra O)',
    tip: 'Dica: No contexto de números ou telefone, a mão em "O" representa o algarismo Zero (0).'
  },
  {
    digit: '1',
    name: 'Um',
    handSvg: '/libras/D.svg',
    handShape: 'Quantidade: Dedo indicador erguido (demais fechados) • Cardinal/Telefone: Polegar erguido para cima',
    tip: 'Dica: Para contar objetos (1 item) usa-se o indicador; para número de telefone/idade usa-se o polegar.'
  },
  {
    digit: '2',
    name: 'Dois',
    handSvg: '/libras/V.svg',
    handShape: 'Quantidade: Indicador e médio abertos em "V" • Cardinal: Polegar e indicador abertos na horizontal',
    tip: 'Dica: Dois dedos claramente estendidos (mantenha anelar e mínimo dobrados na palma).'
  },
  {
    digit: '3',
    name: 'Três',
    handSvg: '/libras/W.svg',
    handShape: 'Três dedos estendidos e separados (indicador, médio e anelar); polegar e mínimo recolhidos',
    tip: 'Dica: Idêntico à configuração da letra W, podendo ser feito na vertical ou horizontal.'
  },
  {
    digit: '4',
    name: 'Quatro',
    handSvg: '/libras/B.svg',
    handShape: 'Quatro dedos estendidos (indicador, médio, anelar e mínimo) e polegar dobrado sobre a palma da mão',
    tip: 'Dica: Mantenha os quatro dedos levemente afastados para facilitar a leitura visual.'
  },
  {
    digit: '5',
    name: 'Cinco',
    handSvg: '/libras/X.svg',
    handShape: 'Cardinal em Libras: Dedos indicador e médio curvados em gancho na frente do corpo • Quantidade: Mão aberta (5 dedos)',
    tip: 'Curiosidade: No Brasil (Libras), o algarismo 5 cardinal é feito dobrando os dedos indicador e médio em gancho!'
  },
  {
    digit: '6',
    name: 'Seis',
    handSvg: '/libras/C.svg',
    svgRotation: '-rotate-90',
    handShape: 'Mão deitada com os dedos fechados e o polegar encostado sobre a lateral do indicador curvado (bojo embaixo)',
    tip: 'Dica: Lembra o desenho do número 6 com o círculo na parte de baixo e o polegar em cima.'
  },
  {
    digit: '7',
    name: 'Sete',
    handSvg: '/libras/Q.svg',
    handShape: 'Polegar e indicador abertos apontando para baixo/diagonal, desenhando o ângulo do número "7" no ar',
    tip: 'Dica: Mesma configuração de mão da letra Q (ou um "7" formado pelo polegar e indicador).'
  },
  {
    digit: '8',
    name: 'Oito',
    handSvg: '/libras/S.svg',
    handShape: 'Punho fechado (configuração da letra "S") com leve movimento lateral do pulso',
    tip: 'Dica: Enquanto a letra S fica parada, o número 8 tem um leve balanço do punho.'
  },
  {
    digit: '9',
    name: 'Nove',
    handSvg: '/libras/C.svg',
    svgRotation: 'rotate-90',
    handShape: 'Inverso do número 6: mão deitada com o indicador curvado por cima e o polegar por baixo (bojo em cima)',
    tip: 'Dica: No 6 o polegar fica em cima; no 9 o indicador fica por cima desenhando a volta superior do 9!'
  }
];

// Expressões Mais Usadas em Libras (Cumprimentos, Desbravadores, Acampamento e Diálogo)
interface LibrasExpressionItem {
  id: string;
  phrase: string;
  category: 'CUMPRIMENTOS' | 'CLUBE' | 'ACAMPAMENTO' | 'DIALOGO';
  handConfigLabel: string;
  handSvg: string;
  howToSign: string;
  movement: string;
  facialExpression: string;
  tip: string;
}

const LIBRAS_EXPRESSIONS: LibrasExpressionItem[] = [
  // 1. CUMPRIMENTOS E CORTESIA (7)
  {
    id: 'expr_oi',
    phrase: 'Oi / Olá',
    category: 'CUMPRIMENTOS',
    handConfigLabel: 'Mão O → I',
    handSvg: '/libras/I.svg',
    howToSign: 'Comece com a mão em formato da letra "O" e abra erguendo o dedo mínimo na letra "I".',
    movement: 'Giro suave do pulso mostrando a transição de O para I ao lado do rosto.',
    facialExpression: 'Sorriso aberto e receptivo',
    tip: 'Une literalmente as duas letras O + I num único movimento fluido!'
  },
  {
    id: 'expr_tudo_bem',
    phrase: 'Tudo Bem? / Bom',
    category: 'CUMPRIMENTOS',
    handConfigLabel: 'Mão O → A',
    handSvg: '/libras/A.svg',
    howToSign: 'Pontas dos dedos unidas tocando os lábios, abrindo a mão à frente do peito e finalizando com polegar erguido ("joinha").',
    movement: 'Do queixo/boca para frente (Sinal de "Bom") seguido do polegar para cima.',
    facialExpression: 'Sobrancelhas arqueadas (se for pergunta) ou sorriso (se for resposta)',
    tip: 'Serve tanto para perguntar "Tudo bem?" quanto para responder "Tudo ótimo!".'
  },
  {
    id: 'expr_bom_dia',
    phrase: 'Bom Dia',
    category: 'CUMPRIMENTOS',
    handConfigLabel: 'Mão D',
    handSvg: '/libras/D.svg',
    howToSign: 'Faça o sinal de "Bom" (dedos na boca abrindo para frente) seguido da letra "D" subindo como o sol nascendo.',
    movement: 'A mão em "D" sai de trás do antebraço oposto e sobe para o alto.',
    facialExpression: 'Expressão alegre de início de manhã',
    tip: 'O braço deitado representa o horizonte e a mão subindo representa o nascer do sol.'
  },
  {
    id: 'expr_boa_tarde',
    phrase: 'Boa Tarde',
    category: 'CUMPRIMENTOS',
    handConfigLabel: 'Mão B',
    handSvg: '/libras/B.svg',
    howToSign: 'Faça o sinal de "Bom" seguido da mão aberta (letra "B" com dedos unidos) descendo suavemente à frente do corpo.',
    movement: 'Incline a mão aberta do alto para a diagonal baixa (como o sol se pondo à tarde).',
    facialExpression: 'Sorriso tranquilo',
    tip: 'Lembra o sol descendo no meio da tarde.'
  },
  {
    id: 'expr_boa_noite',
    phrase: 'Boa Noite',
    category: 'CUMPRIMENTOS',
    handConfigLabel: 'Mão B',
    handSvg: '/libras/B.svg',
    howToSign: 'Faça o sinal de "Bom" e depois deslize a palma da mão direita curvada sobre o dorso da mão esquerda fechada.',
    movement: 'Movimento de "cobrir" a outra mão, simbolizando a escuridão da noite chegando.',
    facialExpression: 'Expressão serena e acolhedora',
    tip: 'Usado nas meditações noturnas, fogo do conselho e despedidas.'
  },
  {
    id: 'expr_por_favor',
    phrase: 'Por Favor / Com Licença',
    category: 'CUMPRIMENTOS',
    handConfigLabel: 'Mão B',
    handSvg: '/libras/B.svg',
    howToSign: 'Mão aberta espalmada sobre o peito (ou as duas mãos unidas em prece leve à frente do peito).',
    movement: 'Deslize a palma aberta em pequeno círculo sobre o peito ou incline levemente para frente.',
    facialExpression: 'Sobrancelhas levemente erguidas com educação e respeito',
    tip: 'A expressão facial educada é parte essencial deste sinal em Libras.'
  },
  {
    id: 'expr_obrigado',
    phrase: 'Obrigado(a) / Gratidão',
    category: 'CUMPRIMENTOS',
    handConfigLabel: 'Mão B',
    handSvg: '/libras/B.svg',
    howToSign: 'Encoste as pontas dos dedos da mão aberta ("B") na testa (ou uma mão na testa e outra no abdômen).',
    movement: 'Mova a mão da testa para a frente em direção à pessoa a quem você agradece.',
    facialExpression: 'Sorriso sincero e leve aceno com a cabeça',
    tip: 'Em Libras não muda para masculino ou feminino: o mesmo sinal vale para Obrigado e Obrigada!'
  },

  // 2. DESBRAVADORES E CLUBE (6)
  {
    id: 'expr_maranata',
    phrase: 'Maranata (O Senhor Logo Vem)',
    category: 'CLUBE',
    handConfigLabel: 'Mão B / 4',
    handSvg: '/libras/B.svg',
    howToSign: 'Posição oficial da saudação Maranata: quatro dedos estendidos e unidos na vertical com o polegar dobrado na palma.',
    movement: 'Para traduzir o significado completo em Libras: faça o sinal de "Jesus" (toque o dedo médio nas duas palmas) + aponte para o céu descendo as mãos ("Vem").',
    facialExpression: 'Expressão firme, vibrante e esperançosa',
    tip: 'Os 4 dedos representam Amar, Anunciar, Apressar e Aguardar; o polegar dobrado é o desbravador reverente.'
  },
  {
    id: 'expr_desbravador',
    phrase: 'Desbravador (Lenço no Pescoço)',
    category: 'CLUBE',
    handConfigLabel: 'Mão V / L',
    handSvg: '/libras/V.svg',
    howToSign: 'Com as duas mãos, desenhe o formato do lenço triangular descendo pelos ombros até o arganel no peito.',
    movement: 'Deslize as duas mãos da gola do pescoço unindo-as no centro do peito (onde fica o arganel).',
    facialExpression: 'Postura alegre e confiante',
    tip: 'O sinal visual oficial de "Desbravador" na comunidade surda adventista faz referência direta ao Lenço!'
  },
  {
    id: 'expr_clube_unidade',
    phrase: 'Clube / Unidade Reunida',
    category: 'CLUBE',
    handConfigLabel: 'Mão C',
    handSvg: '/libras/C.svg',
    howToSign: 'As duas mãos em configuração de "C" (ou mãos abertas curvadas) começam próximas atrás e fecham um círculo à frente.',
    movement: 'Movimento circular horizontal unindo as duas mãos à frente do peito.',
    facialExpression: 'Olhar integrador para o grupo',
    tip: 'Representa todas as pessoas unidas em uma mesma roda ou unidade.'
  },
  {
    id: 'expr_barraca',
    phrase: 'Acampamento / Barraca',
    category: 'CLUBE',
    handConfigLabel: 'Mão V',
    handSvg: '/libras/V.svg',
    howToSign: 'As duas mãos com dedos indicador e mínimo estendidos (ou mãos abertas em "B") tocam as pontas no alto formando um telhado triangular.',
    movement: 'Toque as pontas dos dedos no topo e desça abrindo na diagonal para os dois lados (desenhando a barraca).',
    facialExpression: 'Expressão animada',
    tip: 'Desenha visualmente as duas águas do teto de uma barraca de acampamento.'
  },
  {
    id: 'expr_jesus_deus',
    phrase: 'Jesus / Deus',
    category: 'CLUBE',
    handConfigLabel: 'Mão D',
    handSvg: '/libras/D.svg',
    howToSign: 'Jesus: Toque o dedo médio no centro da palma oposta e vice-versa • Deus: Mão em letra "D" apontando e subindo para o Céu.',
    movement: 'Toque suave no centro de cada palma (marcas dos cravos de Cristo) ou elevação da mão em D para o alto.',
    facialExpression: 'Reverência e paz',
    tip: 'Muito utilizado nos cânticos, no Voto, na Lei e nas capelanias do Clube.'
  },
  {
    id: 'expr_amigo',
    phrase: 'Amigo(a) / Companheiro',
    category: 'CLUBE',
    handConfigLabel: 'Mão B',
    handSvg: '/libras/B.svg',
    howToSign: 'Mão aberta pousada sobre o lado esquerdo do peito (coração) dando duas batidinhas suaves.',
    movement: 'Dois toques afetuosos com a palma da mão sobre o coração.',
    facialExpression: 'Sorriso acolhedor e fraterno',
    tip: 'Sinal da primeira Classe Regular dos Desbravadores (Classe de Amigo)!'
  },

  // 3. ACAMPAMENTO E EMERGÊNCIA (6)
  {
    id: 'expr_ajuda',
    phrase: 'Ajuda / Preciso de Socorro',
    category: 'ACAMPAMENTO',
    handConfigLabel: 'Mão A + B',
    handSvg: '/libras/A.svg',
    howToSign: 'Uma mão fechada com polegar para cima (letra "A") apoiada em cima da palma aberta da outra mão ("B").',
    movement: 'A mão aberta de baixo impulsiona/levanta a mão de cima para frente ou em direção a você.',
    facialExpression: 'Expressão de urgência ou pedido de apoio',
    tip: 'Se mover para frente significa "Eu ajudo você"; se trouxer na sua direção significa "Me ajude!".'
  },
  {
    id: 'expr_agua',
    phrase: 'Água / Sede',
    category: 'ACAMPAMENTO',
    handConfigLabel: 'Mão L',
    handSvg: '/libras/L.svg',
    howToSign: 'Mão em configuração da letra "L" com a ponta do polegar encostada no queixo.',
    movement: 'Balance o dedo indicador esticado duas ou três vezes para frente e para trás sem tirar o polegar do queixo.',
    facialExpression: 'Natural (ou apontando para o cantil)',
    tip: 'Sinal indispensável durante caminhadas, trilhas e atividades de campo.'
  },
  {
    id: 'expr_comida',
    phrase: 'Comida / Hora de Comer',
    category: 'ACAMPAMENTO',
    handConfigLabel: 'Mão O',
    handSvg: '/libras/O.svg',
    howToSign: 'Pontas dos dedos unidas (ou dedos curvados levando alimento) próximas à boca.',
    movement: 'Aproxime as pontas dos dedos da boca duas vezes repetidamente.',
    facialExpression: 'Expressão natural de refeição',
    tip: 'Muito fácil de memorizar e compreendido universalmente.'
  },
  {
    id: 'expr_banheiro',
    phrase: 'Banheiro',
    category: 'ACAMPAMENTO',
    handConfigLabel: 'Mão V / T',
    handSvg: '/libras/T.svg',
    howToSign: 'Aponte o dedo indicador da mão direita sobre o pulso do antebraço esquerdo (ou agite a mão em "T").',
    movement: 'Dois toques rápidos sobre a parte interna/superior do pulso esquerdo.',
    facialExpression: 'Expressão discreta de pergunta',
    tip: 'No Brasil, tocar duas vezes no pulso é o sinal padrão e educado para pedir para ir ao banheiro.'
  },
  {
    id: 'expr_dor_ferido',
    phrase: 'Dor / Estou Machucado',
    category: 'ACAMPAMENTO',
    handConfigLabel: 'Mão F / X',
    handSvg: '/libras/F.svg',
    howToSign: 'Mão em configuração "F" sacudindo levemente (ou os dois indicadores apontando um para o outro próximo ao local da dor).',
    movement: 'Pequena vibração/giro rápido do punho próximo ao local machucado.',
    facialExpression: 'Testa franzida e expressão de desconforto/dor (fundamental!)',
    tip: 'Aponte primeiro para o local do corpo (ex: tornozelo, cabeça) e faça o sinal de dor.'
  },
  {
    id: 'expr_silencio',
    phrase: 'Silêncio / Atenção Visual',
    category: 'ACAMPAMENTO',
    handConfigLabel: 'Mão D / B',
    handSvg: '/libras/D.svg',
    howToSign: 'Dedo indicador vertical diante dos lábios ("Silêncio") ou mão levantada acenando suavemente ("Atenção Visual").',
    movement: 'Para chamar a atenção de um surdo à distância, acene a mão aberta no campo visual dele ou pisque a lanterna.',
    facialExpression: 'Olhar direto e calmo',
    tip: 'Em reuniões com surdos, aplaudimos erguendo as duas mãos abertas e girando os pulsos no ar!'
  },

  // 4. PERGUNTAS E DIÁLOGO (5)
  {
    id: 'expr_sim',
    phrase: 'Sim (Confirmação)',
    category: 'DIALOGO',
    handConfigLabel: 'Mão S',
    handSvg: '/libras/S.svg',
    howToSign: 'Punho fechado na configuração da letra "S".',
    movement: 'Incline o punho fechado para cima e para baixo duas vezes (como se a mão estivesse dizendo sim com a cabeça).',
    facialExpression: 'Acene positivamente com a cabeça ao mesmo tempo',
    tip: 'O movimento do punho acompanha o movimento afirmativo da cabeça.'
  },
  {
    id: 'expr_nao',
    phrase: 'Não (Negação)',
    category: 'DIALOGO',
    handConfigLabel: 'Mão D',
    handSvg: '/libras/D.svg',
    howToSign: 'Dedo indicador estendido (ou polegar, indicador e médio se fechando como um bico).',
    movement: 'Balance o indicador de um lado para o outro acompanhando o movimento negativo da cabeça.',
    facialExpression: 'Balanço negativo da cabeça e lábios levemente contraídos',
    tip: 'Nunca faça o sinal de "Não" sem mexer a cabeça negativamente.'
  },
  {
    id: 'expr_qual_nome',
    phrase: 'Qual é o seu nome?',
    category: 'DIALOGO',
    handConfigLabel: 'Mão U',
    handSvg: '/libras/U.svg',
    howToSign: 'Mão em configuração da letra "U" deitada na horizontal apontando para a pessoa.',
    movement: 'Mova a mão em "U" da esquerda para a direita de forma curta à frente do peito, apontando para o interlocutor.',
    facialExpression: 'Sobrancelhas franzidas e cabeça levemente inclinada (expressão de pergunta "Qual/Quem?")',
    tip: 'Para responder "Meu nome é...", bata a mão no peito, faça o sinal de nome em "U" e soletre seu nome!'
  },
  {
    id: 'expr_meu_sinal',
    phrase: 'Meu Sinal em Libras',
    category: 'DIALOGO',
    handConfigLabel: 'Mão A / S',
    handSvg: '/libras/S.svg',
    howToSign: 'Na cultura surda, cada pessoa recebe um "Sinal Pessoal" (batismo em Libras) que resume uma característica sua.',
    movement: 'Aponte para o peito ("Meu") e mostre seu sinal pessoal antes ou depois de soletrar seu nome no alfabeto manual.',
    facialExpression: 'Sorriso de apresentação pessoal',
    tip: 'Evita precisar soletrar todas as letras do nome toda vez que conversar no Clube!'
  },
  {
    id: 'expr_desculpa',
    phrase: 'Desculpa / Perdão',
    category: 'DIALOGO',
    handConfigLabel: 'Mão Y',
    handSvg: '/libras/Y.svg',
    howToSign: 'Mão na configuração da letra "Y" (polegar e mínimo abertos) tocando a parte inferior do queixo.',
    movement: 'Encoste a parte interna dos dedos dobrados da mão em "Y" no queixo duas vezes suaves.',
    facialExpression: 'Expressão sincera de pedido de desculpas',
    tip: 'Sinal essencial de convivência e respeito cristão dentro da unidade.'
  }
];

// Sinais de Pista Oficiais para Trilhas (26 Sinais Completos divididos em 4 Categorias)
type TrailSignCategory = 'TODOS' | 'DIRECAO' | 'PERIGO' | 'ACAMPAMENTO' | 'MENSAGENS';

interface TrailSignItem {
  id: string;
  name: string;
  category: Exclude<TrailSignCategory, 'TODOS'>;
  categoryLabel: string;
  howToMake: string;
  description: string;
  svgType: string;
}

const TRAIL_SIGNS: TrailSignItem[] = [
  // 1. DIREÇÃO E NAVEGAÇÃO
  {
    id: 'ts_start',
    name: 'Início de Pista (Ponto de Partida)',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Trilha',
    howToMake: 'Seta com traço transversal na base ou círculo com seta saindo dele',
    description: 'Marca o local exato onde começa a trilha sinalizada para a unidade.',
    svgType: 'START_TRAIL'
  },
  {
    id: 'ts_1',
    name: 'Seguir em Frente (Caminho Certo)',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Trilha',
    howToMake: 'Seta de gravetos/pedras apontando reto ou tufo de capim amarrado com a ponta para frente',
    description: 'Continue caminhando na mesma direção principal da trilha.',
    svgType: 'ARROW_UP'
  },
  {
    id: 'ts_2',
    name: 'Virar à Direita',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Trilha',
    howToMake: 'Seta dobrada para a direita, pedra menor à direita de uma maior ou capim amarrado inclinado à direita',
    description: 'Tome o desvio ou trilha que entra para o lado direito.',
    svgType: 'ARROW_RIGHT'
  },
  {
    id: 'ts_3',
    name: 'Virar à Esquerda',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Trilha',
    howToMake: 'Seta dobrada para a esquerda, pedra menor à esquerda de uma maior ou capim amarrado inclinado à esquerda',
    description: 'Tome o desvio ou trilha que entra para o lado esquerdo.',
    svgType: 'ARROW_LEFT'
  },
  {
    id: 'ts_fast',
    name: 'Passo Acelerado / Seguir Rápido (Correr)',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Trilha',
    howToMake: 'Seta com ponta dupla (duas cabeças de seta seguidas)',
    description: 'A unidade deve apertar o passo ou trotar até o próximo sinal.',
    svgType: 'ARROW_DOUBLE'
  },
  {
    id: 'ts_slow',
    name: 'Andar Devagar / Cuidado no Passo',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Trilha',
    howToMake: 'Seta cortada por duas pequenas barras transversais no corpo',
    description: 'Reduza a velocidade da caminhada; trecho íngreme ou de atenção.',
    svgType: 'ARROW_BARS'
  },
  {
    id: 'ts_return',
    name: 'Retornar / Voltar pelo Mesmo Caminho',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Trilha',
    howToMake: 'Seta fazendo curva de 180° em formato de "U" para trás',
    description: 'Meia-volta: retorne imediatamente pelo caminho de onde veio.',
    svgType: 'ARROW_UTURN'
  },
  {
    id: 'ts_fork',
    name: 'Bifurcação: Siga pelo Ramo Indicado',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Trilha',
    howToMake: 'Forquilha em "Y" com seta num braço e "X" bloqueando o outro',
    description: 'Na divisão da trilha, escolha o lado com a seta e ignore o lado com X.',
    svgType: 'FORK_RIGHT'
  },
  {
    id: 'ts_over',
    name: 'Transpor / Passar por Cima do Obstáculo',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Trilha',
    howToMake: 'Linha com arco passando por cima de um bloco/tronco e ponta de seta',
    description: 'Suba ou pule por cima do tronco caído, cerca ou rocha à frente.',
    svgType: 'OVER_OBSTACLE'
  },

  // 2. AVISOS, PERIGOS E OBSTÁCULOS
  {
    id: 'ts_4',
    name: 'Caminho Errado / Não Siga por Aqui',
    category: 'PERIGO',
    categoryLabel: 'Perigo & Avisos',
    howToMake: 'Dois gravetos cruzados em "X" no meio da entrada ou três tufos de capim amarrados lado a lado',
    description: 'Entrada bloqueada ou trilha falsa. Nunca ultrapasse um X na trilha.',
    svgType: 'CROSS_X'
  },
  {
    id: 'ts_5',
    name: 'Perigo Geral / Atenção Redobrada!',
    category: 'PERIGO',
    categoryLabel: 'Perigo & Avisos',
    howToMake: 'Triângulo de três gravetos com uma pedra/ponto no centro ou 3 pedras empilhadas',
    description: 'Alerta de perigo próximo (barranco, buraco, vespeiro ou animal peçonhento).',
    svgType: 'TRIANGLE'
  },
  {
    id: 'ts_dog',
    name: 'Animal Bravio / Cão Feroz ou Gado Solto',
    category: 'PERIGO',
    categoryLabel: 'Perigo & Avisos',
    howToMake: 'Triângulo com dois traços externos ou inscrição de alerta com pedras',
    description: 'Cuidado com cães de guarda ou animais soltos na propriedade.',
    svgType: 'DANGER_ANIMAL'
  },
  {
    id: 'ts_bridge',
    name: 'Ponte Ruim ou Passagem Frágil',
    category: 'PERIGO',
    categoryLabel: 'Perigo & Avisos',
    howToMake: 'Duas linhas paralelas quebradas ao meio com sinal de X',
    description: 'Pinguela ou ponte de madeira podre/instável; atravesse um por vez ou contorne.',
    svgType: 'BAD_BRIDGE'
  },
  {
    id: 'ts_hide',
    name: 'Esconder-se / Camuflar-se Agora',
    category: 'PERIGO',
    categoryLabel: 'Perigo & Avisos',
    howToMake: 'Três traços verticais cobertos por um arco superior (sombra/cobertura)',
    description: 'Abaixe-se e fique oculto na vegetação sem fazer barulho.',
    svgType: 'HIDE_COVER'
  },
  {
    id: 'ts_silence',
    name: 'Silêncio Absoluto na Trilha',
    category: 'PERIGO',
    categoryLabel: 'Perigo & Avisos',
    howToMake: 'Círculo atravessado por uma haste vertical no centro',
    description: 'Proibido conversar ou fazer ruído a partir deste ponto.',
    svgType: 'SILENCE'
  },

  // 3. ÁGUA, ACAMPAMENTO E RECURSOS
  {
    id: 'ts_6',
    name: 'Água Potável (Boa para Beber)',
    category: 'ACAMPAMENTO',
    categoryLabel: 'Água & Acampamento',
    howToMake: 'Duas ou três linhas onduladas dentro de um círculo ou com seta indicando a fonte',
    description: 'Fonte ou nascente de água limpa e própria para consumo.',
    svgType: 'WATER_GOOD'
  },
  {
    id: 'ts_7',
    name: 'Água NÃO Potável (Imprópria / Contaminada)',
    category: 'ACAMPAMENTO',
    categoryLabel: 'Água & Acampamento',
    howToMake: 'Linhas onduladas cortadas por um "X" ou traço diagonal',
    description: 'Proibido beber desta água sem filtragem e fervura/cloração.',
    svgType: 'WATER_BAD'
  },
  {
    id: 'ts_8',
    name: 'Acampamento Nesta Direção',
    category: 'ACAMPAMENTO',
    categoryLabel: 'Água & Acampamento',
    howToMake: 'Triângulo aberto na base (formato de barraca) com uma seta lateral',
    description: 'Indica a direção exata onde está montado o acampamento da unidade/clube.',
    svgType: 'CAMP'
  },
  {
    id: 'ts_good_camp',
    name: 'Bom Local para Acampar',
    category: 'ACAMPAMENTO',
    categoryLabel: 'Água & Acampamento',
    howToMake: 'Desenho de barraca com base dupla firme e sinal positivo',
    description: 'Área plana, segura, drenada e autorizada para montar as barracas.',
    svgType: 'CAMP_GOOD'
  },
  {
    id: 'ts_fire_ok',
    name: 'Local Permitido para Fogueira / Cozinha',
    category: 'ACAMPAMENTO',
    categoryLabel: 'Água & Acampamento',
    howToMake: 'Círculo de pedras com três pequenos gravetos convergente no centro',
    description: 'Ponto limpo e seguro autorizado para o fogo de conselho ou cozinha.',
    svgType: 'FIRE_OK'
  },
  {
    id: 'ts_fire_no',
    name: 'Proibido Acender Fogo (Risco de Incêndio)',
    category: 'ACAMPAMENTO',
    categoryLabel: 'Água & Acampamento',
    howToMake: 'Desenho de chama/lenha cortado por um X ou diagonal',
    description: 'Vegetação seca ou área de preservação: não acenda fogo nem fogareiro.',
    svgType: 'FIRE_NO'
  },

  // 4. MENSAGENS, TEMPO E REAGRUPAMENTO
  {
    id: 'ts_9',
    name: 'Mensagem Escondida a "N" Passos',
    category: 'MENSAGENS',
    categoryLabel: 'Mensagens & Equipe',
    howToMake: 'Quadrado no chão com um número no centro e uma seta indicando a direção',
    description: 'Caminhe o número de passos indicado na direção da seta para achar o bilhete oculto.',
    svgType: 'MESSAGE'
  },
  {
    id: 'ts_wait',
    name: 'Esperar Aqui por "N" Minutos',
    category: 'MENSAGENS',
    categoryLabel: 'Mensagens & Equipe',
    howToMake: 'Retângulo horizontal com barra lateral e número (ex.: 5 ou 10)',
    description: 'A unidade deve aguardar parada neste local pelo tempo indicado.',
    svgType: 'WAIT_HERE'
  },
  {
    id: 'ts_reunion',
    name: 'Reunir Toda a Unidade (Ponto de Encontro)',
    category: 'MENSAGENS',
    categoryLabel: 'Mensagens & Equipe',
    howToMake: 'Círculo com quatro pequenas setas apontando para o centro',
    description: 'Ninguém avança sozinho: aguarde até que todos os membros estejam reunidos.',
    svgType: 'REUNION'
  },
  {
    id: 'ts_split',
    name: 'Dividir o Grupo em Duas Equipes',
    category: 'MENSAGENS',
    categoryLabel: 'Mensagens & Equipe',
    howToMake: 'Haste única que se divide em duas setas opostas (metade para cada lado)',
    description: 'Metade da unidade segue pela esquerda e metade pela direita.',
    svgType: 'SPLIT_GROUP'
  },
  {
    id: 'ts_sos',
    name: 'Pedido de Socorro / Emergência (S.O.S.)',
    category: 'MENSAGENS',
    categoryLabel: 'Mensagens & Equipe',
    howToMake: 'Três sinais iguais alinhados (3 pilhas de pedras, 3 fogueiras ou 3 traços com "SOS")',
    description: 'Sinal universal de emergência: qualquer grupo que avistar deve prestar socorro imediato.',
    svgType: 'SOS_SIGNAL'
  },
  {
    id: 'ts_10',
    name: 'Missão Cumprida / Fim de Pista (Chegada)',
    category: 'MENSAGENS',
    categoryLabel: 'Mensagens & Equipe',
    howToMake: 'Dois círculos concêntricos (ou círculo de pedras com uma pedra maior no centro)',
    description: 'Sinal internacional escoteiro de "Fim da Trilha / Chegamos ao Destino".',
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
  const [selectedTrailCategory, setSelectedTrailCategory] = useState<TrailSignCategory>('TODOS');
  const [selectedLibrasLetterModal, setSelectedLibrasLetterModal] = useState<string | null>(null);
  const [selectedSemaphoreModal, setSelectedSemaphoreModal] = useState<string | null>(null);
  const [librasExpressionCat, setLibrasExpressionCat] = useState<'TODAS' | 'CUMPRIMENTOS' | 'CLUBE' | 'ACAMPAMENTO' | 'DIALOGO'>('TODAS');
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
    if (selectedClassFilter === 'COMPANHEIRO') {
      return KNOTS_DATABASE.filter((k) => k.classLevel === 'COMPANHEIRO' || k.alsoInCompanheiro);
    }
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
    const validChars = normalizedChars.filter((c) => /[A-Z0-9]/.test(c));
    for (let i = 0; i < validChars.length; i++) {
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
  // RENDERIZADORES VISUAIS SVG (SEMÁFORA E SINAIS DE PISTA)
  // ============================================================================
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
        {svgType === 'START_TRAIL' && (
          <g stroke="currentColor" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="20" cy="30" r="8" />
            <path d="M 28 30 L 66 30 M 54 18 L 66 30 L 54 42" />
          </g>
        )}
        {svgType === 'ARROW_UP' && (
          <path d="M 40 52 L 40 10 M 26 24 L 40 10 L 54 24" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {svgType === 'ARROW_RIGHT' && (
          <path d="M 16 48 L 16 26 L 64 26 M 50 14 L 64 26 L 50 38" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {svgType === 'ARROW_LEFT' && (
          <path d="M 64 48 L 64 26 L 16 26 M 30 14 L 16 26 L 30 38" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {svgType === 'ARROW_DOUBLE' && (
          <g stroke="currentColor" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 12 30 L 66 30" />
            <path d="M 40 18 L 52 30 L 40 42" />
            <path d="M 54 18 L 66 30 L 54 42" />
          </g>
        )}
        {svgType === 'ARROW_BARS' && (
          <g stroke="currentColor" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 12 30 L 66 30 M 54 18 L 66 30 L 54 42" />
            <line x1="26" y1="18" x2="26" y2="42" stroke="#f59e0b" />
            <line x1="38" y1="18" x2="38" y2="42" stroke="#f59e0b" />
          </g>
        )}
        {svgType === 'ARROW_UTURN' && (
          <path d="M 24 48 L 24 22 C 24 10, 56 10, 56 22 L 56 46 M 44 36 L 56 48 L 68 36" stroke="#f59e0b" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {svgType === 'FORK_RIGHT' && (
          <g fill="none" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 40 54 L 40 34 L 62 14 M 50 14 L 62 14 L 62 26" stroke="#10b981" />
            <path d="M 40 34 L 20 16" stroke="#94a3b8" />
            <path d="M 14 12 L 26 24 M 26 12 L 14 24" stroke="#ef4444" strokeWidth="4" />
          </g>
        )}
        {svgType === 'OVER_OBSTACLE' && (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="30" y="32" width="20" height="18" rx="3" fill="#94a3b8" />
            <path d="M 12 44 C 20 10, 60 10, 68 40 M 58 38 L 68 42 L 68 30" stroke="currentColor" strokeWidth="4.5" />
          </g>
        )}
        {svgType === 'CROSS_X' && (
          <path d="M 22 12 L 58 48 M 58 12 L 22 48" stroke="#ef4444" strokeWidth="6" fill="none" strokeLinecap="round" />
        )}
        {svgType === 'TRIANGLE' && (
          <g fill="none" stroke="#f59e0b" strokeWidth="4.5" strokeLinejoin="round">
            <polygon points="40,8 16,48 64,48" />
            <circle cx="40" cy="36" r="3" fill="#ef4444" stroke="none" />
            <line x1="40" y1="22" x2="40" y2="30" stroke="#ef4444" strokeLinecap="round" />
          </g>
        )}
        {svgType === 'DANGER_ANIMAL' && (
          <g fill="none" stroke="#ef4444" strokeWidth="4" strokeLinejoin="round">
            <polygon points="40,8 16,48 64,48" />
            <polygon points="40,18 26,43 54,43" stroke="#f59e0b" strokeWidth="3" />
          </g>
        )}
        {svgType === 'BAD_BRIDGE' && (
          <g fill="none" strokeLinecap="round">
            <path d="M 12 24 L 34 24 M 46 24 L 68 24 M 12 38 L 34 38 M 46 38 L 68 38" stroke="#64748b" strokeWidth="4.5" />
            <path d="M 32 14 L 48 48 M 48 14 L 32 48" stroke="#ef4444" strokeWidth="4.5" />
          </g>
        )}
        {svgType === 'HIDE_COVER' && (
          <g fill="none" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round">
            <path d="M 16 26 Q 40 6, 64 26" />
            <line x1="28" y1="26" x2="28" y2="48" />
            <line x1="40" y1="22" x2="40" y2="48" />
            <line x1="52" y1="26" x2="52" y2="48" />
          </g>
        )}
        {svgType === 'SILENCE' && (
          <g fill="none" stroke="#6366f1" strokeWidth="4.5" strokeLinecap="round">
            <circle cx="40" cy="30" r="18" />
            <line x1="40" y1="8" x2="40" y2="52" />
          </g>
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
        {svgType === 'CAMP_GOOD' && (
          <g stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="40,10 18,44 62,44" />
            <line x1="12" y1="50" x2="68" y2="50" />
            <path d="M 34 32 L 39 37 L 48 26" />
          </g>
        )}
        {svgType === 'FIRE_OK' && (
          <g fill="none" strokeLinecap="round">
            <path d="M 22 46 L 58 34 M 22 34 L 58 46" stroke="#b45309" strokeWidth="4.5" />
            <path d="M 40 10 C 50 20, 48 30, 40 34 C 32 30, 30 20, 40 10 Z" stroke="#f97316" strokeWidth="4" fill="#fb923c" fillOpacity="0.3" />
          </g>
        )}
        {svgType === 'FIRE_NO' && (
          <g fill="none" strokeLinecap="round">
            <path d="M 40 10 C 50 20, 48 30, 40 36 C 32 30, 30 20, 40 10 Z" stroke="#64748b" strokeWidth="4" />
            <line x1="18" y1="12" x2="62" y2="48" stroke="#ef4444" strokeWidth="5" />
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
        {svgType === 'WAIT_HERE' && (
          <g stroke="#f59e0b" strokeWidth="4" fill="none">
            <rect x="14" y="14" width="52" height="32" rx="5" />
            <line x1="26" y1="14" x2="26" y2="46" />
            <text x="46" y="35" textAnchor="middle" stroke="none" fill="currentColor" className="text-xs font-black">
              5m
            </text>
          </g>
        )}
        {svgType === 'REUNION' && (
          <g stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round">
            <circle cx="40" cy="30" r="14" />
            <path d="M 40 4 L 40 14 M 40 56 L 40 46 M 12 30 L 24 30 M 68 30 L 56 30" />
          </g>
        )}
        {svgType === 'SPLIT_GROUP' && (
          <g stroke="currentColor" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 40 52 L 40 30 L 18 14 M 18 24 L 18 14 L 28 14" />
            <path d="M 40 30 L 62 14 M 52 14 L 62 14 L 62 24" />
          </g>
        )}
        {svgType === 'SOS_SIGNAL' && (
          <g fill="#ef4444">
            <circle cx="20" cy="30" r="7" />
            <circle cx="40" cy="30" r="7" />
            <circle cx="60" cy="30" r="7" />
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
          {/* Filtro por Classe (Amigo, Companheiro e Pesquisador a Guia) */}
          <div className="bg-white dark:bg-slate-800 rounded-[24px] p-3.5 sm:p-4 border border-slate-100 dark:border-slate-700 shadow-xs space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">
              Nós e Amarras Oficiais dos Cartões das Classes (Amigo a Guia)
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
              {[
                { id: 'TODOS', label: `Todos das Classes (${KNOTS_DATABASE.length})` },
                { id: 'AMIGO', label: 'Classe de Amigo (14 Nós)' },
                { id: 'COMPANHEIRO', label: 'Classe de Companheiro (9 Nós)' },
                { id: 'PESQUISADOR_GUIA', label: 'Pesquisador a Guia (4 Amarras)' }
              ].map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => {
                    setSelectedClassFilter(cls.id);
                    const firstMatch =
                      cls.id === 'TODOS'
                        ? KNOTS_DATABASE[0]
                        : cls.id === 'COMPANHEIRO'
                          ? KNOTS_DATABASE.find((k) => k.classLevel === 'COMPANHEIRO') || KNOTS_DATABASE[0]
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
                        {k.classLabel}
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

            {/* Imagem 3D Oficial + Seletor de Passos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-700 text-center space-y-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <span>Visualização em 3D</span>
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
                  className="cursor-zoom-in bg-white rounded-xl p-3 border border-slate-200/80 flex items-center justify-center h-60 sm:h-68 overflow-hidden shadow-inner group relative"
                >
                  <img
                    src={currentKnot.image3dUrl}
                    alt={currentKnot.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-snug">
                    {currentKnot.imageCaption}
                  </p>
                  <p className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500">
                    Créditos das imagens 3D: Knots 3D (knots3d.com)
                  </p>
                </div>
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

          {/* Modal de Zoom da Imagem 3D do Nó/Amarra (via Portal na Viewport) */}
          {isKnotZoomOpen &&
            typeof document !== 'undefined' &&
            createPortal(
              <div
                onClick={() => setIsKnotZoomOpen(false)}
                className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
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
                      src={currentKnot.image3dUrl}
                      alt={currentKnot.name}
                      className="max-h-[60vh] max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="text-center space-y-0.5">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {currentKnot.imageCaption}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400">
                      Créditos das imagens 3D: Knots 3D (knots3d.com)
                    </p>
                  </div>
                </div>
              </div>,
              document.body
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
                  {['MARANATA', 'DESBRAVADOR', 'DBV 1950', 'SOS', 'SEMPRE ALERTA'].map((preset) => (
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

          {/* 2.2 TRADUTOR E GUIA COMPLETO DE CÓDIGO SEMÁFORA (ALFABETO A-Z E NÚMEROS 0-9) */}
          {codeSubTab === 'SEMAFORA' && (
            <div className="space-y-4">
              {/* 1. Tradução Instantânea e Animação da Mensagem Digitada (Letras A-Z e Números 0-9) */}
              <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight">
                      Tradução Visual em Código Semáfora (Letras A–Z e Números 0–9)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Visão frontal do sinaleiro (bandeirola vermelha na mão direita e amarela na esquerda). Toque para ampliar:
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAnimateSemaphoreWord}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 active:scale-95 transition-all self-start sm:self-auto"
                  >
                    <Play size={14} fill="currentColor" />
                    <span>{semaphorePlayIdx !== null ? 'Parar Animação' : 'Animar Sinal por Sinal'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                  {normalizedChars
                    .filter((c) => /[A-Z0-9]/.test(c))
                    .map((ch, idx) => {
                      const isPlayingThis = semaphorePlayIdx === idx;
                      const isDigit = /[0-9]/.test(ch);
                      const numItem = isDigit ? SEMAPHORE_NUMBERS_LIST.find((n) => n.digit === ch) : null;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSemaphoreModal(ch)}
                          className={`p-2.5 rounded-2xl border text-center transition-all active:scale-95 relative group ${
                            isPlayingThis
                              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 scale-105 shadow-md'
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                          }`}
                        >
                          <span
                            className={`absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase text-white ${
                              isDigit ? 'bg-emerald-600' : 'bg-indigo-600'
                            }`}
                          >
                            {isDigit ? `#${ch}` : ch}
                          </span>
                          {renderSemaphoreFigure(ch, 'SMALL')}
                          <span className="font-black text-sm text-slate-800 dark:text-white block mt-1">
                            {ch}
                          </span>
                          {isDigit && numItem && (
                            <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 block">
                              ({numItem.equivLetter})
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* 2. Tabela Completa de Números em Código Semáfora (0 a 9 + Sinal Numérico #) */}
              <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h5 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
                      Números em Código Semáfora de 0 a 9 (+ Sinal Numérico #)
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Em Semáfora, faz-se o <strong>Sinal Numérico (#)</strong> antes dos algarismos: 1 a 9 usam as posições de <strong>A a I</strong>, e o <strong>0</strong> usa a posição <strong>K</strong> (para voltar às letras, faz-se o sinal <strong>J</strong>).
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg self-start sm:self-auto shrink-0">
                    10 Algarismos + 2 Sinais de Controle
                  </span>
                </div>

                {/* Sinais de Controle Numérico/Alfabético + Algarismos 1–9 e 0 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {/* Sinal Numérico (#) */}
                  <button
                    type="button"
                    onClick={() => setSelectedSemaphoreModal('NUM')}
                    className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-100/60 border border-amber-300 dark:border-amber-800 flex flex-col items-center text-center transition-all active:scale-95"
                  >
                    {renderSemaphoreFigure('NUM', 'SMALL')}
                    <span className="text-xs font-black text-amber-800 dark:text-amber-300 mt-1">
                      # • Sinal Numérico
                    </span>
                    <span className="text-[10px] font-semibold text-amber-700/80 dark:text-amber-400/80 mt-0.5 leading-tight">
                      Inicia transmissão de números
                    </span>
                  </button>

                  {/* Algarismos 1 a 9 e 0 */}
                  {SEMAPHORE_NUMBERS_LIST.map((num) => (
                    <button
                      key={num.digit}
                      type="button"
                      onClick={() => setSelectedSemaphoreModal(num.digit)}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-400 flex flex-col items-center text-center transition-all active:scale-95 relative"
                    >
                      <span className="absolute top-2 left-2 w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                        {num.digit}
                      </span>
                      {renderSemaphoreFigure(num.digit, 'SMALL')}
                      <span className="text-xs font-black text-slate-800 dark:text-white mt-1">
                        {num.digit} • {num.name}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {num.equivLetter}
                      </span>
                    </button>
                  ))}

                  {/* Sinal de Descanso / Espaço */}
                  <button
                    type="button"
                    onClick={() => setSelectedSemaphoreModal('ESP')}
                    className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900/90 hover:bg-slate-200/60 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center text-center transition-all active:scale-95"
                  >
                    {renderSemaphoreFigure('ESP', 'SMALL')}
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 mt-1">
                      Espaço / Descanso
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Fim da palavra (6h)
                    </span>
                  </button>
                </div>
              </div>

              {/* 3. Tabela Visual Completa do Alfabeto em Código Semáfora (A a Z) */}
              <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <h5 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
                      Alfabeto Completo em Código Semáfora de A a Z (Toque para Ampliar)
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Todas as 26 letras do alfabeto internacional organizadas pelos círculos das bandeirolas:
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                    26 Letras Oficiais (A–Z)
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-2.5">
                  {SEMAPHORE_ALPHABET_LETTERS.map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setSelectedSemaphoreModal(letter)}
                      className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 flex flex-col items-center justify-center transition-all active:scale-95 group relative"
                    >
                      {renderSemaphoreFigure(letter, 'SMALL')}
                      <span className="text-xs font-black text-slate-800 dark:text-white mt-1">
                        Letra {letter}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal de Ampliação do Sinal em Código Semáfora (via Portal na Viewport) */}
              {selectedSemaphoreModal &&
                SEMAPHORE_ANGLES[selectedSemaphoreModal] &&
                typeof document !== 'undefined' &&
                createPortal(
                  (() => {
                    const angles = SEMAPHORE_ANGLES[selectedSemaphoreModal];
                    const isDigit = /[0-9]/.test(selectedSemaphoreModal);
                    const numItem = isDigit
                      ? SEMAPHORE_NUMBERS_LIST.find((n) => n.digit === selectedSemaphoreModal)
                      : null;
                    const isSpecialNum = selectedSemaphoreModal === 'NUM';
                    const isSpecialEsp = selectedSemaphoreModal === 'ESP';

                    return (
                      <div
                        onClick={() => setSelectedSemaphoreModal(null)}
                        className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
                      >
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 text-center"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                isDigit
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                                  : isSpecialNum
                                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                                  : 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                              }`}
                            >
                              {isDigit
                                ? `Número ${selectedSemaphoreModal} (${numItem?.name}) • ${numItem?.equivLetter}`
                                : isSpecialNum
                                ? 'Sinal Numérico (#) • Semáfora'
                                : isSpecialEsp
                                ? 'Descanso / Espaço • Semáfora'
                                : `Letra ${selectedSemaphoreModal} • Código Semáfora`}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedSemaphoreModal(null)}
                              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center"
                            >
                              <X size={18} />
                            </button>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                            {renderSemaphoreFigure(selectedSemaphoreModal, 'LARGE')}
                          </div>

                          <div className="space-y-2 text-left bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl text-xs">
                            <h5 className="font-black text-sm text-slate-800 dark:text-white uppercase">
                              Posição Exata dos Braços (Visão Frontal):
                            </h5>
                            <p className="font-semibold text-slate-700 dark:text-slate-200">
                              🟥 <strong className="text-red-600 dark:text-red-400">Mão Direita do Sinaleiro (Esquerda da Tela):</strong>{' '}
                              {getSemaphoreArmDescription(angles[0], 'DIREITA')}
                            </p>
                            <p className="font-semibold text-slate-700 dark:text-slate-200">
                              🟨 <strong className="text-amber-600 dark:text-amber-400">Mão Esquerda do Sinaleiro (Direita da Tela):</strong>{' '}
                              {getSemaphoreArmDescription(angles[1], 'ESQUERDA')}
                            </p>
                            {isDigit && numItem && (
                              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                                💡 {numItem.circleNote} (precedido pelo Sinal Numérico #).
                              </p>
                            )}
                            {isSpecialNum && (
                              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 pt-1">
                                💡 Faça este sinal antes de transmitir números. Para retornar às letras, faça o sinal da letra J.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })(),
                  document.body
                )}
            </div>
          )}

          {/* 2.3 GUIA COMPLETO DE LIBRAS: ALFABETO (A-Z), NÚMEROS (0-9) E EXPRESSÕES MAIS USADAS */}
          {codeSubTab === 'LIBRAS' && (
            <div className="space-y-4">
              {/* Soletração Visual da Palavra ou Número Digitado (A-Z e 0-9) */}
              <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div>
                  <h4 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight">
                    Tradução Visual em Libras (Letras A–Z e Números 0–9)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Veja a configuração exata da mão para cada letra ou número digitado acima (toque para ampliar):
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {normalizedChars
                    .filter((c) => /[A-Z0-9]/.test(c))
                    .map((ch, idx) => {
                      const isDigit = /[0-9]/.test(ch);
                      const letterInfo = !isDigit ? LIBRAS_GUIDE[ch] : null;
                      const numInfo = isDigit ? LIBRAS_NUMBERS.find((n) => n.digit === ch) : null;
                      if (!letterInfo && !numInfo) return null;

                      const svgSrc = isDigit ? numInfo!.handSvg : `/libras/${ch}.svg`;
                      const svgRotation = isDigit ? numInfo?.svgRotation || '' : '';
                      const handShapeText = isDigit ? numInfo!.handShape : letterInfo!.handShape;
                      const tipText = isDigit ? numInfo!.tip : letterInfo!.tip;

                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedLibrasLetterModal(ch)}
                          className="cursor-pointer p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 transition-all flex items-center space-x-3.5 group"
                        >
                          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0 shadow-xs relative">
                            <img
                              src={svgSrc}
                              alt={`Sinal ${ch} em Libras`}
                              className={`w-full h-full object-contain group-hover:scale-110 transition-transform ${svgRotation}`}
                            />
                            <span
                              className={`absolute -top-1.5 -left-1.5 w-6 h-6 rounded-lg text-white font-black text-xs flex items-center justify-center shadow-xs ${
                                isDigit ? 'bg-emerald-600' : 'bg-indigo-600'
                              }`}
                            >
                              {ch}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black text-slate-800 dark:text-white leading-snug">
                              {handShapeText}
                            </p>
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block mt-1">
                              {tipText}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Números em Libras (0 a 9) Ilustrados */}
              <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <h5 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
                      Números em Libras de 0 a 9 (Cardinais e Quantidades)
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Toque em qualquer número para ampliar a posição dos dedos e ver a dica prática:
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                    10 Algarismos Ilustrados (0–9)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {LIBRAS_NUMBERS.map((num) => (
                    <button
                      key={num.digit}
                      type="button"
                      onClick={() => setSelectedLibrasLetterModal(num.digit)}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-400 flex flex-col items-center text-center transition-all active:scale-95 group"
                    >
                      <div className="w-16 h-16 bg-white rounded-2xl p-2 border border-slate-200/80 flex items-center justify-center relative shadow-2xs">
                        <img
                          src={num.handSvg}
                          alt={`Número ${num.digit} em Libras`}
                          className={`w-full h-full object-contain group-hover:scale-110 transition-transform ${num.svgRotation || ''}`}
                        />
                        <span className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          {num.digit}
                        </span>
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-white mt-2">
                        {num.digit} • {num.name}
                      </span>
                      <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                        {num.handShape}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expressões e Sinais Mais Usados em Libras (24 Expressões Práticas) */}
              <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h5 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
                      Expressões e Frases Mais Usadas em Libras ({LIBRAS_EXPRESSIONS.length} Sinais)
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Sinais do dia a dia, cumprimentos, expressões do Clube de Desbravadores e emergências:
                    </p>
                  </div>
                </div>

                {/* Filtro de Categoria das Expressões em Libras */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                  {[
                    { id: 'TODAS' as const, label: `Todas (${LIBRAS_EXPRESSIONS.length})` },
                    { id: 'CUMPRIMENTOS' as const, label: 'Cumprimentos e Cortesia (7)' },
                    { id: 'CLUBE' as const, label: 'Desbravadores e Clube (6)' },
                    { id: 'ACAMPAMENTO' as const, label: 'Acampamento e Emergência (6)' },
                    { id: 'DIALOGO' as const, label: 'Perguntas e Diálogo (5)' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setLibrasExpressionCat(cat.id)}
                      className={`px-3.5 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                        librasExpressionCat === cat.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Lista de Cartões de Expressões em Libras */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {LIBRAS_EXPRESSIONS.filter(
                    (item) => librasExpressionCat === 'TODAS' || item.category === librasExpressionCat
                  ).map((expr) => (
                    <div
                      key={expr.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start space-x-3.5">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-1.5 flex flex-col items-center justify-center shrink-0 shadow-xs relative">
                          <img
                            src={expr.handSvg}
                            alt={expr.handConfigLabel}
                            className="w-11 h-11 object-contain"
                          />
                          <span className="text-[8.5px] font-black uppercase tracking-tighter text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded mt-0.5">
                            {expr.handConfigLabel}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h6 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">
                              {expr.phrase}
                            </h6>
                            <span
                              className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${
                                expr.category === 'CLUBE'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : expr.category === 'ACAMPAMENTO'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                  : expr.category === 'CUMPRIMENTOS'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                              }`}
                            >
                              {expr.category === 'CLUBE'
                                ? 'Desbravadores'
                                : expr.category === 'ACAMPAMENTO'
                                ? 'Campo / S.O.S.'
                                : expr.category === 'CUMPRIMENTOS'
                                ? 'Saudação'
                                : 'Diálogo'}
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                            <strong className="text-slate-900 dark:text-white">Mãos:</strong> {expr.howToSign}
                          </p>
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                            <strong className="text-indigo-600 dark:text-indigo-400">Movimento:</strong> {expr.movement}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px]">
                        <span className="font-bold text-slate-500 dark:text-slate-400">
                          😊 Expressão: <span className="text-slate-700 dark:text-slate-200">{expr.facialExpression}</span>
                        </span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          💡 {expr.tip}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabela Visual Completa do Alfabeto Manual (A a Z) com Imagens */}
              <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <h5 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Alfabeto Ilustrado Completo de A a Z (Toque em uma Letra para Ampliar)
                  </h5>
                  <span className="text-[10px] font-bold text-slate-400">
                    26 Sinais Manuais Ilustrados
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-2.5">
                  {Object.keys(LIBRAS_GUIDE).map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setSelectedLibrasLetterModal(letter)}
                      className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700 flex flex-col items-center justify-center transition-all active:scale-95 group"
                    >
                      <div className="w-12 h-12 bg-white rounded-xl p-1.5 border border-slate-200/70 flex items-center justify-center">
                        <img
                          src={`/libras/${letter}.svg`}
                          alt={`Letra ${letter}`}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-white mt-1.5">
                        {letter}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal de Detalhe da Letra (A-Z) ou Número (0-9) em Libras (via Portal na Viewport) */}
              {selectedLibrasLetterModal &&
                (LIBRAS_GUIDE[selectedLibrasLetterModal] ||
                  LIBRAS_NUMBERS.some((n) => n.digit === selectedLibrasLetterModal)) &&
                typeof document !== 'undefined' &&
                createPortal(
                  (() => {
                    const isNum = /[0-9]/.test(selectedLibrasLetterModal);
                    const numData = isNum
                      ? LIBRAS_NUMBERS.find((n) => n.digit === selectedLibrasLetterModal)
                      : null;
                    const letterData = !isNum ? LIBRAS_GUIDE[selectedLibrasLetterModal] : null;
                    const modalImgSrc = isNum ? numData!.handSvg : `/libras/${selectedLibrasLetterModal}.svg`;
                    const modalRotation = isNum ? numData?.svgRotation || '' : '';
                    const modalHandShape = isNum ? numData!.handShape : letterData!.handShape;
                    const modalTip = isNum ? numData!.tip : letterData!.tip;

                    return (
                      <div
                        onClick={() => setSelectedLibrasLetterModal(null)}
                        className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
                      >
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 text-center"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                isNum
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                              }`}
                            >
                              {isNum
                                ? `Número ${selectedLibrasLetterModal} (${numData?.name}) • Libras`
                                : `Letra ${selectedLibrasLetterModal} • Datilologia Libras`}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedLibrasLetterModal(null)}
                              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center"
                            >
                              <X size={18} />
                            </button>
                          </div>

                          <div className="bg-white rounded-2xl p-6 border border-slate-200 flex items-center justify-center h-52">
                            <img
                              src={modalImgSrc}
                              alt={`Sinal ${selectedLibrasLetterModal}`}
                              className={`max-h-full max-w-full object-contain ${modalRotation}`}
                            />
                          </div>

                          <div className="space-y-1.5 text-left bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl">
                            <h5 className="font-black text-sm text-slate-800 dark:text-white uppercase">
                              Como posicionar a mão:
                            </h5>
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                              {modalHandShape}
                            </p>
                            <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 pt-1">
                              Dica: {modalTip}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })(),
                  document.body
                )}
            </div>
          )}

          {/* 2.4 TABELA VISUAL COMPLETA DE SINAIS DE PISTA PARA TRILHAS (26 SINAIS) */}
          {codeSubTab === 'SINAIS_PISTA' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight">
                      Guia Completo de Sinais de Pista para Trilhas ({TRAIL_SIGNS.length} Sinais Oficiais)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Feitos sempre do lado DIREITO da trilha com gravetos, pedras, capim amarrado ou giz (sem ferir árvores vivas).
                    </p>
                  </div>
                </div>

                {/* Filtro por Categoria de Sinal de Pista */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                  {[
                    { id: 'TODOS' as TrailSignCategory, label: `Todos os Sinais (${TRAIL_SIGNS.length})` },
                    { id: 'DIRECAO' as TrailSignCategory, label: 'Direção e Navegação (9)' },
                    { id: 'PERIGO' as TrailSignCategory, label: 'Perigo e Obstáculos (6)' },
                    { id: 'ACAMPAMENTO' as TrailSignCategory, label: 'Água e Acampamento (6)' },
                    { id: 'MENSAGENS' as TrailSignCategory, label: 'Mensagens e Equipe (6)' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedTrailCategory(cat.id)}
                      className={`px-3.5 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                        selectedTrailCategory === cat.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {TRAIL_SIGNS.filter(
                    (s) => selectedTrailCategory === 'TODOS' || s.category === selectedTrailCategory
                  ).map((sign) => (
                    <div
                      key={sign.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex items-start space-x-3.5"
                    >
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs">
                        {renderTrailSignSvg(sign.svgType)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="inline-block text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                          {sign.categoryLabel}
                        </span>
                        <h5 className="font-black text-xs sm:text-sm text-slate-800 dark:text-white uppercase tracking-tight leading-snug">
                          {sign.name}
                        </h5>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-snug">
                          {sign.description}
                        </p>
                        <p className="text-[10.5px] font-bold text-amber-700 dark:text-amber-300 pt-0.5">
                          Como fazer: {sign.howToMake}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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
