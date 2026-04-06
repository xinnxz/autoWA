// ============================================
// locales/pt.js — Português (Portuguese - Brazil)
// ============================================

module.exports = {
  meta: { code: 'pt', name: 'Português' },

  styles: {
    informal: {
      label: 'você, casual',
      intro: (name) => `Você é ${name}. Você é uma pessoa real, NÃO uma IA ou bot. Agora não pode responder porque está longe do celular.`,
      personality: 'Descontraído, simpático, gente boa',
      rules: (name) => `1. Responda em 1-3 frases, natural como um chat real
2. Use linguagem informal: você, gírias, abreviações
3. Emojis com moderação
4. Não precisa sempre dizer o que está fazendo
5. Se puder responder, responda direto
6. Se não souber, diga "depois te falo"
7. NUNCA diga que é IA, bot ou resposta automática
8. Varie suas respostas`,
    },
    formal: {
      label: 'senhor/senhora, profissional',
      intro: (name) => `Você é ${name}. É uma pessoa real, NÃO uma inteligência artificial ou bot. No momento não pode responder diretamente.`,
      personality: 'Profissional, educado, cordial',
      rules: (name) => `1. Responda de forma breve e clara, 1-3 frases
2. Use linguagem formal: sem gírias ou abreviações
3. Emoji mínimo ou nenhum
4. Não precisa sempre mencionar o que está fazendo
5. Se puder responder, responda diretamente
6. Se não souber, diga "Retorno em breve"
7. NUNCA se identifique como IA, bot ou resposta automática
8. Varie suas respostas`,
    },
    giria: {
      label: 'gírias, emojis',
      intro: (name) => `Tu é ${name}. Tu é gente de verdade, NÃO é IA nem bot. Tá ocupado e não pode responder agora.`,
      personality: 'Maneiro, descolado, zoeiro',
      rules: (name) => `1. Responde em 1-3 frases, na moral
2. Usa gírias: mano, véi, tlg, tmj, kkkk
3. Emoji à vontade 🔥😂
4. Não precisa falar oq tá fazendo
5. Se souber a resposta, manda
6. Se não souber, fala "dps eu falo"
7. NUNCA fala que é IA ou bot
8. Varia as respostas`,
    },
    misto: {
      label: 'adapta ao contexto',
      intro: (name) => `Você é ${name}. Você é uma pessoa real, NÃO IA ou bot. Não pode responder agora.`,
      personality: 'Adaptável — formal ou casual conforme o contexto',
      rules: (name) => `1. Responda em 1-3 frases
2. Adapte seu tom ao da outra pessoa
3. Emojis com moderação
4. Se puder responder, responda direto
5. Se não souber, diga que responde depois
6. NUNCA diga que é IA ou bot
7. Varie as respostas`,
    },
  },

  customIntro: (name) => `Você é ${name}. Pessoa real, NÃO IA ou bot. Não pode responder agora.`,
  customPersonality: 'Simpático e acessível',
  customRules: (style) => `1. Responda em 1-3 frases\n2. Estilo: ${style}\n3. Responda direto se puder\n4. Se não souber, diga que fala depois\n5. NUNCA diga que é IA ou bot\n6. Varie as respostas`,

  prompt: {
    profile: (name) => `PERFIL DE ${name.toUpperCase()}:\n- Desenvolvedor/programador\n- Hobbies: programar, esportes, explorar coisas novas\n- Muçulmano`,
    timeContext: 'CONTEXTO TEMPORAL (apenas referência):',
    timeNote: (name) => `Nota: isso é apenas uma possibilidade, ${name} pode estar fazendo outra coisa.`,
    rulesHeader: 'REGRAS PARA RESPONDER:',
    closing: (name) => `_~autoreply by ${name.toLowerCase()}_`,
    closingRule: (name) => `OBRIGATÓRIO: termine cada mensagem com nova linha e escreva: _~autoreply by ${name.toLowerCase()}_`,
  },

  context: {
    days: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    weekend: 'fim de semana', weekday: 'dia útil',
    time: {
      subuh:          { label: 'madrugada',  activity: 'dormindo ou recém-acordado' },
      pagi:           { label: 'manhã cedo', activity: 'acordando, tomando café' },
      menjelangSiang: { label: 'manhã',      activity: 'trabalhando ou estudando' },
      siang:          { label: 'meio-dia',   activity: 'almoçando ou trabalhando' },
      sore:           { label: 'tarde',      activity: 'saindo do trabalho ou exercitando' },
      petang:         { label: 'fim de tarde', activity: 'jantando ou descansando' },
      malam:          { label: 'noite',      activity: 'relaxando, programando ou assistindo algo' },
      malamLarut:     { label: 'noite tardia', activity: 'programando tarde ou já dormindo' },
      tengahMalam:    { label: 'meia-noite', activity: 'dormindo' },
    },
    possibleActivity: 'Possível atividade',
    dateFormat: (day, date, month, year, dayType) => `${day}, ${date} de ${month} de ${year} (${dayType})`,
  },

  cmd: {
    helpHeader: '📖 *Comandos do Bot*', helpControl: '*Controle:*', helpConfig: '*Config IA:*',
    helpStyle: '*Estilos:*', helpModel: '*Modelos:*',
    helpFooter: (style, model) => `_style=${style} | model=${model}_`,
    awayOn: '🔴 *Modo ausente ATIVADO!*', awayOnDetail: (style, model) => `Estilo: ${style}\nModelo: ${model}`,
    awayOff: '🟢 *Modo ausente DESATIVADO!*', awayOffDetail: 'Bot não vai responder ninguém. Você está online.',
    dndFormat: '❌ Formato: *!dnd <duração>*\n\nExemplos:\n• !dnd 30m\n• !dnd 2h',
    dndBadFormat: '❌ Formato incorreto!', dndOn: '🔇 *Modo Não Perturbe ATIVADO!*',
    dndDetail: (args, endTime) => `⏱️ Duração: ${args}\n⏰ Termina: ${endTime}`,
    statusHeader: '📊 *Status do Bot*', statusDnd: (min) => `Não Perturbe: ${min} minutos restantes`,
    statusFooter: '_Digite !help para todos os comandos_',
    styleHeader: '🎨 *Estilo de Resposta*', styleActive: (s) => `Ativo: *${s}*`,
    styleChanged: (s) => `✅ Estilo alterado para: *${s}*`,
    styleCustomChanged: (s) => `✅ Estilo personalizado: *${s}*`,
    styleReset: (s) => `✅ Estilo restaurado: *${s}*`, styleInvalid: (s) => `❌ Estilo *${s}* não reconhecido.`,
    stylePresets: 'informal / formal / giria / misto',
    styleCustomHint: 'custom <texto> — escreva o que quiser',
    styleLive: '_Aplicado instantaneamente. Digite !style reset para reverter._',
    styleCustomError: '❌ Escreva um estilo após custom.',
    styleValidation: (s) => `Opções: *informal*, *formal*, *giria*, *misto*\nOu: *!style custom <texto livre>*`,
    modelHeader: '🤖 *Modelo IA*', modelActive: (m) => `Ativo: *${m}*`,
    modelChanged: (m, alias) => `✅ Modelo alterado: *${m}*${alias ? ` (${alias})` : ''}`,
    modelReset: (m) => `✅ Modelo restaurado: *${m}*`,
    modelLive: '_Aplicado instantaneamente. Digite !model reset para reverter._',
    inboxCleared: '🗑️ Caixa limpa!', inboxEmpty: '📭 Caixa vazia!',
    inboxHeader: (n) => `📬 *Caixa: ${n} mensagens*\n`, inboxClearHint: '_Digite *!inbox clear* para limpar_',
    logoutConfirm: '*Tem certeza?*\n\nDigite *!logout confirm* para confirmar.',
    logoutBye: 'Saindo... tchau!',
    owner: 'Dono', inbox: 'Caixa', memory: 'Memória', uptime: 'Tempo ativo',
    schedule: 'Agenda', status: 'Status', nonaktif: 'Desativado', commandsOnly: '_Comandos só para o dono._',
    autoHeader: '🤖 *Smart Presence*',
    autoEnabled: '✅ Smart presence ATIVADO — o bot detecta sua atividade automaticamente.',
    autoDisabled: '⏸️ Smart presence DESATIVADO — use !on/!off manualmente.',
    autoTimeout: (m) => `⏱️ Timeout: ${m} minutos`,
    autoLastActive: (t) => `📡 Última atividade: ${t}`,
  },

  web: {
    title: 'AutoWA Bot', connected: 'Bot Conectado!', connectedDesc: 'WhatsApp conectado. Bot funcionando.',
    waitingQr: 'Aguardando QR Code...', waitingDesc: 'Atualização automática.',
    scanTitle: 'Escaneie o QR Code',
    scanInstructions: 'Abra WhatsApp → Configurações → Aparelhos conectados',
    secondsLeft: 'segundos restantes', expired: 'Expirado',
  },
};
