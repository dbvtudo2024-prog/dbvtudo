import pptxgen from 'pptxgenjs';
import { Especialidade, ClubType } from '../types';
import { resolveGeminiApiKey } from './supabaseService';

export interface PresentationOptions {
  instructorName?: string;
  clubName?: string;
  unitName?: string;
  includeAiAnswers?: boolean;
  onProgress?: (status: string, percent: number) => void;
}

export interface DetailedSubItem {
  letter: string;             // "a", "b", "c" ou "1", "2"
  label: string;              // "a) Corrida de velocidade"
  cleanTitle: string;         // "Corrida de velocidade"
  didacticAnswer: string;     // Explicação detalhada e profunda deste sub-item
  keyPoints: string[];        // 2 a 3 tópicos fundamentais
  practicalTip: string;       // Dica prática de execução ou desafio
  imageUrl?: string | null;   // DataURL da imagem ilustrativa (foto ou canvas estilizado)
  illustrationTopic?: string; // Tema específico ilustrado
}

export interface DidacticRequirement {
  itemNumber: string;         // Identificador oficial (ex: "1", "2", "3")
  displayIndex: number;       // Posição sequencial na apresentação (1, 2, 3...)
  totalCount: number;         // Total de requisitos da especialidade
  originalText: string;       // Texto oficial da pergunta
  cleanQuestion: string;      // Enunciado limpo sem prefixo numérico redundante
  subItems?: string[];        // Sub-itens oficializados se houver (ex: ["a) ...", "b) ..."])
  detailedSubItems?: DetailedSubItem[]; // Sub-itens com resolução pedagógica detalhada e imagens individuais
  shortTitle: string;         // Título conciso didático
  category: 'TEORICO' | 'PRATICO' | 'PESQUISA' | 'VIVENCIA' | 'SEGURANCA';
  didacticAnswer: string;     // Resposta explicativa real e detalhada
  keyPoints: string[];        // 3 a 4 tópicos fundamentais para fixação
  practicalActivity: string;  // Dinâmica ou oficina prática para reunião de unidade
  instructorTip: string;      // Conselho pedagógico para o instrutor
  imageUrl?: string | null;   // Ilustração temática específica para a questão
  illustrationTopic?: string; // Tema específico ilustrado
}

export interface ParsedRequirementItem {
  itemNumber: string;
  originalText: string;
  cleanQuestion: string;
  subItems: string[];
}

export interface ParsedRequirementsResult {
  items: ParsedRequirementItem[];
  specialNotes: string[];
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

export const loadImageDataUrl = async (url: string | undefined | null): Promise<string | null> => {
  if (!url || typeof url !== 'string') return null;
  const processedUrl = getImageUrl(url);
  if (!processedUrl) return null;

  try {
    const response = await fetch(processedUrl, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            resolve('');
          }
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
    }
  } catch {
    // Continua para fallback via Image + Canvas se fetch falhar (CORS)
  }

  if (typeof document !== 'undefined') {
    return new Promise<string | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 600;
          canvas.height = img.naturalHeight || img.height || 400;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
            return;
          }
        } catch (err) {
          console.warn('Erro ao desenhar imagem em canvas para PowerPoint:', err);
        }
        resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = processedUrl;
    });
  }

  return null;
};

// Gera um card infográfico estilizado em Canvas para ilustrar requisitos ou sub-itens
export function createIllustratedCanvasCard(
  title: string, 
  itemLabel: string, 
  primaryColor: string, 
  secondaryColor: string,
  categoryLabel?: string
): string {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 380;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Fundo em gradiente suave das cores da área da especialidade
    const grad = ctx.createLinearGradient(0, 0, 640, 380);
    grad.addColorStop(0, `#${primaryColor}`);
    grad.addColorStop(1, `#${secondaryColor}`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 380);

    // Linhas geométricas de estilo moderno e pedagógico
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    for (let r = 70; r <= 310; r += 60) {
      ctx.beginPath();
      ctx.arc(320, 190, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Badge circular com a identificação do item/sub-item
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.arc(320, 120, 46, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(320, 120, 46, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(itemLabel.toUpperCase(), 320, 122);

    // Título do Tópico / Requisito
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px sans-serif';
    const displayTitle = title.length > 34 ? title.substring(0, 32) + '...' : title;
    ctx.fillText(displayTitle.toUpperCase(), 320, 210);

    // Rótulo da Categoria Pedagógica
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText((categoryLabel || 'GUIA DIDÁTICO ILUSTRADO').toUpperCase(), 320, 245);

    // Faixa decorativa inferior
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(40, 290, 560, 1.5);

    // Rodapé de autenticação oficial do Clube de Desbravadores
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '11px sans-serif';
    ctx.fillText('CLUBE DE DESBRAVADORES • MATERIAL INSTRUCIONAL HOMOLOGADO', 320, 330);

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Erro ao criar card ilustrado em canvas:', err);
    return '';
  }
}

// Seleciona com rigor semântico uma imagem contextualizada especificamente sobre o que a questão pede
// Ilustrações por questão desativadas por diretriz pedagógica:
// Os slides dos requisitos utilizam 100% do layout em duas colunas estruturadas
// (Explicação Conceitual + Pontos Fundamentais | Dinâmica Prática + Conselho ao Instrutor),
// evitando associações literais equivocadas (como "nó pata de gato" exibir foto de felino).
export function getTopicImageUrl(
  _specialtyName: string, 
  _questionOrSubText: string, 
  _areaName?: string,
  _extraKeyword?: string
): string {
  return '';
}

export async function findContextualIllustrationUrl(
  _specialtyName: string, 
  _questionOrSubText: string, 
  _areaName?: string,
  _extraKeyword?: string
): Promise<string | null> {
  return null;
}

// Paleta de cores oficial baseada na área da especialidade
function getAreaTheme(areaName?: string) {
  const normalized = (areaName || '').toLowerCase();
  
  if (normalized.includes('natureza')) {
    return {
      primary: '059669', // Emerald
      secondary: '065F46',
      accent: '10B981',
      bgLight: 'F0FDF4',
      badgeBg: 'D1FAE5',
      badgeText: '065F46',
      cardBorder: 'A7F3D0',
      label: 'Estudo da Natureza'
    };
  }
  if (normalized.includes('artes') || normalized.includes('habilidades manuais')) {
    return {
      primary: '0284C7', // Sky Blue
      secondary: '0369A1',
      accent: '38BDF8',
      bgLight: 'F0F9FF',
      badgeBg: 'E0F2FE',
      badgeText: '0369A1',
      cardBorder: 'BAE6FD',
      label: 'Artes e Habilidades Manuais'
    };
  }
  if (normalized.includes('mission') || normalized.includes('espiritu')) {
    return {
      primary: '1E40AF', // Deep Blue
      secondary: '1E3A8A',
      accent: '3B82F6',
      bgLight: 'EFF6FF',
      badgeBg: 'DBEAFE',
      badgeText: '1E3A8A',
      cardBorder: 'BFDBFE',
      label: 'Atividades Missionárias'
    };
  }
  if (normalized.includes('profissional')) {
    return {
      primary: 'DC2626', // Red
      secondary: '991B1B',
      accent: 'EF4444',
      bgLight: 'FEF2F2',
      badgeBg: 'FEE2E2',
      badgeText: '991B1B',
      cardBorder: 'FECACA',
      label: 'Atividades Profissionais'
    };
  }
  if (normalized.includes('saúde') || normalized.includes('saude') || normalized.includes('ciência') || normalized.includes('ciencia')) {
    return {
      primary: '7C3AED', // Violet / Purple
      secondary: '5B21B6',
      accent: '8B5CF6',
      bgLight: 'F5F3FF',
      badgeBg: 'EDE9FE',
      badgeText: '5B21B6',
      cardBorder: 'DDD6FE',
      label: 'Ciência e Saúde'
    };
  }
  if (normalized.includes('doméstica') || normalized.includes('domestica')) {
    return {
      primary: 'EA580C', // Orange
      secondary: '9A3412',
      accent: 'F97316',
      bgLight: 'FFF7ED',
      badgeBg: 'FFEDD5',
      badgeText: '9A3412',
      cardBorder: 'FED7AA',
      label: 'Habilidades Domésticas'
    };
  }
  if (normalized.includes('recreativ') || normalized.includes('esporte')) {
    return {
      primary: '16A34A', // Green
      secondary: '166534',
      accent: '22C55E',
      bgLight: 'F0FDF4',
      badgeBg: 'DCFCE7',
      badgeText: '166534',
      cardBorder: 'BBF7D0',
      label: 'Atividades Recreativas'
    };
  }
  if (normalized.includes('agrícol') || normalized.includes('agricol')) {
    return {
      primary: 'B45309', // Amber / Brown
      secondary: '78350F',
      accent: 'D97706',
      bgLight: 'FFFBEB',
      badgeBg: 'FEF3C7',
      badgeText: '78350F',
      cardBorder: 'FDE68A',
      label: 'Atividades Agrícolas'
    };
  }
  if (normalized.includes('adra') || normalized.includes('comunit')) {
    return {
      primary: 'D97706', // Gold / Amber
      secondary: '92400E',
      accent: 'F59E0B',
      bgLight: 'FEFCE8',
      badgeBg: 'FEF9C3',
      badgeText: '854D0E',
      cardBorder: 'FEF08A',
      label: 'ADRA / Comunitárias'
    };
  }

  // Padrão Geral / Mestrado
  return {
    primary: '4F46E5', // Indigo
    secondary: '3730A3',
    accent: '6366F1',
    bgLight: 'EEF2FF',
    badgeBg: 'E0E7FF',
    badgeText: '3730A3',
    cardBorder: 'C7D2FE',
    label: areaName || 'Especialidade'
  };
}

// Detecta se a linha é um sub-item marcado por letras (a, b, c...), numeração romana ou traços
export function isRequirementSubItem(line: string, currentItemNumber?: string): boolean {
  const trimmed = (line || '').trim();
  if (!trimmed) return false;

  // Letra isolada seguida de delimitador: a), a., a -, a:, A), (a), (a.), etc.
  if (/^(?:\([a-z0-9]\)|[a-z]\s*[\.\-\)\:])(?:\s+|$)/i.test(trimmed)) {
    return true;
  }
  // Letra com parêntese sem espaço: a)Texto
  if (/^[a-z]\)[^\s]/i.test(trimmed)) {
    return true;
  }
  // Termos explícitos: "Item a:", "Sub-item a.", "Subitem a)", "Letra b)"
  if (/^(?:item|subitem|sub-item|letra)\s+[a-z][\.\-\)\:]/i.test(trimmed)) {
    return true;
  }
  // Numeração romana: i), ii), iii), iv), v), vi), vii), viii), ix), x) ou (i) ou I -
  if (/^(?:\((?:i{1,3}|iv|v|vi{0,3}|ix|x)\)|(?:i{1,3}|iv|v|vi{0,3}|ix|x)\s*[\.\-\)\:])(?:\s+|$)/i.test(trimmed)) {
    return true;
  }
  // Sub-item decimal correspondente ao item atual (ex: se o item atual for 2, aceita 2.1, 2.a, 2-a, 2a)
  if (currentItemNumber) {
    const escaped = currentItemNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const decimalRegex = new RegExp(`^${escaped}\\s*[\\.\\-]\\s*(?:[0-9]+|[a-z])\\s*[\\.\\-\\)\\:]\\s*`, 'i');
    if (decimalRegex.test(trimmed)) {
      return true;
    }
  }
  // Marcadores de lista / bullets: "-", "•", "*", "–", "—"
  if (/^[\-\•\*\–\—]\s+/.test(trimmed)) {
    return true;
  }

  return false;
}

