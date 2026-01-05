
import { Scene } from 'phaser';
import { ReplayService,
    INP_UP, INP_DOWN, INP_LEFT, INP_RIGHT, INP_ESC,
    INP_LBUTTONP, INP_LBUTTONR, INP_RBUTTONP, INP_RBUTTONR,
    INP_SPACE, INP_KEYBOARD, INP_TIME
} from './ReplayService';
import { rndGetChecksum } from './Random';

export const TICKS_PER_SECOND = 60;

export class InputHandler {
    private simulationTick: number = 0;
    private waitTicks: number = 0;
    private replayService: ReplayService | null = null;

    // Key mappings
    private keys: any = {};
    private pointer: Phaser.Input.Pointer | null = null;

    init(): void {
        this.simulationTick = 0;
    }

    setReplayService(service: ReplayService): void {
        this.replayService = service;
    }

    registerInput(scene: Scene) {
        if (!scene.input || !scene.input.keyboard) return;

        this.keys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            esc: Phaser.Input.Keyboard.KeyCodes.ESC,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.pointer = scene.input.activePointer;

        // Prevent default browser actions for these keys
        scene.input.keyboard.addCapture([
            Phaser.Input.Keyboard.KeyCodes.UP,
            Phaser.Input.Keyboard.KeyCodes.DOWN,
            Phaser.Input.Keyboard.KeyCodes.LEFT,
            Phaser.Input.Keyboard.KeyCodes.RIGHT,
            Phaser.Input.Keyboard.KeyCodes.SPACE,
            Phaser.Input.Keyboard.KeyCodes.ESC
        ]);
    }

    getSimulationTick(): number {
        return this.simulationTick;
    }

    incrementTick(): void {
        this.simulationTick++;
    }

    setWaitTicks(ticks: number): void {
        this.waitTicks = ticks;
    }

    // Simulate one tick and return action if one occurred
    // detailed: if replay is active, get from replay.
    // if not, get from phaser input.
    simulateTick(): number | null {
        let action = 0;

        // If Replay Playing
        if (this.replayService && this.replayService.isPlaybackActive()) {
            const checksum = rndGetChecksum();
            const record = this.replayService.getInput(this.simulationTick, checksum);
            this.incrementTick();
            return record ? record.action : null;
        }

        // Real Input
        // We only check input if we are NOT replaying (or if we are recording)
        // Check Keys
        if (this.keys.up && this.keys.up.isDown) action |= INP_UP | INP_KEYBOARD;
        if (this.keys.down && this.keys.down.isDown) action |= INP_DOWN | INP_KEYBOARD;
        if (this.keys.left && this.keys.left.isDown) action |= INP_LEFT | INP_KEYBOARD;
        if (this.keys.right && this.keys.right.isDown) action |= INP_RIGHT | INP_KEYBOARD;
        if (this.keys.esc && this.keys.esc.isDown) action |= INP_ESC | INP_KEYBOARD;
        if ((this.keys.space && this.keys.space.isDown) || (this.keys.enter && this.keys.enter.isDown)) {
             action |= INP_LBUTTONP | INP_KEYBOARD; // Map Space/Enter to Click for now? C code maps Space/Enter to LBUTTONP
        }

        // Mouse (Simplified)
        if (this.pointer) {
             if (this.pointer.primaryDown) action |= INP_LBUTTONP;
        }

        // If Recording
        if (this.replayService && this.replayService.isRecording()) {
             this.replayService.recordInput(action, rndGetChecksum());
        }

        this.incrementTick();

        return action !== 0 ? action : null;
    }
}
