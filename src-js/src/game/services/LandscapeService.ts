/**
 * Landscape Service - Port of landscap/ directory
 * Handles building interior rendering and navigation
 * 
 * This is a stub implementation that provides the interface.
 * Full rendering will be implemented when burglary execution is ported.
 */

import { Database } from '../core/Database';
import { LSArea, LSObject, Building } from '../types/GameTypes';

// Constants from landscap.h
export const LS_MAX_AREA_WIDTH = 640;
export const LS_MAX_AREA_HEIGHT = 256;
export const LS_FLOOR_X_SIZE = 32;
export const LS_FLOOR_Y_SIZE = 32;
export const LS_VISIBLE_X_SIZE = 320;
export const LS_VISIBLE_Y_SIZE = 128;
export const LS_STD_SCROLL_SPEED = 2;

// Collision modes
export const LS_COLL_PLAN = 1;
export const LS_COLL_NORMAL = 2;
export const LS_LEVEL_DESIGNER = 4;

// Object visibility
export const LS_OBJECT_VISIBLE = 1;
export const LS_OBJECT_INVISIBLE = 0;

// Scroll directions
export const LS_SCROLL_LEFT = 1;
export const LS_SCROLL_RIGHT = 2;
export const LS_SCROLL_UP = 4;
export const LS_SCROLL_DOWN = 8;

interface LandscapeState {
    buildingId: number;
    areaId: number;
    windowXPos: number;
    windowYPos: number;
    windowXSize: number;
    windowYSize: number;
    personXPos: number;
    personYPos: number;
    scrollSpeed: number;
    collMode: number;
    activLiving: string;
    darkness: number;
}

export class LandscapeService {
    private db: Database;
    private scene: Phaser.Scene;
    private state: LandscapeState | null = null;

    constructor(db: Database, scene: Phaser.Scene) {
        this.db = db;
        this.scene = scene;
    }

    /**
     * Initialize landscape for a building
     * Port of lsInitLandScape() from init.c
     */
    initLandscape(buildingId: number, mode: number): void {
        console.log(`[LandscapeService] Init landscape for building ${buildingId}, mode ${mode}`);

        const building = this.db.getObject(buildingId) as Building;
        if (!building) {
            console.error('Building not found:', buildingId);
            return;
        }

        // Get start area for this building
        const startAreaId = this.getStartArea(buildingId);
        if (!startAreaId) {
            console.error('No start area found for building:', buildingId);
            return;
        }

        const area = this.db.getObject(startAreaId) as LSArea;
        if (!area) {
            console.error('Area not found:', startAreaId);
            return;
        }

        this.state = {
            buildingId,
            areaId: startAreaId,
            windowXPos: 0,
            windowYPos: 0,
            windowXSize: area.width,
            windowYSize: area.height,
            personXPos: area.startX0,
            personYPos: area.startY0,
            scrollSpeed: LS_STD_SCROLL_SPEED,
            collMode: mode,
            activLiving: '',
            darkness: area.darkness,
        };

        // TODO: Initialize graphics
        // TODO: Load floor data
        // TODO: Load object data
        // TODO: Initialize sprites/bobs
        // TODO: Set up collision detection

        console.log(`[LandscapeService] Landscape initialized for area ${startAreaId}`);
    }

    /**
     * Clean up landscape
     * Port of lsDoneLandScape() from init.c
     */
    doneLandscape(): void {
        console.log('[LandscapeService] Done landscape');

        // TODO: Clean up graphics
        // TODO: Clean up sprites
        // TODO: Clean up collision data

        this.state = null;
    }

    /**
     * Initialize active area
     * Port of lsInitActivArea() from init.c
     */
    initActivArea(areaId: number, x: number = -1, y: number = -1, livingName: string | null = null): void {
        if (!this.state) {
            console.error('Landscape not initialized');
            return;
        }

        const area = this.db.getObject(areaId) as LSArea;
        if (!area) {
            console.error('Area not found:', areaId);
            return;
        }

        this.state.areaId = areaId;
        this.state.windowXSize = area.width;
        this.state.windowYSize = area.height;

        // Use default start position if not specified
        if (x === -1) x = area.startX0;
        if (y === -1) y = area.startY0;

        this.setVisibleWindow(x, y);

        if (livingName) {
            this.state.activLiving = livingName;
        }

        // TODO: Load area-specific data
        // TODO: Set up relations
        // TODO: Load floor squares
        // TODO: Load collections

        console.log(`[LandscapeService] Active area set to ${areaId}`);
    }

