const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 1000;
const PLAYER_WIDTH = 150;
const PLAYER_HEIGHT = 100;
const ENEMY_WIDTH = 100;
const ENEMY_HEIGHT = 70;
const BULLET_SIZE = 20;

class GameObject {
    constructor(x, y, width, height, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
    }
}

class Player extends GameObject {
    constructor() {
        super(CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, CANVAS_HEIGHT - PLAYER_HEIGHT - 50, PLAYER_WIDTH, PLAYER_HEIGHT, 10);
        this.kills = 0;
        this.maxHp = 100;
        this.currentHp = this.maxHp;
    }

    takeDamage(amount) {
        this.currentHp = Math.max(0, this.currentHp - amount);
        return this.currentHp <= 0;
    }

    move(keys) {
        if (keys.ArrowLeft) this.x = Math.max(0, this.x - this.speed);
        if (keys.ArrowRight) this.x = Math.min(CANVAS_WIDTH - this.width, this.x + this.speed);
        if (keys.ArrowUp) this.y = Math.max(0, this.y - this.speed);
        if (keys.ArrowDown) this.y = Math.min(CANVAS_HEIGHT - this.height, this.y + this.speed);
    }

    draw(ctx, sprite) {
        ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        const barWidth = 200;
        const barHeight = 20;
        const x = 10;
        const y = 10;
        
        ctx.fillStyle = 'red';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = 'green';
        ctx.fillRect(x, y, (this.currentHp / this.maxHp) * barWidth, barHeight);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}

class Enemy extends GameObject {
    constructor() {
        super(Math.random() * (CANVAS_WIDTH - ENEMY_WIDTH), -ENEMY_HEIGHT, ENEMY_WIDTH, ENEMY_HEIGHT, Math.random() * 3 + 2);
        this.lastShot = Date.now();
        this.shotDelay = Math.random() * 2000 + 1000;
    }

    update() {
        this.y += this.speed;
        return this.y > CANVAS_HEIGHT;
    }

    canShoot() {
        const now = Date.now();
        if (now - this.lastShot > this.shotDelay) {
            this.lastShot = now;
            this.shotDelay = Math.random() * 2000 + 1000;
            return Math.random() < 0.3;
        }
        return false;
    }

    draw(ctx, sprite) {
        ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
    }
}

class Bullet extends GameObject {
    constructor(x, y, speed) {
        super(x, y, BULLET_SIZE, BULLET_SIZE, speed);
    }

    update() {
        this.y += this.speed;
        return this.y < -this.height || this.y > CANVAS_HEIGHT;
    }

    draw(ctx) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        this.lifetime = 30;
    }

    update() {
        this.lifetime--;
        return this.lifetime <= 0;
    }

    draw(ctx, sprite) {
        ctx.drawImage(sprite, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.player = new Player();
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.keys = {};
        this.level = 1;
        this.gameOver = false;

        this.sprite = new Image();
        this.sprite.src = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rocket-hnXKFACD9q92utWO7leFCJqLNBeK2S.png';
        this.sprite.crossOrigin = 'anonymous';

        this.background = new Image();
        this.background.src = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cosmos-HTKBYfFUr2X3wCeR9dUF8mFD4deYVq.png';
        this.background.crossOrigin = 'anonymous';

        this.explosionSprite = new Image();
        this.explosionSprite.src = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/boom-vVvhlFTw532A0JhZTk06En1aprtI8F.gif';
        this.explosionSprite.crossOrigin = 'anonymous';

        this.explosions = [];
        this.explosionSound = new Audio('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/boom-aapOcxBzDd3XaVSN0Ut6bkIvaIxGVn.wav');


        this.bindEvents();
        this.spawnEnemies();
        this.gameLoop();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => this.keys[e.code] = true);
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.gameOver) {
                this.playerBullets.push(new Bullet(
                    this.player.x + this.player.width / 2 - BULLET_SIZE / 2,
                    this.player.y,
                    -15
                ));
            }
        });
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
    }

    spawnEnemies() {
        for (let i = 0; i < 5 + this.level; i++) {
            this.enemies.push(new Enemy());
        }
    }

    update() {
        if (this.gameOver) return;

        this.player.move(this.keys);
        
        this.enemies = this.enemies.filter(enemy => !enemy.update());
        this.enemies.forEach(enemy => {
            if (enemy.canShoot()) {
                this.enemyBullets.push(new Bullet(
                    enemy.x + enemy.width / 2 - BULLET_SIZE / 2,
                    enemy.y + enemy.height,
                    10
                ));
            }
        });
        
        this.playerBullets = this.playerBullets.filter(bullet => !bullet.update());
        this.enemyBullets = this.enemyBullets.filter(bullet => !bullet.update());
        
        this.checkCollisions();

        if (this.enemies.length === 0) {
            this.level++;
            this.spawnEnemies();
        }
    }

    checkCollisions() {
        this.enemies = this.enemies.filter(enemy => {
            const hit = this.playerBullets.some(bullet => this.checkCollision(bullet, enemy));
            if (hit) {
                this.explosionSound.currentTime = 0;
                this.explosionSound.play();
                this.explosions.push(new Explosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2));
                this.player.kills++;
                return false;
            }
            return true;
        });

        this.enemyBullets.forEach(bullet => {
            if (this.checkCollision(bullet, this.player)) {
                this.explosionSound.currentTime = 0;
                this.explosionSound.play();
                this.explosions.push(new Explosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2));
                if (this.player.takeDamage(10)) {
                    this.gameOver = true;
                    document.getElementById('gameOver').style.display = 'block';
                }
            }
        });
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    draw() {
        this.ctx.drawImage(this.background, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        this.player.draw(this.ctx, this.sprite);
        this.enemies.forEach(enemy => enemy.draw(this.ctx, this.sprite));
        this.playerBullets.forEach(bullet => bullet.draw(this.ctx));
        this.enemyBullets.forEach(bullet => bullet.draw(this.ctx));
        this.explosions = this.explosions.filter(explosion => {
            explosion.draw(this.ctx, this.explosionSprite);
            return !explosion.update();
        });

        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Kills: ${this.player.kills}`, 10, 50);
        this.ctx.fillText(`Level: ${this.level}`, 10, 80);
    }

    gameLoop() {
        this.update();
        this.draw();
        if (!this.gameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    restartGame() {
        this.player = new Player();
        this.enemies = [];
        this.playerBullets = [];
        this.enemyBullets = [];
        this.level = 1;
        this.gameOver = false;
        document.getElementById('gameOver').style.display = 'none';
        this.spawnEnemies();
        this.gameLoop();
    }
}

window.onload = () => new Game();