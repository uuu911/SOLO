const Game = {
  state: {
    currentLevel: 1,
    grid: [],
    gridSize: 6,
    numColors: 4,
    maxSteps: 15,
    steps: 0,
    history: [],
    connectedRegion: new Set(),
    isMuted: false,
    isWon: false
  },

  colorPalette: [
    '#E74C3C',
    '#3498DB',
    '#2ECC71',
    '#F1C40F',
    '#9B59B6',
    '#E67E22'
  ],

  init(levelId = 1) {
    const level = Levels.getLevel(levelId);
    this.state.currentLevel = levelId;
    this.state.gridSize = level.size;
    this.state.numColors = level.colors;
    this.state.maxSteps = level.maxSteps;
    this.state.steps = 0;
    this.state.history = [];
    this.state.isWon = false;
    
    if (level.layout) {
      this.state.grid = JSON.parse(JSON.stringify(level.layout));
    } else {
      this.state.grid = Levels.generateLayout(level.size, level.colors);
    }
    
    this.updateConnectedRegion();
  },

  getConnectedRegion(startRow = 0, startCol = 0, targetColor = null) {
    const region = new Set();
    const grid = this.state.grid;
    const size = this.state.gridSize;
    const startColor = targetColor !== null ? targetColor : grid[startRow][startCol];
    
    const queue = [[startRow, startCol]];
    const visited = new Set();
    const key = (r, c) => `${r},${c}`;
    
    while (queue.length > 0) {
      const [row, col] = queue.shift();
      const k = key(row, col);
      
      if (visited.has(k)) continue;
      if (row < 0 || row >= size || col < 0 || col >= size) continue;
      if (grid[row][col] !== startColor) continue;
      
      visited.add(k);
      region.add(k);
      
      queue.push([row - 1, col]);
      queue.push([row + 1, col]);
      queue.push([row, col - 1]);
      queue.push([row, col + 1]);
    }
    
    return region;
  },

  updateConnectedRegion() {
    this.state.connectedRegion = this.getConnectedRegion();
  },

  flood(colorIndex) {
    if (this.state.isWon) return null;
    if (this.state.steps >= this.state.maxSteps) return null;
    
    const currentColor = this.state.grid[0][0];
    if (colorIndex === currentColor) return null;
    
    this.saveHistory();
    
    const region = this.state.connectedRegion;
    const newCells = [];
    
    region.forEach(key => {
      const [row, col] = key.split(',').map(Number);
      this.state.grid[row][col] = colorIndex;
    });
    
    this.updateConnectedRegion();
    
    region.forEach(key => {
      const [row, col] = key.split(',').map(Number);
      const neighbors = [
        [row - 1, col], [row + 1, col],
        [row, col - 1], [row, col + 1]
      ];
      neighbors.forEach(([nr, nc]) => {
        if (nr >= 0 && nr < this.state.gridSize && 
            nc >= 0 && nc < this.state.gridSize) {
          const nkey = `${nr},${nc}`;
          if (!region.has(nkey) && this.state.grid[nr][nc] === colorIndex) {
            newCells.push(nkey);
          }
        }
      });
    });
    
    this.state.steps++;
    
    const won = this.checkWin();
    if (won) {
      this.state.isWon = true;
    }
    
    return {
      newCells,
      won,
      perfect: won && this.state.steps <= this.state.maxSteps
    };
  },

  checkWin() {
    const firstColor = this.state.grid[0][0];
    for (let row = 0; row < this.state.gridSize; row++) {
      for (let col = 0; col < this.state.gridSize; col++) {
        if (this.state.grid[row][col] !== firstColor) {
          return false;
        }
      }
    }
    return true;
  },

  saveHistory() {
    if (this.state.history.length >= 3) {
      this.state.history.shift();
    }
    this.state.history.push({
      grid: JSON.parse(JSON.stringify(this.state.grid)),
      steps: this.state.steps
    });
  },

  undo() {
    if (this.state.history.length === 0) return false;
    
    const prevState = this.state.history.pop();
    this.state.grid = prevState.grid;
    this.state.steps = prevState.steps;
    this.state.isWon = false;
    this.updateConnectedRegion();
    
    return true;
  },

  reset() {
    this.init(this.state.currentLevel);
  },

  getHint() {
    const currentColor = this.state.grid[0][0];
    const colorCounts = {};
    
    for (let i = 0; i < this.state.numColors; i++) {
      if (i === currentColor) continue;
      colorCounts[i] = 0;
      
      const tempGrid = JSON.parse(JSON.stringify(this.state.grid));
      this.state.connectedRegion.forEach(key => {
        const [row, col] = key.split(',').map(Number);
        tempGrid[row][col] = i;
      });
      
      const tempRegion = this.getConnectedRegion(0, 0, i);
      colorCounts[i] = tempRegion.size;
    }
    
    let bestColor = -1;
    let maxCount = -1;
    
    for (const [color, count] of Object.entries(colorCounts)) {
      if (count > maxCount) {
        maxCount = count;
        bestColor = parseInt(color);
      }
    }
    
    return bestColor;
  },

  getState() {
    return { ...this.state };
  },

  getColor(index) {
    return this.colorPalette[index];
  },

  toggleMute() {
    this.state.isMuted = !this.state.isMuted;
    return this.state.isMuted;
  }
};
