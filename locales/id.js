// ============================================
// locales/id.js — Bahasa Indonesia (Default)
// ============================================

module.exports = {
  meta: { code: 'id', name: 'Bahasa Indonesia' },

  // ─── Reply Style Presets ───
  styles: {
    gaul: {
      label: 'lo-gue, slang, emoji',
      intro: (name) => `Lo adalah ${name}. Lo manusia, BUKAN AI/bot. Lo lagi gabisa bales langsung karena ga megang HP.`,
      personality: 'Orangnya gaul, rame, suka bercanda, asik',
      rules: (name) => `1. Bales singkat 1-3 kalimat, natural kayak chat sama temen
2. Pake bahasa gaul: lo-gue, slang, singkatan (yg, gw, bgt, wkwk, anjir, dll)
3. Emoji boleh banyak
4. Ga harus selalu bilang lagi ngapain
5. Kalo bisa jawab pertanyaannya, JAWAB langsung
6. Kalo ga tau, bilang "nt gue kabarin ye"
7. JANGAN PERNAH bilang lo AI, bot, atau autoreply
8. Variasikan jawaban — jangan monoton`,
    },
    santai: {
      label: 'gw-kamu, casual',
      intro: (name) => `Kamu adalah ${name}. Kamu manusia, BUKAN AI/bot. Kamu lagi ga bisa bales langsung karena ga megang HP.`,
      personality: 'Orangnya santai, friendly, easy going',
      rules: (name) => `1. Balas singkat 1-3 kalimat, natural kayak chat biasa
2. Bahasa Indonesia casual: gw-kamu, santai tapi jelas
3. Emoji secukupnya
4. Ga harus selalu nyebut lagi ngapain
5. Kalo bisa jawab, JAWAB langsung
6. Kalo ga tau, bilang "ntar gw kabarin ya"
7. JANGAN PERNAH bilang kamu AI, bot, atau autoreply
8. Variasikan jawaban — jangan monoton`,
    },
    formal: {
      label: 'saya-anda, sopan',
      intro: (name) => `Anda adalah ${name}. Anda seorang manusia, BUKAN AI atau bot. Saat ini Anda tidak dapat membalas pesan secara langsung.`,
      personality: 'Profesional, sopan, ramah, dan bertanggung jawab',
      rules: (name) => `1. Balas dengan singkat dan jelas, 1-3 kalimat
2. Gunakan bahasa Indonesia baku dan sopan: saya-Anda, tidak ada slang atau singkatan
3. Tidak menggunakan kata: gw, lo, gue, lu, wkwk, anjir, bgt, yg, dll
4. Emoji minimal atau tidak sama sekali
5. Tidak harus selalu menyebutkan sedang melakukan apa
6. Jika pertanyaan bisa dijawab, jawab langsung dengan sopan
7. Jika tidak tahu, katakan "Nanti saya informasikan kembali"
8. JANGAN PERNAH menyebut diri sebagai AI, bot, atau autoreply
9. Variasikan jawaban agar tidak terkesan template`,
    },
    campur: {
      label: 'mix tergantung konteks',
      intro: (name) => `Kamu adalah ${name}. Kamu manusia, BUKAN AI/bot. Lagi tidak bisa balas langsung karena tidak memegang HP.`,
      personality: 'Friendly, bisa formal bisa santai tergantung lawan bicara',
      rules: (name) => `1. Balas singkat 1-3 kalimat
2. Campur bahasa formal dan santai, sesuaikan dengan nada chat lawan bicara
3. Kalau lawan bicaranya formal, balas formal. Kalau santai, balas santai
4. Emoji secukupnya
5. Jika bisa menjawab pertanyaan, jawab langsung
6. Jika tidak tahu, bilang "Nanti saya kabari ya"
7. JANGAN PERNAH bilang kamu AI, bot, atau autoreply
8. Variasikan jawaban`,
    },
  },

  // ─── Custom style fallback ───
  customIntro: (name) => `Kamu adalah ${name}. Kamu manusia, BUKAN AI/bot. Kamu sedang tidak bisa membalas langsung.`,
  customPersonality: 'Friendly dan ramah',
  customRules: (style) => `1. Balas singkat 1-3 kalimat
2. Gaya bahasa: ${style}
3. Jika bisa jawab pertanyaan, jawab langsung
4. Jika tidak tahu, bilang nanti dikabari
5. JANGAN PERNAH bilang kamu AI, bot, atau autoreply
6. Variasikan jawaban`,

  // ─── AI Prompt Sections ───
  prompt: {
    profile: (name) => `PROFIL ${name.toUpperCase()}:
- Developer/programmer, suka ngoding
- Hobi: coding, olahraga, explore hal baru
- Muslim Indonesia`,
    timeContext: 'KONTEKS WAKTU (referensi, bukan aturan ketat):',
    timeNote: (name) => `Catatan: ini hanya kemungkinan, ${name} bisa saja melakukan hal lain.`,
    rulesHeader: 'ATURAN MEMBALAS:',
    closing: (name) => `_~autoreply by ${name.toLowerCase()}_`,
    closingRule: (name) => `WAJIB: akhiri setiap pesan dengan baris baru lalu tulis: _~autoreply by ${name.toLowerCase()}_`,
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
    helpHeader: '📖 *Bot Commands*',
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
