/**
 * SharedReplayService - Singleton replay service shared across all scenes
 * 
 * Solves the problem of replay state being lost when transitioning between scenes.
 * Each scene accesses the same replay service instance via Phaser's Registry.
 */

import { Scene } from 'phaser';
import { ReplayService } from './ReplayService';
import { InputHandler } from './InputHandler';

const REPLAY_SERVICE_KEY = 'sharedReplayService';
const INPUT_HANDLER_KEY = 'sharedInputHandler';

export class SharedReplayService {
    private static instance: SharedReplayService | null = null;
    
    private replayService: ReplayService;
    private inputHandler: InputHandler;
    private isPlaying: boolean = false;
    private hasLoaded: boolean = false;
    
    private constructor() {
        this.replayService = new ReplayService();
        this.inputHandler = new InputHandler();
        this.inputHandler.setReplayService(this.replayService);
    }
    
    /**
     * Initialize the shared replay service for a scene
     * Call this in the first scene that loads (usually RouterScene or MainMenuScene)
     */
    static initialize(scene: Scene): SharedReplayService {
        if (!SharedReplayService.instance) {
            SharedReplayService.instance = new SharedReplayService();
            
            // Store in scene registry so all scenes can access it
            scene.registry.set(REPLAY_SERVICE_KEY, SharedReplayService.instance);
            
            // Expose startReplay to Playwright (only once)
            (window as any).startReplay = () => {
                console.log('SharedReplayService: Starting replay');
                if (SharedReplayService.instance) {
                    SharedReplayService.instance.isPlaying = true;
                }
            };
        }
        
        return SharedReplayService.instance;
    }
    
    /**
     * Get the shared replay service instance from a scene
     * Call this in any scene that needs replay functionality
     */
    static getInstance(scene: Scene): SharedReplayService | null {
        // Try to get from registry first
        let instance = scene.registry.get(REPLAY_SERVICE_KEY) as SharedReplayService;
        
        if (!instance) {
            // If not in registry, try static instance
            instance = SharedReplayService.instance;
        }
        
        if (!instance) {
            console.warn('SharedReplayService: No instance found, initializing...');
            instance = SharedReplayService.initialize(scene);
        }
        
        return instance;
    }
    
    /**
     * Load a replay file
     */
    async loadReplay(replayPath: string): Promise<boolean> {
        console.log(`SharedReplayService: Loading replay ${replayPath}`);
        
        const data = await this.replayService.loadReplay(replayPath);
        
        if (data) {
            this.replayService.initPlayback(data);
            this.inputHandler.init();
            this.hasLoaded = true;
            console.log(`SharedReplayService: Loaded replay with ${data.records.length} records`);
            return true;
        } else {
            console.error('SharedReplayService: Failed to load replay');
            return false;
        }
    }
    
    /**
     * Check if replay is loaded
     */
    isReplayLoaded(): boolean {
        return this.hasLoaded;
    }
    
    /**
     * Check if replay is playing
     */
    isReplayPlaying(): boolean {
        return this.isPlaying;
    }
    
    /**
     * Check if replay is complete
     */
    isReplayComplete(): boolean {
        return this.replayService.isComplete();
    }
    
    /**
     * Simulate one tick of replay
     * Returns the action for this tick, or null if no action
     */
    simulateTick(): number | null {
        return this.inputHandler.simulateTick();
    }
    
    /**
     * Get current simulation tick
     */
    getSimulationTick(): number {
        return this.inputHandler.getSimulationTick();
    }
    
    /**
     * Convert action bitmask to string
     */
    actionToString(action: number): string {
        return this.replayService.actionToString(action);
    }
    
    /**
     * Stop replay playback
     */
    stopReplay(): void {
        this.isPlaying = false;
    }
    
    /**
     * Reset the shared service (for testing)
     */
    static reset(): void {
        SharedReplayService.instance = null;
    }
}
