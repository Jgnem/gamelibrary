// Drunk Farmer — the farmer himself, drawn entirely in code and animated.
//
// A canvas redraw of the delivered "farmer character" reference: scraggly
// straw hat over messy brown hair, happy half-lidded eyes, big red nose, rosy
// cheeks, an open laugh with a straw in the mouth corner, full beard, red
// plaid shirt with the sleeves rolled up (bare forearms), blue bib overalls
// with brass buttons, a star patch and a belt, rolled cuffs and big brown
// boots. Both hands hold the lever-action rifle.
//
// He stands on the grass right of the board (FARMER_RECT) on his own canvas
// and runs a continuous rAF loop, so he is always alive:
//
//   idle   — slow breathing bob, gentle sway, blinking
//   shoot  — raises the rifle toward a stage point (the free hand comes up to
//            the trigger), fires (muzzle flash, recoil, smoke) and lowers
//            again; used on EMPTY bottles and on the chicken-event hens
//   drunk  — big sway, redder cheeks, droopier lids, hiccup bubbles; active
//            during the chicken event
//
// The farmer is drawn from a parametric POSE object; actions tween pose fields
// with fx.animate while the render loop keeps painting. All cross-canvas
// coordination happens in STAGE coordinates (canvas.js helpers): shootAt()
// resolves at the trigger-pull moment and hands back the muzzle position so
// the board can spawn its own impact effects in sync.
//
// UI-only. No math imports.

import { animate, delay, easeOutCubic, easeInOutQuad, lerp } from './fx.js';
import { mountStageCanvas, FARMER_RECT, ACTOR_SCALE } from './canvas.js';
import { getBottleTileSprite, drawSprite } from './assets.js';

// ---------------------------------------------------------------------------
// Palette (sampled from the reference art)
// ---------------------------------------------------------------------------
const HAT = '#dfb54e';
const HAT_LIGHT = '#f0d078';
const HAT_DARK = '#a87e2a';
const HAIR = '#a06a2c';
const SKIN = '#f4b585';
const SKIN_SHADE = '#d9905c';
const NOSE = '#e2673d';
const CHEEK = '#e07a52';
const BEARD = '#8a5527';
const BEARD_DARK = '#6b3f18';
const TEETH = '#fdf7ea';
const MOUTH = '#5a1d0c';
const SHIRT = '#bc3620';
const SHIRT_DARK = '#8c2312';
const SHIRT_LIGHT = '#d95a36';
const OVERALL = '#2e6ca8';
const OVERALL_DARK = '#1f4d7d';
const OVERALL_LIGHT = '#4a8ac2';
const PATCH = '#b97f35';
const PATCH_DARK = '#8a5a1e';
const BELT = '#7a4418';
const BRASS = '#d9a740';
const BOOT = '#a05e24';
const BOOT_DARK = '#6b3c12';
const BARREL = '#8a8f94';
const BARREL_DARK = '#4a4e52';
const STOCK = '#8a4f1e';
const STOCK_DARK = '#5f3410';
const FLASH_CORE = '#fff7cf';
const FLASH_OUT = '#ffb63d';

// ---------------------------------------------------------------------------
// Geometry (FARMER_RECT-local design px). He faces LEFT toward the board.
// ---------------------------------------------------------------------------
const GROUND_Y = 690;
const PIVOT = { x: 245, y: GROUND_Y }; // sway pivot at his feet
const HEAD = { x: 246, y: 272, r: 56 };
const SHOULDER_Y = 372;
const WAIST_Y = 478;
// The TRIGGER hand carries the rifle at his right hip; the barrel points LEFT
// toward the board at rest ("low ready"), so aiming is just a small tilt up.
const GUN_PIVOT = { x: 278, y: 428 };
const GUN_LEN = 240;
const REST_ANGLE = Math.PI - 0.55; // relaxed DIAGONAL carry: muzzle down-left
// Bottle interaction points (FARMER_RECT-local): where a flying bottle lands
// in his free hand, and where his mouth/nose are for drinking/sniffing.
const BOTTLE_CATCH = { x: 168, y: 442 };
const BOTTLE_MOUTH = { x: 214, y: 306 };

/**
 * When the barrel points left the whole rifle must be MIRRORED vertically,
 * otherwise the stock/lever render above the barrel (upside down). Applied as
 * a y-flip in the rifle's local space; hand perp-offsets use the same sign.
 */
function gunFlip(angle) {
  return Math.cos(angle) < 0 ? -1 : 1;
}

function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function limb(ctx, pts, width, color) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 3) ctx.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
  else ctx.lineTo(pts[1][0], pts[1][1]);
  ctx.stroke();
  ctx.restore();
}

