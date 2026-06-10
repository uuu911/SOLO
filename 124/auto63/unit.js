const UNIT_TYPES = {
    INFANTRY: {
        type: 'infantry',
        name: '步兵',
        maxHp: 100,
        attack: 30,
        defense: 20,
        movePoints: 4,
        attackRange: 1,
        color: '#3498db',
        symbol: '步'
    },
    TANK: {
        type: 'tank',
        name: '坦克',
        maxHp: 150,
        attack: 50,
        defense: 40,
        movePoints: 5,
        attackRange: 2,
        color: '#e74c3c',
        symbol: '坦'
    },
    ARTILLERY: {
        type: 'artillery',
        name: '自行火炮',
        maxHp: 80,
        attack: 70,
        defense: 10,
        movePoints: 3,
        attackRange: 4,
        color: '#9b59b6',
        symbol: '炮'
    }
};

class Unit {
    constructor(unitType, x, y, isEnemy = false, id = null) {
        const template = UNIT_TYPES[unitType];
        this.id = id || Math.random().toString(36).substr(2, 9);
        this.type = template.type;
        this.name = template.name;
        this.maxHp = template.maxHp;
        this.hp = template.maxHp;
        this.attack = template.attack;
        this.defense = template.defense;
        this.movePoints = template.movePoints;
        this.remainingMoves = template.movePoints;
        this.attackRange = template.attackRange;
        this.color = template.color;
        this.symbol = template.symbol;
        this.x = x;
        this.y = y;
        this.isEnemy = isEnemy;
        this.isAlive = true;
        this.hasMoved = false;
        this.hasAttacked = false;
        this.isDying = false;
        this.deathAnimationFrame = 0;
    }

    takeDamage(damage) {
        this.hp = Math.max(0, this.hp - damage);
        if (this.hp <= 0) {
            this.isAlive = false;
            this.isDying = true;
        }
        return this.hp <= 0;
    }

    resetTurn() {
        this.remainingMoves = this.movePoints;
        this.hasMoved = false;
        this.hasAttacked = false;
    }

    move(newX, newY, pathCost) {
        this.x = newX;
        this.y = newY;
        this.remainingMoves -= pathCost;
        this.hasMoved = true;
    }

    canMove() {
        return this.isAlive && !this.hasMoved && this.remainingMoves > 0;
    }

    canAttack() {
        return this.isAlive && !this.hasAttacked;
    }

    isInRange(targetX, targetY, gameMap) {
        const distance = gameMap.getDistance(this.x, this.y, targetX, targetY);
        return distance <= this.attackRange && distance > 0;
    }

    render(ctx, cellSize, isSelected = false) {
        const px = this.x * cellSize + cellSize / 2;
        const py = this.y * cellSize + cellSize / 2;
        const radius = cellSize * 0.35;

        if (this.isDying) {
            this.deathAnimationFrame++;
            const alpha = 1 - (this.deathAnimationFrame / 30);
            if (alpha <= 0) {
                return false;
            }
            ctx.globalAlpha = alpha;
            const shake = Math.sin(this.deathAnimationFrame * 0.5) * 3;
            this._drawUnit(ctx, px + shake, py, radius, cellSize, isSelected);
            ctx.globalAlpha = 1;
            return true;
        }

        this._drawUnit(ctx, px, py, radius, cellSize, isSelected);
        return true;
    }

    _drawUnit(ctx, px, py, radius, cellSize, isSelected) {
        const borderColor = this.isEnemy ? '#c0392b' : '#27ae60';
        const fillColor = this.color;

        if (isSelected) {
            ctx.shadowColor = '#f1c40f';
            ctx.shadowBlur = 15;
        }

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.shadowBlur = 0;

        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, px, py);

        const hpBarWidth = radius * 1.5;
        const hpBarHeight = 4;
        const hpBarX = px - hpBarWidth / 2;
        const hpBarY = py + radius + 6;

        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = hpPercent > 0.5 ? '#27ae60' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);

        if (!this.hasMoved && !this.hasAttacked) {
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.fillText('●', px - radius + 5, py - radius + 5);
        }
    }

    getInfo() {
        return {
            name: this.name,
            team: this.isEnemy ? '敌方' : '我方',
            hp: this.hp,
            maxHp: this.maxHp,
            attack: this.attack,
            defense: this.defense,
            movePoints: this.movePoints,
            remainingMoves: this.remainingMoves,
            attackRange: this.attackRange,
            position: `(${this.x}, ${this.y})`,
            hasMoved: this.hasMoved,
            hasAttacked: this.hasAttacked
        };
    }
}

function createInitialUnits() {
    const units = [];
    let idCounter = 0;

    units.push(new Unit('INFANTRY', 1, 8, false, `player_${idCounter++}`));
    units.push(new Unit('INFANTRY', 3, 9, false, `player_${idCounter++}`));
    units.push(new Unit('TANK', 5, 9, false, `player_${idCounter++}`));
    units.push(new Unit('TANK', 7, 8, false, `player_${idCounter++}`));
    units.push(new Unit('ARTILLERY', 0, 9, false, `player_${idCounter++}`));
    units.push(new Unit('ARTILLERY', 9, 9, false, `player_${idCounter++}`));

    units.push(new Unit('INFANTRY', 1, 1, true, `enemy_${idCounter++}`));
    units.push(new Unit('INFANTRY', 3, 0, true, `enemy_${idCounter++}`));
    units.push(new Unit('INFANTRY', 6, 1, true, `enemy_${idCounter++}`));
    units.push(new Unit('TANK', 5, 0, true, `enemy_${idCounter++}`));
    units.push(new Unit('TANK', 8, 1, true, `enemy_${idCounter++}`));
    units.push(new Unit('ARTILLERY', 0, 0, true, `enemy_${idCounter++}`));
    units.push(new Unit('ARTILLERY', 9, 0, true, `enemy_${idCounter++}`));

    return units;
}

export { Unit, UNIT_TYPES, createInitialUnits };