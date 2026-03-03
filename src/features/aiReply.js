// ============================================
// src/features/aiReply.js — Multi-AI with Key Rotation
// ============================================
// Penjelasan:
// Support 2 AI provider dengan rotasi key masing-masing:
//
// 1. Groq (primary) — Llama 3.3 70B, super cepat
//    Format .env: GROQ_API_KEY_1=xxx, GROQ_API_KEY_2=xxx, ...
//
// 2. Gemini (fallback) — kalau semua Groq habis
//    Format .env: GEMINI_API_KEY_1=xxx, GEMINI_API_KEY_2=xxx, ...
//
// Urutan: Groq 1→2→...→27 → Gemini 1→2→...→24 → Template
//
// Kedua provider di-rotasi round-robin:
// - Pakai key 1, lalu 2, lalu 3...
// - Kalau kena rate limit → cooldown 60s → pindah key
// - Kalau SEMUA key habis → pindah provider
// ============================================

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const config = require('../../config.js');
const logger = require('../utils/logger');

// Import runtime overrides (bisa diubah lewat WA command)
// Lazy-load untuk hindari circular dependency
let _runtimeOverrides = null;
function getOverrides() {
  if (!_runtimeOverrides) {
    _runtimeOverrides = require('./botControl').runtimeOverrides;
  }
  return _runtimeOverrides || {};
}

// ─── Provider State ───
// Masing-masing provider punya array key, clients, dan cooldown sendiri
const providers = {
  groq: {
    name: 'Groq',
    keys: [],
    clients: [],         // Array Groq instances
    currentIndex: 0,
    cooldowns: [],
  },
  gemini: {
    name: 'Gemini',
    keys: [],
    prefixModels: [],    // Array model untuk !ai
    contextualModels: [], // Array model untuk contextual
    currentIndex: 0,
    cooldowns: [],
  },
};

// Urutan provider (primary → fallback)
// Groq duluan karena lebih cepat
const providerOrder = ['groq', 'gemini'];

/**
 * Load semua API keys dari .env
 * Detect format: PROVIDER_API_KEY_1, _2, ... (numbered)
 */
function loadKeys() {
  // ─── Load Groq keys ───
  providers.groq.keys = [];
  for (let i = 1; i <= 100; i++) {
    const key = process.env[`GROQ_API_KEY_${i}`];
    if (key && key.trim()) providers.groq.keys.push(key.trim());
  }
  // Fallback: single GROQ_API_KEY
  if (providers.groq.keys.length === 0 && process.env.GROQ_API_KEY) {
    providers.groq.keys.push(process.env.GROQ_API_KEY.trim());
  }

  // ─── Load Gemini keys ───
  providers.gemini.keys = [];
  for (let i = 1; i <= 100; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key && key.trim()) providers.gemini.keys.push(key.trim());
  }
  if (providers.gemini.keys.length === 0 && process.env.GEMINI_API_KEYS) {
    providers.gemini.keys = process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()).filter(Boolean);
  }
  if (providers.gemini.keys.length === 0 && process.env.GEMINI_API_KEY) {
    providers.gemini.keys.push(process.env.GEMINI_API_KEY.trim());
  }

  // ─── Init Groq clients ───
  providers.groq.clients = providers.groq.keys.map(k => new Groq({ apiKey: k }));
  providers.groq.cooldowns = new Array(providers.groq.keys.length).fill(0);

  // ─── Init Gemini models ───
  const ownerName = process.env.OWNER_NAME || 'Bot';
  const ctxPrompt = config.ai.contextualPrompt ||
    `Kamu adalah ${ownerName}. Balas seolah kamu ${ownerName} yang lagi AFK. Bahasa gaul, santai. Jawab 1-2 kalimat. Jangan bilang kamu AI. Di akhir tambah: _~autoreply by ${ownerName.toLowerCase()}_`;

  const geminiModelName = config.ai.geminiModel || 'gemini-2.0-flash';
  providers.gemini.prefixModels = [];
  providers.gemini.contextualModels = [];
  for (const key of providers.gemini.keys) {
    const client = new GoogleGenerativeAI(key);
    providers.gemini.prefixModels.push(client.getGenerativeModel({ model: geminiModelName, systemInstruction: config.ai.systemPrompt }));
    providers.gemini.contextualModels.push(client.getGenerativeModel({ model: geminiModelName, systemInstruction: ctxPrompt }));
  }
  providers.gemini.cooldowns = new Array(providers.gemini.keys.length).fill(0);

  // ─── Summary ───
  if (providers.groq.keys.length > 0) logger.info(`Groq: ${providers.groq.keys.length} key(s) | model: ${config.ai.model || 'llama-3.3-70b-versatile'}`);
  if (providers.gemini.keys.length > 0) logger.info(`Gemini: ${providers.gemini.keys.length} key(s) | model: ${geminiModelName}`);
  
  if (providers.groq.keys.length === 0 && providers.gemini.keys.length === 0) {
    logger.warn('⚠️ Tidak ada API key AI! Fitur AI tidak akan berfungsi.');
  }
}

