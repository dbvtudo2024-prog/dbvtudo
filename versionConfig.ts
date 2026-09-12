export interface VersionRelease {
  version: string;
  date: string;
  tag?: 'NOVO' | 'ATUAL' | 'ESTÁVEL';
  title: string;
  changes: string[];
}

export const APP_VERSION = '2.6.0';
export const APP_BUILD_DATE = '13 de Setembro de 2026';

export const VERSION_HISTORY: VersionRelease[] = [
  {
    version: '2.6.0',
    date: '13/09/2026',
    tag: 'ATUAL',
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
