
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const SUPABASE_URL = 'https://qfpyjavbncijowjvznkg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHlqYXZibmNpam93anZ6bmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDcxMDUsImV4cCI6MjA3NDQyMzEwNX0.adxRCkobV-m_XUHp1KBXmg67VXkR-HL4QKFVtgQOmYc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncUniformeGala() {
  const url = 'https://mda.wiki.br/Uniforme_de_Gala/';
  console.log('Buscando conteúdo de:', url);
  
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const container = $('#page-content .text-justify');
  if (!container.length) {
    console.error('Container não encontrado!');
    return;
  }

  const uniformesList = [];
  let currentCategory: any = null;
  let currentSubItem: any = null;
  let pendingImages: any[] = [];

  // Pegamos todos os elementos relevantes em ordem
  const elements = container.contents().toArray();

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const node = $(el);
    const type = el.type;
    const tagName = el.name ? el.name.toLowerCase() : null;

    if (tagName === 'h2') {
      const title = node.text().trim();
      if (title.toLowerCase().includes('veja também') || title.toLowerCase().includes('links')) continue;

      currentCategory = {
        id: `cat-${Math.random().toString(36).substr(2, 5)}`,
        titulo: title,
        descricao: '',
        subitems: [],
        blocks: [],
        club: 'PATHFINDER'
      };
      
      // Se tivermos imagens pendentes (que vieram antes do H2), elas pertencem a este H2
      if (pendingImages.length > 0) {
        currentCategory.blocks.push(...pendingImages);
        pendingImages = [];
      }
      
      uniformesList.push(currentCategory);
      currentSubItem = null;
    } else if (tagName === 'h3' || tagName === 'h4') {
      if (!currentCategory) continue;
      
      currentSubItem = {
        id: `sub-${Math.random().toString(36).substr(2, 5)}`,
        titulo: node.text().trim(),
        descricao: '',
        blocks: [],
        subitems: []
      };
      
      // Se tivermos imagens pendentes (que vieram antes do H3), elas pertencem a este H3
      if (pendingImages.length > 0) {
        currentSubItem.blocks.push(...pendingImages);
        pendingImages = [];
      }
      
      currentCategory.subitems.push(currentSubItem);
    } else {
      // Conteúdo (texto, imagem, etc)
      let block: any = null;

      if (type === 'text') {
        const textValue = node.text().trim();
        if (textValue && textValue.length > 5) {
          block = { id: Math.random().toString(36).substr(2, 9), type: 'text', content: textValue };
        }
      } else if (tagName === 'figure' || tagName === 'img' || (tagName === 'a' && node.find('img').length > 0)) {
        const imgNode = tagName === 'img' ? node : node.find('img');
        const src = imgNode.attr('src');
        if (src && !src.includes('pixel')) {
          block = { id: Math.random().toString(36).substr(2, 9), type: 'image', content: src };
        }
      } else if (tagName === 'p') {
        const text = node.text().trim();
        if (text && text.length > 2 && !text.includes('Saiba mais')) {
          block = { id: Math.random().toString(36).substr(2, 9), type: 'text', content: text };
        }
        // Se tiver imagem dentro do P, tratamos separadamente se necessário, 
        // mas aqui vamos focar na sequência
      } else if (tagName === 'ul' || tagName === 'ol') {
        const listText = node.find('li').map((j, li) => $(li).text().trim()).get().join('\n• ');
        if (listText) block = { id: Math.random().toString(36).substr(2, 9), type: 'text', content: `• ${listText}` };
      }

      if (block) {
        // DECISÃO DE ATRIBUIÇÃO:
        // Se o bloco for uma IMAGEM, e a próxima tag for um cabeçalho (H2/H3/H4), 
        // guardamos ela para o próximo item.
        if (block.type === 'image') {
          let nextTag = null;
          // Procurar a próxima tag não vazia
          for (let j = i + 1; j < elements.length; j++) {
            const nextEl: any = elements[j];
            if (nextEl.type === 'tag') {
              nextTag = nextEl.name.toLowerCase();
              break;
            }
          }
          
          if (nextTag === 'h2' || nextTag === 'h3' || nextTag === 'h4') {
            pendingImages.push(block);
          } else {
            // Se não for cabeçalho, coloca no item atual
            const target = currentSubItem || currentCategory;
            if (target) target.blocks.push(block);
          }
        } else {
          // Se for TEXTO, coloca no item atual
          const target = currentSubItem || currentCategory;
          if (target) target.blocks.push(block);
        }
      }
    }
  }

  // Pós-processamento para descrições e limpeza
  uniformesList.forEach(cat => {
    cat.blocks = processBlocks(cat.blocks);
    const firstText = cat.blocks.find(b => b.type === 'text');
    if (firstText) cat.descricao = firstText.content.substring(0, 300);

    cat.subitems.forEach((sub: any) => {
      sub.blocks = processBlocks(sub.blocks);
      const sFirstText = sub.blocks.find((b: any) => b.type === 'text');
      if (sFirstText) sub.descricao = sFirstText.content.substring(0, 150);
    });
  });

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

  const { error } = await supabase.from('Cultura').update({ uniformes_list: uniformesList }).eq('club_type', 'PATHFINDER');
  if (error) console.error('Erro:', error.message);
  else console.log('Sincronização inteligente (Look-Ahead) concluída!');
}

syncUniformeGala();
