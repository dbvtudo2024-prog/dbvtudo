
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function debug() {
  const url = 'https://mda.wiki.br/Uniforme_de_Gala/';
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const content = $('section').first();
  console.log('--- ESTRUTURA DIRETA ---');
  content.children().each((i, el) => {
    console.log(`${el.tagName}: ${$(el).text().trim().substring(0, 30)}`);
  });
}
debug();
