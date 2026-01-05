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
    Location = 3,
    Ability = 4,
    Item = 5,
    Tool = 6,
    Environment = 7,
    London = 8,
    Evidence = 9,
    Loot = 10,
    CompleteLoot = 11,
    LSLock = 12,
    LSObject = 13,
    LSRoom = 14,
    Building = 15,
    Police = 16,
    LSArea = 17,
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
    gTime: number;
    exactlyness: number;
    gRate: number;
    strike: number;
    values: number;
    escapeRoute: number;
    escapeRouteLength: number;
    radioGuarding: number;
    maxVolume: number;
    guardStrength: number;
    carXPos: number;
    carYPos: number;
    diskId: number;
}

export interface Tool extends GameObject {
    type: ObjectType.Tool;
    value: number;
    danger: number;
    volume: number;
    effect: number;
}

export interface Loot extends GameObject {
    type: ObjectType.Loot;
    lootType: number;
    lootName: number;
    volume: number;
    weight: number;
    pictId: number;
}

export interface Evidence extends GameObject {
    type: ObjectType.Evidence;
    pers: number;
    recognition: number;
    walkTrail: number;
    waitTrail: number;
    workTrail: number;
    killTrail: number;
    callTrail: number;
    paperTrail: number;
    fotoTrail: number;
}

export interface Environment extends GameObject {
    type: ObjectType.Environment;
    mattHasHotelRoom: number;
    mattHasIdentityCard: number;
    withOrWithoutYou: number;
    mattIsInLove: number;
    southhamptonHappened: number;
    present: number;
    firstTimeInSouth: number;
    postzugDone: number;
}

export interface Location extends GameObject {
    type: ObjectType.Location;
    locationNr: number;
    openFromMinute: number;
    openToMinute: number;
}

export interface Ability extends GameObject {
    type: ObjectType.Ability;
    abilityName: number;
    use: number;
}

export interface Item extends GameObject {
    type: ObjectType.Item;
    itemType: number;
    offsetFact: number;
    hExactXOffset: number;
    hExactYOffset: number;
    hExactWidth: number;
    hExactHeight: number;
    vExactXOffset: number;
    vExactYOffset: number;
    vExactWidth: number;
    vExactHeight: number;
}

export interface London extends GameObject {
    type: ObjectType.London;
    useless: number;
}

export interface CompleteLoot extends GameObject {
    type: ObjectType.CompleteLoot;
    bild: number;
    gold: number;
    geld: number;
    juwelen: number;
    delikates: number;
    statue: number;
    kuriositaet: number;
    histKunst: number;
    gebrauchsArt: number;
    vase: number;
    totalWeight: number;
    totalVolume: number;
}

export interface LSLock extends GameObject {
    type: ObjectType.LSLock;
    lockType: number;
}

export interface LSObject extends GameObject {
    type: ObjectType.LSObject;
    offsetFact: number;
    destX: number;
    destY: number;
    exactX: number;
    exactY: number;
    exactX1: number;
    exactY1: number;
    size: number;
    visible: number;
    chained: number;
    status: number;
    lsType: number;
}

export interface LSRoom extends GameObject {
    type: ObjectType.LSRoom;
    // Structure not fully defined in tcdata.h, will add fields as needed
}

export interface Police extends GameObject {
    type: ObjectType.Police;
    pictId: number;
    livingId: number;
}

export interface LSArea extends GameObject {
    type: ObjectType.LSArea;
    coll16Id: number;
    coll32Id: number;
    coll48Id: number;
    planColl16Id: number;
    planColl32Id: number;
    planColl48Id: number;
    floorCollId: number;
    planFloorCollId: number;
    width: number;
    height: number;
    objectBaseNr: number;
    darkness: number;
    startX0: number;
    startX1: number;
    startX2: number;
    startX3: number;
    startX4: number;
    startX5: number;
    startY0: number;
    startY1: number;
    startY2: number;
    startY3: number;
    startY4: number;
    startY5: number;
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
