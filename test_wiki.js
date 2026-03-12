const axios = require('axios');

async function searchWikipedia(query) {
  try {
    const res = await axios.get(`https://id.wikipedia.org/w/api.php`, {
      params: {
        action: 'query',
        list: 'search',
        srsearch: query,
        utf8: 1,
        format: 'json'
      }
    });

    const results = res.data.query.search;
    if (results && results.length > 0) {
      console.log(results.slice(0, 3).map(r => r.title + ': ' + r.snippet.replace(/<\/?[^>]+(>|$)/g, "")).join('\n'));
    } else {
      console.log('No results.');
    }
  } catch (err) {
    console.error(err.message);
  }
}

searchWikipedia('Cuaca Jakarta');
