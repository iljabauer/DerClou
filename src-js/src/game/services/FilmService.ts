/**
 * Film/Story Service - Port of src/story/story.c and gp.c
 * 
 * Manages story state, scenes, and game progression.
 */

import { Scene, StoryHeader, StoryFileParser } from './StoryFileParser';
import { Database } from '../core/Database';
import { 
    SCENE_KASERNE_INSIDE, 
    SCENE_KASERNE_OUTSIDE, 
    SCENE_STATION,
    SCENE_PROFI_26,
    WAIT 
} from '../types/GameConstants';

export interface Film {
    currentLocation: number;  // akt_Ort
    locationNames: string[];  // loc_names
    currentScene: number;
    currentDay: number;
    currentMinute: number;
    scenes: Scene[];
    enabledChoices: number;  // EnabledChoices - bitmask for enabled actions
    startScene: number;  // StartScene
    startOrt: number;  // StartOrt
    startZeit: number;  // StartZeit
}

export class FilmService {
    private film: Film;
    private db: Database;
    private storyLoaded: boolean = false;

    constructor(db: Database) {
        this.db = db;
        this.film = {
            currentLocation: 0,
            locationNames: [],
            currentScene: 0,
            currentDay: 1,
            currentMinute: 543,  // 09:03 (default from C code)
            scenes: [],
            enabledChoices: 0xFFFFFFFF,  // All choices enabled by default
            startScene: 0,
            startOrt: 0,
            startZeit: 1
        };
    }

    /**
     * Initialize story system by loading story file
     * Port of InitStory() from gp.c
     */
    async initStory(storyFilePath: string): Promise<boolean> {
        if (this.storyLoaded) {
            console.log('Story already loaded');
            return true;
        }

        console.log('Initializing story system...');

        // Load story file
        const result = await StoryFileParser.loadStoryFile(storyFilePath);
        if (!result) {
            console.error('Failed to load story file');
            return false;
        }

        const { header, scenes } = result;

        // Initialize film from story header
        this.film.scenes = scenes;
        this.film.startZeit = header.startZeit;
        this.film.startOrt = header.startOrt;
        this.film.startScene = header.startSzene;
        this.film.currentDay = header.startZeit;
        this.film.currentMinute = 543;  // 09:03
        this.film.currentLocation = header.startOrt;

        // Load location names
        await this.initLocations();

        // Apply story patches
        this.patchStory();

        // TODO: LinkScenes() - link scene successors

        this.storyLoaded = true;
        console.log(`Story initialized: ${scenes.length} scenes loaded`);
        return true;
    }

    /**
     * Load location names from LOCATION.LST
     * Port of InitLocations() from gp.c
     */
    private async initLocations(): Promise<void> {
        try {
            const response = await fetch('gamedata/TEXTS/LOCATION.LST');
            if (!response.ok) {
                console.error('Failed to load LOCATION.LST');
                return;
            }

            const text = await response.text();
            const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
            this.film.locationNames = lines;
            console.log(`Loaded ${lines.length} location names`);
        } catch (error) {
            console.error('Error loading location names:', error);
        }
    }

