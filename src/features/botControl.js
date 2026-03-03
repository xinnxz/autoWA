// ============================================
// src/features/botControl.js — Bot Control via Chat
// ============================================
// Penjelasan:
// Kamu bisa kontrol bot langsung dari chat WA!
// Kirim command dari HP kamu sendiri → bot langsung bereaksi.
//
// Commands:
//   !on        → Matikan away mode (bot diam)
//   !off       → Aktifkan away mode (bot balas otomatis)
//   !dnd 2h    → Away mode selama 2 jam
//   !dnd 30m   → Away mode selama 30 menit
//   !status    → Lihat status bot sekarang
//   !inbox     → Lihat rangkuman chat masuk saat away
//   !inbox clear → Hapus inbox
//
// PENTING: Command hanya bisa dijalankan oleh OWNER (kamu sendiri)
// ============================================

const config = require('../../config.js');
const logger = require('../utils/logger');

// ─── State bot (disimpan di memory) ───
const botState = {
  awayMode: config.awayMode.enabled,   // Apakah away mode aktif
  dndUntil: null,                       // Timestamp kapan DND berakhir (null = tidak DND)
  dndTimer: null,                       // Timer reference untuk cancel DND
  awayReason: '',                       // Alasan away (misal: 'tidur', 'meeting', 'kuliah')
};

// ─── Runtime overrides (bisa diubah lewat WA tanpa restart) ───
const runtimeOverrides = {
  replyStyle: null,  // null = pakai dari config.js
  model: null,       // null = pakai dari config.js
};

// ─── Inbox: simpan pesan masuk saat away ───
// Format: [{ from: '628xxx', name: 'John', text: 'Halo', time: Date }]
const inbox = [];
const MAX_INBOX = config.cleanup?.maxInbox || 100;

// ─── Auto-cleanup inbox ───
const inboxMaxAge = (config.cleanup?.inboxMaxAge || 24) * 60 * 60 * 1000;
const inboxCleanupMs = (config.cleanup?.inboxCleanupInterval || 60) * 60 * 1000;
setInterval(() => {
  const cutoff = Date.now() - inboxMaxAge;
  let removed = 0;
  while (inbox.length > 0 && new Date(inbox[0].time).getTime() < cutoff) {
    inbox.shift();
    removed++;
  }
  if (removed > 0) logger.debug(`Inbox cleanup: ${removed} pesan lama dihapus`);
}, inboxCleanupMs);

/**
 * Cek apakah bot sedang dalam mode away (termasuk DND)
 * @returns {boolean}
 */
function isAway() {
  // Cek DND dulu
  if (botState.dndUntil) {
    if (Date.now() < botState.dndUntil) {
      return true; // Masih dalam DND
    } else {
      // DND sudah expired → matikan
      botState.dndUntil = null;
      botState.dndTimer = null;
      logger.info('⏰ DND berakhir! Away mode kembali ke setting awal.');
    }
  }
  return botState.awayMode;
}

/**
 * Tambah pesan ke inbox (untuk rangkuman nanti)
 */
function addToInbox(from, name, text) {
  inbox.push({
    from: from.split('@')[0],
    name,
    text: text.length > 100 ? text.substring(0, 100) + '...' : text,
    time: new Date(),
  });
  // Batasi inbox agar ga makan memory
  if (inbox.length > MAX_INBOX) inbox.shift();
}

/**
 * Handle command dari owner
 * 
 * @param {object} sock - Baileys socket
 * @param {object} msg - Data pesan
 * @returns {boolean} true jika command di-handle, false jika bukan command
 */
