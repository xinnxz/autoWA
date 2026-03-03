// ============================================
// src/features/welcome.js — Welcome Message
// ============================================
// Penjelasan:
// Kirim pesan sambutan ke chat yang "baru".
// 
// Definisi "baru":
// - Kita track semua nomor yang sudah pernah chat
// - Jika nomor belum pernah ada → kirim welcome
// - Jika sudah pernah → abaikan (tidak spam welcome terus)
//
// Data "sudah pernah chat" disimpan di memory (Set).
// Jika bot restart, data ini reset (semua dianggap baru lagi).
// Untuk production, bisa diganti dengan database/file.
// ============================================

const config = require('../../config.js');
const { sendMessage } = require('../whatsapp');
const logger = require('../utils/logger');

// Set untuk menyimpan nomor yang sudah pernah chat
// Set = seperti array tapi isinya unik (tidak ada duplikat)
const knownContacts = new Set();

/**
 * Handle welcome message
 * 
 * @param {object} msg - Data pesan masuk
 * 
 * Penjelasan:
 * 1. Cek apakah nomor ini sudah ada di knownContacts
 * 2. Jika belum → kirim welcome message dari config
 * 3. Tambahkan nomor ke knownContacts supaya tidak welcome lagi
 * 4. Jika sudah ada → kirim default fallback message
 */
async function handle(msg) {
  if (!knownContacts.has(msg.from)) {
    // Kontak baru! Kirim welcome message
    knownContacts.add(msg.from);
    logger.info(`Kontak baru: ${msg.name} (${msg.from})`);
    
    await sendMessage(msg.from, config.welcomeMessage);
  } else {
    // Kontak lama yang pesannya tidak cocok command/keyword apapun
    // Kirim panduan singkat
    await sendMessage(
      msg.from,
      `Maaf, saya tidak mengerti pesan Anda 😅\n\nKetik *!help* untuk melihat daftar perintah yang tersedia.`
    );
  }
}

module.exports = { handle };
