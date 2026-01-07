
import { Scene, Plugins } from 'phaser';
import { ReplayService, INP_UP, INP_DOWN, INP_LEFT, INP_RIGHT, INP_ESC, INP_LBUTTONP, INP_LBUTTONR, INP_RBUTTONP, INP_RBUTTONR, INP_KEYBOARD, INP_MOUSE, INP_TIME } from '../services/ReplayService';

export class InputPlugin extends Plugins.ScenePlugin {
    private replayService: ReplayService;
    private simulationTick: number = 0;

    // Fixed Time Step
    private accumulator: number = 0;
    private readonly MS_PER_TICK: number = 1000 / 60;

    // Input States
    // private mouseX: number = 0;
    // private mouseY: number = 0;
    private currentAction: number = 0; // Accumulated action for the current frame


    private waitingForMask: number = 0;
    private waitResolve: ((action: number) => void) | null = null;
    private ticksWaited: number = 0;
    private ticksForTimeout: number = 0;

    private isPlaying: boolean = false;
    private simulateToTick: number | null = null;

    public get isPlayingValue(): boolean {
        return this.isPlaying;
    }

    constructor(scene: Scene, pluginManager: Plugins.PluginManager, pluginKey: string) {
        super(scene, pluginManager, pluginKey);
        this.replayService = new ReplayService();
    }

    boot() {
        const eventEmitter = this.systems!.events;
        eventEmitter.on('update', this.update, this);
        eventEmitter.on('destroy', this.destroy, this);

        this.setupInputListeners();
    }