function starPatch(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = PATCH;
  ctx.strokeStyle = PATCH_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.55;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Red plaid: base, darker grid, faint light grid — clipped to a path. */
function plaidFill(ctx, pathFn, x, y, w, h) {
  ctx.save();
  pathFn(ctx);
  ctx.clip();
  ctx.fillStyle = SHIRT;
  ctx.fillRect(x, y, w, h);
  ctx.lineWidth = 6;
  ctx.strokeStyle = SHIRT_DARK;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i <= 5; i += 1) {
    const sx = x + (i / 5) * w;
    ctx.beginPath();
    ctx.moveTo(sx, y);
    ctx.lineTo(sx, y + h);
    ctx.stroke();
    const sy = y + (i / 5) * h;
    ctx.beginPath();
    ctx.moveTo(x, sy);
    ctx.lineTo(x + w, sy);
    ctx.stroke();
  }
  ctx.lineWidth = 2;
  ctx.strokeStyle = SHIRT_LIGHT;
  ctx.globalAlpha = 0.6;
  for (let i = 0; i <= 5; i += 1) {
    const sx = x + (i / 5) * w + 8;
    ctx.beginPath();
    ctx.moveTo(sx, y);
    ctx.lineTo(sx, y + h);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Body parts
// ---------------------------------------------------------------------------
function drawBoot(ctx, x, y) {
  // big rounded work boot, toe pointing slightly left, laces + heavy sole
  ctx.fillStyle = BOOT;
  ctx.strokeStyle = BOOT_DARK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 18, y - 46);
  ctx.lineTo(x + 20, y - 46);
  ctx.lineTo(x + 22, y - 12);
  ctx.quadraticCurveTo(x + 24, y - 2, x + 12, y - 2);
  ctx.lineTo(x - 38, y - 2);
  ctx.quadraticCurveTo(x - 52, y - 2, x - 50, y - 14);
  ctx.quadraticCurveTo(x - 48, y - 26, x - 26, y - 28);
  ctx.quadraticCurveTo(x - 20, y - 36, x - 18, y - 46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // sole
  ctx.fillStyle = BOOT_DARK;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x - 52, y - 6, 76, 8, 4) : ctx.rect(x - 52, y - 6, 76, 8);
  ctx.fill();
  // lace crosses
  ctx.strokeStyle = BOOT_DARK;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 3; i += 1) {
    const ly = y - 40 + i * 9;
    ctx.beginPath();
    ctx.moveTo(x - 12, ly);
    ctx.lineTo(x + 12, ly + 5);
    ctx.moveTo(x + 12, ly);
    ctx.lineTo(x - 12, ly + 5);
    ctx.stroke();
  }
}

function drawLegs(ctx) {
  for (const [lx, cuffShift] of [[208, 0], [282, 2]]) {
    // straight overall leg — the top reaches ABOVE the waistline so the
    // breathing torso (drawn later, bobbing over it) never opens a seam
    ctx.fillStyle = OVERALL;
    ctx.strokeStyle = OVERALL_DARK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx - 24, WAIST_Y - 12);
    ctx.lineTo(lx + 24, WAIST_Y - 12);
    ctx.lineTo(lx + 21, GROUND_Y - 44);
    ctx.lineTo(lx - 21, GROUND_Y - 44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // rolled cuff (lighter blue)
    ctx.fillStyle = OVERALL_LIGHT;
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(lx - 24, GROUND_Y - 62 + cuffShift, 48, 20, 6)
      : ctx.rect(lx - 24, GROUND_Y - 62 + cuffShift, 48, 20);
    ctx.fill();
    ctx.stroke();
  }
  // knee patch like the reference
  starPatch(ctx, 292, GROUND_Y - 110, 14);
  drawBoot(ctx, 204, GROUND_Y);
  drawBoot(ctx, 286, GROUND_Y);
}

