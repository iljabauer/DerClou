
import { Scene } from 'phaser';

declare const nw: any;
declare const process: any;
declare const Buffer: any;

export interface TextFile {
    name: string;
    content: Map<string, string[]>;
}

export class TextService {
    private texts: Map<string, TextFile> = new Map();
    private language: string = 'E'; // Default to English. 'D' for German.
    private hasLoaded: boolean = false;
    private basePath: string = '';

    private readonly TXT_XOR_VALUE = 0x75;
    private readonly TXT_CHAR_MARK = '#';
    private readonly TXT_CHAR_REMARK = ';';
    private readonly TXT_CHAR_EOF = '^';

    constructor() {}

    async loadTexts(language: string = 'E') {
        this.language = language;
        if (this.hasLoaded) return;

        if (typeof nw !== 'undefined') {
            await this.loadFromDisk();
        } else {
             console.warn("Web text loading not fully implemented without gamedata in public/");
             // TODO: Implement fetch for web build
        }
    }

    private async loadFromDisk() {
        const fs = nw.require('fs');
        const path = nw.require('path');
        // Assume we are in root or src-js.
        // If we are in src-js running nw ., process.cwd() is src-js.
        // gamedata is in ../gamedata

        let rootDir = process.cwd();
        if (!fs.existsSync(path.join(rootDir, 'gamedata'))) {
             rootDir = path.join(rootDir, '..');
        }

        const textDir = path.join(rootDir, 'gamedata', 'TEXTS');

        if (!fs.existsSync(textDir)) {
             console.error(`Text directory not found at ${textDir}`);
             return;
        }

        const listFile = path.join(textDir, 'TEXTS.LST');
        if (!fs.existsSync(listFile)) {
            console.error(`TEXTS.LST not found at ${listFile}`);
            return;
        }

        const listContent = fs.readFileSync(listFile, 'utf-8');
        const files = listContent.split(/\r?\n/).map((l: string) => l.trim()).filter((l: string) => l.length > 0);

        for (const filename of files) {
            // Filename in LST is "menu", we need "MENUE.TXT" or "MENUD.TXT"

            const fullFilename = `${filename.toUpperCase()}${this.language}.TXT`;
            const filePath = path.join(textDir, fullFilename);

            if (fs.existsSync(filePath)) {
                const buffer = fs.readFileSync(filePath);
                const decoded = this.decode(buffer);
                const parsed = this.parse(decoded);
                this.texts.set(filename.toUpperCase(), { name: filename, content: parsed });
            } else {
                console.warn(`Text file not found: ${filePath}`);
            }
        }
        this.hasLoaded = true;
    }

    private decode(buffer: any): string {
        const decodedBuffer = Buffer.alloc(buffer.length);
        for (let i = 0; i < buffer.length; i++) {
            let val = buffer[i] ^ this.TXT_XOR_VALUE;

            if (val === 10 || val === 13) {
                decodedBuffer[i] = 0; // Null char
            } else {
                decodedBuffer[i] = val;
            }
        }
        return decodedBuffer.toString('latin1');
    }

    private parse(content: string): Map<string, string[]> {
        const map = new Map<string, string[]>();
        // Content is a string with \0 as separators.
        const tokens = content.split('\0');
        let currentKey: string | null = null;
        let currentLines: string[] = [];

        for (let token of tokens) {
            if (token.length === 0) continue;

            if (token === this.TXT_CHAR_EOF) break;

            if (token.startsWith(this.TXT_CHAR_MARK)) {
                // Save previous
                if (currentKey) {
                    map.set(currentKey, currentLines);
                }
                currentKey = token.substring(1); // Remove #
                currentLines = [];
            } else if (token.startsWith(this.TXT_CHAR_REMARK)) {
                // Comment, ignore
            } else {
                if (currentKey) {
                    currentLines.push(token);
                }
            }
        }
        // Save last
        if (currentKey) {
            map.set(currentKey, currentLines);
        }

        return map;
    }

    getText(filename: string, key: string): string[] {
        const file = this.texts.get(filename.toUpperCase());
        if (!file) return [];
        return file.content.get(key) || [];
    }
}
