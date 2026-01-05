/**
 * Main Menu Scene
 */

import { Scene } from 'phaser';
import { GameEngine } from '../core/GameEngine';
import { sceneManager } from '../core/SceneManager';
import { GameScene, SceneArgs, SceneId } from '../types/SceneTypes';
import { db } from '../core/Database';
import { gameState } from '../core/GameState';
import { ObjectType, Player } from '../types/GameTypes';

export class MainMenuScene implements GameScene {
    id = SceneId.MainMenu;
    private engine: GameEngine;
    private menuItems: string[] = [];

    constructor(_scene: Scene, engine: GameEngine) {
        this.engine = engine;
    }

    init(): void {
        console.log('MainMenu: init');
        const renderer = this.engine.getRenderer();
        renderer.clear();

        // Title
        renderer.drawText(512, 100, 'DER CLOU!', {
            fontSize: '48px',
            color: '#00ff00',
        });

        renderer.drawText(512, 160, 'The Clue!', {
            fontSize: '24px',
            color: '#ffffff',
        });

        // Tick display
        renderer.drawText(512, 220, `Tick: ${this.engine.getCurrentTick()}`, {
            fontSize: '18px',
            color: '#888888',
        });

        // Time display
        const time = gameState.getTime();
        renderer.drawText(512, 250, 
            `Day ${time.day}, ${time.hour}:${time.minute.toString().padStart(2, '0')}`, 
            { fontSize: '18px', color: '#888888' }
        );

        // Menu
        this.menuItems = [
            'New Game',
            'Continue',
            'Load Game',
            'Options',
            'Credits',
            'Quit'
        ];

        if (!this.engine.isReplayMode()) {
            renderer.drawMenu(512, 350, this.menuItems, (index) => {
                this.handleMenuSelection(index);
            });
        } else {
            // In replay mode, just display the menu
            this.menuItems.forEach((item, index) => {
                renderer.drawText(512, 350 + index * 40, item, {
                    fontSize: '20px',
                    color: '#ffffff',
                });
            });
        }

        // Version info
        renderer.drawText(512, 700, 'TypeScript Port - Test Version', {
            fontSize: '14px',
            color: '#666666',
        });
    }

    update(_delta: number): SceneArgs {
        // Handle replay input if in replay mode
        if (this.engine.isReplayMode()) {
            const input = this.engine.getInputHandler();
            const action = input.getLastAction();
            
            if (action !== null) {
                this.handleReplayInput(action);
            }
        }

        return { returnValue: null };
    }

    done(): void {
        console.log('MainMenu: done');
    }

    private handleMenuSelection(index: number): void {
        console.log(`MainMenu: selected ${this.menuItems[index]}`);
        
        switch (index) {
            case 0: // New Game
                this.startNewGame();
                break;
            case 1: // Continue
                this.continueGame();
                break;
            case 2: // Load Game
                console.log('Load Game - not implemented');
                break;
            case 3: // Options
                console.log('Options - not implemented');
                break;
            case 4: // Credits
                this.showCredits();
                break;
            case 5: // Quit
                this.quit();
                break;
        }
    }

    private handleReplayInput(action: number): void {
        // Handle replay input
        console.log(`MainMenu: replay input ${action}`);
        
        // In replay mode, automatically progress to the game
        // This is a simplified version
        if (action !== 0) {
            sceneManager.startScene(SceneId.London);
        }
    }

    private startNewGame(): void {
        console.log('Starting new game...');
        
        // Initialize game data
        this.initializeGameData();
        
        // Go to London
        sceneManager.startScene(SceneId.London);
    }

    private continueGame(): void {
        console.log('Continuing game...');
        
        // Check if there's a saved game
        const playerId = gameState.getPlayerId();
        if (playerId === null) {
            console.log('No saved game found, starting new game');
            this.startNewGame();
        } else {
            sceneManager.startScene(SceneId.London);
        }
    }

    private showCredits(): void {
        console.log('Credits - not implemented');
        // Could transition to a credits scene
    }

    private quit(): void {
        console.log('Quitting game...');
        // In a real implementation, this would close the application
        // For now, just log it
    }

    private initializeGameData(): void {
        // Create the player character
        const player: Player = {
            id: 0,
            name: 'Matt Stuvysunt',
            type: ObjectType.Player,
            pictId: 7,
            job: 0,
            sex: 0,
            age: 35,
            health: 100,
            mood: 50,
            intelligence: 80,
            strength: 70,
            stamina: 75,
            loyalty: 90,
            skill: 60,
            known: 0,
            popularity: 50,
            avarice: 30,
            panic: 0,
            knownToPolice: 0,
            talkBits: 0,
            talkFileId: 0,
            oldHealth: 100,
            money: 5000,
            stolenMoney: 0,
            myStolenMoney: 0,
            nrOfBurglaries: 0,
            jobOfferCount: 0,
            mattsPart: 0,
            currScene: 0,
            currDay: 1,
            currMinute: 0,
            currLocation: 0,
        };

        const playerId = db.addObject(player);
        gameState.setPlayerId(playerId);
        gameState.setTime(1, 8, 0); // Day 1, 8:00 AM

        console.log('Game data initialized');
    }
}
