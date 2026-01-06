/**
 * Guard Service - Port of guards.c
 * Handles guard AI, patrol routes, and guard behavior during burglaries
 * 
 * Guards are NPCs that patrol buildings and can detect burglars.
 * They follow pre-planned routes loaded from .gua files.
 */

import { Database } from '../core/Database';
import { PlanningSystemService } from './PlanningSystemService';

// Guard action types
export const GUARDS_DO_SAVE = 1;
export const GUARDS_DO_LOAD = 2;

// Guard file extension
const GUARD_EXTENSION = '.gua';
const GUARD_DIRECTORY = 'DATA';

export class GuardService {
    private guards: Map<number, GuardData> = new Map();

    constructor(
        private db: Database,
        private planningSystem: PlanningSystemService
    ) {}

    /**
     * Initialize guards for a building
     * Port of grdInit() from guards.c
     * 
     * Loads guard patrol routes from .gua file.
     * Returns true if guards were loaded successfully.
     */
    init(buildingId: number, areaId: number): boolean {
        // Get area name for file path
        const areaName = this.getAreaName(areaId);
        if (!areaName) return false;

        // Build file path: DATA/AREANAME.gua
        const fileName = `${GUARD_DIRECTORY}/${areaName}${GUARD_EXTENSION}`;

        // TODO: Load guard data from file
        // For now, stub it out
        console.log(`GuardService: Would load guards from ${fileName}`);

        return false;
    }

    /**
     * Clean up guards
     * Port of grdDone() from guards.c
     */
    done(): void {
        this.guards.clear();
    }

    /**
     * Add guards to person list
     * Port of grdAddToList() from guards.c
     * 
     * Gets all guards for a building and adds them to the list.
     * Returns true if guards were added.
     */
    addToList(buildingId: number, personsList: any[]): boolean {
        // Get all guards for this building
        const guards = this.db.getRelatedObjects(buildingId, 'isGuardedby');
        
        if (guards.length === 0) {
            return false;
        }

        // Add guards to list
        for (const guard of guards) {
            personsList.push(guard);
        }

        return true;
    }

    /**
     * Process guard actions
     * Port of grdDo() from guards.c
     * 
     * Processes guard actions (save/load handlers).
     */
    do(
        system: any,
        personsList: any[],
        burglarsNr: number,
        personsNr: number,
        action: number
    ): void {
        // Process each guard
        for (let i = burglarsNr; i < personsNr; i++) {
            const person = personsList[i];
            if (!person) continue;

            switch (action) {
                case GUARDS_DO_SAVE:
                    // Save guard handler
                    this.planningSystem.saveHandler(person.id);
                    break;
                case GUARDS_DO_LOAD:
                    // Load guard handler
                    this.planningSystem.loadHandler(person.id);
                    break;
            }
        }
    }

    /**
     * Draw guard patrol routes
     * Port of grdDraw() from guards.c
     * 
     * Draws guard patrol routes on the landscape.
     * Returns true if routes were drawn.
     */
    draw(buildingId: number, areaId: number): boolean {
        // TODO: Port full implementation
        // - Load guard handlers
        // - Get patrol routes
        // - Draw routes on landscape
        
        console.log(`GuardService: Would draw guards for building ${buildingId}, area ${areaId}`);
        return false;
    }

    /**
     * Update guard behavior
     * Called each tick during burglary execution.
     * 
     * Updates guard positions, checks for detection, etc.
     */
    update(deltaTime: number): void {
        // TODO: Implement guard AI
        // - Move guards along patrol routes
        // - Check for burglar detection
        // - Handle guard states (patrolling, investigating, chasing)
        
        for (const [guardId, guardData] of this.guards) {
            // Update guard position
            this.updateGuardPosition(guardId, guardData, deltaTime);
            
            // Check for detection
            this.checkDetection(guardId, guardData);
        }
    }

    /**
     * Update guard position along patrol route
     */
    private updateGuardPosition(guardId: number, guardData: GuardData, deltaTime: number): void {
        // TODO: Implement patrol movement
        // - Follow handler actions
        // - Update position based on direction
        // - Handle waypoints
    }

    /**
     * Check if guard detects any burglars
     */
    private checkDetection(guardId: number, guardData: GuardData): void {
        // TODO: Implement detection logic
        // - Check line of sight
        // - Check distance
        // - Factor in lighting
        // - Trigger alarm if detected
    }

    /**
     * Get area name for file path
     */
    private getAreaName(areaId: number): string | null {
        const area = this.db.getObject(areaId);
        if (!area || !area.name) return null;
        
        // Remove last character (area variant)
        const name = area.name;
        return name.substring(0, name.length - 1);
    }

    /**
     * Get guard data
     */
    getGuard(guardId: number): GuardData | undefined {
        return this.guards.get(guardId);
    }

    /**
     * Set guard data
     */
    setGuard(guardId: number, data: GuardData): void {
        this.guards.set(guardId, data);
    }

    /**
     * Get all guards
     */
    getAllGuards(): GuardData[] {
        return Array.from(this.guards.values());
    }

    /**
     * Clear all guards
     */
    clear(): void {
        this.guards.clear();
    }
}

/**
 * Guard data structure
 * Tracks guard state during burglary execution
 */
export interface GuardData {
    id: number;
    name: string;
    handlerId: number;
    xPos: number;
    yPos: number;
    direction: number;
    areaId: number;
    roomsList: any[];
    state: GuardState;
    detectionLevel: number;
}

/**
 * Guard states
 */
export enum GuardState {
    Patrolling = 0,
    Investigating = 1,
    Chasing = 2,
    Alarmed = 3
}
