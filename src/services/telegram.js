// ─────────────────────────────────────────────
// Telegram Notification Service
// Ang Roka High School Attendance Management
// ─────────────────────────────────────────────

/**
 * Safely escape characters for Telegram HTML parse mode to prevent injection or formatting breaks
 */
export function escapeTelegramHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format a standard Date to Khmer readable date
 */
export function getKhmerCurrentDateString(d = new Date()) {
  const daysKhmer = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
  const monthsKhmer = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  const khmerNumbers = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  const toKhmerNum = (num) => String(num).split('').map(c => khmerNumbers[parseInt(c)] || c).join('');

  const dayName = daysKhmer[d.getDay()];
  const day = toKhmerNum(d.getDate());
  const month = monthsKhmer[d.getMonth()];
  const year = toKhmerNum(d.getFullYear());

  return `ថ្ងៃ${dayName} ទី${day} ខែ${month} ឆ្នាំ${year}`;
}

/**
 * Send a raw Telegram message via Telegram Bot API
 * @param {Object} options
 * @param {string} options.token - Telegram Bot Token
 * @param {string} options.chatId - Telegram Chat ID or Channel ID
 * @param {string} options.text - Formatted HTML/Plain message
 * @param {string} [options.parseMode='HTML'] - Telegram Parse Mode
 */
export async function sendTelegramMessage({ token, chatId, text, parseMode = 'HTML' }) {
  if (!token || !token.trim()) {
    return { success: false, error: 'Telegram Bot Token មិនត្រឹមត្រូវ ឬទទេ' };
  }
  if (!chatId || !String(chatId).trim()) {
    return { success: false, error: 'Telegram Chat ID មិនត្រឹមត្រូវ ឬទទេ' };
  }

  const cleanToken = token.trim();
  const cleanChatId = String(chatId).trim();
  const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      console.warn('[Telegram] API error:', data);
      return {
        success: false,
        error: data.description || `HTTP ${response.status}: បរាជ័យក្នុងការផ្ញើសារ`
      };
    }

    return { success: true, result: data.result };
  } catch (err) {
    console.error('[Telegram] Network exception:', err);
    return {
      success: false,
      error: err.message || 'មិនអាចតភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើ Telegram បានទេ'
    };
  }
}

/**
 * Send a test message to verify Bot Token and Chat ID
 */
export async function testTelegramBotConnection({ token, chatId, botName = '', className = '' }) {
  const dateStr = getKhmerCurrentDateString();
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const message = [
    '🔔 <b>ការតភ្ជាប់ប្រព័ន្ធ Telegram Bot ជោគជ័យ!</b>',
    '🏫 <b>វិទ្យាល័យអង្គរកា (Ang Roka High School)</b>',
    '━━━━━━━━━━━━━━━━━━━━',
    `✅ <b>ស្ថានភាព:</b> បានតភ្ជាប់ដោយជោគជ័យ`,
    botName ? `🤖 <b>Bot:</b> ${escapeTelegramHtml(botName)}` : null,
    className ? `📚 <b>ថ្នាក់បន្ទុក:</b> ${escapeTelegramHtml(className)}` : null,
    `📅 <b>កាលបរិច្ឆេទ:</b> ${dateStr}`,
    `⏰ <b>ពេលវេលា:</b> ${timeStr}`,
    '━━━━━━━━━━━━━━━━━━━━',
    '<i>សារសាកល្បងពីប្រព័ន្ធគ្រប់គ្រងវត្តមានសិស្ស</i>'
  ].filter(Boolean).join('\n');

  return await sendTelegramMessage({
    token,
    chatId,
    text: message
  });
}

/**
 * Dispatch an attendance summary notification to active Telegram bots for a class
 */
