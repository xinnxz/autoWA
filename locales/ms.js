// ============================================
// locales/ms.js — Bahasa Melayu (Malay)
// ============================================

module.exports = {
  meta: { code: 'ms', name: 'Bahasa Melayu' },

  styles: {
    santai: {
      label: 'aku-kau, casual',
      intro: (name) => `Kau ni ${name}. Kau manusia, BUKAN AI atau bot. Kau tak boleh balas sekarang sebab tak pegang phone.`,
      personality: 'Lepak, friendly, sporting',
      rules: (name) => `1. Balas ringkas 1-3 ayat, natural macam chat biasa\n2. Bahasa Melayu casual: aku-kau, short form ok\n3. Emoji secukupnya\n4. Tak perlu selalu cakap tengah buat apa\n5. Kalau boleh jawab, jawab terus\n6. Kalau tak tahu, cakap "nanti aku bagitahu"\n7. JANGAN PERNAH cakap kau AI, bot, atau autoreply\n8. Variasikan jawapan`,
    },
    formal: {
      label: 'saya-anda, sopan',
      intro: (name) => `Anda adalah ${name}. Anda seorang manusia, BUKAN AI atau bot. Buat masa ini anda tidak dapat membalas secara langsung.`,
      personality: 'Profesional, sopan, mesra',
      rules: (name) => `1. Balas dengan ringkas dan jelas, 1-3 ayat\n2. Bahasa Melayu standard: saya-anda, tiada slang\n3. Emoji minimum atau tiada\n4. Tidak perlu selalu menyebut apa yang sedang dilakukan\n5. Jika boleh jawab, jawab secara langsung\n6. Jika tidak tahu, katakan "Saya akan maklumkan kemudian"\n7. JANGAN PERNAH menyebut diri sebagai AI, bot, atau autoreply\n8. Variasikan jawapan`,
    },
    slanga: {
      label: 'slang, emoji',
      intro: (name) => `Ni ${name} la bro. Real human, bukan AI bukan bot. Tak free la skrg, phone takde kat tangan.`,
      personality: 'Havoc, kelakar, best',
      rules: (name) => `1. Balas 1-3 ayat, selamba je\n2. Guna slang Melayu: bro, wei, la, gak, lah, haha\n3. Emoji banyak 🔥😂\n4. Tak payah cakap tengah buat apa\n5. Kalau tahu jawapan, terus jawab\n6. Kalau tak tahu, cakap "nanti aku roger"\n7. JANGAN cakap kau AI atau bot\n8. Tukar-tukar jawapan`,
    },
    campur: {
      label: 'ikut konteks',
      intro: (name) => `Anda adalah ${name}. Anda seorang manusia, bukan AI atau bot. Tidak dapat membalas sekarang.`,
      personality: 'Fleksibel — formal atau santai ikut lawan chat',
      rules: (name) => `1. Balas 1-3 ayat\n2. Ikut nada lawan bicara — formal kalau dia formal, santai kalau dia santai\n3. Emoji secukupnya\n4. Jawab terus kalau boleh\n5. Kalau tak tahu, bilang nanti kontek\n6. JANGAN cakap kau AI atau bot\n7. Variasikan jawapan`,
    },
  },

  customIntro: (name) => `Anda adalah ${name}. Manusia, bukan AI atau bot. Tidak boleh balas sekarang.`,
  customPersonality: 'Mesra dan mudah didekati',
  customRules: (style) => `1. Balas 1-3 ayat\n2. Gaya: ${style}\n3. Jawab terus kalau boleh\n4. Kalau tak tahu, bilang nanti\n5. JANGAN cakap AI/bot\n6. Variasikan jawapan`,

  prompt: {
    profile: (name) => `PROFIL ${name.toUpperCase()}:\n- Developer/programmer\n- Hobi: coding, sukan, explore benda baru\n- Muslim`,
    timeContext: 'KONTEKS MASA (rujukan sahaja):',
    timeNote: (name) => `Nota: ini hanya kemungkinan, ${name} mungkin sedang buat benda lain.`,
    rulesHeader: 'PERATURAN MEMBALAS:', closing: (name) => `_~autoreply by ${name.toLowerCase()}_`,
    closingRule: (name) => `WAJIB: akhiri setiap mesej dengan baris baru lalu tulis: _~autoreply by ${name.toLowerCase()}_`,
  },

  context: {
    days: ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'],
    months: ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'],
    weekend: 'hujung minggu', weekday: 'hari bekerja',
    time: {
      subuh:          { label: 'subuh',       activity: 'tidur atau baru bangun' },
      pagi:           { label: 'pagi',        activity: 'bangun tidur, sarapan' },
      menjelangSiang: { label: 'tengah hari',  activity: 'kerja atau belajar' },
      siang:          { label: 'tengah hari',  activity: 'rehat makan tengah hari' },
      sore:           { label: 'petang',       activity: 'habis kerja, senaman' },
      petang:         { label: 'maghrib',      activity: 'makan malam, solat' },
      malam:          { label: 'malam',        activity: 'rehat, coding, tengok TV' },
      malamLarut:     { label: 'lewat malam',  activity: 'coding lewat malam atau dah tidur' },
      tengahMalam:    { label: 'tengah malam', activity: 'tidur' },
    },
    possibleActivity: 'Kemungkinan aktiviti',
    dateFormat: (day, date, month, year, dayType) => `${day}, ${date} ${month} ${year} (${dayType})`,
  },

  cmd: {
    helpHeader: '📖 *Arahan Bot*', helpControl: '*Kawalan:*', helpConfig: '*Tetapan AI:*',
    helpStyle: '*Gaya:*', helpModel: '*Model:*',
    helpFooter: (style, model) => `_style=${style} | model=${model}_`,
    awayOn: '🔴 *Mod away AKTIF!*', awayOnDetail: (style, model) => `Gaya: ${style}\nModel: ${model}`,
    awayOff: '🟢 *Mod away MATI!*', awayOffDetail: 'Bot takkan balas sesiapa. Anda online sekarang.',
    dndFormat: '❌ Format: *!dnd <tempoh>*\n\nContoh:\n• !dnd 30m\n• !dnd 2h',
    dndBadFormat: '❌ Format salah!', dndOn: '🔇 *Mod DND AKTIF!*',
    dndDetail: (args, endTime) => `⏱️ Tempoh: ${args}\n⏰ Tamat: ${endTime}`,
    statusHeader: '📊 *Status Bot*', statusDnd: (min) => `DND: ${min} minit lagi`,
    statusFooter: '_Taip !help untuk semua arahan_',
    styleHeader: '🎨 *Gaya Balas*', styleActive: (s) => `Aktif: *${s}*`,
    styleChanged: (s) => `✅ Gaya ditukar: *${s}*`, styleCustomChanged: (s) => `✅ Gaya custom: *${s}*`,
    styleReset: (s) => `✅ Gaya direset: *${s}*`, styleInvalid: (s) => `❌ Gaya *${s}* tidak dikenali.`,
    stylePresets: 'santai / formal / slanga / campur',
    styleCustomHint: 'custom <teks> — tulis ikut suka',
    styleLive: '_Terus berkesan. Taip !style reset untuk kembali._',
    styleCustomError: '❌ Tulis gaya selepas custom.',
    styleValidation: (s) => `Pilihan: *santai*, *formal*, *slanga*, *campur*\nAtau: *!style custom <teks bebas>*`,
    modelHeader: '🤖 *Model AI*', modelActive: (m) => `Aktif: *${m}*`,
    modelChanged: (m, alias) => `✅ Model ditukar: *${m}*${alias ? ` (${alias})` : ''}`,
    modelReset: (m) => `✅ Model direset: *${m}*`, modelLive: '_Terus berkesan. !model reset untuk kembali._',
    inboxCleared: '🗑️ Peti masuk dikosongkan!', inboxEmpty: '📭 Peti masuk kosong!',
    inboxHeader: (n) => `📬 *Peti masuk: ${n} mesej*\n`, inboxClearHint: '_Taip *!inbox clear* untuk kosongkan_',
    logoutConfirm: '*Pasti nak logout?*\n\nTaip *!logout confirm*.',
    logoutBye: 'Logging out...',
    owner: 'Pemilik', inbox: 'Peti masuk', memory: 'Memori', uptime: 'Masa aktif',
    schedule: 'Jadual', status: 'Status', nonaktif: 'Tidak aktif', commandsOnly: '_Arahan untuk pemilik sahaja._',
    autoHeader: '🤖 *Smart Presence*',
    autoEnabled: '✅ Smart presence AKTIF — bot mengesan aktiviti anda secara automatik.',
    autoDisabled: '⏸️ Smart presence MATI — guna !on/!off secara manual.',
    autoTimeout: (m) => `⏱️ Timeout: ${m} minit`,
    autoLastActive: (t) => `📡 Aktiviti terakhir: ${t}`,
  },

  web: {
    title: 'AutoWA Bot', connected: 'Bot Disambungkan!', connectedDesc: 'WhatsApp disambungkan. Bot sedang berjalan.',
    waitingQr: 'Menunggu QR Code...', waitingDesc: 'Halaman akan refresh automatik.',
    scanTitle: 'Imbas QR Code', scanInstructions: 'Buka WhatsApp → Settings → Linked Devices → Link a Device',
    secondsLeft: 'saat lagi', expired: 'Tamat tempoh',
  },
};
