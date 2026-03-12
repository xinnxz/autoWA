require('dotenv').config();
const { executeTool, toolsSchema } = require('./src/features/tools');

// I just want to test if it runs.
async function testTool() {
  console.log("TEST WEATHER:", await executeTool('getWeather', { location: 'Jakarta' }));
  console.log("TEST WIKI:", await executeTool('searchWikipedia', { query: 'ReactJS' }));
}
testTool();
