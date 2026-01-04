# Implementation Plan: Screenshot Test Scene

## Overview

This plan implements a test scene with screenshot functionality for the existing Phaser game. The implementation adds a new scene and a screenshot service that handles environment-aware storage (nw.js filesystem vs browser console).

## Tasks

- [x] 1. Create ScreenshotService utility module
  - [x] 1.1 Create `src-js/src/game/services/ScreenshotService.ts` with environment detection
    - Implement `isNwjsEnvironment()` function to detect nw.js runtime
    - Implement `getScreenshotPathFromArgs()` to parse command-line arguments
    - _Requirements: 3.1, 3.2, 4.1_

  - [ ]* 1.2 Write property test for environment detection
    - **Property 1: Environment Detection Correctness**
    - **Validates: Requirements 3.1, 4.1**

  - [ ]* 1.3 Write property test for argument parsing
    - **Property 2: Command-Line Argument Parsing**
    - **Validates: Requirements 3.2**

  - [x] 1.4 Implement `saveScreenshot()` function
    - Handle nw.js environment: save to filesystem using path from args
    - Handle browser environment: log debug message with base64 preview
    - _Requirements: 3.3, 4.2, 4.3_

  - [ ]* 1.5 Write property test for base64 preview extraction
    - **Property 3: Base64 Preview Extraction**
    - **Validates: Requirements 4.3**

- [x] 2. Checkpoint - Ensure ScreenshotService tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create ScreenshotTestScene
  - [x] 3.1 Create `src-js/src/game/scenes/ScreenshotTestScene.ts`
    - Extend Phaser.Scene with constructor setting scene key
    - Implement `create()` method with blank background
    - _Requirements: 1.1, 1.2_

  - [x] 3.2 Add screenshot button to the scene
    - Create interactive text button with visual styling
    - Add pointer event handler for click
    - _Requirements: 1.3, 1.4_

  - [x] 3.3 Implement screenshot capture on button click
    - Use Phaser's `game.renderer.snapshot()` method to capture screenshot
    - Convert snapshot to base64 and call ScreenshotService.saveScreenshot()
    - _Requirements: 2.1, 2.2_

- [x] 4. Register scene with the game
  - [x] 4.1 Update `src-js/src/game/main.ts` to import and register ScreenshotTestScene
    - Add import for ScreenshotTestScene
    - Add scene to the scene array in game config
    - _Requirements: 1.1_

- [x] 5. Final checkpoint - Verify integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The implementation uses TypeScript following the existing project patterns
- Property tests should use fast-check library for property-based testing
- nw.js APIs are accessed via the global `nw` object when available

## Refinements

- [x] Change screenshot path logic
  - Treat `--screenshot-path` as a directory.
  - Save files as `screenshot_000X.png` (auto-incrementing) inside that directory.
- [x] Add Headless Mode Support
  - Detect `--headless` argument in NW.js.
  - Auto-capture screenshot and exit app if detected.

