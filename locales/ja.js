// ============================================
// locales/ja.js — 日本語 (Japanese)
// ============================================

module.exports = {
  meta: { code: 'ja', name: '日本語' },

  styles: {
    casual: {
      label: 'タメ口、カジュアル',
      intro: (name) => `あなたは${name}です。人間であり、AIやボットではありません。今は携帯が手元にないので返信できません。`,
      personality: 'フレンドリーで親しみやすい',
      rules: (name) => `1. 1-3文で自然に返信する\n2. タメ口でカジュアルに\n3. 絵文字は適度に\n4. 何をしているか常に言う必要はない\n5. 答えられる質問には直接答える\n6. わからない場合は「後で連絡するね」\n7. 絶対にAI、ボット、自動返信とは言わない\n8. 返信をバリエーション豊かに`,
    },
    keigo: {
      label: '敬語、丁寧',
      intro: (name) => `あなたは${name}です。人間であり、AIやボットではございません。現在、直接返信することができません。`,
      personality: 'プロフェッショナルで礼儀正しい',
      rules: (name) => `1. 1-3文で簡潔かつ明確に返信する\n2. 敬語を使用する\n3. 絵文字は最小限\n4. 常に何をしているか述べる必要はない\n5. 答えられる質問には丁寧に直接回答する\n6. わからない場合は「後ほどご連絡いたします」\n7. 決してAI、ボット、自動返信とは名乗らない\n8. 返信に変化をつける`,
    },
    wakamono: {
      label: '若者言葉、スラング',
      intro: (name) => `${name}だよ。リアルな人間で、AIとかボットじゃないから。今ちょっとスマホ触れなくて返事できない。`,
      personality: '元気で面白い、ノリがいい',
      rules: (name) => `1. 1-3文でサクッと返信\n2. 若者言葉使ってOK：マジ、ヤバい、草、それな、など\n3. 絵文字たくさん使って🔥😂\n4. 何してるかいちいち言わなくてOK\n5. 答えられるなら答える\n6. わかんなかったら「あとで連絡する」\n7. AIとかボットとは絶対言わない\n8. 返信パターン変えて`,
    },
    mix: {
      label: 'コンテキストに合わせる',
      intro: (name) => `あなたは${name}です。人間であり、AIやボットではありません。今は返信できません。`,
      personality: '柔軟 — 相手に合わせてフォーマルにもカジュアルにも',
      rules: (name) => `1. 1-3文で返信\n2. 相手のトーンに合わせる\n3. 絵文字は適度に\n4. 答えられるなら直接答える\n5. わからない場合は後で連絡すると伝える\n6. 絶対にAIやボットとは言わない\n7. 返信にバリエーションをつける`,
    },
  },

  customIntro: (name) => `あなたは${name}です。人間であり、AIやボットではありません。今は返信できません。`,
  customPersonality: 'フレンドリーで親切',
  customRules: (style) => `1. 1-3文で返信\n2. スタイル: ${style}\n3. 直接答える\n4. わからなければ後で連絡する\n5. AIやボットとは言わない\n6. 返信を変える`,

  prompt: {
    profile: (name) => `${name.toUpperCase()}のプロフィール:\n- 開発者/プログラマー\n- 趣味: プログラミング、スポーツ、新しいことを探求\n- ムスリム`,
    timeContext: '時間コンテキスト（参考のみ）:',
    timeNote: (name) => `注意: これは可能性にすぎず、${name}は別のことをしているかもしれません。`,
    rulesHeader: '返信ルール:',
    closing: (name) => `_~autoreply by ${name.toLowerCase()}_`,
    closingRule: (name) => `必須: 各メッセージの最後に改行して次を書く: _~autoreply by ${name.toLowerCase()}_`,
  },

  context: {
    days: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    weekend: '週末', weekday: '平日',
    time: {
      subuh:          { label: '未明',   activity: '睡眠中または起床直後' },
      pagi:           { label: '早朝',   activity: '起床、朝食準備' },
      menjelangSiang: { label: '午前',   activity: '仕事中または勉強中' },
      siang:          { label: '正午',   activity: '昼食中または仕事中' },
      sore:           { label: '午後',   activity: '仕事終わりまたは運動中' },
      petang:         { label: '夕方',   activity: '夕食または休憩中' },
      malam:          { label: '夜',     activity: 'リラックス中、プログラミング中' },
      malamLarut:     { label: '深夜',   activity: '深夜プログラミングまたは就寝中' },
      tengahMalam:    { label: '真夜中',  activity: '睡眠中' },
    },
    possibleActivity: '推定される活動',
    dateFormat: (day, date, month, year, dayType) => `${year}年${month}${date}日 ${day} (${dayType})`,
  },

  cmd: {
    helpHeader: '📖 *ボットコマンド*', helpControl: '*操作:*', helpConfig: '*AI設定:*',
    helpStyle: '*スタイル:*', helpModel: '*モデル:*',
    helpFooter: (style, model) => `_style=${style} | model=${model}_`,
    awayOn: '🔴 *留守モード オン！*', awayOnDetail: (style, model) => `スタイル: ${style}\nモデル: ${model}`,
    awayOff: '🟢 *留守モード オフ！*', awayOffDetail: 'ボットは誰にも返信しません。オンラインです。',
    dndFormat: '❌ 形式: *!dnd <時間>*\n\n例:\n• !dnd 30m → 30分\n• !dnd 2h → 2時間',
    dndBadFormat: '❌ 時間形式が不正です！', dndOn: '🔇 *おやすみモード オン！*',
    dndDetail: (args, endTime) => `⏱️ 期間: ${args}\n⏰ 終了: ${endTime}`,
    statusHeader: '📊 *ボットステータス*', statusDnd: (min) => `おやすみモード: 残り${min}分`,
    statusFooter: '_!help で全コマンド表示_',
    styleHeader: '🎨 *返信スタイル*', styleActive: (s) => `現在: *${s}*`,
    styleChanged: (s) => `✅ スタイル変更: *${s}*`, styleCustomChanged: (s) => `✅ カスタムスタイル: *${s}*`,
    styleReset: (s) => `✅ スタイルをリセット: *${s}*`, styleInvalid: (s) => `❌ スタイル *${s}* は認識されません。`,
    stylePresets: 'casual / keigo / wakamono / mix',
    styleCustomHint: 'custom <テキスト> — 自由に書く',
    styleLive: '_即時適用。!style reset で戻す。_',
    styleCustomError: '❌ customの後にスタイルを書いてください。',
    styleValidation: (s) => `選択肢: *casual*, *keigo*, *wakamono*, *mix*\nまたは: *!style custom <自由テキスト>*`,
    modelHeader: '🤖 *AIモデル*', modelActive: (m) => `現在: *${m}*`,
    modelChanged: (m, alias) => `✅ モデル変更: *${m}*${alias ? ` (${alias})` : ''}`,
    modelReset: (m) => `✅ モデルリセット: *${m}*`, modelLive: '_即時適用。!model reset で戻す。_',
    inboxCleared: '🗑️ 受信箱クリア！', inboxEmpty: '📭 受信箱は空です！',
    inboxHeader: (n) => `📬 *受信箱: ${n}件*\n`, inboxClearHint: '_*!inbox clear* で削除_',
    logoutConfirm: '*本当にログアウトしますか？*\n\n*!logout confirm* で確認。',
    logoutBye: 'ログアウト中...',
    owner: 'オーナー', inbox: '受信箱', memory: 'メモリ', uptime: '稼働時間',
    schedule: 'スケジュール', status: 'ステータス', nonaktif: '無効', commandsOnly: '_オーナー専用コマンド_',
    autoHeader: '🤖 *スマートプレゼンス*',
    autoEnabled: '✅ スマートプレゼンスON — ボットが自動的にアクティビティを検出します。',
    autoDisabled: '⏸️ スマートプレゼンスOFF — !on/!offを手動で使用してください。',
    autoTimeout: (m) => `⏱️ タイムアウト: ${m}分`,
    autoLastActive: (t) => `📡 最終アクティブ: ${t}`,
  },

  web: {
    title: 'AutoWA Bot', connected: 'ボット接続済み！', connectedDesc: 'WhatsApp接続済み。ボット稼働中。',
    waitingQr: 'QRコード待機中...', waitingDesc: '自動更新されます。',
    scanTitle: 'QRコードをスキャン',
    scanInstructions: 'WhatsAppを開く → 設定 → リンク済みデバイス → デバイスをリンク',
    secondsLeft: '秒残り', expired: '期限切れ',
  },
};
