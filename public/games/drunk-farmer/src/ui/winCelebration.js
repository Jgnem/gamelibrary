// Drunk Farmer — win celebration screens (UI layer only, no math/engine).
//
// Tier-based win presentation shown AFTER a spin's cascade, chicken shots and
// balance update have fully settled — never mid-tumble, so the overlay can't
// steal focus from the cause/effect animations. Big wins get a fullscreen dim
// with a label and a 0→win count-up; small wins (>=1x but below the NICE WIN
// tier) get a quick non-blocking toast instead. Fullscreen celebrations count
// up, hold briefly on the final amount, then dismiss automatically.
//
// Values are bet-money numbers displayed as x multipliers, same as the HUD.

const STYLE_ID = 'drunk-farmer-win-celebration-style';

/** Win tiers in bet multiples, highest first (win/bet >= min). */
export const WIN_TIERS = [
  { id: 'super', label: 'SUPER WIN', min: 100 },
  { id: 'mega', label: 'MEGA WIN', min: 50 },
  { id: 'big', label: 'BIG WIN', min: 20 },
  { id: 'nice', label: 'NICE WIN', min: 5 },
  { id: 'win', label: 'WIN', min: 1 },
];

/** Count-up duration per tier — bigger wins deserve a longer ramp. */
const COUNT_MS = { win: 900, nice: 1100, big: 1500, mega: 1900, super: 2300 };
const HOLD_MS = 900; // amount fully counted → start fade
const FADE_MS = 250; // must match the CSS opacity transition

function fmt(n) {
  return `${Number(n || 0).toFixed(2)}x`;
}

/**
 * The tier a win reaches for a given bet, or null when below every tier
 * (win < 1x bet — no celebration).
 */
export function winTier(win, bet) {
  const multiple = bet > 0 ? win / bet : 0;
  return WIN_TIERS.find((t) => multiple >= t.min) || null;
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .win-celebration {
      position: fixed;
      inset: 0;
      z-index: 40;
      display: grid;
      place-items: center;
      background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.8) 100%);
      pointer-events: none;
      user-select: none;
      opacity: 0;
      transition: opacity ${FADE_MS}ms ease;
      font-family: system-ui, sans-serif;
    }
    .win-celebration.is-visible {
      opacity: 1;
    }
    .win-celebration__inner {
      display: grid;
      justify-items: center;
      gap: 2px;
      text-align: center;
      /* Soft plate behind the text: keeps the label/amount readable no matter
         what the board behind looks like (helps desktop, essential mobile). */
      padding: 20px 34px 24px;
      border-radius: 18px;
      background: rgba(8, 10, 5, 0.55);
      box-shadow: 0 0 60px 30px rgba(8, 10, 5, 0.55);
      animation: winCelebrationPop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) both;
    }
    @keyframes winCelebrationPop {
      0% { opacity: 0; transform: scale(0.55); }
      100% { opacity: 1; transform: scale(1); }
    }
    .win-celebration__sub {
      font-size: clamp(13px, 1.6vw, 20px);
      font-weight: 800;
      letter-spacing: 0.22em;
      color: rgba(246, 242, 223, 0.85);
    }
    .win-celebration__label {
      font-weight: 900;
      font-size: clamp(36px, 7vw, 92px);
      letter-spacing: 0.06em;
      white-space: nowrap;
      color: #ffd75e;
      text-shadow: 0 5px 0 #7a2b00, 0 0 30px rgba(255, 140, 0, 0.85);
    }
    .win-celebration__amount {
      font-weight: 900;
      font-size: clamp(30px, 5.4vw, 68px);
      color: #fff3c4;
      text-shadow: 0 3px 0 #5a3a00, 0 0 22px rgba(255, 211, 90, 0.75);
      font-variant-numeric: tabular-nums;
    }
    /* Higher tiers escalate: bigger label, hotter glow, a slow pulse on top. */
    .win-celebration--big .win-celebration__label {
      font-size: clamp(42px, 8vw, 106px);
      text-shadow: 0 5px 0 #7a2b00, 0 0 38px rgba(255, 150, 30, 0.95);
    }
    .win-celebration--mega .win-celebration__label,
    .win-celebration--super .win-celebration__label {
      font-size: clamp(46px, 9vw, 120px);
      text-shadow: 0 6px 0 #7a1d00, 0 0 30px rgba(255, 120, 20, 1), 0 0 70px rgba(255, 90, 0, 0.7);
      animation: winCelebrationPulse 1.1s ease-in-out infinite alternate;
    }
    @keyframes winCelebrationPulse {
      from { transform: scale(1); }
      to { transform: scale(1.05); }
    }
    /* Small-win toast: quick pill over the board, no dim, never blocks input. */
    .win-toast {
      position: fixed;
      left: 50%;
      top: 32%;
      transform: translate(-50%, -50%);
      z-index: 40;
      pointer-events: none;
      padding: 10px 22px;
      border-radius: 999px;
      background: rgba(22, 32, 12, 0.92);
      border: 2px solid #ffd75e;
      color: #ffe9a8;
      font-family: system-ui, sans-serif;
      font-weight: 900;
      font-size: clamp(16px, 2.2vw, 26px);
      letter-spacing: 0.06em;
      white-space: nowrap;
      text-shadow: 0 0 12px rgba(255, 211, 90, 0.6);
      animation: winToast 1.1s ease forwards;
    }
    @keyframes winToast {
      0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
      18% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
      30% { transform: translate(-50%, -50%) scale(1); }
      78% { opacity: 1; }
      100% { opacity: 0; transform: translate(-50%, -62%) scale(1); }
    }
    /* Mobile: 32% of the viewport lands exactly on the Buzz bar — hang the
       toast on the board's top frame edge instead. */
    .win-toast--mobile {
      top: calc(50vh - var(--tdf-stage-h, 100vh) * 0.19);
    }
    /* Mobile: the desktop radial dim is LIGHTEST in the center, but the
       near-full-width mobile board fills the center — flat dim instead so the
       text never sits on bright symbols. */
    .win-celebration--mobile {
      background: rgba(0, 0, 0, 0.72);
    }
  `;
  document.head.appendChild(style);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/** Quick pill toast for small wins. Resolves early — the fade finishes on its
 *  own so the spin flow only pauses long enough for the amount to register. */
/** True when the mobile stage layout is active (set once per page load). */
function isMobileLayout() {
  return Boolean(document.querySelector('#stage.tdf-mobile'));
}

function showToast(win) {
  const el = document.createElement('div');
  el.className = `win-toast${isMobileLayout() ? ' win-toast--mobile' : ''}`;
  el.textContent = `WIN ${fmt(win)}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1150);
  return new Promise((resolve) => setTimeout(resolve, 450));
}

