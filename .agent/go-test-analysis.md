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

## What "test_go.rec" Actually Tests

Analyzed replay file (71 records, RNG seed 12345):

**Action Sequence:**
1. **Tick 8-34**: TIME actions (waiting)
2. **Tick 82**: LBUTTONP (click) - likely "New Game" on main menu
3. **Tick 84-92**: TIME actions with RNG checksum changes (15)
4. **Tick 138**: LBUTTONP - another click
5. **Tick 187**: LBUTTONP - another click
6. **Tick 254**: LBUTTONP - another click
7. **Tick 380**: LBUTTONP - another click
8. **Tick 624, 677**: RIGHT key - keyboard navigation
9. **Tick 713**: DOWN key - keyboard navigation
10. **Tick 755**: LBUTTONP - selection
11. **Tick 847**: LBUTTONP - another selection
12. **Tick 895**: RIGHT key
13. **Tick 939**: LBUTTONP
14. **Tick 1159**: LBUTTONP
15. **Tick 1348**: INP_FUNCTION_KEY (0x00002000)
16. **Tick 1421**: DOWN key
17. **Tick 1487**: LBUTTONP - final click

**Interpretation:**
- Starts at main menu
- Clicks through story/intro scenes
- Reaches a location with action menu
- Uses keyboard (RIGHT/DOWN) to navigate menu
- Selects actions with mouse clicks
- Likely tests the GO action and location navigation
- Function key press suggests menu/UI interaction

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

## How GO Works in C Code

From `src/scenes/scenes.c` - `Go(LIST *succ)` function:

```c
uint32_t Go(LIST *succ) {
    // If multiple locations available:
    if (GetNrOfNodes(succ) > 1) {
        // Show menu background
        ShowMenuBackground();
        
        // Print "Gehen" (Go) as title
        txtGetFirstLine(THECLOU_TXT, "Gehen", line);
        PrintStatus(line);
        
        // Build menu from successor scenes
        for each successor scene:
            - Get scene's location name
            - Add to menu
        
        // Show menu and get user selection
        prob = Menu(succ, prob, 0, NULL, 0L);
        
        // Return selected scene's event number
        return selected_scene->EventNr;
    }
    // If only one location, go there directly
    else {
        return first_successor->EventNr;
    }
}
```

**Key Points:**
- GO shows a menu of available locations
- Locations come from scene successors
- User selects with Menu() function (keyboard/mouse)
- Returns next scene to transition to

## Files to Port

### C Source (Reference)
- `src/scenes/scenes.c` - Scene management, Go() function
- `src/gameplay/gp.c` - Main game loop and PlayStory()
- `src/gameplay/gp_app.c` - StdHandle() for action handling
- `src/present/interac.c` - Menu() and Bubble() functions

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
