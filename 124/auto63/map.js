const TERRAIN_TYPES = {
    PLAIN: { id: 0, name: '平地', color: '#a8e6cf', moveCost: 1, defenseBonus: 0, passable: { infantry: true, tank: true, artillery: true } },
    FOREST: { id: 1, name: '树林', color: '#2d5a27', moveCost: 2, defenseBonus: 2, passable: { infantry: true, tank: true, artillery: true } },
    HILL: { id: 2, name: '丘陵', color: '#8b7355', moveCost: 2, defenseBonus: 3, passable: { infantry: true, tank: true, artillery: true } },
    RIVER: { id: 3, name: '河流', color: '#5dade2', moveCost: 3, defenseBonus: -1, passable: { infantry: true, tank: false, artillery: false } },
    CITY: { id: 4, name: '城市', color: '#95a5a6', moveCost: 1, defenseBonus: 4, passable: { infantry: true, tank: true, artillery: true } }
};

class GameMap {
    constructor(width = 10, height = 10, cellSize = 60) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.terrain = [];
        this.generateTerrain();
    }

    generateTerrain() {
        this.terrain = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                let terrainType;
                
                if (y === 4 || y === 5) {
                    if (x === 2 || x === 7) {
                        terrainType = TERRAIN_TYPES.RIVER;
                    } else if (x === 4 || x === 5) {
                        terrainType = TERRAIN_TYPES.CITY;
                    } else {
                        terrainType = TERRAIN_TYPES.PLAIN;
                    }
                } else if ((y === 2 && x === 3) || (y === 7 && x === 6)) {
                    terrainType = TERRAIN_TYPES.HILL;
                } else if ((y === 1 && x === 1) || (y === 8 && x === 8) || (y === 3 && x === 6) || (y === 6 && x === 3)) {
                    terrainType = TERRAIN_TYPES.FOREST;
                } else {
                    terrainType = TERRAIN_TYPES.PLAIN;
                }
                
                row.push(terrainType);
            }
            this.terrain.push(row);
        }
    }

    getTerrain(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.terrain[y][x];
    }

    getMoveCost(x, y, unitType) {
        const terrain = this.getTerrain(x, y);
        if (!terrain) return Infinity;
        if (!terrain.passable[unitType]) return Infinity;
        return terrain.moveCost;
    }

    getDefenseBonus(x, y) {
        const terrain = this.getTerrain(x, y);
        return terrain ? terrain.defenseBonus : 0;
    }

    render(ctx) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const terrain = this.terrain[y][x];
                const px = x * this.cellSize;
                const py = y * this.cellSize;

                ctx.fillStyle = terrain.color;
                ctx.fillRect(px, py, this.cellSize, this.cellSize);

                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, this.cellSize, this.cellSize);

                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.font = '10px Arial';
                ctx.fillText(`${x},${y}`, px + 4, py + 12);
            }
        }
    }

    highlightCell(ctx, x, y, color, alpha = 0.4) {
        const px = x * this.cellSize;
        const py = y * this.cellSize;
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(px, py, this.cellSize, this.cellSize);
        ctx.globalAlpha = 1;
    }

    getCellCoordinates(clientX, clientY, canvasRect) {
        const x = Math.floor((clientX - canvasRect.left) / this.cellSize);
        const y = Math.floor((clientY - canvasRect.top) / this.cellSize);
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return { x, y };
        }
        return null;
    }

    getDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    findPath(startX, startY, endX, endY, unitType, units) {
        const openSet = [{ x: startX, y: startY, g: 0, h: 0, f: 0, parent: null }];
        const closedSet = new Set();
        
        const heuristic = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);
        
        while (openSet.length > 0) {
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            
            if (current.x === endX && current.y === endY) {
                const path = [];
                let node = current;
                while (node) {
                    path.unshift({ x: node.x, y: node.y });
                    node = node.parent;
                }
                return path;
            }
            
            closedSet.add(`${current.x},${current.y}`);
            
            const neighbors = [
                { x: current.x - 1, y: current.y },
                { x: current.x + 1, y: current.y },
                { x: current.x, y: current.y - 1 },
                { x: current.x, y: current.y + 1 }
            ];
            
            for (const neighbor of neighbors) {
                if (neighbor.x < 0 || neighbor.x >= this.width || neighbor.y < 0 || neighbor.y >= this.height) continue;
                if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;
                
                const hasUnit = units.some(u => u.x === neighbor.x && u.y === neighbor.y && u.isAlive);
                if (hasUnit && !(neighbor.x === endX && neighbor.y === endY)) continue;
                
                const moveCost = this.getMoveCost(neighbor.x, neighbor.y, unitType);
                if (moveCost === Infinity) continue;
                
                const g = current.g + moveCost;
                const h = heuristic(neighbor.x, neighbor.y, endX, endY);
                const f = g + h;
                
                const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
                if (existingNode) {
                    if (g < existingNode.g) {
                        existingNode.g = g;
                        existingNode.f = f;
                        existingNode.parent = current;
                    }
                } else {
                    openSet.push({ x: neighbor.x, y: neighbor.y, g, h, f, parent: current });
                }
            }
        }
        
        return null;
    }

    getReachableCells(startX, startY, movePoints, unitType, units) {
        const reachable = [];
        const visited = new Set();
        const queue = [{ x: startX, y: startY, cost: 0 }];
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            const current = queue.shift();
            
            if (current.cost > 0) {
                reachable.push({ x: current.x, y: current.y, cost: current.cost });
            }

            const neighbors = [
                { x: current.x - 1, y: current.y },
                { x: current.x + 1, y: current.y },
                { x: current.x, y: current.y - 1 },
                { x: current.x, y: current.y + 1 }
            ];

            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                if (visited.has(key)) continue;
                if (neighbor.x < 0 || neighbor.x >= this.width || neighbor.y < 0 || neighbor.y >= this.height) continue;

                const hasUnit = units.some(u => u.x === neighbor.x && u.y === neighbor.y && u.isAlive);
                if (hasUnit) continue;

                const moveCost = this.getMoveCost(neighbor.x, neighbor.y, unitType);
                if (moveCost === Infinity) continue;

                const totalCost = current.cost + moveCost;
                if (totalCost <= movePoints) {
                    visited.add(key);
                    queue.push({ x: neighbor.x, y: neighbor.y, cost: totalCost });
                }
            }
        }

        return reachable;
    }
}

export { GameMap, TERRAIN_TYPES };