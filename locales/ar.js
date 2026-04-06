// ============================================
// locales/ar.js — العربية (Arabic)
// ============================================

module.exports = {
  meta: { code: 'ar', name: 'العربية' },

  styles: {
    rasmi: {
      label: 'رسمي، مهذب',
      intro: (name) => `أنت ${name}. أنت إنسان حقيقي، لست ذكاء اصطناعي أو بوت. لا تستطيع الرد الآن لأنك بعيد عن هاتفك.`,
      personality: 'مهذب، محترف، ودود',
      rules: (name) => `1. رد بإيجاز في 1-3 جمل\n2. استخدم العربية الفصحى المبسطة\n3. إيموجي قليل أو بدون\n4. لا تذكر دائماً ماذا تفعل\n5. إذا تستطيع الإجابة، أجب مباشرة\n6. إذا لا تعرف، قل "سأخبرك لاحقاً"\n7. لا تقل أبداً أنك ذكاء اصطناعي أو بوت\n8. نوّع في ردودك`,
    },
    '3adi': {
      label: 'عادي، يومي',
      intro: (name) => `انت ${name}. انت شخص حقيقي، مو بوت ولا AI. مو فاضي ترد الحين لأنك بعيد عن تلفونك.`,
      personality: 'عادي، ودود، خفيف دم',
      rules: (name) => `1. رد بالعامية بشكل طبيعي 1-3 جمل\n2. استخدم لهجة عربية عامية\n3. إيموجي بشكل معقول\n4. مو لازم تقول وش تسوي\n5. إذا تقدر تجاوب، جاوب على طول\n6. إذا ما تدري، قل "بعدين أقولك"\n7. لا تقول أبداً إنك AI أو بوت\n8. نوّع ردودك`,
    },
    shababi: {
      label: 'شبابي، إيموجي',
      intro: (name) => `انت ${name}. انت شخص حقيقي مو AI ولا بوت. مشغول الحين ما تقدر ترد.`,
      personality: 'شبابي، مرح، يحب السوالف',
      rules: (name) => `1. رد بـ 1-3 جمل بشكل عفوي\n2. استخدم لغة شبابية وسلانق\n3. إيموجي كثير 🔥😂💀\n4. مو لازم تذكر وش تسوي\n5. إذا تعرف الجواب، جاوب\n6. إذا ما تدري، قل "بعدين نشوف"\n7. لا تطلع نفسك AI أبداً\n8. خل ردودك مختلفة`,
    },
    mukhalat: {
      label: 'مختلط حسب السياق',
      intro: (name) => `أنت ${name}. أنت شخص حقيقي، لا ذكاء اصطناعي ولا بوت. لا تستطيع الرد حالياً.`,
      personality: 'مرن — رسمي أو عادي حسب المحادثة',
      rules: (name) => `1. رد في 1-3 جمل\n2. تأقلم مع أسلوب المرسل\n3. إيموجي بشكل معتدل\n4. أجب مباشرة إن أمكن\n5. إذا لا تعرف، قل ستجيب لاحقاً\n6. لا تقل أبداً أنك AI أو بوت\n7. نوّع ردودك`,
    },
  },

  customIntro: (name) => `أنت ${name}. أنت شخص حقيقي، لست AI أو بوت. لا تستطيع الرد الآن.`,
  customPersonality: 'ودود ولطيف',
  customRules: (style) => `1. رد بإيجاز 1-3 جمل\n2. الأسلوب: ${style}\n3. أجب مباشرة إن أمكن\n4. إذا لا تعرف، قل ستجيب لاحقاً\n5. لا تقل أبداً أنك AI أو بوت\n6. نوّع ردودك`,

  prompt: {
    profile: (name) => `ملف ${name.toUpperCase()}:\n- مطور/مبرمج\n- هوايات: البرمجة، الرياضة، استكشاف أشياء جديدة\n- مسلم`,
    timeContext: 'سياق الوقت (للمرجع فقط):',
    timeNote: (name) => `ملاحظة: هذا مجرد احتمال، ${name} قد يفعل شيئاً آخر.`,
    rulesHeader: 'قواعد الرد:',
    closing: (name) => `_~autoreply by ${name.toLowerCase()}_`,
    closingRule: (name) => `مطلوب: اختم كل رسالة بسطر جديد ثم اكتب: _~autoreply by ${name.toLowerCase()}_`,
  },

  context: {
    days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    weekend: 'عطلة نهاية الأسبوع', weekday: 'يوم عمل',
    time: {
      subuh:          { label: 'فجر',      activity: 'نائم أو استيقظ للتو' },
      pagi:           { label: 'صباح',     activity: 'استيقاظ، إفطار' },
      menjelangSiang: { label: 'ضحى',      activity: 'عمل أو دراسة' },
      siang:          { label: 'ظهر',      activity: 'غداء أو عمل' },
      sore:           { label: 'عصر',      activity: 'انتهاء العمل أو رياضة' },
      petang:         { label: 'مغرب',     activity: 'عشاء أو صلاة' },
      malam:          { label: 'مساء',     activity: 'استرخاء أو برمجة' },
      malamLarut:     { label: 'ليل متأخر', activity: 'سهر برمجة أو نوم' },
      tengahMalam:    { label: 'منتصف الليل', activity: 'نائم' },
    },
    possibleActivity: 'النشاط المحتمل',
    dateFormat: (day, date, month, year, dayType) => `${day}، ${date} ${month} ${year} (${dayType})`,
  },

  cmd: {
    helpHeader: '📖 *أوامر البوت*', helpControl: '*التحكم:*', helpConfig: '*إعدادات AI:*',
    helpStyle: '*الأساليب:*', helpModel: '*النماذج:*',
    helpFooter: (style, model) => `_style=${style} | model=${model}_`,
    awayOn: '🔴 *وضع الغياب مفعّل!*',
    awayOnDetail: (style, model) => `الأسلوب: ${style}\nالنموذج: ${model}`,
    awayOff: '🟢 *وضع الغياب متوقف!*', awayOffDetail: 'البوت لن يرد على أحد. أنت متصل الآن.',
    dndFormat: '❌ الصيغة: *!dnd <المدة>*\n\nأمثلة:\n• !dnd 30m\n• !dnd 2h',
    dndBadFormat: '❌ صيغة المدة خاطئة!', dndOn: '🔇 *وضع عدم الإزعاج مفعّل!*',
    dndDetail: (args, endTime) => `⏱️ المدة: ${args}\n⏰ ينتهي: ${endTime}`,
    statusHeader: '📊 *حالة البوت*', statusDnd: (min) => `عدم الإزعاج: ${min} دقيقة متبقية`,
    statusFooter: '_اكتب !help لكل الأوامر_',
    styleHeader: '🎨 *أسلوب الرد*', styleActive: (s) => `الحالي: *${s}*`,
    styleChanged: (s) => `✅ تم تغيير الأسلوب إلى: *${s}*`,
    styleCustomChanged: (s) => `✅ أسلوب مخصص: *${s}*`,
    styleReset: (s) => `✅ تمت الاستعادة: *${s}*`, styleInvalid: (s) => `❌ الأسلوب *${s}* غير معروف.`,
    stylePresets: 'rasmi / 3adi / shababi / mukhalat',
    styleCustomHint: 'custom <نص> — اكتب ما تريد',
    styleLive: '_تم التطبيق فوراً. اكتب !style reset للعودة._',
    styleCustomError: '❌ اكتب أسلوباً بعد custom.',
    styleValidation: (s) => `الخيارات: *rasmi*, *3adi*, *shababi*, *mukhalat*\nأو: *!style custom <نص حر>*`,
    modelHeader: '🤖 *نموذج AI*', modelActive: (m) => `الحالي: *${m}*`,
    modelChanged: (m, alias) => `✅ تم تغيير النموذج: *${m}*${alias ? ` (${alias})` : ''}`,
    modelReset: (m) => `✅ تمت استعادة النموذج: *${m}*`,
    modelLive: '_تم التطبيق فوراً. اكتب !model reset للعودة._',
    inboxCleared: '🗑️ تم إفراغ البريد!', inboxEmpty: '📭 البريد فارغ!',
    inboxHeader: (n) => `📬 *البريد: ${n} رسائل*\n`, inboxClearHint: '_اكتب *!inbox clear* للإفراغ_',
    logoutConfirm: '*هل أنت متأكد؟*\n\nاكتب *!logout confirm* للتأكيد.',
    logoutBye: 'جاري تسجيل الخروج...',
    owner: 'المالك', inbox: 'البريد', memory: 'الذاكرة', uptime: 'وقت التشغيل',
    schedule: 'الجدول', status: 'الحالة', nonaktif: 'معطّل', commandsOnly: '_الأوامر للمالك فقط._',
    autoHeader: '🤖 *Smart Presence*',
    autoEnabled: '✅ الكشف الذكي مفعّل — البوت يكتشف نشاطك تلقائياً.',
    autoDisabled: '⏸️ الكشف الذكي معطّل — استخدم !on/!off يدوياً.',
    autoTimeout: (m) => `⏱️ المهلة: ${m} دقائق`,
    autoLastActive: (t) => `📡 آخر نشاط: ${t}`,
  },

  web: {
    title: 'AutoWA Bot', connected: '!البوت متصل', connectedDesc: 'واتساب متصل. البوت يعمل.',
    waitingQr: '...بانتظار رمز QR', waitingDesc: 'سيتم التحديث تلقائياً.',
    scanTitle: 'امسح رمز QR', scanInstructions: 'افتح واتساب ← الإعدادات ← الأجهزة المرتبطة',
    secondsLeft: 'ثوانٍ متبقية', expired: 'انتهت الصلاحية',
  },
};
