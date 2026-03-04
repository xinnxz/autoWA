// ============================================
// src/handler.js — Personal Auto-Reply Handler v2
// ============================================
// Penjelasan:
// Versi upgrade dari handler sebelumnya.
// Sekarang support:
// 1. Owner commands (!on, !off, !dnd, !status, !inbox)
// 2. AI contextual reply (Gemini jawab seolah kamu)
// 3. Away mode with random messages
// 4. Keyword auto-reply
// 5. Inbox logging (catat semua pesan saat away)
//
// Alur pesan masuk:
//   Pesan masuk
//     → Cek: dari owner? → handle command
//     → Cek: group/status? → abaikan
//     → Cek: cooldown? → skip jika masih cooldown
//     → Cek: away mode aktif?
//       → Ya: log ke inbox + kirim auto-reply (AI atau random)
//       → Tidak: diam (kamu lagi aktif)
// ============================================

const config = require('../config.js');
const logger = require('./utils/logger');
const { trackContact } = require('./utils/contacts');
const { handleCommand, isAway, addToInbox, isGroupEnabled, getGroupStyle } = require('./features/botControl');
const aiReply = require('./features/aiReply');

// ─── Cooldown tracker ───
const contactTracker = new Map();

// ─── Auto-cleanup: bersihkan tracker ───
const trackerCleanupMs = (config.cleanup?.trackerCleanupInterval || 30) * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  const cooldownMs = (config.safety.cooldownPerContact || 300) * 1000;
  let cleaned = 0;
  for (const [id, data] of contactTracker) {
    if (now - data.lastReply > cooldownMs) {
      contactTracker.delete(id);
      cleaned++;
    }
  }
  if (cleaned > 0) logger.debug(`Cleanup: ${cleaned} kontak dihapus dari tracker`);
}, trackerCleanupMs);

