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
const store = require('../utils/store');

// Import runtime overrides (bisa diubah lewat WA command)
// Lazy-load untuk hindari circular dependency
let _runtimeOverrides = null;
function getOverrides() {
  if (!_runtimeOverrides) {
    _runtimeOverrides = require('./botControl').runtimeOverrides;
  }
  return _runtimeOverrides || {};
}

const { getLocale, getStyle } = require('../utils/locale');

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

// ─── Chat History (conversation memory per kontak) ───
// Key: contactId (628xxx@s.whatsapp.net)
// Value: [{ role: 'user'|'assistant', content: string, time: number }]
const chatHistory = new Map();

// ─── AI Metrics (latency tracking) ───
const aiMetrics = {
  totalCalls: 0,
  latencyHistory: [],   // last 20 latency values in ms
  providerUsage: {},    // { groq: 10, gemini: 2 }
  lastCallTime: null,
  avgLatency: 0,
};

// Auto-cleanup history yang expired
const historyCleanupMs = 10 * 60 * 1000; // Tiap 10 menit
setInterval(() => {
  const maxAge = (config.ai.chatHistory?.maxAge || 30) * 60 * 1000;
  const now = Date.now();
  let cleaned = 0;
  for (const [contactId, messages] of chatHistory) {
    // Hapus pesan yang terlalu lama
    const fresh = messages.filter(m => (now - m.time) < maxAge);
    if (fresh.length === 0) {
      chatHistory.delete(contactId);
      cleaned++;
    } else if (fresh.length !== messages.length) {
      chatHistory.set(contactId, fresh);
    }
  }
  if (cleaned > 0) logger.debug(`History cleanup: ${cleaned} conversations cleared`);
}, historyCleanupMs);

/**
 * Get chat history untuk kontak tertentu
 */
function getHistory(contactId) {
  if (!config.ai.chatHistory?.enabled) return [];
  return chatHistory.get(contactId) || [];
}

/**
 * Tambah pesan ke history
 */
function addToHistory(contactId, role, content) {
  if (!config.ai.chatHistory?.enabled) return;
  const maxMessages = config.ai.chatHistory?.maxMessages || 6;
  
  if (!chatHistory.has(contactId)) chatHistory.set(contactId, []);
  const history = chatHistory.get(contactId);
  history.push({ role, content, time: Date.now() });
  
  // Trim kalo melebihi max
  while (history.length > maxMessages) history.shift();
  store.save();
}

/**
 * Clear semua history atau per kontak
 */
function clearHistory(contactId) {
  if (contactId) {
    chatHistory.delete(contactId);
  } else {
    chatHistory.clear();
  }
  store.save();
  return chatHistory.size;
}

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
  const locale = getLocale();
  const ctx = locale.context;
  const tz = config.timezone || 'Asia/Jakarta';
  const now = new Date();
  const local = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const jam = local.getHours();
  const menit = local.getMinutes();
  const hari = ctx.days[local.getDay()];
  const bulanIdx = local.getMonth();
  const bulanNama = ctx.months[bulanIdx];
  const tanggal = local.getDate();
  const tahun = local.getFullYear();
  const waktuStr = `${String(jam).padStart(2,'0')}:${String(menit).padStart(2,'0')}`;

  // ─── Deteksi waktu & aktivitas ───
  let waktuKey = '';
  if (jam >= 0 && jam < 3) {
    waktuKey = 'tengahMalam';
  } else if (jam >= 3 && jam < 5) {
    waktuKey = 'subuh';
  } else if (jam >= 5 && jam < 7) {
    waktuKey = 'pagi';
  } else if (jam >= 7 && jam < 12) {
    waktuKey = 'menjelangSiang';
  } else if (jam >= 12 && jam < 14) {
    waktuKey = 'siang';
  } else if (jam >= 14 && jam < 17) {
    waktuKey = 'sore';
  } else if (jam >= 17 && jam < 19) {
    waktuKey = 'petang';
  } else if (jam >= 19 && jam < 22) {
    waktuKey = 'malam';
  } else {
    waktuKey = 'malamLarut';
  }

  const timeInfo = ctx.time[waktuKey] || { label: waktuKey, activity: '' };
  const waktu = timeInfo.label;
  const aktivitasStr = timeInfo.activity;

  // ─── Deteksi hari ───
  const isWeekend = local.getDay() === 0 || local.getDay() === 6;
  const dayType = isWeekend ? ctx.weekend : ctx.weekday;
  const tanggalStr = ctx.dateFormat(hari, tanggal, bulanNama, tahun, dayType);
  const konteksHari = `${hari} (${dayType})`;

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
    if (local >= startDate && local <= endDate) {
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
    possibleActivity: ctx.possibleActivity,
  };
}

/**
 * Generate via Groq (DeepSeek R1)
 */
