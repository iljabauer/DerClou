
import { ReplayService } from './ReplayService';
import { rndGetChecksum } from './Random';

export const TICKS_PER_SECOND = 60;

export class InputHandler {
    private simulationTick: number = 0;
    private replayService: ReplayService | null = null;
    private lastAction: number | null = null;

    init(): void {
        this.simulationTick = 0;
        this.lastAction = null;
    }

    setReplayService(service: ReplayService): void {
        this.replayService = service;
    }

    getSimulationTick(): number {
        return this.simulationTick;
    }

    incrementTick(): void {
        this.simulationTick++;
    }

    getLastAction(): number | null {
        return this.lastAction;
    }

    // Simulate one tick and return action if one occurred
    simulateTick(): number | null {
        if (!this.replayService) return null;

        const checksum = rndGetChecksum();
        const record = this.replayService.getInput(this.simulationTick, checksum);

        this.incrementTick();

        this.lastAction = record ? record.action : null;
        return this.lastAction;
    }
}
