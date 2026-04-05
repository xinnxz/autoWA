// ============================================
// src/connection.js — Baileys WhatsApp Connection
// ============================================
// How it works:
// This file connects the bot to your personal WhatsApp.
//
// Baileys flow:
// 1. First run → QR code appears in terminal
// 2. Scan QR code with WA on phone (Settings → Linked Devices)
// 3. After connecting, session is saved to 'auth_info' folder
// 4. Next restart does NOT require QR scan (auto-reconnect)
//
// Difference with Cloud API:
// - Cloud API = through Meta's servers (HTTP request)
// - Baileys = direct WebSocket connection to WA
//   (like WA Web, but controlled by our code)
// ============================================

const { default: makeWASocket, 
        useMultiFileAuthState, 
        DisconnectReason,
        fetchLatestBaileysVersion,
        makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const logger = require('./utils/logger');

// Folder for storing auth session (local)
const AUTH_FOLDER = process.env.AUTH_DIR || './auth_info';

/**
 * Create WhatsApp connection using Baileys
 * 
 * Auth storage:
 * - If MONGODB_URI exists → store auth in MongoDB Atlas (for cloud/Koyeb)
 * - Otherwise → store auth in local folder (for development)
 */
async function connectToWhatsApp(onMessage, onQR, onConnected) {
  // File-based auth — session stored in auth_info/ folder
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  logger.info(`[Auth] Using local filesystem (${AUTH_FOLDER})`);

  const { version } = await fetchLatestBaileysVersion();
  logger.info(`Using Baileys v${version.join('.')}`);

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

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Clear previous QR timer if any
      if (sock._qrTimer) { clearInterval(sock._qrTimer); sock._qrTimer = null; }

      console.log('');
      console.log('Scan this QR code with your WhatsApp:');
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

      // Send QR to web page too
      if (onQR) onQR(qr);
    }

    if (connection === 'open') {
      if (sock._qrTimer) { clearInterval(sock._qrTimer); sock._qrTimer = null; }
      const name = sock.user?.name || sock.user?.id || 'Unknown';
      if (onConnected) onConnected(name);

      // ─── Smart Presence: setup activity detection ───
      // 1. Set bot presence ke 'unavailable' agar push notif HP owner tetap muncul
      //    (default Baileys = 'available', yang bisa suppress notif)
      // 2. Register event listeners untuk deteksi aktivitas owner
      try {
        await sock.sendPresenceUpdate('unavailable');
        const { registerEvents } = require('./features/presenceDetector');
        registerEvents(sock);
      } catch (err) {
        logger.warn(`[SmartPresence] Setup error: ${err.message}`);
      }
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

  // ─── 6. Handle incoming messages ───
  sock.ev.on('messages.upsert', async (m) => {
    // m.type can be 'notify' (new message) or 'append' (history)
    logger.info(`[DEBUG] messages.upsert: type=${m.type} count=${m.messages?.length}`);
    if (m.type !== 'notify') return;

    for (const msg of m.messages) {
      // Skip if no messages (status updates, reactions, etc.)
      if (!msg.message) {
        logger.info(`[DEBUG] Skipped: no msg.message, keys=${JSON.stringify(Object.keys(msg))}`);
        continue;
      }

      // Extract text (needed for command check)
      const text = msg.message?.conversation ||
                   msg.message?.extendedTextMessage?.text ||
                   msg.message?.imageMessage?.caption ||
                   msg.message?.videoMessage?.caption ||
                   '';

      logger.info(`[DEBUG] Message: from=${msg.key.remoteJid} fromMe=${msg.key.fromMe} text="${text.substring(0,50)}" msgType=${Object.keys(msg.message).join(',')}`);

      // IMPORTANT: Skip messages from self...
      // EXCEPT if it's a command (starts with !)
      if (msg.key.fromMe && !text.startsWith('!')) continue;

      // Skip messages from Channel/Newsletter only
      const jid = msg.key.remoteJid || '';
      if (jid.endsWith('@newsletter')) continue;

      // Extract clean message data
      const messageData = {
        from: msg.key.remoteJid,
        name: msg.pushName || 'Unknown',
        messageId: msg.key.id,
        isGroup: msg.key.remoteJid?.endsWith('@g.us'),
        text,
        timestamp: msg.messageTimestamp,
        raw: msg,
      };

      // Forward to handler if callback exists
      // Allow if there is text OR if it's a media message (image/video)
      if (onMessage && (messageData.text || msg.message?.imageMessage || msg.message?.videoMessage)) {
        try {
          await onMessage(sock, messageData);
        } catch (err) {
          logger.error('Error in message handler', err);
        }
      } else {
        logger.info(`[DEBUG] Skipped handler: onMessage=${!!onMessage} text="${text}"`);
      }
    }
  });

  return sock;
}

module.exports = { connectToWhatsApp };
