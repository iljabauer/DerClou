/**
 * Landscape Service - Port of landscap/ directory
 * Handles building interior rendering and navigation
 * 
 * Core functions ported from:
 * - init.c - Initialization and setup
 * - landscap.c - Core rendering and display
 * - scroll.c - Scrolling and viewport management
 * - spot.c - Object spot management (guards)
 */

import { Database } from '../core/Database';
import { LSArea, LSObject, Building, LSRoom } from '../types/GameTypes';
import { ImageService } from './ImageService';
import { LivingService } from './LivingService';

// Constants from landscap.h and landscap_p.h
export const LS_MAX_AREA_WIDTH = 640;
export const LS_MAX_AREA_HEIGHT = 256;
export const LS_FLOOR_X_SIZE = 32;
export const LS_FLOOR_Y_SIZE = 32;
export const LS_VISIBLE_X_SIZE = 320;
export const LS_VISIBLE_Y_SIZE = 128;
export const LS_STD_SCROLL_SPEED = 2;
export const LS_CENTER_X = LS_VISIBLE_X_SIZE / 2;
export const LS_CENTER_Y = LS_VISIBLE_Y_SIZE / 2;

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

// Collision detection
export const LS_NO_COLLISION = 0;
export const LS_COLLISION = 1;

// Floor constants
export const LS_FLOORS_PER_LINE = LS_MAX_AREA_WIDTH / LS_FLOOR_X_SIZE; // 20
export const LS_FLOORS_PER_COLUMN = LS_MAX_AREA_HEIGHT / LS_FLOOR_Y_SIZE; // 8

// Relation offsets
export const REL_CONSIST_OFFSET = 3;
export const REL_HAS_LOCK_OFFSET = 4;
export const REL_HAS_ALARM_OFFSET = 5;
export const REL_HAS_POWER_OFFSET = 6;
export const REL_HAS_LOOT_OFFSET = 7;
export const REL_HAS_ROOM_OFFSET = 10;

// Darkness levels
export const LS_DARKNESS = 255;
export const LS_BRIGHTNESS = 0;
export const LS_DARK_FUNNY = 85;

// Floor square structure
interface LSFloorSquare {
    floorType: number; // Bit 7: object, Bit 6: micro, Bit 5: no floor
}

// Door refresh node
interface LSDoorRefreshNode {
    lso: LSObject;
    xOffset: number;
    yOffset: number;
}

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
    floorsPerWindowColumn: number;
    floorsPerWindowLine: number;
    livingXSpeed: number;
    livingYSpeed: number;
    livingAction: number;
    showObjectMask: number;
    doorXOffset: number;
    doorYOffset: number;
}

// Global relation IDs (set per area)
let consistOfRelationID = 0;
let hasLockRelationID = 0;
let hasAlarmRelationID = 0;
let hasPowerRelationID = 0;
let hasLootRelationID = 0;
let hasRoomRelationID = 0;

export class LandscapeService {
    private db: Database;
    private scene: Phaser.Scene;
    private imageService: ImageService;
    private livingService: LivingService | null = null;
    private state: LandscapeState | null = null;
    
    // Floor data for all areas (up to 3 floors)
    private allFloors: (LSFloorSquare[] | null)[] = [null, null, null];
    private floorAreaIds: number[] = [0, 0, 0];
    private currFloor: LSFloorSquare[] | null = null;
    
    // Object retrieval lists (for rendering order)
    private objectRetrievalLists: (LSObject[] | null)[] = [null, null, null];
    private objectRetrievalAreaIds: number[] = [0, 0, 0];
    private objectRetrieval: LSObject[] | null = null;
    
    // Door refresh list
    private doorRefreshList: LSDoorRefreshNode[] = [];
    
    // Phaser graphics objects
    private floorLayer: Phaser.GameObjects.Container | null = null;
    private objectLayer: Phaser.GameObjects.Container | null = null;
    private characterLayer: Phaser.GameObjects.Container | null = null;

    constructor(db: Database, scene: Phaser.Scene, imageService: ImageService) {
        this.db = db;
        this.scene = scene;
        this.imageService = imageService;
    }
    
