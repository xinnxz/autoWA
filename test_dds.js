const { search } = require('duck-duck-scrape');

async function testDDG() {
  try {
    const searchResults = await search('berita hari ini jakarta', { safeSearch: duckduckgo.SafeSearchType.STRICT });
    console.log(searchResults.results.map(r => r.title + " - " + r.description).join('\n'));
  } catch (e) {
    console.error(e.message);
  }
}

testDDG();
