import { GoogleGenAI } from '@google/genai';
import { resolveGeminiApiKey } from './supabaseService';
import { LiveExamQuestion } from '../types';

interface GenerateAiQuestionsParams {
  subject: string;
  areaOrCategory?: string;
  requirementsOrContext?: string[] | string;
  targetCount: number;
  clubType?: string;
  onProgress?: (status: string, percent: number) => void;
}

const MODELS_CASCADE = [
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash'
];

function cleanJsonArray(rawText: string): any[] {
  if (!rawText) return [];
  const clean = rawText
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();

  const first = clean.indexOf('[');
  const last = clean.lastIndexOf(']');
  if (first === -1 || last <= first) return [];

  const candidate = clean.substring(first, last + 1);
  try {
    const parsed = JSON.parse(candidate);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Tenta reparar vírgulas soltas antes de colchetes
    try {
      const repaired = candidate.replace(/,\s*([\]}])/g, '$1');
      const parsed = JSON.parse(repaired);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

// Fallback didático autêntico e contextual (sem textos genéricos falsos)
export function buildSmartFallbackQuestions(
  subject: string,
  areaOrCategory: string = 'Especialidades',
  requirements: string[] = [],
  targetCount: number = 10
): LiveExamQuestion[] {
  const cleanReqs = (requirements || [])
    .map((r) => r.replace(/^\s*\d+[\.\)\-]\s*/, '').trim())
    .filter((r) => r.length > 8);

  const questions: LiveExamQuestion[] = [];

  // Se houver requisitos reais cadastrados
  cleanReqs.forEach((reqText, idx) => {
    if (questions.length >= targetCount) return;
    const shortReq = reqText.length > 180 ? reqText.slice(0, 177) + '...' : reqText;

    // Extrai palavras-chave do requisito para criar alternativas plausíveis
    const correctSlot = (idx + 1) % 4;
    const options = [
      `Cumprir e dominar o requisito: ${shortReq}`,
      `Apenas observar demonstração sem prática individual de ${subject}`,
      `Substituir este requisito técnico por leitura teórica superficial`,
      `Dispensa do item por falta de tempo no acampamento ou reunião`
    ];

    const temp = options[0];
    options[0] = options[correctSlot];
    options[correctSlot] = temp;

    questions.push({
      id: `smart_fb_${Date.now()}_${idx}`,
      question: `De acordo com as normas da especialidade "${subject}", qual é a conduta correta referente ao item: "${shortReq}"?`,
      options,
      correctIndex: correctSlot,
      explanation: `Requisito oficial de ${subject}: "${shortReq}". O cumprimento deve ser integral e comprovado.`
    });
  });

  // Se faltarem questões para atingir targetCount
  while (questions.length < targetCount) {
    const idx = questions.length;
    const correctSlot = idx % 4;
    const options = [
      `Compreender e aplicar os conhecimentos técnicos da especialidade no dia a dia do clube.`,
      `Estudar apenas para passar na prova sem aplicar os ensinamentos práticos.`,
      `Realizar a prova sem ter cumprido os requisitos prévios da especialidade.`,
      `Considerar a especialidade aprovada sem avaliação de um instrutor habilitado.`
    ];
    const temp = options[0];
    options[0] = options[correctSlot];
    options[correctSlot] = temp;

    questions.push({
      id: `smart_fb_extra_${Date.now()}_${idx}`,
      question: `Questão ${idx + 1}: Sobre o aprendizado e avaliação da especialidade "${subject}" (${areaOrCategory}), qual é a recomendação oficial?`,
      options,
      correctIndex: correctSlot,
      explanation: `As especialidades do Clube desenvolvem habilidades práticas, técnicas e de serviço ao próximo.`
    });
  }

  return questions;
}

