/**
 * Dialog Service - Port of src/dialog/dialog.c
 * 
 * Handles conversations, dialog trees, and character interactions.
 */

import { Scene } from 'phaser';
import { TextService } from './TextService';
import { UIService, BubbleOptions } from './UIService';
import { ImageService } from './ImageService';
import { Database } from '../core/Database';
import { Person, RelationType } from '../types/GameTypes';

// Text file IDs from theclou.h
export const BUSINESS_TXT = 2;
export const TALK_0_TXT = 16;
export const TALK_1_TXT = 17;
export const OBJECTS_ENUM_TXT = 3;
export const ABILITY_TXT = 4;

// Talk modes
export const DLG_TALKMODE_BUSINESS = 1;
export const DLG_TALKMODE_STANDARD = 2;

// Picture IDs
export const MATT_PICTID = 0; // Placeholder - need to find actual ID

// Talk bits (from tcdata.h)
export const TALK_JOB_OFFER = 0;
export const TALK_MY_JOB = 1;
export const TALK_PRISON = 2;
export const TALK_ABILITY = 3;

// Knowledge levels
export const KNOWN_UNKNOWN = 0;
export const KNOWN_KNOWN = 1;
export const KNOWN_FRIENDLY = 2;
export const KNOWN_BUSINESS = 3;

interface DynDlgNode {
    keyword: string;
    knownBefore: number;
    knownAfter: number;
}

export class DialogService {
    private scene: Scene;
    private textService: TextService;
    private uiService: UIService;
    private imageService: ImageService;
    private database: Database;
    private activPersonPictID: number = -1;

    constructor(
        scene: Scene,
        textService: TextService,
        uiService: UIService,
        imageService: ImageService,
        database: Database
    ) {
        this.scene = scene;
        this.textService = textService;
        this.uiService = uiService;
        this.imageService = imageService;
        this.database = database;
    }

    /**
     * Display dialog with text and optional choices
     * Port of Say() from dialog.c
     * 
     * @param textId - Text file ID (e.g., BUSINESS_TXT)
     * @param activ - Active choice index
     * @param person - Character picture ID (-1 for none)
     * @param text - Text key to look up
     * @returns Selected choice index
     */
    async say(
        textId: number,
        activ: number,
        person: number,
        text: string
    ): Promise<number> {
        // Get text lines from text file
        const lines = this.textService.getTextLines(textId, text);
        if (!lines || lines.length === 0) {
            console.warn(`No text found for key: ${text} in text file ${textId}`);
            return 0;
        }

        // Set active person picture
        if (person !== -1) {
            this.setPictID(person);
        }

        // Show bubble with text
        const bubbleOptions: BubbleOptions = {
            lines,
            activeIndex: activ,
            pictureId: this.activPersonPictID !== -1 ? this.activPersonPictID : undefined,
            bubbleType: 'speak'
        };

        const choice = await this.uiService.showBubble(bubbleOptions);
        
        return choice;
    }

    /**
     * Set the active person picture ID
     * Port of SetPictID() from interac.c
     */
    setPictID(pictId: number): void {
        this.activPersonPictID = pictId;
    }

    /**
     * Get the active person picture ID
     */
    getPictID(): number {
        return this.activPersonPictID;
    }

    /**
     * Display a bubble with text lines
     * Simplified version - full implementation in UIService
     * 
     * @param lines - Text lines to display
     * @param activ - Active choice index
     * @param pictureId - Character picture ID
     * @returns Selected choice index
     */
    async bubble(
        lines: string[],
        activ: number = 0,
        pictureId?: number
    ): Promise<number> {
        const bubbleOptions: BubbleOptions = {
            lines,
            activeIndex: activ,
            pictureId: pictureId !== undefined ? pictureId : this.activPersonPictID,
            bubbleType: 'speak'
        };

        return await this.uiService.showBubble(bubbleOptions);
    }

    /**
     * Display a thinking bubble
     */
    async think(
        lines: string[],
        activ: number = 0,
        pictureId?: number
    ): Promise<number> {
        const bubbleOptions: BubbleOptions = {
            lines,
            activeIndex: activ,
            pictureId: pictureId !== undefined ? pictureId : this.activPersonPictID,
            bubbleType: 'think'
        };

        return await this.uiService.showBubble(bubbleOptions);
    }

    /**
     * Check if person1 knows person2
     */
    private knows(person1Id: number, person2Id: number): boolean {
        return this.database.hasRelation(person1Id, person2Id, RelationType.Knows);
    }

    /**
     * Set that person1 knows person2
     */
    private knowsSet(person1Id: number, person2Id: number): void {
        if (!this.knows(person1Id, person2Id)) {
            this.database.addRelation(person1Id, person2Id, RelationType.Knows);
        }
    }

