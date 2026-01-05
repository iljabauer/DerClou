/**
 * Interaction Test Scene
 * 
 * Tests the InteractionService with a simple action menu.
 */

import Phaser from 'phaser';
import { Database } from '../core/Database';
import { UIService } from '../services/UIService';
import { TextService } from '../services/TextService';
import { DataLoader } from '../services/DataLoader';
import { SceneService } from '../services/SceneService';
import { DialogService } from '../services/DialogService';
import { FilmService } from '../services/FilmService';
import { InteractionService } from '../services/InteractionService';
import { InvestigationService } from '../services/InvestigationService';
import { BackgroundService, BackgroundId } from '../services/BackgroundService';
import { ImageService } from '../services/ImageService';
import { GameState } from '../core/GameState';
import {
    GO, WAIT, BUSINESS_TALK, LOOK, INFO,
    Person_Matt_Stuvysunt,
    Environment_TheClou
} from '../types/GameConstants';

export class InteractionTestScene extends Phaser.Scene {
    private db!: Database;
    private ui!: UIService;
    private text!: TextService;
    private dataLoader!: DataLoader;
    private sceneService!: SceneService;
    private dialog!: DialogService;
    private film!: FilmService;
    private interaction!: InteractionService;
    private investigation!: InvestigationService;
    private background!: BackgroundService;
    private image!: ImageService;
    private gameState!: GameState;

    constructor() {
        super({ key: 'InteractionTestScene' });
    }

    async create() {
        console.log('=== Interaction Test Scene ===');

        // Initialize services
        this.db = new Database();
        this.gameState = new GameState();
        this.ui = new UIService(this);
        this.text = new TextService();
        this.image = new ImageService();
        this.dataLoader = new DataLoader(this.db, this.text);
        this.film = new FilmService(this.db);
        this.background = new BackgroundService(this, this.image);
        this.sceneService = new SceneService(this, this.db, this.ui, this.text, this.film);
        this.dialog = new DialogService(this, this.db, this.ui, this.text);
        this.investigation = new InvestigationService(this.db, this.gameState, this.text, this.ui);
        this.interaction = new InteractionService(
            this,
            this.db,
            this.ui,
            this.text,
            this.sceneService,
            this.dialog,
            this.film,
            this.investigation
        );

        // Load data
        console.log('Loading game data...');
        await this.dataLoader.loadAllData();
        console.log('Data loaded successfully');

        // Load images
        console.log('Loading images...');
        await this.image.loadCollectionList();
        console.log('Images loaded successfully');

        // Load story file
        console.log('Loading story file...');
        const storyLoaded = await this.film.initStory('../gamedata/DATA/TCSTORY.PC');
        if (storyLoaded) {
            console.log('Story file loaded successfully');
        } else {
            console.warn('Failed to load story file - using stub data');
        }

        // Set up test environment
        const env = this.db.getObject(Environment_TheClou) as any;
        if (env) {
            env.CurrDay = 1;
            env.CurrMinute = 480; // 8:00 AM
        }

        // Set Matt's current location (Hotel Room)
        const matt = this.db.getObject(Person_Matt_Stuvysunt) as any;
        if (matt) {
            matt.CurrScene = 1; // Hotel Room scene
        }

        // Set current location
        this.film.setLocation(1); // Hotel Room

        // Display title
        this.add.text(400, 50, 'Interaction System Test', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Display instructions
        const instructions = [
            'Testing the main action menu',
            '',
            'Available actions:',
            '- GO: Navigate to other locations',
            '- WAIT: Wait and advance time',
            '- LOOK: Examine the current location',
            '- INFO: View information menu',
            '',
            'Press any key to start...'
        ];

        let y = 120;
        for (const line of instructions) {
            this.add.text(400, y, line, {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#cccccc'
            }).setOrigin(0.5);
            y += 25;
        }

        // Wait for key press
        this.input.keyboard?.once('keydown', () => {
            this.runTest();
        });
    }

    private async runTest() {
        console.log('\n=== Starting Interaction Test ===\n');

        // Clear screen
        this.children.removeAll();

        // Show London background
        this.background.setCurrentBackground(BackgroundId.LONDON);
        this.background.showMenuBackground();

        // Display location (with semi-transparent background for readability)
        this.add.rectangle(400, 50, 300, 40, 0x000000, 0.7);
        this.add.text(400, 50, 'Hotel Room', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffff00'
        }).setOrigin(0.5);

        // Display time
        const env = this.db.getObject(Environment_TheClou) as any;
        const timeStr = `Day ${env?.CurrDay || 1}, ${this.formatTime(env?.CurrMinute || 480)}`;
        this.add.rectangle(400, 90, 250, 30, 0x000000, 0.7);
        this.add.text(400, 90, timeStr, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        try {
            // Test 1: Show action menu with basic actions
            console.log('Test 1: Show action menu');
            const possibilities = GO | WAIT | LOOK | INFO;
            
            const result = await this.interaction.showActionMenu({
                possibilities,
                currentLocation: 1
            });

            console.log(`Action menu returned: ${result}`);

            // Display result
            this.add.text(400, 300, `Action completed! Result: ${result}`, {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#00ff00'
            }).setOrigin(0.5);

            // Display new time
            const newTimeStr = `Day ${env?.CurrDay || 1}, ${this.formatTime(env?.CurrMinute || 480)}`;
            this.add.text(400, 340, `New time: ${newTimeStr}`, {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#cccccc'
            }).setOrigin(0.5);

            // Show completion message
            this.add.text(400, 400, 'Test complete! Press ESC to exit', {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#ffffff'
            }).setOrigin(0.5);

            console.log('\n=== Interaction Test Complete ===\n');

        } catch (error) {
            console.error('Test failed:', error);
            this.add.text(400, 300, `Test failed: ${error}`, {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ff0000'
            }).setOrigin(0.5);
        }
    }

    private formatTime(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
}
