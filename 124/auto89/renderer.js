const Renderer = {
  canvas: null,
  ctx: null,
  cellSize: 0,
  padding: 10,
  animatingCells: new Map(),
  animationFrame: null,

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    const container = this.canvas.parentElement;
    const maxWidth = Math.min(container.clientWidth - 20, 500);
    const size = maxWidth;
    
    this.canvas.width = size;
    this.canvas.height = size;
    
    const state = Game.getState();
    this.cellSize = (size - this.padding * 2) / state.gridSize;
    
    this.render();
  },

  render() {
    const state = Game.getState();
    const ctx = this.ctx;
    const size = this.canvas.width;
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);
    
    for (let row = 0; row < state.gridSize; row++) {
      for (let col = 0; col < state.gridSize; col++) {
        const colorIndex = state.grid[row][col];
        const x = this.padding + col * this.cellSize;
        const y = this.padding + row * this.cellSize;
        const key = `${row},${col}`;
        
        let scale = 1;
        if (this.animatingCells.has(key)) {
          scale = this.animatingCells.get(key);
        }
        
        const cellPadding = 2;
        const actualSize = (this.cellSize - cellPadding * 2) * scale;
        const offset = (this.cellSize - actualSize) / 2;
        
        ctx.fillStyle = Game.getColor(colorIndex);
        ctx.beginPath();
        ctx.roundRect(
          x + offset,
          y + offset,
          actualSize,
          actualSize,
          4
        );
        ctx.fill();
      }
    }
  },

  animateNewCells(cells) {
    this.animatingCells.clear();
    cells.forEach(key => {
      this.animatingCells.set(key, 0.5);
    });
    
    const animate = () => {
      let allDone = true;
      this.animatingCells.forEach((scale, key) => {
        if (scale < 1) {
          const newScale = Math.min(scale + 0.08, 1);
          this.animatingCells.set(key, newScale);
          allDone = false;
        }
      });
      
      this.render();
      
      if (!allDone) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.animatingCells.clear();
      }
    };
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    animate();
  },

  highlightHint(colorIndex) {
    const buttons = document.querySelectorAll('.color-btn');
    buttons.forEach((btn, index) => {
      if (index === colorIndex) {
        btn.style.transform = 'scale(1.2)';
        btn.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
        setTimeout(() => {
          btn.style.transform = '';
          btn.style.boxShadow = '';
        }, 1500);
      }
    });
  }
};