    /**
     * Set living service for character management
     */
    setLivingService(livingService: LivingService): void {
        this.livingService = livingService;
    }

    /**
     * Initialize landscape for a building
     * Port of lsInitLandScape() from init.c
     * 
     * Initializes the landscape module for a building:
     * - Sets up graphics layers
     * - Loads floor data
     * - Loads object data
     * - Initializes collision detection
     * - Sets up initial area
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
            floorsPerWindowColumn: LS_FLOORS_PER_COLUMN,
            floorsPerWindowLine: LS_FLOORS_PER_LINE,
            livingXSpeed: 0,
            livingYSpeed: 0,
            livingAction: 0,
            showObjectMask: 0,
            doorXOffset: 0,
            doorYOffset: 32,
        };

        // Initialize graphics layers
        this.initGraphics();
        
        // Initialize objects for all areas in building
        this.initObjects();
        
        // Initialize floor squares
        this.initFloorSquares();
        
        // Initialize active area
        this.initActivArea(startAreaId, -1, -1, null);

        console.log(`[LandscapeService] Landscape initialized for area ${startAreaId}`);
    }

    /**
     * Initialize graphics layers
     * Port of lsInitGfx() from hardware.c
     */
    private initGraphics(): void {
        // Create Phaser containers for different layers
        this.floorLayer = this.scene.add.container(0, 0);
        this.objectLayer = this.scene.add.container(0, 0);
        this.characterLayer = this.scene.add.container(0, 0);
        
        // Set layer depths
        this.floorLayer.setDepth(0);
        this.objectLayer.setDepth(1);
        this.characterLayer.setDepth(2);
        
        console.log('[LandscapeService] Graphics layers initialized');
    }
    
    /**
     * Initialize objects for all areas in building
     * Port of lsInitObjects() from init.c
     */
    private initObjects(): void {
        if (!this.state) return;
        
        // Get all areas in this building
        const areas = this.getAreasOfBuilding(this.state.buildingId);
        
        // Initialize object retrieval lists
        for (let i = 0; i < 3; i++) {
            this.objectRetrievalAreaIds[i] = 0;
            this.objectRetrievalLists[i] = null;
        }
        
        // Process each area
        let areaCount = 0;
        for (const area of areas) {
            if (areaCount >= 3) break; // Max 3 areas
            
            // Initialize relations for this area
            this.initRelations(area.id);
            
            // Set relations
            this.setRelations(area.id);
            
            // Refresh object list
            this.refreshObjectList(area.id);
            
            // Store object retrieval list
            this.objectRetrievalLists[areaCount] = this.objectRetrieval;
            this.objectRetrievalAreaIds[areaCount] = area.id;
            
            areaCount++;
        }
        
        console.log(`[LandscapeService] Initialized ${areaCount} areas`);
    }
    
    /**
     * Initialize relations for an area
     * Port of lsInitRelations() from init.c
     */
    private initRelations(areaId: number): void {
        const area = this.db.getObject(areaId) as LSArea;
        if (!area) return;
        
        // Relations are based on objectBaseNr + offset
        // These are used to link objects to locks, alarms, loot, etc.
        // In the TypeScript version, we don't need to explicitly add relations
        // as they're already loaded from .REL files
    }
    
    /**
     * Set relation IDs for an area
     * Port of lsSetRelations() from init.c
     */
    private setRelations(areaId: number): void {
        const area = this.db.getObject(areaId) as LSArea;
        if (!area) return;
        
        // Set global relation IDs for this area
        consistOfRelationID = area.objectBaseNr + REL_CONSIST_OFFSET;
        hasLockRelationID = area.objectBaseNr + REL_HAS_LOCK_OFFSET;
        hasAlarmRelationID = area.objectBaseNr + REL_HAS_ALARM_OFFSET;
        hasPowerRelationID = area.objectBaseNr + REL_HAS_POWER_OFFSET;
        hasLootRelationID = area.objectBaseNr + REL_HAS_LOOT_OFFSET;
        hasRoomRelationID = area.objectBaseNr + REL_HAS_ROOM_OFFSET;
    }
    
