# Project Documentation Index

## Project Overview

### Project: DerClou
*   **Type:** Multi-part with 2 parts
*   **Primary Languages:** C, TypeScript
*   **Architecture:** Procedural Game Loop (Core) / Client-side SPA (Web)

### Quick Reference

#### Part 1: DerClou Core (core)
*   **Type:** game
*   **Tech Stack:** C, SDL2, CMake
*   **Root:** `/Users/ibauer/_ITS/DerClou`
*   **Entry Point:** `src/base/base.c` (`tcStartGame`)

#### Part 2: Web Client (web)
*   **Type:** web
*   **Tech Stack:** TypeScript, Phaser 3, Vite
*   **Root:** `/Users/ibauer/_ITS/DerClou/src-js`
*   **Entry Point:** `src/main.ts`

## Generated Documentation

### General
*   [Project Overview](./project-overview.md)
*   [Source Tree Analysis](./source-tree-analysis.md)
*   [Integration Architecture](./integration-architecture.md)
*   [Development Guide](./development-guide.md)
*   [Deployment Guide](./deployment-guide.md)

### Part: DerClou Core
*   [Architecture - Core](./architecture-core.md)
*   [Data Models - Core](./data-models-core.md)

### Part: Web Client
*   [Architecture - Web](./architecture-web.md)
*   [Component Inventory - Web](./component-inventory-web.md)

## Existing Documentation
*   [README.md](../README.md) - Main project readme
*   [Web README](../src-js/README.md) - Web client readme
*   [License](../PublicLicenceContract.txt) - License file

## Getting Started

To build the core game:
```bash
./build-pc.sh
cd gamedata && ./DerClou
```

To run the web client:
```bash
cd src-js
npm install && npm run dev
```

See [Development Guide](./development-guide.md) for details.
