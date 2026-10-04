import { jsPDF } from 'jspdf';
import { Especialidade, ClubType } from '../types';
import { resolveGeminiApiKey, fetchEspecialidades, fetchEspecialidadeRequisitos } from './supabaseService';
import {
  parseAndNormalizeRequirements,
  ParsedRequirementItem,
  buildDetailedDidacticData,
  loadImageDataUrl
} from './presentationService';

export type ExamFormatMode = 'MISTA' | 'MULTIPLA_ESCOLHA' | 'DISCURSIVA_PRATICA';

export interface ExamGenerationOptions {
  instructorName?: string;
  clubName?: string;
  unitName?: string;
  examDate?: string;
  minPassingGrade?: string;
  questionCount?: number | 'ALL';
  formatMode?: ExamFormatMode;
  includeAnswerKey?: boolean;
  includePracticalChecklist?: boolean;
  clubType?: ClubType;
  preGeneratedQuestions?: ExamQuestion[];
  onProgress?: (status: string, percent: number) => void;
}

export interface ExamQuestionOption {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface ExamVfStatement {
  text: string;
  isTrue: boolean;
}

export interface ExamQuestion {
  number: number;
  requirementRef: string;
  originalRequirement: string;
  type: 'MULTIPLA_ESCOLHA' | 'VERDADEIRO_FALSO' | 'DISCURSIVA' | 'PRATICA';
  weight: number;
  stem: string;
  options?: ExamQuestionOption[];
  vfStatements?: ExamVfStatement[];
  linesCount?: number;
  correctOption?: 'A' | 'B' | 'C' | 'D';
  expectedAnswer: string;
  gradingCriteria?: string;
}

function extractAndParseJsonArray(rawText: string): any[] {
  if (!rawText || typeof rawText !== 'string') return [];
  let text = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    text = text.substring(firstBracket, lastBracket + 1);
  }

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') {
      const arrVal = Object.values(parsed).find(v => Array.isArray(v));
      if (Array.isArray(arrVal)) return arrVal;
    }
  } catch {
    try {
      let inString = false;
      let escaped = false;
      let sanitized = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (escaped) {
          sanitized += ch;
          escaped = false;
          continue;
        }
        if (ch === '\\') {
          sanitized += ch;
          escaped = true;
          continue;
        }
        if (ch === '"') {
          inString = !inString;
          sanitized += ch;
          continue;
        }
        if (inString && (ch === '\n' || ch === '\r' || ch === '\t')) {
          sanitized += ch === '\t' ? ' ' : '\\n';
          continue;
        }
        sanitized += ch;
      }
      const parsedSanitized = JSON.parse(sanitized);
      if (Array.isArray(parsedSanitized)) return parsedSanitized;
    } catch {}
  }

  return [];
}

async function callAiForExamBatch(prompt: string, apiKey: string): Promise<any[]> {
  // 1. Chamada prioritária via rota server-side (/api/gemini/generate-didactic)
  if (typeof window !== 'undefined') {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 11000);
    try {
      const response = await fetch('/api/gemini/generate-didactic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          responseMimeType: 'application/json',
          temperature: 0.35
        }),
        signal: controller.signal
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const resJson = await response.json();
          if (resJson && resJson.text) {
            const parsed = extractAndParseJsonArray(resJson.text);
            if (parsed.length > 0) {
              return parsed;
            }
          }
        }
      }
    } catch (srvErr) {
      console.warn('Tentativa server-side para prova falhou, usando fallback:', srvErr);
    } finally {
      clearTimeout(timer);
    }
  }

  // 2. Fallback REST caso a rota serverless não esteja disponível
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  if (apiKey && apiKey.length > 10) {
    for (const modelName of candidateModels) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 13000);
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.35
              }
            }),
            signal: controller.signal
          }
        );

        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const parsed = extractAndParseJsonArray(text);
          if (parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn(`Tentativa com ${modelName} na geração de prova falhou:`, e);
      } finally {
        clearTimeout(timer);
      }
    }
  }

  return [];
}

function decideQuestionType(
  item: ParsedRequirementItem,
  index: number,
  formatMode: ExamFormatMode
): 'MULTIPLA_ESCOLHA' | 'VERDADEIRO_FALSO' | 'DISCURSIVA' | 'PRATICA' {
  const lower = item.originalText.toLowerCase();
  const isPracticalReq =
    lower.includes('demonstrar') ||
    lower.includes('fazer') ||
    lower.includes('construir') ||
    lower.includes('montar') ||
    lower.includes('amarrar') ||
    lower.includes('praticar') ||
    lower.includes('executar') ||
    lower.includes('acampamento') ||
    lower.includes('participar') ||
    lower.includes('apresentar');

  if (formatMode === 'MULTIPLA_ESCOLHA') {
    return 'MULTIPLA_ESCOLHA';
  }

  if (formatMode === 'DISCURSIVA_PRATICA') {
    return isPracticalReq ? 'PRATICA' : 'DISCURSIVA';
  }

  // Modo MISTA: equilibra múltipla escolha, verdadeiro/falso, discursiva e prática
  if (isPracticalReq && index % 3 === 2) {
    return 'PRATICA';
  }
  const mod = index % 5;
  if (mod === 0 || mod === 1 || mod === 3) {
    return 'MULTIPLA_ESCOLHA';
  }
  if (mod === 2) {
    return 'VERDADEIRO_FALSO';
  }
  return 'DISCURSIVA';
}

