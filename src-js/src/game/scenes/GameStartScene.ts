
import { Scene } from 'phaser';
import { InputPlugin } from '../plugins/InputPlugin';


export class GameStartScene extends Scene {
    // @ts-ignore - Injected by Plugin Manager
    inputSystem: InputPlugin;

    constructor() {
        super('ReplayTestScene');
    }

    init() {
        // Manual installation to ensure it breaks through
        this.plugins.installScenePlugin('InputPlugin', InputPlugin, 'inputSystem', this);
    }

    create() {
        this.loadReplayIfRequested();
    }


    private async loadReplayIfRequested() {
        (window as any).startReplay = () => console.log("Playwright startReplay");

        // Check URL params
        const urlParams = new URLSearchParams(window.location.search);
        let replayPath = '';
        const simulateToTickStr = urlParams.get('simulate-to-tick');

        if (urlParams.has('replay')) {
            replayPath = urlParams.get('replay')!;
        }

        if (simulateToTickStr) {
            const tick = parseInt(simulateToTickStr, 10);
            this.inputSystem.setSimulateToTick(tick);
        }

        if (replayPath) {
            console.log(`Status: Loading ${replayPath}...`);
            await this.inputSystem.loadReplay(replayPath);
            console.log('Status: Ready');

            // Expose startReplay for Playwright compatibility (if needed)
            (window as any).startReplay = async () => {
                console.log("Playwright signaled startReplay (Auto-started by InputPlugin)");

                // Playback Loop to consume events and trigger screenshots
                // We monitor isPlaying from the plugin
                while ((this.inputSystem as any).isPlaying) {
                    // Wait for ANY input (excluding Time for now, or including?)
                    // If we wait for anything, we catch all recorded actions.
                    // 0xFFFFFFFF covers all bits.
                    await this.inputSystem.waitFor(0xFFFFFFFF);
                }
                console.log("Replay Loop Finished");
            };

            // Auto-start loop if already playing (which it is)
            (window as any).startReplay();
        } else {
            console.log('Status: No replay path provided. Waiting for manual input...');
        }
    }
}
