import { TILE, TILE_SIZE } from './constants.js';

export class TextureManager {
    constructor() {
        this.sheet = new Image();
        this.sheet.src = 'assets/ground-tiles.png';
        this.sheetLoaded = false;

        this.sheet.onload = () => {
            this.sheetLoaded = true;
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

    drawTile(ctx, tileType, x, y) {
        if (tileType === TILE.WALL) {
            if (this.sheetLoaded) {
                // Cave Wall (Top) - (0, 0)
                // Actually, let's use the brown block at 0,0 for wall tops?
                // The prompt image shows:
                // Row 1 (y=0): Solid Brown
                // Row 2 (y=32): Solid Brown Top, Stone Bottom
                // Row 3 (y=64): Stone Floor

                // Let's use (0, 0) for walls
                ctx.drawImage(this.sheet, 0, 0, 32, 32, x, y, TILE_SIZE, TILE_SIZE);

                // Optional: Check if tile below is floor to draw the "Face" (Row 2)?
                // That requires context of map. For now, simple mapping.
            } else {
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        } else if (tileType === TILE.FLOOR) {
            if (this.sheetLoaded) {
                // Deterministic variation based on position
                // Normalize X/Y to grid coords for hash
                const tx = Math.floor(x / TILE_SIZE);
                const ty = Math.floor(y / TILE_SIZE);
                const hash = Math.abs(Math.sin(tx * 12.9898 + ty * 78.233) * 43758.5453) % 1;

                let sx, sy;

                if (hash < 0.80) {
                    // Floor 1 (80%): x=8, y=5
                    sx = 8; sy = 5;
                } else if (hash < 0.85) {
                    // Floor 2 (5%): x=128, y=160
                    sx = 128; sy = 160;
                } else if (hash < 0.90) {
                    // Floor 3 (5%): x=160, y=160
                    sx = 160; sy = 160;
                } else if (hash < 0.95) {
                    // Floor 4 (5%): x=160, y=192
                    sx = 160; sy = 192;
                } else {
                    // Floor 5 (5%): x=128, y=192
                    sx = 128; sy = 192;
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
