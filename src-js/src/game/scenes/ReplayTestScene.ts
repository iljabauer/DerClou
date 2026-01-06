
import { Scene } from 'phaser';
import { ReplayService, INP_TIME } from '../services/ReplayService';
import { InputHandler } from '../services/InputHandler';
import { ScreenshotService } from '../services/ScreenshotService';

declare const nw: any;

export class ReplayTestScene extends Scene {
    private replayService: ReplayService;
    private inputHandler: InputHandler;

    private tickText!: Phaser.GameObjects.Text;
    private actionText!: Phaser.GameObjects.Text;
    private progressText!: Phaser.GameObjects.Text;
    private statusText!: Phaser.GameObjects.Text;

    private simulateToTick: number | null = null;
    private isPlaying: boolean = false;
    private hasLoaded: boolean = false;

    constructor() {
        super('ReplayTestScene');
        this.replayService = new ReplayService();
        this.inputHandler = new InputHandler();
        this.inputHandler.setReplayService(this.replayService);
    }

    create() {
        // UI Setup
        const style = { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' };

        this.add.text(10, 10, 'Replay Test Scene', { fontSize: '24px', color: '#00ff00' });

        this.statusText = this.add.text(10, 50, 'Status: Idle', style);
        this.tickText = this.add.text(10, 80, 'Tick: 0', style);
        this.actionText = this.add.text(10, 110, 'Action: NONE', style);
        this.progressText = this.add.text(10, 140, 'Record: 0 / 0', style);

        // Play/Pause Button
        // Play/Pause Button
        this.add.text(10, 180, 'Play/Pause', {
            backgroundColor: '#004400', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.togglePlayback());

        // Screenshot Button
        // Screenshot Button
        this.add.text(150, 180, 'Screenshot', {
            backgroundColor: '#000044', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.captureScreenshot());

        // Load replay file
        this.loadReplayFile();
    }

    update(_time: number, _delta: number) {
        if (this.isPlaying && this.hasLoaded && !this.replayService.isComplete()) {
            const action = this.inputHandler.simulateTick();
            this.updateDisplay(action);

            if (action !== null) {
                const tick = this.inputHandler.getSimulationTick();
                const actionStr = this.replayService.actionToString(action);
                console.log(`[Replay] Tick ${tick}: ${actionStr}`);

                // Match C implementation logic:
                // if (action & ~INP_TIME) { Replay_CaptureScreenshot(); }
                if (action & ~INP_TIME) {
                    this.captureScreenshot();
                }
            }

            // Check for simulate-to-tick exit
            if (this.simulateToTick !== null && this.inputHandler.getSimulationTick() >= this.simulateToTick) {
                console.log(`Simulate-to-tick target ${this.simulateToTick} reached. Exiting...`);
                ScreenshotService.exitApp();
            }

            if (this.replayService.isComplete()) {
                this.isPlaying = false;
                this.statusText.setText('Status: Completed');

                if (ScreenshotService.isHeadlessMode()) {
                    console.log('Replay complete in headless mode. Exiting...');
                    ScreenshotService.exitApp();
                }
            }
        }
    }

    private togglePlayback() {
        if (!this.hasLoaded) return;
        this.isPlaying = !this.isPlaying;
        this.statusText.setText(`Status: ${this.isPlaying ? 'Playing' : 'Paused'}`);
    }

    private updateDisplay(action: number | null) {
        const tick = this.inputHandler.getSimulationTick();
        const actionStr = action !== null
            ? this.replayService.actionToString(action)
            : "NONE";
        const current = this.replayService.getCurrentRecordIndex();
        const total = this.replayService.getTotalRecords();

        this.tickText.setText(`Tick: ${tick}`);
        this.actionText.setText(`Action: ${actionStr}`);
        this.progressText.setText(`Record: ${current} / ${total}`);
    }

    private async loadReplayFile() {
        let replayPath = '';

        // Check command line arguments
        if (typeof nw !== 'undefined' && nw.App && nw.App.argv) {
            const argv = nw.App.argv;
            for (const arg of argv) {
                if (arg.startsWith('--replay-path=')) {
                    replayPath = arg.split('=')[1];
                } else if (arg.startsWith('--simulate-to-tick=')) {
                    this.simulateToTick = parseInt(arg.split('=')[1], 10);
                }
            }
        }

        if (!replayPath) {
            // Default path or error
            this.statusText.setText('Status: No replay path provided (--replay-path)');
            console.warn('No replay path provided. Use --replay-path=...');
            return;
        }

        this.statusText.setText(`Status: Loading ${replayPath}...`);

        const data = await this.replayService.loadReplay(replayPath);

        if (data) {
            this.replayService.initPlayback(data);
            this.inputHandler.init();
            this.hasLoaded = true;
            this.statusText.setText('Status: Ready');
            this.updateDisplay(null);
            console.log(`Loaded replay with ${data.records.length} records`);

            if (ScreenshotService.isHeadlessMode() || this.simulateToTick !== null) {
                console.log('Auto-playing (Headless or Simulate-To-Tick)...');
                this.togglePlayback();
            }
        } else {
            this.statusText.setText('Status: Load Failed');
        }
    }

    private captureScreenshot() {
        this.game.renderer.snapshot((image: HTMLImageElement | any) => {
            if (image && image.src) {
                const result = ScreenshotService.saveScreenshot(image.src);
                console.log('Screenshot capture result:', result);
            }
        });
    }
}
