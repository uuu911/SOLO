import { GameMap } from './map.js';
import { createInitialUnits } from './unit.js';
import { CombatSystem, AISystem } from './combat.js';

const GAME_STATE = {
    SELECTING: 'selecting',
    MOVE_MODE: 'move_mode',
    ATTACK_MODE: 'attack_mode',
    ENEMY_TURN: 'enemy_turn',
    GAME_OVER: 'game_over'
};

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameMap = new GameMap(10, 10, 60);
        this.units = createInitialUnits();
        this.combatSystem = new CombatSystem(this.gameMap);
        this.aiSystem = new AISystem(this.gameMap, this.units);
        
        this.currentState = GAME_STATE.SELECTING;
        this.selectedUnit = null;
        this.turn = 1;
        this.isPlayerTurn = true;
        this.consecutiveIdleTurns = 0;
        this.lastTurnHadAction = false;
        
        this.reachableCells = [];
        this.attackableTargets = [];
        
        this.animationFrame = null;
        this.isAnimating = false;
        
        this.setupEventListeners();
    }

    init() {
        this.render();
        this.updateUI();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        document.getElementById('btnMove').addEventListener('click', () => this.enterMoveMode());
        document.getElementById('btnAttack').addEventListener('click', () => this.enterAttackMode());
        document.getElementById('btnEndTurn').addEventListener('click', () => this.endPlayerTurn());
        document.getElementById('btnRestart').addEventListener('click', () => this.restartGame());
        document.getElementById('btnRestartGame').addEventListener('click', () => this.restartGame());
    }

    handleCanvasClick(e) {
        if (!this.isPlayerTurn || this.isAnimating || this.currentState === GAME_STATE.GAME_OVER) return;

        const rect = this.canvas.getBoundingClientRect();
        const coords = this.gameMap.getCellCoordinates(e.clientX, e.clientY, rect);
        
        if (!coords) return;

        switch (this.currentState) {
            case GAME_STATE.SELECTING:
                this.handleSelectUnit(coords);
                break;
            case GAME_STATE.MOVE_MODE:
                this.handleMoveUnit(coords);
                break;
            case GAME_STATE.ATTACK_MODE:
                this.handleAttackUnit(coords);
                break;
        }

        this.render();
        this.updateUI();
    }

    handleSelectUnit(coords) {
        const unit = this.units.find(u => 
            u.x === coords.x && u.y === coords.y && u.isAlive && !u.isEnemy
        );

        if (unit) {
            this.selectedUnit = unit;
            this.reachableCells = [];
            this.attackableTargets = [];
        } else {
            this.selectedUnit = null;
        }
    }

    enterMoveMode() {
        if (!this.selectedUnit || !this.selectedUnit.canMove()) return;
        
        this.currentState = GAME_STATE.MOVE_MODE;
        this.reachableCells = this.gameMap.getReachableCells(
            this.selectedUnit.x,
            this.selectedUnit.y,
            this.selectedUnit.remainingMoves,
            this.selectedUnit.type,
            this.units
        );
        this.attackableTargets = [];
        this.render();
        this.updateUI();
    }

    enterAttackMode() {
        if (!this.selectedUnit || !this.selectedUnit.canAttack()) return;
        
        this.currentState = GAME_STATE.ATTACK_MODE;
        this.attackableTargets = this.units.filter(u => 
            u.isAlive && 
            u.isEnemy !== this.selectedUnit.isEnemy &&
            this.selectedUnit.isInRange(u.x, u.y, this.gameMap)
        );
        this.reachableCells = [];
        this.render();
        this.updateUI();
    }

    handleMoveUnit(coords) {
        const targetCell = this.reachableCells.find(c => c.x === coords.x && c.y === coords.y);
        
        if (!targetCell) {
            this.currentState = GAME_STATE.SELECTING;
            this.reachableCells = [];
            return;
        }

        const path = this.gameMap.findPath(
            this.selectedUnit.x,
            this.selectedUnit.y,
            coords.x,
            coords.y,
            this.selectedUnit.type,
            this.units
        );

        if (path && path.length > 1) {
            this.selectedUnit.move(coords.x, coords.y, targetCell.cost);
            this.lastTurnHadAction = true;
            this.consecutiveIdleTurns = 0;
        }

        this.currentState = GAME_STATE.SELECTING;
        this.reachableCells = [];
    }

    handleAttackUnit(coords) {
        const target = this.attackableTargets.find(u => u.x === coords.x && u.y === coords.y);
        
        if (!target) {
            this.currentState = GAME_STATE.SELECTING;
            this.attackableTargets = [];
            return;
        }

        this.combatSystem.executeAttack(this.selectedUnit, target);
        this.lastTurnHadAction = true;
        this.consecutiveIdleTurns = 0;
        
        this.currentState = GAME_STATE.SELECTING;
        this.attackableTargets = [];

        this.checkGameOver();
    }

    endPlayerTurn() {
        if (!this.isPlayerTurn) return;

        this.isPlayerTurn = false;
        this.currentState = GAME_STATE.ENEMY_TURN;
        this.selectedUnit = null;
        this.reachableCells = [];
        this.attackableTargets = [];

        this.render();
        this.updateUI();

        setTimeout(() => this.executeEnemyTurn(), 500);
    }

    executeEnemyTurn() {
        const aiActions = this.aiSystem.executeAITurn();
        
        if (aiActions.length === 0) {
            if (!this.lastTurnHadAction) {
                this.consecutiveIdleTurns++;
            }
            this.finishEnemyTurn();
            return;
        }

        this.lastTurnHadAction = false;
        let actionIndex = 0;

        const executeNextAction = () => {
            if (actionIndex >= aiActions.length || this.currentState === GAME_STATE.GAME_OVER) {
                this.finishEnemyTurn();
                return;
            }

            const action = aiActions[actionIndex];
            actionIndex++;

            if (action.type === 'move') {
                this.render();
                this.updateUI();
                setTimeout(executeNextAction, 300);
            } else if (action.type === 'attack') {
                this.combatSystem.executeAttack(action.attacker, action.defender);
                this.lastTurnHadAction = true;
                this.render();
                this.updateUI();
                
                if (this.checkGameOver()) return;
                
                setTimeout(executeNextAction, 500);
            } else {
                executeNextAction();
            }
        };

        executeNextAction();
    }

    finishEnemyTurn() {
        if (this.currentState === GAME_STATE.GAME_OVER) return;

        this.turn++;
        this.isPlayerTurn = true;
        this.currentState = GAME_STATE.SELECTING;

        this.units.filter(u => !u.isEnemy && u.isAlive).forEach(u => u.resetTurn());

        if (this.consecutiveIdleTurns >= 3) {
            this.showGameOver('draw', '双方连续3回合无行动，判定为平局！');
            return;
        }

        this.render();
        this.updateUI();
    }

    checkGameOver() {
        const playerAlive = this.units.filter(u => !u.isEnemy && u.isAlive).length;
        const enemyAlive = this.units.filter(u => u.isEnemy && u.isAlive).length;

        if (enemyAlive === 0) {
            this.showGameOver('victory', '恭喜！你成功消灭了所有敌人！');
            return true;
        }

        if (playerAlive === 0) {
            this.showGameOver('defeat', '很遗憾！你的部队已全军覆没...');
            return true;
        }

        return false;
    }

    showGameOver(result, message) {
        this.currentState = GAME_STATE.GAME_OVER;
        
        const overlay = document.getElementById('gameOverOverlay');
        const title = document.getElementById('gameOverTitle');
        const msg = document.getElementById('gameOverMessage');

        title.textContent = result === 'victory' ? '胜利！' : 
                           result === 'defeat' ? '失败！' : '平局';
        title.className = result === 'victory' ? 'victory' : 
                          result === 'defeat' ? 'defeat' : 'draw';
        msg.textContent = message;

        overlay.style.display = 'flex';
    }

    restartGame() {
        const overlay = document.getElementById('gameOverOverlay');
        overlay.style.display = 'none';

        this.gameMap = new GameMap(10, 10, 60);
        this.units = createInitialUnits();
        this.combatSystem = new CombatSystem(this.gameMap);
        this.aiSystem = new AISystem(this.gameMap, this.units);

        this.currentState = GAME_STATE.SELECTING;
        this.selectedUnit = null;
        this.turn = 1;
        this.isPlayerTurn = true;
        this.consecutiveIdleTurns = 0;
        this.lastTurnHadAction = false;
        this.reachableCells = [];
        this.attackableTargets = [];

        this.render();
        this.updateUI();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.gameMap.render(this.ctx);

        if (this.currentState === GAME_STATE.MOVE_MODE) {
            this.reachableCells.forEach(cell => {
                this.gameMap.highlightCell(this.ctx, cell.x, cell.y, '#3498db', 0.4);
            });
        }

        if (this.currentState === GAME_STATE.ATTACK_MODE) {
            this.attackableTargets.forEach(target => {
                this.gameMap.highlightCell(this.ctx, target.x, target.y, '#e74c3c', 0.4);
            });
        }

        this.units = this.units.filter(unit => {
            const isSelected = this.selectedUnit && this.selectedUnit.id === unit.id;
            return unit.render(this.ctx, this.gameMap.cellSize, isSelected);
        });
    }

    updateUI() {
        const turnDisplay = document.getElementById('turnDisplay');
        turnDisplay.textContent = `第 ${this.turn} 回合 - ${this.isPlayerTurn ? '我方回合' : '敌方回合'}`;
        turnDisplay.className = `turn-info ${this.isPlayerTurn ? 'turn-player' : 'turn-enemy'}`;

        const statusIndicator = document.getElementById('statusIndicator');
        statusIndicator.textContent = this.getStatusText();

        const btnMove = document.getElementById('btnMove');
        const btnAttack = document.getElementById('btnAttack');
        
        btnMove.disabled = !this.selectedUnit || !this.selectedUnit.canMove() || !this.isPlayerTurn;
        btnAttack.disabled = !this.selectedUnit || !this.selectedUnit.canAttack() || !this.isPlayerTurn;

        this.updateUnitInfo();
    }

    getStatusText() {
        if (!this.isPlayerTurn) return '敌方行动中...';
        if (this.currentState === GAME_STATE.MOVE_MODE) return '选择移动目标（点击空白处取消）';
        if (this.currentState === GAME_STATE.ATTACK_MODE) return '选择攻击目标（点击空白处取消）';
        if (this.selectedUnit) return `已选择 ${this.selectedUnit.name}`;
        return '点击选择单位';
    }

    updateUnitInfo() {
        const panel = document.getElementById('unitInfoPanel');
        
        if (!this.selectedUnit) {
            panel.innerHTML = '<div class="no-selection">请点击地图上的单位查看详情</div>';
            return;
        }

        const info = this.selectedUnit.getInfo();
        const hpPercent = (info.hp / info.maxHp * 100).toFixed(0);

        panel.innerHTML = `
            <div class="unit-info">
                <p><span>名称</span><span>${info.name}</span></p>
                <p><span>阵营</span><span>${info.team}</span></p>
                <div class="hp-bar">
                    <div class="hp-fill" style="width: ${hpPercent}%"></div>
                </div>
                <p><span>生命值</span><span>${info.hp} / ${info.maxHp}</span></p>
                <p><span>攻击力</span><span>${info.attack}</span></p>
                <p><span>防御力</span><span>${info.defense}</span></p>
                <p><span>移动力</span><span>${info.remainingMoves} / ${info.movePoints}</span></p>
                <p><span>攻击范围</span><span>${info.attackRange} 格</span></p>
                <p><span>位置</span><span>${info.position}</span></p>
                <p><span>状态</span><span>${info.hasMoved ? '已移动' : '可移动'} / ${info.hasAttacked ? '已攻击' : '可攻击'}</span></p>
            </div>
        `;
    }
}

export default Game;