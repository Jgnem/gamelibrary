const AVIATOR_CONFIG = {
  growthRate: 0.083,    // protected game math (GROWTH)
  visualSpeed: 0.22,    // flight visual intensity pacing
  lineWidth: 4,         // curve stroke width
  maxBirdRotationDeg: 25 // clamp on the bird's curve-following tilt
};
const GROWTH = AVIATOR_CONFIG.growthRate;
const WAIT_MS = 5000;
const BIRD_TAKEOFF_MS = 850;
const LAUNCH_MS = BIRD_TAKEOFF_MS;
const FLIGHT_BLEND_MS = 260;
const CRASH_MS = 2600, DOWNED_CRASH_MS = 4500;
const MILESTONES = [2, 5, 10, 20, 50, 100];
const DOWNED_MULT_DELAY = 0.45;
const DOWNED_MULT_DURATION = 0.25;

/* =====================  CANVAS  ===================== */
const cv = $('cv'), ctx = cv.getContext('2d');
const W = cv.width, H = cv.height;
const GROUND = H - 30;

/* =====================  VISUAL CONSTANTS  ===================== */
const ARCHER = {x: 40, y: GROUND + 1};

/* ---- prone hunter: a stabilized raise animation, frame picked by elevation ----
   An 8x4 grid of 387x224 cells (32 video frames of the rifle raising from level
   (~-6deg) to its steepest elevation (~-57deg). The frames are stabilized so the
   body stays put while the barrel swings up. They are not evenly spaced in angle
   (the motion holds at both ends), so HUNTER_AIM_ANGLES gives each frame's
   measured barrel elevation and the renderer selects the closest of the curated
   HUNTER_AIM_FRAMES to the requested aim. */
