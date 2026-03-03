// ============================================
// locales/hi.js — हिन्दी (Hindi)
// ============================================

module.exports = {
  meta: { code: 'hi', name: 'हिन्दी' },

  styles: {
    casual: {
      label: 'तू-तड़ाक, कैजुअल',
      intro: (name) => `तुम ${name} हो। तुम एक इंसान हो, AI या बोट नहीं। अभी फोन हाथ में नहीं है इसलिए रिप्लाई नहीं कर पा रहे।`,
      personality: 'दोस्ताना, मज़ाकिया, कूल',
      rules: (name) => `1. 1-3 लाइन में नैचुरल रिप्लाई करो\n2. कैजुअल हिंदी: तू-तुम, स्लैंग ओके\n3. इमोजी यूज़ करो\n4. हमेशा ये नहीं बताना कि क्या कर रहे हो\n5. अगर जवाब दे सकते हो तो सीधे दो\n6. नहीं पता तो बोलो "बाद में बताता हूँ"\n7. कभी मत बोलो कि AI, बोट, या ऑटो-रिप्लाई हो\n8. रिप्लाई में वैरायटी रखो`,
    },
    formal: {
      label: 'आप, शिष्ट',
      intro: (name) => `आप ${name} हैं। आप एक वास्तविक व्यक्ति हैं, AI या बोट नहीं। इस समय आप सीधे उत्तर देने में असमर्थ हैं।`,
      personality: 'शिष्ट, पेशेवर, विनम्र',
      rules: (name) => `1. 1-3 वाक्यों में संक्षेप में उत्तर दें\n2. शुद्ध हिंदी का प्रयोग करें, कोई स्लैंग नहीं\n3. इमोजी न्यूनतम\n4. हर बार यह बताने की आवश्यकता नहीं कि क्या कर रहे हैं\n5. यदि उत्तर दे सकते हैं तो सीधे दें\n6. यदि नहीं पता तो कहें "बाद में सूचित करूँगा"\n7. कभी न कहें कि आप AI, बोट, या ऑटो-रिप्लाई हैं\n8. उत्तरों में विविधता रखें`,
    },
    desi: {
      label: 'देसी स्लैंग, इमोजी',
      intro: (name) => `भाई ये ${name} है। रियल इंसान है, कोई AI-VAI नहीं। अभी फ़ोन नहीं है हाथ में, इसलिए रिप्लाई नहीं हो रहा।`,
      personality: 'बिंदास, मस्त, फुल मस्ती',
      rules: (name) => `1. 1-3 लाइन में बिंदास रिप्लाई\n2. देसी स्लैंग: यार, भाई, बोस, चल, पक्का, etc\n3. इमोजी भरपूर 🔥😂\n4. कोई ज़रूरत नहीं बताने की क्या कर रहे\n5. पता है तो बता दो\n6. नहीं पता तो "बाद में बताऊंगा भाई"\n7. AI-बोट कभी मत बोलो\n8. हर बार अलग रिप्लाई`,
    },
    mixed: {
      label: 'हिंग्लिश मिक्स',
      intro: (name) => `Tum ${name} ho. Tum real person ho, AI ya bot nahi. Abhi phone pe nahi ho isliye reply nahi kar pa rahe.`,
      personality: 'Flexible — Hindi, English ya Hinglish as needed',
      rules: (name) => `1. 1-3 lines me reply karo\n2. Hindi-English mix karo naturally (Hinglish)\n3. Emoji moderate\n4. Agar jawab de sakte ho toh do\n5. Nahi pata toh "baad me bata dunga"\n6. Kabhi mat bolo ki AI ya bot ho\n7. Replies me variety rakho`,
    },
  },

  customIntro: (name) => `तुम ${name} हो। तुम इंसान हो, AI या बोट नहीं। अभी रिप्लाई नहीं कर सकते।`,
  customPersonality: 'दोस्ताना और मददगार',
  customRules: (style) => `1. 1-3 लाइन में रिप्लाई\n2. स्टाइल: ${style}\n3. सीधे जवाब दो\n4. नहीं पता तो बाद में बताओ\n5. AI/बोट कभी मत बोलो\n6. रिप्लाई में वैरायटी`,

  prompt: {
    profile: (name) => `${name.toUpperCase()} का प्रोफ़ाइल:\n- डेवलपर/प्रोग्रामर\n- शौक: कोडिंग, खेल, नई चीज़ें सीखना\n- मुस्लिम`,
    timeContext: 'समय संदर्भ (केवल संदर्भ):',
    timeNote: (name) => `नोट: यह केवल संभावना है, ${name} कुछ और भी कर सकते हैं।`,
    rulesHeader: 'रिप्लाई के नियम:', closing: (name) => `_~autoreply by ${name.toLowerCase()}_`,
    closingRule: (name) => `ज़रूरी: हर मैसेज के अंत में नई लाइन पर लिखो: _~autoreply by ${name.toLowerCase()}_`,
  },

  context: {
    days: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
    months: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
    weekend: 'छुट्टी', weekday: 'कार्यदिवस',
    time: {
      subuh:          { label: 'भोर',    activity: 'सो रहे या अभी उठे' },
      pagi:           { label: 'सुबह',   activity: 'उठना, नाश्ता' },
      menjelangSiang: { label: 'दोपहर से पहले', activity: 'काम या पढ़ाई' },
      siang:          { label: 'दोपहर',  activity: 'लंच या काम' },
      sore:           { label: 'शाम',    activity: 'काम ख़त्म, एक्सरसाइज़' },
      petang:         { label: 'संध्या',  activity: 'डिनर या आराम' },
      malam:          { label: 'रात',    activity: 'आराम, कोडिंग, या देख रहे कुछ' },
      malamLarut:     { label: 'देर रात', activity: 'लेट नाइट कोडिंग या सो गए' },
      tengahMalam:    { label: 'आधी रात', activity: 'सो रहे' },
    },
    possibleActivity: 'संभावित गतिविधि',
    dateFormat: (day, date, month, year, dayType) => `${day}, ${date} ${month} ${year} (${dayType})`,
  },

  cmd: {
    helpHeader: '📖 *बोट कमांड्स*', helpControl: '*कंट्रोल:*', helpConfig: '*AI सेटिंग्स:*',
    helpStyle: '*स्टाइल:*', helpModel: '*मॉडल:*',
    helpFooter: (style, model) => `_style=${style} | model=${model}_`,
    awayOn: '🔴 *अवे मोड ऑन!*', awayOnDetail: (style, model) => `स्टाइल: ${style}\nमॉडल: ${model}`,
    awayOff: '🟢 *अवे मोड ऑफ!*', awayOffDetail: 'बोट किसी को रिप्लाई नहीं करेगा। तुम ऑनलाइन हो।',
    dndFormat: '❌ फ़ॉर्मेट: *!dnd <समय>*\n\nउदाहरण:\n• !dnd 30m\n• !dnd 2h',
    dndBadFormat: '❌ ग़लत फ़ॉर्मेट!', dndOn: '🔇 *DND मोड ऑन!*',
    dndDetail: (args, endTime) => `⏱️ अवधि: ${args}\n⏰ ख़त्म: ${endTime}`,
    statusHeader: '📊 *बोट स्टेटस*', statusDnd: (min) => `DND: ${min} मिनट बाक़ी`,
    statusFooter: '_!help टाइप करो सब कमांड्स के लिए_',
    styleHeader: '🎨 *रिप्लाई स्टाइल*', styleActive: (s) => `एक्टिव: *${s}*`,
    styleChanged: (s) => `✅ स्टाइल बदला: *${s}*`, styleCustomChanged: (s) => `✅ कस्टम स्टाइल: *${s}*`,
    styleReset: (s) => `✅ स्टाइल रीसेट: *${s}*`, styleInvalid: (s) => `❌ स्टाइल *${s}* पहचाना नहीं गया।`,
    stylePresets: 'casual / formal / desi / mixed',
    styleCustomHint: 'custom <टेक्स्ट> — जो चाहो लिखो',
    styleLive: '_तुरंत लागू। !style reset से वापस।_',
    styleCustomError: '❌ custom के बाद स्टाइल लिखो।',
    styleValidation: (s) => `विकल्प: *casual*, *formal*, *desi*, *mixed*\nया: *!style custom <फ्री टेक्स्ट>*`,
    modelHeader: '🤖 *AI मॉडल*', modelActive: (m) => `एक्टिव: *${m}*`,
    modelChanged: (m, alias) => `✅ मॉडल बदला: *${m}*${alias ? ` (${alias})` : ''}`,
    modelReset: (m) => `✅ मॉडल रीसेट: *${m}*`, modelLive: '_तुरंत लागू। !model reset से वापस।_',
    inboxCleared: '🗑️ इनबॉक्स साफ़!', inboxEmpty: '📭 इनबॉक्स ख़ाली!',
    inboxHeader: (n) => `📬 *इनबॉक्स: ${n} मैसेज*\n`, inboxClearHint: '_*!inbox clear* से साफ़ करो_',
    logoutConfirm: '*पक्का लॉगआउट करना है?*\n\n*!logout confirm* टाइप करो।',
    logoutBye: 'लॉगआउट हो रहा है...',
    owner: 'ओनर', inbox: 'इनबॉक्स', memory: 'मेमोरी', uptime: 'अपटाइम',
    schedule: 'शेड्यूल', status: 'स्टेटस', nonaktif: 'बंद', commandsOnly: '_सिर्फ़ ओनर के कमांड्स।_',
  },

  web: {
    title: 'AutoWA Bot', connected: 'बोट कनेक्टेड!', connectedDesc: 'WhatsApp कनेक्टेड। बोट चल रहा है।',
    waitingQr: 'QR कोड का इंतज़ार...', waitingDesc: 'ऑटो-रिफ़्रेश होगा।',
    scanTitle: 'QR कोड स्कैन करो',
    scanInstructions: 'WhatsApp खोलो → Settings → Linked Devices → Link a Device',
    secondsLeft: 'सेकंड बाक़ी', expired: 'एक्सपायर',
  },
};
