// ============================================
// locales/_template.js — Template for New Languages
// ============================================
// 
// HOW TO ADD A NEW LANGUAGE:
// 1. Copy this file and rename it to your language code (e.g., ms.js, ar.js, fr.js)
// 2. Fill in all the strings with translations
// 3. Set your language in config.js: language: "ms" (your language code)
// 4. Restart the bot
//
// IMPORTANT:
// - Functions like (name) => `...${name}...` must keep the ${name} interpolation
// - Style keys (gaul/santai/formal/campur for id, casual/formal/slang/mixed for en)
//   can be renamed to whatever makes sense in your language
// - The first style key is the default
//
// ============================================

module.exports = {
  meta: { code: 'xx', name: 'Your Language Name' },

  styles: {
    // Add 3-4 style presets that make sense in your language
    // Each style needs: label, intro(name), personality, rules(name)
    style1: {
      label: 'description of this style',
      intro: (name) => `You are ${name}. ...`,
      personality: 'Personality description',
      rules: (name) => `1. Rule 1\n2. Rule 2\n...`,
    },
    // ... add more styles
  },

  customIntro: (name) => `You are ${name}. ...`,
  customPersonality: 'Friendly',
  customRules: (style) => `1. Use this style: ${style}\n2. ...`,

  prompt: {
    profile: (name) => `PROFILE: ${name}\n- Developer\n- ...`,
    timeContext: 'TIME CONTEXT:',
    timeNote: (name) => `Note: ${name} could be doing anything.`,
    rulesHeader: 'REPLY RULES:',
    closing: (name) => `_~autoreply by ${name.toLowerCase()}_`,
    closingRule: (name) => `End every message with: _~autoreply by ${name.toLowerCase()}_`,
  },

  context: {
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    weekend: 'weekend',
    weekday: 'weekday',
    time: {
      subuh:          { label: 'dawn',          activity: 'sleeping' },
      pagi:           { label: 'morning',       activity: 'waking up' },
      menjelangSiang: { label: 'late morning',  activity: 'working' },
      siang:          { label: 'noon',          activity: 'lunch' },
      sore:           { label: 'afternoon',     activity: 'relaxing' },
      petang:         { label: 'early evening', activity: 'dinner' },
      malam:          { label: 'evening',       activity: 'relaxing' },
      malamLarut:     { label: 'late night',    activity: 'sleeping' },
      tengahMalam:    { label: 'midnight',      activity: 'sleeping' },
    },
    possibleActivity: 'Possible activity',
    dateFormat: (day, date, month, year, dayType) => `${day}, ${month} ${date}, ${year} (${dayType})`,
  },

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
    awayOffDetail: "Bot won't reply.",
    // ... translate all cmd.* keys from id.js or en.js
  },

  web: {
    title: 'AutoWA Bot',
    connected: 'Bot Connected!',
    connectedDesc: 'WhatsApp connected. Bot running.',
    waitingQr: 'Waiting for QR Code...',
    waitingDesc: 'Auto-refresh.',
    scanTitle: 'Scan QR Code',
    scanInstructions: 'Open WhatsApp → Settings → Linked Devices → Link a Device',
    secondsLeft: 'seconds left',
    expired: 'Expired',
  },
};
