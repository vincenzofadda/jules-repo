import { TILE, TILE_SIZE } from './constants.js';

export class TextureManager {
    constructor() {
        this.sheet = new Image();
        this.sheet.src = 'assets/ground-tiles.png';
        this.sheetLoaded = false;

        this.sheet.onload = () => {
            this.sheetLoaded = true;
        };

        this.wallSheet = new Image();
        this.wallSheet.src = 'assets/wall-transition-tiles-32x32.png';
        this.wallSheetLoaded = false;

        this.wallSheet.onload = () => {
            this.wallSheetLoaded = true;
        };

        this.assetsSheet = new Image();
        this.assetsSheet.src = 'assets/assets-all.png';
        this.assetsLoaded = false;

        this.assetsSheet.onload = () => {
            this.assetsLoaded = true;
        };

        // Procedural fallbacks for surface (Grass, House)
        this.textures = {
            grass: this.createColorTexture('#27ae60'),
            houseWall: this.createColorTexture('#795548'),
            stairsDown: this.createStairsTexture(true),
            stairsUp: this.createStairsTexture(false)
        };
    }

    // Helper to create simple textures for missing assets
    createColorTexture(color) {
        const canvas = document.createElement('canvas');
        canvas.width = TILE_SIZE;
        canvas.height = TILE_SIZE;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

        // Add noise/details
        if (color === '#27ae60') { // Grass
             for (let i = 0; i < 40; i++) {
                ctx.fillStyle = Math.random() < 0.5 ? '#2ecc71' : '#1e8449';
                const x = Math.floor(Math.random() * 32);
                const y = Math.floor(Math.random() * 32);
                ctx.fillRect(x, y, 2, 4);
            }
        }

        return canvas;
    }

    createStairsTexture(down) {
        const canvas = document.createElement('canvas');
        canvas.width = TILE_SIZE;
        canvas.height = TILE_SIZE;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, 32, 32);

        const start = down ? 0 : 4;
        const end = down ? 4 : 0; // direction logic