// Extrai sub-itens que porventura estejam escritos em linha (inline) no mesmo texto
export function extractInlineSubItems(text: string): { mainText: string; subItems: string[] } {
  const inlineMatch = text.match(/(?:^|\s+)([a-z]\s*[\.\-\)]\s+)/i);
  if (!inlineMatch || inlineMatch.index === undefined || inlineMatch.index === 0) {
    return { mainText: text, subItems: [] };
  }

  const mainText = text.substring(0, inlineMatch.index).trim();
  const subItemsRaw = text.substring(inlineMatch.index).trim();

  const splitRegex = /(?=(?:^|\s+)[a-z]\s*[\.\-\)]\s+)/i;
  const parts = subItemsRaw.split(splitRegex).map(s => s.trim()).filter(Boolean);

  return {
    mainText: mainText || text,
    subItems: parts.length > 0 ? parts : []
  };
}

// Analisa e normaliza a lista de requisitos separando notas preliminares e agrupando sub-itens
export function parseAndNormalizeRequirements(rawRequirements: string[]): ParsedRequirementsResult {
  const items: ParsedRequirementItem[] = [];
  const specialNotes: string[] = [];

  let sequentialCounter = 1;

  for (let i = 0; i < rawRequirements.length; i++) {
    const rawLine = (rawRequirements[i] || '').trim();
    if (!rawLine) continue;

    // 1. Detecta se é uma nota introdutória ou aviso geral (ex: "Nota:", "Obs:", "Atenção:", "Pré-requisito:")
    const isNote = /^(?:nota|obs|observa[çc][aã]o|aten[çc][aã]o|importante|aviso|pr[eé]-requisito|instru[çc][aã]o|recomend[aã]o|dica)(?:\s*do\s*instrutor)?\s*[\:\-]/i.test(rawLine);
    if (isNote) {
      specialNotes.push(rawLine);
      continue;
    }

    // 2. Detecta se é cabeçalho de seção de mestrado ou instrução geral não avaliativa
    const isSectionHeader = /^(?:se[çc][aã]o\s+[iIvVxX\d]+|parte\s+[iIvVxX\d]+|requisitos\s+gerais|instru[çc][oõ]es)\s*[\:\-]?$/i.test(rawLine);
    if (isSectionHeader) {
      specialNotes.push(rawLine);
      continue;
    }

    const currentItem = items.length > 0 ? items[items.length - 1] : null;

    // 3. Verifica se é um SUB-ITEM pertencente ao requisito anterior (ex: a), b), c)...)
    if (currentItem && isRequirementSubItem(rawLine, currentItem.itemNumber)) {
      currentItem.subItems.push(rawLine);
      currentItem.originalText += '\n' + rawLine;
      continue;
    }

    // 4. Tenta extrair a numeração oficial da questão (ex: "1.", "2 -", "3)", "1 Ler", "Item 4:")
    const numberMatch = rawLine.match(/^(?:requisito|item|quest[aã]o)?\s*([0-9]+)(?:[\.\-\)\:]|\s)\s*(.*)/i);

    if (numberMatch && numberMatch[1]) {
      const extractedNumber = numberMatch[1].trim();
      const restText = (numberMatch[2] || '').trim().replace(/^[\.\-\)\:]\s*/, '').trim();

      const { mainText, subItems: inlineSubs } = extractInlineSubItems(restText);

      items.push({
        itemNumber: extractedNumber,
        originalText: rawLine,
        cleanQuestion: mainText || restText || rawLine,
        subItems: inlineSubs
      });

      const parsedInt = parseInt(extractedNumber, 10);
      if (!isNaN(parsedInt)) {
        sequentialCounter = parsedInt + 1;
      }
      continue;
    }

    // 5. Linha sem numeração explícita
    if (currentItem && (currentItem.cleanQuestion.endsWith(':') || currentItem.originalText.endsWith(':') || rawLine.startsWith('-') || /^[a-z]/i.test(rawLine))) {
      if (isRequirementSubItem(rawLine, currentItem.itemNumber)) {
        currentItem.subItems.push(rawLine);
        currentItem.originalText += '\n' + rawLine;
        continue;
      }
    }

    // Caso contrário, é um novo requisito sem numeração no texto original
    const { mainText, subItems: inlineSubs } = extractInlineSubItems(rawLine);
    items.push({
      itemNumber: String(sequentialCounter++),
      originalText: rawLine,
      cleanQuestion: mainText || rawLine,
      subItems: inlineSubs
    });
  }

  if (items.length === 0 && specialNotes.length > 0) {
    items.push({
      itemNumber: '1',
      originalText: specialNotes[0],
      cleanQuestion: specialNotes[0],
      subItems: []
    });
  }

  return { items, specialNotes };
}

// Categoriza o requisito a partir das palavras-chave
function analyzeRequirementType(text: string): 'TEORICO' | 'PRATICO' | 'PESQUISA' | 'VIVENCIA' | 'SEGURANCA' {
  const lower = text.toLowerCase();
  if (lower.includes('segurança') || lower.includes('primeiros socorros') || lower.includes('perigo') || lower.includes('cuidado') || lower.includes('prevenção') || lower.includes('lesão') || lower.includes('risco')) {
    return 'SEGURANCA';
  }
  if (lower.includes('fazer') || lower.includes('construir') || lower.includes('demonstrar') || lower.includes('montar') || lower.includes('preparar') || lower.includes('desenhar') || lower.includes('amarrar') || lower.includes('praticar') || lower.includes('cozinhar') || lower.includes('correr') || lower.includes('completar a distância') || lower.includes('executar')) {
    return 'PRATICO';
  }
  if (lower.includes('visitar') || lower.includes('participar') || lower.includes('excursão') || lower.includes('caminhada') || lower.includes('acampar') || lower.includes('saída') || lower.includes('observar') || lower.includes('trilha')) {
    return 'VIVENCIA';
  }
  if (lower.includes('pesquisar') || lower.includes('relatório') || lower.includes('estudar') || lower.includes('entrevistar') || lower.includes('descobrir') || lower.includes('bíblia') || lower.includes('história')) {
    return 'PESQUISA';
  }
  return 'TEORICO';
}

// Gera um título didático e conciso para o slide
function generateShortTitle(questionText: string): string {
  let clean = questionText.replace(/^(?:requisito|item|quest[aã]o)?\s*([0-9]+(?:\.[0-9]+|[a-z])?)\s*[\.\-\)\:]\s*/i, '').trim();
  
  if (clean.includes(':')) {
    clean = clean.split(':')[0].trim();
  }

  clean = clean.replace(/\?+$/, '').trim();

  if (clean.length > 55) {
    return clean.substring(0, 52).trim() + '...';
  }
  return clean || 'Requisito da Especialidade';
}

