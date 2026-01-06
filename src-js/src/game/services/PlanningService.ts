/**
 * Planning Service - Port of planing/ directory
 * Handles burglary planning and execution
 * 
 * Main interface for the planning system.
 * Uses PlanningSystemService for core functionality.
 */

import { Database } from '../core/Database';
import { UIService } from './UIService';
import { TextService } from './TextService';
import { LandscapeService, LS_SCROLL_LEFT, LS_SCROLL_RIGHT, LS_SCROLL_UP, LS_SCROLL_DOWN } from './LandscapeService';
import { 
    PlanningSystemService, 
    ACTION_GO, 
    ACTION_WAIT, 
    ACTION_SIGNAL, 
    ACTION_WAIT_SIGNAL, 
    ACTION_USE, 
    ACTION_TAKE, 
    ACTION_DROP, 
    ACTION_OPEN, 
    ACTION_CLOSE, 
    ACTION_CONTROL 
} from './PlanningSystemService';
import { PlanningSupportService } from './PlanningSupportService';
import { LivingService } from './LivingService';
import { Building } from '../types/GameTypes';
import { LS_COLL_PLAN } from './LandscapeService';

// Planning modes
export const PLANING_INIT_PERSONSLIST = 1;
export const PLANING_HANDLER_ADD = 2;
export const PLANING_HANDLER_OPEN = 4;
export const PLANING_GUARDS_LOAD = 8;
export const PLANING_HANDLER_SET = 16;
export const PLANING_HANDLER_CLEAR = 32;

export const PLANING_GFX_LANDSCAPE = 1;
export const PLANING_GFX_SPRITES = 2;
export const PLANING_GFX_BACKGROUND = 4;

// Planning menu IDs
export const PLANING_START = 0;
export const PLANING_NOTE = 1;
export const PLANING_SAVE = 2;
export const PLANING_LOAD = 3;
export const PLANING_CLEAR = 4;
export const PLANING_LOOK = 5;
export const PLANING_RETURN = 6;

// Player menu IDs
export const PLANING_PLAYER_PERSON_CHANGE = 0;
export const PLANING_PLAYER_RADIO_ALL = 1;
export const PLANING_PLAYER_RADIO_ONE = 2;
export const PLANING_PLAYER_ESCAPE = 3;

// Action types
export const PLANING_PERSON_WALK = 0;
export const PLANING_ACTION_USE = 1;
export const PLANING_ACTION_OPEN = 2;
export const PLANING_ACTION_CLOSE = 3;
export const PLANING_ACTION_TAKE = 4;
export const PLANING_ACTION_DROP = 5;
export const PLANING_ACTION_WAIT = 6;
export const PLANING_ACTION_RADIO = 7;
export const PLANING_PERSON_CHANGE = 8;
export const PLANING_ACTION_RETURN = 9;

// Notebook menu IDs
export const PLANING_NOTE_TARGET = 0;
export const PLANING_NOTE_TEAM = 1;
export const PLANING_NOTE_CAR = 2;
export const PLANING_NOTE_TOOLS = 3;
export const PLANING_NOTE_LOOTS = 4;

// Look menu IDs
export const PLANING_LOOK_PLAN = 0;
export const PLANING_LOOK_PERSON_CHANGE = 1;
export const PLANING_LOOK_RETURN = 2;

// Burglary result codes
export const BURGLARY_SUCCESS = 1;
export const BURGLARY_FAILED = 0;
export const BURGLARY_ARRESTED = -1;

// Constants
export const PLANING_NR_PERSONS = 4;
export const PLANING_NR_GUARDS = 4;
export const PLANING_NR_LOOTS = 256;
export const PLANING_CORRECT_TIME = 3;

// Burglary execution constants
export const PLANING_EXHAUST_MAX = 240;
export const PLANING_MOOD_MIN = 40;
export const PLANING_LOUDNESS_STD = 5;
export const PLANING_LOUDNESS_RADIO = 25;
export const PLANING_LOUDNESS_OPEN_CLOSE = 14;

// Pseudo actions
export const ACTION_EXHAUST = 1000;

// Escape bits (FAHN_*)
export const FAHN_ALARM = 1 << 0;
export const FAHN_QUIET_ALARM = 1 << 1;
export const FAHN_SURROUNDED = 1 << 2;
export const FAHN_ESCAPE = 1 << 3;
export const FAHN_ALARM_TIMECLOCK = 1 << 4;
export const FAHN_ALARM_LOUDN = 1 << 5;
export const FAHN_ALARM_PATRO = 1 << 6;
export const FAHN_ALARM_TIMER = 1 << 7;
export const FAHN_ALARM_GUARD = 1 << 8;
export const FAHN_ALARM_MICRO = 1 << 9;
export const FAHN_ALARM_RADIO = 1 << 10;
export const FAHN_ALARM_ALARM = 1 << 11;

// Burglary result codes
export const BURGLARY_SUCCESS = 0;
export const BURGLARY_FAILURE = 1;
export const BURGLARY_ESCAPE = 2;
export const BURGLARY_SURROUNDED = 3;

/**
 * Search structure - tracks burglary execution state
 * Port of struct Search from evidence.h
 */
interface SearchData {
    guyXPos: number[];  // [4] - Last position in case of escape
    guyYPos: number[];  // [4]
    
    exhaust: number[];  // [4] - Exhaustion level
    
    walkTime: number[];  // [4] - Time spent walking
    waitTime: number[];  // [4] - Time spent waiting
    workTime: number[];  // [4] - Time spent working
    killTime: number[];  // [4] - Time spent fighting guards
    
    deriTime: number;  // Deviation from plan
    
    timeOfBurglary: number;  // Time when burglary started
    timeOfAlarm: number;  // Time when alarm triggered
    
    buildingId: number;  // Building being burgled
    lastAreaId: number;  // Area at time of escape
    
    escapeBits: number;  // Escape/alarm flags
    
    callValue: number;  // Value of radio calls
    callCount: number;  // Number of radio calls
    
    warningCount: number;  // Number of warnings
    spotTouchCount: number[];  // [4] - Times touched patrol spots
    
    kaserneOk: boolean;  // Whether Kaserne was successful
}

/**
 * Player data structure - tracks execution state
 * Port of PD structure from player.c
 */
interface PlayerData {
    action: any | null;  // Current action being executed
    
    handlerEnded: number[];  // [4] - Handler completion status
    guardKO: number[];  // [4] - Guard knockout status
    currLoudness: number[];  // [4] - Current loudness per person
    unableToWork: number[];  // [4] - Unable to work flags
    
    maxTimer: number;  // Maximum timer value
    timer: number;  // Current timer
    realTime: number;  // Real time (timer / PLANING_CORRECT_TIME)
    
    ende: boolean;  // Execution ended
    badPlaning: boolean;  // Bad planning detected
    mood: number;  // Team mood
    patrolCount: number;  // Patrol encounter count
    
    bldId: number;  // Building ID
    bldObj: Building | null;  // Building object
    
    changeCount: number;  // Object change count
    totalCount: number;  // Total object count
    
    alarmTimer: number;  // Alarm timer
    
    actionTime: number;  // Action trigger time
    actionFunc: ((objId: number, time: number) => boolean) | null;  // Action function
    
    isItDark: boolean;  // Is it dark?
    sndState: boolean;  // Sound state
}

interface PlanningState {
    buildingId: number;
    team: number[];  // Person IDs
    tools: number[];  // Tool IDs
    car: number | null;  // Car ID
    personNames: string[];  // Names of team members
    guardNames: string[];  // Names of guards
    currentPerson: number;  // Current person index
    planChanged: boolean;  // Has plan been modified?
}

export class PlanningService {
    private db: Database;
    private scene: Phaser.Scene;
    private ui: UIService;
    private text: TextService;
    private landscape: LandscapeService;
    private living: LivingService;
    private planningSystem: PlanningSystemService;
    private support: PlanningSupportService;
    private state: PlanningState | null = null;
    
    // Planning state
    private currentPerson: number = 0;
    private planChanged: boolean = false;
    private animCounter: number = 0;
    
    // Burglary execution state
    private search: SearchData | null = null;
    private playerData: PlayerData | null = null;

    constructor(
        db: Database,
        scene: Phaser.Scene,
        ui: UIService,
        text: TextService,
        landscape: LandscapeService,
        living: LivingService
    ) {
        this.db = db;
        this.scene = scene;
        this.ui = ui;
        this.text = text;
        this.landscape = landscape;
        this.living = living;
        this.planningSystem = new PlanningSystemService(db);
        this.support = new PlanningSupportService(db, landscape, living);
    }

    /**
     * Prepare system for planning
     * Port of plPrepareSys() from prepare.c
     */
    private prepareSys(buildingId: number, mode: number): void {
        if (mode & PLANING_INIT_PERSONSLIST) {
            // Initialize persons list
            // TODO: Get team members from organisation
        }

        if (mode & PLANING_HANDLER_ADD) {
            // Add handlers for team members
            if (this.state) {
                for (const personId of this.state.team) {
                    this.system.initHandler(personId);
                }
            }
        }

        if (mode & PLANING_HANDLER_CLEAR) {
            // Clear all handlers
            if (this.state) {
                for (const personId of this.state.team) {
                    this.system.clearHandler(personId);
                }
            }
        }

        if (mode & PLANING_HANDLER_SET) {
            // Set first handler as active
            if (this.state && this.state.team.length > 0) {
                this.system.setActivHandler(this.state.team[0]);
                this.state.currentPerson = 0;
            }
        }

        if (mode & PLANING_GUARDS_LOAD) {
            // Load guard data
            // TODO: Load guard patrol routes
        }
    }

