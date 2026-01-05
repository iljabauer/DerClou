/**
 * Global game state management
 */

import { ObjectId } from '../types/GameTypes';
import { SceneId } from '../types/SceneTypes';

export interface GameStateData {
    currentScene: SceneId;
    playerId: ObjectId | null;
    currentDay: number;
    currentHour: number;
    currentMinute: number;
    gameFlags: Map<string, boolean>;
    variables: Map<string, number>;
}

export class GameState {
    private state: GameStateData;

    constructor() {
        this.state = {
            currentScene: SceneId.MainMenu,
            playerId: null,
            currentDay: 1,
            currentHour: 9,
            currentMinute: 0,
            gameFlags: new Map(),
            variables: new Map(),
        };
    }

    getCurrentScene(): SceneId {
        return this.state.currentScene;
    }

    setCurrentScene(sceneId: SceneId): void {
        this.state.currentScene = sceneId;
    }

    getPlayerId(): ObjectId | null {
        return this.state.playerId;
    }

    setPlayerId(id: ObjectId): void {
        this.state.playerId = id;
    }

    getTime(): { day: number; hour: number; minute: number } {
        return {
            day: this.state.currentDay,
            hour: this.state.currentHour,
            minute: this.state.currentMinute,
        };
    }

    advanceTime(minutes: number): void {
        this.state.currentMinute += minutes;
        while (this.state.currentMinute >= 60) {
            this.state.currentMinute -= 60;
            this.state.currentHour++;
        }
        while (this.state.currentHour >= 24) {
            this.state.currentHour -= 24;
            this.state.currentDay++;
        }
    }

    setFlag(flag: string, value: boolean): void {
        this.state.gameFlags.set(flag, value);
    }

    getFlag(flag: string): boolean {
        return this.state.gameFlags.get(flag) || false;
    }

    setVariable(name: string, value: number): void {
        this.state.variables.set(name, value);
    }

    getVariable(name: string): number {
        return this.state.variables.get(name) || 0;
    }

    reset(): void {
        this.state = {
            currentScene: SceneId.MainMenu,
            playerId: null,
            currentDay: 1,
            currentHour: 9,
            currentMinute: 0,
            gameFlags: new Map(),
            variables: new Map(),
        };
    }

    serialize(): string {
        return JSON.stringify({
            ...this.state,
            gameFlags: Array.from(this.state.gameFlags.entries()),
            variables: Array.from(this.state.variables.entries()),
        });
    }

    deserialize(data: string): void {
        const parsed = JSON.parse(data);
        this.state = {
            ...parsed,
            gameFlags: new Map(parsed.gameFlags),
            variables: new Map(parsed.variables),
        };
    }
}

export const gameState = new GameState();