function showOverlay({ win, tier, label, isFreeSpinTotal }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = `win-celebration win-celebration--${tier.id}${isMobileLayout() ? ' win-celebration--mobile' : ''}`;
    overlay.innerHTML = `
      <div class="win-celebration__inner">
        ${isFreeSpinTotal ? '<span class="win-celebration__sub">TOTAL WIN</span>' : ''}
        <span class="win-celebration__label"></span>
        <span class="win-celebration__amount">${fmt(0)}</span>
      </div>
    `;
    overlay.querySelector('.win-celebration__label').textContent = label || tier.label;
    const amountEl = overlay.querySelector('.win-celebration__amount');
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-visible'));

    const countMs = COUNT_MS[tier.id] || 1200;
    const start = performance.now();
    let raf = 0;
    let holdTimer = 0;
    let counted = false;
    let closing = false;

    function finishCount(holdMs) {
      counted = true;
      cancelAnimationFrame(raf);
      amountEl.textContent = fmt(win);
      holdTimer = setTimeout(fadeOut, holdMs);
    }

    function fadeOut() {
      if (closing) return;
      closing = true;
      clearTimeout(holdTimer);
      overlay.classList.remove('is-visible');
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, FADE_MS);
    }

    function tick(now) {
      const t = Math.min(1, (now - start) / countMs);
      amountEl.textContent = fmt(win * easeOutCubic(t));
      if (t >= 1) {
        finishCount(HOLD_MS);
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

  });
}

/**
 * Play the win celebration for a settled win. Resolves when the presentation
 * is done (overlay removed / toast registered). No-op below 1x bet.
 *
 * @param {{
 *   win: number,               // win in bet-money terms
 *   bet: number,               // current bet (tier = win / bet)
 *   label?: string,            // override the tier label ("FREE SPINS WIN")
 *   tier?: object,             // override the resolved tier (from WIN_TIERS)
 *   isFreeSpinTotal?: boolean, // feature summary: TOTAL WIN sub-label + always a full overlay
 * }} opts
 * @returns {Promise<void>}
 */
export function playWinCelebration({ win = 0, bet = 1, label, tier, isFreeSpinTotal = false } = {}) {
  const resolvedTier = tier || winTier(win, bet);
  if (!resolvedTier || win <= 0) return Promise.resolve();
  injectStyles();
  if (resolvedTier.id === 'win' && !isFreeSpinTotal) return showToast(win);
  return showOverlay({ win, tier: resolvedTier, label, isFreeSpinTotal });
}
