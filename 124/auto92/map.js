class GameMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.wallThickness = 30;
        this.wallColor = '#5D4037';
        this.floorColor = '#8D6E63';
    }

    checkWallCollision(x, y, objectWidth, objectHeight) {
        return (
            x < this.wallThickness ||
            x + objectWidth > this.width - this.wallThickness ||
            y < this.wallThickness ||
            y + objectHeight > this.height - this.wallThickness
        );
    }

    getRandomPosition(margin = 50) {
        const minX = this.wallThickness + margin;
        const maxX = this.width - this.wallThickness - margin;
        const minY = this.wallThickness + margin;
        const maxY = this.height - this.wallThickness - margin;

        return {
            x: minX + Math.random() * (maxX - minX),
            y: minY + Math.random() * (maxY - minY)
        };
    }

    getWallBounds() {
        return {
            left: 0,
            right: this.width,
            top: 0,
            bottom: this.height,
            innerLeft: this.wallThickness,
            innerRight: this.width - this.wallThickness,
            innerTop: this.wallThickness,
            innerBottom: this.height - this.wallThickness
        };
    }

    draw(ctx) {
        ctx.fillStyle = this.floorColor;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = this.wallColor;
        ctx.fillRect(0, 0, this.width, this.wallThickness);
        ctx.fillRect(0, this.height - this.wallThickness, this.width, this.wallThickness);
        ctx.fillRect(0, 0, this.wallThickness, this.height);
        ctx.fillRect(this.width - this.wallThickness, 0, this.wallThickness, this.height);

        ctx.fillStyle = '#4E342E';
        for (let i = 0; i < this.width; i += 30) {
            ctx.fillRect(i, 0, 15, 10);
            ctx.fillRect(i, this.height - 10, 15, 10);
        }
        for (let i = 0; i < this.height; i += 30) {
            ctx.fillRect(0, i, 10, 15);
            ctx.fillRect(this.width - 10, i, 10, 15);
        }
    }
}

class Key {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.visible = false;
        this.bobOffset = 0;
        this.bobSpeed = 3;
    }

    update(deltaTime) {
        this.bobOffset = Math.sin(Date.now() * 0.005) * 3;
    }

    draw(ctx) {
        if (!this.visible) return;

        const drawY = this.y + this.bobOffset;

        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, drawY - 5, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#8D6E63';
        ctx.beginPath();
        ctx.arc(this.x, drawY - 5, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x - 3, drawY, 6, 12);

        ctx.fillRect(this.x + 3, drawY + 6, 5, 3);
        ctx.fillRect(this.x + 3, drawY + 10, 3, 2);
    }
}

class Door {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 50;
        this.isLocked = true;
        this.isOpen = false;
    }

    unlock() {
        this.isLocked = false;
        this.isOpen = true;
    }

    draw(ctx) {
        if (this.isOpen) {
            ctx.fillStyle = '#2E7D32';
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
            
            ctx.fillStyle = '#1B5E20';
            ctx.fillRect(this.x - this.width / 2 + 5, this.y - this.height / 2 + 5, this.width - 10, this.height - 10);
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

            ctx.fillStyle = '#5D4037';
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, 3, this.height);
            ctx.fillRect(this.x + this.width / 2 - 3, this.y - this.height / 2, 3, this.height);
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, 3);

            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x + 12, this.y, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#333';
            ctx.fillRect(this.x + 10, this.y + 2, 4, 6);

            ctx.fillStyle = '#FF5722';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🔒', this.x, this.y - this.height / 2 - 10);
        }
    }
}
