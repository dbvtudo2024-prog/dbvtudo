
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const SUPABASE_URL = 'https://qfpyjavbncijowjvznkg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHlqYXZibmNpam93anZ6bmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDcxMDUsImV4cCI6MjA3NDQyMzEwNX0.adxRCkobV-m_XUHp1KBXmg67VXkR-HL4QKFVtgQOmYc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncUniformeGalaFinal() {
  const url = 'https://mda.wiki.br/Uniforme_de_Gala/';
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const container = $('#page-content .text-justify');
  if (!container.length) return;

  const uniformesList: any[] = [];
  const groupUniforme: any = {
    id: `grp-uniforme`,
    titulo: 'Uniforme de Gala',
    descricao: 'Compilação de todos os modelos de Uniforme de Gala dos Desbravadores.',
    subitems: [],
    blocks: [],
    club: 'PATHFINDER'
  };

  let currentCategory: any = null;
  let currentSubItem: any = null;
  let allElements = container.contents().toArray();

  // Mapeamento sequencial para processar imagens pré-cabeçalho
  let blocksWithContext: any[] = [];

  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    const node = $(el);
    const type = el.type;
    const tagName = el.name ? el.name.toLowerCase() : null;

    if (tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
      blocksWithContext.push({ type: 'header', tag: tagName, content: node.text().trim() });
    } else if (tagName === 'figure' || tagName === 'img' || (tagName === 'a' && node.find('img').length > 0)) {
      const src = tagName === 'img' ? node.attr('src') : node.find('img').attr('src');
      if (src && !src.includes('pixel')) {
        blocksWithContext.push({ type: 'image', content: src });
      }
    } else if (type === 'text') {
      const text = node.text().trim();
      if (text.length > 3) blocksWithContext.push({ type: 'text', content: text });
    } else if (tagName === 'p') {
      const text = node.text().trim();
      if (text.length > 2 && !text.includes('Saiba mais')) blocksWithContext.push({ type: 'text', content: text });
      node.find('img').each((i, img) => {
        const src = $(img).attr('src');
        if (src && !src.includes('pixel')) blocksWithContext.push({ type: 'image', content: src });
      });
    } else if (tagName === 'ul' || tagName === 'ol') {
      const listText = node.find('li').map((j, li) => $(li).text().trim()).get().join('\n• ');
      if (listText) blocksWithContext.push({ type: 'text', content: `• ${listText}` });
    }
  }

  // Atribuição Inteligente baseada no feedback do usuário
  // "Saia em baixo de Saia" -> Imagem que vem ANTES de Saia deve ir para Saia.
  for (let i = 0; i < blocksWithContext.length; i++) {
    const block = blocksWithContext[i];

    if (block.type === 'header') {
      const title = block.content;
      if (block.tag === 'h2') {
        if (title.toLowerCase().includes('veja também')) { currentCategory = null; continue; }
        currentCategory = { id: `cat-${Math.random().toString(36).substr(2, 5)}`, titulo: title, subitems: [], blocks: [], club: 'PATHFINDER' };
        if (title.toLowerCase().includes('uniforme')) groupUniforme.subitems.push(currentCategory);
        else uniformesList.push(currentCategory);
        currentSubItem = null;
      } else {
        if (!currentCategory) continue;
        currentSubItem = { id: `sub-${Math.random().toString(36).substr(2, 5)}`, titulo: title, blocks: [], subitems: [] };
        currentCategory.subitems.push(currentSubItem);
      }
    } else if (block.type === 'image') {
      // LOOK-AHEAD: Se a imagem vem ANTES de um cabeçalho, ela pertence a esse cabeçalho
      let belongsToNext = false;
      for (let j = i + 1; j < Math.min(i + 3, blocksWithContext.length); j++) {
        if (blocksWithContext[j].type === 'header') {
          belongsToNext = true;
          // Não fazemos nada aqui, vamos esperar o loop chegar no header e "puxar" a imagem?
          // Melhor: Atribuímos agora se o header for encontrado
          const nextHeader = blocksWithContext[j];
          // Criamos o objeto antecipadamente se necessário? Não, vamos apenas marcar e o loop do header cuidará.
          break;
        }
      }

      if (belongsToNext) {
        // Encontrar o próximo header e colocar lá
        for (let j = i + 1; j < blocksWithContext.length; j++) {
          if (blocksWithContext[j].type === 'header') {
             if (!blocksWithContext[j].pendingImages) blocksWithContext[j].pendingImages = [];
             blocksWithContext[j].pendingImages.push({ id: Math.random().toString(36).substr(2, 9), type: 'image', content: block.content });
             break;
          }
        }
      } else {
        // Pertence ao item atual
        const target = currentSubItem || currentCategory || groupUniforme;
        target.blocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'image', content: block.content });
      }
    } else {
      // Texto simples
      const target = currentSubItem || currentCategory || groupUniforme;
      target.blocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'text', content: block.content });
    }
  }

  // Agora processamos os "pendingImages" que os headers acumularam
  const finalProcess = (item: any, headerBlock: any) => {
    if (headerBlock && headerBlock.pendingImages) {
      item.blocks.unshift(...headerBlock.pendingImages);
    }
  };

  // Re-mapear para garantir que as imagens pendentes entrem nos objetos finais
  let headerIdx = 0;
  const headers = blocksWithContext.filter(b => b.type === 'header');
  
  // Vamos reconstruir a lista final com as imagens pendentes nos lugares certos
  // Para simplificar, vou apenas rodar uma limpeza final no uniformesList
  const attachPending = (list: any[]) => {
    list.forEach(item => {
      const h = headers.find(h => h.content === item.titulo);
      if (h && h.pendingImages) {
        item.blocks.unshift(...h.pendingImages);
      }
      if (item.subitems) attachPending(item.subitems);
    });
  };
  attachPending(uniformesList);
  attachPending([groupUniforme]);

  if (groupUniforme.subitems.length > 0) uniformesList.unshift(groupUniforme);

  const clean = (item: any) => {
    const seen = new Set();
    item.blocks = item.blocks.filter((b: any) => {
      const k = `${b.type}:${b.content}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (item.subitems) item.subitems.forEach(clean);
  };
  uniformesList.forEach(clean);

  await supabase.from('Cultura').update({ uniformes_list: uniformesList }).eq('club_type', 'PATHFINDER');
  console.log('Sincronização PERFEITA concluída. Imagens agora seguem os títulos!');
}

syncUniformeGalaFinal();
