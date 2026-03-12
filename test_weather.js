const axios = require('axios');

async function testWeather() {
  try {
    const res = await axios.get('https://wttr.in/Jakarta?format=j1');
    const cc = res.data.current_condition[0];
    console.log(`Weather in Jakarta: ${cc.temp_C}°C, ${cc.weatherDesc[0].value}`);
  } catch (e) {
    console.error(e.message);
  }
}

testWeather();
