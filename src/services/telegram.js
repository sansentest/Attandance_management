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

const khmerNumbers = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
export const toKhmerNum = (num) => String(num ?? '').replace(/\d/g, c => khmerNumbers[parseInt(c, 10)] ?? c);

/**
 * Get current configured school name for Telegram messages
 */
export function getTelegramSchoolName() {
  try {
    const settingsRaw = localStorage.getItem('school_settings_cache');
    if (settingsRaw) {
      const parsed = JSON.parse(settingsRaw);
      if (parsed?.school?.name) return parsed.school.name.replace(/\s*\(.*\)$/, '').trim();
      if (parsed?.name) return parsed.name.replace(/\s*\(.*\)$/, '').trim();
    }
    const raw = localStorage.getItem('school_profile_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.name) return parsed.name.replace(/\s*\(.*\)$/, '').trim();
    }
  } catch (e) {}
  return 'វិទ្យាល័យអង្គរកា';
}

/**
 * Format a standard Date to Khmer readable date
 */
export function getKhmerCurrentDateString(d = new Date()) {
  const daysKhmer = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
  const monthsKhmer = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

  const dayName = daysKhmer[d.getDay()];
  const day = toKhmerNum(d.getDate());
  const month = monthsKhmer[d.getMonth()];
  const year = toKhmerNum(d.getFullYear());

  return `ថ្ងៃ${dayName} ទី${day} ខែ${month} ឆ្នាំ${year}`;
}

/**
 * Normalize raw Telegram chat ID, URL, or username into a valid Telegram chat_id
 * Accepts:
 * - Public Channel/Group/User URLs: https://t.me/username, t.me/username, https://telegram.me/username
 * - Public Channel/Group Message URLs: https://t.me/username/123
 * - Private Channel URLs: https://t.me/c/1234567890/12 -> -1001234567890
 * - Channel handle with @: @username
 * - Channel handle without @: username -> @username (if valid identifier)
 * - Numeric IDs: -100123456789, 123456789, -123456789
 */