    /**
     * Change person popularity (bounded 0-255)
     */
    private chgPersPopularity(person: Person, value: number): void {
        person.popularity = Math.max(0, Math.min(255, person.popularity + value));
    }

    /**
     * Parse talk text and extract keywords
     * Port of ParseTalkText() from dialog.c
     */
    private parseTalkText(
        originLines: string[],
        known: number
    ): { bubbleLines: string[], keywords: DynDlgNode[] } {
        const bubbleLines: string[] = [];
        const keywords: DynDlgNode[] = [];

        for (const mem of originLines) {
            let line = '';
            let i = 0;

            while (i < mem.length) {
                if (mem[i] !== '[') {
                    line += mem[i];
                    i++;
                } else {
                    i++;
                    
                    let key = '';
                    while (i < mem.length && mem[i] !== ']') {
                        key += mem[i];
                        i++;
                    }
                    
                    i++;

                    if (key.length >= 6) {
                        const knownBefore = parseInt(key.substring(0, 3));
                        const knownAfter = parseInt(key.substring(key.length - 3));
                        const keyword = key.substring(3, key.length - 3);

                        line += keyword;

                        if (known >= knownBefore) {
                            keywords.push({
                                keyword,
                                knownBefore,
                                knownAfter
                            });
                        }
                    }
                }
            }

            bubbleLines.push(line);
        }

        return { bubbleLines, keywords };
    }

    /**
     * Prepare question list from keywords and talk bits
     * Port of PrepareQuestions() from dialog.c
     */
    private prepareQuestions(
        keywords: DynDlgNode[],
        talkBits: number,
        textId: number
    ): string[] {
        const questions: string[] = [];

        const stdQuestions = this.textService.getTextLines(BUSINESS_TXT, 'STD_QUEST');
        const questionTemplates = this.textService.getTextLines(textId, 'QUESTIONS');

        for (const keywordNode of keywords) {
            const r = Math.floor(Math.random() * questionTemplates.length);
            const template = questionTemplates[r];
            const question = template.replace('%s', keywordNode.keyword);
            questions.push(question);
        }

        for (let i = 0; i < 32; i++) {
            if (talkBits & (1 << i)) {
                if (i < stdQuestions.length) {
                    questions.push(stdQuestions[i]);
                }
            }
        }

        const byeLine = this.textService.getFirstLine(BUSINESS_TXT, 'Bye_says_Matt');
        questions.push(byeLine);

        return questions;
    }

    /**
     * Dynamic conversation between two characters
     * Port of DynamicTalk() from dialog.c
     */
    async dynamicTalk(
        person1Id: number,
        person2Id: number,
        talkMode: number
    ): Promise<void> {
        const p1 = this.database.getObject(person1Id) as Person;
        const p2 = this.database.getObject(person2Id) as Person;

        if (!p1 || !p2) {
            console.error(`DynamicTalk: Invalid person IDs ${person1Id}, ${person2Id}`);
            return;
        }

        const extensions = ['_UNKNOWN', '_KNOWN', '_FRIENDLY', '_BUSINESS'];
        const standard = 'STANDARD';
        let known = KNOWN_UNKNOWN;

        this.chgPersPopularity(p1, 5);

        let key = p2.name;
        
        if (talkMode & DLG_TALKMODE_BUSINESS) {
            this.knowsSet(person1Id, person2Id);
            known = KNOWN_BUSINESS;
        } else {
            if (!this.knows(person1Id, person2Id)) {
                known = KNOWN_UNKNOWN;
                this.knowsSet(person1Id, person2Id);
            } else {
                known = KNOWN_KNOWN;
            }
        }

        key += extensions[known];

        const textId = p2.talkFileId ? TALK_1_TXT : TALK_0_TXT;

        if (!this.textService.keyExists(textId, key)) {
            key = standard + extensions[known];
        }

        let choice = 0;
        let quit = false;

        while (!quit) {
            const originLines = this.textService.getTextLines(textId, key);
            const { bubbleLines, keywords } = this.parseTalkText(originLines, p2.known);
            const questions = this.prepareQuestions(keywords, p2.talkBits, textId);

            let stdCount = 0;
            for (let i = 0; i < 32; i++) {
                if (p2.talkBits & (1 << i)) {
                    stdCount++;
                }
            }

            const genCount = Math.max(0, keywords.length);
            const quitIndex = questions.length - 1;

            if (choice < genCount) {
                this.setPictID(p2.pictId);
                await this.bubble(bubbleLines, 0, p2.pictId);
            }

            this.setPictID(MATT_PICTID);
            choice = await this.bubble(questions, 0, MATT_PICTID);

            if (choice === quitIndex) {
                quit = true;
            } else if (choice < genCount) {
                const keywordNode = keywords[choice];
                key = p2.name + '_' + keywordNode.keyword;

                if (keywordNode.knownAfter > p2.known) {
                    p2.known = keywordNode.knownAfter;
                }
            } else if (choice >= genCount && choice < quitIndex) {
                const stdIndex = choice - genCount;
                
                let bitIndex = 0;
                let count = 0;
                for (let i = 0; i < 32; i++) {
                    if (p2.talkBits & (1 << i)) {
                        if (count === stdIndex) {
                            bitIndex = i;
                            break;
                        }
                        count++;
                    }
                }

                await this.handleStandardQuestion(bitIndex, p1, p2);
            }
        }
    }

