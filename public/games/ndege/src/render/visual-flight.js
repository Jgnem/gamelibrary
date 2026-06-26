/* =====================  VISUAL FLIGHT PATH  =====================
   Presentation only. This layer never reads the live multiplier, the RNG or any
   server/RTP logic. The curve is a FIXED cubic Bézier scaled between a fixed
   origin at the cliff lip and the bird; the bird is driven by elapsed TIME since
   round start (not by the multiplier). The multiplier is the untouched DOM
   #mult element drawn on top as a label.
   =============================================================== */

function clamp(value, min, max){
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0, edge1, value){
  const range = edge1 - edge0;
  const t = range === 0 ? 0 : clamp((value - edge0) / range, 0, 1);
  return t * t * (3 - 2 * t);
}

// Converts elapsed flight time into eased visual progression.
function visualProgressAt(elapsedSeconds){
  return 1 - Math.exp(
    -Math.max(0, elapsedSeconds) * AVIATOR_CONFIG.visualSpeed
  );
}

function flightVisualIntensity(visualProgress){
  return smoothstep(0.08, 0.88, visualProgress);
}

/* The whole flight visual is expressed in fractions of the FLIGHT FIELD — the
   area to the right of the staging line (bird-on-perch + hunter live left of
   it). x grows rightward, y is measured from the top. */
const CURVE = {
  origin:   { x: 0.10, y: 0.91 }, // FÅGELNS startpunkt vid lift-off (du är nöjd med denna)
  foot:     { x: 0.03, y: 0.99 }, // KURVANS bottenfäste — vid klippans nederkant,
                                   //   oberoende av fågeln (kurvan reser sig härifrån)
  anchor:   { x: 0.66, y: 0.30 }, // dit fågeln svävar in
  hover:    0.14,                 // svävamplitud (dramatik)
  convex:   0.62,                 // kurvform 0..1
  maxX:     0.86,                 // fågeln aldrig längre höger än så (avstånd till kant)
  minYtop:  0.12                  // fågeln aldrig högre upp än så (avstånd till topp)
};

// Staging line = the cliff lip. The flight field is everything to its right.
const FLIGHT_FIELD_LEFT = CLIFF_EDGE_X;

function getFlightField(){
  return {
    x: FLIGHT_FIELD_LEFT,
    y: 0,
    w: W - FLIGHT_FIELD_LEFT,
    h: H
  };
}

// field fraction -> canvas pixels
function fieldToPx(field, p){
  return {
    x: field.x + p.x * field.w,
    y: field.y + p.y * field.h
  };
}

// canvas pixels -> field fraction (inverse of fieldToPx)
function pxToField(field, px){
  return {
    x: (px.x - field.x) / field.w,
    y: (px.y - field.y) / field.h
  };
}

// Fågelns position i fältfraktioner, tidsdriven. Den växer från `start`
// (flygningens startpunkt — sätts vid lift-off, default = CURVE.origin) mot
// CURVE.anchor. Eftersom X och Y delar samma start "fäster" kurvan vid fågeln.
function birdPos(t, start = CURVE.origin){
  const a = CURVE.anchor;
  const grow = 1 - Math.exp(-t / 1.6);                  // progressiv tillväxt i starten
  const hg = Math.max(0, Math.min(1, (t - 1.2) / 2.5)); // sväv rampar in efter starten
  const A = CURVE.hover, ph = 0.5 * t;
  let x = start.x + (a.x - start.x) * grow + A * Math.sin(ph) * hg;       // X/Y ur fas => slinga
  let y = start.y + (a.y - start.y) * grow + A * 0.55 * Math.sin(ph + 0.6) * hg;
  x = Math.min(x, CURVE.maxX);                           // håll fågeln i skärmen
  y = Math.max(y, CURVE.minYtop);                        //   med marginal
  return { x, y };
}

// Bird's screen position + fixed facing at flight time t (seconds since round start).
// `start` is the captured lift-off point (field fractions).
function birdFlightPose(field, t, start = CURVE.origin){
  const here = fieldToPx(field, birdPos(t, start));
  return {
    x: here.x,
    y: here.y,
    angle: BIRD_FLIGHT_ANGLE
  };
}

// Fixed cubic Bézier between origin O and the bird B (fill + glowing line).
function drawCurve(c, O, B, color){
  const convex = CURVE.convex;
  const c1x = O.x + (B.x - O.x) * (0.50 + 0.20 * convex), c1y = O.y + (B.y - O.y) * 0.06;
  const c2x = O.x + (B.x - O.x) * 0.90,                   c2y = O.y + (B.y - O.y) * (0.35 + 0.30 * convex);

  c.save();
  c.beginPath();
  c.moveTo(O.x, O.y);
  c.bezierCurveTo(c1x, c1y, c2x, c2y, B.x, B.y);
  c.lineTo(B.x, O.y);
  c.closePath();
  const g = c.createLinearGradient(0, B.y, 0, O.y);
  g.addColorStop(0, 'rgba(255,122,47,0.40)');
  g.addColorStop(1, 'rgba(196,60,18,0.03)');
  c.fillStyle = g;
  c.fill();

  c.beginPath();
  c.moveTo(O.x, O.y);
  c.bezierCurveTo(c1x, c1y, c2x, c2y, B.x, B.y);
  c.lineWidth = AVIATOR_CONFIG.lineWidth;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.shadowColor = 'rgba(255,150,60,.9)';
  c.shadowBlur = 14;
  c.strokeStyle = color;
  c.stroke();
  c.restore();
}
