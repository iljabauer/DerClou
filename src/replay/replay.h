/*  _________  _______
   / ___/ __ \/ __/ _ \      Der Clou!
  / /__/ /_/ /\ \/ ___/ Open Source Project
  \___/\____/___/_/ http://cosp.sourceforge.net
   Based on the original by neo Software GmbH
*/
#ifndef MODULE_REPLAY
#define MODULE_REPLAY

#include "theclou.h"

/* Replay states */
typedef enum
{
    REPLAY_IDLE = 0,
    REPLAY_RECORDING,
    REPLAY_PLAYING
} ReplayState;

extern ReplayState g_ReplayState;
extern uint64_t g_SimulationTick; /* Global deterministic tick counter */

/* Initialize replay subsystem. Disables mouse input via inpTurnMouse(0). */  // Initialisation
void Replay_Init(const char *filename, uint32_t mode, uint32_t seed);

/* Cleanup. Re-enables mouse input. */
void Replay_Close(void);

/* Called every simulation tick */
void Replay_IncrementTick(void);

/* Record an input event at current tick (keyboard only, mouse disabled) */
void Replay_RecordInput(int32_t action, uint32_t rngChecksum);

/* Playback: Get next input if due at current tick. Returns 0 if no input this tick. */
int Replay_GetInput(uint64_t currentTick, int32_t *outAction, uint32_t expectedChecksum);

void Replay_SetScreenshotDir(const char *path);
void Replay_CaptureScreenshot(void);

#endif