    /**
     * Prepare graphics for planning
     * Port of plPrepareGfx() from prepare.c
     */
    private prepareGfx(buildingId: number, collMode: number, gfxMode: number): void {
        if (gfxMode & PLANING_GFX_LANDSCAPE) {
            // Initialize landscape
            this.landscape.initLandscape(buildingId, collMode);
        }

        if (gfxMode & PLANING_GFX_SPRITES) {
            // Initialize sprites for team members
            // TODO: Set up character sprites
        }

        if (gfxMode & PLANING_GFX_BACKGROUND) {
            // Initialize background
            // TODO: Set up background graphics
        }
    }

    /**
     * Unprepare system
     * Port of plUnprepareSys() from prepare.c
     */
    private unprepareSys(): void {
        this.system.closeSystem();
    }

    /**
     * Unprepare graphics
     * Port of plUnprepareGfx() from prepare.c
     */
    private unprepareGfx(): void {
        this.landscape.doneLandscape();
    }

    /**
     * Display timer
     * Port of plDisplayTimer() from planer.c
     */
    private displayTimer(mode: number, refresh: number): void {
        const maxTimer = this.system.getMaxTimer();
        const minutes = Math.floor(maxTimer / 20);
        const seconds = Math.floor((maxTimer % 20) * 3);

        // TODO: Display timer on screen
        console.log(`[Planning] Timer: ${minutes}:${seconds.toString().padStart(2, '0')}`);
    }

    /**
     * Display info
     * Port of plDisplayInfo() from planer.c
     */
    private displayInfo(): void {
        // TODO: Display current person, weight, volume, etc.
        if (this.state) {
            console.log(`[Planning] Current person: ${this.state.currentPerson}`);
        }
    }

    /**
     * Notebook menu
     * Port of plNoteBook() from planer.c
     */
    private async notebook(): Promise<void> {
        const menuItems = [
            'Target',
            'Team',
            'Car',
            'Tools',
            'Loots',
            'Return'
        ];

        const choice = await this.ui.showMenu(menuItems, 'Notebook');

        switch (choice) {
            case PLANING_NOTE_TARGET:
                // Show target building info
                await this.ui.showBubble(['Target building information'], 'think', 0);
                break;
            case PLANING_NOTE_TEAM:
                // Show team members
                await this.ui.showBubble(['Team members'], 'think', 0);
                break;
            case PLANING_NOTE_CAR:
                // Show car info
                await this.ui.showBubble(['Car information'], 'think', 0);
                break;
            case PLANING_NOTE_TOOLS:
                // Show tools
                await this.ui.showBubble(['Tools'], 'think', 0);
                break;
            case PLANING_NOTE_LOOTS:
                // Show loots
                await this.ui.showBubble(['Loots'], 'think', 0);
                break;
        }
    }

    /**
     * Look menu
     * Port of plLook() from planer.c
     */
    private async look(): Promise<void> {
        const menuItems = [
            'View Plan',
            'Change Person',
            'Return'
        ];

        const choice = await this.ui.showMenu(menuItems, 'Look');

        switch (choice) {
            case PLANING_LOOK_PLAN:
                // Show plan overview
                await this.ui.showBubble(['Plan overview'], 'think', 0);
                break;
            case PLANING_LOOK_PERSON_CHANGE:
                // Change active person
                await this.changePerson();
                break;
        }
    }

    /**
     * Change active person
     */
    private async changePerson(): Promise<void> {
        if (!this.state || this.state.team.length === 0) return;

        const personNames = this.state.team.map((id, idx) => {
            const person = this.db.getObject(id);
            return person?.name || `Person ${idx + 1}`;
        });

        const choice = await this.ui.showMenu(personNames, 'Select Person');

        if (choice >= 0 && choice < this.state.team.length) {
            this.state.currentPerson = choice;
            this.system.setActivHandler(this.state.team[choice]);
        }
    }

    /**
     * Action menu
     * Port of plAction() from planer.c
     */
    private async action(): Promise<void> {
        const menuItems = [
            'Walk',
            'Use',
            'Open',
            'Close',
            'Take',
            'Drop',
            'Wait',
            'Radio',
            'Change Person',
            'Return'
        ];

        const choice = await this.ui.showMenu(menuItems, 'Action');

        switch (choice) {
            case PLANING_PERSON_WALK:
                await this.actionWalk();
                break;
            case PLANING_ACTION_USE:
                await this.actionUse();
                break;
            case PLANING_ACTION_OPEN:
                await this.actionOpen();
                break;
            case PLANING_ACTION_CLOSE:
                await this.actionClose();
                break;
            case PLANING_ACTION_TAKE:
                await this.actionTake();
                break;
            case PLANING_ACTION_DROP:
                await this.actionDrop();
                break;
            case PLANING_ACTION_WAIT:
                await this.actionWait();
                break;
            case PLANING_ACTION_RADIO:
                await this.actionRadio();
                break;
            case PLANING_PERSON_CHANGE:
                await this.changePerson();
                break;
        }
    }

    /**
     * Walk action - allows player to move character in the landscape
     */
    private async actionWalk(): Promise<void> {
        const action = this.planningSystem.getCurrentAction();
        
        this.showMessage('WALK', true);
        
        // Disable mouse and function keys during walk
        // In TypeScript we handle this through input state
        
        while (true) {
            let direction = 0;
            
            // Wait for input (arrow keys or mouse click)
            const input = await this.waitForInput(['left', 'right', 'up', 'down', 'escape', 'click']);
            
            if (input === 'click') {
                break;
            }
            
            if (input === 'escape') {
                // Remove last action if ESC pressed
                if (this.removeLastAction()) {
                    // Action was removed, get new current action
                    continue;
                }
            } else {
                // Convert input to direction
                if (input === 'left') direction += LS_SCROLL_LEFT;
                if (input === 'right') direction += LS_SCROLL_RIGHT;
                if (input === 'up') direction += LS_SCROLL_UP;
                if (input === 'down') direction += LS_SCROLL_DOWN;
                
                // Check for collision
                const collision = this.landscape.initScrollLandscape(direction, true);
                
                if (!collision) {
                    const currentAction = this.planningSystem.getCurrentAction();
                    
                    // Create or update GO action
                    if (!currentAction || currentAction.type !== ACTION_GO) {
                        const newAction = this.planningSystem.initAction(
                            ACTION_GO,
                            direction,
                            0,
                            0
                        );
                        
                        if (!newAction) {
                            await this.say('PLANING_END', this.currentPerson);
                            return;
                        }
                        
                        this.planChanged = true;
                    } else {
                        // Check if direction changed
                        const actionData = currentAction.data as { direction: number };
                        
                        if (actionData.direction === direction) {
                            // Same direction, increment timer
                            this.planningSystem.incCurrentTimer(1, true);
                        } else {
                            // Direction changed, create new action
                            const newAction = this.planningSystem.initAction(
                                ACTION_GO,
                                direction,
                                0,
                                1
                            );
                            
                            if (!newAction) {
                                await this.say('PLANING_END', this.currentPerson);
                                return;
                            }
                            
                            this.planChanged = true;
                        }
                    }
                    
                    // Sync animation
                    await this.sync(
                        false, // PLANING_ANIMATE_STD
                        this.planningSystem.getMaxTimer(),
                        1,
                        true
                    );
                    
                    // Move character
                    await this.support.move(this.currentPerson, direction);
                    
                    // Scroll landscape
                    this.landscape.scrollLandscape();
                    
                    // Animate characters
                    this.living.doAnims(this.animCounter++ % 2, true);
                    
                    // Update display
                    this.displayTimer(false);
                }
            }
        }
    }

