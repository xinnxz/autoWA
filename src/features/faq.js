// ============================================
// src/features/faq.js — FAQ Bot
// ============================================
// Penjelasan:
// FAQ bot menjawab pertanyaan umum dari database faq.json.
//
// Cara pakai:
// - !faq           → Tampilkan daftar semua topik
// - !faq harga     → Tampilkan jawaban tentang harga
// - !faq pengiriman → Tampilkan jawaban tentang pengiriman
//
// Database FAQ bisa ditambah/edit langsung di data/faq.json
// tanpa perlu restart bot (kita re-read file setiap request).
// ============================================

const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../whatsapp');

// Path ke file FAQ database
const FAQ_PATH = path.join(__dirname, '../../data/faq.json');

/**
 * Baca FAQ database dari file
 * @returns {object} Data FAQ
 * 
 * Penjelasan:
 * Kita baca file setiap kali ada request (bukan di-cache).
 * Ini supaya perubahan di faq.json langsung berlaku
 * tanpa restart bot. Trade-off: sedikit lebih lambat,
 * tapi lebih fleksibel.
 */
function loadFaq() {
  const raw = fs.readFileSync(FAQ_PATH, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Handle perintah FAQ
 * 
 * @param {object} msg - Data pesan masuk
 * 
 * Alur:
 * 1. Parse command: "!faq" atau "!faq <topik>"
 * 2. Jika tanpa topik → kirim daftar semua topik yang tersedia
 * 3. Jika dengan topik → cari di database
 * 4. Jika topik ditemukan → kirim jawaban
 * 5. Jika tidak ditemukan → kirim pesan "topik tidak ditemukan"
 */
async function handle(msg) {
  const faqData = loadFaq();
  
  // Parse: ambil topik setelah "!faq"
  // "!faq harga" → args = "harga"
  // "!faq"       → args = ""
  const args = msg.text.replace('!faq', '').trim().toLowerCase();

  if (!args) {
    // ─── Tidak ada topik → tampilkan daftar ───
    const topics = Object.keys(faqData);
    
    let response = '📋 *Daftar FAQ*\n\n';
    topics.forEach((topic, index) => {
      response += `${index + 1}. *${topic}* — ${faqData[topic].question}\n`;
    });
    response += `\nKetik *!faq <topik>* untuk detail.\nContoh: *!faq harga*`;

    await sendMessage(msg.from, response);
  } else {
    // ─── Ada topik → cari jawabannya ───
    if (faqData[args]) {
      await sendMessage(msg.from, faqData[args].answer);
    } else {
      // Topik tidak ditemukan — beri saran
      const available = Object.keys(faqData).join(', ');
      await sendMessage(
        msg.from,
        `❌ Topik *"${args}"* tidak ditemukan.\n\nTopik yang tersedia: ${available}\nKetik *!faq* untuk melihat daftar lengkap.`
      );
    }
  }
}

module.exports = { handle };
