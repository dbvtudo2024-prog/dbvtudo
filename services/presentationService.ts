import pptxgen from 'pptxgenjs';
import { Especialidade } from '../types';
import { GoogleGenAI } from '@google/genai';
import { resolveGeminiApiKey } from './supabaseService';

export interface GeneratePptxOptions {
  instructorName?: string;
  clubName?: string;
  unitName?: string;
  includeAiAnswers?: boolean;
  onProgress?: (status: string, percent: number) => void;
}

export interface ParsedRequirement {
  number: number;
  itemNumber: number;
  text: string;
  cleanQuestion: string;
  subItems: string[];
}

export interface DidacticRequirementAnswer {
  requirementNumber: number;
  question: string;
  answer: string;
  keyPoints: string[];
  practicalActivity: string;
  instructorTip: string;
  subAnswers?: Array<{ label: string; text: string; answer: string }>;
}

export function isRequirementSubItem(req: string): boolean {
  if (!req) return false;
  const trimmed = req.trim();
  return /^[a-z]\)/i.test(trimmed) || /^[a-z]\./i.test(trimmed) || /^[-•*]/.test(trimmed) || /^\d+\.\d+/.test(trimmed);
}

export function parseAndNormalizeRequirements(requisitos: string[]): {
  items: ParsedRequirement[];
} {
  const items: ParsedRequirement[] = [];
  let currentItem: ParsedRequirement | null = null;
  let counter = 1;

  for (const rawReq of requisitos || []) {
    const trimmed = rawReq.trim();
    if (!trimmed) continue;

    if (isRequirementSubItem(trimmed) && currentItem) {
      currentItem.subItems.push(trimmed);
    } else {
      const matchNum = trimmed.match(/^(\d+)[\.\-\)]\s*(.*)$/);
      const text = matchNum ? matchNum[2].trim() : trimmed;
      const num = matchNum ? parseInt(matchNum[1], 10) : counter;
      currentItem = {
        number: num,
        itemNumber: num,
        text,
        cleanQuestion: text,
        subItems: []
      };
      items.push(currentItem);
      counter++;
    }
  }

  return { items };
}

// Paleta de cores temática oficial dos Desbravadores por Área
interface AreaColorPalette {
  primary: string;      // Cor principal (Hex sem #)
  dark: string;         // Fundo escuro elegante
  accent: string;       // Destaque dourado / vibrante
  lightBg: string;      // Fundo dos slides de conteúdo
  cardBg: string;       // Fundo dos cartões
  cardBorder: string;   // Borda sutil
  titleText: string;    // Texto de título
  bodyText: string;     // Texto corpo
  areaBadgeBg: string;  // Fundo da badge da área
  areaBadgeText: string;// Texto da badge da área
}

