
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function findContainer() {
  const url = 'https://mda.wiki.br/Uniforme_de_Gala/';
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const target = $('h2:contains("Admissão em Lenço")');
  let parent = target.parent();
  while(parent.length) {
    console.log(`Parent: ${parent[0].tagName}, Class: ${parent.attr('class')}, ID: ${parent.attr('id')}`);
    parent = parent.parent();
  }
}
findContainer();
