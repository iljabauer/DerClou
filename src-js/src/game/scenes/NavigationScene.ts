/**
 * NavigationScene - Handles the GO action for navigating between locations
 * 
 * Ported from src/scenes/scenes.c - Go() function
 * Shows a menu of available locations and allows the player to select where to go.
 */

import { Scene } from 'phaser';
import { ReplayService } from '../services/ReplayService';
import { InputHandler } from '../services/InputHandler';
import { TextService } from '../services/TextService';
import { ImageCatalog } from '../services/ImageCatalog';

interface LocationOption {
    name: string;
    sceneId: string;
}

export class NavigationScene extends Scene {
    private replayService: ReplayService;
    private inputHandler: InputHandler;
    private textService: TextService;
    private imageCatalog: ImageCatalog;
    
    private waitingForScreenshot: boolean = false;
    private isPlaying: boolean = false;
    private hasLoaded: boolean = false;
    
    private locations: LocationOption[] = [];
    private selectedIndex: number = 0;
    private menuItems: Phaser.GameObjects.Text[] = [];

    constructor() {
        super('NavigationScene');
        this.replayService = new ReplayService();
        this.inputHandler = new InputHandler();
        this.inputHandler.setReplayService(this.replayService);
        this.textService = new TextService();
        this.imageCatalog = new ImageCatalog(this);
    }

    async create() {
        console.log('NavigationScene: create');
        
        // Set background color (dark green like menu)
        this.cameras.main.setBackgroundColor('#0a4a4a');
        
        // Initialize services
        await this.imageCatalog.initialize();
        await this.textService.loadText('THECLOU');
        
        // Load menu background
        await this.loadMenuBackground();
        
        // Setup locations (hardcoded for now, will load from game data later)
        this.setupLocations();
        
        // Create UI
        this.createUI();
        
        // Setup replay
        await this.setupReplay();
    }
    
    private async loadMenuBackground() {
        // Load MENU background (picture 128)
        const menuBgKey = 'menu_bg';
        const loaded = await this.imageCatalog.createPictureTexture(128, menuBgKey);
        if (loaded && this.textures.exists(menuBgKey)) {
            // Scale from 320x120 to 1024x768
            const bg = this.add.image(512, 384, menuBgKey);
            bg.setDisplaySize(1024, 768);
        }
    }
    
    private setupLocations() {
        // Hardcoded locations for testing
        // TODO: Load from game data based on current scene's successors
        this.locations = [
            { name: 'Victoria Station', sceneId: 'SCENE_STATION' },
            { name: 'Hotel Room', sceneId: 'SCENE_HOTEL_ROOM' },
            { name: 'Pub', sceneId: 'SCENE_PUB' },
            { name: 'Back', sceneId: 'BACK' }
        ];
    }
    
    private createUI() {
        // Title: "Gehen" (Go)
        const title = this.textService.getFirstLine('THECLOU', 'Gehen') || 'Gehen';
        this.add.text(512, 100, title, {
            fontFamily: 'Courier New',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Create menu items
        const startY = 250;
        const spacing = 60;
        
        this.locations.forEach((location, index) => {
            const text = this.add.text(512, startY + index * spacing, location.name, {
                fontFamily: 'Courier New',
                fontSize: '24px',
                color: '#cccccc'
            }).setOrigin(0.5);
            
            this.menuItems.push(text);
        });
        
        // Highlight first item
        this.updateSelection();
    }
    
    private updateSelection() {
        // Update colors based on selection
        this.menuItems.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.setColor('#ffffff');
                item.setFontSize('28px');
            } else {
                item.setColor('#cccccc');
                item.setFontSize('24px');
            }
        });
    }
    
    private selectLocation() {
        const selected = this.locations[this.selectedIndex];
        console.log(`NavigationScene: Selected ${selected.name}`);
        
        // TODO: Transition to selected scene
        // For now, just log and stay in scene
        if (selected.sceneId === 'BACK') {
            // Go back to previous scene
            console.log('Going back...');
        } else {
            console.log(`Going to ${selected.sceneId}`);
        }
    }
    
    private async setupReplay() {
        const urlParams = new URLSearchParams(window.location.search);
        const replayPath = urlParams.get('replay');
        
        if (!replayPath) {
            console.log('NavigationScene: No replay specified');
            return;
        }
        
        console.log(`NavigationScene: Loading replay ${replayPath}`);
        const replayData = await this.replayService.loadReplay(replayPath);
        
        if (!replayData) {
            console.error('NavigationScene: Failed to load replay');
            return;
        }
        
        this.hasLoaded = true;
        
        // Expose startReplay function to window
        (window as any).startReplay = () => {
            console.log('NavigationScene: Starting replay');
            this.isPlaying = true;
        };
        
        console.log('NavigationScene: Replay loaded, waiting for start signal');
    }
    
    private signalScreenshot(eventName: string) {
        this.waitingForScreenshot = true;
        
        if ((window as any).captureEvent) {
            (window as any).captureEvent(eventName);
        }
        
        // Resume after a short delay
        this.time.delayedCall(100, () => {
            this.waitingForScreenshot = false;
        });
    }
    
    update(_time: number, _delta: number) {
        if (this.waitingForScreenshot) {
            return;
        }
        
        if (this.isPlaying && this.hasLoaded && this.replayService.isComplete()) {
            this.isPlaying = false;
            this.signalScreenshot('Finished');
            console.log('NavigationScene: Replay complete');
        }
        
        if (this.isPlaying && this.hasLoaded && !this.replayService.isComplete()) {
            const action = this.inputHandler.simulateTick();
            
            if (action !== null) {
                const tick = this.inputHandler.getSimulationTick();
                const actionStr = this.replayService.actionToString(action);
                console.log(`[Replay] Tick ${tick}: ${actionStr}`);
                
                // Handle navigation actions
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
        const INP_UP = 1 << 0;
        const INP_DOWN = 1 << 1;
        const INP_LBUTTONP = 1 << 5;
        const INP_SPACE = 1 << 14;
        
        if (action & INP_UP) {
            // Move selection up
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            this.updateSelection();
        }
        
        if (action & INP_DOWN) {
            // Move selection down
            this.selectedIndex = Math.min(this.locations.length - 1, this.selectedIndex + 1);
            this.updateSelection();
        }
        
        if (action & (INP_LBUTTONP | INP_SPACE)) {
            // Select current item
            this.selectLocation();
        }
    }
}
