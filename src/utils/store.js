// ============================================
// src/utils/store.js — State Persistence Engine
// ============================================
// Saves and loads bot state to/from data/state.json
// so data survives restarts.
//
// Architecture:
// - Debounced auto-save: writes at most once per 5 seconds
// - Atomic write: writes to .tmp then renames (prevents corruption)
// - Graceful shutdown: saves on SIGINT/SIGTERM
// - Schema version: for future migration support
//
// Data stored:
// - inbox (messages received while away)
// - groupSettings (per-group on/off + style)
// - contacts (contact tracker map)
// - chatHistory (AI conversation memory per contact)
// - runtimeOverrides (style, model)
// - aiMetrics (call count, latency)

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const SCHEMA_VERSION = 1;
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const TEMP_FILE = path.join(DATA_DIR, 'state.tmp');
const SAVE_DEBOUNCE_MS = 5000; // Save at most once per 5 seconds

// ─── In-memory reference to all tracked state ───
let _state = {
  inbox: null,
  groupSettings: null,
  contacts: null,       // Map reference
  chatHistory: null,    // Map reference
  runtimeOverrides: null,
  aiMetrics: null,
  configOverrides: null, // Config changes from dashboard
};

let _saveTimer = null;
let _saveCount = 0;
let _loaded = false;

// ─── Ensure data directory exists ───
function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    logger.info(`[Store] Created data directory: ${DATA_DIR}`);
  }
}

// ─── Serialize state to JSON-safe object ───
function serialize() {
  const data = { _schema: SCHEMA_VERSION, _savedAt: new Date().toISOString() };

  // Inbox: array of messages
  if (_state.inbox) {
    data.inbox = Array.from(_state.inbox);
  }

  // Group settings: plain object
  if (_state.groupSettings) {
    data.groupSettings = Object.assign({}, _state.groupSettings);
  }

  // Contacts: Map → array of [key, value]
  if (_state.contacts) {
    data.contacts = Array.from(_state.contacts.entries());
  }

  // Chat history: Map → array of [key, value]
  if (_state.chatHistory) {
    data.chatHistory = Array.from(_state.chatHistory.entries());
  }

  // Runtime overrides: plain object
  if (_state.runtimeOverrides) {
    data.runtimeOverrides = Object.assign({}, _state.runtimeOverrides);
  }

  // AI metrics: plain object
  if (_state.aiMetrics) {
    data.aiMetrics = {
      totalCalls: _state.aiMetrics.totalCalls || 0,
      latencyHistory: _state.aiMetrics.latencyHistory || [],
      providerUsage: _state.aiMetrics.providerUsage || {},
      avgLatency: _state.aiMetrics.avgLatency || 0,
    };
  }

  // Config overrides from dashboard
  if (_state.configOverrides) {
    data.configOverrides = Object.assign({}, _state.configOverrides);
  }

  return data;
}

// ─── Save state to disk (atomic write) ───
function saveNow() {
  try {
    ensureDir();
    const json = JSON.stringify(serialize(), null, 2);
    // Atomic write: write to temp → rename to final
    fs.writeFileSync(TEMP_FILE, json, 'utf8');
    fs.renameSync(TEMP_FILE, STATE_FILE);
    _saveCount++;
    logger.debug(`[Store] State saved (#${_saveCount})`);
  } catch (err) {
    logger.warn(`[Store] Save failed: ${err.message}`);
  }
}

// ─── Debounced save (coalesces rapid changes) ───
function save() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    saveNow();
  }, SAVE_DEBOUNCE_MS);
}

