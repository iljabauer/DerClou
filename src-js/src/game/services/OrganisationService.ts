/**
 * Organisation Service - Port of src/organisa/organisa.c
 * 
 * Handles team selection, car selection, and driver selection
 * before planning a burglary.
 */

import { Scene } from 'phaser';
import { Database } from '../core/Database';
import { Person, Car, Building } from '../types/GameTypes';
import { TextService } from './TextService';
import { UIService } from './UIService';
import { DialogService } from './DialogService';
import { PlanningService } from './PlanningService';
import { FilmService } from './FilmService';
import { GameConstants } from '../core/GameConstants';

export interface OrganisationState {
    buildingId: number;
    carId: number;
    driverId: number;
    guyCount: number;
    placesInCar: number;
}

export class OrganisationService {
    private scene: Scene;
    private database: Database;
    private textService: TextService;
    private uiService: UIService;
    private dialogService: DialogService;
    private planningService: PlanningService;
    private filmService: FilmService;

    private state: OrganisationState = {
        buildingId: 0,
        carId: 0,
        driverId: 0,
        guyCount: 0,
        placesInCar: 0
    };

    constructor(
        scene: Scene,
        database: Database,
        textService: TextService,
        uiService: UIService,
        dialogService: DialogService,
        planningService: PlanningService,
        filmService: FilmService
    ) {
        this.scene = scene;
        this.database = database;
        this.textService = textService;
        this.uiService = uiService;
        this.dialogService = dialogService;
        this.planningService = planningService;
        this.filmService = filmService;
    }

    /**
     * Reset organisation state
     */
    reset(): void {
        this.state = {
            buildingId: 0,
            carId: 0,
            driverId: 0,
            guyCount: 0,
            placesInCar: 0
        };
    }

    /**
     * Main organisation menu
     * Returns building ID if successful, 0 if cancelled
     */
    async tcOrganisation(): Promise<number> {
        const menuItems = this.textService.getTextLines('MENU_TXT', 'ORGANISATION');
        let activeChoice = 0;
        let done = false;

        // Initialize building
        this.initializeBuilding();

        // Initialize car
        this.initializeCar();

        // Initialize driver
        this.initializeDriver();

        // Check if car can fit everyone
        if (!this.makeCarOk()) {
            return 0;
        }

        // Main menu loop
        while (!done) {
            const choices = [
                'Choose Building',
                'Choose Team',
                'Choose Car',
                'Choose Driver',
                'Information',
                'Plan',
                'Execute',
                'Return'
            ];

            const result = await this.uiService.showMenu(
                choices,
                activeChoice,
                'Organisation'
            );

            if (result === null) {
                done = true;
                continue;
            }

            activeChoice = result;

            switch (result) {
                case 0: // Choose Building
                    this.state.buildingId = await this.chooseDestBuilding(this.state.buildingId);
                    break;

                case 1: // Choose Team
                    await this.chooseGuys();
                    break;

                case 2: // Choose Car
                    this.state.carId = await this.chooseEscapeCar(this.state.carId);
                    break;

                case 3: // Choose Driver
                    this.state.driverId = await this.chooseDriver(this.state.driverId);
                    break;

                case 4: // Information
                    // TODO: Call Information() from SceneService
                    break;

                case 5: // Plan
                    if (!this.state.buildingId) {
                        this.state.buildingId = await this.chooseDestBuilding(this.state.buildingId);
                    }

                    if (this.checkOrganisation()) {
                        await this.planningService.planner(this.state.buildingId);
                    }
                    break;

                case 6: // Execute
                    if (this.checkOrganisation()) {
                        done = true;
                        return this.state.buildingId;
                    }
                    break;

                case 7: // Return
                    done = true;
                    break;
            }
        }

        return 0;
    }

    /**
     * Initialize building selection
     */
    private initializeBuilding(): void {
        // Get all buildings Matt has
        const buildings = this.database.getRelatedObjects(
            GameConstants.Person_Matt_Stuvysunt,
            'has',
            'Building'
        );

        if (buildings.length > 0) {
            this.state.buildingId = buildings[0].id;
        } else {
            this.setBuilding();
        }
    }

    /**
     * Initialize car selection
     */
    private initializeCar(): void {
        // Get all cars Matt has
        const cars = this.database.getRelatedObjects(
            GameConstants.Person_Matt_Stuvysunt,
            'has',
            'Car'
        );

        if (cars.length > 0) {
            this.state.carId = cars[0].id;
            const car = this.database.getObject(this.state.carId) as Car;
            if (car) {
                this.state.placesInCar = car.placesInCar;
            }
        } else {
            this.setCar();
        }
    }

    /**
     * Initialize driver selection
     */
    private initializeDriver(): void {
        // Get all persons Matt knows
        const persons = this.database.getRelatedObjects(
            GameConstants.Person_Matt_Stuvysunt,
            'joined_by',
            'Person'
        );

        if (persons.length > 0) {
            this.state.driverId = persons[0].id;
        }
    }

