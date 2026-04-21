
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const SUPABASE_URL = 'https://qfpyjavbncijowjvznkg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHlqYXZibmNpam93anZ6bmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDcxMDUsImV4cCI6MjA3NDQyMzEwNX0.adxRCkobV-m_XUHp1KBXmg67VXkR-HL4QKFVtgQOmYc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncUniformeGalaNoLinks() {
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

  // Limpeza de texto: remove "Imagem X", links e frases de navegação
  function cleanText(text: string) {
    let t = text
      .replace(/Imagem\s+\d+/gi, '') // Remove Imagem 1, Imagem 2, etc.
      .replace(/\[\d+\]/g, '')       // Remove citações tipo [1]
      .replace(/\s+/g, ' ')          // Normaliza espaços
      .trim();
    
    // Lista de termos proibidos (navegação do wiki que não serve pro app)
    const forbidden = [
      'veja também',
      'saiba mais',
      'links externos',
      'navegação',
      'página principal'
    ];

    if (forbidden.some(f => t.toLowerCase().includes(f))) return '';
    
    // Se o texto for apenas o nome de outra página que já temos no app, removemos
    const redundant = ['lenço do desbravador', 'prendedor de lenço'];
    if (redundant.includes(t.toLowerCase())) return '';

    return t;
  }

  const elements = container.contents().toArray();
  const rawBlocks: any[] = [];

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const node = $(el);
    const tagName = el.name ? el.name.toLowerCase() : null;

    if (tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
      const hText = node.text().trim();
      if (hText.toLowerCase().includes('veja também')) continue;
      rawBlocks.push({ type: 'header', tag: tagName, content: hText });
    } else if (tagName === 'figure' || tagName === 'img' || (tagName === 'a' && node.find('img').length > 0)) {
      const src = tagName === 'img' ? node.attr('src') : (node.attr('src') || node.find('img').attr('src'));
      if (src && !src.includes('pixel')) rawBlocks.push({ type: 'image', content: src });
    } else if (tagName === 'p') {
      const text = cleanText(node.text());
      if (text.length > 2) rawBlocks.push({ type: 'text', content: text });
      
      node.find('img').each((i, img) => {
        const src = $(img).attr('src');
        if (src && !src.includes('pixel')) rawBlocks.push({ type: 'image', content: src });
      });
    } else if (tagName === 'ul' || tagName === 'ol') {
      const listItems = node.find('li').map((j, li) => cleanText($(li).text())).get().filter(t => t.length > 0);
      if (listItems.length > 0) rawBlocks.push({ type: 'text', content: `• ${listItems.join('\n• ')}` });
    } else if (el.type === 'text') {
      const text = cleanText(node.text());
      if (text.length > 3) rawBlocks.push({ type: 'text', content: text });
    }
  }

  let currentCategory: any = null;
  let currentSubItem: any = null;

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];

    if (block.type === 'header') {
      const title = block.content;
      if (block.tag === 'h2') {
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
      let targetHeader = null;
      for (let j = i + 1; j < Math.min(i + 5, rawBlocks.length); j++) {
        if (rawBlocks[j].type === 'header') { targetHeader = rawBlocks[j]; break; }
      }

      if (targetHeader) {
        if (!targetHeader.pendingImages) targetHeader.pendingImages = [];
        targetHeader.pendingImages.push({ id: Math.random().toString(36).substr(2, 9), type: 'image', content: block.content });
      } else {
        const target = currentSubItem || currentCategory || groupUniforme;
        target.blocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'image', content: block.content });
      }
    } else {
      const target = currentSubItem || currentCategory || groupUniforme;
      target.blocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'text', content: block.content });
    }
  }

  function attachPending(list: any[]) {
    list.forEach(item => {
      const matchingRaw = rawBlocks.find(rb => rb.type === 'header' && rb.content === item.titulo);
      if (matchingRaw && matchingRaw.pendingImages) item.blocks.unshift(...matchingRaw.pendingImages);
      if (item.subitems) attachPending(item.subitems);
    });
  }

  attachPending(uniformesList);
  attachPending([groupUniforme]);
  if (groupUniforme.subitems.length > 0) uniformesList.unshift(groupUniforme);

  const cleanFinal = (item: any) => {
    const seen = new Set();
    item.blocks = item.blocks.filter((b: any) => {
      if (!b.content || b.content.length < 2) return false;
      const k = `${b.type}:${b.content}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (item.subitems) item.subitems.forEach(cleanFinal);
  };
  uniformesList.forEach(cleanFinal);

  await supabase.from('Cultura').update({ uniformes_list: uniformesList }).eq('club_type', 'PATHFINDER');
  console.log('Sincronização limpa concluída. Removidos "Veja também" e links redundantes.');
}

syncUniformeGalaNoLinks();
