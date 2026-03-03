// ============================================
// src/features/autoReply.js — Keyword Auto Reply
// ============================================
// Penjelasan:
// Auto-reply bekerja dengan mencocokkan KEYWORD di pesan.
// 
// Misal config.json punya:
//   keywords: ["harga", "price", "berapa"]
//   response: "Harga kami..."
//
// Jika customer kirim "berapa harganya?", 
// bot akan mencocokkan kata "harga" → auto reply!
//
// Matching bersifat:
// - Case-insensitive ("Harga" = "harga")
// - Partial match ("berapa harganya" cocok dengan keyword "harga")
// ============================================

const config = require('../../config.json');
const { sendMessage } = require('../whatsapp');

/**
 * Handle auto-reply berdasarkan keyword
 * 
 * @param {object} msg - Data pesan masuk
 * @returns {boolean} true jika ada keyword yang cocok, false jika tidak
 * 
 * Penjelasan alur:
 * 1. Ambil teks pesan, ubah jadi lowercase
 * 2. Loop semua rule auto-reply dari config
 * 3. Untuk setiap rule, cek apakah ada keyword yang cocok
 * 4. Jika cocok → kirim response
 * 5. Return true/false agar handler tahu apakah sudah di-handle
 */
async function handle(msg) {
  const text = msg.text.toLowerCase();

  // Loop semua auto-reply rules dari config
  for (const rule of config.autoReplies) {
    // Cek apakah ada keyword yang cocok
    // Array.some() = return true jika SALAH SATU element cocok
    const matched = rule.keywords.some((keyword) => 
      text.includes(keyword.toLowerCase())
    );

    if (matched) {
      // Kirim respons yang sudah diset di config
      await sendMessage(msg.from, rule.response);
      return true; // Sudah di-handle, stop di sini
    }
  }

  return false; // Tidak ada keyword yang cocok
}

module.exports = { handle };
