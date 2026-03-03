// ============================================
// src/whatsapp.js — WhatsApp Cloud API Client
// ============================================
// Penjelasan:
// File ini adalah "penghubung" kita ke WhatsApp.
// Semua komunikasi ke WhatsApp lewat sini.
//
// Cara kerja:
// 1. Kita kirim HTTP request (POST) ke Meta's Graph API
// 2. Meta meneruskan pesan ke WhatsApp user
// 3. Jadi kita TIDAK konek langsung ke WhatsApp,
//    melainkan lewat server Meta (makanya aman!)
//
// Endpoint: https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
// ============================================

const axios = require('axios');
const logger = require('./utils/logger');

// Base URL untuk WhatsApp Cloud API
const API_URL = 'https://graph.facebook.com/v21.0';

/**
 * Kirim pesan teks ke nomor WhatsApp
 * 
 * @param {string} to - Nomor tujuan (format: 628xxxx tanpa +)
 * @param {string} text - Isi pesan yang mau dikirim
 * @returns {Promise<object>} Response dari API
 * 
 * Penjelasan:
 * - Kita pakai axios untuk kirim HTTP POST request
 * - Header berisi token autentikasi (Bearer token)
 * - Body berisi data pesan dalam format JSON
 */
async function sendMessage(to, text) {
  try {
    const response = await axios.post(
      `${API_URL}/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',  // Wajib: identifikasi produk
        to: to,                          // Nomor tujuan
        type: 'text',                    // Tipe pesan: teks
        text: { body: text },            // Isi pesan
      },
      {
        headers: {
          // Authorization: Bearer token dari Meta Dashboard
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Log response detail dari Meta untuk debugging
    logger.outgoing(to, text);
    logger.debug(`API Response: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (err) {
    // Tangkap error dan log dengan detail LENGKAP
    const errorData = err.response?.data;
    logger.error(`Gagal kirim pesan ke ${to}: ${JSON.stringify(errorData || err.message)}`);
    throw err;
  }
}

/**
 * Kirim pesan template (untuk broadcast/marketing)
 * 
 * @param {string} to - Nomor tujuan
 * @param {string} templateName - Nama template yang sudah disetujui di Meta
 * @param {string} [languageCode='id'] - Kode bahasa template
 * @returns {Promise<object>} Response dari API
 * 
 * Penjelasan:
 * Template adalah pesan yang HARUS disetujui Meta dulu sebelum bisa dikirim.
 * Ini wajib untuk pesan yang dikirim DULUAN oleh bisnis (bukan balasan).
 * Template bisa dibuat di Meta Business Dashboard.
 */
async function sendTemplate(to, templateName, languageCode = 'id') {
  try {
    const response = await axios.post(
      `${API_URL}/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.outgoing(to, `[Template: ${templateName}]`);
    return response.data;
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    logger.error(`Gagal kirim template ke ${to}: ${errorMsg}`);
    throw err;
  }
}

/**
 * Tandai pesan sebagai sudah dibaca (✓✓ biru)
 * 
 * @param {string} messageId - ID pesan yang mau di-mark read
 * @returns {Promise<object>} Response dari API
 * 
 * Penjelasan:
 * Ketika customer kirim pesan, kita bisa tandai "read"
 * supaya customer lihat centang biru (sudah dibaca).
 * Ini memberi kesan profesional.
 */
async function markAsRead(messageId) {
  try {
    await axios.post(
      `${API_URL}/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        status: 'read',              // Tandai sebagai "read"
        message_id: messageId,       // ID pesan yang dibaca
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    // Jika gagal mark-read, tidak perlu crash — cukup log saja
    logger.debug(`Gagal mark-read messageId: ${messageId}`);
  }
}

module.exports = { sendMessage, sendTemplate, markAsRead };
