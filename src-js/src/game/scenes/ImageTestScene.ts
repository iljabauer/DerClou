/**
 * Test scene for ILBM image loading via ImageService
 */

import { Scene } from 'phaser';
import { ImageService } from '../services/ImageService';

export class ImageTestScene extends Scene {
    private statusText!: Phaser.GameObjects.Text;
    private imageService!: ImageService;

    constructor() {
        super('ImageTestScene');
    }

    async create() {
        const style = { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff' };

        this.add.text(10, 10, 'ILBM Image Test Scene', { fontSize: '24px', color: '#00ff00' });

        this.statusText = this.add.text(10, 50, 'Status: Initializing...', style);

        // Initialize ImageService
        this.imageService = new ImageService();
        const success = await this.imageService.init();
        
        if (!success) {
            this.statusText.setText('Status: Failed to initialize ImageService');
            return;
        }

        const stats = this.imageService.getStats();
        this.statusText.setText(`Status: Ready (${stats.total} collections available)`);

        // Test buttons - use collection IDs from COLL.LST
        this.add.text(10, 100, 'Load Collection 1', {
            backgroundColor: '#004400', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.loadCollection(1));

        this.add.text(180, 100, 'Load Collection 2', {
            backgroundColor: '#000044', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.loadCollection(2));

        this.add.text(350, 100, 'Load Collection 3', {
            backgroundColor: '#440044', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.loadCollection(3));

        this.add.text(10, 150, 'Show All Collections', {
            backgroundColor: '#444400', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.showAllCollections());

        this.add.text(10, 200, 'Instructions:', { fontSize: '14px', color: '#ffff00' });
        this.add.text(10, 220, 'Click buttons to load and display ILBM images via ImageService', style);
    }

    private async loadCollection(collId: number): Promise<void> {
        this.statusText.setText(`Loading collection ${collId}...`);

        try {
            const coll = this.imageService.getCollection(collId);
            if (!coll) {
                this.statusText.setText(`Collection ${collId} not found`);
                return;
            }

            const success = await this.imageService.loadCollection(collId);
            if (!success) {
                this.statusText.setText(`Failed to load collection ${collId}`);
                return;
            }

            this.statusText.setText(
                `Loaded collection ${collId}: ${coll.filename} (${coll.width}x${coll.height})`
            );

            // Display image
            if (coll.image) {
                this.displayCanvas(coll.image, coll.width, coll.height, coll.filename);
            }

        } catch (error) {
            console.error('Error loading collection:', error);
            this.statusText.setText(`Error: ${error}`);
        }
    }

    private showAllCollections(): void {
        const collections = this.imageService.getAllCollections();
        console.log('All collections:');
        collections.slice(0, 20).forEach(coll => {
            console.log(`  ${coll.id}: ${coll.filename} (${coll.width}x${coll.height}) - ${coll.loaded ? 'loaded' : 'not loaded'}`);
        });
        this.statusText.setText(`Listed ${Math.min(collections.length, 20)} collections in console`);
    }

    private displayCanvas(canvas: HTMLCanvasElement, width: number, height: number, name: string): void {
        // Clear previous image
        this.children.list
            .filter(child => child.getData('isTestImage'))
            .forEach(child => child.destroy());

        // Create Phaser texture from canvas
        const textureName = `coll_${name}`;
        
        // Remove old texture if exists
        if (this.textures.exists(textureName)) {
            this.textures.remove(textureName);
        }

        // Create texture from canvas
        const texture = this.textures.addCanvas(textureName, canvas);
        if (!texture) {
            console.error('Failed to create texture from canvas');
            return;
        }

        // Display new image
        const x = 10;
        const y = 270;
        const maxWidth = 1000;
        const maxHeight = 450;

        let scale = 1;
        if (width > maxWidth || height > maxHeight) {
            scale = Math.min(maxWidth / width, maxHeight / height);
        }

        const image = this.add.image(x, y, textureName)
            .setOrigin(0, 0)
            .setScale(scale);
        
        image.setData('isTestImage', true);

        this.statusText.setText(
            this.statusText.text + ` | Displayed at ${Math.round(scale * 100)}% scale`
        );
    }
}
