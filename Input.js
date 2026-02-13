export class Input {
    constructor() {
        this.keys = {};

        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Reset all keys on blur to prevent "stuck" inputs
        window.addEventListener('blur', () => {
            this.keys = {};
        });

        // Also reset on focus to ensure clean slate when returning
        window.addEventListener('focus', () => {
            this.keys = {};
        });

        // Reset on visibility change (switching tabs)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.keys = {};
            }
        });

        // Reset on context menu (right click often interrupts key events)
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Optional: prevent context menu? User asked for "clico com o botao direito", maybe they want to use it?
            // If preventing, we don't need to reset necessarily but maybe safer to reset.
            // Let's just reset keys to be safe.
            this.keys = {};
        });
    }

    isDown(key) {
        return !!this.keys[key.toLowerCase()];
    }
}
