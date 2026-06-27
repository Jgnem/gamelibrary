/* =====================  PROTECTED BETTING / SHOT FLOW  ====================
   DO NOT CHANGE betting states, balance debits/refunds, auto-bet behavior,
   auto-shoot/manual-shoot timing, target locking, or payout settlement.
   ======================================================================== */
const panels = [makePanel(1), makePanel(2)];

function makePanel(n){
  const p = {n, state:'idle', stake:0, target:2.00, autoShoot:false, autoBet:false, el:{}};
  const div = document.createElement('div');
  div.className = 'panel';
  div.innerHTML = `
    <h3>Barrel ${n}<span id="p${n}info"></span></h3>
    <div class="row">
      <div class="amt">
        <button data-d="-1">−</button>
        <input id="p${n}amt" type="number" value="100" min="10">
        <button data-d="1">+</button>
      </div>
    </div>
    <div class="quick">
      <button data-q="50">50</button><button data-q="100">100</button>
      <button data-q="500">500</button><button data-q="1000">1,000</button>
    </div>
    <div class="aim">
      <label><input id="p${n}autoShoot" type="checkbox"> Auto shoot at</label>
      <div class="target"><input id="p${n}target" type="number" value="2.00" step="0.1" min="1.01" disabled><span>x</span></div>
      <span class="odds" id="p${n}odds"></span>
      <label class="right"><input id="p${n}autoBet" type="checkbox"> Auto bet</label>
    </div>
    <button class="action bet" id="p${n}btn">Place bet</button>`;
  $('panels').appendChild(div);

  p.el.amt = $(`p${n}amt`); p.el.btn = $(`p${n}btn`);
  p.el.info = $(`p${n}info`); p.el.odds = $(`p${n}odds`);
  p.el.target = $(`p${n}target`);

  div.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
    p.el.amt.value = Math.max(10, (+p.el.amt.value||0) + (+b.dataset.d)*10);
    renderUI();
  });
  div.querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
    p.el.amt.value = b.dataset.q;
    renderUI();
  });
  p.el.amt.oninput = () => renderUI();
  p.el.target.onchange = () => {
    p.target = Math.max(1.01, +p.el.target.value || 2);
    p.el.target.value = p.target.toFixed(2);
    updateOdds(p);
  };
  $(`p${n}autoBet`).onchange = e => p.autoBet = e.target.checked;
  $(`p${n}autoShoot`).onchange = e => {
    p.autoShoot = e.target.checked;
    p.el.target.disabled = !p.autoShoot;
    updateOdds(p);
    // toggled ON mid-flight when the target is already passed: fire now at the
    // clock-true current multiplier (never retroactively at the lower target)
    if (p.autoShoot && p.state === 'live' && phase === 'flying'){
      const mNow = Math.floor(multAt(performance.now()) * 100) / 100;
      if (mNow >= p.target){
        if (mNow > escapePoint){ endFlight(); return; }
        fire(p, Math.max(1, mNow));
      }
    }
    renderUI();
  };
  p.el.btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (!p.el.btn.disabled) clickPanel(p);
  });
  updateOdds(p);
  return p;
}

function updateOdds(p){
  p.el.odds.textContent = p.autoShoot
    ? `hit chance ${(94/p.target).toFixed(1)}%`
    : 'manual — shoot anytime';
}

function clickPanel(p){
  if (phase === 'launching' && p.state === 'live') return;
  if (p.state === 'idle'){
    const amt = Math.max(10, +p.el.amt.value || 0);
    if (amt > balance){ toast('Not enough balance', true); return; }
    balance -= amt; p.stake = amt;
    p.target = Math.max(1.01, +p.el.target.value || 2);
    p.state = (phase === 'waiting') ? 'placed' : 'queued';
  } else if (p.state === 'placed' || p.state === 'queued'){
    balance += p.stake; p.stake = 0; p.state = 'idle';        // cancel
  } else if (p.state === 'live'){
    // zero-lag manual shot: compute the multiplier from the clock at the exact
    // moment of the press — render lag can no longer cost the player growth
    const mNow = Math.floor(multAt(performance.now()) * 100) / 100;
    if (mNow > escapePoint){ endFlight(); return; }            // bird had already escaped
    fire(p, Math.max(1, mNow));
  }
  renderUI();
}

/* PROTECTED FIRE / PAYOUT LOGIC:
   A shot locks its multiplier the instant it is triggered. Do not change
   stake, win, balance, panel state, or timing behavior. Only the visual
   smoke/flash/projectile calls after muzzle calculation may be adjusted. */
