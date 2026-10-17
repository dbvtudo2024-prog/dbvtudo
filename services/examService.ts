import { jsPDF } from 'jspdf';
import { Especialidade, ClubType } from '../types';
import { parseAndNormalizeRequirements } from './presentationService';

export type ExamFormatMode = 'MULTIPLE_CHOICE' | 'DISCURSIVE' | 'MIXED' | 'MISTA';

export interface ExamQuestion {
  number: number;
  question: string;
  options?: any[];
  correctIndex?: number;
  answer?: string;
  referenceRequirement?: string;
  requirementRef?: string;
  weight?: number;
  stem?: string;
  type?: string;
  correctOption?: string;
  vfStatements?: any[];
  expectedAnswer?: string;
}

export interface GenerateExamOptions {
  instructorName?: string;
  clubName?: string;
  unitName?: string;
  examDate?: string;
  minPassingGrade?: number | string;
  questionCount?: number | 'ALL';
  formatMode?: ExamFormatMode;
  includeAnswerKey?: boolean;
  includePracticalChecklist?: boolean;
  clubType?: ClubType;
  preGeneratedQuestions?: ExamQuestion[];
  onProgress?: (status: string, percent: number) => void;
}

import { generateExamQuestionsWithAi } from './examAiService';

export async function generateSpecialtyExamQuestions(
  specialty: Especialidade,
  options?: GenerateExamOptions
): Promise<ExamQuestion[]> {
  const count = typeof options?.questionCount === 'number' && options.questionCount > 0 ? options.questionCount : 10;
  options?.onProgress?.('Elaborando questões oficiais com IA...', 25);

  try {
    const aiQuestions = await generateExamQuestionsWithAi({
      subject: specialty.nome,
      areaOrCategory: specialty.area,
      requirementsOrContext: specialty.requisitos,
      targetCount: count,
      clubType: options?.clubType || 'PATHFINDER',
      onProgress: (status, pct) => options?.onProgress?.(status, Math.min(85, pct))
    });

    return aiQuestions.map((q, idx) => ({
      number: idx + 1,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      answer: q.explanation || q.options[q.correctIndex],
      referenceRequirement: `Requisito ${idx + 1}`
    }));
  } catch (err) {
    console.warn('Fallback na elaboração de questões do exame:', err);
    const parsed = parseAndNormalizeRequirements(specialty.requisitos || []);
    const reqList = parsed.items;
    const questions: ExamQuestion[] = [];

    for (let i = 0; i < count; i++) {
      const req = reqList[i % Math.max(1, reqList.length)];
      const qNum = i + 1;
      const reqRef = req ? `Requisito ${req.number}` : undefined;
      const reqText = req ? req.text : `Conhecimento prático da especialidade de ${specialty.nome}`;

      questions.push({
        number: qNum,
        question: `Sobre o aprendizado de "${specialty.nome}", analise a aplicação prática do item: "${reqText}". Qual alternativa representa o procedimento oficial correto?`,
        options: [
          `Cumprimento integral e demonstração prática do requisito junto à unidade.`,
          `Execução simplificada sem acompanhamento ou aprovação do instrutor.`,
          `Substituição por atividade recreativa não homologada no manual.`,
          `Apenas leitura rápida sem realização dos exercícios práticos solicitados.`
        ],
        correctIndex: 0,
        referenceRequirement: reqRef
      });
    }
    return questions;
  }
}

export async function generateSpecialtyExamPdf(
  specialty: Especialidade,
  options?: GenerateExamOptions
): Promise<ExamQuestion[]> {
  options?.onProgress?.('Preparando documento PDF...', 20);

  const questions = options?.preGeneratedQuestions && options.preGeneratedQuestions.length > 0
    ? options.preGeneratedQuestions
    : await generateSpecialtyExamQuestions(specialty, options);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Cabeçalho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`AVALIAÇÃO OFICIAL: ${specialty.nome.toUpperCase()}`, 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const clubName = options?.clubName ? `Clube: ${options.clubName}` : 'Clube de Desbravadores e Aventureiros';
  const instr = options?.instructorName ? `Instrutor: ${options.instructorName}` : '';
  const dateStr = options?.examDate ? `Data: ${options.examDate}` : `Data: ${new Date().toLocaleDateString('pt-BR')}`;
  doc.text(`${clubName}  |  ${instr}  |  ${dateStr}`, 105, 27, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(15, 30, 195, 30);

  doc.text('Nome do Desbravador(a): ____________________________________________________  Unidade: ___________', 15, 37);

  doc.line(15, 41, 195, 41);

  let y = 48;
  for (const q of questions) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const qHeader = `${q.number}) ${q.question}`;
    const splitQ = doc.splitTextToSize(qHeader, 180);
    doc.text(splitQ, 15, y);
    y += splitQ.length * 5 + 2;

    doc.setFont('helvetica', 'normal');
    if (q.options && q.options.length > 0) {
      const letters = ['a)', 'b)', 'c)', 'd)'];
      for (let oi = 0; oi < q.options.length; oi++) {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        const optLine = `    ${letters[oi]} ${q.options[oi]}`;
        const splitOpt = doc.splitTextToSize(optLine, 175);
        doc.text(splitOpt, 15, y);
        y += splitOpt.length * 4.5;
      }
      y += 3;
    } else {
      doc.line(20, y + 6, 190, y + 6);
      doc.line(20, y + 14, 190, y + 14);
      y += 18;
    }
  }

  // Gabarito se solicitado
  if (options?.includeAnswerKey) {
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`GABARITO OFICIAL — ${specialty.nome.toUpperCase()}`, 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let gy = 32;
    const letters = ['A', 'B', 'C', 'D'];
    for (const q of questions) {
      if (gy > 270) {
        doc.addPage();
        gy = 20;
      }
      const ans = q.correctIndex !== undefined ? letters[q.correctIndex] : (q.answer || 'Critério prático');
      const ref = q.referenceRequirement ? ` (${q.referenceRequirement})` : '';
      doc.text(`Questão ${q.number}: ${ans}${ref}`, 20, gy);
      gy += 6;
    }
  }

  options?.onProgress?.('Salvando arquivo PDF...', 90);
  const fileName = `Prova_${specialty.nome.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);

  return questions;
}