async function callGroq(keyIdx, prompt, mode, history = []) {
  const client = providers.groq.clients[keyIdx];
  const ownerName = process.env.OWNER_NAME || 'Bot';
  const locale = getLocale();
  const P = locale.prompt;

  let systemPrompt;
  if (mode === 'contextual') {
    const ctx = buildDynamicContext();
    const style = getOverrides().replyStyle || config.ai.replyStyle || 'santai';

    const styleObj = getStyle(style);
    const intro = styleObj ? styleObj.intro(ownerName) : locale.customIntro(ownerName);
    const personality = styleObj ? styleObj.personality : locale.customPersonality;
    const rules = styleObj ? styleObj.rules(ownerName) : locale.customRules(style);

    systemPrompt = `${intro}

${P.profile(ownerName)}
- ${personality}

${P.timeContext}
- ${ctx.tanggalStr}
- ${ctx.waktuStr} (${ctx.waktu})
${ctx.konteksEvent ? '- Event: ' + ctx.konteksEvent + '\n' : ''}- ${ctx.possibleActivity}: ${ctx.aktivitasStr}
${P.timeNote(ownerName)}

${P.rulesHeader}
${rules}
${P.closingRule(ownerName)}`;
  } else {
    systemPrompt = config.ai.systemPrompt;
  }

  // Build messages: system + chat history + current user message
  const messages = [{ role: 'system', content: systemPrompt }];
  for (const h of history) {
    messages.push({ role: h.role, content: h.content });
  }
  messages.push({ role: 'user', content: prompt });

  const completion = await client.chat.completions.create({
    model: getOverrides().model || config.ai.model || 'llama-3.3-70b-versatile',
    messages,
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
async function generateWithRotation(prompt, mode = 'prefix', history = []) {
  if (providers.groq.keys.length === 0 && providers.gemini.keys.length === 0) loadKeys();

  let lastError = null;

  for (const providerName of providerOrder) {
    const p = providers[providerName];
    if (p.keys.length === 0) continue;

    for (let attempt = 0; attempt < p.keys.length; attempt++) {
      const keyIdx = getAvailableKey(providerName);
      if (keyIdx === -1) break;

      try {
        logger.debug(`${p.name} key ${keyIdx + 1}/${p.keys.length}`);
        
        const startTime = Date.now();
        let result;
        if (providerName === 'groq') {
          result = await callGroq(keyIdx, prompt, mode, history);
        } else {
          result = await callGemini(keyIdx, prompt, mode);
        }
        const latency = Date.now() - startTime;

        // Track metrics
        aiMetrics.totalCalls++;
        aiMetrics.lastCallTime = Date.now();
        aiMetrics.latencyHistory.push(latency);
        if (aiMetrics.latencyHistory.length > 20) aiMetrics.latencyHistory.shift();
        aiMetrics.providerUsage[providerName] = (aiMetrics.providerUsage[providerName] || 0) + 1;
        aiMetrics.avgLatency = Math.round(aiMetrics.latencyHistory.reduce((a,b)=>a+b,0) / aiMetrics.latencyHistory.length);
        logger.debug(`AI response: ${latency}ms (${p.name})`);

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
 * @param {object} opts - Optional: { groupStyle: string, mention: string }
 */
async function handleContextual(sock, msg, opts = {}) {
  try {
    // Temporarily override style
    let prevStyle = null;
    if (opts.groupStyle) {
      prevStyle = getOverrides().replyStyle;
      getOverrides().replyStyle = opts.groupStyle;
    }

    const contactId = msg.from;
    const history = getHistory(contactId);

    // Save user message to history
    addToHistory(contactId, 'user', msg.text);

    const prompt = `${msg.name} mengirim pesan: "${msg.text}"\n\nBalas pesan ini.`;
    const aiText = await generateWithRotation(prompt, 'contextual', history);

    // Save bot reply to history
    addToHistory(contactId, 'assistant', aiText);

    // Restore style
    if (opts.groupStyle && prevStyle !== undefined) {
      getOverrides().replyStyle = prevStyle;
    }

    const sendOpts = { text: aiText };
    if (opts.mention) sendOpts.mentions = [opts.mention];
    await sock.sendMessage(msg.from, sendOpts);
    logger.outgoing(msg.from.split('@')[0], `[AI-Context] ${aiText.substring(0, 50)}...`);
  } catch (err) {
    logger.error('Contextual AI error', err);
    const messages = config.awayMode.messages;
    const fallback = messages[Math.floor(Math.random() * messages.length)];
    const sendOpts = { text: fallback };
    if (opts.mention) sendOpts.mentions = [opts.mention];
    await sock.sendMessage(msg.from, sendOpts);
  }
}

function getAIMetrics() { return { ...aiMetrics }; }

module.exports = { handle, handleContextual, clearHistory, getAIMetrics };

// ─── Register state for persistence ───
store.register('chatHistory', chatHistory);
store.register('aiMetrics', aiMetrics);
