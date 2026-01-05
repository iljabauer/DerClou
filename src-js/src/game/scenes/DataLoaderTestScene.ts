/**
 * Test scene for data loading
 */

import { Scene } from 'phaser';
import { DataLoader, initDataLoader } from '../services/DataLoader';
import { db } from '../core/Database';
import { ObjectType } from '../types/GameTypes';

export class DataLoaderTestScene extends Scene {
    private dataLoader: DataLoader | null = null;
    private statusText!: Phaser.GameObjects.Text;
    private detailsText!: Phaser.GameObjects.Text;

    constructor() {
        super('DataLoaderTestScene');
    }

    create() {
        const style = { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff' };

        this.add.text(10, 10, 'Data Loader Test Scene', { fontSize: '24px', color: '#00ff00' });

        this.statusText = this.add.text(10, 50, 'Status: Initializing...', style);
        this.detailsText = this.add.text(10, 100, '', { ...style, fontSize: '14px' });

        // Load button
        this.add.text(10, 500, 'Load Data', {
            backgroundColor: '#004400', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.loadData());

        // Show stats button
        this.add.text(150, 500, 'Show Stats', {
            backgroundColor: '#000044', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.showStats());

        this.statusText.setText('Status: Ready. Click "Load Data" to begin.');
    }

    private async loadData() {
        this.statusText.setText('Status: Loading data...');
        this.detailsText.setText('');

        try {
            // Initialize data loader
            this.dataLoader = initDataLoader({
                dataPath: '../gamedata/DATA'
            });

            // Load all data
            const success = await this.dataLoader.loadAll();

            if (success) {
                const stats = this.dataLoader.getStats();
                this.statusText.setText(`Status: Loaded successfully!`);
                this.detailsText.setText(
                    `Objects: ${stats.objects}\n` +
                    `Relations: ${stats.relations}\n\n` +
                    `Click "Show Stats" for details.`
                );
            } else {
                this.statusText.setText('Status: Failed to load data');
                this.detailsText.setText('Check console for errors.');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.statusText.setText('Status: Error loading data');
            this.detailsText.setText(`Error: ${error}`);
        }
    }

    private showStats() {
        if (!this.dataLoader || !this.dataLoader.isLoaded()) {
            this.detailsText.setText('No data loaded yet.');
            return;
        }

        const stats = this.dataLoader.getStats();
        
        // Count objects by type
        const typeCounts: Record<string, number> = {};
        for (const obj of db.getAllObjects()) {
            const typeName = ObjectType[obj.type] || `Unknown(${obj.type})`;
            typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
        }

        let details = `Total Objects: ${stats.objects}\n`;
        details += `Total Relations: ${stats.relations}\n\n`;
        details += `Objects by Type:\n`;
        
        for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
            details += `  ${type}: ${count}\n`;
        }

        // Show some sample objects
        details += `\nSample Objects:\n`;
        const sampleObjects = db.getAllObjects().slice(0, 5);
        for (const obj of sampleObjects) {
            details += `  [${obj.id}] ${obj.name} (${ObjectType[obj.type]})\n`;
        }

        this.detailsText.setText(details);
    }
}
