// ============================================
// index.js — Entry Point (Baileys Version)
// ============================================
// Penjelasan:
// Ini entry point utama bot.
// Jauh lebih simpel dari versi Cloud API karena:
// - Tidak perlu Express server
// - Tidak perlu webhook
// - Baileys handle koneksi langsung
//
// Alur:
// 1. Load .env
// 2. Connect ke WhatsApp (scan QR)
// 3. Register message handler
// 4. Done! Bot jalan!
// ============================================

require('dotenv').config();

const { connectToWhatsApp } = require('./src/connection');
const { handleMessage } = require('./src/handler');
const config = require('./config.json');
const logger = require('./src/utils/logger');

// ─── Tampilkan banner ───
console.log('');
console.log('╔══════════════════════════════════════════╗');
console.log('║                                          ║');
console.log('║   🤖 AutoWA Bot v2.0.0                   ║');
console.log('║   Personal Auto-Reply (Baileys)           ║');
console.log('║                                          ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');

// ─── Tampilkan tips anti-ban ───
console.log('🛡️  TIPS ANTI-BAN:');
console.log('   1. Jangan reply terlalu cepat (delay aktif)');
console.log('   2. Group chat diabaikan (mengurangi aktivitas)');
console.log('   3. Max reply per kontak dibatasi');
console.log('   4. Jangan broadcast ke banyak nomor sekaligus');
console.log('   5. Gunakan bot ini secara wajar, bukan untuk spam');
console.log('');

// ─── Tampilkan konfigurasi ───
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
    logger.info('Menghubungkan ke WhatsApp...');
    const sock = await connectToWhatsApp(handleMessage);
    
    logger.info('Bot siap! Menunggu pesan masuk...');
    
    // AI API key check (Groq + Gemini)
    const hasGroq = process.env.GROQ_API_KEY_1 || process.env.GROQ_API_KEY;
    const hasGemini = process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY;
    if (hasGroq) logger.info('Groq API configured ✅');
    if (hasGemini) logger.info('Gemini API configured ✅');
    if (!hasGroq && !hasGemini) {
      logger.warn('Tidak ada API key AI (Groq/Gemini). Fitur !ai tidak akan berfungsi.');
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