    /**
     * Initialize floor squares for all areas
     * Port of lsInitFloorSquares() from init.c
     */
    private initFloorSquares(): void {
        if (!this.state) return;
        
        const areas = this.getAreasOfBuilding(this.state.buildingId);
        const count = LS_FLOORS_PER_LINE * LS_FLOORS_PER_COLUMN;
        
        // Initialize floor data for each area
        let i = 0;
        for (const area of areas) {
            if (i >= 3) break; // Max 3 areas
            
            // Allocate floor squares
            this.allFloors[i] = new Array(count);
            for (let j = 0; j < count; j++) {
                this.allFloors[i]![j] = { floorType: 0 };
            }
            
            this.floorAreaIds[i] = area.id;
            
            // TODO: Load floor data from .lfd file
            // For now, initialize with default floor type
            
            i++;
        }
        
        console.log(`[LandscapeService] Initialized floor squares for ${i} areas`);
    }
    
    /**
     * Clean up landscape
     * Port of lsDoneLandScape() from init.c
     */
    doneLandscape(): void {
        console.log('[LandscapeService] Done landscape');

        // Clean up graphics layers
        if (this.floorLayer) {
            this.floorLayer.destroy();
            this.floorLayer = null;
        }
        if (this.objectLayer) {
            this.objectLayer.destroy();
            this.objectLayer = null;
        }
        if (this.characterLayer) {
            this.characterLayer.destroy();
            this.characterLayer = null;
        }
        
        // Clean up floor data
        this.allFloors = [null, null, null];
        this.floorAreaIds = [0, 0, 0];
        this.currFloor = null;
        
        // Clean up object lists
        this.objectRetrievalLists = [null, null, null];
        this.objectRetrievalAreaIds = [0, 0, 0];
        this.objectRetrieval = null;
        
        // Clean up door refresh list
        this.doorRefreshList = [];

        this.state = null;
    }

    /**
     * Initialize active area
     * Port of lsInitActivArea() from init.c
     * 
     * Sets up a specific area for display:
     * - Sets window size
     * - Sets visible window position
     * - Loads floor squares
     * - Sets relations
     * - Builds scroll window (renders the area)
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

        // Set relations for this area
        this.setRelations(areaId);
        
        // Set object retrieval list for this area
        this.setObjectRetrievalList(areaId);
        
        // Set visible window
        this.setVisibleWindow(x, y);

        if (livingName) {
            this.state.activLiving = livingName;
        }
        
        // Set current floor squares
        this.setCurrFloorSquares(areaId);
        
        // TODO: Copy collision data to XMS (not needed in Phaser)
        
        // Build scroll window (render the area)
        this.buildScrollWindow();

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
     * Get all areas of a building
     * Helper method to get LSArea objects that belong to a building
     */
    private getAreasOfBuilding(buildingId: number): LSArea[] {
        // Get all areas that consist of this building
        const relations = this.db.getRelations(buildingId);
        const areaIds: number[] = [];
        
        // Find areas via "consistsOf" relation
        for (const rel of relations) {
            if (rel.type === 'consistsOf') {
                const obj = this.db.getObject(rel.targetId);
                if (obj && obj.type === 17) { // ObjectType.LSArea
                    areaIds.push(rel.targetId);
                }
            }
        }
        
        // Get area objects
        const areas: LSArea[] = [];
        for (const areaId of areaIds) {
            const area = this.db.getObject(areaId) as LSArea;
            if (area) {
                areas.push(area);
            }
        }
        
        return areas;
    }
    
    /**
     * Get start area for a building
     * Port of lsGetStartArea() from init.c
     */
    private getStartArea(buildingId: number): number | null {
        const areas = this.getAreasOfBuilding(buildingId);
        
        // Return first area
        if (areas.length > 0) {
            return areas[0].id;
        }

        return null;
    }
    
