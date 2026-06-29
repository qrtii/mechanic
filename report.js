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

function numberValue(input, fallback = '00') {
  const text = String(input.value || '').trim();
  if (!text.length) return fallback;
  return text.padStart(2, '0');
}

function toast(message) {
  const box = $('toast');
  box.textContent = message;
  box.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => box.classList.remove('show'), 1800);
}

function buildReport() {
  const reportNumber = value(fields.reportNumber, '');
  const fromTime = value(fields.fromTime, '00:00');
  const toTime = value(fields.toTime, '00:00');
  const fromPeriod = value(fields.fromPeriod, 'ص');
  const toPeriod = value(fields.toPeriod, 'ص');

  return `**تم استلام التقرير الميداني لـكراج الميكانيكي 

تقرير رقم ${reportNumber}
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


جزيرة بوليتو : ${value(fields.islandPaleto)}

بوليتو :
${value(fields.paleto)}

ساندي :

${value(fields.sandy)}




لوس :

${value(fields.los)}





خدمات الاسطول :
 
عدد / ${numberValue(fields.fleetCount)}

ميناء لوس : ${value(fields.losPort)}
ميناء بوليتو : ${value(fields.paletoPort)}**`;
}

function generateReport() {
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
  fields.fromTime.value = '7:00';
  fields.fromPeriod.value = 'ص';
  fields.toTime.value = '8:00';
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
  fields.fromTime.value = '7:00';
  fields.toTime.value = '8:00';
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

generateReport();


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
