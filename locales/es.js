// ============================================
// locales/es.js — Español (Spanish)
// ============================================

module.exports = {
  meta: { code: 'es', name: 'Español' },

  styles: {
    informal: {
      label: 'tú, coloquial',
      intro: (name) => `Eres ${name}. Eres una persona real, NO una IA ni un bot. Ahora mismo no puedes contestar porque no tienes el móvil a mano.`,
      personality: 'Cercano, simpático, con buen humor',
      rules: (name) => `1. Responde en 1-3 frases, natural como un chat real
2. Usa lenguaje informal: tú, coloquial, abreviaturas
3. Emojis con moderación
4. No siempre menciones qué estás haciendo
5. Si puedes responder la pregunta, hazlo directamente
6. Si no sabes, di "luego te digo"
7. NUNCA digas que eres IA, bot o respuesta automática
8. Varía tus respuestas`,
    },
    formal: {
      label: 'usted, profesional',
      intro: (name) => `Usted es ${name}. Es una persona real, NO una inteligencia artificial ni un bot. Actualmente no puede responder de forma directa.`,
      personality: 'Profesional, educado, cortés',
      rules: (name) => `1. Responda de forma breve y clara, 1-3 oraciones
2. Use lenguaje formal: usted, sin jerga ni abreviaturas
3. Emoji mínimo o ninguno
4. No siempre mencione lo que está haciendo
5. Si puede responder la pregunta, hágalo directamente
6. Si no sabe, diga "Le informaré en breve"
7. NUNCA se identifique como IA, bot o respuesta automática
8. Varíe sus respuestas`,
    },
    coloquial: {
      label: 'jerga, emojis',
      intro: (name) => `Eres ${name}. Sos una persona real, NO una IA ni un bot. Ahora no podés contestar porque no tenés el celu encima.`,
      personality: 'Buena onda, relajado, divertido',
      rules: (name) => `1. Respondé en 1-3 frases, re natural
2. Usá jerga: onda, piola, re, posta, etc
3. Emojis a full 🔥😂
4. No siempre digás qué estás haciendo
5. Si podés responder, respondé directo
6. Si no sabés, decí "después te cuento"
7. NUNCA digas que sos IA, bot o respuesta automática
8. Variá las respuestas`,
    },
    mixto: {
      label: 'se adapta al contexto',
      intro: (name) => `Eres ${name}. Eres una persona real, NO una IA ni un bot. No puedes contestar ahora mismo.`,
      personality: 'Adaptable — formal o informal según el contexto',
      rules: (name) => `1. Responde en 1-3 frases
2. Adapta tu tono al de la otra persona
3. Emojis con moderación
4. Si puedes responder, hazlo directamente
5. Si no sabes, di que contestarás luego
6. NUNCA digas que eres IA, bot o respuesta automática
7. Varía tus respuestas`,
    },
  },

  customIntro: (name) => `Eres ${name}. Eres una persona real, NO una IA ni un bot. No puedes contestar en este momento.`,
  customPersonality: 'Amable y cercano',
  customRules: (style) => `1. Responde en 1-3 frases\n2. Estilo: ${style}\n3. Responde directamente si puedes\n4. Si no sabes, di que contestarás después\n5. NUNCA digas que eres IA, bot o respuesta automática\n6. Varía tus respuestas`,

  prompt: {
    profile: (name) => `PERFIL DE ${name.toUpperCase()}:\n- Desarrollador/programador\n- Hobbies: programar, deportes, explorar cosas nuevas\n- Musulmán`,
    timeContext: 'CONTEXTO TEMPORAL (solo referencia):',
    timeNote: (name) => `Nota: esto es solo una posibilidad, ${name} podría estar haciendo otra cosa.`,
    rulesHeader: 'REGLAS PARA RESPONDER:',
    closing: (name) => `_~autoreply by ${name.toLowerCase()}_`,
    closingRule: (name) => `OBLIGATORIO: termina cada mensaje con una línea nueva y escribe: _~autoreply by ${name.toLowerCase()}_`,
  },

  context: {
    days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    weekend: 'fin de semana',
    weekday: 'día laboral',
    time: {
      subuh:          { label: 'madrugada',       activity: 'durmiendo o recién despierto' },
      pagi:           { label: 'mañana temprano',  activity: 'despertando, desayunando' },
      menjelangSiang: { label: 'mañana',           activity: 'trabajando o estudiando' },
      siang:          { label: 'mediodía',         activity: 'almorzando o trabajando' },
      sore:           { label: 'tarde',            activity: 'terminando trabajo, ejercicio o descansando' },
      petang:         { label: 'atardecer',        activity: 'cenando o descansando' },
      malam:          { label: 'noche',            activity: 'relajándose, programando o viendo algo' },
      malamLarut:     { label: 'noche tardía',     activity: 'programando tarde o ya dormido' },
      tengahMalam:    { label: 'medianoche',       activity: 'durmiendo' },
    },
    possibleActivity: 'Posible actividad',
    dateFormat: (day, date, month, year, dayType) => `${day}, ${date} de ${month} ${year} (${dayType})`,
  },

  cmd: {
    helpHeader: '📖 *Comandos del Bot*',
    helpControl: '*Control:*',
    helpConfig: '*Configuración IA:*',
    helpStyle: '*Estilos:*',
    helpModel: '*Modelos:*',
    helpFooter: (style, model) => `_style=${style} | model=${model}_`,
    awayOn: '🔴 *Modo ausente ACTIVADO!*',
    awayOnDetail: (style, model) => `Estilo: ${style}\nModelo: ${model}`,
    awayOff: '🟢 *Modo ausente DESACTIVADO!*',
    awayOffDetail: 'El bot no responderá a nadie. Estás en línea ahora.',
    dndFormat: '❌ Formato: *!dnd <duración>*\n\nEjemplos:\n• !dnd 30m → 30 minutos\n• !dnd 2h → 2 horas',
    dndBadFormat: '❌ Formato de duración incorrecto!\n\nEjemplos: *30m*, *2h*, *1h30m*',
    dndOn: '🔇 *Modo No Molestar ACTIVADO!*',
    dndDetail: (args, endTime) => `⏱️ Duración: ${args}\n⏰ Termina: ${endTime}`,
    statusHeader: '📊 *Estado del Bot AutoWA*',
    statusDnd: (min) => `No Molestar: ${min} minutos restantes`,
    statusFooter: '_Escribe !help para todos los comandos_',
    styleHeader: '🎨 *Estilo de Respuesta*',
    styleActive: (s) => `Activo: *${s}*`,
    styleChanged: (s) => `✅ Estilo cambiado a: *${s}*`,
    styleCustomChanged: (s) => `✅ Estilo personalizado: *${s}*`,
    styleReset: (s) => `✅ Estilo restaurado a config: *${s}*`,
    styleInvalid: (s) => `❌ Estilo *${s}* no reconocido.`,
    stylePresets: 'informal / formal / coloquial / mixto',
    styleCustomHint: 'custom <texto> — escribe lo que quieras',
    styleLive: '_Aplicado al instante. Escribe !style reset para revertir._',
    styleCustomError: '❌ Escribe un estilo después de custom.\n\nEjemplo: *!style custom español argentino*',
    styleValidation: (s) => `Opciones: *informal*, *formal*, *coloquial*, *mixto*\nO: *!style custom <texto libre>*`,
    modelHeader: '🤖 *Modelo IA*',
    modelActive: (m) => `Activo: *${m}*`,
    modelChanged: (m, alias) => `✅ Modelo cambiado a: *${m}*${alias ? ` (${alias})` : ''}`,
    modelReset: (m) => `✅ Modelo restaurado a config: *${m}*`,
    modelLive: '_Aplicado al instante. Escribe !model reset para revertir._',
    inboxCleared: '🗑️ Bandeja vaciada!',
    inboxEmpty: '📭 Bandeja vacía! No hay mensajes.',
    inboxHeader: (n) => `📬 *Bandeja: ${n} mensajes*\n`,
    inboxClearHint: '_Escribe *!inbox clear* para vaciar_',
    logoutConfirm: '*¿Estás seguro?*\n\nEscribe *!logout confirm* para confirmar.',
    logoutBye: 'Cerrando sesión... ¡adiós!',
    owner: 'Dueño', inbox: 'Bandeja', memory: 'Memoria', uptime: 'Tiempo activo',
    schedule: 'Horario', status: 'Estado', nonaktif: 'Desactivado',
    commandsOnly: '_Solo el dueño puede usar estos comandos._',
  },

  web: {
    title: 'AutoWA Bot', connected: 'Bot Conectado!',
    connectedDesc: 'WhatsApp conectado. El bot está funcionando.',
    waitingQr: 'Esperando código QR...', waitingDesc: 'Se actualizará automáticamente.',
    scanTitle: 'Escanear código QR',
    scanInstructions: 'Abre WhatsApp → Ajustes → Dispositivos vinculados → Vincular dispositivo',
    secondsLeft: 'segundos restantes', expired: 'Expirado',
  },
};
