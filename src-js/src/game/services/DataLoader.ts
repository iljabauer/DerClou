/**
 * Data loader service - loads game data from .dat and .rel files
 * Populates the database with objects and relations
 */

import { loadBinaryFile } from './BinaryReader';
import { DatFileParser } from './DatFileParser';
import { RelFileParser, loadRelationFile } from './RelFileParser';
import { db } from '../core/Database';

export interface DataLoaderConfig {
    dataPath: string;  // Base path to DATA directory
}

export class DataLoader {
    private config: DataLoaderConfig;
    private loaded: boolean = false;

    constructor(config: DataLoaderConfig) {
        this.config = config;
    }

    /**
     * Load all game data (objects and relations)
     */
    async loadAll(): Promise<boolean> {
        if (this.loaded) {
            console.log('Data already loaded');
            return true;
        }

        console.log('Loading game data...');

        // Load main database
        const mainLoaded = await this.loadDatabase('TCMAIN');
        if (!mainLoaded) {
            console.error('Failed to load TCMAIN database');
            return false;
        }

        // Load building database
        const buildLoaded = await this.loadDatabase('TCBUILD');
        if (!buildLoaded) {
            console.error('Failed to load TCBUILD database');
            return false;
        }

        // Load building-specific data files
        await this.loadBuildingData();

        this.loaded = true;
        console.log(`Loaded ${db.getObjectCount()} objects and ${db.getRelationCount()} relations`);
        return true;
    }

    /**
     * Load building-specific data files (*ETA0.DAT, *ETA1.DAT, etc.)
     */
    private async loadBuildingData(): Promise<void> {
        const buildingPrefixes = [
            'ANTIETA', 'AUNTETA', 'BAKEETA', 'BANKETA', 'BRITETA', 'BUCKETA',
            'BULCETA', 'CHISETA', 'DOWNETA', 'HAMHETA', 'JUWEETA', 'KASEETA',
            'KENWETA', 'MARXETA', 'NATIETA', 'NATUETA', 'OSTEETA', 'SENIETA',
            'SOTHETA', 'TATEETA', 'TOBAETA', 'TOWEETA', 'TRAIETA', 'TRANETA',
            'TUSSETA', 'VICTETA', 'VILLETA', 'WESTETA'
        ];

        console.log('Loading building-specific data files...');
        let loadedCount = 0;

        for (const prefix of buildingPrefixes) {
            // Try loading multiple variants (0, 1, 2, etc.)
            for (let i = 0; i < 5; i++) {
                const name = `${prefix}${i}`;
                const datPath = `${this.config.dataPath}/${name}.DAT`;
                const relPath = `${this.config.dataPath}/${name}.REL`;

                // Check if file exists by trying to load it
                try {
                    const objectsLoaded = await this.loadObjects(datPath);
                    if (objectsLoaded) {
                        loadedCount++;
                        // Try to load relations too
                        await this.loadRelations(relPath);
                    } else {
                        // If variant 0 doesn't exist, skip other variants
                        if (i === 0) break;
                    }
                } catch (error) {
                    // File doesn't exist, stop trying variants for this prefix
                    break;
                }
            }
        }

        console.log(`Loaded ${loadedCount} building-specific data files`);
    }

    /**
     * Load a specific database (objects + relations)
     */
    private async loadDatabase(name: string): Promise<boolean> {
        const datPath = `${this.config.dataPath}/${name}.DAT`;
        const relPath = `${this.config.dataPath}/${name}.REL`;

        // Load objects from .dat file
        const objectsLoaded = await this.loadObjects(datPath);
        if (!objectsLoaded) {
            return false;
        }

        // Load relations from .rel file
        const relationsLoaded = await this.loadRelations(relPath);
        if (!relationsLoaded) {
            console.warn(`Failed to load relations from ${relPath}, continuing...`);
        }

        return true;
    }

    /**
     * Load objects from a .dat file
     */
    private async loadObjects(path: string): Promise<boolean> {
        console.log(`Loading objects from ${path}...`);

        const buffer = await loadBinaryFile(path);
        if (!buffer) {
            console.error(`Failed to load ${path}`);
            return false;
        }

        const parser = new DatFileParser(buffer);
        const objects = parser.parse();

        console.log(`Parsed ${objects.size} objects from ${path}`);

        // Add objects to database
        let addedCount = 0;
        for (const obj of objects.values()) {
            db.addObject(obj);
            addedCount++;
        }

        console.log(`Added ${addedCount} objects to database`);
        return true;
    }

    /**
     * Load relations from a .rel file
     */
    private async loadRelations(path: string): Promise<boolean> {
        console.log(`Loading relations from ${path}...`);

        const text = await loadRelationFile(path);
        if (!text) {
            console.error(`Failed to load ${path}`);
            return false;
        }

        const parser = new RelFileParser(text);
        const relations = parser.parse();

        console.log(`Parsed ${relations.length} relations from ${path}`);

        // Add relations to database
        let addedCount = 0;
        for (const rel of relations) {
            db.addRelation(rel.leftId, rel.rightId, rel.type, rel.parameter);
            addedCount++;
        }

        console.log(`Added ${addedCount} relations to database`);
        return true;
    }

    isLoaded(): boolean {
        return this.loaded;
    }

    /**
     * Get statistics about loaded data
     */
    getStats(): { objects: number; relations: number } {
        return {
            objects: db.getObjectCount(),
            relations: db.getRelationCount(),
        };
    }
}

// Global data loader instance
let dataLoader: DataLoader | null = null;

export function initDataLoader(config: DataLoaderConfig): DataLoader {
    dataLoader = new DataLoader(config);
    return dataLoader;
}

export function getDataLoader(): DataLoader | null {
    return dataLoader;
}
