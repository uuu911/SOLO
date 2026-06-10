class Unit implements ICommandable {
    id: string;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    speed: number;
    maxSpeed: number;
    health: number;
    maxHealth: number;
    attack: number;
    attackCooldown: number;
    lastAttackTime: number;
    isSelected: boolean;
    isEnemy: boolean;
    radius: number;
    angle: number;
    angularVelocity: number;
    velocityX: number;
    velocityY: number;
    acceleration: number;
    isMoving: boolean;
    isAttacking: boolean;
    attackTarget: ICommandable | null;
    formationOffsetX: number;
    formationOffsetY: number;
    unitType: string;
    separationForce: number;

    constructor(x: number, y: number, isEnemy: boolean, unitType: string) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.maxSpeed = 2 + Math.random() * 2;
        this.speed = 0;
        this.maxHealth = 50 + Math.random() * 50;
        this.health = this.maxHealth;
        this.attack = 10;
        this.attackCooldown = 1000;
        this.lastAttackTime = 0;
        this.isSelected = false;
        this.isEnemy = isEnemy;
        this.radius = 10;
        this.angle = Math.random() * Math.PI * 2;
        this.angularVelocity = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.acceleration = 0.5;
        this.isMoving = false;
        this.isAttacking = false;
        this.attackTarget = null;
        this.formationOffsetX = 0;
        this.formationOffsetY = 0;
        this.unitType = unitType;
        this.separationForce = 0.3;
    }

    moveTo(x: number, y: number): void {
        this.targetX = x;
        this.targetY = y;
        this.isMoving = true;
        this.isAttacking = false;
        this.attackTarget = null;
    }

    stop(): void {
        this.targetX = this.x;
        this.targetY = this.y;
        this.isMoving = false;
        this.isAttacking = false;
        this.attackTarget = null;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 0;
    }

    attackTarget(target: ICommandable): void {
        this.attackTarget = target;
        this.isAttacking = true;
        this.isMoving = true;
    }

    takeDamage(damage: number): void {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }

    update(deltaTime: number, allUnits: ICommandable[]): void {
        if (this.health <= 0) return;

        if (this.attackTarget && this.attackTarget.health > 0) {
            this.targetX = this.attackTarget.x;
            this.targetY = this.attackTarget.y;
        } else if (this.attackTarget && this.attackTarget.health <= 0) {
            this.attackTarget = null;
            this.isAttacking = false;
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1) {
            const targetAngle = Math.atan2(dy, dx);
            let angleDiff = targetAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.angle += angleDiff * 0.1;

            const targetSpeed = Math.min(this.maxSpeed, dist * 0.1);
            if (this.speed < targetSpeed) {
                this.speed = Math.min(this.speed + this.acceleration, targetSpeed);
            } else {
                this.speed = Math.max(this.speed - this.acceleration * 0.5, targetSpeed);
            }

            this.velocityX = Math.cos(this.angle) * this.speed;
            this.velocityY = Math.sin(this.angle) * this.speed;

            this.x += this.velocityX;
            this.y += this.velocityY;

            this.applySeparation(allUnits);
        } else {
            this.speed *= 0.9;
            if (this.speed < 0.1) {
                this.speed = 0;
                this.isMoving = false;
            }
        }

        if (this.attackTarget && this.attackTarget.health > 0) {
            const attackDist = Math.sqrt(
                Math.pow(this.attackTarget.x - this.x, 2) + 
                Math.pow(this.attackTarget.y - this.y, 2)
            );
            if (attackDist < this.radius + this.attackTarget.radius + 20) {
                const now = Date.now();
                if (now - this.lastAttackTime > this.attackCooldown) {
                    this.attackTarget.takeDamage(this.attack);
                    this.lastAttackTime = now;
                }
            }
        }
    }

    private applySeparation(allUnits: ICommandable[]): void {
        let sepX = 0;
        let sepY = 0;
        let count = 0;

        for (const unit of allUnits) {
            if (unit.id === this.id || unit.health <= 0) continue;
            const dx = this.x - unit.x;
            const dy = this.y - unit.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = this.radius + unit.radius + 5;
            
            if (dist < minDist && dist > 0) {
                const force = (minDist - dist) / dist * this.separationForce;
                sepX += dx * force;
                sepY += dy * force;
                count++;
            }
        }

        if (count > 0) {
            this.x += sepX;
            this.y += sepY;
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.health <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (this.isSelected) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isEnemy ? '#ff4444' : '#4488ff';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(this.radius + 8, 0);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        const healthBarWidth = this.radius * 2;
        const healthBarHeight = 4;
        const healthPercent = this.health / this.maxHealth;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.radius - 12, healthBarWidth, healthBarHeight);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(this.x - healthBarWidth / 2, this.y - this.radius - 12, healthBarWidth * healthPercent, healthBarHeight);
    }
}

