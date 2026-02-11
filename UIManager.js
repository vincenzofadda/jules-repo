import { ITEM_TYPE } from './Item.js';

export class UIManager {
    constructor(game) {
        this.game = game;

        // Screens
        this.inventoryScreen = document.getElementById('inventory-screen');
        this.characterScreen = document.getElementById('character-screen');
        this.lootScreen = document.getElementById('loot-screen');

        // Elements
        this.inventoryGrid = document.getElementById('inventory-grid');
        this.charInventoryGrid = document.getElementById('char-inventory-grid');
        this.statDamage = document.getElementById('stat-damage');
        this.statDefense = document.getElementById('stat-defense');
        this.lootList = document.getElementById('loot-list');
        this.tooltip = document.getElementById('tooltip');

        // State
        this.isInventoryOpen = false;
        this.isCharacterOpen = false;
        this.isLootOpen = false;
        this.currentLootSource = null; // Entity being looted

        // Bind Inputs
        window.addEventListener('keydown', (e) => this.handleInput(e));

        // Bind Buttons
        document.getElementById('close-loot-btn').addEventListener('click', () => this.closeLoot());
        document.getElementById('take-all-btn').addEventListener('click', () => this.takeAllLoot());

        // Initial Render
        this.createInventorySlots();

        // Drag and Drop State
        this.draggedItemIndex = null;
        this.draggedSource = null; // 'inventory'

        // Global Drop Zone (for deletion)
        // Bind to screens
        [this.inventoryScreen, this.characterScreen].forEach(screen => {
            screen.addEventListener('dragover', (e) => e.preventDefault());
            screen.addEventListener('drop', (e) => this.handleScreenDrop(e));
        });
    }

