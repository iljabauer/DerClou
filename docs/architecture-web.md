# Architecture: Web Client

## Executive Summary
The **Web Client** is a browser-based frontend implementation using **Phaser 3** and **TypeScript**. Currently, it serves as a fresh project foundation (based on `phaserjs/template-vite-ts`) and does not yet contain custom game logic or integration with the Core legacy engine.

## Technology Stack
*   **Language:** TypeScript (~5.7.2)
*   **Game Framework:** Phaser 3 (v3.90.0)
*   **Build Tool:** Vite (v6.3.1) - for fast HMR and bundling.
*   **Package Manager:** NPM

## Architecture Pattern
**Client-Side Game Loop (Phaser)**

The application runs entirely in the browser, relying on Phaser's internal game loop (`RequestAnimationFrame`).

### 1. Entry Point
*   **DOM Initialization:** `src/main.ts` listens for the `DOMContentLoaded` event.
*   **Game Boot:** It calls `StartGame('game-container')` which instantiates the `Phaser.Game` object.

### 2. Game Configuration (`src/game/main.ts`)
*   **Resolution:** 1024 x 768
*   **Scaling:** `Scale.FIT` (Automatically scales to fit the window while maintaining aspect ratio).
*   **Centering:** `Scale.CENTER_BOTH`.
*   **Rendering:** `AUTO` (WebGL with Canvas fallback).

### 3. Scene Management
*   Phaser uses a Scene-based architecture.
*   **Defined Scenes:**
    *   `Game`: The main (and currently only) scene, loading a background and logo.

## Development Workflow

### Local Development
The project uses **Vite** for a modern development experience.
```bash
npm install
npm run dev
```
Runs a local server at `http://localhost:5173/` (default).

### Production Build
```bash
npm run build
```
Generates optimized static assets in the `dist/` folder (default Vite output), ready for deployment to any static host (Netlify, Vercel, S3).
