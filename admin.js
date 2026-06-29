const $ = (id) => document.getElementById(id);

const typeSelect = $('adminReportType');
const output = $('adminOutput');
const DEFAULT_LEAVE_RULES_LINK = 'https://discord.com/channels/1071933157097615480/1071934713524133918/1500101205320536155';
const DEFAULT_LEAVE_NOTES = 'يلزم الفني اكمال 24 ساعة من اخر اجازة و التأكد من المخالفات و تصفير الاجازات';
const DEFAULT_ROLE_MENTION = '<@&1149742928953086105>';

const forms = {
  leave: $('leaveForm'),
  assignment: $('assignmentForm')
};

const leaveFields = {
  personLabel: $('leavePersonLabel'),
  technician: $('leaveTechnician'),
  duration: $('leaveDuration'),
  remaining: $('leaveRemaining'),
  calculatedRemaining: $('leaveCalculatedRemaining'),
  fromDate: $('leaveFromDate'),
  fromTime: $('leaveFromTime'),
  fromPeriod: $('leaveFromPeriod'),
  toDate: $('leaveToDate'),
  toTime: $('leaveToTime'),
  toPeriod: $('leaveToPeriod'),
  rulesLink: $('leaveRulesLink'),
  notes: $('leaveNotes'),
  roleMention: $('leaveRoleMention'),
  signature: $('rewardSignature')
};

const leaveUi = {
  balanceFields: Array.from(document.querySelectorAll('.leave-balance-field')),
  notesTitle: document.querySelector('.leave-notes-title'),
  notesGroup: document.querySelector('.leave-notes-group'),
  signatureTitle: document.querySelector('.reward-signature-title'),
  signatureGroup: document.querySelector('.reward-signature-group')
};

const assignmentFields = {
  mention: $('assignmentMention'),
  employee: $('assignmentEmployee'),
  sector: $('assignmentSector'),
  duration: $('assignmentDuration')
};

function value(input, fallback = 'لا يوجد') {
  const text = String(input?.value || '').trim();
  return text.length ? text : fallback;
}

function setValue(input, val) {
  input.value = val;
}

function formatDate(input, fallback = '0000/00/00') {
  const text = String(input.value || '').trim();
  if (!text.length) return fallback;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text.replaceAll('-', '/');
  return text;
}

function formatTime(input, fallback = '00:00') {
  const text = String(input.value || '').trim();
  return text.length ? text : fallback;
}

function normalizeArabicNumbers(text) {
  return String(text || '')
    .replace(/[٠-٩]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit))
    .replace(/[۰-۹]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit));
}


function convertDiscordIdsToMentions(text) {
  const placeholders = [];
  let working = normalizeArabicNumbers(String(text || ''));

  working = working.replace(/<@&?!?\d{15,25}>|<@!?\d{15,25}>/g, (mention) => {
    const token = `__MENTION_${placeholders.length}__`;
    placeholders.push(mention);
    return token;
  });

  working = working.replace(/\b\d{15,25}\b/g, (id) => `<@${id}>`);

  placeholders.forEach((mention, index) => {
    working = working.replace(`__MENTION_${index}__`, mention);
  });

  return working.trim();
}

function formatMentionField(input) {
  if (!input) return;
  const before = input.value;
  const after = convertDiscordIdsToMentions(before);
  if (after !== before) {
    input.value = after;
  }
}

function scheduleMentionFieldFormat(input) {
  if (!input) return;
  window.clearTimeout(input.autoMentionTimer);
  input.autoMentionTimer = window.setTimeout(() => {
    const text = normalizeArabicNumbers(input.value);
    // عند لصق أو كتابة Copy ID كامل، يظهر المنشن داخل الخانة نفسها مباشرة.
    if (/\b\d{17,25}\b/.test(text)) {
      formatMentionField(input);
    }
  }, 120);
}

const adminAutoMentionFields = [
  leaveFields.technician,
  leaveFields.signature,
  assignmentFields.mention
];

function formatAdminAutoMentions() {
  adminAutoMentionFields.forEach(formatMentionField);
}

