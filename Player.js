import { Entity } from './Entity.js';
import { Inventory } from './Inventory.js';
import { TILE_SIZE } from './constants.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 32, '#3498db');
        this.speed = 200; // pixels per second
        this.maxHealth = 100;
        this.health = 100;
        this.inventory = new Inventory(48); // 6x8
        this.equipment = {
            weapon: null,
            armor: null
        };
        this.attackRange = 60;
        this.attackCooldown = 0;
        this.attackSpeed = 0.5; // Attacks per second
        this.damage = 10;
    }

    takeDamage(amount) {
        // Apply defense from equipment
        let defense = 0;
        if (this.equipment.armor) defense += this.equipment.armor.stats.defense || 0;
        if (this.equipment.weapon) defense += this.equipment.weapon.stats.defense || 0; // Rare weapons might have defense

        const damageTaken = Math.max(1, amount - defense);

        this.health -= damageTaken;
        if (this.health <= 0) {
            this.health = 0;
            this.dead = true;
            console.log("Player Died!");
        }
    }

    attack(enemies) {
        if (this.attackCooldown > 0) return;

        let nearest = null;
        let minDist = Infinity;

        enemies.forEach(enemy => {
            if (enemy.dead) return;
            const dist = Math.sqrt((enemy.x - this.x)**2 + (enemy.y - this.y)**2);
            if (dist < this.attackRange && dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });

        if (nearest) {
            let damage = this.damage;
            if (this.equipment.weapon) damage += this.equipment.weapon.stats.damage || 0;

            nearest.takeDamage(damage);
            this.attackCooldown = this.attackSpeed;
        }
    }

    update(dt, input, map, enemies) {
        if (this.dead) return;

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        // Auto Attack logic
        if (enemies) {
            this.attack(enemies);
        }

        let dx = 0;
        let dy = 0;

        if (input.keys['w'] || input.keys['arrowup']) dy = -1;
        if (input.keys['s'] || input.keys['arrowdown']) dy = 1;
        if (input.keys['a'] || input.keys['arrowleft']) dx = -1;
        if (input.keys['d'] || input.keys['arrowright']) dx = 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        const moveX = dx * this.speed * dt;
        const moveY = dy * this.speed * dt;

        // X Collision
        if (!this.checkMapCollision(this.x + moveX, this.y, map)) {
            this.x += moveX;
        }

        // Y Collision
        if (!this.checkMapCollision(this.x, this.y + moveY, map)) {
            this.y += moveY;
        }

        // Clamp to map boundaries
        this.x = Math.max(0, Math.min(this.x, map.width * TILE_SIZE - this.width));
        this.y = Math.max(0, Math.min(this.y, map.height * TILE_SIZE - this.height));
    }
}
