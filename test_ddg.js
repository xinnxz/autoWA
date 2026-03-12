const axios = require('axios');

async function searchWeb(query) {
  try {
    const res = await axios.post('https://html.duckduckgo.com/html/', `q=${encodeURIComponent(query)}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const html = res.data;
    const results = [];
    const snippetRegex = /<a class="result__snippet[^>]*>(.*?)<\/a>/gi;
    let match;
    let count = 0;

    while ((match = snippetRegex.exec(html)) !== null && count < 3) {
      let snippet = match[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
      if (snippet) {
         results.push(snippet);
         count++;
      }
    }

    if (results.length > 0) {
      console.log(results.join('\n\n'));
    } else {
      console.log('No results found.');
    }
  } catch (err) {
    console.error(err.message);
  }
}

searchWeb('Cuaca hari ini Jakarta');
