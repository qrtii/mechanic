const $ = (id) => document.getElementById(id);

const fields = {
  reportNumber: $('superReportNumber'),
  fromTime: $('superFromTime'),
  fromPeriod: $('superFromPeriod'),
  toTime: $('superToTime'),
  toPeriod: $('superToPeriod'),
  leadership: $('leadership'),
  leaderAdvisor: $('leaderAdvisor'),
  generalSupervision: $('generalSupervision'),
  fieldSupervision: $('fieldSupervision'),
  areaSupervision: $('areaSupervision'),
  traineeSupervision: $('traineeSupervision'),
  certifiedLadies: $('certifiedLadies'),
  storeOpeningOfficer: $('storeOpeningOfficer'),
  garageRoomFieldSupervisor: $('garageRoomFieldSupervisor'),
  garageRoomAreaSupervisor: $('garageRoomAreaSupervisor'),
  garageRoomTraineeSupervisor: $('garageRoomTraineeSupervisor'),
  operations: $('superOperations'),
  deputyOperations: $('superDeputyOperations'),
  callCenter: $('superCallCenter'),
  losPort: $('superLosPort'),
  paletoPort: $('superPaletoPort'),
  searchRescue: $('searchRescue'),
  supervisionSubmitLink: $('supervisionSubmitLink'),
  operationsReportLink: $('operationsReportLink'),
  output: $('supervisionOutput')
};

const FALLBACKS = {
  leadership: 'منشن للقيادة',
  leaderAdvisor: 'منشن للمستشار',
  generalSupervision: 'منشن للمشرف',
  fieldSupervision: 'منشن للمشرف',
  areaSupervision: 'منشن للمشرف',
  traineeSupervision: 'منشن للمشرف',
  certifiedLadies: 'منشن للمعتمد',
  storeOpeningOfficer: 'منشن للمشرف',
  garageRoomFieldSupervisor: 'منشن للمشرف',
  garageRoomAreaSupervisor: 'منشن للمشرف',
  garageRoomTraineeSupervisor: 'منشن للمشرف',
  operations: 'منشن للفني',
  deputyOperations: 'منشن للفني',
  callCenter: 'منشن للفني',
  losPort: 'منشن للفني',
  paletoPort: 'منشن للفني',
  searchRescue: 'منشن للفني'
};

const divider = 'ــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ';

function value(input, fallback = 'لا يوجد') {
  const text = String(input.value || '').trim();
  return text.length ? text : fallback;
}

function toTwelveHourTime(rawTime, fallback = '00:00') {
  const text = normalizeDigits(String(rawTime || '').trim() || fallback);
  const match = text.match(/^(\d{1,2})\s*[:：]\s*(\d{1,2})/);
  if (!match) return text || '12:00';

  let hour = Number(match[1]);
  let minute = Number(match[2]);
  if (Number.isNaN(hour)) hour = 0;
  if (Number.isNaN(minute)) minute = 0;

  hour = ((hour % 24) + 24) % 24;
  minute = Math.max(0, Math.min(59, minute));

  let hour12 = hour % 12;
  if (hour12 === 0) hour12 = 12;

  return String(hour12).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
}


function normalizeDigits(text) {
  const map = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
  };
  return String(text || '').replace(/[٠-٩۰-۹]/g, (digit) => map[digit] || digit);
}

function convertDiscordIdsToMentions(text) {
  const placeholders = [];
  let working = normalizeDigits(String(text || ''));

  // لا نغيّر المنشنات الجاهزة سواء كانت منشن شخص أو رتبة.
  working = working.replace(/<@&?!?\d{15,25}>|<@!?\d{15,25}>/g, (mention) => {
    const token = `__MENTION_${placeholders.length}__`;
    placeholders.push(mention);
    return token;
  });

  // أي Copy ID رقمي يتم تحويله تلقائياً إلى منشن ديسكورد.
  working = working.replace(/\b\d{15,25}\b/g, (id) => `<@${id}>`);

  placeholders.forEach((mention, index) => {
    working = working.replace(`__MENTION_${index}__`, mention);
  });

  return working.trim();
}

function formatMentionField(input) {
  if (!input) return;
  input.value = convertDiscordIdsToMentions(input.value);
}

const supervisionMentionFields = [
  fields.leadership,
  fields.leaderAdvisor,
  fields.generalSupervision,
  fields.fieldSupervision,
  fields.areaSupervision,
  fields.traineeSupervision,
  fields.certifiedLadies,
  fields.storeOpeningOfficer,
  fields.garageRoomFieldSupervisor,
  fields.garageRoomAreaSupervisor,
  fields.garageRoomTraineeSupervisor,
  fields.operations,
  fields.deputyOperations,
  fields.callCenter,
  fields.losPort,
  fields.paletoPort,
  fields.searchRescue
];

