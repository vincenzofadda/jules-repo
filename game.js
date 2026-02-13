import { MapGenerator } from './MapGenerator.js';
import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { Chest } from './Loot.js';
import { Input } from './Input.js';
import { UIManager } from './UIManager.js';
import { ItemGenerator, RARITY } from './Item.js';
import { TextureManager } from './TextureManager.js';
import { TILE, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from './constants.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.input = new Input();
        this.mapGenerator = new MapGenerator();
        this.currentLevel = null;
        this.camera = { x: 0, y: 0 };

        this.player = new Player(0, 0);

        this.uiManager = new UIManager(this);

        this.textureManager = new TextureManager();

        this.isRunning = false;
        this.lastTime = 0;

        // Cache related
        this.levelCache = document.createElement('canvas');
        this.levelCacheCtx = this.levelCache.getContext('2d');
        this.cacheDirty = false;

        // UI References
        this.startScreen = document.getElementById('start-screen');
        this.startBtn = document.getElementById('start-btn');
        this.hud = document.getElementById('hud');
        this.playerHealthBar = document.getElementById('player-health-bar');
        this.playerHealthText = document.getElementById('player-health-text');
        this.dashSegments = [
            document.getElementById('dash-1'),
            document.getElementById('dash-2'),
            document.getElementById('dash-3')
        ];

        // Bind events
        this.startBtn.addEventListener('click', () => this.startGame());
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('mousedown', (e) => this.handleCanvasClick(e));

        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'e') {
                this.handleInteraction();
            }
        });

        // Initial Draw
        this.drawStartScreen();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (!this.isRunning) this.drawStartScreen();
    }

    startGame() {
        this.loadLevel(0, 'start'); // Start at Surface

        // Give starter weapon if new game
        if (!this.player.equipment.weapon) {
             const starterSword = ItemGenerator.generateItem(1, RARITY.COMMON, 'weapon');
             starterSword.name = "Rusty Sword";
             this.player.inventory.add(starterSword);
             this.uiManager.equipItem(0);
        }

        this.isRunning = true;
        this.startScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
        this.lastTime = performance.now();
        requestAnimationFrame((ts) => this.loop(ts));
    }

    loadLevel(depth, spawnAt = 'start') {
        this.currentLevel = this.mapGenerator.getLevel(depth);

        // Convert map entities to game objects if not already done
        if (!this.currentLevel.gameObjects) {
            this.currentLevel.gameObjects = [];
            this.currentLevel.entities.forEach(ent => {
                if (ent.type === 'enemy') {
                    const enemy = new Enemy(
                        ent.x * TILE_SIZE + TILE_SIZE/2 - 16, // Center
                        ent.y * TILE_SIZE + TILE_SIZE/2 - 16
                    );
                    enemy.inLobby = ent.inLobby;
                    if (ent.isBoss) {
                        enemy.makeBoss(ent.keyToDrop);
                    }
                    this.currentLevel.gameObjects.push(enemy);
                } else if (ent.type === 'chest') {
                    const chest = new Chest(
                        ent.x * TILE_SIZE,
                        ent.y * TILE_SIZE
                    );
                    chest.isLocked = ent.isLocked;
                    chest.keyId = ent.keyId;
                    chest.isBossChest = ent.isBossChest;

                    if (chest.isBossChest) {
                        chest.width = TILE_SIZE * 2;
                        chest.height = TILE_SIZE * 2;
                        chest.color = '#f1c40f'; // Gold
                    }

                    this.currentLevel.gameObjects.push(chest);
                }
            });
        }

        // Cache the level for performance
        this.cacheLevel();
        this.cacheDirty = true; // Mark dirty to ensure update loop checks it

        // Set player position
        let targetPos = this.currentLevel.playerStart;

        if (spawnAt === 'stairsUp' && this.currentLevel.stairsUp) {
            targetPos = this.currentLevel.stairsUp;
        } else if (spawnAt === 'stairsDown' && this.currentLevel.stairsDown) {
            targetPos = this.currentLevel.stairsDown;
        }

        if (targetPos) {
            this.player.x = targetPos.x * TILE_SIZE + TILE_SIZE / 2 - this.player.width/2;
            this.player.y = targetPos.y * TILE_SIZE + TILE_SIZE / 2 - this.player.height/2;
        } else {
            // Fallback center of map
            this.player.x = (this.currentLevel.width * TILE_SIZE) / 2;
            this.player.y = (this.currentLevel.height * TILE_SIZE) / 2;
        }
    }

    cacheLevel() {
        if (!this.currentLevel) return;

        this.levelCache.width = this.currentLevel.width * TILE_SIZE;
        this.levelCache.height = this.currentLevel.height * TILE_SIZE;

        // Disable smoothing on cache context too
        this.levelCacheCtx.imageSmoothingEnabled = false;

        for (let y = 0; y < this.currentLevel.height; y++) {
            for (let x = 0; x < this.currentLevel.width; x++) {
                const idx = y * this.currentLevel.width + x;
                const tile = this.currentLevel.tiles[idx];
                const adjacency = this.currentLevel.tileAdjacency ? this.currentLevel.tileAdjacency[idx] : null;
                const posX = x * TILE_SIZE;
                const posY = y * TILE_SIZE;

                this.textureManager.drawTile(this.levelCacheCtx, tile, posX, posY, adjacency);
            }
        }
    }

    update(dt) {
        if (!this.currentLevel) return;

        // Check if textures loaded and cache needs update
        if (this.textureManager.sheetLoaded && this.textureManager.wallSheetLoaded && this.textureManager.assetsLoaded && this.cacheDirty) {
             this.cacheLevel();
             this.cacheDirty = false; // Only re-cache once after load
        }
        // Force re-cache if first run and textures just loaded
        if ((!this.textureManager.sheetLoaded || !this.textureManager.wallSheetLoaded) && !this.cacheDirty) {
             this.cacheDirty = true; // Mark dirty so we re-cache when they load
        }

        const enemies = this.currentLevel.gameObjects.filter(e => e instanceof Enemy);
        this.player.update(dt, this.input, this.currentLevel, enemies);

        enemies.forEach(enemy => {
            enemy.update(dt, this.player, this.currentLevel);
        });

        // Simple camera follow
        this.camera.x = this.player.x + this.player.width / 2 - this.canvas.width / 2;
        this.camera.y = this.player.y + this.player.height / 2 - this.canvas.height / 2;

        // Clamp camera to map bounds
        const mapPixelWidth = this.currentLevel.width * TILE_SIZE;
        const mapPixelHeight = this.currentLevel.height * TILE_SIZE;
        this.camera.x = Math.max(0, Math.min(this.camera.x, mapPixelWidth - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, mapPixelHeight - this.canvas.height));

        this.updateHUD();
    }

    handleCanvasClick(e) {
        if (!this.currentLevel) return;

        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left + this.camera.x;
        const clickY = e.clientY - rect.top + this.camera.y;

        // Check for clicks on Tiles (Stairs)
        const tileX = Math.floor(clickX / TILE_SIZE);
        const tileY = Math.floor(clickY / TILE_SIZE);

        if (tileX >= 0 && tileX < this.currentLevel.width && tileY >= 0 && tileY < this.currentLevel.height) {
            const tile = this.currentLevel.tiles[tileY * this.currentLevel.width + tileX];

            if (tile === TILE.STAIRS_DOWN) {
                const dist = Math.sqrt((this.player.x + 16 - (tileX * TILE_SIZE + 24))**2 + (this.player.y + 16 - (tileY * TILE_SIZE + 24))**2);
                if (dist < 60) {
                    this.tryDescendLevel();
                    return;
                }
            } else if (tile === TILE.STAIRS_UP) {
                const dist = Math.sqrt((this.player.x + 16 - (tileX * TILE_SIZE + 24))**2 + (this.player.y + 16 - (tileY * TILE_SIZE + 24))**2);
                if (dist < 60) {
                    this.ascendLevel();
                    return;
                }
            }
        }

        // Check for clicks on entities
        // Iterate backwards to click on top-most
        for (let i = this.currentLevel.gameObjects.length - 1; i >= 0; i--) {
            const ent = this.currentLevel.gameObjects[i];

            if (clickX >= ent.x && clickX <= ent.x + ent.width &&
                clickY >= ent.y && clickY <= ent.y + ent.height) {

                if (ent instanceof Chest) {
                    // Check distance
                    const dist = Math.sqrt((ent.x - this.player.x)**2 + (ent.y - this.player.y)**2);
                    if (dist < 100) { // Interaction range
                         this.openChest(ent);
                         return;
                    }
                } else if (ent instanceof Enemy && ent.dead) {
                    const dist = Math.sqrt((ent.x - this.player.x)**2 + (ent.y - this.player.y)**2);
                    if (dist < 100) {
                        this.uiManager.openLoot(ent);
                        return;
                    }
                }
            }
        }
    }

    tryDescendLevel() {
        // Check if all Lobby Enemies are dead
        const lobbyEnemies = this.currentLevel.gameObjects.filter(e => e instanceof Enemy && e.inLobby && !e.dead);

        if (lobbyEnemies.length > 0) {
            alert("You must defeat all enemies in the lobby to proceed!");
            return;
        }

        const nextDepth = this.currentLevel.depth + 1;
        this.loadLevel(nextDepth, 'stairsUp');
    }

    ascendLevel() {
        const prevDepth = this.currentLevel.depth - 1;
        if (prevDepth >= 0) {
            this.loadLevel(prevDepth, 'stairsDown');
        }
    }

    handleInteraction() {
        if (!this.currentLevel || this.player.dead) return;

        const px = this.player.x + this.player.width / 2;
        const py = this.player.y + this.player.height / 2;

        let nearestDist = Infinity;
        let nearestAction = null;

        // Check Entities (Chests, Dead Enemies)
        this.currentLevel.gameObjects.forEach(ent => {
             const cx = ent.x + ent.width / 2;
             const cy = ent.y + ent.height / 2;
             const dist = Math.sqrt((cx - px)**2 + (cy - py)**2);

             if (dist < 100 && dist < nearestDist) {
                 if (ent instanceof Chest) {
                     nearestDist = dist;
                     nearestAction = () => this.openChest(ent);
                 } else if (ent instanceof Enemy && ent.dead) {
                     nearestDist = dist;
                     nearestAction = () => this.uiManager.openLoot(ent);
                 }
             }
        });

        // Check Tiles (Stairs)
        // Check player's current tile
        const tileX = Math.floor(px / TILE_SIZE);
        const tileY = Math.floor(py / TILE_SIZE);
        if (tileX >= 0 && tileX < this.currentLevel.width && tileY >= 0 && tileY < this.currentLevel.height) {
            const tile = this.currentLevel.tiles[tileY * this.currentLevel.width + tileX];
            // Distance to tile center
            const cx = tileX * TILE_SIZE + TILE_SIZE / 2;
            const cy = tileY * TILE_SIZE + TILE_SIZE / 2;
            const dist = Math.sqrt((cx - px)**2 + (cy - py)**2);

            if (dist < 60 && dist < nearestDist) {
                 if (tile === TILE.STAIRS_DOWN) {
                     nearestDist = dist;
                     nearestAction = () => this.tryDescendLevel();
                 } else if (tile === TILE.STAIRS_UP) {
                     nearestDist = dist;
                     nearestAction = () => this.ascendLevel();
                 }
            }
        }

        if (nearestAction) {
            nearestAction();
        }
    }

    openChest(ent) {
         if (!ent.opened) {
             const items = ent.open(1, this.player);
             if (items === null) {
                 alert("Locked! You need a key.");
                 return;
             }
             ent.items = items;
         }
         this.uiManager.openLoot(ent);
    }

    updateHUD() {
        const hpPercent = Math.max(0, (this.player.health / this.player.maxHealth) * 100);
        this.playerHealthBar.style.width = `${hpPercent}%`;
        this.playerHealthText.innerText = `${Math.ceil(this.player.health)}/${this.player.maxHealth}`;

        // Update Dash UI
        for (let i = 0; i < 3; i++) {
            const segment = this.dashSegments[i];
            if (i < this.player.dashCharges) {
                segment.classList.add('active');
                segment.classList.remove('recharging');
                segment.style.width = '30px';
            } else if (i === this.player.dashCharges) {
                // This is the segment currently recharging
                segment.classList.remove('active');
                segment.classList.add('recharging');
                const percent = this.player.dashCooldownTimer / this.player.dashCooldownTime;
                segment.style.width = `${Math.max(1, percent * 30)}px`;
            } else {
                // Empty segments (waiting for previous to fill)
                segment.classList.remove('active');
                segment.classList.remove('recharging');
                segment.style.width = '30px'; // Keep width but low opacity
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Ensure main context is pixelated
        this.ctx.imageSmoothingEnabled = false;

        if (!this.currentLevel) return;

        this.ctx.save();

        // Integer camera position to prevent sub-pixel rendering (lines artifact)
        const camX = Math.floor(this.camera.x);
        const camY = Math.floor(this.camera.y);

        this.ctx.translate(-camX, -camY);

        // Draw Cached Map
        // Draw the visible portion of the cached map
        // Source: (camX, camY)
        // Dest: (camX, camY) because we translated the context
        // Ensure source coordinates are within bounds
        const sx = Math.max(0, camX);
        const sy = Math.max(0, camY);
        const sw = Math.min(this.canvas.width, this.levelCache.width - sx);
        const sh = Math.min(this.canvas.height, this.levelCache.height - sy);

        if (sw > 0 && sh > 0) {
            this.ctx.drawImage(this.levelCache,
                sx, sy, sw, sh,
                sx, sy, sw, sh
            );
        }

        // Draw Entities
        this.currentLevel.gameObjects.forEach(ent => {
            ent.render(this.ctx, this.textureManager);
        });

        // Draw Player
        this.player.render(this.ctx, this.textureManager);

        this.ctx.restore();
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((ts) => this.loop(ts));
    }

    drawStartScreen() {
        // Just clear background for the UI to sit on top
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Initialize Game
window.addEventListener('load', () => {
    window.game = new Game();
});