    /**
     * Use action - use tools on objects or use stairs/windows
     */
    private async actionUse(): Promise<void> {
        if (!this.state) return;
        
        // Get objects in reach
        const actionList = this.support.getObjectsList(this.currentPerson, false);
        
        if (this.currentPerson < this.state.team.length) {
            // Burglar - can use tools on objects
            
            // Add guards to action list
            for (let i = this.state.team.length; i < this.state.personNames.length; i++) {
                this.support.insertGuard(actionList, this.currentPerson, i);
            }
            
            // Get available tools
            const tools = this.db.getRelatedObjects(
                this.state.team[this.currentPerson],
                'has',
                'Tool'
            );
            
            if (tools.length === 0) {
                this.showMessage('USE_1', true);
                return;
            }
            
            if (actionList.length === 0) {
                this.showMessage('NO_OBJECTS', true);
                return;
            }
            
            // Show object selection
            this.showMessage('USE_3', true);
            const objectChoice = await this.ui.showMenu(
                actionList.map(obj => this.db.getObjectName(obj)),
                'Select Object'
            );
            
            if (objectChoice < 0 || objectChoice >= actionList.length) return;
            
            const objectId = actionList[objectChoice];
            const lsObject = this.db.getObject(objectId);
            
            // Check if it's stairs
            if (this.support.isStair(objectId)) {
                // Use stairs to change area
                const newAreaId = this.db.getRelation(objectId, 'StairConnects', objectId);
                
                if (newAreaId) {
                    const action = this.planningSystem.initAction(
                        ACTION_USE,
                        objectId,
                        this.landscape.getActivAreaID(),
                        8 * 60 // PLANING_TIME_USE_STAIRS * PLANING_CORRECT_TIME
                    );
                    
                    if (action) {
                        this.planChanged = true;
                        
                        // Move person to new area
                        const personName = this.state.personNames[this.currentPerson];
                        this.living.livesInArea(personName, newAreaId);
                        
                        // Reinitialize area
                        this.landscape.doneActivArea(newAreaId);
                        await this.landscape.initActivArea(
                            newAreaId,
                            this.living.getXPos(personName),
                            this.living.getYPos(personName),
                            personName
                        );
                        
                        this.living.refreshAll();
                        
                        await this.sync(false, this.planningSystem.getMaxTimer(), 8 * 60, true);
                    } else {
                        await this.say('PLANING_END', this.currentPerson);
                    }
                }
                return;
            }
            
            // Check if it's a guard
            if (this.db.isObjectType(objectId, 'Police')) {
                // Fight guard
                const person = this.db.getObject(this.state.team[this.currentPerson]);
                if (this.db.hasRelation(this.state.team[this.currentPerson], 'has', 'Ability_Kampf')) {
                    // Show fight tool selection
                    const fightTools = ['Hand', 'Foot'];
                    if (tools.some(t => this.db.getObjectName(t) === 'Chloroform')) {
                        fightTools.push('Chloroform');
                    }
                    
                    this.showMessage('USE_4', true);
                    const toolChoice = await this.ui.showMenu(fightTools, 'Select Tool');
                    
                    if (toolChoice >= 0 && toolChoice < fightTools.length) {
                        // TODO: Calculate time based on tool and guard
                        const time = 5 * 60; // PLANING_TIME_FIGHT * PLANING_CORRECT_TIME
                        
                        const action = this.planningSystem.initAction(
                            ACTION_USE,
                            objectId,
                            toolChoice,
                            time
                        );
                        
                        if (action) {
                            this.planChanged = true;
                            // Mark guard as knocked out
                            // TODO: Update guard state
                            await this.support.work(this.currentPerson);
                            await this.sync(false, this.planningSystem.getMaxTimer(), time, true);
                            this.living.refreshAll();
                        } else {
                            await this.say('PLANING_END', this.currentPerson);
                        }
                    }
                } else {
                    this.showMessage('WRONG_ABILITY', true);
                }
                return;
            }
            
            // Regular object - use tool on it
            const objectState = this.landscape.getObjectState(objectId);
            
            // Check if object is locked
            if (!this.support.ignoreLock(objectId) && !(objectState & (1 << 2))) { // Const_tcLOCK_UNLOCK_BIT
                // Show tool selection
                this.showMessage('USE_2', true);
                
                const toolChoice = await this.ui.showMenu(
                    tools.map(t => this.db.getObjectName(t)),
                    'Select Tool'
                );
                
                if (toolChoice >= 0 && toolChoice < tools.length) {
                    const toolId = tools[toolChoice];
                    
                    // Check abilities
                    // TODO: Implement plCheckAbilities
                    
                    // Check required tools
                    // TODO: Implement plCheckRequiredTools
                    
                    // Calculate time
                    // TODO: Use tcGuyUsesTool
                    const time = 60 * 60; // Placeholder
                    
                    const action = this.planningSystem.initAction(
                        ACTION_USE,
                        objectId,
                        toolId,
                        time
                    );
                    
                    if (action) {
                        this.planChanged = true;
                        await this.support.work(this.currentPerson);
                        await this.sync(false, this.planningSystem.getMaxTimer(), time, true);
                        
                        // Unlock object
                        if (!this.support.ignoreLock(objectId)) {
                            this.landscape.setObjectState(objectId, 1 << 2, 1); // Const_tcLOCK_UNLOCK_BIT
                            
                            // Check if tool also opens
                            const tool = this.db.getObject(toolId);
                            // TODO: Check tool effect
                            // if (tool.Effect & Const_tcTOOL_OPENS) {
                            //     this.landscape.setObjectState(objectId, 1 << 0, 1); // Const_tcOPEN_CLOSE_BIT
                            //     this.support.correctOpened(lsObject, true);
                            // }
                        }
                        
                        this.landscape.refresh(objectId);
                        this.living.refreshAll();
                    } else {
                        await this.say('PLANING_END', this.currentPerson);
                    }
                }
            } else {
                this.showMessage('UNLOCK_UNLOCKED', true);
            }
        } else {
            // Guard - can control objects
            if (actionList.length === 0) {
                this.showMessage('NO_OBJECTS', true);
                return;
            }
            
            this.showMessage('CONTROL', true);
            const objectChoice = await this.ui.showMenu(
                actionList.map(obj => this.db.getObjectName(obj)),
                'Select Object'
            );
            
            if (objectChoice >= 0 && objectChoice < actionList.length) {
                const objectId = actionList[objectChoice];
                
                const action = this.planningSystem.initAction(
                    ACTION_CONTROL,
                    objectId,
                    0,
                    5 * 60 // PLANING_TIME_CONTROL * PLANING_CORRECT_TIME
                );
                
                if (action) {
                    this.planChanged = true;
                    await this.sync(false, this.planningSystem.getMaxTimer(), 5 * 60, true);
                    this.landscape.refresh(objectId);
                    this.living.refreshAll();
                } else {
                    await this.say('PLANING_END', this.currentPerson);
                }
            }
        }
    }

    /**
     * Open action - open doors, windows, safes, etc.
     */
    private async actionOpen(): Promise<void> {
        await this.actionOpenClose(ACTION_OPEN);
    }

    /**
     * Close action - close doors, windows, safes, etc.
     */
    private async actionClose(): Promise<void> {
        await this.actionOpenClose(ACTION_CLOSE);
    }

    /**
     * Open/Close action implementation
     * Port of plActionOpenClose() from planer.c
     */
    private async actionOpenClose(actionType: number): Promise<void> {
        if (!this.state) return;
        
        // Get objects in reach
        const actionList = this.support.getObjectsList(this.currentPerson, false);
        
        if (actionList.length === 0) {
            this.showMessage('NO_OBJECTS', true);
            return;
        }
        
        // Show message
        if (actionType === ACTION_OPEN) {
            this.showMessage('OPEN', true);
        } else {
            this.showMessage('CLOSE', true);
        }
        
        // Show object selection
        const objectChoice = await this.ui.showMenu(
            actionList.map(obj => this.db.getObjectName(obj)),
            actionType === ACTION_OPEN ? 'Open' : 'Close'
        );
        
        if (objectChoice < 0 || objectChoice >= actionList.length) return;
        
        const objectId = actionList[objectChoice];
        const objectState = this.landscape.getObjectState(objectId);
        
        // Check if in progress
        if (this.currentPerson < this.state.team.length && (objectState & (1 << 3))) { // Const_tcIN_PROGRESS_BIT
            this.showMessage('IN_PROGRESS', true);
            return;
        }
        
        // Check if locked
        if (this.currentPerson < this.state.team.length && 
            !this.support.ignoreLock(objectId) && 
            !(objectState & (1 << 2))) { // Const_tcLOCK_UNLOCK_BIT
            this.showMessage('LOCKED', true);
            return;
        }
        
        // Check current state
        const isOpen = (objectState & (1 << 0)) !== 0; // Const_tcOPEN_CLOSE_BIT
        
        if ((actionType === ACTION_OPEN && isOpen) || 
            (actionType === ACTION_CLOSE && !isOpen)) {
            // Already in desired state
            if (actionType === ACTION_OPEN) {
                this.showMessage('OPEN_OPENED', true);
            } else {
                this.showMessage('CLOSE_CLOSED', true);
            }
            return;
        }
        
        // Calculate time (using hand tool)
        // TODO: Use opensGet() to get actual time
        const time = 30 * 60; // Placeholder
        
        const action = this.planningSystem.initAction(
            actionType,
            objectId,
            0,
            time
        );
        
        if (action) {
            this.planChanged = true;
            
            if (this.currentPerson < this.state.team.length) {
                await this.support.work(this.currentPerson);
            }
            
            await this.sync(false, this.planningSystem.getMaxTimer(), time, true);
            
            // Update object state
            this.landscape.setObjectState(
                objectId,
                1 << 0, // Const_tcOPEN_CLOSE_BIT
                actionType === ACTION_OPEN ? 1 : 0
            );
            
            // Correct opened state
            const lsObject = this.db.getObject(objectId);
            if (actionType === ACTION_OPEN) {
                this.support.correctOpened(lsObject, true);
            } else {
                this.support.correctOpened(lsObject, false);
            }
            
            this.landscape.refresh(objectId);
            this.living.refreshAll();
        } else {
            await this.say('PLANING_END', this.currentPerson);
        }
    }