    /**
     * Set default building
     */
    private setBuilding(): void {
        const buildings = this.database.getRelatedObjects(
            GameConstants.Person_Matt_Stuvysunt,
            'has',
            'Building'
        );

        if (buildings.length > 0) {
            this.state.buildingId = buildings[0].id;
        }
    }

    /**
     * Set default car
     */
    private setCar(): void {
        const cars = this.database.getRelatedObjects(
            GameConstants.Person_Matt_Stuvysunt,
            'has',
            'Car'
        );

        if (cars.length > 0) {
            this.state.carId = cars[0].id;
            const car = this.database.getObject(this.state.carId) as Car;
            if (car) {
                this.state.placesInCar = car.placesInCar;
            }
        }
    }

    /**
     * Check if car can fit all team members
     */
    private async makeCarOk(): Promise<boolean> {
        const teamMembers = this.database.getRelatedObjects(
            GameConstants.Person_Matt_Stuvysunt,
            'joined_by',
            'Person'
        );

        if (teamMembers.length > this.state.placesInCar) {
            await this.dialogService.think('PLAN_TO_MANY_GUYS');

            // Remove team members until car fits
            while (teamMembers.length > this.state.placesInCar) {
                const choices = teamMembers
                    .filter(p => p.id !== GameConstants.Person_Matt_Stuvysunt)
                    .map(p => {
                        const person = this.database.getObject(p.id) as Person;
                        return person ? person.name : 'Unknown';
                    });

                const result = await this.uiService.showMenu(
                    choices,
                    0,
                    'Remove Team Member'
                );

                if (result === null) {
                    return false;
                }

                const personToRemove = teamMembers[result];
                this.database.removeRelation(
                    GameConstants.Person_Matt_Stuvysunt,
                    'joined_by',
                    personToRemove.id
                );

                this.state.guyCount--;
                teamMembers.splice(result, 1);
            }
        }

        return true;
    }

    /**
     * Choose destination building
     */
    private async chooseDestBuilding(currentBuildingId: number): Promise<number> {
        const buildings = this.database.getRelatedObjects(
            GameConstants.Person_Matt_Stuvysunt,
            'has',
            'Building'
        );

        if (buildings.length === 0) {
            return currentBuildingId;
        }

        const choices = buildings.map(b => {
            const building = this.database.getObject(b.id) as Building;
            return building ? building.name : 'Unknown';
        });

        // Add "No choice" option
        choices.push(this.textService.getFirstLine('BUSINESS_TXT', 'NO_CHOICE'));

        const result = await this.uiService.showMenu(
            choices,
            0,
            'Choose Building'
        );

        if (result === null || result === choices.length - 1) {
            return currentBuildingId;
        }

        return buildings[result].id;
    }

    /**
     * Choose escape car
     */
    private async chooseEscapeCar(currentCarId: number): Promise<number> {
        const cars = this.database.getRelatedObjects(
            GameConstants.Person_Matt_Stuvysunt,
            'has',
            'Car'
        );

        if (cars.length === 0) {
            await this.dialogService.think('PLAN_WITHOUT_CAR');
            return currentCarId;
        }

        const teamMembers = this.database.getRelatedObjects(
            GameConstants.Person_Matt_Stuvysunt,
            'joined_by',
            'Person'
        );

        const choices = cars.map(c => {
            const car = this.database.getObject(c.id) as Car;
            return car ? car.name : 'Unknown';
        });

        // Add "No choice" option
        choices.push(this.textService.getFirstLine('BUSINESS_TXT', 'NO_CHOICE'));

        const result = await this.uiService.showMenu(
            choices,
            0,
            'Choose Car'
        );

        if (result === null || result === choices.length - 1) {
            return currentCarId;
        }

        const selectedCar = this.database.getObject(cars[result].id) as Car;
        if (!selectedCar) {
            return currentCarId;
        }

        // Check if car can fit team
        if (teamMembers.length <= selectedCar.placesInCar) {
            this.state.placesInCar = selectedCar.placesInCar;
            return cars[result].id;
        } else {
            await this.dialogService.think('PLAN_NO_PLACE');
            return currentCarId;
        }
    }