const HUNTER_SHEET_PATH = './assets/hunter/hunter-prone-frames-clean.png';
const HUNTER_SHEET_COLS = 8;
const HUNTER_FRAME_W = 387;
const HUNTER_FRAME_H = 224;
const HUNTER_DRAW_SCALE = 0.36;                              // big source frames (387x224) scaled to the ledge
const HUNTER_DRAW_X = -18;                                    // cell left edge, screen px
// Stabilized frames: the body baseline sits at cell y=213; plant that on the ground.
const HUNTER_DRAW_Y = GROUND - 213 * HUNTER_DRAW_SCALE;
// Shoulder point the barrel pivots around, in source-cell pixels.
const HUNTER_PIVOT_CELL_X = 190;
const HUNTER_PIVOT_CELL_Y = 169;
// Muzzle tip per aim frame (cell pixels) so flash/smoke spawn at the barrel.
const HUNTER_MUZZLE_CELL = [
  [376,149], [376,149], [376,148], [376,148], [375,148], [372,129], [369,118], [366,105],
  [364,100], [357,87], [352,77], [348,68], [340,56], [332,48], [323,38], [314,28],
  [304,20], [303,19], [301,18], [298,16], [296,14], [291,11], [292,12], [292,12],
  [292,12], [292,12], [292,12], [295,15], [295,15], [292,12], [292,12], [295,15]
];
// Measured barrel elevation per frame (radians, screen convention: up is
// negative). Used to pick the frame whose aim is closest to the target.
const HUNTER_AIM_ANGLES = [
  -0.1071, -0.1071, -0.1124, -0.1124, -0.1130, -0.2163, -0.2776, -0.3488,
  -0.3775, -0.4564, -0.5165, -0.5688, -0.6456, -0.7057, -0.7778, -0.8495,
  -0.9177, -0.9252, -0.9369, -0.9561, -0.9710, -1.0020, -0.9946, -0.9946,
  -0.9946, -0.9946, -0.9946, -0.9724, -0.9724, -0.9946, -0.9946, -0.9724
];
// The raise animation holds at the level start (frames 0-4) and steep end
// (frames 21-31), so those are near-duplicate angles. This curated subset is
// spread evenly across the elevation range (no angle ties), giving a smooth,
// body-stable sweep. Aim selection searches only these frames.
const HUNTER_AIM_FRAMES = [
  0, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 19, 21
];
const GUN_PIVOT_X = HUNTER_DRAW_X + HUNTER_PIVOT_CELL_X * HUNTER_DRAW_SCALE;
const GUN_PIVOT_Y = HUNTER_DRAW_Y + HUNTER_PIVOT_CELL_Y * HUNTER_DRAW_SCALE;
const BIRD_IDLE_WIDTH = 48;
const BIRD_IDLE_HEIGHT = 60;
const BIRD_IDLE_ANCHOR_X = 0.52;
const BIRD_IDLE_ANCHOR_Y = 0.96;
const BIRD_RIG_BODY_WIDTH = 72;
const BIRD_RIG_BODY_HEIGHT = 36;
const BIRD_RIG_BODY_ANCHOR_X = 0.54;
const BIRD_RIG_BODY_ANCHOR_Y = 0.55;
const BIRD_RIG_WING_FRAME_SIZE = 128;
const BIRD_RIG_WING_FRAME_COUNT = 8;
const BIRD_RIG_WING_DRAW_SIZE = 72;
const BIRD_RIG_WING_ROOT_X = 105;
const BIRD_RIG_WING_ROOT_Y = 76;
const BIRD_RIG_SHOULDER_X = 9;
const BIRD_RIG_SHOULDER_Y = -7;
const BIRD_SPRITE_WIDTH = 58;
const BIRD_SPRITE_HEIGHT = 60;
const BIRD_SPRITE_ANCHOR_X = 0.52;
const BIRD_SPRITE_ANCHOR_Y = 0.68;
// ---- flight bird: a 36-frame wing-flap cycle (faces right) ----
// Cell dimensions are derived from the loaded 6x6 sheet. Used for the fly-in,
// resting hover, takeoff and full flight.
const BIRD_FLIGHT_PATH = './assets/birds/bird-flight-6x6.png';
const BIRD_FLIGHT_COLS = 6;
const BIRD_FLIGHT_ROWS = 6;
const BIRD_FLIGHT_FRAME_COUNT = 36;
const BIRD_FLIGHT_BASE_W = 84;                 // on-screen wingspan at scale 1
const BIRD_FLIGHT_FRAME_MS = 42;               // time-based 6x6 animator timing
// Fixed nose-up attitude held the whole flight: the bird always climbs at this
// angle instead of pivoting to the curve slope (~ -20°). Takeoff ramps into it.
const BIRD_FLIGHT_ANGLE = -0.35;
// Intro: the bird descends from above the hunter's head onto its hover spot,
// then the round begins. Start point is defined below (needs BIRD_REST).
const BIRD_INTRO_MS = 1800;
const HUNTER_TRACK_MULT = 1.15;
const HUNTER_IDLE_AIM = -0.1071;                // rests level, prone on the ledge
const HUNTER_AIM_MAX = -0.1071;                 // level rifle (least elevation in the sheet)
const HUNTER_AIM_MIN = -1.0020;                 // steepest tracked aim (~ -57°)
const HUNTER_AIM_DEADZONE = Math.PI / 120;      // 1.5 degrees
const HUNTER_AIM_FOLLOW_SPEED = 2.4;
const hunterCliff = {
  path: './assets/environment/hunter-cliff.png',
  x: -18,
  y: H - 37,
  width: 228,
  height: 43
};
const hunterBush = {
  path: './assets/environment/hunter-bush.png',
  x: 54,
  y: H - 31,
  width: 92,
  height: 32
};
const hunterSpikyPlant = {
  path: './assets/environment/hunter-spiky-plant.png',
  x: 144,
  y: H - 37,
  width: 42,
  height: 28
};
const CLIFF_EDGE_X = ARCHER.x + 110;
const CLIFF_EDGE_Y = H - 2;
// The bird hovers just above the hunter's hat (hat crown ≈ cell 200,120).
const BIRD_REST_X = HUNTER_DRAW_X + 200 * HUNTER_DRAW_SCALE;
const BIRD_REST_Y = HUNTER_DRAW_Y + 120 * HUNTER_DRAW_SCALE - 58;
// Intro start: straight up above the hunter's head, so the bird simply drops
// down onto the hover spot (same size the whole way — no scale ramp).
const BIRD_INTRO_START_X = BIRD_REST_X - 18;  //18
const BIRD_INTRO_START_Y = BIRD_REST_Y - 196; //196
const BIRD_FLAP_MS = 54;
