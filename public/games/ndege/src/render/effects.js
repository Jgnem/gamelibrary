/* =====================  EFFECTS / PARTICLES  ===================== */
function spawnSparks(x, y, count){
  for (let i = 0; i < count; i++){
    const a = Math.random()*Math.PI*2, v = 60 + Math.random()*180;
    sparks.push({x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v,
                 life: 0.5 + Math.random()*0.5, size: 2 + Math.random()*3});
  }
}

function spawnRings(x, y, big){
  rings.push({x, y, r: 6, vr: big ? 360 : 250, life: 0.5, color: 'rgba(242,183,5,', w: 3.5});
  rings.push({x, y, r: 2, vr: big ? 270 : 180, life: 0.62, color: 'rgba(255,244,214,', w: 2});
}
let flashTimer;
function flash(big){
  const f = $('flash');
  f.className = 'flash ' + (big ? 'show-big' : 'show');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => f.className = 'flash', big ? 190 : 120);
}
/* THE dopamine moment: arrow lands → freeze-frame, flash, shockwave,
   sparkles, feathers, floating winnings, drums of victory */
function celebrate(a){
  spawnSplatter(a.x, a.y, a.angle || 0, a.big ? 42 : 24);
  spawnSparks(a.x, a.y, a.big ? 32 : 16);
  spawnRings(a.x, a.y, a.big);
  flash(a.big);
  hitStopEnd = performance.now() + (a.big ? 200 : 110);
  shake(a.big ? 8 : 4);
  if (a.big) bigwin(`BIG HIT ${a.m.toFixed(2)}x`);
  hitsThisRound++;
  if (shotsRequired > 0 && hitsThisRound >= shotsRequired && phase === 'flying') birdDown();
}

/* feathers blast out along the bullet's direction, plus a hanging dust puff */
function spawnSplatter(x, y, angle, count){
  const COLORS = ['#f5e6c8', '#56505e', '#3b3644', '#f2b705'];
  for (let i = 0; i < count; i++){
    const a = angle + (Math.random() - 0.5) * 1.6;     // cone around impact direction
    const v = 90 + Math.random()*220;
    feathers.push({
      x, y,
      vx: Math.cos(a)*v + (Math.random()*40 - 20),
      vy: Math.sin(a)*v - 30,
      life: 0.7 + Math.random()*0.8,
      color: COLORS[(Math.random()*COLORS.length)|0],
      spin: Math.random()*Math.PI*2
    });
  }
  for (let i = 0; i < 5; i++)
    smoke.push({x: x + Math.random()*10 - 5, y: y + Math.random()*8 - 4,
                vx: Math.random()*24 - 12, vy: -6 - Math.random()*10,
                life: 0.5 + Math.random()*0.35, r: 3 + Math.random()*4});
}

function spawnFeathers(x, y, count){
  for (let i = 0; i < (count || 14); i++){
    const a = Math.random()*Math.PI*2, v = 60 + Math.random()*120;
    feathers.push({
      x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v - 56,
      life: 1.1 + Math.random()*0.5,
      color: Math.random() < 0.55 ? '#f2b705' : '#f5e6c8',
      spin: Math.random()*Math.PI*3
    });
  }
}

function spawnDeathFragments(x, y, count){
  for (let i = 0; i < count; i++){
    const a = Math.random()*Math.PI*2;
    const speed = 90 + Math.random()*120;
    deathFragments.push({
      x, y,
      vx: Math.cos(a)*speed * (0.8 + Math.random()*0.4),
      vy: Math.sin(a)*speed * (0.6 + Math.random()*0.5) - 30,
      life: 0.8 + Math.random()*0.7,
      size: 4 + Math.random()*6,
      spin: Math.random()*Math.PI*4,
      color: Math.random() < 0.5 ? '#f2b705' : '#f5e6c8'
    });
  }
}

