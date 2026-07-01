const $ = (id) => document.getElementById(id);

const fields = {
  reportNumber: $('reportNumber'),
  fromTime: $('fromTime'),
  fromPeriod: $('fromPeriod'),
  toTime: $('toTime'),
  toPeriod: $('toPeriod'),
  garageLeader: $('garageLeader'),
  advisor: $('advisor'),
  generalSupervisor: $('generalSupervisor'),
  fieldSupervisor: $('fieldSupervisor'),
  areaSupervisors: $('areaSupervisors'),
  traineeSupervisors: $('traineeSupervisors'),
  operations: $('operations'),
  deputyOperations: $('deputyOperations'),
  callCenter: $('callCenter'),
  ladiesCertified: $('ladiesCertified'),
  islandPaleto: $('islandPaleto'),
  paleto: $('paleto'),
  sandy: $('sandy'),
  los: $('los'),
  fleetCount: $('fleetCount'),
  losPort: $('losPort'),
  paletoPort: $('paletoPort'),
  reportOutput: $('reportOutput')
};

function value(input, fallback = 'لا يوجد') {
  const text = String(input.value || '').trim();
  return text.length ? text : fallback;
}

function unitValue(input) {
  const text = String(input.value || '').trim();
  return text.length ? text : 'لا يوجد';
}

function numberValue(input, fallback = '00') {
  const text = String(input.value || '').trim();
  if (!text.length) return fallback;
  return text.padStart(2, '0');
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


function convertDiscordIdsToMentions(text) {
  const placeholders = [];
  let working = normalizeDigits(String(text || ''));

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
  input.value = convertDiscordIdsToMentions(input.value);
}

const adminSupervisorMentionFields = [
  fields.garageLeader,
  fields.advisor,
  fields.generalSupervisor,
  fields.fieldSupervisor,
  fields.areaSupervisors,
  fields.traineeSupervisors,
  fields.operations,
  fields.deputyOperations,
  fields.callCenter,
  fields.ladiesCertified,
  fields.losPort,
  fields.paletoPort
];

function formatAdminSupervisorMentions() {
  adminSupervisorMentionFields.forEach(formatMentionField);
}

function toast(message) {
  const box = $('toast');
  box.textContent = message;
  box.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => box.classList.remove('show'), 1800);
}

function buildReport() {
  const reportNumber = value(fields.reportNumber, '0');
  const fromTime = toTwelveHourTime(value(fields.fromTime, '00:00'));
  const toTime = toTwelveHourTime(value(fields.toTime, '00:00'));
  const fromPeriod = value(fields.fromPeriod, 'ص');
  const toPeriod = value(fields.toPeriod, 'ص');

  return `**تم استلام التقرير الميداني لـكراج الميكانيكي 

تقرير رقم (${reportNumber || "0"})
من الساعة ${fromTime} ( ${fromPeriod} )
حتى الساعة ${toTime} ( ${toPeriod} )

قيادة الكراج : ${value(fields.garageLeader)}

مستشار القائد : ${value(fields.advisor)}

المشرف العام : ${value(fields.generalSupervisor)}

المشرف الميداني : ${value(fields.fieldSupervisor)}

مشرفين المناطق : ${value(fields.areaSupervisors)}

مشرفين متدربين : ${value(fields.traineeSupervisors)}

العمليات : ${value(fields.operations)}

نائب العمليات : ${value(fields.deputyOperations)}

مركز الاتصالات : ${value(fields.callCenter)}

السيدات و المعتمدين : ${value(fields.ladiesCertified)}


جزيرة بوليتو : ${unitValue(fields.islandPaleto)}

بوليتو :
${unitValue(fields.paleto)}

ساندي :

${unitValue(fields.sandy)}




لوس :

${unitValue(fields.los)}





خدمات الاسطول :
 
عدد / ${numberValue(fields.fleetCount)}

ميناء لوس : ${value(fields.losPort)}
ميناء بوليتو : ${value(fields.paletoPort)}**`;
}