class SelectionManager implements ISelectionManager {
    selectedUnits: ICommandable[];
    isSelecting: boolean;
    selectionStartX: number;
    selectionStartY: number;
    selectionEndX: number;
    selectionEndY: number;
    private isShiftPressed: boolean;
    private previousSelection: Set<string>;

    constructor() {
        this.selectedUnits = [];
        this.isSelecting = false;
        this.selectionStartX = 0;
        this.selectionStartY = 0;
        this.selectionEndX = 0;
        this.selectionEndY = 0;
        this.isShiftPressed = false;
        this.previousSelection = new Set();
    }

    startSelection(x: number, y: number, isShiftPressed: boolean): void {
        this.isSelecting = true;
        this.selectionStartX = x;
        this.selectionStartY = y;
        this.selectionEndX = x;
        this.selectionEndY = y;
        this.isShiftPressed = isShiftPressed;
        
        if (isShiftPressed) {
            this.previousSelection = new Set(this.selectedUnits.map(u => u.id));
        } else {
            this.previousSelection.clear();
        }
    }

    updateSelection(x: number, y: number): void {
        if (!this.isSelecting) return;
        this.selectionEndX = x;
        this.selectionEndY = y;
    }

    endSelection(units: ICommandable[]): void {
        if (!this.isSelecting) return;
        this.isSelecting = false;

        const minX = Math.min(this.selectionStartX, this.selectionEndX);
        const maxX = Math.max(this.selectionStartX, this.selectionEndX);
        const minY = Math.min(this.selectionStartY, this.selectionEndY);
        const maxY = Math.max(this.selectionStartY, this.selectionEndY);

        const selectionSize = Math.abs(maxX - minX) * Math.abs(maxY - minY);

        if (selectionSize < 25) {
            const clickedUnit = units.find(u => 
                u.health > 0 &&
                !u.isEnemy &&
                Math.abs(u.x - this.selectionStartX) < u.radius &&
                Math.abs(u.y - this.selectionStartY) < u.radius
            );
            
            if (clickedUnit) {
                if (this.isShiftPressed) {
                    if (this.previousSelection.has(clickedUnit.id)) {
                        this.selectedUnits = this.selectedUnits.filter(u => u.id !== clickedUnit.id);
                        clickedUnit.isSelected = false;
                    } else {
                        this.selectedUnits.push(clickedUnit);
                        clickedUnit.isSelected = true;
                    }
                } else {
                    this.selectedUnits.forEach(u => u.isSelected = false);
                    this.selectedUnits = [clickedUnit];
                    clickedUnit.isSelected = true;
                }
            } else if (!this.isShiftPressed) {
                this.selectedUnits.forEach(u => u.isSelected = false);
                this.selectedUnits = [];
            }
        } else {
            const newlySelected: ICommandable[] = [];
            
            for (const unit of units) {
                if (unit.health > 0 && !unit.isEnemy) {
                    const inSelection = unit.x >= minX && unit.x <= maxX && 
                                       unit.y >= minY && unit.y <= maxY;
                    
                    if (inSelection) {
                        newlySelected.push(unit);
                    }
                }
            }

            if (!this.isShiftPressed) {
                this.selectedUnits.forEach(u => u.isSelected = false);
                this.selectedUnits = newlySelected;
                newlySelected.forEach(u => u.isSelected = true);
            } else {
                for (const unit of newlySelected) {
                    if (!this.previousSelection.has(unit.id)) {
                        this.selectedUnits.push(unit);
                        unit.isSelected = true;
                    }
                }
            }
        }
    }

    drawSelection(ctx: CanvasRenderingContext2D): void {
        if (!this.isSelecting) return;

        const minX = Math.min(this.selectionStartX, this.selectionEndX);
        const maxX = Math.max(this.selectionStartX, this.selectionEndX);
        const minY = Math.min(this.selectionStartY, this.selectionEndY);
        const maxY = Math.max(this.selectionStartY, this.selectionEndY);

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
    }
}
