# Requirements Document

## Introduction

This feature ports the replay playback mechanism from the C codebase to the TypeScript/Phaser project. The replay system reads binary replay files (`.rec` format) containing recorded input actions with tick timestamps, and plays them back by simulating the game ticks. This enables automated testing and comparison between the C and TypeScript implementations by replaying the same replay file and capturing screenshots at specific points.

The replay test scene provides a visual interface to load replay files, display the current action being executed, and control playback. It integrates with the existing Screenshot Service for capturing comparison screenshots.

The core of the replay system is the Input_Handler which manages the fixed timestep game loop (60 ticks per second), processes input events, and during replay playback retrieves recorded inputs at the correct simulation tick.

## Glossary

- **Replay_Service**: The component responsible for parsing replay files and providing input actions at the correct tick
- **Replay_Test_Scene**: A Phaser Scene that visualizes replay playback and displays current actions
- **Replay_File**: A binary file with `.rec` extension containing a header and sequence of input records
- **Replay_Header**: The first 12 bytes of a replay file containing magic bytes, version, and RNG seed
- **Replay_Record**: A 16-byte structure containing tick number, action bitmask, and RNG checksum
- **Simulation_Tick**: A deterministic counter incremented each game frame (60 ticks per second)
- **Action_Bitmask**: A 32-bit integer where each bit represents a specific input action (UP, DOWN, LEFT, etc.)
- **RNG_Checksum**: A checksum value used to detect drift between recorded and playback RNG states
- **Action_Display**: A text element showing the human-readable representation of the current action
- **Input_Handler**: The component that manages the fixed timestep game loop and input processing
- **Wait_Mask**: A bitmask specifying which input types the game is currently waiting for

## Requirements

### Requirement 1: Replay File Parsing

**User Story:** As a developer, I want to parse binary replay files, so that I can extract the header and input records for playback.

#### Acceptance Criteria

1. WHEN a replay file is loaded, THE Replay_Service SHALL read the 12-byte Replay_Header
2. WHEN parsing the Replay_Header, THE Replay_Service SHALL extract the 4-byte magic string "DREC"
3. WHEN parsing the Replay_Header, THE Replay_Service SHALL extract the 4-byte version number
4. WHEN parsing the Replay_Header, THE Replay_Service SHALL extract the 4-byte RNG seed
5. IF the magic bytes do not equal "DREC", THEN THE Replay_Service SHALL return an error indicating invalid file format
6. IF the version number does not equal 1, THEN THE Replay_Service SHALL return an error indicating version mismatch
7. WHEN parsing records, THE Replay_Service SHALL read each 16-byte Replay_Record containing tick (8 bytes), action (4 bytes), and RNG checksum (4 bytes)
8. THE Replay_Service SHALL parse all records until end of file

### Requirement 2: Replay Playback Control

**User Story:** As a developer, I want to control replay playback, so that I can start, stop, and monitor the replay progress.

#### Acceptance Criteria

1. WHEN initializing playback, THE Replay_Service SHALL seed the RNG with the seed from the Replay_Header
2. WHEN playback starts, THE Replay_Service SHALL set the Simulation_Tick to zero
3. WHEN playback is active, THE Replay_Service SHALL increment the Simulation_Tick each frame
4. WHEN the current Simulation_Tick matches a Replay_Record tick, THE Replay_Service SHALL return the action from that record
5. WHEN an action is returned, THE Replay_Service SHALL advance to the next Replay_Record
6. WHEN no more records remain, THE Replay_Service SHALL signal playback completion
7. THE Replay_Service SHALL provide the current Simulation_Tick for external queries

### Requirement 3: Action Bitmask Interpretation

**User Story:** As a developer, I want to interpret action bitmasks as human-readable strings, so that I can understand what input is being simulated.

#### Acceptance Criteria

