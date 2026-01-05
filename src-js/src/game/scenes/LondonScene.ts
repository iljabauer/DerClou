/**
 * London Hub Scene - Main game location
 * Simplified version without graphics/animations
 */

import { Scene } from 'phaser';
import { GameEngine } from '../core/GameEngine';
import { sceneManager } from '../core/SceneManager';
import { GameScene, SceneArgs, SceneId } from '../types/SceneTypes';
import { db } from '../core/Database';
import { gameState } from '../core/GameState';

export class LondonScene implements GameScene {
    id = SceneId.London;
    private engine: GameEngine;
    private menuItems: string[] = [];

    constructor(_scene: Scene, engine: GameEngine) {
        this.engine = engine;
    }

    init(): void {
        console.log('London: init');
        const renderer = this.engine.getRenderer();
        renderer.clear();

        // Title
        renderer.drawText(512, 50, 'LONDON', {
            fontSize: '32px',
            color: '#ffff00',
        });

        // Time display
        const time = gameState.getTime();
        renderer.drawText(512, 100, 
            `Day ${time.day}, ${time.hour}:${time.minute.toString().padStart(2, '0')}`, 
            { fontSize: '18px', color: '#ffffff' }
        );

        // Player info
        const playerId = gameState.getPlayerId();
        if (playerId !== null) {
            const player = db.getObject(playerId);
            if (player && 'money' in player) {
                renderer.drawText(512, 140, `Money: £${player.money || 0}`, {
                    fontSize: '16px',
                    color: '#00ff00',
                });
            }
        }

        // Menu options
        this.menuItems = [
            'Go to Location',
            'Talk to People',
            'Wait',
            'Information',
            'Back to Menu'
        ];

        if (!this.engine.isReplayMode()) {
            renderer.drawMenu(512, 250, this.menuItems, (index) => {
                this.handleMenuSelection(index);
            });
        } else {
            // In replay mode, just display the menu
            this.menuItems.forEach((item, index) => {
                renderer.drawText(512, 250 + index * 40, item, {
                    fontSize: '18px',
                    color: '#ffffff',
                });
            });
        }
    }

    update(_delta: number): SceneArgs {
        // In replay mode, handle input from replay
        if (this.engine.isReplayMode()) {
            const input = this.engine.getInputHandler();
            const action = input.getLastAction();
            
            if (action !== null) {
                // Simulate menu navigation based on replay input
                // This is a simplified version - real implementation would need
                // to track input state and handle menu navigation properly
                this.handleReplayInput(action);
            }
        }

        return { returnValue: null };
    }

    done(): void {
        console.log('London: done');
    }

    private handleMenuSelection(index: number): void {
        console.log(`London menu: selected ${this.menuItems[index]}`);
        
        switch (index) {
            case 0: // Go to Location
                this.goToLocation();
                break;
            case 1: // Talk to People
                this.talkToPeople();
                break;
            case 2: // Wait
                this.wait();
                break;
            case 3: // Information
                this.showInformation();
                break;
            case 4: // Back to Menu
                sceneManager.startScene(SceneId.MainMenu);
                break;
        }
    }

    private handleReplayInput(action: number): void {
        // Handle replay input - simplified version
        // Real implementation would need to properly decode input actions
        console.log(`London: replay input ${action}`);
    }

    private goToLocation(): void {
        console.log('Go to Location - not implemented yet');
        // Advance time
        gameState.advanceTime(60); // 1 hour
    }

    private talkToPeople(): void {
        console.log('Talk to People - not implemented yet');
        gameState.advanceTime(30); // 30 minutes
    }

    private wait(): void {
        console.log('Wait');
        gameState.advanceTime(120); // 2 hours
        
        // Refresh the scene
        this.init();
    }

    private showInformation(): void {
        console.log('Information - not implemented yet');
    }
}
