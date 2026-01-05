/**
 * Main game scene - integrates all game systems with replay support
 * This is the primary Phaser scene that runs the game
 */

import { Scene } from 'phaser';
import { GameEngine } from '../core/GameEngine';
import { sceneManager } from '../core/SceneManager';
import { SceneId } from '../types/SceneTypes';
import { MainMenuScene } from './MainMenuScene';
import { LondonScene } from './LondonScene';
import { ScreenshotService } from '../services/ScreenshotService';

declare const nw: any;

export class GameScene extends Scene {
    private engine!: GameEngine;
    private hasLoaded: boolean = false;
    private statusText!: Phaser.GameObjects.Text;
    private tickText!: Phaser.GameObjects.Text;
    private modeText!: Phaser.GameObjects.Text;

    constructor() {
        super('GameScene');
    }

    async create() {
        this.engine = new GameEngine(this);

        // Parse command line arguments
        let replayPath = '';
        let simulateToTick: number | undefined;
        let screenshotPath = '';
        let headless = false;

        if (typeof nw !== 'undefined' && nw.App && nw.App.argv) {
            const argv = nw.App.argv;
            for (const arg of argv) {
                if (arg.startsWith('--replay-path=')) {
                    replayPath = arg.split('=')[1];
                } else if (arg.startsWith('--simulate-to-tick=')) {
                    simulateToTick = parseInt(arg.split('=')[1], 10);
                } else if (arg.startsWith('--screenshot-path=')) {
                    screenshotPath = arg.split('=')[1];
                } else if (arg === '--headless') {
                    headless = true;
                }
            }
        }

        // Initialize screenshot service
        if (screenshotPath) {
            ScreenshotService.init(screenshotPath, headless);
        }

        // Initialize engine
        const success = await this.engine.init(replayPath, simulateToTick);
        
        if (!success && replayPath) {
            this.showError('Failed to load replay');
            return;
        }

        this.hasLoaded = true;

        // Register game scenes
        this.registerGameScenes();

        // Setup UI
        this.setupUI();

        // Start the game
        if (this.engine.isReplayMode()) {
            console.log('Starting in replay mode');
            this.engine.start(SceneId.MainMenu);
        } else {
            console.log('Starting in normal mode');
            this.engine.start(SceneId.MainMenu);
        }
    }

    update(_time: number, delta: number) {
        if (!this.hasLoaded) {
            return;
        }

        this.engine.update(delta);
        this.updateUI();
    }

    private registerGameScenes(): void {
        const mainMenuScene = new MainMenuScene(this, this.engine);
        const londonScene = new LondonScene(this, this.engine);

        sceneManager.registerScene(mainMenuScene);
        sceneManager.registerScene(londonScene);
    }

    private setupUI(): void {
        const style = { fontFamily: 'Arial', fontSize: '14px', color: '#ffffff' };

        // Status display in top-left corner
        this.statusText = this.add.text(10, 10, '', style);
        this.tickText = this.add.text(10, 30, '', style);
        this.modeText = this.add.text(10, 50, '', style);
    }

    private updateUI(): void {
        if (!this.hasLoaded) return;

        const tick = this.engine.getCurrentTick();
        const isReplay = this.engine.isReplayMode();
        const isComplete = this.engine.getReplayService().isComplete();

        this.statusText.setText(`Status: ${isComplete ? 'Complete' : 'Running'}`);
        this.tickText.setText(`Tick: ${tick}`);
        this.modeText.setText(`Mode: ${isReplay ? 'Replay' : 'Normal'}` );
    }

    private showError(message: string): void {
        this.add.text(512, 384, `Error: ${message}`, {
            fontSize: '24px',
            color: '#ff0000',
        }).setOrigin(0.5);
    }
}
