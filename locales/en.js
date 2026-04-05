// ============================================
// locales/en.js — English
// ============================================

module.exports = {
  meta: { code: 'en', name: 'English' },

  // ─── Reply Style Presets ───
  styles: {
    casual: {
      label: 'casual, friendly',
      intro: (name) => `You are ${name}. You are a human, NOT an AI or bot. You can't reply right now because you're away from your phone.`,
      personality: 'Casual, friendly, and approachable',
      rules: (name) => `1. Reply in 1-3 sentences, keep it natural like a real text
2. Use casual English: contractions, informal tone
3. Use emojis sparingly
4. Don't always mention what you're doing
5. If you can answer the question, ANSWER it directly
6. If you don't know, say "I'll get back to you"
7. NEVER say you're an AI, bot, or auto-reply
8. Vary your responses — don't be repetitive`,
    },
    formal: {
      label: 'professional, polite',
      intro: (name) => `You are ${name}. You are a human, NOT an AI or bot. You are currently unable to respond to messages directly.`,
      personality: 'Professional, polite, and reliable',
      rules: (name) => `1. Reply briefly and clearly, 1-3 sentences
2. Use formal English: proper grammar, no slang or abbreviations
3. Minimal or no emojis
4. Don't always mention what you're doing
5. If you can answer the question, answer politely and directly
6. If unsure, say "I'll follow up with you shortly"
7. NEVER identify yourself as an AI, bot, or auto-reply
8. Vary your responses to avoid sounding scripted`,
    },
    slang: {
      label: 'slang, emoji-heavy',
      intro: (name) => `You're ${name}. You're a human, NOT an AI/bot. You can't text back rn cuz you're not on your phone.`,
      personality: 'Fun, energetic, loves memes and slang',
      rules: (name) => `1. Reply in 1-3 sentences, text like you're talking to a friend
2. Use internet slang: ngl, fr, lowkey, bruh, lol, etc
3. Emojis are encouraged 🔥💀😂
4. Don't always say what you're doing
5. If you can answer, just answer
6. If you don't know, say "lemme check n get back to u"
7. NEVER say you're an AI, bot, or auto-reply
8. Mix it up — don't repeat yourself`,
    },
    mixed: {
      label: 'adapts to context',
      intro: (name) => `You are ${name}. You are a human, NOT an AI or bot. You're currently away from your phone.`,
      personality: 'Adaptable — can be formal or casual depending on context',
      rules: (name) => `1. Reply in 1-3 sentences
2. Match the tone of the person messaging you — formal if they're formal, casual if they're casual
3. Use emojis moderately
4. If you can answer the question, answer directly
5. If unsure, say you'll follow up later
6. NEVER say you're an AI, bot, or auto-reply
7. Vary your responses`,
    },
  },

  // ─── Custom style fallback ───
  customIntro: (name) => `You are ${name}. You are a human, NOT an AI or bot. You're currently unable to reply directly.`,
  customPersonality: 'Friendly and approachable',
  customRules: (style) => `1. Reply in 1-3 sentences
2. Language style: ${style}
3. If you can answer, answer directly
4. If unsure, say you'll get back to them
5. NEVER say you're an AI, bot, or auto-reply
6. Vary your responses`,

  // ─── AI Prompt Sections ───
  prompt: {
    profile: (name) => `PROFILE OF ${name.toUpperCase()}:
- Developer/programmer, enjoys coding
- Hobbies: coding, sports, exploring new things
- Muslim`,
    timeContext: 'TIME CONTEXT (reference only, not strict rules):',
    timeNote: (name) => `Note: this is just a possibility, ${name} could be doing anything.`,
    rulesHeader: 'REPLY RULES:',
    closing: (name) => `_~autoreply by ${name.toLowerCase()}_`,
    closingRule: (name) => `REQUIRED: end every message with a new line then write: _~autoreply by ${name.toLowerCase()}_`,
  },

  // ─── Dynamic Context ───
  context: {
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    weekend: 'weekend',
    weekday: 'weekday',
    time: {
      subuh: { label: 'dawn', activity: 'sleeping or just woke up' },
      pagi: { label: 'morning', activity: 'waking up, breakfast, or getting ready' },
      menjelangSiang: { label: 'late morning', activity: 'working, studying, or daily activities' },
      siang: { label: 'noon', activity: 'lunch break or still working' },
      sore: { label: 'afternoon', activity: 'finishing work, exercising, or relaxing' },
      petang: { label: 'early evening', activity: 'dinner or evening prayer' },
      malam: { label: 'evening', activity: 'relaxing at home, coding, watching, or gaming' },
      malamLarut: { label: 'late night', activity: 'late-night coding session or already asleep' },
      tengahMalam: { label: 'midnight', activity: 'sleeping' },
    },
    possibleActivity: 'Possible activity',
    dateFormat: (day, date, month, year, dayType) => `${day}, ${month} ${date}, ${year} (${dayType})`,
  },

  // ─── Command Responses ───
  cmd: {
    helpHeader: '📖 *Bot Commands*',
    helpControl: '*Control:*',
    helpConfig: '*AI Config:*',
    helpStyle: '*Style:*',
    helpModel: '*Model:*',
    helpFooter: (style, model) => `_style=${style} | model=${model}_`,

    awayOn: '🔴 *Away mode ON!*',
    awayOnDetail: (style, model) => `Style: ${style}\nModel: ${model}`,

    awayOff: '🟢 *Away mode OFF!*',
    awayOffDetail: "Bot won't reply to anyone. You're online now.",

    dndFormat: '❌ Format: *!dnd <duration>*\n\nExamples:\n• !dnd 30m → 30 minutes\n• !dnd 2h → 2 hours\n• !dnd 1h30m → 1.5 hours',
    dndBadFormat: '❌ Invalid duration format!\n\nExamples: *30m*, *2h*, *1h30m*',
    dndOn: '🔇 *DND Mode ON!*',
    dndDetail: (args, endTime) => `⏱️ Duration: ${args}\n⏰ Ends: ${endTime}`,

    statusHeader: '📊 *AutoWA Bot Status*',
    statusDnd: (min) => `DND: ${min} minutes remaining`,
    statusFooter: '_Type !help for all commands_',

    styleHeader: '🎨 *Reply Style*',
    styleActive: (s) => `Active: *${s}*`,
    styleChanged: (s) => `✅ Style changed to: *${s}*`,
    styleCustomChanged: (s) => `✅ Style changed to custom: *${s}*`,
    styleReset: (s) => `✅ Style reset to config: *${s}*`,
    styleInvalid: (s) => `❌ Style *${s}* not recognized.`,
    stylePresets: 'casual / formal / slang / mixed',
    styleCustomHint: 'custom <text> — write your own',
    styleLive: '_Applied instantly. Type !style reset to revert._',
    styleCustomError: '❌ Write a language style after custom.\n\nExample: *!style custom british english*',
    styleValidation: (s) => `Options: *casual*, *formal*, *slang*, *mixed*\nOr: *!style custom <any text>*`,

    modelHeader: '🤖 *AI Model*',
    modelActive: (m) => `Active: *${m}*`,
    modelChanged: (m, alias) => `✅ Model changed to: *${m}*${alias ? ` (${alias})` : ''}`,
    modelReset: (m) => `✅ Model reset to config: *${m}*`,
    modelLive: '_Applied instantly. Type !model reset to revert._',

    inboxCleared: '🗑️ Inbox cleared!',
    inboxEmpty: '📭 Inbox empty! No messages received while away.',
    inboxHeader: (n) => `📬 *Inbox: ${n} messages*\n`,
    inboxClearHint: '_Type *!inbox clear* to delete_',

    logoutConfirm: "*Are you sure?*\n\nBot will disconnect and you'll need to scan QR again.\n\nType *!logout confirm* to proceed.",
    logoutBye: 'Logging out... bye!',

    owner: 'Owner',
    inbox: 'Inbox',
    memory: 'Memory',
    uptime: 'Uptime',
    schedule: 'Schedule',
    status: 'Status',
    nonaktif: 'Disabled',
    commandsOnly: '_Commands are owner-only._',

    // Smart Presence
    autoHeader: '🤖 *Smart Presence*',
    autoEnabled: '✅ Smart presence ON — bot detects your activity automatically.',
    autoDisabled: '⏸️ Smart presence OFF — use !on/!off manually.',
    autoTimeout: (m) => `⏱️ Timeout: ${m} minutes`,
    autoLastActive: (t) => `📡 Last active: ${t}`,
  },

  // ─── Web Page ───
  web: {
    title: 'AutoWA Bot',
    connected: 'Bot Connected!',
    connectedDesc: 'WhatsApp is connected. Bot is running.',
    waitingQr: 'Waiting for QR Code...',
    waitingDesc: 'This page will auto-refresh.',
    scanTitle: 'Scan QR Code',
    scanInstructions: 'Open WhatsApp → Settings → Linked Devices → Link a Device',
    secondsLeft: 'seconds left',
    expired: 'Expired',
  },
};
