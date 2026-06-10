class FormationController implements IFormationController {
    currentFormation: FormationType;
    units: ICommandable[];
    formationCenterX: number;
    formationCenterY: number;
    targetCenterX: number;
    targetCenterY: number;
    isMoving: boolean;
    formationSpacing: number;
    private formationPatterns: Map<FormationType, IFormationPattern>;
    private formationAngle: number;

    constructor() {
        this.currentFormation = 'line';
        this.units = [];
        this.formationCenterX = 0;
        this.formationCenterY = 0;
        this.targetCenterX = 0;
        this.targetCenterY = 0;
        this.isMoving = false;
        this.formationSpacing = 35;
        this.formationAngle = 0;
        
        this.formationPatterns = new Map();
        this.formationPatterns.set('line', new LineFormation());
        this.formationPatterns.set('column', new ColumnFormation());
        this.formationPatterns.set('wedge', new WedgeFormation());
    }

    setFormation(type: FormationType): void {
        this.currentFormation = type;
        this.calculateFormationOffsets();
    }

    calculateFormationOffsets(): void {
        const pattern = this.formationPatterns.get(this.currentFormation);
        if (!pattern) return;

        const aliveUnits = this.units.filter(u => u.health > 0);
        aliveUnits.sort((a, b) => {
            const dx = a.x - this.formationCenterX;
            const dy = a.y - this.formationCenterY;
            const distA = Math.sqrt(dx * dx + dy * dy);
            const dx2 = b.x - this.formationCenterX;
            const dy2 = b.y - this.formationCenterY;
            const distB = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            return distA - distB;
        });

        aliveUnits.forEach((unit, index) => {
            const offset = pattern.getOffset(index, aliveUnits.length, this.formationSpacing);
            
            const cos = Math.cos(this.formationAngle);
            const sin = Math.sin(this.formationAngle);
            unit.formationOffsetX = offset.x * cos - offset.y * sin;
            unit.formationOffsetY = offset.x * sin + offset.y * cos;
        });
    }

    moveFormation(targetX: number, targetY: number): void {
        if (this.units.length === 0) return;

        this.targetCenterX = targetX;
        this.targetCenterY = targetY;
        this.isMoving = true;

        const dx = targetX - this.formationCenterX;
        const dy = targetY - this.formationCenterY;
        this.formationAngle = Math.atan2(dy, dx) - Math.PI / 2;
        
        this.calculateFormationOffsets();
        this.updateUnitTargets();
    }

    private updateUnitTargets(): void {
        const formationSpeed = this.getFormationSpeed();
        
        for (const unit of this.units) {
            if (unit.health <= 0) continue;
            
            const targetX = this.targetCenterX + unit.formationOffsetX;
            const targetY = this.targetCenterY + unit.formationOffsetY;
            
            unit.maxSpeed = formationSpeed;
            unit.moveTo(targetX, targetY);
        }
    }

    stopFormation(): void {
        this.isMoving = false;
        for (const unit of this.units) {
            unit.stop();
        }
    }

    updateFormationPositions(deltaTime: number): void {
        if (!this.isMoving || this.units.length === 0) return;

        this.updateFormationCenter();
        
        const dx = this.targetCenterX - this.formationCenterX;
        const dy = this.targetCenterY - this.formationCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            this.updateUnitTargets();
        } else {
            let allStopped = true;
            for (const unit of this.units) {
                if (unit.health > 0 && unit.isMoving) {
                    allStopped = false;
                    break;
                }
            }
            if (allStopped) {
                this.isMoving = false;
            }
        }
    }

    private updateFormationCenter(): void {
        let sumX = 0;
        let sumY = 0;
        let count = 0;

        for (const unit of this.units) {
            if (unit.health > 0) {
                sumX += unit.x;
                sumY += unit.y;
                count++;
            }
        }

        if (count > 0) {
            this.formationCenterX = sumX / count;
            this.formationCenterY = sumY / count;
        }
    }

    getFormationSpeed(): number {
        let minSpeed = Infinity;
        for (const unit of this.units) {
            if (unit.health > 0 && unit.maxSpeed < minSpeed) {
                minSpeed = unit.maxSpeed;
            }
        }
        return minSpeed === Infinity ? 2 : minSpeed;
    }

    addUnit(unit: ICommandable): void {
        if (!this.units.find(u => u.id === unit.id)) {
            this.units.push(unit);
            this.updateFormationCenter();
            this.calculateFormationOffsets();
        }
    }

    removeUnit(unit: ICommandable): void {
        this.units = this.units.filter(u => u.id !== unit.id);
        this.updateFormationCenter();
        this.calculateFormationOffsets();
    }

    clearUnits(): void {
        this.units = [];
        this.formationCenterX = 0;
        this.formationCenterY = 0;
        this.isMoving = false;
    }
}
