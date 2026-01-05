/**
 * Scene Service - Port of src/scenes/scenes.c
 * 
 * Manages standard scene functions: Go, Information, Look, Wait, Telefon
 */

import { Database } from '../core/Database';
import { FilmService, Scene } from './FilmService';
import { TextService } from './TextService';
import { UIService } from './UIService';
import { DialogService } from './DialogService';
import { PresentationService } from './PresentationService';
import { 
    THECLOU_TXT, 
    BUSINESS_TXT, 
    HOUSEDESC_TXT,
    GET_OUT,
    OLF_PRIVATE_LIST,
    OLF_INCLUDE_NAME,
    OLF_INSERT_STAR,
    Person_Matt_Stuvysunt,
    THINK_BUBBLE,
    SPEAK_BUBBLE
} from '../types/GameConstants';
import { ObjectType } from '../types/GameTypes';

/**
 * Event node for scene navigation
 */
export interface TCEventNode {
    eventNr: number;
    name: string;
}

/**
 * Scene arguments for return values
 */
export interface SceneArgs {
    returnValue: number;
}

export class SceneService {
    private db: Database;
    private film: FilmService;
    private text: TextService;
    private ui: UIService;
    private dialog: DialogService;
    private present: PresentationService;
    
    // Global scene args (like C version)
    public sceneArgs: SceneArgs = { returnValue: 0 };
    
    // Taxi locations (locations Matt can travel to)
    private taxiLocations: Set<number> = new Set();

    constructor(
        db: Database,
        film: FilmService,
        text: TextService,
        ui: UIService,
        dialog: DialogService,
        present: PresentationService
    ) {
        this.db = db;
        this.film = film;
        this.text = text;
        this.ui = ui;
        this.dialog = dialog;
        this.present = present;
    }

    /**
     * Add taxi location (unlock destination)
     * Port of AddTaxiLocation
     */
    addTaxiLocation(locNr: number): void {
        const objNr = this.getObjNrOfLocation(locNr);
        if (objNr) {
            this.taxiLocations.add(objNr);
        }
    }

    /**
     * Remove taxi location (lock destination)
     * Port of RemTaxiLocation
     */
    removeTaxiLocation(locNr: number): void {
        const objNr = this.getObjNrOfLocation(locNr);
        if (objNr) {
            this.taxiLocations.delete(objNr);
        }
    }

    /**
     * Get object ID of location by location number
     * Port of GetObjNrOfLocation from dataappl.c
     */
    private getObjNrOfLocation(locNr: number): number {
        const objects = this.db.getAllObjects();
        
        for (const obj of objects) {
            if (obj.type === ObjectType.Location) {
                const location = obj.data as any;
                if (location.LocationNr === locNr) {
                    return obj.id;
                }
            }
        }
        
        return 0;
    }

    /**
     * Go - Location navigation
     * Port of Go() from scenes.c
     * 
     * Shows menu of available locations and returns selected event number.
     * If only one location available, returns it directly.
     * 
     * @param successors List of available locations (TCEventNode[])
     * @returns Event number of selected location
     */
    async go(successors: TCEventNode[]): Promise<number> {
        // If only one location, return it directly
        if (successors.length === 1) {
            return successors[0].eventNr;
        }

        // Multiple locations - show menu
        const line = this.text.getFirstLine(THECLOU_TXT, 'Gehen');
        
        // Create menu items from successors
        const menuItems = successors.map((node, index) => ({
            text: node.name,
            enabled: true,
            data: node.eventNr
        }));
        
        // Show menu and get choice
        const choice = await this.ui.showMenu({
            items: menuItems,
            activeIndex: 0
        });

        // If user cancelled, return 0
        if (choice === GET_OUT || choice === -1) {
            return 0;
        }

        // Return event number of selected location
        return successors[choice].eventNr;
    }

