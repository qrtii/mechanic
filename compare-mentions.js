(function () {
  const input = document.getElementById('compareMentionInput');
  const output = document.getElementById('compareMentionOutput');
  const convertBtn = document.getElementById('convertCompareMentionBtn');
  const copyBtn = document.getElementById('copyCompareMentionBtn');
  const refreshBtn = document.getElementById('refreshMechanicsSheetBtn');
  const toast = document.getElementById('toast');

  const supervisorInput = document.getElementById('supervisorCompareInput');
  const technicianInput = document.getElementById('technicianCompareInput');
  const runBtns = [document.getElementById('runLocalCompareBtn'), document.getElementById('runLocalCompareBtn2')].filter(Boolean);
  const clearBtn = document.getElementById('clearLocalCompareBtn');
  const sharedList = document.getElementById('sharedMentionsList');
  const supervisorOnlyList = document.getElementById('supervisorOnlyList');
  const technicianOnlyList = document.getElementById('technicianOnlyList');

  const LAST_COMPARE_KEY = 'mechanicReportCompareInputsV2';

  function normalizeDigits(text) {
    const map = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
      '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
    };
    return String(text || '').replace(/[٠-٩۰-۹]/g, (digit) => map[digit] || digit);
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function cleanReportLine(line) {
    return normalizeDigits(String(line || ''))
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/`+/g, '')
      .replace(/\*+/g, '')
      .replace(/[()\[\]{}]/g, ' ')
      .replace(/ــ+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function labelFromLine(line, token) {
    let clean = cleanReportLine(line);
    if (!clean) return '';

    if (token) clean = clean.replace(token, ' ');
    clean = clean.replace(/<@!?\d{15,25}>/g, ' ')
      .replace(/<\d{15,25}@>/g, ' ')
      .replace(/\b\d{15,25}\b/g, ' ')
      .replace(/G\s*[-–—]?\s*\d{1,4}/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // خذ اسم/مسمى الخانة قبل النقطتين إن وُجد.
    const colonParts = clean.split(/[:：]/).map((part) => part.trim()).filter(Boolean);
    if (colonParts.length > 1) return colonParts[0];

    // تجاهل الجمل الطويلة والعناوين العامة.
    if (clean.length > 45) return '';
    if (/تقرير|استلام|الساعة|الى|من تاريخ|الى تاريخ|الرابط|القوانين/i.test(clean)) return '';
    return clean;
  }

  function normalizeCode(token) {
    if (window.MechanicsMentions && typeof window.MechanicsMentions.normalizeCode === 'function') {
      return window.MechanicsMentions.normalizeCode(token);
    }
    const text = normalizeDigits(String(token || '')).toUpperCase().trim();
    const match = text.match(/G\s*[-–—]?\s*(\d{1,4})/) || text.match(/^(\d{1,4})$/);
    return match ? 'G-' + match[1].padStart(3, '0') : '';
  }

  function lookupProfile(value) {
    return window.MechanicsMentions && typeof window.MechanicsMentions.lookup === 'function'
      ? window.MechanicsMentions.lookup(value)
      : null;
  }

  function addEntry(map, id, meta) {
    if (!id || !/^\d{15,25}$/.test(String(id))) return;
    const key = String(id);
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        labels: new Set(),
        codes: new Set(),
        tokens: new Set(),
        count: 0
      });
    }

    const entry = map.get(key);
    entry.count += 1;
    if (meta && meta.label) entry.labels.add(meta.label);
    if (meta && meta.code) entry.codes.add(meta.code);
    if (meta && meta.token) entry.tokens.add(meta.token);
  }

  function extractEntriesFromText(text) {
    const entries = new Map();
    const normalized = normalizeDigits(String(text || ''));
    const lines = normalized.split(/\n+/);

    lines.forEach((line) => {
      // لا نأخذ أرقام الروابط أو الرولات كأشخاص.
      const noUrls = String(line || '').replace(/https?:\/\/\S+/g, ' ');
      const noRoles = noUrls.replace(/<@&\d{15,25}>/g, ' ');

      // منشنات ديسكورد الصحيحة + الصيغة المعكوسة التي ظهرت في بعض التقارير.
      const mentionRegex = /<@!?(\d{15,25})>|<(\d{15,25})@>/g;
      let match;
      while ((match = mentionRegex.exec(noRoles)) !== null) {
        const id = match[1] || match[2];
        const token = match[0];
        addEntry(entries, id, {
          label: labelFromLine(line, token),
          token
        });
      }

      // Copy ID خام: نقبله فقط إذا لم يكن داخل رابط وبعد حذف الروابط.
      // هذا يمنع أرقام القنوات والرسائل من الدخول في التدقيق.
      const rawIdRegex = /(?<![\w/])(\d{15,25})(?![\w/])/g;
      while ((match = rawIdRegex.exec(noRoles)) !== null) {
        const id = match[1];
        addEntry(entries, id, {
          label: labelFromLine(line, id),
          token: id
        });
      }

      // أكواد G من التقرير، نربطها بالجدول ونضيف الشخص المقابل.
      const codeRegex = /\bG\s*[-–—]?\s*\d{1,4}\b/gi;
      while ((match = codeRegex.exec(noRoles)) !== null) {
        const code = normalizeCode(match[0]);
        if (!code) continue;
        const profile = lookupProfile(code);
        if (profile && profile.discordId) {
          addEntry(entries, profile.discordId, {
            label: labelFromLine(line, match[0]),
            code,
            token: match[0]
          });
        }
      }

      // إذا كان السطر يحتوي على اسم من الجدول فقط بدون منشن، سيحوّله جدول الميكانيك إلى منشن.
      if (window.MechanicsMentions && typeof window.MechanicsMentions.resolve === 'function') {
        const resolved = window.MechanicsMentions.resolve(noRoles);
        let resolvedMatch;
        while ((resolvedMatch = /<@!?(\d{15,25})>/g.exec(resolved)) !== null) {
          addEntry(entries, resolvedMatch[1], {
            label: labelFromLine(line, resolvedMatch[0]),
            token: resolvedMatch[0]
          });
        }
      }
    });

    return entries;
  }

  function getDisplay(entry) {
    const profile = lookupProfile(entry.id);
    const profileCodes = profile && Array.isArray(profile.codes) ? profile.codes : [];
    const codes = Array.from(new Set([...profileCodes, ...Array.from(entry.codes || [])])).filter(Boolean);
    const labels = Array.from(entry.labels || []).filter(Boolean);

    if (profile) {
      return {
        title: profile.name || 'بدون اسم',
        sub: [codes.join(' / '), labels.length ? ('الخانة: ' + labels.join(' / ')) : '', entry.id].filter(Boolean).join(' | '),
        raw: '<@' + entry.id + '>',
        found: true,
        count: entry.count || 1
      };
    }

    return {
      title: labels.length ? labels.join(' / ') : 'غير موجود في جدول الميكانيك',
      sub: ['غير موجود في جدول الميكانيك', entry.id, entry.count > 1 ? ('تكرر ' + entry.count + ' مرات') : ''].filter(Boolean).join(' | '),
      raw: '<@' + entry.id + '>',
      found: false,
      count: entry.count || 1
    };
  }

  function sortEntries(entries) {
    return entries.sort((a, b) => {
      const pa = lookupProfile(a.id);
      const pb = lookupProfile(b.id);
      const ca = pa && pa.codes && pa.codes[0] ? Number(pa.codes[0].replace(/\D/g, '')) : 9999;
      const cb = pb && pb.codes && pb.codes[0] ? Number(pb.codes[0].replace(/\D/g, '')) : 9999;
      if (ca !== cb) return ca - cb;
      return String(getDisplay(a).title).localeCompare(String(getDisplay(b).title), 'ar');
    });
  }

  function renderList(element, entries, emptyText) {
    if (!element) return;
    const list = sortEntries(entries);
    if (!list.length) {
      element.innerHTML = '<p class="compare-empty">' + emptyText + '</p>';
      return;
    }

    element.innerHTML = list.map((entry) => {
      const item = getDisplay(entry);
      return '<div class="compare-name-item ' + (item.found ? 'is-found' : 'is-missing') + '">' +
        '<div class="compare-name-main">' +
          '<strong>' + escapeHtml(item.title) + '</strong>' +
          '<button type="button" class="copy-mention-mini" data-copy="' + escapeHtml(item.raw) + '">نسخ</button>' +
        '</div>' +
        '<span>' + escapeHtml(item.sub) + '</span>' +
        '<code>' + escapeHtml(item.raw) + '</code>' +
      '</div>';
    }).join('');
  }

  function saveInputs() {
    try {
      localStorage.setItem(LAST_COMPARE_KEY, JSON.stringify({
        supervisor: supervisorInput ? supervisorInput.value : '',
        technician: technicianInput ? technicianInput.value : ''
      }));
    } catch (error) {}
  }

  function restoreInputs() {
    try {
      const saved = JSON.parse(localStorage.getItem(LAST_COMPARE_KEY) || '{}');
      if (saved.supervisor && supervisorInput && !supervisorInput.value) supervisorInput.value = saved.supervisor;
      if (saved.technician && technicianInput && !technicianInput.value) technicianInput.value = saved.technician;
    } catch (error) {}
  }

  function runLocalCompare() {
    const supervisorMap = extractEntriesFromText(supervisorInput ? supervisorInput.value : '');
    const technicianMap = extractEntriesFromText(technicianInput ? technicianInput.value : '');

    const supervisorIds = new Set(supervisorMap.keys());
    const technicianIds = new Set(technicianMap.keys());

    const shared = Array.from(supervisorIds)
      .filter((id) => technicianIds.has(id))
      .map((id) => mergeEntries(supervisorMap.get(id), technicianMap.get(id)));

    const supervisorOnly = Array.from(supervisorIds)
      .filter((id) => !technicianIds.has(id))
      .map((id) => supervisorMap.get(id));

    const technicianOnly = Array.from(technicianIds)
      .filter((id) => !supervisorIds.has(id))
      .map((id) => technicianMap.get(id));

    renderList(sharedList, shared, 'لا توجد منشنات مشتركة.');
    renderList(supervisorOnlyList, supervisorOnly, 'لا يوجد أسماء موجودة في تقرير المشرف فقط.');
    renderList(technicianOnlyList, technicianOnly, 'لا يوجد أسماء موجودة في تقرير الفني فقط.');
    saveInputs();
    showToast('تمت المقارنة بدقة أعلى');
  }

  function mergeEntries(a, b) {
    const merged = {
      id: a.id,
      labels: new Set(),
      codes: new Set(),
      tokens: new Set(),
      count: (a.count || 0) + (b.count || 0)
    };
    [a, b].forEach((entry) => {
      Array.from(entry.labels || []).forEach((value) => merged.labels.add(value));
      Array.from(entry.codes || []).forEach((value) => merged.codes.add(value));
      Array.from(entry.tokens || []).forEach((value) => merged.tokens.add(value));
    });
    return merged;
  }

  function clearLocalCompare() {
    if (supervisorInput) supervisorInput.value = '';
    if (technicianInput) technicianInput.value = '';
    try { localStorage.removeItem(LAST_COMPARE_KEY); } catch (error) {}
    renderList(sharedList, [], 'لم يتم تشغيل المقارنة بعد.');
    renderList(supervisorOnlyList, [], 'لم يتم تشغيل المقارنة بعد.');
    renderList(technicianOnlyList, [], 'لم يتم تشغيل المقارنة بعد.');
  }

  function convert() {
    const text = input ? input.value : '';
    const converted = window.MechanicsMentions ? window.MechanicsMentions.resolve(text) : text;
    if (output) {
      output.value = converted || 'اكتب الكود أو الاسم أو Copy ID ثم اضغط تحويل.';
    }
  }

  async function copy() {
    convert();
    if (!output || !output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      showToast('تم نسخ المنشن');
    } catch (error) {
      output.select();
      document.execCommand('copy');
      showToast('تم نسخ المنشن');
    }
  }

  async function copyMini(value) {
    try {
      await navigator.clipboard.writeText(value);
      showToast('تم نسخ المنشن');
    } catch (error) {
      showToast('تعذر النسخ من المتصفح');
    }
  }

  if (convertBtn) convertBtn.addEventListener('click', convert);
  if (copyBtn) copyBtn.addEventListener('click', copy);
  if (refreshBtn) refreshBtn.addEventListener('click', async () => {
    if (window.MechanicsMentions) {
      await window.MechanicsMentions.refresh();
      convert();
      runLocalCompare();
      showToast('تم تحديث جدول الميكانيك');
    }
  });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.copy-mention-mini');
    if (button && button.dataset.copy) copyMini(button.dataset.copy);
  });

  if (input) input.addEventListener('input', convert);
  runBtns.forEach((button) => button.addEventListener('click', runLocalCompare));
  if (clearBtn) clearBtn.addEventListener('click', clearLocalCompare);
  if (supervisorInput) supervisorInput.addEventListener('input', runLocalCompare);
  if (technicianInput) technicianInput.addEventListener('input', runLocalCompare);

  document.addEventListener('mechanics-mentions-updated', () => {
    convert();
    runLocalCompare();
  });

  document.addEventListener('DOMContentLoaded', () => {
    restoreInputs();
    convert();
    if ((supervisorInput && supervisorInput.value) || (technicianInput && technicianInput.value)) {
      runLocalCompare();
    } else {
      clearLocalCompare();
    }
  });
})();