    /**
     * Apply game-specific patches to story scenes
     * Port of PatchStory() from gp.c
     */
    private patchStory(): void {
        // Note: In C code, this only runs if NOT in demo mode (!(GamePlayMode & GP_DEMO))
        // For now, we'll always apply these patches
        
        // Patch scene 26214400 (4th Burglary) - set location to 3 (Hotel room)
        const scene4thBurg = this.getScene(26214400);
        if (scene4thBurg) {
            scene4thBurg.locationNr = 3;
        }

        // Patch scene 26738688 (Arrest) - set location to 7 (Police station)
        const sceneArrest = this.getScene(26738688);
        if (sceneArrest) {
            sceneArrest.locationNr = 7;
        }

        // Patch Kaserne scenes
        const kaserneOutside = this.getScene(SCENE_KASERNE_OUTSIDE);
        if (kaserneOutside) {
            kaserneOutside.moeglichkeiten = 15;  // Possibilities bitmask
            kaserneOutside.locationNr = 66;
            kaserneOutside.dauer = 17;  // Duration
        }

        const kaserneInside = this.getScene(SCENE_KASERNE_INSIDE);
        if (kaserneInside) {
            kaserneInside.moeglichkeiten = 265;  // Possibilities bitmask
            kaserneInside.locationNr = 65;
            kaserneInside.dauer = 57;  // Duration
        }

        // Patch station scene - add WAIT action
        const station = this.getScene(SCENE_STATION);
        if (station) {
            station.moeglichkeiten |= WAIT;
        }

        // TODO: Check for Profidisk and patch SCENE_PROFI_26 if needed
        // if (bProfidisk) GetScene(SCENE_PROFI_26)->LocationNr = 75;

        // Add successors for Kaserne locations
        const locScene65 = this.getLocScene(65);
        if (locScene65) {
            locScene65.stdSucc = [SCENE_KASERNE_OUTSIDE];
        }

        const locScene66 = this.getLocScene(66);
        if (locScene66) {
            locScene66.stdSucc = [SCENE_KASERNE_INSIDE];
        }

        // Set start scene to station
        this.film.startScene = SCENE_STATION;

        console.log('Story patches applied');
    }

    /**
     * Get current location number
     * Port of GetLocation macro
     */
    getLocation(): number {
        return this.film.currentLocation;
    }

    /**
     * Set current location
     */
    setLocation(locationNr: number): void {
        this.film.currentLocation = locationNr;
    }

    /**
     * Get location name by number
     */
    getLocationName(locationNr: number): string | undefined {
        return this.film.locationNames[locationNr];
    }

    /**
     * Add location name
     */
    addLocationName(name: string): void {
        this.film.locationNames.push(name);
    }

    /**
     * Get current scene
     */
    getCurrentScene(): number {
        return this.film.currentScene;
    }

    /**
     * Set current scene
     */
    setCurrentScene(sceneId: number): void {
        this.film.currentScene = sceneId;
    }

    /**
     * Get current day
     */
    getCurrentDay(): number {
        return this.film.currentDay;
    }

    /**
     * Set current day
     */
    setDay(day: number): void {
        this.film.currentDay = day;
    }

    /**
     * Get current minute
     */
    getCurrentMinute(): number {
        return this.film.currentMinute;
    }

    /**
     * Get current minute (alias for C code compatibility)
     */
    getMinute(): number {
        return this.film.currentMinute;
    }

    /**
     * Advance time by minutes
     */
    advanceTime(minutes: number): void {
        this.film.currentMinute += minutes;
        
        while (this.film.currentMinute >= 1440) {  // 24 * 60
            this.film.currentMinute -= 1440;
            this.film.currentDay++;
        }
    }

    /**
     * Add minutes (alias for C code compatibility)
     */
    addMinutes(minutes: number): void {
        this.advanceTime(minutes);
    }

    /**
     * Get scene by event number
     * Port of GetScene() from gp.c
     */
    getScene(eventNr: number): Scene | undefined {
        return this.film.scenes.find(scene => scene.eventNr === eventNr);
    }

    /**
     * Get scene by location number
     * Port of GetLocScene() from gp.c
     */
    getLocScene(locNr: number): Scene | undefined {
        return this.film.scenes.find(scene => scene.locationNr === locNr);
    }

    /**
     * Get current scene object
     * Port of GetCurrentScene() from gp.c
     */
    getCurrentSceneObject(): Scene | undefined {
        return this.getScene(this.film.currentScene);
    }

    /**
     * Add scene
     */
    addScene(scene: Scene): void {
        this.film.scenes.push(scene);
    }

    /**
     * Get all scenes
     */
    getAllScenes(): Scene[] {
        return this.film.scenes;
    }

    /**
     * Get location name by location number
     * Port of GetLocationName() from gp.c
     */
    getLocationName(locNr: number): string {
        if (locNr >= 0 && locNr < this.film.locationNames.length) {
            return this.film.locationNames[locNr];
        }
        return `Location ${locNr}`;
    }

