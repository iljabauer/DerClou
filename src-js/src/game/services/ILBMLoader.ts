/**
 * ILBM (IFF Interleaved Bitmap) Image Loader
 * Ported from src/gfx/loadimage.c
 * 
 * Loads Amiga IFF ILBM format images used in Der Clou!
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

export class ILBMLoader {
    private static readonly ID_FORM = [0x46, 0x4F, 0x52, 0x4D]; // 'FORM'
    private static readonly ID_ILBM = [0x49, 0x4C, 0x42, 0x4D]; // 'ILBM'
    private static readonly ID_BMHD = [0x42, 0x4D, 0x48, 0x44]; // 'BMHD'
    private static readonly ID_BODY = [0x42, 0x4F, 0x44, 0x59]; // 'BODY'
    private static readonly ID_CMAP = [0x43, 0x4D, 0x41, 0x50]; // 'CMAP'

    /**
     * Read a 32-bit big-endian integer
     */
    private static peekLBE(buffer: Uint8Array, offset: number): number {
        return (
            (buffer[offset] << 24) |
            (buffer[offset + 1] << 16) |
            (buffer[offset + 2] << 8) |
            buffer[offset + 3]
        );
    }

    /**
     * Read a 16-bit big-endian integer
     */
    private static peekWBE(buffer: Uint8Array, offset: number): number {
        return (buffer[offset] << 8) | buffer[offset + 1];
    }

    /**
     * Find an IFF chunk by ID
     */
    private static findChunk(buffer: Uint8Array, sizeOfForm: number, chunkID: number[]): number {
        let currPos = 12;
        while (currPos + 4 <= sizeOfForm) {
            if (
                buffer[currPos] === chunkID[0] &&
                buffer[currPos + 1] === chunkID[1] &&
                buffer[currPos + 2] === chunkID[2] &&
                buffer[currPos + 3] === chunkID[3]
            ) {
                return currPos + 4;
            }
            currPos += 2;
        }
        return 0;
    }

    /**
     * Convert planar bitmap data to chunky format
     */
    private static makeMCGA(b: number, pic: Uint8Array, picOffset: number, plSt: number, c: number): void {
        if ((b & 0x80) && c > 0) pic[picOffset + 0] |= plSt;
        if ((b & 0x40) && c > 1) pic[picOffset + 1] |= plSt;
        if ((b & 0x20) && c > 2) pic[picOffset + 2] |= plSt;
        if ((b & 0x10) && c > 3) pic[picOffset + 3] |= plSt;
        if ((b & 0x08) && c > 4) pic[picOffset + 4] |= plSt;
        if ((b & 0x04) && c > 5) pic[picOffset + 5] |= plSt;
        if ((b & 0x02) && c > 6) pic[picOffset + 6] |= plSt;
        if ((b & 0x01) && c > 7) pic[picOffset + 7] |= plSt;
    }

    /**
     * Uncompress RLE-compressed ILBM body data
     */
    private static uncompressToPixels(
        body: Uint8Array,
        bodyOffset: number,
        hdr: ILBMHeader,
        pixels: Uint8Array
    ): void {
        let bodyPos = bodyOffset;
        let lineOffset = 0;
        const pitch = hdr.width;

        for (let y = 0; y < hdr.height; y++) {
            for (let plane = 0; plane < hdr.numPlanes; plane++) {
                let planeOffset = lineOffset;
                let breite = (hdr.width + 15) & 0xFFF0;

                while (breite > 0) {
                    let a = body[bodyPos++];
                    if (a > 128) {
                        // Repeat byte
                        a = 257 - a;
                        const o = body[bodyPos++];
                        for (let x = 0; x < a; x++) {
                            this.makeMCGA(o, pixels, planeOffset, 1 << plane, breite);
                            planeOffset += 8;
                            breite -= 8;
                        }
                    } else {
                        // Copy bytes
                        for (let x = 0; x <= a; x++) {
                            const o = body[bodyPos++];
                            this.makeMCGA(o, pixels, planeOffset, 1 << plane, breite);
                            planeOffset += 8;
                            breite -= 8;
                        }
                    }
                }
            }
            lineOffset += pitch;
        }
    }

    /**
     * Copy uncompressed ILBM body data
     */
    private static copyToPixels(
        body: Uint8Array,
        bodyOffset: number,
        hdr: ILBMHeader,
        pixels: Uint8Array
    ): void {
        let bodyPos = bodyOffset;
        let lineOffset = 0;
        const pitch = hdr.width;

        for (let y = 0; y < hdr.height; y++) {
            for (let plane = 0; plane < hdr.numPlanes; plane++) {
                let planeOffset = lineOffset;
                let breite = (hdr.width + 15) & 0xFFF0;

                while (breite > 0) {
                    const o = body[bodyPos++];
                    this.makeMCGA(o, pixels, planeOffset, 1 << plane, breite);
                    planeOffset += 8;
                    breite -= 8;
                }
            }
            lineOffset += pitch;
        }
    }

    /**
     * Load an ILBM file and return image data
     */
    public static async loadILBM(url: string): Promise<{
        width: number;
        height: number;
        pixels: Uint8Array;
        palette: Uint8Array;
    } | null> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to load ILBM: ${url}`);
                return null;
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);

            // Check FORM header
            if (
                buffer[0] !== this.ID_FORM[0] ||
                buffer[1] !== this.ID_FORM[1] ||
                buffer[2] !== this.ID_FORM[2] ||
                buffer[3] !== this.ID_FORM[3]
            ) {
                console.error(`Not an IFF file: ${url}`);
                return null;
            }

            const sizeOfForm = this.peekLBE(buffer, 4) + 8;
            if (sizeOfForm > buffer.length) {
                console.error(`ILBM truncated: ${url}`);
                return null;
            }

            // Check ILBM type
            if (
                buffer[8] !== this.ID_ILBM[0] ||
                buffer[9] !== this.ID_ILBM[1] ||
                buffer[10] !== this.ID_ILBM[2] ||
                buffer[11] !== this.ID_ILBM[3]
            ) {
                console.error(`Not an ILBM file: ${url}`);
                return null;
            }

            // Find BMHD chunk
            let currPos = this.findChunk(buffer, sizeOfForm, this.ID_BMHD);
            if (!currPos) {
                console.error(`No BMHD found: ${url}`);
                return null;
            }

            const chunkSize = this.peekLBE(buffer, currPos);
            currPos += 4;
            if (chunkSize < 20) {
                console.error(`Invalid BMHD: ${url}`);
                return null;
            }

            // Parse BMHD header
            const hdr: ILBMHeader = {
                width: this.peekWBE(buffer, currPos),
                height: this.peekWBE(buffer, currPos + 2),
                xOrigin: this.peekWBE(buffer, currPos + 4),
                yOrigin: this.peekWBE(buffer, currPos + 6),
                numPlanes: buffer[currPos + 8],
                mask: buffer[currPos + 9],
                compression: buffer[currPos + 10],
                padding: buffer[currPos + 11],
                transClr: this.peekWBE(buffer, currPos + 12),
                xAspect: buffer[currPos + 14],
                yAspect: buffer[currPos + 15],
                pageWidth: this.peekWBE(buffer, currPos + 16),
                pageHeight: this.peekWBE(buffer, currPos + 18),
            };

            if (hdr.compression > 1) {
                console.error(`Unsupported compression: ${url}`);
                return null;
            }

            // Find BODY chunk
            currPos = this.findChunk(buffer, sizeOfForm, this.ID_BODY);
            if (!currPos) {
                console.error(`No BODY found: ${url}`);
                return null;
            }
            currPos += 4; // Skip chunk size

            // Create pixel buffer
            const pixels = new Uint8Array(hdr.width * hdr.height);

            // Decompress or copy body data
            if (hdr.compression === 1) {
                this.uncompressToPixels(buffer, currPos, hdr, pixels);
            } else {
                this.copyToPixels(buffer, currPos, hdr, pixels);
            }

            // Find CMAP chunk (color palette)
            const palette = new Uint8Array(256 * 3);
            currPos = this.findChunk(buffer, sizeOfForm, this.ID_CMAP);
            if (currPos) {
                const cmapSize = this.peekLBE(buffer, currPos);
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
                palette,
            };
        } catch (error) {
            console.error(`Error loading ILBM ${url}:`, error);
            return null;
        }
    }

    /**
     * Create a Phaser texture from ILBM data
     */
    public static createTexture(
        scene: Phaser.Scene,
        key: string,
        imageData: { width: number; height: number; pixels: Uint8Array; palette: Uint8Array }
    ): void {
        const { width, height, pixels, palette } = imageData;

        // Create RGBA pixel data
        const rgbaData = new Uint8Array(width * height * 4);
        for (let i = 0; i < pixels.length; i++) {
            const colorIndex = pixels[i];
            const paletteOffset = colorIndex * 3;
            const rgbaOffset = i * 4;

            rgbaData[rgbaOffset + 0] = palette[paletteOffset + 0]; // R
            rgbaData[rgbaOffset + 1] = palette[paletteOffset + 1]; // G
            rgbaData[rgbaOffset + 2] = palette[paletteOffset + 2]; // B
            rgbaData[rgbaOffset + 3] = 255; // A
        }

        // Create texture from RGBA data
        const texture = scene.textures.createCanvas(key, width, height);
        if (texture) {
            const canvas = texture.getSourceImage() as HTMLCanvasElement;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const imageData = ctx.createImageData(width, height);
                imageData.data.set(rgbaData);
                ctx.putImageData(imageData, 0, 0);
                texture.refresh();
            }
        }
    }

    /**
     * Load an ILBM file and create a Phaser texture
     */
    public static async loadAndCreateTexture(scene: Phaser.Scene, key: string, url: string): Promise<boolean> {
        const imageData = await this.loadILBM(url);
        if (!imageData) {
            return false;
        }

        this.createTexture(scene, key, imageData);
        return true;
    }
}
