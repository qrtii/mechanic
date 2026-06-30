(function () {
  'use strict';

  function $(id) {
    return document.getElementById(id);
  }

  var typeSelect = $('adminReportType');
  var output = $('adminOutput');
  var DEFAULT_LEAVE_RULES_LINK = 'https://discord.com/channels/1071933157097615480/1071934713524133918/1500101205320536155';
  var DEFAULT_LEAVE_NOTES = 'يلزم الفني اكمال 24 ساعة من اخر اجازة و التأكد من المخالفات و تصفير الاجازات';
  var DEFAULT_OUTPUT_TEXT = 'سيظهر التقرير الإداري هنا بعد الضغط على إنشاء التقرير.';

  var forms = {
    leave: $('leaveForm'),
    assignment: $('assignmentForm')
  };

  var leaveFields = {
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
    signature: $('rewardSignature')
  };

  var assignmentFields = {
    mention: $('assignmentMention'),
    employee: $('assignmentEmployee'),
    sector: $('assignmentSector'),
    duration: $('assignmentDuration')
  };

  function safeText(input, fallback) {
    if (fallback === undefined) fallback = 'لا يوجد';
    var text = input && input.value !== undefined ? String(input.value).trim() : '';
    return text.length ? text : fallback;
  }

  function setValue(input, val) {
    if (input) input.value = val;
  }

  function normalizeArabicNumbers(text) {
    return String(text || '')
      .replace(/[٠-٩]/g, function (digit) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(digit); })
      .replace(/[۰-۹]/g, function (digit) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit); });
  }

  function convertDiscordIdsToMentions(text) {
    var placeholders = [];
    var working = normalizeArabicNumbers(text);

    // احفظ المنشنات الموجودة حتى لا تتحول مرتين.
    working = working.replace(/<@&?\d{15,25}>|<@!?\d{15,25}>/g, function (mention) {
      var token = '__MENTION_' + placeholders.length + '__';
      placeholders.push(mention);
      return token;
    });

    working = working.replace(/\b\d{15,25}\b/g, function (id) {
      return '<@' + id + '>';
    });

    placeholders.forEach(function (mention, index) {
      working = working.replace('__MENTION_' + index + '__', mention);
    });

    return working.trim();
  }

  function formatMentionField(input) {
    if (!input) return;
    var before = input.value || '';
    var after = convertDiscordIdsToMentions(before);
    if (after !== before) input.value = after;
  }

  function scheduleMentionFieldFormat(input) {
    if (!input) return;
    clearTimeout(input.autoMentionTimer);
    input.autoMentionTimer = setTimeout(function () {
      var text = normalizeArabicNumbers(input.value || '');
      if (/\b\d{17,25}\b/.test(text)) formatMentionField(input);
    }, 120);
  }

  var adminAutoMentionFields = [
    leaveFields.technician,
    leaveFields.signature,
    assignmentFields.mention
  ].filter(Boolean);

  function formatAdminAutoMentions() {
    adminAutoMentionFields.forEach(formatMentionField);
  }

  function formatDate(input, fallback) {
    if (fallback === undefined) fallback = '0000/00/00';
    var text = input && input.value !== undefined ? String(input.value).trim() : '';
    if (!text) return fallback;
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text.replace(/-/g, '/');
    return text;
  }

  function formatTime(input, fallback) {
    if (fallback === undefined) fallback = '00:00';
    var text = input && input.value !== undefined ? String(input.value).trim() : '';
    text = text.length ? text : fallback;
    return toTwelveHourTime(text);
  }

  function toTwelveHourTime(text) {
    var clean = normalizeArabicNumbers(String(text || '')).trim();
    var match = clean.match(/^(\d{1,2})\s*[:：]\s*(\d{1,2})/);
    if (!match) return clean || '12:00';

    var hour = Number(match[1]);
    var minute = Number(match[2]);
    if (Number.isNaN(hour)) hour = 0;
    if (Number.isNaN(minute)) minute = 0;

    hour = ((hour % 24) + 24) % 24;
    minute = Math.max(0, Math.min(59, minute));

    var hour12 = hour % 12;
    if (hour12 === 0) hour12 = 12;

    return String(hour12).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
  }

  function parseHours(text) {
    var clean = normalizeArabicNumbers(text).trim();
    if (!clean) return null;

    var timeMatch = clean.match(/(\d+(?:\.\d+)?)\s*[:：]\s*(\d+(?:\.\d+)?)/);
    if (timeMatch) return Number(timeMatch[1]) + (Number(timeMatch[2]) / 60);

    var numberMatch = clean.match(/-?\d+(?:\.\d+)?/);
    if (!numberMatch) return null;
    return Number(numberMatch[0]);
  }

  function formatHours(amount) {
    if (amount === null || Number.isNaN(amount)) return '';
    var rounded = Math.round(amount * 100) / 100;
    var text = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/\.?0+$/, '');
    return text + ' ساعة';
  }

  function calculateRemainingBalance() {
    if (!leaveFields.remaining || !leaveFields.duration || !leaveFields.calculatedRemaining) return '';
    var balance = parseHours(leaveFields.remaining.value);
    var duration = parseHours(leaveFields.duration.value);
    if (balance === null || duration === null) {
      leaveFields.calculatedRemaining.value = '';
      return '';
    }

    var remaining = balance - duration;
    var formatted = formatHours(remaining);
    leaveFields.calculatedRemaining.value = formatted;
    return formatted;
  }

  function toast(message) {
    var box = $('toast');
    if (!box) return;
    box.textContent = message;
    box.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { box.classList.remove('show'); }, 1800);
  }

  function currentType() {
    return typeSelect ? typeSelect.value : 'internalLeave';
  }

  function isMerchantLeave() {
    return currentType() === 'merchantLeave';
  }

  function isLeadershipReward() {
    return currentType() === 'leadershipReward';
  }

  function currentSection() {
    return currentType() === 'externalAssignment' ? 'assignment' : 'leave';
  }

  function ensureLeaveRulesLink() {
    if (leaveFields.rulesLink && !String(leaveFields.rulesLink.value || '').trim()) {
      leaveFields.rulesLink.value = DEFAULT_LEAVE_RULES_LINK;
    }
  }

  function ensureLeaveNotes() {
    if (leaveFields.notes && !String(leaveFields.notes.value || '').trim()) {
      leaveFields.notes.value = DEFAULT_LEAVE_NOTES;
    }
  }

  function toggleElements(selector, hidden) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (el) {
      el.classList.toggle('hidden', hidden);
    });
  }

  function toggleLeaveUi() {
    var merchant = isMerchantLeave();
    var reward = isLeadershipReward();

    if (leaveFields.personLabel) {
      leaveFields.personLabel.textContent = merchant ? 'التاجر المحترم' : 'الفني المحترم';
    }
    if (leaveFields.technician) {
      leaveFields.technician.placeholder = 'ضع Copy ID هنا وسيظهر كمنشن تلقائياً';
    }

    toggleElements('.leave-balance-field', merchant || reward);
    toggleElements('.leave-notes-title', merchant || reward);
    toggleElements('.leave-notes-group', merchant || reward);
    toggleElements('.reward-signature-title', !reward);
    toggleElements('.reward-signature-group', !reward);
  }

  function updateVisibleForm() {
    var section = currentSection();
    Object.keys(forms).forEach(function (key) {
      if (forms[key]) forms[key].classList.toggle('hidden', key !== section);
    });
    toggleLeaveUi();
    if (output) output.value = DEFAULT_OUTPUT_TEXT;
  }

  function getLeaveCommonData() {
    ensureLeaveRulesLink();
    formatMentionField(leaveFields.technician);
    formatMentionField(leaveFields.signature);

    return {
      person: safeText(leaveFields.technician, ''),
      duration: safeText(leaveFields.duration, '00 ساعة'),
      fromDate: formatDate(leaveFields.fromDate),
      fromTime: formatTime(leaveFields.fromTime),
      fromPeriod: safeText(leaveFields.fromPeriod, 'ص'),
      toDate: formatDate(leaveFields.toDate),
      toTime: formatTime(leaveFields.toTime),
      toPeriod: safeText(leaveFields.toPeriod, 'ص'),
      rulesLink: safeText(leaveFields.rulesLink, DEFAULT_LEAVE_RULES_LINK)
    };
  }

  function buildMerchantLeaveReport() {
    var data = getLeaveCommonData();
    return '***` إجازة تاجر `*** \n\n' +
      '***`التاجر المحترم :` ' + data.person + '     ***            \n\n' +
      '***`المــــدة :` ' + data.duration + '*** \n\n' +
      '***من تاريخ ' + data.fromDate + ' ' + data.fromTime + ' ' + data.fromPeriod + '*** \n' +
      '***الى تاريخ ' + data.toDate + ' ' + data.toTime + ' ' + data.toPeriod + ' *** \n\n\n' +
      '***يجب قراءة كامل [قوانين الإجازات](' + data.rulesLink + ') والافادة بالاستلام بوضع رياكشن ***\n\n' +
      '`جهلك بالقوانين لا يعفيك من العقوبة\n`*** \n';
  }

  function buildLeadershipRewardReport() {
    var data = getLeaveCommonData();
    var signature = safeText(leaveFields.signature, '');

    return '***` مكافأة قيادية  `*** \n\n' +
      '***`الفني المحترم :` ' + data.person + '     ***            \n\n' +
      '***`المــــدة :` ' + data.duration + '***  \n\n' +
      '***من تاريخ ' + data.fromDate + ' ' + data.fromTime + ' ' + data.fromPeriod + '*** \n' +
      '***الى تاريخ ' + data.toDate + ' ' + data.toTime + ' ' + data.toPeriod + ' *** \n\n\n' +
      '***يجب قراءة كامل [قوانين الإجازات](' + data.rulesLink + ') والافادة بالاستلام بوضع رياكشن ***\n\n' +
      '`جهلك بالقوانين لا يعفيك من العقوبة\n`*** \n' +
      '***`توقيع و اعتماد :` ' + signature + '***  \n\n';
  }

  function buildLeaveReport() {
    if (isMerchantLeave()) return buildMerchantLeaveReport();
    if (isLeadershipReward()) return buildLeadershipRewardReport();

    ensureLeaveNotes();
    var title = currentType() === 'externalLeave' ? 'إجازة خارجية' : 'إجازة داخلية';
    var data = getLeaveCommonData();
    var remaining = calculateRemainingBalance() || safeText(leaveFields.calculatedRemaining, '00 ساعة');
    var notes = safeText(leaveFields.notes, DEFAULT_LEAVE_NOTES);

    return '***` ' + title + ' `*** \n\n' +
      '***`الفني المحترم : ` ' + safeText(leaveFields.technician, '') + '     ***            \n\n' +
      '***`المــــدة :` ' + data.duration + '*** \n' +
      '***`الرصيد المتبقي :` ' + remaining + '*** \n\n' +
      '***من تاريخ ' + data.fromDate + ' ' + data.fromTime + ' ' + data.fromPeriod + '*** \n' +
      '***الى تاريخ ' + data.toDate + ' ' + data.toTime + ' ' + data.toPeriod + ' *** \n\n' +
      '***`الملاحظات :` ' + notes + '***\n\n' +
      '***يجب قراءة كامل [قوانين الإجازات](' + data.rulesLink + ') والافادة بالاستلام بوضع رياكشن ***\n\n' +
      '`جهلك بالقوانين لا يعفيك من العقوبة\n`*** \n';
  }

  function buildAssignmentReport() {
    formatMentionField(assignmentFields.mention);
    return '*** ▬▬▬ ﷽ ▬▬\n' +
      '```الموضوع : انتداب خارجي ```\n' +
      'السلام عليكم ورحمة الله وبركاته، وبعد:\n' +
      ' ```cs\n' +
      '# إشارة إلى طلب الموظف الموضحة بياناته أدناه بشأن الانتداب خارج الكراج، نفيدكم بأنه تمت الموافقة على طلبه وفق التفاصيل التالية:\n' +
      '```\n\n' +
      ' الاسم:  ' + safeText(assignmentFields.mention, 'لا يوجد') + ' \n' +
      ' اسم وكود الموظف :  ' + safeText(assignmentFields.employee, '[CD| G-163] سعيد البدواوي') + '\n' +
      ' القطاع المنتدب له: ' + safeText(assignmentFields.sector, 'لا يوجد') + '\n' +
      ' المدة : ' + safeText(assignmentFields.duration, 'لا يوجد') + '\n' +
      'نرجوا من الموظف التقيد بالأنظمة والتعليمات الخاصة بالانتدابات، والتنسيق مع الجهة المعنية قبل المباشرة. ***';
  }

  function buildReport() {
    formatAdminAutoMentions();
    return currentSection() === 'assignment' ? buildAssignmentReport() : buildLeaveReport();
  }

  function generateReport() {
    try {
      if (output) output.value = buildReport();
      toast('تم إنشاء التقرير');
    } catch (error) {
      console.error(error);
      toast('حدث خطأ، تم إصلاح الكود في هذه النسخة');
    }
  }

  function fillExample() {
    var type = currentType();

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
    }

    if (type === 'merchantLeave' || type === 'leadershipReward') {
      setValue(leaveFields.technician, type === 'leadershipReward' ? '<@943708520648433674>' : '<@943708520648433674>');
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
      if (type === 'leadershipReward') setValue(leaveFields.signature, '<@943708520648433674>');
    }

    if (type === 'externalAssignment') {
      setValue(assignmentFields.mention, '<@481603641158139924>');
      setValue(assignmentFields.employee, '[CD| G-163] سعيد البدواوي');
      setValue(assignmentFields.sector, 'شرطة لوس');
      setValue(assignmentFields.duration, 'يومين');
    }

    if (output) output.value = buildReport();
    toast('تمت تعبئة المثال');
  }

  function clearVisibleFields() {
    var section = currentSection();
    var group = section === 'assignment' ? assignmentFields : leaveFields;
    Object.keys(group).forEach(function (key) {
      if (key === 'personLabel') return;
      if (group[key] && group[key].value !== undefined) group[key].value = '';
    });
    if (section === 'leave') {
      ensureLeaveRulesLink();
      ensureLeaveNotes();
      }
    if (output) output.value = DEFAULT_OUTPUT_TEXT;
    toast('تم مسح الخانات');
  }

  function copyReport() {
    var text = output ? output.value.trim() : '';
    if (!text || text.indexOf('سيظهر') === 0) {
      toast('أنشئ التقرير أولاً');
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast('تم نسخ التقرير');
      }).catch(function () {
        output.select();
        document.execCommand('copy');
        toast('تم النسخ');
      });
    } else {
      output.select();
      document.execCommand('copy');
      toast('تم النسخ');
    }
  }

  function bindEvents() {
    var generateBtn = $('generateAdminBtn');
    var copyBtn = $('copyAdminBtn');
    var exampleBtn = $('exampleAdminBtn');
    var clearBtn = $('clearAdminBtn');

    if (generateBtn) generateBtn.addEventListener('click', generateReport);
    if (copyBtn) copyBtn.addEventListener('click', copyReport);
    if (exampleBtn) exampleBtn.addEventListener('click', fillExample);
    if (clearBtn) clearBtn.addEventListener('click', clearVisibleFields);
    if (typeSelect) typeSelect.addEventListener('change', updateVisibleForm);

    if (leaveFields.duration) leaveFields.duration.addEventListener('input', calculateRemainingBalance);
    if (leaveFields.remaining) leaveFields.remaining.addEventListener('input', calculateRemainingBalance);

    adminAutoMentionFields.forEach(function (input) {
      input.addEventListener('input', function () { scheduleMentionFieldFormat(input); });
      input.addEventListener('change', function () { formatMentionField(input); });
      input.addEventListener('blur', function () { formatMentionField(input); });
      input.addEventListener('paste', function () { setTimeout(function () { formatMentionField(input); }, 0); });
    });
  }

  ensureLeaveRulesLink();
  ensureLeaveNotes();
  bindEvents();
  updateVisibleForm();
}());
