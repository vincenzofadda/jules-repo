import { RARITY, ITEM_TYPE } from './Item.js';

export class Inventory {
    constructor(size) {
        this.size = size;
        this.items = new Array(size).fill(null);
    }

    add(item) {
        const index = this.items.indexOf(null);
        if (index !== -1) {
            this.items[index] = item;
            return true;
        }
        return false;
    }

    remove(index) {
        if (index >= 0 && index < this.size) {
            const item = this.items[index];
            this.items[index] = null;
            return item;
        }
        return null;
    }

    swap(indexA, indexB) {
        if (indexA >= 0 && indexA < this.size && indexB >= 0 && indexB < this.size) {
            const temp = this.items[indexA];
            this.items[indexA] = this.items[indexB];
            this.items[indexB] = temp;
        }
    }

    get(index) {
        if (index >= 0 && index < this.size) {
            return this.items[index];
        }
        return null;
    }
}
