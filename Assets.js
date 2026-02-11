export class Assets {
    static generateTextures() {
        const textures = {
            wall: this.createWallTexture().toDataURL(),
            floor: this.createFloorTexture().toDataURL(),
            grass: this.createGrassTexture().toDataURL(),
            houseWall: this.createHouseWallTexture().toDataURL(),
            stairsDown: this.createStairsDownTexture().toDataURL(),
            stairsUp: this.createStairsUpTexture().toDataURL()
        };
        // Convert canvas to Image for drawImage
        const images = {};
        for(let key in textures) {
            images[key] = new Image();
            images[key].src = textures[key];
        }
        return images;
    }

    static createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        return canvas;
    }

    static createWallTexture() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');

        // Base color
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, 32, 32);

        // Bricks/Stones pattern
        ctx.fillStyle = '#34495e';
        // Row 1
        ctx.fillRect(0, 0, 15, 10);
        ctx.fillRect(16, 0, 16, 10);
        // Row 2 (offset)
        ctx.fillRect(0, 11, 7, 10);
        ctx.fillRect(8, 11, 15, 10);
        ctx.fillRect(24, 11, 8, 10);
        // Row 3
        ctx.fillRect(0, 22, 15, 10);
        ctx.fillRect(16, 22, 16, 10);

        // Shadows
        ctx.fillStyle = '#1a252f';
        ctx.fillRect(0, 10, 32, 1);
        ctx.fillRect(0, 21, 32, 1);

        return canvas;
    }

    static createFloorTexture() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');

        // Base dirt/stone
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(0, 0, 32, 32);

        // Noise/Pebbles
        for (let i = 0; i < 20; i++) {
            ctx.fillStyle = Math.random() < 0.5 ? '#95a5a6' : '#576574';
            const x = Math.floor(Math.random() * 32);
            const y = Math.floor(Math.random() * 32);
            const s = Math.floor(Math.random() * 3) + 1;
            ctx.fillRect(x, y, s, s);
        }

        return canvas;
    }

    static createGrassTexture() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');

        // Base green
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(0, 0, 32, 32);

        // Grass blades
        for (let i = 0; i < 40; i++) {
            ctx.fillStyle = Math.random() < 0.5 ? '#2ecc71' : '#1e8449';
            const x = Math.floor(Math.random() * 32);
            const y = Math.floor(Math.random() * 32);
            ctx.fillRect(x, y, 2, 4); // Small vertical blade
        }

        return canvas;
    }

    static createHouseWallTexture() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');

        // Base wood
        ctx.fillStyle = '#8e44ad'; // Default fallback? Prompt said "House Wall"
        // Wait, current game uses brown.
        ctx.fillStyle = '#a1887f'; // Light brown
        ctx.fillRect(0, 0, 32, 32);

        // Planks
        ctx.fillStyle = '#795548'; // Darker brown
        // Horizontal lines
        for (let y = 0; y < 32; y += 8) {
            ctx.fillRect(0, y, 32, 1);
        }

        // Vertical details (nails/ends)
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(4, 2, 2, 2);
        ctx.fillRect(28, 6, 2, 2);
        ctx.fillRect(10, 12, 2, 2);

        return canvas;
    }

    static createStairsDownTexture() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, 32, 32);

        // Steps going down (darker as go deeper)
        for(let i=0; i<4; i++) {
            const shade = 100 - (i * 20);
            ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
            ctx.fillRect(4 + i*2, 4 + i*2, 24 - i*4, 24 - i*4);
        }

        return canvas;
    }

    static createStairsUpTexture() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, 32, 32);

        // Steps going up (lighter as go up)
        for(let i=0; i<4; i++) {
            const shade = 40 + (i * 30);
            ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
            ctx.fillRect(4 + i*4, 4 + i*4, 24 - i*8, 24 - i*8); // Inverted logic? No, concentric squares usually work.
        }
        // Let's make it look like a ladder maybe? Or just lighter stairs.

        return canvas;
    }
}
