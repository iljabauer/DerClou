/**
 * Story Service - Port of src/story/story.c
 * 
 * Manages story progression, scene handlers, and game events.
 * Each story scene has a handler function (tcDone*) that executes
 * when the scene is entered.
 */

import { Database } from '../core/Database';
import { FilmService } from './FilmService';
import { TextService } from './TextService';
import { DialogService } from './DialogService';
import { SceneService } from './SceneService';
import { 
    SCENE_ARRIVAL,
    SCENE_STATION,
    SCENE_HOTEL_ROOM,
    SCENE_HOTEL,
    SCENE_HOLLAND_STR,
    SCENE_WATLING,
    SCENE_CARS_VANS,
    STORY_0_TXT,
    OLD_MATT_PICTID,
    MATT_PICTID,
    Person_Matt_Stuvysunt,
    Person_Ben_Riggley,
    Person_John_Gludo,
    Person_Jim_Danner,
    tcCOSTS_FOR_HOTEL,
    London_London_1
} from '../types/GameConstants';
import { ObjectType } from '../types/GameTypes';

/**
 * Environment object data structure
 */
interface EnvironmentData {
    MattHasHotelRoom: number;
    MattHasIdentityCard: number;
}

/**
 * Story handler function type
 */
type StoryHandler = () => void;

export class StoryService {
    private db: Database;
    private film: FilmService;
    private text: TextService;
    private dialog: DialogService;
    private scene: SceneService;
    
    // Story handlers map
    private handlers: Map<number, StoryHandler> = new Map();
    
    // Player money (in real game, would be in Player object)
    private playerMoney: number = 0;
    
    // Game play mode flags
    private gamePlayMode: number = 0;
    public static readonly GP_MORE_MONEY = 1;

    constructor(
        db: Database,
        film: FilmService,
        text: TextService,
        dialog: DialogService,
        scene: SceneService
    ) {
        this.db = db;
        this.film = film;
        this.text = text;
        this.dialog = dialog;
        this.scene = scene;
        
        // Register story handlers
        this.registerHandlers();
    }

    /**
     * Register all story scene handlers
     */
    private registerHandlers(): void {
        this.handlers.set(SCENE_ARRIVAL, () => this.tcDoneArrival());
        this.handlers.set(SCENE_HOTEL_ROOM, () => this.tcDoneHotelReception());
        // More handlers will be added as they are ported
    }

    /**
     * Execute story handler for a scene
     */
    executeHandler(sceneId: number): void {
        const handler = this.handlers.get(sceneId);
        if (handler) {
            handler();
        } else {
            console.warn(`No story handler for scene ${sceneId}`);
        }
    }

    /**
     * Get player money
     */
    getPlayerMoney(): number {
        return this.playerMoney;
    }

    /**
     * Set player money
     */
    setPlayerMoney(amount: number): void {
        this.playerMoney = Math.max(0, amount);
    }

    /**
     * Add money to player
     */
    addPlayerMoney(amount: number): void {
        this.playerMoney += amount;
    }

    /**
     * Get environment object
     */
    private getEnvironment(): EnvironmentData {
        // In real game, would load from database
        // For now, return a stub
        return {
            MattHasHotelRoom: 0,
            MattHasIdentityCard: 0
        };
    }

    /**
     * Update environment object
     */
    private updateEnvironment(data: Partial<EnvironmentData>): void {
        // In real game, would save to database
        console.log('Environment updated:', data);
    }

    /**
     * THE ARRIVAL (ST_30)
     * Port of tcDoneArrival from story.c
     * 
     * Game opening scene - Matt arrives in London
     */
    private tcDoneArrival(): void {
        // Show old Matt's narration
        this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'ST_30_OLD');

        // Unlock taxi locations
        this.scene.addTaxiLocation(0);   // Holland Street
        this.scene.addTaxiLocation(58);  // Victoria Station

