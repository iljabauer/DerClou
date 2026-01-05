/**
 * Core game types ported from C (tcdata.h)
 */

export type ObjectId = number;

export interface GameObject {
    id: ObjectId;
    name: string;
    type: ObjectType;
}

export enum ObjectType {
    Person = 0,
    Player = 1,
    Car = 2,
    Building = 3,
    Tool = 4,
    Loot = 5,
    Evidence = 6,
    Environment = 7,
    LSArea = 8,
    LSObject = 9,
    Ability = 10,
    LSLock = 11,
    LSPower = 12,
    LSAlarm = 13,
    Lso = 14,
    CompleteLoot = 15,
    Scene = 16,
    Timer = 17,
    Item = 18,
}

export interface Person extends GameObject {
    type: ObjectType.Person | ObjectType.Player;
    pictId: number;
    job: number;
    sex: number;
    age: number;
    health: number;
    mood: number;
    intelligence: number;
    strength: number;
    stamina: number;
    loyalty: number;
    skill: number;
    known: number;
    popularity: number;
    avarice: number;
    panic: number;
    knownToPolice: number;
    talkBits: number;
    talkFileId: number;
    oldHealth: number;
}

export interface Player extends Person {
    type: ObjectType.Player;
    money: number;
    stolenMoney: number;
    myStolenMoney: number;
    nrOfBurglaries: number;
    jobOfferCount: number;
    mattsPart: number;
    currScene: number;
    currDay: number;
    currMinute: number;
    currLocation: number;
}

export interface Car extends GameObject {
    type: ObjectType.Car;
    value: number;
    yearOfConstruction: number;
    colorIndex: number;
    strike: number;
    capacity: number;
    ps: number;
    speed: number;
    motorState: number;
    bodyWorkState: number;
    tyreState: number;
}

export interface Building extends GameObject {
    type: ObjectType.Building;
    locationNr: number;
    policeTime: number;
    guardStrength: number;
    maxVolume: number;
    radioGuarding: number;
    escapeRoute: number;
}

export interface Tool extends GameObject {
    type: ObjectType.Tool;
    value: number;
    danger: number;
    volume: number;
    effect: number;
}

export interface Environment extends GameObject {
    type: ObjectType.Environment;
    day: number;
    hour: number;
    minute: number;
}

export interface Scene extends GameObject {
    type: ObjectType.Scene;
    sceneId: number;
    flags: number;
}

// Relations between objects (from tcdata.h)
export enum RelationType {
    HasClock = 1,
    ClockTimer = 2,
    StairConnects = 3,
    Has = 4,
    Knows = 5,
    LikesToBe = 6,
    Join = 7,
    JoinedBy = 8,
    Uses = 9,
    LivesIn = 10,
    Break = 11,
    Hurt = 12,
    Sound = 13,
    Opens = 14,
    ToolRequires = 15,
    Taxi = 16,
    Learned = 17,
    Remember = 18,
    HasLootBag = 19,
    PersonWorksHere = 20,
}

export interface Relation {
    leftId: ObjectId;
    rightId: ObjectId;
    type: RelationType;
    parameter: number;
}
