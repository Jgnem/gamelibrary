function drawFixedHunterCliff(c){
  if (!hunterCliffSprite.complete || !hunterCliffSprite.naturalWidth) return;
  c.save();
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.drawImage(
    hunterCliffSprite,
    hunterCliff.x,
    hunterCliff.y,
    hunterCliff.width,
    hunterCliff.height
  );
  c.restore();
}

const hunterCliffSprite = new Image();
hunterCliffSprite.src = hunterCliff.path;
const hunterBushSprite = new Image();
hunterBushSprite.src = hunterBush.path;
const hunterSpikyPlantSprite = new Image();
hunterSpikyPlantSprite.src = hunterSpikyPlant.path;
const hunterSheetSprite = new Image();
// ?v bumped when the sheet art changes, so browsers don't serve a stale cache.
hunterSheetSprite.src = HUNTER_SHEET_PATH + '?v=4';

/* Pick the sheet frame whose barrel elevation is closest to the requested aim.
   The 64 poses aren't evenly spaced in angle and the sheet's reading order is
   not strictly monotonic, so a closest-match search keeps the hunter tracking
   the bird smoothly across the whole sweep. */
function hunterAimFrame(aim){
  let best = HUNTER_AIM_FRAMES[0], bestErr = Infinity;
  for (const frame of HUNTER_AIM_FRAMES){
    const err = Math.abs(HUNTER_AIM_ANGLES[frame] - aim);
    if (err < bestErr){ bestErr = err; best = frame; }
  }
  return best;
}

/* Screen-space muzzle for the frame the hunter is currently showing, so the
   flash, smoke and pellet spawn exactly at the drawn barrel tip. */
function hunterMuzzle(aim){
  const tip = HUNTER_MUZZLE_CELL[hunterAimFrame(aim)];
  return {
    x: HUNTER_DRAW_X + tip[0] * HUNTER_DRAW_SCALE,
    y: HUNTER_DRAW_Y + tip[1] * HUNTER_DRAW_SCALE
  };
}

/* ---- standing hunter: a single sheet frame chosen by aim elevation ---- */
function drawArcher(c, aim, loaded){
  if (!hunterSheetSprite.complete || !hunterSheetSprite.naturalWidth) return;

  // The hunter is a single flat frame, so the feet stay planted: only a brief
  // horizontal recoil kick on firing — no vertical bob that would float him.
  const recoil = gunFlashes.reduce(
    (amount, flash) => Math.max(amount, flash.life / flash.maxLife),
    0
  );
  const recoilX = recoil * 4;

  const frame = hunterAimFrame(aim);
  const sx = (frame % HUNTER_SHEET_COLS) * HUNTER_FRAME_W;
  const sy = Math.floor(frame / HUNTER_SHEET_COLS) * HUNTER_FRAME_H;

  c.save();
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.drawImage(
    hunterSheetSprite,
    sx, sy, HUNTER_FRAME_W, HUNTER_FRAME_H,
    HUNTER_DRAW_X - recoilX,
    HUNTER_DRAW_Y,
    HUNTER_FRAME_W * HUNTER_DRAW_SCALE,
    HUNTER_FRAME_H * HUNTER_DRAW_SCALE
  );
  c.restore();
}

function drawHunterPlants(c){
  c.save();
  c.imageSmoothingEnabled = false;
  if (hunterBushSprite.complete && hunterBushSprite.naturalWidth){
    c.drawImage(
      hunterBushSprite,
      hunterBush.x,
      hunterBush.y,
      hunterBush.width,
      hunterBush.height
    );
  }
  if (hunterSpikyPlantSprite.complete && hunterSpikyPlantSprite.naturalWidth){
    c.drawImage(
      hunterSpikyPlantSprite,
      hunterSpikyPlant.x,
      hunterSpikyPlant.y,
      hunterSpikyPlant.width,
      hunterSpikyPlant.height
    );
  }
  c.restore();
}

function drawHunterAndGun(c, aim, loaded){
  drawFixedHunterCliff(c);
  drawArcher(c, aim, loaded);
  drawVisualEffects(c, 0, {gunSmoke: true, projectiles: false});
  drawHunterPlants(c);
}