/**
 * Cari key yang tersedia (belum cooldown) dari provider tertentu
 */
function getAvailableKey(provider) {
  const p = providers[provider];
  const now = Date.now();
  for (let i = 0; i < p.keys.length; i++) {
    const idx = (p.currentIndex + i) % p.keys.length;
    if (now > p.cooldowns[idx]) return idx;
  }
  return -1;
}

/**
 * Tandai key sebagai rate-limited
 */
function markLimited(provider, index) {
  const p = providers[provider];
  p.cooldowns[index] = Date.now() + 60000;
  p.currentIndex = (index + 1) % p.keys.length;
  logger.warn(`${p.name} key ${index + 1} rate limited! Pindah key ${p.currentIndex + 1}`);
}

/**
 * Bangun konteks dinamis berdasarkan waktu, hari, bulan, event
 * AI jadi tau situasi owner tanpa perlu diketik manual
 */
function buildDynamicContext() {
  const now = new Date();
  const jakarta = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const jam = jakarta.getHours();
  const menit = jakarta.getMinutes();
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][jakarta.getDay()];
  const bulanIdx = jakarta.getMonth(); // 0-11
  const bulanNama = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][bulanIdx];
  const tanggal = jakarta.getDate();
  const tahun = jakarta.getFullYear();
  const waktuStr = `${String(jam).padStart(2,'0')}:${String(menit).padStart(2,'0')} WIB`;
  const tanggalStr = `${tanggal} ${bulanNama} ${tahun}`;

  // ─── Deteksi waktu & aktivitas ───
  let waktu = '';
  let aktivitas = [];
  if (jam >= 0 && jam < 3) {
    waktu = 'tengah malam';
    aktivitas = ['kemungkinan sudah tidur pulas', 'mungkin begadang ngoding project', 'deep sleep'];
  } else if (jam >= 3 && jam < 5) {
    waktu = 'subuh/dini hari';
    aktivitas = ['kemungkinan masih tidur', 'mungkin baru bangun sahur (kalau bulan puasa)'];
  } else if (jam >= 5 && jam < 7) {
    waktu = 'pagi buta';
    aktivitas = ['baru bangun tidur', 'mandi dan siap-siap', 'sarapan'];
  } else if (jam >= 7 && jam < 12) {
    waktu = 'pagi';
    aktivitas = ['lagi kerja atau kuliah', 'meeting', 'ngoding project', 'fokus depan laptop'];
  } else if (jam >= 12 && jam < 14) {
    waktu = 'siang';
    aktivitas = ['istirahat makan siang', 'sholat dzuhur', 'rehat sebentar dari kerja'];
  } else if (jam >= 14 && jam < 17) {
    waktu = 'sore';
    aktivitas = ['masih kerja/kuliah', 'ngoding lagi', 'lagi di perjalanan', 'olahraga sore'];
  } else if (jam >= 17 && jam < 19) {
    waktu = 'menjelang maghrib';
    aktivitas = ['perjalanan pulang', 'istirahat', 'sholat maghrib', 'olahraga'];
  } else if (jam >= 19 && jam < 22) {
    waktu = 'malam';
    aktivitas = ['santai', 'nonton', 'main game', 'ngoding side project', 'scrolling sosmed', 'quality time'];
  } else {
    waktu = 'larut malam';
    aktivitas = ['kemungkinan sudah tidur', 'mungkin begadang ngoding', 'rebahan sambil scroll HP'];
  }
  // Pilih 1-2 aktivitas random biar ga monoton
  const aktivitasStr = aktivitas.sort(() => Math.random() - 0.5).slice(0, 2).join(' atau ');

  // ─── Deteksi hari ───
  let konteksHari = '';
  const isWeekend = hari === 'Sabtu' || hari === 'Minggu';
  if (hari === 'Jumat' && jam >= 11 && jam <= 13) {
    konteksHari = 'Hari Jumat, jam sholat Jumat — kemungkinan lagi di masjid.';
  } else if (isWeekend) {
    konteksHari = `${hari} (weekend) — kemungkinan libur, santai, hangout, atau ngoding project pribadi.`;
  } else {
    konteksHari = `${hari} (weekday) — hari kerja/kuliah biasa.`;
  }

  // ─── Deteksi event/hari besar ───
  // Ramadan bergeser ~11 hari per tahun (2024: 12 Mar-10 Apr, 2025: 1 Mar-30 Mar, 2026: 18 Feb-19 Mar, 2027: 8 Feb-9 Mar)
  const ramadanDates = {
    2024: { start: [2, 12], end: [3, 10] },  // bulan 0-indexed
    2025: { start: [2, 1],  end: [2, 30] },
    2026: { start: [1, 18], end: [2, 19] },
    2027: { start: [1, 8],  end: [2, 9] },
    2028: { start: [0, 28], end: [1, 26] },
    2029: { start: [0, 16], end: [1, 14] },
    2030: { start: [0, 6],  end: [1, 4] },
  };

  let events = [];

  // Cek Ramadan
  const ramadan = ramadanDates[tahun];
  if (ramadan) {
    const startDate = new Date(tahun, ramadan.start[0], ramadan.start[1]);
    const endDate = new Date(tahun, ramadan.end[0], ramadan.end[1]);
    if (jakarta >= startDate && jakarta <= endDate) {
      let ramadanCtx = 'Bulan Ramadan — owner sedang puasa.';
      if (jam >= 3 && jam < 5) ramadanCtx += ' Waktu sahur.';
      else if (jam >= 17 && jam < 19) ramadanCtx += ' Sebentar lagi buka puasa.';
      else if (jam >= 19 && jam < 21) ramadanCtx += ' Habis buka puasa / sholat tarawih.';
      events.push(ramadanCtx);
    }
  }

  // Event nasional & internasional (tanggal-bulan)
  const key = `${tanggal}-${bulanIdx}`;
  const holidays = {
    '1-0':  'Tahun Baru',
    '14-1': 'Valentine\'s Day',
    '8-2':  'Hari Perempuan Internasional',
    '22-3': 'Hari Bumi',
    '1-4':  'Hari Buruh Internasional',
    '2-4':  'Hari Pendidikan Nasional',
    '20-4': 'Hari Kebangkitan Nasional',
    '1-5':  'Hari Lahir Pancasila',
    '17-7': 'HUT Kemerdekaan RI',
    '10-10':'Hari Kesehatan Mental Sedunia',
    '28-9': 'Hari Sumpah Pemuda',
    '10-10':'Hari Pahlawan',
    '25-11':'Natal',
    '31-11':'Malam Tahun Baru',
  };
  // Cek range (H-1 dan H+0)
  const holidayToday = holidays[key];
  if (holidayToday) events.push(`Hari ini ${holidayToday}.`);

  // Seasonal context
  if (bulanIdx >= 5 && bulanIdx <= 8) {
    // Juni-September: musim kering/liburan
    if (bulanIdx === 5 || bulanIdx === 6) events.push('Musim liburan sekolah/kuliah.');
  } else if (bulanIdx === 11) {
    events.push('Akhir tahun — suasana liburan.');
  }

  const konteksEvent = events.length > 0 ? events.join(' ') : '';

  return {
    waktu,
    waktuStr,
    tanggalStr,
    hari,
    isWeekend,
    aktivitasStr,
    konteksHari,
    konteksEvent,
  };
}