function buildFallbackExamQuestion(
  item: ParsedRequirementItem,
  questionNumber: number,
  totalQuestions: number,
  weight: number,
  targetType: 'MULTIPLA_ESCOLHA' | 'VERDADEIRO_FALSO' | 'DISCURSIVA' | 'PRATICA',
  specialty: Especialidade
): ExamQuestion {
  const didactic = buildDetailedDidacticData(item, questionNumber, totalQuestions, specialty);
  const reqLabel = `Requisito ${item.itemNumber}`;
  const cleanQ = item.cleanQuestion.replace(/\s+/g, ' ').trim();
  const subText = item.subItems && item.subItems.length > 0
    ? ` (${item.subItems.slice(0, 4).join('; ')})`
    : '';

  const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const correctIdx = (questionNumber + item.cleanQuestion.length) % 4;
  const correctLetter = letters[correctIdx];

  if (targetType === 'MULTIPLA_ESCOLHA') {
    const correctText = didactic.keyPoints[0]
      ? `${didactic.keyPoints[0]} ${didactic.keyPoints[1] || ''}`.trim()
      : didactic.didacticAnswer.split('.').slice(0, 2).join('. ').trim() + '.';

    const distractors = [
      `Realizar o procedimento sem necessidade de planejamento prévio, ignorando os parâmetros técnicos de ${specialty.nome}.`,
      `Substituir o cumprimento prático e técnico deste quesito apenas por observação informal, sem supervisão do instrutor.`,
      `Priorizar a velocidade de execução em detrimento das normas de segurança, conservação e precisão exigidas no manual oficial.`
    ];

    const options: ExamQuestionOption[] = [];
    let dIdx = 0;
    for (let i = 0; i < 4; i++) {
      if (i === correctIdx) {
        options.push({
          letter: letters[i],
          text: correctText.length > 195 ? correctText.substring(0, 192) + '...' : correctText
        });
      } else {
        options.push({
          letter: letters[i],
          text: distractors[dIdx++]
        });
      }
    }

    return {
      number: questionNumber,
      requirementRef: reqLabel,
      originalRequirement: item.originalText,
      type: 'MULTIPLA_ESCOLHA',
      weight,
      stem: `Considerando os requisitos oficiais da especialidade de ${specialty.nome} sobre "${cleanQ}"${subText}, assinale a alternativa CORRETA:`,
      options,
      correctOption: correctLetter,
      expectedAnswer: `Alternativa ${correctLetter}. ${didactic.didacticAnswer}`,
      gradingCriteria: 'Questão objetiva: pontuação integral mediante marcação exclusiva da alternativa correta.'
    };
  }

  if (targetType === 'VERDADEIRO_FALSO') {
    const kp1 = didactic.keyPoints[0] || `O domínio correto deste requisito exige atenção aos fundamentos técnicos de ${specialty.nome}.`;
    const kp2 = didactic.keyPoints[1] || `A aplicação segura e fiel às orientações do instrutor é indispensável nesta especialidade.`;

    const vfStatements: ExamVfStatement[] = [
      { text: kp1, isTrue: true },
      { text: `Na especialidade de ${specialty.nome}, este requisito pode ser cumprido sem observar regras de segurança ou técnica.`, isTrue: false },
      { text: kp2, isTrue: true },
      { text: `O registro e a comprovação prática perante o avaliador são dispensáveis para a homologação deste item.`, isTrue: false }
    ];

    const seq = vfStatements.map(s => (s.isTrue ? 'V' : 'F')).join(' - ');

    return {
      number: questionNumber,
      requirementRef: reqLabel,
      originalRequirement: item.originalText,
      type: 'VERDADEIRO_FALSO',
      weight,
      stem: `Analise as afirmativas abaixo referentes ao requisito "${cleanQ}"${subText} e classifique cada uma como Verdadeira (V) ou Falsa (F):`,
      vfStatements,
      expectedAnswer: `Sequência correta: (${seq}). ${didactic.didacticAnswer}`,
      gradingCriteria: `Atribuir ${(weight / 4).toFixed(2).replace('.', ',')} pt para cada parêntese preenchido corretamente.`
    };
  }

  if (targetType === 'PRATICA') {
    return {
      number: questionNumber,
      requirementRef: reqLabel,
      originalRequirement: item.originalText,
      type: 'PRATICA',
      weight,
      stem: `[AVALIAÇÃO PRÁTICA / DEMONSTRAÇÃO] ${cleanQ}${subText}. Descreva abaixo os passos executados ou realize a demonstração prática diretamente ao instrutor:`,
      linesCount: 3,
      expectedAnswer: `${didactic.didacticAnswer} Atividade sugerida: ${didactic.practicalActivity}`,
      gradingCriteria: `O candidato deve demonstrar na prática ou descrever com precisão: ${didactic.keyPoints.join(' | ')}`
    };
  }

  // DISCURSIVA
  return {
    number: questionNumber,
    requirementRef: reqLabel,
    originalRequirement: item.originalText,
    type: 'DISCURSIVA',
    weight,
    stem: `${cleanQ}${subText}`,
    linesCount: item.subItems && item.subItems.length > 2 ? 5 : 4,
    expectedAnswer: didactic.didacticAnswer,
    gradingCriteria: `Pontos essenciais que devem constar na resposta: ${didactic.keyPoints.join('; ')}`
  };
}

