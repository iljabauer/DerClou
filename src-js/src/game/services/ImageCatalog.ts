/**
 * ImageCatalog - Manages image collections and picture definitions
 * 
 * Ported from src/gfx/ image loading system
 * Loads PICT.LST and COLL.LST to map picture IDs to image files
 */

import { Scene } from 'phaser';
import { ILBMLoader } from './ILBMLoader';

/**
 * Collection definition from COLL.LST
 * Format: CollId, Filename, Width, Height, ColorsBegin, ColorsEnd[, fromDisk]
 */
interface Collection {
    id: number;
    filename: string;
    width: number;
    height: number;
    colorsBegin: number;
    colorsEnd: number;
    fromDisk?: number;
}

/**
 * Picture definition from PICT.LST
 * Format: PictId, CollId, XOffset, YOffset, Width, Height, DestX, DestY
 */
interface Picture {
    id: number;
    collectionId: number;
    xOffset: number;
    yOffset: number;
    width: number;
    height: number;
    destX: number;
    destY: number;
}

export class ImageCatalog {
    private collections: Map<number, Collection> = new Map();
    private pictures: Map<number, Picture> = new Map();
    private loadedCollections: Set<number> = new Set();
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    /**
     * Load and parse COLL.LST
     */
    async loadCollections(): Promise<boolean> {
        try {
            const response = await fetch('TEXTS/COLL.LST');
            if (!response.ok) {
                console.error('Failed to load COLL.LST');
                return false;
            }

            const text = await response.text();
            const lines = text.split(/\r?\n/);

            for (const line of lines) {
                // Skip comments and empty lines
                if (line.startsWith(';') || line.trim() === '') {
                    continue;
                }

                const parts = line.split(',');
                if (parts.length < 6) {
                    continue;
                }

                const collection: Collection = {
                    id: parseInt(parts[0]),
                    filename: parts[1].trim(),
                    width: parseInt(parts[2]),
                    height: parseInt(parts[3]),
                    colorsBegin: parseInt(parts[4]),
                    colorsEnd: parseInt(parts[5]),
                };

                if (parts.length > 6) {
                    collection.fromDisk = parseInt(parts[6]);
                }

                this.collections.set(collection.id, collection);
            }

            console.log(`Loaded ${this.collections.size} collections`);
            return true;
        } catch (error) {
            console.error('Error loading COLL.LST:', error);
            return false;
        }
    }

    /**
     * Load and parse PICT.LST
     */
    async loadPictures(): Promise<boolean> {
        try {
            const response = await fetch('TEXTS/PICT.LST');
            if (!response.ok) {
                console.error('Failed to load PICT.LST');
                return false;
            }

            const text = await response.text();
            const lines = text.split(/\r?\n/);

            for (const line of lines) {
                // Skip comments and empty lines
                if (line.startsWith(';') || line.trim() === '') {
                    continue;
                }

                const parts = line.split(',');
                if (parts.length < 8) {
                    continue;
                }

                const picture: Picture = {
                    id: parseInt(parts[0]),
                    collectionId: parseInt(parts[1]),
                    xOffset: parseInt(parts[2]),
                    yOffset: parseInt(parts[3]),
                    width: parseInt(parts[4]),
                    height: parseInt(parts[5]),
                    destX: parseInt(parts[6]),
                    destY: parseInt(parts[7]),
                };

                // Skip invalid entries (collectionId 0 means no image)
                if (picture.collectionId === 0) {
                    continue;
                }

                this.pictures.set(picture.id, picture);
            }

            console.log(`Loaded ${this.pictures.size} pictures`);
            return true;
        } catch (error) {
            console.error('Error loading PICT.LST:', error);
            return false;
        }
    }

    /**
     * Initialize the catalog by loading both lists
     */
    async initialize(): Promise<boolean> {
        const collectionsOk = await this.loadCollections();
        const picturesOk = await this.loadPictures();
        return collectionsOk && picturesOk;
    }

