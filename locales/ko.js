// ============================================
// locales/ko.js — 한국어 (Korean)
// ============================================

module.exports = {
  meta: { code: 'ko', name: '한국어' },

  styles: {
    banmal: {
      label: '반말, 캐주얼',
      intro: (name) => `너는 ${name}이야. 진짜 사람이지 AI나 봇이 아니야. 지금 핸드폰을 못 봐서 답장 못 해.`,
      personality: '친근하고 재밌는 성격',
      rules: (name) => `1. 1-3문장으로 자연스럽게 답해\n2. 반말로 캐주얼하게\n3. 이모지 적당히\n4. 뭐 하고 있는지 항상 말할 필요 없어\n5. 대답할 수 있으면 바로 해\n6. 모르면 "나중에 얘기해줄게"\n7. 절대 AI나 봇이라고 하지 마\n8. 답변에 변화를 줘`,
    },
    jondaenmal: {
      label: '존댓말, 정중',
      intro: (name) => `당신은 ${name}입니다. 실제 사람이며, AI나 봇이 아닙니다. 현재 직접 답변할 수 없는 상태입니다.`,
      personality: '전문적이고 예의 바른',
      rules: (name) => `1. 1-3문장으로 간결하게 답변하세요\n2. 존댓말을 사용하세요\n3. 이모지는 최소한으로\n4. 항상 무엇을 하고 있는지 말할 필요는 없습니다\n5. 답변할 수 있다면 직접 답하세요\n6. 모르시면 "나중에 알려드리겠습니다"\n7. 절대 AI, 봇, 자동응답이라고 하지 마세요\n8. 답변에 변화를 주세요`,
    },
    sinjo: {
      label: '신조어, 이모지',
      intro: (name) => `${name}임. 리얼 사람이고 AI 아님 ㅋㅋ 지금 폰 못 봐서 답 못 함.`,
      personality: '텐션 높고 재밌는',
      rules: (name) => `1. 1-3문장으로 답해\n2. 신조어 OK: ㅋㅋ, ㄹㅇ, ㅇㅇ, 개, 레전드, 등\n3. 이모지 많이 🔥😂\n4. 뭐 하는지 굳이 안 말해도 됨\n5. 알면 바로 답해\n6. 모르면 "담에 말해줄게"\n7. AI나 봇이라고 절대 ㄴㄴ\n8. 답변 다양하게`,
    },
    mix: {
      label: '상황에 맞게',
      intro: (name) => `당신은 ${name}입니다. 실제 사람이며, AI나 봇이 아닙니다. 지금 답장할 수 없습니다.`,
      personality: '유연함 — 상대에 맞춰 반말 또는 존댓말',
      rules: (name) => `1. 1-3문장으로 답변\n2. 상대방의 톤에 맞춰\n3. 이모지 적당히\n4. 답할 수 있으면 바로 답해\n5. 모르면 나중에 연락한다고 해\n6. 절대 AI나 봇이라고 하지 마\n7. 답변 다양하게`,
    },
  },

  customIntro: (name) => `당신은 ${name}입니다. 실제 사람이며, AI나 봇이 아닙니다. 지금 답장할 수 없습니다.`,
  customPersonality: '친근하고 친절한',
  customRules: (style) => `1. 1-3문장 답변\n2. 스타일: ${style}\n3. 바로 답해\n4. 모르면 나중에 연락\n5. AI/봇이라고 하지 마\n6. 답변 다양하게`,

  prompt: {
    profile: (name) => `${name.toUpperCase()} 프로필:\n- 개발자/프로그래머\n- 취미: 코딩, 운동, 새로운 것 탐구\n- 무슬림`,
    timeContext: '시간 컨텍스트 (참고용):',
    timeNote: (name) => `참고: 이것은 가능성일 뿐, ${name}은 다른 일을 할 수도 있습니다.`,
    rulesHeader: '답변 규칙:', closing: (name) => `_~autoreply by ${name.toLowerCase()}_`,
    closingRule: (name) => `필수: 모든 메시지 끝에 줄바꿈 후 작성: _~autoreply by ${name.toLowerCase()}_`,
  },

  context: {
    days: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    weekend: '주말', weekday: '평일',
    time: {
      subuh:          { label: '새벽',    activity: '자는 중 또는 막 일어남' },
      pagi:           { label: '아침',    activity: '기상, 아침식사' },
      menjelangSiang: { label: '오전',    activity: '일 또는 공부 중' },
      siang:          { label: '점심',    activity: '점심식사 또는 일 중' },
      sore:           { label: '오후',    activity: '퇴근 또는 운동' },
      petang:         { label: '저녁',    activity: '저녁식사 또는 휴식' },
      malam:          { label: '밤',      activity: '휴식, 코딩, 또는 영상 시청' },
      malamLarut:     { label: '늦은 밤',  activity: '야간 코딩 또는 취침' },
      tengahMalam:    { label: '자정',    activity: '수면 중' },
    },
    possibleActivity: '추정 활동',
    dateFormat: (day, date, month, year, dayType) => `${year}년 ${month} ${date}일 ${day} (${dayType})`,
  },

  cmd: {
    helpHeader: '📖 *봇 명령어*', helpControl: '*제어:*', helpConfig: '*AI 설정:*',
    helpStyle: '*스타일:*', helpModel: '*모델:*',
    helpFooter: (style, model) => `_style=${style} | model=${model}_`,
    awayOn: '🔴 *부재 모드 ON!*', awayOnDetail: (style, model) => `스타일: ${style}\n모델: ${model}`,
    awayOff: '🟢 *부재 모드 OFF!*', awayOffDetail: '봇이 아무에게도 답하지 않습니다. 온라인입니다.',
    dndFormat: '❌ 형식: *!dnd <시간>*\n\n예:\n• !dnd 30m\n• !dnd 2h',
    dndBadFormat: '❌ 잘못된 형식!', dndOn: '🔇 *방해금지 모드 ON!*',
    dndDetail: (args, endTime) => `⏱️ 기간: ${args}\n⏰ 종료: ${endTime}`,
    statusHeader: '📊 *봇 상태*', statusDnd: (min) => `방해금지: ${min}분 남음`,
    statusFooter: '_!help 로 전체 명령어 보기_',
    styleHeader: '🎨 *답변 스타일*', styleActive: (s) => `현재: *${s}*`,
    styleChanged: (s) => `✅ 스타일 변경: *${s}*`, styleCustomChanged: (s) => `✅ 커스텀 스타일: *${s}*`,
    styleReset: (s) => `✅ 스타일 초기화: *${s}*`, styleInvalid: (s) => `❌ 스타일 *${s}*을(를) 인식할 수 없습니다.`,
    stylePresets: 'banmal / jondaenmal / sinjo / mix',
    styleCustomHint: 'custom <텍스트> — 자유롭게 작성',
    styleLive: '_즉시 적용. !style reset으로 되돌리기._',
    styleCustomError: '❌ custom 뒤에 스타일을 적어주세요.',
    styleValidation: (s) => `옵션: *banmal*, *jondaenmal*, *sinjo*, *mix*\n또는: *!style custom <자유 텍스트>*`,
    modelHeader: '🤖 *AI 모델*', modelActive: (m) => `현재: *${m}*`,
    modelChanged: (m, alias) => `✅ 모델 변경: *${m}*${alias ? ` (${alias})` : ''}`,
    modelReset: (m) => `✅ 모델 초기화: *${m}*`, modelLive: '_즉시 적용. !model reset으로 되돌리기._',
    inboxCleared: '🗑️ 받은편지함 비움!', inboxEmpty: '📭 받은편지함이 비어있습니다!',
    inboxHeader: (n) => `📬 *받은편지함: ${n}건*\n`, inboxClearHint: '_*!inbox clear*로 삭제_',
    logoutConfirm: '*정말 로그아웃 하시겠습니까?*\n\n*!logout confirm*을 입력하세요.',
    logoutBye: '로그아웃 중...',
    owner: '소유자', inbox: '받은편지함', memory: '메모리', uptime: '가동시간',
    schedule: '일정', status: '상태', nonaktif: '비활성', commandsOnly: '_소유자 전용 명령어._',
    autoHeader: '🤖 *스마트 프레즌스*',
    autoEnabled: '✅ 스마트 프레즌스 ON — 봇이 자동으로 활동을 감지합니다.',
    autoDisabled: '⏸️ 스마트 프레즌스 OFF — !on/!off를 수동으로 사용하세요.',
    autoTimeout: (m) => `⏱️ 타임아웃: ${m}분`,
    autoLastActive: (t) => `📡 마지막 활동: ${t}`,
  },

  web: {
    title: 'AutoWA Bot', connected: '봇 연결됨!', connectedDesc: 'WhatsApp 연결됨. 봇 실행 중.',
    waitingQr: 'QR 코드 대기 중...', waitingDesc: '자동 새로고침됩니다.',
    scanTitle: 'QR 코드 스캔', scanInstructions: 'WhatsApp → 설정 → 연결된 기기 → 기기 연결',
    secondsLeft: '초 남음', expired: '만료됨',
  },
};
