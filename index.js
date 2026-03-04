// ============================================
// index.js — Entry Point (Cloud-Ready Version)
// ============================================
// Penjelasan:
// Entry point yang support both:
// - Local: QR muncul di terminal
// - Cloud (Koyeb/Railway): QR muncul di web browser
//
// Di cloud, buka URL yang dikasih → scan QR dari browser
// Setelah scan pertama, session tersimpan → restart ga perlu scan lagi
// ============================================

require('dotenv').config();

const express = require('express');
const QRCode = require('qrcode');
const { connectToWhatsApp } = require('./src/connection');
const { handleMessage } = require('./src/handler');
const config = require('./config.js');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

// ─── State untuk QR Web ───
let currentQR = null;      // QR code string saat ini
let qrGeneratedAt = null;  // Timestamp kapan QR dibuat
let isConnected = false;

// ─── Express server (untuk QR di cloud + health check + dashboard) ───
const app = express();

// Health check endpoint (dibutuhkan Koyeb)
app.get('/health', (req, res) => {
  res.json({ 
    status: isConnected ? 'connected' : 'waiting_qr',
    uptime: process.uptime(),
    owner: process.env.OWNER_NAME || 'Not set',
  });
});

// ─── Dashboard Auth middleware ───
function authDashboard(req, res, next) {
  const key = req.query.key || req.headers['x-auth-key'] || '';
  const ownerNumber = process.env.OWNER_NUMBER || '';
  if (!ownerNumber || key !== ownerNumber) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// JSON body parser
app.use(express.json());

// ─── Dashboard page ───
const path = require('path');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.get('/dashboard', authDashboard, (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'web', 'dashboard.html'));
});

// ─── Contact tracker (shared module) ───
const { getContacts } = require('./src/utils/contacts');

// ─── Load persisted state ───
const store = require('./src/utils/store');
store.load();

// ─── API: Stats (semua data untuk dashboard) ───
app.get('/api/stats', authDashboard, (req, res) => {
  const { botState, runtimeOverrides, groupSettings, inbox } = require('./src/features/botControl');
  const { getAIMetrics } = require('./src/features/aiReply');
  
  // Count API keys
  let groqKeys = 0, geminiKeys = 0;
  for (let i = 1; i <= 20; i++) {
    if (process.env[`GROQ_API_KEY_${i}`]) groqKeys++;
    if (process.env[`GEMINI_API_KEY_${i}`]) geminiKeys++;
  }
  if (!groqKeys && process.env.GROQ_API_KEY) groqKeys = 1;
  if (!geminiKeys && process.env.GEMINI_API_KEY) geminiKeys = 1;

  const groups = Object.entries(groupSettings).map(([id, s]) => ({
    id: id.split('@')[0], enabled: s.enabled, style: s.style
  }));

  const metrics = getAIMetrics();

  res.json({
    connected: isConnected,
    uptime: process.uptime(),
    owner: process.env.OWNER_NAME || 'Bot',
    awayMode: botState.awayMode,
    dnd: botState.dndUntil ? Date.now() < botState.dndUntil : false,
    dndUntil: botState.dndUntil,
    style: runtimeOverrides.replyStyle || config.ai.replyStyle || 'santai',
    model: runtimeOverrides.model || config.ai.model || 'llama-3.3-70b-versatile',
    language: config.language || 'id',
    timezone: config.timezone || 'Asia/Jakarta',
    contextualMode: config.ai.contextualMode,
    replyDelay: config.safety.replyDelay,
    maxReplies: config.safety.maxRepliesPerContact,
    cooldown: config.safety.cooldownPerContact,
    maxTokens: config.ai.maxTokens || 500,
    ignoreGroups: config.safety.ignoreGroups,
    scheduleEnabled: config.awayMode.schedule?.enabled || false,
    scheduleStart: config.awayMode.schedule?.sleepStart || '',
    scheduleEnd: config.awayMode.schedule?.sleepEnd || '',
    historyEnabled: config.ai.chatHistory?.enabled || false,
    historyMax: config.ai.chatHistory?.maxMessages || 6,
    historyAge: config.ai.chatHistory?.maxAge || 30,
    groqKeys,
    geminiKeys,
    inboxCount: (inbox || []).length,
    inbox: (inbox || []).slice(-50),
    groupCount: groups.filter(g => g.enabled).length,
    groups,
    contacts: getContacts(50),
    aiMetrics: metrics,
    qr: currentQR ? true : false,
    version: '2.0.0',
    stylePresets: (() => { try { return require('./src/utils/locale').getStylePresets(); } catch(e) { return ['santai','formal','gaul','campur']; } })(),
    availableLanguages: ['id','en','es','ar','pt','ja','hi','ko','fr','ms'],
  });
});