export async function dispatchAttendanceNotification({ payload, bots = [], globalTokens = [] }) {
  if (!payload || !payload.className) return { success: false, count: 0 };

  const targetClass = payload.className;

  // Resolve matching active bots
  let matchingBots = bots.filter(b => b.status === 'active' && (b.class === targetClass || b.class === 'ALL'));

  // If bot uses GLOBAL_TOKEN, resolve actual token from active global tokens
  const activeGlobal = globalTokens.find(t => t.isActive) || globalTokens[0];
  const globalTokenVal = activeGlobal ? activeGlobal.token : '';

  const validRecipients = [];
  matchingBots.forEach(b => {
    let finalToken = b.token;
    if (finalToken === 'GLOBAL_TOKEN' || !finalToken) {
      finalToken = globalTokenVal;
    }
    if (finalToken && b.chatId) {
      validRecipients.push({
        name: b.name || `Bot ថ្នាក់ ${b.class}`,
        token: finalToken,
        chatId: b.chatId
      });
    }
  });

  if (validRecipients.length === 0) {
    return { success: true, count: 0, message: 'មិនមាន Telegram Bot សកម្មសម្រាប់ថ្នាក់នេះទេ' };
  }

  // Format attendance records
  const records = payload.records || [];
  const absentRecords = records.filter(r => r.status === 'ABSENT');
  const leaveRecords = records.filter(r => r.status === 'LEAVE');
  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const totalCount = records.length;

  const dateStr = getKhmerCurrentDateString();
  const periodLabel = payload.periodLabel || (payload.period ? `ម៉ោងទី ${payload.period}` : 'ម៉ោងសិក្សា');
  const hoursNum = payload.hours || 1;

  let absentListText = '';
  const nonPresent = [...absentRecords, ...leaveRecords];
  if (nonPresent.length === 0) {
    absentListText = '  • <i>សិស្សមានវត្តមានគ្រប់ចំនួន (គ្មានអវត្តមាន)</i>';
  } else {
    absentListText = nonPresent.map((s, idx) => {
      const typeLabel = s.status === 'ABSENT' ? '❌ អវត្តមាន' : '📝 សុំច្បាប់';
      const reasonPart = s.reason ? ` (${escapeTelegramHtml(s.reason)})` : '';
      return `  ${idx + 1}. <b>${escapeTelegramHtml(s.name)}</b> - ${typeLabel}${reasonPart}`;
    }).join('\n');
  }

  const message = [
    '🏫 <b>វិទ្យាល័យអង្គរកា - របាយការណ៍វត្តមានសិស្ស</b>',
    '━━━━━━━━━━━━━━━━━━━━',
    `📚 <b>ថ្នាក់:</b> ${escapeTelegramHtml(targetClass)}`,
    `⏰ <b>វេន/ម៉ោង:</b> ${escapeTelegramHtml(periodLabel)} (${hoursNum} ម៉ោង)`,
    payload.subject ? `📖 <b>មុខវិជ្ជា:</b> ${escapeTelegramHtml(payload.subject)}` : null,
    payload.teacher ? `👨‍🏫 <b>គ្រូបង្រៀន:</b> ${escapeTelegramHtml(payload.teacher)}` : null,
    payload.recordedBy ? `👤 <b>អ្នកស្រង់:</b> ${escapeTelegramHtml(payload.recordedBy)}` : null,
    `📅 <b>កាលបរិច្ឆេទ:</b> ${dateStr}`,
    '━━━━━━━━━━━━━━━━━━━━',
    '📊 <b>ស្ថិតិវត្តមាន:</b>',
    `  • សិស្សសរុប: <b>${totalCount}</b> នាក់`,
    `  • វត្តមាន: <b>${presentCount}</b> នាក់`,
    `  • អវត្តមាន (គ្មានច្បាប់): <b>${absentRecords.length}</b> នាក់`,
    `  • សុំច្បាប់: <b>${leaveRecords.length}</b> នាក់`,
    '━━━━━━━━━━━━━━━━━━━━',
    '⚠️ <b>បញ្ជីឈ្មោះសិស្សអវត្តមាន / សុំច្បាប់:</b>',
    absentListText,
    '━━━━━━━━━━━━━━━━━━━━',
    '<i>ប្រព័ន្ធគ្រប់គ្រងវត្តមានស្វ័យប្រវត្តិតាម Telegram</i>'
  ].filter(Boolean).join('\n');

  // Dispatch to all matching recipients in parallel
  const sendPromises = validRecipients.map(recipient =>
    sendTelegramMessage({
      token: recipient.token,
      chatId: recipient.chatId,
      text: message
    })
  );

  const results = await Promise.allSettled(sendPromises);
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

  return {
    success: successCount > 0,
    count: successCount,
    totalAttempted: validRecipients.length
  };
}

/**
 * Dispatch a Daily 5:00 PM Summary notification to active school management Telegram bots
 */