    /**
     * Information - Show information menu
     * Port of Information() from scenes.c
     * 
     * Shows menu with categories: Player, Cars, People, Tools, Buildings, Loot
     */
    information(): void {
        let choice = 0;
        let ret = 0;

        while (choice !== 6 && ret !== GET_OUT) {
            // Show information menu
            this.dialog.setBubbleType(THINK_BUBBLE);
            const bubble = this.text.getTextLines(THECLOU_TXT, 'INFORMATION');
            choice = this.ui.showBubble(bubble, choice);

            if (choice === GET_OUT || choice === 6) {
                break;
            }

            let choice1 = 0;

            switch (choice) {
                case 0: // Player info
                    // Show Player object, then Matt
                    if (this.present.present(9800, 'Player') !== GET_OUT) {
                        this.present.present(Person_Matt_Stuvysunt, 'Person');
                    }
                    break;

                case 1: // Cars
                    ret = this.showObjectList(
                        Person_Matt_Stuvysunt,
                        ObjectType.Car,
                        'Car',
                        'POOR'
                    );
                    break;

                case 2: // People
                    ret = this.showKnownPeople();
                    break;

                case 3: // Tools
                    ret = this.showObjectList(
                        Person_Matt_Stuvysunt,
                        ObjectType.Tool,
                        'Tool',
                        'POOR'
                    );
                    break;

                case 4: // Buildings
                    ret = this.showObjectList(
                        Person_Matt_Stuvysunt,
                        ObjectType.Building,
                        'Building',
                        'POOR'
                    );
                    break;

                case 5: // Loot
                    this.present.present(0, 'Beute');
                    break;

                default:
                    choice = 6;
                    break;
            }
        }
    }

    /**
     * Show list of objects person has
     * Helper for Information()
     */
    private showObjectList(
        personId: number,
        objectType: ObjectType,
        presentType: string,
        emptyTextKey: string
    ): number {
        // Get all objects person has of this type
        const objects = this.db.hasAll(personId, objectType);

        if (objects.length === 0) {
            // No objects - show "poor" message
            this.dialog.say(BUSINESS_TXT, 0, 0, emptyTextKey);
            return 0;
        }

        // Sort objects by name
        objects.sort((a, b) => {
            const nameA = this.db.getObjectName(a) || '';
            const nameB = this.db.getObjectName(b) || '';
            return nameA.localeCompare(nameB);
        });

        // Create menu with object names
        const menuItems = objects.map(id => this.db.getObjectName(id) || 'Unknown');
        
        // Add "Enough" option
        const enough = this.text.getFirstLine(BUSINESS_TXT, 'GENUG');
        menuItems.push(enough);

        let choice = 0;
        let ret = 0;

        this.dialog.setBubbleType(THINK_BUBBLE);

        while (true) {
            choice = this.ui.showBubble(menuItems, choice);

            if (choice === GET_OUT || choice === menuItems.length - 1) {
                break;
            }

            // Show presentation of selected object
            this.dialog.setBubbleType(THINK_BUBBLE);
            ret = this.present.present(objects[choice], presentType);

            if (ret === GET_OUT) {
                break;
            }
        }

        return ret;
    }

    /**
     * Show list of known people
     * Helper for Information()
     */
    private showKnownPeople(): number {
        // Get all people Matt knows
        const people = this.db.knowsAll(Person_Matt_Stuvysunt, ObjectType.Person);

        if (people.length === 0) {
            // No people known
            this.dialog.say(BUSINESS_TXT, 0, 0, 'POOR');
            return 0;
        }

        // Sort people by name
        people.sort((a, b) => {
            const nameA = this.db.getObjectName(a) || '';
            const nameB = this.db.getObjectName(b) || '';
            return nameA.localeCompare(nameB);
        });

        // Create menu with people names
        const menuItems = people.map(id => this.db.getObjectName(id) || 'Unknown');
        
        // Add "Enough" option
        const enough = this.text.getFirstLine(BUSINESS_TXT, 'GENUG');
        menuItems.push(enough);

        let choice = 0;
        let ret = 0;

        this.dialog.setBubbleType(THINK_BUBBLE);

        while (true) {
            choice = this.ui.showBubble(menuItems, choice);

            if (choice === GET_OUT || choice === menuItems.length - 1) {
                break;
            }

            // Show info about person
            this.dialog.setBubbleType(THINK_BUBBLE);
            ret = this.displayInfoAboutPerson(people[choice]);

            if (ret === GET_OUT) {
                break;
            }
        }

        return ret;
    }

    /**
     * Display information about a person
     * Port of tcDisplayInfoAboutPerson
     */
    private displayInfoAboutPerson(objId: number): number {
        // Check if Matt has knowledge about this person
        if (this.db.has(Person_Matt_Stuvysunt, objId)) {
            // Matt knows them - show full presentation
            return this.present.present(objId, 'Person');
        } else {
            // Matt doesn't know them - show generic message
            const name = this.db.getObjectName(objId) || 'Unknown';
            const bubble = this.text.getTextLines(5, name); // LOOK_TXT = 5
            
            this.dialog.setBubbleType(THINK_BUBBLE);
            this.ui.showBubble(bubble, 0);
            
            return 0;
        }
    }

