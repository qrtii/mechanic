// غيّر هذا النص إذا كنت تريد صيغة مختلفة للناتج النهائي.
// المتغيرات المتاحة: {rank} {company} {certified} {playerName}
const OUTPUT_FORMAT = "{company}{certified}{playerName}{rank} ";

const rankInput = document.getElementById("rank");
const companyInput = document.getElementById("company");
const certifiedInput = document.getElementById("certified");
const playerNameInput = document.getElementById("playerName");
const resultBox = document.getElementById("resultBox");
const showBtn = document.getElementById("showBtn");
const copyBtn = document.getElementById("copyBtn");
const toast = document.getElementById("toast");

let currentText = "";

function makeText() {
  const rank = rankInput.value.trim();
  const company = companyInput.value.trim();
  const certified = certifiedInput.value.trim();
  const playerName = playerNameInput.value.trim();

  if (!rank) {
    showToast("اختر المسمى الميداني أولاً");
    rankInput.focus();
    return "";
  }

const parts = {
  playerName: playerName ? ` | ${playerName}` : "",
  certified: certified ? ` | ${certified}` : "",
  company: company ? ` | ${company}` : "",
  rank: rank ? `  ${rank}` : ""
};


  return OUTPUT_FORMAT
    .replace("{rank}", parts.rank)
    .replace("{company}", parts.company)
    .replace("{certified}", parts.certified)
    .replace("{playerName}", parts.playerName);
}

function showResult() {
  const text = makeText();
  if (!text) return;

  currentText = text;
  resultBox.textContent = text;
  resultBox.classList.add("ready");
}

async function copyResult() {
  if (!currentText) showResult();
  if (!currentText) return;

  try {
    await navigator.clipboard.writeText(currentText);
    showToast("تم نسخ النص بنجاح");
  } catch (error) {
    // حل احتياطي للمتصفحات القديمة.
    const temp = document.createElement("textarea");
    temp.value = currentText;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
    showToast("تم نسخ النص بنجاح");
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

showBtn.addEventListener("click", showResult);
copyBtn.addEventListener("click", copyResult);

[rankInput, companyInput, certifiedInput, playerNameInput].forEach((input) => {
  input.addEventListener("change", () => {
    if (currentText) showResult();
  });

  input.addEventListener("input", () => {
    if (currentText) showResult();
  });
});
