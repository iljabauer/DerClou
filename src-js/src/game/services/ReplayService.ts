
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

// Abstract Binary Reader to handle both Node Buffer and Browser DataView
interface BinaryReader {
    length: number;
    readUInt32LE(offset: number): number;
    readInt32LE(offset: number): number;
    readString(offset: number, length: number): string;
}

class NodeBufferReader implements BinaryReader {
    constructor(private buffer: any) { }
    get length() { return this.buffer.length; }
    readUInt32LE(offset: number) { return this.buffer.readUInt32LE(offset); }
    readInt32LE(offset: number) { return this.buffer.readInt32LE(offset); }
    readString(offset: number, length: number) { return this.buffer.toString('ascii', offset, offset + length); }
}

class BrowserBufferReader implements BinaryReader {
    private view: DataView;
    constructor(buffer: ArrayBuffer) {
        this.view = new DataView(buffer);
    }
    get length() { return this.view.byteLength; }
    readUInt32LE(offset: number) { return this.view.getUint32(offset, true); } // true for Little Endian
    readInt32LE(offset: number) { return this.view.getInt32(offset, true); }
    readString(offset: number, length: number) {
        const bytes = new Uint8Array(this.view.buffer, offset, length);
        return String.fromCharCode.apply(null, Array.from(bytes));
    }
}

export class ReplayService {
    private records: ReplayRecord[] = [];
    private currentIndex: number = 0;

    async loadReplay(filePath: string): Promise<ReplayData | null> {
        try {
            let reader: BinaryReader;

            // Check if running in NW.js environment
            // @ts-ignore
            if (typeof nw !== 'undefined') {
                // Use nw.js fs module to read binary file
                // @ts-ignore
                const fs = nw.require('fs');
                if (!fs.existsSync(filePath)) {
                    console.error(`Replay file not found: ${filePath}`);
                    return null;
                }
                const buffer = fs.readFileSync(filePath);
                reader = new NodeBufferReader(buffer);
            } else {
                // Browser environment: usage fetch
                try {
                    const response = await fetch(filePath);
                    if (!response.ok) {
                        console.error(`Failed to fetch replay file: ${response.statusText}`);
                        return null;
                    }
                    const arrayBuffer = await response.arrayBuffer();
                    reader = new BrowserBufferReader(arrayBuffer);
                } catch (e) {
                    console.error(`Fetch error: ${e}`);
                    return null;
                }
            }

            // Parse header (12 bytes)
            if (reader.length < HEADER_SIZE) {
                console.error("File smaller than header size");
                return null;
            }

            const magic = reader.readString(0, 4);
            if (magic !== REPLAY_MAGIC) {
                console.error(`Invalid magic: ${magic}`);
                return null;
            }

            const version = reader.readUInt32LE(4);
            if (version !== REPLAY_VERSION) {
                console.error(`Version mismatch: ${version}`);
                return null;
            }

            const rngSeed = reader.readUInt32LE(8);

            // Parse records
            const records: ReplayRecord[] = [];
            let offset = HEADER_SIZE;

            while (offset + RECORD_SIZE <= reader.length) {
                // Read 64-bit tick as two 32-bit values (little-endian)
                const tickLow = reader.readUInt32LE(offset);
                const tickHigh = reader.readUInt32LE(offset + 4);
                const tick = tickLow + tickHigh * 0x100000000;

                const action = reader.readInt32LE(offset + 8);
                const rngChecksum = reader.readUInt32LE(offset + 12);

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
        this.records = data.records;
        this.currentIndex = 0;

        // Seed RNG
        rndInitWithSeed(data.header.rngSeed);
    }

    getInput(currentTick: number, expectedChecksum: number): ReplayRecord | null {
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

    isComplete(): boolean {
        return this.currentIndex >= this.records.length;
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
