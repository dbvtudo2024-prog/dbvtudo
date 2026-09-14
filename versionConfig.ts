export interface VersionRelease {
  version: string;
  date: string;
  tag?: 'NOVO' | 'ATUAL' | 'ESTÁVEL';
  title: string;
  changes: string[];
}

export const APP_VERSION = '3.0.1';
export const APP_BUILD_DATE = '15 de Setembro de 2026';

export const VERSION_HISTORY: VersionRelease[] = [
  {
    version: '3.0.1',
    date: '15/09/2026',
    tag: 'NOVO',
    title: 'Alinhamento Geométrico Perfeito: Linha Reta Central do Globo Paralela ao Corte a 45°',
    changes: [
      'Ajuste angular de precisão (45° exatos) garantindo que a linha reta central (equador) que passa no meio do globo atrás do triângulo esteja rigorosamente alinhada e paralela à inclinação diagonal do corte da faixa.',
      'Sincronização matemática entre o vetor de subida da linha de corte (deltaY/W = 1.0) e a rotação horária do globo (+45°).',
      'Harmonização idêntica na maquete de simulação da ponta da faixa no Painel Administrativo.'
    ]
  },
  {
    version: '3.0.0',
    date: '15/09/2026',
    tag: 'ESTÁVEL',
    title: 'Ponta da Faixa Idêntica à Referência: Rotação Horária do Globo (+40°) e Alinhamento Preciso',
    changes: [
      'Inversão e correção da rotação do globo oficial para o sentido horário oficial (+40°), alinhando o vértice superior e o escudo voltados para cima e à direita exatamente como na imagem de referência.',
      'Corte diagonal da extremidade da faixa com angulação a 45 graus iniciando na ponta inferior esquerda e transpassando o emblema com transparência total na área externa.',
      'Preservação nítida da espada, do escudo e do triângulo D1 na área verde-petróleo da faixa.',
      'Harmonização da maquete do simulador de ponta da faixa e globos no Painel Administrativo.'
    ]
  },
  {
    version: '2.9.9',
    date: '15/09/2026',
    tag: 'ESTÁVEL',
    title: 'Ponta da Faixa Fiel ao Uniforme: Angulação Oficial a 45° e Rotação Exata do Globo',
    changes: [
      'Corte diagonal da extremidade da faixa corrigido para a angulação oficial de 45 graus (subida equivalente à largura total da faixa), com vértice agudo no canto inferior esquerdo subindo em direção à borda direita.',
      'Globo oficial ampliado para escala real e rotacionado em -38°, alinhando o lado direito do triângulo D1 perfeitamente à reta diagonal do corte conforme a imagem de referência.',
      'Corte preciso transpassando a espada e o escudo, mantendo o polo norte, curvatura amarela e a ponta do triângulo em destaque na faixa verde, com transparência total na área externa.',
      'Costura pespontada verde-clara acompanhando rigorosamente a inclinação de 45° por toda a extremidade da faixa e do simulador administrativo.'
    ]
  },
  {
    version: '2.9.8',
    date: '15/09/2026',
    tag: 'ESTÁVEL',
    title: 'Ajuste Fiel do Globo na Ponta da Faixa: Triângulo e Espada em Destaque com Corte Diagonal Realista',
    changes: [
      'Reposicionamento milimétrico do globo oficial na ponta da faixa verde-petróleo, garantindo que mais de 60% do emblema permaneça visível com nitidez.',
      'Triângulo D1, escudo branco e espada azul totalmente preservados e em evidência na faixa, com a linha diagonal cortando realisticamente a extremidade inferior direita do emblema exatamente como na foto de referência.',
      'Eliminação do deslocamento excessivo que cortava o triângulo por completo.',
      'Harmonização das proporções do globo no simulador interativo do Painel Administrativo.'
    ]
  },
  {
    version: '2.9.7',
    date: '15/09/2026',
    tag: 'ESTÁVEL',
    title: 'Ponta da Faixa Fiel à Faixa Real com Globo Cortado na Diagonal e Transparência',
    changes: [
      'Corte diagonal da extremidade da faixa ampliado em ângulo realista (150px), acompanhando perfeitamente a linha diagonal.',
      'Globo oficial redimensionado e posicionado na extremidade da faixa de modo que o corte diagonal traspasse e corte o emblema ao meio, reproduzindo exatamente o padrão oficial da imagem de referência.',
      'Área externa ao corte 100% transparente via clip-path nativo, eliminando o globo inteiro flutuando e exibindo a costura pespontada acompanhando toda a inclinação do corte.',
      'Alinhamento do simulador de ponta da faixa e globos no Painel Administrativo com a mesma inclinação e proporção realista.'
    ]
  },
  {
    version: '2.9.6',
    date: '15/09/2026',
    tag: 'ESTÁVEL',
    title: 'Agrupamento Lado a Lado dos Mestrados com Especialidades Compartilhadas e Alinhamento de Grade',
    changes: [
      'Correção no agrupamento da família de Ciência, Tecnologia e Atividades Profissionais, garantindo que ambos os mestrados entrem no mesmo cluster e venham posicionados no topo da faixa.',
      'Exibição rigorosa lado a lado dos mestrados que compartilham especialidades (ex: Ciência e Tecnologia à esquerda e Atividades Profissionais à direita).',
      'Alinhamento exato das especialidades abaixo dos mestrados: especialidades compartilhadas e de tecnologia nas colunas 1 a 3 (sob o mestrado da esquerda) e especialidades específicas nas colunas seguintes (sob o mestrado da direita), reproduzindo com fidelidade a imagem de referência.',
      'Preservação da ordem oficial: blocos de mestrados ativos com suas especialidades no topo, seguidos das especialidades avulsas das áreas que não possuem mestrado.'
    ]
  },
  {
    version: '2.9.5',
    date: '15/09/2026',
    tag: 'ESTÁVEL',
    title: 'Corte Diagonal Aberto com Globo Transpassado, Mestrados Concluídos e Exatidão de Especialidades',
    changes: [
      'Corte diagonal da faixa verde-petróleo ampliado e mais aberto (92px), com costura pespontada acompanhando a inclinação e emblema do globo posicionado na extremidade com corte diagonal simulando a faixa real.',
      'Filtro estrito de mestrados na faixa: inclusão apenas de mestrados que possuem todos os requisitos de especialidades concluídos pelo desbravador.',
      'Correspondência estrita de especialidades com normalização precisa, eliminando falsas associações (ex: Cultura Física na área recreativa isolada de Física/Ciência e Tecnologia).',
      'Disposição lado a lado dos mestrados que compartilham especialidades no topo com grade alinhada de 4 colunas para as especialidades correspondentes.',
      'Alinhamento do simulador de ponta da faixa e globos no Painel Administrativo com o corte diagonal aberto e pesponto estilizado.'
    ]
  },
  {
    version: '2.9.4',
    date: '14/09/2026',
    tag: 'ESTÁVEL',
    title: 'Alinhamento Fiel da Faixa: Sequência Oficial de Mestrados e Especialidades e Ponta Realista',
    changes: [
      'Alinhamento estrito da ordem de mestrados e especialidades conforme as diretrizes oficiais e imagem de referência: mestrados e suas respectivas especialidades no topo por ordem de regras oficiais, seguidos pelas especialidades agrupadas por áreas na ordem oficial da DSA (ADRA, Artes Manuais, Agrícolas, Espiritual, Profissional/Tecnologia, Recreativas/Campestre, Saúde, Natureza e Domésticas).',
      'Ordenação canônica das especialidades dentro de cada mestrado conforme os requisitos e matriz da regra oficial.',
      'Refinamento da ponta da faixa verde-petróleo com proporção e acabamento fiéis ao uniforme real e emblema do globo dinâmico perfeitamente emoldurado.',
      'Ajuste simultâneo no simulador interativo de globos no Painel Administrativo.'
    ]
  },
  {
    version: '2.9.3',
    date: '14/09/2026',
    tag: 'ESTÁVEL',
    title: 'Ponta da Faixa com Corte Diagonal Oficial, Globo Dinâmico por Idade/Liderança e Painel Admin de Imagens',
    changes: [
      'Ponta da faixa com extremidade inferior em corte diagonal autêntico (64px) e pesponto estilizado em conformidade com o Manual de Uniformes da DSA e referência fotográfica oficial.',
      'Globo dinâmico na ponta da faixa: até 15 anos exibe o Globo Desbravador (fundo cáqui), a partir de 16 anos exibe o Globo Liderança (fundo branco), e com pin de Líder, Master ou Master Avançado ativo exibe o Globo de Líder (L1 com estrela dourada ao centro).',
      'Gestão dos Globos da Faixa no Painel Administrativo: tela dedicada com visualização prévia, campos de URL, upload direto de imagens locais e restauração rápida para os padrões oficiais.',
      'Simulador Interativo da Ponta da Faixa no Admin com alternância em tempo real entre os três modos (Até 15 anos, 16+ anos e Líder Ativo).',
      'Modal informativo no perfil do usuário ao clicar no globo da faixa, detalhando as regras oficiais da DSA e o status do usuário.'
    ]
  },
  {
    version: '2.9.2',
    date: '14/09/2026',
    tag: 'ESTÁVEL',
    title: 'Ordenação Sequencial de Mestrados e Agrupamento Preciso de Especialidades na Faixa',
    changes: [
      'Estrutura sequencial em áreas com mais de um mestrado independente: exibe o primeiro mestrado seguido de suas especialidades, depois o segundo mestrado seguido de suas especialidades, e ao final as especialidades que não completam um mestrado.',
      'Mestrados que compartilham a mesma especialidade (ex: Atividades Profissionais e Ciência e Tecnologia): posicionados lado a lado no topo do bloco, acima de suas especialidades em comum.',
      'Especialidades de outras áreas atribuídas a mestrados (ex: Bactérias, Citologia, Protozoários, Vírus na área de Natureza atribuídos a Mestrado em Saúde): agrupadas e exibidas diretamente junto ao mestrado conquistado a que pertencem, sem irem para as sobras da outra área.'
    ]
  },
  {
    version: '2.9.1',
    date: '14/09/2026',
    tag: 'ESTÁVEL',
    title: 'Mestrados que Dividem Especialidades Lado a Lado e Especialidades de Outras Áreas Agrupadas ao Mestrado',
    changes: [
      'Posicionamento lado a lado de mestrados que compartilham especialidades (ex: Ciência e Tecnologia e Atividades Profissionais): ambos os emblemas ovais agora são exibidos juntos acima de suas especialidades unificadas na Faixa.',
      'Agrupamento de especialidades de outras áreas junto ao mestrado: especialidades que pertencem a um mestrado ativo (mesmo cadastradas sob outra categoria no banco) agora são reunidas diretamente sob o mestrado correspondente.',
      'Reconhecimento ampliado de especialidades compartilhadas de tecnologia e computação para os mestrados em Atividades Profissionais e Ciência e Tecnologia.',
      'Exibição das especialidades avulsas restantes da área logo após o bloco dos mestrados e suas especialidades.'
    ]
  },
  {
    version: '2.9.0',
    date: '14/09/2026',
    tag: 'ESTÁVEL',
    title: 'Sincronização Celular/PC e Sequência de Mestrados e Especialidades na Faixa',
    changes: [
      'Correção da sincronização em tempo real da faixa: eliminada falha de escrita no Supabase (coluna inexistente updated_at), garantindo persistência imediata das especialidades salvas no celular.',
      'Sincronização bidirecional completa: ao logar ou abrir o perfil no PC, as especialidades da faixa são baixadas do Supabase e sincronizadas automaticamente.',
      'Nova regra de disposição na Faixa: cada mestrado é seguido diretamente por suas especialidades correspondentes. Se houver 2 mestrados na mesma área, é exibido o primeiro com suas especialidades, depois o segundo com as suas, e por fim as especialidades restantes que não pertencem a nenhum dos 2 mestrados daquela área.',
      'Sincronização imediata das especialidades da faixa logo após o login no Auth.'
    ]
  },
  {
    version: '2.8.0',
    date: '13/09/2026',
    tag: 'ESTÁVEL',
    title: 'Mestrados Lado a Lado e Agrupamento Preciso de Vida Campestre e Botânica',
    changes: [
      'Mestrados com especialidades compartilhadas (ex: Atividades Profissionais e Ciência e Tecnologia) agora são posicionados lado a lado acima das especialidades na Faixa.',
      'Correção do agrupamento das especialidades de Vida Campestre: acampamentos, pioneirias, fogueiras e nós agora se agrupam perfeitamente sob o Mestrado em Vida Campestre.',
      'Correção do agrupamento das especialidades de Botânica: árvores, flores, cactos, sementes e samambaias agora se agrupam perfeitamente sob o Mestrado em Botânica.',
      'Distribuição protegida de áreas afins: nenhum mestrado ativo rouba especialidades específicas de outro mestrado.',
      'União harmoniosa de todas as especialidades correspondentes aos mestrados irmãos na mesma seção da faixa.'
    ]
  },
  {
    version: '2.7.0',
    date: '13/09/2026',
    tag: 'ESTÁVEL',
    title: 'Layout Responsivo de Especialidades, Sincronização em Nuvem e Proteção da Faixa',
    changes: [
      'Cabeçalho de Especialidades responsivo: no celular imagem centralizada no topo e textos abaixo; no PC imagem à esquerda e textos à direita.',
      'Eliminada redundância de texto na barra de navegação superior das Classes e Especialidades.',
      'Sincronização imediata e persistente da Faixa de Especialidades com o Supabase ao adicionar ou remover pelo celular.',
      'Distintivos de mestrado e especialidades na faixa protegidos contra cliques indesejados (gestão exclusiva na modal Minha Faixa).',
      'Painel de atualizações e sincronização de versão aprimorados.'
    ]
  },
  {
    version: '2.6.0',
    date: '13/09/2026',
    tag: 'ESTÁVEL',
    title: 'Uniforme Oficial, Condecorações Militares e Escala Real da Faixa',
    changes: [
      'Cor cáqui da camisa de gala oficial dos Desbravadores ajustada com fidelidade cromática e textura têxtil refinada.',
      'Condecorações de Classes Regulares unidas em suporte metálico dourado horizontal contínuo, idêntico ao modelo oficial.',
      'Porta-barretas metálico dourado duplo para as Classes Avançadas com divisões esmaltadas e brilho vitrificado.',
      'Insígnia de Excelência com moldura dourada polida e acabamento esmaltado vitrificado.',
      'Distintivos de Liderança separados na lapela, preservando espaçamento e relevo independente.',
      'Faixa de Especialidades e Mestrados em escala real de 100%, preenchendo a largura total de costura a costura.',
      'Sistema de histórico de versões e numeração sincronizado com o pacote do aplicativo.'
    ]
  },
  {
    version: '2.5.0',
    date: '10/03/2026',
    tag: 'ESTÁVEL',
    title: 'Modal de Ajustes, Modo Paisagem e Sistema de Versões',
    changes: [
      'Menu lateral retrátil para PC: inicia fechado, logo limpa sem containers, fecha ao clicar fora e botão de Ajustes no rodapé.',
      'Destaque dos botões da página ativa por cor pura, sem tags de status ou abreviações no modo expandido.',
      'Layout exclusivo para PC com Bíblia Sagrada, Classes e Especialidades em retângulos grandes lado a lado e espaçamento superior ampliado.',
      'Tela de Ajustes reformulada em formato de Modal flutuante com backdrop blur.',
      'Suporte completo a modo Paisagem (Landscape) e tela cheia contínua (100dvh).',
      'Painel de Controle de Versões e Histórico de Atualizações integrado aos Ajustes.',
      'Otimização da navegação entre Desbravadores e Aventureiros.'
    ]
  },
  {
    version: '2.4.0',
    date: '05/03/2026',
    tag: 'ESTÁVEL',
    title: 'Módulo de Trunfos Históricos e Bíblia Integrada',
    changes: [
      'Novo acervo de Trunfos dos Desbravadores e Aventureiros com fotos em alta definição.',
      'Filtro por ano, clube e zoom em tela cheia nos trunfos históricos.',
      'Bíblia Sagrada completa com devocional diário, notas e versículos marcados.',
      'Persistência local reforçada de especialidades e progresso de classes.'
    ]
  },
  {
    version: '2.3.0',
    date: '24/02/2026',
    title: 'Tema Escuro Refinado e Modo Offline PWA',
    changes: [
      'Suporte a PWA avançado com instalação no celular e cache inteligente de recursos.',
      'Paleta de alto contraste para o Modo Escuro e economia de bateria.',
      'Melhorias no leitor de manuais PDF e materiais do Desbrava+.'
    ]
  },
  {
    version: '2.2.0',
    date: '10/02/2026',
    title: 'Gestão de Especialidades e Classes',
    changes: [
      'Requisitos completos e atualizados para todas as classes regulares e avançadas.',
      'Registro de especialidades concluídas e em andamento.',
      'Geração de relatórios e fichas de avaliação para instrutores.'
    ]
  },
  {
    version: '2.0.0',
    date: '01/01/2026',
    title: 'Lançamento DBV Tudo 2026',
    changes: [
      'Nova arquitetura visual com suporte unificado para Desbravadores e Aventureiros.',
      'Sincronização na nuvem com autenticação segura e perfil de usuário.'
    ]
  }
];
