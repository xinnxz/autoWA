const axios = require('axios');

async function searchGoogle(query) {
  try {
    const res = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = res.data;
    const results = [];
    const blockRegex = /<div class="BNeawe s3v9rd AP7Wnd">(.*?)<\/div>/g;
    let match;
    let count = 0;
    while((match = blockRegex.exec(html)) !== null && count < 5) {
       let text = match[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
       if (text.length > 20) {
          results.push(text);
          count++;
       }
    }
    console.log(results.join('\n'));
  } catch(e) { console.error(e.message); }
}

searchGoogle('Prabowo Subianto Presiden');
