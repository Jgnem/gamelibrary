function renderUI(){
  $('balance').textContent = fmt(balance);
  for (const p of panels){
    const b = p.el.btn;
    b.disabled = false;
    if (p.state === 'idle'){
      b.className = 'action bet';
      const amount = fmtBetButtonAmount(p.el.amt.value);
      b.innerHTML = (phase === 'flying' || phase === 'launching')
        ? `Bet ${amount} FUN <span class="sub">next flight</span>` : `Bet ${amount} FUN`;
      p.el.info.textContent = '';
    } else if (p.state === 'placed'){
      b.className = 'action cancel cancel-placed';
      b.innerHTML = `Cancel <span class="sub">${fmtBetButtonAmount(p.stake)} FUN</span>`;
      p.el.info.textContent = `${fmt(p.stake)} FUN · ${p.autoShoot ? 'aim ' + p.target.toFixed(2) + 'x' : 'manual'}`;
    } else if (p.state === 'queued'){
      b.className = 'action cancel cancel-queued';
      b.innerHTML = 'Cancel <span class="sub">queued for next flight</span>';
      p.el.info.textContent = `${fmt(p.stake)} FUN queued`;
    } else if (p.state === 'live'){
      b.className = 'action shoot';
      b.disabled = phase === 'launching';
      b.innerHTML = phase === 'launching'
        ? 'Bird taking off <span class="sub">get ready</span>'
        : `Shoot now <span class="sub" id="p${p.n}sub"></span>`;
      if (phase === 'launching'){
        p.el.sub = null;
        p.el.info.textContent = `${fmt(p.stake)} FUN ready`;
        continue;
      }
      p.el.sub = $(`p${p.n}sub`);
      p.el.sub.textContent = `${fmt(safeMul(p.stake, curMult))} FUN · ${p.autoShoot ? 'auto at ' + p.target.toFixed(2) + 'x' : 'manual'}`;
      p.el.info.textContent = `${fmt(p.stake)} FUN in flight`;
    } else if (p.state === 'done'){
      b.className = 'action done'; b.disabled = true;
      b.textContent = p.result;
      p.el.info.textContent = '';
    }
  }
}

function fmtBetButtonAmount(value){
  const amount = Math.max(10, +value || 0);
  return amount.toLocaleString('en-US', {maximumFractionDigits: 0});
}

/* =====================  BIG WIN BANNER  ===================== */
let bigTimer;
function bigwin(msg){
  const b = $('bigwin');
  b.textContent = msg;
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  clearTimeout(bigTimer);
  bigTimer = setTimeout(() => b.classList.remove('show'), 1800);
}

/* =====================  TOAST  ===================== */
let toastTimer;
function toast(msg, bad){
  const t = $('toast');
  t.textContent = msg;
  t.style.borderColor = bad ? 'var(--lose)' : 'var(--win)';
  t.style.color = bad ? 'var(--lose)' : 'var(--win)';
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}
