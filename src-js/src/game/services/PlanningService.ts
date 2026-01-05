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
import { PlanningSystemService, ActionType } from './PlanningSystemService';
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
                    if (!currentAction || currentAction.type !== ActionType.GO) {
                        const newAction = this.planningSystem.initAction(
                            ActionType.GO,
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
                                ActionType.GO,
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
     * Use action
     */
    private async actionUse(): Promise<void> {
        // TODO: Implement use action
        await this.ui.showBubble(['Use action not yet implemented'], 'think', 0);
    }

    /**
     * Open action
     */
    private async actionOpen(): Promise<void> {
        // TODO: Implement open action
        await this.ui.showBubble(['Open action not yet implemented'], 'think', 0);
    }

    /**
     * Close action
     */
    private async actionClose(): Promise<void> {
        // TODO: Implement close action
        await this.ui.showBubble(['Close action not yet implemented'], 'think', 0);
    }

    /**
     * Take action
     */
    private async actionTake(): Promise<void> {
        // TODO: Implement take action
        await this.ui.showBubble(['Take action not yet implemented'], 'think', 0);
    }

    /**
     * Drop action
     */
    private async actionDrop(): Promise<void> {
        // TODO: Implement drop action
        await this.ui.showBubble(['Drop action not yet implemented'], 'think', 0);
    }

    /**
     * Wait action
     */
    private async actionWait(): Promise<void> {
        // TODO: Implement wait action
        await this.ui.showBubble(['Wait action not yet implemented'], 'think', 0);
    }

    /**
     * Radio action
     */
    private async actionRadio(): Promise<void> {
        // TODO: Implement radio action
        await this.ui.showBubble(['Radio action not yet implemented'], 'think', 0);
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
    async player(
        buildingId: number,
        actionTime: number = 0,
        actionFunc: ((objId: number, time: number) => boolean) | null = null
    ): Promise<number> {
        console.log(`[PlanningService] Executing burglary for building ${buildingId}`);

        // TODO: Full implementation
        // This requires:
        // 1. Load saved plan
        // 2. Initialize landscape
        // 3. Place team members
        // 4. Execute actions in sequence
        // 5. Handle guards
        // 6. Handle alarms
        // 7. Handle police
        // 8. Track loot
        // 9. Track time
        // 10. Determine success/failure

        // For now, show a placeholder message and return success
        await this.ui.showBubble(
            ['Burglary execution not yet implemented.', 'Assuming success for now.'],
            'think',
            0
        );

        return BURGLARY_SUCCESS;
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