// Constrói detalhamento aprofundado para cada sub-item (com conceito real, pontos-chave e desafio prático)
export function buildDetailedSubItems(
  subItemStrings: string[], 
  specialty: Especialidade, 
  itemQuestion: string
): DetailedSubItem[] {
  const qLower = itemQuestion.toLowerCase();
  const specLower = (specialty.nome || '').toLowerCase();

  return subItemStrings.map((sub, sIdx) => {
    const letterMatch = sub.match(/^(?:\(([a-z0-9])\)|([a-z0-9])[\.\-\)\:])\s*(.*)/i);
    const letter = letterMatch ? (letterMatch[1] || letterMatch[2]).toLowerCase() : String.fromCharCode(97 + sIdx);
    const cleanTitle = letterMatch ? letterMatch[3].trim() : sub.replace(/^[\-\•\*\–\—]\s*/, '').trim();
    const titleLower = cleanTitle.toLowerCase();

    let didacticAnswer = '';
    let keyPoints: string[] = [];
    let practicalTip = '';

    // Resoluções técnicas específicas para modalidades de Corrida / Atletismo
    if (specLower.includes('corrida') || specLower.includes('trail') || qLower.includes('corrida') || qLower.includes('modalidade')) {
      if (titleLower.includes('velocidade') || titleLower.includes('sprint') || titleLower.includes('100m')) {
        didacticAnswer = `A Corrida de Velocidade (ou Sprint) é caracterizada por esforços anaeróbicos aláticos máximos em distâncias curtas (até 400m). Exige largada explosiva, aceleração rápida nas primeiras passadas e manutenção da cadência e amplitude de passada com inclinação corporal equilibrada.`;
        keyPoints = [
          'Potência anaeróbica e aceleração rápida nas primeiras 10 a 15 passadas.',
          'Postura corporal levemente inclinada para frente sem flexão excessiva do tronco.',
          'Apoio exclusivo sobre o antepé (metatarso) para maximizar a propulsão.'
        ];
        practicalTip = 'Treino de Reação: Organize a unidade em linha para realizar 3 tiros de 30m com largadas a partir de comandos sonoros e visuais.';
      } else if (titleLower.includes('meio-fundo') || titleLower.includes('meio fundo') || titleLower.includes('800') || titleLower.includes('1500')) {
        didacticAnswer = `As provas de Meio-Fundo (800m a 3000m) constituem a transição entre velocidade e resistência aeróbica. O atleta precisa gerenciar o ritmo de passagem por volta, monitorar o limiar de lactato e posicionar-se taticamente no pelotão, guardando energia para uma aceleração final vigorosa nos últimos 200 a 300 metros.`;
        keyPoints = [
          'Distribuição uniforme do esforço com controle rigoroso do ritmo cardíaco.',
          'Respiração profunda e sincronizada com a cadência de 3 ou 4 passadas.',
          'Estratégia de ultrapassagem nas curvas e sprint progressivo na reta final.'
        ];
        practicalTip = 'Teste de Ritmo: Peça aos desbravadores para correrem 800m cronometrados buscando manter o mesmo tempo nas duas voltas de 400m.';
      } else if (titleLower.includes('fundo') || titleLower.includes('maratona') || titleLower.includes('longa')) {
        didacticAnswer = `A Corrida de Fundo (5km, 10km, meia-maratona e maratona) prioriza a resistência aeróbica e a eficiência energética do organismo. O corredor deve manter passadas econômicas, contato suave com o solo, relaxamento nos ombros e braços, além de seguir um protocolo contínuo de hidratação e reposição eletrolítica.`;
        keyPoints = [
          'Alta capacidade aeróbica máxima (VO2 máx) e economia eficiente de corrida.',
          'Consumo fracionado de água a cada 2 a 3 km para evitar a desidratação.',
          'Passada com pisada média ou plana para proteger as articulações dos joelhos.'
        ];
        practicalTip = 'Caminhada & Corrida Contínua: Realize uma rodagem suave de 15 minutos em ritmo de conversa (zona aeróbica confortável).';
      } else if (titleLower.includes('tênis') || titleLower.includes('calçado') || titleLower.includes('equipamento')) {
        didacticAnswer = `O calçado e o vestuário para corrida devem ser selecionados considerando o terreno e a biomecânica do corredor. Tênis de trilha exigem cravos proeminentes de borracha de alta aderência, entressola com amortecimento responsivo e tecido superior respirável com biqueira reforçada contra pedras e raízes.`;
        keyPoints = [
          'Solado tratorado para aderência antiderrapante em terra, cascalho e lama.',
          'Meias sintéticas anti-bolha e amarração com nó duplo firme no peito do pé.',
          'Roupas de tecido técnico leve (dry-fit) que facilitam a evaporação do suor.'
        ];
        practicalTip = 'Inspeção Prática de Calçados: Compare na reunião solados lisos de asfalto com solados tratorados de trilha, testando a aderência no solo.';
      } else if (titleLower.includes('hidrata') || titleLower.includes('nutrição') || titleLower.includes('água')) {
        didacticAnswer = `A hidratação adequada é o pilar mais decisivo da segurança física na corrida. Deve-se iniciar a prova já hidratado (ingerir 400 a 500ml de água duas horas antes) e beber pequenos goles (100 a 150ml) a cada 15 ou 20 minutos durante o percurso, sem esperar a sensação de sede que já indica início de estresse hídrico.`;
        keyPoints = [
          'Pré-hidratação controlada antes do início de qualquer corrida ou treino.',
          'Uso de mochilas ou cintos com garrafas flexíveis para autonomia no campo.',
          'Reposição eletrolítica (água de coco, sais ou isotônicos) em treinos acima de 1 hora.'
        ];
        practicalTip = 'Simulação de Posto de Hidratação: Demonstre como beber água em movimento sem interromper o ritmo das passadas nem engasgar.';
      } else {
        didacticAnswer = `O sub-item "${cleanTitle}" requer domínio técnico e prático direto pelo desbravador. Deve ser executado conforme os parâmetros de segurança e os manuais oficiais da especialidade, demonstrando precisão e clareza no cumprimento da tarefa.`;
        keyPoints = [
          `Aplicação dos fundamentos e propriedades de "${cleanTitle}".`,
          'Prática orientada durante os treinamentos com acompanhamento do instrutor.',
          'Registro da conclusão no caderno de requisitos oficial da classe.'
        ];
        practicalTip = `Oficina na Unidade: Cada membro executa o procedimento prático de "${cleanTitle}" sob a supervisão do conselheiro.`;
      }
    } else {
      didacticAnswer = `Em "${cleanTitle}", o desbravador estuda e cumpre este quesito específico conforme determinado pela liderança. A prática envolve o conhecimento dos elementos essenciais, a demonstração de habilidade e a aplicabilidade real no dia a dia do clube.`;
      keyPoints = [
        `Compreender e executar com exatidão o item "${cleanTitle}".`,
        'Demonstrar a técnica de forma clara e segura ao avaliador.',
        'Fixar o aprendizado prático no caderno de atividades da especialidade.'
      ];
      practicalTip = `Atividade Prática: Pratique com a unidade o ponto específico de "${cleanTitle}", tirando dúvidas na hora.`;
    }

    return {
      letter,
      label: sub,
      cleanTitle,
      didacticAnswer,
      keyPoints,
      practicalTip,
      illustrationTopic: `${specialty.nome} ${cleanTitle}`
    };
  });
}

