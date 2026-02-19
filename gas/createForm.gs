/**
 * ========================================
 * 無料個別面談 事前アンケート — Google Form 自動作成 & 通知スクリプト
 * ========================================
 *
 * 【使い方】
 * 1. Google Apps Script (https://script.google.com) で新規プロジェクトを作成
 * 2. このコードを貼り付け
 * 3. 下記の CONFIG を自分の情報に書き換え
 * 4. createConsultationForm() を実行 → フォームが自動生成される
 * 5. setupFormSubmitTrigger() を実行 → 回答時の自動通知が設定される
 *
 * 【フロー】
 * 日程調整（外部サービス）→ このフォーム → 回答送信
 *   → ユーザーに確認メール（会議URL付き）
 *   → 管理者に通知メール（回答内容 + 会議URL付き）
 */

// ============================================================
// 設定（ここを書き換えてください）
// ============================================================
const CONFIG = {
  adminEmail: 'your-email@example.com',   // 管理者メールアドレス
  adminName: 'ダエグ先生',                  // 管理者の表示名
  meetUrl: 'https://meet.google.com/xxx-xxxx-xxx', // Google Meet URL
  serviceName: '教員・公務員のための独立ロードマップ 無料個別面談',
  formTitle: '無料個別面談 事前アンケート',
  formDescription:
    'お申し込みありがとうございます。\n' +
    '面談をより充実した30分にするため、いくつか事前にお聞かせください。\n' +
    '所要時間：約3分\n\n' +
    '※ ご記入いただいた内容は面談準備のみに使用し、第三者に提供することはありません。',
};


