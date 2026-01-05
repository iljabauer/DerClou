/**
 * Interaction Service - Port of src/gameplay/gp_app.c StdDone() and StdHandle()
 * 
 * Provides the main action menu and handles player interactions.
 * This is the core game loop that presents choices to the player.
 */

import { Database } from '../core/Database';
import { UIService, MenuItem, GET_OUT } from './UIService';
import { TextService } from './TextService';
import { SceneService } from './SceneService';
import { DialogService } from './DialogService';
import { FilmService } from './FilmService';
import {
    GO, WAIT, BUSINESS_TALK, LOOK, INVESTIGATE, PLAN, CALL_TAXI, MAKE_CALL, INFO,
    MENU_TXT, THECLOU_TXT,
    Person_Matt_Stuvysunt,
    Environment_TheClou
} from '../types/GameConstants';

export interface InteractionOptions {
    possibilities: number;  // Bitmask of available actions
    currentLocation: number;
    onAction?: (action: number) => void;
}

/**
 * InteractionService handles the main game loop and player actions
 */
export class InteractionService {
    private scene: Phaser.Scene;
    private db: Database;
    private ui: UIService;
    private text: TextService;
    private sceneService: SceneService;
    private dialog: DialogService;
    private film: FilmService;

    constructor(
        scene: Phaser.Scene,
        db: Database,
        ui: UIService,
        text: TextService,
        sceneService: SceneService,
        dialog: DialogService,
        film: FilmService
    ) {
        this.scene = scene;
        this.db = db;
        this.ui = ui;
        this.text = text;
        this.sceneService = sceneService;
        this.dialog = dialog;
        this.film = film;
    }

    /**
     * Show the main action menu and handle player choice
     * Port of StdDone() from gp_app.c
     * 
     * @param options Interaction options including available actions
     * @returns The next scene/event number
     */
    async showActionMenu(options: InteractionOptions): Promise<number> {
        let returnValue = 0;
        let activeIndex = 0;

        while (!returnValue) {
            // Check if a person is here and enable BUSINESS_TALK if needed
            let possibilities = options.possibilities;
            if (this.isPersonHere()) {
                if (!(possibilities & BUSINESS_TALK)) {
                    possibilities |= (BUSINESS_TALK & this.film.getEnabledChoices());
                }
            }

            if (possibilities) {
                // Build menu from available actions
                const menuItems = this.buildMenuItems(possibilities);

                // Show menu and wait for selection
                const choice = await this.ui.showMenu({
                    items: menuItems,
                    activeIndex: activeIndex
                });

                if (choice === GET_OUT) {
                    // ESC pressed - return to current scene
                    const player = this.db.getObject(Person_Matt_Stuvysunt) as any;
                    returnValue = player?.CurrScene || 0;
                    activeIndex = 0;
                } else {
                    // Convert menu index to action bitmask
                    const actionBit = 1 << choice;
                    returnValue = await this.handleAction(actionBit);
                    activeIndex = choice;
                }
            } else {
                console.error('InteractionService: No possibilities available');
                break;
            }
        }

        return returnValue;
    }

    /**
     * Build menu items from possibility bitmask
     */
    private buildMenuItems(possibilities: number): MenuItem[] {
        const items: MenuItem[] = [];
        const menuKeys = this.text.getTextLines(MENU_TXT, 'Mainmenu');

        // Action order matches the bit positions
        const actions = [
            { bit: GO, key: 0 },
            { bit: WAIT, key: 1 },
            { bit: BUSINESS_TALK, key: 2 },
            { bit: LOOK, key: 3 },
            { bit: INVESTIGATE, key: 4 },
            { bit: PLAN, key: 5 },
            { bit: CALL_TAXI, key: 6 },
            { bit: MAKE_CALL, key: 7 },
            { bit: INFO, key: 8 }
        ];

        for (const action of actions) {
            const enabled = (possibilities & action.bit) !== 0;
            const text = menuKeys[action.key] || `Action ${action.key}`;
            items.push({ text, enabled, data: action.bit });
        }

        return items;
    }

