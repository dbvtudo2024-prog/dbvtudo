
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function debug() {
  const url = 'https://mda.wiki.br/Uniforme_de_Gala/';
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const container = $('#page-content .text-justify');
  console.log('--- ESTRUTURA DETALHADA ---');
  
  // Vamos percorrer todos os nós filhos do container
  container.contents().each((i, el) => {
    const node = $(el);
    const type = el.type; // 'tag', 'text', etc.
    const name = el.name || 'text-node';
    
    if (type === 'text') {
      const text = node.text().trim();
      if (text) console.log(`[TEXT] "${text.substring(0, 50)}..."`);
    } else {
      console.log(`[TAG: ${name}] "${node.text().trim().substring(0, 50)}..."`);
      if (name === 'figure') {
        console.log(`  -> Figure has img? ${node.find('img').length}`);
      }
    }
  });
}
debug();
