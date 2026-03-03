// ============================================
// src/webhook.js — Webhook Server (Express)
// ============================================
// Penjelasan:
// Webhook = "pintu masuk" pesan dari WhatsApp ke bot kita.
//
// Cara kerja:
// 1. Customer kirim pesan ke nomor WA kita
// 2. WhatsApp (Meta) kirim notifikasi ke URL webhook kita
// 3. Server Express kita terima notifikasi itu (POST /webhook)
// 4. Kita extract data pesan (siapa pengirim, isi pesan, dll)
// 5. Forward ke handler.js untuk diproses
//
// Ada 2 endpoint:
// - GET /webhook  → Untuk verifikasi awal (Meta cek URL kita valid)
// - POST /webhook → Untuk terima pesan masuk
// ============================================

const express = require('express');
const logger = require('./utils/logger');

// Buat Express Router (nanti di-mount di index.js)
const router = express.Router();

/**
 * GET /webhook — Verification Endpoint
 * 
 * Penjelasan:
 * Saat kita daftarkan webhook URL di Meta Dashboard,
 * Meta akan kirim GET request untuk verifikasi:
 *   - hub.mode = "subscribe"
 *   - hub.verify_token = token yang kita set
 *   - hub.challenge = kode challenge dari Meta
 * 
 * Jika token cocok, kita balas dengan challenge code.
 * Ini membuktikan bahwa server ini benar milik kita.
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Cek apakah ini memang request verifikasi dari Meta
  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    logger.info('✅ Webhook verified successfully!');
    // Balas dengan challenge code → Meta terima dan verifikasi selesai
    res.status(200).send(challenge);
  } else {
    logger.warn('❌ Webhook verification failed — token mismatch');
    res.status(403).send('Forbidden');
  }
});

/**
 * POST /webhook — Receive Messages
 * 
 * Penjelasan:
 * Setiap kali ada pesan masuk ke nomor WhatsApp kita,
 * Meta kirim POST request ke endpoint ini.
 * 
 * Payload dari Meta cukup complex (nested JSON).
 * Kita perlu extract data penting:
 *   - from: nomor pengirim
 *   - text: isi pesan
 *   - messageId: ID pesan (untuk mark-read)
 *   - timestamp: waktu pesan
 * 
 * Setelah extract, forward ke messageHandler (inject dari index.js)
 */

// Variable untuk simpan handler function (di-set dari luar)
let messageHandler = null;

/**
 * Set message handler function
 * @param {Function} handler - Fungsi yang akan dipanggil saat ada pesan masuk
 */
function setMessageHandler(handler) {
  messageHandler = handler;
}

router.post('/webhook', (req, res) => {
  // PENTING: Selalu balas 200 OK dulu ke Meta
  // Jika tidak, Meta akan retry kirim notifikasi berulang kali
  res.status(200).send('OK');

  try {
    const body = req.body;

    // Cek apakah ini event WhatsApp (bisa juga event lain)
    if (body.object !== 'whatsapp_business_account') return;

    // Navigasi ke dalam nested object untuk ambil data pesan
    // Struktur: body.entry[].changes[].value.messages[]
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Cek apakah ada pesan (bisa juga status update, bukan pesan)
    if (!value?.messages) return;

    // Loop semua pesan (biasanya cuma 1)
    for (const message of value.messages) {
      // Extract info kontak pengirim
      const contact = value.contacts?.[0];
      
      // Buat objek data yang bersih untuk handler
      const messageData = {
        from: message.from,                          // Nomor pengirim (628xxx)
        name: contact?.profile?.name || 'Unknown',   // Nama pengirim
        messageId: message.id,                        // ID pesan (untuk mark-read)
        timestamp: message.timestamp,                 // Unix timestamp
        type: message.type,                           // Tipe: text, image, dll
        // Extract text berdasarkan tipe pesan
        text: message.text?.body ||                   // Pesan teks biasa
              message.interactive?.button_reply?.title || // Balasan tombol
              message.interactive?.list_reply?.title ||   // Balasan list
              '',                                         // Default kosong
      };

      logger.incoming(messageData.from, messageData.text || `[${messageData.type}]`);

      // Forward ke handler jika sudah di-set
      if (messageHandler) {
        // Jalankan async tapi jangan await (biar response ke Meta tetap cepat)
        messageHandler(messageData).catch((err) => {
          logger.error('Error di message handler', err);
        });
      }
    }
  } catch (err) {
    logger.error('Error parsing webhook payload', err);
  }
});

module.exports = { router, setMessageHandler };
