
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function checkSequence() {
  const url = 'https://mda.wiki.br/Uniforme_de_Gala/';
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const container = $('#page-content .text-justify');
  
  console.log('--- SEQUÊNCIA DE ELEMENTOS ---');
  container.children().each((i, el) => {
    const node = $(el);
    const tag = el.tagName.toLowerCase();
    const text = node.text().trim().substring(0, 50);
    
    if (tag === 'figure' || tag === 'img') {
      const src = node.find('img').attr('src') || node.attr('src');
      console.log(`[IMAGE] src: ${src?.substring(src.lastIndexOf('/') + 1)}`);
    } else if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
      console.log(`[HEADER ${tag}] ${text}`);
    } else if (tag === 'p' && text.length > 5) {
      console.log(`[TEXT] ${text}`);
    }
  });
}
checkSequence();