// ─── Load state from disk ───
function load() {
  if (_loaded) return;
  _loaded = true;

  try {
    if (!fs.existsSync(STATE_FILE)) {
      logger.info('[Store] No saved state found — starting fresh');
      return;
    }

    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const data = JSON.parse(raw);

    if (!data._schema) {
      logger.warn('[Store] Invalid state file (no schema) — ignoring');
      return;
    }

    // Restore inbox
    if (data.inbox && _state.inbox) {
      data.inbox.forEach(item => _state.inbox.push(item));
      logger.info(`[Store] Restored ${data.inbox.length} inbox messages`);
    }

    // Restore group settings
    if (data.groupSettings && _state.groupSettings) {
      Object.assign(_state.groupSettings, data.groupSettings);
      const count = Object.keys(data.groupSettings).length;
      logger.info(`[Store] Restored ${count} group settings`);
    }

    // Restore contacts
    if (data.contacts && _state.contacts) {
      for (const [key, val] of data.contacts) {
        _state.contacts.set(key, val);
      }
      logger.info(`[Store] Restored ${data.contacts.length} contacts`);
    }

    // Restore chat history
    if (data.chatHistory && _state.chatHistory) {
      const maxAge = 30 * 60 * 1000; // 30 minutes
      const now = Date.now();
      let count = 0;
      for (const [key, messages] of data.chatHistory) {
        // Only restore non-expired conversations
        const fresh = messages.filter(m => (now - (m.time || 0)) < maxAge);
        if (fresh.length > 0) {
          _state.chatHistory.set(key, fresh);
          count++;
        }
      }
      logger.info(`[Store] Restored ${count} chat histories`);
    }

    // Restore runtime overrides
    if (data.runtimeOverrides && _state.runtimeOverrides) {
      if (data.runtimeOverrides.replyStyle) _state.runtimeOverrides.replyStyle = data.runtimeOverrides.replyStyle;
      if (data.runtimeOverrides.model) _state.runtimeOverrides.model = data.runtimeOverrides.model;
      logger.info(`[Store] Restored runtime overrides`);
    }

    // Restore AI metrics
    if (data.aiMetrics && _state.aiMetrics) {
      _state.aiMetrics.totalCalls = data.aiMetrics.totalCalls || 0;
      _state.aiMetrics.latencyHistory = data.aiMetrics.latencyHistory || [];
      _state.aiMetrics.providerUsage = data.aiMetrics.providerUsage || {};
      _state.aiMetrics.avgLatency = data.aiMetrics.avgLatency || 0;
      logger.info(`[Store] Restored AI metrics (${_state.aiMetrics.totalCalls} total calls)`);
    }

    // Restore config overrides (reapply to config object)
    if (data.configOverrides) {
      const c = data.configOverrides;
      const config = require('../../config.js');
      const applied = [];

      if (c.ownerName) { process.env.OWNER_NAME = c.ownerName; applied.push('name'); }
      if (c.timezone) { config.timezone = c.timezone; applied.push('tz'); }
      if (c.replyDelay) { config.safety.replyDelay = c.replyDelay; applied.push('delay'); }
      if (c.maxTokens) { config.ai.maxTokens = c.maxTokens; applied.push('tokens'); }
      if (c.maxReplies) { config.safety.maxRepliesPerContact = c.maxReplies; applied.push('maxReplies'); }
      if (c.cooldown) { config.safety.cooldownPerContact = c.cooldown; applied.push('cooldown'); }
      if (c.contextual !== undefined) { config.ai.contextualMode = c.contextual; applied.push('ctx'); }
      if (c.historyEnabled !== undefined && config.ai.chatHistory) { config.ai.chatHistory.enabled = c.historyEnabled; applied.push('history'); }
      if (c.ignoreGroups !== undefined) { config.safety.ignoreGroups = c.ignoreGroups; applied.push('ignoreGrp'); }
      if (c.scheduleEnabled !== undefined && config.awayMode.schedule) { config.awayMode.schedule.enabled = c.scheduleEnabled; applied.push('sched'); }
      if (c.scheduleStart && config.awayMode.schedule) { config.awayMode.schedule.sleepStart = c.scheduleStart; }
      if (c.scheduleEnd && config.awayMode.schedule) { config.awayMode.schedule.sleepEnd = c.scheduleEnd; }

      if (applied.length) logger.info(`[Store] Restored config: ${applied.join(', ')}`);
    }

    logger.info(`[Store] State loaded from ${data._savedAt || 'unknown time'}`);
  } catch (err) {
    logger.warn(`[Store] Load failed: ${err.message} — starting fresh`);
  }
}

// ─── Register state references ───
// Called by each module to register their data structures
function register(name, ref) {
  if (name in _state) {
    _state[name] = ref;
  } else {
    logger.warn(`[Store] Unknown state key: ${name}`);
  }
}

// ─── Graceful shutdown ───
function setupShutdownHook() {
  const shutdown = (signal) => {
    logger.info(`[Store] ${signal} received — saving state...`);
    if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
    saveNow();
  };

  process.on('SIGINT', () => { shutdown('SIGINT'); process.exit(0); });
  process.on('SIGTERM', () => { shutdown('SIGTERM'); process.exit(0); });
  process.on('exit', () => {
    if (_saveTimer) { clearTimeout(_saveTimer); saveNow(); }
  });
}

setupShutdownHook();

// ─── Config overrides helper ───
function _getConfigOverrides() {
  if (!_state.configOverrides) _state.configOverrides = {};
  return _state.configOverrides;
}

module.exports = { register, load, save, saveNow, _getConfigOverrides };
