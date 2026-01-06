# "Go" Test Analysis

## What is "GO"?

From `src/gameplay/gp.h`:
```c
#define GO (1L << 0)
```

GO is the first game action choice, representing navigation/movement between locations.

## Game Flow

1. **Main Menu** → Start New Game
2. **Story Scenes** → Opening monologue at Victoria Station
3. **Hotel Room** → Player's base location
4. **GO Action** → Navigate to different locations (taxi, walking, etc.)

## Scene System

The C code uses a scene-based system:
- Each scene has Init() and Done() functions
- Scenes have choices (GO, WAIT, BUSINESS_TALK, LOOK, etc.)
- Scenes transition based on player choices
- Locations are managed separately from scenes

## What "test_go.rec" Likely Tests

Based on the replay format and game structure:
1. Starts from main menu or a specific scene
2. Triggers the GO action
3. Shows location selection/navigation UI
4. Possibly moves to a location
5. Takes screenshots at each step

## Current Status

- ✅ Main menu working (2% pixel diff)
- ✅ Story scenes partially working (monologue test passes)
- ❌ Navigation/GO scene not implemented (32% pixel diff)

## What Needs to be Ported

### Priority 1: Navigation Scene
- Scene that shows when player selects GO
- Displays available locations
- Allows location selection
- Shows taxi/travel options

### Priority 2: Location System
- Location data structures
- Location loading from game data
- Location relationships (taxi routes, etc.)

### Priority 3: Scene Management
- Scene transitions
- Scene state management
- Action menu system

## Files to Port

### C Source (Reference)
- `src/landscap/landscap.c` - Location/landscape system
- `src/scenes/scenes.c` - Scene management
- `src/gameplay/gp.c` - Main game loop and PlayStory()
- `src/present/interac.c` - Interaction/menu system

### TypeScript (To Create/Modify)
- `src-js/src/game/scenes/NavigationScene.ts` - NEW
- `src-js/src/game/scenes/HotelRoomScene.ts` - NEW
- `src-js/src/game/core/Location.ts` - NEW
- `src-js/src/game/services/LocationService.ts` - NEW
- `src-js/src/game/services/SceneManager.ts` - NEW
- `src-js/src/game/scenes/RouterScene.ts` - UPDATE

## Next Steps

1. Create a basic NavigationScene that shows location options
2. Implement location data structures
3. Load location data from game files
4. Connect to replay system
5. Test with test_go.rec
6. Iterate until pixel diff < 10%