export async function dispatchDailySummaryNotification({
  date = new Date().toISOString().split('T')[0],
  records = [],
  classes = [],
  students = [],
  bots = [],
  globalTokens = [],
  manualTrigger = false
}) {
  // 1. Resolve matching recipients (Bots for ALL or with notifyDailySummary enabled)
  let matchingBots = bots.filter(b => b.status === 'active' && (b.class === 'ALL' || b.notifyDailySummary === true));
  if (matchingBots.length === 0) {
    // If no ALL bot is configured, fallback to any active bot as a safety
    matchingBots = bots.filter(b => b.status === 'active');
  }

  const activeGlobal = globalTokens.find(t => t.isActive) || globalTokens[0];
  const globalTokenVal = activeGlobal ? activeGlobal.token : '';

  const validRecipients = [];
  matchingBots.forEach(b => {
    let finalToken = b.token;
    if (finalToken === 'GLOBAL_TOKEN' || !finalToken) {
      finalToken = globalTokenVal;
    }
    if (finalToken && b.chatId) {
      validRecipients.push({
        name: b.name || `Bot ${b.class}`,
        token: finalToken,
        chatId: b.chatId
      });
    }
  });

  if (validRecipients.length === 0) {
    return { success: false, error: 'មិនមាន Telegram Bot សកម្មសម្រាប់ទទួលរបាយការណ៍សង្ខេបទេ' };
  }

  // 2. Filter records for the specified date
  const dayRecords = records.filter(r => r.date === date);

  // 3. Build stats per class
  const classList = classes.length > 0
    ? classes.map(c => typeof c === 'string' ? c : c.name || c.id)
    : [...new Set(students.map(s => s.className || s.class).concat(dayRecords.map(r => r.class)))].filter(Boolean);

  let totalSchoolStudents = 0;
  let totalSchoolPresent = 0;
  let totalSchoolAbsent = 0;
  let totalSchoolLeave = 0;
  const classSummaries = [];

  classList.forEach(className => {
    const classStudents = students.filter(s => (s.className || s.class) === className);
    const classRecs = dayRecords.filter(r => r.class === className);

    // Unique students marked absent or leave today in this class
    const absentMap = new Map();
    classRecs.forEach(r => {
      const key = r.studentId || r.name;
      if (!absentMap.has(key)) {
        absentMap.set(key, {
          name: r.name,
          status: r.status,
          reason: r.reason,
          period: r.period
        });
      }
    });

    const absentList = Array.from(absentMap.values());
    const absentCount = absentList.filter(s => s.status === 'ABSENT').length;
    const leaveCount = absentList.filter(s => s.status === 'LEAVE').length;

    const studentCount = classStudents.length > 0 ? classStudents.length : Math.max(30, absentList.length);
    const presentCount = Math.max(0, studentCount - absentCount - leaveCount);
    const rate = studentCount > 0 ? Math.round((presentCount / studentCount) * 100) : 100;

    totalSchoolStudents += studentCount;
    totalSchoolPresent += presentCount;
    totalSchoolAbsent += absentCount;
    totalSchoolLeave += leaveCount;

    classSummaries.push({
      className,
      studentCount,
      presentCount,
      absentCount,
      leaveCount,
      rate,
      absentList
    });
  });

  const overallRate = totalSchoolStudents > 0
    ? Math.round((totalSchoolPresent / totalSchoolStudents) * 100)
    : 100;

  const dateText = getKhmerCurrentDateString(new Date(date + 'T12:00:00'));
  const now = new Date();
  const timeText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // 4. Construct Khmer message
  let classListLines = classSummaries.map(c => {
    const header = `• <b>ថ្នាក់ ${escapeTelegramHtml(c.className)}:</b> វត្តមាន <b>${c.presentCount}/${c.studentCount}</b> (${c.rate}%) | អវត្តមាន: <b>${c.absentCount}</b>, ច្បាប់: <b>${c.leaveCount}</b>`;
    if (c.absentList.length > 0) {
      const details = c.absentList.map(a => {
        const badge = a.status === 'ABSENT' ? '❌' : '📝';
        const reason = a.reason ? ` - ${escapeTelegramHtml(a.reason)}` : '';
        return `    └ ${badge} ${escapeTelegramHtml(a.name)}${reason}`;
      }).join('\n');
      return `${header}\n${details}`;
    }
    return `${header} <i>(មកគ្រប់)</i>`;
  }).join('\n\n');

  if (!classListLines) {
    classListLines = '<i>មិនទាន់មានទិន្នន័យស្រង់វត្តមាននៅឡើយទេ</i>';
  }

  const triggerType = manualTrigger ? ' [ផ្ញើដោយផ្ទាល់]' : ' [ម៉ោង ០៥:០០ រសៀល]';

  const message = [
    '🏫 <b>វិទ្យាល័យអង្គរកា (Ang Roka High School)</b>',
    `📊 <b>របាយការណ៍សង្ខេបវត្តមានសិស្សប្រចាំថ្ងៃ</b>${triggerType}`,
    '━━━━━━━━━━━━━━━━━━━━',
    `📅 <b>កាលបរិច្ឆេទ:</b> ${dateText}`,
    `⏰ <b>ពេលវេលា:</b> ម៉ោង ${timeText}`,
    '━━━━━━━━━━━━━━━━━━━━',
    '📈 <b>ស្ថិតិសរុបទូទាំងសាលា:</b>',
    `  • ចំនួនថ្នាក់សរុប: <b>${classList.length}</b> ថ្នាក់`,
    `  • សិស្សសរុប: <b>${totalSchoolStudents}</b> នាក់`,
    `  • មានវត្តមាន: <b>${totalSchoolPresent}</b> នាក់ (<b>${overallRate}%</b>)`,
    `  • អវត្តមានគ្មានច្បាប់: <b>${totalSchoolAbsent}</b> នាក់`,
    `  • សុំច្បាប់: <b>${totalSchoolLeave}</b> នាក់`,
    '━━━━━━━━━━━━━━━━━━━━',
    '📋 <b>ព័ត៌មានលម្អិតតាមថ្នាក់នីមួយៗ:</b>',
    classListLines,
    '━━━━━━━━━━━━━━━━━━━━',
    '<i>🤖 ប្រព័ន្ធគ្រប់គ្រងវត្តមានសិស្សស្វ័យប្រវត្តិតាម Telegram Bot</i>'
  ].join('\n');

  // Dispatch to recipients
  const sendPromises = validRecipients.map(recipient =>
    sendTelegramMessage({
      token: recipient.token,
      chatId: recipient.chatId,
      text: message
    })
  );

  const results = await Promise.allSettled(sendPromises);
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

  return {
    success: successCount > 0,
    count: successCount,
    totalAttempted: validRecipients.length,
    date,
    overallRate
  };
}