    /**
     * Look - Examine current location
     * Port of Look() from scenes.c
     * 
     * Shows menu to examine location description or people at location
     */
    look(locNr: number): void {
        let choice = 0;

        while (choice !== 2) {
            // Show look menu
            const menu = this.text.getTextLines(THECLOU_TXT, 'UMSEHEN');
            
            this.dialog.setBubbleType(THINK_BUBBLE);
            choice = this.ui.showBubble(menu, 0);

            if (choice === GET_OUT || choice === 2) {
                break;
            }

            switch (choice) {
                case 0: // Location description
                    this.showLocationDescription(locNr);
                    break;

                case 1: // People at location
                    this.showPeopleAtLocation(locNr);
                    break;

                default:
                    choice = 2;
                    break;
            }
        }
    }

    /**
     * Show location description
     * Helper for Look()
     */
    private showLocationDescription(locNr: number): void {
        // Get location name
        const locationName = this.film.getLocationName(locNr);
        
        if (!locationName) {
            return;
        }

        // Get description from HOUSEDESC_TXT
        const bubble = this.text.getTextLines(HOUSEDESC_TXT, locationName);
        
        this.dialog.setBubbleType(THINK_BUBBLE);
        this.ui.showBubble(bubble, 0);
    }

    /**
     * Show people at location
     * Helper for Look()
     */
    private showPeopleAtLocation(locNr: number): void {
        const objId = this.getObjNrOfLocation(locNr);
        
        if (!objId) {
            this.dialog.say(BUSINESS_TXT, 0, 0, 'NOBODY TO SEE');
            return;
        }

        // Get all people at this location
        const people = this.db.hasAll(objId, ObjectType.Person);

        if (people.length === 0) {
            this.dialog.say(BUSINESS_TXT, 0, 0, 'NOBODY TO SEE');
            return;
        }

        // Sort people by name
        people.sort((a, b) => {
            const nameA = this.db.getObjectName(a) || '';
            const nameB = this.db.getObjectName(b) || '';
            return nameA.localeCompare(nameB);
        });

        // Create menu with people names
        const menuItems = people.map(id => this.db.getObjectName(id) || 'Unknown');
        
        // Add "Enough" option
        const enough = this.text.getFirstLine(BUSINESS_TXT, 'GENUG_2');
        menuItems.push(enough);

        let choice = 0;

        this.dialog.setBubbleType(THINK_BUBBLE);

        while (true) {
            choice = this.ui.showBubble(menuItems, choice);

            if (choice === GET_OUT || choice === menuItems.length - 1) {
                break;
            }

            // Show info about person
            this.displayInfoAboutPerson(people[choice]);
        }
    }

    /**
     * Wait - Advance time
     * Port of tcWait() from scenes.c
     * 
     * Advances time in 60-minute increments, up to 960 minutes (16 hours)
     * Shows time display and detects new people arriving
     */
    wait(): void {
        let minutes = 0;
        let oldCount = 0;
        const locNr = this.film.getLocation();
        const locObjId = this.getObjNrOfLocation(locNr);

        // Get initial count of people at location
        if (locObjId) {
            const people = this.db.hasAll(locObjId, ObjectType.Person);
            oldCount = people.length;
        }

        // Show wait message
        const line = this.text.getFirstLine(THECLOU_TXT, 'WAIT');
        console.log(line);

        // Wait loop - advance time in 60-minute increments
        while (minutes < 960) {
            minutes += 60;
            this.film.advanceTime(60);

            // Check for new people at location
            if (locObjId) {
                const people = this.db.hasAll(locObjId, ObjectType.Person);
                const newCount = people.length;

                if (newCount > oldCount && oldCount !== 0) {
                    this.dialog.setBubbleType(THINK_BUBBLE);
                    this.dialog.say(THECLOU_TXT, 0, 0, 'NEW_PEOPLE');
                }

                oldCount = newCount;
            }

            // In real game, would wait for user input or timeout
            // For now, just advance time
            // TODO: Add input handling
            break; // Exit after one iteration for now
        }

        if (minutes >= 960) {
            // Waited too long
            this.dialog.setBubbleType(THINK_BUBBLE);
            this.dialog.say(THECLOU_TXT, 0, 0, 'WURZEL_SEPP');
        }
    }

    /**
     * Reset scene service state
     */
    reset(): void {
        this.taxiLocations.clear();
        this.sceneArgs.returnValue = 0;
    }
}
