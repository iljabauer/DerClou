
import { Scene } from 'phaser';

declare const nw: any;
declare const process: any;
declare const Buffer: any;

export interface GameScene {
    EventNr: number;
    SceneName: string;
    LocationNr: number;
    Moeglichkeiten: number; // Choices
    std_succ: number[]; // Successors
}

export class StoryService {
    private scenes: GameScene[] = [];
    private sceneMap: Map<number, GameScene> = new Map();
    private locations: string[] = [];
    private startScene: number = 0;
    private hasLoaded: boolean = false;

    async loadStory() {
        if (this.hasLoaded) return;

        if (typeof nw !== 'undefined') {
            await this.loadFromDisk();
        } else {
             // Fetch
        }
    }

    private async loadFromDisk() {
        const fs = nw.require('fs');
        const path = nw.require('path');

        let rootDir = process.cwd();
        if (!fs.existsSync(path.join(rootDir, 'gamedata'))) {
             rootDir = path.join(rootDir, '..');
        }

        // Load Story
        const storyFile = path.join(rootDir, 'gamedata', 'DATA', 'TCStory.pc');
        if (fs.existsSync(storyFile)) {
            const buffer = fs.readFileSync(storyFile);
            this.parseStory(buffer);
        } else {
             console.error(`Story file not found at ${storyFile}`);
        }

        // Load Locations
        const locFile = path.join(rootDir, 'gamedata', 'TEXTS', 'LOCATION.LST');
        if (fs.existsSync(locFile)) {
            const content = fs.readFileSync(locFile, 'latin1'); // Use latin1 for extended chars
            this.locations = content.split(/\r?\n/).filter((l: string) => l.length > 0);
        } else {
             console.error(`Locations file not found at ${locFile}`);
        }

        this.hasLoaded = true;
    }

    private parseStory(buffer: any) {
        let offset = 0;

        // Header
        const storyName = buffer.toString('ascii', offset, offset + 32).replace(/\0/g, '');
        offset += 32;

        const eventCount = buffer.readUInt32BE(offset); offset += 4;
        const sceneCount = buffer.readUInt32BE(offset); offset += 4;
        const amountOfScenes = buffer.readUInt32BE(offset); offset += 4;
        const amountOfEvents = buffer.readUInt32BE(offset); offset += 4;
        const startZeit = buffer.readUInt32BE(offset); offset += 4;
        const startOrt = buffer.readUInt32BE(offset); offset += 4;
        this.startScene = buffer.readUInt32BE(offset); offset += 4;

        console.log(`Loaded Story: ${storyName}, Scenes: ${amountOfScenes}, Start: ${this.startScene}`);

        for (let i = 0; i < amountOfScenes; i++) {
            const scene = this.parseScene(buffer, offset);
            this.scenes.push(scene.scene);
            this.sceneMap.set(scene.scene.EventNr, scene.scene);
            offset = scene.newOffset;
        }
    }

    private parseScene(buffer: any, offset: number): { scene: GameScene, newOffset: number } {
        const eventNr = buffer.readUInt32BE(offset); offset += 4;
        const sceneName = buffer.toString('ascii', offset, offset + 32).replace(/\0/g, ''); offset += 32;

        offset += 4; // Tag
        offset += 4; // MinZeit
        offset += 4; // MaxZeit
        const ort = buffer.readInt32BE(offset); offset += 4;
        const anzahlEvents = buffer.readUInt32BE(offset); offset += 4;
        const anzahlNEvents = buffer.readUInt32BE(offset); offset += 4;
        offset += 8; // tmp
        const anzahlNachfolger = buffer.readUInt32BE(offset); offset += 4;
        offset += 4; // tmp
        const moeglichkeiten = buffer.readUInt32BE(offset); offset += 4;
        offset += 4; // Dauer
        offset += 2; // Anzahl
        offset += 2; // Geschehen
        offset += 1; // Possibility
        offset += 4; // Sample
        offset += 4; // Anim
        const newOrt = buffer.readInt32BE(offset); offset += 4;

        // Skip Lists
        offset += anzahlEvents * 4;
        offset += anzahlNEvents * 4;

        const successors: number[] = [];
        for (let k = 0; k < anzahlNachfolger; k++) {
            successors.push(buffer.readUInt32BE(offset));
            offset += 4;
        }

        const scene: GameScene = {
            EventNr: eventNr,
            SceneName: sceneName,
            LocationNr: newOrt,
            Moeglichkeiten: moeglichkeiten,
            std_succ: successors
        };

        return { scene, newOffset: offset };
    }

    getStartScene(): GameScene | undefined {
        return this.sceneMap.get(this.startScene);
    }

    getScene(eventNr: number): GameScene | undefined {
        return this.sceneMap.get(eventNr);
    }

    getLocationName(locNr: number): string {
        if (locNr >= 0 && locNr < this.locations.length) {
            return this.locations[locNr];
        }
        return `Unknown Location ${locNr}`;
    }
}
