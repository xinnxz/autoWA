// ============================================
// src/utils/logger.js — Professional Logging System + SSE Broadcast
// Copyright (c) 2026 Luthfi Alfaridz — Founder of ReonTech
// Licensed under GPL-3.0
// ============================================
const pino = require('pino');
const path = require('path');
const fs = require('fs');

// Pastikan folder logs ada
const logDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Konfigurasi stream:
// 1. Tampil cantik di Terminal (menggunakan pino-pretty)
// 2. Tulis JSON ke file log (menggunakan pino.destination bawaan — sync-safe, tanpa dependency tambahan)
const logFilePath = path.join(logDir, 'app.log');

const streams = [
  {
    stream: require('pino-pretty')({
      colorize: true,
      translateTime: 'SYS:HH:MM:ss',
      ignore: 'pid,hostname,event'
    })
  },
  {
    stream: pino.destination({ dest: logFilePath, sync: false, append: true })
  }
];

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
}, pino.multistream(streams));

// ─── SSE broadcast system (Untuk Dashboard) ───
const sseClients = new Set();
const recentLogs = [];
const MAX_RECENT_LOGS = 50; // Dikurangi dari 100 agar UI dashboard tidak mudah ngelag

function broadcast(entry) {
  recentLogs.push(entry);
  if (recentLogs.length > MAX_RECENT_LOGS) recentLogs.shift();
  const data = JSON.stringify(entry);
  for (const res of sseClients) {
    try { res.write(`data: ${data}\n\n`); } catch(e) { sseClients.delete(res); }
  }
}

function addSSEClient(res) { sseClients.add(res); }
function removeSSEClient(res) { sseClients.delete(res); }
function getRecentLogs() { return recentLogs; }

// --- Wrapper functions (agar API kompatibel dengan script lain) ---
function info(message) {
  logger.info({ event: 'info' }, message);
  broadcast({ type: 'info', msg: message, time: Date.now() });
}

function warn(message) {
  logger.warn({ event: 'warn' }, message);
  broadcast({ type: 'warn', msg: message, time: Date.now() });
}

function error(message, err) {
  logger.error({ event: 'error', err: err?.message || err }, message);
  broadcast({ type: 'error', msg: err ? `${message}: ${err.message}` : message, time: Date.now() });
}

function debug(message) {
  logger.debug({ event: 'debug' }, message);
  broadcast({ type: 'debug', msg: message, time: Date.now() });
}

function incoming(from, message) {
  const cleanFrom = from.split('@')[0];
  logger.info({ event: 'incoming_msg', sender: cleanFrom }, message);
  broadcast({ type: 'in', from: cleanFrom, msg: message, time: Date.now() });
}

function outgoing(to, message) {
  const short = message.length > 80 ? message.substring(0, 80) + '...' : message;
  const cleanTo = to.split('@')[0];
  logger.info({ event: 'outgoing_msg', recipient: cleanTo }, short);
  broadcast({ type: 'out', to: cleanTo, msg: short, time: Date.now() });
}

function clearLogs() { recentLogs.length = 0; }

module.exports = { info, warn, error, debug, incoming, outgoing, addSSEClient, removeSSEClient, getRecentLogs, clearLogs, _pino: logger };
