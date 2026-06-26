/* =====================  GAME LOOP  ===================== */
function startFlight(){
  phase = 'launching';
  resetBackground();
  escapePoint = genEscape();
  launchStart = performance.now();
  lastAim = HUNTER_IDLE_AIM;
  hunterAimTarget = HUNTER_IDLE_AIM;
  flightStart = 0;
  cameraFreezeT = 0;
  curMult = 1.00;
  lastVisualPathProgress = 0;
  ghostFomo = null;
  milestoneIdx = 0;
  hitsThisRound = 0; roundPeakFiredM = 0;
  roundWin = 0; downWin = 0;
  arrows.length = 0; rings.length = 0; sparks.length = 0; trail.length = 0; gunSmoke.length = 0;
  for (const p of panels) if (p.state === 'placed') p.state = 'live';
  shotsRequired = panels.filter(p => p.state === 'live').length;  // 1 bet → 1 hit downs it, 2 bets → 2 hits
  renderUI();
}

function pushHistory(down){
  histArr.unshift({m: escapePoint, down});
  if (histArr.length > 24) histArr.pop();
  $('history').innerHTML = histArr.map(h =>
    `<div class="chip ${h.down ? 'down' : h.m<2?'low':h.m<10?'mid':'high'}">${h.down ? '✓ ' : ''}${h.m.toFixed(2)}x</div>`).join('');
}

function endFlight(){ // nobody (or only one barrel) connected in time: the bird escapes
  phase = 'crashed';
  crashAt = performance.now();
  cameraFreezeT = Math.max(0, (crashAt - flightStart) / 1000);
  curMult = escapePoint;
  shake(4);
  // Clear DOM multiplier and visual particles so no flight UI persists into crash
  $('mult').style.color = '';
  $('mult').textContent = '';
  $('mult').className = 'mult';
    trail.length = 0; smoke.length = 0; gunSmoke.length = 0; feathers.length = 0; deathFragments.length = 0;
  for (const p of panels) if (p.state === 'live'){
    toast(`Barrel ${p.n}: the bird escaped — −${fmt(p.stake)} FUN`, true);
    p.state = 'idle'; p.stake = 0;
  }
  pushHistory(false);
  scheduleNextRound();
  renderUI();
}

/* Both barrels connected: the bird comes down and the round ends early.
   Both payouts are already locked, so this changes pacing, not RTP. */
function birdDown(){
  phase = 'downed';
  downAt = performance.now();
  cameraFreezeT = Math.max(0, (downAt - flightStart) / 1000);
  downMult = roundPeakFiredM > 0 ? roundPeakFiredM : curMult;
  downPos = {x: lastTip.x, y: lastTip.y};
  downWin = roundWin;
  // FOMO ghost-continuation: the round would have crashed at escapePoint (the
  // real RNG/server outcome — NOT fabricated). The ghost climbs from the freeze
  // point up to where the bird would have been at that real escape time.
  ghostFomo = {start: downAt, reach: escapePoint, fromMult: downMult};
  flash(true);
  shake(5);
  spawnRings(downPos.x, downPos.y, true);
  spawnSparks(downPos.x, downPos.y, 24);
  spawnFeathers(downPos.x, downPos.y, 18 + Math.floor(Math.random()*8));
  spawnDeathFragments(downPos.x, downPos.y, 18 + Math.floor(Math.random()*8));
  pushHistory(true);
  scheduleNextRound(DOWNED_CRASH_MS);
  renderUI();
}

function scheduleNextRound(delay = CRASH_MS){
  setTimeout(() => {
    phase = 'waiting'; waitStart = performance.now();
    resetBackground();
    for (const p of panels){
      if (p.state === 'queued') p.state = 'placed';
      else if (p.state === 'done') p.state = 'idle';
      if (p.state === 'idle' && p.autoBet){
        const amt = Math.max(10, +p.el.amt.value||0);
        if (amt <= balance){
          balance -= amt; p.stake = amt;
          p.target = Math.max(1.01, +p.el.target.value || 2);
          p.state = 'placed';
        }
      }
    }
    renderUI();
  }, delay);
}

