import { Scene } from 'phaser';
import { ReplayService } from '../services/ReplayService';
import { InputHandler } from '../services/InputHandler';

export class MainMenuScene extends Scene {
    private replayService: ReplayService;
    private inputHandler: InputHandler;
    
    private titleText!: Phaser.GameObjects.Text;
    private menuItems: Phaser.GameObjects.Text[] = [];
    private selectedIndex: number = 0;
    
    private waitingForScreenshot: boolean = false;
    private isPlaying: boolean = false;
    private hasLoaded: boolean = false;

    constructor() {
        super('MainMenuScene');
        this.replayService = new ReplayService();
        this.inputHandler = new InputHandler();
        this.inputHandler.setReplayService(this.replayService);
    }

    create() {
        // Set background color to match the original (dark teal/green)
        this.cameras.main.setBackgroundColor('#0a4a4a');

        // Title text
        this.titleText = this.add.text(
            145, 
            688, 
            'Der Clou! Open Source Project v0.8 (Prof. CD-ROM)',
            {
                fontFamily: 'monospace',
                fontSize: '16px',
                color: '#ffffff'
            }
        );

        // Menu items (German text as shown in screenshot)
        const menuTexts = [
            'Neues Spiel starten',      // New Game
            'Spiel beenden',             // Quit Game
            'Altes Spiel fortsetzen'    // Load Game
        ];

        const startY = 745;
        const spacing = 45;

        menuTexts.forEach((text, index) => {
            const menuItem = this.add.text(
                30,
                startY + (index * spacing),
                text,
                {
                    fontFamily: 'monospace',
                    fontSize: '16px',
                    color: '#00ff00'
                }
            );
            this.menuItems.push(menuItem);
        });

        // Load replay if specified
        this.loadReplayFile();
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

                // Handle menu navigation based on replay actions
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
        // Handle menu navigation
        const INP_UP = 1 << 0;
        const INP_DOWN = 1 << 1;
        const INP_RIGHT = 1 << 3;
        const INP_LBUTTONP = 1 << 5;

        if (action & INP_UP) {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        }
        if (action & INP_DOWN) {
            this.selectedIndex = Math.min(this.menuItems.length - 1, this.selectedIndex + 1);
        }
        if (action & (INP_RIGHT | INP_LBUTTONP)) {
            this.selectMenuItem(this.selectedIndex);
        }
    }

    private selectMenuItem(index: number) {
        console.log(`Menu item selected: ${index}`);
        // For now, just log the selection
        // In full implementation, this would trigger game start, load, or quit
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
