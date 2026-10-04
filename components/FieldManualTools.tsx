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
  initialTab?: 'NOS_AMARRAS' | 'CODIGOS' | 'PRIMEIROS_SOCORROS' | 'ORDEM_UNIDA';
  standaloneDrill?: boolean;
  onBack?: () => void;
}

type ManualTab = 'NOS_AMARRAS' | 'CODIGOS' | 'PRIMEIROS_SOCORROS' | 'ORDEM_UNIDA';
type CodeSubTab = 'TRADUTOR_MORSE' | 'SEMAFORA' | 'LIBRAS' | 'SINAIS_PISTA';
type FirstAidCategory = 'TODOS' | 'BANDAGENS' | 'TRANSPORTE' | 'EMERGENCIAS' | 'PECONHENTOS_PLANTAS';
type DrillSubTab = 'VOZES_ESTRUTURA' | 'COMANDOS_DSA' | 'APITO_GESTOS' | 'EVOLUCOES';
type DrillCommandCategory = 'TODOS' | 'PE_FIRME' | 'EM_MARCHA';

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

// Guia do Alfabeto Manual Brasileiro em Libras (A a Z + Ç)
const getLibrasCharImg = (ch: string): string => {
  if (ch === 'Ç') return '/libras/C_CEDILHA.png';
  return `/libras/${ch}.png`;
};

const LIBRAS_GUIDE: Record<string, { handShape: string; tip: string }> = {
  A: { handShape: 'Punho fechado com o polegar encostado na lateral do indicador', tip: 'Palma voltada para frente.' },
  B: { handShape: 'Quatro dedos esticados e unidos para cima; polegar dobrado na palma', tip: 'Mão reta vertical.' },
  C: { handShape: 'Dedos curvados formando a letra "C"', tip: 'Formato idêntico à letra C impressa.' },
  Ç: { handShape: 'Dedos curvados formando a letra "C" com leve movimento vibratório descendente (cedilha)', tip: 'Letra oficial do Alfabeto Manual Brasileiro de Libras.' },
  D: { handShape: 'Indicador apontando para cima; demais dedos unidos ao polegar em círculo', tip: 'Forma o bojo e a haste do D.' },
  E: { handShape: 'Pontas dos cinco dedos curvadas para dentro (em garra fechada)', tip: 'Sem fechar o punho totalmente.' },
  F: { handShape: 'Indicador dobrado para frente e polegar cruzado por fora dele; outros 3 dedos erguidos', tip: 'Atenção: polegar por fora do indicador (por dentro é a letra T).' },
  G: { handShape: 'Indicador apontando para cima e polegar encostado na lateral; demais dedos fechados', tip: 'Mão vertical (em Libras o G aponta para cima).' },
  H: { handShape: 'Indicador e médio estendidos com polegar entre eles, fazendo um giro curto no ar', tip: 'Possui movimento circular curto.' },
  I: { handShape: 'Apenas o dedo mínimo (mindinho) esticado para cima', tip: 'Demais dedos fechados.' },
  J: { handShape: 'Dedo mínimo esticado desenhando a curva da letra "J" no ar', tip: 'Começa como o I e faz a curva.' },
  K: { handShape: 'Indicador e médio estendidos com polegar entre eles, movendo verticalmente para cima', tip: 'Mesma mão do H, mas com impulso vertical para cima.' },
  L: { handShape: 'Polegar e indicador abertos em 90° formando um "L"', tip: 'Demais dedos fechados.' },
  M: { handShape: 'Dedos indicador, médio e anelar unidos apontando para baixo (3 hastes)', tip: 'Em Libras brasileira, o M tem os 3 dedos estendidos para baixo.' },
  N: { handShape: 'Dedos indicador e médio unidos apontando para baixo (2 hastes)', tip: 'Em Libras brasileira, o N tem os 2 dedos estendidos para baixo.' },
  O: { handShape: 'Todos os dedos curvados tocando a ponta do polegar em círculo', tip: 'Formato exato da letra O.' },
  P: { handShape: 'Mesma configuração do H/K, porém apontada horizontalmente para frente/baixo', tip: 'Estático (sem giro).' },
  Q: { handShape: 'Igual ao G, mas com o indicador apontando para baixo', tip: 'Ponta do indicador para baixo.' },
  R: { handShape: 'Dedo médio cruzado sobre o dedo indicador esticado', tip: 'Dedos trançados.' },
  S: { handShape: 'Punho fechado com o polegar cruzado na frente dos dedos dobrados', tip: 'Diferente do A (onde o polegar fica na lateral).' },
  T: { handShape: 'Indicador dobrado e polegar passando POR DENTRO entre o indicador e o médio', tip: 'Outros 3 dedos erguidos (diferente do F).' },
  U: { handShape: 'Indicador e médio esticados e UNIDOS para cima', tip: 'Sem separar os dois dedos.' },
  V: { handShape: 'Indicador e médio esticados e SEPARADOS formando um "V"', tip: 'Sinal clássico de vitória.' },
  W: { handShape: 'Indicador, médio e anelar esticados e separados formando um "W"', tip: 'Três dedos abertos para cima.' },
  X: { handShape: 'Dedo indicador curvado em gancho puxando levemente para trás', tip: 'Lembra um gancho em movimento.' },
  Y: { handShape: 'Polegar e dedo mínimo abertos ("hang loose") com leve movimento', tip: 'Indicador, médio e anelar fechados.' },
  Z: { handShape: 'Dedo indicador esticado desenhando o zigue-zague da letra "Z" no ar', tip: 'Traçado visual da letra.' }
};

