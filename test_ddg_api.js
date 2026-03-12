const axios = require('axios');

async function getToolOutput(query) {
  try {
    const res = await axios.get(`https://api.duckduckgo.com/`, {
      params: { q: query, format: 'json' }
    });
    console.log(res.data.AbstractText || res.data.RelatedTopics[0]?.Text || "No answer");
  } catch(e) { console.log(e.message); }
}

getToolOutput('Prabowo Subianto');
