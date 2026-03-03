// ============================================
// src/connection.js — Baileys WhatsApp Connection
// ============================================
// Penjelasan:
// File ini menghubungkan bot ke WhatsApp pribadi kamu.
//
// Cara kerja Baileys:
// 1. Pertama kali → muncul QR code di terminal
// 2. Scan QR code pakai WA di HP (Settings → Linked Devices)
// 3. Setelah connect, session disimpan di folder 'auth_info'
// 4. Restart berikutnya TIDAK perlu scan QR lagi (auto-reconnect)
//
// Bedanya dengan Cloud API:
// - Cloud API = lewat server Meta (HTTP request)
// - Baileys = langsung konek ke WA lewat WebSocket
//   (seperti WA Web, tapi dikendalikan kode kita)
// ============================================

const { default: makeWASocket, 
        useMultiFileAuthState, 
        DisconnectReason,
        fetchLatestBaileysVersion,
        makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const logger = require('./utils/logger');

// Folder untuk simpan session auth (agar tidak scan QR terus)
const AUTH_FOLDER = './auth_info';

/**
 * Buat koneksi WhatsApp menggunakan Baileys
 * 
 * @param {Function} onMessage - Callback saat ada pesan masuk
 * @returns {Promise<object>} Socket WhatsApp yang sudah terkoneksi
 * 
 * Penjelasan step-by-step:
 * 1. useMultiFileAuthState() → load/buat session credentials
 * 2. makeWASocket() → buat koneksi WebSocket ke WA
 * 3. Event 'connection.update' → handle QR code & status koneksi
 * 4. Event 'creds.update' → simpan session baru ke file
 * 5. Event 'messages.upsert' → terima pesan masuk
 */
async function connectToWhatsApp(onMessage) {
  // ─── 1. Load session credentials ───
  // Jika sudah pernah scan QR, credentials akan di-load dari file
  // Jika belum, akan generate credentials baru
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

  // ─── 2. Ambil versi Baileys terbaru ───
  const { version } = await fetchLatestBaileysVersion();
  logger.info(`Menggunakan Baileys v${version.join('.')}`);

  // ─── 3. Buat koneksi WebSocket ───
  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      // Cache signal keys untuk performa lebih baik
      keys: makeCacheableSignalKeyStore(state.keys, 
        pino({ level: 'silent' })
      ),
    },
    // Logger Baileys di-set silent (biar terminal kita bersih)
    logger: pino({ level: 'silent' }),
    // Jangan print QR di console Baileys (kita handle sendiri)
    printQRInTerminal: false,
    // Penanda browser (agar WA tahu ini bot, bukan browser)
    browser: ['AutoWA Bot', 'Chrome', '1.0.0'],
    // Tandai pesan sebagai "not from me" 
    generateHighQualityLinkPreview: false,
  });

  // ─── 4. Handle connection updates ───
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Jika ada QR code → tampilkan di terminal
    if (qr) {
      console.log('');
      console.log('📱 Scan QR code ini dengan WhatsApp kamu:');
      console.log('   (Settings → Linked Devices → Link a Device)');
      console.log('');
      qrcode.generate(qr, { small: true });
    }

    // Jika terkoneksi
    if (connection === 'open') {
      logger.info('✅ Terhubung ke WhatsApp!');
      logger.info(`📱 Logged in as: ${sock.user?.name || sock.user?.id}`);
    }

    // Jika terputus
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const reason = DisconnectReason;

      // Cek alasan disconnect
      if (statusCode === reason.loggedOut) {
        // User logout dari HP → hapus session, harus scan QR ulang
        logger.error('Logged out dari WhatsApp! Hapus folder auth_info dan scan ulang.');
      } else {
        // Koneksi putus karena alasan lain → auto reconnect
        logger.warn(`Koneksi terputus (code: ${statusCode}). Reconnecting...`);
        // Reconnect setelah 3 detik
        setTimeout(() => connectToWhatsApp(onMessage), 3000);
      }
    }
  });

  // ─── 5. Simpan credentials saat ada update ───
  sock.ev.on('creds.update', saveCreds);

  // ─── 6. Handle pesan masuk ───
  sock.ev.on('messages.upsert', async (m) => {
    // m.type bisa 'notify' (pesan baru) atau 'append' (history)
    if (m.type !== 'notify') return;

    for (const msg of m.messages) {
      // Abaikan jika tidak ada pesan (status update, reactions, dll)
      if (!msg.message) continue;

      // Extract text dulu (perlu untuk cek command)
      const text = msg.message?.conversation ||
                   msg.message?.extendedTextMessage?.text ||
                   msg.message?.imageMessage?.caption ||
                   msg.message?.videoMessage?.caption ||
                   '';

      // PENTING: Abaikan pesan dari diri sendiri...
      // KECUALI jika itu command (dimulai dengan !)
      // Ini mencegah infinite loop tapi tetap allow owner kirim !status, !on, dll
      if (msg.key.fromMe && !text.startsWith('!')) continue;

      // Extract data pesan yang bersih
      const messageData = {
        from: msg.key.remoteJid,
        name: msg.pushName || 'Unknown',
        messageId: msg.key.id,
        isGroup: msg.key.remoteJid?.endsWith('@g.us'),
        // Pakai text yang sudah di-extract di atas
        text,
        timestamp: msg.messageTimestamp,
        raw: msg,
      };

      // Forward ke handler jika ada callback
      if (onMessage && messageData.text) {
        try {
          await onMessage(sock, messageData);
        } catch (err) {
          logger.error('Error di message handler', err);
        }
      }
    }
  });

  return sock;
}

module.exports = { connectToWhatsApp };
