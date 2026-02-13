import { MAP_WIDTH, MAP_HEIGHT, TILE } from './constants.js';

export class MapGenerator {
    constructor() {
        this.generatedLevels = {}; // Persistence: { depth: levelData }
    }

    getLevel(depth) {
        if (this.generatedLevels[depth]) {
            return this.generatedLevels[depth];
        }
        const level = this.generateLevel(depth);
        this.generatedLevels[depth] = level;
        return level;
    }

    generateLevel(depth) {
        const map = {
            width: MAP_WIDTH,
            height: MAP_HEIGHT,
            tiles: new Array(MAP_WIDTH * MAP_HEIGHT).fill(TILE.WALL),
            entities: [], // Enemies, Chests
            playerStart: { x: 0, y: 0 },
            stairsDown: null,
            stairsUp: null,
            depth: depth
        };

        if (depth === 0) {
            this.generateSurface(map);
        } else {
            this.generateCave(map, depth);
        }

        this.calculateTileVariations(map);

        return map;
    }

    calculateTileVariations(map) {
        map.tileAdjacency = new Array(map.width * map.height).fill(null);

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const idx = y * map.width + x;
                // Only compute for Floor tiles
                if (map.tiles[idx] !== TILE.FLOOR) continue;

                const isWall = (dx, dy) => {
                    const nx = x + dx;
                    const ny = y + dy;
                    // Treat out of bounds as Wall
                    if (nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) return true;
                    return map.tiles[ny * map.width + nx] === TILE.WALL;
                };

                const t = isWall(0, -1);
                const b = isWall(0, 1);
                const l = isWall(-1, 0);
                const r = isWall(1, 0);
                const tl = isWall(-1, -1);
                const tr = isWall(1, -1);
                const bl = isWall(-1, 1);
                const br = isWall(1, 1);

                // Priority: Corners > Edges > Center
                if (t && l && tl) map.tileAdjacency[idx] = 'TopLeft';
                else if (t && r && tr) map.tileAdjacency[idx] = 'TopRight';
                else if (b && r && br) map.tileAdjacency[idx] = 'BottomRight';
                else if (b && l && bl) map.tileAdjacency[idx] = 'BottomLeft';
                else if (t) map.tileAdjacency[idx] = 'Top';
                else if (b) map.tileAdjacency[idx] = 'Bottom';
                else if (l) map.tileAdjacency[idx] = 'Left';
                else if (r) map.tileAdjacency[idx] = 'Right';
                else map.tileAdjacency[idx] = 'Center';
            }
        }
    }

    setTile(map, x, y, type) {
        if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
            map.tiles[y * map.width + x] = type;
        }
    }

    // Fills a rectangular area
    fillRect(map, x, y, w, h, type) {
        for (let i = x; i < x + w; i++) {
            for (let j = y; j < y + h; j++) {
                this.setTile(map, i, j, type);
            }
        }
    }

    // Fills a circular area
    fillCircle(map, cx, cy, radius, type) {
        for (let y = cy - radius; y <= cy + radius; y++) {
            for (let x = cx - radius; x <= cx + radius; x++) {
                if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2) {
                    this.setTile(map, x, y, type);
                }
            }
        }
    }

    generateSurface(map) {
        // Fill entire surface with Grass
        map.tiles.fill(TILE.GRASS);

        const cx = Math.floor(map.width / 2);
        const cy = Math.floor(map.height / 2);

        // Simple House Structure around entrance
        // Walls
        this.fillRect(map, cx - 4, cy - 4, 9, 9, TILE.HOUSE_WALL);
        // Floor inside house
        this.fillRect(map, cx - 3, cy - 3, 7, 7, TILE.FLOOR);

        // Door
        this.setTile(map, cx, cy + 4, TILE.FLOOR);

        // Place entrance to mine in the center of the house
        this.setTile(map, cx, cy, TILE.STAIRS_DOWN);
        map.stairsDown = { x: cx, y: cy };

        // Player starts outside the house
        map.playerStart = { x: cx, y: cy + 6 };

        // Maybe some trees (Walls) scattered
        for(let i=0; i<50; i++) {
             const tx = Math.floor(Math.random() * map.width);
             const ty = Math.floor(Math.random() * map.height);
             // Don't block house area
             if (Math.abs(tx - cx) > 10 || Math.abs(ty - cy) > 10) {
                 this.setTile(map, tx, ty, TILE.HOUSE_WALL); // Wood as tree trunk
             }
        }
    }

    generateCave(map, depth) {
        const cx = Math.floor(map.width / 2);
        const cy = Math.floor(map.height / 2);

        // 1. Massive Lobby
        // Increased radius for "Massive" feel
        const lobbyRadius = 15 + Math.floor(Math.random() * 5); // 15-20 radius
        this.fillCircle(map, cx, cy, lobbyRadius, TILE.FLOOR);

        // Place Stairs Down in Center
        this.setTile(map, cx, cy, TILE.STAIRS_DOWN);
        map.stairsDown = { x: cx, y: cy };

        // Place Stairs Up near edge (safe zone)
        // Ensure it's within the floor area
        const upX = cx - (lobbyRadius - 3);
        const upY = cy;
        this.setTile(map, upX, upY, TILE.STAIRS_UP);
        map.stairsUp = { x: upX, y: upY };
        map.playerStart = { x: upX, y: upY }; // Start on stairs up

        // Spawn Lobby Enemies (Guardians)
        // Must be killed to progress
        const numLobbyEnemies = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numLobbyEnemies; i++) {
             const angle = Math.random() * Math.PI * 2;
             // Spawn between center and edge
             const r = 5 + Math.random() * (lobbyRadius - 6);
             map.entities.push({
                 type: 'enemy',
                 x: cx + Math.cos(angle) * r,
                 y: cy + Math.sin(angle) * r,
                 inLobby: true
             });
        }

        // 2. Long Branches
        const numBranches = 4 + Math.floor(Math.random() * 2); // 4-5 branches
        const branchLength = 35 + Math.floor(Math.random() * 10); // 35-45 length (Long)
        const branchWidth = 4;

        for (let i = 0; i < numBranches; i++) {
            // Distribute branches evenly
            const angle = (i / numBranches) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);

            // Start from edge of lobby
            let startX = cx + dx * (lobbyRadius - 1);
            let startY = cy + dy * (lobbyRadius - 1);

            // Dig corridor
            // Use a slightly wandering path for natural feel but generally straight
            let currentX = startX;
            let currentY = startY;

            for (let dist = 0; dist < branchLength; dist++) {
                this.fillCircle(map, Math.floor(currentX), Math.floor(currentY), branchWidth / 2, TILE.FLOOR);

                // Slight wander
                currentX += dx + (Math.random() * 0.4 - 0.2);
                currentY += dy + (Math.random() * 0.4 - 0.2);
            }

            // End Room (for Chest)
            const endX = Math.floor(currentX);
            const endY = Math.floor(currentY);
            this.fillCircle(map, endX, endY, 4, TILE.FLOOR);

            // Place Treasure Chest
            // Chest logic will handle the loot generation (min 4 items, 1 rare)
            map.entities.push({
                type: 'chest',
                x: endX,
                y: endY,
                isBossChest: false, // Normal chest (Min 4 items, 1 Rare)
                isLocked: false // Not locking them for now unless specified
            });

            // Spawn Branch Enemies
            const enemiesInBranch = 3 + Math.floor(Math.random() * 3);
            for (let j = 0; j < enemiesInBranch; j++) {
                // Place randomly along the branch
                const dist = 5 + Math.random() * (branchLength - 10);
                const tx = startX + dx * dist + (Math.random() * 4 - 2);
                const ty = startY + dy * dist + (Math.random() * 4 - 2);

                // Ensure it's on floor (simple check usually passes if corridor is wide enough)
                map.entities.push({
                    type: 'enemy',
                    x: tx,
                    y: ty,
                    inLobby: false
                });
            }
        }
    }
}