function updateProjectiles(dt){
  for (const a of arrows){
    if (a.hit) continue;
    const dx = lastTip.x - a.x, dy = lastTip.y - a.y;
    const d = Math.hypot(dx, dy);
    a.angle = Math.atan2(dy, dx);
    const step = 2600 * dt;
    if (d <= step){
      a.x = lastTip.x; a.y = lastTip.y; a.hit = true;
      celebrate(a);
    } else {
      a.x += dx/d*step; a.y += dy/d*step;
    }
  }
  for (let i = feathers.length-1; i >= 0; i--){
    const f = feathers[i];
    f.life -= dt;
    if (f.life <= 0){ feathers.splice(i,1); continue; }
    f.x += f.vx*dt; f.y += f.vy*dt;
    f.vy += 110*dt; f.vx *= 0.986;
    f.spin += dt*5;
  }
  for (let i = deathFragments.length-1; i >= 0; i--){
    const f = deathFragments[i];
    f.life -= dt;
    if (f.life <= 0){ deathFragments.splice(i,1); continue; }
    f.x += f.vx*dt; f.y += f.vy*dt;
    f.vy += 140*dt;
    f.vx *= 0.96;
    f.vy *= 0.99;
    f.spin += dt*5;
  }
  for (let i = rings.length-1; i >= 0; i--){
    const r = rings[i]; r.life -= dt; r.r += r.vr*dt;
    if (r.life <= 0) rings.splice(i, 1);
  }
  for (let i = sparks.length-1; i >= 0; i--){
    const s = sparks[i]; s.life -= dt;
    s.x += s.vx*dt; s.y += s.vy*dt; s.vx *= 0.95; s.vy *= 0.95;
    if (s.life <= 0) sparks.splice(i, 1);
  }
  for (let i = trail.length-1; i >= 0; i--){
    const tr = trail[i]; tr.life -= dt;
    tr.x += tr.vx*dt; tr.y += tr.vy*dt;
    if (tr.life <= 0) trail.splice(i, 1);
  }
  for (let i = smoke.length-1; i >= 0; i--){
    const s = smoke[i]; s.life -= dt;
    s.x += s.vx*dt; s.y += s.vy*dt;
    s.vx *= 0.985; s.vy *= 0.985;
    if (s.life <= 0) smoke.splice(i, 1);
  }
  for (let i = gunSmoke.length-1; i >= 0; i--){
    const s = gunSmoke[i]; s.life -= dt;
    s.x += s.vx*dt; s.y += s.vy*dt;
    s.vx *= 0.985; s.vy *= 0.985;
    if (s.life <= 0) gunSmoke.splice(i, 1);
  }
  for (let i = gunFlashes.length - 1; i >= 0; i--){
    gunFlashes[i].life -= dt;
    if (gunFlashes[i].life <= 0) gunFlashes.splice(i, 1);
  }
}

function drawProjectiles(c){
  // golden dust trail behind the bird
  for (const tr of trail){
    const fade = Math.min(1, tr.life * 3);
    c.globalAlpha = fade * 0.45;
    c.fillStyle = '#f2b705';
    c.beginPath(); c.arc(tr.x, tr.y, tr.size * fade, 0, Math.PI*2); c.fill();
  }
  for (const s of smoke){
    c.globalAlpha = Math.min(0.5, s.life*0.7);
    c.fillStyle = '#cfc4e8';
    c.beginPath(); c.arc(s.x, s.y, s.r, 0, Math.PI*2); c.fill();
  }
  c.globalAlpha = 1;
  for (const frag of deathFragments){
    c.save();
    c.globalAlpha = Math.min(1, frag.life*1.4);
    c.translate(frag.x, frag.y); c.rotate(frag.spin);
    c.fillStyle = frag.color;
    c.beginPath();
    c.moveTo(0, -frag.size);
    c.lineTo(frag.size*0.6, frag.size);
    c.lineTo(-frag.size*0.6, frag.size);
    c.closePath();
    c.fill();
    c.restore();
  }
  for (const a of arrows){
    if (a.hit) continue;
    c.save();
    c.translate(a.x, a.y); c.rotate(a.angle);
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,220,120,.35)'; c.lineWidth = 7;
    c.beginPath(); c.moveTo(-26, 0); c.lineTo(4, 0); c.stroke();
    const tg = c.createLinearGradient(-26, 0, 6, 0);
    tg.addColorStop(0, 'rgba(255,220,120,0)');
    tg.addColorStop(1, '#ffe9a8');
    c.strokeStyle = tg; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-26, 0); c.lineTo(4, 0); c.stroke();
    c.fillStyle = '#fff7df';
    c.beginPath(); c.arc(4, 0, 2.4, 0, Math.PI*2); c.fill();
    c.restore();
  }
  for (const f of feathers){
    c.save();
    c.globalAlpha = Math.min(1, f.life);
    c.translate(f.x, f.y); c.rotate(f.spin);
    c.fillStyle = f.color;
    c.beginPath(); c.ellipse(0, 0, 4.5, 1.6, 0, 0, Math.PI*2); c.fill();
    c.restore();
  }
  // shockwave rings
  for (const r of rings){
    c.globalAlpha = 1;
    c.strokeStyle = r.color + Math.max(0, r.life*2) + ')';
    c.lineWidth = r.w;
    c.beginPath(); c.arc(r.x, r.y, r.r, 0, Math.PI*2); c.stroke();
  }
  // star sparkles
  for (const s of sparks){
    const a2 = Math.min(1, s.life*2.2), sz = s.size*Math.min(1, s.life*2);
    c.globalAlpha = a2;
    c.strokeStyle = '#ffe9a8'; c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(s.x - sz, s.y); c.lineTo(s.x + sz, s.y);
    c.moveTo(s.x, s.y - sz); c.lineTo(s.x, s.y + sz);
    c.stroke();
    c.fillStyle = '#f2b705';
    c.beginPath(); c.arc(s.x, s.y, sz*0.35, 0, Math.PI*2); c.fill();
  }
  c.globalAlpha = 1;
}

function drawVisualEffects(c, dt, options = {}){
  if (options.projectiles !== false){
    updateProjectiles(dt);
    drawProjectiles(c);
  }
  if (options.gunSmoke){
    drawGunSmoke(c);
  }
}
