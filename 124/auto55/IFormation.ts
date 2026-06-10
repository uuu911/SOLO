type FormationType = 'line' | 'column' | 'wedge';

interface IFormationController {
    currentFormation: FormationType;
    units: ICommandable[];
    formationCenterX: number;
    formationCenterY: number;
    targetCenterX: number;
    targetCenterY: number;
    isMoving: boolean;
    formationSpacing: number;
    
    setFormation(type: FormationType): void;
    calculateFormationOffsets(): void;
    moveFormation(targetX: number, targetY: number): void;
    stopFormation(): void;
    updateFormationPositions(deltaTime: number): void;
    getFormationSpeed(): number;
    addUnit(unit: ICommandable): void;
    removeUnit(unit: ICommandable): void;
    clearUnits(): void;
}

interface IFormationPattern {
    getOffset(index: number, total: number, spacing: number): { x: number; y: number };
}

class LineFormation implements IFormationPattern {
    getOffset(index: number, total: number, spacing: number): { x: number; y: number } {
        const halfWidth = (total - 1) * spacing / 2;
        return { x: index * spacing - halfWidth, y: 0 };
    }
}

class ColumnFormation implements IFormationPattern {
    getOffset(index: number, total: number, spacing: number): { x: number; y: number } {
        const halfHeight = (total - 1) * spacing / 2;
        return { x: 0, y: index * spacing - halfHeight };
    }
}

class WedgeFormation implements IFormationPattern {
    getOffset(index: number, total: number, spacing: number): { x: number; y: number } {
        if (index === 0) return { x: 0, y: 0 };
        const row = Math.floor((Math.sqrt(8 * index + 1) - 1) / 2);
        const posInRow = index - (row * (row + 1)) / 2;
        const rowWidth = row + 1;
        return {
            x: (posInRow - rowWidth / 2 + 0.5) * spacing,
            y: row * spacing
        };
    }
}
