
import { Scene } from 'phaser';
import { Services } from '../services/Services';
import { INP_UP, INP_DOWN, INP_LBUTTONP, INP_TIME } from '../services/ReplayService';
import { ScreenshotService } from '../services/ScreenshotService';

declare const nw: any;

export class MenuScene extends Scene {
    private menuItems: string[] = [];
    private selectedIndex: number = 0;
    private textObjects: Phaser.GameObjects.BitmapText[] = [];

    constructor() {
        super('MenuScene');
    }

    async create() {
        Services.input.registerInput(this);

        // Load Menu Background
        // Pict 21 is BGD_LONDON / Menu Background slice
        // Filename is 'menu'.

        const textureKey = 'bg_menu';
        if (!this.textures.exists(textureKey)) {
            // Try loading 'gamedata/PICTURES/MENU'
            if (typeof nw !== 'undefined') {
                const path = nw.require('path');
                const fs = nw.require('fs');
                let rootDir = process.cwd();
                if (!fs.existsSync(path.join(rootDir, 'gamedata'))) {
                    rootDir = path.join(rootDir, '..');
                }
                const filePath = path.join(rootDir, 'gamedata', 'PICTURES', 'MENU');
                if (fs.existsSync(filePath)) {
                    const iff = await Services.iff.loadIff(filePath);
                    if (iff) {
                        Services.iff.createTexture(this, textureKey, iff);
                    }
                }
            }
        }

        if (this.textures.exists(textureKey)) {
            // Display BGD_LONDON part
            // Pict 21: xOff=0, yOff=60, w=320, h=60, destX=0, destY=140
            // We use Phaser Frame to crop.
            // But we created a CanvasTexture. We can add a frame or just use setCrop.

            // Wait, standard background (BGD_LONDON) is shown at bottom?
            // Actually `ShowMenuBackground` shows `BGD_LONDON` at `destX, destY`.

            // To be precise: `gfxShow(21, ...)`

            // I'll show the full MENU image for debugging, or try to slice it.
            // For now, let's show it at the bottom.
            const bg = this.add.image(0, 140, textureKey).setOrigin(0, 0);
            bg.setCrop(0, 60, 320, 60);
            bg.y = 140 - 60; // Adjust because crop does not move origin?
            // Phaser crop just hides pixels. Origin stays same.
            // If I want to show rect (0,60,320,60) at (0,140):
            // Image is at 0, 140.
            // Crop is relative to image.
            // If I place image at 0, 140, top-left of image is at 0,140.
            // Crop(0, 60, ...) shows pixels starting at y=60.
            // They will be drawn at y=140+60 = 200?
            // No, crop just masks.
            // To shift the visible part up, I need to adjust y position.
            // Or use `setFrame`.
            // Since it's a CanvasTexture, I can't easily add frames dynamically without defining them?
            // Actually I can. `texture.add('frameName', 0, x, y, w, h)`.

            bg.y = 140 - 60; // Simple hack: move image up so y=60 aligns with y=140.
        }

        // Load Menu Items
        const items = Services.text.getText("MENU", "STARTUP_MENU");
        if (items && items.length > 0) {
            this.menuItems = items;
        } else {
            this.menuItems = ["New Game", "Load Game", "Quit Game"];
        }

        this.renderMenu();
    }

    renderMenu() {
        this.textObjects.forEach(t => t.destroy());
        this.textObjects = [];

        // Menu Position:
        // C code: MenuRP is at 140.
        // It prints text there.
        // x = centered or left?
        // `Menu` function usually centers or uses `MENU.FNT`.

        const startY = 150;

        this.menuItems.forEach((item, index) => {
            // Using 'menu' font
            // BitmapText size depends on font.
            // Tint for selection:
            // C uses pens. `menuFont` pens.
            // Selected: Pen 255?
            // Normal: Pen 191?

            const tint = index === this.selectedIndex ? 0xffff00 : 0xffffff;

            // Check if font exists
            let t;
            if (this.cache.bitmapFont.exists('menu')) {
                t = this.add.bitmapText(160, startY + index * 10, 'menu', item).setOrigin(0.5, 0).setTint(tint);
            } else {
                t = this.add.text(160, startY + index * 15, item, { fontSize: '12px', color: index === this.selectedIndex ? '#ffff00' : '#ffffff' }).setOrigin(0.5, 0);
            }
            this.textObjects.push(t);
        });
    }

    update(time: number, delta: number) {
        const action = Services.input.simulateTick();

        if (action !== null) {
            this.handleAction(action);
            if (action & ~INP_TIME) {
                this.captureScreenshot();
            }
        }

        if (Services.replay.isPlaybackActive() && Services.replay.isComplete()) {
             if (ScreenshotService.isHeadlessMode()) {
                 ScreenshotService.exitApp();
             }
        }
    }

    handleAction(action: number) {
        if (action & INP_UP) {
            this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
            this.renderMenu();
        } else if (action & INP_DOWN) {
            this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
            this.renderMenu();
        } else if (action & INP_LBUTTONP) {
            this.selectItem(this.selectedIndex);
        }
    }

    selectItem(index: number) {
        if (index === 0) {
             this.scene.start('StoryScene');
        } else if (index === 2) {
             if (ScreenshotService.isNwjsEnvironment()) {
                 ScreenshotService.exitApp();
             }
        }
    }

    private captureScreenshot() {
        const tick = Services.input.getSimulationTick();
        this.game.renderer.snapshot((image: HTMLImageElement | any) => {
            if (image && image.src) {
                const filename = `replay_tick_${tick}_screenshot.png`;
                ScreenshotService.saveScreenshot(image.src);
            }
        });
    }
}
