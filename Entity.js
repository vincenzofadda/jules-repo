import { TILE, TILE_SIZE } from './constants.js';

export class Entity {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.width = size;
        this.height = size;
        this.color = color;
        this.dead = false;
        this.speed = 0;
    }

    // AABB Collision with another entity
    collidesWith(other) {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }

    // Check collision with map walls
    // Returns true if position (x, y) collides with a wall
    checkMapCollision(x, y, map) {
        // Check all 4 corners of the entity's bounding box
        const corners = [
            { x: x, y: y },
            { x: x + this.width, y: y },
            { x: x, y: y + this.height },
            { x: x + this.width, y: y + this.height }
        ];

        for (const corner of corners) {
            const tileX = Math.floor(corner.x / TILE_SIZE);
            const tileY = Math.floor(corner.y / TILE_SIZE);

            if (tileX < 0 || tileX >= map.width || tileY < 0 || tileY >= map.height) {
                return true; // Out of bounds is collision
            }

            const tile = map.tiles[tileY * map.width + tileX];
            if (tile === TILE.WALL) {
                return true;
            }
        }
        return false;
    }

    render(ctx) {
        if (this.dead) return;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
