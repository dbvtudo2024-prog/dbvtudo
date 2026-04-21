
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function finalScrape() {
  const url = 'https://mda.wiki.br/Uniforme_de_Gala/';
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const content = $('#page-content .text-justify');
  console.log('Content elements:', content.children().length);
  
  content.children().each((i, el) => {
    const tag = el.tagName;
    const text = $(el).text().trim().substring(0, 50);
    if (tag.match(/h[2-4]/)) {
      console.log(`[HEADER ${tag}] ${text}`);
    } else {
      console.log(`[CONTENT ${tag}] ${text}`);
    }
  });
}
finalScrape();
