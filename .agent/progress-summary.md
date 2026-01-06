# Der Clou Porting Progress Summary

## Completed (Session 5 - Current)

### Scene Routing ✅
- **File**: `src-js/src/game/scenes/RouterScene.ts`
- **Status**: Complete
- **Features**:
  - Routes to appropriate scene based on replay file
  - Supports main_menu, monologue, go, and long replays
  - Integrated into game config as first scene

### Test Status ✅
- **main-menu.spec.ts**: 2% pixel diff (acceptable)
- **monologue.spec.ts**: 2% pixel diff (acceptable)
- **go.spec.ts**: 32% pixel diff (needs more work)
- **from-start-to-finish-first-burglary.spec.ts**: Not yet tested

## Completed (Session 4)

### Graphics System ✅

#### ILBM Image Loader
- **File**: `src-js/src/game/services/ILBMLoader.ts`
- **Status**: Complete
- **Features**:
  - Full ILBM (IFF Interleaved Bitmap) decoder
  - RLE compression support
  - Color palette handling (256 colors)
  - Planar to chunky bitmap conversion
  - Big-endian byte order handling
  - Creates Phaser textures from ILBM data
  - Ported from src/gfx/loadimage.c

#### ImageCatalog
- **File**: `src-js/src/game/services/ImageCatalog.ts`
- **Status**: Complete
- **Features**:
  - Loads PICT.LST (picture definitions)
  - Loads COLL.LST (collection definitions)
  - Maps picture IDs to image files
  - Loads collections on demand
  - Extracts sub-regions from collections
  - Creates textures for individual pictures
  - Collection caching

#### ImageService Update
- **File**: `src-js/src/game/services/ImageService.ts`
- **Status**: Updated to use ImageCatalog
- **Features**:
  - Dynamic loading from catalog files
  - Loads actual images instead of placeholders
  - Fallback to placeholders if needed

### Scene Graphics ✅

#### MainMenuScene
- Loads actual MENU background (train station)
- Scales from 320x120 to 1024x768
- Test passing with 2% pixel difference

#### StoryScene
- Loads BAHNHOF background (collection 131)
- Loads OLD_MATT portrait (picture 125)
- Scales backgrounds and portraits appropriately
- Fallback graphics if loading fails

### Infrastructure ✅
- Symlink to PICTURES directory in public folder
- All ILBM images accessible to web app

## Completed (Session 3)

### Core Data Structures ✅

#### List
- **File**: `src-js/src/game/core/List.ts`
- **Status**: Complete
- **Features**:
  - Doubly-linked list implementation
  - Node management (add, remove, get)
  - Iteration and search functions
  - Ported from src/list/list.h

#### Database
- **File**: `src-js/src/game/core/Database.ts`
- **Status**: Complete
- **Features**:
  - Object management system
  - Type-based object tracking
  - Object queries and lookups
  - ObjectNode for list integration
  - Ported from src/data/database.h

### Story System ✅

#### StoryScene
- **File**: `src-js/src/game/scenes/StoryScene.ts`
- **Status**: Basic implementation
- **Features**:
  - Scene rendering with backgrounds
  - Character portrait display
  - Speech bubble rendering
  - Date/location display
  - Dialog sequence management
  - Replay integration

### Scene Transitions ✅
- MainMenuScene now transitions to StoryScene on "New Game"
- Game config updated with both scenes

## Completed (Session 2)

### Core Services ✅

#### TextService
- **File**: `src-js/src/game/services/TextService.ts`
- **Status**: Complete and tested
- **Features**:
  - XOR decoding (0x75) for game text files
  - Parse key-value text format
  - Multi-language support (D, E, F, S)
  - Load text from TEXTS directory
  - Verified with MENUD.TXT

#### DialogService
- **File**: `src-js/src/game/services/DialogService.ts`
- **Status**: Basic implementation complete
- **Features**:
  - Speech and think bubble display
  - Text rendering with word wrap
  - Character portrait placeholder
  - Basic bubble graphics
  - Ready for monologue test

#### ImageService
- **File**: `src-js/src/game/services/ImageService.ts`
- **Status**: Placeholder implementation
- **Features**:
  - Image catalog system with IDs
  - Placeholder graphics generation
  - Support for speech bubbles and backgrounds
  - Will be expanded for IFF/ILBM loading

### MainMenuScene Updates ✅
- Now loads menu text from MENUD.TXT using TextService
- Dynamic text loading with fallback
- Still passes tests (2% pixel diff acceptable)

### Infrastructure ✅
- Symlink to TEXTS directory in public folder
- Build system working
- All TypeScript compilation passing

## Completed (Session 1)

### Main Menu Scene ✅
- **File**: `src-js/src/game/scenes/MainMenuScene.ts`
- **Status**: Functional, 98% accurate
- **Features**:
  - Displays title: "Der Clou! Open Source Project v0.8 (Prof. CD-ROM)"
  - Shows three menu options in German:
    - "Neues Spiel starten" (Start New Game)
    - "Spiel beenden" (Quit Game)
    - "Altes Spiel fortsetzen" (Load Game)
  - Integrated with replay system for testing
  - Placeholder background graphics
  
