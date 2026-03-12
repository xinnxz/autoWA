const google = require('googlethis');

async function testGoogle() {
  const options = {
    page: 0, 
    safe: false, 
    additional_params: {
      hl: 'id'
    }
  };
  
  const response = await google.search('Berita cuaca jakarta hari ini', options);
  if (response.results && response.results.length > 0) {
      console.log(response.results.map(r => r.title + " - " + r.description).join('\n'));
  } else {
      console.log('No results found.');
  }
}

testGoogle();
