/**
 * Main game engine - integrates all systems with replay support
 */

import { Scene } from 'phaser';
import { InputHandler } from '../services/InputHandler';
import { ReplayService, INP_TIME } from '../services/ReplayService';
import { ScreenshotService } from '../services/ScreenshotService';
import { sceneManager } from './SceneManager';
import { gameState } from './GameState';
import { db } from './Database';
import { Renderer } from './Renderer';
import { SceneId } from '../types/SceneTypes';

export class GameEngine {
    private scene: Scene;
    private inputHandler: InputHandler;
    private replayService: ReplayService;
    private renderer: Renderer;
    private isInitialized: boolean = false;
    private isPlaying: boolean = false;
    private simulateToTick: number | null = null;

    constructor(scene: Scene) {
        this.scene = scene;
        this.inputHandler = new InputHandler();
        this.replayService = new ReplayService();
        this.renderer = new Renderer(scene);
        this.inputHandler.setReplayService(this.replayService);
    }

    async init(replayPath?: string, simulateToTick?: number): Promise<boolean> {
        if (this.isInitialized) {
            return true;
        }

        if (replayPath) {
            const data = await this.replayService.loadReplay(replayPath);
            if (!data) {
                console.error('Failed to load replay');
                return false;
            }

            this.replayService.initPlayback(data);
            this.inputHandler.init();
            this.simulateToTick = simulateToTick || null;
            console.log(`Loaded replay with ${data.records.length} records`);
        }

        this.isInitialized = true;
        return true;
    }

    start(initialScene: SceneId = SceneId.MainMenu): void {
        if (!this.isInitialized) {
            console.error('GameEngine not initialized');
            return;
        }

        sceneManager.start(initialScene);
        this.isPlaying = true;
    }

    stop(): void {
        this.isPlaying = false;
        sceneManager.stop();
    }

    update(delta: number): void {
        if (!this.isPlaying) {
            return;
        }

        // Process replay input if available
        const action = this.inputHandler.simulateTick();
        
        if (action !== null) {
            const tick = this.inputHandler.getSimulationTick();
            const actionStr = this.replayService.actionToString(action);
            console.log(`[Replay] Tick ${tick}: ${actionStr}`);

            // Capture screenshot on non-time actions (matching C implementation)
            if (action & ~INP_TIME) {
                this.captureScreenshot();
            }
        }

        // Update current scene
        sceneManager.update(delta);

        // Check for simulate-to-tick exit
        if (this.simulateToTick !== null && 
            this.inputHandler.getSimulationTick() >= this.simulateToTick) {
            console.log(`Simulate-to-tick target ${this.simulateToTick} reached. Exiting...`);
            ScreenshotService.exitApp();
        }

        // Check for replay completion
        if (this.replayService.isComplete()) {
            this.isPlaying = false;
            console.log('Replay complete');

            if (ScreenshotService.isHeadlessMode()) {
                console.log('Headless mode: Exiting...');
                ScreenshotService.exitApp();
            }
        }
    }

    private captureScreenshot(): void {
        const tick = this.inputHandler.getSimulationTick();
        this.scene.game.renderer.snapshot((image: HTMLImageElement | any) => {
            if (image && image.src) {
                const filename = `replay_tick_${tick}_screenshot.png`;
                const result = ScreenshotService.saveScreenshot(image.src, filename);
                if (!result.success) {
                    console.error('Screenshot failed:', result.message);
                }
            }
        });
    }

    getRenderer(): Renderer {
        return this.renderer;
    }

    getInputHandler(): InputHandler {
        return this.inputHandler;
    }

    getReplayService(): ReplayService {
        return this.replayService;
    }

    isReplayMode(): boolean {
        return this.replayService.getTotalRecords() > 0;
    }

    getCurrentTick(): number {
        return this.inputHandler.getSimulationTick();
    }

    getGameState() {
        return gameState;
    }

    getDatabase() {
        return db;
    }
}
