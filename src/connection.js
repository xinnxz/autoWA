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

// Folder untuk simpan session auth (lokal)
const AUTH_FOLDER = process.env.AUTH_DIR || './auth_info';

/**
 * Buat koneksi WhatsApp menggunakan Baileys
 * 
 * Auth storage:
 * - Jika MONGODB_URI ada → simpan auth ke MongoDB Atlas (untuk cloud/Koyeb)
 * - Jika tidak → simpan auth ke folder lokal (untuk development)
 */
async function connectToWhatsApp(onMessage, onQR, onConnected) {
  let state, saveCreds;

  if (process.env.MONGODB_URI) {
    // Cloud mode: simpan auth ke MongoDB Atlas
    const { useMongoDBAuthState } = require('./utils/mongoAuth');
    const result = await useMongoDBAuthState(process.env.MONGODB_URI);
    state = result.state;
    saveCreds = result.saveCreds;
    logger.info('[Auth] Mode: MongoDB Atlas (cloud-persistent)');
  } else {
    // Local mode: simpan auth ke folder
    const result = await useMultiFileAuthState(AUTH_FOLDER);
    state = result.state;
    saveCreds = result.saveCreds;
    logger.info('[Auth] Mode: Local filesystem (auth_info/)');
  }

  const { version } = await fetchLatestBaileysVersion();
  logger.info(`Menggunakan Baileys v${version.join('.')}`);

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, 
        pino({ level: 'silent' })
      ),
    },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['AutoWA Bot', 'Chrome', '1.0.0'],
    generateHighQualityLinkPreview: false,
  });

  // Suppress Baileys internal session noise (prekey bundles, signal protocol, etc.)
  const _origLog = console.log;
  const _origWarn = console.warn;
  const noisePatterns = ['session', 'prekey', 'Signal', 'sender key', 'Closing open', 'retry', 'pendingPreKey', 'baseKey', 'previousCounter', 'signedKeyId'];
  console.log = (...args) => {
    const str = args.map(a => typeof a === 'string' ? a : '').join(' ');
    if (noisePatterns.some(p => str.includes(p))) return;
    _origLog.apply(console, args);
  };
  console.warn = (...args) => {
    const str = args.map(a => typeof a === 'string' ? a : '').join(' ');
    if (noisePatterns.some(p => str.includes(p))) return;
    _origWarn.apply(console, args);
  };

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Clear previous QR timer if any
      if (sock._qrTimer) { clearInterval(sock._qrTimer); sock._qrTimer = null; }

      console.log('');
      console.log('Scan QR code ini dengan WhatsApp kamu:');
      console.log('   (Settings > Linked Devices > Link a Device)');
      console.log('');
      qrcode.generate(qr, { small: true });

      // Countdown timer
      let sec = 60;
      process.stdout.write(`\n   QR expires in: ${sec}s\r`);
      sock._qrTimer = setInterval(() => {
        sec--;
        if (sec <= 0) {
          clearInterval(sock._qrTimer);
          sock._qrTimer = null;
          process.stdout.write(`   QR expired. Waiting for new QR...       \n`);
          return;
        }
        const bar = '█'.repeat(Math.ceil(sec / 2)) + '░'.repeat(30 - Math.ceil(sec / 2));
        process.stdout.write(`   QR expires in: ${String(sec).padStart(2)} s  [${bar}]\r`);
      }, 1000);

      // Kirim QR ke web page juga
      if (onQR) onQR(qr);
    }

    if (connection === 'open') {
      if (sock._qrTimer) { clearInterval(sock._qrTimer); sock._qrTimer = null; }
      const name = sock.user?.name || sock.user?.id || 'Unknown';
      if (onConnected) onConnected(name);
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const reason = DisconnectReason;

      if (statusCode === reason.loggedOut) {
        logger.error('Logged out dari WhatsApp! Hapus folder auth_info dan scan ulang.');
      } else {
        logger.warn(`Koneksi terputus (code: ${statusCode}). Reconnecting...`);
        setTimeout(() => connectToWhatsApp(onMessage, onQR, onConnected), 3000);
      }
    }
  });

  // ─── 5. Simpan credentials saat ada update (silent) ───
  sock.ev.on('creds.update', async () => {
    const origLog = console.log;
    console.log = () => {};  // suppress Baileys session dump
    try { await saveCreds(); } finally { console.log = origLog; }
  });

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
      if (msg.key.fromMe && !text.startsWith('!')) continue;

      // Abaikan pesan dari Channel/Newsletter/Saluran (bukan group/private)
      const jid = msg.key.remoteJid || '';
      if (jid.endsWith('@newsletter') || jid.endsWith('@lid')) continue;

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