// ─── API: Control — Toggle away ───
app.post('/api/away', authDashboard, (req, res) => {
  const { botState } = require('./src/features/botControl');
  const { action } = req.body; // 'on' or 'off'
  if (action === 'on') {
    botState.awayMode = true;
    logger.info('[Dashboard] Away mode ON');
  } else {
    botState.awayMode = false;
    botState.dndUntil = null;
    logger.info('[Dashboard] Away mode OFF');
  }
  store.save();
  res.json({ ok: true, awayMode: botState.awayMode });
});

// ─── API: Control — Change style ───
app.post('/api/style', authDashboard, (req, res) => {
  const { runtimeOverrides } = require('./src/features/botControl');
  const { style } = req.body;
  runtimeOverrides.replyStyle = style || null;
  logger.info(`[Dashboard] Style -> ${style || 'default'}`);
  store.save();
  res.json({ ok: true, style: runtimeOverrides.replyStyle });
});

// ─── API: Control — Change model ───
app.post('/api/model', authDashboard, (req, res) => {
  const { runtimeOverrides } = require('./src/features/botControl');
  const { model } = req.body;
  runtimeOverrides.model = model || null;
  logger.info(`[Dashboard] Model -> ${model || 'default'}`);
  store.save();
  res.json({ ok: true, model: runtimeOverrides.model });
});

// ─── API: Control — Change language ───
app.post('/api/language', authDashboard, (req, res) => {
  const { lang } = req.body;
  const available = ['id','en','es','ar','pt','ja','hi','ko','fr','ms'];
  if (!lang || !available.includes(lang)) {
    return res.json({ ok: false, error: 'Invalid language: ' + lang });
  }
  config.language = lang;
  // Reset locale cache
  try { delete require.cache[require.resolve('./src/utils/locale')]; } catch(e) {}
  // Persist language change
  const co = store._getConfigOverrides();
  co.language = lang;
  store.save();
  logger.info(`[Dashboard] Language -> ${lang}`);
  res.json({ ok: true, language: lang });
});

