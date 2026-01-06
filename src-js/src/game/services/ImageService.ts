/**
 * ImageService - Manages game images and graphics
 * 
 * Ported from src/gfx/gfx.c
 * 
 * Uses ImageCatalog to load images from PICT.LST and COLL.LST
 * 
 * Image IDs from theclou.h:
 * - 12: SPEAK_BUBBLE
 * - 13: THINK_BUBBLE
 * - 21: BGD_LONDON (London background)
 */

import { Scene } from 'phaser';
import { ImageCatalog } from './ImageCatalog';

export class ImageService {
    private scene: Scene;
    private catalog: ImageCatalog;
    private imageCache: Map<number, Phaser.GameObjects.Image | Phaser.GameObjects.Graphics> = new Map();
    private initialized: boolean = false;
    
    // Well-known image IDs
    static readonly SPEAK_BUBBLE = 12;
    static readonly THINK_BUBBLE = 13;
    static readonly BGD_LONDON = 21;
    
    constructor(scene: Scene) {
        this.scene = scene;
        this.catalog = new ImageCatalog(scene);
    }
    
    /**
     * Initialize the image catalog
     */
    async initialize(): Promise<boolean> {
        if (this.initialized) {
            return true;
        }
        
        this.initialized = await this.catalog.initialize();
        return this.initialized;
    }
    
    /**
     * Load an image by ID
     * 
     * @param imageId Image ID to load
     * @returns Promise that resolves when image is loaded
     */
    async loadImage(imageId: number): Promise<boolean> {
        if (this.imageCache.has(imageId)) {
            return true;
        }
        
        if (!this.initialized) {
            await this.initialize();
        }
        
        // Load the picture texture
        const success = await this.catalog.createPictureTexture(imageId);
        if (!success) {
            console.warn(`Failed to load image ${imageId}, using placeholder`);
            const picture = this.catalog.getPicture(imageId);
            if (picture) {
                const placeholder = this.createPlaceholder(picture.width, picture.height, imageId);
                this.imageCache.set(imageId, placeholder);
            }
            return false;
        }
        
        return true;
    }
    
    /**
     * Create a placeholder graphic for an image
     */
    private createPlaceholder(width: number, height: number, imageId: number): Phaser.GameObjects.Graphics {
        const graphics = this.scene.add.graphics();
        graphics.setVisible(false);
        
        // Different colors for different types
        let color = 0x404040;
        if (imageId === ImageService.SPEAK_BUBBLE || imageId === ImageService.THINK_BUBBLE) {
            color = 0x2a4a4a;
        } else if (imageId === ImageService.BGD_LONDON) {
            color = 0x0a4a4a;
        }
        
        graphics.fillStyle(color, 1);
        graphics.fillRect(0, 0, width, height);
        graphics.lineStyle(1, 0x00ff00, 1);
        graphics.strokeRect(0, 0, width, height);
        
        return graphics;
    }
    
    /**
     * Show an image at its default position
     * Ported from gfxShow()
     * 
     * @param imageId Image ID to show
     * @param _mode Display mode flags (not fully implemented)
     * @returns The displayed game object
     */
    show(imageId: number, _mode: number = 0): Phaser.GameObjects.GameObject | null {
        const cached = this.imageCache.get(imageId);
        if (cached) {
            const picture = this.catalog.getPicture(imageId);
            if (picture) {
                cached.setPosition(picture.destX, picture.destY);
                cached.setVisible(true);
            }
            return cached;
        }
        
        // Try to create image from texture if not cached
        const textureKey = this.catalog.getPictureTextureKey(imageId);
        if (this.scene.textures.exists(textureKey)) {
            const picture = this.catalog.getPicture(imageId);
            if (picture) {
                const image = this.scene.add.image(picture.destX, picture.destY, textureKey);
                image.setOrigin(0, 0);
                this.imageCache.set(imageId, image);
                return image;
            }
        }
        
        console.warn(`Image ${imageId} not loaded`);
        return null;
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
     * Get picture info from catalog
     */
    getPicture(imageId: number) {
        return this.catalog.getPicture(imageId);
    }
    
    /**
     * Get collection info from catalog
     */
    getCollection(collectionId: number) {
        return this.catalog.getCollection(collectionId);
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
