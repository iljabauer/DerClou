/**
 * Film/Story Service - Port of src/story/story.c
 * 
 * Manages story state, scenes, and game progression.
 * This is a stub implementation - full story system to be implemented later.
 */

export interface Scene {
    eventNr: number;
    locationNr: number;
    sceneId: number;
    flags: number;
}

export interface Film {
    currentLocation: number;  // akt_Ort
    locationNames: string[];  // loc_names
    currentScene: number;
    currentDay: number;
    currentMinute: number;
    scenes: Scene[];
    enabledChoices: number;  // EnabledChoices - bitmask for enabled actions
}

export class FilmService {
    private film: Film;

    constructor() {
        this.film = {
            currentLocation: 0,
            locationNames: [],
            currentScene: 0,
            currentDay: 1,
            currentMinute: 0,
            scenes: [],
            enabledChoices: 0xFFFFFFFF  // All choices enabled by default
        };
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
     */
    getScene(eventNr: number): Scene | undefined {
        return this.film.scenes.find(scene => scene.eventNr === eventNr);
    }

    /**
     * Add scene
     */
    addScene(scene: Scene): void {
        this.film.scenes.push(scene);
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
     * Reset film state
     */
    reset(): void {
        this.film = {
            currentLocation: 0,
            locationNames: [],
            currentScene: 0,
            currentDay: 1,
            currentMinute: 0,
            scenes: []
        };
    }
}

// Singleton instance
export const filmService = new FilmService();
