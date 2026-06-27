function getRestingBirdPose(now){
  const idleBob = Math.sin(now / 900) * 1.5;
  const headTilt = Math.sin(now / 1200) * 0.05;

  return {
    x: BIRD_REST_X,
    y: BIRD_REST_Y + idleBob,
    angle: headTilt,
    flap: 0.12 + Math.sin(now / 240) * 0.04,
    scale: 1
  };
}

function easeOutCubic(t){
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t){
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getTakeoffBirdPose(now){
  const elapsed = now - launchStart;
  const p = Math.max(0, Math.min(1, elapsed / BIRD_TAKEOFF_MS));
  const e = easeOutCubic(p);
  // Hand off exactly to where the time-driven flight starts (birdPos at t=0),
  // so launching -> flying has no positional pop.
  const end = fieldToPx(getFlightField(), birdPos(0));

  return {
    x: BIRD_REST_X + (end.x - BIRD_REST_X) * e,
    y: BIRD_REST_Y + (end.y - BIRD_REST_Y) * e
      - Math.sin(p * Math.PI) * 22,
    angle: BIRD_FLIGHT_ANGLE * e,
    flap: Math.sin(now / 70),
    scale: 1
  };
}

function drawRestingBird(c, now){
  const pose = getRestingBirdPose(now);

  // The new bird is a flyer, so it hovers in place (flapping) on the ledge
  // instead of perching — this keeps the wing motion continuous from the
  // fly-in straight through into the round.
  drawBird(
    c,
    pose.x,
    pose.y,
    pose.angle,
    pose.flap,
    pose.scale,
    1,
    'flight',
    now,
    BIRD_FLIGHT_FRAME_MS
  );
}

const birdSprite = new Image();
const birdIdleSprite = new Image();
const birdRigBodySprite = new Image();
const birdRigWingsSprite = new Image();
const birdFlightSprite = new Image();
// ?v bumped when the frames change, so browsers don't serve a stale cache.
birdFlightSprite.src = BIRD_FLIGHT_PATH + '?v=3';

// Pre-baked flap sheet at on-screen size. The high-resolution source cells are
// much bigger than the bird is drawn, so downscaling every frame can make detail
// crawl. We progressively shrink every cell once, then blit it ~1:1.
let birdFlightBaked = null;

function makeBakeCanvas(w, h){
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return { cv, ctx };
}

function bakeFlightSheet(){
  if (!birdFlightSprite.naturalWidth) return;
  const cols = BIRD_FLIGHT_COLS;
  const rows = BIRD_FLIGHT_ROWS;
  const sourceCellW = birdFlightSprite.naturalWidth / cols;
  const sourceCellH = birdFlightSprite.naturalHeight / rows;
  const k = BIRD_FLIGHT_BASE_W / sourceCellW;
  const cellW = Math.round(BIRD_FLIGHT_BASE_W);
  const cellH = Math.round(sourceCellH * k);
  const sheet = makeBakeCanvas(cellW * cols, cellH * rows);

  for (let f = 0; f < BIRD_FLIGHT_FRAME_COUNT; f++){
    const sx = (f % cols) * sourceCellW;
    const sy = Math.floor(f / cols) * sourceCellH;
    // Pull each frame into its own canvas first so neighbouring frames never
    // bleed across the cell border while we downscale.
    let cur = makeBakeCanvas(sourceCellW, sourceCellH);
    cur.ctx.drawImage(
      birdFlightSprite,
      sx, sy, sourceCellW, sourceCellH,
      0, 0, sourceCellW, sourceCellH
    );
    let cw = sourceCellW;
    let ch = sourceCellH;
    // Halve repeatedly until within 2x of target — avoids 4x-in-one-step aliasing.
    while (cw > cellW * 2){
      const nw = Math.max(cellW, Math.round(cw / 2));
      const nh = Math.max(cellH, Math.round(ch / 2));
      const next = makeBakeCanvas(nw, nh);
      next.ctx.drawImage(cur.cv, 0, 0, cw, ch, 0, 0, nw, nh);
      cur = next;
      cw = nw;
      ch = nh;
    }
    sheet.ctx.drawImage(
      cur.cv, 0, 0, cw, ch,
      (f % cols) * cellW, Math.floor(f / cols) * cellH, cellW, cellH
    );
  }
  defringeBakedSheet(sheet);
  birdFlightBaked = { canvas: sheet.cv, cellW, cellH };
}

// Clean the baked sheet's edges. The source has no white, but the repeated
// downscale widens the soft anti-aliased rim; over the bright savanna those
// faint, semi-transparent pixels let the background show through and read as a
// pale halo ("vit kant"). A gentle smoothstep on the alpha channel trims that
// faint outer ring (halo gone) while keeping a soft edge so the bird still
// blends rather than turning jaggy. Only partial-alpha pixels are touched, so
// the bird's colours and solid interior are unchanged.
function defringeBakedSheet(sheet){
  // getImageData throws on a tainted canvas (e.g. opened via file://); if so we
  // keep the un-cleaned bake rather than dropping the bird to the fallback.
  let image;
  try {
    image = sheet.ctx.getImageData(0, 0, sheet.cv.width, sheet.cv.height);
  } catch (e){
    return;
  }
  const data = image.data;
  const LO = 0.33, HI = 0.85;       // alpha (0..1) window the soft rim is mapped through
  for (let i = 3; i < data.length; i += 4){
    const a = data[i] / 255;
    if (a > 0 && a < 1){
      data[i] = Math.round(255 * smoothstep(LO, HI, a));
    }
  }
  sheet.ctx.putImageData(image, 0, 0);
}

birdFlightSprite.addEventListener('load', bakeFlightSheet);
if (birdFlightSprite.complete) bakeFlightSheet();

/* The 36-frame flap cycle, centered on the current (0,0).
   frameMs sets the speed; motion is baked into the frames. */
function drawFlightBirdFrames(c, now, frameMs){
  const frame = Math.floor(now / frameMs) % BIRD_FLIGHT_FRAME_COUNT;

  // Preferred path: blit the pre-downscaled frame ~1:1 (no per-frame shrink).
  if (birdFlightBaked){
    const { canvas, cellW, cellH } = birdFlightBaked;
    c.drawImage(
      canvas,
      (frame % BIRD_FLIGHT_COLS) * cellW,
      Math.floor(frame / BIRD_FLIGHT_COLS) * cellH,
      cellW, cellH,
      -cellW / 2, -cellH / 2, cellW, cellH
    );
    return;
  }

  if (!birdFlightSprite.complete || !birdFlightSprite.naturalWidth){
    drawProceduralBird(c, 0, 0, 0, Math.sin(now / frameMs), 1, 1);
    return;
  }
  // Fallback (sheet loaded but not baked yet): smoothed direct draw.
  const sourceCellW = birdFlightSprite.naturalWidth / BIRD_FLIGHT_COLS;
  const sourceCellH = birdFlightSprite.naturalHeight / BIRD_FLIGHT_ROWS;
  const k = BIRD_FLIGHT_BASE_W / sourceCellW;
  const drawH = sourceCellH * k;
  c.drawImage(
    birdFlightSprite,
    (frame % BIRD_FLIGHT_COLS) * sourceCellW,
    Math.floor(frame / BIRD_FLIGHT_COLS) * sourceCellH,
    sourceCellW, sourceCellH,
    -BIRD_FLIGHT_BASE_W / 2, -drawH / 2, BIRD_FLIGHT_BASE_W, drawH
  );
}

/* ---- the guinea fowl (spotted body, blue face, red wattle) ---- */
function wingPath(c){
  c.beginPath();
  c.moveTo(2, 0);
  c.quadraticCurveTo(-3, -14, -24, -23);
  c.lineTo(-18, -15);
  c.lineTo(-24, -13);
  c.lineTo(-16, -8);
  c.lineTo(-21, -6);
  c.quadraticCurveTo(-9, -1, 4, 3);
  c.closePath();
}

function drawProceduralBird(c, x, y, angle, flap, s, alpha){
  c.save();
  c.globalAlpha = alpha;
  c.translate(x, y); c.rotate(angle); c.scale(s, s);
  const wing = flap * 0.6;
  const bob = Math.sin(flap*2) * 1.8;

  // body gradient with richer savanna contrast
  const bg = c.createRadialGradient(-4, -2, 2, 0, 0, 20);
  bg.addColorStop(0, '#f7e0b1');
  bg.addColorStop(0.16, '#f2b705');
  bg.addColorStop(0.45, '#2e2836');
  bg.addColorStop(1, '#130d18');
  c.fillStyle = bg;
  c.beginPath(); c.ellipse(0, 0, 17, 9, -0.05, 0, Math.PI*2); c.fill();

  // stronger dark belly to separate wing and body
  c.fillStyle = 'rgba(16,11,26,0.46)';
  c.beginPath(); c.ellipse(-2, 2, 14, 6, -0.05, 0, Math.PI*2); c.fill();

  // warmer spots that still read against the dark body
  [[-9,-3],[-3,2],[3,-3],[-11,3],[1,6],[-5,-6],[7,3],[-14,-1]].forEach(([dx,dy]) => {
    c.fillStyle = Math.random() < 0.4 ? '#f2c854' : '#f5e6c8';
    c.beginPath(); c.arc(dx, dy + Math.sin(flap*6)*0.6, 1.15, 0, Math.PI*2); c.fill();
  });

  // tail with dark base and a golden edge highlight
  c.save();
  c.fillStyle = '#1d1623';
  c.beginPath();
  c.moveTo(-14, -1); c.lineTo(-27, -7); c.lineTo(-24, 0);
  c.lineTo(-27, 6); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(242,183,5,0.75)'; c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(-14, -1); c.lineTo(-27, -7); c.lineTo(-24, 0);
  c.lineTo(-27, 6); c.stroke();
  c.restore();

  // far wing with brighter golden bronze fill
  c.save(); c.translate(1, -3 + bob*0.2); c.rotate(-wing*0.9 - 0.12);
  wingPath(c);
  const wg = c.createLinearGradient(-24, -20, 2, 6);
  wg.addColorStop(0, '#d1ab53'); wg.addColorStop(0.55, '#8c6a35'); wg.addColorStop(1, '#3b3444');
  c.fillStyle = wg; c.fill();
  c.strokeStyle = 'rgba(255,220,120,0.65)'; c.lineWidth = 1.6; c.stroke();
  c.restore();

  // neck + head with gloss
  c.save();
  c.translate(15, -6 + bob*0.3);
  const hg = c.createLinearGradient(-2, -4, 6, 6);
  hg.addColorStop(0, '#7fa3f2'); hg.addColorStop(1, '#355fa8');
  c.fillStyle = hg; c.beginPath(); c.ellipse(0, 0, 5.5, 4.5, -0.2, 0, Math.PI*2); c.fill();
  // casque
  c.fillStyle = '#d9a441'; c.beginPath(); c.ellipse(0, -4, 2.6, 2, 0, 0, Math.PI*2); c.fill();
  // wattle
  c.fillStyle = '#c8341f'; c.beginPath(); c.ellipse(2, 3.5, 2, 2.6, 0.3, 0, Math.PI*2); c.fill();
  // beak
  c.fillStyle = '#f5e6c8'; c.beginPath(); c.moveTo(4.5, -1); c.quadraticCurveTo(9, -0.6, 8.5, 2); c.lineTo(4.5, 1); c.closePath(); c.fill();
  // eye with tiny life (pupil scales with flap)
  c.fillStyle = '#140e2b'; c.beginPath(); c.arc(-0.7, -1.2, 1.05 + 0.18*flap, 0, Math.PI*2); c.fill();
  c.restore();

  // near wing with bright trailing edge to separate it from body
  c.save(); c.translate(0, -2 + bob*0.1); c.rotate(-wing - 0.25);
  wingPath(c);
  c.fillStyle = '#1f1827'; c.fill();
  c.strokeStyle = 'rgba(255,222,130,0.96)'; c.lineWidth = 1.8; c.stroke();
  c.restore();

  c.restore();
}

function drawIdleBirdSprite(c, now){
  const cycle = now % 6200;
  const breathing = Math.sin(now / 520) * 0.012;
  const headNod = cycle > 2700 && cycle < 3350
    ? Math.sin((cycle - 2700) / 650 * Math.PI) * 0.075
    : 0;
  const ruffle = cycle > 4300 && cycle < 4720
    ? Math.sin((cycle - 4300) / 420 * Math.PI)
    : 0;
  const blinking = (cycle > 1540 && cycle < 1650)
    || (cycle > 1740 && cycle < 1810);

  c.save();
  c.translate(0, headNod * 12);
  c.rotate(headNod);
  c.scale(1 - breathing * 0.35, 1 + breathing + ruffle * 0.025);
  const idleReady = birdIdleSprite.complete && birdIdleSprite.naturalWidth > 0;
  const sprite = idleReady ? birdIdleSprite : birdSprite;
  const width = idleReady ? BIRD_IDLE_WIDTH : BIRD_SPRITE_WIDTH;
  const height = idleReady ? BIRD_IDLE_HEIGHT : BIRD_SPRITE_HEIGHT;
  const anchorX = idleReady ? BIRD_IDLE_ANCHOR_X : BIRD_SPRITE_ANCHOR_X;
  const anchorY = idleReady ? BIRD_IDLE_ANCHOR_Y : BIRD_SPRITE_ANCHOR_Y;
  c.drawImage(
    sprite,
    -width * anchorX,
    -height * anchorY,
    width,
    height
  );

  if (blinking){
    c.fillStyle = '#080913';
    c.fillRect(8, -48, 3, 1.5);
  }
  c.restore();
}

function getRigWingFrame(now, frameMs){
  return Math.floor(now / frameMs) % BIRD_RIG_WING_FRAME_COUNT;
}

function getRigWingBlend(now, frameMs){
  const framePosition = now / frameMs;
  const frame = Math.floor(framePosition) % BIRD_RIG_WING_FRAME_COUNT;
  const nextFrame = (frame + 1) % BIRD_RIG_WING_FRAME_COUNT;
  const rawBlend = framePosition - Math.floor(framePosition);
  const blend = rawBlend * rawBlend * (3 - 2 * rawBlend);
  return {frame, nextFrame, blend};
}

function drawRigWingFrame(c, frame, farWing, alpha = 1){
  const rootScale = BIRD_RIG_WING_DRAW_SIZE / BIRD_RIG_WING_FRAME_SIZE;
  c.save();
  c.globalAlpha *= alpha;
  c.translate(
    BIRD_RIG_SHOULDER_X + (farWing ? -1 : 0),
    BIRD_RIG_SHOULDER_Y + (farWing ? 1 : 0)
  );
  if (farWing){
    c.globalAlpha *= 0.46;
    c.scale(0.94, 0.94);
  }
  c.drawImage(
    birdRigWingsSprite,
    frame * BIRD_RIG_WING_FRAME_SIZE,
    0,
    BIRD_RIG_WING_FRAME_SIZE,
    BIRD_RIG_WING_FRAME_SIZE,
    -BIRD_RIG_WING_ROOT_X * rootScale,
    -BIRD_RIG_WING_ROOT_Y * rootScale,
    BIRD_RIG_WING_DRAW_SIZE,
    BIRD_RIG_WING_DRAW_SIZE
  );
  c.restore();
}

function drawRiggedFlightBird(c, now, frameMs, smoothLoop = false){
  const assetsReady = birdRigBodySprite.complete
    && birdRigBodySprite.naturalWidth > 0
    && birdRigWingsSprite.complete
    && birdRigWingsSprite.naturalWidth > 0;
  if (!assetsReady){
    drawProceduralBird(c, 0, 0, 0, Math.sin(now / frameMs), 1, 1);
    return;
  }

  const wingState = smoothLoop
    ? getRigWingBlend(now, frameMs)
    : {
        frame: getRigWingFrame(now, frameMs),
        nextFrame: 0,
        blend: 0
      };
  const bodyX = -BIRD_RIG_BODY_WIDTH * BIRD_RIG_BODY_ANCHOR_X;
  const bodyY = -BIRD_RIG_BODY_HEIGHT * BIRD_RIG_BODY_ANCHOR_Y;

  // The references define the final assembly:
  // far wing -> locked body/head/beak/tail/claws -> near wing.
  drawRigWingFrame(c, wingState.frame, true, 1 - wingState.blend);
  if (wingState.blend > 0){
    drawRigWingFrame(c, wingState.nextFrame, true, wingState.blend);
  }
  c.drawImage(
    birdRigBodySprite,
    bodyX,
    bodyY,
    BIRD_RIG_BODY_WIDTH,
    BIRD_RIG_BODY_HEIGHT
  );
  drawRigWingFrame(c, wingState.frame, false, 1 - wingState.blend);
  if (wingState.blend > 0){
    drawRigWingFrame(c, wingState.nextFrame, false, wingState.blend);
  }
}

function drawBird(
  c,
  x,
  y,
  angle,
  flap,
  s,
  alpha,
  mode = 'flight',
  now = performance.now(),
  frameMs = BIRD_FLAP_MS
){
  const isFlightMode = mode === 'flight' || mode === 'flight-loop';
  if (
    !isFlightMode
    && (!birdSprite.complete || birdSprite.naturalWidth === 0)
  ){
    drawProceduralBird(c, x, y, angle, flap, s, alpha);
    return;
  }

  c.save();
  c.globalAlpha = alpha;
  c.translate(x, y);
  c.rotate(angle);
  c.scale(s, s);
  // Smooth the flight sprite: it's a pre-downscaled illustration, so bilinear
  // sampling of the rotation/sub-pixel motion reads clean instead of the crawly
  // nearest-neighbor shimmer. Idle vector path keeps its crisp edges.
  c.imageSmoothingEnabled = isFlightMode;
  c.imageSmoothingQuality = 'high';

  if (isFlightMode){
    drawFlightBirdFrames(c, now, frameMs);
  } else {
    drawIdleBirdSprite(c, now);
  }
  c.restore();
}

function explosionNoise(index){
  const raw = Math.sin(index * 91.731 + 14.17) * 43758.5453;
  return raw - Math.floor(raw);
}

function drawBirdDeathExplosion(c, x, y, age){
  if (age < 0 || age > 0.95) return;

  const p = Math.min(1, age / 0.72);
  const blast = Math.sin(Math.min(1, age / 0.32) * Math.PI);
  const fade = 1 - p;

  c.save();
  c.translate(x, y);
  c.globalCompositeOperation = 'lighter';

  const glow = c.createRadialGradient(0, 0, 1, 0, 0, 64 + p * 34);
  glow.addColorStop(0, `rgba(255,255,225,${0.96 * fade})`);
  glow.addColorStop(0.18, `rgba(255,211,70,${0.92 * fade})`);
  glow.addColorStop(0.48, `rgba(255,91,20,${0.72 * fade})`);
  glow.addColorStop(1, 'rgba(125,20,5,0)');
  c.fillStyle = glow;
  c.beginPath();
  c.arc(0, 0, 70 + blast * 24, 0, Math.PI * 2);
  c.fill();

  for (let i = 0; i < 18; i++){
    const a = explosionNoise(i) * Math.PI * 2;
    const speed = 35 + explosionNoise(i + 31) * 95;
    const distance = speed * age;
    const size = 2 + explosionNoise(i + 67) * 5 * fade;
    c.fillStyle = i % 3 === 0
      ? `rgba(255,244,170,${fade})`
      : i % 3 === 1
        ? `rgba(255,145,32,${fade})`
        : `rgba(240,52,18,${fade})`;
    c.fillRect(
      Math.cos(a) * distance - size / 2,
      Math.sin(a) * distance + age * age * 42 - size / 2,
      size,
      size
    );
  }

  c.globalCompositeOperation = 'source-over';
  if (age > 0.16){
    const smokeP = (age - 0.16) / 0.79;
    for (let i = 0; i < 7; i++){
      const a = -Math.PI * (0.15 + explosionNoise(i + 91) * 0.7);
      const distance = 8 + smokeP * (18 + explosionNoise(i + 111) * 35);
      const radius = 7 + smokeP * (10 + explosionNoise(i + 131) * 9);
      c.fillStyle = `rgba(37,30,43,${(1 - smokeP) * 0.58})`;
      c.beginPath();
      c.arc(
        Math.cos(a) * distance,
        Math.sin(a) * distance - smokeP * 12,
        radius,
        0,
        Math.PI * 2
      );
      c.fill();
    }
  }
  c.restore();
}

function drawCurrentBird(c, now, visual){
  const {
    angle,
    visualIntensity,
    pathHitPoint,
    pathTip,
    sceneZoom = 1
  } = visual;
  // The scene zooms out as the multiplier climbs, which would shrink the bird.
  // Counter-scaling by 1/sceneZoom keeps the bird the same on-screen size the
  // whole round while the camera still pulls back to reveal the curve.
  const zoomComp = 1 / sceneZoom;

  if (phase === 'flying'){
    const cg = c.createRadialGradient(lastTip.x, lastTip.y, 2, lastTip.x, lastTip.y, 50);
    cg.addColorStop(0, 'rgba(255,220,120,.45)');
    cg.addColorStop(1, 'rgba(255,220,120,0)');
    c.fillStyle = cg;
    c.beginPath(); c.arc(lastTip.x, lastTip.y, 50, 0, Math.PI*2); c.fill();

    if (Math.random() < 0.68 + visualIntensity * 0.3)
      trail.push({
        x: lastTip.x - Math.cos(angle)*18,
        y: lastTip.y - Math.sin(angle)*18,
        vx: -28 - visualIntensity * 34 - Math.random()*28,
        vy: 7 + Math.random()*13 + visualIntensity * 8,
        life: 0.18 + Math.random()*0.18,
        size: 0.9 + visualIntensity * 0.8 + Math.random()*1.1
      });
    const flapMs = BIRD_FLIGHT_FRAME_MS * (1 - visualIntensity * 0.36);
    drawBird(
      c,
      lastTip.x,
      lastTip.y,
      angle,
      Math.sin(now / flapMs),
      1.0 * zoomComp,
      1,
      'flight-loop',
      now,
      flapMs
    );
    return;
  }

  if (phase === 'downed'){
    const age = (now - downAt) / 1000;
    const ex = pathHitPoint.x;
    const ey = pathHitPoint.y;
    if (age < 0.11){
      drawBird(
        c,
        ex,
        ey,
        angle + age * 7,
        Math.sin(now / BIRD_FLAP_MS),
        1.0 * (1 + age * 1.8) * zoomComp,
        1 - age / 0.11,
        'flight',
        now
      );
    }
    drawBirdDeathExplosion(c, ex, ey, age);
    const flashAlpha = Math.max(0, 1 - age * 5);
    if (flashAlpha > 0){
      const glow = c.createRadialGradient(ex, ey, 2, ex, ey, 90);
      glow.addColorStop(0, `rgba(255,240,200,${flashAlpha * 0.9})`);
      glow.addColorStop(0.5, `rgba(255,200,100,${flashAlpha * 0.4})`);
      glow.addColorStop(1, 'rgba(255,160,40,0)');
      c.fillStyle = glow;
      c.beginPath(); c.arc(ex, ey, 88 * flashAlpha, 0, Math.PI*2); c.fill();
      c.globalAlpha = flashAlpha * 0.8;
      c.strokeStyle = `rgba(255,255,220,${flashAlpha * 0.5})`;
      c.lineWidth = 4;
      c.beginPath(); c.arc(ex, ey, 48 * flashAlpha, 0, Math.PI*2); c.stroke();
      c.globalAlpha = 1;
    }

    const revealTime = age - DOWNED_MULT_DELAY;
    if (revealTime >= 0){
      const revealProgress = Math.min(1, revealTime / DOWNED_MULT_DURATION);
      const ease = revealProgress < 0.5
        ? 2 * revealProgress * revealProgress
        : 1 - Math.pow(-2 * revealProgress + 2, 2) / 2;
      const pop = 1 + 0.4 * Math.sin(ease * Math.PI);
      const hasRoomBelow = ey < H - 130;
      const labelSide = ex < W / 2 ? 1 : -1;
      const winLabelX = Math.max(130, Math.min(W - 130, ex + labelSide * (hasRoomBelow ? 38 : 100)));
      const winLabelY = Math.max(68, Math.min(H - 72, ey + (hasRoomBelow ? 82 : 42)));
      c.save();
      c.translate(winLabelX, winLabelY - (1 - revealProgress) * 10);
      c.scale(pop, pop);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = '#6ae17c';
      c.strokeStyle = 'rgba(18,18,18,0.9)';
      c.lineWidth = 8;
      c.font = `900 ${34 + revealProgress*12}px 'Segoe UI', sans-serif`;
      c.strokeText(`${downMult.toFixed(2)}x`, 0, 0);
      c.fillText(`${downMult.toFixed(2)}x`, 0, 0);
      c.font = `700 15px 'Segoe UI', sans-serif`;
      c.fillStyle = '#eef8ec';
      c.fillText(`+${fmt(downWin)} FUN`, 0, 34);
      c.restore();
    }
    return;
  }

  // Escape: the real bird reached escapePoint and flies away.
  // No ghost or hypothetical label belongs in this outcome.
  const cdt = (now - crashAt) / 1000;
  const outProgress = Math.min(1, cdt / (CRASH_MS / 1000));
  const easeOut = 1 - Math.pow(1 - outProgress, 2);
  const ex = pathTip.x + easeOut * easeOut * 720;
  const ey = pathTip.y - easeOut * 360;
  const alpha = Math.max(0, 1 - outProgress);
  const rapidFlap = Math.sin(now / 60) * (1 + outProgress * 0.8);
  drawBird(c, ex, ey, -0.3 - outProgress * 0.5, rapidFlap, 1.0 * zoomComp, alpha);

  c.save();
  c.translate(ex + 12, ey - 32);
  c.textAlign = 'center';
  c.textBaseline = 'bottom';
  c.fillStyle = `rgba(255,230,190,${alpha})`;
  c.strokeStyle = `rgba(20,12,34,${alpha})`;
  c.lineWidth = 6;
  c.font = `800 18px 'Segoe UI', sans-serif`;
  const escapeLabel = `Escaped at ${escapePoint.toFixed(2)}x`;
  c.strokeText(escapeLabel, 0, 0);
  c.fillText(escapeLabel, 0, 0);
  c.restore();

  const verdictDelay = 0.35;
  const verdictTime = Math.max(0, cdt - verdictDelay);
  const verdictAlpha = Math.min(1, verdictTime / 0.3);
  if (verdictAlpha > 0){
    c.save();
    c.translate(W / 2, H / 2);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = `rgba(255,82,82,${verdictAlpha * 0.95})`;
    c.strokeStyle = `rgba(20,12,34,${verdictAlpha * 0.9})`;
    c.lineWidth = 12;
    c.font = `900 56px 'Segoe UI', sans-serif`;
    c.strokeText('NDEGE ESCAPED', 0, 0);
    c.fillText('NDEGE ESCAPED', 0, 0);
    c.restore();
  }
}

// FOMO ghost-continuation timeline (seconds): a slow, certain climb.
const GHOST_CLIMB_S = 2.0;
const GHOST_HOLD_S = 1.0;
const GHOST_FADE_S = 0;
const GHOST_TOTAL_S = GHOST_CLIMB_S + GHOST_HOLD_S + GHOST_FADE_S;

/* The FOMO ghost is ONE single Bézier from the cliff origin O to B_ghost, built
   with EXACTLY the drawCurve control-point family, then split with De Casteljau
   at t_split. The part before the split is painted red (live style), the part
   after blue — same curve, so the red->blue handoff is mathematically seamless
   (shared point + shared tangent => no kink, blue keeps climbing in red's
   direction). The old separate-bezier ghost (own control points) is gone.

   B_ghost is solved so the single curve passes EXACTLY through the frozen tip B
   at t_split: since Q(t)=O+(B_ghost-O)⊙g(t) for the drawCurve family, choosing
   B_ghost = O + (B-O)/g(t_split) gives Q(t_split)=B. So the split point sits on
   the death point — red ends on the bird, no gap. t_split animates 1 -> t_final
   (B_ghost grows up-and-right out of B), so at freeze it equals the live curve
   and then the blue continuation climbs in. Presentation only. */

// Per-axis basis g(t): Q(t) = O + (B_ghost - O) ⊙ g(t) for the drawCurve family.
function ghostCurveBasis(t){
  const cv = CURVE.convex;
  const ax = 0.50 + 0.20 * cv, ay = 0.06;          // P1 factors (drawCurve)
  const bx = 0.90,             by = 0.35 + 0.30 * cv; // P2 factors (drawCurve)
  const u = 1 - t, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
  return {x: w1 * ax + w2 * bx + w3, y: w1 * ay + w2 * by + w3};
}

// Build the single curve + its red/blue De Casteljau split for this frame, or
// null when no ghost is active (and clean up state once it has faded out).
function ghostGeometry(now, field, O, B){
  if (!ghostFomo) return null;
  const age = (now - ghostFomo.start) / 1000;
  if (age >= GHOST_TOTAL_S){ ghostFomo = null; return null; }

  // How far the continuation reaches scales with the REAL outcome: reach
  // (escapePoint) vs where the player cashed (fromMult). No fabricated numbers.
  const reach = ghostFomo.reach;
  const fromMult = Math.max(1.0001, ghostFomo.fromMult || 1);
  const extra = clamp(Math.log(Math.max(1, reach) / fromMult) / Math.log(20), 0, 1);
  const tFinal = clamp(0.66 - 0.45 * extra, 0.30, 0.72);   // smaller => longer climb

  const climb = smoothstep(0, GHOST_CLIMB_S, age);          // eased 0..1
  const fade = age <= GHOST_CLIMB_S + GHOST_HOLD_S ? 1 : 0;
  const tSplit = 1 - (1 - tFinal) * climb;                  // 1 at freeze -> tFinal

  // B_ghost so the curve passes through the frozen tip B exactly at tSplit.
  const g = ghostCurveBasis(tSplit);
  const Bghost = {x: O.x + (B.x - O.x) / g.x, y: O.y + (B.y - O.y) / g.y};

  // Same control-point formula drawCurve uses (guarantees the same curve family).
  const cv = CURVE.convex;
  const P1 = {x: O.x + (Bghost.x - O.x) * (0.50 + 0.20 * cv), y: O.y + (Bghost.y - O.y) * 0.06};
  const P2 = {x: O.x + (Bghost.x - O.x) * 0.90,               y: O.y + (Bghost.y - O.y) * (0.35 + 0.30 * cv)};

  // De Casteljau split at tSplit: red = [O,A,D,F], blue = [F,E,C,Bghost].
  const lerp = (a, b, t) => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
  const A = lerp(O, P1, tSplit), Bc = lerp(P1, P2, tSplit), C = lerp(P2, Bghost, tSplit);
  const D = lerp(A, Bc, tSplit), E = lerp(Bc, C, tSplit), F = lerp(D, E, tSplit);

  // Sprite/label ride the real blue tip in world space. The camera follows it
  // during downed rounds, so do not clamp it to the screen edge.
  const tip = {x: Bghost.x, y: Bghost.y};
  return {red: [O, A, D, F], blue: [F, E, C, Bghost], tip, fade, reach};
}

// Red part — drawn UNDER the bird/explosion, in the exact live drawCurve style.
function drawGhostRed(c, gm){
  const [p0, p1, p2, p3] = gm.red;
  c.save();
  c.beginPath();
  c.moveTo(p0.x, p0.y);
  c.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  c.lineTo(p3.x, p0.y);
  c.closePath();
  const grad = c.createLinearGradient(0, p3.y, 0, p0.y);
  grad.addColorStop(0, 'rgba(255,122,47,0.40)');
  grad.addColorStop(1, 'rgba(196,60,18,0.03)');
  c.fillStyle = grad;
  c.fill();
  c.beginPath();
  c.moveTo(p0.x, p0.y);
  c.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  c.lineWidth = AVIATOR_CONFIG.lineWidth;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.shadowColor = 'rgba(255,150,60,.9)';
  c.shadowBlur = 14;
  c.strokeStyle = '#ff5a2f';
  c.stroke();
  c.restore();
}

// Blue part — drawn ON TOP: glowing, lightly dashed continuation of the SAME
// curve (no kink), plus the reused flight sprite (blue-haloed, transparent,
// BIRD_FLIGHT_ANGLE) and the real-value label.
function drawGhostBlue(c, now, gm){
  const [p0, p1, p2, p3] = gm.blue;
  const fade = gm.fade;

  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.setLineDash([10, 7]);
  c.lineWidth = AVIATOR_CONFIG.lineWidth;
  c.shadowColor = 'rgba(150,200,255,0.9)';
  c.shadowBlur = 14;
  c.strokeStyle = `rgba(140,195,255,${0.92 * fade})`;
  c.beginPath();
  c.moveTo(p0.x, p0.y);
  c.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  c.stroke();
  c.restore();

  const tip = gm.tip;
  c.save();
  const glow = c.createRadialGradient(tip.x, tip.y, 4, tip.x, tip.y, 46);
  glow.addColorStop(0, `rgba(185,220,255,${0.34 * fade})`);
  glow.addColorStop(0.5, `rgba(135,185,255,${0.18 * fade})`);
  glow.addColorStop(1, 'rgba(110,150,255,0)');
  c.fillStyle = glow;
  c.beginPath(); c.arc(tip.x, tip.y, 46, 0, Math.PI * 2); c.fill();
  // Blue shadow bleeds onto the sprite drawn next (drawBird doesn't clear it),
  // giving the reused flight sprite its blue ghost tint.
  c.shadowColor = 'rgba(170,210,255,0.9)';
  c.shadowBlur = 18;
  drawBird(
    c,
    tip.x,
    tip.y,
    BIRD_FLIGHT_ANGLE,
    Math.sin(now / 60),
    1,
    0.5 * fade,
    'flight-loop',
    now,
    BIRD_FLIGHT_FRAME_MS
  );
  c.restore();

  c.save();
  c.globalAlpha = fade;
  c.textAlign = 'center';
  c.textBaseline = 'bottom';
  c.font = `800 18px 'Segoe UI', sans-serif`;
  c.lineWidth = 6;
  c.lineJoin = 'round';
  c.strokeStyle = 'rgba(16,28,52,0.85)';
  c.fillStyle = 'rgba(205,228,255,0.98)';
  const label = `WOULD HAVE REACHED ${gm.reach.toFixed(2)}x`;
  c.strokeText(label, tip.x, tip.y - 22);
  c.fillText(label, tip.x, tip.y - 22);
  c.restore();
}
