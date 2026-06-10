class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.speed = 150;
        this.health = 3;
        this.maxHealth = 3;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 1.5;
        this.blinkInterval = 0.1;
        this.blinkTimer = 0;
        this.visible = true;

        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackCooldownDuration = 0.4;
        this.attackRange = 50;
        this.attackAngle = Math.PI / 2;
        this.attackDirection = { x: 0, y: -1 };
        this.facingDirection = { x: 0, y: -1 };

        this.hasKey = false;
    }

    update(deltaTime, keys, map, enemy, keyItem) {
        let dx = 0;
        let dy = 0;

        if (keys['ArrowUp'] || keys['KeyW']) {
            dy = -1;
            this.facingDirection = { x: 0, y: -1 };
        }
        if (keys['ArrowDown'] || keys['KeyS']) {
            dy = 1;
            this.facingDirection = { x: 0, y: 1 };
        }
        if (keys['ArrowLeft'] || keys['KeyA']) {
            dx = -1;
            this.facingDirection = { x: -1, y: 0 };
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            dx = 1;
            this.facingDirection = { x: 1, y: 0 };
        }

        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        if (dx !== 0 || dy !== 0) {
            this.attackDirection = { x: dx, y: dy };
        }

        const moveX = dx * this.speed * deltaTime;
        const moveY = dy * this.speed * deltaTime;

        if (!map.checkWallCollision(this.x + moveX, this.y, this.width, this.height)) {
            this.x += moveX;
        }
        if (!map.checkWallCollision(this.x, this.y + moveY, this.width, this.height)) {
            this.y += moveY;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        if (this.isAttacking) {
            this.isAttacking = false;
        }

        if (this.isInvincible) {
            this.invincibleTimer -= deltaTime;
            this.blinkTimer -= deltaTime;
            if (this.blinkTimer <= 0) {
                this.visible = !this.visible;
                this.blinkTimer = this.blinkInterval;
            }
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
                this.visible = true;
            }
        }

        this.collectKey(keyItem);
    }

    attack() {
        if (this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.attackCooldown = this.attackCooldownDuration;
            return true;
        }
        return false;
    }

    checkAttackHit(enemy) {
        if (!this.isAttacking) return false;

        const playerCenterX = this.x + this.width / 2;
        const playerCenterY = this.y + this.height / 2;
        const enemyCenterX = enemy.x + enemy.width / 2;
        const enemyCenterY = enemy.y + enemy.height / 2;

        const dx = enemyCenterX - playerCenterX;
        const dy = enemyCenterY - playerCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.attackRange) return false;

        const angle = Math.atan2(dy, dx);
        const attackAngle = Math.atan2(this.attackDirection.y, this.attackDirection.x);
        let angleDiff = angle - attackAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        return Math.abs(angleDiff) <= this.attackAngle / 2;
    }

    takeDamage() {
        if (this.isInvincible) return false;
        this.health--;
        this.isInvincible = true;
        this.invincibleTimer = this.invincibleDuration;
        this.blinkTimer = this.blinkInterval;
        return true;
    }

    collectKey(keyItem) {
        if (!keyItem || !keyItem.visible || this.hasKey) return;

        const playerCenterX = this.x + this.width / 2;
        const playerCenterY = this.y + this.height / 2;
        const dx = keyItem.x - playerCenterX;
        const dy = keyItem.y - playerCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 20) {
            this.hasKey = true;
            keyItem.visible = false;
        }
    }

    checkDoorInteraction(door, eKeyPressed) {
        if (!door || !door.isLocked || !this.hasKey || !eKeyPressed) return false;

        const playerCenterX = this.x + this.width / 2;
        const playerCenterY = this.y + this.height / 2;
        const dx = door.x - playerCenterX;
        const dy = door.y - playerCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < 25;
    }

    draw(ctx) {
        if (!this.visible) return;

        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = '#fff';
        const eyeOffset = 8;
        const eyeSize = 6;
        if (this.facingDirection.x === 0) {
            ctx.fillRect(this.x + 8, this.y + 8 + (this.facingDirection.y > 0 ? 8 : 0), eyeSize, eyeSize);
            ctx.fillRect(this.x + 18, this.y + 8 + (this.facingDirection.y > 0 ? 8 : 0), eyeSize, eyeSize);
        } else {
            ctx.fillRect(this.x + 8 + (this.facingDirection.x > 0 ? 8 : 0), this.y + 10, eyeSize, eyeSize);
            ctx.fillRect(this.x + 8 + (this.facingDirection.x > 0 ? 8 : 0), this.y + 18, eyeSize, eyeSize);
        }

        if (this.isAttacking) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.beginPath();
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            const attackAngle = Math.atan2(this.attackDirection.y, this.attackDirection.x);
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, this.attackRange, attackAngle - this.attackAngle / 2, attackAngle + this.attackAngle / 2);
            ctx.closePath();
            ctx.fill();
        }
    }
}
