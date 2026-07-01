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
  supervisionSubmitLink: $('supervisionSubmitLink'),
  operationsReportLink: $('operationsReportLink'),
  output: $('supervisionOutput')
};

const FALLBACKS = {
  leadership: 'لا يوجد',
  leaderAdvisor: 'لا يوجد',
  generalSupervision: 'لا يوجد',
  fieldSupervision: 'لا يوجد',
  areaSupervision: 'لا يوجد',
  traineeSupervision: 'لا يوجد',
  certifiedLadies: 'لا يوجد',
  storeOpeningOfficer: 'لا يوجد',
  garageRoomFieldSupervisor: 'لا يوجد',
  garageRoomAreaSupervisor: 'لا يوجد',
  garageRoomTraineeSupervisor: 'لا يوجد',
  operations: 'لا يوجد',
  deputyOperations: 'لا يوجد',
  callCenter: 'لا يوجد',
  losPort: 'لا يوجد',
  paletoPort: 'لا يوجد'
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
  fields.paletoPort
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
  const supervisionLink = value(fields.supervisionSubmitLink, 'لا يوجد');
  const operationsLink = value(fields.operationsReportLink, 'لا يوجد');

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

لاعب معتمد والسيدات: ${namedValue('certifiedLadies')}
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
  fields.paletoPort.value = '<@1328735995444723763>';.value = 'لا يوجد';
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
  const resetGuideBtn = $('resetGuideLinesBtn');
  const guide1 = $('auditGuide1');
  const guide2 = $('auditGuide2');
  const dimTop = $('auditDimTop');
  const dimBottom = $('auditDimBottom');
  const previewBox = preview ? preview.closest('.audit-preview') : null;

  if (!input || !preview || !placeholder || !clearBtn || !zoomInBtn || !zoomOutBtn || !previewBox || !guide1 || !guide2 || !dimTop || !dimBottom) return;

  let zoomLevel = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isDraggingImage = false;
  let startX = 0;
  let startY = 0;
  let startOffsetX = 0;
  let startOffsetY = 0;

  const defaultGuides = [30, 42];
  const guidePositions = [defaultGuides[0], defaultGuides[1]];
  let activeGuide = null;
  let guideStartY = 0;
  let guideStartPercent = 0;

  function applyImageView() {
    preview.style.width = `${zoomLevel * 100}%`;
    preview.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  }

  function applyGuideLines() {
    [guide1, guide2].forEach((guide, index) => {
      guide.style.top = `${guidePositions[index]}%`;
    });
    applyDimOverlay();
  }

  function applyDimOverlay() {
    const upper = Math.min(guidePositions[0], guidePositions[1]);
    const lower = Math.max(guidePositions[0], guidePositions[1]);

    dimTop.style.top = '0';
    dimTop.style.height = `${upper}%`;

    dimBottom.style.top = `${lower}%`;
    dimBottom.style.height = `${Math.max(0, 100 - lower)}%`;
  }

  function showGuideLines() {
    guide1.classList.remove('hidden');
    guide2.classList.remove('hidden');
    dimTop.classList.remove('hidden');
    dimBottom.classList.remove('hidden');
    applyGuideLines();
  }

  function hideGuideLines() {
    guide1.classList.add('hidden');
    guide2.classList.add('hidden');
    dimTop.classList.add('hidden');
    dimBottom.classList.add('hidden');
  }

  function resetGuideLines() {
    guidePositions[0] = defaultGuides[0];
    guidePositions[1] = defaultGuides[1];
    applyGuideLines();
  }

  function resetImageView() {
    zoomLevel = 1;
    offsetX = 0;
    offsetY = 0;
    applyImageView();
    resetGuideLines();
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
    isDraggingImage = false;
    activeGuide = null;
    hideGuideLines();
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
      showGuideLines();
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
    if (event.target === guide1 || event.target === guide2 || event.target.closest('.audit-guide')) return;
    isDraggingImage = true;
    startX = event.clientX;
    startY = event.clientY;
    startOffsetX = offsetX;
    startOffsetY = offsetY;
    preview.classList.add('is-dragging');
    preview.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  preview.addEventListener('pointermove', (event) => {
    if (!isDraggingImage) return;
    offsetX = startOffsetX + event.clientX - startX;
    offsetY = startOffsetY + event.clientY - startY;
    applyImageView();
  });

  function stopImageDragging(event) {
    if (!isDraggingImage) return;
    isDraggingImage = false;
    preview.classList.remove('is-dragging');
    if (event && preview.hasPointerCapture(event.pointerId)) {
      preview.releasePointerCapture(event.pointerId);
    }
  }

  preview.addEventListener('pointerup', stopImageDragging);
  preview.addEventListener('pointercancel', stopImageDragging);
  preview.addEventListener('lostpointercapture', () => {
    isDraggingImage = false;
    preview.classList.remove('is-dragging');
  });

  function startGuideDrag(event, guide, index) {
    if (preview.classList.contains('hidden')) {
      toast('أضف صورة أولاً');
      return;
    }
    activeGuide = { element: guide, index };
    guideStartY = event.clientY;
    guideStartPercent = guidePositions[index];
    guide.classList.add('is-dragging');
    guide.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function onGuideMove(event) {
    if (!activeGuide) return;
    const rect = previewBox.getBoundingClientRect();
    const deltaY = event.clientY - guideStartY;
    const deltaPercent = (deltaY / Math.max(rect.height, 1)) * 100;
    guidePositions[activeGuide.index] = Math.max(2, Math.min(98, guideStartPercent + deltaPercent));
    applyGuideLines();
  }

  function stopGuideDrag(event) {
    if (!activeGuide) return;
    const { element } = activeGuide;
    element.classList.remove('is-dragging');
    if (event && element.hasPointerCapture && element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
    activeGuide = null;
  }

  [guide1, guide2].forEach((guide, index) => {
    guide.addEventListener('pointerdown', (event) => startGuideDrag(event, guide, index));
    guide.addEventListener('pointermove', onGuideMove);
    guide.addEventListener('pointerup', stopGuideDrag);
    guide.addEventListener('pointercancel', stopGuideDrag);
    guide.addEventListener('lostpointercapture', () => {
      guide.classList.remove('is-dragging');
      activeGuide = null;
    });
  });

  clearBtn.addEventListener('click', () => {
    clearPreview();
    toast('تم حذف الصورة');
  });

  if (resetGuideBtn) {
    resetGuideBtn.addEventListener('click', () => {
      if (preview.classList.contains('hidden')) {
        toast('أضف صورة أولاً');
        return;
      }
      resetGuideLines();
      toast('تمت إعادة ضبط الخطين');
    });
  }

  hideGuideLines();
}

initAuditImagePreview();
