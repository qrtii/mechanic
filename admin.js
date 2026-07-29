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
    fromMinute: $('leaveFromMinute'),
    fromPeriod: $('leaveFromPeriod'),
    toDate: $('leaveToDate'),
    toTime: $('leaveToTime'),
    toMinute: $('leaveToMinute'),
    toPeriod: $('leaveToPeriod'),
    rulesLink: $('leaveRulesLink'),
    signature: $('rewardSignature')
  };

  var assignmentFields = {
    mention: $('assignmentMention'),
    employee: $('assignmentEmployee'),
    sector: $('assignmentSector'),
    duration: $('assignmentDuration')
  };


  function syncCustomTimeControl(input) {
    if (!input || !input.id) return;

    var wrapper = document.querySelector('.custom-time-select[data-target="' + input.id + '"]');
    if (!wrapper) return;

    var trigger = wrapper.querySelector('.custom-time-trigger');
    if (!trigger) return;

    var fallback = input.id.indexOf('Minute') !== -1 ? 'الدقيقة' : 'اختر الساعة';
    trigger.textContent = input.value ? input.value : fallback;

    Array.prototype.forEach.call(wrapper.querySelectorAll('.custom-time-option'), function (option) {
      option.classList.toggle('selected', option.dataset.value === input.value);
    });
  }

  function closeCustomTimeMenus(exceptWrapper) {
    Array.prototype.forEach.call(document.querySelectorAll('.custom-time-select.open'), function (wrapper) {
      if (wrapper !== exceptWrapper) {
        wrapper.classList.remove('open');
        var trigger = wrapper.querySelector('.custom-time-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initCustomTimeDropdowns() {
    Array.prototype.forEach.call(document.querySelectorAll('.custom-time-select'), function (wrapper) {
      var target = $(wrapper.dataset.target);
      var trigger = wrapper.querySelector('.custom-time-trigger');

      if (!target || !trigger || wrapper.dataset.ready === '1') return;
      wrapper.dataset.ready = '1';

      trigger.addEventListener('click', function () {
        var willOpen = !wrapper.classList.contains('open');
        closeCustomTimeMenus(wrapper);
        wrapper.classList.toggle('open', willOpen);
        trigger.setAttribute('aria-expanded', String(willOpen));
      });

      Array.prototype.forEach.call(wrapper.querySelectorAll('.custom-time-option'), function (option) {
        option.addEventListener('click', function () {
          target.value = option.dataset.value || '';
          target.dispatchEvent(new Event('change', { bubbles: true }));
          syncCustomTimeControl(target);
          closeCustomTimeMenus();
        });
      });

      syncCustomTimeControl(target);
    });

    document.addEventListener('click', function (event) {
      if (!event.target.closest('.custom-time-select')) {
        closeCustomTimeMenus();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeCustomTimeMenus();
    });
  }

  function safeText(input, fallback) {
    if (fallback === undefined) fallback = 'لا يوجد';
    var text = input && input.value !== undefined ? String(input.value).trim() : '';
    return text.length ? text : fallback;
  }

  function setValue(input, val) {
    if (input) {
      input.value = val;
      syncCustomTimeControl(input);
    }
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

  function isExternalLeave() {
    return currentType() === 'externalLeave';
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

  function ensureLeaveNotes() {}

  function toggleElements(selector, hidden) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (el) {
      el.classList.toggle('hidden', hidden);
    });
  }

  function toggleLeaveUi() {
    var merchant = isMerchantLeave();
    var reward = isLeadershipReward();
    var external = isExternalLeave();

    if (leaveFields.personLabel) {
      leaveFields.personLabel.textContent = (external || currentType() === 'internalLeave') ? 'الفني / المشرف المحترم' : (merchant ? 'التاجر المحترم' : 'الفني المحترم');
    }
    if (leaveFields.technician) {
      leaveFields.technician.placeholder = 'ضع Copy ID هنا وسيظهر كمنشن تلقائياً';
    }

    toggleElements('.leave-balance-field', merchant || reward || external);
    toggleElements('.reward-signature-title', !reward);
    toggleElements('.reward-signature-group', !reward);
    [leaveFields.fromTime, leaveFields.fromMinute, leaveFields.fromPeriod, leaveFields.toTime, leaveFields.toMinute, leaveFields.toPeriod].forEach(function (el) {
      if (el) el.classList.toggle('hidden', external);
    });
    toggleElements('.external-hide-time-custom', external);
  }

  function updateVisibleForm() {
    var section = currentSection();
    Object.keys(forms).forEach(function (key) {
      if (forms[key]) forms[key].classList.toggle('hidden', key !== section);
    });
    toggleLeaveUi();
    if (output) output.value = DEFAULT_OUTPUT_TEXT;
  }


  function formatTimeParts(hourInput, minuteInput, fallback) {
    if (fallback === undefined) fallback = '00:00';

    var hour = hourInput && hourInput.value !== undefined ? String(hourInput.value).trim() : '';
    var minute = minuteInput && minuteInput.value !== undefined ? String(minuteInput.value).trim() : '';

    if (!hour) return fallback;

    if (hour.indexOf(':') !== -1) {
      var parts = hour.split(':');
      hour = parts[0] || '';
      if (!minute) minute = parts[1] || '';
    }

    if (!minute) minute = '00';
    return toTwelveHourTime(hour + ':' + minute);
  }

  function getLeaveCommonData() {
    ensureLeaveRulesLink();
    formatMentionField(leaveFields.technician);
    formatMentionField(leaveFields.signature);

    return {
      person: safeText(leaveFields.technician, ''),
      duration: safeText(leaveFields.duration, '00 ساعة'),
      fromDate: formatDate(leaveFields.fromDate),
      fromTime: formatTimeParts(leaveFields.fromTime, leaveFields.fromMinute),
      fromPeriod: safeText(leaveFields.fromPeriod, 'ص'),
      toDate: formatDate(leaveFields.toDate),
      toTime: formatTimeParts(leaveFields.toTime, leaveFields.toMinute),
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
      '***`الفني / المشرف المحترم :` ' + data.person + '     ***            \n\n' +
      '***`المــــدة :` ' + data.duration + '***  \n\n' +
      '***من تاريخ ' + data.fromDate + ' ' + data.fromTime + ' ' + data.fromPeriod + '*** \n' +
      '***الى تاريخ ' + data.toDate + ' ' + data.toTime + ' ' + data.toPeriod + ' *** \n\n\n' +
      '***يجب قراءة كامل [قوانين الإجازات](' + data.rulesLink + ') والافادة بالاستلام بوضع رياكشن ***\n\n' +
      '`جهلك بالقوانين لا يعفيك من العقوبة\n`*** \n' +
      '***`توقيع و اعتماد :` ' + signature + '***  \n\n';
  }

  function buildExternalLeaveReport() {
    var data = getLeaveCommonData();

    return '***` إجازة خارجية `*** \n\n' +
      '***`الفني / المشرف المحترم :`***   ' + data.person + '\n\n' +
      '***`المــــدة :` ' + data.duration + '*** \n\n' +
      '***من تاريخ ' + data.fromDate + ' *** \n' +
      '***الى تاريخ ' + data.toDate + ' *** \n\n\n' +
      '***يجب قراءة كامل [قوانين الإجازات](' + data.rulesLink + ') والافادة بالاستلام بوضع رياكشن ***\n\n' +
      '`جهلك بالقوانين لا يعفيك من العقوبة\n`*** \n' +
      '<@&1149742928953086105>  ***';
  }

  function buildLeaveReport() {
    if (isMerchantLeave()) return buildMerchantLeaveReport();
    if (isLeadershipReward()) return buildLeadershipRewardReport();
    if (isExternalLeave()) return buildExternalLeaveReport();

    var title = 'إجازة داخلية';
    var data = getLeaveCommonData();
    var remaining = calculateRemainingBalance() || safeText(leaveFields.calculatedRemaining, '00 ساعة');

    return '***` ' + title + ' `*** \n\n' +
      '***`الفني / المشرف المحترم : ` ' + safeText(leaveFields.technician, '') + '     ***            \n\n' +
      '***`المــــدة :` ' + data.duration + '*** \n' +
      '***`الرصيد المتبقي :` ' + remaining + '*** \n\n' +
      '***من تاريخ ' + data.fromDate + ' ' + data.fromTime + ' ' + data.fromPeriod + '*** \n' +
      '***الى تاريخ ' + data.toDate + ' ' + data.toTime + ' ' + data.toPeriod + ' *** \n\n' +
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

    if (type === 'internalLeave') {
      setValue(leaveFields.technician, '<@943708520648433674>');
      setValue(leaveFields.duration, '3 ساعة');
      setValue(leaveFields.remaining, '19 ساعة');
      calculateRemainingBalance();
      setValue(leaveFields.fromDate, '2026-06-29');
      setValue(leaveFields.fromTime, '04');
      setValue(leaveFields.fromMinute, '10');
      setValue(leaveFields.fromPeriod, 'ص');
      setValue(leaveFields.toDate, '2026-06-29');
      setValue(leaveFields.toTime, '07');
      setValue(leaveFields.toMinute, '10');
      setValue(leaveFields.toPeriod, 'ص');
      setValue(leaveFields.rulesLink, DEFAULT_LEAVE_RULES_LINK);
    }

    if (type === 'externalLeave') {
      setValue(leaveFields.technician, '<@1336726577265774715>');
      setValue(leaveFields.duration, '30 يوم');
      setValue(leaveFields.remaining, '');
      setValue(leaveFields.calculatedRemaining, '');
      setValue(leaveFields.fromDate, '2026-07-17');
      setValue(leaveFields.fromTime, '');
      setValue(leaveFields.fromMinute, '');
      setValue(leaveFields.fromPeriod, 'ص');
      setValue(leaveFields.toDate, '2026-08-16');
      setValue(leaveFields.toTime, '');
      setValue(leaveFields.toMinute, '');
      setValue(leaveFields.toPeriod, 'ص');
      setValue(leaveFields.rulesLink, DEFAULT_LEAVE_RULES_LINK);
    }

    if (type === 'merchantLeave' || type === 'leadershipReward') {
      setValue(leaveFields.technician, type === 'leadershipReward' ? '<@943708520648433674>' : '<@943708520648433674>');
      setValue(leaveFields.duration, '00 ساعة');
      setValue(leaveFields.remaining, '');
      setValue(leaveFields.calculatedRemaining, '');
      setValue(leaveFields.fromDate, '2026-06-29');
      setValue(leaveFields.fromTime, '12');
      setValue(leaveFields.fromMinute, '');
      setValue(leaveFields.fromPeriod, 'ص');
      setValue(leaveFields.toDate, '2026-06-29');
      setValue(leaveFields.toTime, '12');
      setValue(leaveFields.toMinute, '');
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
  initCustomTimeDropdowns();
  bindEvents();
  updateVisibleForm();
}());