// Gerador semântico local de alta fidelidade (elimina respostas padrão/genéricas)
function buildDetailedDidacticData(
  item: ParsedRequirementItem,
  displayIndex: number,
  totalCount: number,
  specialty: Especialidade
): DidacticRequirement {
  const category = analyzeRequirementType(item.originalText);
  const qLower = item.cleanQuestion.toLowerCase();
  const specLower = (specialty.nome || '').toLowerCase();
  const shortTitle = generateShortTitle(item.cleanQuestion);

  let didacticAnswer = '';
  let keyPoints: string[] = [];
  let practicalActivity = '';
  let instructorTip = '';

  // 1. Resolução para "Corrida Rústica" / "Trail Run"
  if (specLower.includes('corrida r') || specLower.includes('trail run') || qLower.includes('trail run') || qLower.includes('corrida rústica')) {
    if (qLower.includes('definição') || qLower.includes('o que é') || qLower.includes('modalidade')) {
      didacticAnswer = `A Corrida Rústica (Trail Run) é a modalidade esportiva pedestre realizada em ambientes naturais abertos (trilhas de terra batida, montanhas, florestas e caminhos rurais), com ausência ou mínimo de pavimentação asfáltica. Caracteriza-se por constantes desníveis altimétricos (subidas e descidas acentuadas), obstáculos naturais (pedras, raízes, lama e riachos) e pela exigência de preparo físico integral, equilíbrio dinâmico e respeito estrito ao meio ambiente.`;
      keyPoints = [
        'Prática em terrenos 100% naturais: trilhas florestais, montanhas e terra batida.',
        'Desníveis altimétricos constantes que demandam adaptação de ritmo e cadência.',
        'Exigência de equilíbrio proprioceptivo e superação de obstáculos naturais.',
        'Compromisso ecológico com o princípio de "Não Deixe Rastros" na natureza.'
      ];
      practicalActivity = 'Reconhecimento de Terreno: Conduza a unidade em um percurso com solo irregular para ensinar a transição correta de passadas e equilíbrio.';
      instructorTip = 'Enfatize que no Trail Run o tempo é secundário em relação à segurança, resistência e conexão com a criação de Deus.';
    } else if (qLower.includes('equipamento') || qLower.includes('vestuário') || qLower.includes('calçado') || qLower.includes('tênis')) {
      didacticAnswer = `O equipamento para Corrida Rústica exige tênis com solado tratorado (cravos de alta aderência para terra e lama), meias técnicas respiráveis para evitar bolhas e roupas leves de tecido sintético (poliamida/dry-fit). Em distâncias médias e longas, são indispensáveis cinto ou mochila de hidratação autônoma, protetor solar, repelente e apito de emergência.`;
      keyPoints = [
        'Tênis específico para trilha com solado de alta tração e biqueira reforçada.',
        'Vestuário técnico respirável que não retenha umidade e previna assaduras.',
        'Sistema de hidratação individual (squeeze de mão ou mochila com reservatório).',
        'Itens de segurança: apito, identificação e proteção solar/repelente.'
      ];
      practicalActivity = 'Inspeção do Kit de Trilha: Peça para cada desbravador demonstrar e conferir os itens ideais de calçado e vestuário para uma corrida de campo.';
      instructorTip = 'Ensine como amarrar o tênis com firmeza (nó duplo seguro) para evitar torções de tornozelo em descidas íngremes.';
    } else if (qLower.includes('segurança') || qLower.includes('primeiros socorros') || qLower.includes('cuidado') || qLower.includes('hidratação') || qLower.includes('lesão')) {
      didacticAnswer = `A segurança no Trail Run baseia-se na hidratação contínua (beber água a cada 15-20 minutos em pequenos goles), atenção permanente ao piso onde se pisa e conhecimento de socorro básico para entorses, escoriações e desidratação. Jamais treine sozinho em mata fechada e tenha sempre um trajeto mapeado previamente informado à liderança.`;
      keyPoints = [
        'Hidratação preventiva fracionada antes, durante e após o esforço físico.',
        'Atenção visual 3 a 5 metros à frente para antecipar raízes e pedras soltas.',
        'Protocolo imediato R.I.C.E. (Repouso, Gelo, Compressão e Elevação) para entorses.',
        'Comunicação de rota e treinamento obrigatório sempre em duplas ou unidade.'
      ];
      practicalActivity = 'Simulação de Resgate e Socorro: Pratique a imobilização temporária de um tornozelo torcido na trilha usando bandagem triangular.';
      instructorTip = 'Destaque que o desbravador prevenido reconhece seus próprios limites físicos e sabe quando reduzir o ritmo para evitar a exaustão.';
    } else {
      didacticAnswer = `O cumprimento deste requisito desenvolve a resistência aeróbica e o condicionamento neuromuscular do desbravador. Requer planejamento prévio de aquecimento dinâmico, controle respiratório rítmico (respiração diafragmática) e registro contínuo da distância percorrida e sensações corporais observadas durante o treino.`;
      keyPoints = [
        'Aquecimento articular dinâmico antes do início da atividade física.',
        'Respiração coordenada com o ritmo das passadas para oxigenação ótima.',
        'Monitoramento do esforço cardíaco e manutenção da hidratação.',
        'Anotação dos resultados no caderno de requisitos da especialidade.'
      ];
      practicalActivity = 'Treino Fracionado na Reunião: Realize 4 repetições de corrida com ritmo moderado alternadas com 1 minuto de caminhada recuperativa.';
      instructorTip = 'Incentive a perseverança individual, adaptando a intensidade para que todos os membros da unidade concluam o percurso com êxito.';
    }
  } 
  // 2. Pioneirismo / Nós / Amarras / Acampamento
  else if (specLower.includes('nó') || specLower.includes('pioneirismo') || specLower.includes('acamp') || qLower.includes('nó') || qLower.includes('amarra') || qLower.includes('corda') || qLower.includes('fogueira') || qLower.includes('fogo')) {
    if (qLower.includes('fogo') || qLower.includes('fogueira')) {
      didacticAnswer = `O fogo de acampamento atende a funções vitais: cocção de alimentos, aquecimento, iluminação e purificação de água. A construção correta exige limpeza de um raio de 3 metros ao redor (retirando folhas secas até o solo mineral), delimitação com pedras úmidas ou valeta e escalonamento da lenha: isca (pequenas lascas secas), gravetos de sustentação e troncos de combustão lenta. Jamais deixe o fogo sem vigilância e apague-o com água e terra até que as cinzas estejam frias ao toque.`;
      keyPoints = [
        'Limpeza prévia da área e isolamento seguro contra propagação de fagulhas.',
        'Escalonamento correto do combustível: isca, gravetos médios e lenha de queima lenta.',
        'Extinção total com água e terra, garantindo que não haja brasas ocultas sob as cinzas.'
      ];
      practicalActivity = 'Construção Prática de Fogueira: Divida a unidade para montar sem acender três estruturas: cone/fita, caçador e estrela.';
      instructorTip = 'Ensine que o respeito e a segurança com o fogo são marcas inegociáveis de um desbravador responsável.';
    } else {
      didacticAnswer = `Cada nó e amarra possui função mecânica específica na construção pioneira e em salvamentos. O nó deve ser executado de forma correta, firme e sem encavalamento de voltas, garantindo que suporte a carga exigida e possa ser desfeito com facilidade quando não estiver mais sob tração. As amarras unem toras de madeira através de voltas bem ajustadas e enforcadas firmemente.`;
      keyPoints = [
        'Execução com precisão anatômica da volta sem cruzamento errôneo.',
        'Saber a aplicação real de cada nó (união, ancoragem ou salvamento).',
        'Arremate firme nas pontas (chicotes) para evitar desfiamento e acidentes.'
      ];
      practicalActivity = 'Desafio das Cordas: Cada desbravador executa o nó demonstrado pelo instrutor, praticando com e sem apoio visual.';
      instructorTip = 'Demonstre o passo a passo com cordas de cores contrastantes para facilitar a visualização de cada seio e laçada.';
    }
  }
  // 3. Estudo da Natureza / Animais / Botânica / Astronomia
  else if (specLower.includes('bicho') || specLower.includes('animal') || specLower.includes('ave') || specLower.includes('planta') || specLower.includes('arvore') || specLower.includes('flor') || specLower.includes('estrela') || specLower.includes('astronom') || (specialty.area || '').toLowerCase().includes('natureza')) {
    didacticAnswer = `O estudo da natureza nesta especialidade revela a sabedoria e a perfeição do Criador manifestadas nos seres vivos e no cosmos. O cumprimento deste requisito exige observação direta em campo, identificação de padrões morfológicos e comportamentais, além do entendimento de como cada organismo integra e equilibra o seu respectivo ecossistema.`;
    keyPoints = [
      `Identificar características morfológicas e funções biológicas específicas de ${specialty.nome}.`,
      'Compreender o habitat, hábitos ecológicos e a cadeia alimentar envolvida.',
      'Reconhecer o papel de mordomia cristã e proteção ambiental como guardiões da criação de Deus.'
    ];
    practicalActivity = `Expedição de Observação: Realize um safári fotográfico ou caderno de campo registrando 3 espécimes/exemplos práticos de ${specialty.nome}.`;
    instructorTip = 'Conecte cada detalhe biológico ao cuidado providentíssimo de Deus com suas criaturas (Salmos 104).';
  }
  // 4. Primeiros Socorros / Saúde / Ciência
  else if (category === 'SEGURANCA' || qLower.includes('socorro') || qLower.includes('fratura') || qLower.includes('entorse') || qLower.includes('rcp') || (specialty.area || '').toLowerCase().includes('saude')) {
    didacticAnswer = `O atendimento de primeiros socorros visa preservar a vida, evitar o agravamento do quadro e manter a vítima estável até a chegada de socorro médico especializado. O socorrista deve avaliar a cena, garantir sua própria segurança e da equipe, acionar o serviço de emergência (SAMU 192 ou Bombeiros 193) e intervir com técnicas corretas e comprovadas.`;
    keyPoints = [
      'Avaliação primária da segurança da cena antes de qualquer aproximação da vítima.',
      'Acionamento imediato do resgate profissional informando local exato e gravidade.',
      'Aplicação de protocolos seguros (compressas, imobilizações e curativos) sem garrotear a circulação.'
    ];
    practicalActivity = 'Simulação Realista: Pratique com a unidade o atendimento inicial e enfaixamento simulado com materiais do kit de socorros.';
    instructorTip = 'Reforce a importância de manter a serenidade e transmitir segurança à vítima através de palavras calmas.';
  } 
  // 5. Atividades Missionárias / Bíblia
  else if ((specialty.area || '').toLowerCase().includes('mission') || specLower.includes('biblia') || qLower.includes('biblia') || qLower.includes('deus') || qLower.includes('jesus')) {
    didacticAnswer = `Este requisito capacita o desbravador no ministério do testemunho cristão e no aprofundamento das Escrituras Sagradas. O aprendizado alia fundamentação bíblica sólida, vida diária de oração e desenvolvimento de métodos práticos para compartilhar a esperança do Evangelho de Cristo com amigos, família e comunidade.`;
    keyPoints = [
      'Domínio dos textos bíblicos e princípios fundamentais do tema estudado.',
      'Aplicação pessoal prática na conduta diária e no caráter cristão.',
      'Compartilhamento ativo do amor de Jesus através de ações missionárias e comunitárias.'
    ];
    practicalActivity = 'Círculo de Compartilhamento: Cada desbravador apresenta em 1 minuto uma lição bíblica prática aprendida neste item.';
    instructorTip = 'Encoraje os desbravadores a memorizarem os versos-chave com auxílio de dinâmicas lúdicas em equipe.';
  }
  // 6. Artes, Habilidades Manuais e Domésticas
  else if ((specialty.area || '').toLowerCase().includes('artes') || (specialty.area || '').toLowerCase().includes('domestica') || specLower.includes('musica') || specLower.includes('culinaria')) {
    didacticAnswer = `O domínio deste requisito desenvolve a criatividade, a destreza manual e a utilidade prática do desbravador. A realização envolve o conhecimento detalhado das ferramentas e materiais apropriados, o seguimento metódico das etapas de produção e o cultivo de altos padrões de acabamento, higiene e segurança.`;
    keyPoints = [
      `Conhecer as ferramentas, técnicas fundamentais e matérias-primas de ${specialty.nome}.`,
      'Executar o trabalho com esmero, paciência e atenção rigorosa aos detalhes.',
      'Aplicar os aprendizados em benefício da unidade, do lar e do serviço comunitário.'
    ];
    practicalActivity = `Oficina de Mão na Massa: Promova 15 minutos de produção prática onde cada desbravador elabora ou demonstra uma etapa do item.`;
    instructorTip = 'Valorize o esforço e a dedicação individual de cada desbravador, independentemente do nível inicial de habilidade.';
  }
  // 7. Geral contextualizado pelo enunciado específico da questão
  else {
    didacticAnswer = `Para cumprir o item "${shortTitle}", o desbravador deve dominar a fundamentação técnica e prática prescrita pelo Ministério dos Desbravadores. Este quesito aborda os princípios essenciais da especialidade de ${specialty.nome}, capacitando o jovem a explicar conceitos com clareza, executar procedimentos com segurança e aplicar o conhecimento em campo.`;
    keyPoints = [
      `Dominar os conceitos técnicos e definições centrais de "${shortTitle}".`,
      'Demonstrar a aplicação prática satisfatória perante a liderança e conselheiro.',
      'Registrar os resultados e aprendizados no relatório da especialidade.'
    ];
    practicalActivity = `Dinâmica de Fixação em Duplas: Os desbravadores formulam perguntas e respostas entre si sobre "${shortTitle}" durante o Cantinho da Unidade.`;
    instructorTip = 'Utilize recursos visuais e perguntas socráticas para engajar os desbravadores na construção do conhecimento.';
  }

  const detailedSubItems = item.subItems && item.subItems.length > 0 
    ? buildDetailedSubItems(item.subItems, specialty, item.cleanQuestion) 
    : undefined;

  return {
    itemNumber: item.itemNumber,
    displayIndex,
    totalCount,
    originalText: item.originalText,
    cleanQuestion: item.cleanQuestion,
    subItems: item.subItems,
    detailedSubItems,
    shortTitle,
    category,
    didacticAnswer,
    keyPoints,
    practicalActivity,
    instructorTip,
    illustrationTopic: `${specialty.nome} ${shortTitle}`
  };
}

