/**
 * Parser for .dat files (game object database)
 * Matches C implementation in database.c
 */

import { BinaryReader } from './BinaryReader';
import { ObjectType, Person, Player, Car, Building, Tool, Loot, Evidence, Environment, GameObject } from '../types/GameTypes';

// Object type constants from C (Object_Person, etc.)
const C_OBJECT_TYPES: Record<number, ObjectType> = {
    9900: ObjectType.Person,
    9901: ObjectType.Player,
    9902: ObjectType.Car,
    9903: ObjectType.Location,
    9904: ObjectType.Ability,
    9905: ObjectType.Item,
    9906: ObjectType.Tool,
    9907: ObjectType.Environment,
    9908: ObjectType.London,
    9909: ObjectType.Evidence,
    9910: ObjectType.Loot,
    9911: ObjectType.CompleteLoot,
    9912: ObjectType.LSLock,
    9913: ObjectType.LSObject,
    509993: ObjectType.LSRoom,
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
                case ObjectType.Loot:
                    return this.readLoot(header);
                case ObjectType.Evidence:
                    return this.readEvidence(header);
                case ObjectType.Environment:
                    return this.readEnvironment(header);
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

    private readLoot(header: ObjectHeader): Loot {
        const lootType = this.reader.readUInt16();
        const lootName = this.reader.readUInt16();
        const volume = this.reader.readUInt32();
        const weight = this.reader.readUInt16();
        const pictId = this.reader.readUInt16();

        return {
            id: header.nr,
            name: `Loot_${header.nr}`,
            type: ObjectType.Loot,
            lootType,
            lootName,
            volume,
            weight,
            pictId,
        };
    }

    private readEvidence(header: ObjectHeader): Evidence {
        const pers = this.reader.readUInt32();
        const recognition = this.reader.readUInt8();
        const walkTrail = this.reader.readUInt8();
        const waitTrail = this.reader.readUInt8();
        const workTrail = this.reader.readUInt8();
        const killTrail = this.reader.readUInt8();
        const callTrail = this.reader.readUInt8();
        const paperTrail = this.reader.readUInt8();
        const fotoTrail = this.reader.readUInt8();

        return {
            id: header.nr,
            name: `Evidence_${header.nr}`,
            type: ObjectType.Evidence,
            pers,
            recognition,
            walkTrail,
            waitTrail,
            workTrail,
            killTrail,
            callTrail,
            paperTrail,
            fotoTrail,
        };
    }

    private readEnvironment(header: ObjectHeader): Environment {
        const mattHasHotelRoom = this.reader.readUInt8();
        const mattHasIdentityCard = this.reader.readUInt8();
        const withOrWithoutYou = this.reader.readUInt8();
        const mattIsInLove = this.reader.readUInt8();
        const southhamptonHappened = this.reader.readUInt8();
        const present = this.reader.readUInt8();
        const firstTimeInSouth = this.reader.readUInt8();
        const postzugDone = this.reader.readUInt8();

        return {
            id: header.nr,
            name: `Environment_${header.nr}`,
            type: ObjectType.Environment,
            mattHasHotelRoom,
            mattHasIdentityCard,
            withOrWithoutYou,
            mattIsInLove,
            southhamptonHappened,
            present,
            firstTimeInSouth,
            postzugDone,
        };
    }

    getObjects(): Map<number, GameObject> {
        return this.objects;
    }
}
