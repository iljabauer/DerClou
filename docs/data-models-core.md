# Data Models: DerClou Core

## Overview
The Core engine uses a **custom binary database system**. All game entities are defined as C structures in `src/data/tcdata.h` and are serialized/deserialized manually in `src/data/database.c`. Interaction with these objects is handled via a generic `dbObject` interface that mimics polymorphism.

## Core Entities

### Person
Represents NPCs and the Player character.
*   **Properties:** `PictID`, `Job`, `Sex`, `Age`, `Health`, `Mood`, `Intelligence`, `Strength`, `Stamina`, `Loyality`, `Skill`.
*   **State:** `Known`, `Popularity`, `Avarice`, `Panic`, `KnownToPolice`.

### Player
Extension of Person with player-specific stats.
*   **Properties:** `Money`, `StolenMoney`, `NrOfBurglaries`, `CurrScene`, `CurrDay`.

### Car
Vehicles used for transport/heists.
*   **Properties:** `Value`, `YearOfConstruction`, `ColorIndex`, `Strike` (Usefulness), `Capacity` (Loot size), `PS`, `Speed`.
*   **Condition:** `MotorState`, `BodyWorkState`, `TyreState`.

### Building
Target locations for burglaries.
*   **Properties:** `LocationNr` (Link to map), `PoliceTime` (Response time), `GuardStrength`, `MaxVolume` (Loot capacity).
*   **Security:** `RadioGuarding`, `EscapeRoute`.

### Tool
Equipment used to bypass security or open locks.
*   **Properties:** `Value`, `Danger` (Risk of alarm), `Volume`, `Effect` (Strength).

### Loot / Evidence
*   **Loot:** Items to be stolen (`Gold`, `Juwelen`, `Money`).
*   **Evidence:** Traces left behind (`Footprints`, `Fingerprints`).

## Relationship Model
The game uses a specialized **Relation System** (`src/data/relation.c`) to link objects dynamically without foreign keys in the binary format.
*   **Concepts:** `has`, `knows`, `livesIn`.
*   **Implementation:** Lists of links queried at runtime (e.g., `hasAll(Person_Matt, Object_Tool)`).

## Storage Format
*   **Type:** Binary Files (`.dat`).
*   **Encoding:** Custom binary packing (non-standard).
*   **Endianness:** Manually handled (Big/Little endian macros) to support cross-platform save files.
