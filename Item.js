export const RARITY = {
    COMMON: { name: 'Common', color: '#95a5a6', multiplier: 1.0 },
    UNCOMMON: { name: 'Uncommon', color: '#2ecc71', multiplier: 1.2 },
    RARE: { name: 'Rare', color: '#3498db', multiplier: 1.5 },
    EPIC: { name: 'Epic', color: '#9b59b6', multiplier: 2.0 },
    LEGENDARY: { name: 'Legendary', color: '#f1c40f', multiplier: 3.0 }
};

export const ITEM_TYPE = {
    WEAPON: 'weapon',
    HELMET: 'helmet',
    CHESTPLATE: 'chestplate',
    LEGGINGS: 'leggings',
    BOOTS: 'boots',
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
    static generateItem(level = 1, forceRarity = null, forceType = null) {
        const rarity = forceRarity || this.rollRarity();

        let type = forceType;
        if (!type) {
            // 50% Weapon, 50% Armor (split evenly)
            const roll = Math.random();
            if (roll < 0.5) {
                type = ITEM_TYPE.WEAPON;
            } else {
                const armorTypes = [ITEM_TYPE.HELMET, ITEM_TYPE.CHESTPLATE, ITEM_TYPE.LEGGINGS, ITEM_TYPE.BOOTS];
                type = armorTypes[Math.floor(Math.random() * armorTypes.length)];
            }
        }

        let name = "";
        let stats = {};

        if (type === ITEM_TYPE.WEAPON) {
            name = `${rarity.name} Sword`;
            const baseDamage = 5 * level;
            stats.damage = Math.floor(baseDamage * rarity.multiplier);
        } else {
            // Adjust name based on type
            const typeName = type.charAt(0).toUpperCase() + type.slice(1);
            name = `${rarity.name} ${typeName}`;

            // Adjust defense based on slot (optional balance)
            let baseDefense = 2 * level;
            if (type === ITEM_TYPE.CHESTPLATE) baseDefense *= 1.5;
            if (type === ITEM_TYPE.HELMET) baseDefense *= 1.2;

            stats.defense = Math.max(1, Math.floor(baseDefense * rarity.multiplier));
        }

        return new Item(name, type, rarity, stats);
    }

    static rollRarity() {
        const roll = Math.random();
        // Common 40%, Uncommon 30% (->0.7), Rare 15% (->0.85), Epic 10% (->0.95), Legendary 5% (->1.0)
        if (roll < 0.40) return RARITY.COMMON;
        if (roll < 0.70) return RARITY.UNCOMMON;
        if (roll < 0.85) return RARITY.RARE;
        if (roll < 0.95) return RARITY.EPIC;
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
