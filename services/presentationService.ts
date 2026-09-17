import pptxgen from 'pptxgenjs';
import { Especialidade, ClubType } from '../types';

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

// Gera um card infográfico estilizado em Canvas para ilustrar sub-itens caso a imagem externa falhe ou esteja offline
export function createIllustratedCanvasCard(
  title: string, 
  letter: string, 
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

    // Fundo em gradiente suave das cores da área
    const grad = ctx.createLinearGradient(0, 0, 640, 380);
    grad.addColorStop(0, `#${primaryColor}`);
    grad.addColorStop(1, `#${secondaryColor}`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 380);

    // Linhas geométricas de estilo moderno
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    for (let r = 70; r <= 310; r += 60) {
      ctx.beginPath();
      ctx.arc(320, 190, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Badge circular da Letra do Sub-item
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.arc(320, 125, 46, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(320, 125, 46, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter.toUpperCase(), 320, 127);

    // Título do Sub-item
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px sans-serif';
    const displayTitle = title.length > 34 ? title.substring(0, 32) + '...' : title;
    ctx.fillText(displayTitle.toUpperCase(), 320, 215);

    // Rótulo pedagógico
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText((categoryLabel || 'GUIA DIDÁTICO ILUSTRADO').toUpperCase(), 320, 250);

    // Rodapé de autenticação oficial
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '11px sans-serif';
    ctx.fillText('CLUBE DE DESBRAVADORES • MATERIAL HOMOLOGADO', 320, 325);

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Erro ao criar card ilustrado em canvas:', err);
    return '';
  }
}

// Seleciona uma imagem de alta qualidade temática e confiável baseada no conteúdo do sub-item
export function getTopicImageUrl(specialtyName: string, subItemText: string, areaName?: string): string {
  const text = `${specialtyName} ${subItemText} ${areaName || ''}`.toLowerCase();

  // 1. Corrida / Atletismo / Trail Run
  if (text.includes('velocidade') || text.includes('sprint') || text.includes('100m')) {
    return 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=700&auto=format&fit=crop&q=80'; // atleta em largada / sprint
  }
  if (text.includes('meio-fundo') || text.includes('meio fundo') || text.includes('800m') || text.includes('1500m')) {
    return 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=700&auto=format&fit=crop&q=80'; // corredor em pista de atletismo
  }
  if (text.includes('fundo') || text.includes('maratona') || text.includes('longa dist') || text.includes('5km') || text.includes('10km')) {
    return 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=700&auto=format&fit=crop&q=80'; // corrida em trilha na natureza
  }
  if (text.includes('tênis') || text.includes('tenis') || text.includes('calçado') || text.includes('calcado')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80'; // tênis esportivo técnico
  }
  if (text.includes('hidrata') || text.includes('água') || text.includes('agua') || text.includes('squeeze') || text.includes('mochila')) {
    return 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=700&auto=format&fit=crop&q=80'; // garrafa de hidratação na natureza
  }
  if (text.includes('alongamento') || text.includes('aquecimento') || text.includes('postura') || text.includes('respira')) {
    return 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&auto=format&fit=crop&q=80'; // alongamento e aquecimento dinâmico
  }
  if (text.includes('corrida') || text.includes('trail') || text.includes('trilha') || text.includes('montanha')) {
    return 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=700&auto=format&fit=crop&q=80';
  }

  // 2. Pioneirismo / Nós / Cordas
  if (text.includes('nó') || text.includes('no ') || text.includes('corda') || text.includes('amarra') || text.includes('volta')) {
    return 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=700&auto=format&fit=crop&q=80';
  }
  if (text.includes('barraca') || text.includes('acampamento') || text.includes('acampar') || text.includes('pioneirismo')) {
    return 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=700&auto=format&fit=crop&q=80';
  }
  if (text.includes('fogo') || text.includes('fogueira') || text.includes('lenha') || text.includes('cozinha')) {
    return 'https://images.unsplash.com/photo-1475483768296-6163e08872a1?w=700&auto=format&fit=crop&q=80';
  }
  if (text.includes('bússola') || text.includes('bussola') || text.includes('mapa') || text.includes('orienta') || text.includes('azimute')) {
    return 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=700&auto=format&fit=crop&q=80';
  }

  // 3. Primeiros Socorros / Saúde
  if (text.includes('socorro') || text.includes('primeiros socorros') || text.includes('curativo') || text.includes('atadura') || text.includes('sangramento') || text.includes('fratura') || text.includes('entorse')) {
    return 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=700&auto=format&fit=crop&q=80';
  }

  // 4. Natureza / Animais / Plantas / Astronomia
  if (text.includes('pássaro') || text.includes('passaro') || text.includes('ave') || text.includes('penas')) {
    return 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=700&auto=format&fit=crop&q=80';
  }
  if (text.includes('árvore') || text.includes('arvore') || text.includes('mata') || text.includes('floresta') || text.includes('madeira')) {
    return 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=700&auto=format&fit=crop&q=80';
  }
  if (text.includes('flor') || text.includes('planta') || text.includes('folha') || text.includes('semente')) {
    return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=700&auto=format&fit=crop&q=80';
  }
  if (text.includes('estrela') || text.includes('constela') || text.includes('astronomia') || text.includes('lua') || text.includes('planeta')) {
    return 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=700&auto=format&fit=crop&q=80';
  }

  // Padrão Geral Ar Livre / Desbravadores
  return 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=700&auto=format&fit=crop&q=80';
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

// Analisa e normaliza a lista de requisitos separando notas preliminares, agrupando sub-itens sob seus respectivos requisitos e mantendo a ordem oficial
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

    // 4. Tenta extrair a numeração oficial da questão com número explícito (ex: "1.", "2 -", "3)", "Item 4:")
    const numberMatch = rawLine.match(/^(?:requisito|item|quest[aã]o)?\s*([0-9]+)\s*[\.\-\)\:]\s*(.*)/i);

    if (numberMatch && numberMatch[1]) {
      const extractedNumber = numberMatch[1].trim();
      const restText = (numberMatch[2] || '').trim();

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
    // Se o requisito anterior terminar com dois pontos ":" ou for uma continuação de lista
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

  // Se todos os itens foram filtrados como notas (caso anômalo), mantém ao menos um item
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

// Constrói detalhamento aprofundado para cada sub-item (com conceito, pontos-chave, desafios e imagem)
export function buildDetailedSubItems(
  subItemStrings: string[], 
  specialty: Especialidade, 
  itemQuestion: string
): DetailedSubItem[] {
  const theme = getAreaTheme(specialty.area);
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

    // Detalhamento contextual especializado para Corrida Rústica / Atletismo
    if (specLower.includes('corrida') || specLower.includes('trail') || qLower.includes('corrida') || qLower.includes('modalidade')) {
      if (titleLower.includes('velocidade') || titleLower.includes('sprint') || titleLower.includes('100m')) {
        didacticAnswer = `A Corrida de Velocidade (ou Sprint) é caracterizada por esforços anaeróbicos aláticos máximos em distâncias curtas (até 400m). Exige largada explosiva (em blocos no atletismo tradicional ou postura baixa na terra), aceleração rápida nas primeiras passadas e manutenção da cadência e amplitude de passada com inclinação corporal equilibrada.`;
        keyPoints = [
          'Potência anaeróbica e aceleração rápida nas primeiras 10 a 15 passadas.',
          'Postura corporal levemente inclinada para frente sem flexão excessiva do tronco.',
          'Apoio exclusivo sobre o antepé (metatarso) para maximizar a propulsão.'
        ];
        practicalTip = 'Treino de Reação: Organize a unidade em linha para realizar 3 tiros de 30m com largadas a partir de comandos sonoros e visuais.';
      } else if (titleLower.includes('meio-fundo') || titleLower.includes('meio fundo') || titleLower.includes('800') || titleLower.includes('1500')) {
        didacticAnswer = `As provas de Meio-Fundo (800m a 3000m) constituem a transição perfeita entre velocidade e resistência aeróbica. O atleta precisa gerenciar o ritmo de passagem por volta, monitorar o limiar de lactato e posicionar-se taticamente no pelotão, guardando energia para uma aceleração final vigorosa nos últimos 200 a 300 metros.`;
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
        didacticAnswer = `O domínio deste sub-item desenvolve a competência técnica e o condicionamento específico do desbravador. Requer compreensão dos princípios fisiológicos envolvidos, treinamento prático supervisionado e autoavaliação contínua da postura corporal e nível de esforço executado.`;
        keyPoints = [
          'Execução correta com observação atenta dos detalhes anatômicos e técnicos.',
          'Repetição consciente durante os treinamentos da unidade.',
          'Registro do desempenho e aprendizado no caderno oficial de requisitos.'
        ];
        practicalTip = 'Demonstração Prática na Unidade: Cada membro executa o movimento sob a orientação do conselheiro para receber correções posturais.';
      }
    } 
    // Detalhamento geral para outras especialidades
    else {
      didacticAnswer = `Para este tópico específico ("${cleanTitle}"), o desbravador deve demonstrar compreensão exata do conceito, identificando suas propriedades fundamentais e sabendo aplicá-lo em atividades práticas do clube, no campo ou em situações cotidianas.`;
      keyPoints = [
        `Compreender e definir com precisão o tópico ${cleanTitle}.`,
        'Relacionar a teoria à prática real vivenciada na unidade ou no lar.',
        'Fixar o conteúdo para apresentação e avaliação pelo instrutor.'
      ];
      practicalTip = `Oficina de Fixação: Debata com a unidade a importância de "${cleanTitle}" e anote 2 exemplos práticos de aplicação no dia a dia.`;
    }

    return {
      letter,
      label: sub,
      cleanTitle,
      didacticAnswer,
      keyPoints,
      practicalTip
    };
  });
}

// Gerador semântico didático local de alta qualidade (substituto definitivo de textos genéricos)
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

  // 1. Resolução especializada para "Corrida Rústica" / "Trail Run"
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
  // 2. Análise por tipo semântico do enunciado geral
  else if (category === 'SEGURANCA' || qLower.includes('primeiros socorros') || qLower.includes('perigo')) {
    didacticAnswer = `Para atender a este requisito, o desbravador deve dominar as regras oficiais de segurança, identificando fatores de risco potenciais antes do início de qualquer atividade. Em situações de emergência, deve-se agir com calma, acionar imediatamente o socorro adulto/médico e aplicar os procedimentos protocolares corretos para preservar vidas e evitar agravamento de lesões.`;
    keyPoints = [
      'Identificar perigos ambientais e falhas de equipamento antes da execução.',
      'Conhecer os números de emergência locais (193 Bombeiros, 192 SAMU).',
      'Priorizar a proteção pessoal do socorrista antes de intervir no local.',
      'Manter kit de primeiros socorros inspecionado e pronto para uso.'
    ];
    practicalActivity = 'Simulação de Conduta Rápida: Organize a unidade em duplas e simule o atendimento e comunicação correta de uma ocorrência simulada.';
    instructorTip = 'Explique com serenidade. Mostre que a disciplina e o treinamento prévio evitam a maior parte dos acidentes em campo.';
  } else if (category === 'PRATICO' || qLower.includes('demonstrar') || qLower.includes('fazer') || qLower.includes('amarrar')) {
    didacticAnswer = `Este requisito exige domínio prático e demonstração habilidosa pelo desbravador. A metodologia didática consiste em: (1) Demonstração orientada do passo a passo pelo instrutor; (2) Treinamento repetido pelos desbravadores na unidade até obter precisão e rapidez; (3) Avaliação prática e registro fotográfico ou em amostra física para o relatório final.`;
    keyPoints = [
      'Executar a técnica com exatidão mecânica e postura correta.',
      'Repetir o exercício até atingir segurança sem hesitação.',
      'Saber explicar o propósito e utilidade prática da técnica demonstrada.',
      'Apresentar o resultado final acabado ao conselheiro da unidade.'
    ];
    practicalActivity = 'Oficina Mão na Massa: Cada membro executa a técnica com supervisão mútua na unidade, tirando dúvidas em tempo real.';
    instructorTip = 'Disponibilize previamente todo o material necessário para que nenhum desbravador fique ocioso durante a instrução.';
  } else if (category === 'PESQUISA' || qLower.includes('pesquisar') || qLower.includes('história') || qLower.includes('bíblia')) {
    didacticAnswer = `O objetivo deste item é estimular a busca de informações fidedignas e a capacidade analítica do desbravador. As respostas devem ser colhidas em fontes confiáveis (manuais oficiais da DSA, literatura especializada ou a Bíblia Sagrada), resumidas com as próprias palavras e debatidas com os colegas de unidade para consolidação do aprendizado.`;
    keyPoints = [
      'Consultar fontes oficiais reconhecidas e materiais de referência confiáveis.',
      'Sintetizar o conteúdo compreendido em redação própria, evitando cópias vazias.',
      'Relacionar o tema pesquisado com valores cristãos e princípios da liderança.',
      'Fixar os tópicos principais no caderno de especialidades da classe.'
    ];
    practicalActivity = 'Roda de Diálogo Bíblico/Científico: Cada desbravador apresenta 1 curiosidade ou lição que aprendeu na pesquisa para sua unidade.';
    instructorTip = 'Instigue o pensamento crítico fazendo perguntas que desafiem os desbravadores a aplicarem o conhecimento à vida diária.';
  } else if (category === 'VIVENCIA' || qLower.includes('visitar') || qLower.includes('acampar') || qLower.includes('caminhada')) {
    didacticAnswer = `A vivência prática e o contato direto com o ambiente constituem o método pedagógico adventista de maior impacto. Este requisito deve ser cumprido preferencialmente em campo, combinando observação minuciosa da natureza, disciplina comunitária de acampamento e reflexão sobre a sabedoria do Criador manifesta no ambiente.`;
    keyPoints = [
      'Participar ativamente com uniforme e espírito de equipe exemplar.',
      'Registrar datas, locais, espécies ou eventos observados durante a visitação.',
      'Praticar os princípios de preservação ecológica e respeito aos moradores locais.',
      'Elaborar um relatório de campo sucinto com fotos ou ilustrações.'
    ];
    practicalActivity = 'Diário de Bordo da Unidade: Anotar as experiências mais marcantes da excursão para montar o mural da unidade na sede.';
    instructorTip = 'Planeje todas as autorizações com antecedência e use as pausas na caminhada para breves momentos de contemplação espiritual.';
  } else {
    // Teórico geral contextualizado
    didacticAnswer = `Para responder a esta questão com rigor pedagógico, o desbravador deve compreender a definição precisa, a importância histórica e a aplicação técnica exigida pelo requisito. O estudo deve conectar o conceito formal às situações cotidianas do clube, capacitando o membro a ensinar o conteúdo aos seus colegas com clareza e autoridade.`;
    keyPoints = [
      'Compreender os termos técnicos e definições específicas deste item.',
      'Diferenciar as propriedades e características fundamentais solicitadas.',
      'Conseguir explicar o conceito de forma simples utilizando vocabulário próprio.',
      'Fixar a matéria através de esquemas visuais, ilustrações ou mapas mentais.'
    ];
    practicalActivity = 'Quiz de Memorização Rápida: Organize uma rodada de perguntas e respostas no estilo "passa ou repassa" entre as unidades para fixar o assunto.';
    instructorTip = 'Utilize analogias práticas e exemplos do cotidiano para tornar conceitos teóricos fáceis de assimilar e inesquecíveis.';
  }

  // Gera os sub-itens detalhados individuais com resolução didática se existirem
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
    instructorTip
  };
}

