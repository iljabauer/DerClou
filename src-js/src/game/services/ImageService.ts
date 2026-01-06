/**
 * ImageService - Manages game images and graphics
 * 
 * Ported from src/gfx/gfx.c
 * 
 * The original game uses IFF/ILBM format images stored in collection files.
 * For now, this service provides a placeholder system that will be expanded
 * to load actual game graphics.
 * 
 * Image IDs from theclou.h:
 * - 12: SPEAK_BUBBLE
 * - 13: THINK_BUBBLE
 * - 21: BGD_LONDON (London background)
 */

import { Scene } from 'phaser';

export interface ImageInfo {
    id: number;
    collectionId: number;
    xOffset: number;
    yOffset: number;
    width: number;
    height: number;
    destX: number;
    destY: number;
}

export class ImageService {
    private scene: Scene;
    private imageCache: Map<number, Phaser.GameObjects.Image | Phaser.GameObjects.Graphics> = new Map();
    private imageInfo: Map<number, ImageInfo> = new Map();
    
    // Well-known image IDs
    static readonly SPEAK_BUBBLE = 12;
    static readonly THINK_BUBBLE = 13;
    static readonly BGD_LONDON = 21;
    
    constructor(scene: Scene) {
        this.scene = scene;
        this.initializeImageInfo();
    }
    
    /**
     * Initialize image information from PICT.LST
     * For now, hardcode some essential entries
     */
    private initializeImageInfo(): void {
        // From PICT.LST:
        // 12,129,48,54,216,54,104,0  - Speech bubble
        this.imageInfo.set(12, {
            id: 12,
            collectionId: 129,
            xOffset: 48,
            yOffset: 54,
            width: 216,
            height: 54,
            destX: 104,
            destY: 0
        });
        
        // 13,129,48,54,216,54,104,0  - Think bubble
        this.imageInfo.set(13, {
            id: 13,
            collectionId: 129,
            xOffset: 48,
            yOffset: 54,
            width: 216,
            height: 54,
            destX: 104,
            destY: 0
        });
        
        // 21,128,0,60,320,60,0,140  - London background
        this.imageInfo.set(21, {
            id: 21,
            collectionId: 128,
            xOffset: 0,
            yOffset: 60,
            width: 320,
            height: 60,
            destX: 0,
            destY: 140
        });
    }
    
    /**
     * Load an image by ID
     * For now, creates placeholder graphics
     * 
     * @param imageId Image ID to load
     * @returns Promise that resolves when image is loaded
     */
    async loadImage(imageId: number): Promise<boolean> {
        if (this.imageCache.has(imageId)) {
            return true;
        }
        
        const info = this.imageInfo.get(imageId);
        if (!info) {
            console.warn(`No image info for ID ${imageId}`);
            return false;
        }
        
        // For now, create a placeholder graphic
        const placeholder = this.createPlaceholder(info);
        this.imageCache.set(imageId, placeholder);
        
        return true;
    }
    
    /**
     * Create a placeholder graphic for an image
     */
    private createPlaceholder(info: ImageInfo): Phaser.GameObjects.Graphics {
        const graphics = this.scene.add.graphics();
        graphics.setVisible(false);
        
        // Different colors for different types
        let color = 0x404040;
        if (info.id === ImageService.SPEAK_BUBBLE || info.id === ImageService.THINK_BUBBLE) {
            color = 0x2a4a4a;
        } else if (info.id === ImageService.BGD_LONDON) {
            color = 0x0a4a4a;
        }
        
        graphics.fillStyle(color, 1);
        graphics.fillRect(0, 0, info.width, info.height);
        graphics.lineStyle(1, 0x00ff00, 1);
        graphics.strokeRect(0, 0, info.width, info.height);
        
        return graphics;
    }
    
    /**
     * Show an image at its default position
     * Ported from gfxShow()
     * 
     * @param imageId Image ID to show
     * @param mode Display mode flags (not fully implemented)
     * @returns The displayed game object
     */
    show(imageId: number, mode: number = 0): Phaser.GameObjects.GameObject | null {
        const cached = this.imageCache.get(imageId);
        if (!cached) {
            console.warn(`Image ${imageId} not loaded`);
            return null;
        }
        
        const info = this.imageInfo.get(imageId);
        if (!info) {
            return null;
        }
        
        // Position at destination coordinates
        cached.setPosition(info.destX, info.destY);
        cached.setVisible(true);
        
        return cached;
    }
    
    /**
     * Hide an image
     */
    hide(imageId: number): void {
        const cached = this.imageCache.get(imageId);
        if (cached) {
            cached.setVisible(false);
        }
    }
    
    /**
     * Get image info
     */
    getInfo(imageId: number): ImageInfo | undefined {
        return this.imageInfo.get(imageId);
    }
    
    /**
     * Preload essential images
     */
    async preloadEssentials(): Promise<void> {
        await this.loadImage(ImageService.SPEAK_BUBBLE);
        await this.loadImage(ImageService.THINK_BUBBLE);
        await this.loadImage(ImageService.BGD_LONDON);
    }
}