/**
 * Generate via Groq (DeepSeek R1)
 */
async function callGroq(keyIdx, prompt, mode) {
  const client = providers.groq.clients[keyIdx];
  const ownerName = process.env.OWNER_NAME || 'Bot';

  let systemPrompt;
  if (mode === 'contextual') {
    const ctx = buildDynamicContext();
    const style = getOverrides().replyStyle || config.ai.replyStyle || 'santai';

    // Semua teks prompt disesuaikan gaya bahasa
    const templates = {
      gaul: {
        intro: `Lo adalah ${ownerName}. Lo manusia, BUKAN AI/bot. Lo lagi gabisa bales langsung karena ga megang HP.`,
        personality: 'Orangnya gaul, rame, suka bercanda, asik',
        rules: `1. Bales singkat 1-3 kalimat, natural kayak chat sama temen
2. Pake bahasa gaul: lo-gue, slang, singkatan (yg, gw, bgt, wkwk, anjir, dll)
3. Emoji boleh banyak
4. Ga harus selalu bilang lagi ngapain
5. Kalo bisa jawab pertanyaannya, JAWAB langsung
6. Kalo ga tau, bilang "nt gue kabarin ye"
7. JANGAN PERNAH bilang lo AI, bot, atau autoreply
8. Variasikan jawaban — jangan monoton`,
        closing: `_~autoreply by ${ownerName.toLowerCase()}_`,
      },
      santai: {
        intro: `Kamu adalah ${ownerName}. Kamu manusia, BUKAN AI/bot. Kamu lagi ga bisa bales langsung karena ga megang HP.`,
        personality: 'Orangnya santai, friendly, easy going',
        rules: `1. Balas singkat 1-3 kalimat, natural kayak chat biasa
2. Bahasa Indonesia casual: gw-kamu, santai tapi jelas
3. Emoji secukupnya
4. Ga harus selalu nyebut lagi ngapain
5. Kalo bisa jawab, JAWAB langsung
6. Kalo ga tau, bilang "ntar gw kabarin ya"
7. JANGAN PERNAH bilang kamu AI, bot, atau autoreply
8. Variasikan jawaban — jangan monoton`,
        closing: `_~autoreply by ${ownerName.toLowerCase()}_`,
      },
      formal: {
        intro: `Anda adalah ${ownerName}. Anda seorang manusia, BUKAN AI atau bot. Saat ini Anda tidak dapat membalas pesan secara langsung.`,
        personality: 'Profesional, sopan, ramah, dan bertanggung jawab',
        rules: `1. Balas dengan singkat dan jelas, 1-3 kalimat
2. Gunakan bahasa Indonesia baku dan sopan: saya-Anda, tidak ada slang atau singkatan
3. Tidak menggunakan kata: gw, lo, gue, lu, wkwk, anjir, bgt, yg, dll
4. Emoji minimal atau tidak sama sekali
5. Tidak harus selalu menyebutkan sedang melakukan apa
6. Jika pertanyaan bisa dijawab, jawab langsung dengan sopan
7. Jika tidak tahu, katakan "Nanti saya informasikan kembali"
8. JANGAN PERNAH menyebut diri sebagai AI, bot, atau autoreply
9. Variasikan jawaban agar tidak terkesan template`,
        closing: `_~autoreply by ${ownerName.toLowerCase()}_`,
      },
      campur: {
        intro: `Kamu adalah ${ownerName}. Kamu manusia, BUKAN AI/bot. Lagi tidak bisa balas langsung karena tidak memegang HP.`,
        personality: 'Friendly, bisa formal bisa santai tergantung lawan bicara',
        rules: `1. Balas singkat 1-3 kalimat
2. Campur bahasa formal dan santai, sesuaikan dengan nada chat lawan bicara
3. Kalau lawan bicaranya formal, balas formal. Kalau santai, balas santai
4. Emoji secukupnya
5. Jika bisa menjawab pertanyaan, jawab langsung
6. Jika tidak tahu, bilang "Nanti saya kabari ya"
7. JANGAN PERNAH bilang kamu AI, bot, atau autoreply
8. Variasikan jawaban`,
        closing: `_~autoreply by ${ownerName.toLowerCase()}_`,
      },
    };

    // Ambil template sesuai style, atau buat custom
    const t = templates[style] || {
      intro: `Kamu adalah ${ownerName}. Kamu manusia, BUKAN AI/bot. Kamu sedang tidak bisa membalas langsung.`,
      personality: 'Friendly dan ramah',
      rules: `1. Balas singkat 1-3 kalimat
2. Gaya bahasa: ${style}
3. Jika bisa jawab pertanyaan, jawab langsung
4. Jika tidak tahu, bilang nanti dikabari
5. JANGAN PERNAH bilang kamu AI, bot, atau autoreply
6. Variasikan jawaban`,
      closing: `_~autoreply by ${ownerName.toLowerCase()}_`,
    };

    systemPrompt = `${t.intro}

PROFIL ${ownerName.toUpperCase()}:
- Developer/programmer, suka ngoding
- Hobi: coding, olahraga, explore hal baru
- ${t.personality}
- Muslim Indonesia

KONTEKS WAKTU (referensi, bukan aturan ketat):
- Tanggal: ${ctx.tanggalStr}, ${ctx.konteksHari}
- Jam: ${ctx.waktuStr} (${ctx.waktu})
${ctx.konteksEvent ? '- Event: ' + ctx.konteksEvent + '\n' : ''}- Kemungkinan aktivitas: ${ctx.aktivitasStr}
Catatan: ini hanya kemungkinan, ${ownerName} bisa saja melakukan hal lain.

ATURAN MEMBALAS:
${t.rules}
WAJIB: akhiri setiap pesan dengan baris baru lalu tulis: ${t.closing}`;
  } else {
    systemPrompt = config.ai.systemPrompt;
  }

  const completion = await client.chat.completions.create({
    model: getOverrides().model || config.ai.model || 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: config.ai.maxTokens || 500,
    temperature: 0.6,
  });

  let reply = completion.choices[0]?.message?.content || '';
  
  // DeepSeek R1 kadang output <think>...</think> tags, hapus
  reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  return reply;
}