    /**
     * Take action - pick up loot
     * Port of plActionTake() from planer.c
     */
    private async actionTake(): Promise<void> {
        if (!this.state) return;
        
        // Get objects in reach
        const actionList = this.support.getObjectsList(this.currentPerson, true);
        
        if (actionList.length === 0) {
            this.showMessage('NO_OBJECTS', true);
            return;
        }
        
        // Build list of takeable loot
        const takeableList: Array<{lootId: number, containerId: number, name: string, inContainer: boolean}> = [];
        
        for (const containerId of actionList) {
            const containerState = this.landscape.getObjectState(containerId);
            
            // Get loot in this container
            const lootItems = this.db.getRelatedObjects(containerId, 'hasLoot', 'Loot');
            
            if (lootItems.length > 0) {
                // Check if container has TAKE bit or is open
                const hasTakeBit = (containerState & (1 << 4)) !== 0; // Const_tcTAKE_BIT
                const isOpen = (containerState & (1 << 0)) !== 0; // Const_tcOPEN_CLOSE_BIT
                
                if (hasTakeBit) {
                    // Can take directly (e.g., painting on wall)
                    const loot = lootItems[0];
                    takeableList.push({
                        lootId: loot,
                        containerId: containerId,
                        name: this.db.getObjectName(loot),
                        inContainer: false
                    });
                } else if (isOpen) {
                    // Can take from open container
                    for (const loot of lootItems) {
                        takeableList.push({
                            lootId: loot,
                            containerId: containerId,
                            name: this.db.getObjectName(loot),
                            inContainer: true
                        });
                    }
                }
            }
        }
        
        if (takeableList.length === 0) {
            this.showMessage('NO_OBJECTS', true);
            return;
        }
        
        // Show loot selection
        this.showMessage('TAKE', true);
        const lootChoice = await this.ui.showMenu(
            takeableList.map(item => item.name),
            'Take Loot'
        );
        
        if (lootChoice < 0 || lootChoice >= takeableList.length) return;
        
        const selectedLoot = takeableList[lootChoice];
        const loot = this.db.getObject(selectedLoot.lootId);
        
        // Check weight and volume
        const person = this.db.getObject(this.state.team[this.currentPerson]);
        // TODO: Get actual capacity from person
        const weightCapacity = 10000; // Placeholder
        const volumeCapacity = 10000; // Placeholder
        
        // TODO: Track current weight/volume
        const currentWeight = 0;
        const currentVolume = 0;
        
        const lootWeight = (loot as any).Weight || 0;
        const lootVolume = (loot as any).Volume || 0;
        
        if (currentWeight + lootWeight > weightCapacity) {
            this.showMessage('TOO_HEAVY', true);
            return;
        }
        
        if (currentVolume + lootVolume > volumeCapacity) {
            this.showMessage('TOO_BIG', true);
            return;
        }
        
        // Create take action
        const action = this.planningSystem.initAction(
            ACTION_TAKE,
            selectedLoot.containerId,
            selectedLoot.lootId,
            3 * 60 // PLANING_TIME_TAKE * PLANING_CORRECT_TIME
        );
        
        if (action) {
            this.planChanged = true;
            
            await this.support.work(this.currentPerson);
            await this.sync(false, this.planningSystem.getMaxTimer(), 3 * 60, true);
            
            // Update loot ownership
            if (!selectedLoot.inContainer) {
                // Remove from container
                this.landscape.turnObject(
                    selectedLoot.containerId,
                    true, // LS_OBJECT_INVISIBLE
                    true  // LS_NO_COLLISION
                );
                this.landscape.setObjectState(selectedLoot.containerId, 1 << 5, 0); // Const_tcACCESS_BIT
                this.showMessage('TAKEN_LOOT', true);
            }
            
            // Add to person's inventory
            this.db.setRelation(
                this.state.team[this.currentPerson],
                'take',
                selectedLoot.lootId,
                1
            );
            
            // Remove from container
            this.db.removeRelation(
                selectedLoot.containerId,
                'hasLoot',
                selectedLoot.lootId
            );
            
            // TODO: Update weight/volume tracking
            
            this.landscape.refresh(selectedLoot.containerId);
            this.living.refreshAll();
        } else {
            await this.say('PLANING_END', this.currentPerson);
        }
    }

    /**
     * Drop action - drop loot
     * Port of plActionDrop() from planer.c
     */
    private async actionDrop(): Promise<void> {
        if (!this.state) return;
        
        // Get loot carried by person
        const carriedLoot = this.db.getRelatedObjects(
            this.state.team[this.currentPerson],
            'take',
            'Loot'
        );
        
        if (carriedLoot.length === 0) {
            this.showMessage('DROP_1', true);
            return;
        }
        
        // Show loot selection
        this.showMessage('DROP_2', true);
        const lootChoice = await this.ui.showMenu(
            carriedLoot.map(loot => this.db.getObjectName(loot)),
            'Drop Loot'
        );
        
        if (lootChoice < 0 || lootChoice >= carriedLoot.length) return;
        
        const lootId = carriedLoot[lootChoice];
        const loot = this.db.getObject(lootId);
        
        // Get next available loot bag
        const lootBagId = this.support.getNextLoot();
        
        if (!lootBagId) {
            this.showMessage('DROP_3', true);
            return;
        }
        
        // Create drop action
        const action = this.planningSystem.initAction(
            ACTION_DROP,
            lootBagId,
            lootId,
            3 * 60 // PLANING_TIME_DROP * PLANING_CORRECT_TIME
        );
        
        if (action) {
            this.planChanged = true;
            
            await this.support.work(this.currentPerson);
            await this.sync(false, this.planningSystem.getMaxTimer(), 3 * 60, true);
            
            // Transfer loot to bag
            this.db.setRelation(lootBagId, 'hasLoot', lootId, 1);
            this.db.removeRelation(this.state.team[this.currentPerson], 'take', lootId);
            
            // TODO: Update weight/volume tracking
            const lootWeight = (loot as any).Weight || 0;
            const lootVolume = (loot as any).Volume || 0;
            
            this.landscape.refresh(lootBagId);
            this.living.refreshAll();
        } else {
            await this.say('PLANING_END', this.currentPerson);
        }
    }

    /**
     * Wait action - wait for time to pass or for radio signal
     * Port of plActionWait() from planer.c
     */
    private async actionWait(): Promise<void> {
        if (!this.state) return;
        
        const menuItems = ['Wait', 'Return'];
        
        // Add radio option if applicable
        if (this.currentPerson < this.state.team.length && this.state.team.length > 1) {
            // Check if Matt has radio
            const hasRadio = this.db.hasRelation(
                this.state.team[0], // Matt is always first
                'has',
                'Tool_Funkgeraet'
            );
            
            if (hasRadio) {
                menuItems.splice(1, 0, 'Wait for Radio');
            }
        }
        
        let active = 0;
        while (active !== menuItems.length - 1) { // Return option
            this.displayTimer(false);
            this.displayInfo();
            
            active = await this.ui.showMenu(menuItems, 'Wait');
            
            if (active === 0) {
                // Wait for time
                this.showMessage('WAIT_1', true);
                
                // Show time selection (0-1800 seconds = 30 minutes)
                let waitTime = 0;
                
                // Simple input loop for time selection
                while (true) {
                    // TODO: Draw wait time display
                    
                    const input = await this.waitForInput(['left', 'right', 'up', 'down', 'click']);
                    
                    if (input === 'click') break;
                    
                    if (input === 'right' && waitTime < 1800) {
                        waitTime++;
                    } else if (input === 'left' && waitTime > 0) {
                        waitTime--;
                    } else if (input === 'up' && waitTime <= 1740) {
                        waitTime += 60;
                    } else if (input === 'down' && waitTime >= 60) {
                        waitTime -= 60;
                    }
                }
                
                if (waitTime > 0) {
                    const action = this.planningSystem.initAction(
                        ACTION_WAIT,
                        0,
                        0,
                        waitTime * 60 // PLANING_CORRECT_TIME
                    );
                    
                    if (action) {
                        this.planChanged = true;
                        
                        // Stand animation
                        const personName = this.state.personNames[this.currentPerson];
                        this.living.animate(personName, 'STAND', 0, 0);
                        
                        await this.sync(false, this.planningSystem.getMaxTimer(), waitTime * 60, true);
                        this.living.refreshAll();
                    } else {
                        await this.say('PLANING_END', this.currentPerson);
                        active = menuItems.length - 1; // Exit
                    }
                }
            } else if (active === 1 && menuItems[1] === 'Wait for Radio') {
                // Wait for radio signal
                const hasRadio = this.db.hasRelation(
                    this.state.team[0],
                    'has',
                    'Tool_Funkgeraet'
                );
                
                if (hasRadio) {
                    // Select person to wait for
                    let targetPerson = -1;
                    
                    if (this.state.team.length > 2) {
                        // Show person selection
                        this.showMessage('RADIO_2', true);
                        
                        const otherTeam = this.state.team.filter((_, i) => i !== this.currentPerson);
                        const personChoice = await this.ui.showMenu(
                            otherTeam.map(id => this.db.getObjectName(id)),
                            'Wait for Signal From'
                        );
                        
                        if (personChoice >= 0 && personChoice < otherTeam.length) {
                            targetPerson = otherTeam[personChoice];
                        }
                    } else {
                        // Only 2 people, wait for the other one
                        targetPerson = this.state.team[this.currentPerson === 0 ? 1 : 0];
                        this.showMessage('RADIO_4', true);
                    }
                    
                    if (targetPerson >= 0) {
                        const action = this.planningSystem.initAction(
                            ACTION_WAIT_SIGNAL,
                            targetPerson,
                            0,
                            60 // PLANING_CORRECT_TIME
                        );
                        
                        if (action) {
                            this.planChanged = true;
                            
                            const personName = this.state.personNames[this.currentPerson];
                            this.living.animate(personName, 'STAND', 0, 0);
                            
                            await this.sync(false, this.planningSystem.getMaxTimer(), 60, true);
                            this.living.refreshAll();
                        } else {
                            await this.say('PLANING_END', this.currentPerson);
                            active = menuItems.length - 1; // Exit
                        }
                    }
                } else {
                    this.showMessage('NO_RADIO', true);
                }
            }
        }
    }

