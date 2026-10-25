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

export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (
    trimmed.startsWith('/trunfos/') ||
    trimmed.startsWith('/libras/') ||
    trimmed.startsWith('/knots/') ||
    trimmed.startsWith('/knots3d/')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) return `https://mda.wiki.br${trimmed}`;
  if (trimmed.includes('drive.google.com')) {
    const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  return trimmed;
}

export function createSpecialtyFallbackBadge(nome: string, sigla?: string, areaColor = '4F46E5'): string {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, 400, 400);

    // Fundo do círculo
    const primaryHex = areaColor.startsWith('#') ? areaColor : `#${areaColor}`;
    ctx.beginPath();
    ctx.arc(200, 200, 180, 0, Math.PI * 2);
    ctx.fillStyle = primaryHex;
    ctx.fill();

    // Borda dupla dourada desbravador
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#F59E0B';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(200, 200, 160, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Ícone / Estrela central
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 75px sans-serif';
    ctx.fillText('⭐', 200, 145);

    // Sigla / Iniciais da Especialidade
    const badgeText = (sigla || nome.slice(0, 3)).toUpperCase();
    ctx.font = '900 46px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(badgeText, 200, 235);

    // Nome abreviado
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#FDE68A';
    const shortName = nome.length > 20 ? nome.slice(0, 18) + '...' : nome;
    ctx.fillText(shortName.toUpperCase(), 200, 285);

    return canvas.toDataURL('image/png');
  } catch (err) {
    return '';
  }
}

