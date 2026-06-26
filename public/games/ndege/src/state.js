/* =====================  PROTECTED STATE / MULTIPLIER  =====================
   DO NOT CHANGE GROWTH, multAt(), curMult, escapePoint, balance updates, or
   the phase state used by betting and outcome resolution during visual work.
   ======================================================================== */
let balance = 10000;
let phase = 'intro';               // intro | waiting | launching | flying | downed | crashed
let escapePoint = genEscape();
let flightStart = 0, waitStart = performance.now(), crashAt = 0;
let introStart = performance.now(); // one-time fly-in before the first round
let launchStart = 0;
let flightVisualStart = 0;
let cameraFreezeT = 0;
const multAt = t => Math.exp(GROWTH * (t - flightStart)/1000);
let curMult = 1.00;
let milestoneIdx = 0;
let shakeEnd = 0, shakeMag = 0;
function shake(m){ shakeMag = m; shakeEnd = performance.now() + 320; }
const histArr = [];
const arrows = [];                 // cosmetic projectiles
const feathers = [];               // hit particles
const rings = [];                  // golden shockwave rings
const sparks = [];                 // star sparkles
const trail = [];                  // golden dust behind the bird
const gunFlashes = [];             // fixed-screen muzzle flashes
let hitStopEnd = 0, lastTickNow = performance.now();
let hitsThisRound = 0, shotsRequired = 0, roundPeakFiredM = 0;
let roundWin = 0, downWin = 0;
let downAt = 0, downMult = 1, downPos = {x:0, y:0};
let lastVisualPathProgress = 0;
const smoke = [];
const gunSmoke = [];
const deathFragments = [];
let lastAim = -0.5;
let hunterAimTarget = HUNTER_IDLE_AIM;
let lastTip = {x: 120, y: 280};    // bird position, updated every frame
let flightOrigin = null;           // curve/flight launch point, captured at lift-off
let ghostFomo = null;              // FOMO ghost-continuation after a downed round: {start, reach}
let lastNow = performance.now();

const fmt = n => n.toLocaleString('en-KE',{minimumFractionDigits:2,maximumFractionDigits:2});
