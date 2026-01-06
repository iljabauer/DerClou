import { Scene } from 'phaser';
import { SharedReplayService } from '../services/SharedReplayService';
import { TextService } from '../services/TextService';
import { ILBMLoader } from '../services/ILBMLoader';

export class MainMenuScene extends Scene {
    private sharedReplay: SharedReplayService | null = null;
    private textService: TextService;
    
    private menuItems: Phaser.GameObjects.Text[] = [];
    private selectedIndex: number = 0;
    
    private waitingForScreenshot: boolean = false;
    private isPlaying: boolean = false;
    private hasLoaded: boolean = false;

    constructor() {
        super('MainMenuScene');
        this.textService = new TextService();
    }

    async create() {
        // Set background color to match the original (dark teal/green)
        this.cameras.main.setBackgroundColor('#0a4a4a');

        // Load the MENU background image (ILBM format)
        // From COLL.LST: 128,menu,320,140,192,246,0
        // From PICT.LST: 21,128,0,60,320,60,0,140
        // This loads the bottom portion of the menu image (train station scene)
        const menuLoaded = await ILBMLoader.loadAndCreateTexture(
            this,
            'menu_background',
            'PICTURES/MENU'
        );

        if (menuLoaded) {
            // The MENU image is 320x120, we need to scale it to fit 1024x768
            // Original game resolution was 320x200, scaled to 1024x640 (3.2x)
            // Position at bottom: y=140 in original = y=448 in scaled (140 * 3.2)
            const bg = this.add.image(0, 448, 'menu_background');
            bg.setOrigin(0, 0);
            bg.setScale(3.2); // Scale from 320 to 1024
        } else {
            console.warn('Failed to load MENU background, using placeholder');
            // Fallback to placeholder graphics
            const graphics = this.add.graphics();
            graphics.fillStyle(0x0a3a3a, 1);
            graphics.fillRect(0, 650, 1024, 118);
            
            graphics.fillStyle(0x083030, 1);
            graphics.fillRect(450, 700, 80, 68);
            graphics.fillRect(550, 680, 100, 88);
            graphics.fillRect(900, 690, 120, 78);
        }

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
        
        if (!this.sharedReplay) {
            return;
        }

        if (this.isPlaying && this.hasLoaded && this.sharedReplay.isReplayComplete()) {
            this.isPlaying = false;
            this.signalScreenshot('Finished');
            console.log('Replay complete.');
        }

        if (this.isPlaying && this.hasLoaded && !this.sharedReplay.isReplayComplete()) {
            const action = this.sharedReplay.simulateTick();
            
            if (action !== null) {
                const tick = this.sharedReplay.getSimulationTick();
                const actionStr = this.sharedReplay.actionToString(action);
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
        
        switch (index) {
            case 0: // New Game
                console.log('Starting new game...');
                this.scene.start('StoryScene');
                break;
            case 1: // Load Game
                console.log('Load game not yet implemented');
                break;
            case 2: // Quit Game
                console.log('Quit game');
                break;
        }
    }

    private async loadReplayFile() {
        const urlParams = new URLSearchParams(window.location.search);
        const replayPath = urlParams.get('replay');

        if (!replayPath) {
            console.log('No replay path provided - interactive mode');
            return;
        }

        console.log(`MainMenuScene: Loading replay: ${replayPath}`);

        // Initialize shared replay service
        this.sharedReplay = SharedReplayService.initialize(this);
        
        // Load replay
        const success = await this.sharedReplay.loadReplay(replayPath);
        
        if (success) {
            this.hasLoaded = true;
            console.log('MainMenuScene: Replay loaded successfully');
            
            // Note: startReplay is exposed by SharedReplayService.initialize()
            // We just need to check the shared service's isPlaying flag
            this.time.addEvent({
                delay: 100,
                loop: true,
                callback: () => {
                    if (this.sharedReplay && this.sharedReplay.isReplayPlaying() && !this.isPlaying) {
                        console.log('MainMenuScene: Replay started');
                        this.isPlaying = true;
                    }
                }
            });
        } else {
            console.error('MainMenuScene: Failed to load replay');
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