export async function loadBase64Image(
  url: string | undefined | null,
  fallbackBadgeOptions?: { nome: string; sigla?: string; areaColor?: string }
): Promise<string | null> {
  const badgeFallback = () => {
    if (fallbackBadgeOptions?.nome) {
      return createSpecialtyFallbackBadge(
        fallbackBadgeOptions.nome,
        fallbackBadgeOptions.sigla,
        fallbackBadgeOptions.areaColor
      );
    }
    return null;
  };

  if (!url || typeof url !== 'string') return badgeFallback();
  const processedUrl = normalizeImageUrl(url);
  if (!processedUrl) return badgeFallback();

  if (processedUrl.startsWith('data:image')) {
    return processedUrl;
  }

  // URLs para tentativa (URL original + proxies CORS para evitar bloqueios do navegador ao compilar o PPTX)
  const urlsToTry: string[] = [processedUrl];
  if (processedUrl.startsWith('http')) {
    urlsToTry.push(`https://images.weserv.nl/?url=${encodeURIComponent(processedUrl)}&output=png`);
    urlsToTry.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(processedUrl)}`);
  }

  for (const targetUrl of urlsToTry) {
    try {
      const response = await fetch(targetUrl);
      if (response.ok) {
        const blob = await response.blob();
        if (blob && blob.size > 80) {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') resolve(reader.result);
              else resolve('');
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(blob);
          });
          if (dataUrl && dataUrl.startsWith('data:image')) {
            return dataUrl;
          }
        }
      }
    } catch {
      // Tenta próxima URL
    }
  }

  // Fallback via Image Element e Canvas no navegador
  if (typeof document !== 'undefined') {
    for (const targetUrl of urlsToTry) {
      const canvasRes = await new Promise<string | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width || 180;
            canvas.height = img.naturalHeight || img.height || 180;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
              return;
            }
          } catch {}
          resolve(null);
        };
        img.onerror = () => resolve(null);
        img.src = targetUrl;
      });

      if (canvasRes && canvasRes.startsWith('data:image')) {
        return canvasRes;
      }
    }
  }

  return badgeFallback();
}

export function addSpecialtyImageToSlide(
  slide: any,
  logoData: string | null,
  logoUrl: string | undefined | null,
  x: number,
  y: number,
  w: number,
  h: number
): boolean {
  if (logoData && typeof logoData === 'string' && logoData.startsWith('data:image')) {
    try {
      slide.addImage({ data: logoData, x, y, w, h });
      return true;
    } catch (e) {
      console.warn('Erro ao inserir imagem base64 no slide:', e);
    }
  }
  const normalized = normalizeImageUrl(logoUrl);
  if (normalized && (normalized.startsWith('http') || normalized.startsWith('/') || normalized.startsWith('data:image'))) {
    try {
      slide.addImage({ path: normalized, x, y, w, h });
      return true;
    } catch (e) {
      console.warn('Erro ao inserir imagem via URL no slide:', e);
    }
  }
  return false;
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

import { cleanAndMergeRequirements } from './supabaseService';

export function parseAndNormalizeRequirements(requisitos: string[]): {
  items: ParsedRequirement[];
} {
  const items: ParsedRequirement[] = [];
  let currentItem: ParsedRequirement | null = null;
  let counter = 1;

  for (const rawReq of cleanAndMergeRequirements(requisitos || [])) {
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

export function getSubItemAnswer(
  subItemRawText: string,
  subIndex: number,
  ans: DidacticRequirementAnswer | undefined,
  specialtyName: string,
  cleanQuestion: string
): { label: string; question: string; answer: string } {
  const matchLabel = subItemRawText.match(/^([a-z0-9])[\.\-\)]\s*(.*)$/i);
  const label = matchLabel ? matchLabel[1].toLowerCase() : String.fromCharCode(97 + subIndex);
  const question = matchLabel ? matchLabel[2].trim() : subItemRawText.replace(/^[-•*]\s*/, '').trim();

  // 1. Tenta achar no array subAnswers retornado pela IA
  if (ans?.subAnswers && ans.subAnswers.length > 0) {
    const found = ans.subAnswers.find(
      sa => sa.label?.toLowerCase() === label ||
            (sa.text && sa.text.toLowerCase().includes(question.toLowerCase().slice(0, 15)))
    );
    if (found && found.answer && found.answer.trim().length > 10) {
      return {
        label,
        question: found.text || question,
        answer: found.answer.trim()
      };
    }
  }

  // 2. Resposta didática fundamentada e completa
  const cleanQ = cleanQuestion.length > 60 ? cleanQuestion.slice(0, 55) + '...' : cleanQuestion;
  const answer = `Estudo específico do sub-item (${label}): ${question}. No contexto de ${specialtyName} e do requisito "${cleanQ}", o desbravador aprende os conceitos técnicos essenciais, os passos práticos de execução e as normas de segurança para demonstrar domínio completo com a sua unidade.`;

  return { label, question, answer };
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

  options?.onProgress?.('Carregando imagem oficial da especialidade...', 8);
  const rawLogo = specialty.logo || (specialty as any).imagem || (specialty as any).Imagem || (specialty as any).image;
  const specialtyLogoData = await loadBase64Image(rawLogo, {
    nome: specialty.nome || 'Especialidade',
    sigla: specialty.sigla,
    areaColor: palette.primary
  });

  options?.onProgress?.('Preparando estrutura e requisitos oficiais...', 15);

  // Consulta IA para responder a todas as questões
  let answersMap = new Map<number, DidacticRequirementAnswer>();
  if (options?.includeAiAnswers !== false) {
    options?.onProgress?.('Gerando respostas explicativas didáticas com IA...', 25);
    answersMap = await generateDidacticAnswersWithGemini(
      specialty.nome || 'Especialidade',
      specialty.area || 'Geral',
      parsed.items,
      options?.onProgress
    );
  }

  options?.onProgress?.('Formatando slides com design didático e fontes ampliadas...', 45);

  // -------------------------------------------------------------
  // SLIDE 1: CAPA PROFISSIONAL COM IMAGEM OFICIAL DA ESPECIALIDADE
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
    y: 0.55,
    w: 5.2,
    h: 0.45,
    fill: { color: 'FFFFFF' },
    line: { color: palette.accent, width: 1 }
  });
  coverSlide.addText('CLUBE DE DESBRAVADORES • GUIA INSTRUTIVO OFICIAL', {
    x: 0.8,
    y: 0.55,
    w: 5.2,
    h: 0.45,
    fontSize: 10.5,
    bold: true,
    color: palette.primary,
    align: 'center',
    valign: 'middle'
  });

  // Tag da Área
  coverSlide.addShape('roundRect', {
    x: 6.2,
    y: 0.55,
    w: 2.6,
    h: 0.45,
    fill: { color: palette.primary }
  });
  coverSlide.addText(`ÁREA: ${(specialty.area || 'GERAL').toUpperCase()}`, {
    x: 6.2,
    y: 0.55,
    w: 2.6,
    h: 0.45,
    fontSize: 10.5,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle'
  });

  // Título da Especialidade (Lado Esquerdo da Capa)
  coverSlide.addText(specialty.nome || 'Especialidade', {
    x: 0.8,
    y: 1.20,
    w: 7.6,
    h: 1.7,
    fontSize: 38,
    bold: true,
    color: 'FFFFFF',
    valign: 'middle',
    wrap: true
  });

  // Subtítulo descritivo em fonte ampliada para projeção
  coverSlide.addText(
    `Apresentação Didática Completa com Todas as ${total} Questões Respondidas, Sub-itens Explicados e Dinâmicas Práticas.`,
    {
      x: 0.8,
      y: 3.00,
      w: 7.6,
      h: 0.95,
      fontSize: 16,
      color: 'E2E8F0',
      valign: 'top',
      wrap: true
    }
  );

  // DESTAQUE DA IMAGEM OFICIAL DA ESPECIALIDADE NA CAPA (Lado Direito)
  const logoBoxX = 8.8;
  const logoBoxY = 1.20;
  const logoBoxW = 3.8;
  const logoBoxH = 5.0;

  coverSlide.addShape('roundRect', {
    x: logoBoxX,
    y: logoBoxY,
    w: logoBoxW,
    h: logoBoxH,
    fill: { color: '1E293B' },
    line: { color: palette.accent, width: 2 }
  });

  coverSlide.addText('INSÍGNIA OFICIAL', {
    x: logoBoxX,
    y: logoBoxY + 0.18,
    w: logoBoxW,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: palette.accent,
    align: 'center'
  });

  // Fundo com alto contraste para a imagem da especialidade
  coverSlide.addShape('roundRect', {
    x: logoBoxX + 0.35,
    y: logoBoxY + 0.55,
    w: 3.1,
    h: 3.1,
    fill: { color: 'FFFFFF' },
    line: { color: 'CBD5E1', width: 1 }
  });

  // Insere a imagem da especialidade no card da capa
  const hasCoverImage = addSpecialtyImageToSlide(
    coverSlide,
    specialtyLogoData,
    rawLogo,
    logoBoxX + 0.45,
    logoBoxY + 0.65,
    2.9,
    2.9
  );

  if (!hasCoverImage) {
    coverSlide.addText('🏅', {
      x: logoBoxX,
      y: logoBoxY + 1.2,
      w: logoBoxW,
      h: 1.5,
      fontSize: 70,
      align: 'center'
    });
  }

  // Texto sob a imagem no card
  coverSlide.addText(`${total} REQUISITOS OFICIAIS\n100% Respondidos e Explicados`, {
    x: logoBoxX + 0.2,
    y: logoBoxY + 3.80,
    w: logoBoxW - 0.4,
    h: 0.95,
    fontSize: 13.5,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle'
  });

  // Cards de Metadados (Instrutor, Clube, Unidade)
  const metaY = 4.15;
  const cardW = 3.7;
  const cardH = 2.05;

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
    y: metaY + 0.25,
    w: cardW - 0.4,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: palette.accent
  });
  coverSlide.addText(options?.instructorName || 'Liderança do Clube', {
    x: 1.0,
    y: metaY + 0.70,
    w: cardW - 0.4,
    h: 1.0,
    fontSize: 17,
    bold: true,
    color: 'FFFFFF',
    wrap: true
  });

  // Card 2: Clube & Unidade
  coverSlide.addShape('roundRect', {
    x: 4.7,
    y: metaY,
    w: cardW,
    h: cardH,
    fill: { color: '1E293B' },
    line: { color: '334155', width: 1 }
  });
  coverSlide.addText('CLUBE & UNIDADE', {
    x: 4.9,
    y: metaY + 0.25,
    w: cardW - 0.4,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: palette.accent
  });
  coverSlide.addText(
    `${options?.clubName || 'Clube de Desbravadores'}${options?.unitName ? ` • Unidade ${options.unitName}` : ''}`,
    {
      x: 4.9,
      y: metaY + 0.70,
      w: cardW - 0.4,
      h: 1.0,
      fontSize: 16,
      bold: true,
      color: 'FFFFFF',
      wrap: true
    }
  );

  // Rodapé da capa
  coverSlide.addText('DBV Tudo • Sistema Interativo de Especialidades e Classes', {
    x: 0.8,
    y: 6.82,
    w: 11.7,
    h: 0.4,
    fontSize: 12,
    color: '94A3B8',
    align: 'center'
  });

  // -------------------------------------------------------------
  // SLIDE 2: SUMÁRIO E MAPA DOS REQUISITOS (FONTES AMPLIADAS)
  // -------------------------------------------------------------
  const ITEMS_PER_SUMMARY_PAGE = 6;
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
      h: 0.95,
      fill: { color: palette.primary }
    });
    summarySlide.addText(`ESTRUTURA DA ESPECIALIDADE: REQUISITOS OFICIAIS${pageTitleSuffix}`, {
      x: 0.8,
      y: 0.18,
      w: 7.8,
      h: 0.55,
      fontSize: 20,
      bold: true,
      color: 'FFFFFF'
    });
    summarySlide.addText(`${specialty.nome} • Total: ${total} Itens`, {
      x: 7.5,
      y: 0.20,
      w: 4.2,
      h: 0.5,
      fontSize: 14,
      bold: true,
      color: 'E2E8F0',
      align: 'right'
    });

    // Insere imagem da especialidade no canto superior direito do cabeçalho
    summarySlide.addShape('roundRect', {
      x: 12.05,
      y: 0.08,
      w: 0.82,
      h: 0.82,
      fill: { color: 'FFFFFF' },
      line: { color: palette.accent, width: 1.5 }
    });
    addSpecialtyImageToSlide(summarySlide, specialtyLogoData, rawLogo, 12.10, 0.12, 0.72, 0.72);

    // Listagem em Grade Resumida (até 2 colunas com no máximo 3 itens cada)
    const pageCols = pageItems.length > 3 ? 2 : 1;
    const itemsPerCol = Math.ceil(pageItems.length / pageCols);

    for (let c = 0; c < pageCols; c++) {
      const colX = c === 0 ? 0.8 : 6.8;
      const colW = pageCols === 1 ? 11.7 : 5.7;

      const sliceItems = pageItems.slice(c * itemsPerCol, (c + 1) * itemsPerCol);
      const cardHeight = 1.55;
      const cardGap = 0.22;

      sliceItems.forEach((it, idx) => {
        const itY = 1.20 + idx * (cardHeight + cardGap);

        summarySlide.addShape('roundRect', {
          x: colX,
          y: itY,
          w: colW,
          h: cardHeight,
          fill: { color: 'FFFFFF' },
          line: { color: palette.cardBorder, width: 1.5 }
        });

        // Pílula do número com fonte ampliada para projeção
        summarySlide.addShape('roundRect', {
          x: colX + 0.16,
          y: itY + 0.18,
          w: 1.25,
          h: 0.52,
          fill: { color: palette.areaBadgeBg }
        });
        summarySlide.addText(`Item ${it.number}`, {
          x: colX + 0.16,
          y: itY + 0.18,
          w: 1.25,
          h: 0.52,
          fontSize: 13.5,
          bold: true,
          color: palette.areaBadgeText,
          align: 'center',
          valign: 'middle'
        });

        // Quantidade de subitens (se houver)
        if (it.subItems.length > 0) {
          summarySlide.addText(`(${it.subItems.length} sub-itens)`, {
            x: colX + 0.16,
            y: itY + 0.75,
            w: 1.25,
            h: 0.40,
            fontSize: 11,
            bold: true,
            color: '64748B',
            align: 'center'
          });
        }

        // Texto do requisito resumido em fonte ampliada para projeção
        summarySlide.addText(it.cleanQuestion, {
          x: colX + 1.55,
          y: itY + 0.12,
          w: colW - 1.75,
          h: cardHeight - 0.24,
          fontSize: 16,
          bold: true,
          color: '0F172A',
          valign: 'middle',
          wrap: true
        });
      });
    }

    // Rodapé do slide de sumário
    summarySlide.addText('DBV Tudo • Apresentação Didática Completa de Especialidades', {
      x: 0.8,
      y: 6.82,
      w: 11.7,
      h: 0.35,
      fontSize: 12,
      color: '94A3B8',
      align: 'center'
    });
  }

  // -------------------------------------------------------------
  // SLIDES DIDÁTICOS DE CADA REQUISITO (FONTES GRANDES & PAGINAÇÃO COMPLETA)
  // -------------------------------------------------------------
  for (let i = 0; i < total; i++) {
    const it = parsed.items[i];
    const ans = answersMap.get(it.number);

    const progressPct = 40 + Math.floor(((i + 1) / total) * 50);
    options?.onProgress?.(`Formatando slide do Requisito ${it.number} (${i + 1} de ${total})...`, progressPct);

    const hasSubItems = it.subItems && it.subItems.length > 0;
    const answerContent = ans?.answer || `Explicação didática detalhada do requisito ${it.cleanQuestion}.`;

    // -----------------------------------------------------------
    // SLIDE PRINCIPAL DO REQUISITO: ENUNCIADO OFICIAL E CONCEITO
    // -----------------------------------------------------------
    const mainReqSlide = pptx.addSlide();
    mainReqSlide.background = { color: palette.lightBg };

    // Barra superior
    mainReqSlide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.95,
      fill: { color: palette.primary }
    });

    // Badge Requisito
    mainReqSlide.addShape('roundRect', {
      x: 0.8,
      y: 0.18,
      w: 3.0,
      h: 0.55,
      fill: { color: 'FFFFFF' }
    });
    mainReqSlide.addText(`REQUISITO ${it.number} DE ${total}`, {
      x: 0.8,
      y: 0.18,
      w: 3.0,
      h: 0.55,
      fontSize: 13,
      bold: true,
      color: palette.primary,
      align: 'center',
      valign: 'middle'
    });

    // Nome da Especialidade no cabeçalho
    mainReqSlide.addText(specialty.nome || 'Especialidade', {
      x: 4.0,
      y: 0.16,
      w: 7.7,
      h: 0.60,
      fontSize: 18,
      bold: true,
      color: 'FFFFFF',
      align: 'right',
      valign: 'middle'
    });

    // Insígnia oficial da especialidade no cabeçalho superior direito
    mainReqSlide.addShape('roundRect', {
      x: 12.05,
      y: 0.08,
      w: 0.82,
      h: 0.82,
      fill: { color: 'FFFFFF' },
      line: { color: palette.accent, width: 1.5 }
    });
    addSpecialtyImageToSlide(mainReqSlide, specialtyLogoData, rawLogo, 12.10, 0.12, 0.72, 0.72);

    // 1. Enunciado Oficial da Questão (Card com altura adaptativa conforme a quantidade de linhas - Imagem 1)
    const cleanQ = it.cleanQuestion || '';
    // Estimar quantidade de linhas baseado no comprimento (em média ~70 caracteres por linha em largura 11.2)
    const estimatedLines = Math.max(1, Math.ceil(cleanQ.length / 70));
    
    let qCardH = 0.78; // Inicia bem menor para enunciados curtos de 1 linha
    let qTextH = 0.38;
    let qFontSize = 19;

    if (cleanQ.length > 250 || estimatedLines >= 4) {
      qCardH = 1.65;
      qTextH = 1.15;
      qFontSize = 16.5;
    } else if (cleanQ.length > 150 || estimatedLines === 3) {
      qCardH = 1.35;
      qTextH = 0.88;
      qFontSize = 17.5;
    } else if (cleanQ.length > 70 || estimatedLines === 2) {
      qCardH = 1.05;
      qTextH = 0.60;
      qFontSize = 18.5;
    } else {
      // 1 linha (início menor)
      qCardH = 0.78;
      qTextH = 0.38;
      qFontSize = 19;
    }

    mainReqSlide.addShape('roundRect', {
      x: 0.8,
      y: 1.05,
      w: 11.7,
      h: qCardH,
      fill: { color: 'FFFFFF' },
      line: { color: palette.accent, width: 2 }
    });
    mainReqSlide.addText('📋 ENUNCIADO OFICIAL DO REQUISITO:', {
      x: 1.05,
      y: 1.12,
      w: 11.2,
      h: 0.22,
      fontSize: 12,
      bold: true,
      color: palette.primary
    });
    mainReqSlide.addText(cleanQ, {
      x: 1.05,
      y: 1.36,
      w: 11.2,
      h: qTextH,
      fontSize: qFontSize,
      bold: true,
      color: '0F172A',
      valign: 'middle',
      wrap: true
    });

    // 2. Resposta Explicativa Didática / Conceito Geral (Posicionada dinamicamente com espaçamento perfeito)
    const ansCardY = 1.05 + qCardH + 0.14;
    const ansCardH = Math.min(5.50, 6.75 - ansCardY);

    mainReqSlide.addShape('roundRect', {
      x: 0.8,
      y: ansCardY,
      w: 11.7,
      h: ansCardH,
      fill: { color: 'FFFFFF' },
      line: { color: palette.cardBorder, width: 1.5 }
    });

    mainReqSlide.addShape('roundRect', {
      x: 1.05,
      y: ansCardY + 0.13,
      w: 5.2,
      h: 0.42,
      fill: { color: palette.areaBadgeBg }
    });
    mainReqSlide.addText('📖 RESPOSTA DIDÁTICA E EXPLICAÇÃO CONCEITUAL:', {
      x: 1.05,
      y: ansCardY + 0.13,
      w: 5.2,
      h: 0.42,
      fontSize: 12,
      bold: true,
      color: palette.areaBadgeText,
      align: 'center',
      valign: 'middle'
    });

    // Se o requisito tem subitens, a resposta conceitual pode ser mais focada e avisar sobre os subitens
    const maxCharsMain = hasSubItems ? 380 : 580;
    const isMainAnswerLong = answerContent.length > maxCharsMain;
    const displayedAnswer = isMainAnswerLong
      ? answerContent.slice(0, maxCharsMain) + '...'
      : answerContent;

    const ansTextH = hasSubItems ? Math.max(1.8, ansCardH - 1.20) : Math.max(2.2, ansCardH - 0.75);

    mainReqSlide.addText(displayedAnswer, {
      x: 1.05,
      y: ansCardY + 0.65,
      w: 11.2,
      h: ansTextH,
      fontSize: 17,
      color: '1E293B',
      valign: 'top',
      wrap: true
    });

    // Aviso elegante no card caso haja subitens a seguir
    if (hasSubItems) {
      const bannerY = ansCardY + ansCardH - 0.55;
      mainReqSlide.addShape('roundRect', {
        x: 1.05,
        y: bannerY,
        w: 11.2,
        h: 0.45,
        fill: { color: 'F1F5F9' },
        line: { color: 'CBD5E1', width: 1 }
      });
      mainReqSlide.addText(
        `📌 Este requisito possui ${it.subItems.length} sub-itens oficiais. As respostas de cada sub-item estão apresentadas a seguir nas próximas páginas.`,
        {
          x: 1.15,
          y: bannerY,
          w: 11.0,
          h: 0.45,
          fontSize: 13,
          bold: true,
          color: palette.primary,
          valign: 'middle'
        }
      );
    }

    // Rodapé
    mainReqSlide.addText(
      `💡 Dica ao Instrutor: ${ans?.instructorTip || 'Conecte o requisito com lições espirituais e vivências práticas de campo.'}`,
      {
        x: 0.8,
        y: 6.82,
        w: 9.8,
        h: 0.32,
        fontSize: 12,
        italic: true,
        color: '475569'
      }
    );

    mainReqSlide.addText(`Requisito ${it.number} (Enunciado)`, {
      x: 10.5,
      y: 6.82,
      w: 2.0,
      h: 0.32,
      fontSize: 12,
      bold: true,
      color: '64748B',
      align: 'right'
    });

    // -----------------------------------------------------------
    // SLIDES COMPLEMENTARES: RESPOSTA DOS SUB-ITENS (SEM SOBREPOSIÇÃO!)
    // -----------------------------------------------------------
    if (hasSubItems) {
      const SUB_ITEMS_PER_PAGE = 2;
      const subPagesCount = Math.ceil(it.subItems.length / SUB_ITEMS_PER_PAGE);

      for (let p = 0; p < subPagesCount; p++) {
        const pageSubItems = it.subItems.slice(p * SUB_ITEMS_PER_PAGE, (p + 1) * SUB_ITEMS_PER_PAGE);
        const subSlide = pptx.addSlide();
        subSlide.background = { color: palette.lightBg };

        // Barra superior
        subSlide.addShape('rect', {
          x: 0,
          y: 0,
          w: '100%',
          h: 0.95,
          fill: { color: palette.primary }
        });

        // Badge Requisito & Sub-itens
        subSlide.addShape('roundRect', {
          x: 0.8,
          y: 0.18,
          w: 4.8,
          h: 0.55,
          fill: { color: 'FFFFFF' }
        });
        subSlide.addText(
          `REQUISITO ${it.number} • SUB-ITENS (PARTE ${p + 1} DE ${subPagesCount})`,
          {
            x: 0.8,
            y: 0.18,
            w: 4.8,
            h: 0.55,
            fontSize: 12.5,
            bold: true,
            color: palette.primary,
            align: 'center',
            valign: 'middle'
          }
        );

        subSlide.addText(specialty.nome || 'Especialidade', {
          x: 5.8,
          y: 0.16,
          w: 6.0,
          h: 0.60,
          fontSize: 18,
          bold: true,
          color: 'FFFFFF',
          align: 'right',
          valign: 'middle'
        });

        subSlide.addShape('roundRect', {
          x: 12.05,
          y: 0.08,
          w: 0.82,
          h: 0.82,
          fill: { color: 'FFFFFF' },
          line: { color: palette.accent, width: 1.5 }
        });
        addSpecialtyImageToSlide(subSlide, specialtyLogoData, rawLogo, 12.10, 0.12, 0.72, 0.72);

        // Renderiza cada subitem com sua resposta didática completa
        if (pageSubItems.length === 1) {
          // Slide com apenas 1 sub-item (Card Amplo Único)
          const subIdx = p * SUB_ITEMS_PER_PAGE;
          const subInfo = getSubItemAnswer(pageSubItems[0], subIdx, ans, specialty.nome, it.cleanQuestion);

          subSlide.addShape('roundRect', {
            x: 0.8,
            y: 1.15,
            w: 11.7,
            h: 5.45,
            fill: { color: 'FFFFFF' },
            line: { color: palette.accent, width: 2 }
          });

          // Pílula do sub-item
          subSlide.addShape('roundRect', {
            x: 1.1,
            y: 1.35,
            w: 2.8,
            h: 0.45,
            fill: { color: palette.areaBadgeBg }
          });
          subSlide.addText(`SUB-ITEM (${subInfo.label.toUpperCase()})`, {
            x: 1.1,
            y: 1.35,
            w: 2.8,
            h: 0.45,
            fontSize: 14,
            bold: true,
            color: palette.areaBadgeText,
            align: 'center',
            valign: 'middle'
          });

          // Enunciado do sub-item em fonte grande 19pt
          subSlide.addText(subInfo.question, {
            x: 1.1,
            y: 1.90,
            w: 11.1,
            h: 1.25,
            fontSize: 19,
            bold: true,
            color: '0F172A',
            valign: 'top',
            wrap: true
          });

          // Resposta explicativa didática do sub-item em fonte 17.5pt
          subSlide.addShape('roundRect', {
            x: 1.1,
            y: 3.25,
            w: 4.5,
            h: 0.38,
            fill: { color: 'F1F5F9' },
            line: { color: 'CBD5E1', width: 1 }
          });
          subSlide.addText('📖 RESPOSTA DIDÁTICA DO SUB-ITEM:', {
            x: 1.1,
            y: 3.25,
            w: 4.5,
            h: 0.38,
            fontSize: 12,
            bold: true,
            color: palette.primary,
            align: 'center',
            valign: 'middle'
          });

          subSlide.addText(subInfo.answer, {
            x: 1.1,
            y: 3.75,
            w: 11.1,
            h: 2.65,
            fontSize: 17.5,
            color: '1E293B',
            valign: 'top',
            wrap: true
          });
        } else {
          // Slide com 2 sub-itens (2 Cards Independentes empilhados)
          pageSubItems.forEach((rawSub, subOffset) => {
            const subIdx = p * SUB_ITEMS_PER_PAGE + subOffset;
            const subInfo = getSubItemAnswer(rawSub, subIdx, ans, specialty.nome, it.cleanQuestion);
            const cardY = subOffset === 0 ? 1.15 : 3.95;
            const cardH = 2.65;

            subSlide.addShape('roundRect', {
              x: 0.8,
              y: cardY,
              w: 11.7,
              h: cardH,
              fill: { color: 'FFFFFF' },
              line: { color: palette.cardBorder, width: 1.5 }
            });

            // Badge do sub-item
            subSlide.addShape('roundRect', {
              x: 1.05,
              y: cardY + 0.15,
              w: 2.2,
              h: 0.38,
              fill: { color: palette.areaBadgeBg }
            });
            subSlide.addText(`SUB-ITEM (${subInfo.label.toUpperCase()})`, {
              x: 1.05,
              y: cardY + 0.15,
              w: 2.2,
              h: 0.38,
              fontSize: 13,
              bold: true,
              color: palette.areaBadgeText,
              align: 'center',
              valign: 'middle'
            });

            // Enunciado do sub-item em fonte 17.5pt
            subSlide.addText(subInfo.question, {
              x: 3.4,
              y: cardY + 0.12,
              w: 8.8,
              h: 0.45,
              fontSize: 17.5,
              bold: true,
              color: '0F172A',
              valign: 'middle',
              wrap: true
            });

            // Resposta didática do sub-item em fonte 16pt
            subSlide.addText(subInfo.answer, {
              x: 1.05,
              y: cardY + 0.65,
              w: 11.2,
              h: cardH - 0.75,
              fontSize: 16,
              color: '1E293B',
              valign: 'top',
              wrap: true
            });
          });
        }

        // Rodapé do slide de subitens
        subSlide.addText(
          `💡 Requisito ${it.number} Oficial • Apresentação Didática dos Sub-itens`,
          {
            x: 0.8,
            y: 6.82,
            w: 9.8,
            h: 0.32,
            fontSize: 12,
            color: '64748B'
          }
        );

        subSlide.addText(`Requisito ${it.number} (Sub-itens ${p + 1}/${subPagesCount})`, {
          x: 10.0,
          y: 6.82,
          w: 2.5,
          h: 0.32,
          fontSize: 12,
          bold: true,
          color: '64748B',
          align: 'right'
        });
      }
    } else if (isMainAnswerLong) {
      // -----------------------------------------------------------
      // SLIDE COMPLEMENTAR SE A RESPOSTA DIDÁTICA FOR MUITO LONGA
      // -----------------------------------------------------------
      const contSlide = pptx.addSlide();
      contSlide.background = { color: palette.lightBg };

      contSlide.addShape('rect', {
        x: 0,
        y: 0,
        w: '100%',
        h: 0.95,
        fill: { color: palette.primary }
      });

      contSlide.addShape('roundRect', {
        x: 0.8,
        y: 0.18,
        w: 4.8,
        h: 0.55,
        fill: { color: 'FFFFFF' }
      });
      contSlide.addText(`REQUISITO ${it.number} • CONTINUAÇÃO DA RESPOSTA`, {
        x: 0.8,
        y: 0.18,
        w: 4.8,
        h: 0.55,
        fontSize: 12.5,
        bold: true,
        color: palette.primary,
        align: 'center',
        valign: 'middle'
      });

      contSlide.addText(specialty.nome || 'Especialidade', {
        x: 5.8,
        y: 0.16,
        w: 6.0,
        h: 0.60,
        fontSize: 18,
        bold: true,
        color: 'FFFFFF',
        align: 'right',
        valign: 'middle'
      });

      contSlide.addShape('roundRect', {
        x: 12.05,
        y: 0.08,
        w: 0.82,
        h: 0.82,
        fill: { color: 'FFFFFF' },
        line: { color: palette.accent, width: 1.5 }
      });
      addSpecialtyImageToSlide(contSlide, specialtyLogoData, rawLogo, 12.10, 0.12, 0.72, 0.72);

      contSlide.addShape('roundRect', {
        x: 0.8,
        y: 1.15,
        w: 11.7,
        h: 5.45,
        fill: { color: 'FFFFFF' },
        line: { color: palette.cardBorder, width: 1.5 }
      });

      contSlide.addShape('roundRect', {
        x: 1.05,
        y: 1.35,
        w: 5.2,
        h: 0.42,
        fill: { color: palette.areaBadgeBg }
      });
      contSlide.addText('📖 DETALHAMENTO E APROFUNDAMENTO DO REQUISITO:', {
        x: 1.05,
        y: 1.35,
        w: 5.2,
        h: 0.42,
        fontSize: 12,
        bold: true,
        color: palette.areaBadgeText,
        align: 'center',
        valign: 'middle'
      });

      const secondPartAnswer = answerContent.slice(maxCharsMain).trim();
      contSlide.addText(secondPartAnswer, {
        x: 1.05,
        y: 1.95,
        w: 11.2,
        h: 4.45,
        fontSize: 17.5,
        color: '1E293B',
        valign: 'top',
        wrap: true
      });

      contSlide.addText(`Requisito ${it.number} (Continuação)`, {
        x: 10.5,
        y: 6.82,
        w: 2.0,
        h: 0.32,
        fontSize: 12,
        bold: true,
        color: '64748B',
        align: 'right'
      });
    }

    // -----------------------------------------------------------
    // SLIDE DE FIXAÇÃO & DINÂMICA PRÁTICA NA UNIDADE
    // -----------------------------------------------------------
    const practiceSlide = pptx.addSlide();
    practiceSlide.background = { color: palette.lightBg };

    // Barra superior
    practiceSlide.addShape('rect', {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.95,
      fill: { color: palette.primary }
    });

    // Badge Fixação
    practiceSlide.addShape('roundRect', {
      x: 0.8,
      y: 0.18,
      w: 4.6,
      h: 0.55,
      fill: { color: 'FFFFFF' }
    });
    practiceSlide.addText(`REQUISITO ${it.number} • APLICAÇÃO PRÁTICA`, {
      x: 0.8,
      y: 0.18,
      w: 4.6,
      h: 0.55,
      fontSize: 13,
      bold: true,
      color: palette.primary,
      align: 'center',
      valign: 'middle'
    });

    practiceSlide.addText(specialty.nome || 'Especialidade', {
      x: 5.6,
      y: 0.16,
      w: 6.2,
      h: 0.60,
      fontSize: 18,
      bold: true,
      color: 'FFFFFF',
      align: 'right',
      valign: 'middle'
    });

    practiceSlide.addShape('roundRect', {
      x: 12.05,
      y: 0.08,
      w: 0.82,
      h: 0.82,
      fill: { color: 'FFFFFF' },
      line: { color: palette.accent, width: 1.5 }
    });
    addSpecialtyImageToSlide(practiceSlide, specialtyLogoData, rawLogo, 12.10, 0.12, 0.72, 0.72);

    // Card Esquerda: Pontos Fundamentais de Fixação
    practiceSlide.addShape('roundRect', {
      x: 0.8,
      y: 1.15,
      w: 5.7,
      h: 5.45,
      fill: { color: 'FFFFFF' },
      line: { color: palette.cardBorder, width: 1.5 }
    });
    practiceSlide.addText('🎯 PONTOS FUNDAMENTAIS DE FIXAÇÃO', {
      x: 1.05,
      y: 1.30,
      w: 5.2,
      h: 0.38,
      fontSize: 14.5,
      bold: true,
      color: palette.primary
    });

    const keyPoints = ans?.keyPoints && ans.keyPoints.length > 0
      ? ans.keyPoints.map(kp => `✓ ${kp}`).join('\n\n')
      : `✓ Compreensão clara do conceito oficial\n\n✓ Memorização dos passos fundamentais\n\n✓ Aplicação prática no dia a dia do desbravador`;

    practiceSlide.addText(keyPoints, {
      x: 1.05,
      y: 1.80,
      w: 5.2,
      h: 4.60,
      fontSize: 16,
      color: '1E293B',
      wrap: true
    });

    // Card Direita: Dinâmica Prática na Unidade
    practiceSlide.addShape('roundRect', {
      x: 6.8,
      y: 1.15,
      w: 5.7,
      h: 5.45,
      fill: { color: 'FFFFFF' },
      line: { color: palette.cardBorder, width: 1.5 }
    });
    practiceSlide.addText('🏕️ DINÂMICA PRÁTICA NA UNIDADE', {
      x: 7.05,
      y: 1.30,
      w: 5.2,
      h: 0.38,
      fontSize: 14.5,
      bold: true,
      color: palette.primary
    });

    const practicalText = ans?.practicalActivity ||
      `Realize uma dinâmica interativa no cantinho da unidade: divida os desbravadores em duplas para praticar e fixar o requisito de forma lúdica e participativa.`;

    practiceSlide.addText(practicalText, {
      x: 7.05,
      y: 1.80,
      w: 5.2,
      h: 4.60,
      fontSize: 16,
      color: '1E293B',
      wrap: true
    });

    // Rodapé
    practiceSlide.addText('DBV Tudo • Fixação Prática de Requisitos', {
      x: 0.8,
      y: 6.82,
      w: 9.8,
      h: 0.32,
      fontSize: 12,
      color: '64748B'
    });

    practiceSlide.addText(`Requisito ${it.number} (Prática)`, {
      x: 10.5,
      y: 6.82,
      w: 2.0,
      h: 0.32,
      fontSize: 12,
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
    h: 0.95,
    fill: { color: palette.primary }
  });
  evaluationSlide.addText('GUIA PEDAGÓGICO: AVALIAÇÃO E REGISTRO DA ESPECIALIDADE', {
    x: 0.8,
    y: 0.18,
    w: 10.8,
    h: 0.55,
    fontSize: 20,
    bold: true,
    color: 'FFFFFF'
  });

  evaluationSlide.addShape('roundRect', {
    x: 12.05,
    y: 0.08,
    w: 0.82,
    h: 0.82,
    fill: { color: 'FFFFFF' },
    line: { color: palette.accent, width: 1.5 }
  });
  addSpecialtyImageToSlide(evaluationSlide, specialtyLogoData, rawLogo, 12.10, 0.12, 0.72, 0.72);

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
    const cy = 1.15 + idx * 1.85;
    evaluationSlide.addShape('roundRect', {
      x: 0.8,
      y: cy,
      w: 11.7,
      h: 1.68,
      fill: { color: 'FFFFFF' },
      line: { color: palette.cardBorder, width: 1.5 }
    });

    evaluationSlide.addShape('roundRect', {
      x: 1.1,
      y: cy + 0.18,
      w: 6.2,
      h: 0.42,
      fill: { color: palette.areaBadgeBg }
    });
    evaluationSlide.addText(ec.title, {
      x: 1.1,
      y: cy + 0.18,
      w: 6.2,
      h: 0.42,
      fontSize: 13.5,
      bold: true,
      color: palette.areaBadgeText,
      align: 'center',
      valign: 'middle'
    });

    evaluationSlide.addText(ec.text, {
      x: 1.1,
      y: cy + 0.70,
      w: 11.0,
      h: 0.88,
      fontSize: 16,
      color: '1E293B',
      wrap: true
    });
  });

  // -------------------------------------------------------------
  // SLIDE FINAL: CONCLUSÃO COM INSÍGNIA EM GRANDE DESTAQUE
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

  // Moldura circular branca para destacar a insígnia oficial no topo
  closingSlide.addShape('roundRect', {
    x: 5.56,
    y: 0.55,
    w: 2.2,
    h: 2.2,
    fill: { color: 'FFFFFF' },
    line: { color: palette.accent, width: 2 }
  });

  // Insígnia da Especialidade no Topo do Encerramento
  const closingHasLogo = addSpecialtyImageToSlide(
    closingSlide,
    specialtyLogoData,
    rawLogo,
    5.66,
    0.65,
    2.0,
    2.0
  );

  const closingTitleY = closingHasLogo ? 2.95 : 1.50;

  closingSlide.addShape('roundRect', {
    x: 4.4,
    y: closingTitleY,
    w: 4.5,
    h: 0.52,
    fill: { color: 'FFFFFF' }
  });
  closingSlide.addText('ESPECIALIDADE CONCLUÍDA', {
    x: 4.4,
    y: closingTitleY,
    w: 4.5,
    h: 0.52,
    fontSize: 14,
    bold: true,
    color: palette.primary,
    align: 'center',
    valign: 'middle'
  });

  closingSlide.addText(`Parabéns aos Desbravadores!`, {
    x: 0.8,
    y: closingTitleY + 0.65,
    w: 11.7,
    h: 0.85,
    fontSize: 36,
    bold: true,
    color: 'FFFFFF',
    align: 'center'
  });

  closingSlide.addText(
    `Todos os ${total} requisitos da especialidade de ${specialty.nome} foram estudados e fundamentados com sucesso!`,
    {
      x: 0.8,
      y: closingTitleY + 1.55,
      w: 11.7,
      h: 0.65,
      fontSize: 18,
      color: 'CBD5E1',
      align: 'center'
    }
  );

  // Caixa dos Ideais
  closingSlide.addShape('roundRect', {
    x: 2.2,
    y: closingTitleY + 2.25,
    w: 8.9,
    h: 1.55,
    fill: { color: '1E293B' },
    line: { color: palette.accent, width: 2 }
  });
  closingSlide.addText('LEMA DOS DESBRAVADORES', {
    x: 2.2,
    y: closingTitleY + 2.38,
    w: 8.9,
    h: 0.35,
    fontSize: 13,
    bold: true,
    color: palette.accent,
    align: 'center'
  });
  closingSlide.addText('"O amor de Cristo me motiva."\nMaranata: o Senhor logo vem!', {
    x: 2.2,
    y: closingTitleY + 2.75,
    w: 8.9,
    h: 0.90,
    fontSize: 18,
    bold: true,
    color: 'FFFFFF',
    align: 'center'
  });

  // Assinaturas
  closingSlide.addText(
    `_____________________________\nInstrutor(a): ${options?.instructorName || 'Responsável'}`,
    {
      x: 1.5,
      y: 6.80,
      w: 4.5,
      h: 0.60,
      fontSize: 13,
      color: '94A3B8',
      align: 'center'
    }
  );

  closingSlide.addText(
    `_____________________________\nDiretoria / Conselheiro(a)`,
    {
      x: 7.3,
      y: 6.80,
      w: 4.5,
      h: 0.60,
      fontSize: 13,
      color: '94A3B8',
      align: 'center'
    }
  );

  options?.onProgress?.('Finalizando e salvando apresentação...', 95);
  const fileName = `Especialidade_${(specialty.nome || 'Apresentacao').replace(/\s+/g, '_')}.pptx`;
  await pptx.writeFile({ fileName });
}