/**
 * Generate via Gemini
 */
async function callGemini(keyIdx, prompt, mode) {
  const model = mode === 'contextual'
    ? providers.gemini.contextualModels[keyIdx]
    : providers.gemini.prefixModels[keyIdx];
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Main generate — rotasi semua provider
 * 
 * Alur:
 * 1. Loop setiap provider (Groq → Gemini)
 * 2. Di tiap provider, coba semua key (rotasi)
 * 3. Kalau semua key provider habis → lanjut provider berikutnya
 * 4. Kalau semua provider habis → throw error
 */
async function generateWithRotation(prompt, mode = 'prefix') {
  if (providers.groq.keys.length === 0 && providers.gemini.keys.length === 0) loadKeys();

  let lastError = null;

  for (const providerName of providerOrder) {
    const p = providers[providerName];
    if (p.keys.length === 0) continue;

    for (let attempt = 0; attempt < p.keys.length; attempt++) {
      const keyIdx = getAvailableKey(providerName);
      if (keyIdx === -1) break; // Semua key cooldown, coba provider lain

      try {
        logger.debug(`${p.name} key ${keyIdx + 1}/${p.keys.length}`);
        
        let result;
        if (providerName === 'groq') {
          result = await callGroq(keyIdx, prompt, mode);
        } else {
          result = await callGemini(keyIdx, prompt, mode);
        }

        // Update index untuk round-robin
        p.currentIndex = (keyIdx + 1) % p.keys.length;
        return result;
      } catch (err) {
        lastError = err;
        const errMsg = err.message || '';
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('rate_limit')) {
          markLimited(providerName, keyIdx);
          continue;
        }
        // Error lain → skip ke provider berikutnya
        logger.error(`${p.name} error (bukan rate limit):`, err);
        break;
      }
    }
  }

  throw lastError || new Error('Semua AI provider gagal!');
}

