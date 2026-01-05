# Implementation Plan: Replay Test Scene

## Overview

This implementation plan ports the replay playback mechanism from C to TypeScript/Phaser. The approach is incremental: first implement the core data parsing, then the playback logic, then the test scene UI, and finally integrate with screenshots.

## Tasks

- [x] 1. Set up project structure and constants
  - Create `src-js/src/game/services/ReplayService.ts`
  - Create `src-js/src/game/services/InputHandler.ts`
  - Define input action constants matching C implementation (INP_UP, INP_DOWN, etc.)
  - Define replay file format constants (REPLAY_MAGIC, REPLAY_VERSION, sizes)
  - _Requirements: 3.1-3.10_

- [x] 2. Implement ReplayService binary parsing
  - [x] 2.1 Implement header parsing
    - Parse 12-byte header: magic (4 bytes), version (4 bytes), seed (4 bytes)
    - Validate magic bytes equal "DREC"
    - Validate version equals 1
    - Return error for invalid magic or version
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 2.2 Implement record parsing
    - Parse 16-byte records: tick (8 bytes uint64), action (4 bytes int32), checksum (4 bytes uint32)
    - Handle little-endian byte order
    - Parse all records until end of file
    - _Requirements: 1.7, 1.8_

  - [ ]* 2.3 Write property test for replay file round-trip
    - **Property 1: Replay File Round-Trip**
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.7, 1.8**

  - [ ]* 2.4 Write property tests for invalid file rejection
    - **Property 2: Invalid Magic Rejection**
    - **Property 3: Invalid Version Rejection**
    - **Validates: Requirements 1.5, 1.6**

- [x] 3. Implement action bitmask conversion
  - [x] 3.1 Implement actionToString function
    - Convert action bitmask to human-readable string
    - Handle all defined input flags
    - Return "NONE" for zero action
    - _Requirements: 3.1-3.12_

  - [ ]* 3.2 Write property test for action string conversion
    - **Property 5: Action Bitmask to String Conversion**
    - **Validates: Requirements 3.1-3.12**

- [x] 4. Implement playback logic
  - [x] 4.1 Implement initPlayback method
    - Store header and records
    - Reset current index to 0
    - Seed RNG with header seed
    - _Requirements: 2.1, 2.2_

  - [x] 4.2 Implement getInput method
    - Check if current record tick matches query tick
    - Return action and advance index if match
    - Compare RNG checksums and log drift warning
    - Return null if no match
    - _Requirements: 2.4, 2.5, 4.1, 4.2, 4.3_

  - [x] 4.3 Implement completion detection
    - Track current record index
    - Return true from isComplete when all records processed
    - _Requirements: 2.6, 2.7_

  - [ ]* 4.4 Write property test for playback progression
    - **Property 4: Playback Tick Progression**
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.6**

  - [ ]* 4.5 Write property test for RNG drift detection
    - **Property 6: RNG Drift Detection Continuity**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement InputHandler
  - [x] 6.1 Implement tick management
    - Initialize simulation tick to 0
    - Implement incrementTick method
    - Implement getSimulationTick method
    - _Requirements: 8.1, 8.7_

  - [x] 6.2 Implement simulateTick method
    - Query ReplayService for input at current tick
    - Increment tick after query
    - Return action or null
    - _Requirements: 8.4, 8.5_

  - [x] 6.3 Implement wait ticks configuration
    - Store wait ticks value
    - Provide setWaitTicks method
    - _Requirements: 8.3, 8.8_

- [x] 7. Implement file loading
  - [x] 7.1 Implement NW.js file reading
    - Use nw.require('fs') to read binary files
    - Accept file path parameter
    - Handle file not found error
    - Handle read failure error
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 7.2 Add command-line argument support
    - Read replay path from --replay-path argument
    - Fall back to default path if not specified
    - _Requirements: 6.2_

- [x] 8. Implement ReplayTestScene
  - [x] 8.1 Create scene structure
    - Extend Phaser.Scene
    - Register with game configuration
    - Initialize services in create()
    - _Requirements: 5.1_

  - [x] 8.2 Implement UI elements
    - Add tick counter text display
    - Add action display text
    - Add record progress text (X of Y)
    - _Requirements: 5.2, 5.3, 5.6, 5.7_

  - [x] 8.3 Implement playback loop
    - Call simulateTick in update()
    - Update display with current action
    - Handle playback completion
    - _Requirements: 5.4, 5.5_

  - [x] 8.4 Add play/pause controls
    - Add start/pause button
    - Toggle isPlaying state
    - _Requirements: 5.1_

- [x] 9. Integrate screenshot functionality
  - [x] 9.1 Add screenshot button
    - Create screenshot capture button
    - Use existing ScreenshotService
    - _Requirements: 7.1, 7.2_

  - [x] 9.2 Include tick in screenshot metadata
    - Pass current tick to screenshot filename
    - _Requirements: 7.3_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify replay playback works with existing .rec files
  - Compare output with C implementation

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses fast-check for property-based testing