        // Set return scene
        this.scene.sceneArgs.returnValue = SCENE_STATION;
    }

    /**
     * HOTEL RECEPTION
     * Port of tcDoneHotelReception from story.c
     * 
     * Matt tries to get a hotel room
     */
    private tcDoneHotelReception(): void {
        const rig = this.db.getObject(Person_Ben_Riggley);
        const env = this.getEnvironment();
        let choice = 0;
        let evaluation = 0;

        // Matt now knows Ben
        this.db.knowsSet(Person_Matt_Stuvysunt, Person_Ben_Riggley);

        if (env.MattHasHotelRoom === 2) {
            // Already has room
            this.scene.sceneArgs.returnValue = SCENE_HOTEL;
        } else {
            // Unlock more taxi locations
            this.scene.addTaxiLocation(2); // Watling
            this.scene.addTaxiLocation(1); // Cars

            if (this.playerMoney >= tcCOSTS_FOR_HOTEL) {
                // Has enough money - simple transaction
                this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'THE_KEY_PLEASE');
                this.dialog.say(STORY_0_TXT, 0, 0, 'I_LL_FETCH_THE_KEY'); // rig.PictID
                this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'THANKS_FOR_KEY');

                this.updateEnvironment({ MattHasHotelRoom: 2 });
                this.playerMoney -= tcCOSTS_FOR_HOTEL;

                this.scene.sceneArgs.returnValue = SCENE_HOTEL_ROOM;
            } else {
                if (env.MattHasHotelRoom === 0) {
                    // First time - complex dialog
                    choice = 2;
                    evaluation = 0;

                    while (choice === 2 || choice === 3) {
                        choice = this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'HOTEL_MATT_1');

                        switch (choice) {
                            case 0:
                                this.dialog.say(STORY_0_TXT, 0, 0, 'HOTEL_ANT_11');

                                if (this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'HOTEL_MATT_2') === 1) {
                                    evaluation = 1;
                                    this.dialog.say(STORY_0_TXT, 0, 0, 'HOTEL_ANT_22');
                                } else {
                                    this.dialog.say(STORY_0_TXT, 0, 0, 'HOTEL_ANT_21');
                                    this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'HOTEL_MATT_3');
                                    this.dialog.say(STORY_0_TXT, 0, 0, 'HOTEL_ANT_31');
                                }
                                break;
                            case 1:
                                this.dialog.say(STORY_0_TXT, 0, 0, 'HOTEL_ANT_12');
                                this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'HOTEL_MATT_3');
                                this.dialog.say(STORY_0_TXT, 0, 0, 'HOTEL_ANT_31');
                                break;
                            case 2:
                                this.dialog.say(STORY_0_TXT, 0, 0, 'HOTEL_ANT_13');
                                break;
                            case 3:
                                this.dialog.say(STORY_0_TXT, 0, 0, 'HOTEL_ANT_14');
                                break;
                            case 4:
                                break;
                        }
                    }

                    if (!evaluation) {
                        this.scene.sceneArgs.returnValue = SCENE_HOLLAND_STR;
                        this.updateEnvironment({ MattHasHotelRoom: 1 });
                    } else {
                        this.updateEnvironment({ MattHasHotelRoom: 2 });
                        this.dialog.setBubbleType(1); // THINK_BUBBLE
                        this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'MILLIONAIRE');
                        this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'THANKS_FOR_KEY');

                        this.scene.sceneArgs.returnValue = SCENE_HOTEL_ROOM;
                    }
                } else {
                    if (env.MattHasHotelRoom === 1) {
                        // Been here before, still no money
                        this.dialog.say(STORY_0_TXT, 0, 0, 'YOU_HAVE_NO_MONEY');
                        this.scene.sceneArgs.returnValue = SCENE_HOLLAND_STR;
                    }
                }
            }
        }
    }

    /**
     * CREDITS SCENE
     * Port of tcDoneCredits from story.c
     * 
     * Matt receives credits/money
     */
    private tcDoneCredits(): void {
        const ben = this.db.getObject(Person_Ben_Riggley);

        // Sound effect would play here
        // tcSomebodyIsComing();

        this.dialog.say(0, 0, 0, 'A_LETTER_FOR_YOU'); // ben.PictID
        this.dialog.say(0, 0, 151, 'SOME_CREDITS'); // LETTER_PICTID
        this.dialog.say(0, 0, MATT_PICTID, 'SO_EIN_SCH');

        if (this.gamePlayMode & StoryService.GP_MORE_MONEY) {
            this.addPlayerMoney(100);
        }

        this.scene.sceneArgs.returnValue = SCENE_HOTEL_ROOM;
    }

    /**
     * MAMI CALLS
     * Port of tcDoneMamiCalls from story.c
     * 
     * Matt's mother calls
     */
    private tcDoneMamiCalls(): void {
        this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'ST_31_OLD_0');
        this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'ST_31_MATT_0');
        this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'ST_31_OLD_1');

        this.scene.sceneArgs.returnValue = SCENE_HOTEL_ROOM;
    }

    /**
     * CASH FROM GLUDO
     * Port of tcDoneGludoMoney from story.c
     * 
     * Matt gets money from Gludo
     */
    private tcDoneGludoMoney(): void {
        const gludo = this.db.getObject(Person_John_Gludo);
        const env = this.getEnvironment();
        let choice = 0;
        let money = 0;

        // Matt now knows Gludo
        this.db.knowsSet(Person_Matt_Stuvysunt, Person_John_Gludo);

        choice = this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'POLI_MATT_1');

        switch (choice) {
            case 0:
                this.dialog.say(STORY_0_TXT, 0, 0, 'POLI_ANT_11'); // gludo.PictID
                this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'POLI_MATT_2');
                this.dialog.say(STORY_0_TXT, 0, 0, 'POLI_ANT_21');
                this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'POLI_MATT_5');
                this.dialog.say(STORY_0_TXT, 0, 0, 'POLI_ANT_51');
                money = tcCOSTS_FOR_HOTEL;
                if (this.gamePlayMode & StoryService.GP_MORE_MONEY) {
                    money *= 2;
                }
                this.addPlayerMoney(money);
                break;
            case 1:
                this.dialog.say(STORY_0_TXT, 0, 0, 'POLI_ANT_12');
                break;
            case 2:
                this.dialog.say(STORY_0_TXT, 0, 0, 'POLI_ANT_13');
                break;
            case 3:
                this.dialog.say(2, 0, 0, 'Bye'); // BUSINESS_TXT
                break;
        }

        this.dialog.setBubbleType(1); // THINK_BUBBLE
        this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'POLI_MATT_6');

        this.updateEnvironment({ MattHasIdentityCard: 1 });

        this.scene.sceneArgs.returnValue = SCENE_WATLING;
    }

    /**
     * CASH FROM DANNER
     * Port of tcDoneDanner from story.c
     * 
     * Matt gets money from Danner
     */
    private tcDoneDanner(): void {
        const jim = this.db.getObject(Person_Jim_Danner);
        let choice = 0;

        if (this.playerMoney < tcCOSTS_FOR_HOTEL) {
            // Matt now knows Danner
            this.db.knowsSet(Person_Matt_Stuvysunt, Person_Jim_Danner);

            this.dialog.say(STORY_0_TXT, 0, 0, 'DANNER_1'); // jim.PictID
            choice = this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'DANNER_2');

            switch (choice) {
                case 0:
                    this.dialog.say(STORY_0_TXT, 0, 0, 'DANNER_21');
                    break;
                case 1:
                    this.dialog.say(STORY_0_TXT, 0, 0, 'DANNER_22');
                    break;
                case 2:
                    this.dialog.say(STORY_0_TXT, 0, 0, 'DANNER_23');
                    this.dialog.setBubbleType(1); // THINK_BUBBLE
                    break;
            }

            this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'DANNER_3');
            
            if (this.gamePlayMode & StoryService.GP_MORE_MONEY) {
                this.addPlayerMoney(40);
            } else {
                this.addPlayerMoney(20);
            }

            // Remove Danner from London
            this.db.livesInUnSet(London_London_1, Person_Jim_Danner);
            // tcMoveAPerson(Person_Jim_Danner, Location_Nirvana);
        } else {
            // Has enough money - Danner stays
            this.db.livesInSet(London_London_1, Person_Jim_Danner);
        }

        this.scene.sceneArgs.returnValue = SCENE_CARS_VANS;
    }

    /**
     * Reset story service state
     */
    reset(): void {
        this.playerMoney = 0;
        this.gamePlayMode = 0;
    }
}