    /**
     * Refresh object list for an area
     * Port of lsRefreshObjectList() from landscap.c
     * 
     * Creates a sorted list of objects for rendering
     */
    private refreshObjectList(areaId: number): void {
        const area = this.db.getObject(areaId) as LSArea;
        if (!area) return;
        
        // Get all LSObjects in this area
        const objects: LSObject[] = [];
        
        // Find objects via relations
        const relations = this.db.getRelations(areaId);
        for (const rel of relations) {
            if (rel.type === 'consistsOf') {
                const obj = this.db.getObject(rel.targetId);
                if (obj && obj.type === 16) { // ObjectType.LSObject
                    objects.push(obj as LSObject);
                }
            }
        }
        
        // Sort objects by rendering order (walls first, then other objects)
        objects.sort((a, b) => {
            // Walls have lower offsetFact
            if (a.offsetFact !== b.offsetFact) {
                return a.offsetFact - b.offsetFact;
            }
            // Then sort by Y position (top to bottom)
            return a.yPos - b.yPos;
        });
        
        this.objectRetrieval = objects;
    }
    
    /**
     * Set object retrieval list for an area
     * Port of lsSetObjectRetrievalList() from landscap.c
     */
    private setObjectRetrievalList(areaId: number): void {
        // Find the object retrieval list for this area
        for (let i = 0; i < 3; i++) {
            if (this.objectRetrievalAreaIds[i] === areaId) {
                this.objectRetrieval = this.objectRetrievalLists[i];
                return;
            }
        }
        
        // If not found, create new list
        this.refreshObjectList(areaId);
    }
    
    /**
     * Set current floor squares for an area
     * Port of lsSetCurrFloorSquares() from init.c
     */
    private setCurrFloorSquares(areaId: number): void {
        // Find the floor squares for this area
        for (let i = 0; i < 3; i++) {
            if (this.floorAreaIds[i] === areaId) {
                this.currFloor = this.allFloors[i];
                return;
            }
        }
    }
    
    /**
     * Build scroll window (render the area)
     * Port of lsBuildScrollWindow() from landscap.c
     * 
     * Renders the entire area:
     * - Draws floor tiles
     * - Draws walls
     * - Draws other objects
     * - Sets up collision detection
     */
    private buildScrollWindow(): void {
        if (!this.state || !this.currFloor || !this.objectRetrieval) return;
        
        console.log('[LandscapeService] Building scroll window...');
        
        // Clear existing graphics
        if (this.floorLayer) {
            this.floorLayer.removeAll(true);
        }
        if (this.objectLayer) {
            this.objectLayer.removeAll(true);
        }
        
        // Render floor tiles
        this.renderFloor();
        
        // Render objects (walls first)
        this.renderObjects();
        
        console.log('[LandscapeService] Scroll window built');
    }
    
    /**
     * Render floor tiles
     */
    private renderFloor(): void {
        if (!this.currFloor || !this.floorLayer) return;
        
        // Render each floor tile
        for (let i = 0; i < LS_FLOORS_PER_COLUMN; i++) {
            for (let j = 0; j < LS_FLOORS_PER_LINE; j++) {
                const floorIndex = i * LS_FLOORS_PER_LINE + j;
                const floor = this.currFloor[floorIndex];
                
                // Check if floor exists (bit 5 not set)
                const noFloor = (floor.floorType & (1 << 5)) !== 0;
                
                if (noFloor) {
                    // Draw collision color (black)
                    const rect = this.scene.add.rectangle(
                        j * LS_FLOOR_X_SIZE,
                        i * LS_FLOOR_Y_SIZE,
                        LS_FLOOR_X_SIZE,
                        LS_FLOOR_Y_SIZE,
                        0x000000
                    );
                    rect.setOrigin(0, 0);
                    this.floorLayer.add(rect);
                } else {
                    // Draw floor tile
                    this.blitFloor(floorIndex, j * LS_FLOOR_X_SIZE, i * LS_FLOOR_Y_SIZE);
                }
            }
        }
    }
    