function formatSupervisionMentions() {
  supervisionMentionFields.forEach(formatMentionField);
}

function inBrackets(text) {
  const clean = String(text || '').trim();
  if (clean.startsWith('(') && clean.endsWith(')')) return clean;
  return `( ${clean} )`;
}

function namedValue(key) {
  return inBrackets(value(fields[key], FALLBACKS[key] || 'لا يوجد'));
}

function toast(message) {
  const box = $('toast');
  box.textContent = message;
  box.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => box.classList.remove('show'), 1800);
}

function buildSupervisionReport() {
  formatSupervisionMentions();
  const reportNumber = value(fields.reportNumber, '00');
  const fromTime = toTwelveHourTime(value(fields.fromTime, '00:00'));
  const fromPeriod = value(fields.fromPeriod, 'ص');
  const toTime = toTwelveHourTime(value(fields.toTime, '00:00'));
  const toPeriod = value(fields.toPeriod, 'ص');
  const supervisionLink = value(fields.supervisionSubmitLink, '');
  const operationsLink = value(fields.operationsReportLink, '');

  return `**تقرير رقم (${reportNumber})

تم استلام تقرير المشرفين من الساعة (${fromTime} ${fromPeriod}) الى الساعة (${toTime} ${toPeriod})

${divider}
القيادة: ${namedValue('leadership')}

مستشار القائد: ${namedValue('leaderAdvisor')}
${divider}
اشراف عام: ${namedValue('generalSupervision')}

اشراف ميداني: ${namedValue('fieldSupervision')}

اشراف المناطق: ${namedValue('areaSupervision')}

مشرفين متدربين: ${namedValue('traineeSupervision')}

لاعب معتمد: ${namedValue('certifiedLadies')}
${divider}
مسؤول افتتاح المتجر : ${namedValue('storeOpeningOfficer')}

المشرف الميداني بروم الكراج: ${namedValue('garageRoomFieldSupervisor')}

مشرف المنطقة بروم الكراج: ${namedValue('garageRoomAreaSupervisor')}

مشرف المتدرب بروم الكراج: ${namedValue('garageRoomTraineeSupervisor')}
${divider}

العمليات: ${namedValue('operations')}

نائب العمليات: ${namedValue('deputyOperations')}

مركز الاتصالات: ${namedValue('callCenter')}

فني ميناء لوس: ${namedValue('losPort')}

فني ميناء بوليتو: ${namedValue('paletoPort')}

البحث والانقاذ: ${namedValue('searchRescue')}
${divider}

[تسليم تقرير الاشراف](${supervisionLink}) 
[تقرير العمليات](${operationsLink})

${divider}
**`;
}

function generateSupervisionReport() {
  fields.output.value = buildSupervisionReport();
  toast('تم إنشاء تقرير الإشراف');
}

async function copySupervisionReport() {
  if (!fields.output.value || fields.output.value.includes('سيظهر تقرير الإشراف')) {
    generateSupervisionReport();
  }

  try {
    await navigator.clipboard.writeText(fields.output.value);
    toast('تم نسخ تقرير الإشراف');
  } catch (error) {
    fields.output.select();
    document.execCommand('copy');
    toast('تم نسخ تقرير الإشراف');
  }
}

function fillExample() {
  fields.reportNumber.value = '5';
  fields.fromTime.value = '08:00';
  fields.fromPeriod.value = 'م';
  fields.toTime.value = '09:00';
  fields.toPeriod.value = 'م';
  fields.leadership.value = '<@680393068469682256> <@1282062186579230792>';
  fields.leaderAdvisor.value = '<@1347310064977055834>';
  fields.generalSupervision.value = '<@1129397195116920863>';
  fields.fieldSupervision.value = '<@662779880097710080> <@457633781004894208>';
  fields.areaSupervision.value = '<@1459966470694899898> <@834199649949843467>';
  fields.traineeSupervision.value = 'لا يوجد';
  fields.certifiedLadies.value = '<@1265300539701334032>';
  fields.storeOpeningOfficer.value = 'لا يوجد';
  fields.garageRoomFieldSupervisor.value = 'لا يوجد';
  fields.garageRoomAreaSupervisor.value = 'لا يوجد';
  fields.garageRoomTraineeSupervisor.value = 'لا يوجد';
  fields.operations.value = '<@762015936885555221>';
  fields.deputyOperations.value = '<@921536232805240873>';
  fields.callCenter.value = '<@734866411456823317>';
  fields.losPort.value = 'لا يوجد';
  fields.paletoPort.value = '<@1328735995444723763>';
  fields.searchRescue.value = 'لا يوجد';
  fields.supervisionSubmitLink.value = '';
  fields.operationsReportLink.value = '';
  generateSupervisionReport();
}

