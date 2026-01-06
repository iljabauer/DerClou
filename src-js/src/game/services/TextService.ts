/**
 * TextService - Loads and decodes game text files
 * 
 * Ported from src/text/text.c
 * 
 * Text files are XOR encoded with 0x75 and use special markers:
 * - '#' marks the start of a key
 * - '\0' marks end of string (EOS)
 * - '^' marks end of file (EOF)
 * - ';' marks comments
 */

export interface TextEntry {
    key: string;
    lines: string[];
}

export class TextService {
    private static readonly TXT_XOR_VALUE = 0x75;
    private static readonly TXT_CHAR_EOS = '\0';
    private static readonly TXT_CHAR_MARK = '#';
    private static readonly TXT_CHAR_REMARK = ';';
    private static readonly TXT_CHAR_EOF = '^';
    
    private loadedTexts: Map<string, Map<string, string[]>> = new Map();
    private language: string = 'D'; // Default to German
    
    /**
     * Set the language for text loading
     * @param lang Language code: 'E' (English), 'D' (German), 'F' (French), 'S' (Spanish)
     */
    setLanguage(lang: string): void {
        this.language = lang;
    }
    
    /**
     * Load a text file from the game data
     * @param textName Name of the text file (without extension)
     * @returns Promise that resolves when text is loaded
     */
    async loadText(textName: string): Promise<boolean> {
        const path = `TEXTS/${textName}${this.language}.TXT`;
        
        try {
            const response = await fetch(path);
            if (!response.ok) {
                console.error(`Failed to load text file: ${path}`);
                return false;
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const decoded = this.decodeText(new Uint8Array(arrayBuffer));
            const entries = this.parseText(decoded);
            
            this.loadedTexts.set(textName, entries);
            console.log(`Loaded text file: ${textName} with ${entries.size} keys`);
            return true;
        } catch (error) {
            console.error(`Error loading text file ${path}:`, error);
            return false;
        }
    }
    
    /**
     * Decode XOR-encoded text data
     * @param data Encoded text data
     * @returns Decoded string
     */
    private decodeText(data: Uint8Array): string {
        const decoded = new Uint8Array(data.length);
        
        for (let i = 0; i < data.length; i++) {
            let byte = data[i] ^ TextService.TXT_XOR_VALUE;
            
            // Convert line endings to null terminators
            if (byte === 10 || byte === 13) {
                byte = 0;
            }
            
            decoded[i] = byte;
        }
        
        // Convert to string, handling null bytes
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            if (decoded[i] === 0) {
                result += '\0';
            } else {
                result += String.fromCharCode(decoded[i]);
            }
        }
        
        return result;
    }
    
    /**
     * Parse decoded text into key-value pairs
     * @param text Decoded text string
     * @returns Map of keys to line arrays
     */
    private parseText(text: string): Map<string, string[]> {
        const entries = new Map<string, string[]>();
        let currentKey: string | null = null;
        let currentLines: string[] = [];
        let i = 0;
        
        while (i < text.length) {
            const char = text[i];
            
            // End of file
            if (char === TextService.TXT_CHAR_EOF) {
                break;
            }
            
            // Start of a new key
            if (char === TextService.TXT_CHAR_MARK) {
                // Save previous key if exists
                if (currentKey !== null) {
                    entries.set(currentKey, currentLines);
                }
                
                // Read the key name
                i++; // Skip the '#'
                let keyName = '';
                while (i < text.length && text[i] !== TextService.TXT_CHAR_EOS) {
                    keyName += text[i];
                    i++;
                }
                
                currentKey = keyName.trim();
                currentLines = [];
                i++; // Skip the EOS
                continue;
            }
            
            // Comment line
            if (char === TextService.TXT_CHAR_REMARK) {
                // Skip until end of line
                while (i < text.length && text[i] !== TextService.TXT_CHAR_EOS) {
                    i++;
                }
                i++; // Skip the EOS
                continue;
            }
            
            // Regular line
            if (currentKey !== null) {
                let line = '';
                while (i < text.length && text[i] !== TextService.TXT_CHAR_EOS) {
                    if (text[i] === TextService.TXT_CHAR_MARK || text[i] === TextService.TXT_CHAR_EOF) {
                        break;
                    }
                    line += text[i];
                    i++;
                }
                
                if (line.length > 0) {
                    currentLines.push(line);
                }
                
                if (i < text.length && text[i] === TextService.TXT_CHAR_EOS) {
                    i++; // Skip the EOS
                }
            } else {
                i++;
            }
        }
        
        // Save last key
        if (currentKey !== null) {
            entries.set(currentKey, currentLines);
        }
        
        return entries;
    }
    
    /**
     * Get text lines for a specific key
     * @param textName Name of the text file
     * @param key Key to look up
     * @returns Array of text lines, or empty array if not found
     */
    getLines(textName: string, key: string): string[] {
        const textData = this.loadedTexts.get(textName);
        if (!textData) {
            console.warn(`Text file not loaded: ${textName}`);
            return [];
        }
        
        const lines = textData.get(key);
        if (!lines) {
            console.warn(`Key not found: ${key} in ${textName}`);
            return [];
        }
        
        return lines;
    }
    
    /**
     * Get the first line for a specific key
     * @param textName Name of the text file
     * @param key Key to look up
     * @returns First line of text, or empty string if not found
     */
    getFirstLine(textName: string, key: string): string {
        const lines = this.getLines(textName, key);
        return lines.length > 0 ? lines[0] : '';
    }
    
    /**
     * Check if a key exists in a text file
     * @param textName Name of the text file
     * @param key Key to check
     * @returns True if key exists
     */
    hasKey(textName: string, key: string): boolean {
        const textData = this.loadedTexts.get(textName);
        return textData ? textData.has(key) : false;
    }
}
