
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function debugEmblemas() {
  const url = 'https://mda.wiki.br/Uniforme_de_Gala/';
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const container = $('#page-content .text-justify');
  
  console.log('--- DEBUG POSICAO DOS EMBLEMAS ---');
  let start = false;
  container.contents().each((i, el) => {
    const node = $(el);
    const tagName = el.name ? el.name.toLowerCase() : null;
    const text = node.text().trim();

    if (tagName === 'h2' && text.includes('Posição dos Emblemas')) {
      start = true;
    } else if (tagName === 'h2' && start) {
      start = false;
    }

    if (start) {
      if (tagName) console.log(`[TAG: ${tagName}] ${text.substring(0, 100)}`);
      else if (el.type === 'text' && text) console.log(`[TEXT] ${text.substring(0, 100)}`);
      
      if (tagName === 'p' || tagName === 'figure' || tagName === 'a') {
        const img = node.find('img');
        if (img.length > 0) console.log(`  -> IMG FOUND: ${img.attr('src')}`);
      }
    }
  });
}
debugEmblemas();