function clearFields() {
  Object.entries(fields).forEach(([key, input]) => {
    if (key !== 'output') input.value = '';
  });
  fields.reportNumber.value = '00';
  fields.fromTime.value = '12:00';
  fields.toTime.value = '12:00';
  fields.fromPeriod.value = 'ص';
  fields.toPeriod.value = 'ص';
  fields.supervisionSubmitLink.value = '';
  fields.operationsReportLink.value = '';
  fields.output.value = 'سيظهر تقرير الإشراف هنا بعد الضغط على إنشاء التقرير.';
  toast('تم مسح خانات تقرير الإشراف');
}

$('generateSupervisionBtn').addEventListener('click', generateSupervisionReport);
$('copySupervisionBtn').addEventListener('click', copySupervisionReport);
$('exampleSupervisionBtn').addEventListener('click', fillExample);
$('clearSupervisionBtn').addEventListener('click', clearFields);

generateSupervisionReport();


function initAuditImagePreview() {
  const input = $('auditImage');
  const preview = $('auditPreview');
  const placeholder = $('auditPlaceholder');
  const clearBtn = $('clearAuditImageBtn');
  const zoomInBtn = $('zoomInAuditImageBtn');
  const zoomOutBtn = $('zoomOutAuditImageBtn');
  const previewBox = preview ? preview.closest('.audit-preview') : null;

  if (!input || !preview || !placeholder || !clearBtn || !zoomInBtn || !zoomOutBtn) return;

  let zoomLevel = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startOffsetX = 0;
  let startOffsetY = 0;

  function applyImageView() {
    preview.style.width = `${zoomLevel * 100}%`;
    preview.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  }

  function resetImageView() {
    zoomLevel = 1;
    offsetX = 0;
    offsetY = 0;
    applyImageView();
    if (previewBox) {
      previewBox.scrollTop = 0;
      previewBox.scrollLeft = 0;
    }
  }

  function clearPreview() {
    input.value = '';
    preview.removeAttribute('src');
    preview.classList.add('hidden');
    preview.classList.remove('is-dragging');
    placeholder.classList.remove('hidden');
    placeholder.textContent = 'لم يتم اختيار صورة بعد';
    isDragging = false;
    resetImageView();
  }

  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) {
      clearPreview();
      return;
    }

    if (!file.type.startsWith('image/')) {
      clearPreview();
      toast('يرجى اختيار صورة فقط');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.classList.remove('hidden');
      placeholder.classList.add('hidden');
      resetImageView();
      toast('تمت إضافة الصورة للتدقيق');
    };
    reader.readAsDataURL(file);
  });

  zoomInBtn.addEventListener('click', () => {
    if (preview.classList.contains('hidden')) {
      toast('أضف صورة أولاً');
      return;
    }
    zoomLevel = Math.min(zoomLevel + 0.25, 3);
    applyImageView();
  });

  zoomOutBtn.addEventListener('click', () => {
    if (preview.classList.contains('hidden')) {
      toast('أضف صورة أولاً');
      return;
    }
    zoomLevel = Math.max(zoomLevel - 0.25, 0.5);
    applyImageView();
  });

  preview.addEventListener('pointerdown', (event) => {
    if (preview.classList.contains('hidden')) return;
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
    startOffsetX = offsetX;
    startOffsetY = offsetY;
    preview.classList.add('is-dragging');
    preview.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  preview.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    offsetX = startOffsetX + event.clientX - startX;
    offsetY = startOffsetY + event.clientY - startY;
    applyImageView();
  });

  function stopDragging(event) {
    if (!isDragging) return;
    isDragging = false;
    preview.classList.remove('is-dragging');
    if (event && preview.hasPointerCapture(event.pointerId)) {
      preview.releasePointerCapture(event.pointerId);
    }
  }

  preview.addEventListener('pointerup', stopDragging);
  preview.addEventListener('pointercancel', stopDragging);
  preview.addEventListener('lostpointercapture', () => {
    isDragging = false;
    preview.classList.remove('is-dragging');
  });

  clearBtn.addEventListener('click', () => {
    clearPreview();
    toast('تم حذف الصورة');
  });
}

initAuditImagePreview();