function drawTorso(ctx) {
  // neck first — the shirt collar and the beard both overlap it, tying the
  // head to the body (no hovering)
  const neckW = 38;
  const neckX = HEAD.x - neckW / 2;
  const neckY = HEAD.y + HEAD.r * 0.9;
  const neckH = SHOULDER_Y - neckY - 4;
  ctx.fillStyle = SKIN;
  ctx.strokeStyle = SKIN_SHADE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect
    ? ctx.roundRect(neckX, neckY, neckW, neckH, 6)
    : ctx.rect(neckX, neckY, neckW, neckH);
  ctx.fill();
  ctx.stroke();

  // plaid shirt: shoulders + chest behind the bib, slight taper at the waist
  const shirtPath = (c) => {
    c.beginPath();
    c.moveTo(172, SHOULDER_Y + 10);
    c.quadraticCurveTo(178, SHOULDER_Y - 14, 210, SHOULDER_Y - 16);
    c.lineTo(295, SHOULDER_Y - 16);
    c.quadraticCurveTo(326, SHOULDER_Y - 12, 330, SHOULDER_Y + 12);
    c.lineTo(324, WAIST_Y + 6);
    c.lineTo(180, WAIST_Y + 6);
    c.closePath();
  };
  plaidFill(ctx, shirtPath, 165, SHOULDER_Y - 20, 170, 130);
  ctx.strokeStyle = SHIRT_DARK;
  ctx.lineWidth = 3;
  shirtPath(ctx);
  ctx.stroke();

  // collar + a sliver of chest
  ctx.fillStyle = SHIRT_DARK;
  ctx.beginPath();
  ctx.moveTo(212, SHOULDER_Y - 16);
  ctx.lineTo(238, SHOULDER_Y + 6);
  ctx.lineTo(262, SHOULDER_Y - 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.moveTo(226, SHOULDER_Y - 14);
  ctx.lineTo(238, SHOULDER_Y - 2);
  ctx.lineTo(250, SHOULDER_Y - 14);
  ctx.closePath();
  ctx.fill();

  // overalls bib + straps
  ctx.fillStyle = OVERALL;
  ctx.strokeStyle = OVERALL_DARK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect
    ? ctx.roundRect(216, SHOULDER_Y + 4, 76, WAIST_Y - SHOULDER_Y - 2, 8)
    : ctx.rect(216, SHOULDER_Y + 4, 76, WAIST_Y - SHOULDER_Y - 2);
  ctx.fill();
  ctx.stroke();
  // straps over the shoulders
  ctx.lineWidth = 14;
  ctx.strokeStyle = OVERALL;
  ctx.beginPath();
  ctx.moveTo(224, SHOULDER_Y + 12);
  ctx.lineTo(206, SHOULDER_Y - 14);
  ctx.moveTo(284, SHOULDER_Y + 12);
  ctx.lineTo(300, SHOULDER_Y - 14);
  ctx.stroke();
  // bib pocket + star patch + brass buttons
  ctx.strokeStyle = OVERALL_DARK;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(232, SHOULDER_Y + 26, 44, 30);
  starPatch(ctx, 272, SHOULDER_Y + 74, 15);
  ctx.fillStyle = BRASS;
  ctx.strokeStyle = PATCH_DARK;
  for (const bx of [226, 282]) {
    ctx.beginPath();
    ctx.arc(bx, SHOULDER_Y + 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // hips below the belt + belt with gold buckle
  ctx.fillStyle = OVERALL;
  ctx.strokeStyle = OVERALL_DARK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(180, WAIST_Y + 4);
  ctx.lineTo(324, WAIST_Y + 4);
  ctx.lineTo(320, WAIST_Y + 34);
  ctx.lineTo(184, WAIST_Y + 34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BELT;
  ctx.fillRect(180, WAIST_Y - 8, 144, 18);
  ctx.strokeStyle = BOOT_DARK;
  ctx.strokeRect(180, WAIST_Y - 8, 144, 18);
  ctx.fillStyle = BRASS;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(240, WAIST_Y - 12, 26, 24, 4) : ctx.rect(240, WAIST_Y - 12, 26, 24);
  ctx.fill();
  ctx.stroke();
}

function drawHead(ctx, pose, time) {
  const { x, y, r } = HEAD;
  const drunk = pose.drunk;
  const tilt =
    pose.headTilt +
    Math.sin(time * 1.05) * 0.024 +
    Math.sin(time * 0.48) * 0.045 + // slow look-around wander
    drunk * Math.sin(time * 1.7) * 0.06;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  // messy hair sticking out under the hat
  ctx.fillStyle = HAIR;
  ctx.strokeStyle = BEARD_DARK;
  ctx.lineWidth = 2;
  for (const [hx, hy, hr] of [[-r * 0.95, -r * 0.1, r * 0.3], [r * 0.95, -r * 0.15, r * 0.28], [r * 0.85, r * 0.25, r * 0.22]]) {
    ctx.beginPath();
    ctx.ellipse(hx, hy, hr, hr * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // face
  ctx.fillStyle = SKIN;
  ctx.strokeStyle = SKIN_SHADE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.95, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // beard: from the ears around the jaw, scraggly bottom edge
  ctx.fillStyle = BEARD;
  ctx.strokeStyle = BEARD_DARK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.92, r * 0.05);
  ctx.quadraticCurveTo(-r * 1.02, r * 0.75, -r * 0.62, r * 1.1);
  // scraggly tufts along the bottom
  ctx.lineTo(-r * 0.42, r * 1.32);
  ctx.lineTo(-r * 0.26, r * 1.14);
  ctx.lineTo(-r * 0.06, r * 1.38);
  ctx.lineTo(r * 0.14, r * 1.15);
  ctx.lineTo(r * 0.34, r * 1.34);
  ctx.lineTo(r * 0.5, r * 1.08);
  ctx.quadraticCurveTo(r * 1.02, r * 0.72, r * 0.92, r * 0.05);
  // inner edge around the mouth area
  ctx.quadraticCurveTo(r * 0.55, r * 0.28, r * 0.4, r * 0.3);
  ctx.quadraticCurveTo(0, r * 0.34, -r * 0.4, r * 0.3);
  ctx.quadraticCurveTo(-r * 0.55, r * 0.28, -r * 0.92, r * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // open laughing mouth: dark opening + top teeth (bigger when drunk)
  const laugh = 1 + drunk * 0.25 + Math.sin(time * 2.1) * 0.03;
  ctx.fillStyle = MOUTH;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.72, r * 0.34, r * 0.26 * laugh, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = TEETH;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.58, r * 0.3, r * 0.1, 0, 0, Math.PI);
  ctx.fill();

  // mustache: two swoops over the mouth corners
  ctx.fillStyle = BEARD;
  ctx.strokeStyle = BEARD_DARK;
  ctx.lineWidth = 2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * r * 0.3, r * 0.44, r * 0.34, r * 0.13, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // the straw in the mouth corner, pointing out left
  ctx.strokeStyle = HAT;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, r * 0.55);
  ctx.lineTo(-r * 1.15, r * 0.28);
  ctx.stroke();
  ctx.strokeStyle = HAT_DARK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r * 1.15, r * 0.28);
  ctx.lineTo(-r * 1.32, r * 0.34);
  ctx.moveTo(-r * 1.15, r * 0.28);
  ctx.lineTo(-r * 1.28, r * 0.2);
  ctx.stroke();

  // big round nose + rosy cheeks (drunker → redder)
  ctx.globalAlpha = 0.4 + drunk * 0.4;
  ctx.fillStyle = CHEEK;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * r * 0.6, r * 0.22, r * 0.2, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = NOSE;
  ctx.strokeStyle = SKIN_SHADE;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(-r * 0.02, r * 0.3, r * 0.26, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.1, r * 0.24, r * 0.07, r * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  // happy half-lidded eyes: white, heavy upper lid, pupil peeking out
  const lid = Math.min(0.9, 0.35 + drunk * 0.3 + pose.blink * 0.6);
  for (const s of [-1, 1]) {
    const ex = s * r * 0.38 - r * 0.02;
    const ey = -r * 0.08;
    const ew = r * 0.22;
    const eh = r * 0.2;
    ctx.save();
    ctx.translate(ex, ey);
    ctx.fillStyle = '#fdf6e8';
    ctx.strokeStyle = '#3b2412';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, ew, eh, 0, 0, Math.PI * 2);
    ctx.fill();
    // pupil at the lower edge (sleepy-happy)
    ctx.fillStyle = '#2a1608';
    ctx.beginPath();
    ctx.arc(-ew * 0.2, eh * 0.35, r * 0.075, 0, Math.PI * 2);
    ctx.fill();
    // upper lid: skin flap covering `lid` of the eye
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.ellipse(0, -eh + eh * 2 * lid * 0.5, ew * 1.05, eh * lid, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#3b2412';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, ew, eh, 0, Math.PI + 0.25, -0.25);
    ctx.stroke();
    // lid crease line
    ctx.beginPath();
    ctx.moveTo(-ew, -eh * (1 - lid));
    ctx.quadraticCurveTo(0, -eh * (1 - lid) + eh * lid * 0.9, ew, -eh * (1 - lid));
    ctx.stroke();
    ctx.restore();
  }

  // bushy raised brows
  ctx.strokeStyle = HAIR;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, -r * 0.34);
  ctx.quadraticCurveTo(-r * 0.4, -r * 0.5, -r * 0.16, -r * 0.38);
  ctx.moveTo(r * 0.12, -r * 0.38);
  ctx.quadraticCurveTo(r * 0.36, -r * 0.52, r * 0.58, -r * 0.36);
  ctx.stroke();

  // straw hat: wide scraggly brim + rounded crown, slightly askew
  ctx.save();
  ctx.rotate(-0.05 + drunk * 0.08);
  // brim
  ctx.fillStyle = HAT;
  ctx.strokeStyle = HAT_DARK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.6, r * 1.55, r * 0.4, -0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // scraggly straw spikes off the brim
  ctx.fillStyle = HAT;
  for (const [sx, sy, a] of [[-r * 1.5, -r * 0.62, 2.9], [r * 1.5, -r * 0.55, 0.25], [-r * 1.2, -r * 0.42, 2.5], [r * 1.25, -r * 0.75, -0.3]]) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r * 0.32, -r * 0.05);
    ctx.lineTo(0, r * 0.09);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  // crown
  ctx.fillStyle = HAT_LIGHT;
  ctx.beginPath();
  ctx.moveTo(-r * 0.85, -r * 0.66);
  ctx.quadraticCurveTo(-r * 0.95, -r * 1.5, -r * 0.1, -r * 1.62);
  ctx.quadraticCurveTo(r * 0.75, -r * 1.58, r * 0.82, -r * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = HAT_DARK;
  ctx.stroke();
  // band
  ctx.fillStyle = HAT_DARK;
  ctx.fillRect(-r * 0.88, -r * 0.92, r * 1.72, r * 0.2);
  ctx.restore();

  ctx.restore();
}

function drawRifle(ctx, angle, recoil) {
  ctx.save();
  ctx.translate(GUN_PIVOT.x, GUN_PIVOT.y);
  ctx.rotate(angle);
  ctx.scale(1, gunFlip(angle)); // keep the stock/lever on the underside
  ctx.translate(-recoil * 14, 0); // kick straight back along the barrel axis

  // wooden stock (behind the receiver, like the reference)
  ctx.fillStyle = STOCK;
  ctx.strokeStyle = STOCK_DARK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-16, -8);
  ctx.lineTo(-64, 2);
  ctx.quadraticCurveTo(-80, 6, -78, 22);
  ctx.lineTo(-68, 28);
  ctx.lineTo(-20, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // receiver + lever loop
  ctx.fillStyle = BARREL_DARK;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(-18, -9, 52, 18, 3) : ctx.rect(-18, -9, 52, 18);
  ctx.fill();
  ctx.strokeStyle = BARREL_DARK;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(2, 20, 11, 0.25, Math.PI - 0.25);
  ctx.stroke();

  // wooden forestock under the barrel
  ctx.fillStyle = STOCK;
  ctx.strokeStyle = STOCK_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(34, -4, 66, 10, 4) : ctx.rect(34, -4, 66, 10);
  ctx.fill();
  ctx.stroke();

  // barrel out to the muzzle
  ctx.fillStyle = BARREL;
  ctx.fillRect(30, -8, GUN_LEN - 30, 6);
  ctx.fillStyle = BARREL_DARK;
  ctx.fillRect(30, -3.5, GUN_LEN - 30, 3);
  // muzzle cap + front sight
  ctx.fillStyle = BARREL;
  ctx.fillRect(GUN_LEN - 4, -10, 6, 10);
  ctx.fillRect(GUN_LEN - 14, -12, 4, 5);

  ctx.restore();
}

function drawMuzzleFlash(ctx, angle, strength) {
  if (strength <= 0) return;
  const mx = GUN_PIVOT.x + Math.cos(angle) * (GUN_LEN + 8);
  const my = GUN_PIVOT.y + Math.sin(angle) * (GUN_LEN + 8);
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(angle);
  ctx.globalAlpha = strength;
  ctx.shadowColor = FLASH_OUT;
  ctx.shadowBlur = 26;
  ctx.fillStyle = FLASH_OUT;
  const s = 20 + strength * 16;
  ctx.beginPath(); // spiky star
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const r = i % 2 === 0 ? s : s * 0.38;
    ctx.lineTo(Math.cos(a) * r * 1.35, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = FLASH_CORE;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.55, s * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Arms. The REAR arm (his right, screen-right shoulder) is the TRIGGER arm —
 * its hand always carries the rifle at the grip. The FRONT arm supports the
 * forestock, so both hands hold the gun at rest and while aiming. Sleeves are
 * rolled: red upper arm, bare forearm, rolled-cuff ring at the elbow.
 */
function drawArms(ctx, pose, time, angle) {
  const rec = pose.recoil * 14;
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const flip = gunFlip(angle);

  // trigger hand: just behind the receiver, riding the rifle (grip side)
  const trigger = {
    x: GUN_PIVOT.x + dirX * (-4 - rec) - dirY * 18 * flip,
    y: GUN_PIVOT.y + dirY * (-4 - rec) + dirX * 18 * flip,
  };
  // support hand: always on the wooden forestock, with a tiny idle slide.
  const supportDist = 90 + Math.sin(time * 1.15) * 5 * (1 - pose.aim);
  const support = {
    x: GUN_PIVOT.x + dirX * (supportDist - rec),
    y: GUN_PIVOT.y + dirY * (supportDist - rec),
  };

  const drawArm = (sx, sy, hand, bendOut) => {
    const ex = (sx + hand.x) / 2 + bendOut.x;
    const ey = (sy + hand.y) / 2 + bendOut.y;
    // upper arm: plaid-red sleeve
    limb(ctx, [[sx, sy], [ex, ey]], 30, SHIRT);
    // rolled cuff ring
    ctx.fillStyle = SHIRT_DARK;
    ctx.beginPath();
    ctx.arc(ex, ey, 16, 0, Math.PI * 2);
    ctx.fill();
    // bare forearm
    limb(ctx, [[ex, ey], [hand.x, hand.y]], 22, SKIN);
    // hand
    ctx.fillStyle = SKIN;
    ctx.strokeStyle = SKIN_SHADE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  // trigger arm first (it sits closer to the body)
  drawArm(322, SHOULDER_Y + 10, trigger, { x: 10, y: 18 });
  // support arm over the rifle
  drawArm(182, SHOULDER_Y + 10, support, { x: -8, y: 22 });
}

/** A bottle held/tossed by the farmer (pose.bottle), drawn in upper-body
 * space so it rides the breathing bob like something actually in his hand. */
function drawBottleInHand(ctx, pose) {
  const b = pose.bottle;
  if (!b || b.alpha <= 0) return;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.rot || 0);
  const size = 104 * (b.scale || 1);
  drawSprite(ctx, getBottleTileSprite(b.variant || 'full'), 0, 0, size, size, {
    alpha: b.alpha,
    shadow: b.glow
      ? { color: 'rgba(255,207,92,0.9)', blur: 14 + b.glow * 16 }
      : undefined,
  });
  ctx.restore();
}

function drawHiccups(ctx, time, drunk) {
  if (drunk <= 0) return;
  ctx.save();
  for (let i = 0; i < 3; i += 1) {
    const p = (time * 0.5 + i * 0.37) % 1;
    const bx = HEAD.x + 78 + Math.sin((time + i * 2.1) * 2.4) * 12;
    const by = HEAD.y - 40 - p * 120;
    ctx.globalAlpha = drunk * Math.sin(p * Math.PI) * 0.85;
    ctx.strokeStyle = '#fff2c8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(bx, by, 6 + p * 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSmoke(ctx, pose, angle) {
  if (pose.smoke <= 0) return;
  const mx = GUN_PIVOT.x + Math.cos(angle) * (GUN_LEN + 10);
  const my = GUN_PIVOT.y + Math.sin(angle) * (GUN_LEN + 10);
  const t = 1 - pose.smoke;
  ctx.save();
  ctx.globalAlpha = pose.smoke * 0.5;
  ctx.fillStyle = '#cfd4d8';
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(
      mx + Math.cos(angle) * (10 + t * 46) + (i - 1) * 9,
      my + Math.sin(angle) * (10 + t * 46) - t * 22 - i * 6,
      6 + t * 14 + i * 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();
}

/** Ground contact: one soft ambient pool + a hard contact shadow under each
 * boot sole. Drawn WITHOUT the breathing bob so the feet read as planted. */
function drawGroundShadow(ctx) {
  ctx.save();
  ctx.fillStyle = '#132008';
  ctx.globalAlpha = 0.26;
  ctx.beginPath();
  ctx.ellipse(PIVOT.x, GROUND_Y + 4, 122, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  // hard contact right under the soles (boot spans x-52..x+24 → center x-14)
  ctx.globalAlpha = 0.38;
  for (const bx of [204 - 14, 286 - 14]) {
    ctx.beginPath();
    ctx.ellipse(bx, GROUND_Y + 3, 42, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFarmer(ctx, pose, time) {
  ctx.save();
  // sway about the feet: breath + a slow weight-shift; drunk staggering adds
  // a big secondary wobble
  const sway =
    pose.sway +
    Math.sin(time * 0.82) * 0.016 +
    Math.sin(time * 0.31) * 0.024 +
    pose.drunk * Math.sin(time * 1.1) * 0.06;
  ctx.translate(PIVOT.x, PIVOT.y);
  ctx.rotate(sway);
  ctx.translate(-PIVOT.x, -PIVOT.y);

  // The rifle is held STEADY at rest — it moves only when the farmer actually
  // aims and fires (the idle wobble read as shooting motion and was removed;
  // the body sway above keeps him alive).
  const gunAngle = pose.gunAngle;

  // Ground + legs are drawn WITHOUT the breathing bob: the boots stay planted
  // on the ground plane while the upper body breathes above them (the whole
  // body bobbing up and down read as floating).
  drawGroundShadow(ctx);
  drawLegs(ctx);

  ctx.save();
  ctx.translate(0, pose.bob);
  drawTorso(ctx);
  drawHead(ctx, pose, time);
  drawRifle(ctx, gunAngle, pose.recoil);
  drawArms(ctx, pose, time, gunAngle);
  drawMuzzleFlash(ctx, gunAngle, pose.flash);
  drawSmoke(ctx, pose, gunAngle);
  drawBottleInHand(ctx, pose);
  ctx.restore();

  drawHiccups(ctx, time, pose.drunk);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Actor
// ---------------------------------------------------------------------------
/**
 * Mount the farmer on the stage and start his render loop.
 * @returns {{
 *   canvas: HTMLCanvasElement,
 *   resize: () => void,
 *   setDrunk: (on: boolean) => Promise<void>,
 *   shootAt: (stagePt: {x:number,y:number}) => Promise<{x:number,y:number, angle:number}>,
 * }}
 */
export function initFarmer() {
  const { canvas, ctx, resize } = mountStageCanvas(FARMER_RECT, 'farmer-actor');
  canvas.style.pointerEvents = 'none';

  // Uniform actor scale, anchored at his feet (PIVOT.x, GROUND_Y) so the
  // boots stay planted on the same ground line. All drawing runs under this
  // transform; the interaction points below map local → scaled local with
  // `tLocal` so FX (bottle catch, muzzle flash) stay glued to the body.
  const AS = ACTOR_SCALE;
  const tLocal = (x, y) => ({
    x: PIVOT.x + (x - PIVOT.x) * AS,
    y: GROUND_Y + (y - GROUND_Y) * AS,
  });

  const pose = {
    bob: 0,
    sway: 0,
    headTilt: 0,
    blink: 0,
    aim: 0, // 0 = rear hand hangs loose, 1 = on the trigger
    gunAngle: REST_ANGLE,
    recoil: 0,
    flash: 0,
    smoke: 0,
    drunk: 0,
    bottle: null, // {variant, x, y, rot, scale, alpha, glow} — held/tossed bottle
  };

  const start = performance.now();
  let nextBlink = 1.5;
  (function loop() {
    const time = (performance.now() - start) / 1000;
    // breathing + a slower rocking layer so the idle never looks frozen.
    // Applies to the UPPER BODY only (legs stay planted), so the amplitude is
    // kept small enough that the waist seam never opens.
    pose.bob =
      Math.sin(time * 1.9) * 2.6 * (1 + pose.drunk * 1.2) +
      Math.sin(time * 0.42) * 1.6;
    if (time > nextBlink) {
      if (time > nextBlink + 0.14) {
        pose.blink = 0;
        nextBlink = time + 1.6 + Math.random() * 2.4;
      } else {
        pose.blink = Math.sin(((time - nextBlink) / 0.14) * Math.PI);
      }
    }
    ctx.clearRect(0, 0, FARMER_RECT.w, FARMER_RECT.h);
    ctx.save();
    ctx.translate(PIVOT.x * (1 - AS), GROUND_Y * (1 - AS));
    ctx.scale(AS, AS);
    drawFarmer(ctx, pose, time);
    ctx.restore();
    requestAnimationFrame(loop);
  })();

  /** Muzzle position in stage coordinates (sway ignored — close enough for FX). */
  function muzzleStage(angle) {
    const m = tLocal(
      GUN_PIVOT.x + Math.cos(angle) * (GUN_LEN + 6),
      GUN_PIVOT.y + Math.sin(angle) * (GUN_LEN + 6)
    );
    return { x: FARMER_RECT.x + m.x, y: FARMER_RECT.y + m.y, angle };
  }

  // The rifle pose is COSMETIC: the hit FX (crosshair + explosion) live on the
  // target cell (chickenShotAnimator), so the barrel never needs to point at
  // it exactly. Cap the upward swing at ~40° — on mobile the board towers
  // above him and a true aim would point the rifle nearly straight up, which
  // read as broken (Le Cowboy does the same: the cowboy fires forward/diagonal
  // and the cell FX sells the hit).
  const MAX_UP_ELEVATION = 0.7; // rad above the leftward horizontal (~40°)

  async function aimAt(stagePt) {
    const fromAngle = pose.gunAngle;
    const gp = tLocal(GUN_PIVOT.x, GUN_PIVOT.y);
    let target = Math.atan2(
      stagePt.y - (FARMER_RECT.y + gp.y),
      stagePt.x - (FARMER_RECT.x + gp.x)
    );
    // atan2 up-left quadrant is (-PI, -PI/2); elevation above the leftward
    // horizontal is PI + target. Steeper than the cap → clamp to the cap.
    if (target < 0 && target > -Math.PI + MAX_UP_ELEVATION) {
      target = -Math.PI + MAX_UP_ELEVATION;
    }
    await animate(240, (t) => {
      const k = easeInOutQuad(t);
      pose.gunAngle = lerpAngle(fromAngle, target, k);
      pose.aim = Math.max(pose.aim, k);
      pose.headTilt = lerp(0, -0.1, k);
    });
    return target;
  }

  function fireAndRecover() {
    // flash + recoil, then smoke and lowering — runs on after shootAt resolves.
    animate(560, (t) => {
      pose.flash = t < 0.22 ? 1 - t / 0.22 : 0;
      pose.recoil = Math.sin(Math.min(1, t * 2.2) * Math.PI) * (1 - t * 0.35);
      pose.smoke = t > 0.1 ? 1 - (t - 0.1) / 0.9 : 0;
    }).then(async () => {
      const fromAngle = pose.gunAngle;
      await animate(280, (t) => {
        pose.gunAngle = lerpAngle(fromAngle, REST_ANGLE, easeOutCubic(t));
        pose.aim = 1 - t;
        pose.headTilt = lerp(-0.1, 0, t);
      });
    });
  }

  return {
    canvas,
    resize,

    /**
     * Fade the drunk state to a level. Accepts a boolean (legacy: full on/off,
     * used by Drunk Mode) or a number 0..1 — the base game maps the Buzz
     * meter's tier onto a partial level so the farmer VISIBLY gets tipsier as
     * the meter fills (sway, redder cheeks, droopier lids scale with it).
     */
    setDrunk(on) {
      const from = pose.drunk;
      const target = typeof on === 'number' ? Math.max(0, Math.min(1, on)) : on ? 1 : 0;
      return animate(420, (t) => {
        pose.drunk = lerp(from, target, t);
      });
    },

    /**
     * Aim at a stage point, pull the trigger, resolve AT the shot (so board
     * impact FX start in sync). Recoil/smoke/lowering continue on their own.
     */
    async shootAt(stagePt) {
      const angle = await aimAt(stagePt);
      await delay(70); // brief steady-hold beat
      fireAndRecover();
      return muzzleStage(angle);
    },

    /**
     * Client-coordinate point of his free hand — the fly-to target for a
     * bottle leaving the board (bottleSpawnFx flies to this, then the caller
     * runs drinkBottle()).
     */
    catchScreenPoint() {
      const rect = canvas.getBoundingClientRect();
      const c = tLocal(BOTTLE_CATCH.x, BOTTLE_CATCH.y);
      return {
        x: rect.left + (c.x / FARMER_RECT.w) * rect.width,
        y: rect.top + (c.y / FARMER_RECT.h) * rect.height,
      };
    },

    /**
     * Client-coordinate anchor for the bottle-type chip: beside his LEFT
     * chest, over the ground. Above-the-hat put the chip on the board's
     * bottom cells once the mobile farmer moved up to the frame corner; this
     * spot lands in the free strip between the frame and the controls.
     * showChip places the pill's bottom edge at this point and clamps it
     * inside the viewport.
     */
    chipScreenPoint() {
      const rect = canvas.getBoundingClientRect();
      const c = tLocal(75, 350);
      return {
        x: rect.left + (c.x / FARMER_RECT.w) * rect.width,
        y: rect.top + (c.y / FARMER_RECT.h) * rect.height,
      };
    },

    /**
     * FULL bottle: catch → raise to the mouth, head tips back, three glugs,
     * then the emptied bottle is tossed over the shoulder. The caller steps
     * the drunk level / meter afterwards, so the causality reads:
     * bottle → farmer drinks → buzz rises.
     */
    async drinkBottle() {
      pose.bottle = { variant: 'full', x: BOTTLE_CATCH.x, y: BOTTLE_CATCH.y, rot: 0, scale: 1, alpha: 1, glow: 0.6 };
      // lift to the mouth, tip the bottle and the head back
      await animate(220, (t) => {
        const k = easeInOutQuad(t);
        pose.bottle.x = lerp(BOTTLE_CATCH.x, BOTTLE_MOUTH.x, k);
        pose.bottle.y = lerp(BOTTLE_CATCH.y, BOTTLE_MOUTH.y, k);
        pose.bottle.rot = lerp(0, 1.9, k);
        pose.bottle.glow = 0.6 * (1 - k);
        pose.headTilt = lerp(0, 0.22, k);
      });
      // three glugs: bottle rocks, head follows
      await animate(420, (t) => {
        const g = Math.sin(t * Math.PI * 3);
        pose.bottle.rot = 1.9 + g * 0.14;
        pose.bottle.y = BOTTLE_MOUTH.y - Math.abs(g) * 4;
        pose.headTilt = 0.22 + Math.abs(g) * 0.04;
      });
      // toss the empty over the shoulder (arc back-right, spin, fade)
      pose.bottle.variant = 'empty';
      const from = { x: pose.bottle.x, y: pose.bottle.y, rot: pose.bottle.rot };
      await animate(320, (t) => {
        const k = easeOutCubic(t);
        pose.headTilt = lerp(0.24, 0, k);
        pose.bottle.x = from.x + k * 170;
        pose.bottle.y = from.y - Math.sin(k * Math.PI) * 140 + k * 210;
        pose.bottle.rot = from.rot + k * 3.6;
        pose.bottle.alpha = 1 - Math.max(0, (k - 0.55) / 0.45);
      });
      pose.bottle = null;
    },

    /** Rack the lever — the "rampage loaded" telegraph after the 3rd bottle:
     * gun snaps up to ready, two quick pump jerks, brief hold, back down. */
    async rackRifle() {
      const fromAngle = pose.gunAngle;
      await animate(180, (t) => {
        const k = easeOutCubic(t);
        pose.gunAngle = lerpAngle(fromAngle, Math.PI - 0.18, k);
        pose.aim = Math.max(pose.aim, k * 0.7);
      });
      await animate(300, (t) => {
        pose.recoil = Math.abs(Math.sin(t * Math.PI * 2)) * 0.7;
      });
      pose.recoil = 0;
      await delay(220);
      const raised = pose.gunAngle;
      await animate(240, (t) => {
        pose.gunAngle = lerpAngle(raised, REST_ANGLE, easeOutCubic(t));
        pose.aim = 0.7 * (1 - t);
      });
    },

    /** Hold/leave the rampage-ready stance (gun half-raised the whole spin). */
    setRampage(on) {
      const fromAngle = pose.gunAngle;
      const fromAim = pose.aim;
      return animate(260, (t) => {
        const k = easeInOutQuad(t);
        pose.gunAngle = lerpAngle(fromAngle, on ? Math.PI - 0.22 : REST_ANGLE, k);
        pose.aim = lerp(fromAim, on ? 0.6 : 0, k);
      });
    },

  };
}
