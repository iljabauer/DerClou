# Project Overview: DerClou

## Executive Summary
**DerClou** is a brownfield project comprising a legacy **Core Game Engine** (C/SDL2) and a modern **Web Client** (TypeScript/Phaser). The project aims to maintain and port the classic game "Der Clou!" (The Clue!), ensuring it runs on modern platforms via SDL2 and potentially on the web via Emscripten or a frontend rewrite.

## Repository Structure
The project is a **Multi-part** repository:

| Part | Type | Components | Description |
|------|------|------------|-------------|
| **DerClou Core** | Game | `src/`, `CMakeLists.txt` | The original game logic, rewritten/maintained in C with SDL2. Contains all gameplay, database, and asset management. |
| **Web Client** | Web | `src-js/` | A new TypeScript/Phaser project served via Vite, intended as a web port or frontend. |

## Technology Stack Summary

| Feature | Core (Game) | Web Client |
|---------|-------------|------------|
| **Language** | C (C99/C11) | TypeScript |
| **Framework** | SDL2 | Phaser 3 |
| **Build System** | CMake + Conan | Vite |
| **Platform** | Desktop (Win/Mac/Linux), Web (WASM) | Web Browser |
| **Data** | Binary structs (`.dat`) | JSON (inferred/standard) |

## Documentation Index
*   [Source Tree Analysis](./source-tree-analysis.md)
*   [Integration Architecture](./integration-architecture.md)

### Part: DerClou Core
*   [Architecture](./architecture-core.md)
*   [Data Models](./data-models-core.md)
*   [Development Guide](./development-guide.md)

### Part: Web Client
*   [Architecture](./architecture-web.md)
*   [Component Inventory](./component-inventory-web.md)
