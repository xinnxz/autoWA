// ============================================
// src/utils/logger.js — Logging Utility + SSE Broadcast
// ============================================

const colors = {
  reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m',
  red: '\x1b[31m', blue: '\x1b[34m', cyan: '\x1b[36m', gray: '\x1b[90m',
};

// ─── SSE broadcast system ───
const sseClients = new Set();
const recentLogs = [];
const MAX_RECENT_LOGS = 100;

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

function getTimestamp() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function info(message) {
  console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.green}✅ INFO${colors.reset}  ${message}`);
  broadcast({ type: 'info', msg: message, time: Date.now() });
}

function warn(message) {
  console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.yellow}⚠️  WARN${colors.reset}  ${message}`);
  broadcast({ type: 'warn', msg: message, time: Date.now() });
}

function error(message, err) {
  console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.red}❌ ERROR${colors.reset} ${message}`);
  if (err) console.log(`${colors.gray}   └─ ${err.message}${colors.reset}`);
  broadcast({ type: 'error', msg: err ? `${message}: ${err.message}` : message, time: Date.now() });
}

function debug(message) {
  console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.blue}🔍 DEBUG${colors.reset} ${message}`);
  broadcast({ type: 'debug', msg: message, time: Date.now() });
}

function incoming(from, message) {
  console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.cyan}📩 IN${colors.reset}    ${from}: ${message}`);
  broadcast({ type: 'in', from, msg: message, time: Date.now() });
}

function outgoing(to, message) {
  const short = message.length > 80 ? message.substring(0, 80) + '...' : message;
  console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.green}📤 OUT${colors.reset}   ${to}: ${short}`);
  broadcast({ type: 'out', to, msg: short, time: Date.now() });
}

function clearLogs() { recentLogs.length = 0; }

module.exports = { info, warn, error, debug, incoming, outgoing, addSSEClient, removeSSEClient, getRecentLogs, clearLogs };

