# Integration Architecture

## Overview

The project consists of two distinct parts:

1.  **DerClou Core**: The legacy C/SDL2 game engine.
2.  **Web Client**: A modern TypeScript/Phaser web project.

## Current Integration Status

**Status: Independent / No Integration**

At the current stage of development, there is **no active integration** between the Core and the Web Client.

### Analysis of Logic Coupling
*   **Core**: Contains the full game logic, database, and asset management in C. It includes a `build-web.sh` script that uses Emscripten to compile the game to WebAssembly/HTML, but the output (`build-emscripten/`) is not consumed by the Web Client project.
*   **Web Client**: Appears to be a freshly initialized **Phaser 3 TypeScript Template** (`template-vite-ts`). The specific game logic (`src-js/src/game/scenes/Game.ts`) contains only the default "Make something fun!" placeholder text and logo. It does not import any logic, assets, or data from the Core.

### Data Flow
*   No shared data flow exists.
*   The Core reads assets from `gamedata/`.
*   The Web Client loads assets from its own `public/` or `assets/` directory (standard Vite/Phaser structure).

## Future Integration Potential

Given the presence of `build-web.sh` (Emscripten) and the `src-js` project, two potential integration paths exist for the future:

1.  **WASM Port**: The Core could be compiled to WASM and wrapped by the Web Client (acting as a UI/Input layer).
2.  **Full Rewrite**: The Web Client could be intended as a complete rewrite of the logic in TypeScript, replacing the C Core entirely. (Currently, no rewrite logic exists).

## Recommendation

To proceed with integration, a decision must be made:
*   Configure `src-js` to load the WASM output from the Core build.
*   OR begin porting C logic (`gp.c`, `inphdl.c`, etc.) to TypeScript classes in `src-js`.