        for(let i=0; i<4; i++) {
            const shade = down ? 100 - (i * 20) : 40 + (i * 20);
            ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
            ctx.fillRect(4 + i*2, 4 + i*2, 24 - i*4, 24 - i*4);
        }
        return canvas;
    }

    drawChest(ctx, x, y, opened) {
        // Draw floor tile underneath (Center variation by default)
        this.drawTile(ctx, TILE.FLOOR, x, y, 'Center');

        if (this.assetsLoaded) {
            // Chest Sprite: x=164, y=32, 32x28 (Closed)
            // If opened, maybe use next sprite?
            // The prompt says "troque o quadrado do baú para o tileset que está em (x=164 y=32)".
            // Assuming this is the closed chest.
            // If opened, let's just use the same sprite or tint it for now as requested?
            // Actually, usually open chest is next to it. Let's look at standard spritesheets.
            // But prompt specifically asked for (164, 32).
            // Let's use 164, 32 for closed.
            // If opened, let's assume it's the one below it at 164, 64 (32+32) or just use the closed one if not specified.
            // Prompt: "troque o quadrado do baú para o tileset que está em (x=164 y=32)".

            // Draw centered horizontally, bottom aligned vertically in the tile
            // Tile height 32. Sprite height 28. Y offset = 4.
            const sy = opened ? 64 : 32; // Trying a guess for opened chest? No, stick to prompt instructions first.
            // Prompt didn't specify open chest sprite.
            // However, common sense: "Opened" state needs visual feedback.
            // But strict instruction: use (164, 32).
            // I'll stick to (164, 32) for now. If I can't guess opened, I'll just draw it as is.
            // Actually, let's assume 164, 32 is the base.

            // Wait, looking at the previous Chest.render logic, it drew a lock if closed.
            // Now we use a sprite.

            // Let's check if the user provided image has an open chest.
            // I can't see the image.
            // I will use (164, 32) for closed.
            // For open, I'll use the same sprite but maybe darken it? Or just leave it as is.
            // But better: The user likely wants the *visual* of a chest.
            // Let's just use 164, 32.

            // Draw slightly larger (1.25x) and centered at the bottom
            const destW = 40;
            const destH = 35;
            const destX = x + (TILE_SIZE - destW) / 2;
            const destY = y + (TILE_SIZE - destH); // Align bottom

            ctx.drawImage(this.assetsSheet, 164, 32, 32, 28, destX, destY, destW, destH);
        } else {
            // Fallback
            ctx.fillStyle = '#d35400';
            ctx.fillRect(x + 4, y + 4, 24, 24);
        }
    }

    drawTile(ctx, tileType, x, y, adjacency = 'Center') {
        if (tileType === TILE.WALL) {
            if (this.wallSheetLoaded) {
                // New Wall Tileset (x=32, y=32)
                ctx.drawImage(this.wallSheet, 32, 32, 32, 32, x, y, TILE_SIZE, TILE_SIZE);
            } else if (this.sheetLoaded) {
                 // Fallback to old wall logic if new sheet fails (or loading)
                ctx.drawImage(this.sheet, 0, 0, 32, 32, x, y, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        } else if (tileType === TILE.FLOOR) {
            if (this.sheetLoaded) {
                let sx, sy;

                if (adjacency && adjacency !== 'Center') {
                    // Wall-Adjacent Floors
                    switch(adjacency) {
                        case 'Top': sx = 34; sy = 0; break;
                        case 'Right': sx = 61; sy = 32; break;
                        case 'Left': sx = 3; sy = 32; break;
                        case 'Bottom': sx = 160; sy = 416; break;
                        case 'TopLeft': sx = 3; sy = 0; break;
                        case 'TopRight': sx = 61; sy = 0; break;
                        case 'BottomRight': sx = 192; sy = 416; break;
                        case 'BottomLeft': sx = 134; sy = 416; break;
                        default: sx = 8; sy = 5;
                    }
                } else {
                    // Center Floors (Random)
                    // Deterministic variation based on position
                    const tx = Math.floor(x / TILE_SIZE);
                    const ty = Math.floor(y / TILE_SIZE);
                    const hash = Math.abs(Math.sin(tx * 12.9898 + ty * 78.233) * 43758.5453) % 1;

                    if (hash < 0.90) {
                        // Floor 1 (90%): x=8, y=5
                        sx = 8; sy = 5;
                    } else {
                        // Floors 2-5 (10% total, 2.5% each)
                        if (hash < 0.925) {
                            // Floor 2: x=128, y=160
                            sx = 128; sy = 160;
                        } else if (hash < 0.95) {
                            // Floor 3: x=160, y=160
                            sx = 160; sy = 160;
                        } else if (hash < 0.975) {
                            // Floor 4: x=160, y=192
                            sx = 160; sy = 192;
                        } else {
                            // Floor 5: x=128, y=192
                            sx = 128; sy = 192;
                        }
                    }
                }

                ctx.drawImage(this.sheet, sx, sy, 32, 32, x, y, TILE_SIZE, TILE_SIZE);
            } else {
                ctx.fillStyle = '#7f8c8d';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        } else if (tileType === TILE.GRASS) {
            ctx.drawImage(this.textures.grass, x, y, TILE_SIZE, TILE_SIZE);
        } else if (tileType === TILE.HOUSE_WALL) {
            ctx.drawImage(this.textures.houseWall, x, y, TILE_SIZE, TILE_SIZE);
        } else if (tileType === TILE.STAIRS_DOWN) {
            ctx.drawImage(this.textures.stairsDown, x, y, TILE_SIZE, TILE_SIZE);
        } else if (tileType === TILE.STAIRS_UP) {
            ctx.drawImage(this.textures.stairsUp, x, y, TILE_SIZE, TILE_SIZE);
        }
    }
}
