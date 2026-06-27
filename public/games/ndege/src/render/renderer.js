/* ---- main draw ---- */
function downedGhostCamera(gm, now){
  if (!gm || phase !== 'downed') return {x: 0, y: 0};
  const age = (now - ghostFomo.start) / 1000;
  const pan = smoothstep(0.08, GHOST_CLIMB_S, age);
  const targetX = W * 0.58;
  const targetY = H * 0.28;
  return {
    x: (targetX - gm.tip.x) * pan,
    y: Math.max(0, (targetY - gm.tip.y) * pan)
  };
}

function draw(now){
  const dt = Math.min(0.05, (now - lastNow)/1000);
  lastNow = now;

  const flightTransitionProgress = phase === 'flying'
    ? Math.min(1, Math.max(0, (now - flightVisualStart) / FLIGHT_BLEND_MS))
    : 1;
  const flightTransitionEase = flightTransitionProgress * flightTransitionProgress
    * (3 - 2 * flightTransitionProgress);
  // Curve and bird stay in screen space; the parallax backdrop scrolls itself.
  const sceneZoom = 1;
  const sceneToScreen = (x, y) => ({
    x: W / 2 + (x - W / 2) * sceneZoom,
    y: H / 2 + (y - H / 2) * sceneZoom
  });

  ctx.clearRect(0, 0, W, H);
  updateBackground(dt, phase);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(sceneZoom, sceneZoom);
  ctx.translate(-W / 2, -H / 2);

  if (phase === 'intro'){
    drawSceneBackground(ctx, now);
    // Bird descends from just above the hunter's head down onto its hover spot.
    // easeInOutCubic gives a gentle accelerate-then-settle drop (no snappy dash),
    // and it lands exactly on the resting pose so the handoff to 'waiting' is
    // seamless. Scale stays at 1 the whole way, matching the hover size.
    const ip = Math.min(1, (now - introStart) / BIRD_INTRO_MS);
    const ie = easeInOutCubic(ip);
    const bx = BIRD_INTRO_START_X + (BIRD_REST_X - BIRD_INTRO_START_X) * ie;
    const by = BIRD_INTRO_START_Y + (BIRD_REST_Y - BIRD_INTRO_START_Y) * ie
      + Math.sin(now / 900) * 1.5 * ie;
    lastTip = {x: bx, y: by};
    drawHunterAndGun(ctx, HUNTER_IDLE_AIM, 0);
    drawBird(ctx, bx, by, 0.16 * (1 - ie), 0, 1, 1, 'flight', now, BIRD_FLIGHT_FRAME_MS);
    drawVisualEffects(ctx, dt);
    ctx.restore();
    return;
  }

  if (phase === 'waiting'){
    drawSceneBackground(ctx, now);
    drawHunterAndGun(
      ctx,
      HUNTER_IDLE_AIM,
      panels.filter(p => p.state === 'placed').length
    );
    drawRestingBird(ctx, now);
    drawVisualEffects(ctx, dt);
    ctx.restore();
    return;
  }

  if (phase === 'launching'){
    drawSceneBackground(ctx, now);
    const pose = getTakeoffBirdPose(now);
    lastTip = {x: pose.x, y: pose.y};

    if (Math.random() < 0.55){
      trail.push({
        x: pose.x - 18,
        y: pose.y + 2,
        vx: -9 - Math.random() * 7,
        vy: 3 + Math.random() * 5,
        life: 0.22 + Math.random() * 0.18,
        size: 0.8 + Math.random()
      });
    }
    const idleBlend = 1 - Math.exp(-4 * Math.min(dt, 0.05));
    lastAim += (HUNTER_IDLE_AIM - lastAim) * idleBlend;
    drawHunterAndGun(
      ctx,
      lastAim,
      panels.filter(p => p.state === 'live').length
    );
    drawBird(
      ctx,
      pose.x,
      pose.y,
      pose.angle,
      pose.flap,
      pose.scale,
      1
    );
    drawVisualEffects(ctx, dt);
    ctx.restore();
    return;
  }

  // ---- fixed-Bézier flight visual (presentation only) ----
  // mode: 'flying' -> run, 'downed'/'crashed' -> stopped. The curve is a fixed
  // cubic Bézier scaled between the fixed origin at the cliff lip (O) and the
  // bird (B). B is driven purely by elapsed TIME since round start; on a stop it
  // freezes at the last position and only the bird sprite leaves the screen.
  const field = getFlightField();
  // Two independent anchors:
  //  - O: the curve's bottom foot, fixed at the cliff's lower edge (CURVE.foot).
  //  - startFrac: the BIRD's lift-off point, captured from the bird when flying
  //    began (round.js); falls back to CURVE.origin before the first flight.
  // The curve is drawn from O up to the bird, so it roots at the cliff while the
  // bird keeps its own start position.
  const O = fieldToPx(field, CURVE.foot);
  const startFrac = flightOrigin ? pxToField(field, flightOrigin) : CURVE.origin;
  const flightElapsed = phase === 'flying'
    ? Math.max(0, (now - flightStart) / 1000)
    : cameraFreezeT;
  const visualIntensity = phase === 'flying'
    ? flightVisualIntensity(visualProgressAt(flightElapsed)) * flightTransitionEase
    : 0;
  const pose = birdFlightPose(field, flightElapsed, startFrac);
  const pathTip = {x: pose.x, y: pose.y};

  // On a downed round the FOMO graph is ONE Bézier (origin -> B_ghost), split by
  // De Casteljau: red part below the split, blue continuation above. Built once
  // here; red drawn now (under the bird), blue on top after drawCurrentBird.
  let ghost = null;
  if (phase === 'downed' && ghostFomo){
    ghost = ghostGeometry(now, field, O, pathTip);
  }
  const ghostCamera = downedGhostCamera(ghost, now);
  if (phase === 'downed' && (ghostCamera.x || ghostCamera.y)){
    drawSky(ctx, W, H);
  }

  if (phase === 'downed'){
    ctx.save();
    ctx.translate(ghostCamera.x, ghostCamera.y);
    drawSceneBackground(ctx, now);
    if (ghost){
      drawGhostRed(ctx, ghost);          // red part of the single split curve
    } else {
      drawCurve(ctx, O, pathTip, '#ff5a2f');
    }
    drawCurrentBird(ctx, now, {
      angle: pose.angle,
      visualIntensity,
      pathHitPoint: downPos,
      pathTip,
      sceneZoom
    });
    if (ghost){
      drawGhostBlue(ctx, now, ghost);
    }
    drawVisualEffects(ctx, dt);
    ctx.restore();
    drawHunterAndGun(ctx, HUNTER_IDLE_AIM, 0);
    ctx.restore();
    return;
  }

  drawSceneBackground(ctx, now);

  if (phase === 'flying'){
    lastTip = {x: pathTip.x, y: pathTip.y};
    lastVisualPathProgress = visualProgressAt(flightElapsed);
    drawCurve(ctx, O, pathTip, '#ffb347');
  } else {
    if (ghost){
      drawGhostRed(ctx, ghost);          // red part of the single split curve
    } else {
      // KURVAN FRYSER på sista läget — den flyttar sig inte.
      drawCurve(ctx, O, pathTip, '#ff5a2f');
    }
  }

  // hunter aims at the bird
  const displayedTip = sceneToScreen(lastTip.x, lastTip.y);
  const rawTargetAim = Math.atan2(displayedTip.y - GUN_PIVOT_Y, displayedTip.x - GUN_PIVOT_X);
  const tracking = phase === 'flying' && curMult >= HUNTER_TRACK_MULT;
  const desiredAim = tracking
    ? Math.max(HUNTER_AIM_MIN, Math.min(HUNTER_AIM_MAX, rawTargetAim))
    : HUNTER_IDLE_AIM;
  if (
    !tracking
    || Math.abs(desiredAim - hunterAimTarget) >= HUNTER_AIM_DEADZONE
  ){
    hunterAimTarget = desiredAim;
  }
  const aimBlend = 1 - Math.exp(
    -(tracking ? HUNTER_AIM_FOLLOW_SPEED : 3.2) * Math.min(dt, 0.05)
  );
  lastAim += (hunterAimTarget - lastAim) * aimBlend;
  const aim = lastAim;

  drawHunterAndGun(
    ctx,
    aim,
    phase === 'flying' ? panels.filter(p => p.state === 'live').length : 0
  );
  drawCurrentBird(ctx, now, {
    angle: pose.angle,
    visualIntensity,
    pathHitPoint: downPos,
    pathTip,
    sceneZoom
  });
  // Blue continuation of the same split curve, on top of the bird/explosion.
  if (ghost){
    drawGhostBlue(ctx, now, ghost);
  }
  drawVisualEffects(ctx, dt);
  ctx.restore();
}
