export const RARITY = {
    COMMON: { name: 'Common', color: '#95a5a6', multiplier: 1.0 },
    UNCOMMON: { name: 'Uncommon', color: '#2ecc71', multiplier: 1.2 },
    RARE: { name: 'Rare', color: '#3498db', multiplier: 1.5 },
    EPIC: { name: 'Epic', color: '#9b59b6', multiplier: 2.0 },
    LEGENDARY: { name: 'Legendary', color: '#f1c40f', multiplier: 3.0 }
};

export const ITEM_TYPE = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    POTION: 'potion', // Optional
    CURRENCY: 'currency'
};

export class Item {
    constructor(name, type, rarity, stats) {
        this.name = name;
        this.type = type;
        this.rarity = rarity;
        this.stats = stats; // Object like { damage: 10 } or { defense: 5 }
        this.id = Math.random().toString(36).substr(2, 9);
    }
}

export class ItemGenerator {
    static generateItem(level = 1, forceRarity = null) {
        const rarity = forceRarity || this.rollRarity();
        const type = Math.random() < 0.5 ? ITEM_TYPE.WEAPON : ITEM_TYPE.ARMOR;

        let name = "";
        let stats = {};

        if (type === ITEM_TYPE.WEAPON) {
            name = `${rarity.name} Sword`;
            const baseDamage = 5 * level;
            stats.damage = Math.floor(baseDamage * rarity.multiplier);
        } else {
            name = `${rarity.name} Armor`;
            const baseDefense = 2 * level;
            stats.defense = Math.floor(baseDefense * rarity.multiplier);
        }

        return new Item(name, type, rarity, stats);
    }

    static rollRarity() {
        const roll = Math.random();
        if (roll < 0.60) return RARITY.COMMON;
        if (roll < 0.85) return RARITY.UNCOMMON;
        if (roll < 0.95) return RARITY.RARE;
        if (roll < 0.99) return RARITY.EPIC;
        return RARITY.LEGENDARY;
    }

    static generateLoot(level) {
         // 30% chance to drop an item
         if (Math.random() < 0.3) {
             return this.generateItem(level);
         }
         return null;
    }
}
