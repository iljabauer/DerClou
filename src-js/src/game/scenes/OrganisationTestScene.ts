/**
 * Organisation Test Scene
 * Tests the OrganisationService (team/car/driver selection)
 */

import { Scene } from 'phaser';
import { Database } from '../core/Database';
import { DataLoader } from '../services/DataLoader';
import { TextService } from '../services/TextService';
import { UIService } from '../services/UIService';
import { DialogService } from '../services/DialogService';
import { PlanningService } from '../services/PlanningService';
import { FilmService } from '../services/FilmService';
import { OrganisationService } from '../services/OrganisationService';
import { Person_Matt_Stuvysunt, Ability_Autos } from '../types/GameConstants';

export class OrganisationTestScene extends Scene {
    private database!: Database;
    private dataLoader!: DataLoader;
    private textService!: TextService;
    private uiService!: UIService;
    private dialogService!: DialogService;
    private planningService!: PlanningService;
    private filmService!: FilmService;
    private organisationService!: OrganisationService;

    constructor() {
        super('OrganisationTestScene');
    }

    async create() {
        console.log('OrganisationTestScene: Starting...');

        // Initialize database
        this.database = new Database();

        // Initialize data loader
        this.dataLoader = new DataLoader(this, this.database);

        // Load all data
        console.log('Loading game data...');
        await this.dataLoader.loadAllData();
        console.log('Game data loaded successfully');

        // Initialize text service
        this.textService = new TextService(this);
        await this.textService.loadLanguage('english');
        console.log('Text service initialized');

        // Initialize UI service
        this.uiService = new UIService(this, this.textService);
        console.log('UI service initialized');

        // Initialize dialog service
        this.dialogService = new DialogService(
            this,
            this.database,
            this.textService,
            this.uiService
        );
        console.log('Dialog service initialized');

        // Initialize film service
        this.filmService = new FilmService(this.database);
        console.log('Film service initialized');

        // Initialize planning service
        this.planningService = new PlanningService(
            this,
            this.database,
            this.textService,
            this.uiService
        );
        console.log('Planning service initialized');

        // Initialize organisation service
        this.organisationService = new OrganisationService(
            this,
            this.database,
            this.textService,
            this.uiService,
            this.dialogService,
            this.planningService,
            this.filmService
        );
        console.log('Organisation service initialized');

        // Set up test data
        this.setupTestData();

        // Show instructions
        const instructions = this.add.text(10, 10, 
            'Organisation Test Scene\n' +
            'Press SPACE to test organisation menu\n' +
            'Press ESC to exit',
            { 
                fontSize: '16px', 
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 10, y: 10 }
            }
        );

        // Add keyboard input
        this.input.keyboard?.on('keydown-SPACE', async () => {
            console.log('Testing organisation menu...');
            const result = await this.organisationService.tcOrganisation();
            console.log('Organisation result:', result);
            
            if (result) {
                console.log('Building selected:', result);
                const building = this.database.getObject(result);
                console.log('Building data:', building);
            } else {
                console.log('Organisation cancelled');
            }
        });

        this.input.keyboard?.on('keydown-ESC', () => {
            console.log('Exiting test scene');
            this.scene.start('GameScene');
        });

        console.log('OrganisationTestScene: Ready');
    }

    /**
     * Set up test data for organisation
     */
    private setupTestData(): void {
        // Add some test relations for Matt
        // These would normally be set up through gameplay

        // Give Matt some buildings (from investigation)
        const buildings = this.database.getObjectsByType('Building');
        if (buildings.length > 0) {
            // Add first 3 buildings to Matt's "has" relation
            for (let i = 0; i < Math.min(3, buildings.length); i++) {
                this.database.addRelation(
                    Person_Matt_Stuvysunt,
                    'has',
                    buildings[i].id
                );
            }
            console.log(`Added ${Math.min(3, buildings.length)} buildings to Matt`);
        }

        // Give Matt some cars
        const cars = this.database.getObjectsByType('Car');
        if (cars.length > 0) {
            // Add first 2 cars to Matt's "has" relation
            for (let i = 0; i < Math.min(2, cars.length); i++) {
                this.database.addRelation(
                    Person_Matt_Stuvysunt,
                    'has',
                    cars[i].id
                );
            }
            console.log(`Added ${Math.min(2, cars.length)} cars to Matt`);
        }

        // Give Matt some team members
        const persons = this.database.getObjectsByType('Person');
        if (persons.length > 0) {
            // Add first 5 persons (excluding Matt) to "join" relation
            let added = 0;
            for (const person of persons) {
                if (person.id !== Person_Matt_Stuvysunt && added < 5) {
                    this.database.addRelation(
                        Person_Matt_Stuvysunt,
                        'join',
                        person.id
                    );
                    added++;
                }
            }
            console.log(`Added ${added} persons to Matt's team pool`);
        }

        // Give some persons the driving ability
        const drivingAbility = Ability_Autos;
        let driversAdded = 0;
        for (const person of persons) {
            if (person.id !== Person_Matt_Stuvysunt && driversAdded < 3) {
                this.database.addRelation(
                    person.id,
                    'has',
                    drivingAbility
                );
                driversAdded++;
            }
        }
        console.log(`Added driving ability to ${driversAdded} persons`);

        console.log('Test data setup complete');
    }
}
