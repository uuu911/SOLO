const Drawing = (() => {
  let canvas, ctx, bgCanvas, bgCtx;
  let isDrawing = false;
  let currentStroke = [];
  let strokeHistory = [];
  let recognizeTimeout = null;
  let onStrokeComplete = null;
  let canUndo = true;
  let bgRotation = 0;
  let bgParticles = [];

  function init(canvasElement, callback) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    onStrokeComplete = callback;

    createBackgroundCanvas();
    resizeCanvas();
    initBackgroundParticles();
    bindEvents();
    animateBackground();
  }

  function createBackgroundCanvas() {
    bgCanvas = document.createElement('canvas');
    bgCtx = bgCanvas.getContext('2d');
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
  }

  function initBackgroundParticles() {
    bgParticles = [];
    for (let i = 0; i < 50; i++) {
      bgParticles.push({
        x: Math.random(),
        y: Math.random(),
        speed: 0.001 + Math.random() * 0.002,
        direction: Math.random() > 0.5 ? 1 : -1,
        size: 1 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.4
      });
    }
  }

  function bindEvents() {
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('mouseleave', endDrawing);

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    window.addEventListener('resize', resizeCanvas);
  }

  function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    startDrawing({ clientX: touch.clientX, clientY: touch.clientY });
  }

  function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    draw({ clientX: touch.clientX, clientY: touch.clientY });
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    endDrawing();
  }

  function startDrawing(e) {
    if (!canUndo) return;
    isDrawing = true;
    clearRecognizeTimeout();
    const point = getPoint(e);
    currentStroke = [point];
  }

  function draw(e) {
    if (!isDrawing) return;
    const point = getPoint(e);
    if (currentStroke.length > 0) {
      const last = currentStroke[currentStroke.length - 1];
      const dist = Math.hypot(point.x - last.x, point.y - last.y);
      if (dist > 3) {
        const smoothedPoint = smoothPoint(point, last);
        currentStroke.push(smoothedPoint);
      }
    }
  }

  function endDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    if (currentStroke.length > 5) {
      strokeHistory.push([...currentStroke]);
      if (strokeHistory.length > 3) {
        strokeHistory.shift();
      }
      startRecognizeTimeout();
    }
    currentStroke = [];
  }

  function getPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function smoothPoint(point, lastPoint) {
    const smoothing = 0.3;
    return {
      x: lastPoint.x + (point.x - lastPoint.x) * smoothing,
      y: lastPoint.y + (point.y - lastPoint.y) * smoothing
    };
  }

  function startRecognizeTimeout() {
    clearRecognizeTimeout();
    recognizeTimeout = setTimeout(() => {
      if (onStrokeComplete && strokeHistory.length > 0) {
        const allPoints = strokeHistory.flat();
        onStrokeComplete(allPoints);
      }
    }, 500);
  }

  function clearRecognizeTimeout() {
    if (recognizeTimeout) {
      clearTimeout(recognizeTimeout);
      recognizeTimeout = null;
    }
  }

  function undo() {
    if (!canUndo || strokeHistory.length === 0) return false;
    strokeHistory.pop();
    clearRecognizeTimeout();
    return true;
  }

  function clearStrokes() {
    strokeHistory = [];
    currentStroke = [];
    clearRecognizeTimeout();
  }

  function setCanUndo(enabled) {
    canUndo = enabled;
  }

  function getStrokes() {
    return [...strokeHistory];
  }

  function animateBackground() {
    bgRotation += 0.002;
    bgParticles.forEach(p => {
      p.y += p.speed * p.direction;
      if (p.y < 0 || p.y > 1) {
        p.direction *= -1;
      }
    });
    requestAnimationFrame(animateBackground);
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMagicCircle();
    drawStrokes();
  }

  function drawMagicCircle() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.35;

    bgCtx.save();
    bgCtx.translate(cx, cy);
    bgCtx.rotate(bgRotation);

    for (let i = 3; i >= 0; i--) {
      const radius = maxRadius * (0.3 + i * 0.18);
      const alpha = 0.15 + i * 0.05;
      
      bgCtx.beginPath();
      bgCtx.arc(0, 0, radius, 0, Math.PI * 2);
      bgCtx.strokeStyle = `rgba(138, 43, 226, ${alpha})`;
      bgCtx.lineWidth = 2;
      bgCtx.stroke();

      drawRunesOnCircle(bgCtx, radius, i);
    }

    bgCtx.restore();

    bgParticles.forEach(p => {
      const px = p.x * canvas.width;
      const py = p.y * canvas.height;
      bgCtx.beginPath();
      bgCtx.arc(px, py, p.size, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(200, 150, 255, ${p.opacity})`;
      bgCtx.fill();
    });

    ctx.drawImage(bgCanvas, 0, 0);
  }

  function drawRunesOnCircle(ctx, radius, index) {
    const runeCount = 8 + index * 4;
    ctx.save();
    for (let i = 0; i < runeCount; i++) {
      const angle = (i / runeCount) * Math.PI * 2;
      const rx = Math.cos(angle) * radius;
      const ry = Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.arc(rx, ry, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200, 100, 255, 0.4)';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStrokes() {
    const allStrokes = [...strokeHistory, currentStroke];
    allStrokes.forEach(stroke => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });
  }

  function getCanvas() {
    return canvas;
  }

  function getContext() {
    return ctx;
  }

  return {
    init,
    render,
    undo,
    clearStrokes,
    setCanUndo,
    getStrokes,
    getCanvas,
    getContext
  };
})();
