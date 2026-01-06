# Session 4 Plan - Continue Porting Core Systems

## Current Status
- Main menu working (2% pixel diff acceptable)
- TextService, DialogService, ImageService implemented
- List and Database core structures ported
- StoryScene basic implementation exists
- Build passing, game playable

## Session 4 Goals

### Priority 1: Port More Core Systems (80% time)

#### 1. Graphics System - IFF/ILBM Image Loading
- Port image loading from src/gfx/
- Load actual background images
- Load character portraits
- Replace placeholder graphics in ImageService

#### 2. Scene System Enhancement
- Port scene rendering from src/scenes/
- Background composition
- Scene transitions
- Scene data structures

#### 3. Data Loading System
- Port data file loading from src/data/
- Load TCMAIN.DAT, TCBUILD.DAT
- Parse object data structures
- Character data, location data

#### 4. Story System Enhancement
- Port more story management from src/story/
- Scene sequencing
- Dialog flow
- Game state management

### Priority 2: Testing (20% time)
- Run `npm run build` after each file edit
- Test main menu periodically
- Keep replay system working
- Verify game remains playable

## Work Plan

### Step 1: Examine C Graphics System
- Review src/gfx/ structure
- Understand IFF/ILBM format
- Identify key functions to port

### Step 2: Port Image Loading
- Create IFF/ILBM parser
- Update ImageService to load real images
- Test with background images

### Step 3: Update Scenes with Real Graphics
- Load backgrounds in MainMenuScene
- Load backgrounds in StoryScene
- Load character portraits

### Step 4: Test and Verify
- Run main menu test
- Verify visual improvements
- Check replay system still works

## Commit Strategy
- One commit per file edit
- Clear messages
- Include: Co-authored-by: Ona <no-reply@ona.com>

## Next Session Handoff
- Document what was completed
- Note any blockers or issues
- Update progress-summary.md
