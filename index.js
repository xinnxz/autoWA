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
  res.json({ ok: true, awayMode: botState.awayMode });
});

// ─── API: Control — Change style ───
app.post('/api/style', authDashboard, (req, res) => {
  const { runtimeOverrides } = require('./src/features/botControl');
  const { style } = req.body;
  runtimeOverrides.replyStyle = style || null;
  logger.info(`[Dashboard] Style → ${style || 'default'}`);
  res.json({ ok: true, style: runtimeOverrides.replyStyle });
});

// ─── API: Control — Change model ───
app.post('/api/model', authDashboard, (req, res) => {
  const { runtimeOverrides } = require('./src/features/botControl');
  const { model } = req.body;
  runtimeOverrides.model = model || null;
  logger.info(`[Dashboard] Model → ${model || 'default'}`);
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
  logger.info(`[Dashboard] Language \u2192 ${lang}`);
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
    changes.push(`History → ${history ? 'ON' : 'OFF'}`);
  }

  if (changes.length) logger.info(`[Dashboard] Config: ${changes.join(', ')}`);
  res.json({ ok: true, changes });
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
      <head><title>AutoWA Bot</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; 
               display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #1a1a2e; padding: 40px; border-radius: 16px; text-align: center; 
                box-shadow: 0 8px 32px rgba(0,200,100,0.2); }
        .status { font-size: 48px; margin-bottom: 16px; }
        h2 { color: #00c853; margin: 0; }
        p { color: #888; }
      </style></head>
      <body>
        <div class="card">
          <div class="status">✅</div>
          <h2>Bot Terhubung!</h2>
          <p>WhatsApp sudah terkoneksi. Bot sedang berjalan.</p>
          <p style="color:#555; font-size:12px;">Uptime: ${Math.floor(process.uptime())}s</p>
        </div>
      </body></html>
    `);
    return;
  }

  if (!currentQR) {
    res.send(`
      <html>
      <head><title>AutoWA Bot</title>
      <meta http-equiv="refresh" content="3">
      <style>
        body { font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; 
               display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #1a1a2e; padding: 40px; border-radius: 16px; text-align: center; }
        .spinner { font-size: 48px; animation: spin 2s infinite; display: inline-block; }
        @keyframes spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
        p { color: #888; }
      </style></head>
      <body>
        <div class="card">
          <div class="spinner">⏳</div>
          <h2>Menunggu QR Code...</h2>
          <p>Halaman ini akan refresh otomatis.</p>
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
    <head><title>AutoWA Bot — Scan QR</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; 
             display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
      .card { background: #1a1a2e; padding: 40px; border-radius: 16px; text-align: center; 
              box-shadow: 0 8px 32px rgba(0,100,255,0.2); max-width: 400px; }
      img { border-radius: 12px; margin: 16px 0; }
      h2 { color: #4fc3f7; margin-bottom: 8px; }
      p { color: #888; font-size: 14px; }
      .timer { font-size: 32px; font-weight: bold; color: #4fc3f7; margin: 8px 0; }
      .timer.warning { color: #ffa726; }
      .timer.danger { color: #ef5350; }
      .progress-bar { width: 100%; height: 4px; background: #333; border-radius: 2px; margin: 12px 0; overflow: hidden; }
      .progress-fill { height: 100%; background: #4fc3f7; border-radius: 2px; transition: width 1s linear, background 1s; }
      .progress-fill.warning { background: #ffa726; }
      .progress-fill.danger { background: #ef5350; }
      .expired { color: #ef5350; font-size: 18px; font-weight: bold; }
    </style></head>
    <body>
      <div class="card">
        <h2>Scan QR Code</h2>
        <p>Buka WhatsApp > Settings > Linked Devices > Link a Device</p>
        <img src="${qrImage}" alt="QR Code" />
        <div class="timer" id="timer">${remaining}</div>
        <div class="progress-bar"><div class="progress-fill" id="bar" style="width:${(remaining/60*100).toFixed(1)}%"></div></div>
        <p id="label">detik tersisa</p>
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
            timer.className = 'expired';
            bar.style.width = '0%';
            label.textContent = 'Halaman refresh otomatis...';
            setTimeout(() => location.reload(), 2000);
            return;
          }
          timer.textContent = sec;
          bar.style.width = (sec / 60 * 100) + '%';
          if (sec <= 10) {
            timer.className = 'timer danger';
            bar.className = 'progress-fill danger';
          } else if (sec <= 25) {
            timer.className = 'timer warning';
            bar.className = 'progress-fill warning';
          }
        }, 1000);
      </script>
    </body></html>
  `);
});

// ─── Tampilkan banner ───
const startTime = new Date().toLocaleString('id-ID', { timeZone: config.timezone || 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'medium' });
console.log('');
console.log('╔══════════════════════════════════════════╗');
console.log('║                                          ║');
console.log('║   🤖 AutoWA Bot v2.0.0                   ║');
console.log('║   Personal Auto-Reply (Baileys)          ║');
console.log('║                                          ║');
console.log(`║   ${startTime.padEnd(38)} ║`);
console.log('║                                          ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');

// ─── Tips anti-ban ───
console.log('🛡️  TIPS ANTI-BAN:');
console.log('   1. Jangan reply terlalu cepat (delay aktif)');
console.log('   2. Group chat diabaikan');
console.log('   3. Max reply per kontak dibatasi');
console.log('   4. Jangan broadcast massal');
console.log('');

// ─── Config info ───
logger.info(`Owner: ${process.env.OWNER_NAME || 'Not set'}`);
logger.info(`Language: ${config.language || 'id'}`);
logger.info(`Away Mode: ${config.awayMode.enabled ? 'ON' : 'OFF'}`);
if (config.awayMode.schedule.enabled) {
  logger.info(`Schedule: Away ${config.awayMode.schedule.sleepStart} - ${config.awayMode.schedule.sleepEnd} WIB`);
}
logger.info(`Reply Delay: ${config.safety.replyDelay}ms`);
logger.info(`Max Reply/Contact: ${config.safety.maxRepliesPerContact}x (cooldown ${config.safety.cooldownPerContact}s)`);
logger.info(`Ignore Groups: ${config.safety.ignoreGroups ? 'Ya' : 'Tidak'}`);
logger.info(`Dashboard: http://localhost:${PORT}/dashboard?key=***`);
console.log('');

// ─── Start bot! ───
async function start() {
  try {
    // Start web server dulu (untuk health check + QR)
    app.listen(PORT, () => {
      logger.info(`Web server jalan di port ${PORT}`);
      logger.info(`QR Scanner: http://localhost:${PORT}`);
    });

    logger.info('Menghubungkan ke WhatsApp...');
    const sock = await connectToWhatsApp(handleMessage, (qr) => {
      // Callback untuk QR update
      currentQR = qr;
      qrGeneratedAt = Date.now();
      logger.info('QR Code baru tersedia! Scan dari browser.');
    }, () => {
      // Callback untuk connected
      isConnected = true;
      currentQR = null;
      qrGeneratedAt = null;
    });
    
    logger.info('Bot siap! Menunggu pesan masuk...');

    // AI key check
    const hasGroq = process.env.GROQ_API_KEY_1 || process.env.GROQ_API_KEY;
    const hasGemini = process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY;
    if (hasGroq) logger.info('Groq API configured ✅');
    if (hasGemini) logger.info('Gemini API configured ✅');
    if (!hasGroq && !hasGemini) {
      logger.warn('Tidak ada API key AI (Groq/Gemini). Fitur AI contextual tidak aktif.');
    }
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
process.on('SIGINT', () => {
  logger.info('Bot shutting down...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', err);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection', err);
});
