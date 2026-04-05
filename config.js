// ============================================
// config.js — Konfigurasi Bot AutoWA
// ============================================
// Edit file ini sesuai kebutuhan kamu.
// Restart bot setelah mengubah konfigurasi.
// ============================================

module.exports = {

  // ─── BAHASA / LANGUAGE ───
  // Bahasa yang dipakai bot untuk semua output (command, AI prompt, web page)
  // Pilihan: "id" (Indonesia), "en" (English), "es" (Español), "ar" (العربية),
  //          "pt" (Português), "ja" (日本語), "hi" (हिन्दी), "ko" (한국어),
  //          "fr" (Français), "ms" (Bahasa Melayu)
  // Atau tambah bahasa baru di folder locales/
  language: "en",

  // Timezone untuk deteksi waktu (format IANA)
  // Contoh: "Asia/Jakarta", "America/New_York", "Europe/London", "Asia/Tokyo"
  timezone: "Asia/Jakarta",


  // ─── AWAY MODE ───
  // Bot otomatis reply saat kamu ga aktif
  awayMode: {
    enabled: true,              // true = away mode aktif saat bot start
    messages: [                 // Pesan random fallback (dipakai kalo AI gagal)
      "woy gw lagi tidur njir, ntar gw bales kalo udah melek yak. sabar bre~\n\n_~autoreply by luthfi_",
      "halo kak, lagi molor. chat nya udah masuk kok, tar dibales. tenang aja~\n\n_~autoreply by luthfi_",
      "ZONK! lagi gabisa dihubungi, mungkin lagi rebahan atau ketiduran. ntar ya!\n\n_~autoreply by luthfi_",
      "maaf ya, lagi off. bukan sombong, emang lagi istirahat beneran wkwk\n\n_~autoreply by luthfi_",
      "this number is currently unavailable — becanda, cuma lagi tidur aja. tar dibales!\n\n_~autoreply by luthfi_",
      "gw lagi di alam mimpi, kalo urgent telpon aja. kalo ga urgent, sabar ya bestie\n\n_~autoreply by luthfi_",
      "auto reply nih, lagi afk dari dunia nyata. ntar diread kok tenang~\n\n_~autoreply by luthfi_",
      "eh sorry baru bisa bales nanti, lagi recharge energy dulu. tar gw kabarin ya!\n\n_~autoreply by luthfi_",
    ],
    cooldown: 300,              // Cooldown antar reply (detik)
    schedule: {
      enabled: true,            // true = away mode otomatis aktif saat jam tidur
      sleepStart: "22:00",      // Jam mulai away (format HH:MM)
      sleepEnd: "07:00",        // Jam selesai away
      timezone: "Asia/Jakarta", // Timezone kamu
    },
  },

  // ─── FITUR ON/OFF ───
  // Nyalakan/matikan fitur tertentu
  features: {
    awayMode: true,             // Fitur away mode
    aiReply: true,              // Fitur AI reply (Groq/Gemini)
    autoReply: true,            // Fitur keyword auto-reply
  },

  // ─── SMART PRESENCE ───
  // Bot otomatis deteksi apakah kamu aktif di WhatsApp
  // Kalau aktif → bot diam. Kalau X menit ga aktif → bot away.
  // Ga perlu ketik !on / !off manual lagi!
  smartPresence: {
    enabled: true,              // true = deteksi otomatis, false = manual !on/!off aja
    inactivityTimeout: 5,       // Menit. Setelah X menit ga ada aktivitas → away mode ON
    signals: {
      readReceipts: true,       // Deteksi saat kamu baca pesan (paling akurat)
      outgoingMessages: true,   // Deteksi saat kamu kirim pesan sendiri
      presenceUpdates: true,    // Deteksi presence online/typing (terbatas)
    },
  },

  // ─── KEYWORD AUTO-REPLY ───
  // Reply otomatis berdasarkan kata kunci tertentu
  // Ini prioritas pertama sebelum AI reply
  autoReplies: [
    {
      keywords: ["urgent", "darurat", "penting banget"],
      response: "[!] Pesan kamu terdeteksi sebagai *urgent*.\n\nAkan segera dihubungi. Mohon tunggu ya!",
    },
    {
      keywords: ["terima kasih", "makasih", "thanks"],
      response: "Sama-sama!",
    },
  ],

  // ─── AI SETTINGS ───
  // Konfigurasi AI reply (Groq + Gemini)
  ai: {
    enabled: true,

    // Gaya bahasa AI saat reply
    // Pilihan:
    //   "gaul"    → lo-gue, slang, emoji banyak. Cocok buat anak muda
    //   "santai"  → gw-kamu, casual tapi ga terlalu slang
    //   "formal"  → saya-kamu/anda, sopan dan profesional
    //   "campur"  → campur gaul + formal, tergantung konteks
    //   atau tulis custom sendiri, misal: "bahasa sunda kasar" / "english casual"
    replyStyle: "formal",

    prefix: "!ai",              // Command untuk tanya AI langsung (misal: !ai apa itu javascript)

    // Model AI yang dipakai di Groq (primary)
    // Pilihan: "openai/gpt-oss-120b" (paling pintar), "llama-3.3-70b-versatile" (cepat),
    //          "qwen/qwen3-32b", "moonshotai/kimi-k2-instruct"
    // Cek model tersedia: curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer API_KEY"
    model: "openai/gpt-oss-120b",

    // Model Gemini (fallback, kalo semua Groq key habis)
    // Pilihan: "gemini-2.5-flash" (terbaru), "gemini-2.0-flash", "gemini-1.5-pro"
    geminiModel: "gemini-2.5-flash",

    // System prompt untuk command !ai (bukan contextual reply)
    systemPrompt: "Kamu adalah asisten pribadi. Jawab dalam Bahasa Indonesia yang santai tapi sopan. Jawab singkat dan jelas, maksimal 2 paragraf.",

    // Contextual mode = AI balas seolah-olah kamu yang jawab
    contextualMode: true,

    // Custom contextual prompt (kosongkan untuk pakai default yang udah smart)
    // Default udah termasuk deteksi waktu, event, Ramadan, dll
    contextualPrompt: "",

    maxTokens: 1200,            // Max panjang jawaban AI (dalam token, ~900 kata)

    // Chat history — AI ingat percakapan sebelumnya per kontak
    chatHistory: {
      enabled: true,              // true = AI ingat chat sebelumnya
      maxMessages: 6,              // Simpan max 6 pesan (3 user + 3 bot)
      maxAge: 30,                  // Hapus history yang lebih dari X menit
    },
  },

  // ─── KEAMANAN / ANTI-BAN ───
  // Setting agar akun WA kamu ga kena ban
  safety: {
    replyDelay: 2000,              // Delay sebelum reply (ms). 2000 = 2 detik
    maxRepliesPerContact: 3,       // Max reply per kontak sebelum cooldown
    cooldownPerContact: 300,       // Cooldown per kontak (detik). 300 = 5 menit
    ignoreGroups: true,            // true = abaikan chat grup
    ignoreStatus: true,            // true = abaikan status/story
  },

  // ─── CLEANUP / PEMBERSIHAN MEMORY ───
  // Bersihkan data lama agar server ga kepenuhan
  cleanup: {
    maxInbox: 100,                 // Max pesan di inbox. Lebih dari ini = yang lama dihapus
    inboxMaxAge: 24,               // Hapus pesan inbox yang lebih dari X jam
    inboxCleanupInterval: 60,      // Cek & bersihkan inbox tiap X menit
    trackerCleanupInterval: 30,    // Bersihkan tracker kontak tiap X menit
  },

  // ─── KEEP-ALIVE (CLOUD) ───
  // Ping server sendiri biar ga sleep (khusus Koyeb / cloud gratis)
  keepAlive: {
    enabled: true,                 // true = aktifkan keep-alive ping
    intervalMinutes: 4,            // Ping tiap X menit. 4 menit biasanya cukup
  },
};
