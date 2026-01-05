/**
 * Binary file reader with endianness support
 * Matches C implementation in disk/disk.c
 */

export class BinaryReader {
    private buffer: ArrayBuffer;
    private view: DataView;
    private offset: number = 0;

    constructor(buffer: ArrayBuffer) {
        this.buffer = buffer;
        this.view = new DataView(buffer);
    }

    getOffset(): number {
        return this.offset;
    }

    setOffset(offset: number): void {
        this.offset = offset;
    }

    skip(bytes: number): void {
        this.offset += bytes;
    }

    isEOF(): boolean {
        return this.offset >= this.buffer.byteLength;
    }

    remaining(): number {
        return this.buffer.byteLength - this.offset;
    }

    // Read unsigned 8-bit integer
    readUInt8(): number {
        const value = this.view.getUint8(this.offset);
        this.offset += 1;
        return value;
    }

    // Read signed 8-bit integer
    readInt8(): number {
        const value = this.view.getInt8(this.offset);
        this.offset += 1;
        return value;
    }

    // Read unsigned 16-bit integer (little-endian, matches EndianW)
    readUInt16(): number {
        const value = this.view.getUint16(this.offset, true);
        this.offset += 2;
        return value;
    }

    // Read signed 16-bit integer (little-endian)
    readInt16(): number {
        const value = this.view.getInt16(this.offset, true);
        this.offset += 2;
        return value;
    }

    // Read unsigned 32-bit integer (little-endian, matches EndianL)
    readUInt32(): number {
        const value = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return value;
    }

    // Read signed 32-bit integer (little-endian)
    readInt32(): number {
        const value = this.view.getInt32(this.offset, true);
        this.offset += 4;
        return value;
    }

    // Read null-terminated string
    readString(maxLength?: number): string {
        const start = this.offset;
        let end = start;
        const limit = maxLength ? start + maxLength : this.buffer.byteLength;

        while (end < limit && this.view.getUint8(end) !== 0) {
            end++;
        }

        const bytes = new Uint8Array(this.buffer, start, end - start);
        const text = new TextDecoder('utf-8').decode(bytes);
        
        this.offset = maxLength ? start + maxLength : end + 1;
        return text;
    }

    // Read fixed-length string (may not be null-terminated)
    readFixedString(length: number): string {
        const bytes = new Uint8Array(this.buffer, this.offset, length);
        this.offset += length;
        
        // Find null terminator if present
        let end = 0;
        while (end < length && bytes[end] !== 0) {
            end++;
        }
        
        return new TextDecoder('utf-8').decode(bytes.slice(0, end));
    }

    // Read raw bytes
    readBytes(length: number): Uint8Array {
        const bytes = new Uint8Array(this.buffer, this.offset, length);
        this.offset += length;
        return bytes;
    }

    // Read array of values
    readArray<T>(count: number, readFn: () => T): T[] {
        const result: T[] = [];
        for (let i = 0; i < count; i++) {
            result.push(readFn.call(this));
        }
        return result;
    }
}

/**
 * Load binary file from filesystem or URL
 */
export async function loadBinaryFile(path: string): Promise<ArrayBuffer | null> {
    try {
        // Try to load from filesystem (Node.js/NW.js)
        if (typeof require !== 'undefined') {
            const fs = require('fs');
            const buffer = fs.readFileSync(path);
            return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        }
        
        // Try to load from URL (browser)
        const response = await fetch(path);
        if (!response.ok) {
            console.error(`Failed to load ${path}: ${response.statusText}`);
            return null;
        }
        return await response.arrayBuffer();
    } catch (error) {
        console.error(`Error loading ${path}:`, error);
        return null;
    }
}
