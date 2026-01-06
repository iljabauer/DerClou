/**
 * LocationScene - Displays a location with action menu
 * 
 * Shows the player at a location with available actions like:
 * - Gehen (Go) - Navigate to other locations
 * - Warten (Wait) - Pass time
 * - Reden (Talk) - Talk to people
 * - Umsehen (Look around) - Examine location
 * - Taxi rufen (Call taxi) - Call a taxi
 * - Nachdenken (Think) - Think/plan
 * 
 * Ported from src/scenes/scenes.c and src/present/present.c
 */

import { Scene } from 'phaser';
import { ReplayService } from '../services/ReplayService';
import { InputHandler } from '../services/InputHandler';
import { TextService } from '../services/TextService';
import { ILBMLoader } from '../services/ILBMLoader';

interface LocationData {
    name: string;
    backgroundImage: string;
    date: string;
    time: string;
}

export class LocationScene extends Scene {
    private replayService: ReplayService;
    private inputHandler: InputHandler;
    private textService: TextService;
    
    private currentLocation: LocationData = {
        name: 'Victoria Station',
        backgroundImage: 'BAHNHOF',
        date: '03.02.1953',
        time: '09:10'
    };
    
    private menuItems: string[] = [];
    private selectedMenuItem: number = 0;
    private showingSubMenu: boolean = false;
    private subMenuItems: string[] = [];
    private selectedSubMenuItem: number = 0;

    constructor() {
        super('LocationScene');
        this.replayService = new ReplayService();
        this.inputHandler = new InputHandler();
        this.inputHandler.setReplayService(this.replayService);
        this.textService = new TextService();
    }

    async create() {
        console.log('LocationScene: create');
        
        // Load location background
        await this.loadLocationBackground();
        
        // Load menu text
        await this.loadMenuText();
        
        // Create UI
        this.createUI();
        
        // Setup input
        this.setupInput();
        
        // Setup replay
        await this.setupReplay();
    }
    
    private async loadLocationBackground() {
        // Load the location background image using ILBM loader
        const bgKey = `location_${this.currentLocation.backgroundImage}`;
        const bgPath = `PICTURES/${this.currentLocation.backgroundImage}`;
        
        const loaded = await ILBMLoader.loadAndCreateTexture(this, bgKey, bgPath);
        
        if (loaded && this.textures.exists(bgKey)) {
            // Display background scaled to fit
            const bg = this.add.image(512, 384, bgKey);
            bg.setDisplaySize(1024, 768);
        } else {
            // Fallback: create placeholder background
            const graphics = this.add.graphics();
            graphics.fillStyle(0x1a4d4d, 1);
            graphics.fillRect(0, 0, 1024, 768);
            
            // Add some visual elements to indicate it's a location
            graphics.fillStyle(0x2a5d5d, 1);
            graphics.fillRect(0, 400, 1024, 368);
        }
    }
    
    private async loadMenuText() {
        // Load menu text from MENU text file
        await this.textService.loadText('MENU');
        
        // Get menu items - use fallback text if not found
        this.menuItems = [
            this.textService.getFirstLine('MENU', 'Gehen') || 'Gehen',
            this.textService.getFirstLine('MENU', 'Warten') || 'Warten',
            this.textService.getFirstLine('MENU', 'Reden') || 'Reden',
            this.textService.getFirstLine('MENU', 'Umsehen') || 'Umsehen',
            this.textService.getFirstLine('MENU', 'Taxi rufen') || 'Taxi rufen',
            this.textService.getFirstLine('MENU', 'Nachdenken') || 'Nachdenken'
        ];
    }
    
