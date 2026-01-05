
import { Scene } from 'phaser';
import { Services } from '../services/Services';
import { INP_UP, INP_DOWN, INP_LBUTTONP, INP_TIME } from '../services/ReplayService';
import { ScreenshotService } from '../services/ScreenshotService';
import { GameScene } from '../services/StoryService';

declare const nw: any;
declare const process: any;

enum SceneState {
    MAIN_MENU = 0,
    SUB_MENU = 1
}

export class StoryScene extends Scene {
    private currentScene: GameScene | undefined;
    private background: Phaser.GameObjects.Image | undefined;

    private statusText!: Phaser.GameObjects.BitmapText | Phaser.GameObjects.Text;
    private optionsText: (Phaser.GameObjects.BitmapText | Phaser.GameObjects.Text)[] = [];
    private selectedOption: number = 0;

    private state: SceneState = SceneState.MAIN_MENU;

    private availableOptions: number[] = [];
    private optionLabels: string[] = [];
    private mainMenuLabels: string[] = [];

    private subMenuItems: { label: string, eventNr: number }[] = [];

    constructor() {
        super('StoryScene');
    }

    create() {
        Services.input.registerInput(this);

        this.mainMenuLabels = Services.text.getText("MENU", "Mainmenu") || [];

        this.currentScene = Services.story.getStartScene();
        if (!this.currentScene) {
            this.add.text(10, 10, "Error: Start Scene not found", { color: 'red' });
            return;
        }

        // Status Text (Top bar)
        if (this.cache.bitmapFont.exists('menu')) {
            this.statusText = this.add.bitmapText(10, 10, 'menu', "").setOrigin(0, 0).setDepth(100);
        } else {
            this.statusText = this.add.text(10, 10, "", { fontSize: '12px', color: '#ffffff' }).setDepth(100);
        }

        this.enterScene(this.currentScene);
    }

    async enterScene(scene: GameScene) {
        this.currentScene = scene;
        const locName = Services.story.getLocationName(scene.LocationNr);
        this.statusText.setText(locName);

        const bgInfo = Services.anim.getBackgroundForLocation(locName);
        if (bgInfo) {
            const textureKey = `bg_${bgInfo.filename}`;
            if (!this.textures.exists(textureKey)) {
                if (typeof nw !== 'undefined') {
                    const path = nw.require('path');
                    const fs = nw.require('fs');
                    let rootDir = process.cwd();
                    if (!fs.existsSync(path.join(rootDir, 'gamedata'))) rootDir = path.join(rootDir, '..');

                    const pictDir = path.join(rootDir, 'gamedata', 'PICTURES');
                    let filePath = path.join(pictDir, bgInfo.filename);
                    if (!fs.existsSync(filePath)) filePath = path.join(pictDir, bgInfo.filename.toUpperCase());

                    if (fs.existsSync(filePath)) {
                        const iff = await Services.iff.loadIff(filePath);
                        if (iff) Services.iff.createTexture(this, textureKey, iff);
                    }
                }
            }

            if (this.textures.exists(textureKey)) {
                if (this.background) this.background.destroy();
                this.background = this.add.image(bgInfo.pict.destX, bgInfo.pict.destY, textureKey).setOrigin(0, 0);
            }
        }

        this.availableOptions = [];
        this.optionLabels = [];
        for (let i = 0; i < this.mainMenuLabels.length; i++) {
            if ((scene.Moeglichkeiten & (1 << i)) !== 0) {
                this.availableOptions.push(1 << i);
                this.optionLabels.push(this.mainMenuLabels[i]);
            }
        }

        this.state = SceneState.MAIN_MENU;
        this.selectedOption = 0;
        this.renderOptions();
    }

    renderOptions() {
        this.optionsText.forEach(t => t.destroy());
        this.optionsText = [];

        const startY = 150;
        let items: string[] = [];

        if (this.state === SceneState.MAIN_MENU) {
            items = this.optionLabels;
        } else {
            items = this.subMenuItems.map(i => i.label);
        }

        items.forEach((label, index) => {
            const tint = index === this.selectedOption ? 0xffff00 : 0xffffff;

            let t;
            if (this.cache.bitmapFont.exists('menu')) {
                t = this.add.bitmapText(160, startY + index * 10, 'menu', label).setOrigin(0.5, 0).setTint(tint).setDepth(100);
            } else {
                t = this.add.text(10, startY + index * 12, label, { fontSize: '10px', color: index === this.selectedOption ? '#ffff00' : '#ffffff' }).setDepth(100);
            }
            this.optionsText.push(t);
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
        let count = 0;
        if (this.state === SceneState.MAIN_MENU) {
            count = this.availableOptions.length;
        } else {
            count = this.subMenuItems.length;
        }

        if (count === 0) return;

        if (action & INP_UP) {
            this.selectedOption = (this.selectedOption - 1 + count) % count;
            this.renderOptions();
        } else if (action & INP_DOWN) {
            this.selectedOption = (this.selectedOption + 1) % count;
            this.renderOptions();
        } else if (action & INP_LBUTTONP) {
            if (this.state === SceneState.MAIN_MENU) {
                this.executeMainOption(this.availableOptions[this.selectedOption]);
            } else {
                this.executeSubOption(this.subMenuItems[this.selectedOption]);
            }
        }
    }

    executeMainOption(opt: number) {
        if (opt === 1 && this.currentScene && this.currentScene.std_succ) {
            if (this.currentScene.std_succ.length === 0) {
            } else if (this.currentScene.std_succ.length === 1) {
                this.transitionTo(this.currentScene.std_succ[0]);
            } else {
                this.subMenuItems = this.currentScene.std_succ.map(eventNr => {
                    const nextScene = Services.story.getScene(eventNr);
                    if (nextScene && nextScene.LocationNr !== -1) {
                        return { label: Services.story.getLocationName(nextScene.LocationNr), eventNr };
                    }
                    return { label: `Unknown ${eventNr}`, eventNr };
                });
                this.state = SceneState.SUB_MENU;
                this.selectedOption = 0;
                this.renderOptions();
            }
        }
    }

    executeSubOption(item: { label: string, eventNr: number }) {
        this.transitionTo(item.eventNr);
    }

    transitionTo(eventNr: number) {
        const nextScene = Services.story.getScene(eventNr);
        if (nextScene) {
            this.enterScene(nextScene);
        } else {
            console.error(`Scene ${eventNr} not found!`);
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
