# LocationScene Analysis

## C Code Structure

### Key Files
- `src/gameplay/gp_app.c` - Main game application logic
- `src/scenes/scenes.c` - Scene functions (Go, Look, etc.)
- `src/gameplay/gp.h` - Scene and Film data structures
- `src/anim/sysanim.c` - Animation system

### Scene Data Structure
```c
struct Scene {
    intptr_t EventNr;           // Scene event number
    void (*Init)(void);         // Init function
    void (*Done)(void);         // Done function
    struct Bedingungen *bed;    // Conditions
    LIST *std_succ;             // Standard successors (TCEventNode)
    uint32_t Moeglichkeiten;    // Available actions (bitmask)
    uint32_t Dauer;             // Duration in seconds
    uword Anzahl;               // How often it can happen
    uword Geschehen;            // How often it has happened
    ubyte Probability;          // Probability 0-255
    int32_t LocationNr;         // Location number (-1 for story scenes)
};
```

### Film Structure
```c
struct Film {
    uint32_t AmountOfScenes;
    struct Scene *act_scene;    // Current scene
    struct Scene *gameplay;
    LIST *loc_names;            // List of all locations (NODE)
    uint32_t StartScene;
    uint32_t StartZeit;         // Start time (days since year 0)
    uint32_t StartOrt;          // Start location
    uint32_t akt_Tag;           // Current day
    uint32_t akt_Minute;        // Current minute
    uint32_t akt_Ort;           // Current location
    uint32_t alter_Ort;         // Previous location
    uint32_t EnabledChoices;    // Enabled action choices
    ubyte StoryIsRunning;
};
```

### Location Scene Flow

1. **StdInit()** - Called when entering a scene
   - Sets current location from scene
   - Calls `tcRefreshLocationInTitle()` to show location name and date
   - Calls `PlayAnim()` to show location background/animation
   - Calls `ShowTime()` to display clock
   - Calls `tcPersonGreetsMatt()` for NPC greetings

2. **tcRefreshLocationInTitle()** - Shows location info
   - Gets location name from `film->loc_names` list
   - Builds date string from `GetDay`
   - Formats: "{Location Name} {Date}"
   - Calls `ShowMenuBackground()` to show menu background
   - Calls `PrintStatus()` to display the text

3. **PlayAnim()** - Shows location background
   - Takes location name as AnimID
   - Loads animation/picture list from ANIM.LST
   - Shows first picture with `gfxShow()`
   - Sets up animation handler if multiple frames

4. **StdHandle()** - Handles action menu choices
   - GO: Calls `Go()` to navigate to another location
   - BUSINESS_TALK: Calls `Talk()` for conversations
   - LOOK: Calls `Look()` to examine location
   - INVESTIGATE: Calls `Investigate()` for detailed examination
   - MAKE_CALL: Calls `tcTelefon()` for phone calls
   - CALL_TAXI: Navigates to taxi scene
   - PLAN: Enters planning mode for burglary
   - WAIT: Advances time

### Action Menu Bitmask
```c
#define GO              (1L << 0)   // 0x00000001
#define BUSINESS_TALK   (1L << 1)   // 0x00000002
#define LOOK            (1L << 2)   // 0x00000004
#define INVESTIGATE     (1L << 3)   // 0x00000008
#define MAKE_CALL       (1L << 4)   // 0x00000010
#define CALL_TAXI       (1L << 5)   // 0x00000020
#define PLAN            (1L << 6)   // 0x00000040
#define WAIT            (1L << 7)   // 0x00000080
```

### Go() Function
```c
uint32_t Go(LIST *succ) {
    // If multiple successors, show menu
    if (GetNrOfNodes(succ) > 1) {
        ShowMenuBackground();
        txtGetFirstLine(THECLOU_TXT, "Gehen", line);
        PrintStatus(line);
        
        // Build menu from successor scenes
        for (node in succ) {
            sc = GetScene(node->EventNr);
            location = GetNthNode(film->loc_names, sc->LocationNr);
            NODE_NAME(node) = NODE_NAME(location);
        }
        
        // Show menu and get selection
        prob = Menu(succ, prob, 0, NULL, 0L);
        succ_eventnr = GetNthNode(succ, prob)->EventNr;
    }
    
    return succ_eventnr;
}
```

## TypeScript Implementation Plan

### LocationScene Components

1. **Scene Setup**
   - Load location data (name, date, available actions)
   - Load location background image/animation
   - Display location name and date at top
   - Show time clock

2. **Action Menu**
   - Display available actions at bottom
   - Actions: Gehen, Reden, Warten, Umsehen, Taxi rufen, Nachdenken
   - Keyboard navigation (UP/DOWN/LEFT/RIGHT)
   - Mouse selection
   - Highlight selected action

3. **Character Sprite**
   - Load and display Matt's sprite
   - Position on location background
   - Handle animations if needed

4. **Replay Integration**
   - Handle replay actions
   - Capture screenshots at each action
   - Process action menu selections

### Data Structures Needed

```typescript
interface SceneData {
    eventNr: number;
    locationNr: number;
    locationName: string;
    availableActions: number;  // Bitmask
    successors: SceneSuccessor[];
}

interface SceneSuccessor {
    eventNr: number;
    locationNr: number;
    locationName: string;
}

interface LocationData {
    id: number;
    name: string;
    backgroundImage: string;
    animationId?: string;
}
```

### Action Menu Layout

From screenshot analysis:
- Bottom of screen (y ~= 700-750)
- Two rows of actions
- Row 1: Gehen, Reden, [space], Taxi rufen, Nachdenken
- Row 2: Warten, Umsehen
- Green text (#00ff00)
- Courier New font, 16px

### Location Name Display

From screenshot analysis:
- Top center of screen
- Format: "{Location Name} {Date}"
- Example: "Holland Street 03.02.1953"
- White text
- Courier New font, ~20px

### Background Images

Locations use animations defined in ANIM.LST:
- Each location has an AnimID (same as location name)
- AnimID maps to picture list in ANIM.LST
- First picture is shown as static background
- Multiple pictures = animation sequence

Example from C code:
- Location "Holland Street" → AnimID "Holland Street"
- ANIM.LST contains picture IDs for that location
- PlayAnim() loads and displays the pictures

## Implementation Steps

1. Create LocationScene.ts with basic structure
2. Load location background from image catalog
3. Display location name and date
4. Create action menu UI
5. Handle keyboard/mouse input
6. Integrate with replay system
7. Handle action selection (route to appropriate scenes)
8. Add character sprite rendering
9. Test with go.spec.ts replay

## Notes

- For now, hardcode location data (will load from game files later)
- Focus on Holland Street scene first (from test_go.rec)
- Action menu should match C code layout
- Use existing ImageCatalog for loading backgrounds
- Use TextService for loading action names
- Keep replay system working throughout