function sleep(ms) {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cek apakah sekarang dalam jadwal tidur
 */
function isScheduledAway() {
  const schedule = config.awayMode.schedule;
  if (!schedule.enabled) return false;

  const tz = config.timezone || schedule.timezone || 'Asia/Jakarta';
  const now = new Date();
  const localTime = new Date(now.toLocaleString('en-US', { timeZone: tz }));

  const currentTime = localTime.getHours() * 60 + localTime.getMinutes();

  const [startH, startM] = schedule.sleepStart.split(':').map(Number);
  const [endH, endM] = schedule.sleepEnd.split(':').map(Number);
  const sleepStart = startH * 60 + startM;
  const sleepEnd = endH * 60 + endM;

  if (sleepStart > sleepEnd) {
    return currentTime >= sleepStart || currentTime < sleepEnd;
  }
  return currentTime >= sleepStart && currentTime < sleepEnd;
}

/**
 * Cek cooldown per kontak
 */
function canReply(contactId) {
  const safety = config.safety;
  const tracker = contactTracker.get(contactId);

  if (!tracker) {
    contactTracker.set(contactId, { count: 1, lastReply: Date.now() });
    return true;
  }

  const elapsed = (Date.now() - tracker.lastReply) / 1000;
  if (elapsed > safety.cooldownPerContact) {
    contactTracker.set(contactId, { count: 1, lastReply: Date.now() });
    return true;
  }

  if (tracker.count >= safety.maxRepliesPerContact) {
    return false;
  }

  tracker.count++;
  tracker.lastReply = Date.now();
  return true;
}

/**
 * Handler utama
 */
async function handleMessage(sock, msg) {
  const safety = config.safety;

  // ─── IGNORE: Status broadcast ───
  if (msg.from === 'status@broadcast') return;

  // ─── GROUP HANDLING ───
  // Group messages: check if group is enabled, otherwise ignore
  if (msg.isGroup) {
    // Owner commands di group tetap diproses
    const ownerNumber = process.env.OWNER_NUMBER || '';
    const senderNumber = (msg.participant || msg.from).split('@')[0].split(':')[0];
    const isOwner = senderNumber === ownerNumber || msg.raw?.key?.fromMe;
    
    if (isOwner && msg.text.startsWith('!')) {
      const handled = await handleCommand(sock, msg);
      if (handled) return;
      // Fallback: !ai command (not in handleCommand)
      if (msg.text.startsWith(config.ai.prefix)) {
        await aiReply.handle(sock, msg);
        return;
      }
    }

    // Cek apakah group ini di-enable
    if (!isGroupEnabled(msg.from)) return;

    // Jangan reply ke pesan sendiri di group
    if (msg.raw?.key?.fromMe) return;

    // Cek away
    const botIsAway = isAway() || isScheduledAway();
    if (!botIsAway) return;

    // Log & cooldown (pakai group ID)
    addToInbox(msg.from, msg.name || 'Unknown', msg.text);
    if (!canReply(msg.from)) return;

    await sleep(safety.replyDelay);

    // AI reply di group (pakai group-specific style jika ada)
    if (config.features.aiReply && config.ai.contextualMode) {
      const groupStyle = getGroupStyle(msg.from);
      await aiReply.handleContextual(sock, msg, { groupStyle, mention: msg.participant });
      return;
    }

    // Fallback: random message + mention
    const messages = config.awayMode.messages;
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    await sendReply(sock, msg, randomMsg, msg.participant);
    return;
  }

  // ─── PRIVATE CHAT HANDLING ───
  const ownerNumber = process.env.OWNER_NUMBER || '';
  const senderNumber = msg.from.split('@')[0].split(':')[0];
  const isOwner = senderNumber === ownerNumber || msg.raw?.key?.fromMe;
  if (isOwner) {
    if (msg.text.startsWith('!')) {
      try {
        const handled = await handleCommand(sock, msg);
        if (handled) return;
      } catch (cmdErr) {
        logger.error('[CMD] Command error:', cmdErr);
      }
      if (msg.text.startsWith(config.ai.prefix)) {
        await aiReply.handle(sock, msg);
        return;
      }
    }
    return;
  }

  logger.incoming(msg.from.split('@')[0], msg.text);
  trackContact(msg.from, msg.name, msg.text);

  // ─── CEK: Apakah bot sedang away? ───
  const botIsAway = isAway() || isScheduledAway();

  if (!botIsAway) {
    // Bot tidak away → kamu sedang aktif → diam aja
    return;
  }

  // ─── Bot sedang AWAY → proses auto-reply ───

  // Log pesan ke inbox (untuk rangkuman nanti)
  addToInbox(msg.from, msg.name, msg.text);

  // Cek cooldown
  if (!canReply(msg.from)) {
    logger.debug(`Cooldown aktif untuk ${msg.from.split('@')[0]}`);
    return;
  }

  // Delay sebelum reply
  await sleep(safety.replyDelay);

  // ─── 1. Keyword auto-reply (prioritas pertama) ───
  if (config.features.autoReply) {
    const textLower = msg.text.toLowerCase();
    for (const rule of config.autoReplies) {
      const matched = rule.keywords.some(kw => textLower.includes(kw.toLowerCase()));
      if (matched) {
        await sendReply(sock, msg, rule.response);
        return;
      }
    }
  }

  // ─── 2. AI Contextual Reply (jika diaktifkan) ───
  if (config.features.aiReply && config.ai.contextualMode) {
    await aiReply.handleContextual(sock, msg);
    return;
  }

  // ─── 3. Random away message (fallback) ───
  const messages = config.awayMode.messages;
  const randomMsg = messages[Math.floor(Math.random() * messages.length)];
  await sendReply(sock, msg, randomMsg);
}

/**
 * Kirim reply (support mention di group)
 */
async function sendReply(sock, msg, text, mentionJid) {
  try {
    const opts = { text };
    if (mentionJid) {
      // Di group: mention sender biar jelas bales siapa
      opts.mentions = [mentionJid];
    }
    await sock.sendMessage(msg.from, opts);
    logger.outgoing(msg.from.split('@')[0], text);
  } catch (err) {
    logger.error(`Gagal reply ke ${msg.from}`, err);
  }
}

module.exports = { handleMessage };