export async function ensureSpecialtyRequirementsLoaded(
  specialty: Especialidade,
  clubType: ClubType = ClubType.PATHFINDER
): Promise<string[]> {
  if (specialty.requisitos && specialty.requisitos.length > 0) {
    return specialty.requisitos;
  }

  const effectiveClub = specialty.club || clubType;
  if (specialty.id) {
    try {
      const direct = await fetchEspecialidadeRequisitos(effectiveClub, Number(specialty.id));
      if (direct && direct.length > 0) return direct;
    } catch {}
  }

  try {
    const allList = await fetchEspecialidades(effectiveClub);
    const matched = allList.find(
      s => String(s.id) === String(specialty.id) || (s.nome && specialty.nome && s.nome.toLowerCase() === specialty.nome.toLowerCase())
    );
    if (matched && matched.requisitos && matched.requisitos.length > 0) {
      return matched.requisitos;
    }
  } catch {}

  return [
    'Explicar os conceitos fundamentais e objetivos práticos desta especialidade.',
    'Demonstrar conhecimento das normas de segurança e materiais necessários.',
    'Cumprir as atividades práticas determinadas pelo instrutor da especialidade.'
  ];
}

export async function generateSpecialtyExamQuestions(
  specialty: Especialidade,
  options: ExamGenerationOptions = {}
): Promise<ExamQuestion[]> {
  const {
    questionCount = 10,
    formatMode = 'MISTA',
    clubType = ClubType.PATHFINDER,
    onProgress
  } = options;

  if (onProgress) onProgress('Carregando requisitos oficiais da especialidade...', 10);

  const rawReqs = await ensureSpecialtyRequirementsLoaded(specialty, clubType);
  const parsed = parseAndNormalizeRequirements(rawReqs);
  const allItems = parsed.items;

  // Seleciona os itens que comporão a prova
  let selectedItems: ParsedRequirementItem[] = [];
  const targetTotal = questionCount === 'ALL'
    ? Math.min(20, Math.max(1, allItems.length))
    : Math.max(1, Number(questionCount) || 10);

  if (allItems.length <= targetTotal) {
    selectedItems = [...allItems];
    // Se o instrutor pediu mais questões do que o número de requisitos principais, desdobra requisitos com sub-itens
    let extraIdx = 0;
    while (selectedItems.length < targetTotal && allItems.length > 0 && questionCount !== 'ALL') {
      const sourceItem = allItems[extraIdx % allItems.length];
      selectedItems.push({
        itemNumber: `${sourceItem.itemNumber}.${Math.floor(extraIdx / allItems.length) + 2}`,
        originalText: sourceItem.originalText,
        cleanQuestion: sourceItem.subItems && sourceItem.subItems.length > 0
          ? `${sourceItem.cleanQuestion} — Foco específico: ${sourceItem.subItems[extraIdx % sourceItem.subItems.length]}`
          : `Aprofundamento prático do item ${sourceItem.itemNumber}: ${sourceItem.cleanQuestion}`,
        subItems: sourceItem.subItems || []
      });
      extraIdx++;
    }
  } else {
    // Distribui uniformemente entre todos os requisitos da especialidade para cobrir início, meio e fim
    for (let i = 0; i < targetTotal; i++) {
      const pos = Math.min(
        allItems.length - 1,
        Math.floor((i * allItems.length) / targetTotal)
      );
      selectedItems.push(allItems[pos]);
    }
  }

  const totalQ = selectedItems.length;
  const baseWeight = Math.floor((10 / totalQ) * 100) / 100;

  // Planeja o tipo de cada questão
  const plannedQuestions = selectedItems.map((it, idx) => {
    const qType = decideQuestionType(it, idx, formatMode);
    const weight = idx === totalQ - 1
      ? Number((10 - baseWeight * (totalQ - 1)).toFixed(2))
      : Number(baseWeight.toFixed(2));
    return { item: it, number: idx + 1, type: qType, weight };
  });

  if (onProgress) onProgress('Elaborando questões pedagógicas e gabarito com IA...', 25);

  const apiKey = await resolveGeminiApiKey();

  // Divide em lotes de até 4 questões para resposta rápida e estruturada
  const batches: typeof plannedQuestions[] = [];
  for (let i = 0; i < plannedQuestions.length; i += 4) {
    batches.push(plannedQuestions.slice(i, i + 4));
  }

  let completedBatches = 0;
  const ministryName = (specialty.club || clubType) === ClubType.ADVENTURER
    ? 'Clube de Aventureiros'
    : 'Clube de Desbravadores';

  const batchResults = await Promise.all(
    batches.map(async (batch, bIdx) => {
      if (bIdx > 0) {
        await new Promise(r => setTimeout(r, bIdx * 120));
      }

      const itemsSpec = batch.map(q => {
        const subs = q.item.subItems && q.item.subItems.length > 0
          ? `\n   Sub-itens: ${q.item.subItems.join(' | ')}`
          : '';
        return `QUESTÃO ${q.number} [Tipo Obrigatório: ${q.type}] (Baseada no Requisito ${q.item.itemNumber}): ${q.item.cleanQuestion}${subs}`;
      }).join('\n\n');

      const prompt = `Você é um Instrutor Master e Avaliador Oficial do ${ministryName} (Divisão Sul-Americana - IASD).
Elabore as questões da PROVA OFICIAL da especialidade "${specialty.nome}" (Área: ${specialty.area || 'Geral'}, Código: ${specialty.codigo || ''}) seguindo estritamente os requisitos abaixo:

${itemsSpec}

REGRAS OBRIGATÓRIAS DE ELABORAÇÃO:
1. Cada questão deve avaliar o conteúdo técnico REAL exigido pelo respectivo requisito oficial da especialidade "${specialty.nome}".
2. Respeite o "Tipo Obrigatório" de cada questão:
   - Se for "MULTIPLA_ESCOLHA": crie um enunciado claro e contextualizado ("stem") e exatamente 4 alternativas ("options") com letras "A", "B", "C", "D". Apenas UMA alternativa deve ser verdadeira ("correctOption": "A"|"B"|"C"|"D") e as outras 3 devem ser distratores plausíveis mas incorretos. Varie a letra correta entre A, B, C e D.
   - Se for "VERDADEIRO_FALSO": crie um enunciado ("stem") e exatamente 4 afirmativas técnicas em "vfStatements" (misturando verdadeiras e falsas, com "isTrue": true ou false).
   - Se for "DISCURSIVA": crie uma pergunta aberta clara ("stem") que exija explicação escrita do candidato, definindo "linesCount": 4.
   - Se for "PRATICA": crie um enunciado prático ("stem") para demonstração técnica ou relato prático ao instrutor, definindo "linesCount": 3.
3. Em TODAS as questões, preencha "expectedAnswer" com o GABARITO OFICIAL COMPLETO E DETALHADO (a resposta real exata da pergunta, explicando o porquê) e "gradingCriteria" com o critério de correção para o instrutor.

Retorne EXCLUSIVAMENTE um JSON array válido no formato:
[
  {
    "number": ${batch[0]?.number || 1},
    "type": "MULTIPLA_ESCOLHA",
    "stem": "Enunciado completo da questão...",
    "options": [
      { "letter": "A", "text": "Texto da alternativa A" },
      { "letter": "B", "text": "Texto da alternativa B" },
      { "letter": "C", "text": "Texto da alternativa C" },
      { "letter": "D", "text": "Texto da alternativa D" }
    ],
    "correctOption": "B",
    "vfStatements": [
      { "text": "Afirmativa 1", "isTrue": true },
      { "text": "Afirmativa 2", "isTrue": false },
      { "text": "Afirmativa 3", "isTrue": true },
      { "text": "Afirmativa 4", "isTrue": false }
    ],
    "linesCount": 4,
    "expectedAnswer": "Gabarito comentado detalhado com a resposta exata...",
    "gradingCriteria": "Critério objetivo para o instrutor corrigir..."
  }
]`;

      const aiParsed = await callAiForExamBatch(prompt, apiKey);

      completedBatches++;
      if (onProgress) {
        const pct = Math.min(75, 25 + Math.round((completedBatches / batches.length) * 50));
        onProgress(`Gerando questões e gabarito comentado (${completedBatches}/${batches.length})...`, pct);
      }

      return { batch, aiParsed };
    })
  );

  const finalQuestions: ExamQuestion[] = [];

  for (const { batch, aiParsed } of batchResults) {
    for (let i = 0; i < batch.length; i++) {
      const planned = batch[i];
      const found = Array.isArray(aiParsed)
        ? (aiParsed.find((p: any) => Number(p?.number) === planned.number) || aiParsed[i])
        : null;

      if (found && typeof found.stem === 'string' && found.stem.trim().length > 10) {
        const qType = planned.type;

        if (qType === 'MULTIPLA_ESCOLHA' && Array.isArray(found.options) && found.options.length >= 4) {
          const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
          const rawNormalized = letters.map((letCode, idx) => {
            const optObj = found.options.find((o: any) => String(o?.letter || '').toUpperCase() === letCode) || found.options[idx] || {};
            const cleanOptText = String(optObj.text || '')
              .replace(/^[A-Da-d][\)\.\-\:]\s*/, '')
              .trim();
            return {
              letter: letCode,
              text: cleanOptText || `Alternativa ${letCode}`
            };
          });

          const rawCorrect = String(found.correctOption || 'A').toUpperCase().trim();
          const origCorrectLetter: 'A' | 'B' | 'C' | 'D' = (['A', 'B', 'C', 'D'].includes(rawCorrect) ? rawCorrect : 'A') as any;
          const origCorrectIdx = letters.indexOf(origCorrectLetter);
          const correctText = rawNormalized[origCorrectIdx >= 0 ? origCorrectIdx : 0].text;
          const wrongTexts = rawNormalized
            .filter((_, idx) => idx !== (origCorrectIdx >= 0 ? origCorrectIdx : 0))
            .map((o) => o.text)
            .sort(() => Math.random() - 0.5);

          // Sorteia uma posição equilibrada evitando repetir a mesma letra da questão anterior
          const prevCorrectLetter = finalQuestions.length > 0 ? finalQuestions[finalQuestions.length - 1].correctOption : undefined;
          const candidateLetters = letters.filter((l) => l !== prevCorrectLetter);
          const chosenLetter = candidateLetters[Math.floor(Math.random() * candidateLetters.length)] || letters[planned.number % 4];
          const chosenIdx = letters.indexOf(chosenLetter);

          let wrongPtr = 0;
          const normalizedOptions: ExamQuestionOption[] = letters.map((letCode, idx) => ({
            letter: letCode,
            text: idx === chosenIdx ? correctText : (wrongTexts[wrongPtr++] || `Alternativa ${letCode}`)
          }));

          const rawExpected = String(found.expectedAnswer || '').replace(/^Alternativa\s+(correta\s*:?\s*)?[A-Da-d][\.\:\-\s]*/i, '').trim();

          finalQuestions.push({
            number: planned.number,
            requirementRef: `Requisito ${planned.item.itemNumber}`,
            originalRequirement: planned.item.originalText,
            type: 'MULTIPLA_ESCOLHA',
            weight: planned.weight,
            stem: found.stem.trim(),
            options: normalizedOptions,
            correctOption: chosenLetter,
            expectedAnswer: rawExpected ? `Alternativa ${chosenLetter}. ${rawExpected}` : `Alternativa correta: ${chosenLetter}.`,
            gradingCriteria: found.gradingCriteria || 'Marcação exclusiva da alternativa correta.'
          });
          continue;
        }

        if (qType === 'VERDADEIRO_FALSO' && Array.isArray(found.vfStatements) && found.vfStatements.length >= 3) {
          const vfList: ExamVfStatement[] = found.vfStatements.slice(0, 4).map((st: any) => ({
            text: String(st?.text || '').replace(/^\([VFvf\s]\)\s*/, '').trim(),
            isTrue: Boolean(st?.isTrue)
          }));
          const seq = vfList.map(s => (s.isTrue ? 'V' : 'F')).join(' - ');
          finalQuestions.push({
            number: planned.number,
            requirementRef: `Requisito ${planned.item.itemNumber}`,
            originalRequirement: planned.item.originalText,
            type: 'VERDADEIRO_FALSO',
            weight: planned.weight,
            stem: found.stem.trim(),
            vfStatements: vfList,
            expectedAnswer: `Sequência correta: (${seq}). ${found.expectedAnswer || ''}`.trim(),
            gradingCriteria: found.gradingCriteria || 'Pontuação proporcional aos itens classificados corretamente.'
          });
          continue;
        }

        if (qType === 'DISCURSIVA' || qType === 'PRATICA') {
          finalQuestions.push({
            number: planned.number,
            requirementRef: `Requisito ${planned.item.itemNumber}`,
            originalRequirement: planned.item.originalText,
            type: qType,
            weight: planned.weight,
            stem: found.stem.trim(),
            linesCount: qType === 'PRATICA' ? 3 : (Number(found.linesCount) || 4),
            expectedAnswer: found.expectedAnswer || 'O candidato deve responder conforme os requisitos técnicos da especialidade.',
            gradingCriteria: found.gradingCriteria || 'Avaliar clareza, domínio conceitual e fidelidade aos manuais oficiais.'
          });
          continue;
        }
      }

      // Fallback determinístico caso alguma questão do lote não venha no formato esperado
      finalQuestions.push(
        buildFallbackExamQuestion(
          planned.item,
          planned.number,
          totalQ,
          planned.weight,
          planned.type,
          specialty
        )
      );
    }
  }

  return finalQuestions;
}

