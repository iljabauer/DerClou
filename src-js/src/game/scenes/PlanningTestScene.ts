/**
 * Planning Test Scene
 * Tests the planning system functionality
 */

import Phaser from 'phaser';
import { Database } from '../core/Database';
import { DataLoader } from '../services/DataLoader';
import { TextService } from '../services/TextService';
import { UIService } from '../services/UIService';
import { LandscapeService } from '../services/LandscapeService';
import { PlanningService } from '../services/PlanningService';
import { PlanningSystemService, ACTION_GO, ACTION_WAIT, ACTION_USE, DIRECTION_RIGHT } from '../services/PlanningSystemService';

export class PlanningTestScene extends Phaser.Scene {
    private db!: Database;
    private dataLoader!: DataLoader;
    private text!: TextService;
    private ui!: UIService;
    private landscape!: LandscapeService;
    private planning!: PlanningService;
    private planningSystem!: PlanningSystemService;

    constructor() {
        super({ key: 'PlanningTestScene' });
    }

    async create() {
        console.log('[PlanningTestScene] Starting planning system tests...');

        // Initialize services
        this.db = new Database();
        this.dataLoader = new DataLoader(this.db, this);
        this.text = new TextService(this);
        this.ui = new UIService(this.db, this, this.text);
        this.landscape = new LandscapeService(this.db, this);
        this.planning = new PlanningService(this.db, this, this.ui, this.text, this.landscape);
        this.planningSystem = new PlanningSystemService(this.db);

        // Load data
        console.log('[PlanningTestScene] Loading game data...');
        await this.dataLoader.loadAllData();

        // Run tests
        await this.runTests();

        console.log('[PlanningTestScene] All tests complete!');
    }

    private async runTests() {
        console.log('\n=== Planning System Tests ===\n');

        await this.testPlanningSystem();
        await this.testHandlers();
        await this.testActions();
        await this.testSignals();
        await this.testSaveLoad();

        console.log('\n=== All Planning System Tests Passed ===\n');
    }

    /**
     * Test basic planning system initialization
     */
    private async testPlanningSystem() {
        console.log('[Test] Planning System Initialization');

        // Initialize system
        const system = this.planningSystem.initSystem();
        console.log('✓ System initialized');

        // Check system state
        const systemState = this.planningSystem.getSystem();
        if (!systemState) {
            throw new Error('System not initialized');
        }
        console.log('✓ System state accessible');

        // Close system
        this.planningSystem.closeSystem();
        console.log('✓ System closed');

        console.log('[Test] Planning System Initialization - PASSED\n');
    }

    /**
     * Test handler management
     */
    private async testHandlers() {
        console.log('[Test] Handler Management');

        // Initialize system
        this.planningSystem.initSystem();

        // Create handlers
        const handler1 = this.planningSystem.initHandler(1001);
        console.log('✓ Handler 1 created:', handler1.id);

        const handler2 = this.planningSystem.initHandler(1002);
        console.log('✓ Handler 2 created:', handler2.id);

        // Find handlers
        const found1 = this.planningSystem.findHandler(1001);
        if (!found1 || found1.id !== 1001) {
            throw new Error('Handler 1 not found');
        }
        console.log('✓ Handler 1 found');

        const found2 = this.planningSystem.findHandler(1002);
        if (!found2 || found2.id !== 1002) {
            throw new Error('Handler 2 not found');
        }
        console.log('✓ Handler 2 found');

        // Set active handler
        this.planningSystem.setActivHandler(1001);
        const active = this.planningSystem.getActivHandler();
        if (!active || active.id !== 1001) {
            throw new Error('Active handler not set correctly');
        }
        console.log('✓ Active handler set to:', active.id);

        // Clear handler
        this.planningSystem.clearHandler(1001);
        if (handler1.actions.length !== 0) {
            throw new Error('Handler not cleared');
        }
        console.log('✓ Handler cleared');

        // Close handler
        this.planningSystem.closeHandler(1002);
        const notFound = this.planningSystem.findHandler(1002);
        if (notFound) {
            throw new Error('Handler not closed');
        }
        console.log('✓ Handler closed');

        // Cleanup
        this.planningSystem.closeSystem();

        console.log('[Test] Handler Management - PASSED\n');
    }

