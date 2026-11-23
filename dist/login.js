(() => {
  'use strict';

  // This preview uses a local demo session. Production sign-in requires a server.
  const DEMO_EMAIL = 'demo@idsspl.com';
  const DEMO_PASSWORD = 'Welcome@123';
  const SESSION_KEY = 'idsspl-crm-demo-session';

  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const error = document.getElementById('login-error');
  const submit = document.getElementById('login-submit');
  const submitLabel = submit.querySelector('.login-submit-label');
  const passwordToggle = document.getElementById('login-password-toggle');
  const accountButton = document.getElementById('account-menu-button');
  const accountMenu = document.getElementById('account-menu');
  const showcaseVideo = document.getElementById('login-showcase-video');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  let pending = false;
  let authenticated = false;

  function syncShowcaseVideo() {
    if (authenticated || reducedMotion?.matches) {
      showcaseVideo.pause();
      return;
    }
    showcaseVideo.play().catch(() => { /* Poster remains visible if autoplay is unavailable. */ });
  }

  function hasSession() {
    try { return sessionStorage.getItem(SESSION_KEY) === 'active'; }
    catch { return authenticated; }
  }

  function setSession(active) {
    authenticated = active;
    try {
      if (active) sessionStorage.setItem(SESSION_KEY, 'active');
      else sessionStorage.removeItem(SESSION_KEY);
    } catch { /* The demo still works for this page visit. */ }
    document.body.classList.toggle('is-authenticated', active);
    document.title = active ? 'IDSSPL CRM · Workspace' : 'Sign in · IDSSPL CRM';
    syncShowcaseVideo();
  }

  function showError(message) {
    error.textContent = message;
    error.hidden = !message;
    emailInput.setAttribute('aria-invalid', message ? 'true' : 'false');
    passwordInput.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function closeAccountMenu() {
    accountMenu.hidden = true;
    accountButton.setAttribute('aria-expanded', 'false');
  }


  setSession(hasSession());
  reducedMotion?.addEventListener?.('change', syncShowcaseVideo);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (pending) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    showError('');

    if (!email || !password) {
      showError('Enter both the email address and password.');
      (!email ? emailInput : passwordInput).focus();
      return;
    }
    if (!emailInput.checkValidity()) {
      showError('Enter a valid email address.');
      emailInput.focus();
      return;
    }

    pending = true;
    submit.disabled = true;
    submit.classList.add('is-loading');
    submitLabel.textContent = 'Checking details…';
    await new Promise(resolve => setTimeout(resolve, 320));
    pending = false;
    submit.disabled = false;
    submit.classList.remove('is-loading');
    submitLabel.textContent = 'Enter workspace';

    if (email.toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      showError('Those details do not match the demo account. Copy the credentials below and try again.');
      passwordInput.focus();
      passwordInput.select();
      return;
    }

    setSession(true);
    passwordInput.value = '';
    document.getElementById('main-content').focus({ preventScroll: true });
  });

  document.getElementById('login-fill-demo').addEventListener('click', () => {
    emailInput.value = DEMO_EMAIL;
    passwordInput.value = DEMO_PASSWORD;
    showError('');
    passwordInput.focus();
  });

  passwordToggle.addEventListener('click', () => {
    const visible = passwordInput.type === 'password';
    passwordInput.type = visible ? 'text' : 'password';
    passwordToggle.textContent = visible ? 'Hide' : 'Show';
    passwordToggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
    passwordToggle.setAttribute('aria-pressed', String(visible));
    passwordInput.focus();
  });

  async function copyText(value) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch { /* Use the selection fallback below. */ }
    const field = document.createElement('textarea');
    field.value = value;
    field.readOnly = true;
    field.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { /* Clipboard denied. */ }
    field.remove();
    return copied;
  }

  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const isEmail = button.dataset.copy === 'email';
      const value = isEmail ? DEMO_EMAIL : DEMO_PASSWORD;
      const copied = await copyText(value);
      button.textContent = copied ? 'Copied' : 'Fill';
      if (!copied) {
        (isEmail ? emailInput : passwordInput).value = value;
        (isEmail ? emailInput : passwordInput).focus();
      }
      setTimeout(() => { button.textContent = 'Copy'; }, 1800);
    });
  });

  accountButton.addEventListener('click', () => {
    const opening = accountMenu.hidden;
    accountMenu.hidden = !opening;
    accountButton.setAttribute('aria-expanded', String(opening));
    if (opening) document.getElementById('sign-out-button').focus();
  });

  document.getElementById('sign-out-button').addEventListener('click', () => {
    closeAccountMenu();
    setSession(false);
    form.reset();
    showError('');
    passwordInput.type = 'password';
    passwordToggle.textContent = 'Show';
    passwordToggle.setAttribute('aria-label', 'Show password');
    passwordToggle.setAttribute('aria-pressed', 'false');
    window.scrollTo(0, 0);
    emailInput.focus();
  });

  document.addEventListener('click', event => {
    if (!accountMenu.hidden && !event.target.closest('.account-wrap')) closeAccountMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !accountMenu.hidden) {
      closeAccountMenu();
      accountButton.focus();
    }
  });
})();