    /**
     * Set visible window position
     * Port of lsSetVisibleWindow() from landscap.c
     */
    setVisibleWindow(x: number, y: number): void {
        if (!this.state) return;

        const halfX = LS_VISIBLE_X_SIZE / 2;
        const halfY = LS_VISIBLE_Y_SIZE / 2;

        let wX = x - halfX;
        let wY = y - halfY;

        if (wX < 0) wX = 0;
        if (wY < 0) wY = 0;

        wX = Math.min(wX, LS_MAX_AREA_WIDTH - LS_VISIBLE_X_SIZE - 1);
        wY = Math.min(wY, LS_MAX_AREA_HEIGHT - LS_VISIBLE_Y_SIZE - 1);

        this.state.windowXPos = wX;
        this.state.windowYPos = wY;

        // TODO: Update viewport
        // TODO: Update living visibility
    }

    /**
     * Set active living character
     * Port of lsSetActivLiving() from landscap.c
     */
    setActivLiving(name: string, x: number = -1, y: number = -1): void {
        if (!this.state) return;

        this.state.activLiving = name;

        if (x !== -1 && y !== -1) {
            this.state.personXPos = x;
            this.state.personYPos = y;
            this.setVisibleWindow(x, y);
        }

        // TODO: Update living sprite
        // TODO: Update visibility

        console.log(`[LandscapeService] Active living set to ${name}`);
    }

    /**
     * Set object state
     * Port of lsSetObjectState() from landscap.c
     */
    setObjectState(objId: number, bitNr: number, value: number): void {
        const obj = this.db.getObject(objId) as LSObject;
        if (!obj) {
            console.error('Object not found:', objId);
            return;
        }

        // Modify status bits
        if (value) {
            obj.status |= (1 << bitNr);
        } else {
            obj.status &= ~(1 << bitNr);
        }

        // TODO: Update object display
    }

    /**
     * Get object state
     * Port of lsGetObjectState() from landscap.c
     */
    getObjectState(objId: number): number {
        const obj = this.db.getObject(objId) as LSObject;
        if (!obj) {
            console.error('Object not found:', objId);
            return 0;
        }

        return obj.status;
    }

    /**
     * Set scroll speed
     * Port of lsSetScrollSpeed() from landscap.c
     */
    setScrollSpeed(pixel: number): void {
        if (!this.state) return;
        this.state.scrollSpeed = pixel;
    }

    /**
     * Set collision mode
     * Port of lsSetCollMode() from landscap.c
     */
    setCollMode(collMode: number): void {
        if (!this.state) return;
        this.state.collMode = collMode;
    }

    /**
     * Set darkness level
     * Port of lsSetDarkness() from landscap.c
     */
    setDarkness(value: number): void {
        if (!this.state) return;
        this.state.darkness = value;

        // TODO: Update lighting/darkness rendering
    }

    /**
     * Initialize scroll in a direction
     * Port of lsInitScrollLandScape() from scroll.c
     */
    initScrollLandscape(direction: number, mode: number): boolean {
        if (!this.state) return false;

        // TODO: Implement scrolling
        console.log(`[LandscapeService] Init scroll direction ${direction}, mode ${mode}`);

        return true;
    }

    /**
     * Perform scrolling
     * Port of lsDoScroll() from scroll.c
     */
    doScroll(): void {
        if (!this.state) return;

        // TODO: Implement scrolling animation
    }

    /**
     * Get start area for a building
     * Port of lsGetStartArea() from init.c
     */
    private getStartArea(buildingId: number): number | null {
        // Find first LSArea that belongs to this building
        // Areas are linked to buildings via relations or by convention
        
        // For now, use a simple heuristic: find LSArea with matching base number
        const areas = this.db.getAllObjects().filter(obj => obj.type === 17); // ObjectType.LSArea
        
        for (const area of areas) {
            const lsArea = area as LSArea;
            // Check if this area belongs to the building
            // This is a simplified check - the real game uses more complex logic
            if (lsArea.objectBaseNr) {
                return lsArea.id;
            }
        }

        // Fallback: return first area
        if (areas.length > 0) {
            return areas[0].id;
        }

        return null;
    }

    /**
     * Get current building ID
     */
    getCurrentBuildingId(): number | null {
        return this.state?.buildingId ?? null;
    }

    /**
     * Get current area ID
     */
    getActivAreaId(): number | null {
        return this.state?.areaId ?? null;
    }

    /**
     * Check if landscape is initialized
     */
    isInitialized(): boolean {
        return this.state !== null;
    }
}
