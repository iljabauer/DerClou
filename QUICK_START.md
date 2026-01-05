# Quick Start Guide

## Setup (First Time)

```bash
cd src-js
npm install
```

## Build

```bash
cd src-js
npm run build
```

## Run

### Development Mode (Browser)
```bash
cd src-js
npm run dev
# Open browser to http://localhost:5173
```

### Desktop Mode (NW.js)
```bash
cd src-js
npm run build
npx nw .
```

### Replay Mode
```bash
cd src-js
npm run build
npx nw . --replay-path=../gamedata/test_long.rec --screenshot-path=./test
```

### Headless Replay
```bash
cd src-js
npm run build
npx nw . --replay-path=../gamedata/test_long.rec --screenshot-path=./test --headless
```

## Visual Regression Test

```bash
# From repository root
./tools/compare_screenshots.sh ./gamedata/test_long.rec ./test_screenshots 1000
```

## Project Structure

```
src-js/src/game/
├── core/           # Core systems (Database, GameState, SceneManager, etc.)
├── types/          # TypeScript types
├── services/       # Replay, Input, Random, Screenshot
├── scenes/         # Game scenes
└── utils/          # Helper functions
```

## Key Files

- `core/GameEngine.ts` - Main engine
- `core/Database.ts` - Object storage
- `core/GameState.ts` - Global state
- `scenes/TestGameScene.ts` - Example scene
- `types/GameTypes.ts` - Game object types

## Common Tasks

### Create a New Scene

```typescript
import { GameScene, SceneId, SceneArgs } from '../types';
import { sceneManager } from '../core';

const myScene: GameScene = {
    id: SceneId.MyScene,
    init: () => {
        console.log('Scene initialized');
    },
    update: (delta: number): SceneArgs => {
        return { returnValue: null };
    },
};

sceneManager.registerScene(myScene);
```

### Add Object to Database

```typescript
import { db } from '../core';
import { ObjectType, Person } from '../types';

const person: Person = {
    id: 0,
    name: 'John',
    type: ObjectType.Person,
    health: 100,
    // ... other fields
};

const id = db.addObject(person);
```

### Create Relation

```typescript
import { db } from '../core';
import { RelationType } from '../types';

db.addRelation(personId, toolId, RelationType.Has);
```

## Debugging

### TypeScript Errors
```bash
cd src-js
npx tsc --noEmit
```

### Console Logs
Open browser/NW.js DevTools (F12) to see console logs

### Performance
Target: 60 FPS (16.67ms per frame)

## Documentation

- `PORT_SUMMARY.md` - Overview of what was done
- `PORTING_STATUS.md` - Detailed status
- `TESTING_GUIDE.md` - Testing instructions
- `src-js/README_PORT.md` - Architecture guide

## Help

If something doesn't work:
1. Check console for errors
2. Verify Node.js version (v18+)
3. Try `rm -rf node_modules && npm install`
4. Check documentation files above

## What Works Now

✅ Replay system
✅ Scene management
✅ Database and relations
✅ Game state
✅ Basic rendering
✅ Screenshot capture

## What Doesn't Work Yet

❌ Game content (no data loaded)
❌ Graphics/sprites
❌ Dialogs
❌ Gameplay mechanics
❌ Story progression

See `PORTING_STATUS.md` for details.
