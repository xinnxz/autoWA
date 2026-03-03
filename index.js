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
const config = require('./config.json');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

// ─── State untuk QR Web ───
let currentQR = null;  // QR code string saat ini
let isConnected = false;

// ─── Express server (untuk QR di cloud + health check) ───
const app = express();

// Health check endpoint (dibutuhkan Koyeb)
app.get('/health', (req, res) => {
  res.json({ 
    status: isConnected ? 'connected' : 'waiting_qr',
    uptime: process.uptime(),
    owner: process.env.OWNER_NAME || 'Not set',
  });
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

  // Generate QR sebagai gambar
  const qrImage = await QRCode.toDataURL(currentQR, { width: 300, margin: 2 });
  
  res.send(`
    <html>
    <head><title>AutoWA Bot — Scan QR</title>
    <meta http-equiv="refresh" content="15">
    <style>
      body { font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; 
             display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
      .card { background: #1a1a2e; padding: 40px; border-radius: 16px; text-align: center; 
              box-shadow: 0 8px 32px rgba(0,100,255,0.2); }
      img { border-radius: 12px; margin: 16px 0; }
      h2 { color: #4fc3f7; margin-bottom: 8px; }
      p { color: #888; font-size: 14px; }
      .step { color: #fff; text-align: left; margin-top: 16px; font-size: 13px; }
      .step li { margin: 4px 0; }
    </style></head>
    <body>
      <div class="card">
        <h2>📱 Scan QR Code</h2>
        <p>Buka WhatsApp di HP → Settings → Linked Devices → Link a Device</p>
        <img src="${qrImage}" alt="QR Code" />
        <p>QR expires in ~60 detik. Halaman auto-refresh.</p>
      </div>
    </body></html>
  `);
});

// ─── Tampilkan banner ───
console.log('');
console.log('╔══════════════════════════════════════════╗');
console.log('║                                          ║');
console.log('║   🤖 AutoWA Bot v2.0.0                   ║');
console.log('║   Personal Auto-Reply (Baileys)           ║');
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
logger.info(`Away Mode: ${config.awayMode.enabled ? '✅ ON' : '❌ OFF'}`);
if (config.awayMode.schedule.enabled) {
  logger.info(`Schedule: Away ${config.awayMode.schedule.sleepStart} - ${config.awayMode.schedule.sleepEnd} WIB`);
}
logger.info(`Reply Delay: ${config.safety.replyDelay}ms`);
logger.info(`Max Reply/Contact: ${config.safety.maxRepliesPerContact}x (cooldown ${config.safety.cooldownPerContact}s)`);
logger.info(`Ignore Groups: ${config.safety.ignoreGroups ? 'Ya' : 'Tidak'}`);
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
      logger.info('QR Code baru tersedia! Scan dari browser.');
    }, () => {
      // Callback untuk connected
      isConnected = true;
      currentQR = null;
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