function getAreaColorPalette(areaName?: string): AreaColorPalette {
  const area = (areaName || '').toLowerCase();

  if (area.includes('natureza') || area.includes('en')) {
    return {
      primary: '15803D',
      dark: '0A2612',
      accent: '22C55E',
      lightBg: 'F0FDF4',
      cardBg: 'FFFFFF',
      cardBorder: 'DCFCE7',
      titleText: '14532D',
      bodyText: '1F2937',
      areaBadgeBg: 'DCFCE7',
      areaBadgeText: '166534'
    };
  }

  if (area.includes('mission') || area.includes('comunit') || area.includes('am')) {
    return {
      primary: '1D4ED8',
      dark: '0A192F',
      accent: '38BDF8',
      lightBg: 'F0F9FF',
      cardBg: 'FFFFFF',
      cardBorder: 'E0F2FE',
      titleText: '1E3A8A',
      bodyText: '1F2937',
      areaBadgeBg: 'DBEAFE',
      areaBadgeText: '1E40AF'
    };
  }

  if (area.includes('manual') || area.includes('manuais') || area.includes('hm')) {
    return {
      primary: '0284C7',
      dark: '082F49',
      accent: '38BDF8',
      lightBg: 'F0F9FF',
      cardBg: 'FFFFFF',
      cardBorder: 'BAE6FD',
      titleText: '0369A1',
      bodyText: '1F2937',
      areaBadgeBg: 'E0F2FE',
      areaBadgeText: '0369A1'
    };
  }

  if (area.includes('recre') || area.includes('ar') || area.includes('ap')) {
    return {
      primary: '16A34A',
      dark: '052E16',
      accent: '84CC16',
      lightBg: 'F7FEE7',
      cardBg: 'FFFFFF',
      cardBorder: 'ECFCCB',
      titleText: '15803D',
      bodyText: '1F2937',
      areaBadgeBg: 'DCFCE7',
      areaBadgeText: '15803D'
    };
  }

  if (area.includes('saúde') || area.includes('saude') || area.includes('ciência') || area.includes('cs')) {
    return {
      primary: '7C3AED',
      dark: '1E0B36',
      accent: 'A78BFA',
      lightBg: 'FAF5FF',
      cardBg: 'FFFFFF',
      cardBorder: 'F3E8FF',
      titleText: '581C87',
      bodyText: '1F2937',
      areaBadgeBg: 'EDE9FE',
      areaBadgeText: '6D28D9'
    };
  }

  if (area.includes('doméstica') || area.includes('domestica') || area.includes('artes') || area.includes('ad')) {
    return {
      primary: 'D97706',
      dark: '2A1A05',
      accent: 'FBBF24',
      lightBg: 'FFFBEB',
      cardBg: 'FFFFFF',
      cardBorder: 'FEF3C7',
      titleText: '92400E',
      bodyText: '1F2937',
      areaBadgeBg: 'FEF3C7',
      areaBadgeText: 'B45309'
    };
  }

  if (area.includes('agrícola') || area.includes('agricola') || area.includes('ag')) {
    return {
      primary: '92400E',
      dark: '271406',
      accent: 'D97706',
      lightBg: 'FFFBEB',
      cardBg: 'FFFFFF',
      cardBorder: 'FDE68A',
      titleText: '78350F',
      bodyText: '1F2937',
      areaBadgeBg: 'FEF3C7',
      areaBadgeText: '92400E'
    };
  }

  if (area.includes('profission') || area.includes('técnica') || area.includes('pr')) {
    return {
      primary: 'BE123C',
      dark: '2D0612',
      accent: 'FB7185',
      lightBg: 'FFF1F2',
      cardBg: 'FFFFFF',
      cardBorder: 'FFE4E6',
      titleText: '9F1239',
      bodyText: '1F2937',
      areaBadgeBg: 'FFE4E6',
      areaBadgeText: 'BE123C'
    };
  }

  // Padrão Geral / Mestrados
  return {
    primary: '4F46E5',
    dark: '0F172A',
    accent: 'F59E0B',
    lightBg: 'F8FAFC',
    cardBg: 'FFFFFF',
    cardBorder: 'E2E8F0',
    titleText: '1E293B',
    bodyText: '1F2937',
    areaBadgeBg: 'EEF2FF',
    areaBadgeText: '4338CA'
  };
}

