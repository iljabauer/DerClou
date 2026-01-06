/**
 * StoryScene - Handles story sequences with dialog and character portraits
 * 
 * Ported from src/story/ and src/present/
 * Displays scenes with backgrounds, characters, speech bubbles, and text.
 */

import { Scene } from 'phaser';
import { ReplayService } from '../services/ReplayService';
import { InputHandler } from '../services/InputHandler';
import { TextService } from '../services/TextService';

export class StoryScene extends Scene {
    private replayService: ReplayService;
    private inputHandler: InputHandler;
    private textService: TextService;
    
    private waitingForScreenshot: boolean = false;
    private isPlaying: boolean = false;
    private hasLoaded: boolean = false;
    
    private currentDialogIndex: number = 0;
    private dialogSequence: any[] = [];

    constructor() {
        super('StoryScene');
        this.replayService = new ReplayService();
        this.inputHandler = new InputHandler();
        this.inputHandler.setReplayService(this.replayService);
        this.textService = new TextService();
    }

    async create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#0a4a4a');

        // Load text files
        await this.textService.loadText('STORY');

        // For now, create a simple opening sequence
        // This will be expanded to load from story data files
        this.setupOpeningSequence();

        // Load replay if specified
        this.loadReplayFile();
    }

    private setupOpeningSequence() {
        // Opening monologue at Victoria Station
        // This is a placeholder - will be loaded from story data
        this.dialogSequence = [
            {
                scene: 'Victoria Station',
                date: '03.02.1953',
                character: 'Matt',
                portrait: 126, // FACE_GLUDO_SAILOR from story.h
                text: 'Ja, genau auf diesen, heute verschlissenen,\nNorwerfliessen begann meine Geschichte\nvor 41 Jahren.\nDamals wollte man den 2. Weltkrieg mit all\nden Elend, den Entbehrungen und seinen Toten'
            }
        ];
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

                // Handle story progression based on replay actions
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
        // Handle dialog progression
        const INP_LBUTTONP = 1 << 5;
        const INP_RIGHT = 1 << 3;

        if (action & (INP_LBUTTONP | INP_RIGHT)) {
            this.advanceDialog();
        }
    }

    private advanceDialog() {
        this.currentDialogIndex++;
        if (this.currentDialogIndex < this.dialogSequence.length) {
            this.showDialog(this.dialogSequence[this.currentDialogIndex]);
        }
    }

    private showDialog(dialog: any) {
        // Clear previous dialog
        this.children.removeAll();

        // Draw scene background
        // TODO: Load actual background image
        const graphics = this.add.graphics();
        graphics.fillStyle(0x0a4a4a, 1);
        graphics.fillRect(0, 0, 1024, 768);

        // Draw character portrait
        // TODO: Load actual portrait image
        const portraitX = 10;
        const portraitY = 80;
        const portraitWidth = 230;
        const portraitHeight = 250;
        
        graphics.lineStyle(4, 0xccaa66);
        graphics.strokeRect(portraitX, portraitY, portraitWidth, portraitHeight);
        graphics.fillStyle(0x663333, 1);
        graphics.fillRect(portraitX + 4, portraitY + 4, portraitWidth - 8, portraitHeight - 8);

        // Draw speech bubble with text
        const bubbleX = 250;
        const bubbleY = 80;
        const bubbleWidth = 760;
        const bubbleHeight = 220;

        // Draw bubble background
        graphics.fillStyle(0xdddddd, 1);
        graphics.fillRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
        
        // Draw bubble border
        graphics.lineStyle(2, 0x000000);
        graphics.strokeRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
        
        // Draw pointer from bubble to portrait
        graphics.fillStyle(0xdddddd, 1);
        graphics.fillTriangle(
            bubbleX, bubbleY + 50,
            bubbleX, bubbleY + 80,
            portraitX + portraitWidth, bubbleY + 65
        );
        graphics.lineStyle(2, 0x000000);
        graphics.strokeTriangle(
            bubbleX, bubbleY + 50,
            bubbleX, bubbleY + 80,
            portraitX + portraitWidth, bubbleY + 65
        );

        // Draw text in bubble
        this.add.text(
            bubbleX + 20,
            bubbleY + 20,
            dialog.text,
            {
                fontFamily: 'Courier New, monospace',
                fontSize: '16px',
                color: '#000000',
                wordWrap: { width: bubbleWidth - 40 }
            }
        );

        // Draw location and date at bottom
        const locationText = `${dialog.scene} ${dialog.date}`;
        this.add.text(
            512,
            690,
            locationText,
            {
                fontFamily: 'Courier New, monospace',
                fontSize: '20px',
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);
    }

    private async loadReplayFile() {
        const urlParams = new URLSearchParams(window.location.search);
        const replayPath = urlParams.get('replay');

        if (!replayPath) {
            console.log('No replay path provided - interactive mode');
            // Show first dialog in interactive mode
            if (this.dialogSequence.length > 0) {
                this.showDialog(this.dialogSequence[0]);
            }
            return;
        }

        console.log(`Loading replay: ${replayPath}`);

        const data = await this.replayService.loadReplay(replayPath);

        if (data) {
            this.replayService.initPlayback(data);
            this.inputHandler.init();
            this.hasLoaded = true;
            console.log(`Loaded replay with ${data.records.length} records`);

            // Show first dialog
            if (this.dialogSequence.length > 0) {
                this.showDialog(this.dialogSequence[0]);
            }

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