function generateReport() {
  formatAdminSupervisorMentions();
  fields.reportOutput.value = buildReport();
  toast('تم إنشاء التقرير');
}

async function copyReport() {
  if (!fields.reportOutput.value || fields.reportOutput.value.includes('سيظهر التقرير')) {
    generateReport();
  }

  try {
    await navigator.clipboard.writeText(fields.reportOutput.value);
    toast('تم نسخ التقرير');
  } catch (error) {
    fields.reportOutput.select();
    document.execCommand('copy');
    toast('تم نسخ التقرير');
  }
}

function fillExample() {
  fields.reportNumber.value = '';
  fields.fromTime.value = '07:00';
  fields.fromPeriod.value = 'ص';
  fields.toTime.value = '08:00';
  fields.toPeriod.value = 'ص';
  fields.garageLeader.value = '<@457775919122087936>';
  fields.advisor.value = '<@1139633117875933325>';
  fields.generalSupervisor.value = '<@557660657990893588> <@757230139569471559>';
  fields.fieldSupervisor.value = '<@921536232805240873> <@1117598180519972894> <@725308791339614248>';
  fields.areaSupervisors.value = '<@921536232805240873> <@1117598180519972894> <@725308791339614248> <@1458181819899052166>';
  fields.traineeSupervisors.value = 'لا يوجد';
  fields.operations.value = '<@236475710707859456>';
  fields.deputyOperations.value = '<@1220886624507006988>';
  fields.callCenter.value = '<@789475654272811023>';
  fields.ladiesCertified.value = '';
  fields.islandPaleto.value = 'لايوجد';
  fields.paleto.value = 'لايوجد';
  fields.sandy.value = 'G-534\nG-507';
  fields.los.value = 'G-506';
  fields.fleetCount.value = '0';
  fields.losPort.value = 'لا يوجد';
  fields.paletoPort.value = 'لا يوجد';
  generateReport();
}

function clearFields() {
  Object.entries(fields).forEach(([key, input]) => {
    if (key !== 'reportOutput') input.value = '';
  });
  fields.fromTime.value = '07:00';
  fields.toTime.value = '08:00';
  fields.fromPeriod.value = 'ص';
  fields.toPeriod.value = 'ص';
  fields.fleetCount.value = '0';
  fields.reportOutput.value = 'سيظهر التقرير هنا بعد الضغط على إنشاء التقرير.';
  toast('تم مسح الخانات');
}

$('generateBtn').addEventListener('click', generateReport);
$('copyReportBtn').addEventListener('click', copyReport);
$('exampleBtn').addEventListener('click', fillExample);
$('clearBtn').addEventListener('click', clearFields);

adminSupervisorMentionFields.forEach((input) => {
  if (!input) return;
  input.addEventListener('blur', () => formatMentionField(input));
  input.addEventListener('paste', () => {
    window.setTimeout(() => formatMentionField(input), 0);
  });
});

generateReport();


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



