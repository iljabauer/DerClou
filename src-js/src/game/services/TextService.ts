/**
 * Text System - Port of src/text/text.c
 * 
 * Handles loading and managing text files with multi-language support.
 * Text files are XOR encrypted and organized by keys.
 */

// Constants from text_p.h
const TXT_XOR_VALUE = 0x75;
const TXT_CHAR_EOS = '\0';
const TXT_CHAR_MARK = '#';
const TXT_CHAR_REMARK = ';';
const TXT_CHAR_KEY_SEPARATOR = ',';
const TXT_CHAR_EOF = '^';
const TXT_KEY_LENGTH = 256;

// Language constants from text.h
export enum TextLanguage {
    ENGLISH = 0,
    GERMAN = 1,
    FRENCH = 2,
    SPANISH = 3
}

const LANGUAGE_MARKS = ['E', 'D', 'F', 'S'];

interface TextFile {
    name: string;
    handle: string | null;  // Decrypted text content
    lastMark: number;       // Position in text for iteration
    size: number;
}

export class TextService {
    private texts: TextFile[] = [];
    private language: TextLanguage = TextLanguage.GERMAN;
    private dataPath: string;
    private keyBuffer: string = '';

    constructor(dataPath: string = '../gamedata/TEXTS') {
        this.dataPath = dataPath;
    }

    /**
     * Initialize text system and load all text files
     */
    async init(language: TextLanguage = TextLanguage.GERMAN): Promise<boolean> {
        this.language = language;
        
        try {
            // Load TEXTS.LST to get list of text files
            const listPath = `${this.dataPath}/TEXTS.LST`;
            const response = await fetch(listPath);
            if (!response.ok) {
                console.error(`Failed to load ${listPath}`);
                return false;
            }

            const listContent = await response.text();
            const textNames = listContent.trim().split('\n').map(line => line.trim()).filter(line => line && !line.startsWith(';'));

            // Initialize text file entries
            for (const name of textNames) {
                this.texts.push({
                    name,
                    handle: null,
                    lastMark: 0,
                    size: 0
                });
            }

            // Load all text files
            for (let i = 0; i < this.texts.length; i++) {
                await this.loadText(i);
            }

            console.log(`TextService initialized with ${this.texts.length} text files (language: ${TextLanguage[language]})`);
            return true;
        } catch (error) {
            console.error('Failed to initialize TextService:', error);
            return false;
        }
    }

    /**
     * Load a specific text file
     */
    private async loadText(textId: number): Promise<boolean> {
        const txt = this.texts[textId];
        if (!txt || txt.handle) {
            return false;
        }

        try {
            const langMark = LANGUAGE_MARKS[this.language];
            const txtPath = `${this.dataPath}/${txt.name.toUpperCase()}${langMark}.TXT`;
            
            const response = await fetch(txtPath);
            if (!response.ok) {
                console.error(`Failed to load ${txtPath}`);
                return false;
            }

            const buffer = await response.arrayBuffer();
            const data = new Uint8Array(buffer);
            
            // Decrypt text (XOR with TXT_XOR_VALUE)
            const decrypted = new Uint8Array(data.length);
            for (let i = 0; i < data.length; i++) {
                let byte = data[i] ^ TXT_XOR_VALUE;
                // Convert line breaks to EOS
                if (byte === 10 || byte === 13) {
                    byte = 0;
                }
                decrypted[i] = byte;
            }

            // Convert to string
            txt.handle = new TextDecoder('latin1').decode(decrypted);
            txt.size = txt.handle.length;
            txt.lastMark = 0;

            return true;
        } catch (error) {
            console.error(`Failed to load text ${textId} (${txt.name}):`, error);
            return false;
        }
    }

    /**
     * Unload a text file from memory
     */
    unloadText(textId: number): void {
        const txt = this.texts[textId];
        if (txt) {
            txt.handle = null;
            txt.lastMark = 0;
            txt.size = 0;
        }
    }

    /**
     * Prepare text for reading (reset to beginning)
     */
    private prepareText(textId: number): void {
        const txt = this.texts[textId];
        if (txt && txt.handle) {
            txt.lastMark = 0;
        }
    }

    /**
     * Get a specific line from a text entry
     */
    private getLine(txt: TextFile, lineNr: number): string | null {
        if (!txt || !txt.handle || lineNr === 0) {
            return null;
        }

        let pos = txt.lastMark;
        let i = 0;
        const content = txt.handle;

        while (i < lineNr && pos < content.length) {
            const char = content[pos];

            if (char === TXT_CHAR_EOF) {
                return null;
            }

            if (i > 0 && char === TXT_CHAR_MARK) {
                return null;
            }

            if (char === TXT_CHAR_EOS) {
                pos++; // Skip second EOS
                i++;

                if (pos >= content.length || content[pos] === TXT_CHAR_EOF) {
                    return null;
                }

                // Skip comments
                while (pos + 1 < content.length && content[pos + 1] === TXT_CHAR_REMARK) {
                    while (pos < content.length && content[pos] !== TXT_CHAR_EOS) {
                        pos++;
                    }
                    pos++; // Skip second EOS
                }
            }

            pos++;
        }

        if (pos >= content.length || content[pos] === TXT_CHAR_EOF || content[pos] === TXT_CHAR_MARK) {
            return null;
        }

        // Extract line
        let line = '';
        while (pos < content.length && content[pos] !== TXT_CHAR_EOS && content[pos] !== TXT_CHAR_EOF) {
            line += content[pos];
            pos++;
        }

        return line || null;
    }