    handleInput(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            this.toggleInventory();
        } else if (e.key.toLowerCase() === 'c') {
            this.toggleCharacter();
        } else if (e.key === 'Escape') {
            this.closeAll();
        }
    }

    closeAll() {
        this.isInventoryOpen = false;
        this.isCharacterOpen = false;
        this.isLootOpen = false;
        this.inventoryScreen.classList.add('hidden');
        this.characterScreen.classList.add('hidden');
        this.lootScreen.classList.add('hidden');
        this.tooltip.classList.add('hidden');
    }

    toggleInventory() {
        if (this.isCharacterOpen) this.closeAll();

        this.isInventoryOpen = !this.isInventoryOpen;
        if (this.isInventoryOpen) {
            this.inventoryScreen.classList.remove('hidden');
            this.renderInventory(this.inventoryGrid);
        } else {
            this.inventoryScreen.classList.add('hidden');
            this.tooltip.classList.add('hidden');
        }
    }

    toggleCharacter() {
        if (this.isInventoryOpen) this.closeAll();

        this.isCharacterOpen = !this.isCharacterOpen;
        if (this.isCharacterOpen) {
            this.characterScreen.classList.remove('hidden');
            this.renderInventory(this.charInventoryGrid); // Re-use render logic
            this.renderEquipment();
        } else {
            this.characterScreen.classList.add('hidden');
            this.tooltip.classList.add('hidden');
        }
    }

    openLoot(source) {
        this.closeAll();
        this.isLootOpen = true;
        this.currentLootSource = source;
        this.lootScreen.classList.remove('hidden');
        this.renderLoot();
    }

    closeLoot() {
        this.isLootOpen = false;
        this.currentLootSource = null;
        this.lootScreen.classList.add('hidden');
        this.tooltip.classList.add('hidden');
    }

    takeAllLoot() {
        if (!this.currentLootSource) return;

        // Chest logic
        if (this.currentLootSource.open) {
            const items = this.currentLootSource.items; // Usually chest returns items on open, but here we assume items property
            // Wait, Chest.open returns items.
            // If Chest is already opened, it returns empty.
            // I should store items in Chest.items property.

            // For now, let's assume currentLootSource has .items array
            // Move all to player inventory

             // But wait, Chest.open logic in Loot.js returns new items only once.
             // I need to handle this properly.
             // Let's assume openLoot is called with a list of items?
             // Or better, `source` is the Entity.
        }

        // Simpler: iterate rendered loot items and take them?
        // No, operate on data.

        let itemsToTake = [];
        if (this.currentLootSource instanceof Array) {
             // It's a list of items (e.g. from chest.open())
             // Wait, where is this list stored?
        } else if (this.currentLootSource.loot) {
             // Enemy loot
             itemsToTake = [...this.currentLootSource.loot];
             this.currentLootSource.loot = []; // Clear
        } else if (this.currentLootSource.items) {
            // Chest items
            itemsToTake = [...this.currentLootSource.items];
            this.currentLootSource.items = [];
        }

        itemsToTake.forEach(item => {
            this.game.player.inventory.add(item);
        });

        this.closeLoot();
    }

    createInventorySlots() {
        // Create 48 slots
        for (let i = 0; i < 48; i++) {
            const slot = document.createElement('div');
            slot.classList.add('slot');
            slot.dataset.index = i;
            slot.addEventListener('click', () => this.handleSlotClick(i));
            slot.addEventListener('mouseover', (e) => this.showTooltip(e, i, 'inventory'));
            slot.addEventListener('mouseout', () => this.hideTooltip());

            // Add Drag Events
            slot.addEventListener('dragover', (e) => this.handleSlotDragOver(e));
            slot.addEventListener('drop', (e) => this.handleSlotDrop(e, i));

            this.inventoryGrid.appendChild(slot);

            // Clone for Character Screen
            const charSlot = slot.cloneNode(true);
            charSlot.addEventListener('click', () => this.handleSlotClick(i)); // Re-bind
            charSlot.addEventListener('mouseover', (e) => this.showTooltip(e, i, 'inventory'));
            charSlot.addEventListener('mouseout', () => this.hideTooltip());

            // Add Drag Events to Clone
            charSlot.addEventListener('dragover', (e) => this.handleSlotDragOver(e));
            charSlot.addEventListener('drop', (e) => this.handleSlotDrop(e, i));

            this.charInventoryGrid.appendChild(charSlot);
        }

        // Equipment slots events
        ['weapon', 'helmet', 'chestplate', 'leggings', 'boots'].forEach(type => {
            const slot = document.querySelector(`.equipment-slot[data-slot="${type}"]`);
            slot.addEventListener('click', () => this.handleEquipSlotClick(type));
            slot.addEventListener('mouseover', (e) => this.showTooltip(e, type, 'equipment'));
            slot.addEventListener('mouseout', () => this.hideTooltip());
        });
    }

    renderInventory(gridElement) {
        const items = this.game.player.inventory.items;
        const slots = gridElement.querySelectorAll('.slot');

        slots.forEach((slot, index) => {
            slot.innerHTML = '';
            const item = items[index];
            if (item) {
                const icon = document.createElement('div');
                icon.classList.add('item-icon');
                icon.style.backgroundColor = item.rarity.color;
                // Maybe a text icon?
                icon.innerText = item.type[0].toUpperCase(); // W, A, P
                icon.style.display = 'flex';
                icon.style.justifyContent = 'center';
                icon.style.alignItems = 'center';
                icon.style.color = '#000';
                icon.style.fontWeight = 'bold';

                // Make draggable
                icon.draggable = true;
                icon.addEventListener('dragstart', (e) => {
                    this.draggedItemIndex = index;
                    this.draggedSource = 'inventory';
                    e.dataTransfer.effectAllowed = 'move';
                    // Hide tooltip
                    this.hideTooltip();
                });

                slot.appendChild(icon);
            }
        });
    }

    handleSlotDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleSlotDrop(e, targetIndex) {
        e.preventDefault();
        e.stopPropagation(); // Stop bubbling to screen

        if (this.draggedSource === 'inventory' && this.draggedItemIndex !== null) {
            // Swap
            this.game.player.inventory.swap(this.draggedItemIndex, targetIndex);

            // Re-render
            if (this.isInventoryOpen) this.renderInventory(this.inventoryGrid);
            if (this.isCharacterOpen) this.renderInventory(this.charInventoryGrid);

            this.draggedItemIndex = null;
            this.draggedSource = null;
        }
    }

    handleScreenDrop(e) {
        e.preventDefault();

        // If dropped here (and not stopped by slot drop), delete item
        if (this.draggedSource === 'inventory' && this.draggedItemIndex !== null) {
            // Check if dropped outside ANY slot (which it is, since slot drop stops prop)
            const confirmDelete = confirm("Delete item?");
            if (confirmDelete) {
                this.game.player.inventory.remove(this.draggedItemIndex);

                // Re-render
                if (this.isInventoryOpen) this.renderInventory(this.inventoryGrid);
                if (this.isCharacterOpen) this.renderInventory(this.charInventoryGrid);
            }

            this.draggedItemIndex = null;
            this.draggedSource = null;
        }
    }

    renderEquipment() {
        const eq = this.game.player.equipment;

        const renderSlot = (type, item) => {
            const el = document.getElementById(`equip-${type}`);
            if (item) {
                el.innerText = item.name;
                el.style.color = item.rarity.color;
            } else {
                el.innerText = 'Empty';
                el.style.color = '#fff';
            }
        };

        renderSlot('weapon', eq.weapon);
        renderSlot('helmet', eq.helmet);
        renderSlot('chestplate', eq.chestplate);
        renderSlot('leggings', eq.leggings);
        renderSlot('boots', eq.boots);

        // Stats
        let dmg = this.game.player.damage;
        if (eq.weapon) dmg += eq.weapon.stats.damage || 0;
        this.statDamage.innerText = dmg;

        let def = 0;
        if (eq.weapon) def += eq.weapon.stats.defense || 0;
        if (eq.helmet) def += eq.helmet.stats.defense || 0;
        if (eq.chestplate) def += eq.chestplate.stats.defense || 0;
        if (eq.leggings) def += eq.leggings.stats.defense || 0;
        if (eq.boots) def += eq.boots.stats.defense || 0;

        this.statDefense.innerText = def;
    }

    renderLoot() {
        this.lootList.innerHTML = '';
        let items = [];

        if (this.currentLootSource.loot) {
            items = this.currentLootSource.loot;
        } else if (this.currentLootSource.items) {
            items = this.currentLootSource.items;
        }

        if (items.length === 0) {
             const el = document.createElement('div');
             el.innerText = "Empty";
             el.style.color = '#7f8c8d';
             this.lootList.appendChild(el);
        } else {
            items.forEach((item, index) => {
                const el = document.createElement('div');
                el.classList.add('loot-item');
                el.innerText = item.name;
                el.style.color = item.rarity.color;
                el.addEventListener('click', () => {
                    // Take specific item
                    if (this.game.player.inventory.add(item)) {
                        // Remove from source
                        items.splice(index, 1);
                        this.renderLoot(); // Refresh
                        if (items.length === 0) this.closeLoot();
                    } else {
                        alert("Inventory Full!");
                    }
                });
                this.lootList.appendChild(el);
            });
        }
    }

    handleSlotClick(index) {
        const item = this.game.player.inventory.get(index);
        if (!item) return;

        // Equip logic
        if (Object.values(ITEM_TYPE).includes(item.type) && item.type !== ITEM_TYPE.CURRENCY && item.type !== ITEM_TYPE.POTION) {
            this.equipItem(index);
        }

        // Re-render
        if (this.isInventoryOpen) this.renderInventory(this.inventoryGrid);
        if (this.isCharacterOpen) {
            this.renderInventory(this.charInventoryGrid);
            this.renderEquipment();
        }
    }

    handleEquipSlotClick(type) {
        // Unequip
        const item = this.game.player.equipment[type];
        if (item) {
            if (this.game.player.inventory.add(item)) {
                this.game.player.equipment[type] = null;
                this.renderEquipment();
                this.renderInventory(this.charInventoryGrid);
            } else {
                alert("Inventory Full!");
            }
        }
    }

    equipItem(inventoryIndex) {
        const item = this.game.player.inventory.get(inventoryIndex);
        if (!item) return;

        const type = item.type; // 'weapon' or 'armor'
        const currentEquip = this.game.player.equipment[type];

        // Remove from inventory
        this.game.player.inventory.remove(inventoryIndex);

        // Equip new
        this.game.player.equipment[type] = item;

        // Put old back (if any)
        if (currentEquip) {
            this.game.player.inventory.items[inventoryIndex] = currentEquip; // Put in same slot
        }
    }

    showTooltip(e, indexOrType, context) {
        let item = null;
        if (context === 'inventory') {
            item = this.game.player.inventory.get(indexOrType);
        } else if (context === 'equipment') {
            item = this.game.player.equipment[indexOrType];
        }

        if (!item) return;

        this.tooltip.classList.remove('hidden');
        this.tooltip.style.left = e.pageX + 10 + 'px';
        this.tooltip.style.top = e.pageY + 10 + 'px';

        let statsHtml = '';
        for (const [key, val] of Object.entries(item.stats)) {
            statsHtml += `<div class="tooltip-stat">${key.toUpperCase()}: ${val}</div>`;
        }

        this.tooltip.innerHTML = `
            <div class="tooltip-title" style="color: ${item.rarity.color}">${item.name}</div>
            <div class="tooltip-stat">${item.type}</div>
            ${statsHtml}
        `;
    }

    hideTooltip() {
        this.tooltip.classList.add('hidden');
    }
}