function normalizeArabicText(text) {
  return String(text || '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/ـ/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .toLowerCase();
}

function normalizeDigits(text) {
  return String(text || '')
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
}

function cleanUnitCode(rawDigits) {
  const corrected = normalizeDigits(rawDigits)
    .toUpperCase()
    .replace(/O/g, '0')
    .replace(/[IL|]/g, '1')
    .replace(/S/g, '5')
    .replace(/B/g, '8')
    .replace(/[^0-9]/g, '');

  if (corrected.length < 3) return '';
  return `G-${corrected.slice(0, 3)}`;
}

function extractUnitCodes(line) {
  const codes = [];
  const normalizedLine = normalizeDigits(line)
    .replace(/\u200f|\u200e/g, '')
    .replace(/\[/g, ' [ ')
    .replace(/\]/g, ' ] ');

  const patterns = [
    // G-163 / G 163 / G163
    /(?:^|[^0-9A-Z])([Gg])\s*[-–—:]?\s*([0-9OISBL|][0-9OISBL|\s.\-–—]{1,8}[0-9OISBL|])/g,
    // أحياناً OCR يقرأ G كرقم 6 أو 2 أو C، وهنا نشترط وجود شرطة حتى لا نلتقط أرقام الـ IDs مثل [6402].
    /(?:^|[^0-9A-Z])([6C2])\s*[-–—:]\s*([0-9OISBL|][0-9OISBL|\s.\-–—]{1,8}[0-9OISBL|])/g,
    // بعض الصور تظهر الكود بين أقواس أو بدون مسافة واضحة
    /\[?\s*([Gg])\s*[-–—:]?\s*([0-9OISBL|]{3,4})\s*\]?/g,
    /\[?\s*([6C2])\s*[-–—:]\s*([0-9OISBL|]{3,4})\s*\]?/g
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(normalizedLine)) !== null) {
      const code = cleanUnitCode(match[2]);
      if (code && !codes.includes(code)) codes.push(code);
    }
  });

  return codes;
}

