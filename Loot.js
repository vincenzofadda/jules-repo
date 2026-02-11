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
        this.isLocked = false;
        this.keyId = null;
        this.isBossChest = false;
    }

    // Returns items if successful, null if locked
    open(level, player) {
        if (this.opened) return [];

        if (this.isLocked) {
             // Check for key
             const keyIndex = player.inventory.items.findIndex(i => i && i.keyId === this.keyId);
             if (keyIndex === -1) {
                 return null; // Locked and no key
             }
             // Consume key
             player.inventory.remove(keyIndex);
             this.isLocked = false;
        }

        this.opened = true;
        this.color = '#7f8c8d'; // Grey when opened

        const loot = [];

        if (this.isBossChest) {
            // Min 6 items, 2 Rare+, 1 Epic+
            loot.push(ItemGenerator.generateItem(level, RARITY.EPIC));
            loot.push(ItemGenerator.generateItem(level, RARITY.RARE));
            loot.push(ItemGenerator.generateItem(level, RARITY.RARE));
            for(let i=0; i<3; i++) loot.push(ItemGenerator.generateItem(level));
        } else {
            // Normal Branch Chest: Min 4 items, 1 Rare+
            loot.push(ItemGenerator.generateItem(level, RARITY.RARE));
            for (let i = 0; i < 3; i++) {
                loot.push(ItemGenerator.generateItem(level));
            }
        }

        return loot;
    }

    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);

        // Draw lock
        if (!this.opened) {
            // Adjust lock position based on size
            const lockSize = this.isBossChest ? 12 : 6;
            const cx = this.x + this.width / 2 - lockSize / 2;
            const cy = this.y + this.height / 2 - lockSize / 2;

            ctx.fillStyle = this.isLocked ? '#e74c3c' : '#f1c40f'; // Red if locked, Gold if not (or maybe just standard keyhole?)
            ctx.fillRect(cx, cy, lockSize, lockSize);
        }
    }
}
