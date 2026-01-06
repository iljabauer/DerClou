
import { ReplayService } from './ReplayService';
import { rndGetChecksum } from './Random';

export const TICKS_PER_SECOND = 60;

export class InputHandler {
    private simulationTick: number = 0;
    private replayService: ReplayService | null = null;

    init(): void {
        this.simulationTick = 0;
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



    // Simulate one tick and return action if one occurred
    simulateTick(): number | null {
        if (!this.replayService) return null;

        const checksum = rndGetChecksum();
        const record = this.replayService.getInput(this.simulationTick, checksum);

        this.incrementTick();

        return record ? record.action : null;
    }
}
