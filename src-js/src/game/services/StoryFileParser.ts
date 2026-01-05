/**
 * Story File Parser - Port of PrepareStory() from src/gameplay/gp.c
 * 
 * Loads scene data from binary story files (TCStory.pc)
 */

import { BinaryReader, loadBinaryFile } from './BinaryReader';

/**
 * Story file header structure
 * Port of struct StoryHeader from gamefunc.h
 */
export interface StoryHeader {
    storyName: string;
    eventCount: number;
    sceneCount: number;
    amountOfScenes: number;
    amountOfEvents: number;
    startZeit: number;
    startOrt: number;
    startSzene: number;
}

/**
 * Scene conditions structure
 * Port of struct Bedingungen from gp.h
 */
export interface SceneConditions {
    ort: number;  // Location that must be fulfilled (-1 = any)
    events: number[];  // Events that must have happened
    nEvents: number[];  // Events that must NOT have happened
}

/**
 * Scene structure
 * Port of struct Scene from gp.h
 */
export interface Scene {
    eventNr: number;
    sceneName: string;
    
    // Conditions
    conditions: SceneConditions | null;
    
    // Standard successors (event numbers)
    stdSucc: number[];
    
    // Scene properties
    moeglichkeiten: number;  // Possibilities bitmask
    dauer: number;  // Duration in minutes
    anzahl: number;  // How many times it can happen
    geschehen: number;  // How many times it has happened
    probability: number;  // Probability 0-255
    locationNr: number;  // Location number (-1 = story scene)
    
    // Additional properties
    sample: number;  // Sound sample number
    anim: number;  // Animation number
}

/**
 * Internal structure for loading scenes from file
 * Port of struct NewScene from gamefunc.h
 */
interface NewScene {
    eventNr: number;
    sceneName: string;
    
    tag: number;
    minZeitPunkt: number;
    maxZeitPunkt: number;
    ort: number;
    
    anzahlderEvents: number;
    anzahlderNEvents: number;
    events: number[];
    nEvents: number[];
    
    anzahlderNachfolger: number;
    nachfolger: number[];
    
    moeglichkeiten: number;
    dauer: number;
    anzahl: number;
    geschehen: number;
    possibility: number;
    
    sample: number;
    anim: number;
    newOrt: number;
}

/**
 * Story file parser
 */
export class StoryFileParser {
    /**
     * Load story file and parse scenes
     * Port of PrepareStory() from gp.c
     */
    static async loadStoryFile(filePath: string): Promise<{
        header: StoryHeader;
        scenes: Scene[];
    } | null> {
        try {
            console.log(`Loading story file: ${filePath}`);
            
            const buffer = await loadBinaryFile(filePath);
            const reader = new BinaryReader(buffer);
            
            // Read story header
            const header = this.readStoryHeader(reader);
            console.log(`Story: ${header.storyName}`);
            console.log(`Scenes: ${header.amountOfScenes}, Events: ${header.amountOfEvents}`);
            console.log(`Start: Day ${header.startZeit}, Location ${header.startOrt}, Scene ${header.startSzene}`);
            
            // Read all scenes
            const scenes: Scene[] = [];
            for (let i = 0; i < header.amountOfScenes; i++) {
                const newScene = this.readNewScene(reader);
                const scene = this.convertNewSceneToScene(newScene);
                scenes.push(scene);
            }
            
            console.log(`Loaded ${scenes.length} scenes from story file`);
            
            return { header, scenes };
        } catch (error) {
            console.error('Failed to load story file:', error);
            return null;
        }
    }
    
    /**
     * Read story header from file
     */
    private static readStoryHeader(reader: BinaryReader): StoryHeader {
        const storyName = reader.readString(20);
        const eventCount = reader.readUint32();
        const sceneCount = reader.readUint32();
        const amountOfScenes = reader.readUint32();
        const amountOfEvents = reader.readUint32();
        const startZeit = reader.readUint32();
        const startOrt = reader.readUint32();
        const startSzene = reader.readUint32();
        
        return {
            storyName,
            eventCount,
            sceneCount,
            amountOfScenes,
            amountOfEvents,
            startZeit,
            startOrt,
            startSzene
        };
    }
    
    /**
     * Read a NewScene structure from file
     * Port of LoadSceneforStory() from gp.c
     */
    private static readNewScene(reader: BinaryReader): NewScene {
        // Read basic scene data
        const eventNr = reader.readUint32();
        const sceneName = reader.readString(20);
        const tag = reader.readInt32();
        const minZeitPunkt = reader.readInt32();
        const maxZeitPunkt = reader.readInt32();
        const ort = reader.readInt32();
        const anzahlderEvents = reader.readUint32();
        const anzahlderNEvents = reader.readUint32();
        
        // Skip two padding uint32s
        reader.readUint32();
        reader.readUint32();
        
        const anzahlderNachfolger = reader.readUint32();
        
        // Skip one padding uint32
        reader.readUint32();
        
        const moeglichkeiten = reader.readUint32();
        const dauer = reader.readUint32();
        const anzahl = reader.readUint16();
        const geschehen = reader.readUint16();
        const possibility = reader.readUint8();
        
        // Skip 3 padding bytes
        reader.readUint8();
        reader.readUint8();
        reader.readUint8();
        
        const sample = reader.readUint32();
        const anim = reader.readUint32();
        const newOrt = reader.readInt32();
        
        // Read event arrays
        const events: number[] = [];
        for (let i = 0; i < anzahlderEvents; i++) {
            events.push(reader.readUint32());
        }
        
        const nEvents: number[] = [];
        for (let i = 0; i < anzahlderNEvents; i++) {
            nEvents.push(reader.readUint32());
        }
        
        const nachfolger: number[] = [];
        for (let i = 0; i < anzahlderNachfolger; i++) {
            nachfolger.push(reader.readUint32());
        }
        
        return {
            eventNr,
            sceneName,
            tag,
            minZeitPunkt,
            maxZeitPunkt,
            ort,
            anzahlderEvents,
            anzahlderNEvents,
            events,
            nEvents,
            anzahlderNachfolger,
            nachfolger,
            moeglichkeiten,
            dauer,
            anzahl,
            geschehen,
            possibility,
            sample,
            anim,
            newOrt
        };
    }
    
    /**
     * Convert NewScene to Scene structure
     * Port of scene initialization from PrepareStory()
     */
    private static convertNewSceneToScene(ns: NewScene): Scene {
        // Initialize conditions if this is a story scene
        let conditions: SceneConditions | null = null;
        if (ns.newOrt === -1 || ns.anzahlderEvents > 0 || ns.anzahlderNEvents > 0) {
            conditions = {
                ort: ns.ort,
                events: ns.events,
                nEvents: ns.nEvents
            };
        }
        
        return {
            eventNr: ns.eventNr,
            sceneName: ns.sceneName,
            conditions,
            stdSucc: ns.nachfolger,
            moeglichkeiten: ns.moeglichkeiten,
            dauer: ns.dauer,
            anzahl: ns.anzahl,
            geschehen: ns.geschehen,
            probability: ns.possibility,
            locationNr: ns.newOrt,
            sample: ns.sample,
            anim: ns.anim
        };
    }
}
