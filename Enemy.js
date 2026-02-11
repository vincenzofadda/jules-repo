import { Entity } from './Entity.js';
import { ItemGenerator, Item, ITEM_TYPE, RARITY } from './Item.js';
import { TILE_SIZE } from './constants.js';

export class Enemy extends Entity {
    constructor(x, y) {
        super(x, y, 32, '#e74c3c'); // Red
        this.speed = 100;
        this.maxHealth = 30;
        this.health = 30;
        this.damage = 5;
        this.attackRange = 40;
        this.attackCooldown = 0;
        this.attackSpeed = 1.0; // Seconds between attacks
        this.type = 'enemy';
        this.loot = null;
        this.isBoss = false;
        this.keyToDrop = null; // If boss
    }

    makeBoss(keyId) {
        this.isBoss = true;
        this.width *= 2;
        this.height *= 2;
        this.maxHealth *= 3;
        this.health = this.maxHealth;
        this.color = '#c0392b'; // Darker Red
        this.keyToDrop = keyId;
    }

    update(dt, player, map) {
        if (this.dead) return;

        // Simple AI: Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 300) { // Aggro range
            if (dist > 32) { // Stop if touching (roughly)
                const moveX = (dx / dist) * this.speed * dt;
                const moveY = (dy / dist) * this.speed * dt;

                if (!this.checkMapCollision(this.x + moveX, this.y, map)) {
                    this.x += moveX;
                }
                if (!this.checkMapCollision(this.x, this.y + moveY, map)) {
                    this.y += moveY;
                }
            }

            // Attack Player
            if (dist < this.attackRange) {
                if (this.attackCooldown <= 0) {
                    this.attack(player);
                    this.attackCooldown = this.attackSpeed;
                }
            }
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }
    }

    attack(target) {
        // console.log("Enemy attacks player!");
        target.takeDamage(this.damage);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.dead = true;
            this.color = '#7f8c8d'; // Grey

            // Generate Loot
            if (!this.loot) {
                this.loot = [];

                if (this.isBoss && this.keyToDrop) {
                    // Drop Key
                    const key = new Item("Boss Key", ITEM_TYPE.KEY, RARITY.EPIC, {});
                    key.keyId = this.keyToDrop;
                    this.loot.push(key);
                }

                const item = ItemGenerator.generateLoot(1); // Level 1 for now
                if (item) this.loot.push(item);
                // Maybe some gold?
            }
        }
    }

    render(ctx) {
        // Override to show dead body
        if (this.dead) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }
        super.render(ctx);

        // Draw Health Bar
        const barWidth = 32;
        const barHeight = 4;
        const x = this.x;
        const y = this.y - 8;

        // Background
        ctx.fillStyle = '#000';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Health
        const hpPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(x, y, barWidth * hpPercent, barHeight);

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.ceil(this.health)}/${this.maxHealth}`, x + barWidth / 2, y - 2);
    }
}
