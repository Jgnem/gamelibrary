function fire(p, m){
  m = Math.floor(m * 100) / 100;
  roundPeakFiredM = Math.max(roundPeakFiredM, m);
  const win = safeMul(p.stake, m);
  roundWin += win;
  balance += win;
  p.state = 'done'; p.result = `Hit ${m.toFixed(2)}x · +${fmt(win)}`;
  toast(`Barrel ${p.n}: hit at ${m.toFixed(2)}x → +${fmt(win)} FUN`);
  const muzzle = hunterMuzzle(lastAim);
  const mx = muzzle.x;
  const my = muzzle.y;
  arrows.push({x: mx, y: my, hit: false, big: m >= 5, m, win});
  gunFlashes.push({x: mx, y: my, angle: lastAim, life: 0.11, maxLife: 0.11});
  spawnGunSmoke(mx, my, lastAim);
  p.stake = 0;
  renderUI();
}