// ─── API: Control — Update config settings ───
app.post('/api/config', authDashboard, (req, res) => {
  const changes = [];
  const { name, delay, cooldown, maxReplies, contextual, history } = req.body;

  if (name !== undefined && name.trim()) {
    process.env.OWNER_NAME = name.trim();
    changes.push(`Name → ${name.trim()}`);
  }
  if (delay !== undefined) {
    const v = parseInt(delay);
    if (v >= 500 && v <= 10000) { config.safety.replyDelay = v; changes.push(`Delay → ${v}ms`); }
  }
  if (cooldown !== undefined) {
    const v = parseInt(cooldown);
    if (v >= 30 && v <= 3600) { config.safety.cooldownPerContact = v; changes.push(`Cooldown → ${v}s`); }
  }
  if (maxReplies !== undefined) {
    const v = parseInt(maxReplies);
    if (v >= 1 && v <= 20) { config.safety.maxRepliesPerContact = v; changes.push(`MaxReplies → ${v}`); }
  }
  if (contextual !== undefined) {
    config.ai.contextualMode = !!contextual;
    changes.push(`Contextual → ${contextual ? 'ON' : 'OFF'}`);
  }
  if (history !== undefined) {
    if (config.ai.chatHistory) config.ai.chatHistory.enabled = !!history;
    changes.push(`History \u2192 ${history ? 'ON' : 'OFF'}`);
  }
  if (req.body.scheduleEnabled !== undefined) {
    if (config.awayMode.schedule) config.awayMode.schedule.enabled = !!req.body.scheduleEnabled;
    changes.push(`Schedule \u2192 ${req.body.scheduleEnabled ? 'ON' : 'OFF'}`);
  }
  if (req.body.scheduleStart) {
    if (config.awayMode.schedule) config.awayMode.schedule.sleepStart = req.body.scheduleStart;
    changes.push(`Schedule start \u2192 ${req.body.scheduleStart}`);
  }
  if (req.body.scheduleEnd) {
    if (config.awayMode.schedule) config.awayMode.schedule.sleepEnd = req.body.scheduleEnd;
    changes.push(`Schedule end \u2192 ${req.body.scheduleEnd}`);
  }
  if (req.body.timezone) {
    config.timezone = req.body.timezone;
    changes.push(`Timezone \u2192 ${req.body.timezone}`);
  }
  if (req.body.maxTokens !== undefined) {
    const v = parseInt(req.body.maxTokens);
    if (v >= 200 && v <= 4096) { config.ai.maxTokens = v; changes.push(`MaxTokens \u2192 ${v}`); }
  }
  if (req.body.ignoreGroups !== undefined) {
    config.safety.ignoreGroups = !!req.body.ignoreGroups;
    changes.push(`IgnoreGroups \u2192 ${req.body.ignoreGroups ? 'ON' : 'OFF'}`);
  }

  if (changes.length) logger.info(`[Dashboard] Config: ${changes.join(', ')}`);

  // Persist config overrides so they survive restarts
  if (changes.length) {
    const co = store._getConfigOverrides();
    if (name !== undefined && name.trim()) co.ownerName = name.trim();
    if (config.safety.replyDelay) co.replyDelay = config.safety.replyDelay;
    if (config.safety.maxRepliesPerContact) co.maxReplies = config.safety.maxRepliesPerContact;
    if (config.safety.cooldownPerContact) co.cooldown = config.safety.cooldownPerContact;
    if (config.ai.maxTokens) co.maxTokens = config.ai.maxTokens;
    co.contextual = config.ai.contextualMode;
    co.historyEnabled = config.ai.chatHistory?.enabled || false;
    co.ignoreGroups = config.safety.ignoreGroups;
    co.timezone = config.timezone;
    co.scheduleEnabled = config.awayMode.schedule?.enabled || false;
    co.scheduleStart = config.awayMode.schedule?.sleepStart || '';
    co.scheduleEnd = config.awayMode.schedule?.sleepEnd || '';
    store.save();
  }

  res.json({ ok: true, changes });
});

// ─── API: Control — Toggle group ───
app.post('/api/groups/toggle', authDashboard, (req, res) => {
  const { groupSettings } = require('./src/features/botControl');
  const { id, enabled } = req.body;
  if (!id) return res.json({ ok: false, error: 'Missing group id' });
  if (!groupSettings[id]) groupSettings[id] = { enabled: false, style: null };
  groupSettings[id].enabled = !!enabled;
  logger.info(`[Dashboard] Group ${id}: ${enabled ? 'ON' : 'OFF'}`);
  store.save();
  res.json({ ok: true });
});

// ─── API: Clear inbox ───
app.get('/api/inbox/clear', authDashboard, (req, res) => {
  const { inbox } = require('./src/features/botControl');
  if (inbox) inbox.length = 0;
  logger.info('[Dashboard] Inbox cleared');
  res.json({ ok: true });
});

// ─── API: Clear history ───
app.get('/api/history/clear', authDashboard, (req, res) => {
  const { clearHistory } = require('./src/features/aiReply');
  clearHistory();
  logger.info('[Dashboard] Chat history cleared');
  res.json({ ok: true });
});

// ─── API: Clear logs ───
app.get('/api/logs/clear', authDashboard, (req, res) => {
  logger.clearLogs();
  logger.info('[Dashboard] Logs cleared');
  res.json({ ok: true });
});

// ─── API: Clear contacts ───
app.get('/api/contacts/clear', authDashboard, (req, res) => {
  const { clearContacts } = require('./src/utils/contacts');
  clearContacts();
  logger.info('[Dashboard] Contacts cleared');
  res.json({ ok: true });
});

// ─── API: SSE Log stream ───
app.get('/api/logs/stream', authDashboard, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  // Send recent logs as initial batch
  const recent = logger.getRecentLogs();
  for (const entry of recent) {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  }
  logger.addSSEClient(res);
  req.on('close', () => logger.removeSSEClient(res));
});

