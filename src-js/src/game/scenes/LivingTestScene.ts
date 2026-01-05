/**
 * Test scene for LivingService
 */

import { Scene } from 'phaser';
import { LivingService, AnimAction, LivingStatus } from '../services/LivingService';
import { ImageService } from '../services/ImageService';
import { BackgroundService, BackgroundId } from '../services/BackgroundService';

export class LivingTestScene extends Scene {
    private livingService!: LivingService;
    private imageService!: ImageService;
    private backgroundService!: BackgroundService;
    private statusText!: Phaser.GameObjects.Text;

    constructor() {
        super('LivingTestScene');
    }

    async create() {
        const style = { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff' };

        this.add.text(10, 10, 'Living System Test Scene', { fontSize: '24px', color: '#00ff00' });

        this.statusText = this.add.text(10, 50, 'Status: Initializing...', style);

        // Initialize services
        this.imageService = new ImageService();
        await this.imageService.init();
        
        this.backgroundService = new BackgroundService(this, this.imageService);
        this.livingService = new LivingService(this, this.imageService);

        // Initialize living system
        await this.livingService.init(
            0,      // visLScapeX
            0,      // visLScapeY
            1024,   // visLScapeWidth
            768,    // visLScapeHeight
            1024,   // totalLScapeWidth
            768,    // totalLScapeHeight
            8,      // frameCount
            1       // startArea
        );

        this.statusText.setText('Status: Living system initialized');

        // Test buttons
        this.add.text(10, 100, 'Show Character', {
            backgroundColor: '#004400', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.showCharacter());

        this.add.text(200, 100, 'Move Character', {
            backgroundColor: '#000044', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.moveCharacter());

        this.add.text(400, 100, 'Hide All', {
            backgroundColor: '#440044', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.hideAll());

        this.add.text(10, 150, 'Show London BG', {
            backgroundColor: '#444400', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.showLondonBackground());

        this.add.text(200, 150, 'Clear BG', {
            backgroundColor: '#440000', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.clearBackground());

        this.add.text(10, 200, 'Instructions:', { fontSize: '14px', color: '#ffff00' });
        this.add.text(10, 220, 'Click buttons to test living system functionality', style);
        this.add.text(10, 240, 'Characters are placeholder rectangles for now', style);
    }

    private showCharacter(): void {
        // Set character in active area (use Person_1 from LIVINGS.LST)
        this.livingService.livesInArea('Person_1', 1);
        
        // Position character
        this.livingService.setPos('Person_1', 400, 300);
        
        // Enable character
        this.livingService.turn('Person_1', LivingStatus.ENABLED);
        
        // Refresh display
        this.livingService.refreshAll();
        
        this.statusText.setText('Status: Character shown at (400, 300)');
    }

    private moveCharacter(): void {
        // Animate character moving right
        this.livingService.animate('Person_1', AnimAction.MOVE_RIGHT, 2, 0);
        
        // Do animation with movement
        this.livingService.doAnims(true, true);
        
        const x = this.livingService.getXPos('Person_1');
        const y = this.livingService.getYPos('Person_1');
        
        this.statusText.setText(`Status: Character moving, pos: (${x}, ${y})`);
    }

    private hideAll(): void {
        this.livingService.setAllInvisible();
        this.statusText.setText('Status: All characters hidden');
    }

    private showLondonBackground(): void {
        this.backgroundService.setCurrentBackground(BackgroundId.LONDON);
        this.backgroundService.showMenuBackground();
        this.statusText.setText('Status: London background shown');
    }

    private clearBackground(): void {
        this.backgroundService.clearBackground();
        this.statusText.setText('Status: Background cleared');
    }

    update() {
        // Continuously update animations
        this.livingService.doAnims(true, true);
    }
}
