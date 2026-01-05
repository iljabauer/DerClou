/**
 * ILBM (Interleaved Bitmap) decoder for Amiga IFF images
 * Ported from src/gfx/loadimage.c
 */

interface ILBMHeader {
    width: number;
    height: number;
    xOrigin: number;
    yOrigin: number;
    numPlanes: number;
    mask: number;
    compression: number;
    padding: number;
    transClr: number;
    xAspect: number;
    yAspect: number;
    pageWidth: number;
    pageHeight: number;
}

interface ILBMImage {
    width: number;
    height: number;
    pixels: Uint8Array;
    palette: Uint8Array; // RGB triplets (r,g,b,r,g,b,...)
}

const ID_FORM = [0x46, 0x4F, 0x52, 0x4D]; // 'FORM'
const ID_ILBM = [0x49, 0x4C, 0x42, 0x4D]; // 'ILBM'
const ID_BMHD = [0x42, 0x4D, 0x48, 0x44]; // 'BMHD'
const ID_BODY = [0x42, 0x4F, 0x44, 0x59]; // 'BODY'
const ID_CMAP = [0x43, 0x4D, 0x41, 0x50]; // 'CMAP'

function peekL_BE(buffer: Uint8Array, offset: number): number {
    return (
        (buffer[offset] << 24) |
        (buffer[offset + 1] << 16) |
        (buffer[offset + 2] << 8) |
        buffer[offset + 3]
    ) >>> 0;
}

function peekW_BE(buffer: Uint8Array, offset: number): number {
    return (buffer[offset] << 8) | buffer[offset + 1];
}

function compareBytes(buffer: Uint8Array, offset: number, target: number[]): boolean {
    for (let i = 0; i < target.length; i++) {
        if (buffer[offset + i] !== target[i]) {
            return false;
        }
    }
    return true;
}

function iffFindChunk(buffer: Uint8Array, sizeOfForm: number, chunkID: number[]): number {
    let currPos = 12;
    while (currPos + 4 <= sizeOfForm) {
        if (compareBytes(buffer, currPos, chunkID)) {
            return currPos + 4;
        }
        currPos += 2;
    }
    return 0;
}

function makeMCGA(b: number, pic: Uint8Array, picOffset: number, plSt: number, c: number): void {
    if ((b & 0x80) && c > 0) pic[picOffset + 0] |= plSt;
    if ((b & 0x40) && c > 1) pic[picOffset + 1] |= plSt;
    if ((b & 0x20) && c > 2) pic[picOffset + 2] |= plSt;
    if ((b & 0x10) && c > 3) pic[picOffset + 3] |= plSt;
    if ((b & 0x08) && c > 4) pic[picOffset + 4] |= plSt;
    if ((b & 0x04) && c > 5) pic[picOffset + 5] |= plSt;
    if ((b & 0x02) && c > 6) pic[picOffset + 6] |= plSt;
    if ((b & 0x01) && c > 7) pic[picOffset + 7] |= plSt;
}

function ilbmUncompress(
    body: Uint8Array,
    bodyOffset: number,
    hdr: ILBMHeader,
    pixels: Uint8Array
): void {
    let bodyPos = bodyOffset;
    const pitch = ((hdr.width + 15) & 0xFFF0);
    let lineOffset = 0;

    for (let y = 0; y < hdr.height; y++) {
        for (let plane = 0; plane < hdr.numPlanes; plane++) {
            let planeOffset = lineOffset;
            let breite = pitch;

            while (breite > 0) {
                const a = body[bodyPos++];

                if (a > 128) {
                    // Repeat byte
                    const count = 257 - a;
                    const o = body[bodyPos++];
                    for (let x = 0; x < count; x++) {
                        makeMCGA(o, pixels, planeOffset, 1 << plane, breite);
                        planeOffset += 8;
                        breite -= 8;
                    }
                } else {
                    // Copy bytes
                    for (let x = 0; x <= a; x++) {
                        const o = body[bodyPos++];
                        makeMCGA(o, pixels, planeOffset, 1 << plane, breite);
                        planeOffset += 8;
                        breite -= 8;
                    }
                }
            }
        }
        lineOffset += pitch;
    }
}

