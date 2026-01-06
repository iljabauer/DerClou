import { Scene } from 'phaser';
import { ReplayService } from '../services/ReplayService';
import { InputHandler } from '../services/InputHandler';
import { TextService } from '../services/TextService';

export class MainMenuScene extends Scene {
    private replayService: ReplayService;
    private inputHandler: InputHandler;
    private textService: TextService;
    
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
        this.textService = new TextService();
    }

    async create() {
        // Set background color to match the original (dark teal/green)
        this.cameras.main.setBackgroundColor('#0a4a4a');

        // Add a simple building silhouette at the bottom to match the screenshot
        // This is a placeholder - the real game loads an image
        const graphics = this.add.graphics();
        graphics.fillStyle(0x0a3a3a, 1);
        graphics.fillRect(0, 650, 1024, 118);
        
        // Add some simple building shapes to roughly match the original
        graphics.fillStyle(0x083030, 1);
        graphics.fillRect(450, 700, 80, 68);
        graphics.fillRect(550, 680, 100, 88);
        graphics.fillRect(900, 690, 120, 78);

        // Load text files
        await this.textService.loadText('MENU');

        // Get title from text file
        // From C code: COSP_TITLE " v" COSP_VERSION " (Prof. CD-ROM)"
        const titleText = 'Der Clou! Open Source Project v0.8 (Prof. CD-ROM)';
        
        // Title text - positioned to match screenshot
        this.add.text(
            145, 
            688, 
            titleText,
            {
                fontFamily: 'Courier New, monospace',
                fontSize: '16px',
                color: '#ffffff'
            }
        );

        // Get menu items from text file (STARTUP_MENU key)
        const menuLines = this.textService.getLines('MENU', 'STARTUP_MENU');
        
        // Menu items layout from C code:
        // 0: Neues Spiel starten (New Game)
        // 1: Altes Spiel fortsetzen (Load Game)  
        // 2: Spiel beenden (Quit Game)
        
        // Layout: Two items on first line, one on second line
        // First line: "Neues Spiel starten" (left) and "Spiel beenden" (right)
        // Second line: "Altes Spiel fortsetzen" (left)
        
        if (menuLines.length >= 3) {
            this.add.text(30, 745, menuLines[0], {
                fontFamily: 'Courier New, monospace',
                fontSize: '16px',
                color: '#00ff00'
            });
            
            this.add.text(520, 745, menuLines[2], {
                fontFamily: 'Courier New, monospace',
                fontSize: '16px',
                color: '#00ff00'
            });
            
            this.add.text(30, 790, menuLines[1], {
                fontFamily: 'Courier New, monospace',
                fontSize: '16px',
                color: '#00ff00'
            });
        } else {
            // Fallback to hardcoded text if loading fails
            console.warn('Failed to load menu text, using fallback');
            this.add.text(30, 745, 'Neues Spiel starten', {
                fontFamily: 'Courier New, monospace',
                fontSize: '16px',
                color: '#00ff00'
            });
            
            this.add.text(520, 745, 'Spiel beenden', {
                fontFamily: 'Courier New, monospace',
                fontSize: '16px',
                color: '#00ff00'
            });
            
            this.add.text(30, 790, 'Altes Spiel fortsetzen', {
                fontFamily: 'Courier New, monospace',
                fontSize: '16px',
                color: '#00ff00'
            });
        }

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
