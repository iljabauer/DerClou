
import { Scene } from 'phaser';
import { Services } from '../services/Services';
import { INP_UP, INP_DOWN, INP_LBUTTONP, INP_TIME } from '../services/ReplayService';
import { ScreenshotService } from '../services/ScreenshotService';

declare const nw: any;
declare const process: any;

export class MenuScene extends Scene {
    private menuItems: string[] = [];
    private selectedIndex: number = 0;
    private textObjects: (Phaser.GameObjects.BitmapText | Phaser.GameObjects.Text)[] = [];

    constructor() {
        super('MenuScene');
    }

    async create() {
        Services.input.registerInput(this);

        // Load Menu Background
        const textureKey = 'bg_menu';
        if (!this.textures.exists(textureKey)) {
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
            const bg = this.add.image(0, 140, textureKey).setOrigin(0, 0);
            bg.setCrop(0, 60, 320, 60);
            bg.y = 140 - 60;
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

        const startY = 150;

        this.menuItems.forEach((item, index) => {
            const tint = index === this.selectedIndex ? 0xffff00 : 0xffffff;

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