    /**
     * Blit a floor tile
     * Port of lsBlitFloor() from landscap.c
     */
    private blitFloor(floorIndex: number, destX: number, destY: number): void {
        if (!this.floorLayer || !this.currFloor) return;
        
        const floor = this.currFloor[floorIndex];
        const floorType = floor.floorType & 0x1F; // Lower 5 bits
        
        // TODO: Load floor tile image and draw it
        // For now, draw a placeholder
        const rect = this.scene.add.rectangle(
            destX,
            destY,
            LS_FLOOR_X_SIZE,
            LS_FLOOR_Y_SIZE,
            0x808080
        );
        rect.setOrigin(0, 0);
        this.floorLayer.add(rect);
    }
    
    /**
     * Render objects
     */
    private renderObjects(): void {
        if (!this.objectRetrieval || !this.objectLayer) return;
        
        // Render walls first
        for (const obj of this.objectRetrieval) {
            if (this.isObjectAWall(obj)) {
                this.showOneObject(obj);
            }
        }
        
        // Then render other objects
        for (const obj of this.objectRetrieval) {
            if (!this.isObjectAWall(obj)) {
                this.showOneObject(obj);
            }
        }
    }
    
    /**
     * Show one object
     * Port of lsShowOneObject() from landscap.c
     */
    private showOneObject(lso: LSObject): void {
        if (!this.objectLayer) return;
        
        // Check visibility
        if (lso.visible === LS_OBJECT_INVISIBLE) {
            return;
        }
        
        // TODO: Load object image and draw it
        // For now, draw a placeholder rectangle
        const rect = this.scene.add.rectangle(
            lso.xPos,
            lso.yPos,
            16,
            16,
            0xFF0000
        );
        rect.setOrigin(0, 0);
        this.objectLayer.add(rect);
    }
    
