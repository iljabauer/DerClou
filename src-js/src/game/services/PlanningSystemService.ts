/**
 * Planning System Service - Port of planing/system.c
 * Core planning system with handlers, actions, and signals
 * 
 * This implements the "kernel" of the planning system:
 * - System: Main container
 * - Handler: Represents a person with actions
 * - Action: Individual planned actions
 * - Signal: Communication between handlers
 */

import { Database } from '../core/Database';

// Action types
export const ACTION_GO = 1;
export const ACTION_WAIT = 2;
export const ACTION_SIGNAL = 3;
export const ACTION_WAIT_SIGNAL = 4;
export const ACTION_USE = 5;
export const ACTION_TAKE = 6;
export const ACTION_DROP = 7;
export const ACTION_OPEN = 8;
export const ACTION_CLOSE = 9;
export const ACTION_CONTROL = 10;

// Directions for ACTION_GO
export const DIRECTION_NO = 0;
export const DIRECTION_LEFT = 1;
export const DIRECTION_RIGHT = 2;
export const DIRECTION_UP = 4;
export const DIRECTION_DOWN = 8;

// Signal types
export const SIGNAL_HURRY_UP = 1;
export const SIGNAL_DONE = 2;
export const SIGNAL_ESCAPE = 3;

// Handler flags
export const SHF_NORMAL = 0;
export const SHF_AUTOREVERS = 1 << 0;

// Base action structure
export interface Action {
    type: number;
    timeNeeded: number;  // Time in seconds/3
    timer: number;
    data?: ActionData;
}

// Action data types
export type ActionData =
    | ActionGoData
    | ActionSignalData
    | ActionWaitSignalData
    | ActionUseData
    | ActionTakeData
    | ActionDropData
    | ActionOpenData
    | ActionCloseData
    | ActionControlData;

export interface ActionGoData {
    direction: number;
}

export interface ActionSignalData {
    receiverId: number;
}

export interface ActionWaitSignalData {
    senderId: number;
}

export interface ActionUseData {
    itemId: number;
    toolId: number;
}

export interface ActionTakeData {
    itemId: number;
    lootId: number;
}

export interface ActionDropData {
    itemId: number;
    lootId: number;
}

export interface ActionOpenData {
    itemId: number;
}

export interface ActionCloseData {
    itemId: number;
}

export interface ActionControlData {
    itemId: number;
}

// Handler structure
export interface Handler {
    id: number;
    timer: number;
    flags: number;
    actions: Action[];
    currentActionIndex: number;
}

// Signal structure
export interface PlSignal {
    senderId: number;
    receiverId: number;
}

// System structure
export interface PlanningSystem {
    handlers: Handler[];
    signals: PlSignal[];
    activHandlerId: number | null;
}

export class PlanningSystemService {
    private db: Database;
    private system: PlanningSystem | null = null;
    private usedMem: number = 0;

    constructor(db: Database) {
        this.db = db;
    }

    /**
     * Initialize system for use
     * Port of InitSystem() from system.c
     */
    initSystem(): PlanningSystem {
        this.system = {
            handlers: [],
            signals: [],
            activHandlerId: null,
        };

        this.usedMem = 0;

        return this.system;
    }

    /**
     * Close system immediately
     * Port of CloseSystem() from system.c
     */
    closeSystem(): void {
        if (this.system) {
            this.system.handlers = [];
            this.system.signals = [];
            this.system.activHandlerId = null;
            this.system = null;
        }

        this.usedMem = 0;
    }

    /**
     * Find handler by ID
     * Port of FindHandler() from system.c
     */
    findHandler(id: number): Handler | null {
        if (!this.system) return null;

        return this.system.handlers.find(h => h.id === id) || null;
    }

    /**
     * Set active handler
     * Port of SetActivHandler() from system.c
     */
    setActivHandler(id: number): void {
        if (!this.system) return;

        const handler = this.findHandler(id);
        if (handler) {
            this.system.activHandlerId = id;
        } else {
            this.system.activHandlerId = null;
        }
    }

    /**
     * Get active handler
     */
    getActivHandler(): Handler | null {
        if (!this.system || this.system.activHandlerId === null) return null;
        return this.findHandler(this.system.activHandlerId);
    }

