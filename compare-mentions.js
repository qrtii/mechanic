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

  function extractIdsFromText(text) {
    const ids = new Set();
    const normalized = normalizeDigits(String(text || ''));
    const resolved = window.MechanicsMentions ? window.MechanicsMentions.resolve(normalized) : normalized;
    const combined = normalized + '\n' + resolved;
    const regex = /<@!?(\d{15,25})>|<(\d{15,25})@>|\b(\d{15,25})\b/g;
    let match;
    while ((match = regex.exec(combined)) !== null) {
      const id = match[1] || match[2] || match[3];
      if (id) ids.add(id);
    }
    return ids;
  }

  function displayForId(id) {
    const profile = window.MechanicsMentions && typeof window.MechanicsMentions.lookup === 'function'
      ? window.MechanicsMentions.lookup(id)
      : null;

    if (!profile) {
      return {
        title: 'غير موجود في جدول الميكانيك',
        sub: id,
        raw: '<@' + id + '>'
      };
    }

    const codes = Array.isArray(profile.codes) && profile.codes.length ? profile.codes.join(' / ') : '';
    return {
      title: profile.name || 'بدون اسم',
      sub: [codes, id].filter(Boolean).join(' | '),
      raw: '<@' + id + '>'
    };
  }

  function renderList(element, ids, emptyText) {
    if (!element) return;
    if (!ids.length) {
      element.innerHTML = '<p class="compare-empty">' + emptyText + '</p>';
      return;
    }

    element.innerHTML = ids.map((id) => {
      const item = displayForId(id);
      return '<div class="compare-name-item">' +
        '<strong>' + escapeHtml(item.title) + '</strong>' +
        '<span>' + escapeHtml(item.sub) + '</span>' +
        '<code>' + escapeHtml(item.raw) + '</code>' +
      '</div>';
    }).join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function runLocalCompare() {
    const supervisorIds = extractIdsFromText(supervisorInput ? supervisorInput.value : '');
    const technicianIds = extractIdsFromText(technicianInput ? technicianInput.value : '');

    const shared = Array.from(supervisorIds).filter((id) => technicianIds.has(id));
    const supervisorOnly = Array.from(supervisorIds).filter((id) => !technicianIds.has(id));
    const technicianOnly = Array.from(technicianIds).filter((id) => !supervisorIds.has(id));

    renderList(sharedList, shared, 'لا توجد منشنات مشتركة.');
    renderList(supervisorOnlyList, supervisorOnly, 'لا يوجد أسماء موجودة في تقرير المشرف فقط.');
    renderList(technicianOnlyList, technicianOnly, 'لا يوجد أسماء موجودة في تقرير الفني فقط.');
    showToast('تمت المقارنة بالأسماء');
  }

  function clearLocalCompare() {
    if (supervisorInput) supervisorInput.value = '';
    if (technicianInput) technicianInput.value = '';
    renderList(sharedList, [], 'لم يتم تشغيل المقارنة بعد.');
    renderList(supervisorOnlyList, [], 'لم يتم تشغيل المقارنة بعد.');
    renderList(technicianOnlyList, [], 'لم يتم تشغيل المقارنة بعد.');
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
    convert();
    clearLocalCompare();
  });
})();
