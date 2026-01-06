
import { Scene } from 'phaser';
import { ReplayService, INP_TIME } from '../services/ReplayService';
import { InputHandler } from '../services/InputHandler';

export class GameStartScene extends Scene {
    private replayService: ReplayService;
    private inputHandler: InputHandler;

    private simulateToTick: number | null = null;
    private isPlaying: boolean = false;
    private hasLoaded: boolean = false;

    private waitingForScreenshot: boolean = false;

    constructor() {
        super('ReplayTestScene');
        this.replayService = new ReplayService();
        this.inputHandler = new InputHandler();
        this.inputHandler.setReplayService(this.replayService);
    }

    create() {
        // Load replay file
        this.loadReplayFile();
    }

    update(_time: number, _delta: number) {
        if (this.waitingForScreenshot) {
            return;
        }

        if (this.isPlaying && this.hasLoaded && this.replayService.isComplete()) {
            this.isPlaying = false;
            console.log('Status: Completed');
            this.signalScreenshot('Finished');
            console.log('Replay complete.');
        }

        if (this.isPlaying && this.hasLoaded && !this.replayService.isComplete()) {
            const action = this.inputHandler.simulateTick();

            if (action !== null) {
                const tick = this.inputHandler.getSimulationTick();
                const actionStr = this.replayService.actionToString(action);
                console.log(`[Replay] Tick ${tick}: ${actionStr}`);

                // Match C implementation logic:
                // if (action & ~INP_TIME) { Replay_CaptureScreenshot(); }
                if (action & ~INP_TIME) {
                    this.signalScreenshot(`Tick_${tick}_${actionStr.replace(/\s+/g, '_')}`);
                }
            }

            // Check for simulate-to-tick exit
            if (this.simulateToTick !== null && this.inputHandler.getSimulationTick() >= this.simulateToTick) {
                console.log(`Simulate-to-tick target ${this.simulateToTick} reached. Stopping playback...`);
                this.isPlaying = false;
                console.log('Status: Paused (Target Tick Reached)');
            }
        }
    }

    private togglePlayback() {
        if (!this.hasLoaded) return;
        this.isPlaying = !this.isPlaying;
        console.log(`Status: ${this.isPlaying ? 'Playing' : 'Paused'}`);
    }

    private async loadReplayFile() {
        let replayPath = '';

        // Browser/Playwright default
        // Playwright can inject this, or we fallback to a known test file
        // Check URL params
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('replay')) {
            replayPath = urlParams.get('replay')!;
        } else if (urlParams.has('simulate-to-tick')) {
            // Handle simulate-to-tick if passed via URL
            const tickVal = urlParams.get('simulate-to-tick');
            if (tickVal) this.simulateToTick = parseInt(tickVal, 10);
        }

        if (!replayPath) {
            console.log('Status: No replay path provided');
            console.warn('No replay path provided.');
            return;
        }

        console.log(`Status: Loading ${replayPath}...`);

        const data = await this.replayService.loadReplay(replayPath);

        if (data) {
            this.replayService.initPlayback(data);
            this.inputHandler.init();
            this.hasLoaded = true;
            console.log('Status: Ready');
            console.log(`Loaded replay with ${data.records.length} records`);

            // Expose startReplay to Playwright
            (window as any).startReplay = () => {
                console.log("Playwright signaled startReplay");
                // Only toggle if not already playing, to avoid stopping it if it auto-started
                if (!this.isPlaying) {
                    this.togglePlayback();
                }
            };

            // Auto-play if replay is loaded
            console.log('Auto-playing replay...');
            if (!this.isPlaying) {
                this.togglePlayback();
            }

        } else {
            console.log('Status: Load Failed');
        }
    }

    private signalScreenshot(name: string) {
        if ((window as any).captureEvent) {
            this.waitingForScreenshot = true;
            // The Playwright function is async
            (window as any).captureEvent(name).then(() => {
                this.waitingForScreenshot = false;
            }).catch((e: any) => {
                console.warn(`captureEvent failed: ${e}`);
                this.waitingForScreenshot = false;
            });
        }
    }
}