// ─── INIT ───
try { loadKeys(); } catch (err) { logger.warn(err.message); }

/**
 * Handle !ai command
 */
async function handle(sock, msg) {
  const question = msg.text.replace(config.ai.prefix, '').trim();
  if (!question) {
    await sock.sendMessage(msg.from, { text: '❌ Tulis pertanyaanmu!\nContoh: *!ai Apa itu JavaScript?*' });
    return;
  }

  try {
    await sock.sendMessage(msg.from, { text: '🤖 _Sedang berpikir..._' });
    const aiText = await generateWithRotation(question, 'prefix');
    await sock.sendMessage(msg.from, { text: `🤖 *AI Assistant*\n\n${aiText}\n\n─────────────────\n_Powered by Groq + Gemini AI_` });
    logger.outgoing(msg.from.split('@')[0], `[AI] ${aiText.substring(0, 50)}...`);
  } catch (err) {
    logger.error('AI error', err);
    await sock.sendMessage(msg.from, { text: '❌ Semua AI sedang gangguan, coba lagi nanti!' });
  }
}

/**
 * Handle contextual reply
 */
async function handleContextual(sock, msg) {
  try {
    const prompt = `${msg.name} mengirim pesan: "${msg.text}"\n\nBalas pesan ini.`;
    const aiText = await generateWithRotation(prompt, 'contextual');
    await sock.sendMessage(msg.from, { text: aiText });
    logger.outgoing(msg.from.split('@')[0], `[AI-Context] ${aiText.substring(0, 50)}...`);
  } catch (err) {
    logger.error('Contextual AI error', err);
    const messages = config.awayMode.messages;
    const fallback = messages[Math.floor(Math.random() * messages.length)];
    await sock.sendMessage(msg.from, { text: fallback });
  }
}

module.exports = { handle, handleContextual };