    /**
     * Radio action - send radio signal to another team member
     * Port of plActionRadio() from planer.c
     */
    private async actionRadio(): Promise<void> {
        if (!this.state) return;
        
        // Check if Matt has radio
        const hasRadio = this.db.hasRelation(
            this.state.team[0],
            'has',
            'Tool_Funkgeraet'
        );
        
        if (!hasRadio) {
            this.showMessage('NO_RADIO', true);
            return;
        }
        
        // Select target person
        let targetPerson = -1;
        
        if (this.state.team.length > 2) {
            // Show person selection
            this.showMessage('RADIO_1', true);
            
            const otherTeam = this.state.team.filter((_, i) => i !== this.currentPerson);
            const personChoice = await this.ui.showMenu(
                otherTeam.map(id => this.db.getObjectName(id)),
                'Send Signal To'
            );
            
            if (personChoice >= 0 && personChoice < otherTeam.length) {
                targetPerson = otherTeam[personChoice];
            }
        } else {
            // Only 2 people, signal the other one
            targetPerson = this.state.team[this.currentPerson === 0 ? 1 : 0];
            this.showMessage('RADIO_3', true);
        }
        
        if (targetPerson >= 0) {
            const action = this.planningSystem.initAction(
                ACTION_SIGNAL,
                targetPerson,
                0,
                5 * 60 // PLANING_TIME_RADIO * PLANING_CORRECT_TIME
            );
            
            if (action) {
                this.planChanged = true;
                
                const personName = this.state.personNames[this.currentPerson];
                this.living.animate(personName, 'MAKE_CALL', 0, 0);
                
                await this.sync(false, this.planningSystem.getMaxTimer(), 5 * 60, true);
                this.living.refreshAll();
            } else {
                await this.say('PLANING_END', this.currentPerson);
            }
        }
    }

    /**
     * Check if plan has changed and prompt to save
     * Port of plSaveChanged() from planer.c
     */
    private async saveChanged(buildingId: number): Promise<void> {
        if (!this.state || !this.state.planChanged) return;

        const lines = [
            'The plan has been modified.',
            'Do you want to save it?'
        ];

        const choice = await this.ui.showMenu(['Yes', 'No'], 'Save Plan?');

        if (choice === 0) {
            await this.savePlan(buildingId);
        }
    }

    /**
     * Main planning function
     * Port of plPlaner() from planer.c
     * 
     * Opens the planning interface for a building.
     * Allows player to:
     * - Select team members
     * - Choose tools
     * - Plan actions
     * - Save/load plans
     */
    async planner(buildingId: number): Promise<void> {
        console.log(`[PlanningService] Opening planner for building ${buildingId}`);

        const building = this.db.getObject(buildingId) as Building;
        if (!building) {
            console.error('Building not found:', buildingId);
            return;
        }

        // Initialize planning state
        this.state = {
            buildingId,
            team: [],  // TODO: Get from organisation
            tools: [],  // TODO: Get from organisation
            car: null,  // TODO: Get from organisation
            personNames: [],
            guardNames: [],
            currentPerson: 0,
            planChanged: false,
        };

        // Initialize system
        this.system.initSystem();

        // Prepare system
        this.prepareSys(
            buildingId,
            PLANING_INIT_PERSONSLIST | PLANING_HANDLER_ADD | PLANING_HANDLER_OPEN |
            PLANING_GUARDS_LOAD | PLANING_HANDLER_SET
        );

        // Prepare graphics
        this.prepareGfx(buildingId, LS_COLL_PLAN, PLANING_GFX_LANDSCAPE | PLANING_GFX_SPRITES | PLANING_GFX_BACKGROUND);

        // Main planning loop
        let active = 0;
        while (active !== PLANING_RETURN) {
            this.displayTimer(0, 1);
            this.displayInfo();

            const menuItems = [
                'Start',
                'Notebook',
                'Save',
                'Load',
                'Clear',
                'Look',
                'Return'
            ];

            active = await this.ui.showMenu(menuItems, 'Planning');

            switch (active) {
                case PLANING_START:
                    await this.action();
                    break;

                case PLANING_NOTE:
                    await this.notebook();
                    break;

                case PLANING_SAVE:
                    await this.savePlan(buildingId);
                    this.state.planChanged = false;
                    break;

                case PLANING_LOAD:
                    await this.saveChanged(buildingId);
                    await this.loadPlan(buildingId);
                    this.state.planChanged = false;
                    break;

                case PLANING_CLEAR:
                    await this.saveChanged(buildingId);
                    this.prepareSys(0, PLANING_HANDLER_CLEAR | PLANING_HANDLER_SET);
                    this.state.planChanged = false;
                    break;

                case PLANING_LOOK:
                    await this.look();
                    break;
            }
        }

        // Save if changed
        await this.saveChanged(buildingId);

        // Cleanup
        this.unprepareGfx();
        this.unprepareSys();

        this.state = null;
    }

    /**
     * Execute a burglary plan
     * Port of plPlayer() from player.c
     * 
     * Executes the planned burglary in real-time.
     * Returns success/failure code.
     * 
     * @param buildingId Building to burgle
     * @param actionTime Starting time
     * @param actionFunc Optional action callback
     * @returns Burglary result code
     */
    /**
     * Execute a planned burglary
     * Port of plPlayer() from player.c
     */
    async player(
        buildingId: number,
        actionTime: number = 0,
        actionFunc: ((objId: number, time: number) => boolean) | null = null
    ): Promise<number> {
        console.log(`[PlanningService] Executing burglary for building ${buildingId}`);

        // Initialize execution state
        this.initializePlayerData(buildingId, actionTime, actionFunc);
        this.initializeSearchData(buildingId);

        // Prepare systems (landscape, graphics, etc.)
        await this.prepareExecution(buildingId);

        // Load saved plan
        const planLoaded = await this.loadPlanForExecution(buildingId);
        if (!planLoaded) {
            console.error('[PlanningService] Failed to load plan');
            await this.ui.showBubble(['No plan found for this building.'], 'think', 0);
            return BURGLARY_FAILURE;
        }

        // Start main execution loop
        const result = await this.executionLoop();

        // Cleanup
        await this.cleanupExecution();

        return result;
    }

    /**
     * Initialize PlayerData structure
     */
    private initializePlayerData(
        buildingId: number,
        actionTime: number,
        actionFunc: ((objId: number, time: number) => boolean) | null
    ): void {
        const building = this.db.getObject(buildingId) as Building;
        const areaId = this.landscape.getActivAreaID();
        const area = this.db.getObject(areaId);

        this.playerData = {
            action: null,
            handlerEnded: [1, 1, 1, 1],
            guardKO: [0, 0, 0, 0],
            currLoudness: [0, 0, 0, 0],
            unableToWork: [0, 0, 0, 0],
            maxTimer: 0,
            timer: 0,
            realTime: 0,
            ende: false,
            badPlaning: false,
            mood: this.getMood(0),
            patrolCount: 0,
            bldId: buildingId,
            bldObj: building,
            changeCount: 0,
            totalCount: this.landscape.getObjectCount(),
            alarmTimer: 0,
            actionTime: actionTime,
            actionFunc: actionFunc,
            isItDark: (area as any).uch_Darkness || false,
            sndState: true
        };
    }

    /**
     * Initialize SearchData structure
     */
    private initializeSearchData(buildingId: number): void {
        this.search = {
            guyXPos: [-1, -1, -1, -1],
            guyYPos: [-1, -1, -1, -1],
            exhaust: [0, 0, 0, 0],
            walkTime: [0, 0, 0, 0],
            waitTime: [0, 0, 0, 0],
            workTime: [0, 0, 0, 0],
            killTime: [0, 0, 0, 0],
            deriTime: 0,
            timeOfBurglary: 0,
            timeOfAlarm: 0,
            buildingId: buildingId,
            lastAreaId: 0,
            escapeBits: 0,
            callValue: 0,
            callCount: 0,
            warningCount: 0,
            spotTouchCount: [0, 0, 0, 0],
            kaserneOk: false
        };
    }

    /**
     * Get team mood
     * Port of plGetMood() from player.c
     */
    private getMood(time: number): number {
        // TODO: Port tcGetTeamMood() from gp.c
        // For now, return a default value
        return 100;
    }