    /**
     * Initialize handler
     * Port of InitHandler() from system.c
     */
    initHandler(id: number, flags: number = SHF_NORMAL): Handler {
        if (!this.system) {
            throw new Error('System not initialized');
        }

        // Check if handler already exists
        let handler = this.findHandler(id);
        if (handler) {
            return handler;
        }

        // Create new handler
        handler = {
            id,
            timer: 0,
            flags,
            actions: [],
            currentActionIndex: -1,
        };

        this.system.handlers.push(handler);

        return handler;
    }

    /**
     * Close handler
     * Port of CloseHandler() from system.c
     */
    closeHandler(id: number): void {
        if (!this.system) return;

        const index = this.system.handlers.findIndex(h => h.id === id);
        if (index !== -1) {
            this.system.handlers.splice(index, 1);
        }

        if (this.system.activHandlerId === id) {
            this.system.activHandlerId = null;
        }
    }

    /**
     * Clear handler's action list
     * Port of ClearHandler() from system.c
     */
    clearHandler(id: number): Handler | null {
        const handler = this.findHandler(id);
        if (handler) {
            handler.actions = [];
            handler.currentActionIndex = -1;
            handler.timer = 0;
        }
        return handler;
    }

    /**
     * Check if handler is cleared (has no actions)
     * Port of IsHandlerCleared() from system.c
     */
    isHandlerCleared(): boolean {
        const handler = this.getActivHandler();
        if (!handler) return true;
        return handler.actions.length === 0;
    }

    /**
     * Initialize action
     * Port of InitAction() from system.c
     */
    initAction(
        type: number,
        data1: number,
        data2: number,
        time: number
    ): Action | null {
        const handler = this.getActivHandler();
        if (!handler) {
            console.error('No active handler');
            return null;
        }

        // Create action based on type
        const action: Action = {
            type,
            timeNeeded: time,
            timer: 0,
        };

        // Add type-specific data
        switch (type) {
            case ACTION_GO:
                action.data = { direction: data1 } as ActionGoData;
                break;
            case ACTION_WAIT:
                // No additional data
                break;
            case ACTION_SIGNAL:
                action.data = { receiverId: data1 } as ActionSignalData;
                break;
            case ACTION_WAIT_SIGNAL:
                action.data = { senderId: data1 } as ActionWaitSignalData;
                break;
            case ACTION_USE:
                action.data = { itemId: data1, toolId: data2 } as ActionUseData;
                break;
            case ACTION_TAKE:
                action.data = { itemId: data1, lootId: data2 } as ActionTakeData;
                break;
            case ACTION_DROP:
                action.data = { itemId: data1, lootId: data2 } as ActionDropData;
                break;
            case ACTION_OPEN:
                action.data = { itemId: data1 } as ActionOpenData;
                break;
            case ACTION_CLOSE:
                action.data = { itemId: data1 } as ActionCloseData;
                break;
            case ACTION_CONTROL:
                action.data = { itemId: data1 } as ActionControlData;
                break;
            default:
                console.error('Unknown action type:', type);
                return null;
        }

        // Add action to handler
        handler.actions.push(action);

        return action;
    }

    /**
     * Get current action
     * Port of CurrentAction() from system.c
     */
    currentAction(): Action | null {
        const handler = this.getActivHandler();
        if (!handler || handler.currentActionIndex < 0 || handler.currentActionIndex >= handler.actions.length) {
            return null;
        }
        return handler.actions[handler.currentActionIndex];
    }

    /**
     * Go to first action
     * Port of GoFirstAction() from system.c
     */
    goFirstAction(): Action | null {
        const handler = this.getActivHandler();
        if (!handler || handler.actions.length === 0) {
            return null;
        }
        handler.currentActionIndex = 0;
        return handler.actions[0];
    }

    /**
     * Go to last action
     * Port of GoLastAction() from system.c
     */
    goLastAction(): Action | null {
        const handler = this.getActivHandler();
        if (!handler || handler.actions.length === 0) {
            return null;
        }
        handler.currentActionIndex = handler.actions.length - 1;
        return handler.actions[handler.currentActionIndex];
    }

    /**
     * Go to next action
     * Port of NextAction() from system.c
     */
    nextAction(): Action | null {
        const handler = this.getActivHandler();
        if (!handler || handler.currentActionIndex >= handler.actions.length - 1) {
            return null;
        }
        handler.currentActionIndex++;
        return handler.actions[handler.currentActionIndex];
    }

