
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const SUPABASE_URL = 'https://qfpyjavbncijowjvznkg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHlqYXZibmNpam93anZ6bmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDcxMDUsImV4cCI6MjA3NDQyMzEwNX0.adxRCkobV-m_XUHp1KBXmg67VXkR-HL4QKFVtgQOmYc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncUniformeGalaSelective() {
  const url = 'https://mda.wiki.br/Uniforme_de_Gala/';
  console.log('Buscando conteúdo de:', url);
  
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const container = $('#page-content .text-justify');
  if (!container.length) return;

  const uniformesList = [];
  
  // Entrada Master para agrupar apenas quem tem "Uniforme"
  const groupUniforme = {
    id: `grp-uniforme`,
    titulo: 'Uniforme de Gala',
    descricao: 'Compilação de todos os modelos de Uniforme de Gala dos Desbravadores.',
    subitems: [],
    blocks: [],
    club: 'PATHFINDER'
  };

  let currentItem: any = null;
  let currentSubItem: any = null;
  let pendingImages: any[] = [];

  const elements = container.contents().toArray();

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const node = $(el);
    const tagName = el.name ? el.name.toLowerCase() : null;

    if (tagName === 'h2') {
      const title = node.text().trim();
      if (title.toLowerCase().includes('veja também') || title.toLowerCase().includes('links')) continue;

      currentItem = {
        id: `item-${Math.random().toString(36).substr(2, 5)}`,
        titulo: title,
        descricao: '',
        subitems: [],
        blocks: [],
        club: 'PATHFINDER'
      };
      
      if (pendingImages.length > 0) {
        currentItem.blocks.push(...pendingImages);
        pendingImages = [];
      }
      
      // LOGICA DE AGRUPAMENTO SELETIVO
      if (title.toLowerCase().includes('uniforme')) {
        groupUniforme.subitems.push(currentItem);
      } else {
        uniformesList.push(currentItem);
      }
      
      currentSubItem = null;
    } else if (tagName === 'h3' || tagName === 'h4') {
      if (!currentItem) continue;
      currentSubItem = {
        id: `sub-${Math.random().toString(36).substr(2, 5)}`,
        titulo: node.text().trim(),
        descricao: '',
        blocks: [],
        subitems: []
      };
      if (pendingImages.length > 0) {
        currentSubItem.blocks.push(...pendingImages);
        pendingImages = [];
      }
      currentItem.subitems.push(currentSubItem);
    } else {
      let block: any = null;
      if (el.type === 'text') {
        const textValue = node.text().trim();
        if (textValue && textValue.length > 5) block = { id: Math.random().toString(36).substr(2, 9), type: 'text', content: textValue };
      } else if (tagName === 'figure' || tagName === 'img' || (tagName === 'a' && node.find('img').length > 0)) {
        const imgNode = tagName === 'img' ? node : node.find('img');
        const src = imgNode.attr('src');
        if (src && !src.includes('pixel')) block = { id: Math.random().toString(36).substr(2, 9), type: 'image', content: src };
      } else if (tagName === 'p') {
        const text = node.text().trim();
        if (text && text.length > 2 && !text.includes('Saiba mais')) block = { id: Math.random().toString(36).substr(2, 9), type: 'text', content: text };
      } else if (tagName === 'ul' || tagName === 'ol') {
        const listText = node.find('li').map((j, li) => $(li).text().trim()).get().join('\n• ');
        if (listText) block = { id: Math.random().toString(36).substr(2, 9), type: 'text', content: `• ${listText}` };
      }

      if (block) {
        if (block.type === 'image') {
          let nextTag = null;
          for (let j = i + 1; j < elements.length; j++) {
            const nextEl: any = elements[j];
            if (nextEl.type === 'tag') { nextTag = nextEl.name.toLowerCase(); break; }
          }
          if (nextTag === 'h2' || nextTag === 'h3' || nextTag === 'h4') pendingImages.push(block);
          else {
            const target = currentSubItem || currentItem || groupUniforme;
            target.blocks.push(block);
          }
        } else {
          const target = currentSubItem || currentItem || groupUniforme;
          target.blocks.push(block);
        }
      }
    }
  }

  // Se o grupo de uniformes tiver itens, adicionamos ele à lista final
  if (groupUniforme.subitems.length > 0) {
    uniformesList.unshift(groupUniforme); // Colocar o grupo no topo
  }

  // Pós-processamento
  function processBlocks(blocks: any[]) {
    const processed = [];
    const seen = new Set();
    for (const b of blocks) {
      const key = `${b.type}:${b.content.trim()}`;
      if (seen.has(key)) continue;
      processed.push(b);
      seen.add(key);
    }
    return processed;
  }

  uniformesList.forEach((item: any) => {
    item.blocks = processBlocks(item.blocks);
    item.subitems.forEach((sub: any) => {
      sub.blocks = processBlocks(sub.blocks);
      const sFirstText = sub.blocks.find((b: any) => b.type === 'text');
      if (sFirstText) sub.descricao = sFirstText.content.substring(0, 150);
    });
  });

  console.log(`Sincronizando ${uniformesList.length} entradas (incluindo o grupo Uniforme de Gala).`);
  const { error } = await supabase.from('Cultura').update({ uniformes_list: uniformesList }).eq('club_type', 'PATHFINDER');
  if (error) console.error('Erro:', error.message);
  else console.log('Sucesso! Apenas itens com "Uniforme" foram agrupados.');
}

syncUniformeGalaSelective();
