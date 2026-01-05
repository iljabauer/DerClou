/**
 * Test scene for ILBM image loading
 */

import { Scene } from 'phaser';
import { decodeILBM, ilbmToRGBA } from '../services/ILBMDecoder';

export class ImageTestScene extends Scene {
    private statusText!: Phaser.GameObjects.Text;
    private testImages: string[] = ['BUBBLE', 'ACTION', 'BIRTHDAY'];
    private currentImageIndex: number = 0;
    private currentTexture: Phaser.Textures.Texture | null = null;

    constructor() {
        super('ImageTestScene');
    }

    create() {
        const style = { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff' };

        this.add.text(10, 10, 'ILBM Image Test Scene', { fontSize: '24px', color: '#00ff00' });

        this.statusText = this.add.text(10, 50, 'Status: Ready', style);

        // Test buttons
        this.add.text(10, 100, 'Load BUBBLE', {
            backgroundColor: '#004400', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.loadImage('BUBBLE'));

        this.add.text(150, 100, 'Load ACTION', {
            backgroundColor: '#000044', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.loadImage('ACTION'));

        this.add.text(290, 100, 'Load BIRTHDAY', {
            backgroundColor: '#440044', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.loadImage('BIRTHDAY'));

        this.add.text(10, 150, 'Instructions:', { fontSize: '14px', color: '#ffff00' });
        this.add.text(10, 170, 'Click buttons to load and display ILBM images', style);
    }

    private async loadImage(filename: string): Promise<void> {
        this.statusText.setText(`Loading ${filename}...`);

        try {
            // Load file from gamedata/PICTURES/
            const path = `gamedata/PICTURES/${filename}`;
            const response = await fetch(path);
            
            if (!response.ok) {
                throw new Error(`Failed to load ${filename}: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);

            // Decode ILBM
            const ilbm = decodeILBM(buffer);
            if (!ilbm) {
                throw new Error('Failed to decode ILBM');
            }

            this.statusText.setText(
                `Loaded ${filename}: ${ilbm.width}x${ilbm.height}, ${ilbm.palette.length / 3} colors`
            );

            // Convert to RGBA
            const rgba = ilbmToRGBA(ilbm);

            // Create Phaser texture
            const textureName = `ilbm_${filename}`;
            
            // Remove old texture if exists
            if (this.textures.exists(textureName)) {
                this.textures.remove(textureName);
            }

            // Create texture from RGBA data
            const texture = this.textures.createCanvas(textureName, ilbm.width, ilbm.height);
            if (texture) {
                const canvas = texture.getSourceImage() as HTMLCanvasElement;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const imageData = ctx.createImageData(ilbm.width, ilbm.height);
                    imageData.data.set(rgba);
                    ctx.putImageData(imageData, 0, 0);
                    texture.refresh();

                    // Display image
                    this.displayImage(textureName, ilbm.width, ilbm.height);
                }
            }

        } catch (error) {
            console.error('Error loading image:', error);
            this.statusText.setText(`Error: ${error}`);
        }
    }

    private displayImage(textureName: string, width: number, height: number): void {
        // Clear previous image
        this.children.list
            .filter(child => child.getData('isTestImage'))
            .forEach(child => child.destroy());

        // Display new image
        const x = 10;
        const y = 220;
        const maxWidth = 1000;
        const maxHeight = 500;

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
