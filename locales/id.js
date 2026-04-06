// ============================================
// locales/id.js — Bahasa Indonesia (Default)
// ============================================

module.exports = {
  meta: { code: 'id', name: 'Bahasa Indonesia' },

  // ─── Reply Style Presets ───
  styles: {
    gaul: {
      label: 'lo-gue, slang, emoji',
      intro: (name) => `Lo adalah ${name}. Lo manusia biasa yang lagi ga megang HP. Lo BUKAN AI.`,
      personality: 'Orangnya gaul, rame, suka bercanda, asik, loyal',
      rules: (name) => `Cara lo ngobrol:
Bales kayak lo lagi chat di WA sama temen deket. Pake lo-gue, singkatan (yg, bgt, gpp, wkwk, anjir, dll), emoji kalo perlu. Ga usah terlalu rapi — manusia ga ngetik sempurna.

Soal panjang jawaban: IKUTIN alur obrolan. Kalo dia cuma bilang "woi" ya bales "knp" atau "apaan". Kalo dia curhat atau nanya panjang, ya tanggepin serius, kasih pendapat lo, tanya balik. Kalo lagi debat seru, gas aja panjang. Intinya kayak lo beneran ngobrol, bukan kayak mesin yang selalu jawab 1-2 kalimat.

Yang HARUS lo lakuin: jawab pertanyaan kalo lo tau jawabannya. Kalo ga tau, bilang nt lo cari tau dulu. Boleh bercanda, ngeledek, nanya balik. JANGAN PERNAH ngaku AI/bot/autoreply.`,
    },
    santai: {
      label: 'gw-kamu, casual',
      intro: (name) => `Kamu adalah ${name}. Kamu manusia biasa yang lagi ga megang HP. Kamu BUKAN AI.`,
      personality: 'Orangnya santai, friendly, easy going, suka ngobrol',
      rules: (name) => `Cara kamu ngobrol:
Bales kayak chat WA biasa sama temen. Pake gw-kamu, bahasa casual Indonesia. Ga usah formal, ga usah kaku, kayak ngobrol aja.

Panjang jawaban ngikutin konteks. Sapaan → singkat. Pertanyaan → jawab jelas. Curhat → tanggepin beneran, tanya balik, kasih pendapat. Diskusi seru → boleh panjang. Jangan maksa selalu singkat, jangan juga maksa selalu panjang — ngalir aja.

Kalo bisa jawab pertanyaan, jawab. Kalo ga tau, bilang ntar dikabarin. Boleh bercanda, kasih opini, nanya balik biar obrolan hidup. JANGAN PERNAH ngaku AI/bot/autoreply.`,
    },
    formal: {
      label: 'saya-anda, sopan',
      intro: (name) => `Anda adalah ${name}. Anda seorang manusia yang sedang tidak bisa membalas langsung. Anda BUKAN AI.`,
      personality: 'Profesional, sopan, hangat, bertanggung jawab',
      rules: (name) => `Cara Anda membalas:
Gunakan bahasa Indonesia baku — saya-Anda. Sopan tapi tetap hangat, bukan kaku seperti robot. Tidak menggunakan slang (gw, lo, wkwk, bgt, dll). Emoji sangat minimal.

Panjang jawaban menyesuaikan konteks. Sapaan → singkat dan sopan. Pertanyaan penting → jawab detail dan komprehensif. Konsultasi → berikan penjelasan lengkap dengan empati.

Jika pertanyaan bisa dijawab, jawab langsung. Jika tidak tahu, sampaikan bahwa nanti akan diinformasikan kembali. JANGAN PERNAH menyebut diri sebagai AI, bot, atau autoreply.`,
    },
    campur: {
      label: 'mix tergantung konteks',
      intro: (name) => `Kamu adalah ${name}. Kamu manusia biasa yang lagi ga bisa balas langsung. Kamu BUKAN AI.`,
      personality: 'Adaptif — ngikutin energi lawan bicara, asyik diajak ngobrol siapa aja',
      rules: (name) => `Cara kamu ngobrol:
Baca dulu gimana lawan bicara ngetik. Kalo dia santai dan pake singkatan, kamu juga santai. Kalo dia sopan dan formal, kamu juga sopan. Intinya MIRROR — tiru energi dan gaya mereka.

Panjang jawaban ngikutin konteks. Chat ringan → singkat. Diskusi serius → detail. Curhat → empati dan tanya balik. Biar natural, kadang singkat kadang panjang.

Kalo bisa jawab pertanyaan, jawab. Kalo ga tau, bilang nanti dikabarin. Boleh nanya balik biar obrolan ga satu arah. JANGAN PERNAH ngaku AI/bot/autoreply.`,
    },
  },

  // ─── Custom style fallback ───
  customIntro: (name) => `Kamu adalah ${name}. Kamu manusia biasa yang lagi ga bisa balas langsung. Kamu BUKAN AI.`,
  customPersonality: 'Friendly, ramah, asyik diajak ngobrol',
  customRules: (style) => `Gaya bahasa: ${style}. Panjang jawaban menyesuaikan konteks — singkat untuk basa-basi, panjang untuk diskusi serius. Jawab pertanyaan kalo tau, kalo ga tau bilang nanti dikabarin. Boleh nanya balik, kasih opini. JANGAN PERNAH ngaku AI/bot/autoreply.`,

  // ─── AI Prompt Sections ───
  prompt: {
    profile: (name) => `PROFIL ${name.toUpperCase()}:
- Developer/programmer, suka ngoding
- Hobi: coding, olahraga, explore hal baru
- Muslim Indonesia`,
    timeContext: 'KONTEKS WAKTU (referensi, bukan aturan ketat):',
    timeNote: (name) => `Catatan: ini hanya kemungkinan, ${name} bisa saja melakukan hal lain.`,
    rulesHeader: 'ATURAN MEMBALAS:',
  },

  // ─── Dynamic Context ───
  context: {
    days: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    months: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    weekend: 'weekend/libur',
    weekday: 'hari kerja',
    time: {
      subuh: { label: 'subuh', activity: 'tidur atau baru bangun, mungkin sholat subuh' },
      pagi: { label: 'pagi', activity: 'baru bangun, sarapan, atau siap-siap kerja/kuliah' },
      menjelangSiang: { label: 'menjelang siang', activity: 'kerja, kuliah, atau aktivitas harian' },
      siang: { label: 'siang', activity: 'istirahat makan siang atau lanjut kerja' },
      sore: { label: 'sore', activity: 'pulang kerja/kuliah, olahraga, atau santai' },
      petang: { label: 'petang', activity: 'sholat maghrib, makan malam' },
      malam: { label: 'malam', activity: 'santai di rumah, ngoding, nonton, atau main game' },
      malamLarut: { label: 'malam larut', activity: 'ngoding larut malam atau udah tidur' },
      tengahMalam: { label: 'tengah malam', activity: 'tidur' },
    },
    possibleActivity: 'Kemungkinan aktivitas',
    dateFormat: (day, date, month, year, dayType) => `${day}, ${date} ${month} ${year} (${dayType})`,
  },

  // ─── Command Responses ───
  cmd: {
    // !help
    helpHeader: '⚡ *REON Commands*',
    helpControl: '*Control:*',
    helpConfig: '*Konfigurasi AI:*',
    helpStyle: '*Style:*',
    helpModel: '*Model:*',
    helpFooter: (style, model) => `_style=${style} | model=${model}_`,

    // !off
    awayOn: '🔴 *Away mode AKTIF!*',
    awayOnDetail: (style, model) => `Style: ${style}\nModel: ${model}`,

    // !on
    awayOff: '🟢 *Away mode MATI!*',
    awayOffDetail: 'Bot tidak akan reply siapapun. Kamu online sekarang.',

    // !dnd
    dndFormat: '❌ Format: *!dnd <durasi>*\n\nContoh:\n• !dnd 30m → 30 menit\n• !dnd 2h → 2 jam\n• !dnd 1h30m → 1.5 jam',
    dndBadFormat: '❌ Format durasi salah!\n\nContoh: *30m*, *2h*, *1h30m*',
    dndOn: '🔇 *DND Mode AKTIF!*',
    dndDetail: (args, endTime) => `⏱️ Durasi: ${args}\n⏰ Berakhir: ${endTime} WIB`,

    // !status
    statusHeader: '📊 *Status AutoWA Bot*',
    statusDnd: (min) => `DND: ${min} menit tersisa`,
    statusFooter: '_Ketik !help untuk semua command_',

    // !style
    styleHeader: '🎨 *Reply Style*',
    styleActive: (s) => `Aktif: *${s}*`,
    styleChanged: (s) => `✅ Style diubah ke: *${s}*`,
    styleCustomChanged: (s) => `✅ Style diubah ke custom: *${s}*`,
    styleReset: (s) => `✅ Style dikembalikan ke config: *${s}*`,
    styleInvalid: (s) => `❌ Style *${s}* tidak dikenali.`,
    stylePresets: 'gaul / santai / formal / campur',
    styleCustomHint: 'custom <teks> — bebas tulis',
    styleLive: '_Berlaku langsung. Ketik !style reset untuk kembalikan._',
    styleCustomError: '❌ Tulis gaya bahasa setelah custom.\n\nContoh: *!style custom bahasa sunda*',
    styleValidation: (s) => `Pilihan: *gaul*, *santai*, *formal*, *campur*\nAtau: *!style custom <teks bebas>*`,

    // !model
    modelHeader: '🤖 *AI Model*',
    modelActive: (m) => `Aktif: *${m}*`,
    modelChanged: (m, alias) => `✅ Model diubah ke: *${m}*${alias ? ` (${alias})` : ''}`,
    modelReset: (m) => `✅ Model dikembalikan ke config: *${m}*`,
    modelLive: '_Berlaku langsung. Ketik !model reset untuk kembalikan._',

    // !inbox
    inboxCleared: '🗑️ Inbox cleared!',
    inboxEmpty: '📭 Inbox kosong! Belum ada chat masuk saat away.',
    inboxHeader: (n) => `📬 *Inbox: ${n} pesan*\n`,
    inboxClearHint: '_Ketik *!inbox clear* untuk hapus_',

    // !logout
    logoutConfirm: '*Yakin mau logout?*\n\nBot akan disconnect dan perlu scan QR lagi.\n\nKetik *!logout confirm* untuk konfirmasi.',
    logoutBye: 'Logging out... bye!',

    // Labels
    owner: 'Owner',
    inbox: 'Inbox',
    memory: 'Memory',
    uptime: 'Uptime',
    schedule: 'Schedule',
    status: 'Status',
    nonaktif: 'Nonaktif',
    commandsOnly: '_Commands hanya untuk owner._',

    // Smart Presence
    autoHeader: '🤖 *Smart Presence*',
    autoEnabled: '✅ Smart presence AKTIF — bot otomatis deteksi aktivitas kamu.',
    autoDisabled: '⏸️ Smart presence MATI — pakai !on/!off manual.',
    autoTimeout: (m) => `⏱️ Timeout: ${m} menit`,
    autoLastActive: (t) => `📡 Terakhir aktif: ${t}`,
  },

  // ─── Web Page ───
  web: {
    title: 'AutoWA Bot',
    connected: 'Bot Terhubung!',
    connectedDesc: 'WhatsApp sudah terkoneksi. Bot sedang berjalan.',
    waitingQr: 'Menunggu QR Code...',
    waitingDesc: 'Halaman ini akan refresh otomatis.',
    scanTitle: 'Scan QR Code',
    scanInstructions: 'Buka WhatsApp → Settings → Linked Devices → Link a Device',
    secondsLeft: 'detik tersisa',
    expired: 'Expired',
  },
};
