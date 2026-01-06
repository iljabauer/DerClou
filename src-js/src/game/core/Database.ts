/**
 * Database system - ported from src/data/database.h
 * 
 * Manages game objects, their relationships, and data structures.
 * Objects include characters, locations, items, abilities, etc.
 */

import { Node, List } from './List';

/**
 * Object node in the database
 * Extends Node with object-specific data
 */
export class ObjectNode extends Node {
    public nr: number;        // Object number/ID
    public type: number;      // Object type
    public data: any;         // Object data

    constructor(nr: number, type: number, data: any = null, name: string = '') {
        super(name, 0);
        this.nr = nr;
        this.type = type;
        this.data = data;
    }
}

/**
 * Database object header
 */
export interface DbObjectHeader {
    nr: number;
    type: number;
    size: number;
}

/**
 * Database object
 */
export interface DbObject {
    nr: number;
    type: number;
    realNr: number;
}

/**
 * Object list flags
 */
export const OLF_NORMAL = 0;
export const OLF_INCLUDE_NAME = 1 << 0;
export const OLF_INSERT_STAR = 1 << 1;
export const OLF_PRIVATE_LIST = 1 << 2;
export const OLF_ADD_PREV_STRING = 1 << 3;
export const OLF_ADD_SUCC_STRING = 1 << 4;
export const OLF_ALIGNED = 1 << 5;

/**
 * Database manager
 * Handles loading, storing, and querying game objects
 */
export class Database {
    private objects: Map<number, any> = new Map();
    private objectsByType: Map<number, Set<number>> = new Map();
    private objectNames: Map<number, string> = new Map();
    
    public objectList: List = new List();
    public objectListPrivate: List = new List();
    public objectListWidth: number = 0;

    constructor() {
        this.clear();
    }

    /**
     * Clear all objects from the database
     */
    clear(): void {
        this.objects.clear();
        this.objectsByType.clear();
        this.objectNames.clear();
        this.objectList.clear();
        this.objectListPrivate.clear();
    }

    /**
     * Create a new object in the database
     */
    newObject(nr: number, type: number, data: any, name: string = '', realNr: number = 0): any {
        if (this.objects.has(nr)) {
            console.warn(`Object ${nr} already exists, replacing`);
        }

        const obj = {
            nr,
            type,
            data,
            name,
            realNr: realNr || nr
        };

        this.objects.set(nr, obj);
        this.objectNames.set(nr, name);

        // Track by type
        if (!this.objectsByType.has(type)) {
            this.objectsByType.set(type, new Set());
        }
        this.objectsByType.get(type)!.add(nr);

        return obj;
    }

    /**
     * Delete an object from the database
     */
    deleteObject(nr: number): void {
        const obj = this.objects.get(nr);
        if (obj) {
            // Remove from type tracking
            const typeSet = this.objectsByType.get(obj.type);
            if (typeSet) {
                typeSet.delete(nr);
            }
            
            this.objects.delete(nr);
            this.objectNames.delete(nr);
        }
    }

    /**
     * Get an object by its number
     */
    getObject(nr: number): any {
        return this.objects.get(nr) || null;
    }

    /**
     * Get object number from object reference
     */
    getObjectNr(obj: any): number {
        if (obj && typeof obj === 'object' && 'nr' in obj) {
            return obj.nr;
        }
        return 0;
    }

    /**
     * Get object name
     */
    getObjectName(nr: number): string {
        return this.objectNames.get(nr) || '';
    }

    /**
     * Check if object exists and has the specified type
     */
    isObject(nr: number, type: number): any {
        const obj = this.objects.get(nr);
        if (obj && obj.type === type) {
            return obj;
        }
        return null;
    }

    /**
     * Get all objects of a specific type
     */
    getObjectsByType(type: number): any[] {
        const typeSet = this.objectsByType.get(type);
        if (!typeSet) {
            return [];
        }
        
        const result: any[] = [];
        typeSet.forEach(nr => {
            const obj = this.objects.get(nr);
            if (obj) {
                result.push(obj);
            }
        });
        
        return result;
    }

    /**
     * Get count of objects in database
     */
    getObjectCount(): number {
        return this.objects.size;
    }

    /**
     * Get count of objects of a specific type
     */
    getObjectCountOfType(type: number): number {
        const typeSet = this.objectsByType.get(type);
        return typeSet ? typeSet.size : 0;
    }

    /**
     * Add object node to a list
     */
    addObjectNode(list: List, nr: number, flags: number = OLF_NORMAL): ObjectNode | null {
        const obj = this.objects.get(nr);
        if (!obj) {
            return null;
        }

        const name = (flags & OLF_INCLUDE_NAME) ? this.getObjectName(nr) : '';
        const node = new ObjectNode(nr, obj.type, obj.data, name);
        list.addTail(node);
        
        return node;
    }

    /**
     * Remove object node from a list
     */
    removeObjectNode(list: List, nr: number): void {
        let node = list.head as ObjectNode | null;
        while (node) {
            if (node.nr === nr) {
                list.remove(node);
                return;
            }
            node = node.succ as ObjectNode | null;
        }
    }

    /**
     * Check if list has object node
     */
    hasObjectNode(list: List, nr: number): ObjectNode | null {
        let node = list.head as ObjectNode | null;
        while (node) {
            if (node.nr === nr) {
                return node;
            }
            node = node.succ as ObjectNode | null;
        }
        return null;
    }

    /**
     * Build object list from database
     */
    buildObjectList(type: number | null = null): void {
        this.objectList.clear();
        
        if (type === null) {
            // Add all objects
            this.objects.forEach((_obj, nr) => {
                this.addObjectNode(this.objectList, nr);
            });
        } else {
            // Add objects of specific type
            const typeSet = this.objectsByType.get(type);
            if (typeSet) {
                typeSet.forEach(nr => {
                    this.addObjectNode(this.objectList, nr);
                });
            }
        }
    }
}

// Global database instance
export const db = new Database();
