/**
 * Film/Story Service - Port of src/story/story.c and gp.c
 * 
 * Manages story state, scenes, and game progression.
 */

import { Scene, StoryHeader, StoryFileParser } from './StoryFileParser';
import { Database } from '../core/Database';

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

        // TODO: InitLocations() - load location names from LOCATIONS.LST
        // TODO: LinkScenes() - link scene successors
        // TODO: PatchStory() - apply game-specific patches

        this.storyLoaded = true;
        console.log(`Story initialized: ${scenes.length} scenes loaded`);
        return true;
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