/**
 * Dispatch discipline warning notification when student crosses discipline thresholds
 */
export async function dispatchDisciplineWarningNotification({
  student,
  totalAbsences,
  totalHours,
  warningLevel,
  botToken,
  chatId
}) {
  if (!botToken || !chatId || !student) return { success: false };

  const dateStr = getKhmerCurrentDateString();
  const message = [
    '⚠️ <b>សេចក្តីជូនដំណឹងអំពីការព្រមានវិន័យសិស្ស</b>',
    '🏫 <b>វិទ្យាល័យអង្គរកា (Ang Roka High School)</b>',
    '━━━━━━━━━━━━━━━━━━━━',
    `👤 <b>ឈ្មោះសិស្ស:</b> ${escapeTelegramHtml(student.name)}`,
    student.studentId ? `🆔 <b>អត្តលេខ:</b> ${escapeTelegramHtml(student.studentId)}` : null,
    `📚 <b>ថ្នាក់:</b> ${escapeTelegramHtml(student.class || student.className || 'ទូទៅ')}`,
    '━━━━━━━━━━━━━━━━━━━━',
    `🚨 <b>កម្រិតព្រមាន:</b> <b>${escapeTelegramHtml(warningLevel)}</b>`,
    `⏱️ <b>ចំនួនម៉ោងអវត្តមានសរុប:</b> <b>${totalHours}</b> ម៉ោង`,
    `📅 <b>ចំនួនថ្ងៃអវត្តមាន:</b> <b>${totalAbsences}</b> ថ្ងៃ`,
    `📅 <b>កាលបរិច្ឆេទ:</b> ${dateStr}`,
    '━━━━━━━━━━━━━━━━━━━━',
    '<i>សូមអាណាព្យាបាល ឬលោកគ្រូអ្នកគ្រូជួយតាមដាន និងអប់រំណែនាំសិស្សជាបន្ទាន់។</i>'
  ].filter(Boolean).join('\n');

  return await sendTelegramMessage({
    token: botToken,
    chatId,
    text: message
  });
}