    /**
     * Choose driver
     */
    private async chooseDriver(currentDriverId: number): Promise<number> {
        const teamMembers = this.database.getRelatedObjects(
            GameConstants.Person_Matt_Stuvysunt,
            'joined_by',
            'Person'
        );

        if (teamMembers.length === 0) {
            await this.dialogService.think('PLAN_TO_FEW_GUYS');
            return currentDriverId;
        }

        const choices = teamMembers.map(p => {
            const person = this.database.getObject(p.id) as Person;
            return person ? person.name : 'Unknown';
        });

        // Add "No choice" option
        choices.push(this.textService.getFirstLine('BUSINESS_TXT', 'NO_CHOICE'));

        const result = await this.uiService.showMenu(
            choices,
            0,
            'Choose Driver'
        );

        if (result === null || result === choices.length - 1) {
            return currentDriverId;
        }

        const selectedPerson = teamMembers[result];

        // Check if person can drive
        const canDrive = this.database.hasRelation(
            selectedPerson.id,
            'has',
            GameConstants.Ability_Autos
        );

        if (!canDrive) {
            const person = this.database.getObject(selectedPerson.id) as Person;
            if (person) {
                await this.dialogService.say(
                    'PLAN_CANT_DRIVE',
                    person.pictId || 0
                );
            }
            return currentDriverId;
        }

        return selectedPerson.id;
    }

    /**
     * Choose team members
     */
    private async chooseGuys(): Promise<void> {
        const availablePersons = this.database.getRelatedObjects(
            GameConstants.Person_Matt_Stuvysunt,
            'join',
            'Person'
        );

        if (availablePersons.length === 0) {
            await this.dialogService.think('PLAN_WITHOUT_GUYS');
            return;
        }

        let done = false;

        while (!done) {
            const choices = [
                'Add Team Member',
                'Remove Team Member',
                'Return'
            ];

            const result = await this.uiService.showMenu(
                choices,
                0,
                'Team Selection'
            );

            if (result === null || result === 2) {
                done = true;
                continue;
            }

            switch (result) {
                case 0: // Add
                    await this.addGuyToParty();
                    break;

                case 1: // Remove
                    await this.removeGuyFromParty();
                    break;
            }
        }
    }

    /**
     * Add a team member
     */
    private async addGuyToParty(): Promise<void> {
        const teamMembers = this.database.getRelatedObjects(
            GameConstants.Person_Matt_Stuvysunt,
            'joined_by',
            'Person'
        );

        if (teamMembers.length >= this.state.placesInCar) {
            await this.dialogService.think('PLAN_CAR_FULL');
            return;
        }

        const availablePersons = this.database.getRelatedObjects(
            GameConstants.Person_Matt_Stuvysunt,
            'join',
            'Person'
        );

        // Filter out already selected team members
        const notInTeam = availablePersons.filter(
            p => !teamMembers.some(t => t.id === p.id)
        );

        if (notInTeam.length === 0) {
            await this.dialogService.think('PLAN_DO_NOT_KNOW_ANYBODY');
            return;
        }

        const choices = notInTeam.map(p => {
            const person = this.database.getObject(p.id) as Person;
            return person ? person.name : 'Unknown';
        });

        // Add "No choice" option
        choices.push(this.textService.getFirstLine('BUSINESS_TXT', 'NO_CHOICE'));

        const result = await this.uiService.showMenu(
            choices,
            0,
            'Add Team Member'
        );

        if (result === null || result === choices.length - 1) {
            return;
        }

        const selectedPerson = notInTeam[result];
        this.database.addRelation(
            GameConstants.Person_Matt_Stuvysunt,
            'joined_by',
            selectedPerson.id
        );

        this.state.guyCount++;
    }

    /**
     * Remove a team member
     */
    private async removeGuyFromParty(): Promise<void> {
        const teamMembers = this.database.getRelatedObjects(
            GameConstants.Person_Matt_Stuvysunt,
            'joined_by',
            'Person'
        );

        // Filter out Matt
        const removableMembers = teamMembers.filter(
            p => p.id !== GameConstants.Person_Matt_Stuvysunt
        );

        if (removableMembers.length === 0) {
            await this.dialogService.think('PLAN_TO_FEW_GUYS');
            return;
        }

        const choices = removableMembers.map(p => {
            const person = this.database.getObject(p.id) as Person;
            return person ? person.name : 'Unknown';
        });

        // Add "No choice" option
        choices.push(this.textService.getFirstLine('BUSINESS_TXT', 'NO_CHOICE'));

        const result = await this.uiService.showMenu(
            choices,
            0,
            'Remove Team Member'
        );

        if (result === null || result === choices.length - 1) {
            return;
        }

        const personToRemove = removableMembers[result];
        this.database.removeRelation(
            GameConstants.Person_Matt_Stuvysunt,
            'joined_by',
            personToRemove.id
        );

        this.state.guyCount--;
    }

    /**
     * Check if organisation is valid
     */
    private checkOrganisation(): boolean {
        if (!this.state.buildingId) {
            return false;
        }

        const building = this.database.getObject(this.state.buildingId) as Building;
        if (!building) {
            return false;
        }

        // Check if building is investigated enough
        if (building.exactlyness <= 127) {
            return false;
        }

        // Check if driver is selected
        if (!this.state.driverId) {
            return false;
        }

        // TODO: Add more checks from C code

        return true;
    }

    /**
     * Get current organisation state
     */
    getState(): OrganisationState {
        return { ...this.state };
    }
}