### Test Results
- **main-menu.spec.ts**: 98% match (2% difference due to font/graphics)
- Replay system working correctly
- Screenshot capture working

### Commits Made
1. Add MainMenuScene with basic menu structure
2. Add placeholder background graphics to MainMenuScene
3. Switch game to use MainMenuScene
4. Fix TypeScript error - remove unused titleText variable
5. Fix menu layout to show all three items horizontally
6. Update porting plan with main menu status

## Known Issues / TODOs

### Game Flow
- **Scene Transitions**: Need shared replay service across scenes
- **State Management**: Pass game state between MainMenuScene and StoryScene
- **Menu Selection**: MainMenuScene needs to properly trigger StoryScene with replay

### Graphics System
- ✅ ~~IFF/ILBM Loading~~ - DONE
- ✅ ~~Background Images~~ - DONE (MENU, BAHNHOF)
- ✅ ~~Character Portraits~~ - DONE (OLD_MATT)
- **Speech Bubble Graphics**: Need to load BUBBLE collection
- **Animation Support**: .ANI files not yet supported

### Font System
- **Web Font**: Currently using Courier New
- **Bitmap Font**: Original uses bitmap font from `gamedata/PICTURES/FONT`
- **Pixel-Perfect**: Need bitmap font for exact rendering

### Data System
- **Game Data Loading**: Need to load TCMAIN.DAT, TCBUILD.DAT
- **Relations**: Need to port relation system from src/data/relation.c
- **Object Types**: Need to define all object types (Person, Location, etc.)

### Story System
- **Story Flow**: Need to port PlayStory() and story management
- **Scene Sequences**: Multiple dialog sequences per scene
- **Story Data**: Load story definitions from data files

### Next Priority Systems

1. **Speech Bubble Graphics**
   - Load BUBBLE collection (129)
   - Extract speech/think bubble images
   - Replace placeholder bubbles in DialogService
   - Support different bubble types
   
2. **Bitmap Font System**
   - Load bitmap font from PICTURES/FONT or MENU.FNT
   - Replace web font with bitmap font
   - Achieve pixel-perfect text rendering
   - Reduce test pixel difference to <1%

3. **Data Loading**
   - Port database loading from src/data/
   - Load TCMAIN.DAT and TCBUILD.DAT
   - Parse object data structures
   - Relation system

4. **Story System**
   - Port story management from src/story/
   - Scene sequencing
   - Dialog flow
   - Game state management

## Architecture Notes

### Current Structure
```
src-js/src/
├── game/
│   ├── main.ts              # Game configuration
│   ├── scenes/
│   │   ├── MainMenuScene.ts # ✅ Main menu (functional)
│   │   └── GameStartScene.ts # Old replay test scene
│   └── services/
│       ├── ReplayService.ts  # ✅ Replay system
│       ├── InputHandler.ts   # ✅ Input handling
│       └── Random.ts         # ✅ RNG system
└── main.ts                   # Entry point
```

### C Source Structure (Reference)
```
src/
├── base/         # Core engine
├── gfx/          # Graphics system
├── text/         # Text/localization
├── dialog/       # Dialog system
├── scenes/       # Game scenes
├── present/      # Presentation layer
├── data/         # Database
└── ...
```

## Testing Strategy

### Playwright Tests Available
1. ✅ `main-menu.spec.ts` - Main menu (98% passing)
2. ⏳ `monologue.spec.ts` - Dialog/monologue system
3. ⏳ `go.spec.ts` - Unknown
4. ⏳ `from-start-to-finish-first-burglary.spec.ts` - Full game flow

### Test Approach
- Run tests frequently to verify progress
- Accept minor visual differences (font rendering)
- Focus on functionality over pixel-perfect accuracy
- Keep replay system working

## Build Status
- ✅ TypeScript compilation: Passing
- ✅ Vite build: Successful
- ✅ Dev server: Running on 0.0.0.0:8080 (accessible externally)
- ✅ Playwright: Installed and configured
- ✅ Gitpod preview: Configured with allowedHosts

## Next Session Goals

### High Priority
1. **Create LocationScene / NavigationScene**
   - Port basic location/landscape system from src/landscap/
   - Implement navigation UI for moving between locations
   - Get "go" test closer to passing (currently 32% diff)

2. **Improve Scene Transitions**
   - Better state management between scenes
   - Proper scene data passing
   - Scene history/back navigation

### Medium Priority
3. **Port Basic Data Loading**
   - Start with simple object types (Person, Location)
   - Load TCMAIN.DAT basics
   - Create TypeScript interfaces for game objects
   - Port relation system basics

4. **Enhance Dialog System**
   - Better text wrapping
   - Character animations
   - Multiple dialog types
   - Load actual dialog data from story files

### Low Priority
5. **Font System**
   - Port bitmap font loading from PICTURES/FONT
   - Reduce pixel difference to \u003c1%

6. **Full Game Flow**
   - Complete story sequences
   - Save/load system
   - Full burglary gameplay

## Session Notes
- Session 5: Added RouterScene, verified tests, documented progress
- Following 80/20 rule: 80% porting, 20% testing
- Keeping game playable at all times
- Committing after every file edit
- 2% pixel difference is acceptable for now
