/**
 * LocationScene - Displays a location with background, character, and action menu
 * 
 * Ported from:
 * - src/gameplay/gp_app.c - StdInit(), StdHandle()
 * - src/scenes/scenes.c - Scene functions
 * - src/anim/sysanim.c - Animation/background loading
 * 
 * Shows:
 * - Location background image/animation
 * - Location name and date at top
 * - Character sprite (Matt)
 * - Action menu at bottom (Gehen, Reden, Warten, etc.)
 * - Time clock
 */

import { Scene } from 'phaser';
import { SharedReplayService } from '../services/SharedReplayService';
import { TextService } from '../services/TextService';
import { ImageCatalog } from '../services/ImageCatalog';

// Action bitmask constants (from C code)
const GO = 1 << 0;              // 0x00000001 - Gehen
const BUSINESS_TALK = 1 << 1;   // 0x00000002 - Reden
const LOOK = 1 << 2;            // 0x00000004 - Umsehen
const INVESTIGATE = 1 << 3;     // 0x00000008 - Nachdenken
// const MAKE_CALL = 1 << 4;    // 0x00000010
const CALL_TAXI = 1 << 5;       // 0x00000020 - Taxi rufen
// const PLAN = 1 << 6;         // 0x00000040
const WAIT = 1 << 7;            // 0x00000080 - Warten

interface LocationData {
    locationNr: number;
    locationName: string;
    date: string;
    availableActions: number;  // Bitmask
    backgroundImage?: string;
}

interface ActionMenuItem {
    action: number;
    text: string;
    key: string;
}

export class LocationScene extends Scene {
    private sharedReplay: SharedReplayService | null = null;
    private textService: TextService;
    private imageCatalog: ImageCatalog;
    
    private waitingForScreenshot: boolean = false;
    private isPlaying: boolean = false;
    private hasLoaded: boolean = false;
    
    private locationData: LocationData | null = null;
    private actionMenuItems: ActionMenuItem[] = [];
    private selectedActionIndex: number = 0;
    private actionTexts: Phaser.GameObjects.Text[] = [];

    constructor() {
        super('LocationScene');
        this.textService = new TextService();
        this.imageCatalog = new ImageCatalog(this);
    }

    async create() {
        console.log('LocationScene: create');
        
        // Set background color (dark teal like menu)
        this.cameras.main.setBackgroundColor('#0a4a4a');
        
        // Initialize services
        await this.imageCatalog.initialize();
        await this.textService.loadText('THECLOU');
        
        // Setup location data (hardcoded for now - Holland Street)
        this.setupLocationData();
        
        // Load and display location background
        await this.loadLocationBackground();
        
        // Display location name and date
        this.displayLocationInfo();
        
        // Create action menu
        this.createActionMenu();
        
        // Get shared replay service
        this.sharedReplay = SharedReplayService.getInstance(this);
        
        // Check if replay is active
        if (this.sharedReplay && this.sharedReplay.isReplayLoaded()) {
            this.hasLoaded = true;
            console.log('LocationScene: Using shared replay service');
            
            // Monitor for replay start
            this.time.addEvent({
                delay: 100,
                loop: true,
                callback: () => {
                    if (this.sharedReplay && this.sharedReplay.isReplayPlaying() && !this.isPlaying) {
                        console.log('LocationScene: Replay started');
                        this.isPlaying = true;
                    }
                }
            });
        }
    }
    
    private setupLocationData() {
        // Hardcoded Holland Street data for testing
        // TODO: Load from game data based on scene
        this.locationData = {
            locationNr: 0,
            locationName: 'Holland Street',
            date: '03.02.1953',
            availableActions: GO | BUSINESS_TALK | LOOK | INVESTIGATE | CALL_TAXI | WAIT,
            backgroundImage: 'Holland Street'
        };
    }
    
    private async loadLocationBackground() {
        if (!this.locationData || !this.locationData.backgroundImage) {
            console.warn('LocationScene: No background image specified');
            return;
        }
        
        // For now, try to load from PICTURES directory
        // Animation format: AnimID maps to picture in ANIMD.TXT
        // Format: Modus,WaitTime,PicId,CollId,PicCount,FrameWidth,FrameHeight,FrameOffset,XDest,YDest
        // Example: Holland Street = 55,20,142,62,4,40,72,0,144,3
        
        // Try loading picture 142 (Holland Street background)
        const bgKey = 'location_bg';
        const loaded = await this.imageCatalog.createPictureTexture(142, bgKey);
        
        if (loaded && this.textures.exists(bgKey)) {
            // Display background scaled to fit screen
            const bg = this.add.image(512, 384, bgKey);
            bg.setDisplaySize(1024, 768);
            console.log('LocationScene: Loaded background image 142');
        } else {
            console.warn('LocationScene: Failed to load background, using placeholder');
            // Placeholder background
            const graphics = this.add.graphics();
            graphics.fillStyle(0x1a5a5a, 1);
            graphics.fillRect(0, 0, 1024, 640);
        }
    }
    
