const axios = require('axios');
const logger = require('../utils/logger');

// Definisi skema fungsi untuk dikirim ke API Llama/Groq
const toolsSchema = [
  {
    type: "function",
    function: {
      name: "getWeather",
      description: "Dapatkan suhu dan kondisi cuaca terkini di sebuah kota atau daerah secara real-time.",
      parameters: {
        type: "object",
        properties: {
          location: { 
            type: "string", 
            description: "Nama kota, contoh: Jakarta, Bandung, Tokyo" 
          }
        },
        required: ["location"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchWikipedia",
      description: "Berfungsi seperti Google Search namun khusus ensiklopedia. Gunakan untuk mencari jawaban fakta, sejarah, atau informasi tokoh dari internet secara langsung.",
      parameters: {
        type: "object",
        properties: {
          query: { 
            type: "string", 
            description: "Topik atau kata kunci yang dicari, contoh: Joko Widodo, Perang Dunia 1, JavaScript" 
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "saveUserFact",
      description: "Menyimpan memori permanen mengenai pengguna. Gunakan alat ini ketika pengguna memberitahumu tentang dirinya (contoh: 'nama saya X', 'saya suka Y', 'hobi saya Z') agar kamu bisa mengingat fakta ini dan memanggil namanya nanti.",
      parameters: {
        type: "object",
        properties: {
          fact_key: { 
            type: "string", 
            description: "Kategori singkat informasi (contoh: nama, usia, lokasi, hobi, makanan_favorit)" 
          },
          fact_value: {
            type: "string", 
            description: "Nilai spesifik dari kategori tersebut (contoh: Budi Setiawan, 25 tahun, Jakarta, Memancing, Nasi Goreng)" 
          }
        },
        required: ["fact_key", "fact_value"]
      }
    }
  }
];

// Eksekusi tool calls
async function executeTool(name, argsObj) {
  try {
    if (name === 'getWeather') {
      const loc = argsObj.location;
      logger.info(`[Tool] Memanggil cuaca untuk kota: ${loc}`);
      const res = await axios.get(`https://wttr.in/${encodeURIComponent(loc)}?format=j1`, { timeout: 10000 });
      const cc = res.data.current_condition[0];
      return `Cuaca saat ini di ${loc}: ${cc.temp_C} derajat Celcius, kondisi: ${cc.weatherDesc[0].value}.`;
    } 
    
    if (name === 'searchWikipedia') {
      const query = argsObj.query;
      logger.info(`[Tool] Mencari Wikipedia untuk: ${query}`);
      // Sanitasi query dengan mengambil kata pertama/gabungan yang paling relevan (Wikipedia butuh exact/close match yg spesifik)
      const qSafe = encodeURIComponent(query.replace(/ /g, '_'));
      const res = await axios.get(`https://id.wikipedia.org/api/rest_v1/page/summary/${qSafe}`, { 
        headers: { 'User-Agent': 'AutoWABot/1.0' },
        timeout: 10000 
      });
      return res.data.extract || "Informasi didapatkan namun kosong.";
    }

    if (name === 'saveUserFact') {
      const { fact_key, fact_value } = argsObj;
      // context is passed from callGroq
      const context = arguments[2] || {};
      const { contactId, userProfiles, saveStore } = context;

      if (!contactId || !userProfiles) {
        return `Error internal: Sistem memori tidak tersedia untuk pengguna ini.`;
      }
      
      if (!userProfiles.has(contactId)) {
        userProfiles.set(contactId, {});
      }
      
      const profile = userProfiles.get(contactId);
      profile[fact_key] = fact_value;
      
      if (saveStore) saveStore();
      
      logger.info(`[Tool] Fact disave [${contactId.split('@')[0]}] ${fact_key}: ${fact_value}`);
      return `Memori berhasil diperbarui dengan fakta '${fact_key}' = '${fact_value}'.`;
    }

    return `Error: Alat atau fungsi '${name}' tidak ditemukan.`;
  } catch (err) {
    logger.warn(`[Tool] Eksekusi ${name} gagal: ${err.message}`);
    return `Sistem gagal mengambil informasi terbaru untuk permintaan ini. Silakan berikan jawaban seadanya atau beri tahu pengguna bahwa sistem tools sedang bermasalah.`;
  }
}

module.exports = {
  toolsSchema,
  executeTool
};