/* PROTECTED RUNTIME TIMING:
   Do not change multiplier growth, escape checks, tie handling, or the order
   and timing of auto-shoot/manual-shoot resolution during visual refactors. */
function tick(now){
  const dtMs = Math.min(60, now - lastTickNow);
  lastTickNow = now;
  if (phase === 'flying' && now < hitStopEnd) flightStart += dtMs;  // hit-stop: world freezes for a beat
  if (phase === 'intro'){
    // Bird swoops in from the left; when it settles, the round begins seamlessly.
    if (now - introStart >= BIRD_INTRO_MS){
      phase = 'waiting'; waitStart = now;
      resetBackground();
      for (const p of panels) if (p.state === 'queued') p.state = 'placed';
      renderUI();
    } else {
      $('status').textContent = '';
    }
  } else if (phase === 'waiting'){
    const left = Math.max(0, WAIT_MS - (now - waitStart));
    $('mult').textContent = '';
    $('status').textContent = `NEXT FLIGHT IN ${(left/1000).toFixed(1)}s — LOAD YOUR BARRELS`;
    $('countbar').style.width = (100 * (1 - left/WAIT_MS)) + '%';
    if (left <= 0){ $('countbar').style.width = '0%'; startFlight(); }
  } else if (phase === 'launching'){
    $('mult').textContent = '';
    $('mult').className = 'mult';
    $('status').textContent = '';
    if (now - launchStart >= LAUNCH_MS){
      phase = 'flying';
      // Attach the flight curve to the bird: snapshot where it actually is at
      // lift-off, so the curve and time-driven flight both spring from there.
      // Presentation only — does not touch escape/RNG/RTP.
      flightOrigin = {x: lastTip.x, y: lastTip.y};
      flightStart = now;
      flightVisualStart = now;
      lastTickNow = now;
      renderUI();
    }
  } else if (phase === 'flying'){
    const t = (now - flightStart) / 1000;
    const rawM = Math.exp(GROWTH * t);
    curMult = Math.min(rawM, escapePoint);
    // resolve pending auto-shots BEFORE the escape check, so a target exactly
    // equal to the escape point still wins — the rule is P(hit) = P(escape ≥ m)
    for (const p of panels)
      if (p.state === 'live' && p.autoShoot && curMult >= p.target) fire(p, p.target);
    if (phase === 'flying' && rawM >= escapePoint){ endFlight(); }
    else if (phase === 'flying'){
      const mel = $('mult');
      mel.textContent = curMult.toFixed(2) + 'x';
      mel.className = 'mult flying';
      mel.style.color = curMult < 2 ? '#ffffff'
                      : curMult < 5 ? '#f2b705'
                      : curMult < 10 ? '#ff8c2e' : '#ff5252';
      if (milestoneIdx < MILESTONES.length && curMult >= MILESTONES[milestoneIdx]){
        milestoneIdx++;
        mel.classList.remove('pop'); void mel.offsetWidth; mel.classList.add('pop');
      }
      $('status').textContent = '';
      for (const p of panels){
        if (p.state === 'live' && p.el.sub)
          p.el.sub.textContent = `${fmt(safeMul(p.stake, curMult))} FUN · ${p.autoShoot ? 'auto at ' + p.target.toFixed(2) + 'x' : 'manual'}`;
      }
    }
  } else if (phase === 'downed'){
    $('mult').textContent = '';
    $('mult').className = 'mult';
    $('mult').style.color = '';
    $('status').textContent = '';
  } else {
    $('mult').textContent = '';
    $('mult').className = 'mult';
    $('status').textContent = '';
  }
  const sEl = $('stage');
  if (now < shakeEnd){
    const k = (shakeEnd - now)/320 * shakeMag;
    sEl.style.transform = `translate(${(Math.random()*2-1)*k}px, ${(Math.random()*2-1)*k}px)`;
  } else if (sEl.style.transform){
    sEl.style.transform = '';
  }
  draw(now);
  requestAnimationFrame(tick);
}
