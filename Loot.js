import { Entity } from './Entity.js';
import { ItemGenerator } from './Item.js';
import { TILE_SIZE } from './constants.js';

export class Loot extends Entity {
    constructor(x, y, item) {
        super(x, y, 16, '#f1c40f'); // Yellow square for now
        this.item = item;
        this.pickedUp = false;

        // Visuals based on rarity
        this.color = item.rarity.color;
    }

    render(ctx) {
        if (this.pickedUp) return;
        ctx.fillStyle = this.color;
        // Draw small circle
        ctx.beginPath();
        ctx.arc(this.x + 8, this.y + 8, 6, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class Chest extends Entity {
    constructor(x, y) {
        super(x, y, TILE_SIZE, '#d35400'); // Orange/Brown box
        this.opened = false;
        this.items = [];
    }

    open(level) {
        if (this.opened) return [];
        this.opened = true;
        this.color = '#7f8c8d'; // Grey when opened

        // Generate 4 items, at least 1 rare
        const loot = [];
        // 1 Guaranteed Rare+
        // Actually, logic is "at least rare". So Rare, Epic, or Legendary.
        // I'll force a roll.

        // Wait, ItemGenerator.rollRarity returns rarity based on chance.
        // I need a way to force min rarity.

        // For simplicity:
        loot.push(ItemGenerator.generateItem(level, { name: 'Rare', color: '#3498db', multiplier: 1.5 })); // Force Rare

        for (let i = 0; i < 3; i++) {
            loot.push(ItemGenerator.generateItem(level));
        }

        return loot;
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);

        // Draw lock
        if (!this.opened) {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(this.x + 14, this.y + 14, 4, 4);
        }
    }
}
