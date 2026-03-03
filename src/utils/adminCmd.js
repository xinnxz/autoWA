// ============================================
// src/utils/adminCmd.js — Admin Commands
// ============================================
// Penjelasan:
// Command-command utilitas yang bisa dijalankan via chat.
// 
// !help   → Tampilkan daftar semua perintah
// !status → Tampilkan status bot (uptime, memory, dll)
//
// Semua orang bisa pakai !help dan !status.
// Command admin-only (!broadcast, !orders) dicek di handler.js
// ============================================

const config = require('../../config.js');
const { sendMessage } = require('../whatsapp');

// Simpan waktu bot mulai (untuk hitung uptime)
const startTime = Date.now();

/**
 * Format durasi dari milliseconds ke string yang readable
 * @param {number} ms - Durasi dalam milliseconds
 * @returns {string} Format: "Xh Ym Zs"
 * 
 * Penjelasan:
 * Misal ms = 3661000 (1 jam 1 menit 1 detik)
 * → 3661000 / 1000 = 3661 detik
 * → Math.floor(3661 / 3600) = 1 jam
 * → Math.floor((3661 % 3600) / 60) = 1 menit  
 * → 3661 % 60 = 1 detik
 * → "1h 1m 1s"
 */
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

/**
 * Handle !help — tampilkan daftar perintah
 * @param {object} msg - Data pesan masuk
 */
async function handleHelp(msg) {
  const isAdmin = config.adminNumbers.includes(msg.from);

  let helpText = 
    `📖 *Daftar Perintah ${config.botName}*\n\n` +
    `🤖 *!ai <pertanyaan>*\n` +
    `   Tanya apa saja ke AI\n` +
    `   Contoh: !ai Apa itu blockchain?\n\n` +
    `📋 *!faq*\n` +
    `   Lihat pertanyaan yang sering ditanya\n\n` +
    `📋 *!faq <topik>*\n` +
    `   Jawaban FAQ spesifik\n` +
    `   Contoh: !faq harga\n\n` +
    `🛒 *!order <produk> <jumlah>*\n` +
    `   Pesan produk\n` +
    `   Contoh: !order Kaos_XL 2\n\n` +
    `❓ *!help*\n` +
    `   Tampilkan bantuan ini\n\n` +
    `📊 *!status*\n` +
    `   Lihat status bot`;

  // Tampilkan command admin jika pengirim adalah admin
  if (isAdmin) {
    helpText += 
      `\n\n` +
      `─────────────────\n` +
      `👑 *Admin Commands*\n\n` +
      `📡 *!broadcast <pesan>*\n` +
      `   Kirim pesan massal\n\n` +
      `📋 *!orders*\n` +
      `   Lihat semua pesanan\n\n` +
      `🗑️ *!orders clear*\n` +
      `   Hapus semua pesanan`;
  }

  await sendMessage(msg.from, helpText);
}

/**
 * Handle !status — tampilkan status bot
 * @param {object} msg - Data pesan masuk
 * 
 * Penjelasan:
 * Menampilkan informasi teknis bot:
 * - Uptime: berapa lama bot sudah running
 * - Memory: penggunaan RAM (process.memoryUsage().heapUsed)
 * - Node.js version
 * - Fitur yang aktif
 */
async function handleStatus(msg) {
  const uptime = formatUptime(Date.now() - startTime);
  const memoryMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

  // Hitung fitur yang aktif
  const activeFeatures = Object.entries(config.features)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);

  const statusText = 
    `📊 *Status ${config.botName}*\n\n` +
    `⏱️ Uptime: *${uptime}*\n` +
    `💾 Memory: *${memoryMB} MB*\n` +
    `🟢 Node.js: *${process.version}*\n` +
    `📡 API: *WhatsApp Cloud API v21.0*\n\n` +
    `🔧 *Fitur Aktif (${activeFeatures.length}/${Object.keys(config.features).length}):*\n` +
    activeFeatures.map((f) => `   ✅ ${f}`).join('\n') +
    `\n\n` +
    `🕐 Server time: ${new Date().toLocaleString('id-ID')}`;

  await sendMessage(msg.from, statusText);
}

module.exports = { handleHelp, handleStatus };
