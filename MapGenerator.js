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

        return map;
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
        const cx = Math.floor(map.width / 2);
        const cy = Math.floor(map.height / 2);
        const radius = 15;

        // Clear a circular area for the surface entrance
        this.fillCircle(map, cx, cy, radius, TILE.FLOOR);

        // Place entrance to mine in the center
        this.setTile(map, cx, cy, TILE.STAIRS_DOWN);
        map.stairsDown = { x: cx, y: cy };

        // Player starts near the entrance
        map.playerStart = { x: cx - 5, y: cy };
    }

    generateCave(map, depth) {
        const cx = Math.floor(map.width / 2);
        const cy = Math.floor(map.height / 2);

        // 1. Massive Lobby
        const lobbyRadius = 12 + Math.floor(Math.random() * 5); // 12-16 radius
        this.fillCircle(map, cx, cy, lobbyRadius, TILE.FLOOR);

        // Place Stairs Down (Locked initially logic handled by Game)
        this.setTile(map, cx, cy, TILE.STAIRS_DOWN);
        map.stairsDown = { x: cx, y: cy };

        // Spawn Lobby Enemies
        for (let i = 0; i < 3; i++) {
             const angle = Math.random() * Math.PI * 2;
             const r = Math.random() * (lobbyRadius - 2);
             map.entities.push({
                 type: 'enemy',
                 x: cx + Math.cos(angle) * r,
                 y: cy + Math.sin(angle) * r,
                 inLobby: true
             });
        }

        // Place Stairs Up (Back to prev level) - slightly offset
        const upX = cx - 8;
        const upY = cy;
        this.setTile(map, upX, upY, TILE.STAIRS_UP);
        map.stairsUp = { x: upX, y: upY };
        map.playerStart = { x: upX, y: upY }; // Start on stairs up

        // 2. Branches
        const numBranches = 4 + Math.floor(Math.random() * 3); // 4-6 branches
        const branchLength = 25 + Math.floor(Math.random() * 10); // 25-35 length
        const branchWidth = 4;

        for (let i = 0; i < numBranches; i++) {
            const angle = (i / numBranches) * Math.PI * 2 + (Math.random() * 0.5 - 0.25);
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);

            // Start from edge of lobby
            let startX = cx + dx * (lobbyRadius - 2);
            let startY = cy + dy * (lobbyRadius - 2);

            // Dig corridor
            for (let dist = 0; dist < branchLength; dist++) {
                const tx = Math.floor(startX + dx * dist);
                const ty = Math.floor(startY + dy * dist);

                // Draw a wide corridor (brush)
                this.fillCircle(map, tx, ty, branchWidth / 2, TILE.FLOOR);
            }

            // End Room
            const endX = Math.floor(startX + dx * branchLength);
            const endY = Math.floor(startY + dy * branchLength);
            this.fillCircle(map, endX, endY, 5, TILE.FLOOR);

            // Place Chest
            map.entities.push({
                type: 'chest',
                x: endX,
                y: endY
            });

            // Spawn Branch Enemies
            for (let j = 0; j < 2; j++) {
                const dist = Math.random() * branchLength;
                const tx = Math.floor(startX + dx * dist);
                const ty = Math.floor(startY + dy * dist);
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