    /**
     * Check if object is a wall
     * Port of lsIsObjectAWall() from landscap.c
     */
    private isObjectAWall(lso: LSObject): boolean {
        // Walls typically have offsetFact < 32
        return lso.offsetFact < 32;
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
    
    /**
     * Get rooms of an area
     * Port of lsGetRoomsOfArea() from landscap.c
     */
    getRoomsOfArea(areaId: number): LSRoom[] {
        const rooms: LSRoom[] = [];
        
        // Find rooms via relations
        const relations = this.db.getRelations(areaId);
        for (const rel of relations) {
            if (rel.type === 'hasRoom') {
                const obj = this.db.getObject(rel.targetId);
                if (obj && obj.type === 15) { // ObjectType.LSRoom
                    rooms.push(obj as LSRoom);
                }
            }
        }
        
        return rooms;
    }
    
    /**
     * Get objects by list (within a rectangle)
     * Port of lsGetObjectsByList() from landscap.c
     */
    getObjectsByList(
        x: number,
        y: number,
        width: number,
        height: number,
        showInvisible: boolean = false,
        addLootBags: boolean = false
    ): LSObject[] {
        if (!this.objectRetrieval) return [];
        
        const objects: LSObject[] = [];
        
        for (const obj of this.objectRetrieval) {
            // Check visibility
            if (!showInvisible && obj.visible === LS_OBJECT_INVISIBLE) {
                continue;
            }
            
            // Check if object is within rectangle
            if (
                obj.xPos >= x &&
                obj.xPos < x + width &&
                obj.yPos >= y &&
                obj.yPos < y + height
            ) {
                objects.push(obj);
            }
        }
        
        // TODO: Add loot bags if requested
        
        return objects;
    }
    
    /**
     * Check if there's a collision at a position
     * Port of lsIsCollision() from landscap.c
     */
    isCollision(x: number, y: number, direction: number): boolean {
        // TODO: Implement collision detection
        // For now, return false (no collision)
        return false;
    }
    
    /**
     * Get floor index at position
     * Port of lsGetFloorIndex() from landscap.c
     */
    getFloorIndex(x: number, y: number): number {
        const floorX = Math.floor(x / LS_FLOOR_X_SIZE);
        const floorY = Math.floor(y / LS_FLOOR_Y_SIZE);
        
        return floorY * LS_FLOORS_PER_LINE + floorX;
    }
    
    /**
     * Get loudness at position
     * Port of lsGetLoudness() from landscap.c
     */
    getLoudness(x: number, y: number): number {
        // TODO: Implement loudness calculation based on floor type
        // For now, return default value
        return 0;
    }
    
    /**
     * Check if object is a door
     * Port of lsIsObjectADoor() from landscap.c
     */
    isObjectADoor(lso: LSObject): boolean {
        // Doors typically have specific offset ranges
        return lso.offsetFact >= 32 && lso.offsetFact < 48;
    }
    
    /**
     * Check if object is a standard object
     * Port of lsIsObjectAStdObj() from landscap.c
     */
    isObjectAStdObj(lso: LSObject): boolean {
        return lso.offsetFact >= 48;
    }
    
    /**
     * Check if object is an addon
     * Port of lsIsObjectAnAddOn() from landscap.c
     */
    isObjectAnAddOn(lso: LSObject): boolean {
        // Addons are objects that attach to walls
        return lso.offsetFact >= 16 && lso.offsetFact < 32;
    }
    
    /**
     * Check if object is special
     * Port of lsIsObjectSpecial() from landscap.c
     */
    isObjectSpecial(lso: LSObject): boolean {
        // Special objects (statues, etc.)
        return false; // TODO: Implement
    }
    
    /**
     * Check if LSObject is in active area
     * Port of lsIsLSObjectInActivArea() from landscap.c
     */
    isLSObjectInActivArea(lso: LSObject): boolean {
        if (!this.objectRetrieval) return false;
        
        return this.objectRetrieval.includes(lso);
    }
    
    /**
     * Get object count in active area
     * Port of lsGetObjectCount() from landscap.c
     */
    getObjectCount(): number {
        return this.objectRetrieval?.length ?? 0;
    }
    
    /**
     * Get current object retrieval
     * Port of lsGetCurrObjectRetrieval() from landscap.c
     */
    getCurrObjectRetrieval(): number {
        // Returns the first object ID in the retrieval list
        if (!this.objectRetrieval || this.objectRetrieval.length === 0) {
            return 0;
        }
        
        return this.objectRetrieval[0].id;
    }
    
    /**
     * Turn object (change state)
     * Port of lsTurnObject() from landscap.c
     */
    turnObject(lso: LSObject, status: number, collis: number): void {
        // Update object status
        lso.visible = status;
        
        // TODO: Update collision detection
        // TODO: Update object display
    }
    
    /**
     * Fast refresh object
     * Port of lsFastRefresh() from landscap.c
     */
    fastRefresh(lso: LSObject): void {
        // TODO: Implement fast refresh
        // This is used to update object display without full redraw
    }
    
    /**
     * Do door refresh
     * Port of lsDoDoorRefresh() from landscap.c
     */
    doDoorRefresh(lso: LSObject): void {
        // TODO: Implement door refresh
        // This is used to update door state (open/closed)
    }
    
    /**
     * Calculate exact size of object
     * Port of lsCalcExactSize() from landscap.c
     */
    calcExactSize(lso: LSObject): { x0: number; y0: number; x1: number; y1: number } {
        // TODO: Implement exact size calculation
        // For now, return object position and default size
        return {
            x0: lso.xPos,
            y0: lso.yPos,
            x1: lso.xPos + 16,
            y1: lso.yPos + 16,
        };
    }
    
    /**
     * Walk through window
     * Port of lsWalkThroughWindow() from landscap.c
     */
    walkThroughWindow(
        lso: LSObject,
        livXPos: number,
        livYPos: number
    ): { xPos: number; yPos: number } {
        // TODO: Implement window walking logic
        // For now, return same position
        return { xPos: livXPos, yPos: livYPos };
    }
    
    /**
     * Get guy inside spot
     * Port of lsGuyInsideSpot() from landscap.c
     */
    guyInsideSpot(): { xPos: number; yPos: number; areaId: number } | null {
        if (!this.state) return null;
        
        // TODO: Implement spot detection
        // For now, return current position
        return {
            xPos: this.state.personXPos,
            yPos: this.state.personYPos,
            areaId: this.state.areaId,
        };
    }
}
