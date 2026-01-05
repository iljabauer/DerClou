/**
 * Image Service - Port of src/gfx/gfx.c (partial)
 * 
 * Handles loading and managing images/collections.
 * Original game uses IFF ILBM format, which needs conversion for web.
 * 
 * TODO: Convert images offline using:
 * 1. C version with SDL_image (can load ILBM)
 * 2. Python with Pillow (pip install pillow)
 * 3. Online ILBM converter
 * 4. Or implement ILBM decoder in JavaScript
 * 
 * For now, this service expects PNG versions in gamedata/PICTURES_PNG/
 */

export interface Collection {
    id: number;
    filename: string;
    width: number;
    height: number;
    colorStart: number;
    colorEnd: number;
    fromDisk: number;
    image?: HTMLImageElement | null;
    loaded: boolean;
}

export interface Picture {
    id: number;
    collId: number;
    xOffset: number;
    yOffset: number;
    width: number;
    height: number;
    destX: number;
    destY: number;
}

export class ImageService {
    private collections: Map<number, Collection> = new Map();
    private pictures: Map<number, Picture> = new Map();
    private dataPath: string;
    private texturesPath: string;

    constructor(dataPath: string = '../gamedata/TEXTS', texturesPath: string = '../gamedata/PICTURES_PNG') {
        this.dataPath = dataPath;
        this.texturesPath = texturesPath;
    }

    /**
     * Initialize image system and load collection list
     */
    async init(): Promise<boolean> {
        try {
            // Load COLL.LST to get list of collections
            const collPath = `${this.dataPath}/COLL.LST`;
            const response = await fetch(collPath);
            if (!response.ok) {
                console.error(`Failed to load ${collPath}`);
                return false;
            }

            const listContent = await response.text();
            const lines = listContent.trim().split('\n');

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith(';')) {
                    continue;
                }

                // Parse collection entry
                // Format: CollId, Filename, Width, Height, ColorsBegin, ColorsEnd[, fromDisk]
                const parts = trimmed.split(',').map(p => p.trim());
                if (parts.length >= 6) {
                    const coll: Collection = {
                        id: parseInt(parts[0], 10),
                        filename: parts[1],
                        width: parseInt(parts[2], 10),
                        height: parseInt(parts[3], 10),
                        colorStart: parseInt(parts[4], 10),
                        colorEnd: parseInt(parts[5], 10),
                        fromDisk: parts.length > 6 ? parseInt(parts[6], 10) : 0,
                        image: null,
                        loaded: false
                    };
                    this.collections.set(coll.id, coll);
                }
            }

            console.log(`ImageService initialized with ${this.collections.size} collections`);
            return true;
        } catch (error) {
            console.error('Failed to initialize ImageService:', error);
            return false;
        }
    }

    /**
     * Load a specific collection image
     * 
     * NOTE: Original game uses IFF ILBM format. For web, we need either:
     * 1. Convert images offline to PNG/WebP
     * 2. Implement ILBM decoder in JavaScript
     * 
     * For now, this attempts to load PNG versions if they exist.
     */
    async loadCollection(collId: number): Promise<boolean> {
        const coll = this.collections.get(collId);
        if (!coll) {
            console.warn(`Collection ${collId} not found`);
            return false;
        }

        if (coll.loaded) {
            return true;
        }

        try {
            // Load PNG version (images must be converted from ILBM first)
            // Original filename may have extension, remove it
            const baseName = coll.filename.replace(/\.(ani|obj|car|fnt)$/i, '');
            const pngPath = `${this.texturesPath}/${baseName.toUpperCase()}.png`;
            
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    coll.image = img;
                    coll.loaded = true;
                    console.log(`Loaded collection ${collId}: ${coll.filename}`);
                    resolve(true);
                };
                img.onerror = () => {
                    console.warn(`Failed to load ${pngPath} - image needs conversion from ILBM format`);
                    console.warn(`Run image conversion tool to convert gamedata/PICTURES/* to PNG`);
                    resolve(false);
                };
                img.src = pngPath;
            });
        } catch (error) {
            console.error(`Failed to load collection ${collId}:`, error);
            return false;
        }
    }

    /**
     * Unload a collection from memory
     */
    unloadCollection(collId: number): void {
        const coll = this.collections.get(collId);
        if (coll) {
            coll.image = null;
            coll.loaded = false;
        }
    }

    /**
     * Get collection by ID
     */
    getCollection(collId: number): Collection | null {
        return this.collections.get(collId) || null;
    }

    /**
     * Get all collections
     */
    getAllCollections(): Collection[] {
        return Array.from(this.collections.values());
    }

    /**
     * Check if collection is loaded
     */
    isCollectionLoaded(collId: number): boolean {
        const coll = this.collections.get(collId);
        return coll ? coll.loaded : false;
    }

    /**
     * Draw collection to canvas
     */
    drawCollection(
        ctx: CanvasRenderingContext2D,
        collId: number,
        x: number,
        y: number,
        width?: number,
        height?: number
    ): boolean {
        const coll = this.collections.get(collId);
        if (!coll || !coll.loaded || !coll.image) {
            return false;
        }

        const w = width || coll.width;
        const h = height || coll.height;

        ctx.drawImage(coll.image, x, y, w, h);
        return true;
    }

    /**
     * Draw part of collection to canvas
     */
    drawCollectionPart(
        ctx: CanvasRenderingContext2D,
        collId: number,
        srcX: number,
        srcY: number,
        srcWidth: number,
        srcHeight: number,
        destX: number,
        destY: number,
        destWidth?: number,
        destHeight?: number
    ): boolean {
        const coll = this.collections.get(collId);
        if (!coll || !coll.loaded || !coll.image) {
            return false;
        }

        const dw = destWidth || srcWidth;
        const dh = destHeight || srcHeight;

        ctx.drawImage(
            coll.image,
            srcX, srcY, srcWidth, srcHeight,
            destX, destY, dw, dh
        );
        return true;
    }

    /**
     * Get collection statistics
     */
    getStats(): { total: number; loaded: number } {
        let loaded = 0;
        for (const coll of this.collections.values()) {
            if (coll.loaded) loaded++;
        }
        return {
            total: this.collections.size,
            loaded
        };
    }

    /**
     * Cleanup
     */
    done(): void {
        for (const coll of this.collections.values()) {
            this.unloadCollection(coll.id);
        }
        this.collections.clear();
        this.pictures.clear();
    }
}

// Singleton instance
let imageService: ImageService | null = null;

export function initImageService(dataPath?: string, texturesPath?: string): ImageService {
    if (!imageService) {
        imageService = new ImageService(dataPath, texturesPath);
    }
    return imageService;
}

export function getImageService(): ImageService | null {
    return imageService;
}
