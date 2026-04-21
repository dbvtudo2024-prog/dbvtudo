
import fetch from 'node-fetch';

async function fetchAllMDA() {
  const url = 'https://mda.wiki.br/Emblemas_dos_Desbravadores/';
  try {
    const res = await fetch(url);
    const html = await res.text();
    // Extract both the title and the following content
    const items = html.match(/<(h3|h4)[^>]*>(.*?)<\/\1>.*?<p>(.*?)<\/p>/gis);
    const results = {};
    if (items) {
        items.forEach(item => {
            const titleMatch = item.match(/<(h3|h4)[^>]*>(.*?)<\/\1>/i);
            const pMatch = item.match(/<p>(.*?)<\/p>/i);
            if (titleMatch && pMatch) {
                const title = titleMatch[2].replace(/<[^>]*>/g, '').trim();
                const content = pMatch[1].replace(/<[^>]*>/g, '').trim();
                results[title] = content;
            }
        });
    }
    console.log(JSON.stringify(results, null, 2));
  } catch (e) {
    console.error(e);
  }
}

fetchAllMDA();
