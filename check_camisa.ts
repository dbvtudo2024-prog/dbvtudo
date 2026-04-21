
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function checkCamisa() {
  const url = 'https://mda.wiki.br/Uniforme_de_Gala/';
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const h3 = $('h3:contains("Camisa")').first();
  console.log('H3 Camisa found?', h3.length);
  console.log('Next sibling:', h3.next()[0]?.tagName);
  console.log('Parent HTML start:', h3.parent().html()?.substring(0, 500));
}
checkCamisa();