async function handleCommand(sock, msg) {
  const text = msg.text.trim();

  const ownerName = process.env.OWNER_NAME || 'Bot';

  // ─── !help → Tampilkan semua command ───
  if (text === '!help') {
    const helpText = `*📖 Bot Commands*

│ *!help* — Tampilkan daftar command ini
│ *!off* — Aktifkan away mode
│ *!on* — Matikan away mode
│ *!dnd <waktu>* — Away sementara (misal: !dnd 2h)
│ *!status* — Cek status bot lengkap
│ *!style <gaya>* — Ganti gaya bahasa AI
│ *!model <nama>* — Ganti model AI
│ *!inbox* — Lihat chat masuk saat away
│ *!inbox clear* — Hapus semua inbox
│ *!ai <pertanyaan>* — Tanya AI langsung
│ *!logout* — Logout WhatsApp

_Commands hanya untuk owner._`;
    await sock.sendMessage(msg.from, { text: helpText });
    return true;
  }

  // ─── !off → Aktifkan away mode ───
  if (text === '!off') {
    botState.awayMode = true;
    await sock.sendMessage(msg.from, { 
      text: `🔴 *Away mode AKTIF!*\n\nBot akan auto-reply semua chat masuk.\nAI: ${config.ai.model || 'default'}\nStyle: ${config.ai.replyStyle || 'santai'}` 
    });
    logger.info('Away mode diaktifkan oleh owner');
    return true;
  }

  // ─── !on → Matikan away mode ───
  if (text === '!on') {
    botState.awayMode = false;
    botState.dndUntil = null; // Cancel DND juga
    if (botState.dndTimer) {
      clearTimeout(botState.dndTimer);
      botState.dndTimer = null;
    }
    await sock.sendMessage(msg.from, { 
      text: '🟢 *Away mode MATI!*\n\nBot tidak akan reply siapapun. Kamu online sekarang.' 
    });
    logger.info('Away mode dimatikan oleh owner');
    return true;
  }

  // ─── !dnd <durasi> → DND mode sementara ───
  if (text.startsWith('!dnd')) {
    const args = text.replace('!dnd', '').trim();
    
    if (!args) {
      await sock.sendMessage(msg.from, { 
        text: '❌ Format: *!dnd <durasi>*\n\nContoh:\n• !dnd 30m → 30 menit\n• !dnd 2h → 2 jam\n• !dnd 1h30m → 1.5 jam' 
      });
      return true;
    }

    // Parse durasi (30m, 2h, 1h30m)
    const duration = parseDuration(args);
    if (!duration) {
      await sock.sendMessage(msg.from, { 
        text: '❌ Format durasi salah!\n\nContoh: *30m*, *2h*, *1h30m*' 
      });
      return true;
    }

    // Set DND
    botState.awayMode = true;
    botState.dndUntil = Date.now() + duration;
    
    // Timer untuk auto-off DND
    if (botState.dndTimer) clearTimeout(botState.dndTimer);
    botState.dndTimer = setTimeout(() => {
      botState.dndUntil = null;
      botState.dndTimer = null;
      botState.awayMode = config.awayMode.enabled; // Kembali ke default
      logger.info('⏰ DND berakhir!');
    }, duration);

    const endTime = new Date(Date.now() + duration).toLocaleTimeString('id-ID', { 
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' 
    });

    await sock.sendMessage(msg.from, { 
      text: `🔇 *DND Mode AKTIF!*\n\n⏱️ Durasi: ${args}\n⏰ Berakhir: ${endTime} WIB\n\nBot akan auto-reply sampai waktu habis.` 
    });
    logger.info(`DND aktif selama ${args} (sampai ${endTime})`);
    return true;
  }

  // ─── !status → Lihat status bot ───
  if (text === '!status') {
    const awayStatus = isAway() ? '🔴 AWAY (aktif reply)' : '🟢 ONLINE (diam)';
    let dndInfo = '';
    if (botState.dndUntil) {
      const remaining = Math.ceil((botState.dndUntil - Date.now()) / 60000);
      dndInfo = `\n│ DND: ${remaining} menit tersisa`;
    }

    const memMB = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const schedule = config.awayMode.schedule;
    const scheduleStr = schedule.enabled 
      ? `${schedule.sleepStart} - ${schedule.sleepEnd} ${schedule.timezone}` 
      : 'Nonaktif';

    await sock.sendMessage(msg.from, { 
      text: `📊 *Status AutoWA Bot*\n\n` +
        `│ Status: ${awayStatus}${dndInfo}\n` +
        `│ Owner: ${ownerName}\n` +
        `│ Inbox: ${inbox.length} pesan\n` +
        `│ Memory: ${memMB} MB\n` +
        `│ Uptime: ${formatUptime(process.uptime())}\n` +
        `│ Schedule: ${scheduleStr}\n\n` +
        `_Ketik !style, !model, atau !help_`
    });
    return true;
  }

  // ─── !style <gaya> → Ganti gaya bahasa AI (tanpa restart) ───
  if (text.startsWith('!style')) {
    const newStyle = text.replace('!style', '').trim();
    
    if (!newStyle) {
      const currentStyle = runtimeOverrides.replyStyle || config.ai.replyStyle || 'santai';
      const source = runtimeOverrides.replyStyle ? 'live override' : 'config.js';
      await sock.sendMessage(msg.from, { 
        text: `🎨 *Reply Style*\n\n` +
          `│ Aktif: *${currentStyle}* (${source})\n\n` +
          `*Preset:*\n` +
          `│ !style gaul — lo-gue, slang, emoji\n` +
          `│ !style santai — gw-kamu, casual\n` +
          `│ !style formal — saya-anda, sopan\n` +
          `│ !style campur — mix tergantung konteks\n\n` +
          `*Custom:*\n` +
          `│ !style bahasa sunda\n` +
          `│ !style english casual\n` +
          `│ !style bahasa jawa krama\n\n` +
          `*Reset:*\n` +
          `│ !style reset — kembalikan ke config.js`
      });
      return true;
    }

    if (newStyle === 'reset') {
      runtimeOverrides.replyStyle = null;
      const defaultStyle = config.ai.replyStyle || 'santai';
      await sock.sendMessage(msg.from, { 
        text: `✅ Style dikembalikan ke config: *${defaultStyle}*` 
      });
      logger.info(`Reply style reset ke config: ${defaultStyle}`);
      return true;
    }

    runtimeOverrides.replyStyle = newStyle;
    await sock.sendMessage(msg.from, { 
      text: `✅ Reply style diubah ke: *${newStyle}*\n\n_Berlaku langsung tanpa restart. Ketik !style reset untuk kembalikan ke config._` 
    });
    logger.info(`Reply style diubah ke: ${newStyle} (via WA)`);
    return true;
  }

  // ─── !model <nama> → Ganti model AI Groq (tanpa restart) ───
  if (text.startsWith('!model')) {
    const newModel = text.replace('!model', '').trim();
    
    if (!newModel) {
      const currentModel = runtimeOverrides.model || config.ai.model || 'default';
      const source = runtimeOverrides.model ? 'live override' : 'config.js';
      await sock.sendMessage(msg.from, { 
        text: `🤖 *AI Model*\n\n` +
          `│ Aktif: *${currentModel}* (${source})\n\n` +
          `*Contoh:*\n` +
          `│ !model openai/gpt-oss-120b\n` +
          `│ !model llama-3.3-70b-versatile\n` +
          `│ !model qwen/qwen3-32b\n\n` +
          `*Reset:*\n` +
          `│ !model reset — kembalikan ke config.js`
      });
      return true;
    }

    if (newModel === 'reset') {
      runtimeOverrides.model = null;
      const defaultModel = config.ai.model || 'default';
      await sock.sendMessage(msg.from, { 
        text: `✅ Model dikembalikan ke config: *${defaultModel}*` 
      });
      logger.info(`AI model reset ke config: ${defaultModel}`);
      return true;
    }

    runtimeOverrides.model = newModel;
    await sock.sendMessage(msg.from, { 
      text: `✅ AI model diubah ke: *${newModel}*\n\n_Berlaku langsung tanpa restart. Ketik !model reset untuk kembalikan ke config._` 
    });
    logger.info(`AI model diubah ke: ${newModel} (via WA)`);
    return true;
  }

  // ─── !inbox → Lihat rangkuman pesan masuk ───
  if (text.startsWith('!inbox')) {
    if (text.includes('clear')) {
      inbox.length = 0;
      await sock.sendMessage(msg.from, { text: '🗑️ Inbox cleared!' });
      return true;
    }

    if (inbox.length === 0) {
      await sock.sendMessage(msg.from, { text: '📭 Inbox kosong! Belum ada chat masuk saat away.' });
      return true;
    }

    // Format inbox summary
    let summary = `📬 *Inbox Summary (${inbox.length} pesan)*\n\n`;
    
    // Group by contact
    const grouped = {};
    for (const item of inbox) {
      if (!grouped[item.from]) {
        grouped[item.from] = { name: item.name, messages: [] };
      }
      grouped[item.from].messages.push(item);
    }

    for (const [num, data] of Object.entries(grouped)) {
      summary += `👤 *${data.name}* (${num}) — ${data.messages.length} pesan\n`;
      // Tampilkan max 3 pesan terakhir per kontak
      const recent = data.messages.slice(-3);
      for (const m of recent) {
        const time = m.time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        summary += `   ${time} — ${m.text}\n`;
      }
      summary += '\n';
    }

    summary += `_Ketik *!inbox clear* untuk hapus_`;
    await sock.sendMessage(msg.from, { text: summary });
    return true;
  }

  // --- !logout --- Logout dari WhatsApp ---
  if (text.startsWith('!logout')) {
    if (!text.includes('confirm')) {
      await sock.sendMessage(msg.from, {
        text: '*Yakin mau logout?*\n\nBot akan disconnect dan perlu scan QR lagi.\n\nKetik *!logout confirm* untuk konfirmasi.'
      });
      return true;
    }

    await sock.sendMessage(msg.from, { text: 'Logging out... bye!' });
    logger.info('Owner meminta logout');

    // Hapus session
    const fs = require('fs');
    const path = require('path');
    const authDir = process.env.AUTH_DIR || './auth_info';
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
      logger.info('Session auth dihapus');
    }

    await sock.logout();
    process.exit(0);
  }

  return false; // Bukan command
}

/**
 * Parse durasi string ke milliseconds
 * Contoh: "30m" → 1800000, "2h" → 7200000, "1h30m" → 5400000
 */
function parseDuration(str) {
  let total = 0;
  const hours = str.match(/(\d+)h/);
  const minutes = str.match(/(\d+)m/);
  
  if (hours) total += parseInt(hours[1]) * 60 * 60 * 1000;
  if (minutes) total += parseInt(minutes[1]) * 60 * 1000;
  
  return total > 0 ? total : null;
}

/**
 * Format uptime ke string readable
 */
function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

module.exports = { handleCommand, isAway, addToInbox, botState, runtimeOverrides };