    /**
     * Go to previous action
     * Port of PrevAction() from system.c
     */
    prevAction(): Action | null {
        const handler = this.getActivHandler();
        if (!handler || handler.currentActionIndex <= 0) {
            return null;
        }
        handler.currentActionIndex--;
        return handler.actions[handler.currentActionIndex];
    }

    /**
     * Check if action has started
     * Port of ActionStarted() from system.c
     */
    actionStarted(): boolean {
        const handler = this.getActivHandler();
        if (!handler) return false;
        return handler.currentActionIndex >= 0;
    }

    /**
     * Check if action has ended
     * Port of ActionEnded() from system.c
     */
    actionEnded(): boolean {
        const handler = this.getActivHandler();
        if (!handler) return true;
        return handler.currentActionIndex >= handler.actions.length;
    }

    /**
     * Remove last action
     * Port of RemLastAction() from system.c
     */
    remLastAction(): void {
        const handler = this.getActivHandler();
        if (!handler || handler.actions.length === 0) {
            return;
        }

        handler.actions.pop();

        // Adjust current action index if needed
        if (handler.currentActionIndex >= handler.actions.length) {
            handler.currentActionIndex = handler.actions.length - 1;
        }
    }

    /**
     * Ignore current action (skip it)
     * Port of IgnoreAction() from system.c
     */
    ignoreAction(): void {
        const handler = this.getActivHandler();
        if (!handler) return;

        // Move to next action
        if (handler.currentActionIndex < handler.actions.length - 1) {
            handler.currentActionIndex++;
        }
    }

    /**
     * Initialize signal
     * Port of InitSignal() from system.c
     */
    initSignal(senderId: number, receiverId: number): PlSignal {
        if (!this.system) {
            throw new Error('System not initialized');
        }

        const signal: PlSignal = {
            senderId,
            receiverId,
        };

        this.system.signals.push(signal);

        return signal;
    }

    /**
     * Close signal
     * Port of CloseSignal() from system.c
     */
    closeSignal(signal: PlSignal): void {
        if (!this.system) return;

        const index = this.system.signals.findIndex(
            s => s.senderId === signal.senderId && s.receiverId === signal.receiverId
        );

        if (index !== -1) {
            this.system.signals.splice(index, 1);
        }
    }

    /**
     * Check if signal exists
     * Port of IsSignal() from system.c
     */
    isSignal(senderId: number, receiverId: number): PlSignal | null {
        if (!this.system) return null;

        return this.system.signals.find(
            s => s.senderId === senderId && s.receiverId === receiverId
        ) || null;
    }

    /**
     * Get current timer
     * Port of CurrentTimer() from system.c
     */
    currentTimer(): number {
        const handler = this.getActivHandler();
        return handler?.timer || 0;
    }

    /**
     * Increment current timer
     * Port of IncCurrentTimer() from system.c
     */
    incCurrentTimer(time: number, alsoTime: boolean): void {
        const handler = this.getActivHandler();
        if (!handler) return;

        handler.timer += time;

        if (alsoTime) {
            const action = this.currentAction();
            if (action) {
                action.timer += time;
            }
        }
    }

    /**
     * Get maximum timer across all handlers
     * Port of GetMaxTimer() from system.c
     */
    getMaxTimer(): number {
        if (!this.system) return 0;

        let maxTimer = 0;
        for (const handler of this.system.handlers) {
            if (handler.timer > maxTimer) {
                maxTimer = handler.timer;
            }
        }

        return maxTimer;
    }

    /**
     * Get used memory
     * Port of plGetUsedMem() from system.c
     */
    getUsedMem(): number {
        return this.usedMem;
    }

    /**
     * Reset memory counter
     * Port of ResetMem() from system.c
     */
    resetMem(): void {
        this.usedMem = 0;
    }

    /**
     * Get current system
     */
    getSystem(): PlanningSystem | null {
        return this.system;
    }

    /**
     * Save system to string (for file save)
     * Port of SaveSystem() from system.c
     */
    saveSystem(): string {
        if (!this.system) return '';

        let output = 'SYS \n';

        for (const handler of this.system.handlers) {
            output += `HAND\n${handler.id}\n`;
        }

        return output;
    }