// ─── API: QR code data ───
app.get('/api/qr', authDashboard, async (req, res) => {
  if (isConnected) return res.json({ connected: true, qr: null });
  if (!currentQR) return res.json({ connected: false, qr: null, waiting: true });
  const qrImage = await QRCode.toDataURL(currentQR, { width: 280, margin: 2 });
  const elapsed = qrGeneratedAt ? Math.floor((Date.now() - qrGeneratedAt) / 1000) : 0;
  res.json({ connected: false, qr: qrImage, remaining: Math.max(60 - elapsed, 0) });
});

// QR code page (untuk scan dari browser)
app.get('/', async (req, res) => {
  if (isConnected) {
    res.send(`
      <html>
      <head><title>AutoWA — Connected</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0a0a; color: #fff; 
               display: flex; align-items: center; justify-content: center; height: 100vh; }
        .card { background: #111827; padding: 48px; border-radius: 20px; text-align: center; 
                box-shadow: 0 0 40px rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.2); }
        .check { width: 64px; height: 64px; border-radius: 50%; background: rgba(16,185,129,0.15);
                 display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
                 animation: pulse-green 2s ease infinite; }
        .check svg { width: 32px; height: 32px; }
        @keyframes pulse-green { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 50% { box-shadow: 0 0 0 16px rgba(16,185,129,0); } }
        h2 { color: #10b981; font-size: 22px; margin-bottom: 8px; }
        p { color: #6b7280; font-size: 14px; }
        .uptime { color: #374151; font-size: 12px; margin-top: 16px; }
      </style></head>
      <body>
        <div class="card">
          <div class="check">
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2>Connected</h2>
          <p>WhatsApp is linked and the bot is running.</p>
          <p class="uptime">Uptime: ${Math.floor(process.uptime())}s</p>
        </div>
      </body></html>
    `);
    return;
  }

  if (!currentQR) {
    res.send(`
      <html>
      <head><title>AutoWA — Waiting</title>
      <meta http-equiv="refresh" content="3">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0a0a; color: #fff; 
               display: flex; align-items: center; justify-content: center; height: 100vh; }
        .card { background: #111827; padding: 48px 56px; border-radius: 20px; text-align: center; 
                box-shadow: 0 0 40px rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.15); }
        .loader { width: 48px; height: 48px; margin: 0 auto 24px; position: relative; }
        .loader::before, .loader::after {
          content: ''; position: absolute; border-radius: 50%;
          inset: 0; border: 3px solid transparent;
        }
        .loader::before { border-top-color: #6366f1; animation: spin 1s linear infinite; }
        .loader::after { border-top-color: #818cf8; inset: 6px; animation: spin 0.6s linear infinite reverse; }
        @keyframes spin { to { transform: rotate(360deg); } }
        h2 { color: #a5b4fc; font-size: 20px; margin-bottom: 8px; }
        p { color: #6b7280; font-size: 14px; }
        .dots::after { content: ''; animation: dots 1.5s steps(4) infinite; }
        @keyframes dots { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } }
      </style></head>
      <body>
        <div class="card">
          <div class="loader"></div>
          <h2>Waiting for QR Code<span class="dots"></span></h2>
          <p>This page will refresh automatically.</p>
        </div>
      </body></html>
    `);
    return;
  }

  // Hitung sisa waktu QR (expire ~60 detik dari pembuatan)
  const elapsed = qrGeneratedAt ? Math.floor((Date.now() - qrGeneratedAt) / 1000) : 0;
  const remaining = Math.max(60 - elapsed, 5); // minimal 5 detik

  // Generate QR sebagai gambar
  const qrImage = await QRCode.toDataURL(currentQR, { width: 300, margin: 2 });
  
  res.send(`
    <html>
    <head><title>AutoWA — Scan QR</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0a0a; color: #fff; 
             display: flex; align-items: center; justify-content: center; height: 100vh; }
      .card { background: #111827; padding: 40px; border-radius: 20px; text-align: center; 
              box-shadow: 0 0 40px rgba(79,195,247,0.1); border: 1px solid rgba(79,195,247,0.15); max-width: 420px; }
      img { border-radius: 12px; margin: 16px 0; }
      h2 { color: #4fc3f7; margin-bottom: 8px; font-size: 22px; }
      p { color: #6b7280; font-size: 14px; }
      .steps { color: #9ca3af; font-size: 13px; margin-bottom: 4px; }
      .timer { font-size: 36px; font-weight: 700; color: #4fc3f7; margin: 8px 0; font-variant-numeric: tabular-nums; }
      .timer.warning { color: #fbbf24; }
      .timer.danger { color: #ef4444; }
      .bar-bg { width: 100%; height: 4px; background: #1f2937; border-radius: 2px; margin: 12px 0; overflow: hidden; }
      .bar-fill { height: 100%; background: #4fc3f7; border-radius: 2px; transition: width 1s linear, background 0.5s; }
      .bar-fill.warning { background: #fbbf24; }
      .bar-fill.danger { background: #ef4444; }
      .label { color: #4b5563; font-size: 12px; }
    </style></head>
    <body>
      <div class="card">
        <h2>Scan QR Code</h2>
        <p class="steps">WhatsApp > Settings > Linked Devices > Link a Device</p>
        <img src="${qrImage}" alt="QR Code" />
        <div class="timer" id="timer">${remaining}</div>
        <div class="bar-bg"><div class="bar-fill" id="bar" style="width:${(remaining/60*100).toFixed(1)}%"></div></div>
        <p class="label" id="label">seconds remaining</p>
      </div>
      <script>
        let sec = ${remaining};
        const timer = document.getElementById('timer');
        const bar = document.getElementById('bar');
        const label = document.getElementById('label');
        setInterval(() => {
          sec--;
          if (sec <= 0) {
            timer.textContent = 'Expired';
            timer.className = 'timer danger';
            bar.style.width = '0%';
            label.textContent = 'Refreshing...';
            setTimeout(() => location.reload(), 2000);
            return;
          }
          timer.textContent = sec;
          bar.style.width = (sec / 60 * 100) + '%';
          if (sec <= 10) {
            timer.className = 'timer danger';
            bar.className = 'bar-fill danger';
          } else if (sec <= 25) {
            timer.className = 'timer warning';
            bar.className = 'bar-fill warning';
          }
        }, 1000);
      </script>
    </body></html>
  `);
});

