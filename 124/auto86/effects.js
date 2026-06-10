const Effects = (() => {
  let particles = [];
  let ctx = null;
  let canvas = null;

  function init(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
  }

  function playEffect(spellId, centerX, centerY) {
    switch (spellId) {
      case 'fire':
        createFireEffect(centerX, centerY);
        break;
      case 'ice':
        createIceEffect(centerX, centerY);
        break;
      case 'heal':
        createHealEffect(centerX, centerY);
        break;
      case 'lightning':
        createLightningEffect(centerX, centerY);
        break;
    }
  }

  function createFireEffect(cx, cy) {
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      particles.push({
        type: 'fire',
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        life: 1,
        decay: 0.015 + Math.random() * 0.01,
        size: 5 + Math.random() * 10,
        color: getFireColor()
      });
    }
  }

  function getFireColor() {
    const colors = ['#ff4500', '#ff6600', '#ffcc00', '#ffff00', '#ff0000'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function createIceEffect(cx, cy) {
    const radius = Math.min(canvas.width, canvas.height) * 0.25;
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      particles.push({
        type: 'ice',
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        baseAngle: angle,
        baseRadius: radius,
        life: 1,
        decay: 0.01,
        size: 4 + Math.random() * 6,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1
      });
    }
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      particles.push({
        type: 'snow',
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.5 - Math.random() * 0.5,
        life: 1,
        decay: 0.008,
        size: 2 + Math.random() * 3
      });
    }
  }

  function createHealEffect(cx, cy) {
    for (let ring = 0; ring < 5; ring++) {
      setTimeout(() => {
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2 + ring * 0.2;
          particles.push({
            type: 'heal',
            x: cx,
            y: cy,
            angle: angle,
            speed: 1 + ring * 0.5,
            maxDist: 100 + ring * 30,
            life: 1,
            decay: 0.012,
            size: 3 + ring
          });
        }
      }, ring * 150);
    }
  }

  function createLightningEffect(cx, cy) {
    const arcs = 5;
    for (let arc = 0; arc < arcs; arc++) {
      setTimeout(() => {
        createLightningArc(cx, cy, arc, arcs);
      }, arc * 200);
    }
  }

  function createLightningArc(cx, cy, arcIndex, totalArcs) {
    let currentX = cx;
    let currentY = cy;
    const targetAngle = (arcIndex / totalArcs) * Math.PI * 2;
    const segments = 8;

    for (let i = 0; i < segments; i++) {
      const dist = 30 + Math.random() * 40;
      const angle = targetAngle + (Math.random() - 0.5) * 0.5;
      const nextX = currentX + Math.cos(angle) * dist;
      const nextY = currentY + Math.sin(angle) * dist;

      particles.push({
        type: 'lightning',
        x1: currentX,
        y1: currentY,
        x2: nextX,
        y2: nextY,
        life: 1,
        decay: 0.03,
        width: 3 - i * 0.2
      });

      if (Math.random() > 0.5) {
        const branchAngle = angle + (Math.random() > 0.5 ? 0.5 : -0.5);
        const branchX = nextX + Math.cos(branchAngle) * 20;
        const branchY = nextY + Math.sin(branchAngle) * 20;
        particles.push({
          type: 'lightning',
          x1: nextX,
          y1: nextY,
          x2: branchX,
          y2: branchY,
          life: 1,
          decay: 0.04,
          width: 1.5
        });
      }

      currentX = nextX;
      currentY = nextY;
    }
  }

  function update() {
    particles = particles.filter(p => {
      p.life -= p.decay;
      if (p.life <= 0) return false;

      switch (p.type) {
        case 'fire':
          p.x += p.vx;
          p.y += p.vy;
          p.vy -= 0.1;
          p.size *= 0.98;
          break;
        case 'ice':
          p.rotation += p.rotationSpeed;
          const newAngle = p.baseAngle + p.rotation;
          const pulseRadius = p.baseRadius * (1 + Math.sin(p.life * 10) * 0.1);
          p.x = canvas.width / 2 + Math.cos(newAngle) * pulseRadius;
          p.y = canvas.height / 2 + Math.sin(newAngle) * pulseRadius;
          break;
        case 'snow':
          p.x += p.vx + Math.sin(p.life * 20) * 0.5;
          p.y += p.vy;
          break;
        case 'heal':
          const dist = (1 - p.life) * p.maxDist;
          p.x = canvas.width / 2 + Math.cos(p.angle) * dist;
          p.y = canvas.height / 2 + Math.sin(p.angle) * dist;
          break;
      }
      return true;
    });
  }

  function render() {
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;

      switch (p.type) {
        case 'fire':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 15;
          break;
        case 'ice':
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          drawIceCrystal(ctx, p.size);
          break;
        case 'snow':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          break;
        case 'heal':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = '#ffd700';
          ctx.fill();
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 10;
          break;
        case 'lightning':
          ctx.beginPath();
          ctx.moveTo(p.x1, p.y1);
          ctx.lineTo(p.x2, p.y2);
          ctx.strokeStyle = '#9400d3';
          ctx.lineWidth = p.width;
          ctx.shadowColor = '#9400d3';
          ctx.shadowBlur = 20;
          ctx.stroke();
          break;
      }
      ctx.restore();
    });
  }

  function drawIceCrystal(ctx, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#00bfff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 191, 255, 0.3)';
    ctx.fill();
  }

  function isActive() {
    return particles.length > 0;
  }

  function clear() {
    particles = [];
  }

  return {
    init,
    playEffect,
    update,
    render,
    isActive,
    clear
  };
})();
