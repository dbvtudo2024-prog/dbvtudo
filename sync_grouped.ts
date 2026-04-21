
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const SUPABASE_URL = 'https://qfpyjavbncijowjvznkg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHlqYXZibmNpam93anZ6bmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDcxMDUsImV4cCI6MjA3NDQyMzEwNX0.adxRCkobV-m_XUHp1KBXmg67VXkR-HL4QKFVtgQOmYc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncUniformeGalaGrouped() {
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

  // Objeto Raiz Único solicitado pelo usuário
  const mainEntry = {
    id: `root-${Math.random().toString(36).substr(2, 5)}`,
    titulo: 'Uniforme de Gala (Manual Completo)',
    descricao: 'Orientações oficiais detalhadas sobre o Uniforme de Gala dos Desbravadores, incluindo modelos por idade, posição de emblemas e acessórios.',
    subitems: [],
    blocks: [],
    club: 'PATHFINDER'
  };

  let currentCategory: any = null;
  let currentSubItem: any = null;
  let pendingImages: any[] = [];

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
      
      if (pendingImages.length > 0) {
        currentCategory.blocks.push(...pendingImages);
        pendingImages = [];
      }
      
      // No novo modelo, toda H2 vira subitem da Entrada Principal
      mainEntry.subitems.push(currentCategory);
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
      
      if (pendingImages.length > 0) {
        currentSubItem.blocks.push(...pendingImages);
        pendingImages = [];
      }
      
      currentCategory.subitems.push(currentSubItem);
    } else {
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
      } else if (tagName === 'ul' || tagName === 'ol') {
        const listText = node.find('li').map((j, li) => $(li).text().trim()).get().join('\n• ');
        if (listText) block = { id: Math.random().toString(36).substr(2, 9), type: 'text', content: `• ${listText}` };
      }

      if (block) {
        if (block.type === 'image') {
          let nextTag = null;
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
            const target = currentSubItem || currentCategory || mainEntry;
            target.blocks.push(block);
          }
        } else {
          const target = currentSubItem || currentCategory || mainEntry;
          target.blocks.push(block);
        }
      }
    }
  }

  // Pós-processamento e limpeza de duplicatas em todos os níveis
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

  mainEntry.blocks = processBlocks(mainEntry.blocks);
  mainEntry.subitems.forEach((cat: any) => {
    cat.blocks = processBlocks(cat.blocks);
    const firstText = cat.blocks.find((b: any) => b.type === 'text');
    if (firstText) cat.descricao = firstText.content.substring(0, 150);

    cat.subitems.forEach((sub: any) => {
      sub.blocks = processBlocks(sub.blocks);
      const sFirstText = sub.blocks.find((b: any) => b.type === 'text');
      if (sFirstText) sub.descricao = sFirstText.content.substring(0, 100);
    });
  });

  // Enviamos apenas o item raiz agrupado na lista
  const uniformesList = [mainEntry];

  console.log('Enviando Manual Agrupado para o banco...');
  const { error } = await supabase.from('Cultura').update({ uniformes_list: uniformesList }).eq('club_type', 'PATHFINDER');
  if (error) console.error('Erro:', error.message);
  else console.log('Sucesso! Tudo agora está dentro de "Uniforme de Gala".');
}

syncUniformeGalaGrouped();
