// ============================================
// src/features/order.js — Order Bot
// ============================================
// Penjelasan:
// Order bot memungkinkan customer memesan produk via chat.
//
// Cara pakai customer:
//   !order Kaos XL 2     → Pesan Kaos XL sebanyak 2
//   !order Sepatu 1      → Pesan Sepatu sebanyak 1
//
// Cara admin lihat pesanan:
//   !orders              → Tampilkan semua pesanan
//   !orders clear        → Hapus semua pesanan
//
// Data pesanan disimpan di data/orders.json
// ============================================

const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../whatsapp');
const logger = require('../utils/logger');

// Path ke file orders
const ORDERS_PATH = path.join(__dirname, '../../data/orders.json');

/**
 * Baca data orders dari file
 * @returns {Array} Array of order objects
 */
function loadOrders() {
  try {
    const raw = fs.readFileSync(ORDERS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return []; // Jika file rusak/kosong, return array kosong
  }
}

/**
 * Simpan data orders ke file
 * @param {Array} orders - Array of order objects
 * 
 * Penjelasan:
 * JSON.stringify(orders, null, 2) → format JSON yang rapi (indented)
 * Parameter:
 *   - orders = data
 *   - null = replacer (tidak ada filter)
 *   - 2 = spaces for indentation (biar mudah dibaca)
 */
function saveOrders(orders) {
  fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2), 'utf-8');
}

/**
 * Handle perintah order dari customer
 * 
 * @param {object} msg - Data pesan masuk
 * 
 * Format: !order <nama_produk> <jumlah>
 * Contoh: !order Kaos XL 2
 * 
 * Alur:
 * 1. Parse command → extract nama produk dan jumlah
 * 2. Validasi: jumlah harus angka positif
 * 3. Buat objek order dengan ID unik & timestamp
 * 4. Simpan ke orders.json
 * 5. Kirim konfirmasi ke customer
 */
async function handle(msg) {
  // Parse: "!order Kaos XL 2" → parts = ["Kaos", "XL", "2"]
  const parts = msg.text.replace('!order ', '').trim().split(' ');

  // Jika kurang dari 2 kata (minimal: produk + jumlah)
  if (parts.length < 2) {
    await sendMessage(
      msg.from,
      '❌ Format salah!\n\nCara pesan: *!order <nama_produk> <jumlah>*\nContoh: *!order Kaos_XL 2*'
    );
    return;
  }

  // Ambil jumlah (angka terakhir)
  const quantity = parseInt(parts[parts.length - 1]);
  
  // Ambil nama produk (semua kata kecuali yang terakhir)
  const productName = parts.slice(0, -1).join(' ');

  // Validasi jumlah
  if (isNaN(quantity) || quantity <= 0) {
    await sendMessage(
      msg.from,
      '❌ Jumlah harus berupa angka positif!\n\nContoh: *!order Kaos_XL 2*'
    );
    return;
  }

  // Buat objek order
  const order = {
    id: `ORD-${Date.now()}`,  // ID unik berdasarkan timestamp
    customer: msg.from,        // Nomor customer
    customerName: msg.name,    // Nama customer
    product: productName,      // Nama produk
    quantity: quantity,         // Jumlah
    status: 'pending',         // Status: pending → confirmed → shipped
    createdAt: new Date().toISOString(), // Waktu order
  };

  // Simpan ke file
  const orders = loadOrders();
  orders.push(order);
  saveOrders(orders);

  logger.info(`Order baru: ${order.id} — ${productName} x${quantity} dari ${msg.from}`);

  // Kirim konfirmasi ke customer
  await sendMessage(
    msg.from,
    `✅ *Pesanan Diterima!*\n\n` +
    `📦 Produk: *${productName}*\n` +
    `🔢 Jumlah: *${quantity}*\n` +
    `🆔 ID Order: *${order.id}*\n` +
    `📅 Waktu: ${new Date().toLocaleString('id-ID')}\n\n` +
    `Kami akan segera memproses pesanan Anda. Terima kasih! 🙏`
  );
}

/**
 * Handle perintah !orders (admin only) — lihat semua pesanan
 * 
 * @param {object} msg - Data pesan masuk
 */
async function handleViewOrders(msg) {
  // Cek apakah ada sub-command "clear"
  if (msg.text.includes('clear')) {
    saveOrders([]);
    await sendMessage(msg.from, '🗑️ Semua pesanan telah dihapus.');
    return;
  }

  const orders = loadOrders();

  if (orders.length === 0) {
    await sendMessage(msg.from, '📭 Belum ada pesanan.');
    return;
  }

  // Format daftar pesanan
  let response = `📋 *Daftar Pesanan (${orders.length})*\n\n`;
  
  // Tampilkan max 20 pesanan terakhir
  const recent = orders.slice(-20);
  recent.forEach((o, i) => {
    response += `*${i + 1}. ${o.id}*\n`;
    response += `   👤 ${o.customerName} (${o.customer})\n`;
    response += `   📦 ${o.product} x${o.quantity}\n`;
    response += `   📊 Status: ${o.status}\n`;
    response += `   📅 ${new Date(o.createdAt).toLocaleString('id-ID')}\n\n`;
  });

  if (orders.length > 20) {
    response += `\n... dan ${orders.length - 20} pesanan lainnya.`;
  }

  await sendMessage(msg.from, response);
}

module.exports = { handle, handleViewOrders };