    /**
     * Generate random number for game logic
     * Port of CalcRandomNrForGameLogic() from random.c
     */
    private randomNr(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Cleanup after execution
     * Port of cleanup code from plPlayer()
     */
    private async cleanupExecution(): Promise<void> {
        console.log('[PlanningService] Cleaning up execution');

        if (!this.playerData || !this.search || !this.state) return;

        // Save final positions
        const burglarsNr = this.state.team.length;
        for (let i = 0; i < burglarsNr; i++) {
            // TODO: Get final positions from living service
            // this.search.guyXPos[i] = livGetXPos(name);
            // this.search.guyYPos[i] = livGetYPos(name);
        }

        // Transfer loot to Matt
        for (let i = 0; i < burglarsNr; i++) {
            // TODO: Port loot transfer logic
            // Get all loot from person and transfer to Matt
        }

        // Check if car is too full
        // TODO: Port plCarTooFull() check
        // If too full, show menu to drop items

        // Set escape bits if successful
        if (!(this.search.escapeBits & FAHN_ALARM) && 
            !(this.search.escapeBits & FAHN_QUIET_ALARM) && 
            !(this.search.escapeBits & FAHN_ESCAPE)) {
            this.search.escapeBits |= FAHN_STD_ESCAPE;
        }

        // TODO: Calculate escape time
        // timeLeft = tcEscapeFromBuilding(escapeBits);

        // Cleanup graphics
        // TODO: Port plUnprepareGfx()
        // TODO: Port plUnprepareRel()
        // TODO: Port plUnprepareSys()
    }

    /**
     * Prepare systems for execution
     * Port of plPrepareSys(), plPrepareGfx(), plPrepareRel() from prepare.c
     */
    private async prepareExecution(buildingId: number): Promise<void> {
        console.log('[PlanningService] Preparing execution systems');

        // plPrepareSys - Initialize person lists and handlers
        // TODO: Port full person list initialization
        // For now, use team from state
        if (!this.state) {
            console.error('[PlanningService] No state available for execution');
            return;
        }

        // plPrepareGfx - Initialize landscape and sprites
        // Initialize landscape for the building
        await this.landscape.init(buildingId, LS_COLL_PLAN);
        
        // TODO: Initialize sprites for team members
        // TODO: Set active living
        
        // plPrepareRel - Clone loot relations
        // TODO: Port relation cloning for loot tracking
        // This creates temporary relations for tracking loot during burglary
    }

    /**
     * Load plan for execution
     * Port of plOpen() and LoadSystem() from player.c
     */
    private async loadPlanForExecution(buildingId: number): Promise<boolean> {
        console.log('[PlanningService] Loading plan for execution');

        if (!this.state || !this.playerData) {
            return false;
        }

        // TODO: Port plOpen() - Open plan file
        // TODO: Port LoadSystem() - Load handlers and actions
        // TODO: Port plLoadTools() - Load tool assignments
        
        // For now, check if we have a team
        if (!this.state.team || this.state.team.length === 0) {
            console.error('[PlanningService] No team members for execution');
            return false;
        }

        // Initialize handler states
        const burglarsNr = this.state.team.length;
        for (let i = 0; i < PLANING_NR_PERSONS; i++) {
            this.playerData.handlerEnded[i] = 1;
            this.playerData.currLoudness[i] = 0;
            this.playerData.unableToWork[i] = 0;
            
            this.search!.exhaust[i] = 0;
            this.search!.walkTime[i] = 0;
            this.search!.waitTime[i] = 0;
            this.search!.workTime[i] = 0;
            this.search!.killTime[i] = 0;
            this.search!.spotTouchCount[i] = 0;
            this.search!.guyXPos[i] = -1;
            this.search!.guyYPos[i] = -1;
        }

        // Enable handlers for team members
        for (let i = 0; i < burglarsNr; i++) {
            this.playerData.handlerEnded[i] = 0;
            // TODO: LoadHandler() - Load actions for this person
            // TODO: Calculate maxTimer from all handlers
        }

        // Initialize guard KO states
        for (let i = 0; i < PLANING_NR_GUARDS; i++) {
            this.playerData.guardKO[i] = 0;
        }

        // TODO: Play music based on building
        // if (buildingId === Building_Starford_Kaserne) play kaserne music
        // else play standard music

        return true;
    }

    /**
     * Main execution loop
     * Port of main loop from plPlayer()
     */
    private async executionLoop(): Promise<number> {
        console.log('[PlanningService] Starting execution loop');

        if (!this.playerData || !this.search) {
            console.error('[PlanningService] Player data not initialized');
            return BURGLARY_FAILURE;
        }

        // Get player menu
        const menuItems = this.text.getTextLines('PLAN_TXT', 'PLAYER_MENU');
        let activeChoice = 0;

        // Main execution loop
        while (!this.playerData.ende) {
            // Update timer and check conditions
            await this.playerAction();

            // Build menu bitset
            let bitset = 1 << PLANING_PLAYER_ESCAPE;  // Always allow escape

            // Allow person change if multiple people
            const burglarsNr = this.state?.team.length || 0;
            if (burglarsNr > 1) {
                bitset |= 1 << PLANING_PLAYER_PERSON_CHANGE;
            }

            // Allow radio if Matt has radio
            const mattId = 1;  // Person_Matt_Stuvysunt
            const radioId = 1;  // Tool_Funkgeraet - TODO: Get correct ID
            if (this.db.hasRelation(mattId, radioId)) {
                bitset |= (1 << PLANING_PLAYER_RADIO_ALL) | (1 << PLANING_PLAYER_RADIO_ONE);
            }

            // Display timer and info
            this.displayTimer(this.playerData.realTime, true);
            this.displayInfo();

            // Show menu
            const choice = await this.ui.showMenu(menuItems, bitset, activeChoice);
            activeChoice = choice;

            // Handle menu choice
            switch (choice) {
                case PLANING_PLAYER_PERSON_CHANGE:
                    await this.handlePersonChange();
                    break;

                case PLANING_PLAYER_RADIO_ALL:
                    await this.handleRadioAll();
                    break;

                case PLANING_PLAYER_RADIO_ONE:
                    await this.handleRadioOne();
                    break;

                case PLANING_PLAYER_ESCAPE:
                    // Player wants to escape
                    this.search.escapeBits |= FAHN_ESCAPE;
                    for (let i = 0; i < PLANING_NR_PERSONS; i++) {
                        this.playerData.handlerEnded[i] = 1;
                    }
                    break;

                default:
                    activeChoice = 0;
                    break;
            }
        }

        // Execution ended - determine result
        return this.determineResult();
    }

    /**
     * Per-tick update during execution
     * Port of plPlayerAction() from player.c
     */
    private async playerAction(): Promise<void> {
        if (!this.playerData || !this.search || !this.state) return;

        // Increment timer
        this.playerData.timer++;
        this.playerData.realTime = Math.floor(this.playerData.timer / PLANING_CORRECT_TIME);

        // Display timer
        this.displayTimer(this.playerData.realTime, false);

        // Check time clock alarms (every 3 ticks)
        if (!(this.search.escapeBits & FAHN_ALARM_TIMECLOCK) && !(this.playerData.timer % 3)) {
            // TODO: Port tcCheckTimeClocks(buildingId)
            const timeClockAlarm = false;  // Stub for now
            if (timeClockAlarm) {
                this.search.escapeBits |= FAHN_ALARM | FAHN_ALARM_TIMECLOCK;
                this.search.deriTime += Math.floor(this.playerData.realTime / this.randomNr(1, 3));
                await this.showMessage('PLAYER_TIMECLOCK', true);
            }
        }

        // Check loudness detection (every 15 ticks)
        if (!(this.playerData.timer % 15)) {
            // TODO: Port tcAlarmByLoudness() and tcGetTotalLoudness()
            const totalLoudness = this.playerData.currLoudness[0] + this.playerData.currLoudness[1] + 
                                 this.playerData.currLoudness[2] + this.playerData.currLoudness[3];
            const loudnessAlarm = false;  // Stub for now
            if (loudnessAlarm) {
                this.search.escapeBits |= FAHN_QUIET_ALARM | FAHN_ALARM_LOUDN;
            }
        }

        // Check patrol detection (varies by building)
        let patrolCounter = 3;
        if (this.playerData.bldId === 1) {  // Building_Tower_of_London
            patrolCounter = 9;
        } else if (this.playerData.bldId === 2) {  // Building_Starford_Kaserne
            patrolCounter = 30;
        }

        if (!(this.playerData.timer % patrolCounter)) {
            // TODO: Port tcAlarmByPatrol()
            const patrolAlarm = false;  // Stub for now
            if (patrolAlarm) {
                await this.showMessage('PLAYER_PATROL', true);
                this.playerData.patrolCount++;
                this.search.escapeBits |= FAHN_QUIET_ALARM | FAHN_ALARM_PATRO;
            }
        }

        // Check alarm timer (every 180 ticks)
        if (this.playerData.alarmTimer && !(this.playerData.timer % 180)) {
            this.playerData.alarmTimer--;
            if (!this.playerData.alarmTimer) {
                this.search.escapeBits |= FAHN_QUIET_ALARM | FAHN_ALARM_TIMER;
            }
        }

        // Check for police arrival
        if ((this.search.escapeBits & FAHN_QUIET_ALARM) || (this.search.escapeBits & FAHN_ALARM)) {
            if (!this.search.timeOfAlarm) {
                this.search.timeOfAlarm = this.playerData.realTime;
                
                if (this.search.escapeBits & FAHN_ALARM) {
                    // TODO: Play alarm sound
                    console.log('[PlanningService] ALARM! Playing siren sound');
                }
            }

            // Play siren periodically
            if ((this.search.escapeBits & FAHN_ALARM) && 
                (((this.playerData.realTime - this.search.timeOfAlarm) % 120) === 119)) {
                // TODO: Play alarm sound
                console.log('[PlanningService] Playing periodic siren sound');
            }

            // Check if police arrived
            if (this.playerData.realTime >= (this.search.timeOfAlarm + this.playerData.bldObj.PoliceTime)) {
                this.search.escapeBits |= FAHN_SURROUNDED;
                
                for (let i = 0; i < PLANING_NR_PERSONS; i++) {
                    this.playerData.handlerEnded[i] = 1;
                }
                
                // TODO: Play police horn sound
                console.log('[PlanningService] SURROUNDED! Police arrived');
            }
        }

        // Check team mood (every 15 ticks, not for Kaserne)
        if (this.playerData.bldId !== 2 && !(this.playerData.timer % 15)) {  // Not Building_Starford_Kaserne
            this.playerData.mood = this.getMood(this.playerData.realTime);
            
            if (this.playerData.mood < PLANING_MOOD_MIN) {
                await this.showMessage('PLAYER_FLUCHT', true);
                this.search.escapeBits |= FAHN_ESCAPE;
                
                for (let i = 0; i < PLANING_NR_PERSONS; i++) {
                    this.playerData.handlerEnded[i] = 1;
                }
            }
        }

        // Check action function (timed event)
        if (this.playerData.realTime === this.playerData.actionTime && this.playerData.actionFunc) {
            const actionRet = this.playerData.actionFunc(this.playerData.actionTime, this.playerData.bldId);
            
            if (actionRet) {
                await this.showMessage(`PLAYER_ACTION_${actionRet}`, true);
                this.search.escapeBits |= FAHN_ESCAPE;
                
                for (let i = 0; i < PLANING_NR_PERSONS; i++) {
                    this.playerData.handlerEnded[i] = 1;
                }
            }
        }

        // Check spot detection (every 3 ticks, if dark)
        if (!(this.playerData.timer % 3) && this.playerData.isItDark) {
            // TODO: Port lsGuyInsideSpot()
            // This checks if any burglar is inside a guard patrol spot
        }

        // Execute actions for each person
        const burglarsNr = this.state.team.length;
        const personsNr = burglarsNr;  // TODO: Add guards

        for (let i = 0; i < personsNr; i++) {
            // Skip if handler ended
            if (i < burglarsNr && this.playerData.handlerEnded[i]) {
                continue;
            }

            // Get next action for this person
            const action = this.planningSystem.nextAction();
            if (!action) {
                continue;
            }

            this.playerData.action = action;

            // Execute action based on type
            await this.executeAction(i, action);
        }

        // TODO: Handle scrolling if needed
    }

    /**
     * Execute a single action
     * Port of action switch statement from plPlayerAction()
     */
    private async executeAction(personIndex: number, action: any): Promise<void> {
        if (!this.playerData || !this.search) return;

        const actionType = action.Type;

        // Set animation based on action type
        if (actionType !== ACTION_GO) {
            if (actionType === ACTION_SIGNAL) {
                // TODO: livAnimate(name, ANM_MAKE_CALL, 0, 0);
            } else {
                // TODO: plWork(personIndex);
            }
        }

        // Execute action
        switch (actionType) {
            case ACTION_GO:
                await this.executeActionGo(personIndex, action);
                break;

            case ACTION_WAIT:
                await this.executeActionWait(personIndex, action);
                break;

            case ACTION_SIGNAL:
                await this.executeActionSignal(personIndex, action);
                break;

            case ACTION_WAIT_SIGNAL:
                await this.executeActionWaitSignal(personIndex, action);
                break;

            case ACTION_USE:
                await this.executeActionUse(personIndex, action);
                break;

            case ACTION_OPEN:
                await this.executeActionOpen(personIndex, action);
                break;

            case ACTION_CLOSE:
                await this.executeActionClose(personIndex, action);
                break;

            case ACTION_TAKE:
                await this.executeActionTake(personIndex, action);
                break;

            case ACTION_DROP:
                await this.executeActionDrop(personIndex, action);
                break;

            default:
                console.warn(`[PlanningService] Unknown action type: ${actionType}`);
                break;
        }
    }

    /**
     * Execute GO action
     */
    private async executeActionGo(personIndex: number, action: any): Promise<void> {
        if (!this.playerData || !this.search) return;

        // Check exhaustion
        if (this.search.exhaust[personIndex] > PLANING_EXHAUST_MAX) {
            await this.unableToWork(personIndex, ACTION_EXHAUST);
            return;
        }

        // Move person
        const direction = action.Direction;
        // TODO: plMove(personIndex, direction);

        // Check if can walk
        // TODO: if (livCanWalk(name)) {
        //   Update loudness, exhaustion, walk time
        //   Handle scrolling if current person
        // } else {
        //   UnableToWork if in active area
        // }

        this.playerData.currLoudness[personIndex] = PLANING_LOUDNESS_STD;
        this.search.walkTime[personIndex]++;
    }

    /**
     * Execute WAIT action
     */
    private async executeActionWait(personIndex: number, action: any): Promise<void> {
        await this.unableToWork(personIndex, ACTION_WAIT);
    }

    /**
     * Execute SIGNAL action
     */
    private async executeActionSignal(personIndex: number, action: any): Promise<void> {
        if (!this.playerData || !this.search) return;

        this.playerData.currLoudness[personIndex] = PLANING_LOUDNESS_RADIO;

        // TODO: Check if action started
        // if (ActionStarted(plSys)) {
        //   Search.CallCount++;
        //   InitSignal(plSys, personId, receiverId);
        //   Check alarm by radio
        // }

        // TODO: Check if action ended
        // if (ActionEnded(plSys)) {
        //   CloseSignal(sig);
        // }

        this.search.callCount++;
    }

    /**
     * Execute WAIT_SIGNAL action
     */
    private async executeActionWaitSignal(personIndex: number, action: any): Promise<void> {
        // TODO: Check if signal received
        // if (IsSignal(plSys, senderId, receiverId)) {
        //   CloseSignal(sig);
        // } else {
        //   UnableToWork(personIndex, ACTION_WAIT_SIGNAL);
        // }

        await this.unableToWork(personIndex, ACTION_WAIT_SIGNAL);
    }

    /**
     * Execute USE action
     */
    private async executeActionUse(personIndex: number, action: any): Promise<void> {
        if (!this.search) return;

        this.search.workTime[personIndex]++;

        // TODO: Full implementation
        // - Check if stairs (area transition)
        // - Check if guard (combat)
        // - Check if object (tool usage)
        // - Update loudness
        // - Check alarms
        // - Update object state
    }

    /**
     * Execute OPEN action
     */
    private async executeActionOpen(personIndex: number, action: any): Promise<void> {
        if (!this.playerData) return;

        this.playerData.currLoudness[personIndex] = PLANING_LOUDNESS_OPEN_CLOSE;

        // TODO: Full implementation
        // - Check if locked
        // - Open object
        // - Update state
        // - Check alarms
    }

    /**
     * Execute CLOSE action
     */
    private async executeActionClose(personIndex: number, action: any): Promise<void> {
        if (!this.playerData) return;

        this.playerData.currLoudness[personIndex] = PLANING_LOUDNESS_OPEN_CLOSE;

        // TODO: Full implementation
        // - Close object
        // - Update state
    }

    /**
     * Execute TAKE action
     */
    private async executeActionTake(personIndex: number, action: any): Promise<void> {
        if (!this.search) return;

        this.search.workTime[personIndex]++;

        // TODO: Full implementation
        // - Take loot from container
        // - Update weight/volume
        // - Update container state
    }

    /**
     * Execute DROP action
     */
    private async executeActionDrop(personIndex: number, action: any): Promise<void> {
        if (!this.search) return;

        this.search.workTime[personIndex]++;

        // TODO: Full implementation
        // - Drop loot to bag
        // - Update weight/volume
        // - Update bag state
    }

    /**
     * Handle unable to work condition
     * Port of UnableToWork() from player.c
     */
    private async unableToWork(personIndex: number, actionType: number): Promise<void> {
        if (!this.playerData || !this.search) return;

        this.playerData.currLoudness[personIndex] = PLANING_LOUDNESS_STD;
        // TODO: Search.Exhaust[personIndex] = tcGuyIsWaiting(personId, exhaust);
        this.search.waitTime[personIndex]++;

        // TODO: livAnimate(name, ANM_STAND, 0, 0);

        // Show message if first time
        if (!this.playerData.unableToWork[personIndex]) {
            let messageKey = '';
            switch (actionType) {
                case ACTION_EXHAUST:
                    messageKey = 'PLAYER_UTW_EXHAUST';
                    break;
                case ACTION_GO:
                    messageKey = 'PLAYER_UTW_GO';
                    break;
                case ACTION_OPEN:
                    messageKey = 'PLAYER_UTW_OPEN';
                    break;
                case ACTION_CLOSE:
                    messageKey = 'PLAYER_UTW_CLOSE';
                    break;
            }

            if (messageKey) {
                await this.showMessage(messageKey, true);
            }

            this.playerData.unableToWork[personIndex] = 1;
        }

        // TODO: CheckSurrounding(personIndex);

        // Increase deviation time
        if (actionType !== ACTION_WAIT && actionType !== ACTION_WAIT_SIGNAL) {
            this.search.deriTime += 3;  // PLANING_DERI_UNABLE_TO_WORK

            if (!this.playerData.badPlaning) {
                await this.showMessage('PLAYER_BAD_PLANING', true);
                this.playerData.badPlaning = true;
            }
        }

        // Increment timer
        if (actionType !== ACTION_WAIT) {
            // TODO: IncCurrentTimer(plSys, 1, 0);
        }
    }

    /**
     * Handle person change menu
     */
    private async handlePersonChange(): Promise<void> {
        if (!this.state) return;

        await this.showMessage('CHANGE_PERSON_2', true);

        // Get list of team members
        const teamList = this.state.team.map((personId, index) => {
            const person = this.db.getObject(personId);
            return (person as any).Name || `Person ${index}`;
        });

        // Show selection menu
        const choice = await this.ui.showMenu(teamList, 0xFFFFFFFF, this.currentPerson);

        if (choice >= 0 && choice < teamList.length) {
            // TODO: Switch to selected person
            // - Change active area if needed
            // - Update handler
            // - Update active living
            this.currentPerson = choice;
            console.log(`[PlanningService] Switched to person ${choice}`);
        }
    }

    /**
     * Handle radio all menu
     */
    private async handleRadioAll(): Promise<void> {
        if (!this.search) return;

        await this.showMessage('PLAYER_RADIO_ALL', true);

        const radioOptions = this.text.getTextLines('PLAN_TXT', 'PLAYER_RADIO_1');
        const choice = await this.ui.showMenu(radioOptions, 0xFFFFFFFF, 0);

        if (choice >= 0 && choice < 2) {
            // TODO: Port tcCalcCallValue()
            this.search.callCount++;
        }
    }

    /**
     * Handle radio one menu
     */
    private async handleRadioOne(): Promise<void> {
        if (!this.state || !this.search) return;

        const burglarsNr = this.state.team.length;

        let targetPersonId = 0;

        if (burglarsNr > 2) {
            // Show person selection
            const teamList = this.state.team
                .filter((_, index) => index !== this.currentPerson)
                .map((personId) => {
                    const person = this.db.getObject(personId);
                    return (person as any).Name || `Person ${personId}`;
                });

            const choice = await this.ui.showMenu(teamList, 0xFFFFFFFF, 0);
            if (choice < 0) return;

            targetPersonId = this.state.team.filter((_, index) => index !== this.currentPerson)[choice];
        } else {
            // Only 2 people, select the other one
            targetPersonId = this.state.team[this.currentPerson === 0 ? 1 : 0];
        }

        // Show radio message options
        const radioOptions = this.text.getTextLines('PLAN_TXT', 'PLAYER_RADIO_2');
        const choice = await this.ui.showMenu(radioOptions, 0xFFFFFFFF, 0);

        if (choice >= 0 && choice < 3) {
            // TODO: Port tcCalcCallValue()
            this.search.callCount++;
        }
    }

    /**
     * Determine burglary result
     */
    private determineResult(): number {
        if (!this.search) return BURGLARY_FAILURE;

        // Check escape bits
        if (this.search.escapeBits & FAHN_SURROUNDED) {
            return BURGLARY_SURROUNDED;
        }

        if (this.search.escapeBits & FAHN_ESCAPE) {
            return BURGLARY_ESCAPE;
        }

        // TODO: Check if all team members are at car
        // TODO: Handle loot transfer
        // TODO: Calculate escape time

        return BURGLARY_SUCCESS;
    }

    /**
     * Display timer
     */
    private displayTimer(time: number, refresh: boolean): void {
        if (!this.playerData) return;

        // Convert time to hours and minutes
        const hours = Math.floor(time / 60);
        const minutes = time % 60;
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        // TODO: Display on screen at fixed position
        // For now, log periodically
        if (refresh || time % 10 === 0) {
            console.log(`[PlanningService] Time: ${timeStr} (${time}s)`);
        }
    }

    /**
     * Display info
     */
    private displayInfo(): void {
        if (!this.playerData || !this.search || !this.state) return;

        // Calculate total weight and volume
        let totalWeight = 0;
        let totalVolume = 0;
        const burglarsNr = this.state.team.length;

        for (let i = 0; i < burglarsNr; i++) {
            // TODO: Get actual weight/volume from person
            // totalWeight += Planing_Weight[i];
            // totalVolume += Planing_Volume[i];
        }

        // Get current loudness
        const currentLoudness = this.playerData.currLoudness[this.currentPerson];

        // TODO: Display on screen at fixed position
        // For now, log periodically
        if (this.playerData.timer % 30 === 0) {
            console.log(`[PlanningService] Info - Weight: ${totalWeight}, Volume: ${totalVolume}, Loudness: ${currentLoudness}`);
        }
    }

    /**
     * Show message
     */
    private async showMessage(key: string, refresh: boolean): Promise<void> {
        const lines = this.text.getTextLines('PLAN_TXT', key);
        if (lines.length > 0) {
            await this.ui.showBubble(lines, 'think', 0);
        }
    }

    /**
     * Cleanup after execution
     */
    private async cleanupExecution(): Promise<void> {
        // TODO: Port plUnprepareSys(), plUnprepareGfx(), plUnprepareRel()
        console.log('[PlanningService] Cleaning up execution');
        this.playerData = null;
        this.search = null;
    }

    /**
     * Check if a plan exists for a building
     */
    hasPlan(buildingId: number): boolean {
        // TODO: Check if plan file exists
        return false;
    }

    /**
     * Load a plan for a building
     * Port of plLoad() from io.c
     */
    async loadPlan(buildingId: number): Promise<boolean> {
        console.log(`[PlanningService] Loading plan for building ${buildingId}`);

        if (!this.state) {
            console.error('No active planning state');
            return false;
        }

        // TODO: Load plan from file system
        // For now, just show a message
        await this.ui.showBubble(['Plan loading not yet implemented'], 'think', 0);

        return false;
    }

    /**
     * Save a plan for a building
     * Port of plSave() from io.c
     */
    async savePlan(buildingId: number): Promise<boolean> {
        console.log(`[PlanningService] Saving plan for building ${buildingId}`);

        if (!this.state) {
            console.error('No active planning state');
            return false;
        }

        // Generate save data
        let saveData = '';

        // Save system
        saveData += this.system.saveSystem();

        // Save handlers
        for (const personId of this.state.team) {
            saveData += this.system.saveHandler(personId);
        }

        // TODO: Write to file system
        console.log('[PlanningService] Plan data:', saveData);

        await this.ui.showBubble(['Plan saved'], 'think', 0);

        return true;
    }

    /**
     * Clear the current plan
     */
    clearPlan(): void {
        if (this.state) {
            this.state.team = [];
            this.state.tools = [];
            this.state.car = null;
            this.state.plan = [];
        }
    }

    /**
     * Get current planning state
     */
    getState(): PlanningState | null {
        return this.state;
    }

    /**
     * Check if planning is active
     */
    isActive(): boolean {
        return this.state !== null;
    }

    /**
     * Wait for user input
     * Helper for action implementations
     */
    private async waitForInput(validInputs: string[]): Promise<string> {
        return new Promise((resolve) => {
            const handleInput = (input: string) => {
                if (validInputs.includes(input)) {
                    resolve(input);
                }
            };

            // Set up input listeners
            // This is a simplified version - in real implementation would use Phaser input
            this.scene.input.keyboard?.once('keydown', (event: KeyboardEvent) => {
                const key = event.key.toLowerCase();
                if (key === 'arrowleft') handleInput('left');
                else if (key === 'arrowright') handleInput('right');
                else if (key === 'arrowup') handleInput('up');
                else if (key === 'arrowdown') handleInput('down');
                else if (key === 'escape') handleInput('escape');
            });

            this.scene.input.once('pointerdown', () => {
                handleInput('click');
            });
        });
    }

    /**
     * Remove last action from current handler
     * Port of plRemLastAction() from planer.c
     */
    private removeLastAction(): boolean {
        if (!this.planningSystem.isHandlerCleared()) {
            const action = this.planningSystem.getCurrentAction();
            if (action) {
                // Sync back to before this action
                this.sync(
                    false,
                    this.planningSystem.getMaxTimer() - action.timeNeeded,
                    action.timeNeeded,
                    false
                );

                // Reset active living
                // TODO: Get person name from state
                // this.landscape.setActivLiving(personName, -1, -1);

                this.planningSystem.remLastAction();

                this.displayTimer(false);
                this.displayInfo();

                return true;
            }
        }

        return false;
    }

    /**
     * Synchronize animation and time
     * Port of plSync() from sync.c
     */
    private async sync(animate: boolean, maxTimer: number, time: number, forward: boolean): Promise<void> {
        // TODO: Full implementation
        // For now, just update timer
        if (forward) {
            this.planningSystem.incCurrentTimer(time, true);
        }
    }

    /**
     * Show a message to the player
     * Port of plMessage() from planer.c
     */
    private showMessage(key: string, refresh: boolean): void {
        // TODO: Get text from PLAN_TXT and display
        console.log(`[PlanningService] Message: ${key}`);
    }

    /**
     * Show a dialog from the player
     * Port of plSay() from planer.c
     */
    private async say(key: string, personIndex: number): Promise<void> {
        // TODO: Get text and show dialog
        await this.ui.showBubble([`Say: ${key}`], 'say', 0);
    }
}
