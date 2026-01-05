/**
 * Background Service - Manages game backgrounds
 * 
 * Handles displaying location backgrounds and menu backgrounds.
 * Port of ShowMenuBackground() and related functionality.
 */

import { Scene } from 'phaser';
import { ImageService } from './ImageService';

// Background IDs (from src/theclou.h)
export enum BackgroundId {
    CLEAR = 0,
    LONDON = 21,
    PLANUNG = 23,
    EINBRUCH = 23
}

export class BackgroundService {
    private scene: Scene;
    private imageService: ImageService;
    private currentBackground: BackgroundId = BackgroundId.LONDON;
    private backgroundSprite: Phaser.GameObjects.Image | null = null;

    constructor(scene: Scene, imageService: ImageService) {
        this.scene = scene;
        this.imageService = imageService;
    }

    /**
     * Set the current background
     */
    setCurrentBackground(backgroundId: BackgroundId): void {
        this.currentBackground = backgroundId;
    }

    /**
     * Get the current background
     */
    getCurrentBackground(): BackgroundId {
        return this.currentBackground;
    }

    /**
     * Show the menu background (current background)
     */
    showMenuBackground(): void {
        if (this.currentBackground !== BackgroundId.CLEAR) {
            this.showBackground(this.currentBackground);
        } else {
            this.clearBackground();
        }
    }

    /**
     * Show a specific background
     */
    showBackground(backgroundId: BackgroundId): void {
        // Remove existing background
        if (this.backgroundSprite) {
            this.backgroundSprite.destroy();
            this.backgroundSprite = null;
        }

        if (backgroundId === BackgroundId.CLEAR) {
            return;
        }

        // Load and display background image
        const canvas = this.imageService.getImage(backgroundId);
        if (!canvas) {
            console.warn(`Background ${backgroundId} not found`);
            return;
        }

        // Create texture from canvas
        const textureName = `background_${backgroundId}`;
        
        // Check if texture already exists
        if (this.scene.textures.exists(textureName)) {
            this.scene.textures.remove(textureName);
        }

        // Create texture from canvas
        this.scene.textures.addCanvas(textureName, canvas);

        // Create sprite
        this.backgroundSprite = this.scene.add.image(0, 0, textureName);
        this.backgroundSprite.setOrigin(0, 0);
        this.backgroundSprite.setDepth(-1000); // Behind everything else
    }

    /**
     * Clear the background
     */
    clearBackground(): void {
        if (this.backgroundSprite) {
            this.backgroundSprite.destroy();
            this.backgroundSprite = null;
        }
    }

    /**
     * Cleanup
     */
    destroy(): void {
        this.clearBackground();
    }
}