function parseHours(text) {
  const clean = normalizeArabicNumbers(text).trim();
  if (!clean) return null;

  const timeMatch = clean.match(/(\d+(?:\.\d+)?)\s*[:：]\s*(\d+(?:\.\d+)?)/);
  if (timeMatch) return Number(timeMatch[1]) + (Number(timeMatch[2]) / 60);

  const numberMatch = clean.match(/-?\d+(?:\.\d+)?/);
  if (!numberMatch) return null;
  return Number(numberMatch[0]);
}

function formatHours(amount) {
  if (amount === null || Number.isNaN(amount)) return '';
  const rounded = Math.round(amount * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/\.?0+$/, '');
  return `${text} ساعة`;
}

function calculateRemainingBalance() {
  const balance = parseHours(leaveFields.remaining.value);
  const duration = parseHours(leaveFields.duration.value);
  if (balance === null || duration === null) {
    leaveFields.calculatedRemaining.value = '';
    return '';
  }

  const remaining = balance - duration;
  const formatted = formatHours(remaining);
  leaveFields.calculatedRemaining.value = formatted;
  return formatted;
}

function toast(message) {
  const box = $('toast');
  box.textContent = message;
  box.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => box.classList.remove('show'), 1800);
}

function isMerchantLeave() {
  return typeSelect.value === 'merchantLeave';
}

function isLeadershipReward() {
  return typeSelect.value === 'leadershipReward';
}

function currentSection() {
  return typeSelect.value === 'externalAssignment' ? 'assignment' : 'leave';
}

function ensureLeaveRulesLink() {
  if (!String(leaveFields.rulesLink.value || '').trim()) {
    leaveFields.rulesLink.value = DEFAULT_LEAVE_RULES_LINK;
  }
}

function ensureLeaveNotes() {
  if (!String(leaveFields.notes.value || '').trim()) {
    leaveFields.notes.value = DEFAULT_LEAVE_NOTES;
  }
}

function ensureRoleMention() {
  if (!String(leaveFields.roleMention.value || '').trim()) {
    leaveFields.roleMention.value = DEFAULT_ROLE_MENTION;
  }
}

function toggleLeaveUi() {
  const merchant = isMerchantLeave();
  const reward = isLeadershipReward();
  leaveFields.personLabel.textContent = merchant ? 'التاجر المحترم' : 'الفني المحترم';
  leaveFields.technician.placeholder = 'ضع Copy ID هنا وسيظهر كمنشن تلقائياً';
  leaveUi.balanceFields.forEach((el) => el.classList.toggle('hidden', merchant || reward));
  leaveUi.notesTitle?.classList.toggle('hidden', merchant || reward);
  leaveUi.notesGroup?.classList.toggle('hidden', merchant || reward);
  leaveUi.signatureTitle?.classList.toggle('hidden', !reward);
  leaveUi.signatureGroup?.classList.toggle('hidden', !reward);
}

function updateVisibleForm() {
  const section = currentSection();
  Object.entries(forms).forEach(([key, form]) => {
    form.classList.toggle('hidden', key !== section);
  });
  toggleLeaveUi();
  output.value = 'سيظهر التقرير الإداري هنا بعد الضغط على إنشاء التقرير.';
}

function getLeaveCommonData() {
  ensureLeaveRulesLink();
  ensureRoleMention();
  return {
    person: String(leaveFields.technician.value || '').trim(),
    duration: value(leaveFields.duration, '00 ساعة'),
    fromDate: formatDate(leaveFields.fromDate),
    fromTime: formatTime(leaveFields.fromTime),
    fromPeriod: value(leaveFields.fromPeriod, 'ص'),
    toDate: formatDate(leaveFields.toDate),
    toTime: formatTime(leaveFields.toTime),
    toPeriod: value(leaveFields.toPeriod, 'ص'),
    rulesLink: value(leaveFields.rulesLink, DEFAULT_LEAVE_RULES_LINK),
    roleMention: value(leaveFields.roleMention, DEFAULT_ROLE_MENTION)
  };
}

