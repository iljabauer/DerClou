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
    SCENE_FAT_MANS,
    SCENE_NEW_GAME,
    SCENE_FST_MEET_BRIGGS,
    SCENE_FREIFAHRT,
    SCENE_CALL_FROM_POOLY,
    SCENE_GLUDO_SAILOR,
    SCENE_CALL_BRIGGS,
    SCENE_MORNING,
    SCENE_VISITING,
    SCENE_A_DREAM,
    SCENE_MISSED_DATE_0,
    SCENE_MISSED_DATE_1,
    STORY_0_TXT,
    STORY_1_TXT,
    OLD_MATT_PICTID,
    MATT_PICTID,
    PHONE_PICTID,
    LETTER_PICTID,
    FACE_GLUDO_SAILOR,
    Person_Matt_Stuvysunt,
    Person_Ben_Riggley,
    Person_John_Gludo,
    Person_Jim_Danner,
    Person_Herbert_Briggs,
    Person_Pater_James,
    Person_Dan_Stanford,
    Person_Eric_Pooly,
    Person_Sabien_Pardo,
    Building_Kiosk,
    Car_Fiat_Topolino_1940,
    Loot_Ring_des_Abtes,
    tcCOSTS_FOR_HOTEL,
    tcVALUE_OF_RING_OF_PATER,
    London_London_1
} from '../types/GameConstants';
import { ObjectType, Building } from '../types/GameTypes';
import { PresentationService } from './PresentationService';

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
    private presentation: PresentationService | null = null;
    
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
     * Set presentation service (optional dependency)
     */
    setPresentationService(presentation: PresentationService): void {
        this.presentation = presentation;
    }

    /**
     * Register all story scene handlers
     */
    private registerHandlers(): void {
        this.handlers.set(SCENE_ARRIVAL, () => this.tcDoneArrival());
        this.handlers.set(SCENE_HOTEL_ROOM, () => this.tcDoneHotelReception());
        this.handlers.set(SCENE_FST_MEET_BRIGGS, () => this.tcDoneMeetBriggs());
        this.handlers.set(SCENE_FREIFAHRT, () => this.tcDoneFreeTicket());
        this.handlers.set(SCENE_CALL_FROM_POOLY, () => this.tcDoneCallFromPooly());
        this.handlers.set(SCENE_GLUDO_SAILOR, () => this.tcDoneGludoAsSailor());
        this.handlers.set(SCENE_CALL_BRIGGS, () => this.tcDoneCallFromBriggs());
        this.handlers.set(SCENE_MORNING, () => this.tcDoneBeautifullMorning());
        this.handlers.set(SCENE_VISITING, () => this.tcDoneVisitingSabien());
        this.handlers.set(SCENE_A_DREAM, () => this.tcDoneADream());
        this.handlers.set(SCENE_MISSED_DATE_0, () => this.tcDoneMissedDate());
        this.handlers.set(SCENE_MISSED_DATE_1, () => this.tcDoneMissedDate());
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
     * MEET BRIGGS
     * Port of tcDoneMeetBriggs from story.c
     * 
     * Matt meets Herbert Briggs who offers him a job
     */
    private tcDoneMeetBriggs(): void {
        const briggs = this.db.getObject(Person_Herbert_Briggs);
        let choice = 0;

        // Matt now knows Briggs
        this.db.knowsSet(Person_Matt_Stuvysunt, Person_Herbert_Briggs);

        // Dialog sequence
        this.dialog.say(STORY_0_TXT, 0, 0, 'BRIGGS_BRIGGS_1'); // briggs.PictID
        this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'BRIGGS_MATT_1');
        this.dialog.say(STORY_0_TXT, 0, 0, 'BRIGGS_BRIGGS_2'); // briggs.PictID
        this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'BRIGGS_MATT_2');
        this.dialog.say(STORY_0_TXT, 0, 0, 'BRIGGS_BRIGGS_3'); // briggs.PictID

        choice = this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'BRIGGS_MATT_3');

        if (choice === 0) {
            // Accepted the job
            const bui = this.db.getObject(Building_Kiosk) as Building;

            // Matt now has the building
            this.db.hasSet(Person_Matt_Stuvysunt, Building_Kiosk);

            // Add money (with cheat mode check)
            if (this.gamePlayMode & StoryService.GP_MORE_MONEY) {
                this.addPlayerMoney(30);
            } else {
                this.addPlayerMoney(15);
            }

            // Update building properties
            this.addBuildExactlyness(bui, 255);
            this.addBuildStrike(bui, 5);

            this.dialog.say(STORY_0_TXT, 0, 0, 'BRIGGS_BRIGGS_4'); // briggs.PictID

            // Present the car and building
            this.present(Car_Fiat_Topolino_1940, 'Car');
            this.present(Building_Kiosk, 'Building');

            this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'AFTER_MEETING_BRIGGS');

            // Matt gets the car
            this.db.hasSet(Person_Matt_Stuvysunt, Car_Fiat_Topolino_1940);

            this.scene.sceneArgs.returnValue = SCENE_FAT_MANS;
        } else {
            // Rejected the job - monastery path
            const james = this.db.getObject(Person_Pater_James);

            this.dialog.say(STORY_0_TXT, 0, 0, 'BRIGGS_BRIGGS_5'); // briggs.PictID

            // Show animation (stub)
            this.gfxShow(170);

            this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'BRIGGS_MR_WHISKY');

            // Time passes
            this.asTimeGoesBy(this.film.getMinute() + 793);

            // Stop animation and fade out (stub)
            this.stopAnim();
            this.gfxChangeColors();

            // Matt goes to monastery
            this.mattGoesTo(60);

            this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'KLOSTER');
            this.dialog.say(STORY_0_TXT, 0, 0, 'ABT'); // james.PictID

            choice = this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'HOLY_MATT');

            if (choice === 0) {
                // Holy path - game ends
                this.dialog.say(STORY_0_TXT, 0, 155, 'THE_END_MONASTERY');
                this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'THE_EDGE');

                this.scene.sceneArgs.returnValue = SCENE_NEW_GAME;
            } else {
                // Evil path - steal ring and continue
                this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'EVIL_MATT');
                this.dialog.say(STORY_0_TXT, 0, 0, 'EVIL_MATT_ABT'); // james.PictID
                this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'EVIL_MATT_1');

                this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'EVIL_OLD_MATT');

                // Matt steals the ring
                this.hasSetP(Person_Matt_Stuvysunt, Loot_Ring_des_Abtes, tcVALUE_OF_RING_OF_PATER);

                // Advance time to next day
                this.addVTime(1440 + 525 - this.film.getMinute());

                this.scene.sceneArgs.returnValue = SCENE_HOLLAND_STR;
            }

            this.stopAnim();
            this.gfxChangeColors();
        }

        // Unlock new taxi locations
        this.scene.addTaxiLocation(10);  // trafik
        this.scene.addTaxiLocation(18);  // pink
        this.scene.addTaxiLocation(20);  // senioren
        this.scene.addTaxiLocation(12);  // aunt

        // TODO: Check bProfidisk flag
        // if (bProfidisk) this.scene.addTaxiLocation(68); // baker street
    }

    /**
     * FREE TICKET
     * Port of tcDoneFreeTicket from story.c
     * 
     * Matt meets Dan Stanford and gets a free ticket
     */
    private tcDoneFreeTicket(): void {
        const dan = this.db.getObject(Person_Dan_Stanford);

        // Matt now knows Dan
        this.db.knowsSet(Person_Matt_Stuvysunt, Person_Dan_Stanford);

        this.dialog.say(STORY_0_TXT, 0, 7, 'AEHHH');
        this.dialog.say(STORY_0_TXT, 0, 0, 'FREE_TICKET'); // dan.PictID

        // Return to taxi scene (location 8)
        this.scene.sceneArgs.returnValue = this.getLocSceneEventNr(8);
    }

    /**
     * CALL FROM POOLY
     * Port of tcDoneCallFromPooly from story.c
     * 
     * Eric Pooly calls Matt about the ring
     */
    private tcDoneCallFromPooly(): void {
        let choice = 0;

        // Matt now knows Pooly
        this.db.knowsSet(Person_Matt_Stuvysunt, Person_Eric_Pooly);

        // Check if Matt has the ring
        if (this.db.has(Person_Matt_Stuvysunt, Loot_Ring_des_Abtes)) {
            // Play phone ringing sound effect (stub)
            this.somebodyIsCalling();

            this.dialog.say(STORY_0_TXT, 0, PHONE_PICTID, 'A_CALL_FOR_YOU');

            this.dialog.say(STORY_0_TXT, 0, PHONE_PICTID, 'DEALER_0');
            choice = this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'DEALER_MATT_1');

            if (choice === 0 || choice === 1) {
                this.dialog.say(STORY_0_TXT, 0, PHONE_PICTID, 'DEALER_1');
            } else {
                this.dialog.say(STORY_0_TXT, 0, PHONE_PICTID, 'DEALER_2');
            }
        }

        this.scene.sceneArgs.returnValue = SCENE_HOTEL_ROOM;
    }

    /**
     * GLUDO AS SAILOR
     * Port of tcDoneGludoAsSailor from story.c
     * 
     * Matt meets John Gludo disguised as a sailor
     */
    private tcDoneGludoAsSailor(): void {
        // Matt now knows Gludo
        this.db.knowsSet(Person_Matt_Stuvysunt, Person_John_Gludo);

        // Play Gludo's theme music (stub)
        // sndPlaySound("gludo.bk", 0);

        this.dialog.say(STORY_0_TXT, 0, FACE_GLUDO_SAILOR, 'SAILOR_GLUDO_0');
        this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'SAILOR_MATT_0');
        this.dialog.say(STORY_0_TXT, 0, FACE_GLUDO_SAILOR, 'SAILOR_GLUDO_1');

        if (this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'SAILOR_MATT_1')) {
            // Matt refuses - goes back to Holland Street
            this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'SAILOR_OLD_MATT_0');

            // Play street music (stub)
            // sndPlaySound("street1.bk", 0);
            
            this.scene.sceneArgs.returnValue = SCENE_HOLLAND_STR;
        } else {
            // Matt accepts - goes to prison
            this.dialog.say(STORY_0_TXT, 0, FACE_GLUDO_SAILOR, 'SAILOR_GLUDO_2');
            this.stopAnim();

            this.tcDonePrison();
        }
    }

    /**
     * CALL FROM BRIGGS
     * Port of tcDoneCallFromBriggs from story.c
     * 
     * Herbert Briggs calls Matt
     */
    private tcDoneCallFromBriggs(): void {
        // Time passes
        this.asTimeGoesBy(this.film.getMinute() + 130);

        // Phone rings
        this.somebodyIsCalling();

        this.dialog.say(STORY_0_TXT, 0, PHONE_PICTID, 'A_CALL_FOR_YOU');
        this.dialog.say(STORY_0_TXT, 0, PHONE_PICTID, 'BRIGGS_CALL');

        this.scene.sceneArgs.returnValue = SCENE_HOTEL_ROOM;
    }

    /**
     * PRISON
     * Port of tcDonePrison from story.c
     * 
     * Matt goes to prison - game over
     */
    private tcDonePrison(): void {
        // Set date to 13.01.1972
        this.film.setDay(719792);

        // Play end music (stub)
        // sndPlaySound("end.bk", 0);
        
        this.mattGoesTo(7);

        this.gfxShow(169);
        this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'THE_END_PRISON');
        this.stopAnim();

        this.mattGoesTo(60);
        // inpDelay(190);
        this.dialog.say(STORY_0_TXT, 0, 155, 'THE_END_MONASTERY');

        this.stopAnim();
        this.gfxChangeColors();

        this.scene.sceneArgs.returnValue = SCENE_NEW_GAME;
    }

    /**
     * BEAUTIFUL MORNING
     * Port of tcDoneBeautifullMorning from story.c
     * 
     * Matt wakes up in the morning
     */
    private tcDoneBeautifullMorning(): void {
        // Time passes
        this.asTimeGoesBy(this.film.getMinute() + 187);

        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'MORNING_MATT_0');

        // Play sleep animation (stub)
        this.playAnim('Sleep', 30000);
        this.asTimeGoesBy(546);
        this.stopAnim();

        // Show hotel image
        this.gfxShow(173);

        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'MORNING_MATT_1');

        // Unlock new taxi location
        this.scene.addTaxiLocation(61);

        this.scene.sceneArgs.returnValue = SCENE_HOTEL_ROOM;
    }

    /**
     * VISITING SABIEN
     * Port of tcDoneVisitingSabien from story.c
     * 
     * Matt visits Sabien Pardo
     */
    private tcDoneVisitingSabien(): void {
        const sabien = this.db.getObject(Person_Sabien_Pardo);

        // Matt now knows Sabien
        this.db.knowsSet(Person_Matt_Stuvysunt, Person_Sabien_Pardo);

        this.dialog.say(STORY_1_TXT, 0, 0, 'GROVE_SABIEN_0'); // sabien.PictID
        this.dialog.say(STORY_1_TXT, 0, MATT_PICTID, 'GROVE_MATT_0');
        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'GROVE_OLD_MATT_0');
        this.dialog.say(STORY_1_TXT, 0, 0, 'GROVE_SABIEN_1'); // sabien.PictID
        this.dialog.say(STORY_1_TXT, 0, MATT_PICTID, 'GROVE_MATT_1');
        this.dialog.say(STORY_1_TXT, 0, 0, 'GROVE_SABIEN_2'); // sabien.PictID
        this.dialog.say(STORY_1_TXT, 0, MATT_PICTID, 'GROVE_MATT_2');
        this.dialog.say(STORY_1_TXT, 0, 0, 'GROVE_SABIEN_3'); // sabien.PictID
        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'GROVE_OLD_MATT_1');

        this.scene.sceneArgs.returnValue = SCENE_HOTEL_ROOM;
    }

    /**
     * A DREAM
     * Port of tcDoneADream from story.c
     * 
     * Matt has a dream
     */
    private tcDoneADream(): void {
        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST1_OLD_0');

        // Play sleep animation (stub)
        this.playAnim('Sleep', 30000);
        this.asTimeGoesBy(517);
        this.stopAnim();

        // Show hotel image
        this.gfxShow(173);

        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST1_OLD_1');

        // Phone rings
        this.somebodyIsCalling();

        this.dialog.say(STORY_1_TXT, 0, PHONE_PICTID, 'ST1_BRIGGS_0');
        this.dialog.say(STORY_1_TXT, 0, MATT_PICTID, 'ST1_MATT_0');

        this.scene.sceneArgs.returnValue = SCENE_HOTEL_ROOM;
    }

    /**
     * MISSED DATE
     * Port of tcDoneMissedDate from story.c
     * 
     * Matt missed a date with Sabien
     */
    private tcDoneMissedDate(): void {
        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'VERPASST_BRIEF');
        this.dialog.say(STORY_1_TXT, 0, LETTER_PICTID, 'DATE_VERPASST');

        this.scene.sceneArgs.returnValue = SCENE_HOTEL_ROOM;
    }

    /**
     * AFTER MEETING BRIGGS
     * Port of tcDoneAfterMeetingBriggs from story.c
     * 
     * Matt reflects after meeting Briggs
     */
    private tcDoneAfterMeetingBriggs(): void {
        this.dialog.setBubbleType('think');
        this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'AFTER_MEETING_BRIGGS');

        this.scene.sceneArgs.returnValue = SCENE_WATLING;
    }

    /**
     * DEALER IS AFRAID
     * Port of tcDoneDealerIsAfraid from story.c
     * 
     * A dealer is afraid and talks to Matt
     */
    private tcDoneDealerIsAfraid(): void {
        let persID = 0;
        const location = this.film.getLocation();

        switch (location) {
            case 52:
                persID = Person_Helen_Parker;
                this.scene.sceneArgs.returnValue = SCENE_WATLING;
                break;
            case 53:
                persID = Person_Frank_Maloya;
                this.scene.sceneArgs.returnValue = SCENE_HOLLAND_STR;
                break;
            case 54:
                persID = Person_Eric_Pooly;
                this.scene.sceneArgs.returnValue = SCENE_HOLLAND_STR;
                break;
        }

        this.db.knowsSet(Person_Matt_Stuvysunt, persID);

        const pers = this.db.getObject(persID) as any;
        this.dialog.say(STORY_0_TXT, 0, pers.PictID, 'DEALER_IS_AFRAID');

        this.gfxChangeColors(5, 'fade_out');
    }

    /**
     * RAID IN WALRUS
     * Port of tcDoneRaidInWalrus from story.c
     * 
     * Police raid at the Walrus pub
     */
    private tcDoneRaidInWalrus(): void {
        const Red = this.db.getObject(Person_Red_Stanson) as any;
        const Env = this.db.getObject(Environment_TheClou) as any;

        this.db.knowsSet(Person_Matt_Stuvysunt, Person_Red_Stanson);
        // TODO: sndPlaySound("gludo.bk", 0);

        this.dialog.say(STORY_0_TXT, 0, Red.PictID, 'RAID_POLICE_0');
        this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'RAID_OLD_MATT_0');

        this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'RAID_MATT_0');
        this.dialog.say(STORY_0_TXT, 0, Red.PictID, 'RAID_POLICE_1');

        if (Env.MattHasIdentityCard) {
            this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'RAID_MATT_1');
            this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'RAID_OLD_MATT_1');

            this.scene.sceneArgs.returnValue = SCENE_HOTEL_ROOM;
        } else {
            this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'RAID_MATT_2');
            this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'RAID_OLD_MATT_2');

            this.scene.sceneArgs.returnValue = SCENE_POLICE;
        }

        this.stopAnim();
        this.gfxChangeColors(0, 'fade_out');
    }

    /**
     * MATT IS ARRESTED
     * Port of tcDoneMattIsArrested from story.c
     * 
     * Matt is arrested and sent to prison
     */
    private tcDoneMattIsArrested(): void {
        this.stopAnim();

        this.gfxShow(169); // prison

        this.addVTime(1439);

        this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'IN_PRISON_OLD_0');
        this.gfxShow(161); // police

        this.scene.sceneArgs.returnValue = SCENE_POLICE;
    }

    /**
     * GLUDO BURNS OFFICE
     * Port of tcDoneGludoBurnsOffice from story.c
     * 
     * Gludo burns evidence in his office
     */
    private tcDoneGludoBurnsOffice(): void {
        const Gludo = this.db.getObject(Person_John_Gludo) as any;

        this.stopAnim();

        this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, '5TH_OLD_1');
        this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, '5TH_MATT_0');
        this.dialog.say(STORY_0_TXT, 0, Gludo.PictID, '5TH_GLUDO_0');

        this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, '5TH_OLD_2');
        this.dialog.say(STORY_0_TXT, 0, Gludo.PictID, '5TH_GLUDO_1');
        this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, '5TH_OLD_3');

        this.dialog.say(STORY_0_TXT, 0, Gludo.PictID, '5TH_GLUDO_2');

        this.gfxShow(162); // glasses overlay
        // TODO: sndPlayFX("brille.voc");

        this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, '5TH_OLD_4');
        this.dialog.say(STORY_0_TXT, 0, Gludo.PictID, '5TH_GLUDO_3');
        this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, '5TH_OLD_5');

        this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, '5TH_MATT_1');
        this.dialog.say(STORY_0_TXT, 0, Gludo.PictID, '5TH_GLUDO_4');
        this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, '5TH_OLD_6');

        // TODO: sndPlayFX("streich.voc");

        this.gfxShow(153); // fire

        this.dialog.say(STORY_0_TXT, 0, Gludo.PictID, '5TH_GLUDO_5');
        this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, '5TH_OLD_7');

        this.gfxChangeColors(5, 'fade_out');

        this.scene.sceneArgs.returnValue = SCENE_WATLING;
    }

    /**
     * DART JAGER
     * Port of tcDoneDartJager from story.c
     * 
     * Matt encounters Lucas Grull (dart hunter) in prison
     */
    private tcDoneDartJager(): void {
        const Grull = this.db.getObject(Person_Lucas_Grull) as any;
        const Env = this.db.getObject(Environment_TheClou) as any;

        if (!Env.MattHasIdentityCard) {
            this.stopAnim();

            this.gfxShow(169); // prison

            this.db.knowsSet(Person_Matt_Stuvysunt, Person_Lucas_Grull);

            this.dialog.say(STORY_0_TXT, 0, Grull.PictID, 'DART_GRULL_0');
            const choice = this.dialog.say(STORY_0_TXT, 0, MATT_PICTID, 'DART_MATT_1');

            if (choice === 0) {
                this.dialog.say(STORY_0_TXT, 0, Grull.PictID, 'DART_GRULL_1');

                // TODO: sndPlayFX("darth.voc");

                this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'DART_JAEGER_0');

                this.gfxChangeColors(0, 'fade_out');
                this.gfxShow(221); // monastery

                // TODO: sndPlayFX("darth.voc");

                this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'DART_JAEGER_1');

                // TODO: sndPlaySound("end.bk", 0);
                this.mattGoesTo(60);
                this.dialog.say(STORY_0_TXT, 0, 155, 'THE_END_MONASTERY'); // holy matt

                this.stopAnim();
                this.gfxChangeColors(3, 'fade_out');

                this.scene.sceneArgs.returnValue = SCENE_NEW_GAME;
            } else {
                this.dialog.say(STORY_0_TXT, 0, Grull.PictID, 'DART_GRULL_2');
                this.dialog.say(STORY_0_TXT, 0, OLD_MATT_PICTID, 'DART_OLD_MATT_0');

                this.gfxShow(161); // police

                this.scene.sceneArgs.returnValue = SCENE_POLICE;
            }
        } else {
            this.scene.sceneArgs.returnValue = SCENE_POLICE;
        }
    }

    /**
     * SABIEN CALL
     * Port of tcDoneSabienCall from story.c
     * 
     * Sabien calls Matt
     */
    private tcDoneSabienCall(): void {
        this.somebodyIsCalling();

        this.dialog.say(STORY_0_TXT, 0, PHONE_PICTID, 'A_CALL_FOR_YOU');
        this.dialog.say(STORY_1_TXT, 0, PHONE_PICTID, 'ST_10_SABIEN');

        this.scene.sceneArgs.returnValue = SCENE_HOTEL_ROOM;
    }

    /**
     * MEETING AGAIN
     * Port of tcDoneMeetingAgain from story.c
     * 
     * Matt meets someone again
     */
    private tcDoneMeetingAgain(): void {
        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST_10_OLD_0');

        this.gfxChangeColors(3, 'fade_out');

        this.scene.sceneArgs.returnValue = SCENE_LISSON_GROVE;
    }

    /**
     * AGENT
     * Port of tcDoneAgent from story.c
     * 
     * Agent calls with money offer
     */
    private tcDoneAgent(): void {
        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST_14_OLD_0');

        this.somebodyIsCalling();

        this.dialog.say(STORY_1_TXT, 0, PHONE_PICTID, 'ST_14_AGENT_0');
        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST_14_OLD_1');

        // Note: GamePlayMode check for GP_MORE_MONEY cheat
        // For now, just use standard amount
        this.addPlayerMoney(15000);

        this.scene.sceneArgs.returnValue = SCENE_HOTEL_ROOM;
    }

    /**
     * GO AND FETCH JAGUAR
     * Port of tcDoneGoAndFetchJaguar from story.c
     * 
     * Matt is told to fetch the Jaguar
     */
    private tcDoneGoAndFetchJaguar(): void {
        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST_16_OLD_0');

        this.scene.sceneArgs.returnValue = SCENE_HOLLAND_STR;
    }

    /**
     * THINK OF SABIEN
     * Port of tcDoneThinkOfSabien from story.c
     * 
     * Matt thinks of Sabien
     */
    private tcDoneThinkOfSabien(): void {
        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST_16_OLD_1');

        this.scene.sceneArgs.returnValue = SCENE_HOLLAND_STR;
    }

    /**
     * SOUTHHAMPTON WITHOUT SABIEN
     * Port of tcDoneSouthhamptonWithoutSabien from story.c
     * 
     * Matt arrives in Southampton without Sabien
     */
    private tcDoneSouthhamptonWithoutSabien(): void {
        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST_20_OLD_0');

        this.scene.sceneArgs.returnValue = SCENE_SOUTHHAMPTON;
    }

    /**
     * SOUTHHAMPTON SABIEN UNKNOWN
     * Port of tcDoneSouthhamptonSabienUnknown from story.c
     * 
     * Matt arrives in Southampton, Sabien unknown
     */
    private tcDoneSouthhamptonSabienUnknown(): void {
        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST_20W_OLD_0');

        this.stopAnim();
        this.gfxChangeColors(0, 'fade_out');

        this.scene.sceneArgs.returnValue = SCENE_SOUTHHAMPTON;
    }

    /**
     * TERROR
     * Port of tcDoneTerror from story.c
     * 
     * Matt's Jaguar explodes
     */
    private tcDoneTerror(): void {
        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST_17_OLD_0');

        // TODO: gfxPrepareColl(211);
        // TODO: gfxPrepareColl(210);
        // TODO: gfxPrepareColl(209);

        this.gfxShow(176);
        // TODO: inpDelay(150);

        // TODO: sndPlayFX("explosio.voc");

        this.playAnim('Explo1', 1);
        // TODO: inpDelay(200);
        this.playAnim('Explo2', 50);
        // TODO: inpDelay(260);

        this.stopAnim();

        this.db.hasUnSet(Person_Matt_Stuvysunt, Car_Jaguar_XK_1950);

        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST_17_OLD_1');
        this.gfxChangeColors(0, 'fade_out');

        this.scene.sceneArgs.returnValue = SCENE_CARS_VANS;
    }

    /**
     * CONFESSING SABIEN
     * Port of tcDoneConfessingSabien from story.c
     * 
     * Matt confesses to Sabien - major story branch
     */
    private tcDoneConfessingSabien(): void {
        const Sabien = this.db.getObject(Person_Sabien_Pardo) as any;
        const Env = this.db.getObject(Environment_TheClou) as any;

        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST_18_OLD_0');
        this.dialog.say(STORY_1_TXT, 0, Sabien.PictID, 'ST_18_SABIEN_0');
        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST_18_OLD_1');
        this.dialog.say(STORY_1_TXT, 0, Sabien.PictID, 'ST_18_SABIEN_1');

        Env.WithOrWithoutYou = this.dialog.say(STORY_1_TXT, 0, MATT_PICTID, 'ST_18_MATT_0');

        this.stopAnim();

        if (Env.WithOrWithoutYou) {
            // Matt stays with Sabien - happy ending
            this.gfxChangeColors(3, 'fade_out');
            // TODO: ShowMenuBackground();

            this.gfxShow(163); // south 1
            this.gfxShow(152); // family

            // TODO: sndPlaySound("sabien.bk", 0);

            this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST_19_OLD_0');

            this.gfxShow(164); // The End

            // TODO: inpWaitFor(INP_LBUTTONP);
            this.gfxChangeColors(3, 'fade_out');

            this.scene.sceneArgs.returnValue = SCENE_NEW_GAME;
        } else {
            // Matt doesn't stay with Sabien
            this.addVTime(2713);

            this.gfxChangeColors(3, 'fade_out');

            this.scene.sceneArgs.returnValue = SCENE_SOUTHHAMPTON;

            this.film.setLocation(-1); // force fade in
        }
    }

    /**
     * 8TH BURGLARY
     * Port of tcDone8thBurglary from story.c
     * 
     * After 8th burglary - unlock villa location
     */
    private tcDone8thBurglary(): void {
        this.scene.addTaxiLocation(25); // villa

        // TODO: GetScene(SCENE_FAHNDUNG)->Geschehen = 0;
        this.scene.sceneArgs.returnValue = this.getLocSceneEventNr(this.film.getLocation());
    }

    /**
     * 9TH BURGLARY
     * Port of tcDone9thBurglary from story.c
     * 
     * After 9th burglary - endgame sequence
     */
    private tcDone9thBurglary(): void {
        const Env = this.db.getObject(Environment_TheClou) as any;

        this.film.setMinute(540);

        if (this.db.has(Person_Matt_Stuvysunt, Loot_Koffer)) {
            this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST_15_OLD_0');
            this.gfxShow(174); // cracks
        } else {
            this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST_15_OLD_NOT_0');
            this.dialog.setBubbleType('think');
            this.dialog.say(STORY_1_TXT, 0, MATT_PICTID, 'ST_15_MATT_NOT_0');

            this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST_15_OLD_NOT_1');
            this.gfxShow(174); // cracks
        }

        // TODO: inpDelay(150);
        this.gfxShow(173); // hotel

        this.dialog.say(STORY_1_TXT, 0, OLD_MATT_PICTID, 'ST_15_OLD_1');

        this.somebodyIsCalling();

        this.dialog.say(STORY_1_TXT, 0, PHONE_PICTID, 'ST_15_ALLEN_0');

        // Remove police from London
        this.db.livesInUnSet(London_London_1, Person_John_Gludo);
        this.db.livesInUnSet(London_London_1, Person_Miles_Chickenwing);
        this.db.livesInUnSet(London_London_1, Person_Red_Stanson);

        this.moveAPerson(Person_John_Gludo, Location_Nirvana);
        this.moveAPerson(Person_Miles_Chickenwing, Location_Nirvana);
        this.moveAPerson(Person_Red_Stanson, Location_Nirvana);

        // Reset taxi locations - only cars and lisson grove
        this.db.removeAllRelationsOfType(Relation_taxi);
        this.db.addRelationType(Relation_taxi);

        this.scene.addTaxiLocation(1); // cars

        if (Env.MattIsInLove) {
            this.scene.addTaxiLocation(61); // lisson
        }

        // Only GO and WAIT actions available
        this.film.setEnabledChoices(GO | WAIT);

        // TODO: GetScene(SCENE_FAHNDUNG)->Geschehen = 0;
        this.scene.sceneArgs.returnValue = this.getLocSceneEventNr(this.film.getLocation());
    }

    /**
     * Helper: Play animation
     */
    private playAnim(animName: string, duration: number): void {
        // Port of PlayAnim from C code
        // TODO: Implement animation playback
        console.log(`Play animation: ${animName} for ${duration}ms`);
    }

    /**
     * Helper: Play phone ringing sound
     */
    private somebodyIsCalling(): void {
        // Port of tcSomebodyIsCalling from story.c
        // Plays phone ringing sound effect multiple times
        // TODO: Implement sound effects
        console.log('Phone is ringing...');
    }

    /**
     * Helper: Get scene event number for a location
     */
    private getLocSceneEventNr(locNr: number): number {
        // Port of GetLocScene(locNr)->EventNr
        // For now, return a stub value
        // TODO: Implement proper scene lookup from film data
        console.log(`GetLocScene(${locNr})`);
        return 0;
    }

    /**
     * Helper: Add money to player
     */
    private addPlayerMoneyHelper(amount: number): void {
        this.addPlayerMoney(amount);
    }

    /**
     * Helper: Add building exactlyness
     */
    private addBuildExactlyness(building: Building, value: number): void {
        // Port of tcAddBuildExactlyness macro
        if (building.exactlyness !== undefined) {
            building.exactlyness = Math.min(255, Math.max(0, building.exactlyness + value));
        }
    }

    /**
     * Helper: Add building strike value
     */
    private addBuildStrike(building: Building, value: number): void {
        // Port of tcAddBuildStrike macro
        if (building.strike !== undefined) {
            building.strike = Math.min(255, Math.max(0, building.strike + value));
        }
    }

    /**
     * Helper: Present an object (show details)
     */
    private present(objectId: number, objectType: string): void {
        // Port of Present() function
        // For now, just log - full implementation would use PresentationService
        console.log(`Present ${objectType} ${objectId}`);
        
        if (this.presentation) {
            // TODO: Call presentation service methods based on objectType
        }
    }

    /**
     * Helper: Matt goes to a location
     */
    private mattGoesTo(locNr: number): void {
        // Port of tcMattGoesTo from gp_app.c
        // Sets location, refreshes title, shows time, fades out, plays animation
        this.film.setLocation(locNr);
        // TODO: Implement full location transition with graphics
        console.log(`Matt goes to location ${locNr}`);
    }

    /**
     * Helper: Time passes until specified minute
     */
    private asTimeGoesBy(untilMinute: number): void {
        // Port of tcAsTimeGoesBy from gp_app.c
        untilMinute = untilMinute % 1440;

        while (this.film.getMinute() !== untilMinute) {
            // TODO: Add delay (inpDelay)
            this.addVTime(1);

            if (this.film.getMinute() % 60 === 0) {
                // TODO: Show time
            }
        }
    }

    /**
     * Helper: Add virtual time (minutes)
     */
    private addVTime(minutes: number): void {
        // Port of AddVTime
        this.film.addMinutes(minutes);
    }

    /**
     * Helper: Set loot with value (hasSetP)
     */
    private hasSetP(personId: number, lootId: number, value: number): void {
        // Port of hasSetP macro - sets relation with property value
        this.db.hasSet(personId, lootId);
        
        // TODO: Set the value property on the loot object
        const loot = this.db.getObject(lootId);
        if (loot && 'value' in loot) {
            (loot as any).value = value;
        }
    }

    /**
     * Helper: Move a person to a new location
     * Port of tcMoveAPerson from gp_app.c
     */
    private moveAPerson(persId: number, newLocId: number): void {
        // Get all locations the person is currently at
        const locations = this.db.getRelatedObjects(persId, 'Has', 'Location');
        
        // Remove person from old locations
        for (const loc of locations) {
            this.db.hasUnSet(persId, loc.id);
            this.db.hasUnSet(loc.id, persId);
        }
        
        // Add person to new location
        this.db.hasSet(persId, newLocId);
        this.db.hasSet(newLocId, persId);
    }

    /**
     * Graphics stub: Show image
     */
    private gfxShow(imageId: number): void {
        // TODO: Implement graphics display
        console.log(`Show image ${imageId}`);
    }

    /**
     * Graphics stub: Stop animation
     */
    private stopAnim(): void {
        // TODO: Implement animation stop
        console.log('Stop animation');
    }

    /**
     * Graphics stub: Change colors/fade
     */
    private gfxChangeColors(): void {
        // TODO: Implement color change/fade
        console.log('Change colors');
    }

    /**
     * Reset story service state
     */
    reset(): void {
        this.playerMoney = 0;
        this.gamePlayMode = 0;
    }
}