    /**
     * Get collection info by ID
     */
    getCollection(collectionId: number): Collection | undefined {
        return this.collections.get(collectionId);
    }

    /**
     * Get picture info by ID
     */
    getPicture(pictureId: number): Picture | undefined {
        return this.pictures.get(pictureId);
    }

    /**
     * Load a collection image file
     */
    async loadCollectionImage(collectionId: number): Promise<boolean> {
        if (this.loadedCollections.has(collectionId)) {
            return true; // Already loaded
        }

        const collection = this.collections.get(collectionId);
        if (!collection) {
            console.error(`Collection ${collectionId} not found`);
            return false;
        }

        // Load the ILBM file
        const filename = collection.filename.toUpperCase();
        const url = `PICTURES/${filename}`;
        const textureKey = `coll_${collectionId}`;

        const success = await ILBMLoader.loadAndCreateTexture(this.scene, textureKey, url);
        if (success) {
            this.loadedCollections.add(collectionId);
            console.log(`Loaded collection ${collectionId}: ${filename}`);
        } else {
            console.error(`Failed to load collection ${collectionId}: ${filename}`);
        }

        return success;
    }

    /**
     * Load a picture by ID (loads its collection if needed)
     */
    async loadPicture(pictureId: number): Promise<boolean> {
        const picture = this.pictures.get(pictureId);
        if (!picture) {
            console.error(`Picture ${pictureId} not found`);
            return false;
        }

        // Load the collection if not already loaded
        return await this.loadCollectionImage(picture.collectionId);
    }

    /**
     * Create a texture for a specific picture by extracting it from its collection
     */
    async createPictureTexture(pictureId: number, textureKey?: string): Promise<boolean> {
        const picture = this.pictures.get(pictureId);
        if (!picture) {
            console.error(`Picture ${pictureId} not found`);
            return false;
        }

        // Ensure collection is loaded
        const collectionLoaded = await this.loadCollectionImage(picture.collectionId);
        if (!collectionLoaded) {
            return false;
        }

        const collectionKey = `coll_${picture.collectionId}`;
        const key = textureKey || `pict_${pictureId}`;

        // Check if collection texture exists
        if (!this.scene.textures.exists(collectionKey)) {
            console.error(`Collection texture ${collectionKey} not found`);
            return false;
        }

        // Extract the sub-region from the collection
        try {
            const sourceTexture = this.scene.textures.get(collectionKey);
            const frame = sourceTexture.get(0);

            // Create a new canvas for the extracted region
            const canvas = document.createElement('canvas');
            canvas.width = picture.width;
            canvas.height = picture.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                console.error('Failed to get canvas context');
                return false;
            }

            // Get the source image
            const sourceImage = frame.source.image as HTMLCanvasElement;

            // Draw the sub-region
            ctx.drawImage(
                sourceImage,
                picture.xOffset,
                picture.yOffset,
                picture.width,
                picture.height,
                0,
                0,
                picture.width,
                picture.height
            );

            // Create texture from canvas
            this.scene.textures.addCanvas(key, canvas);
            console.log(`Created picture texture ${pictureId} as ${key}`);
            return true;
        } catch (error) {
            console.error(`Error creating picture texture ${pictureId}:`, error);
            return false;
        }
    }

    /**
     * Get the texture key for a collection
     */
    getCollectionTextureKey(collectionId: number): string {
        return `coll_${collectionId}`;
    }

    /**
     * Get the texture key for a picture
     */
    getPictureTextureKey(pictureId: number): string {
        return `pict_${pictureId}`;
    }

    /**
     * Check if a collection is loaded
     */
    isCollectionLoaded(collectionId: number): boolean {
        return this.loadedCollections.has(collectionId);
    }

    /**
     * Check if a picture texture exists
     */
    isPictureLoaded(pictureId: number): boolean {
        return this.scene.textures.exists(this.getPictureTextureKey(pictureId));
    }
}
