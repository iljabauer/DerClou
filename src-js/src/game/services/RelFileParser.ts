/**
 * Parser for .rel files (object relations)
 * Matches C implementation in relation.c
 * 
 * Format:
 * RELF
 * RTAB
 * <relation_id>
 * <left_object_id>
 * <right_object_id>
 * <parameter>
 * ...
 * RTAB
 * <relation_id>
 * ...
 */

import { Relation, RelationType } from '../types/GameTypes';

const REL_FILE_MARK = 'RELF';
const REL_TABLE_MARK = 'RTAB';

export class RelFileParser {
    private lines: string[];
    private index: number = 0;
    private relations: Relation[] = [];

    constructor(text: string) {
        this.lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    }

    /**
     * Parse all relations from the .rel file
     */
    parse(): Relation[] {
        this.relations = [];
        this.index = 0;

        // Check file marker
        if (this.readLine() !== REL_FILE_MARK) {
            console.error('Invalid .rel file: missing RELF marker');
            return [];
        }

        // Read relation tables
        while (this.index < this.lines.length) {
            const line = this.readLine();
            
            if (line === REL_TABLE_MARK) {
                this.readRelationTable();
            }
        }

        return this.relations;
    }

    private readRelationTable(): void {
        // Read relation ID
        const relationIdStr = this.readLine();
        if (!relationIdStr) return;
        
        const relationId = parseInt(relationIdStr, 10);
        if (isNaN(relationId)) {
            console.warn(`Invalid relation ID: ${relationIdStr}`);
            return;
        }

        // Read relation entries until next RTAB or EOF
        while (this.index < this.lines.length) {
            const nextLine = this.peekLine();
            
            if (nextLine === REL_TABLE_MARK) {
                break;
            }

            // Read left, right, parameter
            const leftStr = this.readLine();
            if (!leftStr) break;
            
            const rightStr = this.readLine();
            if (!rightStr) break;
            
            const paramStr = this.readLine();
            if (!paramStr) break;

            const leftId = parseInt(leftStr, 10);
            const rightId = parseInt(rightStr, 10);
            const parameter = parseInt(paramStr, 10);

            if (!isNaN(leftId) && !isNaN(rightId) && !isNaN(parameter)) {
                this.relations.push({
                    leftId,
                    rightId,
                    type: relationId as RelationType,
                    parameter,
                });
            }
        }
    }

    private readLine(): string {
        if (this.index >= this.lines.length) {
            return '';
        }
        return this.lines[this.index++];
    }

    private peekLine(): string {
        if (this.index >= this.lines.length) {
            return '';
        }
        return this.lines[this.index];
    }

    getRelations(): Relation[] {
        return this.relations;
    }
}

/**
 * Load relation file from filesystem or URL
 */
export async function loadRelationFile(path: string): Promise<string | null> {
    try {
        // Try to load from filesystem (Node.js/NW.js)
        if (typeof require !== 'undefined') {
            const fs = require('fs');
            return fs.readFileSync(path, 'utf-8');
        }
        
        // Try to load from URL (browser)
        const response = await fetch(path);
        if (!response.ok) {
            console.error(`Failed to load ${path}: ${response.statusText}`);
            return null;
        }
        return await response.text();
    } catch (error) {
        console.error(`Error loading ${path}:`, error);
        return null;
    }
}
