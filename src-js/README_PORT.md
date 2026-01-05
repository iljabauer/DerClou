# Der Clou! TypeScript Port

This directory contains the TypeScript/Phaser port of Der Clou! from the original C implementation.

## Project Structure

```
src-js/
├── src/
│   ├── game/
│   │   ├── core/           # Core game systems
│   │   │   ├── Database.ts      # Object storage and relations
│   │   │   ├── GameState.ts     # Global game state
│   │   │   ├── SceneManager.ts  # Scene lifecycle
│   │   │   ├── Renderer.ts      # UI rendering
│   │   │   └── GameEngine.ts    # Main engine
│   │   ├── types/          # TypeScript type definitions
│   │   │   ├── GameTypes.ts     # Game objects (Person, Car, etc.)
│   │   │   └── SceneTypes.ts    # Scene types
│   │   ├── services/       # Utility services
│   │   │   ├── ReplayService.ts
│   │   │   ├── InputHandler.ts
│   │   │   ├── Random.ts
│   │   │   └── ScreenshotService.ts
│   │   └── scenes/         # Game scenes
│   │       ├── TestGameScene.ts    # New integrated test scene
│   │       ├── ReplayTestScene.ts  # Original replay test
│   │       └── Game.ts             # Placeholder
│   └── main.ts
├── public/                 # Static assets
├── vite/                   # Build configuration
└── package.json
```

## Architecture

### Core Systems

#### Database (`core/Database.ts`)
Manages game objects and their relationships:
- Object storage by ID and type
- Relation management (has, knows, livesIn, etc.)
- Query system for finding related objects

#### Game State (`core/GameState.ts`)
Tracks global game state:
- Current scene
- Player ID
- Game time (day/hour/minute)
- Flags and variables
- Serialization for save/load

#### Scene Manager (`core/SceneManager.ts`)
Handles scene lifecycle:
- Scene registration
- Scene transitions
- Init/update/done callbacks
- Based on C's `PlayStory()` logic

#### Renderer (`core/Renderer.ts`)
Provides rendering utilities:
- Text rendering with styles
- Shape drawing (rectangles, outlines)
- Button/menu creation
- Image display

#### Game Engine (`core/GameEngine.ts`)
Integrates all systems:
- Initializes subsystems
- Manages game loop
- Handles replay playback
- Screenshot capture
- Tick-based simulation

### Replay System

The replay system is fully functional and matches the C implementation:

1. **Binary Format**: Reads `.rec` files with header and records
2. **Deterministic**: Uses fixed-seed RNG for reproducibility
3. **Verification**: Checksums verify RNG state at each tick
4. **Screenshots**: Captures screenshots at input events

### Type System

TypeScript types mirror the C structures:

```typescript
// C: struct Person
interface Person extends GameObject {
    pictId: number;
    job: number;
    health: number;
    // ... etc
}

// C: hasSet(person, tool)
db.addRelation(personId, toolId, RelationType.Has);
```

## Usage

### Normal Mode

```typescript
import { TestGameScene } from './game/scenes/TestGameScene';

// Scene will initialize in normal mode
// Shows interactive menu
```

### Replay Mode

```bash
npx nw . --replay-path=../gamedata/test.rec
```

The engine automatically detects replay mode and:
1. Loads the replay file
2. Seeds the RNG
3. Plays back inputs tick-by-tick
4. Captures screenshots
5. Exits when complete

### Creating New Scenes

```typescript
import { GameScene, SceneId, SceneArgs } from '../types/SceneTypes';

const myScene: GameScene = {
    id: SceneId.MyScene,
    
    init: () => {
        // Setup scene
        const renderer = engine.getRenderer();
        renderer.drawText(100, 100, 'Hello World');
    },
    
    update: (delta: number): SceneArgs => {
        // Update logic
        // Return next scene or null to stay
        return { returnValue: null };
    },
    
    done: () => {
        // Cleanup
    }
};

sceneManager.registerScene(myScene);
```

### Working with Database

```typescript
import { db } from '../core/Database';
import { ObjectType, Person, RelationType } from '../types/GameTypes';

// Create object
const person: Person = {
    id: 0,
    name: 'Matt',
    type: ObjectType.Person,
    health: 100,
    // ... other fields
};

const personId = db.addObject(person);

// Create relation
db.addRelation(personId, toolId, RelationType.Has);

// Query
const tools = db.getRelations(personId, RelationType.Has);
```

## Development Workflow

### 1. Add Types
Define TypeScript interfaces in `types/`:
```typescript
export interface MyGameObject extends GameObject {
    type: ObjectType.MyType;
    myField: number;
}
```

### 2. Implement Logic
Create core logic in `core/`:
```typescript
export class MySystem {
    // Implementation
}
```

### 3. Create Scene
Add scene in `scenes/`:
```typescript
export class MyScene extends Scene {
    // Phaser scene implementation
}
```

### 4. Test
```bash
npm run build
npx nw . --replay-path=../gamedata/test.rec
```

## Porting from C

When porting C code:

1. **Find the C file**: e.g., `src/data/database.c`
2. **Understand the logic**: Read the C implementation
3. **Create TypeScript types**: Define interfaces for structs
4. **Port the logic**: Translate C to TypeScript
5. **Test**: Verify with replay system

### Example: Porting a C Function

C code:
```c
void hasSet(ulong leftId, ulong rightId) {
    SetP(dbGetObject(leftId), 4, dbGetObject(rightId), NO_PARAMETER);
}
```

TypeScript:
```typescript
db.addRelation(leftId, rightId, RelationType.Has, 0);
```

## Testing

See [TESTING_GUIDE.md](../../TESTING_GUIDE.md) for detailed testing instructions.

Quick test:
```bash
npm run build
npx nw . --replay-path=../gamedata/test_long.rec --headless
```

## Current Status

See [PORTING_STATUS.md](../../PORTING_STATUS.md) for detailed status.

**Summary:**
- ✅ Core architecture complete
- ✅ Replay system working
- ✅ Database and state management
- ✅ Scene management
- ❌ Game content not ported yet
- ❌ Graphics/sprites not loaded
- ❌ Dialogs not implemented
- ❌ Gameplay mechanics not ported

## Next Steps

1. **Data Loading**: Parse binary .dat files
2. **Text System**: Load and display text
3. **Graphics**: Load and display images
4. **Dialogs**: Implement conversation system
5. **Gameplay**: Port planning and burglary mechanics

## Contributing

When adding new features:
1. Follow the existing architecture
2. Maintain replay compatibility
3. Add TypeScript types
4. Test with replay files
5. Update documentation

## References

- Original C code: `../../src/`
- Documentation: `../../docs/`
- Replay format: See `services/ReplayService.ts`
- C architecture: `../../docs/architecture-core.md`
