/**
 * Landscape Test Scene
 * Tests the landscape rendering system
 */

import Phaser from 'phaser';
import { db } from '../core/Database';
import { DataLoader } from '../services/DataLoader';
import { ImageService } from '../services/ImageService';
import { LandscapeService, LS_COLL_PLAN } from '../services/LandscapeService';
import { LivingService } from '../services/LivingService';
import { Building } from '../types/GameTypes';

export class LandscapeTestScene extends Phaser.Scene {
    private dataLoader!: DataLoader;
    private imageService!: ImageService;
    private landscapeService!: LandscapeService;
    private livingService!: LivingService;
    private statusText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'LandscapeTestScene' });
    }

    create(): void {
        console.log('[LandscapeTestScene] Starting landscape test...');

        // Initialize services
        this.dataLoader = new DataLoader({ dataPath: 'gamedata/DATA' });
        this.imageService = new ImageService();
        this.landscapeService = new LandscapeService(db, this, this.imageService);
        this.livingService = new LivingService(this, this.imageService);
        
        // Link services
        this.landscapeService.setLivingService(this.livingService);

        // Create status text
        this.statusText = this.add.text(10, 10, 'Loading...', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
        });
        this.statusText.setDepth(1000);

        // Load data and test
        this.loadAndTest();
    }

    private async loadAndTest(): Promise<void> {
        try {
            // Load all data
            this.updateStatus('Loading game data...');
            await this.dataLoader.loadAll();

            // Initialize image service
            this.updateStatus('Loading image collections...');
            await this.imageService.init();

            // Find a building to test with
            const buildings = db.getAllObjects().filter(obj => obj.type === 3); // ObjectType.Building
            if (buildings.length === 0) {
                this.updateStatus('ERROR: No buildings found!');
                return;
            }

            const building = buildings[0] as Building;
            this.updateStatus(`Testing with building: ${building.name} (ID: ${building.id})`);

            // Initialize landscape
            this.updateStatus('Initializing landscape...');
            this.landscapeService.initLandscape(building.id, LS_COLL_PLAN);

            // Check if landscape is initialized
            if (!this.landscapeService.isInitialized()) {
                this.updateStatus('ERROR: Landscape initialization failed!');
                return;
            }

            const areaId = this.landscapeService.getActivAreaId();
            this.updateStatus(`Landscape initialized! Active area: ${areaId}`);

            // Display landscape info
            this.displayLandscapeInfo();

            // Set up keyboard controls
            this.setupControls();

        } catch (error) {
            console.error('[LandscapeTestScene] Error:', error);
            this.updateStatus(`ERROR: ${error}`);
        }
    }

    private displayLandscapeInfo(): void {
        const areaId = this.landscapeService.getActivAreaId();
        const buildingId = this.landscapeService.getCurrentBuildingId();
        const objectCount = this.landscapeService.getObjectCount();

        let info = `Landscape Test\n`;
        info += `Building ID: ${buildingId}\n`;
        info += `Area ID: ${areaId}\n`;
        info += `Object Count: ${objectCount}\n`;
        info += `\n`;
        info += `Controls:\n`;
        info += `Arrow Keys: Scroll\n`;
        info += `R: Reload\n`;
        info += `ESC: Exit\n`;

        this.updateStatus(info);
    }

    private setupControls(): void {
        // Arrow keys for scrolling
        this.input.keyboard?.on('keydown-LEFT', () => {
            console.log('[LandscapeTestScene] Scroll left');
            // TODO: Implement scrolling
        });

        this.input.keyboard?.on('keydown-RIGHT', () => {
            console.log('[LandscapeTestScene] Scroll right');
            // TODO: Implement scrolling
        });

        this.input.keyboard?.on('keydown-UP', () => {
            console.log('[LandscapeTestScene] Scroll up');
            // TODO: Implement scrolling
        });

        this.input.keyboard?.on('keydown-DOWN', () => {
            console.log('[LandscapeTestScene] Scroll down');
            // TODO: Implement scrolling
        });

        // R to reload
        this.input.keyboard?.on('keydown-R', () => {
            console.log('[LandscapeTestScene] Reloading...');
            this.scene.restart();
        });

        // ESC to exit
        this.input.keyboard?.on('keydown-ESC', () => {
            console.log('[LandscapeTestScene] Exiting...');
            this.landscapeService.doneLandscape();
            this.scene.start('MainMenuScene');
        });
    }

    private updateStatus(text: string): void {
        console.log(`[LandscapeTestScene] ${text}`);
        this.statusText.setText(text);
    }

    shutdown(): void {
        // Clean up
        if (this.landscapeService) {
            this.landscapeService.doneLandscape();
        }
    }
}