1. THE Replay_Service SHALL interpret bit 0 as INP_UP
2. THE Replay_Service SHALL interpret bit 1 as INP_DOWN
3. THE Replay_Service SHALL interpret bit 2 as INP_LEFT
4. THE Replay_Service SHALL interpret bit 3 as INP_RIGHT
5. THE Replay_Service SHALL interpret bit 4 as INP_ESC
6. THE Replay_Service SHALL interpret bit 5 as INP_LBUTTONP (left button pressed)
7. THE Replay_Service SHALL interpret bit 6 as INP_LBUTTONR (left button released)
8. THE Replay_Service SHALL interpret bit 7 as INP_RBUTTONP (right button pressed)
9. THE Replay_Service SHALL interpret bit 8 as INP_RBUTTONR (right button released)
10. THE Replay_Service SHALL interpret bit 14 as INP_SPACE
11. WHEN converting an Action_Bitmask to string, THE Replay_Service SHALL concatenate all active action names
12. WHEN the Action_Bitmask is zero, THE Replay_Service SHALL return "NONE"

### Requirement 4: RNG Drift Detection

**User Story:** As a developer, I want to detect RNG drift during playback, so that I can identify desynchronization between the C and TypeScript implementations.

#### Acceptance Criteria

1. WHEN an action is executed, THE Replay_Service SHALL compare the recorded RNG_Checksum with the current RNG checksum
2. IF the checksums do not match, THEN THE Replay_Service SHALL log a warning with the tick number and both checksum values
3. THE Replay_Service SHALL continue playback even when drift is detected

### Requirement 5: Replay Test Scene UI

**User Story:** As a developer, I want a visual interface to monitor replay playback, so that I can observe the actions being executed.

#### Acceptance Criteria

1. THE Replay_Test_Scene SHALL extend Phaser.Scene and be registered with the game
2. WHEN the Replay_Test_Scene is created, THE Replay_Test_Scene SHALL display a text element showing the current Simulation_Tick
3. WHEN the Replay_Test_Scene is created, THE Replay_Test_Scene SHALL display an Action_Display text element
4. WHEN an action is executed during playback, THE Replay_Test_Scene SHALL update the Action_Display with the human-readable action string
5. WHEN no action is executed on a tick, THE Replay_Test_Scene SHALL display "NONE" in the Action_Display
6. THE Replay_Test_Scene SHALL display the total number of records in the replay file
7. THE Replay_Test_Scene SHALL display the current record index during playback

### Requirement 6: File Loading in NW.js

**User Story:** As a developer, I want to load replay files from the filesystem in nw.js, so that I can test with existing replay recordings.

#### Acceptance Criteria

1. WHEN running in NW.js environment, THE Replay_Service SHALL read replay files from the filesystem using Node.js fs module
2. THE Replay_Service SHALL accept a file path parameter for the replay file location
3. IF the file does not exist, THEN THE Replay_Service SHALL return an error indicating file not found
4. IF file reading fails, THEN THE Replay_Service SHALL return an error with the failure reason

### Requirement 7: Screenshot Integration

**User Story:** As a developer, I want to capture screenshots during replay playback, so that I can compare visual output between implementations.

#### Acceptance Criteria

1. THE Replay_Test_Scene SHALL provide a button to capture a screenshot at the current tick
2. WHEN the screenshot button is clicked, THE Replay_Test_Scene SHALL use the existing Screenshot_Service to capture and save the image
3. THE Replay_Test_Scene SHALL include the current Simulation_Tick in the screenshot filename or metadata

### Requirement 8: Input Handler Simulation

**User Story:** As a developer, I want to simulate the C input handler's wait-for-input behavior, so that replay playback matches the original game's timing and input processing.

#### Acceptance Criteria

1. THE Input_Handler SHALL maintain a fixed timestep of 60 ticks per second
2. WHEN waitFor is called with a Wait_Mask, THE Input_Handler SHALL block until an input matching the mask is received or timeout occurs
3. WHEN the Wait_Mask includes INP_TIME, THE Input_Handler SHALL return after the configured wait ticks have elapsed
4. WHEN replay playback is active, THE Input_Handler SHALL retrieve input from the Replay_Service instead of real input events
5. WHEN an input is retrieved during replay, THE Input_Handler SHALL verify it matches the Wait_Mask
6. IF the recorded input does not match the Wait_Mask, THEN THE Input_Handler SHALL log a warning about mask mismatch
7. THE Input_Handler SHALL increment the Simulation_Tick during each fixed timestep iteration
8. THE Input_Handler SHALL provide a method to set the wait ticks for timeout-based waiting

