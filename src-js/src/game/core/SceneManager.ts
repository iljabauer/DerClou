/**
 * Scene management system - port of gp.c PlayStory logic
 */

import { GameScene, SceneId } from '../types/SceneTypes';
import { gameState } from './GameState';

export class SceneManager {
    private scenes: Map<SceneId, GameScene> = new Map();
    private currentScene: GameScene | null = null;
    private running: boolean = false;

    registerScene(scene: GameScene): void {
        this.scenes.set(scene.id, scene);
    }

    startScene(sceneId: SceneId): void {
        if (this.currentScene && this.currentScene.done) {
            this.currentScene.done();
        }

        const scene = this.scenes.get(sceneId);
        if (!scene) {
            console.error(`Scene ${sceneId} not found`);
            return;
        }

        this.currentScene = scene;
        gameState.setCurrentScene(sceneId);

        if (scene.init) {
            scene.init();
        }
    }

    update(delta: number): void {
        if (!this.currentScene || !this.currentScene.update) {
            return;
        }

        const result = this.currentScene.update(delta);

        if (result.returnValue !== null) {
            this.startScene(result.returnValue);
        }
    }

    getCurrentScene(): GameScene | null {
        return this.currentScene;
    }

    start(initialScene: SceneId): void {
        this.running = true;
        this.startScene(initialScene);
    }

    stop(): void {
        if (this.currentScene && this.currentScene.done) {
            this.currentScene.done();
        }
        this.running = false;
        this.currentScene = null;
    }

    isRunning(): boolean {
        return this.running;
    }
}

export const sceneManager = new SceneManager();
