/*  _________  _______
   / ___/ __ \/ __/ _ \      Der Clou!
  / /__/ /_/ /\ \/ ___/ Open Source Project
  \___/\____/___/_/ http://cosp.sourceforge.net
   Based on the original by neo Software GmbH
*/
#include "replay/replay.h"

#include <stdio.h>
#include <string.h>

#include "base/base.h"
#include "inphdl/inphdl.h"
#include "random/random.h"

/* File Format Constants */
#define REPLAY_MAGIC "DREC"
#define REPLAY_VERSION 1

typedef struct
{
    char magic[4];
    uint32_t version;
    uint32_t rngSeed;
} ReplayHeader;

typedef struct
{
    uint64_t tick;
    int32_t action;
    uint32_t rngChecksum;
} ReplayRecord;

/* Global State */
ReplayState g_ReplayState = REPLAY_IDLE;
uint64_t g_SimulationTick = 0;

static FILE *g_ReplayFile = NULL;
static ReplayRecord g_NextRecord;
static int g_HasNextRecord = 0;

/* Read next record from file into g_NextRecord */
static int readNextRecord(void)
{
    if (!g_ReplayFile) return 0;
    if (fread(&g_NextRecord, sizeof(ReplayRecord), 1, g_ReplayFile) == 1)
    {
        return 1;
    }
    return 0;
}

void Replay_Init(const char *filename, uint32_t mode, uint32_t seed)
{
    char fullPath[256];
    ReplayHeader header;

    if (!filename || mode == REPLAY_IDLE) return;

    sprintf(fullPath, "%s.rec", filename);

    if (mode == REPLAY_RECORDING)
    {
        g_ReplayFile = fopen(fullPath, "wb");
        if (!g_ReplayFile)
        {
            Log("REPLAY: Failed to open %s for writing!", fullPath);
            return;
        }

        /* Write Header */
        memcpy(header.magic, REPLAY_MAGIC, 4);
        header.version = REPLAY_VERSION;
        header.rngSeed = seed;

        fwrite(&header, sizeof(ReplayHeader), 1, g_ReplayFile);

        /* Mark RNG for lazy reset - ensures seed is applied at first CalcRandomNr call */
        rndInitWithSeed(seed);

        Log("REPLAY: Recording started to %s (Seed: %u)", fullPath, seed);

        /* Disable mouse for deterministic input */
        inpTurnMouse(0);
    }
    else if (mode == REPLAY_PLAYING)
    {
        g_ReplayFile = fopen(fullPath, "rb");
        if (!g_ReplayFile)
        {
            Log("REPLAY: Failed to open %s for reading!", fullPath);
            return;
        }

        /* Read Header */
        if (fread(&header, sizeof(ReplayHeader), 1, g_ReplayFile) != 1)
        {
            Log("REPLAY: Failed to read header!");
            fclose(g_ReplayFile);
            g_ReplayFile = NULL;
            return;
        }

        if (memcmp(header.magic, REPLAY_MAGIC, 4) != 0)
        {
            Log("REPLAY: Invalid magic bytes!");
            fclose(g_ReplayFile);
            g_ReplayFile = NULL;
            return;
        }

        if (header.version != REPLAY_VERSION)
        {
            Log("REPLAY: Version mismatch (File: %d, Engine: %d)", header.version, REPLAY_VERSION);
            fclose(g_ReplayFile);
            g_ReplayFile = NULL;
            return;
        }

        /* Re-seed RNG with stored seed */
        rndInitWithSeed(header.rngSeed);

        Log("REPLAY: Playback started from %s (Seed: %u)", fullPath, header.rngSeed);

        /* Prime the first record */
        g_HasNextRecord = readNextRecord();

        /* Disable mouse */
        inpTurnMouse(0);
    }

    g_ReplayState = mode;
    g_SimulationTick = 0;
}

void Replay_Close(void)
{
    if (g_ReplayFile)
    {
        fclose(g_ReplayFile);
        g_ReplayFile = NULL;
    }
    g_ReplayState = REPLAY_IDLE;

    /* Re-enable mouse */
    inpTurnMouse(1);
    Log("REPLAY: Closed.");
}

void Replay_IncrementTick(void)
{
    g_SimulationTick++;
    if (g_ReplayState != REPLAY_IDLE && (g_SimulationTick % 600 == 0))
    {
        // Periodic drift check log
        // Log("REPLAY: Tick %llu", g_SimulationTick);
    }
}

void Replay_RecordInput(int32_t action, uint32_t rngChecksum)
{
    if (g_ReplayState != REPLAY_RECORDING || !g_ReplayFile) return;

    ReplayRecord rec;
    rec.tick = g_SimulationTick;
    rec.action = action;
    rec.rngChecksum = rngChecksum;

    fwrite(&rec, sizeof(ReplayRecord), 1, g_ReplayFile);
    // fflush(g_ReplayFile); // Maybe too slow to flush every input?
}

int Replay_GetInput(uint64_t currentTick, int32_t *outAction, uint32_t expectedChecksum)
{
    if (g_ReplayState != REPLAY_PLAYING || !g_ReplayFile) return 0;

    /* Debug Log every 60 ticks */
    if ((currentTick % 60) == 0)
    {
        if (g_HasNextRecord)
        {
            Log("REPLAY DEBUG: Tick %llu. Next Action at Tick %llu (Action: %d)", (unsigned long long)currentTick,
                (unsigned long long)g_NextRecord.tick, g_NextRecord.action);
        }
        else
        {
            Log("REPLAY DEBUG: Tick %llu. No next action (EOF?).", (unsigned long long)currentTick);
        }
    }

    /* Check if we have a next record and if it matches current tick */
    if (g_HasNextRecord && g_NextRecord.tick == currentTick)
    {
        Log("REPLAY DEBUG: MATCH at Tick %llu! Executing Action %d.", (unsigned long long)currentTick,
            g_NextRecord.action);

        *outAction = g_NextRecord.action;

        /* Drift Check */
        if (g_NextRecord.rngChecksum != expectedChecksum)
        {
            Log("REPLAY WARNING: RNG Drift at tick %llu! Recorded=0x%08X Expected=0x%08X",
                (unsigned long long)currentTick, g_NextRecord.rngChecksum, expectedChecksum);
        }

        /* Advance to next record */
        g_HasNextRecord = readNextRecord();
        return 1;
    }

    /* Input not due yet or EOF */
    return 0;
}