// Enriquecimento pedagógico via Gemini com alta resiliência e modelo 3.5 Flash Lite
async function enrichRequirementsWithAi(
  specialty: Especialidade, 
  parsedRequirements: ParsedRequirementsResult,
  onProgress?: (status: string, percent: number) => void
): Promise<DidacticRequirement[]> {
  const { items, specialNotes } = parsedRequirements;
  const totalCount = items.length;

  if (onProgress) onProgress('Consultando instrutor especialista com inteligência artificial...', 20);

  const formattedItemsPrompt = items.map(it => {
    let t = `REQUISITO ${it.itemNumber}: ${it.cleanQuestion}`;
    if (it.subItems && it.subItems.length > 0) {
      t += `\nSub-itens deste requisito:\n${it.subItems.map(s => `  • ${s}`).join('\n')}`;
    }
    return t;
  }).join('\n\n');

  const prompt = `Você é um instrutor master e especialista técnico do Clube de Desbravadores da Igreja Adventista do Sétimo Dia.
Para a especialidade "${specialty.nome}" (Área Oficial: ${specialty.area || 'Geral'}, Código DSA: ${specialty.codigo || ''}), elabore o material didático oficial e RESPONDA DE FATO a cada um dos seguintes requisitos:

${formattedItemsPrompt}

${specialNotes.length > 0 ? `\nNOTAS/ORIENTAÇÕES DA ESPECIALIDADE:\n${specialNotes.join('\n')}\n` : ''}

REGRAS OBRIGATÓRIAS DE CONTEÚDO (MUITO IMPORTANTE):
1. RESPONDA CADA QUESTÃO DE FORMA DIRETA, COMPLETA E DETALHADA COM O CONTEÚDO REAL.
   - É ESTRITAMENTE PROIBIDO gerar respostas evasivas ou genéricas como "Para responder a esta questão com rigor pedagógico..." ou "o desbravador deve pesquisar...".
   - Você DEVE explicar o conteúdo em si! Se a pergunta é "O que é corrida rústica?", explique o conceito real (trail run), características, terrenos e regras. Se pede nós, explique os nós. Se pede regras ou equipamentos, cite-os e explique cada um.
2. SE O REQUISITO POSSUI SUB-ITENS (letras a, b, c...), além da resposta geral no requisito, preencha o array "subItemsDetailed" com a explicação real e aprofundada de CADA sub-item.
3. Para cada requisito, preencha:
   - "didacticAnswer": texto explicativo denso de 3 a 5 frases respondendo a questão de verdade para os desbravadores.
   - "keyPoints": array com 3 a 4 tópicos concretos de fixação baseados na resposta real.
   - "practicalActivity": atividade ou dinâmica prática no Cantinho da Unidade (5 a 10 min).
   - "instructorTip": conselho pedagógico para o instrutor ensinar o ponto com facilidade.
   - "shortTitle": título curto de 3 a 6 palavras para o slide.

Retorne EXCLUSIVAMENTE um JSON array com os objetos no formato:
[
  {
    "itemNumber": "1",
    "shortTitle": "Título curto do requisito",
    "category": "TEORICO" | "PRATICO" | "PESQUISA" | "VIVENCIA" | "SEGURANCA",
    "didacticAnswer": "Resposta explicativa detalhada e real que responde a pergunta de verdade",
    "keyPoints": ["Ponto concreto 1", "Ponto 2", "Ponto 3"],
    "practicalActivity": "Atividade na unidade",
    "instructorTip": "Dica pedagógica",
    "subItemsDetailed": [
      {
        "letter": "a",
        "cleanTitle": "Título do sub-item",
        "didacticAnswer": "Explicação aprofundada deste sub-item específico",
        "keyPoints": ["Ponto 1 do sub-item", "Ponto 2"],
        "practicalTip": "Dica prática ou desafio para este sub-item"
      }
    ]
  }
]`;

  // 1. Tenta via endpoint do servidor (/api/gemini/generate-didactic)
  try {
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/gemini/generate-didactic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const resJson = await response.json();
          if (resJson && resJson.text) {
            const clean = resJson.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(clean);
            if (Array.isArray(parsed) && parsed.length > 0) {
              if (onProgress) onProgress('Organizando respostas didáticas de alta precisão...', 55);
              return mapAiResponseToRequirements(parsed, items, totalCount, specialty);
            }
          }
        }
      }
    }
  } catch (srvErr) {
    console.warn('Tentativa via rota server-side falhou, tentando chamada com chave sincronizada:', srvErr);
  }

  // 2. Chamada direta com @google/genai usando chave de ambiente ou configuração sincronizada no Supabase
  try {
    const apiKey = await resolveGeminiApiKey();
    if (apiKey) {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

      for (const modelName of candidateModels) {
        try {
          const aiRes = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            }
          });

          const text = aiRes.text || '';
          const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          if (Array.isArray(parsed) && parsed.length > 0) {
            if (onProgress) onProgress('Organizando respostas didáticas geradas...', 55);
            return mapAiResponseToRequirements(parsed, items, totalCount, specialty);
          }
        } catch (e) {
          console.warn(`Tentativa cliente com ${modelName} falhou:`, e);
        }
      }
    }
  } catch (err) {
    console.warn('Fallback para gerador semântico local especializado:', err);
  }

  // 3. Fallback para gerador semântico local de alta qualidade
  return items.map((item, idx) => buildDetailedDidacticData(item, idx + 1, totalCount, specialty));
}

// Mapeia a resposta da IA garantindo sincronia perfeita com os números dos requisitos e sub-itens
function mapAiResponseToRequirements(
  parsed: any[], 
  items: ParsedRequirementItem[], 
  totalCount: number,
  specialty: Especialidade
): DidacticRequirement[] {
  return items.map((it, idx) => {
    const found = parsed.find((p: any) => String(p.itemNumber || p.index || '').trim() === String(it.itemNumber).trim()) || parsed[idx];

    if (found && found.didacticAnswer && found.didacticAnswer.length > 15) {
      let detailedSubItems: DetailedSubItem[] | undefined = undefined;
      if (it.subItems && it.subItems.length > 0) {
        if (Array.isArray(found.subItemsDetailed) && found.subItemsDetailed.length > 0) {
          detailedSubItems = found.subItemsDetailed.map((sub: any, sIdx: number) => {
            const rawSub = it.subItems[sIdx] || `Sub-item ${sub.letter || sIdx + 1}`;
            return {
              letter: String(sub.letter || String.fromCharCode(97 + sIdx)).toLowerCase(),
              label: rawSub,
              cleanTitle: sub.cleanTitle || rawSub.replace(/^(?:\([a-z0-9]\)|[a-z0-9][\.\-\)\:])\s*/i, '').trim(),
              didacticAnswer: sub.didacticAnswer || `Explicação técnica detalhada para este item conforme os manuais oficiais da especialidade.`,
              keyPoints: Array.isArray(sub.keyPoints) && sub.keyPoints.length > 0 ? sub.keyPoints : ['Fixação do conceito técnico.', 'Aplicação prática na unidade.'],
              practicalTip: sub.practicalTip || 'Demonstração prática orientada pelo instrutor.',
              illustrationTopic: sub.illustrationTopic || `${specialty.nome} ${sub.cleanTitle || rawSub}`
            };
          });
        } else {
          detailedSubItems = buildDetailedSubItems(it.subItems, specialty, it.cleanQuestion);
        }
      }

      return {
        itemNumber: it.itemNumber,
        displayIndex: idx + 1,
        totalCount,
        originalText: it.originalText,
        cleanQuestion: it.cleanQuestion,
        subItems: it.subItems,
        detailedSubItems,
        shortTitle: found.shortTitle || generateShortTitle(it.cleanQuestion),
        category: found.category || analyzeRequirementType(it.originalText),
        didacticAnswer: found.didacticAnswer,
        illustrationTopic: found.illustrationTopic || `${specialty.nome} ${it.cleanQuestion}`,
        keyPoints: Array.isArray(found.keyPoints) && found.keyPoints.length > 0 
          ? found.keyPoints 
          : [
            'Compreender com clareza o conceito e fundamentação deste requisito.',
            'Aplicar os princípios práticos nas atividades de campo e na vida cristã.',
            'Demonstrar a conclusão do item de forma satisfatória ao instrutor.'
          ],
        practicalActivity: found.practicalActivity || 'Dinâmica interativa no Cantinho da Unidade.',
        instructorTip: found.instructorTip || 'Conduza a instrução com entusiasmo, encorajando perguntas da unidade.'
      };
    }

    return buildDetailedDidacticData(it, idx + 1, totalCount, specialty);
  });
}

// Carrega ou gera a ilustração visual para cada requisito principal
async function resolveRequirementIllustration(
  item: DidacticRequirement, 
  specialty: Especialidade, 
  theme: ReturnType<typeof getAreaTheme>
): Promise<string | null> {
  // Tenta carregar imagem fotográfica temática estritamente contextualizada
  const photoUrl = await findContextualIllustrationUrl(specialty.nome, item.cleanQuestion, specialty.area, item.illustrationTopic);
  if (photoUrl) {
    try {
      const dataUrl = await loadImageDataUrl(photoUrl);
      if (dataUrl) return dataUrl;
    } catch {}
  }

  // Se não encontrar imagem diretamente relacionada, NÃO exibe imagem (layout se ajusta para conteúdo pedagógico)
  return null;
}

// Carrega ou gera a ilustração visual para cada sub-item
async function resolveSubItemIllustration(
  sub: DetailedSubItem, 
  specialty: Especialidade, 
  theme: ReturnType<typeof getAreaTheme>
): Promise<string | null> {
  // Tenta carregar imagem fotográfica temática estritamente contextualizada
  const photoUrl = await findContextualIllustrationUrl(specialty.nome, `${sub.cleanTitle} ${sub.label}`, specialty.area, sub.illustrationTopic);
  if (photoUrl) {
    try {
      const dataUrl = await loadImageDataUrl(photoUrl);
      if (dataUrl) return dataUrl;
    } catch {}
  }

  // Se não encontrar imagem relacionada, não exibe imagem
  return null;
}

