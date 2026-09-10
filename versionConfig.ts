export interface VersionRelease {
  version: string;
  date: string;
  tag?: 'NOVO' | 'ATUAL' | 'ESTÁVEL';
  title: string;
  changes: string[];
}

export const APP_VERSION = '2.5.0';
export const APP_BUILD_DATE = '10 de Março de 2026';

export const VERSION_HISTORY: VersionRelease[] = [
  {
    version: '2.5.0',
    date: '10/03/2026',
    tag: 'ATUAL',
    title: 'Modal de Ajustes, Modo Paisagem e Sistema de Versões',
    changes: [
      'Tela de Ajustes reformulada em formato de Modal flutuante com backdrop blur.',
      'Suporte completo a modo Paisagem (Landscape) e tela cheia contínua (100dvh).',
      'Painel de Controle de Versões e Histórico de Atualizações integrado aos Ajustes.',
      'Notificação de atualizações aprimorada com identificação da versão e novidades.',
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