// ============================================================
// メイン: フォーム作成
// ============================================================
function createConsultationForm() {
  const form = FormApp.create(CONFIG.formTitle);
  form.setDescription(CONFIG.formDescription);
  form.setConfirmationMessage(
    'ご回答ありがとうございます！\n\n' +
    '面談の詳細とGoogle MeetのURLを、ご登録のメールアドレスにお送りしました。\n' +
    '当日お会いできるのを楽しみにしています。\n\n' +
    '— ' + CONFIG.adminName
  );
  form.setCollectEmail(false); // メールは自前の質問で取得（バリデーション用）
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);
  form.setProgressBar(true);

  // ----------------------------------------------------------
  // セクション 1: 基本情報
  // ----------------------------------------------------------
  form.addPageBreakItem()
    .setTitle('基本情報')
    .setHelpText('まず、あなたのことを教えてください。');

  form.addTextItem()
    .setTitle('お名前')
    .setHelpText('面談で使用します（ニックネーム可）')
    .setRequired(true);

  form.addTextItem()
    .setTitle('メールアドレス')
    .setHelpText('面談の詳細・会議URLをこちらにお送りします')
    .setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .requireTextMatchesPattern('^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$')
      .setHelpText('有効なメールアドレスを入力してください')
      .build()
    );

  // ----------------------------------------------------------
  // セクション 2: 現在のお仕事
  // ----------------------------------------------------------
  form.addPageBreakItem()
    .setTitle('現在のお仕事について')
    .setHelpText('あなたの状況に合わせたアドバイスをするために伺います。');

  form.addMultipleChoiceItem()
    .setTitle('現在の職種')
    .setChoiceValues([
      '小学校教員',
      '中学校教員',
      '高校教員',
      '特別支援学校教員',
      '大学教員・講師',
      '市区町村 職員',
      '都道府県 職員',
      '国家公務員',
      'その他の教育関連職',
      'その他の公務員',
      '既に退職済み',
    ])
    .setRequired(true)
    .showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle('勤続年数')
    .setChoiceValues([
      '1〜3年',
      '4〜7年',
      '8〜12年',
      '13〜20年',
      '20年以上',
      '既に退職済み',
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('年齢')
    .setChoiceValues([
      '20代',
      '30代前半（30〜34歳）',
      '30代後半（35〜39歳）',
      '40代前半（40〜44歳）',
      '40代後半（45〜49歳）',
      '50代以上',
    ])
    .setRequired(true);

  // ----------------------------------------------------------
  // セクション 3: 独立への意向
  // ----------------------------------------------------------
  form.addPageBreakItem()
    .setTitle('独立・キャリアチェンジについて')
    .setHelpText('現在のお気持ちを率直にお聞かせください。正解はありません。');

  form.addMultipleChoiceItem()
    .setTitle('独立・キャリアチェンジの温度感')
    .setHelpText('現在の気持ちに一番近いものを選んでください')
    .setChoiceValues([
      'まだ情報収集の段階。まずは話を聞いてみたい',
      '興味はあるが、不安が大きくて踏み出せない',
      '1〜2年以内に独立したいと考えている',
      '半年以内に行動を起こしたい',
      '既に準備を始めている',
    ])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('現在抱えている悩み・課題（複数選択可）')
    .setChoiceValues([
      '何から始めればいいかわからない',
      '収入面が不安（家族を養えるか）',
      '自分に売れるスキルがあるかわからない',
      '副業禁止なので在職中にできることが限られる',
      '周囲に相談できる人がいない',
      '辞めるタイミングがわからない',
      'AIに興味はあるが使いこなせるか不安',
      '時間がなくて準備が進まない',
      '家族の理解が得られるか心配',
    ])
    .setRequired(true)
    .showOtherOption(true);

  form.addMultipleChoiceItem()
    .setTitle('家族構成')
    .setHelpText('独立プランの設計に影響するためお聞きしています')
    .setChoiceValues([
      '独身',
      '既婚・子なし',
      '既婚・子あり（未就学児）',
      '既婚・子あり（小学生以上）',
      'その他',
    ])
    .setRequired(true);

  // ----------------------------------------------------------
  // セクション 4: AIスキル・関心
  // ----------------------------------------------------------
  form.addPageBreakItem()
    .setTitle('AIスキルについて')
    .setHelpText('面談でのAI活用アドバイスのレベルを調整するためにお聞きします。');

  form.addMultipleChoiceItem()
    .setTitle('AIツールの利用経験')
    .setChoiceValues([
      'まったく使ったことがない',
      'ChatGPTなどを少し試した程度',
      '業務や日常で時々使っている',
      '積極的に活用しており、複数のAIツールを使い分けている',
    ])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('興味のある独立の方向性（複数選択可）')
    .setHelpText('まだ決まっていなくても、気になるものを選んでください')
    .setChoiceValues([
      'AIを活用したコンサルティング・支援サービス',
      'オンライン教育・講座運営',
      'コンテンツ制作（ライティング・動画など）',
      'フリーランスとしてのスキル提供',
      'EC・物販ビジネス',
      'まだ全くイメージがない（一緒に考えたい）',
    ])
    .setRequired(true)
    .showOtherOption(true);

  // ----------------------------------------------------------
  // セクション 5: 面談で聞きたいこと
  // ----------------------------------------------------------
  form.addPageBreakItem()
    .setTitle('面談について')
    .setHelpText('最後に、当日の面談をより充実させるための質問です。');

  form.addCheckboxItem()
    .setTitle('面談で特に聞きたいこと（複数選択可）')
    .setChoiceValues([
      '独立までの具体的なステップ・ロードマップ',
      '在職中にできる準備',
      'AIスキルの身につけ方・活用法',
      '収入の目安やお金の話',
      '退職のタイミングや手続き',
      'ダエグ先生の独立体験談を詳しく聞きたい',
    ])
    .setRequired(true)
    .showOtherOption(true);

  form.addParagraphTextItem()
    .setTitle('その他、事前に伝えておきたいことや質問')
    .setHelpText('どんな小さなことでも構いません。当日の面談で優先的にお答えします。')
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('このサービスを知ったきっかけ')
    .setChoiceValues([
      'Threads',
      'Instagram',
      'X（Twitter）',
      '知人の紹介',
      'Google検索',
    ])
    .setRequired(true)
    .showOtherOption(true);

  // ----------------------------------------------------------
  // 完了: URLをログに出力
  // ----------------------------------------------------------
  const formUrl = form.getPublishedUrl();
  const editUrl = form.getEditUrl();

  Logger.log('=== フォーム作成完了 ===');
  Logger.log('公開URL（ユーザー用）: ' + formUrl);
  Logger.log('編集URL（管理者用）:   ' + editUrl);
  Logger.log('フォームID:            ' + form.getId());

  // スプレッドシートと連携
  const ss = SpreadsheetApp.create(CONFIG.formTitle + ' 回答一覧');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  Logger.log('スプレッドシートURL:   ' + ss.getUrl());

  return {
    formUrl: formUrl,
    editUrl: editUrl,
    formId: form.getId(),
    spreadsheetUrl: ss.getUrl(),
  };
}


// ============================================================
// トリガー設定: フォーム送信時の自動処理
// ============================================================
function setupFormSubmitTrigger() {
  // 既存トリガーを削除（重複防止）
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // スプレッドシートのonFormSubmitトリガーを設定
  const spreadsheets = DriveApp.getFilesByName(CONFIG.formTitle + ' 回答一覧');
  if (spreadsheets.hasNext()) {
    const ssFile = spreadsheets.next();
    const ss = SpreadsheetApp.openById(ssFile.getId());
    ScriptApp.newTrigger('onFormSubmit')
      .forSpreadsheet(ss)
      .onFormSubmit()
      .create();
    Logger.log('トリガー設定完了: フォーム送信時に onFormSubmit が実行されます');
  } else {
    Logger.log('エラー: スプレッドシートが見つかりません。先に createConsultationForm() を実行してください。');
  }
}


// ============================================================
// フォーム送信時の処理
// ============================================================
function onFormSubmit(e) {
  try {
    const responses = e.namedValues;

    // 回答データを整形
    const data = {
      name:           getVal(responses, 'お名前'),
      email:          getVal(responses, 'メールアドレス'),
      jobType:        getVal(responses, '現在の職種'),
      yearsWorked:    getVal(responses, '勤続年数'),
      age:            getVal(responses, '年齢'),
      readiness:      getVal(responses, '独立・キャリアチェンジの温度感'),
      challenges:     getVal(responses, '現在抱えている悩み・課題（複数選択可）'),
      family:         getVal(responses, '家族構成'),
      aiExperience:   getVal(responses, 'AIツールの利用経験'),
      directions:     getVal(responses, '興味のある独立の方向性（複数選択可）'),
      wantToKnow:     getVal(responses, '面談で特に聞きたいこと（複数選択可）'),
      freeText:       getVal(responses, 'その他、事前に伝えておきたいことや質問'),
      referral:       getVal(responses, 'このサービスを知ったきっかけ'),
      timestamp:      new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
    };

    // メール送信
    sendUserConfirmation(data);
    sendAdminNotification(data);

    Logger.log('通知送信完了: ' + data.name + ' (' + data.email + ')');
  } catch (error) {
    Logger.log('エラー: ' + error.toString());
    // エラー時も管理者に通知
    MailApp.sendEmail(
      CONFIG.adminEmail,
      '[エラー] フォーム送信処理でエラーが発生しました',
      'エラー内容: ' + error.toString() + '\n\nイベント: ' + JSON.stringify(e)
    );
  }
}


// ============================================================
// ユーザーへの確認メール
// ============================================================
function sendUserConfirmation(data) {
  const subject = '【面談確認】事前アンケートを受け付けました — ' + CONFIG.adminName;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f7f8fa;font-family:'Helvetica Neue',Arial,'Noto Sans JP',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="background:linear-gradient(165deg,#0b1622 0%,#152238 100%);border-radius:16px 16px 0 0;padding:40px 32px;text-align:center;">
      <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px;">
        事前アンケートを受け付けました
      </h1>
      <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0;">
        ${CONFIG.serviceName}
      </p>
    </div>

    <!-- Body -->
    <div style="background:#fff;padding:36px 32px;border-radius:0 0 16px 16px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

      <p style="font-size:15px;color:#1a1a2e;line-height:1.8;margin:0 0 24px;">
        ${data.name} さん、ご回答ありがとうございます。<br>
        面談当日は、いただいた内容をもとに<br>
        あなたに最適なアドバイスを準備してお待ちしています。
      </p>

      <!-- Meet URL Box -->
      <div style="background:linear-gradient(135deg,#f0faf9,#e8f8f5);border:2px solid #4ecdc4;border-radius:12px;padding:24px;text-align:center;margin:0 0 28px;">
        <p style="font-size:12px;color:#2a9d8f;font-weight:700;letter-spacing:0.1em;margin:0 0 8px;">
          GOOGLE MEET URL
        </p>
        <a href="${CONFIG.meetUrl}" style="display:inline-block;font-size:16px;font-weight:700;color:#0b1622;word-break:break-all;text-decoration:none;border-bottom:2px solid #4ecdc4;padding-bottom:2px;">
          ${CONFIG.meetUrl}
        </a>
        <p style="font-size:12px;color:#888;margin:12px 0 0;">
          ※ 面談開始時刻になりましたら上記URLからご参加ください
        </p>
      </div>

      <!-- Preparation Tips -->
      <div style="background:#f7f8fa;border-radius:10px;padding:20px 24px;margin:0 0 28px;">
        <p style="font-size:13px;font-weight:700;color:#1a1a2e;margin:0 0 12px;">
          当日までにご準備いただくこと
        </p>
        <ul style="font-size:13px;color:#555;line-height:2;margin:0;padding:0 0 0 18px;">
          <li>静かな場所（カフェ、自宅など）での参加をおすすめします</li>
          <li>カメラはオフでも構いません</li>
          <li>メモの準備があると面談後すぐに行動に移せます</li>
          <li>聞きたいことがあれば事前にメモしておくと効率的です</li>
        </ul>
      </div>

      <!-- Your Answers Summary -->
      <div style="border-top:1px solid #eef0f3;padding-top:20px;">
        <p style="font-size:12px;color:#aaa;font-weight:700;letter-spacing:0.05em;margin:0 0 12px;">
          ご回答内容の控え
        </p>
        <table style="width:100%;font-size:13px;color:#555;border-collapse:collapse;">
          <tr style="border-bottom:1px solid #f0f2f5;">
            <td style="padding:8px 0;color:#888;width:120px;vertical-align:top;">お名前</td>
            <td style="padding:8px 0;">${data.name}</td>
          </tr>
          <tr style="border-bottom:1px solid #f0f2f5;">
            <td style="padding:8px 0;color:#888;vertical-align:top;">ご職種</td>
            <td style="padding:8px 0;">${data.jobType}</td>
          </tr>
          <tr style="border-bottom:1px solid #f0f2f5;">
            <td style="padding:8px 0;color:#888;vertical-align:top;">勤続年数</td>
            <td style="padding:8px 0;">${data.yearsWorked}</td>
          </tr>
          <tr style="border-bottom:1px solid #f0f2f5;">
            <td style="padding:8px 0;color:#888;vertical-align:top;">温度感</td>
            <td style="padding:8px 0;">${data.readiness}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#888;vertical-align:top;">聞きたいこと</td>
            <td style="padding:8px 0;">${data.wantToKnow}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;">
      <p style="font-size:12px;color:#aaa;margin:0;">
        ${CONFIG.serviceName} — ${CONFIG.adminName}
      </p>
      <p style="font-size:11px;color:#ccc;margin:8px 0 0;">
        このメールは自動送信です。ご不明な点は直接ご返信ください。
      </p>
    </div>
  </div>
</body>
</html>`;

  const plainBody =
    data.name + ' さん\n\n' +
    '事前アンケートのご回答ありがとうございます。\n\n' +
    '【Google Meet URL】\n' + CONFIG.meetUrl + '\n\n' +
    '面談開始時刻になりましたら、上記URLからご参加ください。\n\n' +
    '--- 回答控え ---\n' +
    'お名前: ' + data.name + '\n' +
    'ご職種: ' + data.jobType + '\n' +
    '勤続年数: ' + data.yearsWorked + '\n' +
    '温度感: ' + data.readiness + '\n' +
    '聞きたいこと: ' + data.wantToKnow + '\n\n' +
    '当日お会いできるのを楽しみにしています。\n' +
    CONFIG.adminName;

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    name: CONFIG.adminName,
    replyTo: CONFIG.adminEmail,
  });
}


// ============================================================
// 管理者への通知メール
// ============================================================
function sendAdminNotification(data) {
  const subject = '【新規面談申込】' + data.name + ' さん（' + data.jobType + '・' + data.yearsWorked + '）';

  // 温度感に応じたラベル
  const readinessColor = getReadinessColor(data.readiness);

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f7f8fa;font-family:'Helvetica Neue',Arial,'Noto Sans JP',sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="background:linear-gradient(165deg,#0b1622 0%,#152238 100%);border-radius:16px 16px 0 0;padding:32px;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <h1 style="color:#fff;font-size:18px;font-weight:700;margin:0;">
          新規面談申込
        </h1>
        <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:4px 0 0;">
          ${data.timestamp}
        </p>
      </div>
      <div style="background:${readinessColor};color:#fff;font-size:12px;font-weight:700;padding:6px 14px;border-radius:6px;">
        ${getReadinessLabel(data.readiness)}
      </div>
    </div>

    <!-- Body -->
    <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

      <!-- Quick Profile -->
      <div style="display:flex;gap:16px;align-items:center;margin:0 0 24px;padding:0 0 24px;border-bottom:1px solid #eef0f3;">
        <div style="width:48px;height:48px;background:linear-gradient(135deg,#152238,#1a3050);border-radius:12px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#4ecdc4;font-size:20px;font-weight:900;">${data.name.charAt(0)}</span>
        </div>
        <div>
          <p style="font-size:16px;font-weight:700;color:#1a1a2e;margin:0;">${data.name}</p>
          <p style="font-size:13px;color:#888;margin:2px 0 0;">${data.jobType}・${data.yearsWorked}・${data.age}</p>
        </div>
      </div>

      <!-- Detail Sections -->
      ${buildSection('基本情報', [
        ['メール', data.email],
        ['職種', data.jobType],
        ['勤続年数', data.yearsWorked],
        ['年齢', data.age],
        ['家族構成', data.family],
        ['流入経路', data.referral],
      ])}

      ${buildSection('独立への意向', [
        ['温度感', data.readiness],
        ['悩み・課題', data.challenges],
        ['興味のある方向性', data.directions],
      ])}

      ${buildSection('AI・面談', [
        ['AI利用経験', data.aiExperience],
        ['聞きたいこと', data.wantToKnow],
      ])}

      ${data.freeText ? buildSection('自由記述', [
        ['内容', data.freeText],
      ]) : ''}

      <!-- Preparation Notes -->
      <div style="background:#fdf2f2;border-left:3px solid #c0392b;border-radius:0 8px 8px 0;padding:16px 20px;margin:24px 0 0;">
        <p style="font-size:13px;font-weight:700;color:#c0392b;margin:0 0 8px;">
          面談準備チェックリスト
        </p>
        <ul style="font-size:13px;color:#555;line-height:2;margin:0;padding:0 0 0 18px;">
          <li>温度感: <strong>${getReadinessLabel(data.readiness)}</strong> → ${getReadinessAdvice(data.readiness)}</li>
          <li>AI経験: ${data.aiExperience} → 説明レベルを調整</li>
          <li>主な悩み: ${data.challenges}</li>
        </ul>
      </div>

      <!-- Meet URL -->
      <div style="text-align:center;margin:24px 0 0;padding:16px;background:#f0faf9;border-radius:8px;">
        <p style="font-size:12px;color:#888;margin:0 0 4px;">会議URL</p>
        <a href="${CONFIG.meetUrl}" style="font-size:14px;color:#2a9d8f;font-weight:700;">${CONFIG.meetUrl}</a>
      </div>
    </div>
  </div>
</body>
</html>`;

  const plainBody =
    '=== 新規面談申込 ===\n' +
    '受付日時: ' + data.timestamp + '\n\n' +
    '【基本情報】\n' +
    'お名前: ' + data.name + '\n' +
    'メール: ' + data.email + '\n' +
    '職種: ' + data.jobType + '\n' +
    '勤続年数: ' + data.yearsWorked + '\n' +
    '年齢: ' + data.age + '\n' +
    '家族構成: ' + data.family + '\n\n' +
    '【独立への意向】\n' +
    '温度感: ' + data.readiness + '\n' +
    '悩み: ' + data.challenges + '\n' +
    '方向性: ' + data.directions + '\n\n' +
    '【AI・面談】\n' +
    'AI経験: ' + data.aiExperience + '\n' +
    '聞きたいこと: ' + data.wantToKnow + '\n' +
    '自由記述: ' + (data.freeText || 'なし') + '\n\n' +
    '流入経路: ' + data.referral + '\n\n' +
    '会議URL: ' + CONFIG.meetUrl;

  MailApp.sendEmail({
    to: CONFIG.adminEmail,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    name: 'フォーム通知',
  });
}


// ============================================================
// ヘルパー関数
// ============================================================

/** namedValues から値を安全に取得 */
function getVal(namedValues, key) {
  if (namedValues[key] && namedValues[key].length > 0) {
    return namedValues[key].join(', ');
  }
  return '';
}

/** 温度感に応じたカラーコード */
function getReadinessColor(readiness) {
  if (readiness.includes('半年以内') || readiness.includes('準備を始めている')) return '#c0392b';
  if (readiness.includes('1〜2年')) return '#e67e22';
  if (readiness.includes('興味はある')) return '#f39c12';
  return '#4ecdc4';
}

/** 温度感の短縮ラベル */
function getReadinessLabel(readiness) {
  if (readiness.includes('準備を始めている')) return '実行段階';
  if (readiness.includes('半年以内')) return '半年以内';
  if (readiness.includes('1〜2年')) return '1〜2年';
  if (readiness.includes('興味はある')) return '検討中';
  return '情報収集';
}

/** 温度感に応じた面談アドバイス */
function getReadinessAdvice(readiness) {
  if (readiness.includes('準備を始めている')) return '具体的なアクションプランを一緒に詰める';
  if (readiness.includes('半年以内')) return '退職準備のタイムラインを具体化';
  if (readiness.includes('1〜2年')) return 'ロードマップ作成に注力';
  if (readiness.includes('興味はある')) return '不安の解消と可能性の提示';
  return '情報提供メインで信頼構築';
}

/** メール用セクションHTML生成 */
function buildSection(title, rows) {
  let html = `
      <div style="margin:0 0 20px;">
        <p style="font-size:11px;font-weight:700;color:#c0392b;letter-spacing:0.1em;margin:0 0 10px;padding:0 0 6px;border-bottom:1px solid #f0f2f5;">
          ${title}
        </p>
        <table style="width:100%;font-size:13px;border-collapse:collapse;">`;

  rows.forEach(([label, value]) => {
    html += `
          <tr>
            <td style="padding:6px 0;color:#888;width:110px;vertical-align:top;">${label}</td>
            <td style="padding:6px 0;color:#1a1a2e;">${value || '—'}</td>
          </tr>`;
  });

  html += `
        </table>
      </div>`;
  return html;
}