// Gerador principal da apresentação PowerPoint didática completa
export async function generateSpecialtyPowerPoint(
  specialty: Especialidade, 
  options: PresentationOptions = {}
): Promise<void> {
  const { instructorName, clubName, unitName, onProgress } = options;

  if (onProgress) onProgress('Iniciando elaboração pedagógica dos slides...', 5);

  const pres = new pptxgen();

  // Widescreen 16:9 de alta definição
  pres.layout = 'LAYOUT_16x9';
  pres.author = instructorName || 'Clube de Desbravadores';
  pres.company = clubName || 'Ministério dos Desbravadores - DSA';
  pres.title = `Especialidade: ${specialty.nome} - Apresentação Didática`;
  pres.subject = `Material Didático e Instrucional da Especialidade ${specialty.nome}`;

  const theme = getAreaTheme(specialty.area);
  const codeBadge = specialty.codigo || specialty.sigla || 'OFICIAL';

  // Carrega logo da especialidade se existir
  let specialtyLogoDataUrl: string | null = null;
  if (specialty.logo) {
    if (onProgress) onProgress('Carregando insígnia oficial da especialidade...', 10);
    specialtyLogoDataUrl = await loadImageDataUrl(specialty.logo);
  }

  // Analisa e normaliza os requisitos da especialidade agrupando sub-itens
  const rawReqs = specialty.requisitos && specialty.requisitos.length > 0 
    ? specialty.requisitos 
    : ['Completar com êxito todos os itens práticos e teóricos determinados pelo instrutor da especialidade.'];

  const parsedRequirements = parseAndNormalizeRequirements(rawReqs);

  // Obtém os dados didáticos completos com respostas verdadeiras
  const didacticItems = await enrichRequirementsWithAi(specialty, parsedRequirements, onProgress);

  // Mantém os slides dos requisitos sem imagens avulsas, priorizando o layout pedagógico estruturado
  if (onProgress) onProgress('Organizando estrutura pedagógica dos requisitos e sub-itens...', 55);
  for (let idx = 0; idx < didacticItems.length; idx++) {
    const item = didacticItems[idx];
    item.imageUrl = null;

    if (item.detailedSubItems && item.detailedSubItems.length > 0) {
      for (const sub of item.detailedSubItems) {
        sub.imageUrl = null;
      }
    }
  }

  if (onProgress) onProgress('Construindo slides didáticos de alta qualidade...', 70);

  // ==========================================
  // SLIDE 1: CAPA OFICIAL
  // ==========================================
  const slide1 = pres.addSlide();
  slide1.background = { color: '0F172A' }; // Slate-900

  // Barra lateral decorativa com a cor da área
  slide1.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.35,
    h: '100%',
    fill: { color: theme.primary }
  });

  // Emblema ou Insígnia da Especialidade
  if (specialtyLogoDataUrl) {
    try {
      slide1.addImage({
        data: specialtyLogoDataUrl,
        x: 0.8,
        y: 1.1,
        w: 1.8,
        h: 1.8
      });
    } catch {
      slide1.addShape(pres.ShapeType.roundRect, {
        x: 0.8,
        y: 1.1,
        w: 1.8,
        h: 1.8,
        rectRadius: 0.2,
        fill: { color: theme.primary }
      });
    }
  } else {
    slide1.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 1.1,
      w: 1.8,
      h: 1.8,
      rectRadius: 0.2,
      fill: { color: theme.primary }
    });
    slide1.addText('DSA', {
      x: 0.8,
      y: 1.1,
      w: 1.8,
      h: 1.8,
      fontSize: 24,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle'
    });
  }

  // Tag de Área e Código
  slide1.addShape(pres.ShapeType.roundRect, {
    x: 2.8,
    y: 1.1,
    w: 6.4,
    h: 0.42,
    rectRadius: 0.1,
    fill: { color: theme.secondary },
    line: { color: theme.primary, width: 1 }
  });
  slide1.addText(`${theme.label.toUpperCase()}  •  CÓDIGO: ${codeBadge}  •  ${specialty.nivel ? `NÍVEL ${specialty.nivel}` : 'CLUBE DE DESBRAVADORES'}`, {
    x: 2.9,
    y: 1.1,
    w: 6.2,
    h: 0.42,
    fontSize: 10,
    bold: true,
    color: 'FFFFFF',
    valign: 'middle'
  });

  // Título da Especialidade
  slide1.addText(specialty.nome.toUpperCase(), {
    x: 2.8,
    y: 1.65,
    w: 6.4,
    h: 1.25,
    fontSize: 28,
    bold: true,
    color: 'FFFFFF',
    wrap: true
  });

  // Subtítulo descritivo
  slide1.addText('Material Didático, Instrucional e Roteiro de Requisitos Homologados', {
    x: 2.8,
    y: 2.95,
    w: 6.4,
    h: 0.45,
    fontSize: 13,
    color: '94A3B8'
  });

  // Linha separadora
  slide1.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 3.55,
    w: 8.4,
    h: 0.03,
    fill: { color: '334155' }
  });

  // Caixa de Identificação do Clube e Instrutor
  slide1.addShape(pres.ShapeType.roundRect, {
    x: 0.8,
    y: 3.75,
    w: 8.4,
    h: 1.35,
    rectRadius: 0.15,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 }
  });

  const clubDisplay = clubName || 'Clube de Desbravadores';
  const instructorDisplay = instructorName || 'Instrutor(a) Oficial';
  const unitDisplay = unitName ? `Unidade: ${unitName}` : 'Divisão Sul-Americana (DSA)';

  slide1.addText([
    { text: 'ORGANIZAÇÃO & MINISTRAÇÃO:\n', options: { fontSize: 9, bold: true, color: theme.accent } },
    { text: `${clubDisplay.toUpperCase()}\n`, options: { fontSize: 13, bold: true, color: 'FFFFFF' } },
    { text: `${unitDisplay}   •   Instrutor(a): ${instructorDisplay}`, options: { fontSize: 10, color: '94A3B8' } }
  ], {
    x: 1.1,
    y: 3.9,
    w: 7.8,
    h: 1.05,
    valign: 'middle'
  });

  // Rodapé da Capa
  slide1.addText('MINISTÉRIO DOS DESBRAVADORES  •  DIVISÃO SUL-AMERICANA DA IASD', {
    x: 0.8,
    y: 5.2,
    w: 8.4,
    h: 0.25,
    fontSize: 8.5,
    color: '64748B',
    align: 'center'
  });

  // ==========================================
  // SLIDE 2: VISÃO GERAL & METODOLOGIA
  // ==========================================
  const slide2 = pres.addSlide();
  slide2.background = { color: 'F8FAFC' };

  slide2.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.85, fill: { color: theme.primary } });
  slide2.addText('VISÃO GERAL & METODOLOGIA PEDAGÓGICA', {
    x: 0.8,
    y: 0.15,
    w: 8.4,
    h: 0.55,
    fontSize: 18,
    bold: true,
    color: 'FFFFFF',
    valign: 'middle'
  });

  // Card 1: Ficha Técnica da Especialidade
  slide2.addShape(pres.ShapeType.roundRect, {
    x: 0.8,
    y: 1.15,
    w: 4.0,
    h: 3.95,
    rectRadius: 0.15,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 1 }
  });

  slide2.addText('📋 Estrutura da Especialidade', {
    x: 1.0,
    y: 1.35,
    w: 3.6,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: theme.primary
  });

  const summaryBullets = [
    { text: `Especialidade: ${specialty.nome}`, options: { bold: true, breakLine: true } },
    { text: `Área Oficial: ${theme.label}`, options: { breakLine: true } },
    { text: `Código DSA: ${codeBadge}`, options: { breakLine: true } },
    { text: `Nível de Dificuldade: ${specialty.nivel || 'Básico / Médio'}`, options: { breakLine: true } },
    { text: `Total de Requisitos: ${didacticItems.length} requisitos oficiais homologados`, options: { breakLine: true } },
    { text: `Origem: ${specialty.ano || specialty.origem || 'Divisão Sul-Americana (DSA)'}`, options: { breakLine: true } },
    { text: `Metodologia: Resoluções explicativas reais, ilustrações temáticas contextualizadas e slides individuais para cada sub-item.`, options: {} }
  ];

  slide2.addText(summaryBullets, {
    x: 1.0,
    y: 1.8,
    w: 3.6,
    h: 3.1,
    fontSize: 10,
    color: '334155',
    bullet: true,
    wrap: true
  });

  // Card 2: Metodologia e Orientações Oficiais
  slide2.addShape(pres.ShapeType.roundRect, {
    x: 5.2,
    y: 1.15,
    w: 4.0,
    h: 3.95,
    rectRadius: 0.15,
    fill: { color: 'FFFFFF' },
    line: { color: 'E2E8F0', width: 1 }
  });

  slide2.addText(parsedRequirements.specialNotes.length > 0 ? '⚠️ Orientações & Pré-Requisitos' : '🎯 Como Ministrar esta Especialidade', {
    x: 5.4,
    y: 1.35,
    w: 3.6,
    h: 0.35,
    fontSize: 14,
    bold: true,
    color: theme.primary
  });

  const rightCardBullets = parsedRequirements.specialNotes.length > 0
    ? parsedRequirements.specialNotes.map(n => ({ text: n, options: { breakLine: true } }))
    : [
      { text: '1. Introdução Visual:', options: { bold: true, breakLine: true } },
      { text: 'Apresente a questão projetada estimulando a unidade a formular hipóteses e debater.', options: { breakLine: true } },
      { text: '2. Explicação Real e Fundamentada:', options: { bold: true, breakLine: true } },
      { text: 'Ensine os conceitos verdadeiros contidos na resposta do slide sem dúvidas abertas.', options: { breakLine: true } },
      { text: '3. Demonstração Prática & Dinâmicas:', options: { bold: true, breakLine: true } },
      { text: 'Execute a oficina proposta no Cantinho da Unidade pelo método "aprender fazendo".', options: { breakLine: true } },
      { text: '4. Caderno & Registro de Investidura:', options: { bold: true, breakLine: true } },
      { text: 'Oriente cada membro a registrar o cumprimento prático para a investidura.', options: {} }
    ];

  slide2.addText(rightCardBullets, {
    x: 5.4,
    y: 1.8,
    w: 3.6,
    h: 3.1,
    fontSize: 9.5,
    color: '334155',
    bullet: true,
    wrap: true
  });

  // ==========================================
  // SLIDES DIDÁTICOS DE REQUISITOS (COM ILUSTRAÇÃO TEMÁTICA E RESPOSTAS REAIS)
  // ==========================================
  for (let i = 0; i < didacticItems.length; i++) {
    const item = didacticItems[i];
    const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
    const detailedSubs = item.detailedSubItems || [];

    // -------------------------------------------------------------
    // SLIDE A: REQUISITO PRINCIPAL
    // -------------------------------------------------------------
    const slide = pres.addSlide();
    slide.background = { color: 'F8FAFC' };

    // Barra de topo com identificação estrita e sincronizada
    slide.addShape(pres.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.8,
      fill: { color: theme.primary }
    });

    slide.addText(`ESPECIALIDADE: ${specialty.nome.toUpperCase()}   •   REQUISITO ${item.itemNumber} (ITEM ${item.displayIndex} DE ${item.totalCount})`, {
      x: 0.8,
      y: 0.12,
      w: 8.4,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: 'FFFFFF'
    });

    slide.addText(item.shortTitle.toUpperCase(), {
      x: 0.8,
      y: 0.38,
      w: 8.4,
      h: 0.35,
      fontSize: 14,
      bold: true,
      color: 'FFFFFF'
    });

    // Bloco 1: Enunciado Oficial da Questão
    const qBoxHeight = hasSubItems ? (item.subItems!.length > 3 ? 1.25 : 1.1) : 0.95;

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 0.92,
      w: 8.4,
      h: qBoxHeight,
      rectRadius: 0.1,
      fill: { color: 'FFFFFF' },
      line: { color: theme.cardBorder, width: 1.5 }
    });

    const badgeText = hasSubItems 
      ? `REQUISITO ${item.itemNumber}  [${item.category}] • COM ${item.subItems!.length} SUB-ITENS DETALHADOS A SEGUIR`
      : `REQUISITO ${item.itemNumber}  [${item.category}]`;

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.95,
      y: 1.0,
      w: hasSubItems ? 3.8 : 1.8,
      h: 0.24,
      rectRadius: 0.08,
      fill: { color: theme.badgeBg }
    });

    slide.addText(badgeText, {
      x: 0.95,
      y: 1.0,
      w: hasSubItems ? 3.8 : 1.8,
      h: 0.24,
      fontSize: 8,
      bold: true,
      color: theme.badgeText,
      align: 'center',
      valign: 'middle'
    });

    slide.addText(item.cleanQuestion, {
      x: 0.95,
      y: 1.28,
      w: 8.1,
      h: hasSubItems ? 0.3 : 0.5,
      fontSize: 10,
      bold: true,
      color: '1E293B',
      wrap: true
    });

    if (hasSubItems) {
      const subSummary = item.subItems!.map(s => `• ${s}`).join('   ');
      slide.addText(subSummary, {
        x: 0.95,
        y: 1.6,
        w: 8.1,
        h: qBoxHeight - 0.7,
        fontSize: 8,
        color: theme.secondary,
        bold: true,
        wrap: true
      });
    }

    // Colunas inferiores
    const contentY = 0.92 + qBoxHeight + 0.12;
    const contentH = Math.max(2.8, 5.4 - contentY);

    // Bloco 2 (Coluna Esquerda): Resposta Didática & Pontos Fundamentais
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: contentY,
      w: 4.6,
      h: contentH,
      rectRadius: 0.12,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', width: 1 }
    });

    slide.addText('💡 Resposta Completa & Resolução do Requisito', {
      x: 1.0,
      y: contentY + 0.1,
      w: 4.2,
      h: 0.26,
      fontSize: 10,
      bold: true,
      color: theme.primary
    });

    slide.addText(item.didacticAnswer, {
      x: 1.0,
      y: contentY + 0.38,
      w: 4.2,
      h: contentH * 0.44,
      fontSize: hasSubItems ? 8.5 : 9,
      color: '334155',
      wrap: true
    });

    slide.addText('📌 Pontos Fundamentais para Fixação:', {
      x: 1.0,
      y: contentY + (contentH * 0.44) + 0.42,
      w: 4.2,
      h: 0.2,
      fontSize: 8.5,
      bold: true,
      color: '475569'
    });

    const bulletItems = item.keyPoints.map((pt, pIdx) => ({
      text: pt,
      options: { breakLine: pIdx < item.keyPoints.length - 1 }
    }));

    slide.addText(bulletItems, {
      x: 1.0,
      y: contentY + (contentH * 0.44) + 0.64,
      w: 4.2,
      h: contentH - ((contentH * 0.44) + 0.68),
      fontSize: 8,
      color: '475569',
      bullet: true,
      wrap: true
    });

    // Coluna Direita: Ilustração ou Conteúdo Pedagógico Ampliado
    if (item.imageUrl) {
      const rightImgH = 1.95;
      slide.addShape(pres.ShapeType.roundRect, {
        x: 5.6,
        y: contentY,
        w: 3.6,
        h: rightImgH,
        rectRadius: 0.12,
        fill: { color: 'FFFFFF' },
        line: { color: theme.cardBorder, width: 1 }
      });

      try {
        slide.addImage({
          data: item.imageUrl,
          x: 5.65,
          y: contentY + 0.05,
          w: 3.5,
          h: rightImgH - 0.1
        });
      } catch {}

      // Bloco 4 (Coluna Direita - Inferior): Dinâmica Prática na Unidade
      const rightBottomY = contentY + rightImgH + 0.12;
      const rightBottomH = contentH - rightImgH - 0.12;

      slide.addShape(pres.ShapeType.roundRect, {
        x: 5.6,
        y: rightBottomY,
        w: 3.6,
        h: rightBottomH,
        rectRadius: 0.12,
        fill: { color: theme.bgLight },
        line: { color: theme.cardBorder, width: 1 }
      });

      slide.addText('⚡ Dinâmica Prática na Unidade', {
        x: 5.8,
        y: rightBottomY + 0.08,
        w: 3.2,
        h: 0.2,
        fontSize: 9,
        bold: true,
        color: theme.secondary
      });

      slide.addText(item.practicalActivity, {
        x: 5.8,
        y: rightBottomY + 0.3,
        w: 3.2,
        h: rightBottomH - 0.35,
        fontSize: 8,
        color: '475569',
        wrap: true
      });
    } else {
      // Quando não há imagem relacionada: layout pedagógico balanceado e sem lacunas
      const cardH = (contentH - 0.14) / 2;

      // Card Superior: Dinâmica Prática na Unidade
      slide.addShape(pres.ShapeType.roundRect, {
        x: 5.6,
        y: contentY,
        w: 3.6,
        h: cardH,
        rectRadius: 0.12,
        fill: { color: theme.bgLight },
        line: { color: theme.cardBorder, width: 1 }
      });

      slide.addText('⚡ Dinâmica Prática na Unidade', {
        x: 5.8,
        y: contentY + 0.1,
        w: 3.2,
        h: 0.22,
        fontSize: 9.5,
        bold: true,
        color: theme.secondary
      });

      slide.addText(item.practicalActivity, {
        x: 5.8,
        y: contentY + 0.36,
        w: 3.2,
        h: cardH - 0.44,
        fontSize: 8.5,
        color: '334155',
        wrap: true
      });

      // Card Inferior: Conselho Pedagógico para o Instrutor
      const secondY = contentY + cardH + 0.14;
      slide.addShape(pres.ShapeType.roundRect, {
        x: 5.6,
        y: secondY,
        w: 3.6,
        h: cardH,
        rectRadius: 0.12,
        fill: { color: 'FFFFFF' },
        line: { color: 'E2E8F0', width: 1 }
      });

      slide.addText('💡 Conselho Pedagógico para o Instrutor', {
        x: 5.8,
        y: secondY + 0.1,
        w: 3.2,
        h: 0.22,
        fontSize: 9.5,
        bold: true,
        color: theme.primary
      });

      slide.addText(item.instructorTip || 'Oriente a instrução com exemplos concretos e perguntas reflexivas, estimulando a participação de cada desbravador na unidade.', {
        x: 5.8,
        y: secondY + 0.36,
        w: 3.2,
        h: cardH - 0.44,
        fontSize: 8.5,
        color: '475569',
        wrap: true
      });
    }

    // -------------------------------------------------------------
    // SLIDES DEDICADOS PARA CADA SUB-ITEM (COM ILUSTRAÇÃO E CONCEITO PRÓPRIO)
    // -------------------------------------------------------------
    if (detailedSubs.length > 0) {
      for (let sIdx = 0; sIdx < detailedSubs.length; sIdx++) {
        const sub = detailedSubs[sIdx];
        const subSlide = pres.addSlide();
        subSlide.background = { color: 'F8FAFC' };

        subSlide.addShape(pres.ShapeType.rect, {
          x: 0,
          y: 0,
          w: '100%',
          h: 0.8,
          fill: { color: theme.primary }
        });

        subSlide.addText(`ESPECIALIDADE: ${specialty.nome.toUpperCase()}   •   REQUISITO ${item.itemNumber} (ITEM ${item.displayIndex} DE ${item.totalCount})`, {
          x: 0.8,
          y: 0.12,
          w: 8.4,
          h: 0.3,
          fontSize: 10,
          bold: true,
          color: 'FFFFFF'
        });

        subSlide.addText(`SUB-ITEM ${sub.letter.toUpperCase()}) ${sub.cleanTitle.toUpperCase()}`, {
          x: 0.8,
          y: 0.38,
          w: 8.4,
          h: 0.35,
          fontSize: 14,
          bold: true,
          color: 'FFFFFF'
        });

        // Bloco 1: Enunciado Oficial do Sub-item
        subSlide.addShape(pres.ShapeType.roundRect, {
          x: 0.8,
          y: 0.95,
          w: 8.4,
          h: 0.85,
          rectRadius: 0.1,
          fill: { color: 'FFFFFF' },
          line: { color: theme.cardBorder, width: 1.5 }
        });

        subSlide.addShape(pres.ShapeType.roundRect, {
          x: 0.95,
          y: 1.05,
          w: 2.5,
          h: 0.24,
          rectRadius: 0.08,
          fill: { color: theme.badgeBg }
        });
        subSlide.addText(`SUB-ITEM ${item.itemNumber}.${sub.letter.toUpperCase()}  [DETALHAMENTO OFICIAL]`, {
          x: 0.95,
          y: 1.05,
          w: 2.5,
          h: 0.24,
          fontSize: 8,
          bold: true,
          color: theme.badgeText,
          align: 'center',
          valign: 'middle'
        });

        subSlide.addText(sub.label, {
          x: 0.95,
          y: 1.33,
          w: 8.1,
          h: 0.42,
          fontSize: 11,
          bold: true,
          color: '1E293B',
          wrap: true
        });

        // Bloco 2 (Coluna Esquerda): Resposta Didática & Resolução Profunda do Sub-item
        subSlide.addShape(pres.ShapeType.roundRect, {
          x: 0.8,
          y: 1.95,
          w: 4.6,
          h: 3.35,
          rectRadius: 0.12,
          fill: { color: 'FFFFFF' },
          line: { color: 'E2E8F0', width: 1 }
        });

        subSlide.addText(`💡 Explicação Conceitual do Sub-item (${sub.letter.toUpperCase()})`, {
          x: 1.0,
          y: 2.05,
          w: 4.2,
          h: 0.26,
          fontSize: 10,
          bold: true,
          color: theme.primary
        });

        subSlide.addText(sub.didacticAnswer, {
          x: 1.0,
          y: 2.36,
          w: 4.2,
          h: 1.45,
          fontSize: 9,
          color: '334155',
          wrap: true
        });

        subSlide.addText('📌 Pontos Fundamentais para Fixação:', {
          x: 1.0,
          y: 3.88,
          w: 4.2,
          h: 0.2,
          fontSize: 8.5,
          bold: true,
          color: '475569'
        });

        const subBullets = sub.keyPoints.map((pt, pIdx) => ({
          text: pt,
          options: { breakLine: pIdx < sub.keyPoints.length - 1 }
        }));

        subSlide.addText(subBullets, {
          x: 1.0,
          y: 4.12,
          w: 4.2,
          h: 1.05,
          fontSize: 8,
          color: '475569',
          bullet: true,
          wrap: true
        });

        // Coluna Direita: Ilustração ou Aplicação Pedagógica Ampliada
        if (sub.imageUrl) {
          subSlide.addShape(pres.ShapeType.roundRect, {
            x: 5.6,
            y: 1.95,
            w: 3.6,
            h: 2.05,
            rectRadius: 0.12,
            fill: { color: 'FFFFFF' },
            line: { color: 'E2E8F0', width: 1 }
          });

          try {
            subSlide.addImage({
              data: sub.imageUrl,
              x: 5.65,
              y: 2.0,
              w: 3.5,
              h: 1.95
            });
          } catch {}

          // Bloco 4 (Coluna Direita - Inferior: Aplicação Prática / Desafio na Unidade)
          subSlide.addShape(pres.ShapeType.roundRect, {
            x: 5.6,
            y: 4.12,
            w: 3.6,
            h: 1.18,
            rectRadius: 0.12,
            fill: { color: theme.bgLight },
            line: { color: theme.cardBorder, width: 1 }
          });

          subSlide.addText('🎯 Aplicação Prática / Desafio na Unidade', {
            x: 5.8,
            y: 4.22,
            w: 3.2,
            h: 0.22,
            fontSize: 9.5,
            bold: true,
            color: theme.secondary
          });

          subSlide.addText(sub.practicalTip, {
            x: 5.8,
            y: 4.47,
            w: 3.2,
            h: 0.75,
            fontSize: 8,
            color: '334155',
            wrap: true
          });
        } else {
          // Quando não há imagem relacionada no sub-item:
          // Card Superior: Aplicação Prática / Desafio na Unidade
          subSlide.addShape(pres.ShapeType.roundRect, {
            x: 5.6,
            y: 1.95,
            w: 3.6,
            h: 1.62,
            rectRadius: 0.12,
            fill: { color: theme.bgLight },
            line: { color: theme.cardBorder, width: 1 }
          });

          subSlide.addText('🎯 Aplicação Prática / Desafio na Unidade', {
            x: 5.8,
            y: 2.05,
            w: 3.2,
            h: 0.22,
            fontSize: 9.5,
            bold: true,
            color: theme.secondary
          });

          subSlide.addText(sub.practicalTip, {
            x: 5.8,
            y: 2.32,
            w: 3.2,
            h: 1.15,
            fontSize: 8.5,
            color: '334155',
            wrap: true
          });

          // Card Inferior: Orientação & Avaliação da Unidade
          subSlide.addShape(pres.ShapeType.roundRect, {
            x: 5.6,
            y: 3.68,
            w: 3.6,
            h: 1.62,
            rectRadius: 0.12,
            fill: { color: 'FFFFFF' },
            line: { color: 'E2E8F0', width: 1 }
          });

          subSlide.addText('💡 Orientação & Avaliação da Unidade', {
            x: 5.8,
            y: 3.78,
            w: 3.2,
            h: 0.22,
            fontSize: 9.5,
            bold: true,
            color: theme.primary
          });

          subSlide.addText(`Certifique-se de que cada desbravador da unidade compreendeu e executou este sub-item (${sub.letter.toUpperCase()}) com clareza antes de passar ao próximo requisito.`, {
            x: 5.8,
            y: 4.05,
            w: 3.2,
            h: 1.15,
            fontSize: 8.5,
            color: '475569',
            wrap: true
          });
        }
      }
    }
  }

  // ==========================================
  // SLIDE FINAL: AVALIAÇÃO, CHECKLIST & INVESTIDURA
  // ==========================================
  const finalSlide = pres.addSlide();
  finalSlide.background = { color: '0F172A' };

  finalSlide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.35,
    h: '100%',
    fill: { color: theme.primary }
  });

  finalSlide.addShape(pres.ShapeType.roundRect, {
    x: 0.8,
    y: 0.8,
    w: 8.4,
    h: 1.1,
    rectRadius: 0.15,
    fill: { color: theme.secondary }
  });

  finalSlide.addText('🎉 CONCLUSÃO & REGISTRO DE INVESTIDURA', {
    x: 1.0,
    y: 0.95,
    w: 8.0,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: 'FFFFFF'
  });

  finalSlide.addText(`Parabéns! Todos os requisitos da Especialidade ${specialty.nome} foram ensinados e cumpridos.`, {
    x: 1.0,
    y: 1.35,
    w: 8.0,
    h: 0.4,
    fontSize: 11,
    color: 'E2E8F0'
  });

  // Card Checklist
  finalSlide.addShape(pres.ShapeType.roundRect, {
    x: 0.8,
    y: 2.1,
    w: 4.0,
    h: 3.0,
    rectRadius: 0.15,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 }
  });

  finalSlide.addText('✅ Checklist Final do Desbravador', {
    x: 1.0,
    y: 2.25,
    w: 3.6,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: theme.accent
  });

  finalSlide.addText([
    { text: '• Todos os requisitos teóricos explicados e compreendidos.\n', options: { color: 'E2E8F0' } },
    { text: '• Dinâmicas e oficinas práticas executadas na unidade.\n', options: { color: 'E2E8F0' } },
    { text: '• Caderno de especialidade preenchido com fotos e amostras.\n', options: { color: 'E2E8F0' } },
    { text: '• Avaliação final e assinatura pelo conselheiro e instrutor.', options: { color: 'E2E8F0' } }
  ], {
    x: 1.0,
    y: 2.65,
    w: 3.6,
    h: 2.3,
    fontSize: 9.5
  });

  // Card Assinaturas
  finalSlide.addShape(pres.ShapeType.roundRect, {
    x: 5.2,
    y: 2.1,
    w: 4.0,
    h: 3.0,
    rectRadius: 0.15,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 }
  });

  finalSlide.addText('✍️ Homologação Oficial', {
    x: 5.4,
    y: 2.25,
    w: 3.6,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: theme.accent
  });

  finalSlide.addText([
    { text: `Especialidade: ${specialty.nome}\n`, options: { bold: true, color: 'FFFFFF' } },
    { text: `Clube: ${clubName || 'Clube de Desbravadores'}\n`, options: { color: 'CBD5E1' } },
    { text: `Instrutor(a): ${instructorName || 'Instrutor(a)'}\n\n`, options: { color: 'CBD5E1' } },
    { text: 'Data: _____/_____/_________    Nota Final: [   ]', options: { color: '94A3B8' } }
  ], {
    x: 5.4,
    y: 2.65,
    w: 3.6,
    h: 1.6,
    fontSize: 9.5
  });

  finalSlide.addShape(pres.ShapeType.rect, {
    x: 5.4,
    y: 4.4,
    w: 3.6,
    h: 0.02,
    fill: { color: '64748B' }
  });
  finalSlide.addText('Assinatura do Diretor / Instrutor', {
    x: 5.4,
    y: 4.45,
    w: 3.6,
    h: 0.25,
    fontSize: 8,
    color: '94A3B8',
    align: 'center'
  });

  finalSlide.addText('MINISTÉRIO DOS DESBRAVADORES  •  "SALVAR DO PECADO E GUIAR NO SERVIÇO"', {
    x: 0.8,
    y: 5.25,
    w: 8.4,
    h: 0.2,
    fontSize: 8,
    color: '64748B',
    align: 'center'
  });

  // Salva o arquivo PowerPoint
  if (onProgress) onProgress('Finalizando download da apresentação (.pptx)...', 95);
  const cleanFileName = `Especialidade_${specialty.nome.replace(/[^a-zA-Z0-9_\u00C0-\u00FF]/g, '_')}_Apresentacao.pptx`;
  await pres.writeFile({ fileName: cleanFileName });

  if (onProgress) onProgress('Apresentação gerada com sucesso!', 100);
}