    /**
     * Save handler to string (for file save)
     * Port of SaveHandler() from system.c
     */
    saveHandler(id: number): string {
        const handler = this.findHandler(id);
        if (!handler) return '';

        let output = `ACLI\n${handler.id}\n`;

        for (const action of handler.actions) {
            output += `ACTI\n${action.type}\n${action.timeNeeded}\n`;

            // Save action-specific data
            switch (action.type) {
                case ACTION_GO:
                    const goData = action.data as ActionGoData;
                    output += `${goData.direction}\n`;
                    break;
                case ACTION_SIGNAL:
                    const signalData = action.data as ActionSignalData;
                    output += `${signalData.receiverId}\n`;
                    break;
                case ACTION_WAIT_SIGNAL:
                    const waitSignalData = action.data as ActionWaitSignalData;
                    output += `${waitSignalData.senderId}\n`;
                    break;
                case ACTION_USE:
                    const useData = action.data as ActionUseData;
                    output += `${useData.itemId}\n${useData.toolId}\n`;
                    break;
                case ACTION_TAKE:
                    const takeData = action.data as ActionTakeData;
                    output += `${takeData.itemId}\n${takeData.lootId}\n`;
                    break;
                case ACTION_DROP:
                    const dropData = action.data as ActionDropData;
                    output += `${dropData.itemId}\n${dropData.lootId}\n`;
                    break;
                case ACTION_OPEN:
                    const openData = action.data as ActionOpenData;
                    output += `${openData.itemId}\n`;
                    break;
                case ACTION_CLOSE:
                    const closeData = action.data as ActionCloseData;
                    output += `${closeData.itemId}\n`;
                    break;
                case ACTION_CONTROL:
                    const controlData = action.data as ActionControlData;
                    output += `${controlData.itemId}\n`;
                    break;
            }
        }

        return output;
    }

    /**
     * Load system from string (for file load)
     * Port of LoadSystem() from system.c
     * 
     * Returns list of missing persons if any
     */
    loadSystem(data: string): number[] {
        if (!this.system) {
            throw new Error('System not initialized');
        }

        const lines = data.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const missingPersons: number[] = [];

        let i = 0;
        if (lines[i] !== 'SYS') {
            console.error('Invalid system file format');
            return missingPersons;
        }
        i++;

        while (i < lines.length) {
            if (lines[i] !== 'HAND') break;
            i++;

            if (i >= lines.length) break;

            const handlerId = parseInt(lines[i], 10);
            i++;

            if (handlerId && !this.db.getObject(handlerId)) {
                // Handler ID is invalid or person doesn't exist
                missingPersons.push(handlerId);
            } else if (!this.findHandler(handlerId)) {
                // Handler doesn't exist in system
                missingPersons.push(handlerId);
            }
        }

        return missingPersons;
    }

    /**
     * Load handler from string (for file load)
     * Port of LoadHandler() from system.c
     */
    loadHandler(data: string, id: number): boolean {
        const handler = this.findHandler(id);
        if (!handler) {
            console.error('Handler not found:', id);
            return false;
        }

        const lines = data.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        let i = 0;
        if (lines[i] !== 'ACLI') {
            console.error('Invalid handler file format');
            return false;
        }
        i++;

        if (i >= lines.length) return false;

        const handlerId = parseInt(lines[i], 10);
        i++;

        if (handlerId !== id) {
            console.error('Handler ID mismatch');
            return false;
        }

        // Clear existing actions
        handler.actions = [];

        // Load actions
        while (i < lines.length) {
            if (lines[i] !== 'ACTI') break;
            i++;

            if (i + 1 >= lines.length) break;

            const actionType = parseInt(lines[i], 10);
            i++;

            const timeNeeded = parseInt(lines[i], 10);
            i++;

            // Read action-specific data
            let data1 = 0;
            let data2 = 0;

            switch (actionType) {
                case ACTION_GO:
                case ACTION_SIGNAL:
                case ACTION_WAIT_SIGNAL:
                case ACTION_OPEN:
                case ACTION_CLOSE:
                case ACTION_CONTROL:
                    if (i < lines.length) {
                        data1 = parseInt(lines[i], 10);
                        i++;
                    }
                    break;
                case ACTION_USE:
                case ACTION_TAKE:
                case ACTION_DROP:
                    if (i + 1 < lines.length) {
                        data1 = parseInt(lines[i], 10);
                        i++;
                        data2 = parseInt(lines[i], 10);
                        i++;
                    }
                    break;
                case ACTION_WAIT:
                    // No additional data
                    break;
            }

            // Create action
            this.setActivHandler(id);
            this.initAction(actionType, data1, data2, timeNeeded);
        }

        return true;
    }
}