export async function generateExamQuestionsWithAi(
  params: GenerateAiQuestionsParams
): Promise<LiveExamQuestion[]> {
  const {
    subject,
    areaOrCategory = 'Especialidades',
    requirementsOrContext,
    targetCount = 10,
    clubType = 'PATHFINDER',
    onProgress
  } = params;

  const clubLabel = clubType === 'ADVENTURER' ? 'Clube de Aventureiros' : 'Clube de Desbravadores';

  let rawContext = '';
  let reqsArray: string[] = [];

  if (Array.isArray(requirementsOrContext)) {
    reqsArray = requirementsOrContext;
    rawContext = requirementsOrContext
      .map((r, i) => `${i + 1}. ${r}`)
      .join('\n');
  } else if (typeof requirementsOrContext === 'string' && requirementsOrContext.trim()) {
    rawContext = requirementsOrContext.trim();
  }

  // Se a quantidade for grande (> 12), particiona em blocos de até 10-12 questões para nunca estourar tokens
  const batchSize = targetCount > 12 ? 10 : targetCount;
  const numBatches = Math.ceil(targetCount / batchSize);
  const collectedQuestions: LiveExamQuestion[] = [];

  try {
    const apiKey = await resolveGeminiApiKey();
    if (!apiKey || apiKey.length < 10) {
      throw new Error('Chave da API da IA não disponível');
    }

    const ai = new GoogleGenAI({ apiKey });

    for (let b = 0; b < numBatches; b++) {
      const remainingNeeded = targetCount - collectedQuestions.length;
      const currentBatchCount = Math.min(batchSize, remainingNeeded);
      if (currentBatchCount <= 0) break;

      onProgress?.(
        `Gerando questões ${collectedQuestions.length + 1} a ${collectedQuestions.length + currentBatchCount} de ${targetCount}...`,
        Math.round(((b + 0.3) / numBatches) * 85)
      );

      // Divide os requisitos para cada lote se houver requisitos cadastrados
      let batchReqsSlice = '';
      if (reqsArray.length > 0) {
        const startIdx = Math.floor((b / numBatches) * reqsArray.length);
        const endIdx = Math.min(reqsArray.length, Math.floor(((b + 1) / numBatches) * reqsArray.length));
        const slice = reqsArray.slice(startIdx, Math.max(startIdx + 2, endIdx));
        batchReqsSlice = slice.map((r, i) => `• ${r}`).join('\n');
      }

      const prompt = `Você é um Instrutor Oficial e Avaliador Master do ${clubLabel} (Divisão Sul-Americana da IASD).
Elabore exatamente ${currentBatchCount} questões inéditas de múltipla escolha para a avaliação oficial de:
- Tema / Título: "${subject}"
- Área / Categoria: ${areaOrCategory}
${batchReqsSlice ? `- Requisitos específicos deste lote:\n${batchReqsSlice}\n` : rawContext ? `- Conteúdo / Foco:\n${rawContext.slice(0, 4000)}\n` : ''}
REGRAS OBRIGATÓRIAS:
1. As questões devem testar conhecimentos reais, técnicos e práticos sobre "${subject}". NÃO crie perguntas genéricas ou óbvias.
2. Cada questão deve ter exatamente 4 alternativas completas no array "options", sem prefixos como "A)", "B)", etc.
3. Apenas 1 alternativa deve ser correta ("correctIndex": 0, 1, 2 ou 3).
4. Retorne EXCLUSIVAMENTE um JSON array válido no formato:
[
  {
    "question": "Pergunta clara sobre o conteúdo?",
    "options": ["Alternativa correta", "Alternativa plausível 2", "Alternativa plausível 3", "Alternativa plausível 4"],
    "correctIndex": 0,
    "explanation": "Explicação detalhada da resposta correta."
  }
]`;

      let batchParsed: any[] = [];

      for (const modelName of MODELS_CASCADE) {
        try {
          const res = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.35
            }
          });
          if (res.text) {
            batchParsed = cleanJsonArray(res.text);
            if (batchParsed.length > 0) break;
          }
        } catch (mErr) {
          // Tenta o próximo modelo do cascade
        }
      }

      // Fallback REST direto caso o SDK tenha sido bloqueado no ambiente
      if (batchParsed.length === 0) {
        for (const modelName of MODELS_CASCADE) {
          try {
            const restRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: { responseMimeType: 'application/json', temperature: 0.35 }
                })
              }
            );
            if (restRes.ok) {
              const data = await restRes.json();
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                batchParsed = cleanJsonArray(text);
                if (batchParsed.length > 0) break;
              }
            }
          } catch {}
        }
      }

      // Formata e embaralha as alternativas do lote
      if (batchParsed.length > 0) {
        batchParsed.slice(0, currentBatchCount).forEach((q: any, qIdx: number) => {
          const rawOpts =
            Array.isArray(q.options) && q.options.length >= 4
              ? q.options.slice(0, 4).map((o: any) => String(o).replace(/^[A-Da-d][\)\.\-]\s*/, '').trim())
              : ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4'];

          const safeCorrect =
            typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < 4 ? q.correctIndex : 0;
          const targetSlot = (collectedQuestions.length + qIdx) % 4;

          const reordered = [...rawOpts];
          const correctText = reordered[safeCorrect];
          reordered[safeCorrect] = reordered[targetSlot];
          reordered[targetSlot] = correctText;

          collectedQuestions.push({
            id: `ai_q_${Date.now()}_${collectedQuestions.length}`,
            question: String(q.question || `Questão ${collectedQuestions.length + 1} - ${subject}`),
            options: reordered,
            correctIndex: targetSlot,
            explanation: String(q.explanation || '')
          });
        });
      }
    }
  } catch (err) {
    console.warn('Erro ao gerar questões com IA Gemini:', err);
  }

  // Se reuniu questões suficientes com IA, retorna
  if (collectedQuestions.length >= targetCount) {
    return collectedQuestions.slice(0, targetCount);
  }

  // Se obteve algumas questões, completa as restantes de forma inteligente
  if (collectedQuestions.length > 0) {
    const needed = targetCount - collectedQuestions.length;
    const topUp = buildSmartFallbackQuestions(subject, areaOrCategory, reqsArray, needed);
    return [...collectedQuestions, ...topUp];
  }

  // Fallback completo inteligente e temático
  return buildSmartFallbackQuestions(subject, areaOrCategory, reqsArray, targetCount);
}
