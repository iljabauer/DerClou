/**
 * Test scene for verifying game engine and replay integration
 */

import { Scene } from 'phaser';
import { GameEngine } from '../core/GameEngine';
import { sceneManager } from '../core/SceneManager';
import { GameScene, SceneArgs, SceneId } from '../types/SceneTypes';
import { ObjectType, Player } from '../types/GameTypes';

declare const nw: any;

export class TestGameScene extends Scene {
    private engine!: GameEngine;
    private hasLoaded: boolean = false;

    constructor() {
        super('TestGameScene');
    }

    async create() {
        this.engine = new GameEngine(this);

        // Parse command line arguments
        let replayPath = '';
        let simulateToTick: number | undefined;

        if (typeof nw !== 'undefined' && nw.App && nw.App.argv) {
            const argv = nw.App.argv;
            for (const arg of argv) {
                if (arg.startsWith('--replay-path=')) {
                    replayPath = arg.split('=')[1];
                } else if (arg.startsWith('--simulate-to-tick=')) {
                    simulateToTick = parseInt(arg.split('=')[1], 10);
                }
            }
        }

        // Initialize engine
        const success = await this.engine.init(replayPath, simulateToTick);
        
        if (!success && replayPath) {
            this.showError('Failed to load replay');
            return;
        }

        this.hasLoaded = true;

        // Register game scenes
        this.registerGameScenes();

        // Setup UI
        this.setupUI();

        // Start the game
        if (this.engine.isReplayMode()) {
            console.log('Starting in replay mode');
            this.engine.start(SceneId.MainMenu);
        } else {
            console.log('Starting in normal mode');
            this.initializeTestData();
            this.engine.start(SceneId.MainMenu);
        }
    }

    update(_time: number, delta: number) {
        if (!this.hasLoaded) {
            return;
        }

        this.engine.update(delta);
    }

    private registerGameScenes(): void {
        // Register main menu scene
        const mainMenuScene: GameScene = {
            id: SceneId.MainMenu,
            init: () => {
                console.log('MainMenu: init');
                const renderer = this.engine.getRenderer();
                renderer.clear();
                
                renderer.drawText(400, 100, 'Der Clou! - Test Scene', {
                    fontSize: '32px',
                    color: '#00ff00',
                });

                renderer.drawText(400, 200, `Tick: ${this.engine.getCurrentTick()}`, {
                    fontSize: '18px',
                });

                const gameState = this.engine.getGameState();
                const time = gameState.getTime();
                renderer.drawText(400, 240, 
                    `Day ${time.day}, ${time.hour}:${time.minute.toString().padStart(2, '0')}`, 
                    { fontSize: '18px' }
                );

                if (!this.engine.isReplayMode()) {
                    renderer.drawMenu(400, 300, [
                        'New Game',
                        'Load Game',
                        'Options',
                        'Quit'
                    ], (index) => {
                        console.log(`Menu item ${index} selected`);
                        if (index === 0) {
                            sceneManager.startScene(SceneId.London);
                        }
                    });
                }
            },
            update: (_delta: number): SceneArgs => {
                // Update UI with current tick
                return { returnValue: null };
            },
        };

        // Register London scene
        const londonScene: GameScene = {
            id: SceneId.London,
            init: () => {
                console.log('London: init');
                const renderer = this.engine.getRenderer();
                renderer.clear();
                
                renderer.drawText(400, 100, 'London - Main Hub', {
                    fontSize: '28px',
                    color: '#ffff00',
                });

                renderer.drawText(400, 200, 'This is where the main game would be', {
                    fontSize: '16px',
                });

                if (!this.engine.isReplayMode()) {
                    renderer.drawButton(400, 300, 'Back to Menu', () => {
                        sceneManager.startScene(SceneId.MainMenu);
                    });
                }
            },
            update: (_delta: number): SceneArgs => {
                return { returnValue: null };
            },
        };

        sceneManager.registerScene(mainMenuScene);
        sceneManager.registerScene(londonScene);
    }

    private setupUI(): void {
        const style = { fontFamily: 'Arial', fontSize: '14px', color: '#ffffff' };

        // Status display
        const statusText = this.add.text(10, 10, '', style);
        const tickText = this.add.text(10, 30, '', style);
        const modeText = this.add.text(10, 50, '', style);

        // Update status every frame
        this.events.on('update', () => {
            if (!this.hasLoaded) return;

            const tick = this.engine.getCurrentTick();
            const isReplay = this.engine.isReplayMode();
            const isComplete = this.engine.getReplayService().isComplete();

            statusText.setText(`Status: ${isComplete ? 'Complete' : 'Running'}`);
            tickText.setText(`Tick: ${tick}`);
            modeText.setText(`Mode: ${isReplay ? 'Replay' : 'Normal'}`);
        });
    }

    private initializeTestData(): void {
        const db = this.engine.getDatabase();
        const gameState = this.engine.getGameState();

        // Create test player
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

        console.log('Test data initialized');
    }

    private showError(message: string): void {
        this.add.text(400, 300, `Error: ${message}`, {
            fontSize: '24px',
            color: '#ff0000',
        }).setOrigin(0.5);
    }
}