function buildMerchantLeaveReport() {
  const data = getLeaveCommonData();
  return `***\` إجازة تاجر \`*** 

***\`التاجر المحترم :\` ${data.person}     ***            

***\`المــــدة :\` ${data.duration}*** 

***من تاريخ ${data.fromDate} ${data.fromTime} ${data.fromPeriod}*** 
***الى تاريخ ${data.toDate} ${data.toTime} ${data.toPeriod} *** 


***يجب قراءة كامل [قوانين الإجازات](${data.rulesLink}) والافادة بالاستلام بوضع رياكشن ***

\`جهلك بالقوانين لا يعفيك من العقوبة
\`*** 
${data.roleMention}  ***`;
}

function buildLeadershipRewardReport() {
  const data = getLeaveCommonData();
  const signature = String(leaveFields.signature.value || '').trim();

  return `***\` مكافأة قيادية  \`*** 

***\`الفني المحترم :\` ${data.person}     ***            

***\`المــــدة :\` ${data.duration}***  

***من تاريخ ${data.fromDate} ${data.fromTime} ${data.fromPeriod}*** 
***الى تاريخ ${data.toDate} ${data.toTime} ${data.toPeriod} *** 


***يجب قراءة كامل [قوانين الإجازات](${data.rulesLink}) والافادة بالاستلام بوضع رياكشن ***

\`جهلك بالقوانين لا يعفيك من العقوبة
\`*** 
***\`توقيع و اعتماد :\` ${signature}***  

${data.roleMention}  ***`;
}

function buildLeaveReport() {
  if (isMerchantLeave()) return buildMerchantLeaveReport();
  if (isLeadershipReward()) return buildLeadershipRewardReport();

  const title = typeSelect.value === 'externalLeave' ? 'إجازة خارجية' : 'إجازة داخلية';
  const data = getLeaveCommonData();
  const remaining = calculateRemainingBalance() || value(leaveFields.calculatedRemaining, '00 ساعة');
  const notes = value(leaveFields.notes, DEFAULT_LEAVE_NOTES);

  return `***\` ${title} \`*** 

***\`الفني المحترم : \` ${value(leaveFields.technician)}     ***            

***\`المــــدة :\` ${data.duration}*** 
***\`الرصيد المتبقي :\` ${remaining}*** 

***من تاريخ ${data.fromDate} ${data.fromTime} ${data.fromPeriod}*** 
***الى تاريخ ${data.toDate} ${data.toTime} ${data.toPeriod} *** 

***\`الملاحظات :\` ${notes}***

***يجب قراءة كامل [قوانين الإجازات](${data.rulesLink}) والافادة بالاستلام بوضع رياكشن ***

\`جهلك بالقوانين لا يعفيك من العقوبة
\`*** 
${data.roleMention}  ***`;
}

function buildAssignmentReport() {
  return `*** ▬▬▬ ﷽ ▬▬
\`\`\`الموضوع : انتداب خارجي \`\`\`
السلام عليكم ورحمة الله وبركاته، وبعد:
 \`\`\`cs
# إشارة إلى طلب الموظف الموضحة بياناته أدناه بشأن الانتداب خارج الكراج، نفيدكم بأنه تمت الموافقة على طلبه وفق التفاصيل التالية:
\`\`\`

 الاسم:  ${value(assignmentFields.mention)} 
 اسم وكود الموظف :  ${value(assignmentFields.employee, '[CD| G-163] سعيد البدواوي')}
 القطاع المنتدب له: ${value(assignmentFields.sector, 'لا يوجد')}
 المدة : ${value(assignmentFields.duration, 'لا يوجد')}
نرجوا من الموظف التقيد بالأنظمة والتعليمات الخاصة بالانتدابات، والتنسيق مع الجهة المعنية قبل المباشرة. ***`;
}

function buildReport() {
  formatAdminAutoMentions();
  return currentSection() === 'assignment' ? buildAssignmentReport() : buildLeaveReport();
}

