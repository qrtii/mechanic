
(function () {
  const SESSION_KEY = 'mechGarageDiscordSession';
  const SESSION_HOURS = 12;
  const ALLOWED_DISCORD_IDS = [
    '481603641158139924',
    '1336726577265774715'
  ];

  function now() {
    return Date.now();
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session || !session.discordId || !session.expiresAt) return null;
      if (now() > Number(session.expiresAt)) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch (error) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  function saveSession(discordId) {
    const session = {
      discordId: String(discordId || '').trim(),
      createdAt: now(),
      expiresAt: now() + SESSION_HOURS * 60 * 60 * 1000
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function isLoginPage() {
    return /login\.html(?:$|\?)/.test(location.pathname) || location.pathname.endsWith('/login');
  }

  function pageName() {
    const name = location.pathname.split('/').pop();
    return name || 'index.html';
  }

  function redirectToLogin() {
    const next = encodeURIComponent(pageName());
    location.replace('login.html?next=' + next);
  }

  function redirectAfterLogin() {
    const params = new URLSearchParams(location.search);
    const next = params.get('next') || 'index.html';
    const safeNext = /^[a-zA-Z0-9_-]+\.html$/.test(next) ? next : 'index.html';
    location.replace(safeNext);
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

  function attachLogin() {
    const form = document.getElementById('loginForm');
    const input = document.getElementById('discordIdInput');
    const error = document.getElementById('loginError');

    if (!form || !input) return;

    const session = getSession();
    if (session) {
      redirectAfterLogin();
      return;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      const discordId = normalizeDigits(input.value).replace(/\D/g, '');
      if (!/^\d{15,25}$/.test(discordId)) {
        if (error) {
          error.textContent = 'يرجى إدخال Discord ID صحيح مكوّن من أرقام فقط.';
          error.classList.remove('hidden');
        }
        input.focus();
        return;
      }

      if (!ALLOWED_DISCORD_IDS.includes(discordId)) {
        if (error) {
          error.textContent = 'هذا Discord ID غير مصرح له بالدخول.';
          error.classList.remove('hidden');
        }
        input.focus();
        return;
      }

      saveSession(discordId);
      redirectAfterLogin();
    });
  }

  function attachProtectedPage() {
    const session = getSession();
    if (!session) {
      redirectToLogin();
      return;
    }

    document.documentElement.classList.add('is-authenticated');

    const idTargets = document.querySelectorAll('[data-discord-id]');
    idTargets.forEach((target) => {
      target.textContent = session.discordId;
    });

    const logoutButtons = document.querySelectorAll('[data-logout]');
    logoutButtons.forEach((button) => {
      button.addEventListener('click', () => {
        localStorage.removeItem(SESSION_KEY);
        location.replace('login.html');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (isLoginPage()) {
      attachLogin();
    } else {
      attachProtectedPage();
    }
  });

  window.MechGarageAuth = {
    getSession,
    logout: function () {
      localStorage.removeItem(SESSION_KEY);
      location.replace('login.html');
    }
  };
})();
