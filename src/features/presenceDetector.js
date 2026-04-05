// ============================================
// src/features/presenceDetector.js — Smart Presence Detection
// ============================================
// Penjelasan:
// Module ini otomatis deteksi apakah owner sedang aktif di WhatsApp.
// 
// Cara kerjanya:
// 1. Listen ke 3 sinyal dari Baileys:
//    - presence.update  → owner online/typing
//    - messages.update  → owner baca pesan (read receipt)
//    - fromMe messages  → owner kirim pesan sendiri
//
// 2. Setiap sinyal → reset inactivity timer
//
// 3. Kalau 5 menit ga ada sinyal → set away mode ON
//    Kalau ada sinyal lagi → set away mode OFF
//
// 4. Manual override (!on/!off) selalu menang vs smart presence
// ============================================

const config = require('../../config.js');
const logger = require('../utils/logger');
const store = require('../utils/store');

// ─── State presence (internal) ───
const presenceState = {
  lastActive: null,          // Timestamp terakhir owner aktif
  isOwnerActive: false,      // Apakah owner sedang aktif sekarang
  inactivityTimer: null,     // Reference ke setTimeout (ga di-persist)
};

// ─── Reference ke botState (di-set saat registerEvents) ───
let _botState = null;

/**
 * Cek apakah Smart Presence enabled di config
 * @returns {boolean}
 */
function isEnabled() {
  return config.smartPresence?.enabled === true;
}

/**
 * Get timeout dalam milliseconds
 * @returns {number}
 */
function getTimeoutMs() {
  const minutes = config.smartPresence?.inactivityTimeout || 5;
  return minutes * 60 * 1000;
}

/**
 * Sinyal bahwa owner sedang aktif
 * 
 * Dipanggil dari:
 * - presence.update event (owner online/typing)
 * - messages.update event (owner baca pesan)
 * - handler.js (owner kirim pesan sendiri / fromMe)
 * 
 * Setiap dipanggil:
 * 1. Update lastActive timestamp
 * 2. Kalau bot sedang away + bukan manual override → matikan away
 * 3. Reset inactivity timer
 */
function signalOwnerActive(source) {
  if (!isEnabled()) return;
  if (!_botState) return;

  const now = Date.now();
  presenceState.lastActive = now;

  // Kalau sebelumnya inactive → switch ke active
  if (!presenceState.isOwnerActive) {
    presenceState.isOwnerActive = true;
    logger.info(`[SmartPresence] Owner active (${source}) → away mode OFF`);

    // Hanya ubah awayMode kalau bukan manual override
    // manualOverride = true artinya owner sengaja kirim !on
    if (!_botState.manualOverride && _botState.awayMode) {
      _botState.awayMode = false;
      store.save();
    }
  } else {
    // Sudah active, cukup debug log
    logger.debug(`[SmartPresence] Activity signal: ${source}`);
  }

  // Reset inactivity timer
  resetInactivityTimer();
}

/**
 * Reset inactivity timer
 * 
 * Setelah X menit tanpa signalOwnerActive():
 * → Set owner sebagai inactive
 * → Aktifkan away mode (kalau bukan manual override)
 */
function resetInactivityTimer() {
  // Clear timer lama
  if (presenceState.inactivityTimer) {
    clearTimeout(presenceState.inactivityTimer);
    presenceState.inactivityTimer = null;
  }

  // Set timer baru
  const timeoutMs = getTimeoutMs();
  presenceState.inactivityTimer = setTimeout(() => {
    // Timer expired = owner ga aktif selama X menit
    presenceState.isOwnerActive = false;

    if (!_botState) return;

    // Hanya aktifkan away kalau bukan manual override
    if (!_botState.manualOverride) {
      _botState.awayMode = true;
      const minutes = config.smartPresence?.inactivityTimeout || 5;
      logger.info(`[SmartPresence] Owner inactive ${minutes}m → away mode ON`);
      store.save();
    } else {
      logger.debug('[SmartPresence] Owner inactive, tapi manual override aktif → skip');
    }
  }, timeoutMs);
}

/**
 * Daftarkan event listeners ke Baileys socket
 * 
 * Dipanggil sekali dari connection.js setelah WhatsApp connected.
 * Men-register 2 event listener:
 * 1. presence.update → deteksi owner online/typing
 * 2. messages.update → deteksi owner baca pesan (read receipt)
 * 
 * Sinyal ke-3 (fromMe messages) ditangani di connection.js langsung
 * karena ada di event messages.upsert yang sudah ada.
 * 
 * @param {object} sock - Baileys socket
 */
