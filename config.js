// ============================================
// config.js — Konfigurasi Bot AutoWA
// ============================================
// Edit file ini sesuai kebutuhan kamu.
// Restart bot setelah mengubah konfigurasi.
// ============================================

module.exports = {

  // ─── AWAY MODE ───
  // Bot otomatis reply saat kamu ga aktif
  awayMode: {
    enabled: true,              // true = away mode aktif saat bot start
    messages: [                 // Pesan random fallback (dipakai kalo AI gagal)
      "woy gw lagi tidur njir 😴 ntar gw bales kalo udah melek yak. sabar bre~\n\n_~autoreply by bot_",
      "halo kak, lagi molor 💤 chat nya udah masuk kok, tar dibales. tenang aja~\n\n_~autoreply by bot_",
      "ZONK! lagi gabisa dihubungi 🫠 mungkin lagi rebahan atau ketiduran. ntar ya!\n\n_~autoreply by bot_",
      "maaf ya, lagi off 🔌 bukan sombong, emang lagi istirahat beneran wkwk\n\n_~autoreply by bot_",
      "this number is currently unavailable ❌ becanda, cuma lagi tidur aja 😂 tar dibales!\n\n_~autoreply by bot_",
      "gw lagi di alam mimpi ✨ kalo urgent, telpon aja. kalo ga urgent, sabar ya bestie 🙏\n\n_~autoreply by bot_",
      "auto reply nih, lagi afk dari dunia nyata 🌙 ntar diread kok tenang~\n\n_~autoreply by bot_",
      "eh sorry baru bisa bales nanti, lagi recharge energy dulu ⚡ tar gw kabarin ya!\n\n_~autoreply by bot_",
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

  // ─── KEYWORD AUTO-REPLY ───
  // Reply otomatis berdasarkan kata kunci tertentu
  // Ini prioritas pertama sebelum AI reply
  autoReplies: [
    {
      keywords: ["urgent", "darurat", "penting banget"],
      response: "⚠️ Pesan kamu terdeteksi sebagai *urgent*.\n\nAkan segera dihubungi. Mohon tunggu ya!",
    },
    {
      keywords: ["terima kasih", "makasih", "thanks"],
      response: "Sama-sama! 😊",
    },
  ],

  // ─── AI SETTINGS ───
  // Konfigurasi AI reply (Groq + Gemini)
  ai: {
    enabled: true,
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

    maxTokens: 500,             // Max panjang jawaban AI (dalam token)
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