// ─── CLI Display Helpers ───
const C = {
  g: '\x1b[32m',    // green
  c: '\x1b[36m',    // cyan
  y: '\x1b[33m',    // yellow
  r: '\x1b[31m',    // red
  b: '\x1b[1m',     // bold
  d: '\x1b[90m',    // dim
  x: '\x1b[0m',     // reset
};

function cliBanner() {
  const startTime = new Date().toLocaleString('id-ID', { timeZone: config.timezone || 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'medium' });
  console.log('');
  console.log(`${C.g}${C.b}  █████╗ ██╗   ██╗████████╗ ██████╗ ██╗    ██╗ █████╗ ${C.x}`);
  console.log(`${C.g}${C.b} ██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗██║    ██║██╔══██╗${C.x}`);
  console.log(`${C.g}${C.b} ███████║██║   ██║   ██║   ██║   ██║██║ █╗ ██║███████║${C.x}`);
  console.log(`${C.g}${C.b} ██╔══██║██║   ██║   ██║   ██║   ██║██║███╗██║██╔══██║${C.x}`);
  console.log(`${C.g}${C.b} ██║  ██║╚██████╔╝   ██║   ╚██████╔╝╚███╔███╔╝██║  ██║${C.x}`);
  console.log(`${C.g}${C.b} ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═╝${C.x}`);
  console.log(`${C.d}  v2.0.0 | ${startTime}${C.x}`);
  console.log('');
}