function normalizedLineForArea(line) {
  return normalizeArabicText(line)
    .replace(/[()\[\]{}|*_`~.،,؛;!؟?]/g, ' ')
    .replace(/[:：\-–—+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shouldIgnoreLine(line) {
  const normalized = normalizedLineForArea(line);
  const english = String(line || '').toLowerCase();

  const ignoredWords = [
    'قياده', 'القياده', 'قيادة', 'القائد', 'مستشار',
    'اشراف', 'المشرف', 'مشرف', 'مشرفين',
    'العمليات', 'نائب العمليات', 'مركز الاتصالات', 'الاتصالات',
    'السيدات', 'المعتمدين', 'اداري', 'اداره',
    'خدمات الاسطول', 'ميناء', 'موانئ', 'عدد', 'radio'
  ];

  return ignoredWords.some((word) => normalized.includes(word)) ||
    english.includes('supervisor') ||
    english.includes('operation') ||
    english.includes('port') ||
    english.includes('admin') ||
    english.includes('radio');
}

function detectAreaFromLine(line) {
  const normalized = normalizedLineForArea(line);
  const english = String(line || '').toLowerCase().trim();

  // لا نحدد منطقة من السطر إذا كان السطر يتكلم عن قيادة/إشراف/عمليات حتى لو يحتوي كلمة لوس أو بوليتو.
  if (shouldIgnoreLine(line)) return '';

  const rawNormalized = normalizeArabicText(line)
    .replace(/[()\[\]{}*_`~.،,؛;!؟?]/g, ' ')
    .replace(/[:：\-–—+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  function hasAny(text, words) {
    return words.some((word) => text.includes(word));
  }

  function areaFromText(text) {
    const hasIsland = hasAny(text, ['جزيره', 'الجزيره', 'جزيرة', 'الجزرة', 'الجزره']) || english.includes('island');
    const hasPaleto = hasAny(text, ['بوليتو', 'بولتو', 'يوليتو']) || english.includes('paleto') || english.includes('polito');
    const hasSandy = hasAny(text, ['ساندي', 'ساندى', 'ساتدي', 'ساتدى']) || english.includes('sandy');
    const hasLos = hasAny(text, ['لوس', 'نوس', 'توس']) || english.includes('los');

    if (hasIsland && hasPaleto) return 'islandPaleto';
    if (hasSandy) return 'sandy';
    if (hasLos) return 'los';
    if (hasPaleto) return 'paleto';
    if (hasIsland) return 'islandPaleto';
    return '';
  }

  // نقبل المنطقة إذا كانت في بداية السطر بعد إزالة الرموز، مثل: لوس | G-133.
  const startClean = normalized.replace(/^[0-9\s»«+•\-_.]+/g, '').trim();
  const areaStartWords = ['لوس', 'نوس', 'توس', 'ساندي', 'ساندى', 'ساتدي', 'ساتدى', 'بوليتو', 'بولتو', 'يوليتو', 'جزيره', 'الجزيره', 'جزيرة', 'الجزرة', 'الجزره'];
  const startsWithArea = areaStartWords.some((word) => startClean.startsWith(word)) ||
    /^(los|sandy|paleto|polito|island)\b/.test(english.replace(/^[0-9\s»«+•\-_.]+/g, '').trim());
  if (startsWithArea) return areaFromText(startClean);

  // ونقبلها إذا كانت في آخر جزء بعد الفواصل، مثل: سعيد | G-163 | لوس.
  const parts = rawNormalized.split('|').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const lastPartArea = areaFromText(parts[parts.length - 1]);
    if (lastPartArea) return lastPartArea;
  }

  return '';
}

function lineLooksLikeAreaHeader(line) {
  const normalized = normalizedLineForArea(line);
  if (shouldIgnoreLine(line)) return false;

  // لا نعتبر السطر عنوان منطقة إلا إذا كان العنوان واضحاً لوحده.
  // هذا يمنع وضع كل الأكواد تحت لوس إذا ظهرت كلمة لوس في أول سطر من صورة الراديو.
  return /^(لوس|نوس|توس|ساندي|ساندى|ساتدي|ساتدى|بوليتو|بولتو|جزيره بوليتو|الجزيره بوليتو|جزيرة بوليتو)\s*:?$/.test(normalized);
}

function textLooksLikeRadioList(text) {
  const normalized = normalizeArabicText(text);
  const english = String(text || '').toLowerCase();

  // صور القائمة داخل اللعبة غالباً تحتوي Radio أو توجيهة/توجيهة، وفيها كل وحدة في سطرها.
  // في هذا الوضع لا نستخدم آخر منطقة كمنطقة مستمرة؛ لازم تكون المنطقة موجودة في نفس سطر الكود.
  return english.includes('radio') ||
    normalized.includes('توجيهه') ||
    normalized.includes('توجيهة') ||
    normalized.includes('وجهه') ||
    normalized.includes('وجيهه');
}

function parseUnitsFromOcrText(text) {
  const buckets = {
    islandPaleto: [],
    paleto: [],
    sandy: [],
    los: []
  };
  const ignoredCodes = [];
  const foundCodes = [];
  let currentArea = '';
  const strictSameLineArea = textLooksLikeRadioList(text);

  String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const codes = extractUnitCodes(line);
      const areaOnSameLine = detectAreaFromLine(line);

      if (codes.length) {
        codes.forEach((code) => {
          if (!foundCodes.includes(code)) foundCodes.push(code);
        });
      }

      // إذا كان السطر من القيادة/الإشراف/العمليات، تجاهل أكواده ولا تغير المنطقة الحالية.
      if (shouldIgnoreLine(line)) {
        codes.forEach((code) => {
          if (!ignoredCodes.includes(code)) ignoredCodes.push(code);
        });
        return;
      }

      if (!codes.length) {
        if (lineLooksLikeAreaHeader(line)) {
          currentArea = detectAreaFromLine(line);
        }
        return;
      }

      // القاعدة المهمة:
      // 1) إذا الكود والمدينة في نفس السطر: نضع الكود في نفس المدينة فقط.
      // 2) إذا الصورة عبارة عن Radio/توجيهة: لا نستخدم currentArea حتى لا تنتقل الأكواد كلها للوس.
      // 3) إذا الصورة تقرير عادي وفيه عنوان منطقة واضح ثم أكواد تحته: نستخدم عنوان المنطقة.
      const targetArea = areaOnSameLine || (strictSameLineArea ? '' : currentArea);
      if (!targetArea || !buckets[targetArea]) {
        codes.forEach((code) => {
          if (!ignoredCodes.includes(code)) ignoredCodes.push(code);
        });
        return;
      }

      codes.forEach((code) => {
        if (!buckets[targetArea].includes(code)) buckets[targetArea].push(code);
      });
    });

  return { buckets, ignoredCodes, foundCodes };
}

