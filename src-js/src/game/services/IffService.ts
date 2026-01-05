
import { Scene } from 'phaser';

declare const nw: any;
declare const Buffer: any;

export interface IffImage {
    width: number;
    height: number;
    palette: number[]; // Array of 0xRRGGBB colors
    pixels: Uint8Array; // Palette indices
}

export class IffService {
    async loadIff(path: string): Promise<IffImage | null> {
        if (typeof nw === 'undefined') return null;

        const fs = nw.require('fs');
        if (!fs.existsSync(path)) {
            console.error(`IFF file not found: ${path}`);
            return null;
        }

        const buffer = fs.readFileSync(path);
        return this.parseIff(buffer);
    }

    private parseIff(buffer: any): IffImage | null {
        let offset = 0;

        // Read FORM
        if (buffer.toString('ascii', offset, offset + 4) !== 'FORM') return null;
        offset += 4;

        const formSize = buffer.readUInt32BE(offset);
        offset += 4;

        // Read ILBM
        if (buffer.toString('ascii', offset, offset + 4) !== 'ILBM') return null;
        offset += 4;

        let width = 0, height = 0, planes = 0, compression = 0;
        let palette: number[] = [];
        let bodyOffset = 0;
        let bodySize = 0;

        while (offset < buffer.length) {
            const chunkId = buffer.toString('ascii', offset, offset + 4);
            offset += 4;
            const chunkSize = buffer.readUInt32BE(offset);
            offset += 4;

            if (chunkId === 'BMHD') {
                width = buffer.readUInt16BE(offset);
                height = buffer.readUInt16BE(offset + 2);
                planes = buffer.readUInt8(offset + 8);
                compression = buffer.readUInt8(offset + 10);
            } else if (chunkId === 'CMAP') {
                for (let i = 0; i < chunkSize; i += 3) {
                    const r = buffer.readUInt8(offset + i);
                    const g = buffer.readUInt8(offset + i + 1);
                    const b = buffer.readUInt8(offset + i + 2);
                    palette.push((r << 16) | (g << 8) | b);
                }
            } else if (chunkId === 'BODY') {
                bodyOffset = offset;
                bodySize = chunkSize;
            }

            // Pad to even byte
            offset += chunkSize + (chunkSize % 2);
        }

        if (width === 0 || height === 0 || planes === 0) return null;

        // Decode BODY
        const rawBody = buffer.subarray(bodyOffset, bodyOffset + bodySize);
        const planeData = this.decompress(rawBody, compression, width, height, planes);

        // Planar to Chunky
        const pixels = this.planarToChunky(planeData, width, height, planes);

        return { width, height, palette, pixels };
    }

    private decompress(data: any, compression: number, width: number, height: number, planes: number): Uint8Array {
        // Row size in bytes per plane (rounded up to word?)
        // Standard ILBM rows are padded to 16 bits (2 bytes).
        const rowBytes = Math.ceil(width / 16) * 2;
        const totalBytes = rowBytes * height * planes;

        if (compression === 0) {
            return new Uint8Array(data);
        } else if (compression === 1) {
            // ByteRun1
            const output = new Uint8Array(totalBytes);
            let outIdx = 0;
            let inIdx = 0;

            // Loop until we filled the buffer or run out of input
            while (inIdx < data.length && outIdx < totalBytes) {
                const n = data.readInt8(inIdx++);
                if (n >= 0 && n <= 127) {
                    // Copy n+1 bytes
                    const count = n + 1;
                    for (let i = 0; i < count; i++) {
                        output[outIdx++] = data[inIdx++];
                    }
                } else if (n >= -127 && n <= -1) {
                    // Repeat next byte -n+1 times
                    const count = -n + 1;
                    const val = data[inIdx++];
                    for (let i = 0; i < count; i++) {
                        output[outIdx++] = val;
                    }
                } else {
                    // No op (-128)
                }
            }
            return output;
        }
        return new Uint8Array(0);
    }

    private planarToChunky(planeData: Uint8Array, width: number, height: number, planes: number): Uint8Array {
        const pixels = new Uint8Array(width * height);
        const rowBytes = Math.ceil(width / 16) * 2;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let colorIndex = 0;
                const byteOffset = (x >> 3); // x / 8
                const bitMask = 0x80 >> (x & 7); // 7 - (x%8)

                for (let p = 0; p < planes; p++) {
                    const planeRowOffset = y * planes * rowBytes + p * rowBytes;
                    const byteVal = planeData[planeRowOffset + byteOffset];

                    if (byteVal & bitMask) {
                        colorIndex |= (1 << p);
                    }
                }
                pixels[y * width + x] = colorIndex;
            }
        }
        return pixels;
    }

    createTexture(scene: Scene, key: string, iff: IffImage) {
        if (scene.textures.exists(key)) return;

        // Create ImageData
        const buffer = new Uint8ClampedArray(iff.width * iff.height * 4);
        for (let i = 0; i < iff.pixels.length; i++) {
            const colorIdx = iff.pixels[i];
            // Check bounds
            if (colorIdx < iff.palette.length) {
                const color = iff.palette[colorIdx];
                buffer[i * 4 + 0] = (color >> 16) & 0xFF; // R
                buffer[i * 4 + 1] = (color >> 8) & 0xFF; // G
                buffer[i * 4 + 2] = color & 0xFF; // B
                buffer[i * 4 + 3] = 255; // Alpha
            } else {
                // Transparent or black?
                buffer[i * 4 + 3] = 255;
            }
        }

        const imageData = new ImageData(buffer, iff.width, iff.height);

        const texture = scene.textures.createCanvas(key, iff.width, iff.height);
        if (texture) {
            texture.context.putImageData(imageData, 0, 0);
            texture.refresh();
        }
    }
}
