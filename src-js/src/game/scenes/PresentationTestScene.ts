/**
 * Test scene for PresentationService
 */

import { Scene } from 'phaser';
import { Database } from '../core/Database';
import { DataLoader } from '../services/DataLoader';
import { PresentationService } from '../services/PresentationService';

export class PresentationTestScene extends Scene {
    private database!: Database;
    private dataLoader!: DataLoader;
    private presentationService!: PresentationService;
    private statusText!: Phaser.GameObjects.Text;
    private presentationContainer: Phaser.GameObjects.Container | null = null;

    constructor() {
        super('PresentationTestScene');
    }

    async create() {
        const style = { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff' };

        this.add.text(10, 10, 'Presentation Test Scene', { fontSize: '24px', color: '#00ff00' });

        this.statusText = this.add.text(10, 50, 'Status: Initializing...', style);

        // Initialize database and data loader
        this.database = new Database();
        this.dataLoader = new DataLoader(this.database);
        this.presentationService = new PresentationService(this, this.database);

        const success = await this.dataLoader.loadAll();
        if (!success) {
            this.statusText.setText('Status: Failed to load data');
            return;
        }

        const stats = this.database.getStats();
        this.statusText.setText(
            `Status: Ready (${stats.totalObjects} objects, ${stats.totalRelations} relations)`
        );

        // Test buttons
        this.add.text(10, 100, 'Show Person (Matt)', {
            backgroundColor: '#004400', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.showPerson());

        this.add.text(200, 100, 'Show Building', {
            backgroundColor: '#000044', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.showBuilding());

        this.add.text(370, 100, 'Show Tool', {
            backgroundColor: '#440044', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.showTool());

        this.add.text(10, 150, 'Show Car', {
            backgroundColor: '#444400', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.showCar());

        this.add.text(10, 200, 'Instructions:', { fontSize: '14px', color: '#ffff00' });
        this.add.text(10, 220, 'Click buttons to display different object types', style);
    }

    private showPerson(): void {
        // Find Matt (player character)
        const persons = this.database.getObjectsByType('Person');
        const matt = persons.find(p => p.name?.toLowerCase().includes('matt'));
        
        if (matt) {
            this.displayObject(matt.id, 'Person: ' + matt.name);
        } else if (persons.length > 0) {
            this.displayObject(persons[0].id, 'Person: ' + persons[0].name);
        } else {
            this.statusText.setText('No persons found');
        }
    }

    private showBuilding(): void {
        const buildings = this.database.getObjectsByType('Building');
        if (buildings.length > 0) {
            this.displayObject(buildings[0].id, 'Building: ' + buildings[0].name);
        } else {
            this.statusText.setText('No buildings found');
        }
    }

    private showTool(): void {
        const tools = this.database.getObjectsByType('Tool');
        if (tools.length > 0) {
            this.displayObject(tools[0].id, 'Tool: ' + tools[0].name);
        } else {
            this.statusText.setText('No tools found');
        }
    }

    private showCar(): void {
        const cars = this.database.getObjectsByType('Car');
        if (cars.length > 0) {
            this.displayObject(cars[0].id, 'Car: ' + cars[0].name);
        } else {
            this.statusText.setText('No cars found');
        }
    }

    private displayObject(objectId: number, title: string): void {
        // Clear previous presentation
        if (this.presentationContainer) {
            this.presentationContainer.destroy();
            this.presentationContainer = null;
        }

        // Get presentation lines
        const lines = this.presentationService.presentObject(objectId);
        
        if (lines.length === 0) {
            this.statusText.setText('Failed to present object');
            return;
        }

        // Add title
        this.add.text(10, 270, title, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#00ffff'
        });

        // Draw presentation
        this.presentationContainer = this.presentationService.drawPresentation(
            lines,
            10,
            300,
            600
        );

        this.statusText.setText(`Displaying: ${title}`);
    }
}