function setAreaUnits(areaKey, codes) {
  if (!codes || !codes.length || !fields[areaKey]) return;
  fields[areaKey].value = codes.join('\n');
}

function prepareImageForOcr(file) {
  return new Promise((resolve) => {
    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.onload = () => {
        const scale = 2.5;
        const canvas = document.createElement('canvas');
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const maxGB = Math.max(g, b);
          const isCyanText = maxGB - r > 35 && g > 70 && b > 70;
          const isLightText = r > 150 && g > 150 && b > 150;

          if (isCyanText || isLightText) {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
          } else {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      image.onerror = () => resolve(file);
      image.src = reader.result;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

async function extractUnitsFromAuditImage() {
  const input = $('auditImage');
  const status = $('ocrStatus');
  const file = input && input.files && input.files[0];

  if (!file) {
    toast('أضف صورة أولاً');
    if (status) status.textContent = 'أضف صورة واضحة للتقرير، ثم اضغط استخراج الوحدات.';
    return;
  }

  if (typeof Tesseract === 'undefined') {
    toast('تعذر تحميل قارئ الصورة');
    if (status) status.textContent = 'لم يتم تحميل مكتبة قراءة الصور. تأكد من اتصال الإنترنت ثم حدث الصفحة.';
    return;
  }

  try {
    if (status) status.textContent = 'جاري تجهيز الصورة وقراءة الوحدات فقط...';
    toast('جاري استخراج الوحدات');

    const preparedImage = await prepareImageForOcr(file);
    const result = await Tesseract.recognize(preparedImage, 'ara+eng', {
      tessedit_pageseg_mode: '6',
      logger: (message) => {
        if (!status || !message || !message.status) return;
        const progress = message.progress ? ` ${Math.round(message.progress * 100)}%` : '';
        status.textContent = `جاري قراءة الصورة: ${message.status}${progress}`;
      }
    });

    const text = result && result.data ? result.data.text : '';
    const { buckets, ignoredCodes, foundCodes } = parseUnitsFromOcrText(text);
    const filledAreas = [];

    Object.entries(buckets).forEach(([areaKey, codes]) => {
      if (codes.length) {
        setAreaUnits(areaKey, codes);
        filledAreas.push(areaKey);
      }
    });

    if (filledAreas.length && status) {
      const ignoredPart = ignoredCodes.length ? ` تم تجاهل أكواد القيادة/الإشراف/العمليات: ${ignoredCodes.join('، ')}.` : '';
      status.textContent = `تم استخراج وحدات المناطق فقط وتعبئة الخانات. راجع النتيجة قبل النسخ.${ignoredPart}`;
    } else if (foundCodes.length && status) {
      status.textContent = `تم العثور على أكواد، لكن لم تتم إضافتها لأنها لا تحتوي على اسم منطقة واضح بجانب الكود أو لأنها تابعة للإشراف/القيادة: ${foundCodes.join('، ')}.`;
    } else if (status) {
      status.textContent = 'لم يتم العثور على أكواد واضحة. قرّب أو قصّ الجزء الذي يحتوي على الوحدات فقط، ثم أعد المحاولة.';
    }

    generateReport();
    toast(filledAreas.length ? 'تم تعبئة الوحدات فقط' : 'لم تتم إضافة وحدات');
  } catch (error) {
    console.error(error);
    toast('تعذر استخراج الوحدات');
    if (status) status.textContent = 'حدث خطأ أثناء قراءة الصورة. جرّب صورة أوضح أو تأكد من اتصال الإنترنت.';
  }
}

const extractUnitsBtn = $('extractUnitsBtn');
if (extractUnitsBtn) {
  extractUnitsBtn.addEventListener('click', extractUnitsFromAuditImage);
}
