// ============================================
// src/features/broadcast.js — Broadcast Messages
// ============================================
// Penjelasan:
// Broadcast = kirim pesan ke banyak kontak sekaligus.
// 
// ⚠️ PENTING (WhatsApp Cloud API):
// - Broadcast hanya bisa pakai MESSAGE TEMPLATE
// - Template harus disetujui Meta terlebih dahulu
// - Untuk sekarang, kita simpan daftar broadcast contacts
//   dan kirim satu per satu dengan delay
//
// Cara pakai (admin only):
//   !broadcast Halo semua, ada promo nih!
//
// Fitur keamanan:
// - Hanya admin yang bisa broadcast
// - Ada delay antar pesan (cegah rate limit)
// - Max recipients per batch (dari config)
// ============================================

const config = require('../../config.js');
const { sendMessage } = require('../whatsapp');
const logger = require('../utils/logger');

// Daftar nomor yang akan menerima broadcast
// Idealnya ini dari database, untuk sekarang pakai array
// Tambahkan nomor ke sini:
const broadcastContacts = [
  // '6281234567890',
  // '6281234567891',
];

/**
 * Utility: delay/sleep (pause execution)
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 * 
 * Penjelasan:
 * Kita perlu delay antar pesan agar:
 * 1. Tidak kena rate limit dari WhatsApp
 * 2. Terlihat lebih natural (bukan spam)
 * 3. Mengurangi beban server
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Handle perintah broadcast
 * 
 * @param {object} msg - Data pesan masuk
 * 
 * Alur:
 * 1. Extract pesan broadcast dari command
 * 2. Cek apakah ada contacts untuk broadcast
 * 3. Loop kirim pesan satu per satu dengan delay
 * 4. Report hasil ke admin
 */
async function handle(msg) {
  // Extract pesan: "!broadcast Halo semua" → "Halo semua"
  const broadcastText = msg.text.replace('!broadcast ', '').trim();

  if (!broadcastText) {
    await sendMessage(
      msg.from,
      '❌ Format: *!broadcast <pesan>*\nContoh: *!broadcast Halo, ada promo nih!*'
    );
    return;
  }

  if (broadcastContacts.length === 0) {
    await sendMessage(
      msg.from,
      '⚠️ Daftar kontak broadcast kosong.\n\n' +
      'Tambahkan nomor di file `src/features/broadcast.js` pada array `broadcastContacts`.'
    );
    return;
  }

  // Batasi jumlah penerima per batch
  const maxRecipients = config.broadcast.maxRecipientsPerBatch;
  const contacts = broadcastContacts.slice(0, maxRecipients);
  const delay = config.broadcast.delayBetweenMessages;

  // Kirim konfirmasi ke admin sebelum mulai
  await sendMessage(
    msg.from,
    `📡 *Memulai Broadcast*\n\n` +
    `📝 Pesan: ${broadcastText}\n` +
    `👥 Penerima: ${contacts.length} kontak\n` +
    `⏱️ Delay: ${delay / 1000} detik/pesan\n\n` +
    `Mohon tunggu...`
  );

  let success = 0;
  let failed = 0;

  // Kirim satu per satu dengan delay
  for (const contact of contacts) {
    try {
      await sendMessage(contact, broadcastText);
      success++;
    } catch (err) {
      failed++;
      logger.error(`Broadcast gagal ke ${contact}`, err);
    }

    // Delay antar pesan (dari config, default 5 detik)
    await sleep(delay);
  }

  // Kirim report ke admin
  await sendMessage(
    msg.from,
    `✅ *Broadcast Selesai!*\n\n` +
    `📊 Hasil:\n` +
    `• Berhasil: ${success} ✅\n` +
    `• Gagal: ${failed} ❌\n` +
    `• Total: ${contacts.length}`
  );

  logger.info(`Broadcast selesai: ${success} berhasil, ${failed} gagal`);
}

module.exports = { handle };
