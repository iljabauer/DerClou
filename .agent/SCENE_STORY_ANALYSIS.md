# Scene and Story System Analysis

## Overview

The scene and story system in Der Clou! manages game flow, location navigation, and story progression.

## Key Components

### 1. Film Structure (src/gameplay/gp.h)

The `Film` structure is the central game state manager:

```c
struct Film {
    uint32_t AmountOfScenes;
    struct Scene *act_scene;      // Current scene
    struct Scene *gameplay;       // Gameplay scene
    LIST *loc_names;              // List of all locations
    uint32_t StartScene;
    uint32_t StartZeit;           // Start time (days since year 0)
    uint32_t StartOrt;            // Start location
    uint32_t akt_Tag;             // Current day
    uint32_t akt_Minute;          // Current minute
    uint32_t akt_Ort;             // Current location
    uint32_t alter_Ort;           // Previous location
    uint32_t EnabledChoices;
};
```

**Key Macros:**
- `GetLocation` = `film->akt_Ort` - Get current location number

### 2. Scene Functions (src/scenes/scenes.c)

#### Go() - Location Navigation
- Shows menu of available locations
- Returns selected scene/event number
- Handles taxi locations
- Updates location state

```c
uint32_t Go(LIST *succ)
```

**Flow:**
1. If multiple locations available, show menu
2. Get location names from `film->loc_names`
3. User selects destination
4. Return event number for selected location

#### Information() - Info Menu
- Shows information about player's possessions
- Categories: Player, Cars, People, Tools, Buildings, Loot
- Uses Present() system to display details
- Uses hasAll(), knowsAll() for filtering

```c
void Information(void)
```

**Menu Options:**
0. Player info (Player + Matt)
1. Cars (hasAll with Object_Car)
2. People (knowsAll with Object_Person)
3. Tools (hasAll with Object_Tool)
4. Buildings (hasAll with Object_Building)
5. Loot (Present with "Beute")

#### Look() - Examine Location
- Shows location description
- Lists people at location
- Uses GetObjNrOfLocation() to get location object
- Uses hasAll() to get people at location

```c
void Look(uint32_t locNr)
```

**Menu Options:**
0. Location description (from HOUSEDESC_TXT)
1. People at location (hasAll with Object_Person)

#### tcWait() - Time Progression
- Advances time in 60-minute increments
- Shows time display
- Detects new people arriving
- Max 960 minutes (16 hours)

```c
void tcWait(void)
```

**Flow:**
1. Show menu background and time
2. Loop: Add 60 minutes, check for new people
3. Wait for user input (click/ESC)
4. Exit after 960 minutes or user action

#### tcTelefon() - Phone System
- Shows phone interface
- Lists known people (knowsAll)
- Checks if person is home (livesIn)
- Initiates DynamicTalk() conversation

### 3. Story Functions (src/story/story.c)

Story functions are scene handlers that execute when entering specific story scenes.

**Pattern:**
```c
void tcDone<SceneName>(void) {
    // 1. Show dialogs (Say)
    // 2. Update game state (Environment, Relations)
    // 3. Add/remove taxi locations
    // 4. Give/take money
    // 5. Set return scene (SceneArgs.ReturnValue)
}
```

**Examples:**

- `tcDoneArrival()` - Game start, unlock taxi locations
- `tcDoneHotelReception()` - Get hotel room, complex dialog tree
- `tcDoneMamiCalls()` - Phone call from mother
- `tcDoneGludoMoney()` - Get money from Gludo
- `tcDoneDanner()` - Get money from Danner

**Common Operations:**
- `knowsSet()` - Establish relationship
- `livesInSet/UnSet()` - Move person to/from location
- `tcMoveAPerson()` - Move person to location
- `AddTaxiLocation()` - Unlock taxi destination
- `tcAddPlayerMoney()` - Give money
- `tcSetPlayerMoney()` - Set money
- `Say()` - Show dialog
- `SceneArgs.ReturnValue` - Set next scene

### 4. Location System (src/data/dataappl.c)

#### GetObjNrOfLocation()
- Converts location number to object ID
- Searches database for Location object with matching LocationNr

```c
uint32_t GetObjNrOfLocation(uint32_t LocNr)
```

### 5. Relation Queries (Already in Database.ts)

- `hasAll()` - Get all objects person has
- `knowsAll()` - Get all people person knows
- `livesIn()` - Check if person lives in location

## TypeScript Port Plan

### Phase 3A: Core Scene Functions

1. **Extend FilmService** (already stubbed)
   - Add Film state properties:
     - `currentLocation: number` (akt_Ort)
     - `previousLocation: number` (alter_Ort)
     - `currentDay: number` (akt_Tag)
     - `currentMinute: number` (akt_Minute)
     - `locationNames: string[]` (loc_names)
   - Add methods:
     - `getCurrentLocation(): number`
     - `setCurrentLocation(locNr: number): void`
     - `addTime(minutes: number): void`

2. **Create SceneService.ts**
   - Port Go() - Location navigation
   - Port Information() - Info menu
   - Port Look() - Examine location
   - Port Wait() - Time progression
   - Port Telefon() - Phone system

3. **Extend Database.ts**
   - Add `getObjNrOfLocation(locNr: number): number`
   - Add `getObjNrOfBuilding(locNr: number): number`

4. **Create StoryService.ts**
   - Port story scene handlers (tcDone* functions)
   - Scene constants (SCENE_*)
   - Story state management

### Phase 3B: Integration

1. **Update GameScene.ts**
   - Integrate SceneService
   - Add action menu (Go, Information, Look, Wait, Think)
   - Connect to story system

2. **Update LondonScene.ts**
   - Use SceneService for navigation
   - Show location backgrounds
   - Handle location transitions

3. **Testing**
   - Test with replay system
   - Verify scene transitions
   - Check story progression

## Dependencies

### Already Complete ✅
- Database (hasAll, knowsAll, livesIn)
- TextService (text lookup)
- UIService (menus, bubbles)
- DialogService (Say, DynamicTalk)
- LivingService (character display)
- BackgroundService (location backgrounds)

### Needs Implementation 🚧
- FilmService (game state)
- SceneService (scene functions)
- StoryService (story handlers)
- Location system (GetObjNrOfLocation)

## Key Insights

1. **Film is Central** - All game state flows through the Film structure
2. **Scene Functions are Reusable** - Go, Information, Look, Wait are called from many places
3. **Story Functions are Handlers** - Each story scene has a tcDone* function
4. **Location Numbers vs Object IDs** - Locations have both a number (index) and object ID
5. **Relation System is Key** - hasAll, knowsAll, livesIn drive most game logic
6. **SceneArgs.ReturnValue** - Story functions set next scene via this global

## Implementation Priority

1. **High Priority** (Core gameplay)
   - FilmService state management
   - SceneService (Go, Information, Look, Wait)
   - GetObjNrOfLocation()

2. **Medium Priority** (Story progression)
   - StoryService with key story handlers
   - Scene constants
   - Story state tracking

3. **Low Priority** (Polish)
   - Telefon() system
   - Advanced story scenes
   - Special effects

## Notes

- Scene system is well-structured and modular
- Story functions follow consistent pattern
- Heavy use of global state (film, SceneArgs)
- TypeScript port should encapsulate globals in services
- Replay system must handle scene transitions deterministically
