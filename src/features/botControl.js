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
const { getLocale, getStylePresets } = require('../utils/locale');

// ─── State bot (disimpan di memory) ───
const botState = {
  awayMode: config.awayMode.enabled,   // Apakah away mode aktif
  dndUntil: null,                       // Timestamp kapan DND berakhir (null = tidak DND)
  dndTimer: null,                       // Timer reference untuk cancel DND
  awayReason: '',                       // Alasan away (misal: 'tidur', 'meeting', 'kuliah')
};

// ─── Group settings (per-group on/off + custom style) ───
// Key: groupId (120363xxx@g.us)
// Value: { enabled: true/false, style: 'formal' | null }
const groupSettings = {};

// ─── Runtime overrides (bisa diubah lewat WA tanpa restart) ───
const runtimeOverrides = {
  replyStyle: null,  // null = pakai dari config.js
  model: null,       // null = pakai dari config.js
};

// ─── Model aliases (shortcut nama model) ───
const MODEL_ALIASES = {
  'gpt':       'openai/gpt-oss-120b',
  'gpt120':    'openai/gpt-oss-120b',
  'gpt20':     'openai/gpt-oss-20b',
  'llama':     'llama-3.3-70b-versatile',
  'llama70':   'llama-3.3-70b-versatile',
  'llama8':    'llama-3.1-8b-instant',
  'qwen':      'qwen/qwen3-32b',
  'kimi':      'moonshotai/kimi-k2-instruct',
  'maverick':  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'scout':     'meta-llama/llama-4-scout-17b-16e-instruct',
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

  // ─── !help → Tampilkan semua command + config ───
  if (text === '!help') {
    const locale = getLocale();
    const L = locale.cmd;
    const currentStyle = runtimeOverrides.replyStyle || config.ai.replyStyle || 'santai';
    const currentModel = runtimeOverrides.model || config.ai.model || 'default';
    const styleNames = getStylePresets().join(' / ');

    const helpText = `${L.helpHeader}

${L.helpControl}
│ !off — ${locale.meta.code === 'id' ? 'Aktifkan away mode' : 'Turn on away mode'}
│ !on — ${locale.meta.code === 'id' ? 'Matikan away mode' : 'Turn off away mode'}
│ !dnd <waktu> — ${locale.meta.code === 'id' ? 'Away sementara (!dnd 2h, !dnd 30m)' : 'Temporary away (!dnd 2h, !dnd 30m)'}
│ !status — ${locale.meta.code === 'id' ? 'Cek status bot' : 'Check bot status'}
│ !inbox — ${locale.meta.code === 'id' ? 'Lihat chat masuk saat away' : 'View messages while away'}
│ !inbox clear — ${locale.meta.code === 'id' ? 'Hapus inbox' : 'Clear inbox'}
│ !ai <${locale.meta.code === 'id' ? 'tanya' : 'question'}> — ${locale.meta.code === 'id' ? 'Tanya AI langsung' : 'Ask AI directly'}
│ !logout — ${locale.meta.code === 'id' ? 'Logout WhatsApp' : 'Logout WhatsApp'}

${L.helpConfig}
│ !style <${locale.meta.code === 'id' ? 'gaya' : 'style'}> — ${locale.meta.code === 'id' ? 'Ganti gaya bahasa' : 'Change reply style'}
│ !model <model> — ${locale.meta.code === 'id' ? 'Ganti model AI' : 'Change AI model'}
│ !group — ${locale.meta.code === 'id' ? 'Kontrol bot di group' : 'Control bot in groups'}

${L.helpStyle}
│ ${styleNames}
│ ${L.styleCustomHint}

${L.helpModel}
│ gpt — GPT-OSS 120B
│ gpt20 — GPT-OSS 20B
│ llama — Llama 3.3 70B
│ llama8 — Llama 3.1 8B
│ qwen — Qwen3 32B
│ kimi — Kimi K2
│ maverick — Llama 4 Maverick
│ scout — Llama 4 Scout

${L.helpFooter(currentStyle, currentModel)}`;
    await sock.sendMessage(msg.from, { text: helpText });
    return true;
  }

  // ─── !off → Aktifkan away mode ───
  if (text === '!off') {
    botState.awayMode = true;
    const L = getLocale().cmd;
    const style = runtimeOverrides.replyStyle || config.ai.replyStyle || 'santai';
    await sock.sendMessage(msg.from, { 
      text: `${L.awayOn}\n\n${L.awayOnDetail(style, runtimeOverrides.model || config.ai.model || 'default')}` 
    });
    logger.info('Away mode ON');
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
    const L = getLocale().cmd;
    await sock.sendMessage(msg.from, { 
      text: `${L.awayOff}\n\n${L.awayOffDetail}` 
    });
    logger.info('Away mode OFF');
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
      text: `🔇 *DND Mode AKTIF!*\n\n⏱️ Durasi: ${args}\n⏰ Berakhir: ${endTime} WIB` 
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
        `_Ketik !help untuk semua command_`
    });
    return true;
  }

  // ─── !style → Ganti gaya bahasa AI ───
  if (text.startsWith('!style')) {
    const args = text.replace('!style', '').trim();
    const L = getLocale().cmd;
    const presets = getStylePresets();
    
    if (!args) {
      const currentStyle = runtimeOverrides.replyStyle || config.ai.replyStyle || 'santai';
      const styleList = presets.map(s => `│ !style ${s}`).join('\n');
      await sock.sendMessage(msg.from, { 
        text: `${L.styleHeader}\n\n` +
          `${L.styleActive(currentStyle)}\n\n` +
          `${styleList}\n│ !style custom <...>\n│ !style reset`
      });
      return true;
    }

    if (args === 'reset') {
      runtimeOverrides.replyStyle = null;
      await sock.sendMessage(msg.from, { text: L.styleReset(config.ai.replyStyle || 'santai') });
      logger.info('Reply style reset');
      return true;
    }

    if (args.startsWith('custom ')) {
      const customText = args.replace('custom ', '').trim();
      if (!customText) {
        await sock.sendMessage(msg.from, { text: L.styleCustomError });
        return true;
      }
      runtimeOverrides.replyStyle = customText;
      await sock.sendMessage(msg.from, { text: `${L.styleCustomChanged(customText)}\n\n${L.styleLive}` });
      logger.info(`Style custom: ${customText}`);
      return true;
    }

    if (!presets.includes(args)) {
      await sock.sendMessage(msg.from, { 
        text: `${L.styleInvalid(args)}\n\n${L.styleValidation(args)}`
      });
      return true;
    }

    runtimeOverrides.replyStyle = args;
    await sock.sendMessage(msg.from, { text: `${L.styleChanged(args)}\n\n${L.styleLive}` });
    logger.info(`Style: ${args}`);
    return true;
  }

  // ─── !model → Ganti model AI ───
  if (text.startsWith('!model')) {
    const input = text.replace('!model', '').trim();
    const L = getLocale().cmd;
    
    if (!input) {
      const currentModel = runtimeOverrides.model || config.ai.model || 'default';
      await sock.sendMessage(msg.from, { 
        text: `${L.modelHeader}\n\n` +
          `${L.modelActive(currentModel)}\n\n` +
          `│ !model gpt — GPT-OSS 120B\n` +
          `│ !model gpt20 — GPT-OSS 20B\n` +
          `│ !model llama — Llama 3.3 70B\n` +
          `│ !model llama8 — Llama 3.1 8B\n` +
          `│ !model qwen — Qwen3 32B\n` +
          `│ !model kimi — Kimi K2\n` +
          `│ !model maverick — Llama 4 Maverick\n` +
          `│ !model scout — Llama 4 Scout\n` +
          `│ !model reset`
      });
      return true;
    }

    if (input === 'reset') {
      runtimeOverrides.model = null;
      await sock.sendMessage(msg.from, { text: L.modelReset(config.ai.model || 'default') });
      logger.info('AI model reset');
      return true;
    }

    const resolvedModel = MODEL_ALIASES[input] || input;
    runtimeOverrides.model = resolvedModel;
    const alias = MODEL_ALIASES[input] ? input : null;
    await sock.sendMessage(msg.from, { text: `${L.modelChanged(resolvedModel, alias)}\n\n${L.modelLive}` });
    logger.info(`AI model: ${resolvedModel}`);
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

  // ─── !history → Kelola chat history AI ───
  if (text.startsWith('!history')) {
    const args = text.replace('!history', '').trim();

    if (args === 'clear') {
      // Lazy-load untuk hindari circular dependency
      const { clearHistory } = require('./aiReply');
      clearHistory();
      await sock.sendMessage(msg.from, { text: '🗑️ Chat history cleared! AI mulai fresh.' });
      logger.info('Chat history cleared by owner');
      return true;
    }

    await sock.sendMessage(msg.from, {
      text: `🧠 *Chat History*\n\nAI menyimpan riwayat percakapan agar jawaban lebih nyambung.\n\n│ !history clear — Hapus semua riwayat\n\n_History otomatis dihapus setelah ${config.ai.chatHistory?.maxAge || 30} menit._`
    });
    return true;
  }

  // ─── !group → Kontrol bot di group ───
  if (text.startsWith('!group')) {
    const args = text.replace('!group', '').trim();
    const L = getLocale().cmd;
    const groupId = msg.isGroup ? msg.from : null;

    // !group list — lihat semua group aktif (bisa dari private)
    if (args === 'list') {
      const activeGroups = Object.entries(groupSettings).filter(([, v]) => v.enabled);
      if (activeGroups.length === 0) {
        await sock.sendMessage(msg.from, { text: '📋 Tidak ada group yang aktif.' });
        return true;
      }
      let list = '📋 *Group Aktif*\n\n';
      for (const [gid, settings] of activeGroups) {
        const shortId = gid.split('@')[0].slice(-6);
        const styleTag = settings.style ? ` (style: ${settings.style})` : '';
        list += `│ ...${shortId}${styleTag}\n`;
      }
      list += `\n_Total: ${activeGroups.length} group_`;
      await sock.sendMessage(msg.from, { text: list });
      return true;
    }

    // !group reset — matikan semua group (bisa dari private)
    if (args === 'reset') {
      const count = Object.keys(groupSettings).length;
      for (const key of Object.keys(groupSettings)) delete groupSettings[key];
      await sock.sendMessage(msg.from, { text: `✅ ${count} group direset. Bot tidak aktif di group manapun.` });
      logger.info(`Group reset: ${count} groups cleared`);
      return true;
    }

    // Sisa command harus di group
    if (!groupId) {
      await sock.sendMessage(msg.from, { text: '❌ Command ini harus diketik di dalam group.\n\nDari private bisa: *!group list*, *!group reset*' });
      return true;
    }

    // !group on
    if (args === 'on') {
      groupSettings[groupId] = { enabled: true, style: groupSettings[groupId]?.style || null };
      await sock.sendMessage(msg.from, { text: '✅ Bot aktif di group ini!\n\nBot akan reply pesan saat away mode.' });
      logger.info(`Group ON: ${groupId}`);
      return true;
    }

    // !group off
    if (args === 'off') {
      if (groupSettings[groupId]) groupSettings[groupId].enabled = false;
      else groupSettings[groupId] = { enabled: false, style: null };
      await sock.sendMessage(msg.from, { text: '🔇 Bot dimatikan di group ini.' });
      logger.info(`Group OFF: ${groupId}`);
      return true;
    }

    // !group style <style>
    if (args.startsWith('style')) {
      const styleName = args.replace('style', '').trim();
      if (!styleName) {
        const currentStyle = groupSettings[groupId]?.style || 'default (mengikuti config)';
        const presets = getStylePresets();
        await sock.sendMessage(msg.from, {
          text: `🎨 *Group Style*\n\nAktif: *${currentStyle}*\n\nPilihan:\n${presets.map(s => `│ !group style ${s}`).join('\n')}\n│ !group style reset`
        });
        return true;
      }
      if (styleName === 'reset') {
        if (groupSettings[groupId]) groupSettings[groupId].style = null;
        await sock.sendMessage(msg.from, { text: '✅ Group style direset ke default.' });
        return true;
      }
      if (!groupSettings[groupId]) groupSettings[groupId] = { enabled: true, style: null };
      groupSettings[groupId].style = styleName;
      await sock.sendMessage(msg.from, { text: `✅ Group style diubah ke: *${styleName}*` });
      logger.info(`Group style ${groupId}: ${styleName}`);
      return true;
    }

    // !group (tanpa args) — status group ini
    if (!args) {
      if (!groupId) {
        await sock.sendMessage(msg.from, { text: '❌ Ketik di dalam group, atau gunakan *!group list*' });
        return true;
      }
      const gs = groupSettings[groupId];
      const status = gs?.enabled ? '🟢 Aktif' : '🔴 Nonaktif';
      const style = gs?.style || 'default';
      await sock.sendMessage(msg.from, {
        text: `📋 *Group Status*\n\n│ Status: ${status}\n│ Style: ${style}\n\n*Commands:*\n│ !group on — aktifkan\n│ !group off — matikan\n│ !group style <style> — set style\n│ !group list — list semua group\n│ !group reset — matikan semua`
      });
      return true;
    }

    return true;
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

/**
 * Cek apakah group tertentu enabled
 */
function isGroupEnabled(groupId) {
  return groupSettings[groupId]?.enabled === true;
}

/**
 * Get group-specific style (null = pakai default)
 */
function getGroupStyle(groupId) {
  return groupSettings[groupId]?.style || null;
}

module.exports = { handleCommand, isAway, addToInbox, botState, runtimeOverrides, groupSettings, isGroupEnabled, getGroupStyle };