// Enriquecimento pedagógico via Gemini com alta resiliência e fallback dinâmico
async function enrichRequirementsWithAi(
  specialty: Especialidade, 
  parsedRequirements: ParsedRequirementsResult,
  onProgress?: (status: string, percent: number) => void
): Promise<DidacticRequirement[]> {
  const { items, specialNotes } = parsedRequirements;
  const totalCount = items.length;

  if (onProgress) onProgress('Consultando inteligência pedagógica especializada...', 25);

  const formattedItemsPrompt = items.map(it => {
    let t = `REQUISITO ${it.itemNumber}: ${it.cleanQuestion}`;
    if (it.subItems && it.subItems.length > 0) {
      t += `\nSub-itens deste requisito:\n${it.subItems.map(s => `  • ${s}`).join('\n')}`;
    }
    return t;
  }).join('\n\n');

  const prompt = `Você é um instrutor master e especialista técnico do Clube de Desbravadores da Igreja Adventista do Sétimo Dia.
Para a especialidade "${specialty.nome}" (Área Oficial: ${specialty.area || 'Geral'}, Código DSA: ${specialty.codigo || ''}), responda e elabore o roteiro didático oficial para os seguintes requisitos:

${formattedItemsPrompt}

${specialNotes.length > 0 ? `\nNOTAS/ORIENTAÇÕES DA ESPECIALIDADE:\n${specialNotes.join('\n')}\n` : ''}

INSTRUÇÕES PEDAGÓGICAS E DE CONTEÚDO OBRIGATÓRIAS:
1. RESPONDA CADA QUESTÃO DE FORMA DIRETA, COMPLETA E DETALHADA. É ESTRITAMENTE PROIBIDO gerar respostas evasivas, genéricas ou "encher linguiça".
2. SE O REQUISITO POSSUI SUB-ITENS (letras a, b, c...), ALÉM DA VISÃO GERAL, PREENCHA O ARRAY "subItemsDetailed" com a explicação aprofundada de cada sub-item (campo "didacticAnswer" específico para cada letra, "keyPoints" e "practicalTip").
3. Se a questão pede a DEFINIÇÃO (ex: o que é corrida rústica/trail run), dê a definição exata e técnica da modalidade, características dos terrenos (trilhas naturais, montanhas, sem asfalto), desníveis e regras oficiais.
4. Se pede regras, itens, equipamentos ou nós, cite e explique cada um com clareza.
5. "didacticAnswer": texto denso de 3 a 6 frases de explicação real que respondem a pergunta de verdade para os desbravadores.
6. "keyPoints": array com 3 a 4 tópicos concretos de fixação baseados na resposta dada.
7. "practicalActivity": sugestão de dinâmica prática aplicável no Cantinho da Unidade (5 a 10 min).
8. "instructorTip": conselho pedagógico para o instrutor ensinar o ponto com facilidade.
9. "shortTitle": título curto de 3 a 6 palavras para o slide.

Retorne EXCLUSIVAMENTE um JSON array com os objetos no formato:
[
  {
    "itemNumber": "1",
    "shortTitle": "Título curto do requisito",
    "category": "TEORICO" | "PRATICO" | "PESQUISA" | "VIVENCIA" | "SEGURANCA",
    "didacticAnswer": "Resposta explicativa detalhada e real que responde a pergunta",
    "keyPoints": ["Ponto 1", "Ponto 2", "Ponto 3"],
    "practicalActivity": "Atividade na unidade",
    "instructorTip": "Dica pedagógica",
    "subItemsDetailed": [
      {
        "letter": "a",
        "cleanTitle": "Título do sub-item",
        "didacticAnswer": "Explicação detalhada deste sub-item específico",
        "keyPoints": ["Ponto do sub-item 1", "Ponto 2"],
        "practicalTip": "Dica prática ou desafio para este sub-item"
      }
    ]
  }
]`;

  // 1. Tenta via endpoint do servidor Vite (/api/gemini/generate-didactic)
  try {
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/gemini/generate-didactic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (response.ok) {
        const resJson = await response.json();
        if (resJson && resJson.text) {
          const clean = resJson.text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(clean);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (onProgress) onProgress('Organizando respostas didáticas de alta precisão...', 60);
            return mapAiResponseToRequirements(parsed, items, totalCount, specialty);
          }
        }
      }
    }
  } catch (srvErr) {
    console.warn('Tentativa via rota server-side falhou, tentando chamada direta no cliente:', srvErr);
  }

  // 2. Chamada direta no cliente com @google/genai (modelos resilientes: flash-lite primeiro para economizar cota)
  try {
    const apiKey = (typeof process !== 'undefined' && (process.env?.GEMINI_API_KEY || process.env?.API_KEY)) || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    if (apiKey) {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

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
            if (onProgress) onProgress('Organizando respostas didáticas geradas...', 60);
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
      // Se a IA retornou sub-itens detalhados, utiliza-os; caso contrário, constrói pelo gerador local
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
              practicalTip: sub.practicalTip || 'Demonstração prática orientada pelo instrutor.'
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

// Carrega ou gera a ilustração visual para cada sub-item
async function resolveSubItemIllustration(
  sub: DetailedSubItem, 
  specialty: Especialidade, 
  theme: ReturnType<typeof getAreaTheme>
): Promise<string | null> {
  // 1. Tenta carregar imagem fotográfica temática de alta resolução
  const photoUrl = getTopicImageUrl(specialty.nome, `${sub.cleanTitle} ${sub.label}`, specialty.area);
  try {
    const dataUrl = await loadImageDataUrl(photoUrl);
    if (dataUrl) return dataUrl;
  } catch {}

  // 2. Se falhar ou estiver offline, gera o card ilustrado vetorial em Canvas
  const canvasCard = createIllustratedCanvasCard(
    sub.cleanTitle, 
    sub.letter, 
    theme.primary, 
    theme.secondary,
    specialty.area
  );
  if (canvasCard) return canvasCard;

  // 3. Fallback: logo da especialidade se disponível
  if (specialty.logo) {
    try {
      const logoData = await loadImageDataUrl(specialty.logo);
      if (logoData) return logoData;
    } catch {}
  }

  return null;
}

// Gerador principal da apresentação PowerPoint didática completa
export async function generateSpecialtyPowerPoint(
  specialty: Especialidade, 
  options: PresentationOptions = {}
): Promise<void> {
  const { instructorName, clubName, unitName, includeAiAnswers = true, onProgress } = options;

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
    if (onProgress) onProgress('Carregando insígnia oficial da especialidade...', 12);
    specialtyLogoDataUrl = await loadImageDataUrl(specialty.logo);
  }

  // Analisa e normaliza os requisitos da especialidade agrupando sub-itens
  const rawReqs = specialty.requisitos && specialty.requisitos.length > 0 
    ? specialty.requisitos 
    : ['Completar com êxito todos os itens práticos e teóricos determinados pelo instrutor da especialidade.'];

  const parsedRequirements = parseAndNormalizeRequirements(rawReqs);

  // Obtém os dados didáticos para cada requisito
  let didacticItems: DidacticRequirement[] = [];
  if (includeAiAnswers) {
    didacticItems = await enrichRequirementsWithAi(specialty, parsedRequirements, onProgress);
  } else {
    didacticItems = parsedRequirements.items.map((item, idx) => 
      buildDetailedDidacticData(item, idx + 1, parsedRequirements.items.length, specialty)
    );
  }

  // Carrega ilustrações para todos os sub-itens detalhados
  if (onProgress) onProgress('Preparando ilustrações didáticas para cada sub-item...', 50);
  for (const item of didacticItems) {
    if (item.detailedSubItems && item.detailedSubItems.length > 0) {
      for (const sub of item.detailedSubItems) {
        sub.imageUrl = await resolveSubItemIllustration(sub, specialty, theme);
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
    valign: 'middle',
    wrap: true
  });

  // Subtítulo didático
  slide1.addText('Apresentação Didática, Resoluções & Guia de Ensino Oficial', {
    x: 2.8,
    y: 2.95,
    w: 6.4,
    h: 0.4,
    fontSize: 13,
    color: '94A3B8',
    bold: true
  });

  // Card inferior de informações de aplicação
  slide1.addShape(pres.ShapeType.roundRect, {
    x: 0.8,
    y: 3.75,
    w: 8.4,
    h: 1.35,
    rectRadius: 0.15,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 }
  });

  slide1.addText('DADOS DA INSTRUÇÃO & CLUBE', {
    x: 1.1,
    y: 3.9,
    w: 7.8,
    h: 0.3,
    fontSize: 9,
    bold: true,
    color: theme.accent
  });

  const clubDisplay = clubName || 'Clube de Desbravadores';
  const unitDisplay = unitName ? `Unidade: ${unitName}` : 'Todas as Unidades';
  const instructorDisplay = instructorName || 'Instrutor(a) do Clube';
  const dateDisplay = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  slide1.addText(`Instrutor(a): ${instructorDisplay}   |   ${clubDisplay}   |   ${unitDisplay}\nData de Realização: ${dateDisplay}   |   Material Didático Homologado`, {
    x: 1.1,
    y: 4.25,
    w: 7.8,
    h: 0.7,
    fontSize: 11,
    color: 'E2E8F0',
    wrap: true
  });

  // ==========================================
  // SLIDE 2: VISÃO GERAL & RECOMENDAÇÕES OFICIAIS
  // ==========================================
  const slide2 = pres.addSlide();
  slide2.background = { color: 'F8FAFC' };

  // Header do slide
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
    { text: `Código: ${codeBadge}`, options: { breakLine: true } },
    { text: `Nível de Dificuldade: ${specialty.nivel || 'Nível Básico / Médio'}`, options: { breakLine: true } },
    { text: `Total de Requisitos: ${didacticItems.length} requisitos oficiais homologados`, options: { breakLine: true } },
    { text: `Ano / Origem: ${specialty.ano || specialty.origem || 'Divisão Sul-Americana (DSA)'}`, options: { breakLine: true } },
    { text: `Metodologia: Respostas conceituais fundamentadas, slides individuais ilustrados para cada sub-item e dinâmicas na unidade.`, options: {} }
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
      { text: 'Apresente os slides projetados estimulando os membros a responderem antes de ver a resolução.', options: { breakLine: true } },
      { text: '2. Fixação Teórica Real:', options: { bold: true, breakLine: true } },
      { text: 'Analise os pontos conceituais de cada questão sem deixar dúvidas conceituais abertas.', options: { breakLine: true } },
      { text: '3. Demonstração Prática:', options: { bold: true, breakLine: true } },
      { text: 'Execute as dinâmicas propostas no Cantinho da Unidade pelo método "aprender fazendo".', options: { breakLine: true } },
      { text: '4. Caderno & Registro:', options: { bold: true, breakLine: true } },
      { text: 'Oriente cada desbravador a registrar o aprendizado para a aprovação final.', options: {} }
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
  // SLIDES DIDÁTICOS DE REQUISITOS & SUB-ITENS INDIVIDUAIS ILUSTRADOS
  // ==========================================
  for (let i = 0; i < didacticItems.length; i++) {
    const item = didacticItems[i];
    const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);
    const detailedSubs = item.detailedSubItems || [];

    // -------------------------------------------------------------
    // SLIDE A: REQUISITO PRINCIPAL (VISÃO GERAL DO REQUISITO)
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

    // Bloco 1: Enunciado Oficial da Questão / Requisito
    const qBoxHeight = hasSubItems ? (item.subItems!.length > 3 ? 1.3 : 1.15) : 1.05;

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: 0.92,
      w: 8.4,
      h: qBoxHeight,
      rectRadius: 0.1,
      fill: { color: 'FFFFFF' },
      line: { color: theme.cardBorder, width: 1.5 }
    });

    // Badge do requisito numerado fielmente
    const badgeText = hasSubItems 
      ? `REQUISITO ${item.itemNumber}  [${item.category}] • COM ${item.subItems!.length} SUB-ITENS DETALHADOS A SEGUIR`
      : `REQUISITO ${item.itemNumber}  [${item.category}]`;

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.95,
      y: 1.02,
      w: hasSubItems ? 3.8 : 1.8,
      h: 0.26,
      rectRadius: 0.08,
      fill: { color: theme.badgeBg }
    });

    slide.addText(badgeText, {
      x: 0.95,
      y: 1.02,
      w: hasSubItems ? 3.8 : 1.8,
      h: 0.26,
      fontSize: 8,
      bold: true,
      color: theme.badgeText,
      align: 'center',
      valign: 'middle'
    });

    // Enunciado oficial da pergunta
    slide.addText(item.cleanQuestion, {
      x: 0.95,
      y: 1.32,
      w: 8.1,
      h: hasSubItems ? 0.32 : 0.55,
      fontSize: 10,
      bold: true,
      color: '1E293B',
      wrap: true
    });

    // Se houver sub-itens, exibe uma lista preliminar organizada
    if (hasSubItems) {
      if (item.subItems!.length <= 4) {
        const subText = item.subItems!.map(s => `• ${s}`).join('     ');
        slide.addText(subText, {
          x: 0.95,
          y: 1.66,
          w: 8.1,
          h: qBoxHeight - 0.76,
          fontSize: 8.5,
          color: theme.secondary,
          bold: true,
          wrap: true
        });
      } else {
        const half = Math.ceil(item.subItems!.length / 2);
        const col1 = item.subItems!.slice(0, half).map(s => `• ${s}`).join('\n');
        const col2 = item.subItems!.slice(half).map(s => `• ${s}`).join('\n');

        slide.addText(col1, {
          x: 0.95,
          y: 1.66,
          w: 3.9,
          h: qBoxHeight - 0.76,
          fontSize: 8,
          color: theme.secondary,
          bold: true,
          wrap: true
        });
        slide.addText(col2, {
          x: 5.0,
          y: 1.66,
          w: 4.0,
          h: qBoxHeight - 0.76,
          fontSize: 8,
          color: theme.secondary,
          bold: true,
          wrap: true
        });
      }
    }

    // Colunas inferiores do Requisito Pai
    const contentY = 0.92 + qBoxHeight + 0.12;
    const contentH = Math.max(2.8, 5.4 - contentY);

    // Bloco 2 (Coluna Esquerda): Resposta Didática & Resolução do Requisito Geral
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.8,
      y: contentY,
      w: 4.6,
      h: contentH,
      rectRadius: 0.12,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', width: 1 }
    });

    slide.addText('💡 Resumo Didático do Requisito', {
      x: 1.0,
      y: contentY + 0.1,
      w: 4.2,
      h: 0.28,
      fontSize: 10.5,
      bold: true,
      color: theme.primary
    });

    slide.addText(item.didacticAnswer, {
      x: 1.0,
      y: contentY + 0.4,
      w: 4.2,
      h: contentH * 0.44,
      fontSize: hasSubItems ? 8.5 : 9.5,
      color: '334155',
      wrap: true
    });

    // Pontos-chave essenciais
    slide.addText('Pontos Fundamentais para Fixação:', {
      x: 1.0,
      y: contentY + (contentH * 0.44) + 0.45,
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
      y: contentY + (contentH * 0.44) + 0.68,
      w: 4.2,
      h: contentH - ((contentH * 0.44) + 0.72),
      fontSize: 8,
      color: '475569',
      bullet: true,
      wrap: true
    });

    // Bloco 3 (Coluna Direita - Superior): Dinâmica Prática na Unidade
    const rightTopH = (contentH - 0.15) * 0.48;
    const rightBottomH = (contentH - 0.15) * 0.52;
    const rightBottomY = contentY + rightTopH + 0.15;

    slide.addShape(pres.ShapeType.roundRect, {
      x: 5.6,
      y: contentY,
      w: 3.6,
      h: rightTopH,
      rectRadius: 0.12,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', width: 1 }
    });

    slide.addText('⚡ Dinâmica / Oficina Prática na Unidade', {
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
      y: contentY + 0.35,
      w: 3.2,
      h: rightTopH - 0.45,
      fontSize: 8,
      color: '475569',
      wrap: true
    });

    // Bloco 4 (Coluna Direita - Inferior): Dica Pedagógica e Notificação dos Sub-itens
    slide.addShape(pres.ShapeType.roundRect, {
      x: 5.6,
      y: rightBottomY,
      w: 3.6,
      h: rightBottomH,
      rectRadius: 0.12,
      fill: { color: theme.bgLight },
      line: { color: theme.cardBorder, width: 1 }
    });

    slide.addText('🎓 Roteiro Didático da Unidade', {
      x: 5.8,
      y: rightBottomY + 0.1,
      w: 3.2,
      h: 0.22,
      fontSize: 9.5,
      bold: true,
      color: theme.primary
    });

    slide.addText(hasSubItems 
      ? `Este requisito possui ${item.subItems!.length} sub-itens específicos. A seguir, cada um deles será detalhado e ilustrado em seu próprio slide individual!`
      : item.instructorTip, {
      x: 5.8,
      y: rightBottomY + 0.35,
      w: 3.2,
      h: rightBottomH * 0.55,
      fontSize: 8,
      color: '334155',
      wrap: true
    });

    slide.addText(hasSubItems ? '👉 Veja os slides seguintes com as resoluções e fotos de cada letra' : '[ Espaço do Desbravador: Anote dúvidas ou conclusões práticas da reunião ]', {
      x: 5.8,
      y: rightBottomY + (rightBottomH * 0.55) + 0.35,
      w: 3.2,
      h: 0.3,
      fontSize: 7.5,
      bold: hasSubItems,
      color: hasSubItems ? theme.primary : '94A3B8',
      align: 'center',
      valign: 'middle'
    });

    // -------------------------------------------------------------
    // SLIDES DEDICADOS PARA CADA SUB-ITEM (COM ILUSTRAÇÃO E CONCEITO)
    // -------------------------------------------------------------
    if (detailedSubs.length > 0) {
      for (let sIdx = 0; sIdx < detailedSubs.length; sIdx++) {
        const sub = detailedSubs[sIdx];
        const subSlide = pres.addSlide();
        subSlide.background = { color: 'F8FAFC' };

        // Topo com sincronia e indicação clara de sub-item
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
          h: 0.88,
          rectRadius: 0.1,
          fill: { color: 'FFFFFF' },
          line: { color: theme.cardBorder, width: 1.5 }
        });

        subSlide.addShape(pres.ShapeType.roundRect, {
          x: 0.95,
          y: 1.05,
          w: 2.5,
          h: 0.26,
          rectRadius: 0.08,
          fill: { color: theme.badgeBg }
        });
        subSlide.addText(`SUB-ITEM ${item.itemNumber}.${sub.letter.toUpperCase()}  [DETALHAMENTO OFICIAL]`, {
          x: 0.95,
          y: 1.05,
          w: 2.5,
          h: 0.26,
          fontSize: 8,
          bold: true,
          color: theme.badgeText,
          align: 'center',
          valign: 'middle'
        });

        subSlide.addText(sub.label, {
          x: 0.95,
          y: 1.35,
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
          h: 0.28,
          fontSize: 10.5,
          bold: true,
          color: theme.primary
        });

        subSlide.addText(sub.didacticAnswer, {
          x: 1.0,
          y: 2.38,
          w: 4.2,
          h: 1.45,
          fontSize: 9,
          color: '334155',
          wrap: true
        });

        subSlide.addText('Pontos Fundamentais para Fixação:', {
          x: 1.0,
          y: 3.9,
          w: 4.2,
          h: 0.22,
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
          y: 4.15,
          w: 4.2,
          h: 1.05,
          fontSize: 8,
          color: '475569',
          bullet: true,
          wrap: true
        });

        // Bloco 3 (Coluna Direita - Superior: Ilustração / Imagem Temática)
        subSlide.addShape(pres.ShapeType.roundRect, {
          x: 5.6,
          y: 1.95,
          w: 3.6,
          h: 2.05,
          rectRadius: 0.12,
          fill: { color: 'FFFFFF' },
          line: { color: 'E2E8F0', width: 1 }
        });

        if (sub.imageUrl) {
          try {
            subSlide.addImage({
              data: sub.imageUrl,
              x: 5.65,
              y: 2.0,
              w: 3.5,
              h: 1.95
            });
          } catch {
            // Fallback silencioso para texto descritivo
            subSlide.addText(`📸 Ilustração Temática: ${sub.cleanTitle}`, {
              x: 5.8,
              y: 2.75,
              w: 3.2,
              h: 0.5,
              fontSize: 10,
              bold: true,
              color: theme.primary,
              align: 'center'
            });
          }
        }

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
    w: '100%',
    h: 0.15,
    fill: { color: theme.primary }
  });

  finalSlide.addText('AVALIAÇÃO PRÁTICA & REGISTRO DE INVESTIDURA', {
    x: 0.8,
    y: 0.4,
    w: 8.4,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: 'FFFFFF',
    align: 'center'
  });

  finalSlide.addText(`Conclusão da Especialidade ${specialty.nome} (${codeBadge})`, {
    x: 0.8,
    y: 0.85,
    w: 8.4,
    h: 0.3,
    fontSize: 12,
    color: theme.accent,
    align: 'center',
    bold: true
  });

  // Box 1: Checklist de Requisitos Concluídos
  finalSlide.addShape(pres.ShapeType.roundRect, {
    x: 0.8,
    y: 1.35,
    w: 4.0,
    h: 3.65,
    rectRadius: 0.15,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 }
  });

  finalSlide.addText('✓ Checklist dos Requisitos', {
    x: 1.0,
    y: 1.5,
    w: 3.6,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: 'FFFFFF'
  });

  const checklistLines = didacticItems.slice(0, 10).map((it) => ({
    text: `[   ]  Requisito ${it.itemNumber}: ${it.shortTitle}`,
    options: { breakLine: true }
  }));

  if (didacticItems.length > 10) {
    checklistLines.push({
      text: `... e mais ${didacticItems.length - 10} requisitos complementares cumpridos.`,
      options: { breakLine: false }
    });
  }

  finalSlide.addText(checklistLines, {
    x: 1.0,
    y: 1.9,
    w: 3.6,
    h: 2.9,
    fontSize: 8.5,
    color: 'CBD5E1',
    wrap: true
  });

  // Box 2: Assinaturas Oficiais para Homologação
  finalSlide.addShape(pres.ShapeType.roundRect, {
    x: 5.2,
    y: 1.35,
    w: 4.0,
    h: 3.65,
    rectRadius: 0.15,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 }
  });

  finalSlide.addText('✍️ Homologação & Assinaturas', {
    x: 5.4,
    y: 1.5,
    w: 3.6,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: 'FFFFFF'
  });

  const signatureBoxes = [
    { title: 'Desbravador(a):', y: 2.05 },
    { title: 'Instrutor(a) Avaliador(a):', y: 2.85 },
    { title: 'Diretor(a) do Clube de Desbravadores:', y: 3.65 }
  ];

  signatureBoxes.forEach(box => {
    finalSlide.addText(box.title, {
      x: 5.4,
      y: box.y,
      w: 3.6,
      h: 0.25,
      fontSize: 9,
      bold: true,
      color: theme.accent
    });
    finalSlide.addShape(pres.ShapeType.line, {
      x: 5.4,
      y: box.y + 0.5,
      w: 3.6,
      h: 0,
      line: { color: '64748B', width: 1, dashType: 'dash' }
    });
    finalSlide.addText('Assinatura e Data', {
      x: 5.4,
      y: box.y + 0.52,
      w: 3.6,
      h: 0.2,
      fontSize: 7.5,
      color: '64748B',
      align: 'right'
    });
  });

  finalSlide.addText('"Tudo o que fizerem, façam de todo o coração, como para o Senhor." (Colossenses 3:23)', {
    x: 5.4,
    y: 4.45,
    w: 3.6,
    h: 0.45,
    fontSize: 8,
    italic: true,
    color: '94A3B8',
    align: 'center',
    wrap: true
  });

  if (onProgress) onProgress('Gerando arquivo final do PowerPoint (.pptx)...', 90);

  // 3. Salva e inicia o download do arquivo .pptx
  const safeTitle = specialty.nome
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_');
  const filename = `${safeTitle}_Apresentacao_Didatica.pptx`;

  await pres.writeFile({ fileName: filename });

  if (onProgress) onProgress('Apresentação gerada com sucesso!', 100);
}
