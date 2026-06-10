class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.mapWidth = 800;
        this.mapHeight = 600;
        this.canvas.width = this.mapWidth;
        this.canvas.height = this.mapHeight;

        this.keys = {};
        this.eKeyPressed = false;
        this.spaceKeyPressed = false;

        this.gameOver = false;
        this.gameWon = false;

        this.lastTime = 0;
        this.deltaTime = 0;

        this.init();
        this.setupEventListeners();
        this.gameLoop();
    }

    init() {
        this.map = new GameMap(this.mapWidth, this.mapHeight);

        const playerPos = this.map.getRandomPosition(80);
        this.player = new Player(playerPos.x, playerPos.y);

        let enemyPos;
        do {
            enemyPos = this.map.getRandomPosition(80);
        } while (this.getDistance(playerPos, enemyPos) < 200);
        this.enemy = new Enemy(enemyPos.x, enemyPos.y);

        const keyPos = this.map.getRandomPosition(60);
        this.key = new Key(keyPos.x, keyPos.y);

        const doorPos = {
            x: this.mapWidth - this.map.wallThickness - 30,
            y: this.mapHeight / 2
        };
        this.door = new Door(doorPos.x, doorPos.y);

        this.showHint = true;
        this.hintTimer = 5;
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyE') {
                this.eKeyPressed = true;
            }
            if (e.code === 'Space') {
                e.preventDefault();
                if (!this.spaceKeyPressed) {
                    this.spaceKeyPressed = true;
                    this.player.attack();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'KeyE') {
                this.eKeyPressed = false;
            }
            if (e.code === 'Space') {
                this.spaceKeyPressed = false;
            }
        });
    }

    getDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    update(currentTime) {
        if (this.gameOver || this.gameWon) return;

        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (this.deltaTime > 0.1) this.deltaTime = 0.1;

        this.player.update(this.deltaTime, this.keys, this.map, this.enemy, this.key);

        this.enemy.update(this.deltaTime, this.player, this.map);

        if (this.player.checkAttackHit(this.enemy)) {
            const enemyDefeated = this.enemy.takeDamage();
            if (enemyDefeated) {
                this.key.visible = true;
            }
        }

        this.key.update(this.deltaTime);

        if (this.player.checkDoorInteraction(this.door, this.eKeyPressed)) {
            this.door.unlock();
            this.gameWon = true;
        }

        if (this.player.health <= 0) {
            this.gameOver = true;
        }

        if (this.showHint) {
            this.hintTimer -= this.deltaTime;
            if (this.hintTimer <= 0) {
                this.showHint = false;
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.mapWidth, this.mapHeight);

        this.map.draw(this.ctx);

        this.door.draw(this.ctx);

        this.key.draw(this.ctx);

        this.enemy.draw(this.ctx);

        this.player.draw(this.ctx);

        this.drawUI();

        if (this.gameOver) {
            this.drawGameOver();
        }

        if (this.gameWon) {
            this.drawGameWon();
        }

        if (this.showHint && !this.enemy.alive && !this.player.hasKey) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(this.mapWidth / 2 - 150, 80, 300, 30);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('钥匙已出现！快去拾取它！', this.mapWidth / 2, 100);
        }

        if (this.showHint && this.player.hasKey && !this.door.isOpen) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(this.mapWidth / 2 - 180, 80, 360, 30);
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('按 E 键与门交互开门逃离！', this.mapWidth / 2, 100);
        }
    }

    drawUI() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, 10, 120, 30);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('生命: ', 20, 30);

        for (let i = 0; i < this.player.maxHealth; i++) {
            if (i < this.player.health) {
                this.ctx.fillStyle = '#f44336';
            } else {
                this.ctx.fillStyle = '#555';
            }
            this.ctx.fillText('❤', 70 + i * 18, 30);
        }

        if (this.player.hasKey) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(10, 50, 120, 25);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '14px Arial';
            this.ctx.fillText('🔑 已获得钥匙', 20, 68);
        }

        if (!this.enemy.alive && !this.player.hasKey) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(this.mapWidth - 130, 10, 120, 25);
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText('按 E 开门', this.mapWidth - 20, 28);
        }
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);

        this.ctx.fillStyle = '#f44336';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over', this.mapWidth / 2, this.mapHeight / 2 - 20);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('刷新页面重新开始', this.mapWidth / 2, this.mapHeight / 2 + 30);
    }

    drawGameWon() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);

        this.ctx.fillStyle = '#4CAF50';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('You escaped!', this.mapWidth / 2, this.mapHeight / 2 - 20);

        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('🎉 恭喜你成功逃离！', this.mapWidth / 2, this.mapHeight / 2 + 30);
    }

    gameLoop(currentTime = 0) {
        this.update(currentTime);
        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

window.onload = () => {
    new Game();
};
