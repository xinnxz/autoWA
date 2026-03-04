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

// QR code page — WhatsApp-style light theme
app.get('/', async (req, res) => {
  const head = '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<link rel="preconnect" href="https://fonts.googleapis.com">'
    + '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">'
    + '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,system-ui,-apple-system,sans-serif;background:#f0f2f5;display:flex;align-items:center;justify-content:center;min-height:100vh}.ctn{background:#fff;border-radius:12px;padding:48px 52px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.08),0 8px 24px rgba(0,0,0,.04);max-width:460px;width:92%}h1{font-size:20px;font-weight:600;color:#111b21;margin-bottom:8px}.sub{color:#667781;font-size:14px;line-height:1.5;margin-bottom:24px}</style>';

  const logo = '<div style="width:52px;height:52px;margin:0 auto 24px"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="wg" x1="512" y1="1" x2="512" y2="1025" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#61fd7d"/><stop offset="1" stop-color="#2bb826"/></linearGradient></defs><rect width="1024" height="1024" rx="230" fill="url(#wg)"/><path fill="#fff" d="M783.3 243.2c-69.3-69.4-161.5-107.6-259.8-107.6-202.4 0-367.1 164.7-367.2 367.1-.03 64.7 16.9 127.8 49 183.5l-52.1 190.2 194.7-51c53.6 29.2 114 44.6 175.5 44.7h.1c202.4 0 367.1-164.7 367.2-367.1 0-98.1-38.1-190.3-107.4-259.7zm-259.8 564.8h-.1c-54.8 0-108.5-14.7-155.3-42.5l-11.1-6.6-115.5 30.3 30.8-112.6-7.3-11.5c-30.5-48.6-46.7-104.7-46.7-162.4.1-168.2 137-305.1 305.3-305.1 81.5 0 158.2 31.8 215.8 89.5s89.3 134.3 89.3 215.9c-.1 168.2-137 305.1-305.2 305zm167.4-228.5c-9.2-4.6-54.3-26.8-62.7-29.8-8.4-3.1-14.5-4.6-20.6 4.6-6.1 9.2-23.7 29.8-29.1 36-5.3 6.1-10.7 6.9-19.9 2.3-9.2-4.6-38.7-14.3-73.8-45.5-27.3-24.3-45.7-54.4-51-63.5-5.4-9.2-.6-14.1 4-18.7 4.1-4.1 9.2-10.7 13.8-16.1 4.6-5.3 6.1-9.2 9.2-15.3 3.1-6.1 1.5-11.5-.8-16.1-2.3-4.6-20.6-49.7-28.3-68.1-7.4-17.9-15-15.5-20.6-15.7-5.3-.3-11.5-.3-17.6-.3s-16.1 2.3-24.5 11.5-32.1 31.4-32.1 76.5c0 45.1 32.9 88.8 37.5 94.9 4.6 6.1 64.7 98.8 156.7 138.5 21.9 9.4 39 15.1 52.3 19.3 22 7 42 6 57.8 3.6 17.6-2.6 54.3-22.2 61.9-43.6 7.6-21.4 7.6-39.8 5.4-43.6-2.3-3.8-8.4-6.1-17.6-10.7z"/></svg></div>';


  // Connected state
  if (isConnected) {
    const ownerNum = process.env.OWNER_NUMBER || '';
    const dashUrl = '/dashboard?key=' + ownerNum;
    return res.send('<html><head><title>AutoWA — Connected</title>' + head
      + '<style>.icon{width:72px;height:72px;border-radius:50%;background:#e8faf0;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;animation:pop .5s ease}.icon svg{width:36px;height:36px}@keyframes pop{0%{transform:scale(0)}60%{transform:scale(1.1)}100%{transform:scale(1)}}h1{color:#00a884}.meta{color:#8696a0;font-size:13px;margin-top:20px;padding-top:16px;border-top:1px solid #e9edef}a{color:#00a884;text-decoration:none;font-weight:500}a:hover{text-decoration:underline}</style></head>'
      + '<body><div class="ctn">'
      + '<div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="#00a884" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>'
      + '<h1>Connected</h1>'
      + '<p class="sub">Your WhatsApp is linked successfully.<br>Redirecting to dashboard...</p>'
      + '<p class="meta"><a href="' + dashUrl + '">Open Dashboard</a></p>'
      + '</div><script>setTimeout(function(){window.location.href="' + dashUrl + '"},2000)</script></body></html>');
  }

  // Waiting for QR
  if (!currentQR) {
    return res.send('<html><head><title>AutoWA — Connecting</title>' + head
      + '<meta http-equiv="refresh" content="3">'
      + '<style>.spin{width:44px;height:44px;margin:0 auto 24px;border:3px solid #e9edef;border-top-color:#00a884;border-radius:50%;animation:r .8s linear infinite}@keyframes r{to{transform:rotate(360deg)}}</style></head>'
      + '<body><div class="ctn">'
      + '<div class="spin"></div>'
      + '<h1>Generating QR Code</h1>'
      + '<p class="sub">Please wait, this page refreshes automatically.</p>'
      + '</div></body></html>');
  }

  // QR Code display
  const elapsed = qrGeneratedAt ? Math.floor((Date.now() - qrGeneratedAt) / 1000) : 0;
  const remaining = Math.max(60 - elapsed, 5);
  const qrImage = await QRCode.toDataURL(currentQR, { width: 264, margin: 2 });

  const stepsCSS = '<style>'
    + '.steps{text-align:left;margin-bottom:28px}'
    + '.st{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px}'
    + '.sn{width:24px;height:24px;border-radius:50%;background:#e8faf0;color:#00a884;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}'
    + '.sx{color:#3b4a54;font-size:14px;line-height:1.5}'
    + '.sx b{color:#111b21;font-weight:600}'
    + '.qf{border:1px solid #e9edef;border-radius:8px;padding:16px;display:inline-block;margin-bottom:20px}'
    + '.qf img{display:block;border-radius:4px}'
    + '.tm{font-size:28px;font-weight:700;color:#00a884;font-variant-numeric:tabular-nums}'
    + '.tm.w{color:#f0b429}.tm.d{color:#ea4335}'
    + '.bb{width:100%;height:3px;background:#e9edef;border-radius:2px;margin:10px 0;overflow:hidden}'
    + '.bf{height:100%;background:#00a884;border-radius:2px;transition:width 1s linear,background .5s}'
    + '.bf.w{background:#f0b429}.bf.d{background:#ea4335}'
    + '.lb{color:#8696a0;font-size:12px}'
    + '</style>';

  const timerJS = '<script>let s=' + remaining + ';var t=document.getElementById("t"),b=document.getElementById("b"),l=document.getElementById("l");setInterval(function(){s--;if(s<=0){t.textContent="Expired";t.className="tm d";b.style.width="0%";l.textContent="Refreshing...";setTimeout(function(){location.reload()},2e3);return}t.textContent=s;b.style.width=(s/60*100)+"%";if(s<=10){t.className="tm d";b.className="bf d"}else if(s<=25){t.className="tm w";b.className="bf w"}},1e3);setInterval(function(){fetch("/health").then(function(r){return r.json()}).then(function(d){if(d.status==="connected"){location.reload()}}).catch(function(){})},2e3)</script>';

  res.send('<html><head><title>AutoWA — Scan QR Code</title>' + head + stepsCSS + '</head>'
    + '<body><div class="ctn">'
    + '<h1>Link a Device</h1>'
    + '<p class="sub">Scan this QR code from your WhatsApp to connect.</p>'
    + '<div class="steps">'
    + '<div class="st"><div class="sn">1</div><div class="sx">Open <b>WhatsApp</b> on your phone</div></div>'
    + '<div class="st"><div class="sn">2</div><div class="sx">Tap <b>Settings</b> then <b>Linked Devices</b></div></div>'
    + '<div class="st"><div class="sn">3</div><div class="sx">Tap <b>Link a Device</b> and scan this code</div></div>'
    + '</div>'
    + '<div class="qf"><img src="' + qrImage + '" alt="QR Code" width="264" height="264"/></div>'
    + '<div class="tm" id="t">' + remaining + '</div>'
    + '<div class="bb"><div class="bf" id="b" style="width:' + (remaining/60*100).toFixed(1) + '%"></div></div>'
    + '<p class="lb" id="l">seconds remaining</p>'
    + '</div>'
    + timerJS
    + '</body></html>');
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