    /**
     * Handle a specific action
     * Port of StdHandle() from gp_app.c
     * 
     * @param choice Action bitmask
     * @returns Next scene/event number (0 = stay in current scene)
     */
    private async handleAction(choice: number): Promise<number> {
        let nextScene = 0;

        switch (choice) {
            case GO:
                nextScene = await this.handleGo();
                break;

            case BUSINESS_TALK:
                nextScene = await this.handleTalk();
                this.film.addVTime(7);
                // TODO: ShowTime(0);
                break;

            case LOOK:
                await this.handleLook();
                this.film.addVTime(1);
                // TODO: ShowTime(0);
                break;

            case INVESTIGATE:
                await this.handleInvestigate();
                // TODO: ShowTime(0);
                break;

            case MAKE_CALL:
                this.film.addVTime(4);
                nextScene = await this.handleMakeCall();
                // TODO: ShowTime(0);
                break;

            case CALL_TAXI:
                nextScene = await this.handleCallTaxi();
                break;

            case PLAN:
                nextScene = await this.handlePlan();
                // TODO: ShowTime(0);
                break;

            case INFO:
                this.film.addVTime(1);
                await this.handleInfo();
                // TODO: ShowTime(0);
                break;

            case WAIT:
                await this.handleWait();
                break;

            default:
                console.warn(`InteractionService: Unknown action ${choice}`);
                break;
        }

        return nextScene;
    }

    /**
     * Handle GO action
     */
    private async handleGo(): Promise<number> {
        // TODO: Get current scene's standard successors
        // TODO: Call sceneService.go() with successors
        // TODO: Check location opening hours
        // TODO: Stop animation if moving
        console.log('GO action - not yet fully implemented');
        return 0;
    }

    /**
     * Handle BUSINESS_TALK action
     */
    private async handleTalk(): Promise<number> {
        // TODO: Call Talk() function
        // This should show a list of people at the current location
        // and allow the player to talk to them
        console.log('BUSINESS_TALK action - not yet fully implemented');
        return 0;
    }

    /**
     * Handle LOOK action
     */
    private async handleLook(): Promise<number> {
        const currentLocation = this.film.getLocation();
        await this.sceneService.look(currentLocation);
        return 0;
    }

    /**
     * Handle INVESTIGATE action
     */
    private async handleInvestigate(): Promise<number> {
        // TODO: Implement investigate functionality
        // This is used for special investigation actions
        console.log('INVESTIGATE action - not yet fully implemented');
        return 0;
    }

    /**
     * Handle MAKE_CALL action
     */
    private async handleMakeCall(): Promise<number> {
        // TODO: Implement phone call system (tcTelefon)
        console.log('MAKE_CALL action - not yet fully implemented');
        return 0;
    }

    /**
     * Handle CALL_TAXI action
     */
    private async handleCallTaxi(): Promise<number> {
        // TODO: Play taxi sound effect randomly
        // TODO: Return taxi scene event number
        console.log('CALL_TAXI action - not yet fully implemented');
        return 0;
    }

    /**
     * Handle PLAN action
     */
    private async handlePlan(): Promise<number> {
        // TODO: Implement planning system
        // - Check if player has buildings (hasAll with Object_Building)
        // - Check if player has cars (hasAll with Object_Car)
        // - Call tcOrganisation() to select building and team
        // - Call tcBurglary() to execute the burglary
        console.log('PLAN action - not yet fully implemented');
        return 0;
    }

    /**
     * Handle INFO action
     */
    private async handleInfo(): Promise<number> {
        await this.sceneService.information();
        return 0;
    }

    /**
     * Handle WAIT action
     */
    private async handleWait(): Promise<number> {
        await this.sceneService.wait();
        return 0;
    }

    /**
     * Check if a person is at the current location
     */
    private isPersonHere(): boolean {
        // TODO: Implement tcPersonIsHere()
        // This should check if any person is at the current location
        // using livWhereIs() or similar
        return false;
    }

    /**
     * Cleanup
     */
    destroy(): void {
        // Nothing to clean up yet
    }
}
