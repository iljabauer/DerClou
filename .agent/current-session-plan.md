# Current Session Plan - Session 3

## Previous Sessions Summary

### Session 2 - COMPLETED ✅
1. ✅ Created TextService - XOR decoding, text loading from TEXTS directory
2. ✅ Created DialogService - Speech/think bubbles, basic rendering
3. ✅ Created ImageService - Image catalog system (placeholder graphics)
4. ✅ Updated MainMenuScene - Now loads text from MENUD.TXT dynamically
5. ✅ Created MonologueScene - Basic structure for dialog sequences
6. ✅ All builds passing
7. ✅ Main menu test still passing (2% pixel diff acceptable)

### Session 1 - COMPLETED ✅
1. ✅ Created MainMenuScene with basic menu structure
2. ✅ Integrated replay system
3. ✅ Basic test passing

## Session 3 Goals

### Understanding the Game Architecture
From C code analysis:
- **tcStartGame()** - Initialize game, parse args, init subsystems
- **tcDo()** - Main game loop
  - ShowMenuBackground()
  - StartupMenu() - Show main menu (✅ DONE in MainMenuScene)
  - InitData() or tcLoadTheClou() - Start new game or load
  - PlayStory() - Run the story/game
- **tcDone()** - Cleanup

### Priority 1: Continue Porting Core Systems (80% time)

Next critical systems to port:

#### 1. Data System (src/data/)
- Database and data structures
- Character data, location data, object data
- Essential for InitData() / game initialization

#### 2. Story System (src/story/)
- Story/narrative system
- Scene transitions
- Game flow control (PlayStory())

#### 3. Scene System (src/scenes/)
- Scene rendering
- Background loading
- Scene composition

#### 4. Graphics System (src/gfx/)
- IFF/ILBM image loading
- Bitmap font rendering
- Color palette management

### Priority 2: Testing (20% time)
- Run `npm run build` after each file edit
- Test main menu periodically
- Keep game playable

## Work Completed This Session

1. ✅ **Explored C source structure** - Understood game flow and data systems
2. ✅ **Ported List data structure** - Doubly-linked list from src/list/
3. ✅ **Ported Database system** - Object management from src/data/
4. ✅ **Created StoryScene** - Basic story sequence display
5. ✅ **Loaded story text** - Opening monologue from STORY_0D.TXT
6. ✅ **All builds passing** - TypeScript compilation successful
7. ✅ **Commits made** - Each file committed separately

## Challenges Encountered

### Game Flow Complexity
The monologue test expects full game flow:
- Main menu → New Game selection → Story scene
- Requires shared replay service across scenes
- Story system is complex with many dependencies

### Next Steps Required
1. **Shared Replay Service** - Make replay work across scene transitions
2. **Scene Data Passing** - Pass game state between scenes
3. **Story System** - Port more of the story/narrative system
4. **Data Loading** - Load game data files (TCMAIN.DAT, etc.)
5. **Graphics Loading** - Port IFF/ILBM image loading for backgrounds/portraits

## Commit Strategy
- One commit per file edit
- Clear messages: "Port [system] from src/[path]/[file]"
- Include: Co-authored-by: Ona <no-reply@ona.com>

## Next Files to Port (In Order)
1. src/data/ - Database and data structures
2. src/story/ - Story system
3. src/scenes/ - Scene management
4. src/gfx/ - Graphics loading (IFF/ILBM)
5. src/present/ - Presentation layer