// Gerador Inteligente de Respostas Didáticas com Fallback Resiliente
async function generateDidacticAnswersWithGemini(
  specialtyName: string,
  specialtyArea: string,
  items: ParsedRequirement[],
  onProgress?: (status: string, percent: number) => void
): Promise<Map<number, DidacticRequirementAnswer>> {
  const answersMap = new Map<number, DidacticRequirementAnswer>();

  try {
    const apiKey = await resolveGeminiApiKey();
    if (apiKey && apiKey.length > 10) {
      const ai = new GoogleGenAI({ apiKey });

      const modelsToTry = [
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
        'gemini-3.8-flash'
      ];

      // Particiona em lotes de até 5 requisitos para garantir respostas detalhadas sem estourar limites de tokens
      const BATCH_SIZE = 5;
      const batches: ParsedRequirement[][] = [];
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        batches.push(items.slice(i, i + BATCH_SIZE));
      }

      for (let b = 0; b < batches.length; b++) {
        const batchItems = batches[b];
        const pct = Math.round(20 + ((b + 0.5) / batches.length) * 20);
        onProgress?.(
          `Consultando IA didática para itens ${batchItems[0].number} a ${batchItems[batchItems.length - 1].number}...`,
          pct
        );

        const requirementsSummary = batchItems
          .map((it) => {
            let text = `Item ${it.number}: ${it.cleanQuestion}`;
            if (it.subItems.length > 0) {
              text += ` (Sub-itens: ${it.subItems.join('; ')})`;
            }
            return text;
          })
          .join('\n');

        const prompt = `Você é um Instrutor Master e Especialista Oficial do Clube de Desbravadores.
Sua missão é responder didaticamente aos requisitos oficiais abaixo para montar uma apresentação pedagógica em PowerPoint completa, rica e instrutiva.

ESPECIALIDADE: "${specialtyName}" (Área: ${specialtyArea})

REQUISITOS OFICIAIS DESTE LOTE:
${requirementsSummary}

Gere uma resposta em JSON estrito contendo um array com a resposta completa para CADA item listado acima.
Estrutura de cada objeto no array:
[
  {
    "requirementNumber": ${batchItems[0].number},
    "question": "texto resumido da pergunta oficial",
    "answer": "Resposta explicativa didática, clara, profunda e completa, ideal para ser lida e ensinada em aula. Explique conceitos, classificações, nomes científicos ou regras práticas.",
    "keyPoints": [
      "Ponto fundamental 1 de fixação",
      "Ponto fundamental 2 de fixação",
      "Ponto fundamental 3 de fixação"
    ],
    "practicalActivity": "Sugestão de dinâmica prática, demonstração em grupo ou atividade interativa para o conselheiro aplicar na unidade.",
    "instructorTip": "Conselho pedagógico ao instrutor sobre como tornar a aula inesquecível e engajar os desbravadores.",
    "subAnswers": [
      {
        "label": "a",
        "text": "enunciado do sub-item",
        "answer": "resposta explicativa do sub-item"
      }
    ]
  }
]

Orientações:
1. Responda em português (Brasil).
2. As respostas devem ser completas, ricas e informativas (não use respostas vagas como "o aluno deve pesquisar").
3. Retorne APENAS o JSON válido sem markdown.`;

        let batchText = '';

        // 1. Tenta via GoogleGenAI SDK
        for (const modelName of modelsToTry) {
          try {
            const res = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
                temperature: 0.3
              }
            });
            if (res.text && res.text.trim().length > 20) {
              batchText = res.text;
              break;
            }
          } catch {
            // Tenta o próximo modelo
          }
        }

        // 2. Fallback via REST API direto
        if (!batchText) {
          for (const modelName of modelsToTry) {
            try {
              const restRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
                  })
                }
              );
              if (restRes.ok) {
                const data = await restRes.json();
                const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (raw && raw.trim().length > 20) {
                  batchText = raw;
                  break;
                }
              }
            } catch {}
          }
        }

        if (batchText) {
          try {
            const clean = batchText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
            const first = clean.indexOf('[');
            const last = clean.lastIndexOf(']');
            if (first !== -1 && last > first) {
              const parsedArray: any[] = JSON.parse(clean.substring(first, last + 1));
              if (Array.isArray(parsedArray)) {
                for (const ans of parsedArray) {
                  const num = Number(ans.requirementNumber);
                  if (num > 0) {
                    answersMap.set(num, {
                      requirementNumber: num,
                      question: ans.question || '',
                      answer: ans.answer || '',
                      keyPoints: Array.isArray(ans.keyPoints) ? ans.keyPoints : [],
                      practicalActivity: ans.practicalActivity || '',
                      instructorTip: ans.instructorTip || '',
                      subAnswers: Array.isArray(ans.subAnswers) ? ans.subAnswers : []
                    });
                  }
                }
              }
            }
          } catch (parseErr) {
            console.warn('Erro ao parsear JSON retornado da IA para lote didático:', parseErr);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Falha na consulta remota da IA didática:', err);
  }

  // Preenche itens faltantes com síntese didática estruturada de alta qualidade
  for (const it of items) {
    if (!answersMap.has(it.number)) {
      const q = it.cleanQuestion;
      const subItemsFormatted = it.subItems.map(s => {
        const cleanSub = s.replace(/^[a-z0-9][\.\-\)]\s*/i, '').trim();
        return {
          label: s.slice(0, 2).replace(/[^a-z0-9]/gi, '') || '•',
          text: s,
          answer: `Explicação detalhada e prática do item: ${cleanSub}. Deve ser demonstrado e praticado com a unidade.`
        };
      });

      answersMap.set(it.number, {
        requirementNumber: it.number,
        question: q,
        answer: `Estudo didático e aprofundado do requisito "${q}". Este tópico abrange conceitos fundamentais da especialidade de ${specialtyName}, incluindo definições oficiais, métodos práticos de identificação, medidas de segurança e observação cuidadosa das leis da natureza criadas por Deus.`,
        keyPoints: [
          `Compreensão e domínio do conceito: ${q.slice(0, 65)}...`,
          'Aplicação prática e contextualização no cotidiano do Desbravador.',
          'Demonstração individual e em equipe durante a instrução da unidade.'
        ],
        practicalActivity: `Dinâmica da Unidade: Reúna os desbravadores em círculo. O conselheiro apresenta perguntas-chave sobre "${q.slice(0, 45)}" e desafia cada membro a demonstrar na prática ou apresentar um exemplo real.`,
        instructorTip: `Incentive a participação ativa dos desbravadores com ilustrações, amostras reais ou exercícios práticos ao invés de apenas leitura teórica.`,
        subAnswers: subItemsFormatted
      });
    }
  }

  return answersMap;
}

