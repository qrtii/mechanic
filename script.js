// توجيهات الميدان حسب Discord ID المسجل دخول
// الناتج: الاسم | CD | الكود | التوجيه

const FIELD_ACCOUNT_PROFILES = {
  "481603641158139924": {
    name: "سعيد البدواوي",
    code: "G-142",
    certified: "CD",
    avatar: "https://cdn.discordapp.com/embed/avatars/0.png"
  },
  "1336726577265774715": {
    name: "محمد بن فاضل",
    code: "G-070",
    certified: "CD",
    avatar: "https://cdn.discordapp.com/embed/avatars/1.png"
  }
};

const rankInput = document.getElementById("rank");
const resultBox = document.getElementById("resultBox");
const showBtn = document.getElementById("showBtn");
const copyBtn = document.getElementById("copyBtn");
const toast = document.getElementById("toast");
const currentProfileAvatar = document.getElementById("currentProfileAvatar");
const currentProfileName = document.getElementById("currentProfileName");
const currentProfileDetails = document.getElementById("currentProfileDetails");

let currentText = "";
let activeProfile = null;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function getSessionDiscordId() {
  try {
    const session = window.MechGarageAuth?.getSession?.();
    if (session && session.discordId) return String(session.discordId);
  } catch (error) {}

  try {
    const raw = localStorage.getItem("mechGarageDiscordSession");
    const session = raw ? JSON.parse(raw) : null;
    if (session && session.discordId) return String(session.discordId);
  } catch (error) {}

  return "";
}

function loadAccountProfile() {
  const discordId = getSessionDiscordId();
  const profile = FIELD_ACCOUNT_PROFILES[discordId] || null;

  if (!profile) {
    activeProfile = null;
    if (currentProfileName) currentProfileName.textContent = "حساب غير مربوط";
    if (currentProfileDetails) currentProfileDetails.textContent = discordId || "لا يوجد Discord ID";
    if (resultBox) {
      resultBox.textContent = "هذا الحساب غير مربوط ببروفايل في توجيهات الميدان.";
      resultBox.classList.remove("ready");
    }
    return null;
  }

  activeProfile = { discordId, ...profile };

  if (currentProfileAvatar) currentProfileAvatar.src = activeProfile.avatar;
  if (currentProfileName) currentProfileName.textContent = activeProfile.name;
  if (currentProfileDetails) {
    currentProfileDetails.textContent = `${activeProfile.discordId} | ${activeProfile.certified} | ${activeProfile.code}`;
  }

  return activeProfile;
}

function makeText() {
  const profile = activeProfile || loadAccountProfile();
  if (!profile) {
    showToast("هذا الحساب غير مربوط ببروفايل");
    return "";
  }

  const direction = rankInput.value.trim();
  if (!direction) {
    showToast("اختر التوجيه أولاً");
    rankInput.focus();
    return "";
  }

  return [profile.name, profile.certified, profile.code, direction].join(" | ");
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
    const temp = document.createElement("textarea");
    temp.value = currentText;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
    showToast("تم نسخ النص بنجاح");
  }
}

function initFieldDirectionPage() {
  loadAccountProfile();

  showBtn.addEventListener("click", showResult);
  copyBtn.addEventListener("click", copyResult);

  rankInput.addEventListener("change", () => {
    currentText = "";
    showResult();
  });
}

document.addEventListener("DOMContentLoaded", initFieldDirectionPage);
