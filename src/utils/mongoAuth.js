// ============================================
// src/utils/mongoAuth.js — MongoDB Auth State for Baileys
// ============================================
// Stores WhatsApp credentials (auth_info) to MongoDB Atlas
// so sessions persist across server restarts on Koyeb/cloud.
//
// How it works:
// 1. Bot first connects → scan QR → credentials saved to MongoDB
// 2. Server restarts → credentials loaded from MongoDB → auto-connect
// 3. No need to scan QR again!
//
// Collection: "auth" in database "autowa"
// Each auth file is stored as 1 document: { _id: filename, data: jsonValue }
// ============================================

// Fix: Force IPv4-first DNS resolution. mongodb+srv:// does SRV/TXT DNS lookups,
// and on some cloud platforms (Koyeb), IPv6 resolution causes TLS handshake failures.
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { MongoClient } = require('mongodb');
const { proto } = require('@whiskeysockets/baileys');
const { BufferJSON, initAuthCreds } = require('@whiskeysockets/baileys');
const logger = require('./logger');

/**
 * Custom auth state that stores to MongoDB (replaces useMultiFileAuthState)
 * 
 * @param {string} mongoUri - MongoDB connection string
 * @param {string} [dbName='autowa'] - Database name
 * @returns {Promise<{ state, saveCreds, client }>}
 */
async function useMongoDBAuthState(mongoUri, dbName = 'autowa') {
  // Disable strict TLS verification for cloud platforms
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  let finalUri = mongoUri;

  // If using mongodb+srv://, manually resolve SRV records and convert to standard mongodb://
  // This bypasses TLS handshake issues on Koyeb's OpenSSL 3.x
  if (mongoUri.startsWith('mongodb+srv://')) {
    try {
      const dnsPromises = require('dns').promises;
      const parsed = new URL(mongoUri);
      const srvHost = parsed.hostname; // e.g. cluster0.2wbetza.mongodb.net

      // Resolve SRV records to get actual server addresses
      const srvRecords = await dnsPromises.resolveSrv(`_mongodb._tcp.${srvHost}`);
      const hosts = srvRecords.map(r => `${r.name}:${r.port}`).join(',');

      // Get TXT records for connection options (replicaSet, authSource, etc.)
      let txtOpts = '';
      try {
        const txtRecords = await dnsPromises.resolveTxt(srvHost);
        txtOpts = txtRecords.flat().join('');
      } catch (e) { /* TXT records are optional */ }

      // Build standard mongodb:// URI
      const auth = parsed.username + ':' + parsed.password;
      const existingParams = parsed.search ? parsed.search.substring(1) : '';
      const allParams = [txtOpts, existingParams, 'tls=true'].filter(Boolean).join('&');
      finalUri = `mongodb://${auth}@${hosts}/${parsed.pathname.substring(1)}?${allParams}`;

      logger.info(`[MongoDB] SRV resolved: ${srvRecords.length} hosts found`);
    } catch (dnsErr) {
      logger.warn(`[MongoDB] SRV resolution failed: ${dnsErr.message}, using original URI`);
      finalUri = mongoUri;
    }
  }

  const client = new MongoClient(finalUri, {
    connectTimeoutMS: 15000,
    serverSelectionTimeoutMS: 10000,
    family: 4,
  });
  await client.connect();
  logger.info('[MongoDB] Connected to MongoDB Atlas');

  const db = client.db(dbName);
  const collection = db.collection('auth');

  // ─── Helper: baca data dari MongoDB ───
  async function readData(key) {
    try {
      const doc = await collection.findOne({ _id: key });
      if (!doc) return null;
      // Parse JSON dengan support Buffer (Baileys butuh ini)
      return JSON.parse(JSON.stringify(doc.data), BufferJSON.reviver);
    } catch (err) {
      logger.debug(`[MongoDB] Read ${key}: ${err.message}`);
      return null;
    }
  }

  // ─── Helper: tulis data ke MongoDB ───
  async function writeData(key, data) {
    try {
      // Serialize dengan support Buffer
      const serialized = JSON.parse(JSON.stringify(data, BufferJSON.replacer));
      await collection.updateOne(
        { _id: key },
        { $set: { data: serialized, updatedAt: new Date() } },
        { upsert: true }
      );
    } catch (err) {
      logger.warn(`[MongoDB] Write ${key} failed: ${err.message}`);
    }
  }

  // ─── Helper: hapus data ───
  async function removeData(key) {
    try {
      await collection.deleteOne({ _id: key });
    } catch (err) {
      logger.debug(`[MongoDB] Delete ${key}: ${err.message}`);
    }
  }

  // ─── Load existing credentials atau buat baru ───
  const creds = (await readData('creds')) || initAuthCreds();

  // ─── Return format yang sama dengan useMultiFileAuthState ───
  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(key, value) : removeData(key));
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => writeData('creds', creds),
    client, // expose untuk cleanup
  };
}

module.exports = { useMongoDBAuthState };