export function normalizeTelegramChatId(rawChatId) {
  if (!rawChatId && rawChatId !== 0) return '';
  let str = String(rawChatId).trim();
  if (!str) return '';

  // 1. Private channel message URL: t.me/c/1234567890/...
  const privateMatch = str.match(/(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/c\/(\d+)/i);
  if (privateMatch && privateMatch[1]) {
    return `-100${privateMatch[1]}`;
  }

  // 2. Public channel/group/user URL: t.me/username or t.me/username/123
  const publicMatch = str.match(/(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]{4,})/i);
  if (publicMatch && publicMatch[1]) {
    const handle = publicMatch[1];
    if (!['joinchat', 'share', 'addstickers', 'addtheme'].includes(handle.toLowerCase())) {
      return `@${handle}`;
    }
  }

  // 3. Remove queries and trailing slashes
  str = str.replace(/[?#].*$/, '').replace(/\/+$/, '').trim();

  // 4. Pure integer ID (e.g. -1001234567890 or 123456789)
  if (/^-?\d+$/.test(str)) {
    return str;
  }

  // 5. Already starts with @
  if (str.startsWith('@')) {
    const handle = str.slice(1).split('/')[0].trim();
    return `@${handle}`;
  }

  // 6. Alphanumeric handle without @ (at least 4 chars)
  if (/^[a-zA-Z][a-zA-Z0-9_]{3,}$/.test(str)) {
    return `@${str}`;
  }

  return str;
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
  const cleanChatId = normalizeTelegramChatId(chatId);

  if (!cleanChatId) {
    return { success: false, error: 'Telegram Chat ID មិនត្រឹមត្រូវ ឬទទេ' };
  }

  // Detect invite links that cannot be used as chat_id
  if (cleanChatId.includes('/+') || cleanChatId.startsWith('+') || cleanChatId.includes('/joinchat/')) {
    return {
      success: false,
      error: 'កំហុស៖ Link អញ្ជើញ (Invite Link ដូចជា https://t.me/+...) មិនអាចប្រើជា Chat ID ក្នុង Bot API បានទេ! ប្រសិនបើជា Channel សាធារណៈ សូមប្រើ Channel Username (ឧ. @my_channel) ឬប្រសិនបើជា Channel ឯកជន សូមប្រើ Channel ID (ឧ. -100...)'
    };
  }

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

      // Auto-fallback: If Telegram rejected due to HTML entities parsing error, retry sending as plain text!
      if (parseMode && data.description && (data.description.includes("can't parse entities") || data.description.includes('tag'))) {
        try {
          console.warn('[Telegram] Retrying sending as plain text without HTML...');
          const plainText = text.replace(/<[^>]+>/g, '');
          const retryRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: cleanChatId,
              text: plainText,
              disable_web_page_preview: true
            })
          });
          const retryData = await retryRes.json();
          if (retryData.ok) {
            console.log('[Telegram] Plain-text fallback sent successfully!');
            return { success: true, result: retryData.result };
          }
        } catch (retryErr) {
          console.warn('[Telegram] Fallback retry failed:', retryErr);
        }
      }

      const friendlyError = formatTelegramApiError(data.description, response.status);
      return {
        success: false,
        error: friendlyError,
        rawDescription: data.description
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
 * Format raw Telegram Bot API error message to clear Khmer instructions
 */
export function formatTelegramApiError(desc = '', status = 0) {
  const d = String(desc || '').toLowerCase();
  if (d.includes("can't send messages to the bot") || d.includes("can't send messages to bots") || d.includes("message to the bot")) {
    return "កំហុស៖ លោកគ្រូ/អ្នកគ្រូបានដាក់ Username/ID របស់ Bot ក្នុងប្រអប់ Chat ID! សូមដាក់ Username របស់ Channel (ឧ. @my_channel) ឬ Channel/Group ID (ឧ. -100...) ជំនួសវិញ (Bot មិនអាចផ្ញើសារទៅកាន់ Bot ខ្លួនឯងបានទេ)។";
  }
  if (d.includes('chat not found')) {
    return "រកមិនឃើញ Chat/Channel នេះទេ! សូមពិនិត្យ៖\n១. ប្រសិនបើជា Channel៖ សូមប្រាកដថាបានដាក់ Username ត្រឹមត្រូវ (ឧ. @channel_name) ឬ Channel ID (-100...)\n២. ត្រូវតែ Add Bot ចូលក្នុង Channel នោះជា Administrator (បើកសិទ្ធិ Post Messages) ជាមុនសិន។";
  }
  if (d.includes('not a member') || d.includes('kicked') || d.includes('bot was removed')) {
    return "Bot មិនទាន់បានចូលក្នុង Group ឬ Channel នេះទេ! សូម Add Bot ចូលជា Administrator ជាមុនសិន។";
  }
  if (d.includes('not enough rights') || d.includes('need administrator rights') || d.includes('have no rights to send a message')) {
    return "Bot មិនទាន់មានសិទ្ធិផ្ញើសារក្នុង Channel ទេ! សូមចូលទៅកាន់ Channel > Administrators > បើកសិទ្ធិ Post Messages ឱ្យ Bot។";
  }
  if (d.includes('blocked by the user')) {
    return "អ្នកប្រើប្រាស់បាន Block bot នេះ! សូមចូលទៅកាន់ Bot នោះក្នុង Telegram រួចចុច /start ម្តងទៀត។";
  }
  if (d.includes('unauthorized')) {
    return "Bot Token មិនត្រឹមត្រូវ! សូមពិនិត្យមើល Token ដែលបានចម្លងពី @BotFather ឡើងវិញ។";
  }
  return desc || `HTTP ${status}: បរាជ័យក្នុងការផ្ញើសារ`;
}

/**
 * Send a test message to verify Bot Token and Chat ID
 */
export async function testTelegramBotConnection({ token, chatId, botName = '', className = '' }) {
  const dateStr = getKhmerCurrentDateString();
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const targetRecipient = normalizeTelegramChatId(chatId);

  const message = [
    '🔔 <b>ការតភ្ជាប់ប្រព័ន្ធ Telegram Bot ជោគជ័យ!</b>',
    '🏫 <b>វិទ្យាល័យអង្គរកា (Ang Roka High School)</b>',
    '━━━━━━━━━━━━━━━━━━━━',
    `✅ <b>ស្ថានភាព:</b> បានតភ្ជាប់ដោយជោគជ័យ`,
    botName ? `🤖 <b>Bot:</b> ${escapeTelegramHtml(botName)}` : null,
    className ? `📚 <b>ថ្នាក់បន្ទុក:</b> ${escapeTelegramHtml(className)}` : null,
    targetRecipient ? `🎯 <b>គោលដៅ:</b> <code>${escapeTelegramHtml(targetRecipient)}</code>` : null,
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
  const norm = (c) => String(c || '').replace(/^(ថ្នាក់ទី|ថ្នាក់|\s)+/i, '').trim().toLowerCase();
  const targetNorm = norm(targetClass);

  // Resolve matching active bots with tolerant class matching
  let matchingBots = bots.filter(b => {
    if (b.status === 'inactive') return false;
    if (!b.class || b.class === 'ALL' || norm(b.class) === 'all') return true;
    return norm(b.class) === targetNorm || b.class === targetClass;
  });

  // If bot uses GLOBAL_TOKEN, resolve actual token from active global tokens
  const activeGlobal = globalTokens.find(t => t.isActive) || globalTokens[0];
  const globalTokenVal = activeGlobal ? activeGlobal.token : '';

  const validRecipients = [];
  matchingBots.forEach(b => {
    let finalToken = b.token;
    if (finalToken === 'GLOBAL_TOKEN' || !finalToken) {
      if (b.globalTokenId) {
        const specificGlobal = globalTokens.find(t => t.id === b.globalTokenId);
        finalToken = specificGlobal ? specificGlobal.token : globalTokenVal;
      } else {
        finalToken = globalTokenVal;
      }
    }
    if (finalToken === 'GLOBAL_TOKEN') {
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
    console.warn(`[Telegram Dispatch] No valid recipients found for class "${targetClass}". Total bots: ${bots.length}, Matching: ${matchingBots.length}`);
    return { success: true, count: 0, message: 'មិនមាន Telegram Bot សកម្មសម្រាប់ថ្នាក់នេះទេ' };
  }

  // Format attendance records
  const records = payload.records || [];
  const absentRecords = records.filter(r => r.status === 'ABSENT');
  const leaveRecords = records.filter(r => r.status === 'LEAVE');
  const dropoutRecords = records.filter(r => r.status === 'DROPOUT');
  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const totalCount = records.length;

  const dateStr = getKhmerCurrentDateString();

  const cleanClass = String(targetClass || '').replace(/^(ថ្នាក់ទី|ថ្នាក់|\s)+/i, '').trim() || targetClass;
  const rawRecorder = payload.recordedBy || 'ប្រធានថ្នាក់';
  const recorderAlreadyHasClass = rawRecorder.includes('(') || (cleanClass && rawRecorder.toLowerCase().includes(cleanClass.toLowerCase()));
  const recorderText = (!recorderAlreadyHasClass && cleanClass) ? `${rawRecorder} (${cleanClass})` : rawRecorder;

  const rawPeriod = payload.period || payload.periodLabel || '';
  const rawPeriodClean = String(rawPeriod).replace(/^(ម៉ោងទី|ម៉ោង|\s)+/i, '').trim();
  const periodDisplay = rawPeriodClean
    ? `ម៉ោងទី ${toKhmerNum(rawPeriodClean).replace(/-/g, '–')}`
    : 'ម៉ោងសិក្សា';
  const hoursNum = payload.hours || (rawPeriodClean.includes('-') || rawPeriodClean.includes('–') ? 2 : 1);
  const hoursText = `(${toKhmerNum(hoursNum)} ម៉ោង)`;

  const subjectText = payload.subject || 'ភាសាខ្មែរ';

  let absentListText = '';
  const nonPresent = [...absentRecords, ...leaveRecords, ...dropoutRecords];
  if (nonPresent.length === 0) {
    absentListText = '✅ <i>សិស្សមានវត្តមានគ្រប់ចំនួន (គ្មានអវត្តមានឡើយ 🎉)</i>';
  } else {
    absentListText = nonPresent.map((s, idx) => {
      const numKh = toKhmerNum(idx + 1);
      const icon = s.status === 'ABSENT' ? '' : s.status === 'DROPOUT' ? '' : '';
      const statusText = s.status === 'ABSENT'
        ? 'អវត្តមាន'
        : s.status === 'DROPOUT'
          ? 'ឈប់រៀន'
          : 'សុំច្បាប់';

      let reasonPart = '';
      if (s.reason) {
        const rClean = s.reason.trim();
        const genericReasons = [
          'គ្មានច្បាប់',
          'គ្មានច្បាប់ / គេចម៉ោង',
          'មានច្បាប់ត្រឹមត្រូវ',
          'មានច្បាប់',
          'សុំច្បាប់',
          'ឈប់រៀន'
        ];
        if (!genericReasons.includes(rClean)) {
          reasonPart = ` (${escapeTelegramHtml(rClean)})`;
        }
      }

      return `${numKh}. ${icon} <b>${escapeTelegramHtml(s.name)}</b> — ${statusText}${reasonPart}`;
    }).join('\n');
  }

  let summaryLine = '';
  if (nonPresent.length === 0) {
    summaryLine = `📊 <b>សរុប៖</b> មកគ្រប់ <b>${toKhmerNum(totalCount)}/${toKhmerNum(totalCount)}</b> នាក់ (<b>១០០%</b>)`;
  } else {
    const totalAbsentNum = absentRecords.length + leaveRecords.length + dropoutRecords.length;
    if (leaveRecords.length === 0 && dropoutRecords.length === 0) {
      summaryLine = `📊 <b>សរុប៖</b> សិស្សអវត្តមាន <b>${toKhmerNum(totalAbsentNum)}</b> នាក់`;
    } else {
      const parts = [];
      if (absentRecords.length > 0) parts.push(`អវត្តមាន <b>${toKhmerNum(absentRecords.length)}</b> នាក់`);
      if (leaveRecords.length > 0) parts.push(`សុំច្បាប់ <b>${toKhmerNum(leaveRecords.length)}</b> នាក់`);
      if (dropoutRecords.length > 0) parts.push(`ឈប់រៀន <b>${toKhmerNum(dropoutRecords.length)}</b> នាក់`);
      summaryLine = `📊 <b>សរុប៖</b> សិស្សអវត្តមាន <b>${toKhmerNum(totalAbsentNum)}</b> នាក់ (${parts.join(', ')})`;
    }
  }

  const schoolName = getTelegramSchoolName();

  const isUpdate = Boolean(payload && payload.isUpdate);
  const updateTag = isUpdate ? ' [កែប្រែ]' : '';

  const message = [
    `🏫 <b>${escapeTelegramHtml(schoolName)}   អវត្តមានសិស្សតាមម៉ោង${updateTag}</b>`,
    ' ',
    `${dateStr}`,
    `<b>ថ្នាក់ទី៖</b> ${escapeTelegramHtml(cleanClass)}`,
    `<b>ម៉ោងសិក្សា៖</b> ${periodDisplay} ${hoursText}`,
    `<b>មុខវិជ្ជា៖</b> ${escapeTelegramHtml(subjectText)}`,
    payload.teacher ? `<b>គ្រូបង្រៀន៖</b> ${escapeTelegramHtml(payload.teacher)}` : null,
    ' ',
    '⚠️ <b>បញ្ជីឈ្មោះសិស្សអវត្តមាន</b>',
    ' ',
    `${absentListText}`,
    ' ',
    `${summaryLine}`,
    ' ',
    `<i>អ្នកស្រង់៖ ${escapeTelegramHtml(recorderText)} </i>`,
  ].filter(Boolean).join('\n');

  // Dispatch to all matching recipients in parallel
  const sendPromises = validRecipients.map(recipient =>
    sendTelegramMessage({
      token: recipient.token,
      chatId: recipient.chatId,
      text: message
    }).then(res => {
      if (res && res.success) {
        console.log(`[Telegram Dispatch] ✅ Sent to ${recipient.name} (${recipient.chatId})`);
      } else {
        console.warn(`[Telegram Dispatch] ❌ Failed sending to ${recipient.name} (${recipient.chatId}):`, res ? res.error : 'Unknown error');
      }
      return res;
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
  manualTrigger = false,
  disciplineTracking = []
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
    const norm = (c) => String(c || '').replace(/^(ថ្នាក់ទី|ថ្នាក់|\s)+/i, '').trim().toLowerCase();
    const classNorm = norm(className);
    const classStudents = students.filter(s => norm(s.className || s.class) === classNorm);
    const classRecs = dayRecords.filter(r => norm(r.class) === classNorm);

    // Unique students marked absent or leave today in this class
    const absentMap = new Map();
    classRecs.forEach(r => {
      const key = r.studentId || r.name;
      if (!absentMap.has(key)) {
        absentMap.set(key, {
          name: r.name,
          status: r.status,
          reason: r.reason,
          period: r.period,
          isFullDay: Boolean(r.isFullDay),
          records: [r]
        });
      } else {
        const item = absentMap.get(key);
        item.records.push(r);
        if (r.status === 'ABSENT') {
          item.status = 'ABSENT';
        }
        if (r.isFullDay) {
          item.isFullDay = true;
        }
        if (r.reason && !item.reason) {
          item.reason = r.reason;
        }
      }
    });

    const absentList = Array.from(absentMap.values());
    const absentCount = absentList.filter(s => s.status === 'ABSENT').length;
    // បើសិស្សសុំច្បាប់តែម្តង (1 ម៉ោង) មិនរាប់ជាការបាត់បង់វត្តមាន ១ ថ្ងៃឡើយ
    const leaveDayCount = absentList.filter(s => s.status === 'LEAVE' && (s.isFullDay || s.records.length > 1)).length;
    const leaveTotalCount = absentList.filter(s => s.status === 'LEAVE').length;

    const studentCount = classStudents.length > 0 ? classStudents.length : Math.max(30, absentList.length);
    const presentCount = Math.max(0, studentCount - absentCount - leaveDayCount);
    const rate = studentCount > 0 ? Math.round((presentCount / studentCount) * 100) : 100;

    totalSchoolStudents += studentCount;
    totalSchoolPresent += presentCount;
    totalSchoolAbsent += absentCount;
    totalSchoolLeave += leaveTotalCount;

    classSummaries.push({
      className,
      studentCount,
      presentCount,
      absentCount,
      leaveCount: leaveTotalCount,
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

  // 4. Construct Khmer message: Filter ONLY classes that have absences or leave
  const classesWithAbsence = classSummaries.filter(
    c => c.absentCount > 0 || c.leaveCount > 0 || (c.absentList && c.absentList.length > 0)
  );

  let classListLines = ' ';
  if (classesWithAbsence.length > 0) {
    classListLines = classesWithAbsence.map(c => {
      const cleanClass = String(c.className || '').replace(/^(ថ្នាក់ទី|ថ្នាក់|\s)+/i, '').trim() || c.className;
      const classHeader = `<b>${escapeTelegramHtml(cleanClass)}</b>`;

      const studentLines = (c.absentList || []).map(a => {
        const absentRecords = (a.records || []).filter(r => r.status === 'ABSENT');
        const leaveRecords = (a.records || []).filter(r => r.status === 'LEAVE');
        const dropoutRecords = (a.records || []).filter(r => r.status === 'DROPOUT');

        const getHours = (recs) => recs.reduce((sum, r) => {
          const h = Number(r.hours);
          if (!isNaN(h) && h > 0) return sum + h;
          const p = String(r.period || '');
          return sum + (p.includes('-') || p === '1-2' ? 2 : 1);
        }, 0);

        const absentHrs = getHours(absentRecords);
        const leaveHrs = getHours(leaveRecords);
        const totalHrs = getHours(a.records || []);

        let statusText = ' ';
        if (absentHrs > 0 && leaveHrs > 0) {
          statusText = `អវត្តមាន ${toKhmerNum(absentHrs)} ម៉ោង, សុំច្បាប់ ${toKhmerNum(leaveHrs)} ម៉ោង`;
        } else if (a.status === 'ABSENT' || absentHrs > 0) {
          statusText = absentHrs > 0 ? `អវត្តមាន ${toKhmerNum(absentHrs)} ម៉ោង` : 'អវត្តមាន';
        } else if (a.status === 'LEAVE' || leaveHrs > 0) {
          statusText = leaveHrs > 0 ? `សុំច្បាប់ ${toKhmerNum(leaveHrs)} ម៉ោង` : 'សុំច្បាប់';
        } else if (a.status === 'DROPOUT' || dropoutRecords.length > 0) {
          statusText = 'ឈប់រៀន';
        } else {
          statusText = totalHrs > 0 ? `អវត្តមាន ${toKhmerNum(totalHrs)} ម៉ោង` : 'អវត្តមាន';
        }

        let reasonSuffix = ' ';
        if (a.reason) {
          const rClean = a.reason.trim();
          const genericReasons = [
            'គ្មានច្បាប់',
            'គ្មានច្បាប់ / គេចម៉ោង',
            'មានច្បាប់ត្រឹមត្រូវ',
            'មានច្បាប់',
            'សុំច្បាប់',
            'ឈប់រៀន'
          ];
          if (!genericReasons.includes(rClean)) {
            reasonSuffix = ` (${escapeTelegramHtml(rClean)})`;
          }
        }

        return `- ${escapeTelegramHtml(a.name)} ${statusText}${reasonSuffix}`;
      }).join('\n');

      return `${classHeader}\n${studentLines}`;
    }).join('\n\n');
  } else {
    classListLines = '✅ <i>គ្រប់ថ្នាក់ទាំងអស់មកគ្រប់ ១០០% (គ្មានសិស្សអវត្តមានឡើយ 🎉)</i>';
  }

  const triggerType = manualTrigger ? ' [ផ្ញើដោយផ្ទាល់]' : ' [ម៉ោង ០៥:០០ រសៀល]';
  const detailTitle = '📋 <b>ឈ្មោះសិស្សអវត្តមានតាមថ្នាក់មាន៖</b>';

  // 5. Build discipline warning students list
  let thresholds = { '7-9': 20, '10-12': 20 };
  try {
    const rawThresh = localStorage.getItem('disciplineThresholds');
    if (rawThresh) thresholds = { ...thresholds, ...JSON.parse(rawThresh) };
    const settingsRaw = localStorage.getItem('school_settings_cache');
    if (settingsRaw) {
      const parsedSettings = JSON.parse(settingsRaw);
      if (parsedSettings?.discipline) {
        thresholds = { ...thresholds, ...parsedSettings.discipline };
      }
    }
  } catch (e) {}

  const getThresholdForClass = (cls) => {
    const match = String(cls || '').match(/\d+/);
    const grade = match ? parseInt(match[0], 10) : 10;
    if (grade >= 7 && grade <= 9 && thresholds['7-9'] !== undefined) return Number(thresholds['7-9']) || 20;
    if (grade >= 10 && grade <= 12 && thresholds['10-12'] !== undefined) return Number(thresholds['10-12']) || 20;
    return Number(thresholds['10-12']) || Number(thresholds['7-9']) || 20;
  };

  const isCriticalWarningStudent = (s) => {
    const limit = getThresholdForClass(s.class || s.className);
    const absentDays = Number(s.absent) || (s.absentDates ? s.absentDates.size : 0);
    // Strictly must reach or exceed the school threshold in DAYS
    return absentDays >= limit;
  };

  let warningStudents = [];
  if (Array.isArray(disciplineTracking) && disciplineTracking.length > 0) {
    warningStudents = disciplineTracking.filter(isCriticalWarningStudent);
  } else {
    try {
      const cachedRaw = localStorage.getItem('school_discipline_cache');
      if (cachedRaw) {
        const cachedList = JSON.parse(cachedRaw);
        if (Array.isArray(cachedList)) {
          warningStudents = cachedList.filter(isCriticalWarningStudent);
        }
      }
    } catch (e) {}

    // Fallback: check from all attendance records
    if (warningStudents.length === 0) {
      try {
        const rawRecs = localStorage.getItem('school_attendance_records');
        const allRecs = rawRecs ? JSON.parse(rawRecs) : (records || []);
        const studentMap = new Map();
        allRecs.forEach(r => {
          if (r.status === 'ABSENT' || !r.status) {
            const key = String(r.studentId || r.name).toLowerCase().trim();
            if (!studentMap.has(key)) {
              studentMap.set(key, {
                name: r.name,
                class: r.class,
                absentDates: new Set(r.date ? [r.date] : []),
                absentHours: Number(r.hours) || 1
              });
            } else {
              const item = studentMap.get(key);
              if (r.date) item.absentDates.add(r.date);
              item.absentHours += (Number(r.hours) || 1);
            }
          }
        });

        studentMap.forEach(item => {
          const limit = getThresholdForClass(item.class);
          const absentDays = item.absentDates.size;
          // Strictly must reach or exceed the school threshold in DAYS
          if (absentDays >= limit) {
            warningStudents.push({
              name: item.name,
              class: item.class,
              absent: absentDays,
              absentHours: item.absentHours
            });
          }
        });
      } catch (e) {}
    }
  }

  // Ensure unique students in warning list to prevent duplicate rows
  const uniqueWarningMap = new Map();
  warningStudents.forEach(s => {
    const key = String(s.id || s.studentId || s.name).toLowerCase().trim();
    if (!uniqueWarningMap.has(key)) {
      uniqueWarningMap.set(key, s);
    }
  });
  warningStudents = Array.from(uniqueWarningMap.values());
  warningStudents.sort((a, b) => (Number(b.absent) || 0) - (Number(a.absent) || 0));

  const disciplineWarningBlock = warningStudents.length > 0 ? [
    '━━━━━━━━━━━━━━━━━━━━',
    '⚠️ <b>សេចក្តីជូនដំណឹងអំពីការព្រមានវិន័យសិស្ស៖</b>',
    ' ',
    '🚨 <b>កម្រិតព្រមាន:</b> ត្រូវហៅអាណាព្យាបាល',
    ' ',
    ...warningStudents.map((s, idx) => {
      const cleanClass = String(s.class || s.className || '').replace(/^(ថ្នាក់ទី|ថ្នាក់|\s)+/i, '').trim() || s.class;
      const days = Number(s.absent) || (s.absentDates ? s.absentDates.size : 0);
      const daysText = days > 0
        ? `_អវត្តមាន${toKhmerNum(days)}ថ្ងៃ`
        : (s.absentHours ? `_អវត្តមាន${toKhmerNum(s.absentHours)}ម៉ោង` : '_អវត្តមាន');
      return `${idx + 1}. <b>${escapeTelegramHtml(s.name)}</b> (ថ្នាក់ ${escapeTelegramHtml(cleanClass)}) ${daysText}`;
    }),
    ' ',
    '<i>សូមអាណាព្យាបាល ឬលោកគ្រូអ្នកគ្រូជួយតាមដាន និងអប់រំណែនាំសិស្សជាបន្ទាន់។</i>'
  ] : [];

  const schoolName = getTelegramSchoolName();

  const message = [
    `🏫 <b>${escapeTelegramHtml(schoolName)}</b>`,
    ' ',
    `📊 <b>របាយការណ៍សង្ខេបវត្តមានសិស្សប្រចាំថ្ងៃ</b>${triggerType}`,
    '━━━━━━━━━━━━━━━━━━━━',
    `📅 <b>កាលបរិច្ឆេទ:</b> ${dateText}`,
    `⏰ <b>ពេលវេលា:</b> ម៉ោង ${timeText}`,
    '━━━━━━━━━━━━━━━━━━━━',
    '📈 <b>ស្ថិតិសរុបទូទាំងសាលា៖</b>',
    ' ',
    `  • ចំនួនថ្នាក់សរុប: <b>${toKhmerNum(classList.length)}</b> ថ្នាក់`,
    `  • សិស្សសរុប: <b>${toKhmerNum(totalSchoolStudents)}</b> នាក់`,
    `  • មានវត្តមានសរុប: <b>${toKhmerNum(totalSchoolPresent)}</b> នាក់ (<b>${toKhmerNum(overallRate)}%</b>)`,
    `  • អវត្តមានសរុប: <b>${toKhmerNum(totalSchoolAbsent)}</b> នាក់`,
    `  • សុំច្បាប់សរុប: <b>${toKhmerNum(totalSchoolLeave)}</b> នាក់`,
    '━━━━━━━━━━━━━━━━━━━━',
    detailTitle,
    ' ',
    classListLines,
    ...disciplineWarningBlock,
    '━━━━━━━━━━━━━━━━━━━━',
    `<i>🤖 ប្រព័ន្ធគ្រប់គ្រងវត្តមាន${escapeTelegramHtml(schoolName)}</i>`
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
  totalAbsences = 0,
  totalHours = 0,
  warningLevel = 'ត្រូវហៅអាណាព្យាបាល (Critical)',
  bots = [],
  globalTokens = [],
  className = '',
  botToken,
  chatId
}) {
  if (!student) return { success: false, error: 'មិនមានព័ត៌មានសិស្ស' };

  const schoolName = getTelegramSchoolName();

  const targetClass = className || student.class || student.className || '';
  const cleanClass = String(targetClass).replace(/^(ថ្នាក់ទី|ថ្នាក់|\s)+/i, '').trim() || targetClass;
  const days = Number(totalAbsences) || 1;

  const message = [
    '⚠️ <b>សេចក្តីជូនដំណឹងអំពីការព្រមានវិន័យសិស្ស៖</b>',
    ' ',
    `🏫 <b>${escapeTelegramHtml(schoolName)}</b>`,
    ' ',
    '🚨 <b>កម្រិតព្រមាន:</b> ត្រូវហៅអាណាព្យាបាល',
    ' ',
    `1. <b>${escapeTelegramHtml(student.name)}</b> (ថ្នាក់ ${escapeTelegramHtml(cleanClass)}) _អវត្តមាន${toKhmerNum(days)}ថ្ងៃ`,
    ' ',
    '<i>សូមអាណាព្យាបាល ឬលោកគ្រូអ្នកគ្រូជួយតាមដាន និងអប់រំណែនាំសិស្សជាបន្ទាន់។</i>',
    ' '
  ].filter(Boolean).join('\n');

  // Direct recipient if provided
  if (botToken && chatId) {
    return await sendTelegramMessage({
      token: botToken,
      chatId,
      text: message
    });
  }

  // Resolve matching bots for class or ALL
  const norm = (c) => String(c || '').replace(/^(ថ្នាក់ទី|ថ្នាក់|\s)+/i, '').trim().toLowerCase();
  const targetNorm = norm(targetClass);

  let matchingBots = bots.filter(b => {
    if (b.status === 'inactive') return false;
    if (!b.class || b.class === 'ALL' || norm(b.class) === 'all') return true;
    return norm(b.class) === targetNorm || b.class === targetClass;
  });

  const activeGlobal = globalTokens.find(t => t.isActive) || globalTokens[0];
  const globalTokenVal = activeGlobal ? activeGlobal.token : '';

  const validRecipients = [];
  matchingBots.forEach(b => {
    let finalToken = b.token;
    if (finalToken === 'GLOBAL_TOKEN' || !finalToken) {
      if (b.globalTokenId) {
        const specificGlobal = globalTokens.find(t => t.id === b.globalTokenId);
        finalToken = specificGlobal ? specificGlobal.token : globalTokenVal;
      } else {
        finalToken = globalTokenVal;
      }
    }
    if (finalToken === 'GLOBAL_TOKEN') {
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
    console.warn('[Discipline Telegram Dispatch] No valid recipients for class:', targetClass);
    return { success: false, count: 0, message: 'មិនមាន Telegram Bot សកម្មសម្រាប់ទទួលការព្រមានទេ' };
  }

  const sendPromises = validRecipients.map(recipient =>
    sendTelegramMessage({
      token: recipient.token,
      chatId: recipient.chatId,
      text: message
    }).then(res => {
      if (res && res.success) {
        console.log(`[Discipline Warning] ✅ Sent to ${recipient.name} (${recipient.chatId}) for student ${student.name}`);
      } else {
        console.warn(`[Discipline Warning] ❌ Failed to ${recipient.name}:`, res ? res.error : 'Unknown error');
      }
      return res;
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