function fillExample() {
  const type = typeSelect.value;

  if (type === 'internalLeave' || type === 'externalLeave') {
    setValue(leaveFields.technician, '<@943708520648433674>');
    setValue(leaveFields.duration, '3 ساعة');
    setValue(leaveFields.remaining, '19 ساعة');
    calculateRemainingBalance();
    setValue(leaveFields.fromDate, '2026-06-29');
    setValue(leaveFields.fromTime, '04:10');
    setValue(leaveFields.fromPeriod, 'ص');
    setValue(leaveFields.toDate, '2026-06-29');
    setValue(leaveFields.toTime, '07:10');
    setValue(leaveFields.toPeriod, 'ص');
    setValue(leaveFields.rulesLink, DEFAULT_LEAVE_RULES_LINK);
    setValue(leaveFields.notes, DEFAULT_LEAVE_NOTES);
    setValue(leaveFields.roleMention, DEFAULT_ROLE_MENTION);
  }

  if (type === 'merchantLeave' || type === 'leadershipReward') {
    setValue(leaveFields.technician, '');
    setValue(leaveFields.duration, '00 ساعة');
    setValue(leaveFields.remaining, '');
    setValue(leaveFields.calculatedRemaining, '');
    setValue(leaveFields.fromDate, '2026-06-29');
    setValue(leaveFields.fromTime, '00:00');
    setValue(leaveFields.fromPeriod, 'ص');
    setValue(leaveFields.toDate, '2026-06-29');
    setValue(leaveFields.toTime, '00:00');
    setValue(leaveFields.toPeriod, 'م');
    setValue(leaveFields.rulesLink, DEFAULT_LEAVE_RULES_LINK);
    setValue(leaveFields.roleMention, DEFAULT_ROLE_MENTION);
    if (type === 'leadershipReward') {
      setValue(leaveFields.technician, '<@943708520648433674>');
      setValue(leaveFields.signature, '');
    }
  }

  if (type === 'externalAssignment') {
    setValue(assignmentFields.mention, '<@481603641158139924>');
    setValue(assignmentFields.employee, '[CD| G-163] سعيد البدواوي');
    setValue(assignmentFields.sector, 'شرطة لوس');
    setValue(assignmentFields.duration, 'يومين');
  }

  output.value = buildReport();
  toast('تمت تعبئة المثال');
}

function clearVisibleFields() {
  const section = currentSection();
  const fieldGroups = { leave: leaveFields, assignment: assignmentFields };
  Object.entries(fieldGroups[section]).forEach(([key, input]) => {
    if (key === 'personLabel') return;
    input.value = '';
  });
  if (section === 'leave') {
    ensureLeaveRulesLink();
    ensureLeaveNotes();
    ensureRoleMention();
  }
  output.value = 'سيظهر التقرير الإداري هنا بعد الضغط على إنشاء التقرير.';
  toast('تم مسح الخانات');
}

$('generateAdminBtn').addEventListener('click', () => {
  output.value = buildReport();
  toast('تم إنشاء التقرير');
});

$('copyAdminBtn').addEventListener('click', async () => {
  const text = output.value.trim();
  if (!text || text.startsWith('سيظهر')) {
    toast('أنشئ التقرير أولاً');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    toast('تم نسخ التقرير');
  } catch (error) {
    output.select();
    document.execCommand('copy');
    toast('تم النسخ');
  }
});

$('exampleAdminBtn').addEventListener('click', fillExample);
$('clearAdminBtn').addEventListener('click', clearVisibleFields);
typeSelect.addEventListener('change', updateVisibleForm);

leaveFields.duration.addEventListener('input', calculateRemainingBalance);
leaveFields.remaining.addEventListener('input', calculateRemainingBalance);

adminAutoMentionFields.forEach((input) => {
  input.addEventListener('input', () => scheduleMentionFieldFormat(input));
  input.addEventListener('change', () => formatMentionField(input));
  input.addEventListener('blur', () => formatMentionField(input));
  input.addEventListener('paste', () => {
    window.setTimeout(() => formatMentionField(input), 0);
  });
});

ensureLeaveRulesLink();
ensureLeaveNotes();
ensureRoleMention();
updateVisibleForm();
