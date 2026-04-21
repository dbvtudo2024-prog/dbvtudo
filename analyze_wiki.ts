
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function analyzeStructure() {
  const url = 'https://mda.wiki.br/Uniforme_de_Gala/';
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const content = $('section').first();
  console.log('--- ESTRUTURA DE HEADERS ---');
  content.find('h1, h2, h3, h4').each((i, el) => {
    const tag = el.tagName;
    const text = $(el).text().trim();
    console.log(`${tag}: ${text}`);
  });
}
analyzeStructure();