// Guia Ilustrado de Números em Libras (0 a 9) - Alfabeto/Numerais Brasileiros
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
    handSvg: '/libras/0.png',
    handShape: 'Todos os dedos curvados tocando a ponta do polegar em círculo fechado',
    tip: 'Dica: Mão fechada em formato circular representando o algarismo Zero (0).'
  },
  {
    digit: '1',
    name: 'Um',
    handSvg: '/libras/1.png',
    handShape: 'Cardinal em Libras: Polegar erguido • Quantidade: Dedo indicador erguido',
    tip: 'Dica: Em Libras brasileira, números cardinais (telefone, documentos) usam o polegar para o 1.'
  },
  {
    digit: '2',
    name: 'Dois',
    handSvg: '/libras/2.png',
    handShape: 'Cardinal em Libras: Polegar e indicador abertos • Quantidade: Indicador e médio em "V"',
    tip: 'Dica: Dois dedos claramente estendidos.'
  },
  {
    digit: '3',
    name: 'Três',
    handSvg: '/libras/3.png',
    handShape: 'Três dedos estendidos e separados (polegar, indicador e médio ou indicador, médio e anelar)',
    tip: 'Dica: Mantenha os três dedos bem visíveis.'
  },
  {
    digit: '4',
    name: 'Quatro',
    handSvg: '/libras/4.png',
    handShape: 'Quatro dedos estendidos (indicador, médio, anelar e mínimo) e polegar recolhido na palma',
    tip: 'Dica: Mantenha os quatro dedos levemente afastados para facilitar a leitura visual.'
  },
  {
    digit: '5',
    name: 'Cinco',
    handSvg: '/libras/5.png',
    handShape: 'Cardinal em Libras: Dedos indicador e médio curvados em gancho • Quantidade: 5 dedos abertos',
    tip: 'Curiosidade: No Brasil (Libras), o algarismo 5 cardinal é feito dobrando os dedos indicador e médio em gancho!'
  },
  {
    digit: '6',
    name: 'Seis',
    handSvg: '/libras/6.png',
    handShape: 'Mão deitada com os dedos fechados e o polegar encostado sobre a lateral do indicador curvado (bojo embaixo)',
    tip: 'Dica: Lembra o desenho do número 6 com o círculo na parte de baixo e o polegar em cima.'
  },
  {
    digit: '7',
    name: 'Sete',
    handSvg: '/libras/7.png',
    handShape: 'Polegar e indicador abertos apontando para baixo/diagonal, desenhando o ângulo do número "7"',
    tip: 'Dica: Forma visualmente o ângulo do algarismo 7.'
  },
  {
    digit: '8',
    name: 'Oito',
    handSvg: '/libras/8.png',
    handShape: 'Punho fechado (configuração da letra "S") com leve movimento lateral do punho',
    tip: 'Dica: Enquanto a letra S fica parada, o número 8 tem um leve giro do punho.'
  },
  {
    digit: '9',
    name: 'Nove',
    handSvg: '/libras/9.png',
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

// Sinais de Pista Oficiais para Trilhas (19 Sinais da Tabela Oficial Imagem 1 + 10 Sinais Clássicos Verificados)
type TrailSignCategory = 'TODOS' | 'DIRECAO' | 'PERIGO' | 'ACAMPAMENTO' | 'MENSAGENS' | 'NATURAIS';

interface TrailSignItem {
  id: string;
  name: string;
  category: Exclude<TrailSignCategory, 'TODOS'>;
  categoryLabel: string;
  sourceBadge: string;
  howToMake: string;
  description: string;
  svgType: string;
}

const TRAIL_SIGNS: TrailSignItem[] = [
  // =========================================================================
  // 19 SINAIS OFICIAIS DA TABELA DE SINAIS DE PISTA (IMAGEM 1)
  // =========================================================================
  {
    id: 'ts_img1_1',
    name: 'Começo do Jogo / Início de Pista',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Navegação',
    sourceBadge: 'Tabela Oficial • Sinal 1',
    howToMake: 'Círculo no chão atravessado horizontalmente por uma seta longa apontando na direção inicial',
    description: 'Marca o ponto exato de partida do jogo de pista ou trilha orientada.',
    svgType: 'START_TRAIL'
  },
  {
    id: 'ts_img1_2',
    name: 'Siga Nesta Direção (Caminho a Seguir)',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Navegação',
    sourceBadge: 'Tabela Oficial • Sinal 2',
    howToMake: 'Seta reta feita com gravetos, pedras ou risco firme no solo apontando o rumo',
    description: 'Indica a direção correta que a unidade deve seguir a partir daquele ponto.',
    svgType: 'FOLLOW_DIRECTION'
  },
  {
    id: 'ts_img1_3',
    name: 'Volte ao Ponto de Partida (Retornar)',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Navegação',
    sourceBadge: 'Tabela Oficial • Sinal 3',
    howToMake: 'Seta apontando para trás com dois traços verticais paralelos na extremidade da haste',
    description: 'Ordem para dar meia-volta e regressar ao ponto inicial da pista.',
    svgType: 'RETURN_START'
  },
  {
    id: 'ts_img1_4',
    name: 'Diminuir a Marcha (Andar Devagar)',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Navegação',
    sourceBadge: 'Tabela Oficial • Sinal 4',
    howToMake: 'Haste reta terminando em uma ponta triangular fechada (cabeça de seta em triângulo)',
    description: 'Reduza o ritmo da caminhada; trecho que exige cautela ou observação atenta.',
    svgType: 'SLOW_PACE'
  },
  {
    id: 'ts_img1_5',
    name: 'Apressar o Passo (Passo Acelerado)',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Navegação',
    sourceBadge: 'Tabela Oficial • Sinal 5',
    howToMake: 'Seta formada por duas linhas paralelas (haste dupla) unidas na ponta da seta',
    description: 'Aperte o passo ou trote até alcançar o próximo sinal da trilha.',
    svgType: 'FAST_PACE'
  },
  {
    id: 'ts_img1_6',
    name: 'Caminho a Evitar (Caminho Errado)',
    category: 'PERIGO',
    categoryLabel: 'Perigo & Obstáculos',
    sourceBadge: 'Tabela Oficial • Sinal 6',
    howToMake: 'Dois gravetos ou riscos cruzados em formato de "X" na entrada do atalho ou cruzamento',
    description: 'Trilha bloqueada ou caminho incorreto. Obrigatório usar nos cruzamentos nas vias que não devem ser seguidas.',
    svgType: 'CROSS_X'
  },
  {
    id: 'ts_img1_7',
    name: 'Objeto ou Mensagem Escondida a 3 Passos',
    category: 'MENSAGENS',
    categoryLabel: 'Mensagens & Equipe',
    sourceBadge: 'Tabela Oficial • Sinal 7',
    howToMake: 'Quadrado com o número de passos dentro (ex.: 3) e uma seta saindo da lateral indicando a direção',
    description: 'Há um objeto ou mensagem oculta a "N" passos (ex.: 3 passos) na direção apontada pela seta.',
    svgType: 'MESSAGE'
  },
  {
    id: 'ts_img1_8',
    name: 'Obstáculo a Transpor (Passar por Cima)',
    category: 'PERIGO',
    categoryLabel: 'Perigo & Obstáculos',
    sourceBadge: 'Tabela Oficial • Sinal 8',
    howToMake: 'Linha que sobe em rampa, segue reta no topo com ponta de seta e possui um traço vertical sob a rampa',
    description: 'Indica que a unidade deve subir ou transpor o obstáculo à frente (tronco, barranco, cerca ou rocha).',
    svgType: 'OVER_OBSTACLE'
  },
  {
    id: 'ts_img1_9',
    name: 'Perigo (Atenção Redobrada)',
    category: 'PERIGO',
    categoryLabel: 'Perigo & Obstáculos',
    sourceBadge: 'Tabela Oficial • Sinal 9',
    howToMake: 'Triângulo equilátero feito com três gravetos ou riscado de forma bem visível no chão',
    description: 'Alerta de perigo próximo na trilha (precipício, buraco, animais peçonhentos, vespeiro ou terreno instável).',
    svgType: 'TRIANGLE'
  },
  {
    id: 'ts_img1_10',
    name: 'Dividir o Grupo (Bifurcação da Equipe)',
    category: 'MENSAGENS',
    categoryLabel: 'Mensagens & Equipe',
    sourceBadge: 'Tabela Oficial • Sinal 10',
    howToMake: 'Haste horizontal única que se bifurca em duas setas diagonais (uma para cima e outra para baixo)',
    description: 'O grupo deve se dividir em duas equipes seguindo as duas direções indicadas.',
    svgType: 'SPLIT_GROUP'
  },
  {
    id: 'ts_img1_11',
    name: 'Virar à Direita',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Navegação',
    sourceBadge: 'Tabela Oficial • Sinal 11',
    howToMake: 'Haste vertical que dobra em ângulo de 90° apontando a seta para o lado direito',
    description: 'Pegue a trilha ou acesso que dobra imediatamente para a direita.',
    svgType: 'ARROW_RIGHT'
  },
  {
    id: 'ts_img1_12',
    name: 'Virar à Esquerda',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Navegação',
    sourceBadge: 'Tabela Oficial • Sinal 12',
    howToMake: 'Haste vertical que dobra em ângulo de 90° apontando a seta para o lado esquerdo',
    description: 'Pegue a trilha ou acesso que dobra imediatamente para a esquerda.',
    svgType: 'ARROW_LEFT'
  },
  {
    id: 'ts_img1_13',
    name: 'Seguir em Frente',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Navegação',
    sourceBadge: 'Tabela Oficial • Sinal 13',
    howToMake: 'Seta vertical apontando diretamente para a frente da trilha',
    description: 'Continue caminhando reto na direção principal da trilha.',
    svgType: 'ARROW_UP'
  },
  {
    id: 'ts_img1_14',
    name: 'Reunir o Grupo (Ponto de Encontro)',
    category: 'MENSAGENS',
    categoryLabel: 'Mensagens & Equipe',
    sourceBadge: 'Tabela Oficial • Sinal 14',
    howToMake: 'Pequeno círculo central rodeado por quatro setas (cima, baixo, esquerda e direita) apontando para ele',
    description: 'Toda a unidade ou patrulha deve se reunir e agrupar neste local antes de prosseguir.',
    svgType: 'REUNION'
  },
  {
    id: 'ts_img1_15',
    name: 'Acampamento Nessa Direção',
    category: 'ACAMPAMENTO',
    categoryLabel: 'Água & Acampamento',
    sourceBadge: 'Tabela Oficial • Sinal 15',
    howToMake: 'Triângulo em formato de barraca com bandeirola no topo e uma seta indicando a direção',
    description: 'Indica o rumo exato onde está montado o acampamento do clube ou unidade.',
    svgType: 'CAMP'
  },
  {
    id: 'ts_img1_16',
    name: 'Siga Rapidamente (Urgência)',
    category: 'DIRECAO',
    categoryLabel: 'Direção & Navegação',
    sourceBadge: 'Tabela Oficial • Sinal 16',
    howToMake: 'Semicírculo fechado em formato de arco ("D") na base com uma seta longa saindo para a frente',
    description: 'Avance imediatamente com rapidez na direção indicada pela seta.',
    svgType: 'FOLLOW_QUICKLY'
  },
  {
    id: 'ts_img1_17',
    name: 'Grupo Dividido: 2 para um Lado e 3 para o Outro',
    category: 'MENSAGENS',
    categoryLabel: 'Mensagens & Equipe',
    sourceBadge: 'Tabela Oficial • Sinal 17',
    howToMake: 'Seta bifurcada com 2 traços transversais no ramo superior e 3 traços transversais no ramo inferior',
    description: 'Indica quantos integrantes seguiram para cada lado (2 membros por um caminho e 3 pelo outro).',
    svgType: 'SPLIT_2_AND_3'
  },
  {
    id: 'ts_img1_18',
    name: 'Água Potável (Boa para Beber)',
    category: 'ACAMPAMENTO',
    categoryLabel: 'Água & Acampamento',
    sourceBadge: 'Tabela Oficial • Sinal 18',
    howToMake: 'Duas linhas onduladas paralelas horizontais imitando ondas de água',
    description: 'Fonte ou nascente de água limpa e segura para consumo da unidade.',
    svgType: 'WATER_GOOD'
  },
  {
    id: 'ts_img1_19',
    name: 'Água Não Potável (Imprópria para Consumo)',
    category: 'ACAMPAMENTO',
    categoryLabel: 'Água & Acampamento',
    sourceBadge: 'Tabela Oficial • Sinal 19',
    howToMake: 'Duas linhas onduladas paralelas cortadas ao centro por um grande "X"',
    description: 'Água contaminada ou salobra: proibido beber sem purificação/fervura.',
    svgType: 'WATER_BAD'
  },

  // =========================================================================
  // SINAIS ADICIONAIS VERIFICADOS DOS MANUAIS MDA / ESCOTISMO (UEB)
  // =========================================================================
  {
    id: 'ts_end_trail',
    name: 'Fim de Pista / Missão Cumprida ("Voltei para Casa")',
    category: 'MENSAGENS',
    categoryLabel: 'Mensagens & Equipe',
    sourceBadge: 'Manual MDA & Escotismo (Baden-Powell)',
    howToMake: 'Círculo de pedras ou risco circular com um ponto/pedra bem no centro (⊙)',
    description: 'Sinal internacional escoteiro e desbravador que encerra oficialmente a trilha de sinais.',
    svgType: 'END_TRAIL'
  },
  {
    id: 'ts_wait',
    name: 'Esperar Aqui por "N" Minutos (Ex.: 10 min)',
    category: 'MENSAGENS',
    categoryLabel: 'Mensagens & Equipe',
    sourceBadge: 'Manual de Especialidades MDA',
    howToMake: 'Retângulo (ou dois quadrados concêntricos) com o número de minutos de espera escrito dentro',
    description: 'A unidade deve aguardar parada neste ponto pelo tempo determinado antes de abrir a próxima pista.',
    svgType: 'WAIT_HERE'
  },
  {
    id: 'ts_good_bridge',
    name: 'Ponte Boa / Passagem Segura',
    category: 'ACAMPAMENTO',
    categoryLabel: 'Água & Acampamento',
    sourceBadge: 'Manual de Pioneiria & Trilha',
    howToMake: 'Duas barras paralelas horizontais abertas nas pontas representando as bordas firmes da ponte',
    description: 'Indica que a ponte, pinguela ou travessia de riacho à frente é firme e segura.',
    svgType: 'GOOD_BRIDGE'
  },
  {
    id: 'ts_bad_bridge',
    name: 'Ponte Ruim / Travessia Perigosa ou Quebrada',
    category: 'PERIGO',
    categoryLabel: 'Perigo & Obstáculos',
    sourceBadge: 'Manual de Pioneiria & Trilha',
    howToMake: 'Duas barras paralelas horizontais interrompidas ao meio por um "X"',
    description: 'Ponte podre, quebrada ou submersa; não atravesse sobre ela — procure vau seguro.',
    svgType: 'BAD_BRIDGE'
  },
  {
    id: 'ts_hide',
    name: 'Esconder-se / Abrigar-se Próximo Daqui',
    category: 'PERIGO',
    categoryLabel: 'Perigo & Obstáculos',
    sourceBadge: 'Jogos Noturnos & Campo MDA',
    howToMake: 'Três traços verticais protegidos por um arco curvo superior (cobertura)',
    description: 'A unidade deve se ocultar na vegetação ou buscar abrigo imediato.',
    svgType: 'HIDE_COVER'
  },
  {
    id: 'ts_sos',
    name: 'Pedido de Socorro Universal (S.O.S. — 3 Sinais Iguais)',
    category: 'PERIGO',
    categoryLabel: 'Perigo & Obstáculos',
    sourceBadge: 'Código Internacional de Resgate',
    howToMake: 'Três pilhas de pedras, três traços paralelos ou três silvos de apito alinhados',
    description: 'Qualquer sinal repetido 3 vezes na natureza indica pedido oficial de socorro imediato.',
    svgType: 'SOS_SIGNAL'
  },
  {
    id: 'ts_grass_dir',
    name: 'Sinal Natural em Capim: Seguir nesta Direção',
    category: 'NATURAIS',
    categoryLabel: 'Sinais Naturais (Pedra & Capim)',
    sourceBadge: 'Classes Regulares DSA / MDA Wiki',
    howToMake: 'Um tufo de capim vivo amarrado no topo com a ponta inclinada apontando para o caminho certo',
    description: 'Usado em campos e pastagens onde não há gravetos soltos; a inclinação do feixe indica o rumo.',
    svgType: 'GRASS_DIRECTION'
  },
  {
    id: 'ts_grass_danger',
    name: 'Sinal Natural em Capim: Perigo ou Caminho Errado (3 Tufos)',
    category: 'NATURAIS',
    categoryLabel: 'Sinais Naturais (Pedra & Capim)',
    sourceBadge: 'Classes Regulares DSA / MDA Wiki',
    howToMake: 'Três tufos de capim amarrados lado a lado em fileira',
    description: 'Três feixes de capim amarrados significam alerta de perigo ou bloqueio da trilha.',
    svgType: 'GRASS_DANGER'
  },
  {
    id: 'ts_stone_dir',
    name: 'Sinal Natural com Pedras: Seguir na Direção da Pedra Menor',
    category: 'NATURAIS',
    categoryLabel: 'Sinais Naturais (Pedra & Capim)',
    sourceBadge: 'Classes Regulares DSA / MDA Wiki',
    howToMake: 'Uma pedra menor apoiada sobre uma pedra maior, e outra pedrinha no chão indicando o lado a seguir',
    description: 'Muito usado em leitos secos de rios e lajes rochosas onde não é possível riscar o solo.',
    svgType: 'STONE_DIRECTION'
  },
  {
    id: 'ts_stone_danger',
    name: 'Sinal Natural com Pedras: Perigo / Alerta (3 Pedras Empilhadas)',
    category: 'NATURAIS',
    categoryLabel: 'Sinais Naturais (Pedra & Capim)',
    sourceBadge: 'Classes Regulares DSA / MDA Wiki',
    howToMake: 'Três pedras empilhadas verticalmente em torre (uma sobre a outra)',
    description: 'Indica atenção redobrada ou perigo imediato em terrenos pedregosos e montanhosos.',
    svgType: 'STONE_DANGER'
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

// ============================================================================
// MÓDULO 4: GUIA DE ORDEM UNIDA E VOZES DE COMANDO (MANUAL OFICIAL DSA)
// ============================================================================
interface DrillCommandItem {
  id: string;
  name: string;
  category: 'PE_FIRME' | 'EM_MARCHA';
  categoryLabel: string;
  advertencia: string;
  comandoProprio: string;
  execucao: string;
  footTiming: string;
  steps: string[];
  commonMistake: string;
}

const DRILL_COMMANDS: DrillCommandItem[] = [
  // ================= A PÉ FIRME (11 COMANDOS OFICIAIS) =================
  {
    id: 'ou_sentido',
    name: 'Sentido (Posição Fundamental)',
    category: 'PE_FIRME',
    categoryLabel: 'A Pé Firme',
    advertencia: 'Clube / Unidade!',
    comandoProprio: '— (Direto)',
    execucao: 'SENTIDO!',
    footTiming: 'Pé esquerdo une-se energicamente ao pé direito',
    steps: [
      'Em um único tempo enérgico, o desbravador traz o pé esquerdo junto ao direito, batendo os calcanhares com firmeza.',
      'Calcanhares unidos e pontas dos pés abertas formando um ângulo de aproximadamente 45° (conforme o Manual de Ordem Unida da DSA).',
      'Braços caídos naturalmente ao longo do corpo, mãos espalmadas coladas às coxas com os cinco dedos unidos (dedo médio sobre a costura da calça/saia).',
      'Cabeça erguida, queixo levemente recolhido, ombros alinhados e olhar fixo à frente em imobilidade e silêncio absolutos.'
    ],
    commonMistake: 'Bater as mãos nas coxas fazendo barulho excessivo, deixar os dedos abertos/fechados em punho ou mexer os olhos durante a posição.'
  },
  {
    id: 'ou_descansar',
    name: 'Descansar',
    category: 'PE_FIRME',
    categoryLabel: 'A Pé Firme',
    advertencia: 'Unidade!',
    comandoProprio: '— (Direto)',
    execucao: 'DESCANSAR!',
    footTiming: 'Pé esquerdo desloca ~30 cm para a esquerda',
    steps: [
      'A partir da posição de Sentido, desloca-se o pé esquerdo cerca de 30 cm para a esquerda (largura dos ombros), distribuindo o peso igualmente nas duas pernas.',
      'Simultaneamente, os dois braços vão para trás das costas, abaixo da linha da cintura.',
      'A mão esquerda segura o pulso da mão direita (que fica levemente fechada ou espalmada), mantendo o silêncio e o olhar à frente.'
    ],
    commonMistake: 'Conversar ou sair do alinhamento (na posição de Descansar o silêncio e a imobilidade continuam obrigatórios!).'
  },
  {
    id: 'ou_avontade',
    name: 'À Vontade / Em Forma',
    category: 'PE_FIRME',
    categoryLabel: 'A Pé Firme',
    advertencia: 'Clube!',
    comandoProprio: '— (Direto)',
    execucao: 'À VONTADE!',
    footTiming: 'Mantém o pé direito fixo no solo como base do alinhamento',
    steps: [
      'Partindo da posição de Descansar, o desbravador pode relaxar a postura, movimentar os braços ou ajeitar o uniforme, mantendo obrigatoriamente o PÉ DIREITO no lugar para não perder o alinhamento.',
      'Continua em silêncio (não é permitido conversar, a menos que o instrutor autorize expressamente).',
      'Para retornar, o instrutor comanda "Atenção!" (todos voltam imediatamente à posição de Descansar) seguido de "Sentido!".'
    ],
    commonMistake: 'Sair andando do lugar ou retirar os dois pés da marcação da coluna.'
  },
  {
    id: 'ou_cobrir',
    name: 'Cobrir e Firme (Alinhamento e Cobertura)',
    category: 'PE_FIRME',
    categoryLabel: 'A Pé Firme',
    advertencia: 'Unidade!',
    comandoProprio: '— (Direto)',
    execucao: 'COBRIR! / FIRME!',
    footTiming: 'Execução a pé firme na posição de Sentido',
    steps: [
      'Ao comando "COBRIR!": todos (exceto a 1ª fileira da frente) estendem o braço esquerdo horizontalmente para a frente, palma para baixo, tocando levemente com a ponta do dedo médio a retaguarda do ombro esquerdo do desbravador da frente.',
      'Os integrantes da 1ª fileira (testa) e da coluna-base estendem o braço esquerdo lateralmente tocando o ombro direito do colega ao lado e giram a cabeça/olhar para a direita (exceto o homem-base) para alinhar com precisão.',
      'Ao comando "FIRME!": todos baixam o braço esquerdo energicamente colando à coxa e voltam a cabeça para a frente simultaneamente.'
    ],
    commonMistake: 'Empurrar o ombro do colega da frente ou bater a mão na coxa ao retornar no comando "Firme!".'
  },
  {
    id: 'ou_direita_volver',
    name: 'Direita, Volver (Giro de 90° à Direita)',
    category: 'PE_FIRME',
    categoryLabel: 'A Pé Firme',
    advertencia: 'Unidade!',
    comandoProprio: 'Direita...',
    execucao: 'VOLVER!',
    footTiming: 'Calcanhar Direito + Planta do Pé Esquerdo (2 Tempos)',
    steps: [
      '1º Tempo (na voz "VOLVER!"): Gira-se 90° para a direita sobre o CALCANHAR do pé direito e a PLANTA do pé esquerdo, mantendo os braços colados às coxas e o tronco ereto.',
      '2º Tempo: Une-se energicamente o pé esquerdo ao pé direito, batendo os calcanhares e reassumindo a posição perfeita de Sentido na nova frente.'
    ],
    commonMistake: 'Abrir os braços durante o giro para se equilibrar ou girar sobre os dois calcanhares ao mesmo tempo.'
  },
  {
    id: 'ou_esquerda_volver',
    name: 'Esquerda, Volver (Giro de 90° à Esquerda)',
    category: 'PE_FIRME',
    categoryLabel: 'A Pé Firme',
    advertencia: 'Unidade!',
    comandoProprio: 'Esquerda...',
    execucao: 'VOLVER!',
    footTiming: 'Calcanhar Esquerdo + Planta do Pé Direito (2 Tempos)',
    steps: [
      '1º Tempo (na voz "VOLVER!"): Gira-se 90° para a esquerda sobre o CALCANHAR do pé esquerdo e a PLANTA do pé direito.',
      '2º Tempo: Une-se energicamente o pé direito ao pé esquerdo pelo caminho mais curto, mantendo mãos coladas às coxas.'
    ],
    commonMistake: 'Dar um chute largo para trás ou para o lado antes de unir o pé direito no 2º tempo.'
  },
  {
    id: 'ou_meiavolta_volver',
    name: 'Meia-Volta, Volver (Giro de 180° pela Esquerda)',
    category: 'PE_FIRME',
    categoryLabel: 'A Pé Firme',
    advertencia: 'Clube!',
    comandoProprio: 'Meia-Volta...',
    execucao: 'VOLVER!',
    footTiming: 'Sempre pela ESQUERDA sobre o Calcanhar Esquerdo (2 Tempos)',
    steps: [
      '1º Tempo (na voz "VOLVER!"): Gira-se 180° SEMPRE PELA ESQUERDA sobre o calcanhar do pé esquerdo e a planta do pé direito, terminando o giro com o peso no pé esquerdo à frente.',
      '2º Tempo: Traz-se energicamente o pé direito para junto do pé esquerdo, unindo os calcanhares na nova direção.'
    ],
    commonMistake: 'Girar meia-volta pela direita! Na Ordem Unida oficial da DSA, Meia-Volta é executada SEMPRE pelo lado esquerdo.'
  },
  {
    id: 'ou_oitavo_volver',
    name: 'Oitavo à Direita / à Esquerda, Volver (45°)',
    category: 'PE_FIRME',
    categoryLabel: 'A Pé Firme',
    advertencia: 'Unidade!',
    comandoProprio: 'Oitavo à Direita (ou Esquerda)...',
    execucao: 'VOLVER!',
    footTiming: 'Giro diagonal de 45° em 2 Tempos',
    steps: [
      '1º Tempo: Executa-se exatamente a metade de um giro normal (45° na diagonal indicada) sobre o calcanhar do lado do giro e a planta do pé oposto.',
      '2º Tempo: Une-se o pé de trás ao pé da frente com energia.'
    ],
    commonMistake: 'Girar 90° completos por distração em vez de parar na diagonal de 45°.'
  },
  {
    id: 'ou_olhar_direita',
    name: 'Olhar à Direita / à Esquerda / Frente',
    category: 'PE_FIRME',
    categoryLabel: 'A Pé Firme',
    advertencia: 'Pelotão!',
    comandoProprio: 'Olhar à...',
    execucao: 'DIREITA! / FRENTE!',
    footTiming: 'Giro vivo da cabeça sem mover os ombros',
    steps: [
      'Ao comando "Olhar à DIREITA!" (ou "ESQUERDA!"): gira-se a cabeça e o olhar de forma viva e enérgica para o lado indicado, mantendo o queixo na horizontal e os ombros imóveis.',
      'Ao comando "Olhar, FRENTE!": a cabeça retorna imediatamente à posição frontal em um único golpe firme.'
    ],
    commonMistake: 'Virar o tronco ou inclinar a cabeça ao olhar para o palanque/bandeira.'
  },
  {
    id: 'ou_maranata',
    name: 'Para o Voto, Posição! / Descansar, Posição! (Saudação Maranata)',
    category: 'PE_FIRME',
    categoryLabel: 'A Pé Firme',
    advertencia: 'Desbravadores!',
    comandoProprio: 'Para o Voto...',
    execucao: 'POSIÇÃO!',
    footTiming: '1 Tempo firme com o antebraço direito a 45°',
    steps: [
      'Em posição de Sentido, ao comando "Para o Voto, POSIÇÃO!": ergue-se o antebraço direito em ângulo de 45° da linha vertical, mão espalmada com os 4 dedos unidos na vertical (os 4 "A": Amar, Anunciar, Apressar e Aguardar) e o polegar recolhido sobre a palma (Saudação Maranata).',
      'Ao comando "Descansar, POSIÇÃO!": o braço direito desce energicamente pelo caminho mais curto, voltando a colar na coxa na posição de Sentido.',
      'Posição para Oração: Ao comando "Posição para Oração!", os desbravadores com cobertura (boné) retiram-na com a mão esquerda segurando pela aba; ao término do "Amém", recolocam a cobertura sem necessidade de novo comando.'
    ],
    commonMistake: 'Usar expressões bélicas como "Apresentar Arma" ou "Descansar Arma" (vedadas pelo Manual de Ordem Unida da DSA), ou abrir os dedos da mão direita durante a saudação.'
  },
  {
    id: 'ou_foradeforma',
    name: 'Fora de Forma, Marche (Encerramento)',
    category: 'PE_FIRME',
    categoryLabel: 'A Pé Firme',
    advertencia: 'Clube / Unidade!',
    comandoProprio: 'Fora de Forma...',
    execucao: 'MARCHE!',
    footTiming: 'Saudação + Passo firme à frente com o pé esquerdo',
    steps: [
      'Partindo da posição de Sentido, na voz de execução "MARCHE!": todos rompem a marcha dando um passo firme à frente com o pé esquerdo (ou executam o brado padrão do clube conforme instrução) e saem de forma ordenadamente.'
    ],
    commonMistake: 'Sair de forma antes da voz de execução "Marche!" ou dispersar empurrando os colegas.'
  },

  // ================= EM MARCHA (11 COMANDOS OFICIAIS) =================
  {
    id: 'ou_ordinario_marche',
    name: 'Ordinário, Marche (Início do Deslocamento)',
    category: 'EM_MARCHA',
    categoryLabel: 'Em Marcha',
    advertencia: 'Unidade!',
    comandoProprio: 'Ordinário...',
    execucao: 'MARCHE!',
    footTiming: 'Rompimento sempre com o PÉ ESQUERDO e braço direito à frente',
    steps: [
      'Na palavra "Ordinário...": o desbravador transfere sutilmente o peso do corpo para o pé direito (sem mexer a cabeça ou o tronco), liberando a perna esquerda.',
      'Na execução "MARCHE!": avança o PÉ ESQUERDO marcando o 1º passo com batida firme de planta/calcanhar e simultaneamente oscila o BRAÇO DIREITO à frente (mão fechada ou espalmada até a altura da fivela do cinto) e o braço esquerdo para trás.',
      'Segue em cadência regulamentar de 116 passos por minuto (~75 cm por passo), mantendo alinhamento lateral e cobertura frontal.'
    ],
    commonMistake: 'Sair com o pé direito ou avançar o braço esquerdo junto com a perna esquerda ("marchar amblando").'
  },
  {
    id: 'ou_alto',
    name: 'Unidade, Alto! (Parada da Marcha)',
    category: 'EM_MARCHA',
    categoryLabel: 'Em Marcha',
    advertencia: 'Unidade!',
    comandoProprio: '— (Direto)',
    execucao: 'ALTO!',
    footTiming: 'Voz "ALTO!" dada quando o PÉ ESQUERDO toca o solo',
    steps: [
      'A voz de execução "ALTO!" é comandada no exato instante em que o PÉ ESQUERDO assenta no chão.',
      'Tempo 1: O desbravador dá mais um passo completo à frente com o PÉ DIREITO para absorver o impulso da marcha.',
      'Tempo 2: Une energicamente o PÉ ESQUERDO ao pé direito, colando simultaneamente os dois braços às coxas na posição de Sentido!'
    ],
    commonMistake: 'Comandar "Alto!" no pé direito ou dar passos extras depois do tempo 2.'
  },
  {
    id: 'ou_marcar_passo',
    name: 'Marcar Passo (Em Marcha ou a Pé Firme)',
    category: 'EM_MARCHA',
    categoryLabel: 'Em Marcha',
    advertencia: 'Unidade!',
    comandoProprio: 'Marcar...',
    execucao: 'PASSO!',
    footTiming: 'Em marcha: voz "PASSO!" no PÉ ESQUERDO (ou Direito)',
    steps: [
      'Quando em marcha: após a voz "PASSO!" (no pé esquerdo), dá-se mais um passo curto para conter o avanço e passa-se a elevar os pés alternadamente no mesmo lugar (coxa subindo sem avançar no terreno).',
      'As mãos colam-se às coxas (ou mantêm pequena oscilação conforme padrão regional) enquanto a cadência dos pés continua em 116 passos/min.'
    ],
    commonMistake: 'Acelerar a cadência enquanto marca passo (a tendência natural da tropa é correr; o líder deve manter a contagem "Esquerdo, Direito!").'
  },
  {
    id: 'ou_em_frente',
    name: 'Em Frente! (Retomar o Avanço)',
    category: 'EM_MARCHA',
    categoryLabel: 'Em Marcha',
    advertencia: 'Unidade!',
    comandoProprio: 'Em...',
    execucao: 'FRENTE!',
    footTiming: 'Voz "FRENTE!" dada no PÉ ESQUERDO (ou Direito conforme padrão)',
    steps: [
      'Dado quando a unidade está marcando passo.',
      'Após a voz de execução "FRENTE!", dá-se mais um passo no lugar para preparar o impulso e rompe-se o deslocamento à frente com passo firme de 75 cm e oscilação normal dos braços.'
    ],
    commonMistake: 'Avançar cada fileira em um tempo diferente, abrindo buracos ("sanfona") na coluna.'
  },
  {
    id: 'ou_mudar_passo',
    name: 'Mudar de Passo, Marche (Correção de Cadência)',
    category: 'EM_MARCHA',
    categoryLabel: 'Em Marcha',
    advertencia: 'Unidade!',
    comandoProprio: 'Mudar de Passo...',
    execucao: 'MARCHE!',
    footTiming: 'Voz "MARCHE!" quando o PÉ ESQUERDO toca o solo',
    steps: [
      '1º Tempo: Dá-se um passo normal com o pé direito à frente.',
      '2º Tempo: Traz-se a ponta do pé esquerdo até encostar atrás do calcanhar direito num pequeno passo duplo rápido ("troca de pé").',
      '3º Tempo: Avança-se novamente com o pé direito à frente, prosseguindo a marcha no novo compasso.'
    ],
    commonMistake: 'Parar de marchar para trocar o pé em vez de fazer o passo duplo contínuo.'
  },
  {
    id: 'ou_acelerado_marche',
    name: 'Acelerado, Marche (Passo de Trote)',
    category: 'EM_MARCHA',
    categoryLabel: 'Em Marcha',
    advertencia: 'Unidade!',
    comandoProprio: 'Acelerado...',
    execucao: 'MARCHE!',
    footTiming: 'Rompimento no PÉ ESQUERDO • Cadência de 160 a 180 passos/min',
    steps: [
      'Na voz preventiva "Acelerado...": todos erguem os antebraços a 90° na altura da cintura/peito com os punhos fechados (polegares para cima/dentro) e cotovelos junto ao corpo.',
      'Na execução "MARCHE!": inicia-se o deslocamento em trote cadenciado com o pé esquerdo, mantendo o alinhamento das fileiras.'
    ],
    commonMistake: 'Disparar em corrida livre desfazendo a formação da unidade.'
  },
  {
    id: 'ou_sem_cadencia',
    name: 'Sem Cadência, Marche (Deslocamento em Trilha)',
    category: 'EM_MARCHA',
    categoryLabel: 'Em Marcha',
    advertencia: 'Unidade!',
    comandoProprio: 'Sem Cadência...',
    execucao: 'MARCHE!',
    footTiming: 'Rompe com o pé esquerdo e segue em passo natural',
    steps: [
      'Inicia-se a marcha com o pé esquerdo, mas logo em seguida os desbravadores caminham em passo normal sem obrigação de bater o mesmo pé simultaneamente.',
      'É obrigatório manter a formação em coluna, a distância e o silêncio (usado em pontes, terrenos irregulares ou longas caminhadas).'
    ],
    commonMistake: 'Achar que "Sem Cadência" significa permissão para conversar ou sair da coluna.'
  },
  {
    id: 'ou_conversao',
    name: 'Conversão à Direita / à Esquerda, Marche',
    category: 'EM_MARCHA',
    categoryLabel: 'Em Marcha',
    advertencia: 'Unidade!',
    comandoProprio: 'Conversão à Direita (ou Esquerda)...',
    execucao: 'MARCHE!',
    footTiming: 'Arco de 90° em coluna • Segue até o comando "Em, FRENTE!" ou "ALTO!"',
    steps: [
      'A fileira da frente descreve um arco de círculo de 90° para o lado indicado: o desbravador do lado interno (pivô) diminui o tamanho do passo, enquanto o do lado externo alonga o passo, olhando pelo canto do olho para manter a fileira reta como uma régua.',
      'As fileiras de trás avançam até o exato ponto onde a 1ª fileira virou antes de iniciarem seu arco.',
      'Ao completar o giro da direção desejada, o instrutor comanda "Em, FRENTE!" (ou "Unidade, ALTO!").'
    ],
    commonMistake: 'As fileiras de trás virarem antes de chegar na esquina onde a 1ª fileira converteu ("cortar caminho").'
  },
  {
    id: 'ou_volver_em_marcha',
    name: 'Direita / Esquerda, Volver (Em Marcha)',
    category: 'EM_MARCHA',
    categoryLabel: 'Em Marcha',
    advertencia: 'Unidade!',
    comandoProprio: 'Direita (ou Esquerda)...',
    execucao: 'VOLVER!',
    footTiming: 'Direita Volver = Voz no PÉ DIREITO • Esquerda Volver = Voz no PÉ ESQUERDO',
    steps: [
      'Para "Direita, VOLVER!": a voz "VOLVER!" é dada no PÉ DIREITO. O desbravador apoia o pé esquerdo um passo à frente, gira 90° à direita sobre a planta do pé esquerdo e já rompe a marcha na nova direção com o pé direito.',
      'Para "Esquerda, VOLVER!": a voz "VOLVER!" é dada no PÉ ESQUERDO. Apoia o pé direito um passo à frente, gira 90° à esquerda sobre a planta dele e segue marchando com o pé esquerdo.'
    ],
    commonMistake: 'Dar a voz de execução no pé trocado, fazendo a unidade tropeçar no giro.'
  },
  {
    id: 'ou_meiavolta_marcha',
    name: 'Meia-Volta, Volver (Em Marcha - 180°)',
    category: 'EM_MARCHA',
    categoryLabel: 'Em Marcha',
    advertencia: 'Unidade!',
    comandoProprio: 'Meia-Volta...',
    execucao: 'VOLVER!',
    footTiming: 'Voz "VOLVER!" dada quando o PÉ ESQUERDO toca o solo',
    steps: [
      'A voz "VOLVER!" é comandada no PÉ ESQUERDO.',
      'Tempo 1: O desbravador avança o pé direito meio passo à frente do esquerdo.',
      'Tempo 2: Gira 180° pela esquerda sobre as plantas dos dois pés.',
      'Tempo 3: Rompe imediatamente a marcha na nova direção com o pé esquerdo sem interromper a cadência!'
    ],
    commonMistake: 'Parar completamente após o giro de 180° em vez de continuar a marcha no tempo seguinte.'
  },
  {
    id: 'ou_passos_frente',
    name: '3 (ou 5) Passos em Frente, Marche',
    category: 'EM_MARCHA',
    categoryLabel: 'Em Marcha',
    advertencia: 'Unidade!',
    comandoProprio: '3 Passos em Frente...',
    execucao: 'MARCHE!',
    footTiming: 'Deslocamento curto a partir de pé firme (sempre número ímpar de passos)',
    steps: [
      'Comanda-se sempre um número ÍMPAR de passos (1, 3, 5 ou 7 passos) para que o último passo de avanço seja no pé esquerdo e o fechamento ocorra no pé direito.',
      'Exemplo (3 Passos): 1º passo (esquerdo), 2º passo (direito), 3º passo (esquerdo) e no 4º tempo une-se energicamente o pé direito ao esquerdo sem precisar do comando "Alto!".'
    ],
    commonMistake: 'Pedir número par de passos em frente (como 2 ou 4 passos) ou esquecer de contar o fechamento final.'
  }
];

interface WhistleCommandItem {
  id: string;
  title: string;
  notation: string;
  pattern: ('SHORT' | 'LONG' | 'PAUSE')[];
  whenToUse: string;
  unitAction: string;
}

const WHISTLE_COMMANDS: WhistleCommandItem[] = [
  {
    id: 'apito_atencao',
    title: 'Atenção Geral! (1 Silvo Longo)',
    notation: '—————— (1 Silvo Longo ~2s)',
    pattern: ['LONG'],
    whenToUse: 'Para pedir silêncio imediato e atenção de todo o Clube ou acampamento.',
    unitAction: 'Todos interrompem o que estão fazendo, voltam-se para o instrutor e aguardam o próximo comando (se em À Vontade, passam à posição de Descansar).'
  },
  {
    id: 'apito_sentido',
    title: 'Sentido! (a partir de Descansar)',
    notation: '• (1 Silvo Curto e Forte)',
    pattern: ['SHORT'],
    whenToUse: 'Com o Clube ou Unidade na posição de Descansar.',
    unitAction: 'Em um único tempo firme, une-se o pé esquerdo ao direito assumindo a posição de Sentido.'
  },
  {
    id: 'apito_descansar',
    title: 'Descansar! / À Vontade!',
    notation: '• (1 Curto p/ Descansar) ou • • (2 Curtos p/ À Vontade)',
    pattern: ['SHORT', 'SHORT'],
    whenToUse: 'Com a tropa na posição de Sentido.',
    unitAction: '1 silvo curto comanda "Descansar" (afasta o pé esquerdo e une as mãos atrás); 2 silvos curtos comandam "À Vontade".'
  },
  {
    id: 'apito_cobrir',
    title: 'Cobrir! e Firme! (Alinhamento no Apito)',
    notation: '——————  ——————  • (2 Longos e 1 Curto)',
    pattern: ['LONG', 'PAUSE', 'LONG', 'PAUSE', 'SHORT'],
    whenToUse: 'Com o Clube em coluna na posição de Sentido para verificar distância e cobertura.',
    unitAction: 'Estendem o braço esquerdo tocando o ombro do colega da frente ("Cobrir!"); a um novo silvo curto (•), baixam o braço ("Firme!").'
  },
  {
    id: 'apito_marche',
    title: 'Ordinário, Marche! (Iniciar Marcha)',
    notation: '——————   •! (1 Longo + Pausa + 1 Curto Seco)',
    pattern: ['LONG', 'PAUSE', 'SHORT'],
    whenToUse: 'Para iniciar o deslocamento da unidade apenas no apito.',
    unitAction: 'O silvo longo prepara ("Ordinário...") e o silvo curto seco comanda a saída ("Marche!") com o pé esquerdo.'
  },
  {
    id: 'apito_cadencia',
    title: 'Cadência de Marcha no Apito (1, 2... 1, 2, 3!)',
    notation: '•     •     •  •  • (Esquerdo, Esquerdo, Esq-Dir-Esq)',
    pattern: ['SHORT', 'PAUSE', 'SHORT', 'PAUSE', 'SHORT', 'SHORT', 'SHORT'],
    whenToUse: 'Durante desfiles cívicos e evoluções para manter todas as unidades no mesmo pé.',
    unitAction: 'Os silvos marcam a batida do PÉ ESQUERDO no solo na cadência oficial de 116 passos/min.'
  },
  {
    id: 'apito_alto',
    title: 'Unidade, Alto! (Parar Marcha)',
    notation: '•   •! (1 Curto no Pé Esquerdo + 1 Curto no Pé Direito)',
    pattern: ['SHORT', 'PAUSE', 'SHORT'],
    whenToUse: 'Para parar o pelotão em marcha usando apenas o apito.',
    unitAction: 'Após o 2º silvo curto, a unidade conta 1-2 e une o pé esquerdo ao direito na posição de Sentido.'
  },
  {
    id: 'apito_acelerado',
    title: 'Passo Acelerado (4 Silvos Curtos)',
    notation: '• • • • (4 Silvos Curtos Rápidos)',
    pattern: ['SHORT', 'SHORT', 'SHORT', 'SHORT'],
    whenToUse: 'Em marcha (para iniciar trote cadenciado) ou chamada rápida.',
    unitAction: 'A unidade passa imediatamente para o passo acelerado em cadência.'
  },
  {
    id: 'apito_reunir',
    title: 'Reunir Unidades / Entrar em Forma',
    notation: '——————  • • • (1 Longo e 3 Curtos)',
    pattern: ['LONG', 'PAUSE', 'SHORT', 'SHORT', 'SHORT'],
    whenToUse: 'Chamada geral para formatura, abertura ou hasteamento das bandeiras.',
    unitAction: 'Os desbravadores dirigem-se rapidamente para entrar em forma por unidades diante do instrutor.'
  }
];

interface LeaderGestureItem {
  id: string;
  name: string;
  formationType: string;
  armPosition: string;
  unitResponse: string;
  svgType: 'COLUNAS' | 'LINHA' | 'FERRADURA_U' | 'CIRCULO' | 'ALTO_ATENCAO' | 'ACELERADO';
}

const LEADER_GESTURES: LeaderGestureItem[] = [
  {
    id: 'gesto_colunas',
    name: 'Formação por Colunas (Unidades Paralelas)',
    formationType: 'Formação Padrão de Abertura',
    armPosition: 'Ambos os braços estendidos horizontalmente para a FRENTE (paralelos na largura dos ombros), palmas voltadas uma para a outra.',
    unitResponse: 'Os capitães posicionam-se à frente do líder (a 3 passos) um ao lado do outro, e cada unidade forma em fila indiana atrás do seu capitão.',
    svgType: 'COLUNAS'
  },
  {
    id: 'gesto_linha',
    name: 'Formação em Linha (Fileira Frontal)',
    formationType: 'Inspeção e Revista',
    armPosition: 'Ambos os braços abertos horizontalmente para os LADOS (formando 180° na linha dos ombros), palmas voltadas para a frente.',
    unitResponse: 'As unidades alinham-se lado a lado em fileira horizontal de frente para o instrutor.',
    svgType: 'LINHA'
  },
  {
    id: 'gesto_ferradura',
    name: 'Formação em "U" (Ferradura / Quadrado Aberto)',
    formationType: 'Cerimônias, Investiduras eAvisos',
    armPosition: 'Braços abertos para os lados com os cotovelos dobrados a 90° apontando os antebraços para CIMA (desenhando a letra "U").',
    unitResponse: 'As unidades formam três lados de um retângulo/U ao redor do instrutor, deixando a frente aberta para o mastro.',
    svgType: 'FERRADURA_U'
  },
  {
    id: 'gesto_circulo',
    name: 'Formação em Círculo (Roda da Unidade/Clube)',
    formationType: 'Recreio, Oração e Fogo do Conselho',
    armPosition: 'Braço direito erguido fazendo um movimento circular amplo acima da cabeça (ou braços arqueados em círculo à frente).',
    unitResponse: 'Todos dão as mãos ou fecham um círculo completo ao redor do líder.',
    svgType: 'CIRCULO'
  },
  {
    id: 'gesto_atencao',
    name: 'Atenção / Silêncio / Alto Visual',
    formationType: 'Controle Silencioso de Tropa',
    armPosition: 'Braço direito estendido verticalmente para o ALTO com a mão aberta (ou em Saudação Maranata).',
    unitResponse: 'Toda a tropa interrompe a marcha ou conversa imediatamente e assume a posição de Sentido olhando para o líder.',
    svgType: 'ALTO_ATENCAO'
  },
  {
    id: 'gesto_acelerado',
    name: 'Passo Acelerado / Vem Correndo',
    formationType: 'Deslocamento Rápido',
    armPosition: 'Punho direito fechado subindo e descendo repetidamente da linha do ombro para o alto (como bombeando uma alavanca).',
    unitResponse: 'A unidade passa imediatamente para o passo acelerado (trote cadenciado).',
    svgType: 'ACELERADO'
  }
];

interface DrillEvolutionItem {
  id: string;
  title: string;
  difficulty: 'BÁSICA' | 'INTERMEDIÁRIA' | 'AVANÇADA (CAMPORI)';
  idealSize: string;
  visualEffect: string;
  commandSequence: string[];
  judgeTip: string;
  svgDiagram: 'CRUZAMENTO' | 'MOINHO' | 'DOMINO' | 'TRIANGULO_DBV' | 'ESPELHO' | 'FANTASMA' | 'TUNEL_BANDERINS' | 'ESTRELA_4PONTAS';
}

const DRILL_EVOLUTIONS: DrillEvolutionItem[] = [
  {
    id: 'evol_cruzamento',
    title: '1. Cruzamento Real em Xadrez (Pente Duplo)',
    difficulty: 'INTERMEDIÁRIA',
    idealSize: '16 a 32 Desbravadores (2 Pelotões ou 4 Colunas)',
    visualEffect: 'Duas metades do pelotão marcham uma em direção à outra (frente a frente ou a 90°) e atravessam-se intercalando as fileiras sem tocar nos colegas!',
    commandSequence: [
      'Divida o clube em Pelotão Alfa (colunas ímpares) e Pelotão Bravo (colunas pares) com meio passo de distância extra entre as fileiras.',
      'Comande "Pelotão Bravo, Meia-Volta, VOLVER!" na extremidade da quadra e depois "Ordinário, MARCHE!" para ambos irem de encontro no centro.',
      'Ao se cruzarem no centro da quadra, cada fileira passa exatamente no vão entre duas fileiras do outro pelotão mantendo os 116 passos/min.',
      'Após atravessarem, comande "Meia-Volta em Marcha, VOLVER!" simultaneamente para recompor o bloco original.'
    ],
    judgeTip: 'Segredo de Ouro: Os desbravadores devem manter o olhar fixo à frente (nunca olhar para o chão) e manter distância exata de 1 braço e meio entre fileiras.',
    svgDiagram: 'CRUZAMENTO'
  },
  {
    id: 'evol_moinho',
    title: '2. Moinho de Vento (Hélice de 4 Unidades)',
    difficulty: 'AVANÇADA (CAMPORI)',
    idealSize: '16, 20 ou 24 Desbravadores (4 Fileiras de 4 a 6 DBVs)',
    visualEffect: 'As 4 fileiras giram ao redor de um ponto central formando as 4 pás de uma hélice em movimento contínuo de 360°.',
    commandSequence: [
      'A partir de 4 colunas paralelas, abra as extremidades para formar uma cruz (+) com 4 raios partindo do centro.',
      'Ao comando "Moinho em Conversão, MARCHE!", os 4 desbravadores do centro marcam passo girando lentamente no eixo.',
      'Os desbravadores do meio dão passos médios e os das pontas externas dão passos largos, mantendo cada pá da hélice perfeitamente alinhada como uma régua!',
      'Após 1 volta completa (360°), comande "Unidade, ALTO!" e "Para o Voto, POSIÇÃO!" (Saudação Maranata).'
    ],
    judgeTip: 'Quem comanda o alinhamento da pá do moinho é a PONTA EXTERNA; todos olham discretamente pelo canto do olho para manter a linha reta.',
    svgDiagram: 'MOINHO'
  },
  {
    id: 'evol_domino',
    title: '3. Efeito Dominó (Onda Sincronizada + Maranata)',
    difficulty: 'BÁSICA',
    idealSize: 'Qualquer tamanho (8 a 40 Desbravadores)',
    visualEffect: 'Um único comando gera uma onda visual contínua de fileira em fileira (ou coluna em coluna) com batida sonora sequencial.',
    commandSequence: [
      'Combine previamente com o pelotão: "Atenção para Sequência em Onda, Executar!".',
      'Tempo 1: A 1ª Fileira executa "Direita, Volver!". Tempo 2: A 2ª Fileira executa. Tempo 3: A 3ª Fileira. Tempo 4: A 4ª Fileira.',
      'Em seguida, da última fileira para a primeira (onda reversa), retornam à frente com "Esquerda, Volver!".',
      'Finalização: Da esquerda para a direita, cada coluna ergue a Saudação Maranata em cascata gritando uma sílaba: "MA - RA - NA - TA!".'
    ],
    judgeTip: 'Fácil de ensaiar em apenas 15 minutos e arranca aplausos imediatos em qualquer abertura de Dia dos Desbravadores ou avaliação.',
    svgDiagram: 'DOMINO'
  },
  {
    id: 'evol_triangulo',
    title: '4. Formação do Triângulo Oficial DBV',
    difficulty: 'INTERMEDIÁRIA',
    idealSize: '15, 18 ou 21 Desbravadores',
    visualEffect: 'O pelotão sai do formato quadrado tradicional e desenha no chão o Triângulo Equilátero do Emblema dos Desbravadores voltado para o júri/público.',
    commandSequence: [
      'Posicione o capitão ou porta-bandeira no vértice frontal (ponta do triângulo voltada para o público).',
      'Ao comando "Formação Emblema, MARCHE!", as duas colunas externas abrem em "Oitavo à Direita/Esquerda" formando as duas laterais diagonais do triângulo.',
      'A fileira de fundo fecha a base superior horizontal do triângulo.',
      'No centro do triângulo, 3 desbravadores com os bastões ou bandeiras erguem o escudo/bandeira do Clube ao comando "Para o Voto, POSIÇÃO!".'
    ],
    judgeTip: 'Excelente para o momento final da apresentação diante da comissão julgadora do Campori.',
    svgDiagram: 'TRIANGULO_DBV'
  },
  {
    id: 'evol_espelho',
    title: '5. Pelotão Espelhado (Comando Simétrico)',
    difficulty: 'INTERMEDIÁRIA',
    idealSize: '12 a 24 Desbravadores (Número par de colunas: 2 ou 4)',
    visualEffect: 'Ao receber um comando simétrico, a metade esquerda e a metade direita executam movimentos espelhados (abrindo para fora ou fechando para o centro).',
    commandSequence: [
      'Com o pelotão em 4 colunas (2 à esquerda e 2 à direita), o instrutor comanda: "Simétrico Exterior, Direita e Esquerda, VOLVER!".',
      'As 2 colunas da direita viram para a direita e as 2 colunas da esquerda viram para a esquerda (abrindo o peito do pelotão).',
      'Comande "3 Passos em Frente, MARCHE!" (abrindo um corredor central amplo para a passagem das bandeiras).',
      'Depois comande "Simétrico Interior, Meia-Volta, VOLVER!" e "3 Passos em Frente, MARCHE!" para fechar o bloco perfeitamente no centro.'
    ],
    judgeTip: 'Demonstra altíssimo domínio técnico de lateralidade e concentração da equipe.',
    svgDiagram: 'ESPELHO'
  },
  {
    id: 'evol_fantasma',
    title: '6. Evolução Silenciosa (16 Tempos Sem Voz de Comando)',
    difficulty: 'AVANÇADA (CAMPORI)',
    idealSize: '12 a 24 Desbravadores',
    visualEffect: 'O instrutor cruza os braços e permanece em silêncio absoluto enquanto a unidade executa uma sequência inteira apenas na contagem mental e batida dos pés!',
    commandSequence: [
      'O instrutor dá um único comando inicial: "Sequência Silenciosa de 16 Tempos, MARCHE!".',
      'Tempos 1 a 4: 4 passos em frente (no 4º passo fazem Alto automático).',
      'Tempos 5 a 8: Direita Volver (5-6) + Meia-Volta Volver (7-8).',
      'Tempos 9 a 12: Esquerda Volver retornando à frente (9-10) + Marcar Passo 2 batidas fortes (11-12).',
      'Tempos 13 a 16: Para o Voto, Posição / Maranata (13-14) + Descansar, Posição (15-16) em sincronia milimétrica!'
    ],
    judgeTip: 'Nos regulamentos de Ordem Unida Criativa da DSA, a execução sem comando de voz tem pontuação extra de sincronismo.',
    svgDiagram: 'FANTASMA'
  },
  {
    id: 'evol_tunel',
    title: '7. Túnel de Honra com Banderins (Passagem da Bandeira)',
    difficulty: 'BÁSICA',
    idealSize: '12 a 32 Desbravadores (2 ou 4 Colunas)',
    visualEffect: 'As colunas internas (ou externas) voltam-se frente a frente e inclinam os mastros dos banderins a 45° formando um arco de honra pelo qual passam as bandeiras oficiais.',
    commandSequence: [
      'Com o clube em 2 colunas paralelas com intervalo ampliado (3 passos), comande: "Frente para o Centro, Direita e Esquerda, VOLVER!".',
      'Ao comando "Arco de Honra, Para o Voto, POSIÇÃO!", os capitães/desbravadores inclinam os banderins a 45° à frente cruzando as pontas no alto.',
      'Os demais desbravadores executam a Saudação Maranata enquanto o Porta-Bandeira atravessa o corredor em passo firme.',
      'Após a passagem, comande "Descansar, POSIÇÃO!" e "Frente para a Vanguarda, Direita e Esquerda, VOLVER!".'
    ],
    judgeTip: 'Perfeito para cerimônias de entrada da Bandeira Nacional e Bandeira dos Desbravadores em investiduras.',
    svgDiagram: 'TUNEL_BANDERINS'
  },
  {
    id: 'evol_estrela',
    title: '8. Expansão Radiante em Cruz / Estrela do Clube',
    difficulty: 'AVANÇADA (CAMPORI)',
    idealSize: '16 a 32 Desbravadores (4 Unidades)',
    visualEffect: 'O pelotão compacto no centro da quadra abre simultaneamente para os 4 pontos cardeais (Norte, Sul, Leste e Oeste) e retorna de costas/meia-volta fechando o bloco.',
    commandSequence: [
      'Com as 4 unidades agrupadas no centro, comande: "Quatro Direções, Preparar!". Cada unidade faz volver para um lado da quadra (Frente, Direita, Esquerda e Retaguarda).',
      'Ao comando "Expansão em 5 Passos, MARCHE!", as 4 unidades avançam simultaneamente 5 passos abrindo uma estrela simétrica.',
      'No 6º tempo (fechamento do 5º passo), todas executam "Meia-Volta, VOLVER!" sincronizadas no apito.',
      'Ao comando "Reagrupar em 5 Passos, MARCHE!", retornam ao centro exato e finalizam com "Para o Voto, POSIÇÃO!".'
    ],
    judgeTip: 'A simetria do número de passos (5 na ida e 5 na volta) garante que o pelotão volte exatamente ao mesmo alinhamento inicial.',
    svgDiagram: 'ESTRELA_4PONTAS'
  }
];

const FieldManualTools: React.FC<FieldManualToolsProps> = ({ club, initialTab = 'NOS_AMARRAS', standaloneDrill = false }) => {
  const isPathfinder = club === ClubType.PATHFINDER;
  const storageKeyMastered = `dbv_mastered_knots_${isPathfinder ? 'DBV' : 'AVT'}`;

  const [activeTab, setActiveTab] = useState<ManualTab>(standaloneDrill ? 'ORDEM_UNIDA' : initialTab);

  useEffect(() => {
    if (standaloneDrill) {
      setActiveTab('ORDEM_UNIDA');
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, standaloneDrill]);

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
  const [selectedDrillCmdModal, setSelectedDrillCmdModal] = useState<DrillCommandItem | null>(null);
  const [librasExpressionCat, setLibrasExpressionCat] = useState<'TODAS' | 'CUMPRIMENTOS' | 'CLUBE' | 'ACAMPAMENTO' | 'DIALOGO'>('TODAS');
  const rootContainerRef = useRef<HTMLDivElement | null>(null);
  const trainerCommandsScrollRef = useRef<HTMLDivElement | null>(null);

  // Suporte automático a rolagem horizontal pelo mouse (roda do mouse + arrastar com o botão esquerdo no PC) em todos os menus horizontais
  useEffect(() => {
    const root = rootContainerRef.current;
    if (!root) return;

    const handleWheel = (e: WheelEvent) => {
      const target = (e.target as HTMLElement | null)?.closest('.overflow-x-auto') as HTMLElement | null;
      if (!target) return;
      if (target.scrollWidth > target.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        target.scrollLeft += e.deltaY;
      }
    };

    let isDown = false;
    let startX = 0;
    let scrollLeftStart = 0;
    let activeScroller: HTMLElement | null = null;
    let moved = false;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = (e.target as HTMLElement | null)?.closest('.overflow-x-auto') as HTMLElement | null;
      if (!target || target.scrollWidth <= target.clientWidth) return;
      isDown = true;
      moved = false;
      activeScroller = target;
      startX = e.pageX - target.offsetLeft;
      scrollLeftStart = target.scrollLeft;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown || !activeScroller) return;
      const x = e.pageX - activeScroller.offsetLeft;
      const walk = x - startX;
      if (Math.abs(walk) > 5) {
        moved = true;
        activeScroller.scrollLeft = scrollLeftStart - walk * 1.4;
      }
    };

    const handleMouseUp = () => {
      isDown = false;
      activeScroller = null;
    };

    const handleClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    };

    root.addEventListener('wheel', handleWheel, { passive: false });
    root.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    root.addEventListener('click', handleClickCapture, true);

    return () => {
      root.removeEventListener('wheel', handleWheel);
      root.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      root.removeEventListener('click', handleClickCapture, true);
    };
  }, []);
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

  const normalizedLibrasChars = useMemo(() => {
    return inputText
      .toUpperCase()
      .replace(/Ç/g, '__CEDILHA__')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/__CEDILHA__/g, 'Ç')
      .split('')
      .filter((ch) => /[A-ZÇ0-9]/.test(ch));
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

  // ============================================================================
  // 4. ESTADOS DE ORDEM UNIDA E VOZES DE COMANDO (MANUAL DSA)
  // ============================================================================
  const [drillSubTab, setDrillSubTab] = useState<DrillSubTab>('VOZES_ESTRUTURA');
  const [drillCommandCat, setDrillCommandCat] = useState<DrillCommandCategory>('TODOS');
  const [drillSearch, setDrillSearch] = useState<string>('');
  const [playingWhistleId, setPlayingWhistleId] = useState<string | null>(null);
  const [isCadencePlaying, setIsCadencePlaying] = useState<boolean>(false);
  const [cadenceBpm, setCadenceBpm] = useState<116 | 180>(116);
  const [cadenceStepBeat, setCadenceStepBeat] = useState<'ESQUERDO' | 'DIREITO' | null>(null);
  const [selectedTrainerCmdId, setSelectedTrainerCmdId] = useState<string>(DRILL_COMMANDS[0].id);
  const [voiceTrainerStage, setVoiceTrainerStage] = useState<null | 'ADVERTENCIA' | 'COMANDO' | 'PAUSA' | 'EXECUCAO'>(null);
  const [evolutionDiffFilter, setEvolutionDiffFilter] = useState<'TODAS' | 'BÁSICA' | 'INTERMEDIÁRIA' | 'AVANÇADA (CAMPORI)'>('TODAS');

  const selectedTrainerCommand = useMemo(() => {
    return DRILL_COMMANDS.find((c) => c.id === selectedTrainerCmdId) || DRILL_COMMANDS[0];
  }, [selectedTrainerCmdId]);

  const filteredEvolutions = useMemo(() => {
    if (evolutionDiffFilter === 'TODAS') return DRILL_EVOLUTIONS;
    return DRILL_EVOLUTIONS.filter((e) => e.difficulty === evolutionDiffFilter);
  }, [evolutionDiffFilter]);

  const handleSimulateVoiceCommand = async () => {
    if (voiceTrainerStage !== null) {
      stopAllSignalPlayback();
      setVoiceTrainerStage(null);
      return;
    }
    stopAllSignalPlayback();
    setIsCadencePlaying(false);
    setCadenceStepBeat(null);
    setPlayingWhistleId(null);
    await sleep(40);
    cancelPlaybackRef.current = false;

    // 1ª Etapa: Voz de Advertência
    setVoiceTrainerStage('ADVERTENCIA');
    await playSingleTone(180, true, false);
    await sleep(950);
    if (cancelPlaybackRef.current) {
      setVoiceTrainerStage(null);
      return;
    }

    // 2ª Etapa: Comando Propriamente Dito (Prolongado)
    setVoiceTrainerStage('COMANDO');
    await playSingleTone(420, true, false);
    await sleep(750);
    if (cancelPlaybackRef.current) {
      setVoiceTrainerStage(null);
      return;
    }

    // Pausa Regulamentar (2 Tempos)
    setVoiceTrainerStage('PAUSA');
    await sleep(800);
    if (cancelPlaybackRef.current) {
      setVoiceTrainerStage(null);
      return;
    }

    // 3ª Etapa: Voz de Execução (Curta, Seca e Enérgica!)
    setVoiceTrainerStage('EXECUCAO');
    await playSingleTone(130, true, false);
    await sleep(1100);
    setVoiceTrainerStage(null);
  };

  const filteredDrillCommands = useMemo(() => {
    return DRILL_COMMANDS.filter((cmd) => {
      const matchesCat = drillCommandCat === 'TODOS' || cmd.category === drillCommandCat;
      if (!matchesCat) return false;
      if (!drillSearch.trim()) return true;
      const q = drillSearch.toLowerCase();
      return (
        cmd.name.toLowerCase().includes(q) ||
        cmd.execucao.toLowerCase().includes(q) ||
        cmd.comandoProprio.toLowerCase().includes(q) ||
        cmd.steps.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [drillCommandCat, drillSearch]);

  const handlePlayWhistleCommand = async (item: WhistleCommandItem) => {
    if (playingWhistleId === item.id) {
      stopAllSignalPlayback();
      setPlayingWhistleId(null);
      return;
    }
    stopAllSignalPlayback();
    setIsCadencePlaying(false);
    setCadenceStepBeat(null);
    await sleep(40);
    cancelPlaybackRef.current = false;
    setPlayingWhistleId(item.id);

    for (let i = 0; i < item.pattern.length; i++) {
      if (cancelPlaybackRef.current) break;
      const p = item.pattern[i];
      if (p === 'PAUSE') {
        await sleep(320);
      } else if (p === 'SHORT') {
        await playSingleTone(140, true, false);
        await sleep(130);
      } else if (p === 'LONG') {
        await playSingleTone(520, true, false);
        await sleep(180);
      }
    }
    setPlayingWhistleId(null);
  };

  const handleToggleCadenceMetronome = async (bpmOverride?: 116 | 180) => {
    const targetBpm = bpmOverride || cadenceBpm;
    if (isCadencePlaying && !bpmOverride) {
      stopAllSignalPlayback();
      setIsCadencePlaying(false);
      setCadenceStepBeat(null);
      return;
    }
    stopAllSignalPlayback();
    setPlayingWhistleId(null);
    setVoiceTrainerStage(null);
    await sleep(40);
    cancelPlaybackRef.current = false;
    setIsCadencePlaying(true);

    // Cadência oficial DSA: 116 passos/min (Ordinário) ou 180 passos/min (Acelerado)
    const stepIntervalMs = Math.round(60000 / targetBpm);
    for (let step = 0; step < 32; step++) {
      if (cancelPlaybackRef.current) break;
      const isLeft = step % 2 === 0;
      setCadenceStepBeat(isLeft ? 'ESQUERDO' : 'DIREITO');

      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }
        if (audioCtxRef.current.state === 'suspended') {
          await audioCtxRef.current.resume();
        }
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.type = 'triangle';
        // Tom mais grave/forte para o Pé Esquerdo (1) e mais agudo/curto para o Pé Direito (2)
        osc.frequency.value = isLeft ? 520 : 380;
        gain.gain.setValueAtTime(isLeft ? 0.28 : 0.16, audioCtxRef.current.currentTime);
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.start();
        setTimeout(() => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        }, 85);
      } catch {}

      await sleep(stepIntervalMs);
    }

    setIsCadencePlaying(false);
    setCadenceStepBeat(null);
  };

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
  // Renderiza ilustração técnica da posição do Desbravador + diagrama superior dos pés para cada comando de Ordem Unida
  const renderDrillPositionIllustration = (cmdId: string, size: 'SMALL' | 'LARGE' = 'SMALL') => {
    const isLarge = size === 'LARGE';
    return (
      <svg
        viewBox="0 0 240 120"
        className={isLarge ? 'w-full max-w-[360px] h-40 mx-auto' : 'w-full h-28 mx-auto'}
      >
        {/* Fundo dividido: Esquerda = Postura Corporal | Direita = Diagrama de Pés / Movimento */}
        <rect x="2" y="2" width="114" height="116" rx="12" className="fill-slate-100/90 dark:fill-slate-900/90 stroke-slate-200 dark:stroke-slate-700" strokeWidth="1.2" />
        <rect x="122" y="2" width="116" height="116" rx="12" className="fill-indigo-50/70 dark:fill-indigo-950/40 stroke-indigo-200/80 dark:stroke-indigo-800/60" strokeWidth="1.2" />

        <text x="59" y="14" textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[7px] font-black uppercase">
          Postura Corporal
        </text>
        <text x="180" y="14" textAnchor="middle" className="fill-indigo-600 dark:fill-indigo-300 text-[7px] font-black uppercase">
          Diagrama de Pés (DSA)
        </text>

        {/* Linhas de eixo no diagrama de pés */}
        <line x1="180" y1="22" x2="180" y2="106" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" className="text-indigo-300 dark:text-indigo-800" />
        <line x1="134" y1="68" x2="226" y2="68" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" className="text-indigo-300 dark:text-indigo-800" />

        {/* === DESBRAVADOR UNIFORMIZADO (ESQUERDA: x=59) === */}
        {/* Boina/Boné e Cabeça */}
        <g transform={cmdId === 'ou_olhar_direita' ? 'translate(3,0)' : ''}>
          <path d="M48 24 Q59 18 70 24 Z" fill="#1e293b" />
          <circle cx="59" cy="30" r="7.5" fill="#f5d0a9" stroke="#475569" strokeWidth="1.2" />
          {cmdId === 'ou_olhar_direita' ? (
            <>
              <circle cx="56" cy="29.5" r="1.1" fill="#0f172a" />
              <circle cx="61" cy="29.5" r="1.1" fill="#0f172a" />
              <path d="M45 29 L36 29" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
              <polygon points="36,29 40,26.5 40,31.5" fill="#f59e0b" />
            </>
          ) : (
            <>
              <circle cx="56.5" cy="29.5" r="1" fill="#0f172a" />
              <circle cx="61.5" cy="29.5" r="1" fill="#0f172a" />
            </>
          )}
        </g>

        {/* Tronco (Camisa Caqui + Lenço Amarelo Oficial) */}
        <rect x="48" y="39" width="22" height="28" rx="4" fill="#d6c5a3" stroke="#78716c" strokeWidth="1.2" />
        {/* Lenço Amarelo DBV */}
        <polygon points="50,39 68,39 59,53" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
        <circle cx="59" cy="48" r="2" fill="#dc2626" />
        {/* Cinto */}
        <rect x="48" y="64" width="22" height="3.5" fill="#1e293b" />
        <rect x="57" y="63.5" width="4" height="4.5" rx="0.8" fill="#fbbf24" />

        {/* BRAÇOS CONFORME A POSIÇÃO */}
        {cmdId === 'ou_maranata' ? (
          <>
            {/* Braço direito do DBV (esquerda da tela) erguido a 45° na Saudação Maranata */}
            <line x1="48" y1="42" x2="38" y2="52" stroke="#d6c5a3" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="38" y1="52" x2="36" y2="33" stroke="#f5d0a9" strokeWidth="4" strokeLinecap="round" />
            {/* 4 dedos unidos */}
            <rect x="33.5" y="26" width="5" height="7" rx="1.5" fill="#f5d0a9" stroke="#475569" strokeWidth="0.9" />
            <text x="24" y="32" className="fill-amber-600 dark:fill-amber-400 text-[6.5px] font-black">45°</text>
            {/* Braço esquerdo colado à coxa */}
            <line x1="70" y1="42" x2="73" y2="71" stroke="#d6c5a3" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="73" cy="72" r="2.2" fill="#f5d0a9" />
          </>
        ) : cmdId === 'ou_cobrir' ? (
          <>
            {/* Braço direito colado */}
            <line x1="48" y1="42" x2="45" y2="71" stroke="#d6c5a3" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="45" cy="72" r="2.2" fill="#f5d0a9" />
            {/* Braço esquerdo estendido horizontalmente tocando ombro à frente/lado */}
            <line x1="70" y1="42" x2="98" y2="42" stroke="#d6c5a3" strokeWidth="4.5" strokeLinecap="round" />
            <rect x="97" y="40" width="6" height="3.5" rx="1" fill="#f5d0a9" />
            <circle cx="105" cy="42" r="4" className="fill-indigo-500/30 stroke-indigo-500" strokeWidth="1" strokeDasharray="2 1" />
          </>
        ) : cmdId === 'ou_descansar' || cmdId === 'ou_avontade' ? (
          <>
            {/* Braços flexionados indo para trás das costas */}
            <path d="M48 42 L41 56 L54 64" fill="none" stroke="#d6c5a3" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M70 42 L77 56 L64 64" fill="none" stroke="#d6c5a3" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Mãos unidas atrás nas costas */}
            <circle cx="59" cy="64" r="3.2" fill="#f5d0a9" stroke="#ef4444" strokeWidth="1" />
          </>
        ) : cmdId === 'ou_acelerado_marche' ? (
          <>
            {/* Antebraços a 90° na altura do peito com punhos fechados */}
            <path d="M48 42 L42 56 L52 52" fill="none" stroke="#d6c5a3" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M70 42 L76 56 L66 52" fill="none" stroke="#d6c5a3" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="52" cy="52" r="2.6" fill="#f5d0a9" stroke="#475569" strokeWidth="0.9" />
            <circle cx="66" cy="52" r="2.6" fill="#f5d0a9" stroke="#475569" strokeWidth="0.9" />
          </>
        ) : cmdId === 'ou_ordinario_marche' || cmdId === 'ou_em_frente' || cmdId === 'ou_foradeforma' || cmdId === 'ou_passos_frente' ? (
          <>
            {/* Oscilação de marcha: braço direito à frente (até altura do cinto) e esquerdo atrás */}
            <line x1="48" y1="42" x2="36" y2="60" stroke="#d6c5a3" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="35" cy="61" r="2.3" fill="#f5d0a9" />
            <line x1="70" y1="42" x2="80" y2="64" stroke="#d6c5a3" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="81" cy="65" r="2.3" fill="#f5d0a9" />
          </>
        ) : (
          <>
            {/* Braços colados às coxas (Sentido / Giros / Alto) */}
            <line x1="48" y1="42" x2="45" y2="71" stroke="#d6c5a3" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="45" cy="72" r="2.2" fill="#f5d0a9" />
            <line x1="70" y1="42" x2="73" y2="71" stroke="#d6c5a3" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="73" cy="72" r="2.2" fill="#f5d0a9" />
          </>
        )}

        {/* PERNAS E PÉS DO BONECO */}
        {cmdId === 'ou_descansar' || cmdId === 'ou_avontade' ? (
          <>
            {/* Pernas afastadas (~30 cm) */}
            <line x1="53" y1="68" x2="47" y2="96" stroke="#1e3a8a" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="65" y1="68" x2="72" y2="96" stroke="#1e3a8a" strokeWidth="5.5" strokeLinecap="round" />
            <ellipse cx="45" cy="98" rx="5.5" ry="2.8" fill="#0f172a" />
            <ellipse cx="74" cy="98" rx="5.5" ry="2.8" fill="#0f172a" />
            <line x1="47" y1="105" x2="72" y2="105" stroke="#0284c7" strokeWidth="1.5" />
            <text x="59" y="113" textAnchor="middle" className="fill-sky-600 dark:fill-sky-400 text-[6.5px] font-black">~30 cm</text>
          </>
        ) : cmdId === 'ou_marcar_passo' ? (
          <>
            {/* Perna direita firme e joelho esquerdo elevado marcando passo */}
            <line x1="54" y1="68" x2="54" y2="96" stroke="#1e3a8a" strokeWidth="5.5" strokeLinecap="round" />
            <ellipse cx="52" cy="98" rx="5" ry="2.6" fill="#0f172a" />
            <path d="M64 68 L71 80 L67 91" fill="none" stroke="#1e3a8a" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx="69" cy="92" rx="5" ry="2.6" fill="#0f172a" />
            <path d="M77 92 L77 77" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" />
            <polygon points="77,75 74.5,79 79.5,79" fill="#10b981" />
          </>
        ) : cmdId.includes('marche') || cmdId === 'ou_em_frente' || cmdId === 'ou_sem_cadencia' || cmdId === 'ou_conversao' || cmdId === 'ou_foradeforma' || cmdId === 'ou_passos_frente' ? (
          <>
            {/* Passo em marcha (Pé esquerdo avançando) */}
            <line x1="54" y1="68" x2="48" y2="96" stroke="#1e3a8a" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="64" y1="68" x2="73" y2="94" stroke="#1e3a8a" strokeWidth="5.5" strokeLinecap="round" />
            <ellipse cx="46" cy="98" rx="5" ry="2.6" fill="#0f172a" />
            <ellipse cx="75" cy="95" rx="5.5" ry="2.6" transform="rotate(-18 75 95)" fill="#0f172a" />
          </>
        ) : (
          <>
            {/* Pernas unidas (Calcanhares juntos e pontas a 45°) */}
            <line x1="55" y1="68" x2="56" y2="96" stroke="#1e3a8a" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="63" y1="68" x2="62" y2="96" stroke="#1e3a8a" strokeWidth="5.5" strokeLinecap="round" />
            <ellipse cx="52" cy="98" rx="5.5" ry="2.6" transform="rotate(-22 52 98)" fill="#0f172a" />
            <ellipse cx="66" cy="98" rx="5.5" ry="2.6" transform="rotate(22 66 98)" fill="#0f172a" />
            <text x="59" y="111" textAnchor="middle" className="fill-indigo-600 dark:fill-indigo-400 text-[6.5px] font-black">Calcanhares Unidos (45°)</text>
          </>
        )}

        {/* === DIAGRAMA SUPERIOR DE PÉS (DIREITA: centro x=180, y=68) === */}
        {cmdId === 'ou_sentido' || cmdId === 'ou_maranata' || cmdId === 'ou_cobrir' || cmdId === 'ou_olhar_direita' ? (
          <>
            {/* Pés unidos nos calcanhares formando 45° */}
            <ellipse cx="171" cy="66" rx="6.5" ry="15" transform="rotate(-22.5 171 66)" fill="#4f46e5" opacity="0.9" />
            <ellipse cx="189" cy="66" rx="6.5" ry="15" transform="rotate(22.5 189 66)" fill="#0f172a" opacity="0.85" />
            <text x="167" y="67" textAnchor="middle" fill="#ffffff" className="text-[6.5px] font-black">PE</text>
            <text x="193" y="67" textAnchor="middle" fill="#ffffff" className="text-[6.5px] font-black">PD</text>
            <path d="M172 48 Q180 42 188 48" fill="none" stroke="#f59e0b" strokeWidth="1.8" />
            <text x="180" y="39" textAnchor="middle" className="fill-amber-600 dark:fill-amber-400 text-[8px] font-black">45°</text>
            <text x="180" y="102" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[6.8px] font-black">
              {cmdId === 'ou_maranata' ? 'Antebraço Dir. 45° (4 Dedos)' : cmdId === 'ou_cobrir' ? 'Braço Esq. ao Ombro' : 'Posição Base DSA'}
            </text>
          </>
        ) : cmdId === 'ou_descansar' || cmdId === 'ou_avontade' ? (
          <>
            {/* Pé esquerdo desloca 30cm para a esquerda; pé direito fixo */}
            <ellipse cx="154" cy="66" rx="6.5" ry="15" fill="#4f46e5" />
            <ellipse cx="202" cy="66" rx="6.5" ry="15" fill="#0f172a" />
            <text x="154" y="68" textAnchor="middle" fill="#ffffff" className="text-[6.5px] font-black">PE</text>
            <text x="202" y="68" textAnchor="middle" fill="#ffffff" className="text-[6.5px] font-black">PD</text>
            <line x1="163" y1="66" x2="193" y2="66" stroke="#10b981" strokeWidth="2" />
            <polygon points="159,66 165,63 165,69" fill="#10b981" />
            <text x="178" y="60" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 text-[7px] font-black">~30 cm</text>
            <text x="180" y="102" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[6.8px] font-black">
              {cmdId === 'ou_avontade' ? 'Pé Direito Fixo na Base' : 'Mão Esq. Segura Pulso Dir.'}
            </text>
          </>
        ) : cmdId === 'ou_direita_volver' ? (
          <>
            <ellipse cx="171" cy="68" rx="6" ry="14" transform="rotate(-15 171 68)" fill="#94a3b8" opacity="0.45" />
            <ellipse cx="190" cy="64" rx="6.5" ry="14" transform="rotate(90 190 64)" fill="#0f172a" />
            <ellipse cx="190" cy="78" rx="6.5" ry="14" transform="rotate(90 190 78)" fill="#4f46e5" />
            <circle cx="186" cy="76" r="3" fill="#ef4444" />
            <path d="M168 44 Q195 36 206 56" fill="none" stroke="#f59e0b" strokeWidth="2" />
            <polygon points="207,59 202,54 209,52" fill="#f59e0b" />
            <text x="180" y="34" textAnchor="middle" className="fill-amber-600 dark:fill-amber-400 text-[7.5px] font-black">Giro +90° à Direita</text>
            <text x="180" y="103" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[6.5px] font-black">Calcanhar Dir. + Planta Esq.</text>
          </>
        ) : cmdId === 'ou_esquerda_volver' || cmdId === 'ou_volver_em_marcha' ? (
          <>
            <ellipse cx="189" cy="68" rx="6" ry="14" transform="rotate(15 189 68)" fill="#94a3b8" opacity="0.45" />
            <ellipse cx="170" cy="64" rx="6.5" ry="14" transform="rotate(-90 170 64)" fill="#4f46e5" />
            <ellipse cx="170" cy="78" rx="6.5" ry="14" transform="rotate(-90 170 78)" fill="#0f172a" />
            <circle cx="174" cy="76" r="3" fill="#ef4444" />
            <path d="M192 44 Q165 36 154 56" fill="none" stroke="#f59e0b" strokeWidth="2" />
            <polygon points="153,59 158,54 151,52" fill="#f59e0b" />
            <text x="180" y="34" textAnchor="middle" className="fill-amber-600 dark:fill-amber-400 text-[7.5px] font-black">Giro 90° (2 Tempos)</text>
            <text x="180" y="103" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[6.5px] font-black">Calcanhar Esq. + Planta Dir.</text>
          </>
        ) : cmdId === 'ou_meiavolta_volver' || cmdId === 'ou_meiavolta_marcha' ? (
          <>
            <ellipse cx="171" cy="68" rx="6" ry="14" fill="#4f46e5" />
            <ellipse cx="189" cy="68" rx="6" ry="14" fill="#0f172a" />
            <circle cx="171" cy="78" r="3.2" fill="#ef4444" />
            <path d="M196 48 C165 24, 142 66, 170 90" fill="none" stroke="#ef4444" strokeWidth="2.2" />
            <polygon points="173,91 166,92 169,85" fill="#ef4444" />
            <text x="180" y="32" textAnchor="middle" className="fill-red-600 dark:fill-red-400 text-[7.5px] font-black">180° SEMPRE PELA ESQ.</text>
            <text x="180" y="104" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[6.5px] font-black">Pivô: Calcanhar Esquerdo</text>
          </>
        ) : cmdId === 'ou_oitavo_volver' ? (
          <>
            <ellipse cx="174" cy="66" rx="6" ry="14" transform="rotate(45 174 66)" fill="#4f46e5" />
            <ellipse cx="188" cy="74" rx="6" ry="14" transform="rotate(45 188 74)" fill="#0f172a" />
            <path d="M178 38 Q195 38 202 50" fill="none" stroke="#f59e0b" strokeWidth="2" />
            <text x="180" y="33" textAnchor="middle" className="fill-amber-600 dark:fill-amber-400 text-[7.5px] font-black">Giro Diagonal 45°</text>
            <text x="180" y="103" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[6.5px] font-black">Metade de 1 Quarto (1/8)</text>
          </>
        ) : cmdId === 'ou_conversao' ? (
          <>
            <path d="M148 86 Q148 44 196 44" fill="none" stroke="#4f46e5" strokeWidth="2.2" strokeDasharray="3 2" />
            <path d="M166 86 Q166 60 196 60" fill="none" stroke="#10b981" strokeWidth="2" />
            <circle cx="196" cy="44" r="3" fill="#4f46e5" />
            <circle cx="196" cy="60" r="3" fill="#10b981" />
            <circle cx="184" cy="76" r="3.5" fill="#f59e0b" />
            <text x="180" y="32" textAnchor="middle" className="fill-indigo-600 dark:fill-indigo-400 text-[7px] font-black">Arco 90° em Fileira</text>
            <text x="180" y="103" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[6.5px] font-black">Pivô Curto • Externo Longo</text>
          </>
        ) : (
          <>
            {/* Deslocamento / Rompimento de Marcha (Pé Esquerdo à frente, Pé Direito atrás) */}
            <ellipse cx="168" cy="48" rx="6.5" ry="14" fill="#4f46e5" />
            <ellipse cx="192" cy="78" rx="6.5" ry="14" fill="#0f172a" />
            <text x="168" y="50" textAnchor="middle" fill="#ffffff" className="text-[6.5px] font-black">PE</text>
            <text x="192" y="80" textAnchor="middle" fill="#ffffff" className="text-[6.5px] font-black">PD</text>
            <path d="M168 78 L168 65" stroke="#10b981" strokeWidth="2" />
            <polygon points="168,62 165,67 171,67" fill="#10b981" />
            <text x="180" y="30" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 text-[7px] font-black">
              {cmdId === 'ou_alto' ? 'Voz ALTO no Pé Esq. (1-2)' : cmdId === 'ou_acelerado_marche' ? 'Cadência 180 BPM (PE)' : 'Rompe c/ Pé Esquerdo!'}
            </text>
            <text x="180" y="104" textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[6.5px] font-black">
              {cmdId === 'ou_mudar_passo' ? 'Troca Dupla Rápida' : cmdId === 'ou_passos_frente' ? 'Sempre Nº Ímpar (1, 3, 5)' : 'Passo ~75 cm • 116 BPM'}
            </text>
          </>
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
      <svg viewBox="0 0 84 60" className="w-16 h-12 shrink-0 text-slate-800 dark:text-slate-100">
        {/* 1. Começo do jogo (Círculo cortado por seta horizontal — Imagem 1) */}
        {svgType === 'START_TRAIL' && (
          <g stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="38" cy="30" r="15" />
            <path d="M 8 30 L 74 30 M 62 20 L 74 30 L 62 40" />
          </g>
        )}
        {/* 2. Siga nesta direção (Seta horizontal — Imagem 1) */}
        {svgType === 'FOLLOW_DIRECTION' && (
          <g stroke="currentColor" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 10 30 L 72 30 M 58 18 L 72 30 L 58 42" />
          </g>
        )}
        {/* 3. Volte ao ponto de partida (Seta para a esquerda com 2 barras verticais na cauda — Imagem 1) */}
        {svgType === 'RETURN_START' && (
          <g stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 74 30 L 12 30 M 24 18 L 12 30 L 24 42" />
            <line x1="58" y1="17" x2="58" y2="43" />
            <line x1="67" y1="17" x2="67" y2="43" />
          </g>
        )}
        {/* 4. Diminuir a marcha (Linha horizontal com ponta triangular fechada — Imagem 1) */}
        {svgType === 'SLOW_PACE' && (
          <g stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="30" x2="52" y2="30" />
            <polygon points="52,17 72,30 52,43" />
          </g>
        )}
        {/* 5. Apressar o passo (Seta de haste dupla paralela — Imagem 1) */}
        {svgType === 'FAST_PACE' && (
          <g stroke="currentColor" strokeWidth="3.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="25" x2="64" y2="25" />
            <line x1="10" y1="35" x2="64" y2="35" />
            <path d="M 54 16 L 72 30 L 54 44" strokeWidth="4.2" />
          </g>
        )}
        {/* 6. Caminho a evitar (X grande — Imagem 1) */}
        {svgType === 'CROSS_X' && (
          <path d="M 22 12 L 62 48 M 62 12 L 22 48" stroke="#ef4444" strokeWidth="5.5" fill="none" strokeLinecap="round" />
        )}
        {/* 7. Objeto escondido a 3 passos (Quadrado com 3 e seta lateral — Imagem 1) */}
        {svgType === 'MESSAGE' && (
          <g stroke="currentColor" strokeWidth="3.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="12" y="13" width="34" height="34" rx="2" />
            <text x="29" y="36" textAnchor="middle" stroke="none" fill="currentColor" className="text-[15px] font-black">
              3
            </text>
            <path d="M 46 30 L 74 30 M 64 21 L 74 30 L 64 39" />
          </g>
        )}
        {/* 8. Obstáculo a transpor (Rampa subindo com seta no topo e traço vertical na base — Imagem 1) */}
        {svgType === 'OVER_OBSTACLE' && (
          <g stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 10 42 L 28 42 L 44 20 L 72 20 M 62 12 L 72 20 L 62 28" />
            <line x1="36" y1="32" x2="36" y2="48" />
          </g>
        )}
        {/* 9. Perigo (Triângulo equilátero — Imagem 1) */}
        {svgType === 'TRIANGLE' && (
          <g fill="none" stroke="#f59e0b" strokeWidth="4.5" strokeLinejoin="round">
            <polygon points="42,9 16,49 68,49" />
          </g>
        )}
        {/* 10. Dividir o grupo (Haste horizontal bifurcando em 2 setas — Imagem 1) */}
        {svgType === 'SPLIT_GROUP' && (
          <g stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="30" x2="36" y2="30" />
            <path d="M 36 30 L 68 13 M 57 11 L 68 13 L 64 23" />
            <path d="M 36 30 L 68 47 M 64 37 L 68 47 L 57 49" />
          </g>
        )}
        {/* 11. Virar à direita (Seta dobrando 90° à direita — Imagem 1) */}
        {svgType === 'ARROW_RIGHT' && (
          <path d="M 22 50 L 22 24 L 68 24 M 54 13 L 68 24 L 54 35" stroke="currentColor" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {/* 12. Virar à esquerda (Seta dobrando 90° à esquerda — Imagem 1) */}
        {svgType === 'ARROW_LEFT' && (
          <path d="M 62 50 L 62 24 L 16 24 M 30 13 L 16 24 L 30 35" stroke="currentColor" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {/* 13. Seguir em frente (Seta vertical apontando para cima — Imagem 1) */}
        {svgType === 'ARROW_UP' && (
          <path d="M 42 52 L 42 10 M 29 23 L 42 10 L 55 23" stroke="currentColor" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {/* 14. Reunir o grupo (Círculo central com 4 setas apontando para o centro — Imagem 1) */}
        {svgType === 'REUNION' && (
          <g stroke="currentColor" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="42" cy="30" r="6.5" />
            {/* Cima */}
            <path d="M 42 4 L 42 19 M 37 14 L 42 19 L 47 14" />
            {/* Baixo */}
            <path d="M 42 56 L 42 41 M 37 46 L 42 41 L 47 46" />
            {/* Esquerda */}
            <path d="M 10 30 L 30 30 M 25 25 L 30 30 L 25 35" />
            {/* Direita */}
            <path d="M 74 30 L 54 30 M 59 25 L 54 30 L 59 35" />
          </g>
        )}
        {/* 15. Acampamento nessa direção (Barraca triangular com bandeirola no topo e seta à direita — Imagem 1) */}
        {svgType === 'CAMP' && (
          <g stroke="#10b981" strokeWidth="3.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="32,18 12,48 52,48" />
            <path d="M 32 18 L 32 7 L 42 11 L 32 15" />
            <path d="M 52 40 L 74 40 M 66 33 L 74 40 L 66 47" />
          </g>
        )}
        {/* 16. Siga rapidamente (Arco "D" fechado à esquerda com seta longa à direita — Imagem 1) */}
        {svgType === 'FOLLOW_QUICKLY' && (
          <g stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 28 14 C 10 14, 10 46, 28 46 Z" />
            <path d="M 28 30 L 72 30 M 60 20 L 72 30 L 60 40" />
          </g>
        )}
        {/* 17. Grupo dividido: 2 para um lado e 3 para o outro (Seta bifurcada com 2 e 3 traços — Imagem 1) */}
        {svgType === 'SPLIT_2_AND_3' && (
          <g stroke="currentColor" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="30" x2="28" y2="30" />
            {/* Ramo superior (2 traços) */}
            <path d="M 28 30 L 70 12 M 60 10 L 70 12 L 66 21" />
            <line x1="40" y1="18" x2="45" y2="29" stroke="#f59e0b" />
            <line x1="49" y1="14" x2="54" y2="25" stroke="#f59e0b" />
            {/* Ramo inferior (3 traços) */}
            <path d="M 28 30 L 70 48 M 66 39 L 70 48 L 60 50" />
            <line x1="38" y1="31" x2="43" y2="42" stroke="#10b981" />
            <line x1="46" y1="34" x2="51" y2="45" stroke="#10b981" />
            <line x1="54" y1="38" x2="59" y2="49" stroke="#10b981" />
          </g>
        )}
        {/* 18. Água potável (Duas linhas onduladas paralelas — Imagem 1) */}
        {svgType === 'WATER_GOOD' && (
          <g stroke="#0ea5e9" strokeWidth="4.2" fill="none" strokeLinecap="round">
            <path d="M 14 23 Q 24 14, 34 23 T 54 23 T 72 23" />
            <path d="M 14 37 Q 24 28, 34 37 T 54 37 T 72 37" />
          </g>
        )}
        {/* 19. Água não potável (Duas linhas onduladas cortadas por X — Imagem 1) */}
        {svgType === 'WATER_BAD' && (
          <g fill="none" strokeLinecap="round">
            <path d="M 14 23 Q 24 14, 34 23 T 54 23 T 72 23" stroke="#64748b" strokeWidth="4" />
            <path d="M 14 37 Q 24 28, 34 37 T 54 37 T 72 37" stroke="#64748b" strokeWidth="4" />
            <path d="M 26 11 L 58 49 M 58 11 L 26 49" stroke="#ef4444" strokeWidth="4.8" />
          </g>
        )}
        {/* 20. Fim de Pista / Voltei para Casa (Círculo com ponto central ⊙) */}
        {svgType === 'END_TRAIL' && (
          <g stroke="#10b981" strokeWidth="4.2" fill="none">
            <circle cx="42" cy="30" r="19" />
            <circle cx="42" cy="30" r="5" fill="#10b981" />
          </g>
        )}
        {/* 21. Esperar Aqui por N Minutos */}
        {svgType === 'WAIT_HERE' && (
          <g stroke="#f59e0b" strokeWidth="3.8" fill="none">
            <rect x="14" y="13" width="56" height="34" rx="4" />
            <rect x="20" y="18" width="44" height="24" rx="2" strokeWidth="2.5" />
            <text x="42" y="35" textAnchor="middle" stroke="none" fill="currentColor" className="text-xs font-black">
              10m
            </text>
          </g>
        )}
        {/* 22. Ponte Boa / Passagem Segura */}
        {svgType === 'GOOD_BRIDGE' && (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 14 20 L 70 20 M 14 40 L 70 40" stroke="#10b981" strokeWidth="4.5" />
            <path d="M 24 30 L 60 30 M 52 24 L 60 30 L 52 36" stroke="currentColor" strokeWidth="3.5" />
          </g>
        )}
        {/* 23. Ponte Ruim / Passagem Quebrada */}
        {svgType === 'BAD_BRIDGE' && (
          <g fill="none" strokeLinecap="round">
            <path d="M 12 22 L 35 22 M 49 22 L 72 22 M 12 38 L 35 38 M 49 38 L 72 38" stroke="#64748b" strokeWidth="4.2" />
            <path d="M 33 13 L 51 47 M 51 13 L 33 47" stroke="#ef4444" strokeWidth="4.5" />
          </g>
        )}
        {/* 24. Esconder-se / Abrigar-se */}
        {svgType === 'HIDE_COVER' && (
          <g fill="none" stroke="#10b981" strokeWidth="4.2" strokeLinecap="round">
            <path d="M 16 26 Q 42 6, 68 26" />
            <line x1="29" y1="26" x2="29" y2="48" />
            <line x1="42" y1="22" x2="42" y2="48" />
            <line x1="55" y1="26" x2="55" y2="48" />
          </g>
        )}
        {/* 25. Pedido de Socorro S.O.S. (3 sinais iguais alinhados) */}
        {svgType === 'SOS_SIGNAL' && (
          <g fill="#ef4444">
            <circle cx="20" cy="30" r="7" />
            <circle cx="42" cy="30" r="7" />
            <circle cx="64" cy="30" r="7" />
          </g>
        )}
        {/* 26. Sinal Natural em Capim: Seguir Direção */}
        {svgType === 'GRASS_DIRECTION' && (
          <g fill="none" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="16" y1="50" x2="68" y2="50" stroke="#94a3b8" strokeWidth="2.5" />
            <path d="M 32 50 C 32 34, 36 24, 58 16" />
            <path d="M 40 50 C 40 34, 42 26, 62 20" />
            <path d="M 48 50 C 46 36, 46 28, 60 24" />
            <line x1="34" y1="33" x2="49" y2="36" stroke="#f59e0b" strokeWidth="4" />
          </g>
        )}
        {/* 27. Sinal Natural em Capim: Perigo (3 Tufos Amarrados) */}
        {svgType === 'GRASS_DANGER' && (
          <g fill="none" stroke="#16a34a" strokeWidth="3.2" strokeLinecap="round">
            <line x1="10" y1="50" x2="74" y2="50" stroke="#94a3b8" strokeWidth="2.5" />
            {[22, 42, 62].map((cx) => (
              <g key={cx}>
                <path d={`M ${cx - 5} 50 L ${cx} 16 L ${cx + 5} 50`} />
                <line x1={cx} y1="14" x2={cx} y2="50" />
                <line x1={cx - 5} y1="28" x2={cx + 5} y2="28" stroke="#ef4444" strokeWidth="3.5" />
              </g>
            ))}
          </g>
        )}
        {/* 28. Sinal Natural com Pedras: Seguir Direção */}
        {svgType === 'STONE_DIRECTION' && (
          <g stroke="currentColor" strokeWidth="3" fill="#94a3b8" fillOpacity="0.25">
            <ellipse cx="32" cy="42" rx="16" ry="9" />
            <ellipse cx="32" cy="27" rx="10" ry="6.5" />
            <ellipse cx="62" cy="44" rx="7" ry="5" fill="#f59e0b" fillOpacity="0.5" stroke="#f59e0b" />
          </g>
        )}
        {/* 29. Sinal Natural com Pedras: Perigo (3 Pedras Empilhadas) */}
        {svgType === 'STONE_DANGER' && (
          <g stroke="#ef4444" strokeWidth="3" fill="#ef4444" fillOpacity="0.2">
            <ellipse cx="42" cy="45" rx="17" ry="7" />
            <ellipse cx="42" cy="32" rx="12" ry="6" />
            <ellipse cx="42" cy="20" rx="7.5" ry="4.5" />
          </g>
        )}
      </svg>
    );
  };

  return (
    <div className="animate-slide-in space-y-5 pb-28 max-w-5xl mx-auto">
      {/* Banner Principal: Modo Dedicado à Ordem Unida vs. Modo Guia de Campo */}
      {standaloneDrill ? (
        <div className="bg-gradient-to-br from-blue-950 via-indigo-900 to-slate-900 rounded-[28px] p-4 sm:p-6 text-white shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-white/10 pointer-events-none">
            <Flag className="w-36 h-36 stroke-[1.2]" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                <Flag size={12} />
                <span>Manual Oficial de Ordem Unida • DSA</span>
              </div>
              <h3 className="text-base sm:text-xl font-black uppercase tracking-tight mt-1">
                Guia de Ordem Unida e Vozes de Comando
              </h3>
              <p className="text-xs text-indigo-100/85 font-medium mt-0.5">
                Vozes de Comando • Pé Firme e em Marcha • Apito e Gestos • Evoluções para Apresentações
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2 text-center shrink-0 self-start sm:self-auto">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-200 block">
                Cadência Oficial DSA
              </span>
              <span className="text-xs sm:text-sm font-black text-white">
                116 BPM (Marcha) • 180 BPM
              </span>
            </div>
          </div>

          {/* 4 Botões Superiores dos Pilares de Ordem Unida */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mt-4 pt-4 border-t border-white/15">
            {[
              {
                id: 'VOZES_ESTRUTURA' as DrillSubTab,
                title: 'Vozes de Comando',
                sub: 'Advertência & Execução',
                icon: Volume2
              },
              {
                id: 'COMANDOS_DSA' as DrillSubTab,
                title: 'Pé Firme & Marcha',
                sub: `${DRILL_COMMANDS.length} Comandos DSA`,
                icon: Users
              },
              {
                id: 'APITO_GESTOS' as DrillSubTab,
                title: 'Apito & Gestos',
                sub: 'Áudio e Formações',
                icon: Hand
              },
              {
                id: 'EVOLUCOES' as DrillSubTab,
                title: 'Evoluções',
                sub: `${DRILL_EVOLUTIONS.length} Ideias Coreográficas`,
                icon: Sparkles
              }
            ].map((tabItem) => {
              const TabIcon = tabItem.icon;
              const isAct = drillSubTab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  type="button"
                  onClick={() => {
                    stopAllSignalPlayback();
                    setIsCadencePlaying(false);
                    setCadenceStepBeat(null);
                    setPlayingWhistleId(null);
                    setVoiceTrainerStage(null);
                    setDrillSubTab(tabItem.id);
                  }}
                  className={`py-2.5 px-2 sm:px-3.5 rounded-2xl transition-all active:scale-95 flex items-center gap-2 text-left border ${
                    isAct
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg ring-2 ring-inset ring-white/40'
                      : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
                  }`}
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isAct ? 'bg-slate-950/15 text-slate-950' : 'bg-white/15 text-amber-300'
                    }`}
                  >
                    <TabIcon size={17} strokeWidth={2.5} />
                  </div>
                  <div className="leading-tight min-w-0">
                    <span className="font-black text-[11px] sm:text-xs uppercase tracking-tight block truncate">
                      {tabItem.title}
                    </span>
                    <span
                      className={`text-[9px] sm:text-[10px] font-bold block mt-0.5 truncate ${
                        isAct ? 'text-slate-900/80' : 'text-indigo-100/80'
                      }`}
                    >
                      {tabItem.sub}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
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
              Nós e Amarras • Códigos de Campo • Primeiros Socorros
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

        {/* 3 Botões Superiores do Guia de Campo (sem duplicar Ordem Unida) */}
        <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-2.5 mt-4 pt-4 border-t border-white/15">
          <button
            type="button"
            onClick={() => {
              stopAllSignalPlayback();
              setActiveTab('NOS_AMARRAS');
            }}
            className={`py-2.5 px-2 sm:px-3.5 rounded-2xl transition-all active:scale-95 flex items-center gap-2 text-left border ${
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
              <Compass size={17} strokeWidth={2.5} />
            </div>
            <div className="leading-tight min-w-0">
              <span className="font-black text-[11px] sm:text-xs uppercase tracking-tight block truncate">
                Nós & Amarras
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-bold block mt-0.5 truncate ${
                  activeTab === 'NOS_AMARRAS' ? 'text-slate-900/80' : 'text-indigo-100/80'
                }`}
              >
                22 Nós em 3D
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              stopAllSignalPlayback();
              setActiveTab('CODIGOS');
            }}
            className={`py-2.5 px-2 sm:px-3.5 rounded-2xl transition-all active:scale-95 flex items-center gap-2 text-left border ${
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
              <Radio size={17} strokeWidth={2.5} />
            </div>
            <div className="leading-tight min-w-0">
              <span className="font-black text-[11px] sm:text-xs uppercase tracking-tight block truncate">
                Códigos
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-bold block mt-0.5 truncate ${
                  activeTab === 'CODIGOS' ? 'text-slate-900/80' : 'text-indigo-100/80'
                }`}
              >
                Morse, Libras & Pista
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              stopAllSignalPlayback();
              setActiveTab('PRIMEIROS_SOCORROS');
            }}
            className={`py-2.5 px-2 sm:px-3.5 rounded-2xl transition-all active:scale-95 flex items-center gap-2 text-left border ${
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
              <HeartPulse size={17} strokeWidth={2.5} />
            </div>
            <div className="leading-tight min-w-0">
              <span className="font-black text-[11px] sm:text-xs uppercase tracking-tight block truncate">
                Socorros
              </span>
              <span
                className={`text-[9px] sm:text-[10px] font-bold block mt-0.5 truncate ${
                  activeTab === 'PRIMEIROS_SOCORROS' ? 'text-slate-900/80' : 'text-indigo-100/80'
                }`}
              >
                Guia & Peçonhentos
              </span>
            </div>
          </button>
        </div>
      </div>
      )}

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
                  {normalizedLibrasChars.map((ch, idx) => {
                      const isDigit = /[0-9]/.test(ch);
                      const letterInfo = !isDigit ? LIBRAS_GUIDE[ch] : null;
                      const numInfo = isDigit ? LIBRAS_NUMBERS.find((n) => n.digit === ch) : null;
                      if (!letterInfo && !numInfo) return null;

                      const svgSrc = isDigit ? numInfo!.handSvg : getLibrasCharImg(ch);
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
                            src={expr.handSvg.replace('.svg', '.png')}
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

              {/* Tabela Visual Completa do Alfabeto Manual Brasileiro de Libras (A a Z + Ç) */}
              <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <h5 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Alfabeto Brasileiro de Libras Ilustrado de A a Z + Ç (Toque para Ampliar)
                  </h5>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
                    27 Sinais Oficiais (A–Z e Ç)
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
                          src={getLibrasCharImg(letter)}
                          alt={`Letra ${letter} em Libras`}
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

              {/* Modal de Detalhe da Letra (A-Z + Ç) ou Número (0-9) em Libras (via Portal na Viewport) */}
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
                    const modalImgSrc = isNum ? numData!.handSvg : getLibrasCharImg(selectedLibrasLetterModal);
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

          {/* 2.4 TABELA VISUAL COMPLETA DE SINAIS DE PISTA PARA TRILHAS (29 SINAIS) */}
          {codeSubTab === 'SINAIS_PISTA' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight">
                      Guia Completo de Sinais de Pista para Trilhas ({TRAIL_SIGNS.length} Sinais Oficiais)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Inclui todos os 19 sinais da Tabela Clássica de Sinais de Pista + 10 sinais oficiais de Pioneiria, Pedras e Capim.
                    </p>
                  </div>
                </div>

                {/* Regras Oficiais de Sinais de Pista (MDA / UEB) */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-300">
                      📏 Regras Oficiais de Marcação e Distância na Trilha (MDA / Escotismo)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] font-medium text-amber-950 dark:text-amber-100">
                    <div>• <strong>Posição:</strong> Sempre do lado <strong>DIREITO</strong> da trilha e a no máximo <strong>1 metro</strong> do solo.</div>
                    <div>• <strong>Cruzamentos:</strong> Sempre marcar <strong>"Caminho a evitar (X)"</strong> nas entradas que não devem ser seguidas.</div>
                    <div>• <strong>Terreno Difícil /Rochas:</strong> A cada <strong>2 m</strong> (terreno difícil) ou <strong>5 m</strong> (rochas).</div>
                    <div>• <strong>Matas / Campos:</strong> A cada <strong>20 m</strong> (matas/florestas) ou <strong>30 m</strong> (pastos e campos abertos).</div>
                    <div>• <strong>Natureza:</strong> Usar gravetos secos, pedras ou capim sem ferir árvores vivas; evitar folhas soltas se houver vento.</div>
                    <div>• <strong>Cerra-Fila:</strong> O último membro da unidade tem o dever de desmanchar os sinais após a passagem.</div>
                  </div>
                </div>

                {/* Filtro por Categoria de Sinal de Pista */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                  {[
                    { id: 'TODOS' as TrailSignCategory, label: `Todos os Sinais (${TRAIL_SIGNS.length})` },
                    { id: 'DIRECAO' as TrailSignCategory, label: 'Direção & Navegação (9)' },
                    { id: 'PERIGO' as TrailSignCategory, label: 'Perigo & Obstáculos (6)' },
                    { id: 'ACAMPAMENTO' as TrailSignCategory, label: 'Água & Acampamento (4)' },
                    { id: 'MENSAGENS' as TrailSignCategory, label: 'Mensagens & Equipe (6)' },
                    { id: 'NATURAIS' as TrailSignCategory, label: 'Sinais com Capim & Pedras (4)' }
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
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-block text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                            {sign.categoryLabel}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[8.5px] font-black uppercase tracking-wider">
                            {sign.sourceBadge}
                          </span>
                        </div>
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

      {/* ========================================================================
          MÓDULO 4: GUIA DE ORDEM UNIDA E VOZES DE COMANDO (MANUAL DA DSA)
          ======================================================================== */}
      {activeTab === 'ORDEM_UNIDA' && (
        <div className="space-y-4">
          {/* Sub-abas dos 4 Pilares de Ordem Unida (exibidas quando dentro do Guia de Campo geral) */}
          {!standaloneDrill && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'VOZES_ESTRUTURA' as DrillSubTab, label: 'Vozes de Comando', icon: Volume2 },
              { id: 'COMANDOS_DSA' as DrillSubTab, label: 'Pé Firme & Marcha', icon: Users },
              { id: 'APITO_GESTOS' as DrillSubTab, label: 'Apito & Gestos', icon: Hand },
              { id: 'EVOLUCOES' as DrillSubTab, label: 'Ideias de Evoluções', icon: Sparkles }
            ].map((sub) => {
              const SubIcon = sub.icon;
              const isAct = drillSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    stopAllSignalPlayback();
                    setIsCadencePlaying(false);
                    setCadenceStepBeat(null);
                    setPlayingWhistleId(null);
                    setVoiceTrainerStage(null);
                    setDrillSubTab(sub.id);
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
          )}

          {/* 4.1 VOZES DE COMANDO (ADVERTÊNCIA, COMANDO PROPRIAMENTE DITO E EXECUÇÃO) + METRÔNOMO DE CADÊNCIA */}
          {drillSubTab === 'VOZES_ESTRUTURA' && (
            <div className="space-y-4">
              {/* Explicação Didática das 3 Partes da Voz de Comando Oficial DSA */}
              <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
                    Manual de Ordem Unida da Divisão Sul-Americana (DSA)
                  </span>
                  <h4 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight mt-0.5">
                    As 3 Partes da Voz de Comando (Advertência • Comando • Execução)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    A voz de comando deve ser emitida usando o diafragma (voz de peito), audível para toda a unidade e dividida em três etapas claras:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* 1ª Parte */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                        1ª Parte • Alerta
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                        Tom Firme e Claro
                      </span>
                    </div>
                    <h5 className="font-black text-sm text-slate-900 dark:text-white uppercase">
                      Voz de Advertência
                    </h5>
                    <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                      Alerta a unidade ou o clube para o comando que virá a seguir, despertando a atenção imediata da tropa.
                    </p>
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-amber-200/70 dark:border-amber-900/50 text-[11px] font-black text-amber-900 dark:text-amber-200">
                      Exemplos: &ldquo;Clube!&rdquo;, &ldquo;Unidade!&rdquo;, &ldquo;Pelotão!&rdquo;, &ldquo;Atenção Desbravadores!&rdquo;
                    </div>
                  </div>

                  {/* 2ª Parte */}
                  <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/25 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider">
                        2ª Parte • Preparo
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                        Voz Prolongada + Pausa
                      </span>
                    </div>
                    <h5 className="font-black text-sm text-slate-900 dark:text-white uppercase">
                      Comando Propriamente Dito
                    </h5>
                    <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                      Indica exatamente qual movimento será realizado. É pronunciado de forma prolongada, seguido de uma <strong>pausa de 2 tempos</strong> antes da execução.
                    </p>
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-indigo-200/70 dark:border-indigo-900/50 text-[11px] font-black text-indigo-900 dark:text-indigo-200">
                      Exemplos: &ldquo;Direita...&rdquo;, &ldquo;Meia-Volta...&rdquo;, &ldquo;Ordinário...&rdquo;, &ldquo;Apresentar...&rdquo;
                    </div>
                  </div>

                  {/* 3ª Parte */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                        3ª Parte • Ação!
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        Curta, Seca e Enérgica
                      </span>
                    </div>
                    <h5 className="font-black text-sm text-slate-900 dark:text-white uppercase">
                      Voz de Execução
                    </h5>
                    <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                      Determina o instante exato em que o movimento começa! Deve ser curta, seca, enérgica e com inflexão firme na última sílaba.
                    </p>
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-emerald-200/70 dark:border-emerald-900/50 text-[11px] font-black text-emerald-900 dark:text-emerald-200">
                      Exemplos: &ldquo;VOLVER!&rdquo;, &ldquo;MARCHE!&rdquo;, &ldquo;ALTO!&rdquo;, &ldquo;SENTIDO!&rdquo;, &ldquo;ARMA!&rdquo;
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulador Interativo de Cadência de Marcha DSA (116 passos/min) */}
              <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                      Treinador de Ritmo & Cadência Oficial (116 Passos por Minuto)
                    </span>
                    <h4 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight">
                      Metrônomo Sonoro de Marcha (Pé Esquerdo / Pé Direito)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Ouça e visualize a batida oficial de 116 BPM para treinar o momento exato de dar a Voz de Execução:
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setCadenceBpm(116);
                          if (isCadencePlaying) handleToggleCadenceMetronome(116);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                          cadenceBpm === 116
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        Ordinário (116 BPM)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCadenceBpm(180);
                          if (isCadencePlaying) handleToggleCadenceMetronome(180);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                          cadenceBpm === 180
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        Acelerado (180 BPM)
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleCadenceMetronome()}
                      className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center space-x-2 transition-all active:scale-95 ${
                        isCadencePlaying
                          ? 'bg-red-600 text-white shadow-lg'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                      }`}
                    >
                      {isCadencePlaying ? <Square size={14} /> : <Play size={14} fill="currentColor" />}
                      <span>{isCadencePlaying ? 'Parar Cadência' : `Ouvir (${cadenceBpm} BPM)`}</span>
                    </button>
                  </div>
                </div>

                {/* Indicador Visual do Passo Atual (Esquerdo vs Direito) */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      cadenceStepBeat === 'ESQUERDO'
                        ? 'bg-indigo-600 text-white border-indigo-400 scale-[1.02] shadow-lg'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80 block">
                      1º Tempo (Batida Forte)
                    </span>
                    <span className="text-base sm:text-lg font-black uppercase block mt-0.5">
                      🦶 PÉ ESQUERDO! (1)
                    </span>
                    <span className="text-[10.5px] font-semibold opacity-90 block mt-1">
                      Vozes aqui: ALTO! • ESQUERDA, VOLVER! • MEIA-VOLTA, VOLVER! • MUDAR DE PASSO!
                    </span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      cadenceStepBeat === 'DIREITO'
                        ? 'bg-amber-500 text-slate-950 border-amber-300 scale-[1.02] shadow-lg'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80 block">
                      2º Tempo (Sustentação)
                    </span>
                    <span className="text-base sm:text-lg font-black uppercase block mt-0.5">
                      🦶 PÉ DIREITO! (2)
                    </span>
                    <span className="text-[10.5px] font-semibold opacity-90 block mt-1">
                      Vozes aqui: DIREITA, VOLVER (em marcha)! • EM FRENTE! • CONVERSÃO À DIREITA!
                    </span>
                  </div>
                </div>
              </div>

              {/* Simulador Interativo das 3 Etapas da Voz de Comando */}
              <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                      Simulador de Tempo & Entonação para Instrutores e Capitães
                    </span>
                    <h4 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight">
                      Treinador Prático das 3 Etapas da Voz de Comando
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Escolha um comando abaixo e clique em Simular para praticar o tempo exato entre Advertência, Comando, Pausa e Execução:
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateVoiceCommand}
                    className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center space-x-2 transition-all active:scale-95 shrink-0 self-start sm:self-auto ${
                      voiceTrainerStage !== null
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                    }`}
                  >
                    {voiceTrainerStage !== null ? <Square size={14} /> : <Volume2 size={15} />}
                    <span>{voiceTrainerStage !== null ? 'Parar Simulação' : 'Simular Voz (1 • 2 • 3)'}</span>
                  </button>
                </div>

                {/* Seletor rápido de todos os 22 comandos para treinar (com rolagem pelo mouse e botões laterais no PC) */}
                <div className="relative flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (trainerCommandsScrollRef.current) {
                        trainerCommandsScrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
                      }
                    }}
                    className="hidden md:flex w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 cursor-pointer"
                    title="Rolar comandos para a esquerda"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  <div
                    ref={trainerCommandsScrollRef}
                    className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1 cursor-grab active:cursor-grabbing select-none flex-1"
                  >
                    {DRILL_COMMANDS.map((cmd) => (
                      <button
                        key={cmd.id}
                        type="button"
                        onClick={() => {
                          setSelectedTrainerCmdId(cmd.id);
                          setVoiceTrainerStage(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                          selectedTrainerCmdId === cmd.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cmd.name.split('(')[0].trim()}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (trainerCommandsScrollRef.current) {
                        trainerCommandsScrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
                      }
                    }}
                    className="hidden md:flex w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 cursor-pointer"
                    title="Rolar comandos para a direita"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>

                {/* Ilustração Visual da Posição Selecionada no Simulador */}
                <div
                  onClick={() => setSelectedDrillCmdModal(selectedTrainerCommand)}
                  className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700 flex flex-col md:flex-row items-center gap-4 cursor-pointer hover:border-indigo-400 transition-all"
                >
                  <div className="w-full md:w-64 shrink-0">
                    {renderDrillPositionIllustration(selectedTrainerCommand.id, 'SMALL')}
                  </div>
                  <div className="flex-1 space-y-1.5 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
                        Posição Visual • {selectedTrainerCommand.categoryLabel}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        🔍 Toque para ampliar posição
                      </span>
                    </div>
                    <h5 className="font-black text-slate-900 dark:text-white text-sm uppercase">
                      {selectedTrainerCommand.name}
                    </h5>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                      {selectedTrainerCommand.steps[0]}
                    </p>
                  </div>
                </div>

                {/* Painel Visual das 4 Fases (1. Advertência -> 2. Comando -> Pausa 2T -> 3. Execução!) */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      voiceTrainerStage === 'ADVERTENCIA'
                        ? 'bg-amber-500 text-slate-950 border-amber-300 scale-[1.03] shadow-lg'
                        : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/50 text-slate-800 dark:text-white'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-80 block">
                      1. Voz de Advertência
                    </span>
                    <span className="text-sm sm:text-base font-black uppercase block mt-1">
                      &ldquo;{selectedTrainerCommand.advertencia}&rdquo;
                    </span>
                    <span className="text-[10px] font-semibold opacity-80 block mt-1">
                      Alerta geral da tropa
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      voiceTrainerStage === 'COMANDO'
                        ? 'bg-indigo-600 text-white border-indigo-400 scale-[1.03] shadow-lg'
                        : 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200/70 dark:border-indigo-800/50 text-slate-800 dark:text-white'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-80 block">
                      2. Comando Propriamente Dito
                    </span>
                    <span className="text-sm sm:text-base font-black uppercase block mt-1">
                      &ldquo;{selectedTrainerCommand.comandoProprio}&rdquo;
                    </span>
                    <span className="text-[10px] font-semibold opacity-80 block mt-1">
                      Sílabas prolongadas
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      voiceTrainerStage === 'PAUSA'
                        ? 'bg-slate-800 text-amber-300 border-amber-400 scale-[1.03] shadow-lg'
                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-80 block">
                      Intervalo Obrigatório
                    </span>
                    <span className="text-sm sm:text-base font-black uppercase block mt-1">
                      ⏱️ Pausa (2 Tempos)
                    </span>
                    <span className="text-[10px] font-semibold opacity-80 block mt-1">
                      Prepara o reflexo muscular
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      voiceTrainerStage === 'EXECUCAO'
                        ? 'bg-emerald-600 text-white border-emerald-300 scale-[1.03] shadow-lg'
                        : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/50 text-slate-800 dark:text-white'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-80 block">
                      3. Voz de Execução!
                    </span>
                    <span className="text-sm sm:text-base font-black uppercase block mt-1">
                      &ldquo;{selectedTrainerCommand.execucao}&rdquo;
                    </span>
                    <span className="text-[10px] font-semibold opacity-80 block mt-1">
                      {selectedTrainerCommand.footTiming}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4.2 COMANDOS A PÉ FIRME E EM MARCHA (22 COMANDOS DETALHADOS) */}
          {drillSubTab === 'COMANDOS_DSA' && (
            <div className="space-y-4">
              {/* Barra de Busca e Filtro (A Pé Firme vs Em Marcha) */}
              <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 border border-slate-100 dark:border-slate-700 shadow-xs space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={drillSearch}
                    onChange={(e) => setDrillSearch(e.target.value)}
                    placeholder="Buscar comando (ex: Sentido, Cobrir, Meia-Volta, Ordinário Marche, Conversão, Alto)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                  {[
                    { id: 'TODOS' as DrillCommandCategory, label: `Todos os Comandos (${DRILL_COMMANDS.length})` },
                    { id: 'PE_FIRME' as DrillCommandCategory, label: 'Comandos a Pé Firme (11)' },
                    { id: 'EM_MARCHA' as DrillCommandCategory, label: 'Comandos em Marcha (11)' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setDrillCommandCat(cat.id)}
                      className={`px-3.5 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                        drillCommandCat === cat.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de Cartões de Comandos de Ordem Unida */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDrillCommands.map((cmd) => (
                  <div
                    key={cmd.id}
                    className="bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-3.5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider ${
                            cmd.category === 'PE_FIRME'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                          }`}
                        >
                          {cmd.categoryLabel}
                        </span>
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">
                          🦶 {cmd.footTiming}
                        </span>
                      </div>

                      <h5 className="font-black text-slate-900 dark:text-white text-sm sm:text-base uppercase tracking-tight">
                        {cmd.name}
                      </h5>

                      {/* Ilustração Técnica da Posição e Diagrama de Pés (Toque para Ampliar) */}
                      <div
                        onClick={() => setSelectedDrillCmdModal(cmd)}
                        className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-400 transition-all cursor-pointer group"
                      >
                        {renderDrillPositionIllustration(cmd.id, 'SMALL')}
                        <span className="text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400 text-center block mt-1 group-hover:underline">
                          🔍 Toque na ilustração para ampliar a posição
                        </span>
                      </div>

                      {/* Decomposição Visual das 3 Partes da Voz */}
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50">
                          <span className="text-[8.5px] font-black uppercase text-amber-700 dark:text-amber-400 block">
                            1. Advertência
                          </span>
                          <span className="text-[11px] font-black text-slate-800 dark:text-white block truncate mt-0.5">
                            {cmd.advertencia}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/50">
                          <span className="text-[8.5px] font-black uppercase text-indigo-700 dark:text-indigo-400 block">
                            2. Comando
                          </span>
                          <span className="text-[11px] font-black text-slate-800 dark:text-white block truncate mt-0.5">
                            {cmd.comandoProprio}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50">
                          <span className="text-[8.5px] font-black uppercase text-emerald-700 dark:text-emerald-400 block">
                            3. Execução!
                          </span>
                          <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 block truncate mt-0.5">
                            {cmd.execucao}
                          </span>
                        </div>
                      </div>

                      {/* Passos Técnicos */}
                      <div className="space-y-1.5 pt-1">
                        {cmd.steps.map((st, idx) => (
                          <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-200">
                            <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                            <span className="font-medium leading-relaxed">{st}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Erro comum a evitar */}
                    <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-start space-x-2">
                      <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200 leading-snug">
                        <strong className="uppercase">Evite na Avaliação: </strong>
                        {cmd.commonMistake}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4.3 SINAIS DE APITO (COM SOM) E GESTOS DE COMANDO PARA LÍDERES */}
          {drillSubTab === 'APITO_GESTOS' && (
            <div className="space-y-4">
              {/* Sinais de Apito Oficiais com Áudio Real */}
              <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
                    Sinais Acústicos de Comando (Silvo Curto • e Silvo Longo ———)
                  </span>
                  <h4 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight">
                    Comandos de Apito para Líderes e Instrutores (Toque para Ouvir!)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Toque no botão de áudio de cada comando para ouvir exatamente como apitar na formatura ou desfile:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {WHISTLE_COMMANDS.map((whistle) => {
                    const isPlaying = playingWhistleId === whistle.id;
                    return (
                      <div
                        key={whistle.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">
                                {whistle.title}
                              </h5>
                              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-black text-xs tracking-wider">
                                {whistle.notation}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handlePlayWhistleCommand(whistle)}
                              className={`px-3 py-2 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center space-x-1.5 shrink-0 transition-all active:scale-95 ${
                                isPlaying
                                  ? 'bg-red-600 text-white shadow-md'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                              }`}
                            >
                              {isPlaying ? <Square size={13} /> : <Volume2 size={14} />}
                              <span>{isPlaying ? 'Parar' : 'Ouvir Apito'}</span>
                            </button>
                          </div>

                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                            <strong className="text-indigo-600 dark:text-indigo-400">Quando usar:</strong> {whistle.whenToUse}
                          </p>
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                            <strong className="text-emerald-600 dark:text-emerald-400">Reação da Tropa:</strong> {whistle.unitAction}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gestos Visuais de Comando para Líderes / Diretores */}
              <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                    Comandos Silenciosos de Braço (Formações Rápidas sem Voz)
                  </span>
                  <h4 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight">
                    Gestos de Comando para Líderes e Diretores
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Os capitães e as unidades devem reconhecer imediatamente a posição dos braços do diretor e entrar em forma em silêncio:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {LEADER_GESTURES.map((gest) => (
                    <div
                      key={gest.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex items-start space-x-3.5"
                    >
                      {/* Ilustração SVG do Gesto do Líder */}
                      <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 80 80" className="w-full h-full">
                          <circle cx="40" cy="20" r="6" className="fill-slate-700 dark:fill-slate-200" />
                          <rect x="34" y="28" width="12" height="24" rx="3" className="fill-indigo-600" />
                          <line x1="36" y1="52" x2="35" y2="72" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-slate-600 dark:text-slate-300" />
                          <line x1="44" y1="52" x2="45" y2="72" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" className="text-slate-600 dark:text-slate-300" />
                          {gest.svgType === 'COLUNAS' && (
                            <g stroke="#f59e0b" strokeWidth="4" strokeLinecap="round">
                              <line x1="34" y1="32" x2="24" y2="20" />
                              <line x1="46" y1="32" x2="56" y2="20" />
                              <circle cx="24" cy="20" r="2.5" fill="#f59e0b" />
                              <circle cx="56" cy="20" r="2.5" fill="#f59e0b" />
                            </g>
                          )}
                          {gest.svgType === 'LINHA' && (
                            <g stroke="#f59e0b" strokeWidth="4" strokeLinecap="round">
                              <line x1="34" y1="32" x2="10" y2="32" />
                              <line x1="46" y1="32" x2="70" y2="32" />
                            </g>
                          )}
                          {gest.svgType === 'FERRADURA_U' && (
                            <g stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
                              <polyline points="34,32 16,32 16,14" />
                              <polyline points="46,32 64,32 64,14" />
                            </g>
                          )}
                          {gest.svgType === 'CIRCULO' && (
                            <g stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" fill="none">
                              <line x1="34" y1="32" x2="26" y2="12" />
                              <ellipse cx="40" cy="8" rx="14" ry="5" strokeDasharray="3 2" />
                            </g>
                          )}
                          {gest.svgType === 'ALTO_ATENCAO' && (
                            <g stroke="#ef4444" strokeWidth="4" strokeLinecap="round">
                              <line x1="34" y1="32" x2="34" y2="8" />
                              <line x1="46" y1="32" x2="49" y2="48" />
                            </g>
                          )}
                          {gest.svgType === 'ACELERADO' && (
                            <g stroke="#10b981" strokeWidth="4" strokeLinecap="round">
                              <polyline points="34,34 22,36 22,16" fill="none" />
                              <path d="M 14 26 L 14 10 M 10 15 L 14 10 L 18 15" strokeWidth="2.5" fill="none" />
                            </g>
                          )}
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                          {gest.formationType}
                        </span>
                        <h5 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-tight">
                          {gest.name}
                        </h5>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                          <strong>Posição do Líder:</strong> {gest.armPosition}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                          <strong>Formação:</strong> {gest.unitResponse}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4.4 IDEIAS DE EVOLUÇÕES E COREOGRAFIAS PARA APRESENTAÇÕES */}
          {drillSubTab === 'EVOLUCOES' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                      Ordem Unida Criativa para Camporis, Investiduras e Dia do Desbravador
                    </span>
                    <h4 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight">
                      {DRILL_EVOLUTIONS.length} Roteiros Práticos de Evoluções para Apresentações
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Combine precisão militar com efeito geométrico mantendo sempre a postura, a cadência de 116 BPM e os comandos oficiais da DSA:
                    </p>
                  </div>

                  {/* Filtro de Nível de Dificuldade */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                    {(['TODAS', 'BÁSICA', 'INTERMEDIÁRIA', 'AVANÇADA (CAMPORI)'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setEvolutionDiffFilter(lvl)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                          evolutionDiffFilter === lvl
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {lvl === 'TODAS' ? `Todas (${DRILL_EVOLUTIONS.length})` : lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEvolutions.map((evol) => (
                    <div
                      key={evol.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-3.5"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider ${
                              evol.difficulty === 'BÁSICA'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                : evol.difficulty === 'INTERMEDIÁRIA'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                            }`}
                          >
                            Nível: {evol.difficulty}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            👥 {evol.idealSize}
                          </span>
                        </div>

                        <div className="flex items-start space-x-3">
                          {/* Diagrama Tático SVG da Evolução */}
                          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center shrink-0">
                            <svg viewBox="0 0 80 80" className="w-full h-full">
                              {evol.svgDiagram === 'CRUZAMENTO' && (
                                <g strokeWidth="3" strokeLinecap="round" fill="none">
                                  <path d="M 12 24 L 68 24 M 58 18 L 68 24 L 58 30" stroke="#4f46e5" />
                                  <path d="M 68 40 L 12 40 M 22 34 L 12 40 L 22 46" stroke="#f59e0b" />
                                  <path d="M 12 56 L 68 56 M 58 50 L 68 56 L 58 62" stroke="#4f46e5" />
                                </g>
                              )}
                              {evol.svgDiagram === 'MOINHO' && (
                                <g stroke="#4f46e5" strokeWidth="3.5" strokeLinecap="round" fill="none">
                                  <line x1="40" y1="10" x2="40" y2="70" />
                                  <line x1="10" y1="40" x2="70" y2="40" />
                                  <path d="M 46 14 A 26 26 0 0 1 66 34" stroke="#f59e0b" strokeWidth="2.5" />
                                  <path d="M 66 46 A 26 26 0 0 1 46 66" stroke="#f59e0b" strokeWidth="2.5" />
                                </g>
                              )}
                              {evol.svgDiagram === 'DOMINO' && (
                                <g fill="#4f46e5">
                                  <rect x="12" y="42" width="10" height="24" rx="2" opacity="0.4" />
                                  <rect x="28" y="32" width="10" height="34" rx="2" opacity="0.65" />
                                  <rect x="44" y="22" width="10" height="44" rx="2" opacity="0.85" />
                                  <rect x="60" y="12" width="10" height="54" rx="2" fill="#f59e0b" />
                                </g>
                              )}
                              {evol.svgDiagram === 'TRIANGULO_DBV' && (
                                <g fill="none" strokeWidth="3.5" strokeLinejoin="round">
                                  <polygon points="40,66 12,18 68,18" stroke="#ef4444" fill="#fef2f2" fillOpacity="0.2" />
                                  <circle cx="40" cy="66" r="4" fill="#f59e0b" />
                                  <circle cx="12" cy="18" r="4" fill="#4f46e5" />
                                  <circle cx="68" cy="18" r="4" fill="#4f46e5" />
                                </g>
                              )}
                              {evol.svgDiagram === 'ESPELHO' && (
                                <g strokeWidth="3" strokeLinecap="round" fill="none">
                                  <line x1="40" y1="10" x2="40" y2="70" stroke="#94a3b8" strokeDasharray="4 4" />
                                  <path d="M 32 40 L 12 40 M 20 33 L 12 40 L 20 47" stroke="#4f46e5" />
                                  <path d="M 48 40 L 68 40 M 60 33 L 68 40 L 60 47" stroke="#10b981" />
                                </g>
                              )}
                              {evol.svgDiagram === 'FANTASMA' && (
                                <g fill="none" stroke="#4f46e5" strokeWidth="3">
                                  <circle cx="24" cy="26" r="5" fill="#4f46e5" />
                                  <circle cx="56" cy="26" r="5" fill="#4f46e5" />
                                  <circle cx="24" cy="54" r="5" fill="#f59e0b" />
                                  <circle cx="56" cy="54" r="5" fill="#f59e0b" />
                                  <rect x="12" y="14" width="56" height="52" rx="8" strokeDasharray="4 3" />
                                </g>
                              )}
                              {evol.svgDiagram === 'TUNEL_BANDERINS' && (
                                <g fill="none" strokeWidth="3.5" strokeLinecap="round">
                                  <line x1="16" y1="64" x2="40" y2="18" stroke="#4f46e5" />
                                  <line x1="64" y1="64" x2="40" y2="18" stroke="#4f46e5" />
                                  <path d="M 40 68 L 40 30 M 33 38 L 40 30 L 47 38" stroke="#f59e0b" strokeWidth="3" />
                                </g>
                              )}
                              {evol.svgDiagram === 'ESTRELA_4PONTAS' && (
                                <g fill="none" strokeWidth="3" strokeLinecap="round">
                                  <path d="M 40 30 L 40 10 M 34 16 L 40 10 L 46 16" stroke="#4f46e5" />
                                  <path d="M 40 50 L 40 70 M 34 64 L 40 70 L 46 64" stroke="#4f46e5" />
                                  <path d="M 30 40 L 10 40 M 16 34 L 10 40 L 16 46" stroke="#f59e0b" />
                                  <path d="M 50 40 L 70 40 M 64 34 L 70 40 L 64 46" stroke="#f59e0b" />
                                </g>
                              )}
                            </svg>
                          </div>

                          <div>
                            <h5 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">
                              {evol.title}
                            </h5>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                              {evol.visualEffect}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                            Passo a Passo da Evolução:
                          </span>
                          {evol.commandSequence.map((step, idx) => (
                            <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-200">
                              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9.5px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="font-medium leading-relaxed">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 text-[11px] font-bold text-indigo-900 dark:text-indigo-200 leading-snug">
                        🏆 <strong>Dica para Nota Máxima:</strong> {evol.judgeTip}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rodapé de Créditos e Fontes Oficiais (Guia de Campo & Ordem Unida) */}
      <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <BookOpen size={18} />
          </div>
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
              Créditos e Fontes Oficiais de Referência
            </span>
            {standaloneDrill ? (
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Conteúdo técnico extraído do <strong>Manual de Ordem Unida do Ministério de Desbravadores (Divisão Sul-Americana da IASD — DSA)</strong>, <strong>Manual Administrativo do Clube de Desbravadores e Aventureiros (DSA)</strong>, <strong>Regulamento de Uniformes MDA (RUD)</strong>, <strong>MDA Wiki (mda.wiki.br)</strong> e diretrizes de Cadência e Evoluções da <strong>DSA (adventistas.org/pt/desbravadores)</strong>.
              </p>
            ) : (
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Informações técnicas compiladas dos <strong>Manuais Oficiais da Divisão Sul-Americana (DSA — Ministério de Desbravadores e Aventureiros)</strong>, <strong>Manual de Especialidades e Classes MDA (mda.wiki.br)</strong>, <strong>União dos Escoteiros do Brasil (UEB — Sinais de Pista e Pioneiria)</strong>, <strong>Portal Desbrava7 (Tabela de Sinais de Pista)</strong>, <strong>Instituto Nacional de Educação de Surdos (INES — Alfabeto Manual Brasileiro de Libras)</strong>, <strong>Animated Knots / 3D Knots</strong> e protocolos de Primeiros Socorros do <strong>Ministério da Saúde / Corpo de Bombeiros</strong>.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldManualTools;
