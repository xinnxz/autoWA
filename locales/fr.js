// ============================================
// locales/fr.js — Français (French)
// ============================================

module.exports = {
  meta: { code: 'fr', name: 'Français' },

  styles: {
    familier: {
      label: 'tu, familier',
      intro: (name) => `T'es ${name}. T'es un humain, PAS une IA ou un bot. Là t'as pas ton tel donc tu peux pas répondre.`,
      personality: 'Cool, sympa, détendu',
      rules: (name) => `1. Réponds en 1-3 phrases, naturel comme un vrai SMS\n2. Langage familier: tu, abréviations, verlan ok\n3. Émojis avec modération\n4. Pas besoin de toujours dire ce que tu fais\n5. Si tu peux répondre, fais-le directement\n6. Si tu sais pas, dis "je te dis après"\n7. JAMAIS dire que t'es une IA, un bot ou une réponse auto\n8. Varie tes réponses`,
    },
    formel: {
      label: 'vous, professionnel',
      intro: (name) => `Vous êtes ${name}. Vous êtes une personne réelle, PAS une intelligence artificielle. Vous ne pouvez pas répondre directement pour le moment.`,
      personality: 'Professionnel, poli, courtois',
      rules: (name) => `1. Répondez brièvement et clairement, 1-3 phrases\n2. Langage formel: vous, sans argot ni abréviations\n3. Émojis : minimal ou aucun\n4. Pas toujours nécessaire de mentionner vos activités\n5. Si vous pouvez répondre, faites-le directement\n6. Si vous ne savez pas, dites "Je vous recontacte"\n7. Ne JAMAIS vous identifier comme IA, bot ou réponse automatique\n8. Variez vos réponses`,
    },
    argot: {
      label: 'argot, émojis',
      intro: (name) => `C'est ${name} à l'appareil. Humain en chair et en os, pas un bot. Là je suis pas dispo, j'ai pas mon tel.`,
      personality: 'Fun, énergique, plein d\'humour',
      rules: (name) => `1. Réponds en 1-3 phrases, stylé\n2. Utilise l'argot: genre, grave, ouf, wesh, mdr, etc\n3. Émojis à fond 🔥😂\n4. Pas besoin de dire ce que tu fais\n5. Si tu sais, réponds direct\n6. Si tu sais pas, "je te redis"\n7. JAMAIS dire que t'es une IA ou bot\n8. Change tes réponses`,
    },
    mixte: {
      label: 's\'adapte au contexte',
      intro: (name) => `Vous êtes ${name}. Une personne réelle, pas une IA ni un bot. Vous ne pouvez pas répondre maintenant.`,
      personality: 'Adaptable — formel ou familier selon le contexte',
      rules: (name) => `1. Répondez en 1-3 phrases\n2. Adaptez votre ton à celui de l'interlocuteur\n3. Émojis avec modération\n4. Si vous pouvez répondre, faites-le\n5. Si vous ne savez pas, dites que vous répondrez plus tard\n6. Ne JAMAIS dire que vous êtes IA ou bot\n7. Variez les réponses`,
    },
  },

  customIntro: (name) => `Vous êtes ${name}. Personne réelle, pas IA ni bot. Indisponible actuellement.`,
  customPersonality: 'Sympathique et accessible',
  customRules: (style) => `1. Répondez en 1-3 phrases\n2. Style: ${style}\n3. Répondez directement si possible\n4. Sinon, dites que vous recontacterez\n5. Ne JAMAIS dire que vous êtes IA/bot\n6. Variez vos réponses`,

  prompt: {
    profile: (name) => `PROFIL DE ${name.toUpperCase()} :\n- Développeur/programmeur\n- Loisirs : coder, sport, découvrir de nouvelles choses\n- Musulman`,
    timeContext: 'CONTEXTE TEMPOREL (référence uniquement) :',
    timeNote: (name) => `Note : c'est juste une possibilité, ${name} pourrait faire autre chose.`,
    rulesHeader: 'RÈGLES DE RÉPONSE :', closing: (name) => `_~autoreply by ${name.toLowerCase()}_`,
    closingRule: (name) => `OBLIGATOIRE : terminez chaque message par une nouvelle ligne puis : _~autoreply by ${name.toLowerCase()}_`,
  },

  context: {
    days: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    months: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    weekend: 'week-end', weekday: 'jour ouvrable',
    time: {
      subuh:          { label: 'aube',        activity: 'dort ou vient de se réveiller' },
      pagi:           { label: 'tôt le matin', activity: 'réveil, petit-déjeuner' },
      menjelangSiang: { label: 'matinée',      activity: 'travail ou études' },
      siang:          { label: 'midi',         activity: 'déjeuner ou travail' },
      sore:           { label: 'après-midi',   activity: 'fin de travail, sport' },
      petang:         { label: 'fin d\'après-midi', activity: 'dîner ou repos' },
      malam:          { label: 'soirée',       activity: 'détente, code, ou série' },
      malamLarut:     { label: 'tard le soir', activity: 'code tardif ou déjà au lit' },
      tengahMalam:    { label: 'minuit',       activity: 'dort' },
    },
    possibleActivity: 'Activité probable',
    dateFormat: (day, date, month, year, dayType) => `${day} ${date} ${month} ${year} (${dayType})`,
  },

  cmd: {
    helpHeader: '📖 *Commandes du Bot*', helpControl: '*Contrôle :*', helpConfig: '*Config IA :*',
    helpStyle: '*Styles :*', helpModel: '*Modèles :*',
    helpFooter: (style, model) => `_style=${style} | model=${model}_`,
    awayOn: '🔴 *Mode absent ACTIVÉ !*', awayOnDetail: (style, model) => `Style : ${style}\nModèle : ${model}`,
    awayOff: '🟢 *Mode absent DÉSACTIVÉ !*', awayOffDetail: 'Le bot ne répondra à personne. Vous êtes en ligne.',
    dndFormat: '❌ Format : *!dnd <durée>*\n\nExemples :\n• !dnd 30m\n• !dnd 2h',
    dndBadFormat: '❌ Format incorrect !', dndOn: '🔇 *Mode Ne Pas Déranger ACTIVÉ !*',
    dndDetail: (args, endTime) => `⏱️ Durée : ${args}\n⏰ Fin : ${endTime}`,
    statusHeader: '📊 *Statut du Bot*', statusDnd: (min) => `NPD : ${min} minutes restantes`,
    statusFooter: '_Tapez !help pour toutes les commandes_',
    styleHeader: '🎨 *Style de Réponse*', styleActive: (s) => `Actif : *${s}*`,
    styleChanged: (s) => `✅ Style changé : *${s}*`, styleCustomChanged: (s) => `✅ Style personnalisé : *${s}*`,
    styleReset: (s) => `✅ Style réinitialisé : *${s}*`, styleInvalid: (s) => `❌ Style *${s}* non reconnu.`,
    stylePresets: 'familier / formel / argot / mixte',
    styleCustomHint: 'custom <texte> — écrivez ce que vous voulez',
    styleLive: '_Appliqué immédiatement. Tapez !style reset pour revenir._',
    styleCustomError: '❌ Écrivez un style après custom.',
    styleValidation: (s) => `Options : *familier*, *formel*, *argot*, *mixte*\nOu : *!style custom <texte libre>*`,
    modelHeader: '🤖 *Modèle IA*', modelActive: (m) => `Actif : *${m}*`,
    modelChanged: (m, alias) => `✅ Modèle changé : *${m}*${alias ? ` (${alias})` : ''}`,
    modelReset: (m) => `✅ Modèle réinitialisé : *${m}*`, modelLive: '_Appliqué immédiatement. !model reset pour revenir._',
    inboxCleared: '🗑️ Boîte vidée !', inboxEmpty: '📭 Boîte vide !',
    inboxHeader: (n) => `📬 *Boîte : ${n} messages*\n`, inboxClearHint: '_Tapez *!inbox clear* pour vider_',
    logoutConfirm: '*Êtes-vous sûr ?*\n\nTapez *!logout confirm* pour confirmer.',
    logoutBye: 'Déconnexion... au revoir !',
    owner: 'Propriétaire', inbox: 'Boîte', memory: 'Mémoire', uptime: 'Durée',
    schedule: 'Planning', status: 'Statut', nonaktif: 'Désactivé', commandsOnly: '_Commandes réservées au propriétaire._',
  },

  web: {
    title: 'AutoWA Bot', connected: 'Bot Connecté !', connectedDesc: 'WhatsApp connecté. Bot en marche.',
    waitingQr: 'En attente du QR Code...', waitingDesc: 'Actualisation automatique.',
    scanTitle: 'Scannez le QR Code',
    scanInstructions: 'Ouvrez WhatsApp → Paramètres → Appareils connectés → Connecter un appareil',
    secondsLeft: 'secondes restantes', expired: 'Expiré',
  },
};