    private createUI() {
        // Create dark green background for bottom menu area
        const menuBg = this.add.graphics();
        menuBg.fillStyle(0x0a2a2a, 1);
        menuBg.fillRect(0, 640, 1024, 128);
        
        // Display location name and date
        const locationText = `${this.currentLocation.name} ${this.currentLocation.date}`;
        this.add.text(512, 680, locationText, {
            fontFamily: 'Courier New',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Display time in top right corner
        const timeBg = this.add.graphics();
        timeBg.fillStyle(0xcccccc, 1);
        timeBg.fillRoundedRect(1100, 80, 140, 60, 10);
        
        this.add.text(1170, 110, this.currentLocation.time, {
            fontFamily: 'Courier New',
            fontSize: '32px',
            color: '#000000'
        }).setOrigin(0.5);
        
        // Display menu items
        this.displayMenuItems();
    }
    
    private displayMenuItems() {
        const startX = 30;
        const startY = 720;
        const spacing = 200;
        
        // Clear any existing menu text
        this.children.list
            .filter(child => child.getData('menuItem'))
            .forEach(child => child.destroy());
        
        if (this.showingSubMenu) {
            // Display submenu
            this.displaySubMenu();
        } else {
            // Display main menu in two rows
            const row1Items = this.menuItems.slice(0, 3);
            const row2Items = this.menuItems.slice(3, 6);
            
            row1Items.forEach((item, index) => {
                const color = index === this.selectedMenuItem ? '#00ff00' : '#ffffff';
                const text = this.add.text(startX + index * spacing, startY, item, {
                    fontFamily: 'Courier New',
                    fontSize: '20px',
                    color: color
                });
                text.setData('menuItem', true);
            });
            
            row2Items.forEach((item, index) => {
                const menuIndex = index + 3;
                const color = menuIndex === this.selectedMenuItem ? '#00ff00' : '#ffffff';
                const text = this.add.text(startX + index * spacing, startY + 30, item, {
                    fontFamily: 'Courier New',
                    fontSize: '20px',
                    color: color
                });
                text.setData('menuItem', true);
            });
        }
    }
    
    private displaySubMenu() {
        // Display submenu title
        const title = this.textService.getFirstLine('MENU', 'Wohin?') || 'Wohin?';
        this.add.text(512, 680, title, {
            fontFamily: 'Courier New',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setData('menuItem', true);
        
        // Display submenu items
        const startX = 30;
        const startY = 720;
        const spacing = 200;
        
        this.subMenuItems.forEach((item, index) => {
            const color = index === this.selectedSubMenuItem ? '#00ff00' : '#ffffff';
            const text = this.add.text(startX + index * spacing, startY, item, {
                fontFamily: 'Courier New',
                fontSize: '20px',
                color: color
            });
            text.setData('menuItem', true);
        });
    }
    
    private setupInput() {
        // Handle keyboard input
        this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
            this.handleKeyPress(event.key);
        });
    }
    
    private handleKeyPress(key: string) {
        if (this.showingSubMenu) {
            this.handleSubMenuInput(key);
        } else {
            this.handleMainMenuInput(key);
        }
    }
    
    private handleMainMenuInput(key: string) {
        switch (key) {
            case 'ArrowLeft':
                this.selectedMenuItem = Math.max(0, this.selectedMenuItem - 1);
                this.displayMenuItems();
                break;
            case 'ArrowRight':
                this.selectedMenuItem = Math.min(this.menuItems.length - 1, this.selectedMenuItem + 1);
                this.displayMenuItems();
                break;
            case 'ArrowUp':
                if (this.selectedMenuItem >= 3) {
                    this.selectedMenuItem -= 3;
                    this.displayMenuItems();
                }
                break;
            case 'ArrowDown':
                if (this.selectedMenuItem < 3) {
                    this.selectedMenuItem += 3;
                    this.displayMenuItems();
                }
                break;
            case 'Enter':
            case ' ':
                this.selectMenuItem();
                break;
        }
    }
    
    private handleSubMenuInput(key: string) {
        switch (key) {
            case 'ArrowLeft':
                this.selectedSubMenuItem = Math.max(0, this.selectedSubMenuItem - 1);
                this.displayMenuItems();
                break;
            case 'ArrowRight':
                this.selectedSubMenuItem = Math.min(this.subMenuItems.length - 1, this.selectedSubMenuItem + 1);
                this.displayMenuItems();
                break;
            case 'Enter':
            case ' ':
                this.selectSubMenuItem();
                break;
            case 'Escape':
                // Cancel submenu
                this.showingSubMenu = false;
                this.displayMenuItems();
                break;
        }
    }
    
    private selectMenuItem() {
        const selectedItem = this.menuItems[this.selectedMenuItem];
        console.log(`Selected menu item: ${selectedItem}`);
        
        // Handle menu selection
        if (selectedItem.includes('Gehen') || selectedItem === 'Gehen') {
            // Show location selection submenu
            this.showLocationMenu();
        } else if (selectedItem.includes('Warten') || selectedItem === 'Warten') {
            // Wait - advance time
            this.wait();
        } else if (selectedItem.includes('Reden') || selectedItem === 'Reden') {
            // Talk - show dialog
            console.log('Talk not yet implemented');
        } else if (selectedItem.includes('Umsehen') || selectedItem === 'Umsehen') {
            // Look around - show description
            console.log('Look around not yet implemented');
        } else if (selectedItem.includes('Taxi') || selectedItem === 'Taxi rufen') {
            // Call taxi
            console.log('Call taxi not yet implemented');
        } else if (selectedItem.includes('Nachdenken') || selectedItem === 'Nachdenken') {
            // Think - show planning menu
            console.log('Think not yet implemented');
        }
    }
    
    private showLocationMenu() {
        // Show submenu with available locations
        this.subMenuItems = [
            'Holland Street',
            'Taxi',
            'Postzug'
        ];
        this.selectedSubMenuItem = 0;
        this.showingSubMenu = true;
        this.displayMenuItems();
    }
    
    private selectSubMenuItem() {
        const selectedLocation = this.subMenuItems[this.selectedSubMenuItem];
        console.log(`Going to: ${selectedLocation}`);
        
        // Navigate to selected location
        if (selectedLocation === 'Holland Street') {
            this.goToLocation('Holland Street', 'HOLLAND', '09:30');
        } else if (selectedLocation === 'Taxi') {
            console.log('Taxi not yet implemented');
            this.showingSubMenu = false;
            this.displayMenuItems();
        } else if (selectedLocation === 'Postzug') {
            console.log('Mail train not yet implemented');
            this.showingSubMenu = false;
            this.displayMenuItems();
        }
    }
    
    private goToLocation(name: string, backgroundImage: string, time: string) {
        // Update location
        this.currentLocation.name = name;
        this.currentLocation.backgroundImage = backgroundImage;
        this.currentLocation.time = time;
        
        // Hide submenu
        this.showingSubMenu = false;
        
        // Reload scene
        this.scene.restart();
    }
    
    private wait() {
        // Advance time by 10 minutes
        const [hours, minutes] = this.currentLocation.time.split(':').map(Number);
        const newMinutes = (minutes + 10) % 60;
        const newHours = hours + Math.floor((minutes + 10) / 60);
        this.currentLocation.time = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
        
        // Reload scene
        this.scene.restart();
    }
    
    private async setupReplay() {
        // Check if we have a replay file in URL params
        const urlParams = new URLSearchParams(window.location.search);
        const replayPath = urlParams.get('replay');
        
        if (replayPath) {
            console.log(`Loading replay: ${replayPath}`);
            const replayData = await this.replayService.loadReplay(replayPath);
            
            if (replayData) {
                this.replayService.initPlayback(replayData);
                
                // Expose startReplay function to window for test
                (window as any).startReplay = () => {
                    console.log('Starting replay playback');
                    this.startReplayPlayback();
                };
                
                console.log('Replay loaded, waiting for startReplay() call');
            }
        }
    }
    
    private startReplayPlayback() {
        // Start processing replay inputs
        this.time.addEvent({
            delay: 16, // ~60 FPS
            callback: this.processReplayInput,
            callbackScope: this,
            loop: true
        });
    }
    
    private processReplayInput() {
        // Use InputHandler to simulate tick and get action
        const action = this.inputHandler.simulateTick();
        
        if (action !== null) {
            // Process the action
            // For now, just log it
            console.log(`Replay action: ${action}`);
            
            // Capture screenshot if needed
            if ((window as any).captureEvent) {
                (window as any).captureEvent('frame');
            }
        }
    }
}
