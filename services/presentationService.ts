import pptxgen from 'pptxgenjs';
import { Especialidade } from '../types';

export interface GeneratePptxOptions {
  instructorName?: string;
  clubName?: string;
  unitName?: string;
  includeAiAnswers?: boolean;
  onProgress?: (status: string, percent: number) => void;
}

export function isRequirementSubItem(req: string): boolean {
  if (!req) return false;
  const trimmed = req.trim();
  return /^[a-z]\)/i.test(trimmed) || /^[a-z]\./i.test(trimmed) || /^[-•*]/.test(trimmed) || /^\d+\.\d+/.test(trimmed);
}

export function parseAndNormalizeRequirements(requisitos: string[]): {
  items: Array<{ number: number; text: string; subItems: string[] }>;
} {
  const items: Array<{ number: number; text: string; subItems: string[] }> = [];
  let currentItem: { number: number; text: string; subItems: string[] } | null = null;
  let counter = 1;

  for (const rawReq of requisitos || []) {
    const trimmed = rawReq.trim();
    if (!trimmed) continue;

    if (isRequirementSubItem(trimmed) && currentItem) {
      currentItem.subItems.push(trimmed);
    } else {
      const matchNum = trimmed.match(/^(\d+)[\.\-\)]\s*(.*)$/);
      const text = matchNum ? matchNum[2] : trimmed;
      const num = matchNum ? parseInt(matchNum[1], 10) : counter;
      currentItem = { number: num, text, subItems: [] };
      items.push(currentItem);
      counter++;
    }
  }

  return { items };
}

export async function generateSpecialtyPowerPoint(
  specialty: Especialidade,
  options?: GeneratePptxOptions
): Promise<void> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  options?.onProgress?.('Criando slides da especialidade...', 30);

  // Slide de Capa
  const coverSlide = pptx.addSlide();
  coverSlide.background = { color: '1E293B' };
  coverSlide.addText(specialty.nome || 'Especialidade', {
    x: 1,
    y: 1.8,
    w: '80%',
    h: 1.5,
    fontSize: 36,
    bold: true,
    color: 'F59E0B',
    align: 'center'
  });

  const subtitle = [
    specialty.area ? `Área: ${specialty.area}` : '',
    options?.clubName ? `Clube: ${options.clubName}` : '',
    options?.instructorName ? `Instrutor: ${options.instructorName}` : ''
  ].filter(Boolean).join(' • ');

  if (subtitle) {
    coverSlide.addText(subtitle, {
      x: 1,
      y: 3.5,
      w: '80%',
      h: 0.8,
      fontSize: 18,
      color: 'E2E8F0',
      align: 'center'
    });
  }

  const parsed = parseAndNormalizeRequirements(specialty.requisitos || []);
  const total = parsed.items.length;

  for (let i = 0; i < total; i++) {
    const item = parsed.items[i];
    options?.onProgress?.(`Gerando slide ${i + 1} de ${total}...`, Math.min(90, 40 + Math.floor((i / total) * 50)));

    const slide = pptx.addSlide();
    slide.background = { color: 'F8FAFC' };

    slide.addText(`Requisito ${item.number}`, {
      x: 0.8,
      y: 0.6,
      w: '85%',
      h: 0.5,
      fontSize: 22,
      bold: true,
      color: '1E3A8A'
    });

    slide.addText(item.text, {
      x: 0.8,
      y: 1.3,
      w: '85%',
      h: 2.2,
      fontSize: 18,
      color: '334155',
      bullet: false
    });

    if (item.subItems.length > 0) {
      const subText = item.subItems.map(s => `• ${s}`).join('\n');
      slide.addText(subText, {
        x: 1.2,
        y: 3.6,
        w: '80%',
        h: 2.5,
        fontSize: 14,
        color: '475569'
      });
    }
  }

  options?.onProgress?.('Finalizando e salvando apresentação...', 95);
  const fileName = `Especialidade_${(specialty.nome || 'Apresentacao').replace(/\s+/g, '_')}.pptx`;
  await pptx.writeFile({ fileName });
}
