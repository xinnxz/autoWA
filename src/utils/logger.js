// ============================================
// src/utils/logger.js — Logging Utility
// ============================================
// Penjelasan:
// File ini berisi fungsi-fungsi logging sederhana.
// Kita pakai warna di terminal agar mudah dibaca:
//   - Hijau  = info (sukses/normal)
//   - Kuning = warning (peringatan)
//   - Merah  = error (kesalahan)
//   - Biru   = debug (debugging)
// ============================================

// ANSI color codes untuk terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Format timestamp untuk log
 * @returns {string} Waktu sekarang dalam format [HH:MM:SS]
 */
function getTimestamp() {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Log info — untuk pesan normal/sukses
 * @param {string} message - Pesan yang ingin di-log
 */
function info(message) {
  console.log(
    `${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.green}✅ INFO${colors.reset}  ${message}`
  );
}

/**
 * Log warning — untuk peringatan
 * @param {string} message - Pesan peringatan
 */
function warn(message) {
  console.log(
    `${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.yellow}⚠️  WARN${colors.reset}  ${message}`
  );
}

/**
 * Log error — untuk kesalahan
 * @param {string} message - Pesan error
 * @param {Error} [err] - Objek error (opsional)
 */
function error(message, err) {
  console.log(
    `${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.red}❌ ERROR${colors.reset} ${message}`
  );
  if (err) {
    console.log(`${colors.gray}   └─ ${err.message}${colors.reset}`);
  }
}

/**
 * Log debug — untuk debugging (hanya muncul jika perlu)
 * @param {string} message - Pesan debug
 */
function debug(message) {
  console.log(
    `${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.blue}🔍 DEBUG${colors.reset} ${message}`
  );
}

/**
 * Log pesan masuk dari WhatsApp
 * @param {string} from - Nomor pengirim
 * @param {string} message - Isi pesan
 */
function incoming(from, message) {
  console.log(
    `${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.cyan}📩 IN${colors.reset}    ${from}: ${message}`
  );
}

/**
 * Log pesan keluar ke WhatsApp
 * @param {string} to - Nomor tujuan
 * @param {string} message - Isi pesan
 */
function outgoing(to, message) {
  // Potong pesan jika terlalu panjang (biar log rapi)
  const short = message.length > 80 ? message.substring(0, 80) + '...' : message;
  console.log(
    `${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.green}📤 OUT${colors.reset}   ${to}: ${short}`
  );
}

module.exports = { info, warn, error, debug, incoming, outgoing };
