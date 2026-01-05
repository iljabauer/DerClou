/**
 * Planning Support Service - Port of planing/support.c
 * Helper functions for planning system
 */

import { Database } from '../core/Database';
import { LivingService } from './LivingService';
import { LandscapeService } from './LandscapeService';
import { PlanningSystemService } from './PlanningSystemService';
import { Building, LSObject, Person } from '../types/GameTypes';

// Constants
export const PLANING_AREA_CAR = 16;
export const PLANING_NR_LOOTS = 256;
export const PLANING_NR_GUARDS = 4;
export const PLANING_NR_PERSONS = 4;

export class PlanningSupportService {
    private db: Database;
    private living: LivingService;
    private landscape: LandscapeService;
    private system: PlanningSystemService;

    // Planning state arrays
    private planningLoot: number[] = [];
    private planningGuard: number[] = [];
    private planningWeight: number[] = [];
    private planningVolume: number[] = [];
    private planningNames: string[] = [];
    private burglarsNr: number = 0;
    private personsNr: number = 0;
    private currentPerson: number = 0;

    constructor(
        db: Database,
        living: LivingService,
        landscape: LandscapeService,
        system: PlanningSystemService
    ) {
        this.db = db;
        this.living = living;
        this.landscape = landscape;
        this.system = system;

        // Initialize arrays
        for (let i = 0; i < PLANING_NR_LOOTS; i++) {
            this.planningLoot[i] = 0;
        }
        for (let i = 0; i < PLANING_NR_GUARDS; i++) {
            this.planningGuard[i] = 0;
        }
        for (let i = 0; i < PLANING_NR_PERSONS; i++) {
            this.planningWeight[i] = 0;
            this.planningVolume[i] = 0;
            this.planningNames[i] = '';
        }
    }

    /**
     * Initialize planning data
     * Port of plPrepareData() from prepare.c
     */
    prepareData(): void {
        for (let i = 0; i < PLANING_NR_LOOTS; i++) {
            this.planningLoot[i] = 0;
        }
        for (let i = 0; i < PLANING_NR_PERSONS; i++) {
            this.planningWeight[i] = 0;
            this.planningVolume[i] = 0;
        }
        for (let i = 0; i < PLANING_NR_GUARDS; i++) {
            this.planningGuard[i] = 0;
        }
    }

    /**
     * Get next available loot slot
     * Port of plGetNextLoot() from support.c
     */
    getNextLoot(): number {
        for (let i = 0; i < PLANING_NR_LOOTS; i++) {
            if (!this.planningLoot[i]) {
                this.planningLoot[i] = 1;
                // TODO: Call lsAddLootBag when landscape service is complete
                // return this.landscape.addLootBag(
                //     this.living.getXPos(this.planningNames[this.currentPerson]),
                //     this.living.getYPos(this.planningNames[this.currentPerson]) + 5,
                //     i + 1
                // );
                return i + 9701; // Loot bag IDs start at 9701
            }
        }
        return 0;
    }

