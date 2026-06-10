import { GameMap } from './map.js';

const COMBAT_CONFIG = {
    hitRateBase: 0.9,
    randomFactorMin: 0.85,
    randomFactorMax: 1.15,
    terrainDefenseWeight: 0.5
};

class CombatSystem {
    constructor(gameMap) {
        this.gameMap = gameMap;
        this.combatLog = [];
    }

    setHitRateBase(newValue) {
        COMBAT_CONFIG.hitRateBase = newValue;
    }

    calculateDamage(attacker, defender) {
        const terrainDefense = this.gameMap.getDefenseBonus(defender.x, defender.y);
        const effectiveDefense = defender.defense + terrainDefense * COMBAT_CONFIG.terrainDefenseWeight;
        
        const baseDamage = Math.max(1, attacker.attack - effectiveDefense * 0.5);
        
        const randomFactor = Math.random() * (COMBAT_CONFIG.randomFactorMax - COMBAT_CONFIG.randomFactorMin) + COMBAT_CONFIG.randomFactorMin;
        
        const finalDamage = Math.round(baseDamage * randomFactor);
        
        return {
            damage: finalDamage,
            baseDamage,
            randomFactor,
            terrainBonus: terrainDefense
        };
    }

    calculateHitRate(attacker, defender) {
        return COMBAT_CONFIG.hitRateBase;
    }

    executeAttack(attacker, defender) {
        const hitRate = this.calculateHitRate(attacker, defender);
        const isHit = Math.random() < hitRate;
        
        if (!isHit) {
            this.combatLog.push({
                type: 'miss',
                attacker: attacker.name,
                defender: defender.name,
                message: `${attacker.name} 攻击 ${defender.name}，未命中！`
            });
            return { hit: false, killed: false, damage: 0 };
        }

        const damageResult = this.calculateDamage(attacker, defender);
        const killed = defender.takeDamage(damageResult.damage);
        
        attacker.hasAttacked = true;
        
        this.combatLog.push({
            type: 'hit',
            attacker: attacker.name,
            defender: defender.name,
            damage: damageResult.damage,
            killed,
            message: `${attacker.name} 攻击 ${defender.name}，造成 ${damageResult.damage} 点伤害${killed ? '，目标被消灭！' : '！'}`
        });

        return {
            hit: true,
            killed,
            damage: damageResult.damage,
            ...damageResult
        };
    }

    getLastLog() {
        return this.combatLog[this.combatLog.length - 1];
    }

    clearLog() {
        this.combatLog = [];
    }
}

class AISystem {
    constructor(gameMap, units) {
        this.gameMap = gameMap;
        this.units = units;
        this.actions = [];
    }

    getEnemyUnits() {
        return this.units.filter(u => u.isEnemy && u.isAlive);
    }

    getPlayerUnits() {
        return this.units.filter(u => !u.isEnemy && u.isAlive);
    }

    findBestTarget(enemyUnit) {
        const playerUnits = this.getPlayerUnits();
        const targetsInRange = playerUnits.filter(target => 
            enemyUnit.isInRange(target.x, target.y, this.gameMap)
        );

        if (targetsInRange.length === 0) {
            return null;
        }

        return targetsInRange.sort((a, b) => a.hp - b.hp)[0];
    }

    findBestMovePosition(enemyUnit) {
        const playerUnits = this.getPlayerUnits();
        if (playerUnits.length === 0) return null;

        const nearestPlayer = playerUnits.sort((a, b) => {
            const distA = this.gameMap.getDistance(enemyUnit.x, enemyUnit.y, a.x, a.y);
            const distB = this.gameMap.getDistance(enemyUnit.x, enemyUnit.y, b.x, b.y);
            return distA - distB;
        })[0];

        const reachableCells = this.gameMap.getReachableCells(
            enemyUnit.x,
            enemyUnit.y,
            enemyUnit.remainingMoves,
            enemyUnit.type,
            this.units
        );

        if (reachableCells.length === 0) {
            return null;
        }

        let bestCell = null;
        let bestDistance = Infinity;

        for (const cell of reachableCells) {
            const distance = this.gameMap.getDistance(cell.x, cell.y, nearestPlayer.x, nearestPlayer.y);
            
            const canAttackFromHere = distance <= enemyUnit.attackRange;
            if (canAttackFromHere) {
                return cell;
            }

            if (distance < bestDistance) {
                bestDistance = distance;
                bestCell = cell;
            }
        }

        return bestCell;
    }

    executeAITurn() {
        this.actions = [];
        const enemyUnits = this.getEnemyUnits();

        for (const enemy of enemyUnits) {
            enemy.resetTurn();
        }

        for (const enemy of enemyUnits) {
            if (!enemy.isAlive) continue;

            let target = this.findBestTarget(enemy);

            if (!target && enemy.canMove()) {
                const movePos = this.findBestMovePosition(enemy);
                if (movePos) {
                    const path = this.gameMap.findPath(
                        enemy.x, enemy.y,
                        movePos.x, movePos.y,
                        enemy.type,
                        this.units
                    );

                    if (path && path.length > 1) {
                        enemy.move(movePos.x, movePos.y, movePos.cost);
                        this.actions.push({
                            type: 'move',
                            unit: enemy,
                            to: movePos
                        });
                    }
                }

                target = this.findBestTarget(enemy);
            }

            if (target && enemy.canAttack()) {
                this.actions.push({
                    type: 'attack',
                    attacker: enemy,
                    defender: target
                });
            }
        }

        return this.actions;
    }

    hasAction() {
        return this.actions.length > 0;
    }

    getNextAction() {
        return this.actions.shift();
    }
}

export { CombatSystem, AISystem, COMBAT_CONFIG };