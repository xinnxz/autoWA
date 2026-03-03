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
const config = require('../../config.json');
const logger = require('../utils/logger');

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

  providers.gemini.prefixModels = [];
  providers.gemini.contextualModels = [];
  for (const key of providers.gemini.keys) {
    const client = new GoogleGenerativeAI(key);
    providers.gemini.prefixModels.push(client.getGenerativeModel({ model: config.ai.model, systemInstruction: config.ai.systemPrompt }));
    providers.gemini.contextualModels.push(client.getGenerativeModel({ model: config.ai.model, systemInstruction: ctxPrompt }));
  }
  providers.gemini.cooldowns = new Array(providers.gemini.keys.length).fill(0);

  // ─── Summary ───
  if (providers.groq.keys.length > 0) logger.info(`Loaded ${providers.groq.keys.length} Groq API key(s) 🚀`);
  if (providers.gemini.keys.length > 0) logger.info(`Loaded ${providers.gemini.keys.length} Gemini API key(s) 🔑`);
  
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
 * Bangun konteks dinamis berdasarkan waktu, hari, bulan
 * AI jadi tau situasi owner tanpa perlu diketik manual
 */
function buildDynamicContext() {
  const now = new Date();
  const jakarta = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const jam = jakarta.getHours();
  const menit = jakarta.getMinutes();
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][jakarta.getDay()];
  const bulan = jakarta.getMonth(); // 0-11
  const tanggal = jakarta.getDate();
  const waktuStr = `${String(jam).padStart(2,'0')}:${String(menit).padStart(2,'0')} WIB`;

  // Deteksi waktu
  let waktu = '';
  let aktivitas = '';
  if (jam >= 3 && jam < 5) {
    waktu = 'subuh/dini hari';
    aktivitas = 'kemungkinan masih tidur atau baru bangun untuk sahur (jika puasa)';
  } else if (jam >= 5 && jam < 7) {
    waktu = 'pagi buta';
    aktivitas = 'mungkin baru bangun, mandi, siap-siap beraktivitas';
  } else if (jam >= 7 && jam < 12) {
    waktu = 'pagi/menjelang siang';
    aktivitas = 'kemungkinan lagi kerja, kuliah, atau meeting';
  } else if (jam >= 12 && jam < 14) {
    waktu = 'siang';
    aktivitas = 'mungkin lagi istirahat makan siang, sholat dzuhur, atau break sebentar';
  } else if (jam >= 14 && jam < 17) {
    waktu = 'sore';
    aktivitas = 'kemungkinan masih kerja/kuliah, atau lagi di perjalanan pulang';
  } else if (jam >= 17 && jam < 19) {
    waktu = 'menjelang maghrib';
    aktivitas = 'mungkin lagi perjalanan pulang, istirahat, atau buka puasa (jika puasa)';
  } else if (jam >= 19 && jam < 22) {
    waktu = 'malam';
    aktivitas = 'kemungkinan lagi santai, nonton, main game, atau ngerjain sesuatu';
  } else {
    waktu = 'larut malam';
    aktivitas = 'kemungkinan sudah tidur atau begadang';
  }

  // Deteksi hari
  let konteksHari = '';
  if (hari === 'Jumat') {
    konteksHari = 'Hari Jumat — mungkin sholat Jumat (jika jam 11-13).';
  } else if (hari === 'Sabtu' || hari === 'Minggu') {
    konteksHari = `Hari ${hari} (weekend) — kemungkinan libur, santai, atau hangout.`;
  } else {
    konteksHari = `Hari ${hari} (weekday) — kemungkinan hari kerja/kuliah biasa.`;
  }

  // Deteksi Ramadan (estimasi 2026: 18 Feb - 19 Mar)
  let konteksRamadan = '';
  if ((bulan === 1 && tanggal >= 18) || (bulan === 2 && tanggal <= 19)) {
    konteksRamadan = 'Sekarang bulan Ramadan. Owner kemungkinan sedang puasa. ';
    if (jam >= 3 && jam < 5) konteksRamadan += 'Mungkin lagi sahur atau habis sahur.';
    else if (jam >= 17 && jam < 19) konteksRamadan += 'Sebentar lagi buka puasa.';
    else if (jam >= 19 && jam < 21) konteksRamadan += 'Mungkin habis buka puasa atau sholat tarawih.';
  }

  return {
    waktu,
    waktuStr,
    hari,
    aktivitas,
    konteksHari,
    konteksRamadan,
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
    systemPrompt = `Kamu adalah ${ownerName}. Kamu BUKAN AI atau bot — kamu adalah manusia bernama ${ownerName}.
Kamu sedang tidak bisa balas chat langsung karena HP kamu lagi ga dipegang.

SITUASI SEKARANG:
- Waktu: ${ctx.waktuStr} (${ctx.waktu})
- ${ctx.konteksHari}
${ctx.konteksRamadan ? '- ' + ctx.konteksRamadan : ''}- Kemungkinan aktivitas: ${ctx.aktivitas}

CARA BALAS:
- Balas seolah kamu ${ownerName} yang lagi AFK
- Pake bahasa Indonesia sehari-hari, gaul, santai, casual
- Jawab singkat 1-3 kalimat aja
- Sesuaikan jawaban dengan situasi waktu sekarang (misal kalo malam bilang lagi tidur, kalo siang bilang lagi kerja/kuliah)
- Boleh pake emoji dikit
- JANGAN PERNAH bilang kamu AI, bot, atau autoreply
- Kalo ditanya sesuatu yang ga tau, bilang "ntar gw kabarin ya" atau "gw cek dulu ya"
- Di akhir pesan SELALU tambah baris baru lalu tulis: _~autoreply by ${ownerName.toLowerCase()}_`;
  } else {
    systemPrompt = config.ai.systemPrompt;
  }

  const completion = await client.chat.completions.create({
    model: 'deepseek-r1-distill-llama-70b',
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