    /**
     * Check if all burglars are at the car
     * Port of plLivingsPosAtCar() from support.c
     */
    livingsPosAtCar(buildingId: number): boolean {
        const building = this.db.getObject(buildingId) as Building;
        if (!building) return false;

        const carXPos = building.carXPos + 8;
        const carYPos = building.carYPos + 8;

        // Get start area
        const areas = this.db.getRelations(buildingId, 'startsWithAll', 'LSArea');
        if (areas.length === 0) return false;

        const startAreaId = areas[0];

        for (let i = 0; i < this.burglarsNr; i++) {
            const xPos = this.living.getXPos(this.planningNames[i]);
            const yPos = this.living.getYPos(this.planningNames[i]);
            const whereIs = this.living.whereIs(this.planningNames[i]);

            // Check if in start area
            if (whereIs !== startAreaId) {
                return false;
            }

            // Check if within car area
            if (
                (xPos < carXPos - PLANING_AREA_CAR || xPos > carXPos + PLANING_AREA_CAR) &&
                (yPos < carYPos - PLANING_AREA_CAR || yPos > carYPos + PLANING_AREA_CAR)
            ) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if all burglars are in the car (at end of plan)
     * Port of plAllInCar() from support.c
     */
    allInCar(buildingId: number): boolean {
        let maxPerson = 0;
        let maxTimer = 0;
        const oldTimer = this.system.getCurrentTimer();
        const realCurrentPerson = this.currentPerson;

        // Find person with longest plan
        for (let i = 0; i < this.burglarsNr; i++) {
            const personId = this.getPersonId(i);
            this.system.setActiveHandler(personId);
            const timer = this.system.getMaxTimer();
            if (timer > maxTimer) {
                maxTimer = timer;
                maxPerson = i;
            }
        }

        // Set to person with longest plan
        const maxPersonId = this.getPersonId(maxPerson);
        this.system.setActiveHandler(maxPersonId);

        // TODO: Show message if person changed
        // TODO: Sync animation

        // Check if at car
        const ret = this.livingsPosAtCar(buildingId);

        // Restore current person
        this.currentPerson = realCurrentPerson;
        const currentPersonId = this.getPersonId(this.currentPerson);
        this.system.setActiveHandler(currentPersonId);

        return ret;
    }

    /**
     * Check if object is a stair
     * Port of plIsStair() from support.c
     */
    isStair(objId: number): boolean {
        const obj = this.db.getObject(objId) as LSObject;
        if (!obj) return false;
        // Item_Treppe = stairs
        return obj.type === 1; // TODO: Use constant from GameConstants
    }

    /**
     * Correct opened state of object
     * Port of plCorrectOpened() from support.c
     */
    correctOpened(obj: LSObject, open: boolean): void {
        // TODO: Implement when landscape service is complete
        // This function updates the visual state of doors/windows/etc
        // when they are opened or closed
        console.log(`[PlanningSupportService] correctOpened: ${obj.name}, open: ${open}`);
    }

    /**
     * Check if lock can be ignored (already unlocked or no lock)
     * Port of plIgnoreLock() from support.c
     */
    ignoreLock(objId: number): boolean {
        // Check if object has a lock
        const locks = this.db.getRelations(objId, 'hasLock');
        if (locks.length === 0) return true;

        // Check if lock is unlocked
        for (const lockId of locks) {
            const lockState = this.landscape.getObjectState(lockId);
            // Check if lock is unlocked (bit 1)
            if ((lockState & 2) === 0) {
                return false;
            }
        }

        return true;
    }

    /**
     * Move person in a direction
     * Port of plMove() from support.c
     */
    move(current: number, direction: number): void {
        // TODO: Implement when landscape service is complete
        // This function moves a person in the landscape
        console.log(`[PlanningSupportService] move: person ${current}, direction ${direction}`);
    }

    /**
     * Show work animation for person
     * Port of plWork() from support.c
     */
    work(current: number): void {
        // TODO: Implement when living service animation is complete
        // This function shows the work animation for a person
        console.log(`[PlanningSupportService] work: person ${current}`);
    }

    /**
     * Insert guard into action list
     * Port of plInsertGuard() from support.c
     */
    insertGuard(list: any[], current: number, guard: number): void {
        // TODO: Implement when needed
        // This function adds a guard to the list of objects that can be interacted with
        console.log(`[PlanningSupportService] insertGuard: current ${current}, guard ${guard}`);
    }

    /**
     * Check if object is in reach of person
     * Port of plObjectInReach() from support.c
     */
    objectInReach(current: number, objId: number): boolean {
        // TODO: Implement when landscape service is complete
        // This function checks if an object is close enough to interact with
        return true; // For now, assume everything is in reach
    }

    // Getters and setters for planning state
    getBurglarsNr(): number {
        return this.burglarsNr;
    }

    setBurglarsNr(value: number): void {
        this.burglarsNr = value;
    }

    getPersonsNr(): number {
        return this.personsNr;
    }

    setPersonsNr(value: number): void {
        this.personsNr = value;
    }

    getCurrentPerson(): number {
        return this.currentPerson;
    }

    setCurrentPerson(value: number): void {
        this.currentPerson = value;
    }

    getPlanningName(index: number): string {
        return this.planningNames[index] || '';
    }

    setPlanningName(index: number, name: string): void {
        this.planningNames[index] = name;
    }

    getPlanningWeight(index: number): number {
        return this.planningWeight[index] || 0;
    }

    setPlanningWeight(index: number, weight: number): void {
        this.planningWeight[index] = weight;
    }

    getPlanningVolume(index: number): number {
        return this.planningVolume[index] || 0;
    }

    setPlanningVolume(index: number, volume: number): void {
        this.planningVolume[index] = volume;
    }

    getPlanningGuard(index: number): number {
        return this.planningGuard[index] || 0;
    }

    setPlanningGuard(index: number, value: number): void {
        this.planningGuard[index] = value;
    }

    /**
     * Get person ID from index
     */
    private getPersonId(index: number): number {
        // TODO: Get from persons list
        // For now, return a placeholder
        return index + 1;
    }
}
