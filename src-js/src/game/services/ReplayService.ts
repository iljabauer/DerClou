
import { rndInitWithSeed } from './Random';

// Replay file format constants
export const REPLAY_MAGIC = "DREC";
export const REPLAY_VERSION = 1;

// Binary structure sizes
export const HEADER_SIZE = 12;  // 4 (magic) + 4 (version) + 4 (seed)
export const RECORD_SIZE = 16;  // 8 (tick) + 4 (action) + 4 (checksum)

// Input action bit flags (matching C implementation)
export const INP_UP = 1 << 0;
export const INP_DOWN = 1 << 1;
export const INP_LEFT = 1 << 2;
export const INP_RIGHT = 1 << 3;
export const INP_ESC = 1 << 4;
export const INP_LBUTTONP = 1 << 5;  // Left button pressed
export const INP_LBUTTONR = 1 << 6;  // Left button released
export const INP_RBUTTONP = 1 << 7;  // Right button pressed
export const INP_RBUTTONR = 1 << 8;  // Right button released
export const INP_NO_ESC = 1 << 10;
export const INP_TIME = 1 << 11;
export const INP_KEYBOARD = 1 << 12;
export const INP_FUNCTION_KEY = 1 << 13;
export const INP_SPACE = 1 << 14;
export const INP_MOUSE = 1 << 15;
export const INP_MOUSEWHEEL = 1 << 16;
export const INP_QUIT = 1 << 17;

export enum ReplayMode {
    IDLE = 0,
    PLAYING = 1,
    RECORDING = 2
}

export interface ReplayHeader {
    magic: string;      // 4 bytes: "DREC"
    version: number;    // 4 bytes: uint32
    rngSeed: number;    // 4 bytes: uint32
}

export interface ReplayRecord {
    tick: number;       // 8 bytes: uint64 (stored as number, safe up to 2^53)
    action: number;     // 4 bytes: int32 (action bitmask)
    rngChecksum: number; // 4 bytes: uint32
}

export interface ReplayData {
    header: ReplayHeader;
    records: ReplayRecord[];
}

declare const nw: any;

export class ReplayService {
    private records: ReplayRecord[] = [];
    private currentIndex: number = 0;
    private header: ReplayHeader | null = null;
    private mode: ReplayMode = ReplayMode.IDLE;
    private recordFilePath: string = "";

    isPlaybackActive(): boolean {
        return this.mode === ReplayMode.PLAYING;
    }

    isRecording(): boolean {
        return this.mode === ReplayMode.RECORDING;
    }

    setRecording(filePath: string, seed: number) {
        this.mode = ReplayMode.RECORDING;
        this.recordFilePath = filePath;
        this.records = [];
        this.header = {
            magic: REPLAY_MAGIC,
            version: REPLAY_VERSION,
            rngSeed: seed
        };
    }

    async loadReplay(filePath: string): Promise<ReplayData | null> {
        try {
            // Use nw.js fs module to read binary file
            if (typeof nw === 'undefined') {
                console.warn("Replay loading only supported in NW.js environment currently.");
                return null;
            }

            const fs = nw.require('fs');
            if (!fs.existsSync(filePath)) {
                console.error(`Replay file not found: ${filePath}`);
                return null;
            }
            const buffer = fs.readFileSync(filePath);

            // Parse header (12 bytes)
            if (buffer.length < HEADER_SIZE) {
                console.error("File smaller than header size");
                return null;
            }

            const magic = buffer.toString('ascii', 0, 4);
            if (magic !== REPLAY_MAGIC) {
                console.error(`Invalid magic: ${magic}`);
                return null;
            }

            const version = buffer.readUInt32LE(4);
            if (version !== REPLAY_VERSION) {
                console.error(`Version mismatch: ${version}`);
                return null;
            }

            const rngSeed = buffer.readUInt32LE(8);

            // Parse records
            const records: ReplayRecord[] = [];
            let offset = HEADER_SIZE;

            while (offset + RECORD_SIZE <= buffer.length) {
                // Read 64-bit tick as two 32-bit values (little-endian)
                const tickLow = buffer.readUInt32LE(offset);
                const tickHigh = buffer.readUInt32LE(offset + 4);
                const tick = tickLow + tickHigh * 0x100000000;

                const action = buffer.readInt32LE(offset + 8);
                const rngChecksum = buffer.readUInt32LE(offset + 12);

                records.push({ tick, action, rngChecksum });
                offset += RECORD_SIZE;
            }

            return {
                header: { magic, version, rngSeed },
                records
            };
        } catch (e) {
            console.error("Failed to load replay file:", e);
            return null;
        }
    }

    initPlayback(data: ReplayData): void {
        this.header = data.header;
        this.records = data.records;
        this.currentIndex = 0;
        this.mode = ReplayMode.PLAYING;

        // Seed RNG
        rndInitWithSeed(data.header.rngSeed);
    }

    getInput(currentTick: number, expectedChecksum: number): ReplayRecord | null {
        if (this.mode !== ReplayMode.PLAYING) return null;

        if (this.currentIndex >= this.records.length) {
            return null;
        }

        const record = this.records[this.currentIndex];
        if (record.tick === currentTick) {
            // Check for RNG drift
            if (record.rngChecksum !== expectedChecksum) {
                console.warn(
                    `RNG Drift at tick ${currentTick}! ` +
                    `Recorded=0x${record.rngChecksum.toString(16)} ` +
                    `Expected=0x${expectedChecksum.toString(16)}`
                );
            }

            this.currentIndex++;
            return record;
        }

        return null;
    }

    recordInput(action: number, rngChecksum: number) {
        // TODO: Implement recording logic
        // Push to this.records
        // Write to file if needed
    }

    isComplete(): boolean {
        return this.mode === ReplayMode.PLAYING && this.currentIndex >= this.records.length;
    }

    getCurrentRecordIndex(): number {
        return this.currentIndex;
    }

    getTotalRecords(): number {
        return this.records.length;
    }

    actionToString(action: number): string {
        if (action === 0) return "NONE";

        const parts: string[] = [];
        if (action & INP_UP) parts.push("UP");
        if (action & INP_DOWN) parts.push("DOWN");
        if (action & INP_LEFT) parts.push("LEFT");
        if (action & INP_RIGHT) parts.push("RIGHT");
        if (action & INP_ESC) parts.push("ESC");
        if (action & INP_LBUTTONP) parts.push("LBTN_P");
        if (action & INP_LBUTTONR) parts.push("LBTN_R");
        if (action & INP_RBUTTONP) parts.push("RBTN_P");
        if (action & INP_RBUTTONR) parts.push("RBTN_R");
        if (action & INP_SPACE) parts.push("SPACE");
        if (action & INP_KEYBOARD) parts.push("KEY");
        if (action & INP_MOUSE) parts.push("MOUSE");

        return parts.join(" ");
    }
}