    private displayLocationInfo() {
        if (!this.locationData) return;
        
        // Display location name and date at top center
        // Format: "{Location Name} {Date}"
        const locationText = `${this.locationData.locationName} ${this.locationData.date}`;
        
        this.add.text(512, 688, locationText, {
            fontFamily: 'Courier New',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5, 0);
    }
    
    private createActionMenu() {
        if (!this.locationData) return;
        
        // Build action menu based on available actions
        this.actionMenuItems = [];
        const actions = this.locationData.availableActions;
        
        // Map actions to text keys (from THECLOU.TXT)
        if (actions & GO) {
            this.actionMenuItems.push({
                action: GO,
                text: this.textService.getFirstLine('THECLOU', 'Gehen') || 'Gehen',
                key: 'Gehen'
            });
        }
        if (actions & BUSINESS_TALK) {
            this.actionMenuItems.push({
                action: BUSINESS_TALK,
                text: this.textService.getFirstLine('THECLOU', 'Reden') || 'Reden',
                key: 'Reden'
            });
        }
        if (actions & WAIT) {
            this.actionMenuItems.push({
                action: WAIT,
                text: this.textService.getFirstLine('THECLOU', 'Warten') || 'Warten',
                key: 'Warten'
            });
        }
        if (actions & LOOK) {
            this.actionMenuItems.push({
                action: LOOK,
                text: this.textService.getFirstLine('THECLOU', 'Umsehen') || 'Umsehen',
                key: 'Umsehen'
            });
        }
        if (actions & CALL_TAXI) {
            this.actionMenuItems.push({
                action: CALL_TAXI,
                text: 'Taxi rufen',
                key: 'Taxi'
            });
        }
        if (actions & INVESTIGATE) {
            this.actionMenuItems.push({
                action: INVESTIGATE,
                text: this.textService.getFirstLine('THECLOU', 'Nachdenken') || 'Nachdenken',
                key: 'Nachdenken'
            });
        }
        
        // Layout action menu at bottom
        // Two rows: Row 1 has first 3 items, Row 2 has remaining items
        const row1Y = 745;
        const row2Y = 790;
        const spacing = 250;
        
        this.actionMenuItems.forEach((item, index) => {
            const isRow1 = index < 3;
            const x = 30 + (index % 3) * spacing;
            const y = isRow1 ? row1Y : row2Y;
            
            const text = this.add.text(x, y, item.text, {
                fontFamily: 'Courier New',
                fontSize: '16px',
                color: '#00ff00'
            });
            
            this.actionTexts.push(text);
        });
        
        // Highlight first action
        this.updateActionSelection();
    }
    
    private updateActionSelection() {
        // Update colors based on selection
        this.actionTexts.forEach((text, index) => {
            if (index === this.selectedActionIndex) {
                text.setColor('#ffffff');
                text.setFontSize('18px');
            } else {
                text.setColor('#00ff00');
                text.setFontSize('16px');
            }
        });
    }
    
    private handleActionSelection() {
        if (this.selectedActionIndex < 0 || this.selectedActionIndex >= this.actionMenuItems.length) {
            return;
        }
        
        const selectedAction = this.actionMenuItems[this.selectedActionIndex];
        console.log(`LocationScene: Selected action ${selectedAction.key}`);
        
        // Handle action
        switch (selectedAction.action) {
            case GO:
                console.log('LocationScene: GO action - switching to NavigationScene');
                this.scene.start('NavigationScene');
                break;
            case BUSINESS_TALK:
                console.log('LocationScene: BUSINESS_TALK action');
                // TODO: Implement talk system
                break;
            case WAIT:
                console.log('LocationScene: WAIT action');
                // TODO: Implement wait/time advance
                break;
            case LOOK:
                console.log('LocationScene: LOOK action');
                // TODO: Implement look system
                break;
            case CALL_TAXI:
                console.log('LocationScene: CALL_TAXI action');
                // TODO: Implement taxi scene
                break;
            case INVESTIGATE:
                console.log('LocationScene: INVESTIGATE action');
                // TODO: Implement investigate system
                break;
        }
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
        
        if (!this.sharedReplay) {
            return;
        }
        
        if (this.isPlaying && this.hasLoaded && this.sharedReplay.isReplayComplete()) {
            this.isPlaying = false;
            this.signalScreenshot('Finished');
            console.log('LocationScene: Replay complete');
        }
        
        if (this.isPlaying && this.hasLoaded && !this.sharedReplay.isReplayComplete()) {
            const action = this.sharedReplay.simulateTick();
            
            if (action !== null) {
                const tick = this.sharedReplay.getSimulationTick();
                const actionStr = this.sharedReplay.actionToString(action);
                console.log(`[Replay] Tick ${tick}: ${actionStr}`);
                
                // Handle replay actions
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
        const INP_LEFT = 1 << 2;
        const INP_RIGHT = 1 << 3;
        const INP_LBUTTONP = 1 << 5;
        const INP_SPACE = 1 << 14;
        
        if (action & INP_UP) {
            // Move selection up (previous row or wrap)
            if (this.selectedActionIndex >= 3) {
                this.selectedActionIndex -= 3;
            }
            this.updateActionSelection();
        }
        
        if (action & INP_DOWN) {
            // Move selection down (next row or wrap)
            if (this.selectedActionIndex < 3 && this.selectedActionIndex + 3 < this.actionMenuItems.length) {
                this.selectedActionIndex += 3;
            }
            this.updateActionSelection();
        }
        
        if (action & INP_LEFT) {
            // Move selection left
            this.selectedActionIndex = Math.max(0, this.selectedActionIndex - 1);
            this.updateActionSelection();
        }
        
        if (action & INP_RIGHT) {
            // Move selection right
            this.selectedActionIndex = Math.min(this.actionMenuItems.length - 1, this.selectedActionIndex + 1);
            this.updateActionSelection();
        }
        
        if (action & (INP_LBUTTONP | INP_SPACE)) {
            // Select current action
            this.handleActionSelection();
        }
    }
}
