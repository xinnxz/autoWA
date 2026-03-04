// ============================================
// src/utils/mongoAuth.js — MongoDB Auth State for Baileys
// ============================================
// Penjelasan:
// Menyimpan credentials WhatsApp (auth_info) ke MongoDB Atlas
// agar session tetap ada saat server restart di Koyeb/cloud.
//
// Cara kerja:
// 1. Saat bot pertama kali connect → scan QR → credentials disimpan ke MongoDB
// 2. Saat server restart → credentials diambil dari MongoDB → auto-connect
// 3. Tidak perlu scan QR lagi!
//
// Collection: "auth" di database "autowa"
// Setiap file auth disimpan sebagai 1 document: { _id: filename, data: jsonValue }
// ============================================

const { MongoClient } = require('mongodb');
const { proto } = require('@whiskeysockets/baileys');
const { BufferJSON, initAuthCreds } = require('@whiskeysockets/baileys');
const logger = require('./logger');

/**
 * Custom auth state yang simpan ke MongoDB (pengganti useMultiFileAuthState)
 * 
 * @param {string} mongoUri - MongoDB connection string
 * @param {string} [dbName='autowa'] - Nama database
 * @returns {Promise<{ state, saveCreds, client }>}
 */
async function useMongoDBAuthState(mongoUri, dbName = 'autowa') {
  // Connect ke MongoDB with timeout + TLS fix for cloud platforms
  const client = new MongoClient(mongoUri, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 5000,
    tls: true,
    tlsAllowInvalidCertificates: true,
  });
  await client.connect();
  logger.info('[MongoDB] Terhubung ke MongoDB Atlas');

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
