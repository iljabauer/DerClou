/**
 * MonologueScene - Displays character monologues/dialogs
 * 
 * This scene handles the display of character speech bubbles
 * Used for story sequences and character interactions
 */

import { Scene } from 'phaser';
import { ReplayService } from '../services/ReplayService';
import { InputHandler } from '../services/InputHandler';
import { TextService } from '../services/TextService';
import { DialogService, BubbleType } from '../services/DialogService';

export class MonologueScene extends Scene {
    private replayService: ReplayService;
    private inputHandler: InputHandler;
    private textService: TextService;
    private dialogService!: DialogService;
    
    private waitingForScreenshot: boolean = false;
    private isPlaying: boolean = false;
    private hasLoaded: boolean = false;
    private dialogComplete: boolean = false;

    constructor() {
        super('MonologueScene');
        this.replayService = new ReplayService();
        this.inputHandler = new InputHandler();
        this.inputHandler.setReplayService(this.replayService);
        this.textService = new TextService();
    }

    async create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#0a4a4a');
        
        // Create dialog service
        this.dialogService = new DialogService(this, this.textService);
        
        // Load text files
        await this.textService.loadText('STORY_0');
        
        // Add a simple background
        const graphics = this.add.graphics();
        graphics.fillStyle(0x0a3a3a, 1);
        graphics.fillRect(0, 0, 1024, 768);
        
        // Load replay if specified
        await this.loadReplayFile();
        
        // If not in replay mode, show a test monologue
        if (!this.hasLoaded) {
            await this.showTestMonologue();
        }
    }

    update(_time: number, _delta: number) {
        if (this.waitingForScreenshot) {
            return;
        }

        if (this.isPlaying && this.hasLoaded && this.replayService.isComplete()) {
            this.isPlaying = false;
            this.signalScreenshot('Finished');
            console.log('Replay complete.');
        }

        if (this.isPlaying && this.hasLoaded && !this.replayService.isComplete()) {
            const action = this.inputHandler.simulateTick();
            
            if (action !== null) {
                const tick = this.inputHandler.getSimulationTick();
                const actionStr = this.replayService.actionToString(action);
                console.log(`[Replay] Tick ${tick}: ${actionStr}`);

                // Handle dialog actions
                this.handleReplayAction(action);

                // Capture screenshot for non-time actions
                const INP_TIME = 1 << 11;
                if (action & ~INP_TIME) {
                    this.signalScreenshot(`Tick_${tick}_${actionStr.replace(/\s+/g, '_')}`);
                }
            }
        }
    }

    private handleReplayAction(action: number) {
        const INP_LBUTTONP = 1 << 5;
        const INP_RIGHT = 1 << 3;
        
        // Advance dialog on click or right arrow
        if ((action & INP_LBUTTONP) || (action & INP_RIGHT)) {
            if (!this.dialogComplete) {
                this.dialogComplete = true;
                // Dialog will auto-dismiss
            }
        }
    }

    /**
     * Show a test monologue for development
     */
    private async showTestMonologue() {
        // Create a simple test dialog
        const testLines = [
            'This is a test monologue.',
            'It demonstrates the speech bubble system.',
            'Click to continue...'
        ];
        
        // Manually create a bubble for testing
        this.dialogService.setBubbleType(BubbleType.SPEAK);
        
        // For now, just display text on screen
        let y = 100;
        testLines.forEach(line => {
            this.add.text(100, y, line, {
                fontFamily: 'Courier New, monospace',
                fontSize: '16px',
                color: '#ffffff'
            });
            y += 30;
        });
    }

    private async loadReplayFile() {
        const urlParams = new URLSearchParams(window.location.search);
        const replayPath = urlParams.get('replay');

        if (!replayPath) {
            console.log('No replay path provided - interactive mode');
            return;
        }

        console.log(`Loading replay: ${replayPath}`);

        const data = await this.replayService.loadReplay(replayPath);

        if (data) {
            this.replayService.initPlayback(data);
            this.inputHandler.init();
            this.hasLoaded = true;
            console.log(`Loaded replay with ${data.records.length} records`);

            // Expose startReplay to Playwright
            (window as any).startReplay = () => {
                console.log("Playwright signaled startReplay");
                this.isPlaying = true;
            };
        } else {
            console.error('Failed to load replay');
        }
    }

    private signalScreenshot(name: string) {
        if ((window as any).captureEvent) {
            this.waitingForScreenshot = true;
            (window as any).captureEvent(name).then(() => {
                this.waitingForScreenshot = false;
            }).catch((e: any) => {
                console.warn(`captureEvent failed: ${e}`);
                this.waitingForScreenshot = false;
            });
        }
    }
}