function registerEvents(sock) {
  if (!isEnabled()) {
    logger.info('[SmartPresence] Disabled in config — skipping event registration');
    return;
  }

  // Get botState reference
  const { botState } = require('./botControl');
  _botState = botState;

  const ownerJid = sock.user?.id;
  if (!ownerJid) {
    logger.warn('[SmartPresence] Cannot determine owner JID — skipping');
    return;
  }

  // Normalize owner JID (remove :XX device suffix)
  // "6281234567890:12@s.whatsapp.net" → "6281234567890"
  const ownerNumber = ownerJid.split('@')[0].split(':')[0];

  const timeoutMinutes = config.smartPresence?.inactivityTimeout || 5;
  logger.info(`[SmartPresence] Active — timeout=${timeoutMinutes}m, owner=${ownerNumber}`);

  // ─── Signal 1: Presence Update ───
  // Deteksi kalau owner online atau sedang mengetik
  if (config.smartPresence?.signals?.presenceUpdates !== false) {
    sock.ev.on('presence.update', ({ id, presences }) => {
      if (!presences) return;

      for (const [jid, presence] of Object.entries(presences)) {
        // Cek apakah JID ini milik owner
        const jidNumber = jid.split('@')[0].split(':')[0];
        if (jidNumber !== ownerNumber) continue;

        const status = presence.lastKnownPresence;
        if (status === 'available' || status === 'composing' || status === 'recording') {
          signalOwnerActive(`presence:${status}`);
        }
      }
    });

    // Subscribe ke presence sendiri (agar dapat update)
    // Ini mungkin ga reliable untuk own JID, tapi ga ada salahnya
    try {
      sock.presenceSubscribe(ownerJid);
      logger.debug('[SmartPresence] Subscribed to own presence');
    } catch (err) {
      logger.debug(`[SmartPresence] presenceSubscribe skipped: ${err.message}`);
    }
  }

  // ─── Signal 2: Read Receipts (messages.update) ───
  // Deteksi kalau owner membaca pesan dari HP/Desktop
  // Status 3 = message read, status 4 = media played
  if (config.smartPresence?.signals?.readReceipts !== false) {
    sock.ev.on('messages.update', (updates) => {
      if (!updates || !Array.isArray(updates)) return;

      for (const update of updates) {
        // Kita tertarik pada pesan yang DIKIRIM ke owner (fromMe = false di sisi pengirim)
        // dan sekarang statusnya berubah ke 'read' (3) atau 'played' (4)
        //
        // Tapi dari perspektif bot: messages.update ter-trigger untuk pesan masuk
        // yang dibaca oleh owner di device lain (HP/Desktop WA).
        //
        // Kalau owner baca pesan → status berubah ke 3/4
        const status = update.update?.status;
        if (status === 3 || status === 4) {
          signalOwnerActive('read-receipt');
        }
      }
    });
  }

  // ─── Signal 3: FromMe Messages ───
  // Ditangani di messages.upsert sebagai tambahan
  // Owner kirim pesan dari HP = bukti kuat sedang aktif
  if (config.smartPresence?.signals?.outgoingMessages !== false) {
    sock.ev.on('messages.upsert', (m) => {
      if (m.type !== 'notify') return;

      for (const msg of m.messages) {
        // Hanya proses pesan dari owner sendiri (fromMe)
        if (msg.key.fromMe) {
          // Abaikan command bot (dimulai dengan !)
          const text = msg.message?.conversation ||
                       msg.message?.extendedTextMessage?.text || '';
          if (text.startsWith('!')) continue;

          signalOwnerActive('outgoing-message');
        }
      }
    });
  }

  // Start timer awal — anggap owner inactive sampai ada sinyal pertama
  // Tapi kalau botState.awayMode sudah false (owner baru aja !on), 
  // kita kasih grace period
  if (!_botState.awayMode) {
    // Owner terakhir !on → anggap aktif, mulai timer
    presenceState.isOwnerActive = true;
    presenceState.lastActive = Date.now();
    resetInactivityTimer();
  }
}

/**
 * Get presenceState untuk dashboard / !status command
 * @returns {object}
 */
function getPresenceState() {
  return {
    enabled: isEnabled(),
    isOwnerActive: presenceState.isOwnerActive,
    lastActive: presenceState.lastActive,
    timeout: config.smartPresence?.inactivityTimeout || 5,
  };
}

/**
 * Reset manual override dan biarkan smart presence ambil alih
 * Dipanggil saat owner kirim !auto on
 */
function resetOverride() {
  if (!_botState) return;
  _botState.manualOverride = false;

  // Kalau ada lastActive baru-baru ini, cek apakah masih dalam timeout
  if (presenceState.lastActive) {
    const elapsed = Date.now() - presenceState.lastActive;
    const timeoutMs = getTimeoutMs();

    if (elapsed < timeoutMs) {
      // Masih dalam window aktif → set active
      presenceState.isOwnerActive = true;
      _botState.awayMode = false;
      resetInactivityTimer();
    } else {
      // Sudah expired → set away
      presenceState.isOwnerActive = false;
      _botState.awayMode = true;
    }
  }
  store.save();
}

module.exports = { 
  signalOwnerActive, 
  registerEvents, 
  getPresenceState, 
  resetOverride, 
  isEnabled,
  presenceState,
};

// ─── Register state for persistence ───
store.register('presenceState', presenceState);
