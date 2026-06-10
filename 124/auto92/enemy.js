class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.speed = 100;
        this.health = 3;
        this.maxHealth = 3;
        this.alive = true;

        this.state = 'patrol';
        this.patrolTarget = null;
        this.patrolTimer = 0;
        this.patrolInterval = 3;

        this.sightRange = 150;
        this.attackRange = 30;

        this.isHit = false;
        this.hitTimer = 0;
        this.hitDuration = 0.2;
    }

    update(deltaTime, player, map) {
        if (!this.alive) return;

        if (this.isHit) {
            this.hitTimer -= deltaTime;
            if (this.hitTimer <= 0) {
                this.isHit = false;
            }
        }

        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const enemyCenterX = this.x + this.width / 2;
        const enemyCenterY = this.y + this.height / 2;

        const dx = playerCenterX - enemyCenterX;
        const dy = playerCenterY - enemyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.sightRange) {
            this.state = 'chase';
        } else {
            this.state = 'patrol';
        }

        if (this.state === 'chase') {
            this.chasePlayer(deltaTime, player, map);
        } else {
            this.patrol(deltaTime, map);
        }

        this.checkPlayerCollision(player);
    }

    chasePlayer(deltaTime, player, map) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const enemyCenterX = this.x + this.width / 2;
        const enemyCenterY = this.y + this.height / 2;

        let dx = playerCenterX - enemyCenterX;
        let dy = playerCenterY - enemyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            dx /= distance;
            dy /= distance;
        }

        const moveX = dx * this.speed * deltaTime;
        const moveY = dy * this.speed * deltaTime;

        const newX = this.x + moveX;
        const newY = this.y + moveY;

        if (!map.checkWallCollision(newX, this.y, this.width, this.height)) {
            this.x = newX;
        }
        if (!map.checkWallCollision(this.x, newY, this.width, this.height)) {
            this.y = newY;
        }
    }

    patrol(deltaTime, map) {
        this.patrolTimer -= deltaTime;

        if (this.patrolTimer <= 0 || !this.patrolTarget) {
            this.setNewPatrolTarget(map);
            this.patrolTimer = this.patrolInterval;
        }

        const dx = this.patrolTarget.x - (this.x + this.width / 2);
        const dy = this.patrolTarget.y - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
            this.setNewPatrolTarget(map);
            return;
        }

        const dirX = dx / distance;
        const dirY = dy / distance;

        const moveX = dirX * this.speed * 0.5 * deltaTime;
        const moveY = dirY * this.speed * 0.5 * deltaTime;

        const newX = this.x + moveX;
        const newY = this.y + moveY;

        if (!map.checkWallCollision(newX, this.y, this.width, this.height)) {
            this.x = newX;
        }
        if (!map.checkWallCollision(this.x, newY, this.width, this.height)) {
            this.y = newY;
        }
    }

    setNewPatrolTarget(map) {
        const margin = 50;
        const minX = map.wallThickness + margin;
        const maxX = map.width - map.wallThickness - this.width - margin;
        const minY = map.wallThickness + margin;
        const maxY = map.height - map.wallThickness - this.height - margin;

        this.patrolTarget = {
            x: minX + Math.random() * (maxX - minX),
            y: minY + Math.random() * (maxY - minY)
        };
    }

    checkPlayerCollision(player) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const enemyCenterX = this.x + this.width / 2;
        const enemyCenterY = this.y + this.height / 2;

        const dx = playerCenterX - enemyCenterX;
        const dy = playerCenterY - enemyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.attackRange) {
            player.takeDamage();
        }
    }

    takeDamage() {
        this.health--;
        this.isHit = true;
        this.hitTimer = this.hitDuration;

        if (this.health <= 0) {
            this.alive = false;
            return true;
        }
        return false;
    }

    draw(ctx) {
        if (!this.alive) return;

        if (this.isHit) {
            ctx.fillStyle = '#ff4444';
        } else {
            ctx.fillStyle = '#E0E0E0';
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = this.isHit ? '#ff0000' : '#333';
        ctx.fillRect(this.x + 8, this.y + 10, 6, 8);
        ctx.fillRect(this.x + 18, this.y + 10, 6, 8);

        ctx.fillRect(this.x + 12, this.y + 22, 8, 4);

        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 10, this.width, 6);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x + 1, this.y - 9, (this.width - 2) * (this.health / this.maxHealth), 4);
    }
}