    /**
     * Handle standard questions (job offer, prison, etc.)
     */
    private async handleStandardQuestion(
        bitIndex: number,
        p1: Person,
        p2: Person
    ): Promise<void> {
        switch (bitIndex) {
            case TALK_JOB_OFFER:
                await this.tcJobOffer(p1, p2);
                this.chgPersPopularity(p1, 10);
                break;
            case TALK_MY_JOB:
                await this.tcMyJobAnswer(p2);
                break;
            case TALK_PRISON:
                await this.tcPrisonAnswer(p2);
                break;
            case TALK_ABILITY:
                await this.tcAbilityAnswer(p2);
                break;
        }
    }

    /**
     * Job offer conversation
     */
    private async tcJobOffer(p1: Person, p2: Person): Promise<void> {
        await this.say(BUSINESS_TXT, 0, MATT_PICTID, 'PERS_ANZ');
    }

    /**
     * My job answer
     */
    private async tcMyJobAnswer(p2: Person): Promise<void> {
        this.setPictID(p2.pictId);
        await this.bubble(['I have a job...'], 0, p2.pictId);
    }

    /**
     * Prison answer
     */
    private async tcPrisonAnswer(p2: Person): Promise<void> {
        this.setPictID(p2.pictId);
        await this.bubble(['I\'ve never been to prison...'], 0, p2.pictId);
    }

    /**
     * Ability answer
     */
    private async tcAbilityAnswer(p2: Person): Promise<void> {
        this.setPictID(p2.pictId);
        await this.bubble(['Let me tell you about my abilities...'], 0, p2.pictId);
    }

    /**
     * Initiate conversation with a person at current location
     * Port of Talk() from dialog.c
     * 
     * Requires location system to be implemented:
     * - GetLocation() - Get current location
     * - hasAll() - Get all persons at location
     * - PersonWorksHere() - Check if person works at location
     * 
     * @returns Event number (0 for now)
     */
    async talk(currentLocation: number): Promise<number> {
        // Get location object ID
        const locationId = this.getObjNrOfLocation(currentLocation);
        
        if (!locationId) {
            console.warn('Talk: No location object found');
            return 0;
        }

        // Get all persons at this location
        const persons = this.db.hasAll(locationId, 0x01 | 0x02 | 0x04, 'Person');
        
        if (persons.length === 0) {
            // Nobody here
            await this.say(BUSINESS_TXT, 0, MATT_PICTID, 'NOBODY HERE');
            return 0;
        }

        // Sort persons by name
        persons.sort((a, b) => {
            const nameA = (a as any).Name || '';
            const nameB = (b as any).Name || '';
            return nameA.localeCompare(nameB);
        });

        // Create bubble menu with person names
        const helloFriends = this.textService.getFirstLine(BUSINESS_TXT, 'NO_CHOICE');
        const personNames = persons.map(p => (p as any).Name || 'Unknown');
        personNames.push(helloFriends); // Add "enough" option

        // Show selection bubble
        const choice = await this.uiService.showBubble({
            lines: personNames,
            activeIndex: 0,
            bubbleType: 'speak'
        });

        // Check if user cancelled or selected "enough"
        if (choice === 255 || choice >= persons.length) {
            return 0;
        }

        // Get selected person
        const selectedPerson = persons[choice];
        const personId = (selectedPerson as any).objId || 0;

        // Check if person works here
        const worksHere = this.personWorksHere(personId, locationId);

        // Start conversation
        if (worksHere) {
            await this.dynamicTalk(9801, personId, DLG_TALKMODE_BUSINESS); // Matt's ID
        } else {
            await this.dynamicTalk(9801, personId, DLG_TALKMODE_STANDARD);
        }

        return 0;
    }

    /**
     * Get object number of location
     * Helper function to get location object ID from location number
     */
    private getObjNrOfLocation(locationNr: number): number {
        // TODO: Implement proper location lookup
        // For now, return a stub value
        return locationNr;
    }

    /**
     * Check if person works at location
     * Port of PersonWorksHere() from dialog.c
     */
    private personWorksHere(personId: number, locationId: number): boolean {
        // Check if person has "works_in" relation to location
        return this.db.hasRelation(personId, locationId, RelationType.WorksIn);
    }
}