function ilbmCopy(
    body: Uint8Array,
    bodyOffset: number,
    hdr: ILBMHeader,
    pixels: Uint8Array
): void {
    let bodyPos = bodyOffset;
    const pitch = ((hdr.width + 15) & 0xFFF0);
    let lineOffset = 0;

    for (let y = 0; y < hdr.height; y++) {
        for (let plane = 0; plane < hdr.numPlanes; plane++) {
            let planeOffset = lineOffset;
            let breite = pitch;

            while (breite > 0) {
                const o = body[bodyPos++];
                makeMCGA(o, pixels, planeOffset, 1 << plane, breite);
                planeOffset += 8;
                breite -= 8;
            }
        }
        lineOffset += pitch;
    }
}

export function decodeILBM(buffer: Uint8Array): ILBMImage | null {
    // Check FORM header
    if (!compareBytes(buffer, 0, ID_FORM)) {
        console.error('Not an IFF file');
        return null;
    }

    const sizeOfForm = peekL_BE(buffer, 4) + 8;
    if (sizeOfForm > buffer.length) {
        console.error('File truncated');
        return null;
    }

    // Check ILBM type
    if (!compareBytes(buffer, 8, ID_ILBM)) {
        console.error('Not an ILBM file');
        return null;
    }

    // Find BMHD chunk
    let currPos = iffFindChunk(buffer, sizeOfForm, ID_BMHD);
    if (!currPos) {
        console.error('No BMHD chunk found');
        return null;
    }

    const bmhdSize = peekL_BE(buffer, currPos);
    currPos += 4;
    if (bmhdSize < 20) {
        console.error('Invalid BMHD size');
        return null;
    }

    // Parse BMHD header
    const hdr: ILBMHeader = {
        width: peekW_BE(buffer, currPos),
        height: peekW_BE(buffer, currPos + 2),
        xOrigin: peekW_BE(buffer, currPos + 4),
        yOrigin: peekW_BE(buffer, currPos + 6),
        numPlanes: buffer[currPos + 8],
        mask: buffer[currPos + 9],
        compression: buffer[currPos + 10],
        padding: buffer[currPos + 11],
        transClr: peekW_BE(buffer, currPos + 12),
        xAspect: buffer[currPos + 14],
        yAspect: buffer[currPos + 15],
        pageWidth: peekW_BE(buffer, currPos + 16),
        pageHeight: peekW_BE(buffer, currPos + 18)
    };

    if (hdr.compression > 1) {
        console.error('Unsupported compression:', hdr.compression);
        return null;
    }

    // Find BODY chunk
    currPos = iffFindChunk(buffer, sizeOfForm, ID_BODY);
    if (!currPos) {
        console.error('No BODY chunk found');
        return null;
    }

    const bodySize = peekL_BE(buffer, currPos);
    currPos += 4;

    // Create pixel buffer
    const pitch = ((hdr.width + 15) & 0xFFF0);
    const pixels = new Uint8Array(pitch * hdr.height);

    // Decompress or copy image data
    if (hdr.compression === 1) {
        ilbmUncompress(buffer, currPos, hdr, pixels);
    } else {
        ilbmCopy(buffer, currPos, hdr, pixels);
    }

    // Find CMAP chunk (palette)
    const palette = new Uint8Array(256 * 3);
    currPos = iffFindChunk(buffer, sizeOfForm, ID_CMAP);
    if (currPos) {
        const cmapSize = peekL_BE(buffer, currPos);
        currPos += 4;
        const numColors = Math.min(cmapSize / 3, 256);

        for (let c = 0; c < numColors; c++) {
            palette[c * 3 + 0] = buffer[currPos++]; // R
            palette[c * 3 + 1] = buffer[currPos++]; // G
            palette[c * 3 + 2] = buffer[currPos++]; // B
        }
    }

    return {
        width: hdr.width,
        height: hdr.height,
        pixels,
        palette
    };
}

/**
 * Convert ILBM image to RGBA for use with Phaser/Canvas
 */
export function ilbmToRGBA(ilbm: ILBMImage): Uint8Array {
    const rgba = new Uint8Array(ilbm.width * ilbm.height * 4);
    const pitch = ((ilbm.width + 15) & 0xFFF0);

    for (let y = 0; y < ilbm.height; y++) {
        for (let x = 0; x < ilbm.width; x++) {
            const srcIdx = y * pitch + x;
            const dstIdx = (y * ilbm.width + x) * 4;
            const colorIdx = ilbm.pixels[srcIdx];

            rgba[dstIdx + 0] = ilbm.palette[colorIdx * 3 + 0]; // R
            rgba[dstIdx + 1] = ilbm.palette[colorIdx * 3 + 1]; // G
            rgba[dstIdx + 2] = ilbm.palette[colorIdx * 3 + 2]; // B
            rgba[dstIdx + 3] = 255; // A
        }
    }

    return rgba;
}
