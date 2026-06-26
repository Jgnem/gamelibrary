function spawnGunSmoke(x, y, angle){
  for (let i = 0; i < 16; i++){
    const life = 0.8 + Math.random() * 0.7;
    gunSmoke.push({
      x,
      y,
      vx: Math.cos(angle) * (18 + Math.random() * 22)
        + (Math.random() * 20 - 10),
      vy: Math.sin(angle) * (12 + Math.random() * 16)
        - 20 - Math.random() * 18,
      life,
      maxLife: life,
      r: 4 + Math.random() * 7
    });
  }
}

function drawGunSmoke(c){
  for (const flash of gunFlashes){
    const alpha = Math.max(0, flash.life / flash.maxLife);
    c.save();
    c.translate(flash.x, flash.y);
    c.rotate(flash.angle);
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = alpha;
    const glow = c.createRadialGradient(0, 0, 0, 0, 0, 18);
    glow.addColorStop(0, 'rgba(255,255,225,1)');
    glow.addColorStop(0.35, 'rgba(255,205,75,0.9)');
    glow.addColorStop(1, 'rgba(255,115,25,0)');
    c.fillStyle = glow;
    c.beginPath();
    c.arc(0, 0, 18, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = `rgba(255,235,150,${alpha})`;
    c.beginPath();
    c.moveTo(0, -4);
    c.lineTo(28, 0);
    c.lineTo(0, 4);
    c.closePath();
    c.fill();
    c.restore();
  }

  for (const s of gunSmoke){
    const alpha = Math.max(0, s.life / Math.max(0.001, s.maxLife));
    c.save();
    c.globalAlpha = alpha * 0.32;
    c.fillStyle = '#d8d2c4';
    c.shadowColor = 'rgba(245,238,218,0.2)';
    c.shadowBlur = 5;
    c.beginPath();
    c.arc(s.x, s.y, s.r * (1 + (1 - alpha) * 1.9), 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}
