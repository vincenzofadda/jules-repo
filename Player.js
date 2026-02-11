import { Entity } from './Entity.js';
import { Inventory } from './Inventory.js';
import { TILE_SIZE } from './constants.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 32, '#3498db');
        this.speed = 400; // Increased speed (was 300)
        this.dashSpeed = 1200; // Dash burst speed
        this.isDashing = false;
        this.dashDuration = 0.15; // Short dash
        this.dashTimeLeft = 0;
        this.dashCharges = 3;
        this.maxDashCharges = 3;
        this.dashCooldownTimer = 0;
        this.dashCooldownTime = 3.0; // 3 seconds per charge

        this.maxHealth = 100;
        this.health = 100;
        this.inventory = new Inventory(48); // 6x8
        this.equipment = {
            weapon: null,
            helmet: null,
            chestplate: null,
            leggings: null,
            boots: null
        };
        this.attackRange = 60;
        this.attackCooldown = 0;
        this.attackSpeed = 0.5; // Attacks per second
        this.damage = 10;
    }

    takeDamage(amount) {
        // Apply defense from equipment
        let defense = 0;
        if (this.equipment.helmet) defense += this.equipment.helmet.stats.defense || 0;
        if (this.equipment.chestplate) defense += this.equipment.chestplate.stats.defense || 0;
        if (this.equipment.leggings) defense += this.equipment.leggings.stats.defense || 0;
        if (this.equipment.boots) defense += this.equipment.boots.stats.defense || 0;
        if (this.equipment.weapon) defense += this.equipment.weapon.stats.defense || 0;

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

        // Cooldowns
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // Dash Recharge
        if (this.dashCharges < this.maxDashCharges) {
            this.dashCooldownTimer += dt;
            if (this.dashCooldownTimer >= this.dashCooldownTime) {
                this.dashCharges++;
                this.dashCooldownTimer = 0;
                // If still not full, reset timer? Usually cooldowns are sequential.
                // Or if multiple recharge at once? Prompt says "each dash will recharge in 3 seconds".
                // Sequential is standard.
            }
        }

        // Auto Attack logic
        if (enemies) {
            this.attack(enemies);
        }

        let dx = 0;
        let dy = 0;

        // Input
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

        // Dash Trigger
        // Use input.keys[' '] directly for continuous check, but we need to prevent spam if user holds space.
        // Input.js isDown just checks boolean.
        // Let's rely on a small cooldown or just the fact that dash duration is short.
        // Actually, user probably wants to control when to dash.
        // Let's add a `canDash` flag to prevent holding space from chaining dashes instantly?
        // Prompt says "recharge in 3 seconds". If I hold space, I will dash 3 times then wait 3 seconds.
        // That seems acceptable behavior.

        if (input.isDown(' ') && this.dashCharges >= 1 && !this.isDashing && (dx !== 0 || dy !== 0)) {
             // Only dash if we have a full charge (>=1)
             // wait, dashCharges is float or int? Int.
             this.startDash(dx, dy);
        }

        // Movement Logic
        let currentSpeed = this.speed;

        if (this.isDashing) {
            this.dashTimeLeft -= dt;
            if (this.dashTimeLeft <= 0) {
                this.isDashing = false;
            } else {
                currentSpeed = this.dashSpeed;
                // Force dash direction
                dx = this.dashDir.x;
                dy = this.dashDir.y;
            }
        }

        const moveX = dx * currentSpeed * dt;
        const moveY = dy * currentSpeed * dt;

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

    startDash(dx, dy) {
        this.isDashing = true;
        this.dashTimeLeft = this.dashDuration;
        this.dashCharges--;
        this.dashDir = { x: dx, y: dy };

        // If we just used a charge and we were at max, start the timer.
        // If we were already charging (e.g. 2/3 -> 1/3), the timer is already running for the *next* charge.
        // Wait, if I have 3 charges. Use 1. Now 2. Timer starts for 3rd.
        // Use another. Now 1. Timer still running for 3rd? No, timer should run to give *a* charge.
        // The prompt says "each dash will recharge in 3 seconds". This usually implies independent cooldowns or sequential.
        // Sequential is easiest: One timer fills the bucket.
        // If I'm at 2/3, timer runs. If I drop to 1/3, timer continues running to give me +1 (to 2/3).
        // So I only reset timer if it wasn't running (i.e., we were full).

        if (this.dashCharges === this.maxDashCharges - 1) {
             // We were full, now we aren't. Start timer.
             // But wait, if I was full (3), I used one (2). Timer should start from 0.
             // If I was at 2 (timer at 1.5s), I use one (1). Timer should continue? Yes.
             // So only reset if we just dropped from Max.
        }
    }
}