    private setupInputListeners() {
        if (!this.scene || !this.scene.input) return;

        // Mouse Motion
        this.scene.input.on('pointermove', () => {
            // this.mouseX = pointer.x;
            // this.mouseY = pointer.y;
            // TODO: directional checks relative to center or previous pos?
            // For now, mirroring C logic: INP_MOUSE is set if moved? 
            // C logic: compares to last X/Y. 
            // Actually, C sets INP_MOUSE | INP_LEFT etc based on motion relative to stored IHandler.us_MouseX
        });

        // Mouse Buttons
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.button === 0) this.currentAction |= (INP_MOUSE | INP_LBUTTONP);
            if (pointer.button === 2) this.currentAction |= (INP_MOUSE | INP_RBUTTONP);
            // this.mouseX = pointer.x;
            // this.mouseY = pointer.y;
        });

        this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (pointer.button === 0) this.currentAction |= (INP_MOUSE | INP_LBUTTONR);
            if (pointer.button === 2) this.currentAction |= (INP_MOUSE | INP_RBUTTONR);
            // this.mouseX = pointer.x;
            // this.mouseY = pointer.y;
        });

        // Keyboard
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.on('keydown', (event: KeyboardEvent) => {
                this.mapKeyboardEvent(event, true);
            });
            this.scene.input.keyboard.on('keyup', (event: KeyboardEvent) => {
                this.mapKeyboardEvent(event, false);
            });
        }

        // Prevent context menu
        this.scene.game.canvas.oncontextmenu = (e) => e.preventDefault();
    }

    private mapKeyboardEvent(event: KeyboardEvent, isDown: boolean) {
        if (!isDown) { // Key Up events often trigger actions in C
            switch (event.code) {
                case 'Space':
                case 'Enter':
                case 'NumpadEnter':
                    this.currentAction |= (INP_KEYBOARD | INP_LBUTTONP); // Simulate Click
                    break;
                case 'Escape':
                    this.currentAction |= (INP_KEYBOARD | INP_ESC);
                    break;
            }
            return;
        }

        switch (event.code) {
            case 'ArrowLeft': this.currentAction |= (INP_KEYBOARD | INP_LEFT); break;
            case 'ArrowRight': this.currentAction |= (INP_KEYBOARD | INP_RIGHT); break;
            case 'ArrowUp': this.currentAction |= (INP_KEYBOARD | INP_UP); break;
            case 'ArrowDown': this.currentAction |= (INP_KEYBOARD | INP_DOWN); break;
        }
    }

    // ScenePlugin update is not typed but exists
    update(_time: number, delta: number) {
        if (!this.replayService) return;

        this.accumulator += delta;

        // Safety clamp to prevent spiral of death
        if (this.accumulator > this.MS_PER_TICK * 5) {
            this.accumulator = this.MS_PER_TICK * 5;
        }

        while (this.accumulator >= this.MS_PER_TICK) {
            this.processTick();
            this.accumulator -= this.MS_PER_TICK;
        }
    }

    private processTick() {
        // 1. Get Input Action for this tick
        let action = 0;

        if (this.isPlaying) {
            // Replay Mode: Get from Service
            const record = this.replayService.getInput(this.simulationTick, 0); // TODO: Checksum
            if (record) {
                action = record.action;
            } else if (this.replayService.isComplete()) {
                this.isPlaying = false;
                console.log("Replay complete.");
                this.signalScreenshot(this.simulationTick, -1); // -1 or special flag for finished
            }

            if (this.simulateToTick !== null && this.simulationTick >= this.simulateToTick) {
                this.isPlaying = false;
                console.log("Simulate-to-tick reached.");
            }
        } else {
            // Live Mode: Use current accumulated OS action
            action = this.currentAction;
            // Record it?
            // this.replayService.recordInput(this.simulationTick, action, 0);
        }

        // 2. Clear accumulated one-shot actions for next tick
        // (Continuous states like key-down might need persistence if we implemented it that way,
        // but C just pumps events. Here we clear `currentAction` after consumption? 
        // In C, `inpPumpEvents` accumulates bits into `action`. Then `inpWaitFor` checks against mask.
        // If we clear it here, we lose it if we aren't "waiting".
        // BUT, `waitFor` IS the consumer. 
        // We only clear `currentAction` if it was consumed or if we decide it expires?
        // For now, let's clear it to emulate "polling loop cleared it".
        this.currentAction = 0;

        // 3. Check Wait Condition
        if (this.waitResolve) {
            let matched = 0;

            // Check Mask
            if (action & this.waitingForMask) {
                matched = action & this.waitingForMask;
            }

            // Check Timeout
            if (this.waitingForMask & INP_TIME) {
                this.ticksWaited++;
                if (this.ticksWaited >= this.ticksForTimeout) {
                    matched |= INP_TIME;
                }
            }

            if (matched) {
                // Determine if we need to screenshot (from C logic)
                if (matched & ~INP_TIME) {
                    this.signalScreenshot(this.simulationTick, matched);
                }

                const resolver = this.waitResolve;
                this.waitResolve = null;
                this.waitingForMask = 0;
                resolver(matched);
            }
        }

        this.simulationTick++;
    }

    public async waitFor(mask: number, ticks: number = 0): Promise<number> {
        if (this.waitResolve) {
            console.warn("InputPlugin: waitFor called while already waiting! Overwriting.");
        }

        return new Promise<number>((resolve) => {
            this.waitingForMask = mask;
            this.ticksForTimeout = ticks;
            this.ticksWaited = 0;
            this.waitResolve = resolve;
        });
    }

    public async loadReplay(path: string) {
        const data = await this.replayService.loadReplay(path);
        if (data) {
            this.replayService.initPlayback(data);
            this.simulationTick = 0;
            this.isPlaying = true; // Auto-play by default on load
            console.log("Replay loaded and playing");
        }
    }

    public setSimulateToTick(tick: number) {
        this.simulateToTick = tick;
    }

    private signalScreenshot(tick: number, action: number) {
        const win = window as unknown as { captureEvent: (name: string) => Promise<void> };
        if (win.captureEvent) {
            const name = action === -1 ? 'Finished' : `Tick_${tick}_Action_${action}`;
            win.captureEvent(name).catch((e: unknown) => console.error(e));
        }
    }

    override destroy() {
        this.systems!.events.off('update', this.update, this);
        this.systems!.events.off('destroy', this.destroy, this);
        super.destroy();
    }
}