    /**
     * Test action management
     */
    private async testActions() {
        console.log('[Test] Action Management');

        // Initialize system
        this.planningSystem.initSystem();
        this.planningSystem.initHandler(1001);
        this.planningSystem.setActivHandler(1001);

        // Add actions
        const action1 = this.planningSystem.initAction(ACTION_GO, DIRECTION_RIGHT, 0, 10);
        if (!action1 || action1.type !== ACTION_GO) {
            throw new Error('Action 1 not created');
        }
        console.log('✓ GO action created');

        const action2 = this.planningSystem.initAction(ACTION_WAIT, 0, 0, 5);
        if (!action2 || action2.type !== ACTION_WAIT) {
            throw new Error('Action 2 not created');
        }
        console.log('✓ WAIT action created');

        const action3 = this.planningSystem.initAction(ACTION_USE, 2001, 3001, 8);
        if (!action3 || action3.type !== ACTION_USE) {
            throw new Error('Action 3 not created');
        }
        console.log('✓ USE action created');

        // Navigate actions
        const first = this.planningSystem.goFirstAction();
        if (!first || first.type !== ACTION_GO) {
            throw new Error('First action not correct');
        }
        console.log('✓ Go to first action');

        const next = this.planningSystem.nextAction();
        if (!next || next.type !== ACTION_WAIT) {
            throw new Error('Next action not correct');
        }
        console.log('✓ Go to next action');

        const last = this.planningSystem.goLastAction();
        if (!last || last.type !== ACTION_USE) {
            throw new Error('Last action not correct');
        }
        console.log('✓ Go to last action');

        const prev = this.planningSystem.prevAction();
        if (!prev || prev.type !== ACTION_WAIT) {
            throw new Error('Previous action not correct');
        }
        console.log('✓ Go to previous action');

        // Remove last action
        this.planningSystem.remLastAction();
        const handler = this.planningSystem.getActivHandler();
        if (!handler || handler.actions.length !== 2) {
            throw new Error('Last action not removed');
        }
        console.log('✓ Remove last action');

        // Cleanup
        this.planningSystem.closeSystem();

        console.log('[Test] Action Management - PASSED\n');
    }

    /**
     * Test signal management
     */
    private async testSignals() {
        console.log('[Test] Signal Management');

        // Initialize system
        this.planningSystem.initSystem();

        // Create signal
        const signal = this.planningSystem.initSignal(1001, 1002);
        console.log('✓ Signal created:', signal.senderId, '->', signal.receiverId);

        // Check signal exists
        const found = this.planningSystem.isSignal(1001, 1002);
        if (!found) {
            throw new Error('Signal not found');
        }
        console.log('✓ Signal found');

        // Close signal
        this.planningSystem.closeSignal(signal);
        const notFound = this.planningSystem.isSignal(1001, 1002);
        if (notFound) {
            throw new Error('Signal not closed');
        }
        console.log('✓ Signal closed');

        // Cleanup
        this.planningSystem.closeSystem();

        console.log('[Test] Signal Management - PASSED\n');
    }

    /**
     * Test save/load functionality
     */
    private async testSaveLoad() {
        console.log('[Test] Save/Load Functionality');

        // Initialize system
        this.planningSystem.initSystem();

        // Create handlers with actions
        this.planningSystem.initHandler(1001);
        this.planningSystem.setActivHandler(1001);
        this.planningSystem.initAction(ACTION_GO, DIRECTION_RIGHT, 0, 10);
        this.planningSystem.initAction(ACTION_WAIT, 0, 0, 5);

        this.planningSystem.initHandler(1002);
        this.planningSystem.setActivHandler(1002);
        this.planningSystem.initAction(ACTION_USE, 2001, 3001, 8);

        // Save system
        const systemData = this.planningSystem.saveSystem();
        console.log('✓ System saved');
        console.log('  System data:', systemData.substring(0, 50) + '...');

        // Save handlers
        const handler1Data = this.planningSystem.saveHandler(1001);
        console.log('✓ Handler 1 saved');
        console.log('  Handler 1 data:', handler1Data.substring(0, 50) + '...');

        const handler2Data = this.planningSystem.saveHandler(1002);
        console.log('✓ Handler 2 saved');
        console.log('  Handler 2 data:', handler2Data.substring(0, 50) + '...');

        // Clear system
        this.planningSystem.closeSystem();
        this.planningSystem.initSystem();

        // Load system
        const missingPersons = this.planningSystem.loadSystem(systemData);
        console.log('✓ System loaded, missing persons:', missingPersons.length);

        // Recreate handlers for loading
        this.planningSystem.initHandler(1001);
        this.planningSystem.initHandler(1002);

        // Load handlers
        const loaded1 = this.planningSystem.loadHandler(handler1Data, 1001);
        if (!loaded1) {
            throw new Error('Handler 1 not loaded');
        }
        console.log('✓ Handler 1 loaded');

        const loaded2 = this.planningSystem.loadHandler(handler2Data, 1002);
        if (!loaded2) {
            throw new Error('Handler 2 not loaded');
        }
        console.log('✓ Handler 2 loaded');

        // Verify loaded data
        const handler1 = this.planningSystem.findHandler(1001);
        if (!handler1 || handler1.actions.length !== 2) {
            throw new Error('Handler 1 actions not loaded correctly');
        }
        console.log('✓ Handler 1 actions verified:', handler1.actions.length);

        const handler2 = this.planningSystem.findHandler(1002);
        if (!handler2 || handler2.actions.length !== 1) {
            throw new Error('Handler 2 actions not loaded correctly');
        }
        console.log('✓ Handler 2 actions verified:', handler2.actions.length);

        // Cleanup
        this.planningSystem.closeSystem();

        console.log('[Test] Save/Load Functionality - PASSED\n');
    }
}