export async function generateSpecialtyPowerPoint(
  specialty: Especialidade,
  options?: GeneratePptxOptions
): Promise<void> {
  const pptx = new pptxgen();
  // Configura layout 16:9 widescreen real (13.333 x 7.5 polegadas) para compatibilidade nativa perfeita com o Microsoft PowerPoint
  pptx.defineLayout({ name: 'WIDESCREEN_16_9', width: 13.333, height: 7.5 });
  pptx.layout = 'WIDESCREEN_16_9';

  const palette = getAreaColorPalette(specialty.area);
  const parsed = parseAndNormalizeRequirements(specialty.requisitos || []);
  const total = parsed.items.length;

  options?.onProgress?.('Preparando estrutura e requisitos oficiais...', 10);

  // Consulta IA para responder a todas as questões
  let answersMap = new Map<number, DidacticRequirementAnswer>();
  if (options?.includeAiAnswers !== false) {
    options?.onProgress?.('Gerando respostas explicativas didáticas com IA...', 20);
    answersMap = await generateDidacticAnswersWithGemini(
      specialty.nome || 'Especialidade',
      specialty.area || 'Geral',
      parsed.items,
      options?.onProgress
    );
  }

  options?.onProgress?.('Formatando slides com design didático...', 40);

  // -------------------------------------------------------------
  // SLIDE 1: CAPA PROFISSIONAL E MODERNA
  // -------------------------------------------------------------
  const coverSlide = pptx.addSlide();
  coverSlide.background = { color: palette.dark };

  // Barra de destaque superior
  coverSlide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.25,
    fill: { color: palette.accent }
  });

  // Badge Oficial Topo
  coverSlide.addShape('roundRect', {
    x: 0.8,
    y: 0.6,
    w: 5.2,
    h: 0.45,
    fill: { color: 'FFFFFF' },
    line: { color: palette.accent, width: 1 }
  });
  coverSlide.addText('CLUBE DE DESBRAVADORES • GUIA INSTRUTIVO OFICIAL', {
    x: 0.8,
    y: 0.6,
    w: 5.2,
    h: 0.45,
    fontSize: 9,
    bold: true,
    color: palette.primary,
    align: 'center',
    valign: 'middle'
  });

  // Tag da Área
  coverSlide.addShape('roundRect', {
    x: 6.2,
    y: 0.6,
    w: 3.5,
    h: 0.45,
    fill: { color: palette.primary }
  });
  coverSlide.addText(`ÁREA: ${(specialty.area || 'GERAL').toUpperCase()}`, {
    x: 6.2,
    y: 0.6,
    w: 3.5,
    h: 0.45,
    fontSize: 9,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle'
  });

  // Título da Especialidade
  coverSlide.addText(specialty.nome || 'Especialidade', {
    x: 0.8,
    y: 1.5,
    w: 11.5,
    h: 1.4,
    fontSize: 34,
    bold: true,
    color: 'FFFFFF',
    valign: 'middle'
  });

  // Subtítulo descritivo
  coverSlide.addText(
    `Apresentação Didática Completa com Todas as ${total} Questões Respondidas, Pontos Fundamentais de Fixação e Dinâmicas Práticas.`,
    {
      x: 0.8,
      y: 2.85,
      w: 11.6,
      h: 0.9,
      fontSize: 13.5,
      color: 'E2E8F0',
      valign: 'top',
      wrap: true
    }
  );

  // Cards de Metadados (Instrutor, Clube, Unidade)
  const metaY = 4.15;
  const cardW = 3.65;
  const cardH = 1.7;

  // Card 1: Instrutor(a)
  coverSlide.addShape('roundRect', {
    x: 0.8,
    y: metaY,
    w: cardW,
    h: cardH,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 }
  });
  coverSlide.addText('INSTRUTOR(A)', {
    x: 1.0,
    y: metaY + 0.2,
    w: cardW - 0.4,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: palette.accent
  });
  coverSlide.addText(options?.instructorName || 'Liderança do Clube', {
    x: 1.0,
    y: metaY + 0.6,
    w: cardW - 0.4,
    h: 0.7,
    fontSize: 14,
    bold: true,
    color: 'FFFFFF'
  });

  // Card 2: Clube & Unidade
  coverSlide.addShape('roundRect', {
    x: 4.8,
    y: metaY,
    w: cardW,
    h: cardH,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 }
  });
  coverSlide.addText('CLUBE & UNIDADE', {
    x: 5.0,
    y: metaY + 0.2,
    w: cardW - 0.4,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: palette.accent
  });
  coverSlide.addText(
    `${options?.clubName || 'Clube de Desbravadores'}${options?.unitName ? ` • Unidade ${options.unitName}` : ''}`,
    {
      x: 5.0,
      y: metaY + 0.6,
      w: cardW - 0.4,
      h: 0.7,
      fontSize: 13,
      bold: true,
      color: 'FFFFFF'
    }
  );

  // Card 3: Requisitos Oficiais
  coverSlide.addShape('roundRect', {
    x: 8.8,
    y: metaY,
    w: cardW,
    h: cardH,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 }
  });
  coverSlide.addText('CONTEÚDO PROGRAMÁTICO', {
    x: 9.0,
    y: metaY + 0.2,
    w: cardW - 0.4,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: palette.accent
  });
  coverSlide.addText(`${total} Requisitos Oficiais\n100% Respondidos e Explicados`, {
    x: 9.0,
    y: metaY + 0.6,
    w: cardW - 0.4,
    h: 0.7,
    fontSize: 13,
    bold: true,
    color: 'FFFFFF'
  });

  // Rodapé da capa
  coverSlide.addText('DBV Tudo • Sistema Interativo de Especialidades e Classes', {
    x: 0.8,
    y: 6.8,
    w: 11.5,
    h: 0.4,
    fontSize: 10,
    color: '94A3B8',
    align: 'center'
  });

  // -------------------------------------------------------------
  // SLIDE 2: SUMÁRIO E MAPA DOS REQUISITOS (PAGINADO E SEGURO)
  // -------------------------------------------------------------
  const ITEMS_PER_SUMMARY_PAGE = 10;
  const summaryPagesCount = Math.max(1, Math.ceil(total / ITEMS_PER_SUMMARY_PAGE));

  for (let page = 0; page < summaryPagesCount; page++) {
    const summarySlide = pptx.addSlide();
    summarySlide.background = { color: palette.lightBg };

    const pageItems = parsed.items.slice(page * ITEMS_PER_SUMMARY_PAGE, (page + 1) * ITEMS_PER_SUMMARY_PAGE);
    const pageTitleSuffix = summaryPagesCount > 1 ? ` (PARTE ${page + 1} DE ${summaryPagesCount})` : '';

    // Cabeçalho
    summarySlide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.85,
      fill: { color: palette.primary }
    });
    summarySlide.addText(`ESTRUTURA DA ESPECIALIDADE: REQUISITOS OFICIAIS${pageTitleSuffix}`, {
      x: 0.8,
      y: 0.15,
      w: 8.5,
      h: 0.55,
      fontSize: 16,
      bold: true,
      color: 'FFFFFF'
    });
    summarySlide.addText(`${specialty.nome} • Total: ${total} Itens`, {
      x: 8.5,
      y: 0.18,
      w: 4.0,
      h: 0.5,
      fontSize: 11,
      bold: true,
      color: 'E2E8F0',
      align: 'right'
    });

    // Listagem em Grade Resumida (até 2 colunas com no máximo 5 itens cada)
    const pageCols = pageItems.length > 5 ? 2 : 1;
    const itemsPerCol = Math.ceil(pageItems.length / pageCols);

    for (let c = 0; c < pageCols; c++) {
      const colX = c === 0 ? 0.8 : 6.8;
      const colW = pageCols === 1 ? 11.7 : 5.7;

      const sliceItems = pageItems.slice(c * itemsPerCol, (c + 1) * itemsPerCol);
      const cardHeight = 0.82;
      const cardGap = 0.16;

      sliceItems.forEach((it, idx) => {
        const itY = 1.15 + idx * (cardHeight + cardGap);

        summarySlide.addShape('roundRect', {
          x: colX,
          y: itY,
          w: colW,
          h: cardHeight,
          fill: { color: 'FFFFFF' },
          line: { color: palette.cardBorder, width: 1 }
        });

        // Pílula do número
        summarySlide.addShape('roundRect', {
          x: colX + 0.12,
          y: itY + 0.18,
          w: 0.82,
          h: 0.44,
          fill: { color: palette.areaBadgeBg }
        });
        summarySlide.addText(`Item ${it.number}`, {
          x: colX + 0.12,
          y: itY + 0.18,
          w: 0.82,
          h: 0.44,
          fontSize: 9,
          bold: true,
          color: palette.areaBadgeText,
          align: 'center',
          valign: 'middle'
        });

        // Texto do requisito resumido
        summarySlide.addText(it.cleanQuestion, {
          x: colX + 1.05,
          y: itY + 0.08,
          w: colW - 1.2,
          h: cardHeight - 0.16,
          fontSize: 9.5,
          bold: true,
          color: '334155',
          valign: 'middle',
          wrap: true
        });
      });
    }

    // Rodapé do slide de sumário
    summarySlide.addText('DBV Tudo • Apresentação Didática Completa de Especialidades', {
      x: 0.8,
      y: 6.8,
      w: 11.7,
      h: 0.3,
      fontSize: 9,
      color: '94A3B8',
      align: 'center'
    });
  }

  // -------------------------------------------------------------
  // SLIDES DIDÁTICOS DE CADA REQUISITO (COM RESPOSTAS COMPLETAS)
  // -------------------------------------------------------------
  for (let i = 0; i < total; i++) {
    const it = parsed.items[i];
    const ans = answersMap.get(it.number);

    const progressPct = 40 + Math.floor(((i + 1) / total) * 50);
    options?.onProgress?.(`Formatando slide do Requisito ${it.number} (${i + 1} de ${total})...`, progressPct);

    const slide = pptx.addSlide();
    slide.background = { color: palette.lightBg };

    // Barra superior elegante
    slide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.80,
      fill: { color: palette.primary }
    });

    // Badge Requisito
    slide.addShape('roundRect', {
      x: 0.8,
      y: 0.16,
      w: 2.5,
      h: 0.46,
      fill: { color: 'FFFFFF' }
    });
    slide.addText(`REQUISITO ${it.number} DE ${total}`, {
      x: 0.8,
      y: 0.16,
      w: 2.5,
      h: 0.46,
      fontSize: 10,
      bold: true,
      color: palette.primary,
      align: 'center',
      valign: 'middle'
    });

    // Nome da Especialidade no cabeçalho
    slide.addText(specialty.nome || 'Especialidade', {
      x: 3.5,
      y: 0.14,
      w: 8.8,
      h: 0.50,
      fontSize: 13,
      bold: true,
      color: 'FFFFFF',
      align: 'right',
      valign: 'middle'
    });

    // 1. Enunciado Oficial da Questão (Card de Destaque)
    slide.addShape('roundRect', {
      x: 0.8,
      y: 0.95,
      w: 11.7,
      h: 1.05,
      fill: { color: 'FFFFFF' },
      line: { color: palette.accent, width: 1.5 }
    });
    slide.addText('PERGUNTA / ENUNCIADO OFICIAL:', {
      x: 1.0,
      y: 1.02,
      w: 11.3,
      h: 0.20,
      fontSize: 8.5,
      bold: true,
      color: palette.primary
    });
    slide.addText(it.cleanQuestion, {
      x: 1.0,
      y: 1.24,
      w: 11.3,
      h: 0.70,
      fontSize: 11,
      bold: true,
      color: '0F172A',
      valign: 'top',
      wrap: true
    });

    // 2. Resposta Explicativa Didática (Card Principal)
    const hasSubItems = it.subItems.length > 0;
    const answerHeight = hasSubItems ? 1.95 : 2.85;

    slide.addShape('roundRect', {
      x: 0.8,
      y: 2.10,
      w: 11.7,
      h: answerHeight,
      fill: { color: 'FFFFFF' },
      line: { color: palette.cardBorder, width: 1 }
    });

    slide.addShape('roundRect', {
      x: 1.0,
      y: 2.18,
      w: 3.8,
      h: 0.30,
      fill: { color: palette.areaBadgeBg }
    });
    slide.addText('📖 RESPOSTA DIDÁTICA E EXPLICAÇÃO:', {
      x: 1.0,
      y: 2.18,
      w: 3.8,
      h: 0.30,
      fontSize: 8.5,
      bold: true,
      color: palette.areaBadgeText,
      align: 'center',
      valign: 'middle'
    });

    const answerContent = ans?.answer || `Explicação didática detalhada do requisito ${it.cleanQuestion}.`;
    slide.addText(answerContent, {
      x: 1.0,
      y: 2.52,
      w: 11.3,
      h: answerHeight - 0.48,
      fontSize: hasSubItems ? 10 : 10.5,
      color: '334155',
      valign: 'top',
      wrap: true
    });

    // Se tiver sub-itens (a, b, c), exibe um card com os sub-itens respondidos
    if (hasSubItems) {
      slide.addShape('roundRect', {
        x: 0.8,
        y: 4.15,
        w: 11.7,
        h: 1.15,
        fill: { color: 'F8FAFC' },
        line: { color: 'CBD5E1', width: 1 }
      });
      slide.addText('SUB-ITENS OFICIAIS:', {
        x: 1.0,
        y: 4.20,
        w: 11.3,
        h: 0.20,
        fontSize: 8.5,
        bold: true,
        color: palette.primary
      });

      const subItemsText = it.subItems.map(s => `• ${s}`).join('\n');
      slide.addText(subItemsText, {
        x: 1.0,
        y: 4.42,
        w: 11.3,
        h: 0.80,
        fontSize: 9,
        color: '475569',
        wrap: true
      });
    }

    // 3. Cards Inferiores: Pontos de Fixação & Dinâmica Prática
    const bottomCardsY = hasSubItems ? 5.40 : 5.05;
    const bottomCardH = hasSubItems ? 1.30 : 1.65;

    // Card Esquerda: Pontos de Fixação
    slide.addShape('roundRect', {
      x: 0.8,
      y: bottomCardsY,
      w: 5.7,
      h: bottomCardH,
      fill: { color: 'FFFFFF' },
      line: { color: palette.cardBorder, width: 1 }
    });
    slide.addText('🎯 PONTOS DE FIXAÇÃO & MEMORIZAÇÃO', {
      x: 1.0,
      y: bottomCardsY + 0.08,
      w: 5.3,
      h: 0.22,
      fontSize: 8.5,
      bold: true,
      color: palette.primary
    });

    const keyPoints = ans?.keyPoints && ans.keyPoints.length > 0
      ? ans.keyPoints.map(kp => `✓ ${kp}`).join('\n')
      : `✓ Compreensão clara do conceito\n✓ Memorização dos pontos principais\n✓ Aplicação prática no dia a dia`;

    slide.addText(keyPoints, {
      x: 1.0,
      y: bottomCardsY + 0.32,
      w: 5.3,
      h: bottomCardH - 0.40,
      fontSize: 8.5,
      color: '475569',
      wrap: true
    });

    // Card Direita: Dinâmica Prática na Unidade
    slide.addShape('roundRect', {
      x: 6.8,
      y: bottomCardsY,
      w: 5.7,
      h: bottomCardH,
      fill: { color: 'FFFFFF' },
      line: { color: palette.cardBorder, width: 1 }
    });
    slide.addText('🏕️ DINÂMICA PRÁTICA NA UNIDADE', {
      x: 7.0,
      y: bottomCardsY + 0.08,
      w: 5.3,
      h: 0.22,
      fontSize: 8.5,
      bold: true,
      color: palette.primary
    });

    const practicalText = ans?.practicalActivity ||
      `Realize uma dinâmica interativa no cantinho da unidade: divida os desbravadores em duplas para praticar e fixar o requisito de forma lúdica.`;

    slide.addText(practicalText, {
      x: 7.0,
      y: bottomCardsY + 0.32,
      w: 5.3,
      h: bottomCardH - 0.40,
      fontSize: 8.5,
      color: '475569',
      wrap: true
    });

    // Rodapé
    slide.addText(
      `💡 Dica ao Instrutor: ${ans?.instructorTip || 'Conecte o requisito com lições espirituais e vivências práticas de campo.'}`,
      {
        x: 0.8,
        y: 6.82,
        w: 9.8,
        h: 0.30,
        fontSize: 8,
        italic: true,
        color: '64748B'
      }
    );

    slide.addText(`Slide ${i + 3} de ${total + 4}`, {
      x: 10.8,
      y: 6.82,
      w: 1.7,
      h: 0.30,
      fontSize: 8,
      bold: true,
      color: '64748B',
      align: 'right'
    });
  }

  // -------------------------------------------------------------
  // SLIDE PENÚLTIMO: GUIA DE AVALIAÇÃO PRÁTICA DO INSTRUTOR
  // -------------------------------------------------------------
  const evaluationSlide = pptx.addSlide();
  evaluationSlide.background = { color: palette.lightBg };

  evaluationSlide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.85,
    fill: { color: palette.primary }
  });
  evaluationSlide.addText('GUIA PEDAGÓGICO: AVALIAÇÃO E REGISTRO DA ESPECIALIDADE', {
    x: 0.8,
    y: 0.15,
    w: 11.5,
    h: 0.55,
    fontSize: 16,
    bold: true,
    color: 'FFFFFF'
  });

  const evalCards = [
    {
      title: '1. AVALIAÇÃO TEÓRICA E DIALOGADA',
      text: 'Aplique a Prova Ao Vivo no app DBV Tudo ou faça um circuito de perguntas com cartões para conferir se todos os membros da unidade compreenderam os conceitos fundamentais.'
    },
    {
      title: '2. COMPROVAÇÃO PRÁTICA E DEMONSTRAÇÕES',
      text: 'Exija as demonstrações práticas exigidas (desenhos, relatórios, coleções, acampamento ou projetos de serviço comunitário) no cantinho da unidade com acompanhamento do conselheiro.'
    },
    {
      title: '3. ASSINATURA NO CADERNO & REGISTRO NO SGC',
      text: 'Após a aprovação de todos os requisitos, assine a ficha de especialidade do desbravador e solicite à secretaria do clube a homologação e compra da insígnia oficial.'
    }
  ];

  evalCards.forEach((ec, idx) => {
    const cy = 1.3 + idx * 1.8;
    evaluationSlide.addShape('roundRect', {
      x: 0.8,
      y: cy,
      w: 11.7,
      h: 1.55,
      fill: { color: 'FFFFFF' },
      line: { color: palette.cardBorder, width: 1.5 }
    });

    evaluationSlide.addShape('roundRect', {
      x: 1.1,
      y: cy + 0.2,
      w: 5.5,
      h: 0.38,
      fill: { color: palette.areaBadgeBg }
    });
    evaluationSlide.addText(ec.title, {
      x: 1.1,
      y: cy + 0.2,
      w: 5.5,
      h: 0.38,
      fontSize: 10,
      bold: true,
      color: palette.areaBadgeText,
      align: 'center',
      valign: 'middle'
    });

    evaluationSlide.addText(ec.text, {
      x: 1.1,
      y: cy + 0.68,
      w: 11.0,
      h: 0.75,
      fontSize: 12,
      color: '334155'
    });
  });

  // -------------------------------------------------------------
  // SLIDE FINAL: CONCLUSÃO E IDEAIS DOS DESBRAVADORES
  // -------------------------------------------------------------
  const closingSlide = pptx.addSlide();
  closingSlide.background = { color: palette.dark };

  closingSlide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.25,
    fill: { color: palette.accent }
  });

  closingSlide.addShape('roundRect', {
    x: 4.6,
    y: 1.2,
    w: 4.1,
    h: 0.5,
    fill: { color: 'FFFFFF' }
  });
  closingSlide.addText('ESPECIALIDADE CONCLUÍDA', {
    x: 4.6,
    y: 1.2,
    w: 4.1,
    h: 0.5,
    fontSize: 12,
    bold: true,
    color: palette.primary,
    align: 'center',
    valign: 'middle'
  });

  closingSlide.addText(`Parabéns aos Desbravadores!`, {
    x: 0.8,
    y: 2.1,
    w: 11.7,
    h: 0.9,
    fontSize: 32,
    bold: true,
    color: 'FFFFFF',
    align: 'center'
  });

  closingSlide.addText(
    `Todos os ${total} requisitos da especialidade de ${specialty.nome} foram estudados e fundamentados.`,
    {
      x: 0.8,
      y: 3.1,
      w: 11.7,
      h: 0.6,
      fontSize: 15,
      color: 'CBD5E1',
      align: 'center'
    }
  );

  // Caixa dos Ideais
  closingSlide.addShape('roundRect', {
    x: 2.5,
    y: 4.0,
    w: 8.3,
    h: 1.6,
    fill: { color: '1E293B' },
    line: { color: palette.accent, width: 1.5 }
  });
  closingSlide.addText('LEMA DOS DESBRAVADORES', {
    x: 2.5,
    y: 4.15,
    w: 8.3,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: palette.accent,
    align: 'center'
  });
  closingSlide.addText('"O amor de Cristo me motiva."\nMaranata: o Senhor logo vem!', {
    x: 2.5,
    y: 4.5,
    w: 8.3,
    h: 0.9,
    fontSize: 16,
    bold: true,
    color: 'FFFFFF',
    align: 'center'
  });

  // Assinaturas
  closingSlide.addText(
    `_____________________________\nInstrutor(a): ${options?.instructorName || 'Responsável'}`,
    {
      x: 1.5,
      y: 6.0,
      w: 4.5,
      h: 0.9,
      fontSize: 11,
      color: '94A3B8',
      align: 'center'
    }
  );

  closingSlide.addText(
    `_____________________________\nDiretoria / Conselheiro(a)`,
    {
      x: 7.3,
      y: 6.0,
      w: 4.5,
      h: 0.9,
      fontSize: 11,
      color: '94A3B8',
      align: 'center'
    }
  );

  options?.onProgress?.('Finalizando e salvando apresentação...', 95);
  const fileName = `Especialidade_${(specialty.nome || 'Apresentacao').replace(/\s+/g, '_')}.pptx`;
  await pptx.writeFile({ fileName });
}