    /**
     * Get all location names
     */
    getLocationNames(): string[] {
        return this.film.locationNames;
    }

    /**
     * Set enabled choices (action menu bitmask)
     * Port of SetEnabledChoices from gp.c
     */
    setEnabledChoices(choiceMask: number): void {
        this.film.enabledChoices = choiceMask;
    }

    /**
     * Get enabled choices
     */
    getEnabledChoices(): number {
        return this.film.enabledChoices;
    }

    /**
     * Get all film data (for debugging)
     */
    getFilmData(): Film {
        return { ...this.film };
    }

    /**
     * Get event count - how many times an event has happened
     * Port of GetEventCount() from gp.c
     */
    getEventCount(eventNr: number): number {
        const scene = this.getScene(eventNr);
        return scene ? scene.geschehen : 0;
    }

    /**
     * Mark that an event has happened
     * Port of EventDidHappen() from gp.c
     */
    eventDidHappen(eventNr: number): void {
        const scene = this.getScene(eventNr);
        if (scene) {
            const CAN_ALWAYS_HAPPEN = 65535;
            if (scene.geschehen < CAN_ALWAYS_HAPPEN) {
                scene.geschehen += 1;
            }
        }
    }

    /**
     * Check if scene conditions are met
     * Port of CheckConditions() from gp.c
     */
    checkConditions(scene: Scene): boolean {
        // Location scenes (locationNr != -1) are always available
        if (scene.locationNr !== -1) {
            return true;
        }

        // Story scenes need to check conditions
        
        // Check if scene has already happened too many times
        const CAN_ALWAYS_HAPPEN = 65535;
        if (scene.anzahl !== CAN_ALWAYS_HAPPEN && scene.geschehen >= scene.anzahl) {
            return false;
        }

        // If no conditions, scene is available
        if (!scene.conditions) {
            return true;
        }

        const conditions = scene.conditions;

        // Check location condition
        if (conditions.ort !== -1) {
            if (this.film.currentLocation !== conditions.ort) {
                return false;
            }
        }

        // Check that forbidden events have NOT happened
        if (conditions.nEvents && conditions.nEvents.length > 0) {
            for (const eventNr of conditions.nEvents) {
                if (this.getEventCount(eventNr) > 0) {
                    return false;
                }
            }
        }

        // Check that required events HAVE happened
        if (conditions.events && conditions.events.length > 0) {
            for (const eventNr of conditions.events) {
                if (this.getEventCount(eventNr) === 0) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Get a story scene that can be triggered
     * Port of GetStoryScene() from gp.c
     * 
     * @param currentScene - Current scene (to exclude from selection)
     * @param randomFunc - Random number generator function (0-255)
     * @returns Story scene that can be triggered, or undefined
     */
    getStoryScene(currentScene: Scene | undefined, randomFunc: () => number): Scene | undefined {
        // Iterate through all scenes
        for (const scene of this.film.scenes) {
            // Only consider story scenes (locationNr === -1)
            if (scene.locationNr === -1) {
                // Don't return the current scene
                if (currentScene && scene.eventNr === currentScene.eventNr) {
                    continue;
                }

                // Check probability
                const randomValue = randomFunc();
                if (randomValue <= scene.probability) {
                    // Check conditions
                    if (this.checkConditions(scene)) {
                        return scene;
                    }
                }
            }
        }

        return undefined;
    }

    /**
     * Initialize film service (for backward compatibility)
     * This is a no-op now - use initStory() to load story file
     */
    initialize(): void {
        console.log('FilmService.initialize() called - use initStory() to load story file');
    }

    /**
     * Reset film state
     */
    reset(): void {
        this.film = {
            currentLocation: 0,
            locationNames: [],
            currentScene: 0,
            currentDay: 1,
            currentMinute: 543,
            scenes: [],
            enabledChoices: 0xFFFFFFFF,
            startScene: 0,
            startOrt: 0,
            startZeit: 1
        };
        this.storyLoaded = false;
    }
}
