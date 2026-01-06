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
import { TextService } from '../services/TextService';
import { ImageService } from '../services/ImageService';

interface LocationData {
    name: string;
    backgroundImage: string;
    date: string;
    time: string;
}

export class LocationScene extends Scene {
    private replayService!: ReplayService;
    private textService!: TextService;
    private imageService!: ImageService;
    
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
    }

    create() {
        console.log('LocationScene: create');
        
        // Get services
        this.replayService = ReplayService.getInstance(this);
        this.textService = TextService.getInstance(this);
        this.imageService = ImageService.getInstance(this);
        
        // Load location background
        this.loadLocationBackground();
        
        // Load menu text
        this.loadMenuText();
        
        // Create UI
        this.createUI();
        
        // Setup input
        this.setupInput();
        
        // Start replay if available
        this.replayService.startReplay();
    }
    
    private loadLocationBackground() {
        // Load the location background image
        const bgKey = this.imageService.getImageKey(this.currentLocation.backgroundImage);
        
        if (this.textures.exists(bgKey)) {
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
        // Load menu text from MENUD.TXT
        await this.textService.loadText('MENUD.TXT', 'D');
        
        // Get menu items
        this.menuItems = [
            this.textService.getText('Gehen') || 'Gehen',
            this.textService.getText('Warten') || 'Warten',
            this.textService.getText('Reden') || 'Reden',
            this.textService.getText('Umsehen') || 'Umsehen',
            this.textService.getText('Taxi rufen') || 'Taxi rufen',
            this.textService.getText('Nachdenken') || 'Nachdenken'
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
        const title = this.textService.getText('Wohin?') || 'Wohin?';
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
        
        // Capture screenshot for replay
        this.replayService.captureScreenshot();
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
        
        // Capture screenshot for replay
        this.replayService.captureScreenshot();
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
}
