import { Especialidade } from '../types';

/**
 * Especialidades que foram descontinuadas / retiradas do Manual de Especialidades dos Desbravadores.
 * São mantidas no sistema para desbravadores que já as concluíram no passado poderem
 * visualizá-las, incluí-las em suas faixas e marcá-las como concluídas.
 */

export const RETIRED_CATEGORY_ID = -200;
export const RETIRED_CATEGORY_NAME = 'Especialidades excluídas/descontinuadas';

export const DISCONTINUED_SPECIALTIES: Especialidade[] = [
  // --- Especialidades Regulares / Básicas Removidas (8) ---
  {
    id: 99101,
    codigo: '080',
    nome: 'Balões de ar quente',
    area: 'Atividades Recreativas',
    sigla: 'AR',
    cor: '#10b981',
    nivel: 'Nível 2',
    ano: '1982',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/baloes_de_ar_quente.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99102,
    codigo: '009',
    nome: 'Barco a motor',
    area: 'Atividades Recreativas',
    sigla: 'AR',
    cor: '#10b981',
    nivel: 'Nível 1',
    ano: '1961',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/barco_a_motor.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99103,
    codigo: '011',
    nome: 'Datilografia',
    area: 'Atividades Profissionais',
    sigla: 'AP',
    cor: '#ef4444',
    nivel: 'Nível 1',
    ano: '1929',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/datilografia.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99104,
    codigo: '037',
    nome: 'Esqui cross country',
    area: 'Atividades Recreativas',
    sigla: 'AR',
    cor: '#10b981',
    nivel: 'Nível 2',
    ano: '1970',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/esqui_cross_country.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99105,
    codigo: '038',
    nome: 'Esqui downhill',
    area: 'Atividades Recreativas',
    sigla: 'AR',
    cor: '#10b981',
    nivel: 'Nível 2',
    ano: '1970',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/esqui_downhill.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99106,
    codigo: '054',
    nome: 'Missiomodelismo',
    area: 'Artes e Habilidades Manuais',
    sigla: 'HM',
    cor: '#3b82f6',
    nivel: 'Nível 2',
    ano: '1980',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/missiomodelismo.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99107,
    codigo: '021',
    nome: 'Radioeletrônica',
    area: 'Atividades Profissionais',
    sigla: 'AP',
    cor: '#ef4444',
    nivel: 'Nível 2',
    ano: '1938',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/radioeletronica.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 2332,
    codigo: '077',
    nome: 'Telecartofilia',
    area: 'Atividades Recreativas',
    sigla: 'AR',
    cor: '#10b981',
    nivel: 'Nível 1',
    ano: '2005',
    origem: 'Divisão Sul-Americana',
    logo: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Especialidades/Atividades%20Recreativas/imagem@ar077.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 2334,
    codigo: '015',
    nome: 'Mordomia',
    area: 'Atividades Missionárias e Comunitárias',
    sigla: 'AM',
    cor: '#3b82f6',
    nivel: 'Nível 1',
    ano: '1951',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/mordomia.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },

  // --- Especialidades Avançadas Removidas (15) ---
  {
    id: 99109,
    codigo: '072',
    nome: 'Apitos – avançado',
    area: 'Artes e Habilidades Manuais',
    sigla: 'HM',
    cor: '#3b82f6',
    nivel: 'Avançado',
    ano: '-',
    origem: 'Divisão Sul-Americana',
    logo: '/assets/especialidades_descontinuadas/apitos_avancado.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99110,
    codigo: '015',
    nome: 'Arco e flecha – avançado',
    area: 'Atividades Recreativas',
    sigla: 'AR',
    cor: '#10b981',
    nivel: 'Avançado',
    ano: '-',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/arco_e_flecha_avancado.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99111,
    codigo: '062',
    nome: 'Corrida de carrinhos de madeira – avançado',
    area: 'Artes e Habilidades Manuais',
    sigla: 'HM',
    cor: '#3b82f6',
    nivel: 'Avançado',
    ano: '-',
    origem: 'Divisão Sul-Americana',
    logo: '/assets/especialidades_descontinuadas/corrida_de_carrinhos_de_madeira_avancado.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99112,
    codigo: '026',
    nome: 'Desfile com carros alegóricos – avançado',
    area: 'Atividades Missionárias e Comunitárias',
    sigla: 'AM',
    cor: '#3b82f6',
    nivel: 'Avançado',
    ano: '-',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/desfile_com_carros_alegoricos_avancado.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99113,
    codigo: '045',
    nome: 'Equitação – avançado',
    area: 'Atividades Recreativas',
    sigla: 'AR',
    cor: '#10b981',
    nivel: 'Avançado',
    ano: '-',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/equitacao_avancado.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99114,
    codigo: '044',
    nome: 'Esmaltado em cobre – avançado',
    area: 'Artes e Habilidades Manuais',
    sigla: 'HM',
    cor: '#3b82f6',
    nivel: 'Avançado',
    ano: '-',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/esmaltado_em_cobre_avancado.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99115,
    codigo: '036',
    nome: 'Espaçomodelismo – avançado',
    area: 'Artes e Habilidades Manuais',
    sigla: 'HM',
    cor: '#3b82f6',
    nivel: 'Avançado',
    ano: '-',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/espacomodelismo_avancado.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99116,
    codigo: '027',
    nome: 'Esqui aquático – avançado',
    area: 'Atividades Recreativas',
    sigla: 'AR',
    cor: '#10b981',
    nivel: 'Avançado',
    ano: '-',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/esqui_aquatico_avancado.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99117,
    codigo: '089',
    nome: 'Excursionismo pedestre na neve – avançado',
    area: 'Atividades Recreativas',
    sigla: 'AR',
    cor: '#10b981',
    nivel: 'Avançado',
    ano: '-',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/excursionismo_pedestre_na_neve_avancado.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99118,
    codigo: '074',
    nome: 'Faróis – avançado',
    area: 'Artes e Habilidades Manuais',
    sigla: 'HM',
    cor: '#3b82f6',
    nivel: 'Avançado',
    ano: '-',
    origem: 'Divisão Sul-Americana',
    logo: '/assets/especialidades_descontinuadas/farois_avancado.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99119,
    codigo: '012',
    nome: 'Filatelia – avançado',
    area: 'Atividades Recreativas',
    sigla: 'AR',
    cor: '#10b981',
    nivel: 'Avançado',
    ano: '-',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/filatelia_avancado.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99120,
    codigo: '004',
    nome: 'Mecânica automotiva – avançado',
    area: 'Atividades Profissionais',
    sigla: 'AP',
    cor: '#ef4444',
    nivel: 'Avançado',
    ano: '-',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/mecanica_automotiva_avancado.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99121,
    codigo: '032',
    nome: 'Mergulho autônomo – avançado',
    area: 'Atividades Recreativas',
    sigla: 'AR',
    cor: '#10b981',
    nivel: 'Avançado',
    ano: '-',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/mergulho_autonomo_avancado.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 99122,
    codigo: '055',
    nome: 'Missiomodelismo – avançado',
    area: 'Artes e Habilidades Manuais',
    sigla: 'HM',
    cor: '#3b82f6',
    nivel: 'Avançado',
    ano: '-',
    origem: 'Associação Geral',
    logo: '/assets/especialidades_descontinuadas/missiomodelismo_avancado.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  },
  {
    id: 2333,
    codigo: '078',
    nome: 'Telecartofilia – avançado',
    area: 'Atividades Recreativas',
    sigla: 'AR',
    cor: '#10b981',
    nivel: 'Avançado',
    ano: '2005',
    origem: 'Divisão Sul-Americana',
    logo: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Especialidades/Atividades%20Recreativas/Imagem@ar078.png',
    requisitos: ['ESPECIALIDADE RETIRADA DO MANUAL']
  }
];

export function isDiscontinuedSpecialty(item?: Partial<Especialidade> | null): boolean {
  if (!item) return false;
  // A nova especialidade de Mordomia (Ensinos Bíblicos, id 1014, código 021) é ATIVA no Manual 2025
  if (item.id === 1014 || item.area === 'Ensinos Bíblicos' || item.sigla === 'AM-EB' || item.codigo === '021') {
    return false;
  }
  if (item.id && DISCONTINUED_SPECIALTIES.some(d => d.id === item.id)) return true;
  const nameNorm = (item.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (nameNorm === 'mordomia') {
    // Mordomia antiga descontinuada é a de Atividades Missionárias e Comunitárias (id 2334, cód 015)
    return item.id === 2334 || item.codigo === '015' || item.area === 'Atividades Missionárias e Comunitárias' ||
      (item.requisitos || []).some(r => (r || '').toLowerCase().includes('retirada'));
  }
  if (DISCONTINUED_SPECIALTIES.some(d => d.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() === nameNorm)) {
    return true;
  }
  const reqs = item.requisitos || [];
  return reqs.some(r => {
    const norm = (r || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return (norm.includes('retirada') || norm.includes('removida') || norm.includes('descontinuada')) && norm.includes('manual');
  });
}
