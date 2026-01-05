/**
 * Parser for .dat files (game object database)
 * Matches C implementation in database.c
 */

import { BinaryReader } from './BinaryReader';
import { ObjectType, Person, Player, Car, Building, Tool, GameObject } from '../types/GameTypes';

// Object type constants from C (Object_Person, etc.)
const C_OBJECT_TYPES: Record<number, ObjectType> = {
    9900: ObjectType.Person,
    9901: ObjectType.Player,
    9902: ObjectType.Car,
    9904: ObjectType.Building,
    9905: ObjectType.Tool,
    9906: ObjectType.Loot,
    9909: ObjectType.Evidence,
    9910: ObjectType.Environment,
    9911: ObjectType.LSArea,
    9912: ObjectType.LSObject,
    9913: ObjectType.Ability,
    9914: ObjectType.LSLock,
    9915: ObjectType.LSPower,
    9916: ObjectType.LSAlarm,
    9917: ObjectType.Lso,
    9918: ObjectType.CompleteLoot,
    9919: ObjectType.Scene,
    9920: ObjectType.Timer,
    9921: ObjectType.Item,
};

interface ObjectHeader {
    nr: number;      // Object ID
    type: number;    // Object type (C constant)
    size: number;    // Size of object data
}

export class DatFileParser {
    private reader: BinaryReader;
    private objects: Map<number, GameObject> = new Map();

    constructor(buffer: ArrayBuffer) {
        this.reader = new BinaryReader(buffer);
    }

    /**
     * Parse all objects from the .dat file
     */
    parse(): Map<number, GameObject> {
        this.objects.clear();

        while (!this.reader.isEOF() && this.reader.remaining() >= 12) {
            const header = this.readObjectHeader();
            
            // Check for end marker (0xffffffff)
            if (header.nr === 0xffffffff || header.type === 0xffffffff || header.size === 0xffffffff) {
                break;
            }

            const obj = this.readObject(header);
            if (obj) {
                this.objects.set(obj.id, obj);
            }
        }

        return this.objects;
    }

    private readObjectHeader(): ObjectHeader {
        return {
            nr: this.reader.readUInt32(),
            type: this.reader.readUInt32(),
            size: this.reader.readUInt32(),
        };
    }

    private readObject(header: ObjectHeader): GameObject | null {
        const objectType = C_OBJECT_TYPES[header.type];
        
        if (objectType === undefined) {
            console.warn(`Unknown object type ${header.type}, skipping ${header.size} bytes`);
            this.reader.skip(header.size);
            return null;
        }

        try {
            switch (objectType) {
                case ObjectType.Person:
                    return this.readPerson(header);
                case ObjectType.Player:
                    return this.readPlayer(header);
                case ObjectType.Car:
                    return this.readCar(header);
                case ObjectType.Building:
                    return this.readBuilding(header);
                case ObjectType.Tool:
                    return this.readTool(header);
                default:
                    // Skip unknown object types
                    console.warn(`Unimplemented object type ${objectType}, skipping`);
                    this.reader.skip(header.size);
                    return null;
            }
        } catch (error) {
            console.error(`Error reading object ${header.nr} type ${header.type}:`, error);
            return null;
        }
    }

    private readPerson(header: ObjectHeader): Person {
        return {
            id: header.nr,
            name: `Person_${header.nr}`,
            type: ObjectType.Person,
            pictId: this.reader.readUInt16(),
            job: this.reader.readUInt16(),
            sex: this.reader.readUInt16(),
            age: this.reader.readInt8(),
            health: this.reader.readUInt8(),
            mood: this.reader.readUInt8(),
            intelligence: this.reader.readUInt8(),
            strength: this.reader.readUInt8(),
            stamina: this.reader.readUInt8(),
            loyalty: this.reader.readUInt8(),
            skill: this.reader.readUInt8(),
            known: this.reader.readUInt8(),
            popularity: this.reader.readUInt8(),
            avarice: this.reader.readUInt8(),
            panic: this.reader.readUInt8(),
            knownToPolice: this.reader.readUInt8(),
            talkBits: this.reader.readUInt32(),
            talkFileId: this.reader.readUInt8(),
            oldHealth: this.reader.readUInt8(),
        };
    }

    private readPlayer(header: ObjectHeader): Player {
        return {
            id: header.nr,
            name: `Player_${header.nr}`,
            type: ObjectType.Player,
            // Player extends Person, but data is stored separately
            pictId: 0,
            job: 0,
            sex: 0,
            age: 0,
            health: 0,
            mood: 0,
            intelligence: 0,
            strength: 0,
            stamina: 0,
            loyalty: 0,
            skill: 0,
            known: 0,
            popularity: 0,
            avarice: 0,
            panic: 0,
            knownToPolice: 0,
            talkBits: 0,
            talkFileId: 0,
            oldHealth: 0,
            // Player-specific fields
            money: this.reader.readUInt32(),
            stolenMoney: this.reader.readUInt32(),
            myStolenMoney: this.reader.readUInt32(),
            nrOfBurglaries: this.reader.readUInt8(),
            jobOfferCount: this.reader.readUInt8(),
            mattsPart: this.reader.readUInt8(),
            currScene: this.reader.readUInt32(),
            currDay: this.reader.readUInt32(),
            currMinute: this.reader.readUInt32(),
            currLocation: this.reader.readUInt32(),
        };
    }

    private readCar(header: ObjectHeader): Car {
        const pictId = this.reader.readUInt16();
        const land = this.reader.readUInt16();
        const value = this.reader.readUInt32();
        const yearOfConstruction = this.reader.readUInt16();
        const colorIndex = this.reader.readUInt16();
        const strike = this.reader.readUInt8();
        const capacity = this.reader.readUInt32();
        const ps = this.reader.readUInt8();
        const speed = this.reader.readUInt8();
        const state = this.reader.readUInt8();
        const motorState = this.reader.readUInt8();
        const bodyWorkState = this.reader.readUInt8();
        const tyreState = this.reader.readUInt8();
        const placesInCar = this.reader.readUInt8();

        return {
            id: header.nr,
            name: `Car_${header.nr}`,
            type: ObjectType.Car,
            value,
            yearOfConstruction,
            colorIndex,
            strike,
            capacity,
            ps,
            speed,
            motorState,
            bodyWorkState,
            tyreState,
        };
    }

    private readBuilding(header: ObjectHeader): Building {
        const locationNr = this.reader.readUInt32();
        const policeTime = this.reader.readUInt32();
        const guardStrength = this.reader.readUInt8();
        const maxVolume = this.reader.readUInt32();
        const radioGuarding = this.reader.readUInt8();
        const escapeRoute = this.reader.readUInt8();

        return {
            id: header.nr,
            name: `Building_${header.nr}`,
            type: ObjectType.Building,
            locationNr,
            policeTime,
            guardStrength,
            maxVolume,
            radioGuarding,
            escapeRoute,
        };
    }

    private readTool(header: ObjectHeader): Tool {
        const value = this.reader.readUInt32();
        const danger = this.reader.readUInt8();
        const volume = this.reader.readUInt32();
        const effect = this.reader.readUInt8();

        return {
            id: header.nr,
            name: `Tool_${header.nr}`,
            type: ObjectType.Tool,
            value,
            danger,
            volume,
            effect,
        };
    }

    getObjects(): Map<number, GameObject> {
        return this.objects;
    }
}