function cliConfig() {
  const key = process.env.OWNER_NUMBER || '';
  const dashUrl = `http://localhost:${PORT}/dashboard?key=${key}`;
  const lines = [
    ['owner', process.env.OWNER_NAME || 'Not set'],
    ['language', config.language || 'id'],
    ['away', config.awayMode.enabled ? 'ON' : 'OFF'],
    ['delay', `${config.safety.replyDelay}ms`],
    ['cooldown', `${config.safety.cooldownPerContact}s`],
    ['max-reply', `${config.safety.maxRepliesPerContact}x`],
    ['groups', config.safety.ignoreGroups ? 'IGNORE' : 'ACTIVE'],
  ];
  if (config.awayMode.schedule?.enabled) {
    lines.push(['schedule', `${config.awayMode.schedule.sleepStart}-${config.awayMode.schedule.sleepEnd}`]);
  }

  console.log(`${C.d}  ─── system config ───────────────────${C.x}`);
  for (const [k, v] of lines) {
    console.log(`${C.d}  ${C.c}${k.padEnd(12)}${C.d}= ${C.g}${v}${C.x}`);
  }
  console.log('');
  console.log(`${C.d}  ─── dashboard ────────────────────────${C.x}`);
  console.log(`${C.c}  ${dashUrl}${C.x}`);
  console.log('');
}

function cliConnected(name) {
  console.log('');
  console.log(`${C.g}  ┌─────────────────────────────────────────┐${C.x}`);
  console.log(`${C.g}  │                                         │${C.x}`);
  console.log(`${C.g}  │   ${C.b}[ONLINE]${C.x}${C.g}  WhatsApp Connected        │${C.x}`);
  console.log(`${C.g}  │   ${C.d}user:${C.x}${C.g}    ${name.padEnd(26)}│${C.x}`);
  console.log(`${C.g}  │   ${C.d}status:${C.x}${C.g}  Bot aktif & siap menerima  │${C.x}`);
  console.log(`${C.g}  │                                         │${C.x}`);
  console.log(`${C.g}  └─────────────────────────────────────────┘${C.x}`);
  console.log('');
}

// ─── Animated loader ───
function startLoader(text) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const id = setInterval(() => {
    process.stdout.write(`\r${C.c}  ${frames[i++ % frames.length]} ${text}${C.x}   `);
  }, 80);
  return { stop: (msg) => {
    clearInterval(id);
    process.stdout.write(`\r${C.g}  ✓ ${msg}${C.x}                              \n`);
  }};
}

// ─── Start bot! ───
async function start() {
  try {
    cliBanner();
    cliConfig();

    // AI key check
    const hasGroq = process.env.GROQ_API_KEY_1 || process.env.GROQ_API_KEY;
    const hasGemini = process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY;
    let aiInfo = [];
    if (hasGroq) aiInfo.push('Groq');
    if (hasGemini) aiInfo.push('Gemini');
    if (aiInfo.length) {
      console.log(`${C.d}  ─── ai providers ────────────────────${C.x}`);
      console.log(`${C.g}  ${aiInfo.join(' + ')} configured${C.x}`);
      console.log('');
    } else {
      console.log(`${C.y}  [!] Tidak ada API key AI${C.x}`);
      console.log('');
    }

    // Start web server
    const loader1 = startLoader('Starting web server...');
    await new Promise(resolve => app.listen(PORT, resolve));
    loader1.stop(`Web server aktif di port ${PORT}`);

    // Connect to WhatsApp
    const loader2 = startLoader('Connecting to WhatsApp...');
    const sock = await connectToWhatsApp(handleMessage, (qr) => {
      loader2.stop('QR Code tersedia');
      currentQR = qr;
      qrGeneratedAt = Date.now();
      logger.info('Scan QR dari browser atau terminal');
    }, (name) => {
      loader2.stop('WhatsApp terhubung');
      isConnected = true;
      currentQR = null;
      qrGeneratedAt = null;
      cliConnected(name);
      logger.info('Bot aktif -- semua pesan akan diproses otomatis');
    });
  } catch (err) {
    logger.error('Gagal start bot', err);
  }
}

start();

// ─── Keep-alive: ping diri sendiri agar tidak sleep ───
if (config.keepAlive?.enabled !== false) {
  const keepAliveMs = (config.keepAlive?.intervalMinutes || 4) * 60 * 1000;
  setInterval(() => {
    const url = `http://localhost:${PORT}/health`;
    require('http').get(url, () => {}).on('error', () => {});
  }, keepAliveMs);
}

// ─── Graceful Shutdown ───
// Graceful Shutdown handled by store.js (SIGINT -> save state -> exit)

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', err);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection', err);
});
