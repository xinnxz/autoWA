// ============================================
// src/utils/contacts.js — Contact Tracker
// ============================================
// Tracks contacts who have sent messages to the bot.
// Data persisted via store.js (survives restarts).

const store = require('./store');

const contacts = new Map(); // contactId -> { name, msgCount, lastMsg, lastTime }

/**
 * Track a contact interaction
 */
function trackContact(from, name, text) {
  const id = from.split('@')[0];
  const existing = contacts.get(id) || { name: name || id, msgCount: 0, lastMsg: '', lastTime: 0 };
  existing.name = name || existing.name;
  existing.msgCount++;
  existing.lastMsg = (text || '').substring(0, 80);
  existing.lastTime = Date.now();
  contacts.set(id, existing);
  store.save();
}

/**
 * Get all contacts sorted by last interaction
 */
function getContacts(limit = 50) {
  return Array.from(contacts.entries())
    .map(([id, c]) => ({ id, ...c }))
    .sort((a, b) => b.lastTime - a.lastTime)
    .slice(0, limit);
}

function clearContacts() { contacts.clear(); store.save(); }

module.exports = { trackContact, getContacts, clearContacts };

// ─── Register for persistence ───
store.register('contacts', contacts);
