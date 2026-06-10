interface ICommandable {
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
    
    moveTo(x: number, y: number): void;
    stop(): void;
    attackTarget(target: ICommandable): void;
    takeDamage(damage: number): void;
    update(deltaTime: number, allUnits: ICommandable[]): void;
    draw(ctx: CanvasRenderingContext2D): void;
}

interface ISelectionManager {
    selectedUnits: ICommandable[];
    isSelecting: boolean;
    selectionStartX: number;
    selectionStartY: number;
    selectionEndX: number;
    selectionEndY: number;
    
    startSelection(x: number, y: number, isShiftPressed: boolean): void;
    updateSelection(x: number, y: number): void;
    endSelection(units: ICommandable[]): void;
    drawSelection(ctx: CanvasRenderingContext2D): void;
}