    /**
     * Find text by key and return all lines
     */
    goKey(textId: number, key: string | null = null): string[] | null {
        const txt = this.texts[textId];
        if (!txt || !txt.handle) {
            return null;
        }

        const content = txt.handle;
        let lastMark = txt.lastMark;

        // If no key specified, use next entry
        if (!key && txt.lastMark > 0) {
            lastMark = txt.lastMark;
        }

        this.prepareText(textId);

        if (!key && lastMark > 0) {
            txt.lastMark = lastMark + 1;
        }

        // Search for key
        for (let pos = txt.lastMark; pos < content.length; pos++) {
            if (content[pos] === TXT_CHAR_MARK) {
                let found = true;

                if (key) {
                    // Extract mark key
                    let markKey = '';
                    let markPos = pos + 1;
                    while (markPos < content.length && content[markPos] !== TXT_CHAR_EOS) {
                        markKey += content[markPos];
                        markPos++;
                    }

                    if (markKey !== key) {
                        found = false;
                    }
                }

                if (found) {
                    txt.lastMark = pos;
                    
                    // Collect all lines for this key
                    const lines: string[] = [];
                    let lineNr = 1;
                    let line: string | null;
                    
                    while ((line = this.getLine(txt, lineNr++)) !== null) {
                        lines.push(line);
                    }

                    return lines;
                }
            }
        }

        console.warn(`Text key not found: textId=${textId}, key=${key}`);
        return null;
    }

    /**
     * Get text by key and insert parameters (sprintf-like)
     */
    goKeyAndInsert(textId: number, key: string, ...args: any[]): string[] | null {
        const originLines = this.goKey(textId, key);
        if (!originLines) {
            return null;
        }

        const result: string[] = [];
        for (const line of originLines) {
            // Simple parameter substitution (supports %d, %s, etc.)
            let formatted = line;
            for (const arg of args) {
                formatted = formatted.replace(/%[ds]/, String(arg));
            }
            result.push(formatted);
        }

        return result;
    }

    /**
     * Check if a key exists in a text file
     */
    keyExists(textId: number, key: string): boolean {
        const txt = this.texts[textId];
        if (!txt || !txt.handle || !key) {
            return false;
        }

        const content = txt.handle;
        this.prepareText(textId);

        for (let pos = 0; pos < content.length; pos++) {
            if (content[pos] === TXT_CHAR_MARK) {
                let markKey = '';
                let markPos = pos + 1;
                while (markPos < content.length && content[markPos] !== TXT_CHAR_EOS) {
                    markKey += content[markPos];
                    markPos++;
                }

                if (markKey === key) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get first line of text by key
     */
    getFirstLine(textId: number, key: string): string | null {
        return this.getNthString(textId, key, 0);
    }

    /**
     * Get nth line of text by key
     */
    getNthString(textId: number, key: string, nth: number): string | null {
        const lines = this.goKey(textId, key);
        if (!lines || nth >= lines.length) {
            return null;
        }
        return lines[nth];
    }

    /**
     * Get all text as a single string
     */
    getString(textId: number, key: string): string | null {
        const lines = this.goKey(textId, key);
        if (!lines) {
            return null;
        }
        return lines.join('\n');
    }

    /**
     * Get text lines by key (alias for goKey)
     */
    getTextLines(textId: number, key: string): string[] | null {
        return this.goKey(textId, key);
    }

    /**
     * Extract a specific key from a comma-separated key string
     */
    getKey(keyNr: number, keyString: string): string | null {
        if (!keyString) {
            return null;
        }

        const keys = keyString.split(TXT_CHAR_KEY_SEPARATOR);
        if (keyNr > 0 && keyNr <= keys.length) {
            return keys[keyNr - 1].trim();
        }

        return null;
    }

    /**
     * Get key as number
     */
    getKeyAsNumber(keyNr: number, keyString: string): number {
        const key = this.getKey(keyNr, keyString);
        return key ? parseInt(key, 10) : 0;
    }

    /**
     * Count number of keys in a comma-separated string
     */
    countKey(keyString: string): number {
        if (!keyString) {
            return 0;
        }
        return keyString.split(TXT_CHAR_KEY_SEPARATOR).length;
    }

    /**
     * Set language
     */
    setLanguage(language: TextLanguage): void {
        this.language = language;
    }

    /**
     * Get current language
     */
    getLanguage(): TextLanguage {
        return this.language;
    }

    /**
     * Get text file ID by name
     */
    getTextId(name: string): number {
        return this.texts.findIndex(txt => txt.name.toLowerCase() === name.toLowerCase());
    }

    /**
     * Cleanup
     */
    done(): void {
        for (let i = 0; i < this.texts.length; i++) {
            this.unloadText(i);
        }
        this.texts = [];
    }
}

// Singleton instance
let textService: TextService | null = null;

export function initTextService(dataPath?: string): TextService {
    if (!textService) {
        textService = new TextService(dataPath);
    }
    return textService;
}

export function getTextService(): TextService | null {
    return textService;
}
