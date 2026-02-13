import { TILE, TILE_SIZE } from './constants.js';

export class TextureManager {
    constructor() {
        // Load Main Cave Tileset
        this.mainCaveSheet = new Image();
        this.mainCaveSheet.src = 'assets/MainCave.png';
        this.mainCaveLoaded = false;

        this.mainCaveSheet.onload = () => {
            this.mainCaveLoaded = true;
        };

        // Keep old sheets for fallback/walls for now
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

    // Helper to get pixel coordinates from matrix indices
    getFrame(col, row) {
        return {
            x: col * 32,
            y: row * 32
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
            // Fallback to old assets
            const destW = 40;
            const destH = 35;
            const destX = x + (TILE_SIZE - destW) / 2;
            const destY = y + (TILE_SIZE - destH);
            ctx.drawImage(this.assetsSheet, 164, 32, 32, 28, destX, destY, destW, destH);
        } else {
            // Primitive Fallback
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
            if (this.mainCaveLoaded) {
                let frame = { x: 0, y: 0 };

                // Use MainCave.png coordinates (Scattered Grid based on asset layout)
                // Rows: 27, 28, 29
                // Cols: 28, 32, 36 (Spacing of 4)

                // Top: (32, 27)
                // Right: (36, 28)
                // ... etc

                // Deterministic variation based on position
                const variation = (x + y * 57) % 3;

                switch(adjacency) {
                    case 'Top':
                        // (32,27), (33,27), (34,27)
                        frame = this.getFrame(32 + variation, 27);
                        break;
                    case 'Bottom':
                        // (32,31), (33,31), (34,31)
                        frame = this.getFrame(32 + variation, 31);
                        break;
                    case 'Left':
                        // (40,28), (40,29), (40,30)
                        frame = this.getFrame(40, 28 + variation);
                        break;
                    case 'Right':
                        // (36,28), (36,29), (36,30)
                        frame = this.getFrame(36, 28 + variation);
                        break;
                    case 'TopLeft':
                        // (40,27) deduced
                        frame = this.getFrame(40, 27);
                        break;
                    case 'TopRight':
                        // (36,27) deduced
                        frame = this.getFrame(36, 27);
                        break;
                    case 'BottomLeft':
                        // (40,31) deduced
                        frame = this.getFrame(40, 31);
                        break;
                    case 'BottomRight':
                        // (36,31) deduced
                        frame = this.getFrame(36, 31);
                        break;
                    case 'Center':
                    default:
                        // (32,28) to (34,30) - 3x3 grid
                        const colVar = (x * 13 + y * 7) % 3;
                        const rowVar = (x * 23 + y * 17) % 3;
                        frame = this.getFrame(32 + colVar, 28 + rowVar);
                        break;
                }

                ctx.drawImage(this.mainCaveSheet, frame.x, frame.y, 32, 32, x, y, TILE_SIZE, TILE_SIZE);

            } else if (this.sheetLoaded) {
                // Fallback to old sheet logic
                let sx, sy;
                // ... (Old Logic omitted for brevity, but kept structure if needed)
                 if (adjacency && adjacency !== 'Center') {
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
                     sx = 8; sy = 5;
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
