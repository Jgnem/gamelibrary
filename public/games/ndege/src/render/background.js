/* =====================  PROCEDURAL SAVANNA BACKGROUND  =====================
   Pure canvas, no background images and no separate animation loop. The game
   renderer calls updateBackground() once per frame and drawBackground() before
   gameplay objects. backgroundTime only advances during active flight, so the
   whole scene is frozen in intro/waiting/launching/downed/crashed phases. */
let backgroundTime = 0;

function resetBackground(){
  backgroundTime = 0;
}

function updateBackground(deltaTime, gameState){
  const isFlying =
    gameState === 'flying' ||
    gameState === 'playing' ||
    gameState === 'active';

  if (isFlying){
    backgroundTime += deltaTime * 60;
  }
}

function bgWrap(value, span){
  return ((value % span) + span) % span;
}

function drawSky(c, width, height){
  const g = c.createLinearGradient(0, 0, 0, height * 0.8);
  g.addColorStop(0, '#1A6FA8');
  g.addColorStop(0.35, '#4AA8D4');
  g.addColorStop(0.72, '#A8D4E8');
  g.addColorStop(1, '#E8C87A');
  c.fillStyle = g;
  c.fillRect(0, 0, width, height);
}

function drawSun(c, sx, sy, width, height){
  const sr = height * 0.075;
  const glow = c.createRadialGradient(sx, sy, 0, sx, sy, sr * 1.8);
  glow.addColorStop(0, 'rgba(255,240,120,0.28)');
  glow.addColorStop(1, 'rgba(255,180,40,0)');
  c.fillStyle = glow;
  c.beginPath();
  c.arc(sx, sy, sr * 1.8, 0, Math.PI * 2);
  c.fill();

  const sun = c.createRadialGradient(sx - sr * 0.25, sy - sr * 0.25, sr * 0.05, sx, sy, sr);
  sun.addColorStop(0, '#FFFCCC');
  sun.addColorStop(0.5, '#FFE040');
  sun.addColorStop(1, '#FFA828');
  c.fillStyle = sun;
  c.beginPath();
  c.arc(sx, sy, sr, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = 'rgba(255,255,255,0.45)';
  c.beginPath();
  c.ellipse(sx - sr * 0.3, sy - sr * 0.3, sr * 0.28, sr * 0.18, -0.5, 0, Math.PI * 2);
  c.fill();
}

function mountainYAt(x, ox, height){
  const s = ox * 0.055;
  return height * 0.57
    - Math.sin((x + s) * 0.0019) * height * 0.20
    - Math.sin((x + s) * 0.0047) * height * 0.09
    - Math.sin((x + s) * 0.0091) * height * 0.04
    - Math.sin((x + s) * 0.019) * height * 0.015;
}

function drawMountains(c, width, height, ox){
  c.beginPath();
  c.moveTo(-2, height);
  for (let x = -2; x <= width + 2; x += 3) c.lineTo(x, mountainYAt(x, ox, height) + height * 0.05);
  c.lineTo(width + 2, height);
  c.closePath();
  c.fillStyle = 'rgba(110,85,130,0.25)';
  c.fill();

  c.beginPath();
  c.moveTo(-2, height);
  for (let x = -2; x <= width + 2; x += 3) c.lineTo(x, mountainYAt(x, ox, height));
  c.lineTo(width + 2, height);
  c.closePath();
  const mg = c.createLinearGradient(0, height * 0.30, 0, height * 0.62);
  mg.addColorStop(0, 'rgba(150,110,170,0.52)');
  mg.addColorStop(0.6, 'rgba(120,85,140,0.42)');
  mg.addColorStop(1, 'rgba(90,60,105,0.18)');
  c.fillStyle = mg;
  c.fill();

  c.save();
  c.globalAlpha = 0.50;
  c.fillStyle = 'rgba(235,230,255,0.65)';
  c.beginPath();
  c.moveTo(-2, height * 0.42);
  for (let x = -2; x <= width + 2; x += 3){
    const my = mountainYAt(x, ox, height);
    c.lineTo(x, my < height * 0.43 ? my : height * 0.43);
  }
  c.lineTo(width + 2, height * 0.43);
  c.closePath();
  c.fill();
  c.restore();
}

function groundYAt(x, ox, height){
  return height * 0.76
    + Math.sin((x + ox * 0.25) * 0.006) * 3
    + Math.sin((x + ox * 0.25) * 0.014) * 1.5;
}

function drawGround(c, width, height, ox){
  c.beginPath();
  c.moveTo(-2, height);
  for (let x = -2; x <= width + 2; x += 4) c.lineTo(x, groundYAt(x, ox, height));
  c.lineTo(width + 2, height);
  c.closePath();

  const gg = c.createLinearGradient(0, height * 0.76, 0, height);
  gg.addColorStop(0, '#D09828');
  gg.addColorStop(0.3, '#B07820');
  gg.addColorStop(0.7, '#886018');
  gg.addColorStop(1, '#5A3E10');
  c.fillStyle = gg;
  c.fill();

  c.save();
  c.globalAlpha = 0.15;
  for (let i = 0; i < 7; i++){
    c.beginPath();
    c.strokeStyle = '#704010';
    c.lineWidth = 1;
    const ty = height * 0.81 + i * height * 0.025;
    c.moveTo(0, ty);
    c.lineTo(width, ty);
    c.stroke();
  }
  c.restore();
}

function drawRocks(c, width, height, ox){
  const rocks = [{x: 0.12, s: 1}, {x: 0.34, s: 0.7}, {x: 0.55, s: 1.1}, {x: 0.78, s: 0.85}, {x: 0.92, s: 0.65}];
  for (const rock of rocks){
    const rx = bgWrap(rock.x - ox * 0.00022, 1.2) * width;
    const ry = groundYAt(rx, ox, height) - 3;
    const rw = 22 * rock.s;
    const rh = 12 * rock.s;
    c.fillStyle = '#887060';
    c.beginPath();
    c.ellipse(rx, ry, rw, rh, 0.1, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.12)';
    c.beginPath();
    c.ellipse(rx - rw * 0.2, ry - rh * 0.3, rw * 0.45, rh * 0.35, -0.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.beginPath();
    c.ellipse(rx + rw * 0.1, ry + rh * 0.2, rw * 0.8, rh * 0.35, 0, 0, Math.PI * 2);
    c.fill();
  }
}

function drawGrass(c, width, height, ox, t){
  const s = ox * 0.38;
  for (let i = 0; i < 40; i++){
    const gx = bgWrap((i / 40) * width * 1.5 - (s % (width * 0.5)) + 40, width + 100) - 40;
    const base = groundYAt(gx, ox, height);
    const gh = height * (0.06 + Math.sin(i * 1.9) * 0.03);
    const sway = Math.sin(t * 0.032 + i * 0.65) * 6;
    const thick = 1.5 + Math.sin(i * 2.7) * 0.7;
    const col = i % 5 === 0 ? 'rgba(120,175,25,0.9)' : i % 3 === 0 ? 'rgba(180,148,20,0.88)' : 'rgba(210,165,28,0.85)';
    c.save();
    c.strokeStyle = col;
    c.lineWidth = thick;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(gx, base);
    c.bezierCurveTo(gx + sway * 0.3, base - gh * 0.4, gx + sway * 0.7, base - gh * 0.7, gx + sway, base - gh);
    c.stroke();
    if (i % 4 === 0){
      c.fillStyle = col;
      c.globalAlpha = 0.7;
      c.beginPath();
      c.ellipse(gx + sway, base - gh - 4, 2.5, 5, Math.atan2(sway, gh), 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
}

function drawCloud(c, cx, cy, sc, alpha){
  c.save();
  c.globalAlpha = alpha;
  const blobs = [[0, 0, 48, 28], [-38, -5, 30, 22], [40, -4, 34, 23], [-20, 13, 26, 16], [22, 13, 28, 17], [0, -24, 24, 18], [-12, -14, 18, 13], [14, -16, 20, 14]];
  for (const blob of blobs){
    const bx = cx + blob[0] * sc;
    const by = cy + blob[1] * sc;
    const rx = blob[2] * sc;
    const ry = blob[3] * sc;
    c.beginPath();
    c.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2);
    const cg = c.createRadialGradient(bx - rx * 0.2, by - ry * 0.3, ry * 0.05, bx, by, rx);
    cg.addColorStop(0, '#FFFFFF');
    cg.addColorStop(0.6, '#EEF4FA');
    cg.addColorStop(1, '#D0DFF0');
    c.fillStyle = cg;
    c.fill();
  }
  c.beginPath();
  c.ellipse(cx, cy + 28 * sc, 48 * sc, 8 * sc, 0, 0, Math.PI * 2);
  c.fillStyle = 'rgba(160,180,210,0.30)';
  c.fill();
  c.restore();
}

function drawTree(c, bx, by, h, ox, phaseOffset){
  const sw = ox * 0.0035 + phaseOffset;
  const sway = Math.sin(sw) * 4;
  const sway2 = Math.sin(sw * 1.3) * 2;
  const tw = h * 0.048;
  const trunkH = h * 0.52;

  c.fillStyle = '#4A2E0E';
  c.beginPath();
  c.ellipse(bx, by, tw * 2.5, tw * 0.7, 0, 0, Math.PI * 2);
  c.fill();

  const tg = c.createLinearGradient(bx - tw, by, bx + tw, by - trunkH);
  tg.addColorStop(0, '#3E2208');
  tg.addColorStop(0.4, '#5C3418');
  tg.addColorStop(1, '#7A5028');
  c.fillStyle = tg;
  c.beginPath();
  c.moveTo(bx - tw, by);
  c.bezierCurveTo(bx - tw + sway * 0.2, by - trunkH * 0.35, bx - tw * 0.4 + sway, by - trunkH * 0.75, bx - tw * 0.2 + sway, by - trunkH);
  c.lineTo(bx + tw * 0.2 + sway, by - trunkH);
  c.bezierCurveTo(bx + tw * 0.4 + sway, by - trunkH * 0.75, bx + tw + sway * 0.2, by - trunkH * 0.35, bx + tw, by);
  c.closePath();
  c.fill();

  c.fillStyle = 'rgba(180,130,70,0.20)';
  c.beginPath();
  c.moveTo(bx - tw * 0.1, by - trunkH * 0.05);
  c.bezierCurveTo(bx - tw * 0.3 + sway * 0.2, by - trunkH * 0.4, bx + tw * 0.1 + sway * 0.6, by - trunkH * 0.75, bx - tw * 0.05 + sway, by - trunkH);
  c.bezierCurveTo(bx - tw * 0.2 + sway, by - trunkH * 0.6, bx - tw * 0.4 + sway * 0.2, by - trunkH * 0.2, bx - tw * 0.1, by - trunkH * 0.05);
  c.closePath();
  c.fill();

  const branches = [[-tw * 3.8, trunkH * 0.52, tw * 0.9], [tw * 3.4, trunkH * 0.48, tw * 0.85], [tw * 0.5, trunkH * 0.65, tw * 0.7]];
  for (const branch of branches){
    c.strokeStyle = '#5C3418';
    c.lineWidth = branch[2] * 2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(bx + sway, by - branch[1]);
    c.quadraticCurveTo(bx + branch[0] * 0.5 + sway, by - branch[1] - h * 0.05, bx + branch[0] + sway + sway2, by - branch[1] - h * 0.10);
    c.stroke();
    c.lineWidth = branch[2];
    c.globalAlpha = 0.8;
    c.beginPath();
    c.moveTo(bx + branch[0] * 0.6 + sway, by - branch[1] - h * 0.04);
    c.lineTo(bx + branch[0] * 0.9 + sway + sway2, by - branch[1] - h * 0.13);
    c.stroke();
    c.globalAlpha = 1;
  }

  const cr = h * 0.54;
  const crh = h * 0.16;
  const ccy = by - trunkH - crh * 0.15 + sway2;
  c.fillStyle = '#3A6008';
  c.beginPath();
  c.ellipse(bx + sway, ccy + crh * 0.3, cr * 0.95, crh * 0.5, 0, 0, Math.PI * 2);
  c.fill();

  const cg = c.createRadialGradient(bx + sway, ccy, cr * 0.05, bx + sway, ccy, cr);
  cg.addColorStop(0, '#7AB828');
  cg.addColorStop(0.5, '#5A9418');
  cg.addColorStop(1, '#3A7008');
  c.fillStyle = cg;
  c.beginPath();
  c.ellipse(bx + sway, ccy, cr, crh, 0, 0, Math.PI * 2);
  c.fill();

  for (let i = 0; i < 8; i++){
    const a = i / 8 * Math.PI;
    const lx = bx + sway + Math.cos(a) * cr * 0.7;
    const ly = ccy - Math.sin(a) * crh * 0.6;
    c.fillStyle = i % 2 === 0 ? '#6AAC20' : '#82C030';
    c.beginPath();
    c.ellipse(lx, ly, cr * 0.18, crh * 0.45, a, 0, Math.PI * 2);
    c.fill();
  }

  c.fillStyle = 'rgba(180,255,80,0.14)';
  c.beginPath();
  c.ellipse(bx + sway - cr * 0.25, ccy - crh * 0.5, cr * 0.38, crh * 0.38, -0.4, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = 'rgba(50,100,0,0.30)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.ellipse(bx + sway, ccy, cr, crh, 0, 0, Math.PI * 2);
  c.stroke();
}

const bgBirds = [
  {baseX: 0.04, y: 0.08, s: 0.52, vx: 0.00026, phase: 0.2},
  {baseX: 0.16, y: 0.19, s: 0.40, vx: 0.00031, phase: 1.1},
  {baseX: 0.28, y: 0.12, s: 0.64, vx: 0.00022, phase: 2.0},
  {baseX: 0.39, y: 0.27, s: 0.46, vx: 0.00028, phase: 2.7},
  {baseX: 0.51, y: 0.16, s: 0.58, vx: 0.00034, phase: 3.6},
  {baseX: 0.65, y: 0.10, s: 0.44, vx: 0.00025, phase: 4.4},
  {baseX: 0.79, y: 0.23, s: 0.62, vx: 0.00030, phase: 5.2},
  {baseX: 0.94, y: 0.14, s: 0.50, vx: 0.00024, phase: 5.9}
];

function drawBgBirds(c, width, height, t){
  c.save();
  c.strokeStyle = 'rgba(20,50,90,0.24)';
  c.lineWidth = 1.1;
  c.lineCap = 'round';
  for (const bird of bgBirds){
    const bx = bgWrap(bird.baseX + t * bird.vx, 1.05) * width;
    const by = bird.y * height + Math.sin(t * 0.04 + bird.phase) * 4;
    const wing = Math.sin(t * 0.12 + bird.phase) * bird.s * 5;
    c.beginPath();
    c.moveTo(bx - bird.s * 7, by + wing);
    c.quadraticCurveTo(bx, by, bx + bird.s * 7, by + wing);
    c.stroke();
  }
  c.restore();
}

function drawMidTrees(c, width, height, ox){
  const s = ox * 0.1;
  for (let i = 0; i < 12; i++){
    const tx = bgWrap(i / 12 * width * 1.2 - (s % (width * 0.2)) + 20, width + 80) - 20;
    const ty = height * 0.64 + Math.sin(i * 1.3) * height * 0.02;
    const th = height * (0.10 + Math.sin(i * 2.1) * 0.03);
    c.fillStyle = 'rgba(50,90,20,0.22)';
    c.fillRect(tx - th * 0.05, ty, th * 0.10, th * 0.4);
    c.beginPath();
    c.ellipse(tx, ty, th * 0.55, th * 0.15, 0, 0, Math.PI * 2);
    c.fill();
  }
}

function drawHeatHaze(c, width, height, t){
  c.save();
  c.globalAlpha = 0.035 + Math.sin(t * 0.05) * 0.015;
  const hg = c.createLinearGradient(0, height * 0.70, 0, height * 0.80);
  hg.addColorStop(0, 'rgba(255,200,80,0)');
  hg.addColorStop(0.5, 'rgba(255,220,120,0.9)');
  hg.addColorStop(1, 'rgba(255,200,80,0)');
  c.fillStyle = hg;
  c.fillRect(0, height * 0.70, width, height * 0.10);
  c.restore();
}

const trees = [
  {p: 0.18, py: 0.78, h: 0.26, ph: 1.4},
  {p: 0.48, py: 0.77, h: 0.24, ph: 2.3},
  {p: 0.74, py: 0.76, h: 0.27, ph: 3.2},
  {p: 1.08, py: 0.77, h: 0.25, ph: 0.5}
];

const clouds = [
  {baseX: 0.08, y: 0.09, s: 0.90, a: 0.78, vx: 0.00014},
  {baseX: 0.45, y: 0.06, s: 1.15, a: 0.70, vx: 0.00009},
  {baseX: 0.72, y: 0.13, s: 0.72, a: 0.83, vx: 0.00021},
  {baseX: 1.10, y: 0.08, s: 0.85, a: 0.65, vx: 0.00012}
];

function drawClouds(c, width, height, t){
  for (const cloud of clouds){
    const x = bgWrap(cloud.baseX + t * cloud.vx, 1.3) * width;
    drawCloud(c, x, cloud.y * height, cloud.s, cloud.a);
  }
}

function drawForegroundTrees(c, width, height, ox){
  c.save();
  for (const tree of trees){
    const x = bgWrap(tree.p - ox * 0.00025, 1.35) * width;
    drawTree(c, x, tree.py * height, tree.h * height, ox, tree.ph);
  }
  c.restore();
}

function drawBackground(c, width, height){
  const t = backgroundTime;
  const ox = backgroundTime * 0.55;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  drawSky(c, width, height);
  drawSun(c, width * 0.76, height * 0.16, width, height);
  drawMountains(c, width, height, ox);
  drawBgBirds(c, width, height, t);
  drawClouds(c, width, height, t);
  drawMidTrees(c, width, height, ox);
  drawGround(c, width, height, ox);
  drawRocks(c, width, height, ox);
  drawGrass(c, width, height, ox, t);
  drawHeatHaze(c, width, height, t);
  drawForegroundTrees(c, width, height, ox);
  c.restore();
}

function drawSceneBackground(c){
  drawBackground(c, c.canvas.width, c.canvas.height);
}
