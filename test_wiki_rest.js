const axios = require('axios');

async function testWikiRest() {
  try {
    const res = await axios.get('https://id.wikipedia.org/api/rest_v1/page/summary/Joko_Widodo', {
       headers: { 'User-Agent': 'AutoWABot/1.0' }
    });
    console.log(res.data.extract);
  } catch (e) {
    console.error(e.message);
  }
}

testWikiRest();