export async function generateSpecialtyExamPdf(
  specialty: Especialidade,
  options: ExamGenerationOptions = {}
): Promise<ExamQuestion[]> {
  const {
    instructorName = '',
    clubName = '',
    unitName = '',
    examDate = new Date().toLocaleDateString('pt-BR'),
    minPassingGrade = '7,0 (70%)',
    includeAnswerKey = true,
    includePracticalChecklist = true,
    clubType = ClubType.PATHFINDER,
    preGeneratedQuestions,
    onProgress
  } = options;

  const isAdventurer = (specialty.club || clubType) === ClubType.ADVENTURER;
  const primaryRgb: [number, number, number] = isAdventurer ? [128, 0, 0] : [67, 56, 202]; // #800000 ou Indigo-700

  // Carrega o emblema da especialidade e gera as questões em paralelo
  const [logoDataUrl, questions] = await Promise.all([
    specialty.logo ? loadImageDataUrl(specialty.logo) : Promise.resolve(null),
    preGeneratedQuestions && preGeneratedQuestions.length > 0
      ? Promise.resolve(preGeneratedQuestions)
      : generateSpecialtyExamQuestions(specialty, options)
  ]);

  if (onProgress) onProgress('Diagramando folha de avaliação e gabarito em PDF...', 85);

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();   // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const innerWidth = pageWidth - margin * 2; // 182mm
  let currentY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 16) {
      pdf.addPage();
      currentY = margin + 2;
      return true;
    }
    return false;
  };

  // =========================================================================
  // 1. CABEÇALHO OFICIAL DA PROVA (TOPO DA PÁGINA 1)
  // =========================================================================
  // Faixa superior institucional
  pdf.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  pdf.roundedRect(margin, currentY, innerWidth, 8, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(255, 255, 255);
  const headerBannerText = isAdventurer
    ? 'AVENTUREIROS • AVALIAÇÃO DE ESPECIALIDADE'
    : 'DESBRAVADORES • AVALIAÇÃO DE ESPECIALIDADE';
  pdf.text(headerBannerText, pageWidth / 2, currentY + 5.3, { align: 'center' });
  currentY += 10;

  // Box principal de identificação da Especialidade e Nota
  const specBoxHeight = 26;
  pdf.setDrawColor(203, 213, 225); // slate-300
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.roundedRect(margin, currentY, innerWidth, specBoxHeight, 2.5, 2.5, 'FD');

  let textStartX = margin + 4;
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, 'PNG', margin + 3.5, currentY + 3, 20, 20);
      textStartX = margin + 26.5;
    } catch {}
  }

  const scoreBoxWidth = 44;
  const maxTitleWidth = innerWidth - (textStartX - margin) - scoreBoxWidth - 4;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(15, 23, 42); // slate-900
  const titleLines = pdf.splitTextToSize(specialty.nome.toUpperCase(), maxTitleWidth);
  pdf.text(titleLines.slice(0, 2), textStartX, currentY + 8);

  const metaY = currentY + (titleLines.length > 1 ? 18 : 14);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  const codeStr = specialty.codigo || `${specialty.sigla || 'ESP'}${String(specialty.id || '').padStart(3, '0')}`;
  const areaStr = specialty.area ? `ÁREA: ${specialty.area.toUpperCase()}` : 'ESPECIALIDADE OFICIAL';
  pdf.text(`${areaStr}   •   CÓDIGO: ${codeStr}`, textStartX, metaY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    `Total de Questões: ${questions.length}   •   Valor Total: 10,0 pontos   •   Mínimo para Aprovação: ${minPassingGrade}`,
    textStartX,
    metaY + 5
  );

  // Quadro lateral de Nota e Conceito
  const scoreBoxX = margin + innerWidth - scoreBoxWidth - 2.5;
  pdf.setDrawColor(148, 163, 184);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(scoreBoxX, currentY + 2.5, scoreBoxWidth, specBoxHeight - 5, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(71, 85, 105);
  pdf.text('NOTA / CONCEITO FINAL', scoreBoxX + scoreBoxWidth / 2, currentY + 6.8, { align: 'center' });

  pdf.setDrawColor(226, 232, 240);
  pdf.line(scoreBoxX + 3, currentY + 8.5, scoreBoxX + scoreBoxWidth - 3, currentY + 8.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(30, 41, 59);
  pdf.text('_____ / 10,0', scoreBoxX + scoreBoxWidth / 2, currentY + 15, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('(  ) Aprovado   (  ) Refazer', scoreBoxX + scoreBoxWidth / 2, currentY + 21, { align: 'center' });

  currentY += specBoxHeight + 3;

  // =========================================================================
  // 2. QUADRO DE IDENTIFICAÇÃO DO CANDIDATO(A)
  // =========================================================================
  const idBoxHeight = 20;
  pdf.setDrawColor(203, 213, 225);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin, currentY, innerWidth, idBoxHeight, 2, 2, 'FD');

  // Linha divisória horizontal
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, currentY + 10, margin + innerWidth, currentY + 10);

  // Linha 1: Nome do Candidato + Data
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('CANDIDATO(A):', margin + 3, currentY + 6.5);

  // Divisória vertical para Data
  const dateColX = margin + innerWidth - 45;
  pdf.line(dateColX, currentY, dateColX, currentY + 10);
  pdf.text('DATA:', dateColX + 3, currentY + 6.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(15, 23, 42);
  pdf.text(examDate || '____/____/______', dateColX + 13, currentY + 6.5);

  // Linha 2: Clube + Unidade + Instrutor
  const unitColX = margin + 62;
  const instColX = margin + 114;
  pdf.line(unitColX, currentY + 10, unitColX, currentY + 20);
  pdf.line(instColX, currentY + 10, instColX, currentY + 20);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(71, 85, 105);
  pdf.text('CLUBE:', margin + 3, currentY + 16.5);
  if (clubName.trim()) {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(15, 23, 42);
    pdf.text(clubName.trim().substring(0, 26), margin + 15, currentY + 16.5);
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(71, 85, 105);
  pdf.text('UNIDADE:', unitColX + 3, currentY + 16.5);
  if (unitName.trim()) {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(15, 23, 42);
    pdf.text(unitName.trim().substring(0, 20), unitColX + 18, currentY + 16.5);
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(71, 85, 105);
  pdf.text('INSTRUTOR(A):', instColX + 3, currentY + 16.5);
  if (instructorName.trim()) {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(15, 23, 42);
    pdf.text(instructorName.trim().substring(0, 25), instColX + 25, currentY + 16.5);
  }

  currentY += idBoxHeight + 3;

  // Faixa de instruções rápidas
  pdf.setFillColor(241, 245, 249);
  pdf.roundedRect(margin, currentY, innerWidth, 7, 1.5, 1.5, 'F');
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7.2);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    'Orientação: Responda com clareza e letra legível. Nas questões de múltipla escolha, assinale apenas uma opção.',
    margin + 3,
    currentY + 4.6
  );
  currentY += 10;

  // =========================================================================
  // 3. RENDERIZAÇÃO DAS QUESTÕES DA PROVA
  // =========================================================================
  questions.forEach((q) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    const stemLines = pdf.splitTextToSize(q.stem, innerWidth - 6);

    // Calcula altura estimada do bloco da questão para não quebrar feio
    let estimatedBlockHeight = 8 + stemLines.length * 4.5 + 4;
    if (q.type === 'MULTIPLA_ESCOLHA' && q.options) {
      q.options.forEach(opt => {
        const optLines = pdf.splitTextToSize(opt.text, innerWidth - 16);
        estimatedBlockHeight += Math.max(5.5, optLines.length * 4.3 + 1.5);
      });
    } else if (q.type === 'VERDADEIRO_FALSO' && q.vfStatements) {
      q.vfStatements.forEach(st => {
        const stLines = pdf.splitTextToSize(st.text, innerWidth - 18);
        estimatedBlockHeight += Math.max(5.5, stLines.length * 4.3 + 1.5);
      });
    } else if (q.type === 'PRATICA') {
      estimatedBlockHeight += 24;
    } else {
      estimatedBlockHeight += (q.linesCount || 4) * 6.5 + 3;
    }

    checkPageBreak(Math.min(estimatedBlockHeight, 95));

    // Barra de título da Questão
    pdf.setFillColor(241, 245, 249); // slate-100
    pdf.roundedRect(margin, currentY, innerWidth, 6.8, 1.5, 1.5, 'F');
    pdf.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    pdf.rect(margin, currentY, 2.2, 6.8, 'F');

    const typeBadgeLabel =
      q.type === 'MULTIPLA_ESCOLHA'
        ? 'MÚLTIPLA ESCOLHA'
        : q.type === 'VERDADEIRO_FALSO'
        ? 'VERDADEIRO OU FALSO'
        : q.type === 'PRATICA'
        ? 'DEMONSTRAÇÃO PRÁTICA'
        : 'QUESTÃO DISCURSIVA';

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(30, 41, 59);
    pdf.text(
      `QUESTÃO ${String(q.number).padStart(2, '0')}   •   ${q.requirementRef.toUpperCase()}   (${typeBadgeLabel})`,
      margin + 5,
      currentY + 4.7
    );

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.8);
    pdf.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    pdf.text(
      `Valor: ${q.weight.toFixed(1).replace('.', ',')} pt`,
      margin + innerWidth - 3,
      currentY + 4.7,
      { align: 'right' }
    );

    currentY += 9.5;

    // Enunciado da questão
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(stemLines, margin + 2, currentY);
    currentY += stemLines.length * 4.5 + 2.5;

    // Corpo da questão conforme o tipo
    if (q.type === 'MULTIPLA_ESCOLHA' && q.options) {
      q.options.forEach(opt => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const optLines = pdf.splitTextToSize(opt.text, innerWidth - 16);
        checkPageBreak(optLines.length * 4.3 + 3);

        // Caixinha de alternativa ( A )
        pdf.setDrawColor(148, 163, 184);
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(margin + 3, currentY - 3.3, 6.5, 4.8, 1, 1, 'FD');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.8);
        pdf.setTextColor(51, 65, 85);
        pdf.text(opt.letter, margin + 6.25, currentY + 0.1, { align: 'center' });

        // Texto da alternativa
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(30, 41, 59);
        pdf.text(optLines, margin + 12, currentY);
        currentY += Math.max(5.5, optLines.length * 4.3 + 1.8);
      });
      currentY += 2;
    } else if (q.type === 'VERDADEIRO_FALSO' && q.vfStatements) {
      q.vfStatements.forEach(st => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const stLines = pdf.splitTextToSize(st.text, innerWidth - 18);
        checkPageBreak(stLines.length * 4.3 + 3);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(51, 65, 85);
        pdf.text('(     )', margin + 3, currentY);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(30, 41, 59);
        pdf.text(stLines, margin + 14, currentY);
        currentY += Math.max(5.5, stLines.length * 4.3 + 1.8);
      });
      currentY += 2;
    } else if (q.type === 'PRATICA') {
      // Linhas de relato + Quadro de Homologação do Avaliador
      const linesToDraw = q.linesCount || 2;
      pdf.setDrawColor(203, 213, 225);
      for (let l = 0; l < linesToDraw; l++) {
        checkPageBreak(7);
        currentY += 5.5;
        pdf.line(margin + 2, currentY, margin + innerWidth - 2, currentY);
      }
      currentY += 3;

      if (includePracticalChecklist) {
        checkPageBreak(15);
        pdf.setDrawColor(203, 213, 225);
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(margin + 2, currentY, innerWidth - 4, 11, 1.5, 1.5, 'FD');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(71, 85, 105);
        pdf.text('PARECER PRÁTICO DO AVALIADOR:', margin + 5, currentY + 4.3);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          '[   ] Executou com Perfeição (100%)      [   ] Executou Parcialmente (50%)      [   ] Necessita Refazer',
          margin + 5,
          currentY + 8.8
        );
        currentY += 14;
      }
    } else {
      // Questão Discursiva com linhas pautadas
      const linesToDraw = q.linesCount || 4;
      pdf.setDrawColor(203, 213, 225);
      for (let l = 0; l < linesToDraw; l++) {
        checkPageBreak(7);
        currentY += 6.2;
        pdf.line(margin + 2, currentY, margin + innerWidth - 2, currentY);
      }
      currentY += 4;
    }
  });

  // =========================================================================
  // 4. ASSINATURAS NO FINAL DA PROVA DO CANDIDATO
  // =========================================================================
  checkPageBreak(26);
  currentY += 12;
  pdf.setDrawColor(148, 163, 184);
  const sigWidth = 74;
  pdf.line(margin + 8, currentY, margin + 8 + sigWidth, currentY);
  pdf.line(pageWidth - margin - 8 - sigWidth, currentY, pageWidth - margin - 8, currentY);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('ASSINATURA DO CANDIDATO(A)', margin + 8 + sigWidth / 2, currentY + 4.5, { align: 'center' });
  pdf.text('ASSINATURA DO INSTRUTOR(A) / DIRETOR(A)', pageWidth - margin - 8 - sigWidth / 2, currentY + 4.5, { align: 'center' });

  // =========================================================================
  // 5. PÁGINA DESTACÁVEL DE GABARITO OFICIAL DO INSTRUTOR (SE ATIVADO)
  // =========================================================================
  if (includeAnswerKey) {
    pdf.addPage();
    currentY = margin;

    // Banner do Gabarito
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.roundedRect(margin, currentY, innerWidth, 12, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text('GABARITO OFICIAL E GUIA DE CORREÇÃO DO INSTRUTOR', pageWidth / 2, currentY + 5.5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(203, 213, 225);
    pdf.text(
      `Especialidade: ${specialty.nome.toUpperCase()} (${codeStr}) • Folha Exclusiva do Avaliador (Destacar antes de entregar a prova)`,
      pageWidth / 2,
      currentY + 9.8,
      { align: 'center' }
    );
    currentY += 15;

    // Resumo rápido das questões de múltipla escolha (se houver)
    const objectiveQs = questions.filter(q => q.type === 'MULTIPLA_ESCOLHA' && q.correctOption);
    if (objectiveQs.length > 0) {
      pdf.setDrawColor(203, 213, 225);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, currentY, innerWidth, 14, 2, 2, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(51, 65, 85);
      pdf.text('RESUMO RÁPIDO — CARTÃO-RESPOSTA OBJETIVO:', margin + 3.5, currentY + 5);

      const summaryLine = objectiveQs
        .map(q => `Q${String(q.number).padStart(2, '0')}: [ ${q.correctOption} ]`)
        .join('    •    ');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      const sumLines = pdf.splitTextToSize(summaryLine, innerWidth - 7);
      pdf.text(sumLines[0] || summaryLine, margin + 3.5, currentY + 10.5);
      currentY += 18;
    }

    // Resolução detalhada questão por questão
    questions.forEach((q) => {
      const answerPrefix =
        q.type === 'MULTIPLA_ESCOLHA' && q.correctOption
          ? `RESPOSTA CORRETA: Alternativa (${q.correctOption}) — `
          : '';
      const fullAnswerText = `${answerPrefix}${q.expectedAnswer}`;
      const ansLines = pdf.splitTextToSize(fullAnswerText, innerWidth - 8);
      const critLines = q.gradingCriteria
        ? pdf.splitTextToSize(`Critério de Avaliação: ${q.gradingCriteria}`, innerWidth - 8)
        : [];

      const boxHeight = 8 + ansLines.length * 4.2 + (critLines.length > 0 ? critLines.length * 3.8 + 2 : 0) + 3;
      checkPageBreak(boxHeight + 3);

      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, currentY, innerWidth, boxHeight, 2, 2, 'FD');

      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(margin, currentY, innerWidth, 6, 1.5, 1.5, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(15, 23, 42);
      pdf.text(
        `QUESTÃO ${String(q.number).padStart(2, '0')} (${q.requirementRef}) — Valor: ${q.weight.toFixed(1).replace('.', ',')} pt`,
        margin + 3.5,
        currentY + 4.2
      );

      let innerY = currentY + 10;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text(ansLines, margin + 4, innerY);
      innerY += ansLines.length * 4.2 + 1.5;

      if (critLines.length > 0) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(7.8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(critLines, margin + 4, innerY);
      }

      currentY += boxHeight + 3;
    });
  }

  // =========================================================================
  // 6. RODAPÉ PADRONIZADO EM TODAS AS PÁGINAS
  // =========================================================================
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.2);
    pdf.setTextColor(148, 163, 184);
    pdf.text(
      `${isAdventurer ? 'Clube de Aventureiros (DSA)' : 'Clube de Desbravadores (DSA)'} • Avaliação Oficial da Especialidade: ${specialty.nome} (${codeStr})`,
      margin,
      pageHeight - 6.8
    );
    pdf.text(
      `Página ${p} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 6.8,
      { align: 'right' }
    );
  }

  if (onProgress) onProgress('Concluído! Iniciando download do PDF...', 100);

  const safeName = specialty.nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  pdf.save(`Prova_${safeName}.pdf`);
  return questions;
}
